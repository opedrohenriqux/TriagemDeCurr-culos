import React, { useState, useMemo } from 'react';
import { Talent, Job } from '../../types';
import TalentEditorModal from './TalentEditorModal';
import SendTalentToJobModal from './SendTalentToJobModal';
import InitialsAvatar from '../common/InitialsAvatar';

// Define props for TalentPool component
interface TalentPoolProps {
  talentPool: Talent[];
  jobs: Job[];
  onAddTalent: (talent: Omit<Talent, 'id'>) => void;
  onUpdateTalent: (talent: Talent) => void;
  onArchiveTalent: (talentId: number) => void;
  onSendTalentToJob: (talentId: number, jobId: string) => void;
}

// Define props for TalentCard component
interface TalentCardProps {
  talent: Talent;
  onEdit: (e: React.MouseEvent) => void;
  onArchive: (e: React.MouseEvent) => void;
  onSendToJob: (e: React.MouseEvent) => void;
  onClick: () => void;
}

// Create TalentCard component
const TalentCard: React.FC<TalentCardProps> = ({ talent, onEdit, onArchive, onSendToJob, onClick }) => (
    <div 
      className={`bg-light-surface dark:bg-surface p-5 rounded-xl border border-light-border dark:border-border transition-all duration-300 flex flex-col group hover:border-light-primary dark:hover:border-primary hover:shadow-glow-primary ${talent.status !== 'Disponível' ? 'cursor-pointer' : ''}`}
      onClick={onClick}
    >
        <div className="flex items-start justify-between">
            <div className="flex items-center gap-4">
                <div className="w-16 h-16 rounded-full border-2 border-light-border dark:border-border flex-shrink-0">
                    <InitialsAvatar name={talent.name} className="text-xl" />
                </div>
                <div>
                    <h4 className="text-lg font-bold text-light-text-primary dark:text-text-primary">{talent.name}, <span className="text-base font-medium text-light-text-secondary dark:text-text-secondary">{talent.age}</span></h4>
                    <p className="text-sm text-light-text-secondary dark:text-text-secondary">{talent.city}</p>
                    <p className="text-sm font-medium text-light-text-primary dark:text-text-primary mt-1">{talent.desiredPosition}</p>
                </div>
            </div>
             <div className="flex flex-col items-center flex-shrink-0">
                <div className="relative flex items-center justify-center w-16 h-16">
                    <svg className="w-full h-full" viewBox="0 0 80 80">
                        <circle className="text-light-border dark:text-border" strokeWidth="6" stroke="currentColor" fill="transparent" r="30" cx="40" cy="40"/>
                        <circle className="text-light-primary dark:text-primary" strokeWidth="6" stroke="currentColor" fill="transparent" r="30" cx="40" cy="40" strokeDasharray={2 * Math.PI * 30} strokeDashoffset={(2 * Math.PI * 30) - (talent.potential / 10 * (2 * Math.PI * 30))} strokeLinecap="round" transform="rotate(-90 40 40)"/>
                    </svg>
                    <span className="absolute text-lg font-bold text-light-text-primary dark:text-text-primary">{talent.potential.toFixed(1)}</span>
                </div>
                 <p className="text-xs text-light-text-secondary dark:text-text-secondary mt-1 font-semibold">Potencial</p>
            </div>
        </div>
        <div className="mt-4 flex-grow space-y-2 text-sm text-light-text-secondary dark:text-text-secondary">
             <p><strong className="text-light-text-primary dark:text-text-primary">Experiência:</strong> {talent.experience}</p>
             <p><strong className="text-light-text-primary dark:text-text-primary">Habilidades:</strong> {talent.skills.join(', ')}</p>
        </div>
        <div className="mt-4 pt-4 border-t border-light-border dark:border-border flex items-center gap-2">
            <button type="button" onClick={onSendToJob} className="w-full bg-light-primary dark:bg-primary text-white dark:text-background font-semibold py-2 rounded-lg hover:bg-light-primary-hover dark:hover:bg-primary-hover transition-colors text-sm">
                Enviar para Vaga
            </button>
            <button type="button" onClick={onEdit} className="p-2 text-light-text-secondary dark:text-text-secondary hover:text-light-text-primary dark:hover:text-text-primary bg-light-background dark:bg-background rounded-lg hover:bg-light-border dark:hover:bg-border transition-colors" aria-label="Editar talento">
                <svg xmlns="http://www.w3.org/2000/svg" width="20" height="20" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round"><path d="M17 3a2.828 2.828 0 1 1 4 4L7.5 20.5 2 22l1.5-5.5L17 3z"></path></svg>
            </button>
            <button type="button" onClick={onArchive} className="p-2 text-light-text-secondary dark:text-text-secondary hover:text-light-text-primary dark:hover:text-text-primary bg-light-background dark:bg-background rounded-lg hover:bg-light-border dark:hover:bg-border transition-colors" aria-label="Arquivar talento">
                <svg xmlns="http://www.w3.org/2000/svg" width="20" height="20" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round"><path d="M21 8v11a2 2 0 0 1-2 2H5a2 2 0 0 1-2-2V8"/><rect x="1" y="3" width="22" height="5"/><line x1="10" y1="12" x2="14" y2="12"/></svg>
            </button>
        </div>
    </div>
);

