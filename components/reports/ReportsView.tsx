import React, { useMemo, useState } from 'react';
import { BarChart, Bar, PieChart, Pie, XAxis, YAxis, CartesianGrid, Tooltip, Legend, ResponsiveContainer, Cell } from 'recharts';
import { Job, Candidate, Talent } from '../../types';

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

const ReportsView: React.FC<{ jobs: Job[]; candidates: Candidate[], talentPool: Talent[] }> = ({ jobs, candidates, talentPool }) => {
    const [jobFilter, setJobFilter] = useState<string>('all');
    const [departmentFilter, setDepartmentFilter] = useState<string>('all');

    const departments = useMemo(() => [...new Set(jobs.map(j => j.department))], [jobs]);
    
    const availableJobs = useMemo(() => {
        if (departmentFilter === 'all') return jobs;
        return jobs.filter(j => j.department === departmentFilter);
    }, [jobs, departmentFilter]);

    const filteredCandidates = useMemo(() => {
        return candidates.filter(c => 
            (jobFilter === 'all' || c.jobId === jobFilter) &&
            (departmentFilter === 'all' || jobs.find(j => j.id === c.jobId)?.department === departmentFilter)
        );
    }, [candidates, jobs, jobFilter, departmentFilter]);

    const filteredTalentPool = useMemo(() => {
        if (departmentFilter === 'all' && jobFilter === 'all') {
            return talentPool;
        }
        const filteredJobTitles = new Set(
            availableJobs
                .filter(j => jobFilter === 'all' || j.id === jobFilter)
                .map(j => j.title)
        );
        return talentPool.filter(t => filteredJobTitles.has(t.desiredPosition));
    }, [talentPool, availableJobs, jobFilter, departmentFilter]);


    const months = ["Jan", "Fev", "Mar", "Abr", "Mai", "Jun", "Jul", "Ago", "Set", "Out", "Nov", "Dez"];
    
    const hiringFunnelData = useMemo(() => {
        const data: { [key: string]: { month: string, Contratados: number, Rejeitados: number } } = {};
        const now = new Date();
        const sixMonthsAgo = new Date();
        sixMonthsAgo.setMonth(now.getMonth() - 5);
        sixMonthsAgo.setDate(1);

        for (let i = 0; i < 6; i++) {
            const date = new Date(sixMonthsAgo);
            date.setMonth(sixMonthsAgo.getMonth() + i);
            const monthKey = `${date.getFullYear()}-${date.getMonth()}`;
            data[monthKey] = { month: months[date.getMonth()], Contratados: 0, Rejeitados: 0 };
        }
        
        filteredCandidates.forEach(c => {
            const appDate = new Date(c.applicationDate);
            if (appDate >= sixMonthsAgo) {
                 const monthKey = `${appDate.getFullYear()}-${appDate.getMonth()}`;
                 if(data[monthKey]) {
                     if (c.status === 'hired') data[monthKey].Contratados++;
                     if (c.status === 'rejected') data[monthKey].Rejeitados++;
                 }
            }
        });
        
        return Object.values(data);
    }, [filteredCandidates, months]);

    const departmentComparisonData = useMemo(() => {
        const data: { [key: string]: { name: string, Inscritos: number, Contratados: number, Rejeitados: number } } = {};

        jobs.forEach(j => {
             data[j.department] = { name: j.department, Inscritos: 0, Contratados: 0, Rejeitados: 0 };
        });

        filteredCandidates.forEach(c => {
            const job = jobs.find(j => j.id === c.jobId);
            const dept = job?.department;
            if(dept && data[dept]) {
                data[dept].Inscritos++;
                if (c.status === 'hired') data[dept].Contratados++;
                if (c.status === 'rejected') data[dept].Rejeitados++;
            }
        });

        return Object.values(data).filter(d => d.Inscritos > 0);
    }, [filteredCandidates, jobs]);

    const locationComparisonData = useMemo(() => {
        const locationCounts: { [key: string]: number } = {};
        filteredCandidates.forEach(c => {
            let city = 'Outros';
            if (c.location.includes('Campinas')) city = 'Campinas';
            else if (c.location.includes('Valinhos')) city = 'Valinhos';
            else if (c.location.includes('Hortolândia')) city = 'Hortolândia';
            else if (c.location.includes('Sumaré')) city = 'Sumaré';
            locationCounts[city] = (locationCounts[city] || 0) + 1;
        });
        return Object.entries(locationCounts).map(([name, value]: [string, number]) => ({ name, value }));
    }, [filteredCandidates]);
    
    const COLORS = ['#2DD4BF', '#4F46E5', '#FBBF24', '#F87171', '#A78BFA', '#EC4899'];

    const hiresByJobData = useMemo(() => {
        const hiresCounts: { [key: string]: number } = {};
        filteredCandidates.forEach(c => {
            if (c.status === 'hired') {
                const job = jobs.find(j => j.id === c.jobId);
                if (job) {
                    hiresCounts[job.title] = (hiresCounts[job.title] || 0) + 1;
                }
            }
        });
        return Object.entries(hiresCounts)
            .map(([name, count]) => ({ name, 'Contratados': count }))
            .filter(item => item.Contratados > 0)
            .sort((a, b) => b.Contratados - a.Contratados);
    }, [filteredCandidates, jobs]);

    const absenteeismData = useMemo(() => {
        const data: { [key: string]: { month: string, 'Faltas em Entrevistas': number } } = {};
        const now = new Date();
        const sixMonthsAgo = new Date();
        sixMonthsAgo.setMonth(now.getMonth() - 5);
        sixMonthsAgo.setDate(1);

         for (let i = 0; i < 6; i++) {
            const date = new Date(sixMonthsAgo);
            date.setMonth(sixMonthsAgo.getMonth() + i);
            const monthKey = `${date.getFullYear()}-${date.getMonth()}`;
            data[monthKey] = { month: months[date.getMonth()], 'Faltas em Entrevistas': 0 };
        }
        
        filteredCandidates.forEach(c => {
            if (c.interview?.noShow) {
                const interviewDate = new Date(c.interview.date);
                 if (interviewDate >= sixMonthsAgo) {
                    const monthKey = `${interviewDate.getFullYear()}-${interviewDate.getMonth()}`;
                    if(data[monthKey]) {
                        data[monthKey]['Faltas em Entrevistas']++;
                    }
                }
            }
        });
        
        return Object.values(data);
    }, [filteredCandidates, months]);

    const talentOriginData = useMemo(() => {
        const originCounts: { [key: string]: number } = {};
        filteredTalentPool.forEach(t => {
            let city = 'Outros';
            if (t.city.includes('Campinas')) city = 'Campinas';
            originCounts[city] = (originCounts[city] || 0) + 1;
        });
        return Object.entries(originCounts).map(([name, value]: [string, number]) => ({ name, value }));
    }, [filteredTalentPool]);

    const talentGenderData = useMemo(() => {
        const genderCounts = { 'Masculino': 0, 'Feminino': 0, 'Não informado': 0 };
        filteredTalentPool.forEach(t => {
            if (t.gender === 'male') genderCounts['Masculino']++;
            else if (t.gender === 'female') genderCounts['Feminino']++;
            else genderCounts['Não informado']++;
        });
        return Object.entries(genderCounts)
            .map(([name, value]: [string, number]) => ({ name, value }))
            .filter(d => d.value > 0);
    }, [filteredTalentPool]);

    const TALENT_COLORS = ['#4F46E5', '#EC4899', '#9CA3AF']; // Indigo, Pink, Gray

    const ChartWrapper: React.FC<{title: string; children: React.ReactNode}> = ({title, children}) => (
        <div className="bg-light-surface dark:bg-surface rounded-xl shadow-lg p-6 border border-light-border dark:border-border">
            <h2 className="text-xl font-bold text-light-text-primary dark:text-text-primary mb-4">{title}</h2>
            <ResponsiveContainer width="100%" height={300}>
                {children}
            </ResponsiveContainer>
        </div>
    )

    return (
        <div>
            <h1 className="text-3xl font-bold text-light-text-primary dark:text-text-primary mb-8">Relatórios Gerenciais</h1>

            <div className="grid grid-cols-1 md:grid-cols-3 gap-4 mb-8 p-4 bg-light-surface dark:bg-surface rounded-xl border border-light-border dark:border-border">
                <div>
                    <label className="text-xs font-semibold text-light-text-secondary dark:text-text-secondary">Departamento</label>
                    <select onChange={(e) => { setDepartmentFilter(e.target.value); setJobFilter('all'); }} value={departmentFilter} className="w-full mt-1 bg-light-background dark:bg-background border border-light-border dark:border-border rounded-lg px-3 py-2 text-light-text-primary dark:text-text-primary focus:outline-none focus:ring-2 focus:ring-light-primary dark:focus:ring-primary">
                    <option value="all">Todos</option>
                    {departments.map(d => <option key={d} value={d}>{d}</option>)}
                    </select>
                </div>
                <div>
                    <label className="text-xs font-semibold text-light-text-secondary dark:text-text-secondary">Vaga</label>
                    <select onChange={(e) => setJobFilter(e.target.value)} value={jobFilter} className="w-full mt-1 bg-light-background dark:bg-background border border-light-border dark:border-border rounded-lg px-3 py-2 text-light-text-primary dark:text-text-primary focus:outline-none focus:ring-2 focus:ring-light-primary dark:focus:ring-primary">
                    <option value="all">Todas</option>
                    {availableJobs.map(j => <option key={j.id} value={j.id}>{j.title}</option>)}
                    </select>
                </div>
                <div className="flex items-end">
                    <button 
                        type="button"
                        onClick={() => { setDepartmentFilter('all'); setJobFilter('all'); }} 
                        className="w-full mt-1 bg-light-background dark:bg-background border border-light-border dark:border-border rounded-lg px-3 py-2 text-light-text-secondary dark:text-text-secondary hover:text-light-text-primary dark:hover:text-text-primary hover:border-light-text-secondary dark:hover:border-text-secondary transition-colors"
                    >
                        Limpar Filtros
                    </button>
                </div>
            </div>

            <div className="grid grid-cols-1 lg:grid-cols-2 gap-8">
                <ChartWrapper title="Contratações (Últimos 6 Meses)">
                    <BarChart data={hiringFunnelData}>
                        <CartesianGrid strokeDasharray="3 3" stroke="var(--color-border)" />
                        <XAxis dataKey="month" stroke="var(--color-text-secondary)" tick={{ fill: 'currentColor', fontSize: 12 }}/>
                        <YAxis stroke="var(--color-text-secondary)" tick={{ fill: 'currentColor' }}/>
                        <Tooltip content={<CustomTooltip />} cursor={{fill: 'rgba(79, 70, 229, 0.1)'}} />
                        <Legend wrapperStyle={{ color: 'var(--color-text-primary)' }}/>
                        <Bar dataKey="Contratados" fill="#2DD4BF" />
                        <Bar dataKey="Rejeitados" fill="#F87171" />
                    </BarChart>
                </ChartWrapper>
                
                <ChartWrapper title="Comparativo por Setor">
                    <BarChart data={departmentComparisonData} layout="vertical" margin={{ left: 20 }}>
                        <CartesianGrid strokeDasharray="3 3" stroke="var(--color-border)" />
                        <XAxis type="number" stroke="var(--color-text-secondary)" tick={{ fill: 'currentColor' }}/>
                        <YAxis type="category" dataKey="name" stroke="var(--color-text-secondary)" width={80} tick={{ fill: 'currentColor', fontSize: 12 }}/>
                        <Tooltip content={<CustomTooltip />} cursor={{fill: 'rgba(79, 70, 229, 0.1)'}}/>
                        <Legend wrapperStyle={{ color: 'var(--color-text-primary)' }}/>
                        <Bar dataKey="Inscritos" fill="#4F46E5" />
                        <Bar dataKey="Contratados" fill="#2DD4BF" />
                        <Bar dataKey="Rejeitados" fill="#F87171" />
                    </BarChart>
                </ChartWrapper>

                <ChartWrapper title="Origem dos Candidatos por Cidade">
                     <PieChart>
                        <Pie data={locationComparisonData} dataKey="value" nameKey="name" cx="50%" cy="50%" outerRadius={100} label>
                             {locationComparisonData.map((entry, index) => (
                                <Cell key={`cell-${index}`} fill={COLORS[index % COLORS.length]} />
                            ))}
                        </Pie>
                        <Tooltip content={<CustomTooltip />} />
                        <Legend wrapperStyle={{ color: 'var(--color-text-primary)' }}/>
                    </PieChart>
                </ChartWrapper>

                <ChartWrapper title="Contratações por Vaga">
                    <BarChart data={hiresByJobData} layout="vertical" margin={{ left: 20, right: 20 }}>
                        <CartesianGrid strokeDasharray="3 3" stroke="var(--color-border)" />
                        <XAxis type="number" stroke="var(--color-text-secondary)" tick={{ fill: 'currentColor' }} allowDecimals={false} />
                        <YAxis type="category" dataKey="name" stroke="var(--color-text-secondary)" width={120} tick={{ fill: 'currentColor', fontSize: 12 }} />
                        <Tooltip content={<CustomTooltip />} cursor={{fill: 'rgba(79, 70, 229, 0.1)'}} />
                        <Bar dataKey="Contratados" fill="#818CF8" />
                    </BarChart>
                </ChartWrapper>

                <ChartWrapper title="Monitoramento de Absenteísmo em Entrevistas">
                    <BarChart data={absenteeismData}>
                        <CartesianGrid strokeDasharray="3 3" stroke="var(--color-border)" />
                        <XAxis dataKey="month" stroke="var(--color-text-secondary)" tick={{ fill: 'currentColor', fontSize: 12 }}/>
                        <YAxis stroke="var(--color-text-secondary)" tick={{ fill: 'currentColor' }} allowDecimals={false}/>
                        <Tooltip content={<CustomTooltip />} cursor={{fill: 'rgba(79, 70, 229, 0.1)'}}/>
                        <Legend wrapperStyle={{ color: 'var(--color-text-primary)' }}/>
                        <Bar dataKey="Faltas em Entrevistas" fill="#FBBF24" />
                    </BarChart>
                </ChartWrapper>

                <div className="bg-light-surface dark:bg-surface rounded-xl shadow-lg p-6 border border-light-border dark:border-border flex flex-col justify-center items-center text-center">
                    <h3 className="text-xl font-bold text-light-text-primary dark:text-text-primary mb-2">Total de Talentos</h3>
                    <p className="text-6xl font-extrabold text-light-primary dark:text-primary">{filteredTalentPool.length}</p>
                    <p className="text-sm text-light-text-secondary dark:text-text-secondary mt-1">profissionais em seu banco.</p>
                </div>

                <ChartWrapper title="Origem dos Talentos">
                    <PieChart>
                        <Pie data={talentOriginData} dataKey="value" nameKey="name" cx="50%" cy="50%" outerRadius={100} label>
                            {talentOriginData.map((entry, index) => (
                                <Cell key={`cell-${index}`} fill={COLORS[index % COLORS.length]} />
                            ))}
                        </Pie>
                        <Tooltip content={<CustomTooltip />} />
                        <Legend wrapperStyle={{ color: 'var(--color-text-primary)' }}/>
                    </PieChart>
                </ChartWrapper>

                <ChartWrapper title="Gênero dos Talentos">
                    <PieChart>
                        <Pie data={talentGenderData} dataKey="value" nameKey="name" cx="50%" cy="50%" outerRadius={100} label>
                            {talentGenderData.map((entry, index) => (
                                <Cell key={`cell-${index}`} fill={TALENT_COLORS[index % TALENT_COLORS.length]} />
                            ))}
                        </Pie>
                        <Tooltip content={<CustomTooltip />} />
                        <Legend wrapperStyle={{ color: 'var(--color-text-primary)' }}/>
                    </PieChart>
                </ChartWrapper>
            </div>
        </div>
    );
};

export default ReportsView;