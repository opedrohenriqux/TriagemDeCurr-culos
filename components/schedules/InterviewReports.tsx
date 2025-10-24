import React, { useMemo, useState } from 'react';
import { Candidate, User, Job } from '../../types';
import { BarChart, Bar, PieChart, Pie, XAxis, YAxis, CartesianGrid, Tooltip, Legend, ResponsiveContainer, Cell } from 'recharts';

interface InterviewReportsProps {
    candidates: Candidate[];
    users: User[];
    jobs: Job[];
}

const CustomTooltip = ({ active, payload, label }: any) => {
    if (active && payload && payload.length) {
      const title = label || payload[0].name;
      return (
        <div className="bg-light-surface dark:bg-surface p-3 border border-light-border dark:border-border rounded-lg shadow-lg">
          <p className="label text-light-text-primary dark:text-text-primary font-bold">{title}</p>
          {payload.map((pld: any, index: number) => (
            <p key={index} style={{ color: pld.color || pld.fill }} className="text-sm">{`${pld.name}: ${pld.value}`}</p>
          ))}
        </div>
      );
    }
    return null;
};

const KPI_Card: React.FC<{ title: string; value: string; description: string; }> = ({ title, value, description }) => (
    <div className="bg-light-background dark:bg-background p-6 rounded-lg border border-light-border dark:border-border">
        <p className="text-sm font-semibold text-light-text-secondary dark:text-text-secondary">{title}</p>
        <p className="text-4xl font-bold text-light-primary dark:text-primary mt-2">{value}</p>
        <p className="text-xs text-light-text-secondary dark:text-text-secondary mt-1">{description}</p>
    </div>
);


