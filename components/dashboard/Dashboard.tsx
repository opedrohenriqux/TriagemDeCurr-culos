import React, { useMemo, useState, useRef, useEffect } from 'react';
import { BarChart, Bar, XAxis, YAxis, CartesianGrid, Tooltip, Legend, ResponsiveContainer, PieChart, Pie, Cell } from 'recharts';
import { Job, Candidate } from '../../types';
import { getAIResponseForChat } from '../../services/geminiService';

const CustomTooltip = ({ active, payload, label }: any) => {
  if (active && payload && payload.length) {
    // For pie charts, the 'label' prop can be undefined.
    // The relevant title is the 'name' property of the first item in the payload.
    // For bar charts, the 'label' prop holds the x-axis value. We'll prioritize that.
    const title = label || payload[0].name;

    return (
      <div className="bg-light-surface dark:bg-surface p-3 border border-light-border dark:border-border rounded-lg shadow-lg">
        <p className="label text-light-text-primary dark:text-text-primary font-bold">{title}</p>
        {payload.map((pld: any, index: number) => (
          <p key={index} style={{ color: pld.color }} className="text-sm">{`${pld.name}: ${pld.value}`}</p>
        ))}
      </div>
    );
  }
  return null;
};

const CustomConversionTooltip = ({ active, payload, label }: any) => {
    if (active && payload && payload.length) {
      const total = payload.reduce((sum: number, entry: any) => sum + entry.value, 0);
      const interviewedEntry = payload.find((entry: any) => entry.dataKey === 'Entrevistados');
      const interviewedCount = interviewedEntry ? interviewedEntry.value : 0;
      const conversionRate = total > 0 ? ((interviewedCount / total) * 100).toFixed(1) : 0;
  
      return (
        <div className="bg-light-surface dark:bg-surface p-3 border border-light-border dark:border-border rounded-lg shadow-lg">
          <p className="label text-light-text-primary dark:text-text-primary font-bold">{label}</p>
          <p className="text-sm text-light-text-secondary dark:text-text-secondary">Total de Candidatos: {total}</p>
          <p className="text-sm" style={{ color: '#2DD4BF' }}>Chegaram à Entrevista: {interviewedCount}</p>
          <p className="text-sm font-bold text-light-primary dark:text-primary mt-1">Taxa de Conversão: {conversionRate}%</p>
        </div>
      );
    }
    return null;
  };

interface DashboardProps {
  jobs: Job[];
  candidates: Candidate[];
}

const shortenJobTitle = (title: string): string => {
    const replacements: { [key: string]: string } = {
        'Auxiliar de Serviços Gerais': 'Serv. Gerais',
        'Analista de Marketing': 'Marketing',
        'Analista de Recursos Humanos': 'RH',
        'Coordenador Financeiro': 'Financeiro',
        'Coordenador Administrativo': 'Admin.',
    };
    return replacements[title] || title;
};

const KPI_Card: React.FC<{ icon: React.ReactNode; title: string; value: string; color: string; }> = ({ icon, title, value, color }) => (
    <div className="bg-light-background dark:bg-background p-4 rounded-lg flex items-center gap-4 border-l-4" style={{ borderColor: color }}>
        <div className="flex-shrink-0" style={{ color: color }}>
            {icon}
        </div>
        <div>
            <p className="text-3xl font-bold text-light-text-primary dark:text-text-primary">{value}<span className="text-xl">%</span></p>
            <p className="text-sm font-semibold text-light-text-secondary dark:text-text-secondary">{title}</p>
        </div>
    </div>
);

const SimpleMarkdownRenderer: React.FC<{ text: string }> = ({ text }) => {
    const lines = text.split('\n');
    return (
        <div>
            {lines.map((line, i) => {
                if (line.trim().startsWith('* ') || line.trim().startsWith('- ')) {
                    return <li key={i} className="ml-4 list-disc">{line.trim().substring(2)}</li>;
                }
                const parts = line.split('**');
                return (
                    <p key={i}>
                        {parts.map((part, j) => 
                            j % 2 === 1 ? <strong key={j}>{part}</strong> : <span key={j}>{part}</span>
                        )}
                    </p>
                );
            })}
        </div>
    );
};


