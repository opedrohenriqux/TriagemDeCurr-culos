import React, { useState, useMemo } from 'react';
import { Candidate, Job } from '../../types';
import InitialsAvatar from '../common/InitialsAvatar';
import HiresReports from './HiresReports';

interface HiresViewProps {
    candidates: Candidate[];
    jobs: Job[];
    onUpdateCandidate: (candidate: Candidate) => void;
}

const KPI_Card: React.FC<{ title: string; value: string; description: string; }> = ({ title, value, description }) => (
    <div className="bg-light-background dark:bg-background p-6 rounded-lg border border-light-border dark:border-border">
        <p className="text-sm font-semibold text-light-text-secondary dark:text-text-secondary">{title}</p>
        <p className="text-4xl font-bold text-light-primary dark:text-primary mt-2">{value}</p>
        <p className="text-xs text-light-text-secondary dark:text-text-secondary mt-1">{description}</p>
    </div>
);

const HiresView: React.FC<HiresViewProps> = ({ candidates, jobs, onUpdateCandidate }) => {
    const [activeTab, setActiveTab] = useState<'list' | 'reports'>('list');
    const [searchTerm, setSearchTerm] = useState('');
    const [jobFilter, setJobFilter] = useState('all');
    const [departmentFilter, setDepartmentFilter] = useState('all');

    const candidatesForOffer = useMemo(() => {
        return candidates
            .filter(c => c.status === 'offer')
            .sort((a, b) => new Date(b.applicationDate).getTime() - new Date(a.applicationDate).getTime());
    }, [candidates]);
    
    const waitlistedCandidates = useMemo(() => {
        return candidates
            .filter(c => c.status === 'waitlist')
            .sort((a, b) => new Date(b.applicationDate).getTime() - new Date(a.applicationDate).getTime());
    }, [candidates]);

    const hiredCandidates = useMemo(() => {
        return candidates
            .filter(c => c.status === 'hired' && c.hireDate)
            .sort((a, b) => new Date(b.hireDate!).getTime() - new Date(a.hireDate!).getTime());
    }, [candidates]);

    const jobMap = useMemo(() => new Map(jobs.map(job => [job.id, job])), [jobs]);
    const departments = useMemo(() => [...new Set(jobs.map(j => j.department))], [jobs]);

    const applyFilters = (candidateList: Candidate[]) => {
        return candidateList.filter(candidate => {
            const job = jobMap.get(candidate.jobId);
            const matchesSearch = candidate.name.toLowerCase().includes(searchTerm.toLowerCase());
            const matchesJob = jobFilter === 'all' || candidate.jobId === jobFilter;
            const matchesDepartment = departmentFilter === 'all' || (job && job.department === departmentFilter);
            return matchesSearch && matchesJob && matchesDepartment;
        });
    }

    const filteredCandidatesForOffer = useMemo(() => applyFilters(candidatesForOffer), [candidatesForOffer, searchTerm, jobFilter, departmentFilter]);
    const filteredWaitlistedCandidates = useMemo(() => applyFilters(waitlistedCandidates), [waitlistedCandidates, searchTerm, jobFilter, departmentFilter]);
    const filteredHiredCandidates = useMemo(() => applyFilters(hiredCandidates), [hiredCandidates, searchTerm, jobFilter, departmentFilter]);

    const handleConfirmHire = (candidate: Candidate) => {
        onUpdateCandidate({
            ...candidate,
            status: 'hired',
            hireDate: new Date().toISOString(),
        });
    };
    
    const handleCancelOffer = (candidate: Candidate) => {
        onUpdateCandidate({ ...candidate, status: 'rejected' });
    };

    const handleMoveToOffer = (candidate: Candidate) => {
        onUpdateCandidate({ ...candidate, status: 'offer' });
    };

    const handleRejectFromWaitlist = (candidate: Candidate) => {
        onUpdateCandidate({ ...candidate, status: 'rejected' });
    };

    return (
        <div>
            <div className="flex flex-col md:flex-row justify-between items-center mb-6">
                <div>
                    <h1 className="text-3xl font-bold text-light-text-primary dark:text-text-primary mb-2">Central de Contratações</h1>
                    <p className="text-light-text-secondary dark:text-text-secondary">Gerencie e analise todos os novos funcionários.</p>
                </div>
                <div className="bg-light-surface dark:bg-surface p-1 rounded-lg border border-light-border dark:border-border flex gap-1 self-start md:self-center mt-4 md:mt-0">
                    <button type="button" onClick={() => setActiveTab('list')} className={`px-4 py-1.5 text-sm font-semibold rounded-md transition-colors ${activeTab === 'list' ? 'bg-light-primary dark:bg-primary text-white' : 'hover:bg-light-background dark:hover:bg-background'}`}>Lista</button>
                    <button type="button" onClick={() => setActiveTab('reports')} className={`px-4 py-1.5 text-sm font-semibold rounded-md transition-colors ${activeTab === 'reports' ? 'bg-light-primary dark:bg-primary text-white' : 'hover:bg-light-background dark:hover:bg-background'}`}>Relatórios</button>
                </div>
            </div>

            <div className="bg-light-surface dark:bg-surface rounded-xl border border-light-border dark:border-border p-4 mb-6">
                <div className="grid grid-cols-1 md:grid-cols-4 gap-4">
                    <div className="md:col-span-2">
                        <label className="text-xs font-semibold text-light-text-secondary dark:text-text-secondary">Buscar por Nome</label>
                        <input 
                            type="text"
                            placeholder="Nome do candidato..."
                            value={searchTerm}
                            onChange={(e) => setSearchTerm(e.target.value)}
                            className="w-full mt-1 bg-light-background dark:bg-background border border-light-border dark:border-border rounded-lg px-3 py-2 text-light-text-primary dark:text-text-primary focus:outline-none focus:ring-2 focus:ring-light-primary dark:focus:ring-primary"
                        />
                    </div>
                     <div>
                        <label className="text-xs font-semibold text-light-text-secondary dark:text-text-secondary">Departamento</label>
                        <select onChange={(e) => setDepartmentFilter(e.target.value)} value={departmentFilter} className="w-full mt-1 bg-light-background dark:bg-background border border-light-border dark:border-border rounded-lg px-3 py-2 text-light-text-primary dark:text-text-primary focus:outline-none focus:ring-2 focus:ring-light-primary dark:focus:ring-primary">
                            <option value="all">Todos</option>
                            {departments.map(d => <option key={d} value={d}>{d}</option>)}
                        </select>
                    </div>
                    <div>
                        <label className="text-xs font-semibold text-light-text-secondary dark:text-text-secondary">Vaga</label>
                        <select onChange={(e) => setJobFilter(e.target.value)} value={jobFilter} className="w-full mt-1 bg-light-background dark:bg-background border border-light-border dark:border-border rounded-lg px-3 py-2 text-light-text-primary dark:text-text-primary focus:outline-none focus:ring-2 focus:ring-light-primary dark:focus:ring-primary">
                            <option value="all">Todas</option>
                            {jobs.map(j => <option key={j.id} value={j.id}>{j.title}</option>)}
                        </select>
                    </div>
                </div>
            </div>

            {activeTab === 'list' && (
                <div className="animate-fade-in space-y-8">
                    {/* Candidates for Offer */}
                    <div>
                        <h2 className="text-2xl font-bold mb-4 text-light-text-primary dark:text-text-primary">Aguardando Contratação ({filteredCandidatesForOffer.length})</h2>
                        <div className="bg-light-surface dark:bg-surface rounded-xl border border-light-border dark:border-border overflow-hidden">
                            <div className="overflow-x-auto">
                                <table className="w-full text-sm text-left text-light-text-secondary dark:text-text-secondary">
                                    <thead className="text-xs text-light-text-secondary dark:text-text-secondary uppercase bg-light-background dark:bg-background">
                                        <tr>
                                            <th scope="col" className="px-6 py-3">Candidato</th>
                                            <th scope="col" className="px-6 py-3">Vaga</th>
                                            <th scope="col" className="px-6 py-3">Data da Oferta</th>
                                            <th scope="col" className="px-6 py-3">Ação</th>
                                        </tr>
                                    </thead>
                                    <tbody>
                                        {filteredCandidatesForOffer.map(candidate => (
                                            <tr key={candidate.id} className="bg-light-surface dark:bg-surface border-b dark:border-border hover:bg-light-background dark:hover:bg-background">
                                                <th scope="row" className="flex items-center px-6 py-4 text-light-text-primary dark:text-text-primary whitespace-nowrap">
                                                    <InitialsAvatar name={candidate.name} className="w-10 h-10 flex-shrink-0" />
                                                    <div className="pl-3">
                                                        <div className="text-base font-semibold">{candidate.name}</div>
                                                    </div>
                                                </th>
                                                <td className="px-6 py-4">{jobMap.get(candidate.jobId)?.title || 'N/A'}</td>
                                                <td className="px-6 py-4">{new Date(candidate.applicationDate).toLocaleDateString('pt-BR')}</td>
                                                <td className="px-6 py-4 space-x-4">
                                                    <button onClick={() => handleConfirmHire(candidate)} className="font-medium text-green-600 dark:text-green-400 hover:underline">Confirmar Contratação</button>
                                                    <button onClick={() => handleCancelOffer(candidate)} className="font-medium text-red-600 dark:text-red-400 hover:underline">Cancelar Contratação</button>
                                                </td>
                                            </tr>
                                        ))}
                                    </tbody>
                                </table>
                            </div>
                            {filteredCandidatesForOffer.length === 0 && (
                                <div className="text-center py-10"><p className="text-light-text-secondary dark:text-text-secondary">Nenhum candidato em fase de oferta.</p></div>
                            )}
                        </div>
                    </div>

                    {/* Waitlisted Candidates */}
                    <div>
                        <h2 className="text-2xl font-bold mb-4 text-light-text-primary dark:text-text-primary">Lista de Espera ({filteredWaitlistedCandidates.length})</h2>
                        <div className="bg-light-surface dark:bg-surface rounded-xl border border-light-border dark:border-border overflow-hidden">
                            <div className="overflow-x-auto">
                                <table className="w-full text-sm text-left text-light-text-secondary dark:text-text-secondary">
                                    <thead className="text-xs text-light-text-secondary dark:text-text-secondary uppercase bg-light-background dark:bg-background">
                                        <tr>
                                            <th scope="col" className="px-6 py-3">Candidato</th>
                                            <th scope="col" className="px-6 py-3">Vaga</th>
                                            <th scope="col" className="px-6 py-3">Adicionado em</th>
                                            <th scope="col" className="px-6 py-3">Ações</th>
                                        </tr>
                                    </thead>
                                    <tbody>
                                        {filteredWaitlistedCandidates.map(candidate => (
                                            <tr key={candidate.id} className="bg-light-surface dark:bg-surface border-b dark:border-border hover:bg-light-background dark:hover:bg-background">
                                                <th scope="row" className="flex items-center px-6 py-4 text-light-text-primary dark:text-text-primary whitespace-nowrap">
                                                    <InitialsAvatar name={candidate.name} className="w-10 h-10 flex-shrink-0" />
                                                    <div className="pl-3">
                                                        <div className="text-base font-semibold">{candidate.name}</div>
                                                    </div>
                                                </th>
                                                <td className="px-6 py-4">{jobMap.get(candidate.jobId)?.title || 'N/A'}</td>
                                                <td className="px-6 py-4">{new Date(candidate.applicationDate).toLocaleDateString('pt-BR')}</td>
                                                <td className="px-6 py-4 space-x-4">
                                                    <button onClick={() => handleMoveToOffer(candidate)} className="font-medium text-cyan-600 dark:text-cyan-400 hover:underline">Mover para Oferta</button>
                                                    <button onClick={() => handleRejectFromWaitlist(candidate)} className="font-medium text-red-600 dark:text-red-400 hover:underline">Rejeitar</button>
                                                </td>
                                            </tr>
                                        ))}
                                    </tbody>
                                </table>
                            </div>
                            {filteredWaitlistedCandidates.length === 0 && (
                                <div className="text-center py-10"><p className="text-light-text-secondary dark:text-text-secondary">Nenhum candidato na lista de espera.</p></div>
                            )}
                        </div>
                    </div>

                    {/* Hired Candidates */}
                    <div>
                        <h2 className="text-2xl font-bold mb-4 text-light-text-primary dark:text-text-primary">Histórico de Contratados ({filteredHiredCandidates.length})</h2>
                        <div className="bg-light-surface dark:bg-surface rounded-xl border border-light-border dark:border-border overflow-hidden">
                            <div className="overflow-x-auto">
                                <table className="w-full text-sm text-left text-light-text-secondary dark:text-text-secondary">
                                    <thead className="text-xs text-light-text-secondary dark:text-text-secondary uppercase bg-light-background dark:bg-background">
                                        <tr>
                                            <th scope="col" className="px-6 py-3">Funcionário</th>
                                            <th scope="col" className="px-6 py-3">Vaga</th>
                                            <th scope="col" className="px-6 py-3">Data de Contratação</th>
                                        </tr>
                                    </thead>
                                    <tbody>
                                        {filteredHiredCandidates.map(candidate => (
                                            <tr key={candidate.id} className="bg-light-surface dark:bg-surface border-b dark:border-border hover:bg-light-background dark:hover:bg-background">
                                                <th scope="row" className="flex items-center px-6 py-4 text-light-text-primary dark:text-text-primary whitespace-nowrap">
                                                    <InitialsAvatar name={candidate.name} className="w-10 h-10 flex-shrink-0" />
                                                    <div className="pl-3">
                                                        <div className="text-base font-semibold">{candidate.name}</div>
                                                    </div>
                                                </th>
                                                <td className="px-6 py-4">{jobMap.get(candidate.jobId)?.title || 'N/A'}</td>
                                                <td className="px-6 py-4">{new Date(candidate.hireDate!).toLocaleDateString('pt-BR')}</td>
                                            </tr>
                                        ))}
                                    </tbody>
                                </table>
                            </div>
                             {filteredHiredCandidates.length === 0 && (
                                <div className="text-center py-10"><p className="text-light-text-secondary dark:text-text-secondary">Nenhum funcionário contratado encontrado.</p></div>
                            )}
                        </div>
                    </div>
                </div>
            )}
            
            {activeTab === 'reports' && (
                <HiresReports candidates={filteredHiredCandidates} allCandidates={candidates} jobs={jobs} />
            )}
        </div>
    );
};

export default HiresView;