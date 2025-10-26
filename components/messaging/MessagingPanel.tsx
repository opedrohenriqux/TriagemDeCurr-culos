import React, { useState, useMemo, useEffect, useRef } from 'react';
import { Message, User, Candidate, Job, CandidateStatus } from '../../types';
import InitialsAvatar from '../common/InitialsAvatar';
import { getSuggestedReplies } from '../../services/geminiService';
import Pagination from '../common/Pagination';

// Modal para iniciar nova conversa
interface NewConversationModalProps {
    type: 'candidates' | 'team';
    candidates: Candidate[];
    users: User[];
    currentUser: { id: string };
    conversations: { partnerId: string }[];
    onClose: () => void;
    onSelect: (partnerId: string) => void;
}

const NewConversationModal: React.FC<NewConversationModalProps> = ({ type, candidates, users, currentUser, conversations, onClose, onSelect }) => {
    const [searchTerm, setSearchTerm] = useState('');
    const listData = useMemo(() => {
        const existingPartnerIds = new Set(conversations.map(c => c.partnerId));
        if (type === 'candidates') {
            return candidates
                .filter(c => ['screening', 'approved', 'offer', 'waitlist', 'hired'].includes(c.status))
                .filter(c => !existingPartnerIds.has(`candidate-${c.id}`))
                .sort((a, b) => a.name.localeCompare(b.name))
                .map(c => ({ id: `candidate-${c.id}`, name: c.name }));
        } else {
            const currentUserId = currentUser.id.split('-')[1];
            return users
                .filter(u => u.id !== currentUserId)
                .filter(u => !existingPartnerIds.has(`user-${u.id}`))
                .sort((a, b) => (a.username || '').localeCompare(b.username || ''))
                .map(u => ({ id: `user-${u.id}`, name: (u.username || 'Usuário').split(' ')[0] }));
        }
    }, [type, candidates, users, currentUser, conversations]);

    const filteredList = useMemo(() => {
        if (!searchTerm) return listData;
        return listData.filter(item => item.name && item.name.toLowerCase().includes(searchTerm.toLowerCase()));
    }, [listData, searchTerm]);

    return (
        <div className="absolute inset-0 bg-light-surface dark:bg-surface z-20 flex flex-col">
            <div className="p-4 border-b border-light-border dark:border-border flex items-center">
                <button onClick={onClose} className="p-2 mr-2 rounded-full hover:bg-light-background dark:hover:bg-background">&larr;</button>
                <h3 className="font-bold text-lg">Iniciar Nova Conversa</h3>
            </div>
            <div className="p-4">
                <input
                    type="text"
                    placeholder={`Buscar ${type === 'candidates' ? 'candidato' : 'membro da equipe'}...`}
                    value={searchTerm}
                    onChange={(e) => setSearchTerm(e.target.value)}
                    className="w-full px-3 py-2 bg-light-background dark:bg-background border border-light-border dark:border-border rounded-md focus:ring-2 focus:ring-light-primary dark:focus:ring-primary focus:outline-none"
                />
            </div>
            <div className="flex-1 overflow-y-auto">
                {filteredList.map(item => (
                    <div key={item.id} onClick={() => onSelect(item.id)} className="flex items-center gap-3 p-4 cursor-pointer hover:bg-light-background/50 dark:hover:bg-background/50">
                        <div className="w-10 h-10 flex-shrink-0"><InitialsAvatar name={item.name || '?'} /></div>
                        <p className="font-semibold">{item.name}</p>
                    </div>
                ))}
            </div>
        </div>
    );
};

// Props do componente principal
interface MessagingPanelProps {
    currentUser: { id: string; name: string; type: 'user' | 'candidate' };
    messages: Message[];
    users: User[];
    candidates: Candidate[];
    jobs: Job[];
    archivedConversations: Set<string>;
    onClose: () => void;
    onSendMessage: (receiverId: string, text: string) => void;
    onUpdateMessage: (messageId: number, newText: string, isDeleted?: boolean) => void;
    onMarkAsRead: (otherUserId: string) => void;
    onDeleteConversation: (partnerId: string) => void;
    onArchiveConversation: (partnerId: string) => void;
    onUnarchiveConversation: (partnerId: string) => void;
    preselectedId: string | null;
}