const Dashboard: React.FC<DashboardProps> = ({ jobs, candidates }) => {
  const [jobFilter, setJobFilter] = useState<string>('all');
  const [departmentFilter, setDepartmentFilter] = useState<string>('all');
  const [sourceFilter, setSourceFilter] = useState<string>('all');
  const [aiQuery, setAiQuery] = useState('');
  const [aiResponse, setAiResponse] = useState<string | null>(null);
  const [isLoadingAI, setIsLoadingAI] = useState(false);
  const [aiError, setAiError] = useState<string | null>(null);
  const [isExportMenuOpen, setIsExportMenuOpen] = useState(false);
  const exportMenuRef = useRef<HTMLDivElement>(null);
  
  useEffect(() => {
    const handleClickOutside = (event: MouseEvent) => {
      if (exportMenuRef.current && !exportMenuRef.current.contains(event.target as Node)) {
        setIsExportMenuOpen(false);
      }
    };
    document.addEventListener("mousedown", handleClickOutside);
    return () => {
      document.removeEventListener("mousedown", handleClickOutside);
    };
  }, [exportMenuRef]);

  // First, get a list of active job IDs to filter out candidates from archived jobs
  const activeJobIds = useMemo(() => {
    return new Set(jobs.filter(job => job.status !== 'archived').map(job => job.id));
  }, [jobs]);

  // Then, pre-filter candidates to only include those from active jobs
  const candidatesFromActiveJobs = useMemo(() => {
    return candidates.filter(candidate => activeJobIds.has(candidate.jobId));
  }, [candidates, activeJobIds]);


  const filteredCandidates = useMemo(() => {
    // Now, apply the UI filters to the pre-filtered list of candidates
    return candidatesFromActiveJobs.filter(c => 
      (jobFilter === 'all' || c.jobId === jobFilter) &&
      (departmentFilter === 'all' || jobs.find(j => j.id === c.jobId)?.department === departmentFilter) &&
      (sourceFilter === 'all' || c.source === sourceFilter)
    );
  }, [candidatesFromActiveJobs, jobs, jobFilter, departmentFilter, sourceFilter]);

  const departments = useMemo(() => [...new Set(jobs.map(j => j.department))], [jobs]);
  
  const sources = useMemo(() => {
    const dynamicSources = new Set(candidates.map(c => c.source).filter(Boolean));
    dynamicSources.add('Portal de Carreiras'); // Ensure this option is always present
    return Array.from(dynamicSources).sort();
  }, [candidates]);
  
  const kpiData = useMemo(() => {
    const total = filteredCandidates.length;
    if (total === 0) return { approvalRate: 0, conversionRate: 0, rejectionRate: 0 };
    
    const approvedCount = filteredCandidates.filter(c => c.status === 'approved' || c.status === 'hired').length;
    const hiredCount = filteredCandidates.filter(c => c.status === 'hired').length;
    const rejectedCount = filteredCandidates.filter(c => c.status === 'rejected').length;

    return {
        approvalRate: (approvedCount / total) * 100,
        conversionRate: (hiredCount / total) * 100,
        rejectionRate: (rejectedCount / total) * 100,
    };
  }, [filteredCandidates]);

  const aiInsights = useMemo(() => {
    const insights = [];

    // Insight 1: Distance for Chapeiro
    const chapeiroJob = jobs.find(j => j.id === 'ch-01');
    if (chapeiroJob) {
        const chapeiroCandidates = candidatesFromActiveJobs.filter(c => c.jobId === 'ch-01');
        const totalChapeiro = chapeiroCandidates.length;
        if (totalChapeiro > 5) {
            const farCandidates = chapeiroCandidates.filter(c => !c.location.includes('km')).length;
            const farPercentage = (farCandidates / totalChapeiro) * 100;
            if (farPercentage > 60) {
                insights.push(`Percebi que ${farPercentage.toFixed(0)}% dos candidatos à vaga de Chapeiro moram a mais de 10 km do local. Sugerimos incluir ‘vale transporte integral’ na descrição.`);
            }
        }
    }

    // Insight 2: Experience for Marketing
    const marketingJob = jobs.find(j => j.id === 'mkt-01');
    if (marketingJob) {
        const marketingCandidates = candidatesFromActiveJobs.filter(c => c.jobId === 'mkt-01');
        const totalMarketing = marketingCandidates.length;
        if (totalMarketing > 5) {
            const highEduLowExp = marketingCandidates.filter(c => 
                c.education.toLowerCase().includes('superior') &&
                (c.experience.toLowerCase().includes('1 ano') || c.experience.toLowerCase().includes('2 anos'))
            ).length;
            const highEduLowExpPercentage = (highEduLowExp / totalMarketing) * 100;
            if (highEduLowExpPercentage > 50) {
                insights.push(`A vaga de Analista de Marketing tem muitos candidatos com formação superior, mas sem experiência. Considere reduzir o requisito de tempo mínimo de atuação.`);
            }
        }
    }

    if (insights.length === 0) {
        insights.push("Nossos sistemas estão analisando os dados em busca de novos insights para otimizar seu processo. Volte em breve!");
    }

    return insights;
  }, [jobs, candidatesFromActiveJobs]);

  const handleAskAI = async () => {
    if (!aiQuery.trim()) return;
    setIsLoadingAI(true);
    setAiResponse(null);
    setAiError(null);

    const response = await getAIResponseForChat(aiQuery, jobs, filteredCandidates);
    
    if (response) {
        setAiResponse(response);
    } else {
        setAiError("Não foi possível obter uma resposta. Tente novamente.");
    }

    setIsLoadingAI(false);
  };

  const handleExport = (format: 'csv' | 'json') => {
    const data = filteredCandidates;
    if (data.length === 0) {
        alert("Nenhum dado para exportar com os filtros atuais.");
        setIsExportMenuOpen(false);
        return;
    }

    const jobMap = new Map(jobs.map(job => [job.id, job.title]));
    const date = new Date().toISOString().split('T')[0];
    let fileContent: string;
    let fileName: string;
    let mimeType: string;

    if (format === 'csv') {
        const headers = ['ID', 'Nome', 'Idade', 'Status', 'Vaga', 'Data Inscrição', 'Origem', 'Email', 'Telefone'];
        
        const escapeCSV = (field: any) => {
            const str = String(field);
            if (str.includes(',') || str.includes('"') || str.includes('\n')) {
                return `"${str.replace(/"/g, '""')}"`;
            }
            return str;
        };

        const rows = data.map(c => [
            c.id,
            c.name,
            c.age,
            c.status,
            jobMap.get(c.jobId) || 'N/A',
            new Date(c.applicationDate).toLocaleDateString('pt-BR'),
            c.source,
            c.resume.contact.email,
            c.resume.contact.phone
        ].map(escapeCSV).join(','));

        fileContent = [headers.join(','), ...rows].join('\n');
        fileName = `dashboard_dados_${date}.csv`;
        mimeType = 'text/csv;charset=utf-8;';
    } else { // JSON
        const dataToExport = data.map(c => ({
            ...c,
            jobTitle: jobMap.get(c.jobId) || 'N/A'
        }));
        fileContent = JSON.stringify(dataToExport, null, 2);
        fileName = `dashboard_dados_${date}.json`;
        mimeType = 'application/json;charset=utf-8;';
    }

    const blob = new Blob([`\uFEFF${fileContent}`], { type: mimeType });
    const link = document.createElement('a');
    const url = URL.createObjectURL(blob);
    link.setAttribute('href', url);
    link.setAttribute('download', fileName);
    link.style.visibility = 'hidden';
    document.body.appendChild(link);
    link.click();
    document.body.removeChild(link);
    URL.revokeObjectURL(url);
    setIsExportMenuOpen(false);
  };
  
  const handleExportPDF = () => {
    const originalTitle = document.title;
    document.title = 'dashboard_lacoste_burger';
    window.print();
    setTimeout(() => {
        document.title = originalTitle;
    }, 500);
    setIsExportMenuOpen(false);
  };


  const candidatesByJobData = useMemo(() => {
      return jobs.filter(j => j.status === 'active').map(job => {
        const jobCandidates = filteredCandidates.filter(c => c.jobId === job.id);
        return {
          name: shortenJobTitle(job.title),
          Candidatos: jobCandidates.length,
          Aprovados: jobCandidates.filter(c => c.status === 'approved' || c.status === 'hired').length,
          Rejeitados: jobCandidates.filter(c => c.status === 'rejected').length,
        };
      }).filter(j => j.Candidatos > 0);
    }, [jobs, filteredCandidates]);

  const statusDistributionData = useMemo(() => {
    const statusCounts = filteredCandidates.reduce((acc, c) => {
        const status = c.status || 'pending';
        if (status === 'approved' || status === 'hired') {
            acc['Aprovados'] = (acc['Aprovados'] || 0) + 1;
        } else if (status === 'rejected') {
            acc['Rejeitados'] = (acc['Rejeitados'] || 0) + 1;
        } else {
            acc['Pendentes'] = (acc['Pendentes'] || 0) + 1;
        }
        return acc;
    }, {} as Record<string, number>);

    return [
      { name: 'Aprovados', value: statusCounts.Aprovados || 0 },
      { name: 'Pendentes', value: statusCounts.Pendentes || 0 },
      { name: 'Rejeitados', value: statusCounts.Rejeitados || 0 },
    ];
  }, [filteredCandidates]);
  
  const STATUS_COLORS = ['#2DD4BF', '#FBBF24', '#F87171']; // Teal, Yellow, Red

  const educationDistributionData = useMemo(() => {
    const educationCounts: Record<string, number> = {
        'Fundamental': 0,
        'Médio': 0,
        'Técnico': 0,
        'Superior': 0,
    };
    filteredCandidates.forEach(c => {
        const edu = (c.education || '').toLowerCase();
        if (edu.includes('superior')) {
            educationCounts['Superior']++;
        } else if (edu.includes('técnico')) {
            educationCounts['Técnico']++;
        } else if (edu.includes('médio')) {
            educationCounts['Médio']++;
        } else if (edu.includes('fundamental')) {
            educationCounts['Fundamental']++;
        }
    });
    
    return Object.entries(educationCounts)
        .map(([name, value]) => ({ name, value }))
        .filter(d => d.value > 0);
  }, [filteredCandidates]);
  
  const ageDistributionData = useMemo(() => {
    const ageBrackets: Record<string, number> = {
        '18-24': 0,
        '25-34': 0,
        '35-44': 0,
        '45+': 0,
    };
    filteredCandidates.forEach(c => {
        if (c.age >= 18 && c.age <= 24) ageBrackets['18-24']++;
        else if (c.age >= 25 && c.age <= 34) ageBrackets['25-34']++;
        else if (c.age >= 35 && c.age <= 44) ageBrackets['35-44']++;
        else if (c.age >= 45) ageBrackets['45+']++;
    });
    return Object.entries(ageBrackets).map(([name, value]) => ({ name, value }));
  }, [filteredCandidates]);

  const conversionFunnelData = useMemo(() => {
    return jobs
      .filter(j => j.status === 'active')
      .map(job => {
        const jobCandidates = filteredCandidates.filter(c => c.jobId === job.id);
        const totalCandidates = jobCandidates.length;
        const interviewedCandidates = jobCandidates.filter(c => c.interview).length;
        
        if (totalCandidates === 0) {
            return null;
        }

        return {
          name: shortenJobTitle(job.title),
          'Entrevistados': interviewedCandidates,
          'Não Chegaram à Entrevista': totalCandidates - interviewedCandidates,
        };
      })
      .filter(Boolean);
  }, [jobs, filteredCandidates]);


  return (
    <div>
      <div className="mb-8 no-print">
        <h1 className="text-3xl font-bold text-light-text-primary dark:text-text-primary mb-2">Análises e Métricas</h1>
        <p className="text-light-text-secondary dark:text-text-secondary">Visualize o desempenho do seu processo de seleção</p>
      </div>

       {/* Filters */}
       <div className="grid grid-cols-1 md:grid-cols-4 gap-4 mb-8 p-4 bg-light-surface dark:bg-surface rounded-xl border border-light-border dark:border-border no-print">
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
          <div>
            <label className="text-xs font-semibold text-light-text-secondary dark:text-text-secondary">Origem</label>
            <select onChange={(e) => setSourceFilter(e.target.value)} value={sourceFilter} className="w-full mt-1 bg-light-background dark:bg-background border border-light-border dark:border-border rounded-lg px-3 py-2 text-light-text-primary dark:text-text-primary focus:outline-none focus:ring-2 focus:ring-light-primary dark:focus:ring-primary">
              <option value="all">Todas</option>
              {sources.map(s => <option key={s} value={s}>{s}</option>)}
            </select>
          </div>
          <div className="flex items-end gap-2">
            <button 
                type="button"
                onClick={() => { setDepartmentFilter('all'); setJobFilter('all'); setSourceFilter('all'); }} 
                className="w-full mt-1 bg-light-background dark:bg-background border border-light-border dark:border-border rounded-lg px-3 py-2 text-light-text-secondary dark:text-text-secondary hover:text-light-text-primary dark:hover:text-text-primary hover:border-light-text-secondary dark:hover:border-text-secondary transition-colors"
            >
                Limpar Filtros
            </button>
             <div className="relative" ref={exportMenuRef}>
                <button 
                    type="button"
                    onClick={() => setIsExportMenuOpen(prev => !prev)}
                    className="mt-1 flex items-center justify-center gap-2 bg-light-primary dark:bg-primary border border-transparent rounded-lg px-2.5 py-1.5 text-sm text-white dark:text-background font-semibold hover:bg-light-primary-hover dark:hover:bg-primary-hover transition-colors"
                >
                    <svg xmlns="http://www.w3.org/2000/svg" width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2.5" strokeLinecap="round" strokeLinejoin="round"><path d="M21 15v4a2 2 0 0 1-2 2H5a2 2 0 0 1-2-2v-4"/><polyline points="7 10 12 15 17 10"/><line x1="12" y1="15" x2="12" y2="3"/></svg>
                    Exportar
                </button>
                {isExportMenuOpen && (
                    <div className="absolute top-full right-0 mt-2 w-56 bg-light-surface dark:bg-surface rounded-md shadow-lg border border-light-border dark:border-border z-10 py-1">
                        <button onClick={() => handleExport('csv')} className="w-full text-left px-4 py-2 text-sm text-light-text-primary dark:text-text-primary hover:bg-light-background dark:hover:bg-background">
                            Exportar como CSV
                        </button>
                        <button onClick={() => handleExport('json')} className="w-full text-left px-4 py-2 text-sm text-light-text-primary dark:text-text-primary hover:bg-light-background dark:hover:bg-background">
                            Exportar como JSON
                        </button>
                         <button onClick={handleExportPDF} className="w-full text-left px-4 py-2 text-sm text-light-text-primary dark:text-text-primary hover:bg-light-background dark:hover:bg-background">
                            Exportar como PDF (Screenshot)
                        </button>
                    </div>
                )}
            </div>
          </div>
        </div>
      
        {/* AI Insights & KPIs */}
        <div className="mb-8 grid grid-cols-1 lg:grid-cols-2 gap-8">
            <div className="bg-light-surface dark:bg-surface rounded-xl shadow-lg p-6 border border-light-border dark:border-border">
                <h2 className="text-xl font-bold text-light-text-primary dark:text-text-primary mb-4">Métricas Chave</h2>
                <div className="space-y-4">
                    <KPI_Card 
                        icon={<svg xmlns="http://www.w3.org/2000/svg" width="32" height="32" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round"><path d="M22 11.08V12a10 10 0 1 1-5.93-9.14"></path><polyline points="22 4 12 14.01 9 11.01"></polyline></svg>}
                        title="Candidatos aprovados na triagem"
                        value={kpiData.approvalRate.toFixed(1)}
                        color="#2DD4BF"
                    />
                     <KPI_Card 
                        icon={<svg xmlns="http://www.w3.org/2000/svg" width="32" height="32" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round"><circle cx="12" cy="12" r="10"></circle><circle cx="12" cy="12" r="6"></circle><circle cx="12" cy="12" r="2"></circle></svg>}
                        title="Taxa de conversão (Contratados)"
                        value={kpiData.conversionRate.toFixed(1)}
                        color="#4F46E5"
                    />
                     <KPI_Card 
                        icon={<svg xmlns="http://www.w3.org/2000/svg" width="32" height="32" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round"><circle cx="12" cy="12" r="10"></circle><line x1="15" y1="9" x2="9" y2="15"></line><line x1="9" y1="9" x2="15" y2="15"></line></svg>}
                        title="Taxa de rejeição na triagem"
                        value={kpiData.rejectionRate.toFixed(1)}
                        color="#F87171"
                    />
                </div>
            </div>
             <div className="bg-light-surface dark:bg-surface rounded-xl shadow-lg p-6 border border-light-border dark:border-border flex flex-col">
                <h2 className="text-xl font-bold text-light-text-primary dark:text-text-primary mb-4 flex items-center gap-2">
                    <svg xmlns="http://www.w3.org/2000/svg" className="text-light-primary dark:text-primary" width="24" height="24" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round"><path d="m12 3-1.912 5.813a2 2 0 0 1-1.275 1.275L3 12l5.813 1.912a2 2 0 0 1 1.275 1.275L12 21l1.912-5.813a2 2 0 0 1 1.275-1.275L21 12l-5.813-1.912a2 2 0 0 1-1.275-1.275L12 3Z"/></svg>
                    Lacostinho
                </h2>
                <div className="space-y-3 mb-4">
                    {aiInsights.map((insight, index) => (
                        <div key={index} className="bg-light-primary/10 dark:bg-primary/10 p-4 rounded-lg text-sm text-light-primary dark:text-primary border-l-4 border-light-primary dark:border-primary">
                            <p>{insight}</p>
                        </div>
                    ))}
                </div>
                <div className="mt-auto pt-4 border-t border-light-border dark:border-border no-print">
                    <label className="text-sm font-semibold text-light-text-secondary dark:text-text-secondary">Faça uma pergunta sobre os dados</label>
                    <div className="flex gap-2 mt-1">
                        <input 
                            type="text"
                            value={aiQuery}
                            onChange={(e) => setAiQuery(e.target.value)}
                            onKeyPress={(e) => e.key === 'Enter' && handleAskAI()}
                            placeholder="Ex: Quantos candidatos temos para Chapeiro?"
                            className="w-full bg-light-background dark:bg-background border border-light-border dark:border-border rounded-lg px-3 py-2 text-sm focus:outline-none focus:ring-2 focus:ring-light-primary dark:focus:ring-primary"
                        />
                        <button onClick={handleAskAI} disabled={isLoadingAI} className="bg-light-primary dark:bg-primary text-white font-bold px-4 py-2 rounded-lg hover:bg-light-primary-hover dark:hover:bg-primary-hover disabled:bg-gray-500">
                            {isLoadingAI ? '...' : 'Perguntar'}
                        </button>
                    </div>
                     <div className="mt-3 text-sm min-h-[60px]">
                        {isLoadingAI && <p className="text-center text-light-text-secondary dark:text-text-secondary">Analisando...</p>}
                        {aiError && <p className="text-red-500">{aiError}</p>}
                        {aiResponse && <div className="p-3 bg-light-background dark:bg-background rounded-md text-light-text-primary dark:text-text-primary"><SimpleMarkdownRenderer text={aiResponse} /></div>}
                     </div>
                </div>
            </div>
        </div>

      <div className="grid grid-cols-1 lg:grid-cols-2 gap-8 mb-8">
        <div className="bg-light-surface dark:bg-surface rounded-xl shadow-lg p-6 border border-light-border dark:border-border chart-wrapper">
          <h2 className="text-xl font-bold text-light-text-primary dark:text-text-primary mb-4">Candidatos por Vaga</h2>
          <ResponsiveContainer width="100%" height={300}>
            <BarChart data={candidatesByJobData} margin={{ top: 5, right: 20, left: -10, bottom: 20 }}>
              <CartesianGrid strokeDasharray="3 3" stroke="var(--color-border)" />
              <XAxis 
                dataKey="name" 
                stroke="var(--color-text-secondary)" 
                tick={{ fill: 'currentColor', fontSize: 12 }} 
                interval={0} 
              />
              <YAxis stroke="var(--color-text-secondary)" tick={{ fill: 'currentColor' }}/>
              <Tooltip content={<CustomTooltip />} cursor={{fill: 'rgba(45, 212, 191, 0.1)'}} />
              <Legend wrapperStyle={{ color: 'var(--color-text-primary)' }}/>
              <Bar dataKey="Candidatos" fill="#4F46E5" />
              <Bar dataKey="Aprovados" fill="#2DD4BF" />
              <Bar dataKey="Rejeitados" fill="#F87171" />
            </BarChart>
          </ResponsiveContainer>
        </div>

        <div className="bg-light-surface dark:bg-surface rounded-xl shadow-lg p-6 border border-light-border dark:border-border chart-wrapper">
          <h2 className="text-xl font-bold text-light-text-primary dark:text-text-primary mb-4">Status das Candidaturas</h2>
          <ResponsiveContainer width="100%" height={300}>
            <PieChart>
              <Pie
                data={statusDistributionData}
                cx="50%"
                cy="50%"
                labelLine={false}
                outerRadius={110}
                fill="#8884d8"
                dataKey="value"
                nameKey="name"
              >
                {statusDistributionData.map((entry, index) => (
                  <Cell key={`cell-${index}`} fill={STATUS_COLORS[index % STATUS_COLORS.length]} />
                ))}
              </Pie>
              <Tooltip content={<CustomTooltip />} />
              <Legend wrapperStyle={{ color: 'var(--color-text-primary)' }}/>
            </PieChart>
          </ResponsiveContainer>
        </div>
      </div>

      <div className="grid grid-cols-1 lg:grid-cols-2 gap-8 mb-8">
        <div className="bg-light-surface dark:bg-surface rounded-xl shadow-lg p-6 border border-light-border dark:border-border chart-wrapper">
          <h2 className="text-xl font-bold text-light-text-primary dark:text-text-primary mb-4">Escolaridade dos Candidatos</h2>
          <ResponsiveContainer width="100%" height={300}>
            <BarChart data={educationDistributionData} margin={{ top: 5, right: 20, left: -10, bottom: 5 }}>
              <CartesianGrid strokeDasharray="3 3" stroke="var(--color-border)"/>
              <XAxis dataKey="name" stroke="var(--color-text-secondary)" tick={{ fill: 'currentColor', fontSize: 12 }} />
              <YAxis stroke="var(--color-text-secondary)" tick={{ fill: 'currentColor' }}/>
              <Tooltip content={<CustomTooltip />} cursor={{fill: 'rgba(45, 212, 191, 0.1)'}}/>
              <Legend wrapperStyle={{ color: 'var(--color-text-primary)' }}/>
              <Bar dataKey="value" fill="#A78BFA" name="Quantidade"/>
            </BarChart>
          </ResponsiveContainer>
        </div>

        <div className="bg-light-surface dark:bg-surface rounded-xl shadow-lg p-6 border border-light-border dark:border-border chart-wrapper">
          <h2 className="text-xl font-bold text-light-text-primary dark:text-text-primary mb-4">Faixa Etária dos Candidatos</h2>
          <ResponsiveContainer width="100%" height={300}>
            <BarChart data={ageDistributionData} margin={{ top: 5, right: 20, left: -10, bottom: 5 }}>
              <CartesianGrid strokeDasharray="3 3" stroke="var(--color-border)"/>
              <XAxis dataKey="name" stroke="var(--color-text-secondary)" tick={{ fill: 'currentColor', fontSize: 12 }}/>
              <YAxis stroke="var(--color-text-secondary)" tick={{ fill: 'currentColor' }}/>
              <Tooltip content={<CustomTooltip />} cursor={{fill: 'rgba(45, 212, 191, 0.1)'}}/>
              <Legend wrapperStyle={{ color: 'var(--color-text-primary)' }}/>
              <Bar dataKey="value" fill="#FBBF24" name="Quantidade"/>
            </BarChart>
          </ResponsiveContainer>
        </div>
      </div>

      <div className="bg-light-surface dark:bg-surface rounded-xl shadow-lg p-6 border border-light-border dark:border-border chart-wrapper">
          <h2 className="text-xl font-bold text-light-text-primary dark:text-text-primary mb-4">Funil de Conversão para Entrevista</h2>
           <ResponsiveContainer width="100%" height={350}>
            <BarChart data={conversionFunnelData} margin={{ top: 5, right: 20, left: -10, bottom: 20 }}>
              <CartesianGrid strokeDasharray="3 3" stroke="var(--color-border)" />
              <XAxis dataKey="name" stroke="var(--color-text-secondary)" tick={{ fill: 'currentColor', fontSize: 12 }} interval={0} />
              <YAxis stroke="var(--color-text-secondary)" tick={{ fill: 'currentColor' }} />
              <Tooltip content={<CustomConversionTooltip />} cursor={{ fill: 'rgba(45, 212, 191, 0.1)' }} />
              <Legend wrapperStyle={{ color: 'var(--color-text-primary)' }} />
              <Bar dataKey="Entrevistados" stackId="a" fill="#2DD4BF" />
              <Bar dataKey="Não Chegaram à Entrevista" stackId="a" fill="#4B5563" />
            </BarChart>
          </ResponsiveContainer>
        </div>
    </div>
  )
}

export default Dashboard;