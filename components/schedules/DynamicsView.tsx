import React, { useState, useMemo } from 'react';
import { Dynamic, Candidate, DynamicTimer } from '../../types';
import DynamicEditorModal from './DynamicEditorModal';
import DynamicViewerModal from './DynamicViewerModal';
import InitialsAvatar from '../common/InitialsAvatar';

interface DynamicsViewProps {
    dynamics: Dynamic[];
    candidates: Candidate[];
    onAddDynamic: (dynamic: Omit<Dynamic, 'id'>) => void;
    onUpdateDynamic: (dynamic: Dynamic) => void;
    onDeleteDynamic: (dynamicId: string) => void;
    dynamicTimers: DynamicTimer[];
    onStartDynamicTimer: (dynamicId: string, durationMinutes: number, mode: 'countdown' | 'countup') => void;
    onPauseDynamicTimer: (dynamicId: string) => void;
    onResumeDynamicTimer: () => void;
    onResetDynamicTimer: (dynamicId: string) => void;
}

const DynamicsView: React.FC<DynamicsViewProps> = (props) => {
    const { dynamics, candidates, onAddDynamic, onUpdateDynamic, onDeleteDynamic } = props;
    const [isEditorModalOpen, setIsEditorModalOpen] = useState(false);
    const [editingDynamic, setEditingDynamic] = useState<Dynamic | null>(null);
    const [isViewerModalOpen, setIsViewerModalOpen] = useState(false);
    const [viewingDynamic, setViewingDynamic] = useState<Dynamic | null>(null);

    const handleOpenCreateModal = () => {
        setEditingDynamic(null);
        setIsEditorModalOpen(true);
    };

    const handleOpenViewerModal = (dynamic: Dynamic) => {
        setViewingDynamic(dynamic);
        setIsViewerModalOpen(true);
    };
    
    const handleOpenEditorFromViewer = () => {
        setIsViewerModalOpen(false);
        setEditingDynamic(viewingDynamic);
        setIsEditorModalOpen(true);
    };
    
    const handleDelete = (e: React.MouseEvent, dynamicId: string) => {
        e.stopPropagation();
        onDeleteDynamic(dynamicId);
    };
    
    const dynamicsByDate = useMemo(() => {
        const grouped: { [key: string]: Dynamic[] } = {};
        [...dynamics]
            .sort((a, b) => new Date(b.date).getTime() - new Date(a.date).getTime())
            .forEach(d => {
                const date = new Date(d.date + 'T00:00:00').toLocaleDateString('pt-BR', { year: 'numeric', month: 'long', day: 'numeric', timeZone: 'UTC' });
                if (!grouped[date]) {
                    grouped[date] = [];
                }
                grouped[date].push(d);
            });
        return grouped;
    }, [dynamics]);

    return (
        <div className="animate-fade-in">
            <div className="flex justify-between items-center mb-6">
                <h2 className="text-2xl font-bold text-light-text-primary dark:text-text-primary">Dinâmicas de Grupo</h2>
                <button 
                    type="button"
                    onClick={handleOpenCreateModal}
                    className="flex items-center justify-center gap-2 bg-light-primary dark:bg-primary text-white dark:text-background font-bold px-4 py-2 rounded-lg hover:bg-light-primary-hover dark:hover:bg-primary-hover transition-colors whitespace-nowrap"
                >
                    <svg xmlns="http://www.w3.org/2000/svg" width="20" height="20" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2.5" strokeLinecap="round" strokeLinejoin="round"><line x1="12" y1="5" x2="12" y2="19"></line><line x1="5" y1="12" x2="19" y2="12"></line></svg>
                    Criar Dinâmica
                </button>
            </div>
            
            {Object.keys(dynamicsByDate).length > 0 ? (
                <div className="space-y-6">
                    {Object.keys(dynamicsByDate).map((date) => (
                        <div key={date}>
                            <h3 className="text-lg font-semibold text-light-text-secondary dark:text-text-secondary mb-3">{date}</h3>
                            <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
                                {dynamicsByDate[date].map(dynamic => {
                                    const participantObjects = dynamic.participants
                                        .map(pId => candidates.find(c => c.id === pId))
                                        .filter((c): c is Candidate => c !== undefined);

                                    return (
                                        <div key={dynamic.id} onClick={() => handleOpenViewerModal(dynamic)} className="bg-light-surface dark:bg-surface p-8 rounded-xl border border-light-border dark:border-border transition-all duration-300 flex flex-col group hover:border-light-primary dark:hover:border-primary hover:shadow-glow-primary cursor-pointer min-h-[24rem]">
                                            <div className="flex-grow">
                                                <div className="flex justify-between items-start mb-4">
                                                    <h4 className="text-xl font-bold text-light-text-primary dark:text-text-primary group-hover:text-light-primary dark:group-hover:text-primary transition-colors pr-2">{dynamic.title}</h4>
                                                    <button type="button" onClick={(e) => handleDelete(e, dynamic.id)} className="p-1.5 text-red-500/50 hover:text-red-500 hover:bg-red-500/10 rounded-full transition-colors opacity-0 group-hover:opacity-100" aria-label="Excluir dinâmica">
                                                        <svg xmlns="http://www.w3.org/2000/svg" width="18" height="18" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round"><polyline points="3 6 5 6 21 6"></polyline><path d="M19 6v14a2 2 0 0 1-2 2H7a2 2 0 0 1-2-2V6m3 0V4a2 2 0 0 1 2-2h4a2 2 0 0 1 2 2v2"></path></svg>
                                                    </button>
                                                </div>
                                                
                                                <div className="flex gap-6 text-sm text-light-text-secondary dark:text-text-secondary mb-4">
                                                    <div><strong>{dynamic.participants.length}</strong> participante(s)</div>
                                                    <div><strong>{dynamic.groups.length}</strong> grupo(s)</div>
                                                </div>

                                                <div>
                                                    <h5 className="text-xs font-bold uppercase text-light-text-secondary dark:text-text-secondary mb-2">Participantes</h5>
                                                    <div className="flex items-center -space-x-2">
                                                        {participantObjects.slice(0, 5).map(p => (
                                                            <div key={p.id} className="w-8 h-8 rounded-full border-2 border-light-surface dark:border-surface" title={p.name}>
                                                                <InitialsAvatar name={p.name} />
                                                            </div>
                                                        ))}
                                                        {participantObjects.length > 5 && (
                                                            <div className="w-8 h-8 rounded-full bg-light-border dark:bg-border flex items-center justify-center text-xs font-semibold border-2 border-light-surface dark:border-surface">
                                                                +{participantObjects.length - 5}
                                                            </div>
                                                        )}
                                                        {participantObjects.length === 0 && (
                                                            <p className="text-xs text-light-text-secondary dark:text-text-secondary">Nenhum participante</p>
                                                        )}
                                                    </div>
                                                </div>
                                                
                                                {dynamic.script && (
                                                    <div className="mt-4">
                                                        <h5 className="text-xs font-bold uppercase text-light-text-secondary dark:text-text-secondary mb-1">Instruções</h5>
                                                        <p className="text-sm text-light-text-secondary dark:text-text-secondary line-clamp-2 italic">
                                                            "{dynamic.script}"
                                                        </p>
                                                    </div>
                                                )}
                                            </div>
                                            <div className="mt-6 pt-4 border-t border-light-border dark:border-border text-sm font-bold text-light-primary dark:text-primary">
                                                Visualizar & Anotar
                                            </div>
                                        </div>
                                    );
                                })}
                            </div>
                        </div>
                    ))}
                </div>
            ) : (
                 <div className="text-center py-20 bg-light-surface dark:bg-surface rounded-xl border border-dashed border-light-border dark:border-border">
                  <p className="text-light-text-secondary dark:text-text-secondary">Nenhuma dinâmica criada ainda.</p>
                  <p className="text-sm mt-2 text-light-text-secondary dark:text-text-secondary">Clique em "Criar Dinâmica" para começar.</p>
                </div>
            )}
            
            {isEditorModalOpen && (
                <DynamicEditorModal
                    isOpen={isEditorModalOpen}
                    onClose={() => setIsEditorModalOpen(false)}
                    onSave={(dynamicData) => {
                        if (editingDynamic) {
                            onUpdateDynamic({ ...editingDynamic, ...dynamicData });
                        } else {
                            onAddDynamic(dynamicData);
                        }
                        setIsEditorModalOpen(false);
                    }}
                    dynamicToEdit={editingDynamic}
                    allCandidates={candidates}
                />
            )}
            
            {isViewerModalOpen && viewingDynamic && (
                <DynamicViewerModal
                    isOpen={isViewerModalOpen}
                    onClose={() => setIsViewerModalOpen(false)}
                    dynamic={viewingDynamic}
                    onUpdateDynamic={onUpdateDynamic}
                    onEdit={handleOpenEditorFromViewer}
                    allCandidates={candidates}
                    {...props}
                />
            )}
        </div>
    );
};

export default DynamicsView;