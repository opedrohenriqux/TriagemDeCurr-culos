import React, { useState, useMemo } from 'react';
import { Job, Candidate, Talent } from '../../types';

interface ArchiveViewProps {
    archivedJobs: Job[];
    archivedCandidates: Candidate[];
    archivedTalents: Talent[];
    allJobs: Job[];
    onRestoreJob: (jobId: string) => void;
    onDeleteJob: (jobId: string) => void;
    onRestoreCandidate: (candidateId: number) => void;
    onDeleteCandidate: (candidateId: number) => void;
    onRestoreTalent: (talentId: number) => void;
    onDeleteTalent: (talentId: number) => void;
    onRestoreAll: () => void;
    onDeleteAllPermanently: () => void;
}

const ArchiveView: React.FC<ArchiveViewProps> = ({ 
    archivedJobs, 
    archivedCandidates, 
    archivedTalents, 
    allJobs, 
    onRestoreJob, 
    onDeleteJob, 
    onRestoreCandidate, 
    onDeleteCandidate, 
    onRestoreTalent,
    onDeleteTalent,
    onRestoreAll, 
    onDeleteAllPermanently 
}) => {
    const [candidateSearchTerm, setCandidateSearchTerm] = useState('');
    const [jobFilter, setJobFilter] = useState<string>('all');
    
    const jobMap = useMemo(() => {
        return allJobs.reduce((acc, job) => {
            acc[job.id] = job.title;
            return acc;
        }, {} as Record<string, string>);
    }, [allJobs]);

    const filteredArchivedCandidates = useMemo(() => {
        return archivedCandidates.filter(candidate => {
            const matchesSearch = candidate.name.toLowerCase().includes(candidateSearchTerm.toLowerCase());
            const matchesJob = jobFilter === 'all' || candidate.jobId === jobFilter;
            return matchesSearch && matchesJob;
        });
    }, [archivedCandidates, candidateSearchTerm, jobFilter]);

    const handleRestoreAllClick = () => {
        onRestoreAll();
    };

    const handleDeleteAllClick = () => {
        // This is a destructive action, but we remove the confirm dialog
        // to ensure functionality in all environments.
        onDeleteAllPermanently();
    };

    const hasArchivedItems = archivedJobs.length > 0 || archivedCandidates.length > 0 || archivedTalents.length > 0;

    return (
        <div className="text-light-text-primary dark:text-text-primary">
             <div className="flex flex-col md:flex-row justify-between items-center mb-8 gap-4">
                <h1 className="text-3xl font-bold">Itens Arquivados</h1>
                {hasArchivedItems && (
                    <div className="flex items-center gap-4">
                        <button 
                            type="button"
                            onClick={handleRestoreAllClick}
                            className="flex items-center gap-2 bg-green-100 dark:bg-green-600/20 text-green-700 dark:text-green-400 font-semibold px-4 py-2 rounded-lg text-sm hover:bg-green-200 dark:hover:bg-green-600/40 transition-colors"
                        >
                            <svg xmlns="http://www.w3.org/2000/svg" width="18" height="18" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round"><polyline points="1 4 1 10 7 10"></polyline><path d="M3.51 15a9 9 0 1 0 2.13-9.36L1 10"></path></svg>
                            Restaurar Tudo
                        </button>
                        <button 
                            type="button"
                            onClick={handleDeleteAllClick}
                            className="flex items-center gap-2 bg-red-100 dark:bg-red-600/20 text-red-700 dark:text-red-400 font-semibold px-4 py-2 rounded-lg text-sm hover:bg-red-200 dark:hover:bg-red-600/40 transition-colors"
                        >
                            <svg xmlns="http://www.w3.org/2000/svg" width="18" height="18" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round"><polyline points="3 6 5 6 21 6"></polyline><path d="M19 6v14a2 2 0 0 1-2 2H7a2 2 0 0 1-2-2V6m3 0V4a2 2 0 0 1 2-2h4a2 2 0 0 1 2 2v2"></path><line x1="10" y1="11" x2="10" y2="17"></line><line x1="14" y1="11" x2="14" y2="17"></line></svg>
                            Excluir Tudo
                        </button>
                    </div>
                )}
            </div>

            {/* Archived Jobs */}
            <div className="bg-light-surface dark:bg-surface p-6 rounded-xl border border-light-border dark:border-border mb-8">
                <h2 className="text-2xl font-bold mb-4 text-light-primary dark:text-primary">Vagas Arquivadas ({archivedJobs.length})</h2>
                <div className="space-y-3 max-h-60 overflow-y-auto pr-2">
                    {archivedJobs.length > 0 ? archivedJobs.map(job => (
                        <div key={job.id} className="flex justify-between items-center bg-light-background dark:bg-background p-4 rounded-lg border border-light-border dark:border-border">
                            <div>
                                <span className="font-semibold">{job.title}</span>
                                <span className="text-sm text-light-text-secondary dark:text-text-secondary ml-2">- {job.department}</span>
                            </div>
                            <div className="flex gap-2">
                                <button type="button" onClick={() => onRestoreJob(job.id)} className="bg-green-100 dark:bg-green-600/20 text-green-700 dark:text-green-400 font-semibold px-4 py-1 rounded-lg text-sm hover:bg-green-200 dark:hover:bg-green-600/40 transition-colors">Restaurar</button>
                                <button type="button" onClick={() => onDeleteJob(job.id)} className="bg-red-100 dark:bg-red-600/20 text-red-700 dark:text-red-400 font-semibold px-4 py-1 rounded-lg text-sm hover:bg-red-200 dark:hover:bg-red-600/40 transition-colors">Excluir</button>
                            </div>
                        </div>
                    )) : <p className="text-light-text-secondary dark:text-text-secondary">Nenhuma vaga arquivada.</p>}
                </div>
            </div>

            {/* Archived Candidates */}
            <div className="bg-light-surface dark:bg-surface p-6 rounded-xl border border-light-border dark:border-border mb-8">
                <h2 className="text-2xl font-bold mb-4 text-light-primary dark:text-primary">Candidatos Arquivados ({filteredArchivedCandidates.length})</h2>
                
                {/* Filters for Candidates */}
                 <div className="flex flex-col md:flex-row gap-4 mb-4">
                    <input
                        type="text"
                        placeholder="Buscar candidato por nome..."
                        value={candidateSearchTerm}
                        onChange={(e) => setCandidateSearchTerm(e.target.value)}
                        className="flex-1 bg-light-background dark:bg-background border border-light-border dark:border-border rounded-lg px-4 py-2 focus:outline-none focus:ring-2 focus:ring-light-primary dark:focus:ring-primary text-light-text-primary dark:text-text-primary"
                    />
                    <select
                        value={jobFilter}
                        onChange={(e) => setJobFilter(e.target.value)}
                        className="bg-light-background dark:bg-background border border-light-border dark:border-border rounded-lg px-4 py-2 focus:outline-none focus:ring-2 focus:ring-light-primary dark:focus:ring-primary text-light-text-primary dark:text-text-primary"
                    >
                        <option value="all">Todas as Vagas</option>
                        {allJobs.map(job => (
                            <option key={job.id} value={job.id}>{job.title}</option>
                        ))}
                    </select>
                </div>

                <div className="space-y-3 max-h-[40vh] overflow-y-auto pr-2">
                     {filteredArchivedCandidates.length > 0 ? filteredArchivedCandidates.map(candidate => (
                        <div key={candidate.id} className="flex justify-between items-center bg-light-background dark:bg-background p-4 rounded-lg border border-light-border dark:border-border">
                            <div>
                                <span className="font-semibold">{candidate.name}</span>
                                <span className="text-sm text-light-text-secondary dark:text-text-secondary ml-2">- Aplicou para: {jobMap[candidate.jobId] || 'Vaga desconhecida'}</span>
                            </div>
                            <div className="flex gap-2">
                                <button type="button" onClick={() => onRestoreCandidate(candidate.id)} className="bg-green-100 dark:bg-green-600/20 text-green-700 dark:text-green-400 font-semibold px-4 py-1 rounded-lg text-sm hover:bg-green-200 dark:hover:bg-green-600/40 transition-colors">Restaurar</button>
                                <button type="button" onClick={() => onDeleteCandidate(candidate.id)} className="bg-red-100 dark:bg-red-600/20 text-red-700 dark:text-red-400 font-semibold px-4 py-1 rounded-lg text-sm hover:bg-red-200 dark:hover:bg-red-600/40 transition-colors">Excluir</button>
                            </div>
                        </div>
                    )) : <p className="text-light-text-secondary dark:text-text-secondary">Nenhum candidato arquivado corresponde aos filtros.</p>}
                </div>
            </div>

            {/* Archived Talents */}
            <div className="bg-light-surface dark:bg-surface p-6 rounded-xl border border-light-border dark:border-border">
                <h2 className="text-2xl font-bold mb-4 text-light-primary dark:text-primary">Talentos Arquivados ({archivedTalents.length})</h2>
                <div className="space-y-3 max-h-60 overflow-y-auto pr-2">
                    {archivedTalents.length > 0 ? archivedTalents.map(talent => (
                        <div key={talent.id} className="flex justify-between items-center bg-light-background dark:bg-background p-4 rounded-lg border border-light-border dark:border-border">
                            <div>
                                <span className="font-semibold">{talent.name}</span>
                                <span className="text-sm text-light-text-secondary dark:text-text-secondary ml-2">- {talent.desiredPosition}</span>
                            </div>
                            <div className="flex gap-2">
                                <button type="button" onClick={() => onRestoreTalent(talent.id)} className="bg-green-100 dark:bg-green-600/20 text-green-700 dark:text-green-400 font-semibold px-4 py-1 rounded-lg text-sm hover:bg-green-200 dark:hover:bg-green-600/40 transition-colors">Restaurar</button>
                                <button type="button" onClick={() => onDeleteTalent(talent.id)} className="bg-red-100 dark:bg-red-600/20 text-red-700 dark:text-red-400 font-semibold px-4 py-1 rounded-lg text-sm hover:bg-red-200 dark:hover:bg-red-600/40 transition-colors">Excluir</button>
                            </div>
                        </div>
                    )) : <p className="text-light-text-secondary dark:text-text-secondary">Nenhum talento arquivado.</p>}
                </div>
            </div>
        </div>
    );
};

export default ArchiveView;