// Create TalentPool component
const TalentPool: React.FC<TalentPoolProps> = ({ talentPool, jobs, onAddTalent, onUpdateTalent, onArchiveTalent, onSendTalentToJob }) => {
    const [searchTerm, setSearchTerm] = useState('');
    const [isEditorModalOpen, setIsEditorModalOpen] = useState(false);
    const [isSendModalOpen, setIsSendModalOpen] = useState(false);
    const [selectedTalent, setSelectedTalent] = useState<Talent | null>(null);
    const [isGroupedView, setIsGroupedView] = useState(true);
    const [sortConfig, setSortConfig] = useState<{ key: 'potential' | 'name'; direction: 'asc' | 'desc' }>({ key: 'potential', direction: 'desc' });
    const [pastFilter, setPastFilter] = useState<'all' | 'triagem' | 'entrevista'>('all');
    const [expandedTalentId, setExpandedTalentId] = useState<number | null>(null);

    const mainPool = useMemo(() => talentPool.filter(t => t.status === 'Disponível'), [talentPool]);
    const pastCandidates = useMemo(() => talentPool.filter(t => t.status !== 'Disponível'), [talentPool]);
    
    const applyFiltersAndSorting = (talents: Talent[]) => {
        let filtered = talents;

        if (searchTerm) {
             filtered = filtered.filter(talent => 
                talent.name.toLowerCase().includes(searchTerm.toLowerCase()) ||
                talent.desiredPosition.toLowerCase().includes(searchTerm.toLowerCase()) ||
                talent.skills.some(skill => skill.toLowerCase().includes(searchTerm.toLowerCase()))
            );
        }
        
        return filtered.sort((a, b) => {
            if (sortConfig.key === 'name') {
                return sortConfig.direction === 'asc' ? a.name.localeCompare(b.name) : b.name.localeCompare(a.name);
            }
            return sortConfig.direction === 'asc' ? a.potential - b.potential : b.potential - a.potential;
        });
    };
    
    const filteredMainPool = useMemo(() => applyFiltersAndSorting(mainPool), [mainPool, searchTerm, sortConfig]);

    const filteredPastCandidates = useMemo(() => {
        let filtered = pastCandidates;
        if(pastFilter !== 'all') {
            if (pastFilter === 'triagem') {
                filtered = filtered.filter(t => t.status === 'Rejeitado (Triagem)');
            } else if (pastFilter === 'entrevista') {
                filtered = filtered.filter(t => t.status === 'Rejeitado (Entrevista)');
            }
        }
        return applyFiltersAndSorting(filtered);
    }, [pastCandidates, pastFilter, searchTerm, sortConfig]);

    const unifiedList = useMemo(() => applyFiltersAndSorting(talentPool), [talentPool, searchTerm, sortConfig]);


    const handleOpenCreateModal = () => {
        setSelectedTalent(null);
        setIsEditorModalOpen(true);
    };

    const handleOpenEditModal = (talent: Talent) => {
        setSelectedTalent(talent);
        setIsEditorModalOpen(true);
    };

    const handleSaveTalent = (talentData: Talent | Omit<Talent, 'id'>) => {
        if ('id' in talentData) {
            onUpdateTalent(talentData as Talent);
        } else {
            onAddTalent(talentData);
        }
        setIsEditorModalOpen(false);
    };

    const handleOpenSendModal = (talent: Talent) => {
        setSelectedTalent(talent);
        setIsSendModalOpen(true);
    };

    const handleSendTalent = (jobId: string) => {
        if (selectedTalent) {
            onSendTalentToJob(selectedTalent.id, jobId);
        }
        setIsSendModalOpen(false);
    };
    
    const handleToggleExpand = (talentId: number, hasReason: boolean) => {
        if (hasReason) {
            setExpandedTalentId(prev => (prev === talentId ? null : talentId));
        }
    };
    
    return (
        <div>
            <div className="flex flex-col md:flex-row justify-between items-start mb-8 gap-4">
                <h1 className="text-3xl font-bold text-light-text-primary dark:text-text-primary">Banco de Talentos ({talentPool.length})</h1>
                <div className="flex items-center gap-4 w-full md:w-auto">
                    <input 
                        type="text"
                        placeholder="Buscar talentos..."
                        value={searchTerm}
                        onChange={(e) => setSearchTerm(e.target.value)}
                        className="bg-light-surface dark:bg-surface text-light-text-primary dark:text-text-primary placeholder-light-text-secondary dark:placeholder-text-secondary px-4 py-2 rounded-lg border border-light-border dark:border-border focus:outline-none focus:ring-2 focus:ring-light-primary dark:focus:ring-primary w-full md:w-64"
                    />
                    <button 
                        type="button"
                        onClick={handleOpenCreateModal}
                        className="flex items-center justify-center gap-2 bg-light-primary dark:bg-primary text-white dark:text-background font-bold px-4 py-2 rounded-lg hover:bg-light-primary-hover dark:hover:bg-primary-hover transition-colors whitespace-nowrap"
                    >
                        <svg xmlns="http://www.w3.org/2000/svg" width="20" height="20" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2.5" strokeLinecap="round" strokeLinejoin="round"><line x1="12" y1="5" x2="12" y2="19"></line><line x1="5" y1="12" x2="19" y2="12"></line></svg>
                        Adicionar Talento
                    </button>
                </div>
            </div>

             <div className="bg-light-surface dark:bg-surface p-4 rounded-xl border border-light-border dark:border-border mb-6 flex flex-col sm:flex-row justify-between items-center gap-4">
                <div className="flex items-center gap-2">
                    <label className="text-sm font-semibold text-light-text-secondary dark:text-text-secondary">Ordenar por:</label>
                    <select
                        value={sortConfig.key}
                        onChange={(e) => setSortConfig(prev => ({...prev, key: e.target.value as 'potential' | 'name'}))}
                        className="bg-light-background dark:bg-background text-light-text-primary dark:text-text-primary px-3 py-2 text-sm rounded-lg border border-light-border dark:border-border focus:outline-none focus:ring-2 focus:ring-light-primary dark:focus:ring-primary"
                    >
                        <option value="potential">Classificação</option>
                        <option value="name">Nome</option>
                    </select>
                    <button
                        type="button"
                        onClick={() => setSortConfig(prev => ({ ...prev, direction: prev.direction === 'asc' ? 'desc' : 'asc' }))}
                        className="p-2 bg-light-background dark:bg-background rounded-lg border border-light-border dark:border-border text-light-text-secondary dark:text-text-secondary hover:bg-light-border dark:hover:bg-border"
                        aria-label={`Ordenar ${sortConfig.direction === 'asc' ? 'descendente' : 'ascendente'}`}
                    >
                        {sortConfig.direction === 'asc' ? 
                            <svg xmlns="http://www.w3.org/2000/svg" width="20" height="20" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round"><path d="M12 5v14M18 11l-6-6M6 11l6-6"/></svg> :
                            <svg xmlns="http://www.w3.org/2000/svg" width="20" height="20" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round"><path d="M12 5v14M18 13l-6 6M6 13l6 6"/></svg>
                        }
                    </button>
                </div>
                 <div className="flex items-center gap-3">
                    <label className="text-sm font-semibold text-light-text-secondary dark:text-text-secondary">Visão Agrupada</label>
                    <div className="relative">
                        <input 
                            type="checkbox" 
                            checked={isGroupedView} 
                            onChange={() => setIsGroupedView(!isGroupedView)}
                            className="sr-only peer"
                        />
                        <div className="w-11 h-6 bg-light-border dark:bg-border rounded-full peer peer-checked:after:translate-x-full peer-checked:after:border-white after:content-[''] after:absolute after:top-[2px] after:left-[2px] after:bg-white after:border-light-border dark:after:border-border after:border after:rounded-full after:h-5 after:w-5 after:transition-all peer-checked:bg-light-primary dark:peer-checked:bg-primary"></div>
                    </div>
                </div>
            </div>

            {isGroupedView ? (
                <div className="space-y-8">
                    <div>
                        <h2 className="text-2xl font-bold text-light-text-primary dark:text-text-primary mb-4">Banco de Talentos Principal ({filteredMainPool.length})</h2>
                        <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
                            {filteredMainPool.map(talent => (
                                <TalentCard 
                                    key={talent.id}
                                    talent={talent}
                                    onEdit={(e) => { e.stopPropagation(); handleOpenEditModal(talent); }}
                                    onArchive={(e) => { e.stopPropagation(); onArchiveTalent(talent.id); }}
                                    onSendToJob={(e) => { e.stopPropagation(); handleOpenSendModal(talent); }}
                                    onClick={() => {}}
                                />
                            ))}
                        </div>
                    </div>
                    <div>
                        <div className="mb-4">
                             <h2 className="text-2xl font-bold text-light-text-primary dark:text-text-primary mb-2">Candidatos de Processos Anteriores ({filteredPastCandidates.length})</h2>
                             <div className="flex gap-2">
                                <button onClick={() => setPastFilter('all')} className={`px-3 py-1 text-sm rounded-full ${pastFilter === 'all' ? 'bg-light-primary dark:bg-primary text-white' : 'bg-light-border dark:bg-border'}`}>Todos</button>
                                <button onClick={() => setPastFilter('triagem')} className={`px-3 py-1 text-sm rounded-full ${pastFilter === 'triagem' ? 'bg-light-primary dark:bg-primary text-white' : 'bg-light-border dark:bg-border'}`}>Rejeitados (Triagem)</button>
                                <button onClick={() => setPastFilter('entrevista')} className={`px-3 py-1 text-sm rounded-full ${pastFilter === 'entrevista' ? 'bg-light-primary dark:bg-primary text-white' : 'bg-light-border dark:bg-border'}`}>Rejeitados (Entrevista)</button>
                             </div>
                        </div>
                        <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
                            {filteredPastCandidates.map((talent) => (
                                <div key={talent.id} className="flex flex-col">
                                    <TalentCard
                                        talent={talent}
                                        onEdit={(e) => { e.stopPropagation(); handleOpenEditModal(talent); }}
                                        onArchive={(e) => { e.stopPropagation(); onArchiveTalent(talent.id); }}
                                        onSendToJob={(e) => { e.stopPropagation(); handleOpenSendModal(talent); }}
                                        onClick={() => handleToggleExpand(talent.id, !!talent.rejectionReason)}
                                    />
                                    {expandedTalentId === talent.id && talent.rejectionReason && (
                                        <div className="p-4 bg-light-background dark:bg-background rounded-b-xl -mt-2 border-x border-b border-light-border dark:border-border animate-fade-in">
                                            <h5 className="font-bold text-sm text-light-primary dark:text-primary">Motivo da Rejeição:</h5>
                                            <p className="text-sm text-light-text-secondary dark:text-text-secondary mt-1">{talent.rejectionReason}</p>
                                        </div>
                                    )}
                                </div>
                            ))}
                        </div>
                    </div>
                </div>
            ) : (
                <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
                    {unifiedList.map(talent => (
                         <div key={talent.id} className="flex flex-col">
                            <TalentCard
                                talent={talent}
                                onEdit={(e) => { e.stopPropagation(); handleOpenEditModal(talent); }}
                                onArchive={(e) => { e.stopPropagation(); onArchiveTalent(talent.id); }}
                                onSendToJob={(e) => { e.stopPropagation(); handleOpenSendModal(talent); }}
                                onClick={() => handleToggleExpand(talent.id, !!talent.rejectionReason)}
                            />
                            {expandedTalentId === talent.id && talent.rejectionReason && (
                                <div className="p-4 bg-light-background dark:bg-background rounded-b-xl -mt-2 border-x border-b border-light-border dark:border-border animate-fade-in">
                                    <h5 className="font-bold text-sm text-light-primary dark:text-primary">Motivo da Rejeição:</h5>
                                    <p className="text-sm text-light-text-secondary dark:text-text-secondary mt-1">{talent.rejectionReason}</p>
                                </div>
                            )}
                        </div>
                    ))}
                </div>
            )}
            
            <TalentEditorModal
                isOpen={isEditorModalOpen}
                onClose={() => setIsEditorModalOpen(false)}
                onSave={handleSaveTalent}
                onArchive={onArchiveTalent}
                talentToEdit={selectedTalent}
            />
            {selectedTalent && (
                <SendTalentToJobModal
                    isOpen={isSendModalOpen}
                    onClose={() => setIsSendModalOpen(false)}
                    onSend={handleSendTalent}
                    talent={selectedTalent}
                    activeJobs={jobs}
                />
            )}
        </div>
    );
};

export default TalentPool;