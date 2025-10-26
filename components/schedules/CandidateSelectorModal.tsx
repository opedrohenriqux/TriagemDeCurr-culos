
import React, { useState, useMemo } from 'react';
import { Candidate, Job } from '../../types';
import InitialsAvatar from '../common/InitialsAvatar';

interface CandidateSelectorModalProps {
    isOpen: boolean;
    onClose: () => void;
    onSelect: (selectedIds: Set<string>) => void;
    allJobs: Job[];
    allCandidates: Candidate[];
    initialSelectedIds: Set<string>;
}

const CandidateSelectorModal: React.FC<CandidateSelectorModalProps> = ({
    isOpen,
    onClose,
    onSelect,
    allJobs = [],
    allCandidates,
    initialSelectedIds
}) => {
    const [selectedJobId, setSelectedJobId] = useState<string | null>(null);
    const [searchTerm, setSearchTerm] = useState('');
    const [currentSelectedIds, setCurrentSelectedIds] = useState<Set<string>>(initialSelectedIds);

    const activeJobs = useMemo(() => allJobs.filter(j => j.status === 'active'), [allJobs]);

    const candidatesInJob = useMemo(() => {
        if (!selectedJobId) return [];
        return allCandidates.filter(c => c.jobId === selectedJobId);
    }, [allCandidates, selectedJobId]);

    const filteredCandidates = useMemo(() => {
        return candidatesInJob.filter(c =>
            c.name.toLowerCase().includes(searchTerm.toLowerCase())
        );
    }, [candidatesInJob, searchTerm]);

    const handleToggleCandidate = (candidateId: string) => {
        setCurrentSelectedIds(prev => {
            const newSet = new Set(prev);
            if (newSet.has(candidateId)) {
                newSet.delete(candidateId);
            } else {
                newSet.add(candidateId);
            }
            return newSet;
        });
    };

    const handleSaveSelection = () => {
        onSelect(currentSelectedIds);
        onClose();
    };

    if (!isOpen) return null;

    return (
        <div className="fixed inset-0 bg-light-background/80 dark:bg-background/90 backdrop-blur-md flex justify-center items-center z-[90] p-4 animate-fade-in">
            <div className="bg-light-surface dark:bg-surface rounded-2xl shadow-2xl w-full max-w-2xl max-h-[90vh] flex flex-col border border-light-border dark:border-border">
                <div className="p-5 border-b border-light-border dark:border-border">
                    <h2 className="text-2xl font-bold text-light-text-primary dark:text-text-primary">Selecionar Candidatos</h2>
                </div>

                <div className="p-6 space-y-4 overflow-y-auto">
                    <div>
                        <label className="block text-sm font-semibold mb-1">1. Selecione a Vaga</label>
                        <select
                            value={selectedJobId || ''}
                            onChange={e => setSelectedJobId(e.target.value)}
                            className="w-full px-3 py-2 bg-light-background dark:bg-background border border-light-border dark:border-border rounded-md focus:ring-2 focus:ring-light-primary dark:focus:ring-primary"
                        >
                            <option value="" disabled>-- Escolha uma vaga --</option>
                            {activeJobs.map(job => (
                                <option key={job.id} value={job.id}>{job.title}</option>
                            ))}
                        </select>
                    </div>

                    {selectedJobId && (
                        <div>
                            <label className="block text-sm font-semibold mb-1">2. Busque e Selecione os Candidatos</label>
                            <input
                                type="text"
                                placeholder="Buscar por nome..."
                                value={searchTerm}
                                onChange={e => setSearchTerm(e.target.value)}
                                className="w-full px-3 py-2 mb-2 bg-light-background dark:bg-background border border-light-border dark:border-border rounded-md"
                            />
                            <div className="max-h-64 overflow-y-auto space-y-2 pr-2 border rounded-md p-2">
                                {filteredCandidates.length > 0 ? filteredCandidates.map(c => (
                                    <label key={c.id} className="flex items-center gap-3 p-2 rounded-md cursor-pointer hover:bg-light-background dark:hover:bg-background">
                                        <input
                                            type="checkbox"
                                            checked={currentSelectedIds.has(c.id)}
                                            onChange={() => handleToggleCandidate(c.id)}
                                            className="h-4 w-4 rounded text-light-primary dark:text-primary focus:ring-light-primary"
                                        />
                                        <div className="w-8 h-8 flex-shrink-0"><InitialsAvatar name={c.name} /></div>
                                        <span className="text-sm font-medium">{c.name}</span>
                                    </label>
                                )) : (
                                    <p className="text-sm text-center text-light-text-secondary dark:text-text-secondary py-4">Nenhum candidato encontrado.</p>
                                )}
                            </div>
                        </div>
                    )}
                </div>

                <div className="p-5 border-t border-light-border dark:border-border flex justify-between items-center">
                    <span className="text-sm font-semibold text-light-text-secondary dark:text-text-secondary">
                        {currentSelectedIds.size} candidato(s) selecionado(s)
                    </span>
                    <div className="flex gap-4">
                        <button type="button" onClick={onClose} className="bg-light-border dark:bg-border font-bold px-6 py-2.5 rounded-lg hover:bg-light-border/70 dark:hover:bg-border/70">Cancelar</button>
                        <button type="button" onClick={handleSaveSelection} className="bg-light-primary dark:bg-primary text-white font-bold px-6 py-2.5 rounded-lg hover:bg-light-primary-hover dark:hover:bg-primary-hover">Confirmar Seleção</button>
                    </div>
                </div>
            </div>
        </div>
    );
};

export default CandidateSelectorModal;
