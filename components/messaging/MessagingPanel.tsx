import React, { useState, useMemo, useEffect, useRef } from 'react';
import { Message, User, Candidate, Job, CandidateStatus } from '../../types';
import InitialsAvatar from '../common/InitialsAvatar';
import { getSuggestedReplies } from '../../services/geminiService';
import Pagination from '../common/Pagination';

interface NewConversationModalProps {
    type: 'candidates' | 'team';
    candidates: Candidate[];
    users: User[];
    currentUser: { id: string };
    conversations: { partner: { id: string } }[];
    onClose: () => void;
    onSelect: (partnerId: string) => void;
}

const NewConversationModal: React.FC<NewConversationModalProps> = ({ type, candidates, users, currentUser, conversations, onClose, onSelect }) => {
    const [searchTerm, setSearchTerm] = useState('');

    const listData = useMemo(() => {
        const existingPartnerIds = new Set(conversations.map(c => c.partner.id));
        if (type === 'candidates') {
            return candidates
                .filter(c => ['screening', 'approved', 'offer', 'waitlist', 'hired'].includes(c.status))
                .filter(c => !existingPartnerIds.has(`candidate-${c.id}`))
                .sort((a, b) => a.name.localeCompare(b.name))
                .map(c => ({ id: `candidate-${c.id}`, name: c.name }));
        } else { // team
            const currentUserIdNum = parseInt(currentUser.id.split('-')[1], 10);
            return users
                .filter(u => u.id !== currentUserIdNum)
                .filter(u => !existingPartnerIds.has(`user-${u.id}`))
                .sort((a, b) => a.username.localeCompare(b.username))
                .map(u => ({ id: `user-${u.id}`, name: u.username }));
        }
    }, [type, candidates, users, currentUser, conversations]);

    const filteredList = useMemo(() => {
        if (!searchTerm) return listData;
        return listData.filter(item => item.name.toLowerCase().includes(searchTerm.toLowerCase()));
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
                        <div className="w-10 h-10 flex-shrink-0"><InitialsAvatar name={item.name} /></div>
                        <p className="font-semibold">{item.name}</p>
                    </div>
                ))}
                {filteredList.length === 0 && (
                    <p className="text-center text-sm text-light-text-secondary dark:text-text-secondary p-4">Nenhum contato elegível encontrado.</p>
                )}
            </div>
        </div>
    );
};

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