// Definição do tipo para um objeto de conversa estável
type StableConversation = {
    partnerId: string;
    partnerName: string;
    partnerAvatar?: string;
    partnerCandidate?: Candidate;
    lastMessage: Message | null;
    unreadCount: number;
    isLoading: boolean;
};

const MessagingPanel: React.FC<MessagingPanelProps> = (props) => {
    const { currentUser, messages, users, candidates, jobs, archivedConversations, onClose, onSendMessage, onUpdateMessage, onMarkAsRead, onDeleteConversation, onArchiveConversation, onUnarchiveConversation, preselectedId } = props;

    // Estado da UI
    const [selectedConversationId, setSelectedConversationId] = useState<string | null>(null);
    const [newMessage, setNewMessage] = useState('');
    const [isNewConvoModalOpen, setIsNewConvoModalOpen] = useState(false);
    const [activeTab, setActiveTab] = useState<'candidates' | 'team'>('candidates');
    const [viewArchived, setViewArchived] = useState(false);
    const [contextMenu, setContextMenu] = useState<{ x: number, y: number, message: Message } | null>(null);
    const [editingMessage, setEditingMessage] = useState<Message | null>(null);
    const [editText, setEditText] = useState('');
    const [deletedForMe, setDeletedForMe] = useState<Set<number>>(new Set());

    // Estado dos Filtros
    const [searchTerm, setSearchTerm] = useState('');
    const [jobFilter, setJobFilter] = useState('all');
    const [statusFilter, setStatusFilter] = useState('all');
    const [sortOrder, setSortOrder] = useState<'desc' | 'asc'>('desc');

    // Estado da IA
    const [suggestedReplies, setSuggestedReplies] = useState<string[]>([]);
    const [isGeneratingReplies, setIsGeneratingReplies] = useState(false);

    // Refs
    const messagesEndRef = useRef<HTMLDivElement | null>(null);
    const contextMenuRef = useRef<HTMLDivElement>(null);

    // Paginação
    const [currentPage, setCurrentPage] = useState(1);
    const CONVERSATIONS_PER_PAGE = 10;

    const statusTranslationMap: Record<CandidateStatus, string> = { applied: 'Inscrito', screening: 'Triagem', approved: 'Aprovado', offer: 'Oferta', waitlist: 'Lista de Espera', hired: 'Contratado', rejected: 'Rejeitado', pending: 'Pendente' };
    const candidateStatuses: CandidateStatus[] = ['applied', 'screening', 'approved', 'offer', 'waitlist', 'hired', 'rejected'];

    // Lógica Estável
    const partnerMap = useMemo(() => {
        const map = new Map<string, { name: string; avatar?: string; candidate?: Candidate }>();
        users.forEach(u => map.set(`user-${u.id}`, { name: (u.username || 'Usuário').split(' ')[0], candidate: undefined }));
        candidates.forEach(c => map.set(`candidate-${c.id}`, { name: c.name, avatar: c.avatarUrl, candidate: c }));
        return map;
    }, [users, candidates]);

    const allConversations = useMemo<StableConversation[]>(() => {
        const convos: { [partnerId: string]: StableConversation } = {};
        for (const msg of messages) {
            const partnerId = msg.senderId === currentUser.id ? msg.receiverId : msg.senderId;
            if (!convos[partnerId]) {
                const partnerInfo = partnerMap.get(partnerId);
                convos[partnerId] = {
                    partnerId: partnerId,
                    partnerName: partnerInfo?.name || 'Carregando...',
                    partnerAvatar: partnerInfo?.avatar,
                    partnerCandidate: partnerInfo?.candidate,
                    lastMessage: null,
                    unreadCount: 0,
                    isLoading: !partnerInfo,
                };
            }
        }
        const convoList = Object.values(convos);
        for (const convo of convoList) {
            const partnerMessages = messages.filter(m => (m.senderId === convo.partnerId && m.receiverId === currentUser.id) || (m.receiverId === convo.partnerId && m.senderId === currentUser.id));
            if (partnerMessages.length > 0) {
                partnerMessages.sort((a, b) => new Date(b.timestamp).getTime() - new Date(a.timestamp).getTime());
                convo.lastMessage = partnerMessages[0];
                convo.unreadCount = partnerMessages.filter(m => m.receiverId === currentUser.id && !m.isRead).length;
            }
        }
        return convoList;
    }, [messages, currentUser.id, partnerMap]);

    const displayedConversations = useMemo(() => {
        const filteredList = allConversations.filter(convo => {
            const isArchived = archivedConversations.has(convo.partnerId);
            if (viewArchived !== isArchived) return false;
            const isCandidate = convo.partnerId.startsWith('candidate-');
            if ((activeTab === 'candidates' && !isCandidate) || (activeTab === 'team' && isCandidate)) return false;
            if (searchTerm && !convo.partnerName.toLowerCase().includes(searchTerm.toLowerCase())) return false;
            if (activeTab === 'candidates' && !convo.isLoading) {
                if (!convo.partnerCandidate) return false;
                if (jobFilter !== 'all' && convo.partnerCandidate.jobId !== jobFilter) return false;
                if (statusFilter !== 'all' && convo.partnerCandidate.status !== statusFilter) return false;
            }
            return true;
        });
        return filteredList.sort((a, b) => {
            const timeA = a.lastMessage ? new Date(a.lastMessage.timestamp).getTime() : 0;
            const timeB = b.lastMessage ? new Date(b.lastMessage.timestamp).getTime() : 0;
            return sortOrder === 'desc' ? timeB - timeA : timeA - timeB;
        });
    }, [allConversations, archivedConversations, viewArchived, activeTab, searchTerm, jobFilter, statusFilter, sortOrder]);

    const totalPages = Math.ceil(displayedConversations.length / CONVERSATIONS_PER_PAGE);
    const paginatedConversations = useMemo(() => displayedConversations.slice((currentPage - 1) * CONVERSATIONS_PER_PAGE, currentPage * CONVERSATIONS_PER_PAGE), [displayedConversations, currentPage]);

    const activeConversationMessages = useMemo(() => {
        if (!selectedConversationId) return [];
        return messages.filter(msg => ((msg.senderId === currentUser.id && msg.receiverId === selectedConversationId) || (msg.senderId === selectedConversationId && msg.receiverId === currentUser.id)) && !deletedForMe.has(msg.id)).sort((a, b) => new Date(a.timestamp).getTime() - new Date(b.timestamp).getTime());
    }, [messages, currentUser.id, selectedConversationId, deletedForMe]);
    
    const partnerName = selectedConversationId ? partnerMap.get(selectedConversationId)?.name : '';
    const isRecruiterView = currentUser.type === 'user';

    // Efeitos e Handlers
    useEffect(() => {
        if (preselectedId) {
            setSelectedConversationId(preselectedId);
            onMarkAsRead(preselectedId);
            setActiveTab(preselectedId.startsWith('user-') ? 'team' : 'candidates');
        } else if (currentUser.type === 'candidate' && allConversations.length > 0) {
            const partnerId = allConversations[0].partnerId;
            setSelectedConversationId(partnerId);
            onMarkAsRead(partnerId);
        }
    }, [preselectedId, currentUser.type, allConversations, onMarkAsRead]);
    
    useEffect(() => {
        const handleClickOutside = (event: MouseEvent) => { if (contextMenuRef.current && !contextMenuRef.current.contains(event.target as Node)) setContextMenu(null); };
        document.addEventListener('mousedown', handleClickOutside);
        return () => document.removeEventListener('mousedown', handleClickOutside);
    }, []);
    useEffect(() => { setCurrentPage(1); }, [activeTab, viewArchived, searchTerm, jobFilter, statusFilter, sortOrder]);
    useEffect(() => { messagesEndRef.current?.scrollIntoView({ behavior: 'smooth' }); }, [activeConversationMessages]);

    const handleSelectConversation = (partnerId: string) => { setSelectedConversationId(partnerId); onMarkAsRead(partnerId); setSuggestedReplies([]); setEditingMessage(null); };
    const handleSendMessage = () => { if (newMessage.trim() && selectedConversationId) { onSendMessage(selectedConversationId, newMessage); setNewMessage(''); setSuggestedReplies([]); } };
    const handleGenerateReplies = async () => { /* ... (lógica inalterada) ... */ };
    const handleAction = (e: React.MouseEvent, action: 'archive' | 'unarchive' | 'delete', partnerId: string) => { /* ... (lógica inalterada) ... */ };
    const handleContextMenu = (e: React.MouseEvent, message: Message) => { /* ... (lógica inalterada) ... */ };
    const handleEditClick = () => { /* ... (lógica inalterada) ... */ };
    const handleSaveEdit = () => { /* ... (lógica inalterada) ... */ };
    const handleDeleteForEveryoneClick = () => { /* ... (lógica inalterada) ... */ };
    const handleDeleteForMeClick = () => { /* ... (lógica inalterada) ... */ };

    // UI
    return (
        <>
            <div className="fixed inset-0 bg-black/50 z-50 flex justify-center items-center p-4 animate-fade-in" onClick={onClose}>
                <div className="flex h-full max-h-[80vh] w-full max-w-5xl bg-light-surface dark:bg-surface rounded-xl shadow-2xl border border-light-border dark:border-border overflow-hidden relative" onClick={e => e.stopPropagation()}>
                    {/* Coluna da Lista de Conversas (Esquerda) */}
                    {isRecruiterView && (
                        <div className={`w-full md:w-2/5 lg:w-1/3 border-r border-light-border dark:border-border flex-col ${selectedConversationId ? 'hidden md:flex' : 'flex'}`}>
                            <div className="p-4 border-b border-light-border dark:border-border flex justify-between items-center">
                                <h2 className="font-bold text-lg">Mensagens</h2>
                                <button onClick={() => setIsNewConvoModalOpen(true)} className="p-1 rounded-full text-light-text-secondary dark:text-text-secondary hover:bg-light-background dark:hover:bg-background" title="Nova Conversa">
                                   <svg xmlns="http://www.w3.org/2000/svg" width="20" height="20" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round"><path d="M11 4H4a2 2 0 0 0-2 2v14a2 2 0 0 0 2 2h14a2 2 0 0 0 2-2v-7"/><path d="M18.5 2.5a2.121 2.121 0 0 1 3 3L12 15l-4 1 1-4 9.5-9.5z"/></svg>
                                </button>
                            </div>
                            <div className="flex border-b border-light-border dark:border-border">
                                <button onClick={() => setActiveTab('candidates')} className={`flex-1 p-3 text-sm font-semibold border-b-2 ${activeTab === 'candidates' ? 'border-light-primary dark:border-primary text-light-primary dark:text-primary' : 'border-transparent text-light-text-secondary dark:text-text-secondary'}`}>Candidatos</button>
                                <button onClick={() => setActiveTab('team')} className={`flex-1 p-3 text-sm font-semibold border-b-2 ${activeTab === 'team' ? 'border-light-primary dark:border-primary text-light-primary dark:text-primary' : 'border-transparent text-light-text-secondary dark:text-text-secondary'}`}>Equipe</button>
                            </div>
                             {activeTab === 'candidates' && (
                                <div className="p-3 border-b border-light-border dark:border-border space-y-2 text-sm">
                                    <input type="text" placeholder="Buscar por nome..." value={searchTerm} onChange={e => setSearchTerm(e.target.value)} className="w-full px-3 py-2 bg-light-background dark:bg-background border border-light-border dark:border-border rounded-md focus:outline-none focus:ring-2 focus:ring-light-primary dark:focus:ring-primary"/>
                                    <div className="grid grid-cols-2 gap-2">
                                        <select value={jobFilter} onChange={e => setJobFilter(e.target.value)} className="w-full px-2 py-2 bg-light-background dark:bg-background border border-light-border dark:border-border rounded-md focus:outline-none focus:ring-2 focus:ring-light-primary dark:focus:ring-primary"><option value="all">Todas Vagas</option>{jobs.map(j => <option key={j.id} value={j.id}>{j.title}</option>)}</select>
                                        <select value={statusFilter} onChange={e => setStatusFilter(e.target.value)} className="w-full px-2 py-2 bg-light-background dark:bg-background border border-light-border dark:border-border rounded-md focus:outline-none focus:ring-2 focus:ring-light-primary dark:focus:ring-primary">
                                            <option value="all">Todos Status</option>
                                            {candidateStatuses.map(s => <option key={s} value={s}>{statusTranslationMap[s]}</option>)}
                                        </select>
                                    </div>
                                    <div className="flex justify-end items-center text-xs"><button onClick={() => setSortOrder(prev => prev === 'desc' ? 'asc' : 'desc')} className="font-semibold text-light-secondary dark:text-secondary hover:underline">Ordenar por: {sortOrder === 'desc' ? 'Recente' : 'Antigo'}</button></div>
                                </div>
                            )}
                            <div className="flex-1 overflow-y-auto">
                                {paginatedConversations.map(convo => (
                                    <div key={convo.partnerId} onClick={() => handleSelectConversation(convo.partnerId)} className={`flex items-start gap-3 p-3 cursor-pointer border-l-4 group ${selectedConversationId === convo.partnerId ? 'bg-light-background dark:bg-background border-light-primary dark:border-primary' : 'hover:bg-light-background/50 dark:hover:bg-background/50 border-transparent'}`}>
                                        <div className="w-12 h-12 flex-shrink-0"><InitialsAvatar name={convo.partnerName} /></div>
                                        <div className="flex-1 min-w-0">
                                            <div className="flex justify-between items-center"><p className="font-semibold truncate">{convo.partnerName}</p>{convo.unreadCount > 0 && <span className="bg-light-primary dark:bg-primary text-white text-xs font-bold rounded-full h-5 w-5 flex items-center justify-center">{convo.unreadCount}</span>}</div>
                                            <p className="text-sm text-light-text-secondary dark:text-text-secondary truncate">{convo.lastMessage?.text || '...'}</p>
                                        </div>
                                        {/* ... botões de ação ... */}
                                    </div>
                                ))}
                                {displayedConversations.length === 0 && <p className="p-4 text-center text-sm text-light-text-secondary dark:text-text-secondary">Nenhuma conversa encontrada.</p>}
                            </div>
                             {totalPages > 1 && <div className="p-2 border-t border-light-border dark:border-border"><Pagination currentPage={currentPage} totalPages={totalPages} onPageChange={setCurrentPage}/></div>}
                            <div className="p-2 border-t border-light-border dark:border-border text-center">
                                <button onClick={() => setViewArchived(!viewArchived)} className="text-sm font-semibold text-light-secondary dark:text-secondary hover:underline">{viewArchived ? 'Voltar para Ativas' : 'Ver Arquivadas'}</button>
                            </div>
                        </div>
                    )}
                    {/* Painel de Conversa Ativa (Direita) */}
                    <div className={`flex-1 flex-col ${!selectedConversationId && isRecruiterView ? 'hidden md:flex' : 'flex'}`}>
                        {selectedConversationId ? (
                            <>
                                <div className="flex items-center gap-3 p-3 border-b border-light-border dark:border-border">
                                    {isRecruiterView && <button onClick={() => setSelectedConversationId(null)} className="md:hidden p-2 rounded-full hover:bg-light-background dark:hover:bg-background">&larr;</button>}
                                    <div className="w-10 h-10"><InitialsAvatar name={partnerName || '?'} /></div>
                                    <h3 className="font-bold">{partnerName}</h3>
                                    <button onClick={onClose} className="ml-auto p-2 rounded-full text-2xl leading-none">&times;</button>
                                </div>
                                <div className="flex-1 p-4 space-y-4 overflow-y-auto bg-light-background/50 dark:bg-background/50">
                                    {activeConversationMessages.map(msg => (
                                         <div key={msg.id} className={`flex items-end gap-2 ${msg.senderId === currentUser.id ? 'justify-end' : ''}`}>
                                            {msg.senderId !== currentUser.id && <div className="w-8 h-8 flex-shrink-0"><InitialsAvatar name={partnerMap.get(msg.senderId)?.name || '?'} /></div>}
                                            <div onContextMenu={(e) => handleContextMenu(e, msg)} className={`max-w-md p-3 rounded-2xl text-sm ${msg.senderId === currentUser.id ? 'bg-light-primary dark:bg-primary text-white rounded-br-none' : 'bg-light-surface dark:bg-surface rounded-bl-none border border-light-border dark:border-border'}`}>
                                                {/* ... lógica de edição de mensagem ... */}
                                                {msg.isDeleted ? <p className="italic text-light-text-secondary/80 dark:text-text-secondary/80">Mensagem apagada</p> : <p>{msg.text}</p>}
                                                <p className={`text-xs mt-1 ${msg.senderId === currentUser.id ? 'text-white/70' : 'text-light-text-secondary/70 dark:text-text-secondary/70'}`}>{new Date(msg.timestamp).toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' })}</p>
                                            </div>
                                        </div>
                                    ))}
                                    <div ref={messagesEndRef} />
                                </div>
                                <div className="p-4 border-t border-light-border dark:border-border">
                                    {/* ... área de input de mensagem ... */}
                                     <div className="flex items-center gap-2 bg-light-background dark:bg-background rounded-lg border border-light-border dark:border-border focus-within:ring-2 focus-within:ring-light-primary dark:focus-within:ring-primary">
                                        <input value={newMessage} onChange={(e) => setNewMessage(e.target.value)} onKeyPress={(e) => e.key === 'Enter' && handleSendMessage()} type="text" placeholder="Digite sua mensagem..." className="w-full bg-transparent p-3 border-none focus:ring-0" />
                                        <button onClick={handleSendMessage} className="p-2 m-1 rounded-full bg-light-primary dark:bg-primary text-white"><svg xmlns="http://www.w3.org/2000/svg" width="20" height="20" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2.5" strokeLinecap="round" strokeLinejoin="round"><line x1="22" y1="2" x2="11" y2="13"/><polygon points="22 2 15 22 11 13 2 9 22 2"/></svg></button>
                                    </div>
                                </div>
                            </>
                        ) : (
                            <div className="flex flex-col items-center justify-center h-full text-center p-4">
                                <svg xmlns="http://www.w3.org/2000/svg" width="48" height="48" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="1.5" strokeLinecap="round" strokeLinejoin="round" className="text-light-text-secondary dark:text-text-secondary mb-4"><path d="M21 15a2 2 0 0 1-2 2H7l-4 4V5a2 2 0 0 1 2-2h14a2 2 0 0 1 2 2z"></path></svg>
                                <h3 className="font-bold text-lg">Selecione uma conversa</h3>
                                <p className="text-sm text-light-text-secondary dark:text-text-secondary">Escolha um contato na lista ao lado para ver as mensagens.</p>
                                <button onClick={onClose} className="absolute top-3 right-3 p-2 rounded-full text-2xl leading-none">&times;</button>
                            </div>
                        )}
                    </div>
                     {isNewConvoModalOpen && (
                        <NewConversationModal
                            type={activeTab}
                            candidates={candidates}
                            users={users}
                            currentUser={currentUser}
                            conversations={allConversations.map(c => ({ partnerId: c.partnerId }))}
                            onClose={() => setIsNewConvoModalOpen(false)}
                            onSelect={(partnerId) => { handleSelectConversation(partnerId); setIsNewConvoModalOpen(false); }}
                        />
                    )}
                </div>
            </div>
            {/* ... menu de contexto ... */}
        </>
    );
};

export default MessagingPanel;