const InterviewReports: React.FC<InterviewReportsProps> = ({ candidates, users, jobs }) => {
    const [interviewerFilter, setInterviewerFilter] = useState('all');
    const [jobFilter, setJobFilter] = useState('all');

    const filteredInterviewCandidates = useMemo(() => {
        return candidates.filter(c => {
            if (!c.interview) return false;
            const matchesJob = jobFilter === 'all' || c.jobId === jobFilter;
            const matchesInterviewer = interviewerFilter === 'all' || c.interview.interviewers.includes(interviewerFilter);
            return matchesJob && matchesInterviewer;
        });
    }, [candidates, jobFilter, interviewerFilter]);
    
    const interviewData = useMemo(() => {
        const scheduled = filteredInterviewCandidates;
        const completed = scheduled.filter(c => new Date(`${c.interview!.date}T${c.interview!.time}`) < new Date() && !c.interview?.noShow);
        const hired = completed.filter(c => c.status === 'hired');
        const rejected = completed.filter(c => c.status === 'rejected');
        const noShows = scheduled.filter(c => c.interview?.noShow);

        return { scheduled, completed, hired, rejected, noShows };
    }, [filteredInterviewCandidates]);

    const kpis = useMemo(() => {
        const hiringRate = interviewData.completed.length > 0 ? (interviewData.hired.length / interviewData.completed.length) * 100 : 0;
        const noShowRate = interviewData.scheduled.length > 0 ? (interviewData.noShows.length / interviewData.scheduled.length) * 100 : 0;
        
        return {
            totalCompleted: interviewData.completed.length,
            hiringRate: hiringRate.toFixed(1) + '%',
            noShowRate: noShowRate.toFixed(1) + '%',
        };
    }, [interviewData]);

    const performanceByInterviewer = useMemo(() => {
        const stats: { [key: string]: { name: string; Contratados: number; Rejeitados: number } } = {};
        users.forEach(u => {
            stats[u.username] = { name: u.username, Contratados: 0, Rejeitados: 0 };
        });

        interviewData.completed.forEach(c => {
            c.interview?.interviewers.forEach(interviewerName => {
                if (stats[interviewerName]) {
                    if (c.status === 'hired') {
                        stats[interviewerName].Contratados++;
                    } else if (c.status === 'rejected') {
                        stats[interviewerName].Rejeitados++;
                    }
                }
            });
        });
        
        return Object.values(stats).filter(s => s.Contratados > 0 || s.Rejeitados > 0);
    }, [interviewData, users]);

    const outcomesByJob = useMemo(() => {
        const jobMap = new Map(jobs.map(j => [j.id, j.title]));
        const stats: { [key: string]: { name: string; Contratados: number; Rejeitados: number } } = {};

        jobs.forEach(j => {
            stats[j.id] = { name: j.title, Contratados: 0, Rejeitados: 0 };
        });

        interviewData.completed.forEach(c => {
            if (stats[c.jobId]) {
                if (c.status === 'hired') {
                    stats[c.jobId].Contratados++;
                } else if (c.status === 'rejected') {
                    stats[c.jobId].Rejeitados++;
                }
            }
        });
        
        return Object.values(stats).filter(s => s.Contratados > 0 || s.Rejeitados > 0);
    }, [interviewData, jobs]);

    const ChartWrapper: React.FC<{title: string; children: React.ReactNode}> = ({title, children}) => (
        <div className="bg-light-surface dark:bg-surface rounded-xl shadow-lg p-6 border border-light-border dark:border-border">
            <h2 className="text-xl font-bold text-light-text-primary dark:text-text-primary mb-4">{title}</h2>
            <ResponsiveContainer width="100%" height={300}>
                {children}
            </ResponsiveContainer>
        </div>
    );
    
    return (
        <div className="animate-fade-in space-y-8">
             <div className="grid grid-cols-1 md:grid-cols-4 gap-4 p-4 bg-light-surface dark:bg-surface rounded-xl border border-light-border dark:border-border">
                <div>
                    <label className="text-xs font-semibold text-light-text-secondary dark:text-text-secondary">Filtrar por Entrevistador</label>
                    <select onChange={(e) => setInterviewerFilter(e.target.value)} value={interviewerFilter} className="w-full mt-1 bg-light-background dark:bg-background border border-light-border dark:border-border rounded-lg px-3 py-2 text-light-text-primary dark:text-text-primary focus:outline-none focus:ring-2 focus:ring-light-primary dark:focus:ring-primary">
                      <option value="all">Todos</option>
                      {users.map(u => <option key={u.id} value={u.username}>{u.username}</option>)}
                    </select>
                </div>
                <div>
                    <label className="text-xs font-semibold text-light-text-secondary dark:text-text-secondary">Filtrar por Vaga</label>
                    <select onChange={(e) => setJobFilter(e.target.value)} value={jobFilter} className="w-full mt-1 bg-light-background dark:bg-background border border-light-border dark:border-border rounded-lg px-3 py-2 text-light-text-primary dark:text-text-primary focus:outline-none focus:ring-2 focus:ring-light-primary dark:focus:ring-primary">
                      <option value="all">Todas</option>
                      {jobs.map(j => <option key={j.id} value={j.id}>{j.title}</option>)}
                    </select>
                </div>
                <div className="flex items-end col-span-1 md:col-span-2">
                    <button 
                        type="button"
                        onClick={() => { setInterviewerFilter('all'); setJobFilter('all'); }} 
                        className="w-full md:w-auto mt-1 bg-light-background dark:bg-background border border-light-border dark:border-border rounded-lg px-4 py-2 text-light-text-secondary dark:text-text-secondary hover:text-light-text-primary dark:hover:text-text-primary hover:border-light-text-secondary dark:hover:border-text-secondary transition-colors"
                    >
                        Limpar Filtros
                    </button>
                </div>
            </div>

            <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
                <KPI_Card title="Entrevistas Concluídas" value={String(kpis.totalCompleted)} description="Total de entrevistas realizadas." />
                <KPI_Card title="Taxa de Contratação (Pós-Entrevista)" value={kpis.hiringRate} description="Dos entrevistados, a % que foi contratada." />
                <KPI_Card title="Taxa de Ausência (No-Show)" value={kpis.noShowRate} description="% de candidatos que não compareceram." />
            </div>

            <div className="grid grid-cols-1 lg:grid-cols-2 gap-8">
                <ChartWrapper title="Desempenho por Entrevistador">
                    <BarChart data={performanceByInterviewer} layout="vertical" margin={{ left: 20 }}>
                        <CartesianGrid strokeDasharray="3 3" stroke="var(--color-border)" />
                        <XAxis type="number" stroke="var(--color-text-secondary)" tick={{ fill: 'currentColor' }}/>
                        <YAxis type="category" dataKey="name" stroke="var(--color-text-secondary)" width={80} tick={{ fill: 'currentColor', fontSize: 12 }}/>
                        <Tooltip content={<CustomTooltip />} cursor={{fill: 'rgba(79, 70, 229, 0.1)'}}/>
                        <Legend wrapperStyle={{ color: 'var(--color-text-primary)' }}/>
                        <Bar dataKey="Contratados" stackId="a" fill="#2DD4BF" />
                        <Bar dataKey="Rejeitados" stackId="a" fill="#F87171" />
                    </BarChart>
                </ChartWrapper>

                <ChartWrapper title="Resultados da Entrevista por Vaga">
                    <BarChart data={outcomesByJob}>
                        <CartesianGrid strokeDasharray="3 3" stroke="var(--color-border)" />
                        <XAxis dataKey="name" stroke="var(--color-text-secondary)" tick={{ fill: 'currentColor', fontSize: 12 }}/>
                        <YAxis stroke="var(--color-text-secondary)" tick={{ fill: 'currentColor' }}/>
                        <Tooltip content={<CustomTooltip />} cursor={{fill: 'rgba(79, 70, 229, 0.1)'}} />
                        <Legend wrapperStyle={{ color: 'var(--color-text-primary)' }}/>
                        <Bar dataKey="Contratados" stackId="a" fill="#2DD4BF" />
                        <Bar dataKey="Rejeitados" stackId="a" fill="#F87171" />
                    </BarChart>
                </ChartWrapper>
            </div>
        </div>
    );
};

export default InterviewReports;