const MessagingPanel: React.FC<MessagingPanelProps> = (props) => {
    const { currentUser, messages, users, candidates, jobs, archivedConversations, onClose, onSendMessage, onUpdateMessage, onMarkAsRead, onDeleteConversation, onArchiveConversation, onUnarchiveConversation, preselectedId } = props;
    
    const [selectedConversationId, setSelectedConversationId] = useState<string | null>(null);
    const [newMessage, setNewMessage] = useState('');
    const [isNewConvoModalOpen, setIsNewConvoModalOpen] = useState(false);
    const messagesEndRef = useRef<HTMLDivElement | null>(null);
    const [suggestedReplies, setSuggestedReplies] = useState<string[]>([]);
    const [isGeneratingReplies, setIsGeneratingReplies] = useState(false);
    
    // UI State
    const [activeTab, setActiveTab] = useState<'candidates' | 'team'>('candidates');
    const [viewArchived, setViewArchived] = useState(false);
    const [contextMenu, setContextMenu] = useState<{ x: number, y: number, message: Message } | null>(null);
    const [editingMessage, setEditingMessage] = useState<Message | null>(null);
    const [editText, setEditText] = useState('');
    const [deletedForMe, setDeletedForMe] = useState<Set<number>>(new Set());
    const contextMenuRef = useRef<HTMLDivElement>(null);

    // Pagination State
    const [currentPage, setCurrentPage] = useState(1);
    const CONVERSATIONS_PER_PAGE = 10;


    // Filters State
    const [searchTerm, setSearchTerm] = useState('');
    const [jobFilter, setJobFilter] = useState('all');
    const [statusFilter, setStatusFilter] = useState('all');
    const [sortOrder, setSortOrder] = useState<'desc' | 'asc'>('desc');

    const statusTranslationMap: Record<CandidateStatus, string> = {
        applied: 'Inscrito',
        screening: 'Triagem',
        approved: 'Aprovado',
        offer: 'Oferta',
        waitlist: 'Lista de Espera',
        hired: 'Contratado',
        rejected: 'Rejeitado',
        pending: 'Pendente',
    };

    const userMap = useMemo(() => {
        const map = new Map<string, { name: string; avatar?: string }>();
        users.forEach(u => map.set(`user-${u.id}`, { name: u.username }));
        candidates.forEach(c => map.set(`candidate-${c.id}`, { name: c.name, avatar: c.avatarUrl }));
        return map;
    }, [users, candidates]);

    const allConversations = useMemo(() => {
        const conversations: { [key: string]: { partner: { id: string, name: string }, messages: Message[] } } = {};

        messages.forEach(msg => {
            const partnerId = msg.senderId === currentUser.id ? msg.receiverId : msg.senderId;
            
            if (!userMap.has(partnerId)) return;

            if (!conversations[partnerId]) {
                const partnerInfo = userMap.get(partnerId);
                if (partnerInfo) {
                     conversations[partnerId] = {
                        partner: { id: partnerId, name: partnerInfo.name },
                        messages: []
                    };
                }
            }
            if (conversations[partnerId]) {
                conversations[partnerId].messages.push(msg);
            }
        });

        return Object.values(conversations).map(convo => {
            const lastMessage = [...convo.messages].sort((a, b) => new Date(b.timestamp).getTime() - new Date(a.timestamp).getTime())[0];
            const unreadCount = convo.messages.filter(m => m.receiverId === currentUser.id && !m.isRead).length;

            return {
                partner: convo.partner,
                lastMessage: lastMessage,
                unreadCount: unreadCount
            };
        });
    }, [messages, currentUser.id, userMap]);

    const displayedConversations = useMemo(() => {
        // 1. Filter by archive status and tab type first
        let initialList = allConversations.filter(convo => {
            const isArchived = archivedConversations.has(convo.partner.id);
            const matchesArchive = viewArchived ? isArchived : !isArchived;

            const isCandidate = convo.partner.id.startsWith('candidate-');
            const matchesTab = (activeTab === 'candidates' && isCandidate) || (activeTab === 'team' && !isCandidate);

            return matchesArchive && matchesTab;
        });

        // 2. Apply tab-specific searches and filters
        let filteredList;
        if (activeTab === 'candidates') {
            filteredList = initialList
                .map(convo => ({ ...convo, candidate: candidates.find(c => `candidate-${c.id}` === convo.partner.id) }))
                .filter(convo => {
                    if (!convo.candidate) {
                        return false;
                    }
                    const nameMatch = convo.partner.name.toLowerCase().includes(searchTerm.toLowerCase());
                    const jobMatch = jobFilter === 'all' || convo.candidate.jobId === jobFilter;
                    const statusMatch = statusFilter === 'all' || convo.candidate.status === statusFilter;
                    return nameMatch && jobMatch && statusMatch;
                });
        } else { // activeTab === 'team'
            filteredList = initialList.filter(convo => {
                return convo.partner.name.toLowerCase().includes(searchTerm.toLowerCase());
            });
        }
        
        // 3. Sort the final list
        return filteredList.sort((a, b) => {
            if (!a.lastMessage || !b.lastMessage) return 0;
            const timeA = new Date(a.lastMessage.timestamp).getTime();
            const timeB = new Date(b.lastMessage.timestamp).getTime();
            return sortOrder === 'desc' ? timeB - timeA : timeA - timeB;
        });
    }, [allConversations, archivedConversations, viewArchived, activeTab, searchTerm, jobFilter, statusFilter, sortOrder, candidates]);

    const totalPages = useMemo(() => {
        return Math.ceil(displayedConversations.length / CONVERSATIONS_PER_PAGE);
    }, [displayedConversations]);

    const paginatedConversations = useMemo(() => {
        const startIndex = (currentPage - 1) * CONVERSATIONS_PER_PAGE;
        return displayedConversations.slice(startIndex, startIndex + CONVERSATIONS_PER_PAGE);
    }, [displayedConversations, currentPage]);


    const activeConversationMessages = useMemo(() => {
        if (!selectedConversationId) return [];
        return messages.filter(msg =>
            ((msg.senderId === currentUser.id && msg.receiverId === selectedConversationId) ||
            (msg.senderId === selectedConversationId && msg.receiverId === currentUser.id)) &&
            !deletedForMe.has(msg.id)
        ).sort((a, b) => new Date(a.timestamp).getTime() - new Date(b.timestamp).getTime());
    }, [messages, currentUser.id, selectedConversationId, deletedForMe]);
    
    useEffect(() => {
        if (preselectedId) {
            setSelectedConversationId(preselectedId);
            onMarkAsRead(preselectedId);
            if (preselectedId.startsWith('user-')) setActiveTab('team');
            else setActiveTab('candidates');
        } else if (currentUser.type === 'candidate' && allConversations.length > 0) {
            const partnerId = allConversations[0].partner.id;
            setSelectedConversationId(partnerId);
            onMarkAsRead(partnerId);
        }
    }, [preselectedId, currentUser.type, allConversations, onMarkAsRead]);
    
    useEffect(() => {
        const handleClickOutside = (event: MouseEvent) => {
            if (contextMenuRef.current && !contextMenuRef.current.contains(event.target as Node)) {
                setContextMenu(null);
            }
        };
        document.addEventListener('mousedown', handleClickOutside);
        return () => {
            document.removeEventListener('mousedown', handleClickOutside);
        };
    }, []);

    useEffect(() => {
        setCurrentPage(1);
    }, [activeTab, viewArchived, searchTerm, jobFilter, statusFilter, sortOrder]);

    useEffect(() => { messagesEndRef.current?.scrollIntoView({ behavior: 'smooth' }); }, [activeConversationMessages]);

    const handleSelectConversation = (partnerId: string) => {
        setSelectedConversationId(partnerId);
        onMarkAsRead(partnerId);
        setSuggestedReplies([]);
        setEditingMessage(null);
    };

    const handleSendMessage = () => {
        if (newMessage.trim() && selectedConversationId) {
            onSendMessage(selectedConversationId, newMessage);
            setNewMessage('');
            setSuggestedReplies([]);
        }
    };

    const handleGenerateReplies = async () => {
        if (!selectedConversationId) return;
        setIsGeneratingReplies(true);
        setSuggestedReplies([]);
        
        const candidate = candidates.find(c => `candidate-${c.id}` === selectedConversationId);
        const recruiterUser = users.find(u => `user-${u.id}` === currentUser.id);

        if (candidate && recruiterUser) {
            const job = jobs.find(j => j.id === candidate.jobId);
            if(job) {
                const replies = await getSuggestedReplies(activeConversationMessages, candidate, job, recruiterUser);
                if (replies) setSuggestedReplies(replies);
            }
        }
        setIsGeneratingReplies(false);
    };

    const handleAction = (e: React.MouseEvent, action: 'archive' | 'unarchive' | 'delete', partnerId: string) => {
        e.stopPropagation();
        if (action === 'archive') onArchiveConversation(partnerId);
        if (action === 'unarchive') onUnarchiveConversation(partnerId);
        if (action === 'delete') {
            if (window.confirm("Tem certeza que deseja excluir esta conversa? Esta ação não pode ser desfeita.")) {
                onDeleteConversation(partnerId);
                if (selectedConversationId === partnerId) setSelectedConversationId(null);
            }
        }
    };
    
    const handleContextMenu = (e: React.MouseEvent, message: Message) => {
        if (currentUser.type !== 'user' || message.senderId !== currentUser.id || message.isDeleted) return;
        e.preventDefault();
        setContextMenu({ x: e.pageX, y: e.pageY, message });
    };

    const handleEditClick = () => {
        if (contextMenu) {
            setEditingMessage(contextMenu.message);
            setEditText(contextMenu.message.text);
            setContextMenu(null);
        }
    };

    const handleSaveEdit = () => {
        if (editingMessage && editText.trim()) {
            onUpdateMessage(editingMessage.id, editText.trim());
        }
        setEditingMessage(null);
        setEditText('');
    };
    
    const handleDeleteForEveryoneClick = () => {
        if (contextMenu) {
            onUpdateMessage(contextMenu.message.id, "Mensagem apagada", true);
            setContextMenu(null);
        }
    };
    
    const handleDeleteForMeClick = () => {
        if (contextMenu) {
            setDeletedForMe(prev => new Set(prev).add(contextMenu.message.id));
            setContextMenu(null);
        }
    };

    const partnerName = selectedConversationId ? userMap.get(selectedConversationId)?.name : '';
    const isRecruiterView = currentUser.type === 'user';
    const candidateStatuses: CandidateStatus[] = ['applied', 'screening', 'approved', 'offer', 'waitlist', 'hired', 'rejected'];

    return (
        <>
            <div className="fixed inset-0 bg-black/50 z-50 flex justify-center items-center p-4 animate-fade-in" onClick={onClose}>
                <div className="flex h-full max-h-[80vh] w-full max-w-5xl bg-light-surface dark:bg-surface rounded-xl shadow-2xl border border-light-border dark:border-border overflow-hidden relative" onClick={e => e.stopPropagation()}>
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
                                    <div key={convo.partner.id} onClick={() => handleSelectConversation(convo.partner.id)} className={`flex items-start gap-3 p-3 cursor-pointer border-l-4 group ${selectedConversationId === convo.partner.id ? 'bg-light-background dark:bg-background border-light-primary dark:border-primary' : 'hover:bg-light-background/50 dark:hover:bg-background/50 border-transparent'}`}>
                                        <div className="w-12 h-12 flex-shrink-0"><InitialsAvatar name={convo.partner.name} /></div>
                                        <div className="flex-1 min-w-0">
                                            <div className="flex justify-between items-center"><p className="font-semibold truncate">{convo.partner.name}</p>{convo.unreadCount > 0 && <span className="bg-light-primary dark:bg-primary text-white text-xs font-bold rounded-full h-5 w-5 flex items-center justify-center">{convo.unreadCount}</span>}</div>
                                            <p className="text-sm text-light-text-secondary dark:text-text-secondary truncate">{convo.lastMessage?.text}</p>
                                        </div>
                                        <div className="flex flex-col gap-1.5 opacity-0 group-hover:opacity-100 transition-opacity">
                                            <button onClick={(e) => handleAction(e, viewArchived ? 'unarchive' : 'archive', convo.partner.id)} className="p-1.5 rounded-full text-light-text-secondary dark:text-text-secondary hover:bg-yellow-500/10 hover:text-yellow-500" title={viewArchived ? 'Desarquivar' : 'Arquivar'}><svg xmlns="http://www.w3.org/2000/svg" width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round"><path d="M21 8v11a2 2 0 0 1-2 2H5a2 2 0 0 1-2-2V8"/><rect x="1" y="3" width="22" height="5"/><line x1="10" y1="12" x2="14" y2="12"/></svg></button>
                                            <button onClick={(e) => handleAction(e, 'delete', convo.partner.id)} className="p-1.5 rounded-full text-light-text-secondary dark:text-text-secondary hover:bg-red-500/10 hover:text-red-500" title="Excluir"><svg xmlns="http://www.w3.org/2000/svg" width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round"><polyline points="3 6 5 6 21 6"></polyline><path d="M19 6v14a2 2 0 0 1-2 2H7a2 2 0 0 1-2-2V6m3 0V4a2 2 0 0 1 2-2h4a2 2 0 0 1 2 2v2"></path></svg></button>
                                        </div>
                                    </div>
                                ))}
                                {displayedConversations.length === 0 && (
                                    <p className="p-4 text-center text-sm text-light-text-secondary dark:text-text-secondary">
                                        Nenhuma conversa encontrada.
                                    </p>
                                )}
                            </div>
                             {totalPages > 1 && (
                                <div className="p-2 border-t border-light-border dark:border-border">
                                    <Pagination
                                        currentPage={currentPage}
                                        totalPages={totalPages}
                                        onPageChange={setCurrentPage}
                                    />
                                </div>
                            )}
                            <div className="p-2 border-t border-light-border dark:border-border text-center">
                                <button onClick={() => setViewArchived(!viewArchived)} className="text-sm font-semibold text-light-secondary dark:text-secondary hover:underline">
                                    {viewArchived ? 'Voltar para Ativas' : 'Ver Arquivadas'}
                                </button>
                            </div>
                        </div>
                    )}
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
                                            {msg.senderId !== currentUser.id && <div className="w-8 h-8 flex-shrink-0"><InitialsAvatar name={userMap.get(msg.senderId)?.name || '?'} /></div>}
                                            <div onContextMenu={(e) => handleContextMenu(e, msg)} className={`max-w-md p-3 rounded-2xl text-sm ${msg.senderId === currentUser.id ? 'bg-light-primary dark:bg-primary text-white rounded-br-none' : 'bg-light-surface dark:bg-surface rounded-bl-none border border-light-border dark:border-border'}`}>
                                                {editingMessage?.id === msg.id ? (
                                                     <div className="w-full">
                                                        <textarea
                                                            value={editText}
                                                            onChange={(e) => setEditText(e.target.value)}
                                                            className="w-full p-2 text-sm bg-light-surface dark:bg-surface text-light-text-primary dark:text-text-primary rounded-md border border-light-primary dark:border-primary focus:outline-none"
                                                            rows={3}
                                                            autoFocus
                                                        />
                                                        <div className="flex justify-end gap-2 mt-1">
                                                            <button onClick={() => setEditingMessage(null)} className="text-xs font-semibold px-2 py-1 rounded text-light-text-secondary dark:text-text-secondary">Cancelar</button>
                                                            <button onClick={handleSaveEdit} className="text-xs font-semibold px-3 py-1 rounded bg-light-secondary dark:bg-secondary text-white">Salvar</button>
                                                        </div>
                                                    </div>
                                                ) : (
                                                    <>
                                                        {msg.isDeleted ? (
                                                            <p className="italic text-light-text-secondary/80 dark:text-text-secondary/80">Mensagem apagada</p>
                                                        ) : (
                                                            <p>{msg.text}</p>
                                                        )}
                                                        <p className={`text-xs mt-1 ${msg.senderId === currentUser.id ? 'text-white/70' : 'text-light-text-secondary/70 dark:text-text-secondary/70'}`}>{new Date(msg.timestamp).toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' })}</p>
                                                    </>
                                                )}
                                            </div>
                                        </div>
                                    ))}
                                    <div ref={messagesEndRef} />
                                </div>
                                <div className="p-4 border-t border-light-border dark:border-border">
                                    {isRecruiterView && activeTab === 'candidates' && (<div className="mb-2">{isGeneratingReplies ? <p className="text-xs text-center text-light-text-secondary dark:text-text-secondary">Gerando...</p> : suggestedReplies.length > 0 && (<div className="flex flex-wrap gap-2">{suggestedReplies.map((reply, index) => (<button key={index} onClick={() => setNewMessage(reply)} className="px-3 py-1.5 text-xs font-semibold bg-light-background dark:bg-background border border-light-border dark:border-border rounded-full hover:border-light-primary dark:hover:border-primary hover:text-light-primary dark:hover:text-primary transition-colors">{reply}</button>))}</div>)}</div>)}
                                    <div className="flex items-center gap-2 bg-light-background dark:bg-background rounded-lg border border-light-border dark:border-border focus-within:ring-2 focus-within:ring-light-primary dark:focus-within:ring-primary">
                                        {isRecruiterView && activeTab === 'candidates' && (<button onClick={handleGenerateReplies} disabled={isGeneratingReplies} className="p-2 m-1 rounded-full text-light-secondary dark:text-secondary hover:bg-light-secondary/10 dark:hover:bg-secondary/10" title="Sugestões da IA">{isGeneratingReplies ? <div className="animate-spin rounded-full h-5 w-5 border-t-2 border-b-2 border-light-secondary dark:border-secondary"></div> : <svg xmlns="http://www.w3.org/2000/svg" width="20" height="20" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2.5" strokeLinecap="round" strokeLinejoin="round"><path d="m12 3-1.912 5.813a2 2 0 0 1-1.275 1.275L3 12l5.813 1.912a2 2 0 0 1 1.275 1.275L12 21l1.912-5.813a2 2 0 0 1 1.275-1.275L21 12l-5.813-1.912a2 2 0 0 1-1.275-1.275L12 3Z"/></svg>}</button>)}
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
                            conversations={allConversations}
                            onClose={() => setIsNewConvoModalOpen(false)}
                            onSelect={(partnerId) => {
                                handleSelectConversation(partnerId);
                                setIsNewConvoModalOpen(false);
                            }}
                        />
                    )}
                </div>
            </div>
            {contextMenu && (
                <div
                    ref={contextMenuRef}
                    style={{ top: contextMenu.y, left: contextMenu.x }}
                    className="absolute z-50 bg-light-surface dark:bg-surface border border-light-border dark:border-border rounded-md shadow-lg py-1 w-48 animate-fade-in"
                >
                    <button onClick={handleEditClick} className="w-full text-left px-4 py-2 text-sm hover:bg-light-background dark:hover:bg-background">Editar</button>
                    <button onClick={handleDeleteForEveryoneClick} className="w-full text-left px-4 py-2 text-sm hover:bg-light-background dark:hover:bg-background">Apagar para todos</button>
                    <button onClick={handleDeleteForMeClick} className="w-full text-left px-4 py-2 text-sm hover:bg-light-background dark:hover:bg-background">Apagar para mim</button>
                </div>
            )}
        </>
    );
};

export default MessagingPanel;