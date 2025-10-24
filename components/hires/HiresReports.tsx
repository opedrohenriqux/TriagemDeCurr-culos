import React, { useMemo } from 'react';
import { Candidate, Job } from '../../types';
import { BarChart, Bar, LineChart, Line, PieChart, Pie, XAxis, YAxis, CartesianGrid, Tooltip, Legend, ResponsiveContainer, Cell } from 'recharts';

interface HiresReportsProps {
    candidates: Candidate[]; // Already filtered for hired status
    allCandidates: Candidate[];
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

const ChartWrapper: React.FC<{title: string; children: React.ReactNode}> = ({title, children}) => (
    <div className="bg-light-surface dark:bg-surface rounded-xl shadow-lg p-6 border border-light-border dark:border-border">
        <h2 className="text-xl font-bold text-light-text-primary dark:text-text-primary mb-4">{title}</h2>
        <ResponsiveContainer width="100%" height={300}>
            {children}
        </ResponsiveContainer>
    </div>
);


const HiresReports: React.FC<HiresReportsProps> = ({ candidates, jobs, allCandidates }) => {
    
    const kpis = useMemo(() => {
        let totalTimeToHire = 0;
        candidates.forEach(c => {
            const hireDate = new Date(c.hireDate!);
            const appDate = new Date(c.applicationDate);
            const diffTime = Math.abs(hireDate.getTime() - appDate.getTime());
            const diffDays = Math.ceil(diffTime / (1000 * 60 * 60 * 24));
            totalTimeToHire += diffDays;
        });
        const avgTimeToHire = candidates.length > 0 ? (totalTimeToHire / candidates.length).toFixed(1) : '0';

        const candidatesWhoReachedInterview = allCandidates.filter(c => c.interview && !c.interview.noShow);
        const hiredFromInterviewees = candidatesWhoReachedInterview.filter(c => c.status === 'hired').length;
        const offerAcceptanceRate = candidatesWhoReachedInterview.length > 0 
            ? ((hiredFromInterviewees / candidatesWhoReachedInterview.length) * 100).toFixed(1) 
            : '0';

        return {
            avgTimeToHire: `${avgTimeToHire} dias`,
            offerAcceptanceRate: `${offerAcceptanceRate}%`,
        }
    }, [candidates, allCandidates]);

    const hiresOverTimeData = useMemo(() => {
        const months = ["Jan", "Fev", "Mar", "Abr", "Mai", "Jun", "Jul", "Ago", "Set", "Out", "Nov", "Dez"];
        const data: { [key: string]: { month: string, Contratações: number } } = {};
        const now = new Date();
        const sixMonthsAgo = new Date();
        sixMonthsAgo.setMonth(now.getMonth() - 5);
        sixMonthsAgo.setDate(1);

        for (let i = 0; i < 6; i++) {
            const date = new Date(sixMonthsAgo);
            date.setMonth(sixMonthsAgo.getMonth() + i);
            const monthKey = `${date.getFullYear()}-${date.getMonth()}`;
            data[monthKey] = { month: months[date.getMonth()], Contratações: 0 };
        }
        
        candidates.forEach(c => {
            const hireDate = new Date(c.hireDate!);
            if (hireDate >= sixMonthsAgo) {
                 const monthKey = `${hireDate.getFullYear()}-${hireDate.getMonth()}`;
                 if(data[monthKey]) {
                     data[monthKey].Contratações++;
                 }
            }
        });
        
        return Object.values(data);
    }, [candidates]);
    
    const sourceEffectivenessData = useMemo(() => {
        const sourceCounts: Record<string, number> = {};
        candidates.forEach(c => {
            const source = c.source || 'Desconhecida';
            sourceCounts[source] = (sourceCounts[source] || 0) + 1;
        });
        // FIX: Explicitly typed [name, value] from Object.entries to resolve destructuring with 'unknown' type.
        return Object.entries(sourceCounts).map(([name, value]: [string, number]) => ({ name, value }));
    }, [candidates]);
    
    const GENDER_COLORS = ['#4F46E5', '#EC4899', '#9CA3AF']; // Indigo, Pink, Gray
    const SOURCE_COLORS = ['#2DD4BF', '#4F46E5', '#FBBF24', '#F87171', '#A78BFA'];

    const genderDiversityData = useMemo(() => {
        const genderCounts = { 'Masculino': 0, 'Feminino': 0, 'Não informado': 0 };
        candidates.forEach(c => {
            if (c.gender === 'male') genderCounts['Masculino']++;
            else if (c.gender === 'female') genderCounts['Feminino']++;
            else genderCounts['Não informado']++;
        });
        // FIX: Explicitly typed [name, value] from Object.entries to resolve destructuring with 'unknown' type.
        return Object.entries(genderCounts)
            .map(([name, value]: [string, number]) => ({ name, value }))
            .filter(d => d.value > 0);
    }, [candidates]);
    
    const timeToHireByJobData = useMemo(() => {
        const jobData: Record<string, { totalDays: number, count: number }> = {};
        
        // FIX: Replaced Map with jobs.find to avoid potential type inference issues causing the index error.
        candidates.forEach(c => {
            const job = jobs.find(j => j.id === c.jobId);
            const jobTitle = job?.title || 'Outros';
            if (!jobData[jobTitle]) {
                jobData[jobTitle] = { totalDays: 0, count: 0 };
            }
            const hireDate = new Date(c.hireDate!);
            const appDate = new Date(c.applicationDate);
            const diffTime = Math.abs(hireDate.getTime() - appDate.getTime());
            const diffDays = Math.ceil(diffTime / (1000 * 60 * 60 * 24));
            jobData[jobTitle].totalDays += diffDays;
            jobData[jobTitle].count++;
        });

        // FIX: Explicitly typed [name, data] from Object.entries to resolve destructuring with 'unknown' type.
        return Object.entries(jobData).map(([name, data]: [string, { totalDays: number; count: number }]) => ({
            name,
            'Dias para Contratar': parseFloat((data.totalDays / data.count).toFixed(1)),
        }));
    }, [candidates, jobs]);

    return (
        <div className="animate-fade-in space-y-8">
             <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
                <KPI_Card title="Tempo Médio para Contratar" value={kpis.avgTimeToHire} description="Da inscrição à data de contratação." />
                <KPI_Card title="Taxa de Aceite de Propostas" value={kpis.offerAcceptanceRate} description="% de entrevistados que aceitaram a oferta." />
            </div>

            <div className="grid grid-cols-1 lg:grid-cols-2 gap-8">
                 <ChartWrapper title="Contratações ao Longo do Tempo">
                    <LineChart data={hiresOverTimeData}>
                        <CartesianGrid strokeDasharray="3 3" stroke="var(--color-border)" />
                        <XAxis dataKey="month" stroke="var(--color-text-secondary)" tick={{ fill: 'currentColor', fontSize: 12 }}/>
                        <YAxis stroke="var(--color-text-secondary)" tick={{ fill: 'currentColor' }} allowDecimals={false}/>
                        <Tooltip content={<CustomTooltip />} cursor={{stroke: 'var(--color-primary)', strokeWidth: 1}}/>
                        <Line type="monotone" dataKey="Contratações" stroke="#2DD4BF" strokeWidth={2} dot={{r: 4}} activeDot={{r: 6}}/>
                    </LineChart>
                </ChartWrapper>

                <ChartWrapper title="Eficácia da Fonte de Contratação">
                     <PieChart>
                        <Pie data={sourceEffectivenessData} dataKey="value" nameKey="name" cx="50%" cy="50%" outerRadius={100} labelLine={false}>
                             {sourceEffectivenessData.map((entry, index) => (
                                <Cell key={`cell-${index}`} fill={SOURCE_COLORS[index % SOURCE_COLORS.length]} />
                            ))}
                        </Pie>
                        <Tooltip content={<CustomTooltip />} />
                        <Legend wrapperStyle={{ color: 'var(--color-text-primary)' }}/>
                    </PieChart>
                </ChartWrapper>

                <ChartWrapper title="Diversidade de Gênero (Contratados)">
                    <PieChart>
                        <Pie data={genderDiversityData} dataKey="value" nameKey="name" cx="50%" cy="50%" outerRadius={100} label>
                            {genderDiversityData.map((entry, index) => (
                                <Cell key={`cell-${index}`} fill={GENDER_COLORS[index % GENDER_COLORS.length]} />
                            ))}
                        </Pie>
                        <Tooltip content={<CustomTooltip />} />
                        <Legend wrapperStyle={{ color: 'var(--color-text-primary)' }}/>
                    </PieChart>
                </ChartWrapper>

                <ChartWrapper title="Tempo para Contratar por Vaga">
                    <BarChart data={timeToHireByJobData}>
                        <CartesianGrid strokeDasharray="3 3" stroke="var(--color-border)" />
                        <XAxis dataKey="name" stroke="var(--color-text-secondary)" tick={{ fill: 'currentColor', fontSize: 12 }}/>
                        <YAxis stroke="var(--color-text-secondary)" tick={{ fill: 'currentColor' }} unit="d"/>
                        <Tooltip content={<CustomTooltip />} cursor={{fill: 'rgba(79, 70, 229, 0.1)'}}/>
                        <Bar dataKey="Dias para Contratar" fill="#4F46E5" />
                    </BarChart>
                </ChartWrapper>
            </div>
        </div>
    );
};

export default HiresReports;