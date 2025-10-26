
import React, { useState, useEffect } from 'react';
import { Dynamic, Candidate, DynamicGroup, Job } from '../../types';
import InitialsAvatar from '../common/InitialsAvatar';
import CandidateSelectorModal from './CandidateSelectorModal';

// Fisher-Yates shuffle algorithm
const shuffleArray = (array: any[]) => {
    let currentIndex = array.length, randomIndex;
    while (currentIndex !== 0) {
        randomIndex = Math.floor(Math.random() * currentIndex);
        currentIndex--;
        [array[currentIndex], array[randomIndex]] = [array[randomIndex], array[currentIndex]];
    }
    return array;
};

interface DynamicEditorModalProps {
    isOpen: boolean;
    onClose: () => void;
    onSave: (dynamic: Omit<Dynamic, 'id'>) => void;
    dynamicToEdit: Dynamic | null;
    allCandidates: Candidate[];
    allJobs: Job[];
}

const DynamicEditorModal: React.FC<DynamicEditorModalProps> = ({ isOpen, onClose, onSave, dynamicToEdit, allCandidates, allJobs }) => {
    const today = new Date().toISOString().split('T')[0];
    const [title, setTitle] = useState('');
    const [script, setScript] = useState('');
    const [date, setDate] = useState(today);
    const [selectedParticipants, setSelectedParticipants] = useState<Set<string>>(new Set());
    const [groups, setGroups] = useState<DynamicGroup[]>([]);
    const [error, setError] = useState('');
    const [customGroupSize, setCustomGroupSize] = useState(4);
    const [isSelectorOpen, setIsSelectorOpen] = useState(false);

    useEffect(() => {
        if (dynamicToEdit) {
            setTitle(dynamicToEdit.title);
            setScript(dynamicToEdit.script);
            setDate(dynamicToEdit.date);
            setSelectedParticipants(new Set(dynamicToEdit.participants));
            setGroups(dynamicToEdit.groups);
        } else {
            setTitle('');
            setScript('');
            setDate(today);
            setSelectedParticipants(new Set());
            setGroups([]);
        }
        setError('');
    }, [dynamicToEdit, isOpen]);

    const handleGenerateGroups = (groupSize: number) => {
        const participants = Array.from(selectedParticipants);
        if (participants.length === 0 || groupSize <= 0) return;

        const shuffled = shuffleArray([...participants]);
        const newGroups: DynamicGroup[] = [];
        
        if (groupSize === 1) { // Individual
            shuffled.forEach((memberId, index) => {
                newGroups.push({ name: `Individual ${index + 1}`, members: [memberId] });
            });
        } else {
            let groupIndex = 1;
            for (let i = 0; i < shuffled.length; i += groupSize) {
                const chunk = shuffled.slice(i, i + groupSize);
                newGroups.push({ name: `Grupo ${groupIndex++}`, members: chunk });
            }

            if (newGroups.length > 1 && newGroups[newGroups.length - 1].members.length < groupSize / 2) {
                const lastGroup = newGroups.pop()!;
                newGroups[newGroups.length - 1].members.push(...lastGroup.members);
            }
        }
        setGroups(newGroups);
    };
    
    const handleSave = () => {
        if (!title.trim() || !date) {
            setError('Título e data são obrigatórios.');
            return;
        }
        onSave({
            title,
            script,
            date,
            participants: Array.from(selectedParticipants),
            groups
        });
    };

    const getCandidateName = (id: string) => allCandidates.find(c => c.id === id)?.name || 'Desconhecido';

    const handleSelectionDone = (selectedIds: Set<string>) => {
        setSelectedParticipants(selectedIds);
        setGroups([]); // Clear groups when participants change
    };

    if (!isOpen) return null;

    return (
        <>
            <div className="fixed inset-0 bg-light-background/80 dark:bg-background/90 backdrop-blur-md flex justify-center items-center z-[80] p-4 animate-fade-in">
                <div className="bg-light-surface dark:bg-surface rounded-2xl shadow-2xl w-full max-w-4xl max-h-[95vh] flex flex-col border border-light-border dark:border-border">
                    <div className="p-5 border-b border-light-border dark:border-border flex justify-between items-center">
                        <h2 className="text-2xl font-bold text-light-text-primary dark:text-text-primary">{dynamicToEdit ? 'Editar Dinâmica' : 'Criar Nova Dinâmica'}</h2>
                        <button onClick={onClose} className="text-light-text-secondary dark:text-text-secondary hover:text-light-text-primary dark:hover:text-text-primary text-4xl">&times;</button>
                    </div>

                    <div className="flex-1 grid grid-cols-1 lg:grid-cols-2 gap-6 p-6 overflow-y-auto">
                        {/* Left: Setup and Script */}
                        <div className="space-y-4">
                            <div>
                                <label className="block text-sm font-semibold mb-1">Título da Dinâmica*</label>
                                <input type="text" value={title} onChange={e => setTitle(e.target.value)} className="w-full px-3 py-2 bg-light-background dark:bg-background border border-light-border dark:border-border rounded-md focus:ring-2 focus:ring-light-primary dark:focus:ring-primary"/>
                            </div>
                             <div>
                                <label className="block text-sm font-semibold mb-1">Data da Dinâmica*</label>
                                <input type="date" value={date} onChange={e => setDate(e.target.value)} className="w-full px-3 py-2 bg-light-background dark:bg-background border border-light-border dark:border-border rounded-md focus:ring-2 focus:ring-light-primary dark:focus:ring-primary"/>
                            </div>
                            <div>
                                <label className="block text-sm font-semibold mb-1">Script / Instruções</label>
                                <textarea rows={8} value={script} onChange={e => setScript(e.target.value)} className="w-full px-3 py-2 bg-light-background dark:bg-background border border-light-border dark:border-border rounded-md focus:ring-2 focus:ring-light-primary dark:focus:ring-primary"/>
                            </div>
                            <div>
                                <h3 className="font-semibold mb-2">Participantes</h3>
                                <button
                                    type="button"
                                    onClick={() => setIsSelectorOpen(true)}
                                    className="w-full flex items-center justify-center gap-2 bg-light-secondary/20 dark:bg-secondary/20 text-light-secondary dark:text-secondary font-semibold py-2.5 rounded-lg hover:bg-light-secondary/30 dark:hover:bg-secondary/40 transition-colors"
                                >
                                    <svg xmlns="http://www.w3.org/2000/svg" width="18" height="18" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round"><path d="M15 6v12a3 3 0 1 0 3-3H6a3 3 0 1 0 3 3V6a3 3 0 1 0-3 3h12a3 3 0 1 0-3-3z"></path></svg>
                                    Adicionar / Buscar Candidatos
                                </button>
                            </div>
                        </div>
                        {/* Right: Group Generation */}
                        <div className="space-y-4">
                            <div>
                                <h3 className="font-semibold mb-2">Formação de Grupos ({selectedParticipants.size} participantes selecionados)</h3>
                                 <div className="p-4 bg-light-background dark:bg-background rounded-lg border border-light-border dark:border-border">
                                    <p className="text-sm font-semibold mb-2">Sortear grupos aleatórios:</p>
                                    <div className="flex flex-wrap gap-3 items-center">
                                        <button onClick={() => handleGenerateGroups(1)} disabled={selectedParticipants.size === 0} className="px-3 py-1.5 text-xs font-semibold bg-light-surface dark:bg-surface border border-light-border dark:border-border rounded-full hover:bg-light-primary/10 dark:hover:bg-primary/10 disabled:opacity-50">Individual</button>
                                        <button onClick={() => handleGenerateGroups(2)} disabled={selectedParticipants.size < 2} className="px-3 py-1.5 text-xs font-semibold bg-light-surface dark:bg-surface border border-light-border dark:border-border rounded-full hover:bg-light-primary/10 dark:hover:bg-primary/10 disabled:opacity-50">Duplas</button>
                                        <button onClick={() => handleGenerateGroups(3)} disabled={selectedParticipants.size < 3} className="px-3 py-1.5 text-xs font-semibold bg-light-surface dark:bg-surface border border-light-border dark:border-border rounded-full hover:bg-light-primary/10 dark:hover:bg-primary/10 disabled:opacity-50">Trios</button>
                                        <div className="flex items-center gap-2">
                                            <button
                                                onClick={() => handleGenerateGroups(customGroupSize)}
                                                disabled={selectedParticipants.size < customGroupSize}
                                                className="px-3 py-1.5 text-xs font-semibold bg-light-surface dark:bg-surface border border-light-border dark:border-border rounded-full hover:bg-light-primary/10 dark:hover:bg-primary/10 disabled:opacity-50"
                                            >
                                                Grupos
                                            </button>
                                            <input
                                                type="number"
                                                value={customGroupSize}
                                                onChange={(e) => setCustomGroupSize(Math.max(2, parseInt(e.target.value) || 2))}
                                                className="w-16 px-2 py-1 text-sm bg-light-surface dark:bg-surface border border-light-border dark:border-border rounded-md text-center"
                                                min="2"
                                                aria-label="Tamanho do grupo"
                                            />
                                        </div>
                                    </div>
                                </div>
                            </div>
                            <div className="max-h-[50vh] overflow-y-auto pr-2 space-y-3">
                                {groups.length > 0 ? groups.map((group, index) => (
                                    <div key={index} className="p-3 bg-light-background dark:bg-background rounded-md border border-light-border dark:border-border">
                                        <h4 className="font-bold text-light-primary dark:text-primary mb-2">{group.name}</h4>
                                        <div className="space-y-2">
                                            {group.members.map(memberId => (
                                                <div key={memberId} className="flex items-center gap-2">
                                                    <div className="w-6 h-6 flex-shrink-0"><InitialsAvatar name={getCandidateName(memberId)} /></div>
                                                    <span className="text-sm">{getCandidateName(memberId)}</span>
                                                </div>
                                            ))}
                                        </div>
                                    </div>
                                )) : (
                                    <div className="text-center py-10 border border-dashed rounded-md">
                                        <p className="text-sm text-light-text-secondary dark:text-text-secondary">Os grupos aparecerão aqui após o sorteio.</p>
                                    </div>
                                )}
                            </div>
                        </div>
                    </div>

                    <div className="p-5 border-t border-light-border dark:border-border flex justify-between items-center">
                         {error && <p className="text-red-500 text-sm">{error}</p>}
                        <div className="flex gap-4 ml-auto">
                            <button type="button" onClick={onClose} className="bg-light-border dark:bg-border font-bold px-6 py-2.5 rounded-lg hover:bg-light-border/70 dark:hover:bg-border/70">Cancelar</button>
                            <button type="button" onClick={handleSave} className="bg-light-primary dark:bg-primary text-white font-bold px-6 py-2.5 rounded-lg hover:bg-light-primary-hover dark:hover:bg-primary-hover">Salvar Dinâmica</button>
                        </div>
                    </div>
                </div>
            </div>
            <CandidateSelectorModal
                isOpen={isSelectorOpen}
                onClose={() => setIsSelectorOpen(false)}
                onSelect={handleSelectionDone}
                allJobs={allJobs}
                allCandidates={allCandidates}
                initialSelectedIds={selectedParticipants}
            />
        </>
    );
};

export default DynamicEditorModal;
