import React, { useState, useMemo } from 'react';
import { Candidate, Job, User, CandidateInterview, Dynamic, ActiveDynamicTimer } from '../../types';
import InitialsAvatar from '../common/InitialsAvatar';
import InterviewSchedulerModal from './InterviewSchedulerModal';
import InterviewFeedbackModal from './InterviewFeedbackModal';
import InterviewReports from './InterviewReports';
import DynamicsView from './DynamicsView';

interface ScheduleViewProps {
    candidates: Candidate[];
    jobs: Job[];
    users: User[];
    onUpdateCandidate: (candidate: Candidate, oldStatus?: Candidate['status']) => void;
    onBulkCancelInterviews: (candidateIds: string[]) => void;
    onOpenMessaging: (candidateId: string) => void,
    dynamics: Dynamic[];
    onAddDynamic: (dynamic: Omit<Dynamic, 'id'>) => void;
    onUpdateDynamic: (dynamic: Dynamic) => void;
    onDeleteDynamic: (dynamicId: string) => void;
    activeDynamicTimer: ActiveDynamicTimer | null;
    onStartDynamicTimer: (dynamicId: string, durationMinutes: number, mode: 'countdown' | 'countup') => void;
    onPauseDynamicTimer: () => void;
    onResumeDynamicTimer: () => void;
    onResetDynamicTimer: (dynamicId: string) => void;
}

const CalendarView: React.FC<{ 
    interviewsByDate: Map<string, Candidate[]>, 
    currentDate: Date, 
    setCurrentDate: (date: Date) => void,
    onCancel: (id: string) => void,
    onEdit: (candidate: Candidate) => void,
    onOpenFeedback: (candidate: Candidate) => void,
    onOpenMessaging: (candidateId: string) => void,
    selectedDateKey: string | null,
    onDateSelect: (key: string | null) => void,
    jobMap: Map<string, string>,
    onBulkCancel: (ids: string[]) => void,
}> = ({ 
    interviewsByDate, 
    currentDate, 
    setCurrentDate, 
    onCancel, 
    onEdit, 
    onOpenFeedback,
    onOpenMessaging,
    selectedDateKey, 
    onDateSelect, 
    jobMap,
    onBulkCancel,
}) => {
    
    const startOfMonth = new Date(currentDate.getFullYear(), currentDate.getMonth(), 1);
    const endOfMonth = new Date(currentDate.getFullYear(), currentDate.getMonth() + 1, 0);
    const startDate = new Date(startOfMonth);
    startDate.setDate(startDate.getDate() - startOfMonth.getDay());
    
    const days: Date[] = [];
    for (let i = 0; i < 42; i++) {
        days.push(new Date(startDate));
        startDate.setDate(startDate.getDate() + 1);
    }
    
    const isToday = (date: Date) => {
        const today = new Date();
        return date.getDate() === today.getDate() &&
               date.getMonth() === today.getMonth() &&
               date.getFullYear() === today.getFullYear();
    };

    const weeks: Date[][] = [];
    for (let i = 0; i < days.length; i += 7) {
        weeks.push(days.slice(i, i + 7));
    }

    const handleDateClick = (dateKey: string, hasInterviews: boolean) => {
        if (!hasInterviews) return;
        onDateSelect(selectedDateKey === dateKey ? null : dateKey);
    };

    const handleBulkCancelClick = () => {
        const interviewsForDay = interviewsByDate.get(selectedDateKey!) || [];
        const ids = interviewsForDay.map(i => i.id);
        if (ids.length > 0) {
            onBulkCancel(ids);
            onDateSelect(null); // Close the expanded view
        }
    };

    return (
        <div className="bg-light-surface dark:bg-surface rounded-xl border border-light-border dark:border-border p-4">
            <div className="flex justify-between items-center mb-4 px-2">
                <button onClick={() => setCurrentDate(new Date(currentDate.setMonth(currentDate.getMonth() - 1)))} className="p-2 rounded-full hover:bg-light-background dark:hover:bg-background">&lt;</button>
                <h2 className="text-xl font-bold text-light-text-primary dark:text-text-primary">{currentDate.toLocaleString('pt-BR', { month: 'long', year: 'numeric' })}</h2>
                <button onClick={() => setCurrentDate(new Date(currentDate.setMonth(currentDate.getMonth() + 1)))} className="p-2 rounded-full hover:bg-light-background dark:hover:bg-background">&gt;</button>
            </div>
            <div className="grid grid-cols-7 gap-1 text-center text-xs font-semibold text-light-text-secondary dark:text-text-secondary mb-2">
                {['Dom', 'Seg', 'Ter', 'Qua', 'Qui', 'Sex', 'Sáb'].map(day => <div key={day}>{day}</div>)}
            </div>
            <div className="grid grid-cols-7 gap-1">
                {weeks.map((week, weekIndex) => (
                    <React.Fragment key={weekIndex}>
                        {week.map(day => {
                            const dateKey = day.toISOString().split('T')[0];
                            const interviews = interviewsByDate.get(dateKey) || [];
                            const isCurrentMonth = day.getMonth() === currentDate.getMonth();
                            const hasInterviews = interviews.length > 0;
                            
                            return (
                                <div 
                                    key={dateKey} 
                                    onClick={() => handleDateClick(dateKey, hasInterviews)}
                                    className={`relative h-32 p-2 border border-light-border/50 dark:border-border/50 rounded-md overflow-hidden transition-colors
                                        ${isCurrentMonth ? 'bg-light-surface dark:bg-surface' : 'bg-light-background/50 dark:bg-background/50'}
                                        ${hasInterviews ? 'cursor-pointer hover:bg-light-background dark:hover:bg-background' : ''}
                                        ${selectedDateKey === dateKey ? 'border-2 border-light-primary dark:border-primary' : ''}
                                    `}
                                >
                                    <div className={`text-sm font-semibold ${isToday(day) ? 'bg-light-primary text-white rounded-full w-6 h-6 flex items-center justify-center' : ''} ${!isCurrentMonth ? 'text-light-text-secondary/50 dark:text-text-secondary/50' : ''}`}>
                                        {day.getDate()}
                                    </div>
                                    <div className="overflow-y-auto max-h-20 space-y-1 mt-1 text-left">
                                        {interviews.map(interview => (
                                            <div key={interview.id} className="text-xs bg-light-primary/10 dark:bg-primary/10 p-1 rounded">
                                                <p className="font-semibold text-light-primary dark:text-primary truncate">{interview.interview?.time} - {interview.name}</p>
                                            </div>
                                        ))}
                                    </div>
                                </div>
                            );
                        })}
                        
                        {selectedDateKey && week.some(day => day.toISOString().split('T')[0] === selectedDateKey) && (
                            <div className="col-span-7 p-4 bg-light-background dark:bg-background rounded-md my-1 animate-fade-in border border-light-primary/30 dark:border-primary/30">
                                <div className="flex justify-between items-center">
                                    <h3 className="font-bold text-lg text-light-primary dark:text-primary">
                                        Agendamentos para {new Date(selectedDateKey + 'T00:00:00').toLocaleDateString('pt-BR', { weekday: 'long', day: '2-digit', month: 'long' })}
                                    </h3>
                                    <div className="flex items-center gap-2">
                                        <button onClick={handleBulkCancelClick} className="text-xs font-semibold text-red-500 hover:text-red-700 bg-red-500/10 hover:bg-red-500/20 px-3 py-1.5 rounded-md transition-colors">Cancelar Agendamentos do Dia</button>
                                        <button onClick={() => onDateSelect(null)} className="text-light-text-secondary dark:text-text-secondary hover:text-light-text-primary dark:hover:text-text-primary text-2xl">&times;</button>
                                    </div>
                                </div>
                                <div className="mt-4 grid grid-cols-1 lg:grid-cols-2 gap-3 max-h-80 overflow-y-auto pr-2">
                                    {(interviewsByDate.get(selectedDateKey) || []).length > 0 ?
                                        (interviewsByDate.get(selectedDateKey) || []).sort((a, b) => (a.interview?.time || '').localeCompare(b.interview?.time || '')).map(interview => {
                                            if (!interview.interview) return null;
                                            const isPast = new Date() > new Date(`${interview.interview.date}T${interview.interview.time}`);
                                            return (
                                                <div key={interview.id} className="bg-light-surface dark:bg-surface rounded-lg border border-light-border dark:border-border p-3 flex gap-4 items-start group transition-shadow hover:shadow-md">
                                                    <div className="flex-shrink-0 text-center bg-light-background dark:bg-background rounded-md p-2 w-20">
                                                        <p className="text-xl font-bold text-light-primary dark:text-primary">{interview.interview.time}</p>
                                                        <p className={`text-xs font-semibold ${isPast ? 'text-green-500' : 'text-blue-500'}`}>{isPast ? 'Realizada' : 'Agendada'}</p>
                                                    </div>

                                                    <div className="flex-grow min-w-0">
                                                        <div className="flex items-center gap-2">
                                                        <div className="w-6 h-6 flex-shrink-0"><InitialsAvatar name={interview.name} /></div>
                                                        <p className="font-bold text-light-text-primary dark:text-text-primary truncate">{interview.name}</p>
                                                        </div>
                                                        <p className="text-sm text-light-text-secondary dark:text-text-secondary truncate">{jobMap.get(interview.jobId)}</p>
                                                        <p className="text-xs text-light-text-secondary dark:text-text-secondary mt-1 truncate">
                                                            com {interview.interview.interviewers.join(', ')}
                                                        </p>
                                                        {interview.interview.noShow && (
                                                            <span className="mt-2 inline-block bg-yellow-400/10 text-yellow-500 text-xs font-bold px-2 py-0.5 rounded-full border border-yellow-400/20">
                                                                Não Compareceu
                                                            </span>
                                                        )}
                                                    </div>

                                                    <div className="flex flex-col gap-1.5 opacity-0 group-hover:opacity-100 transition-opacity">
                                                        <button title="Iniciar Conversa" type="button" onClick={(e) => { e.stopPropagation(); onOpenMessaging(interview.id); }} className="p-1.5 rounded-full bg-blue-500/10 hover:bg-blue-500/20 text-blue-500"><svg xmlns="http://www.w3.org/2000/svg" width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2.5" strokeLinecap="round" strokeLinejoin="round"><path d="M21 15a2 2 0 0 1-2 2H7l-4 4V5a2 2 0 0 1 2-2h14a2 2 0 0 1 2 2z"></path></svg></button>
                                                        {isPast && !interview.interview.noShow ? (
                                                            <button title="Adicionar Feedback" type="button" onClick={(e) => { e.stopPropagation(); onOpenFeedback(interview); }} className="p-1.5 rounded-full bg-light-primary/10 hover:bg-light-primary/20 text-light-primary"><svg xmlns="http://www.w3.org/2000/svg" width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2.5" strokeLinecap="round" strokeLinejoin="round"><path d="M12 20h9"/><path d="M16.5 3.5a2.121 2.121 0 0 1 3 3L7 19l-4 1 1-4L16.5 3.5z"/></svg></button>
                                                        ) : !isPast && (
                                                            <button title="Editar" type="button" onClick={(e) => { e.stopPropagation(); onEdit(interview); }} className="p-1.5 rounded-full bg-light-secondary/10 hover:bg-light-secondary/20 text-light-secondary"><svg xmlns="http://www.w3.org/2000/svg" width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2.5" strokeLinecap="round" strokeLinejoin="round"><path d="M17 3a2.828 2.828 0 1 1 4 4L7.5 20.5 2 22l1.5-5.5L17 3z"></path></svg></button>
                                                        )}
                                                        {!isPast && (
                                                        <button title="Cancelar" type="button" onClick={(e) => { e.stopPropagation(); onCancel(interview.id); }} className="p-1.5 rounded-full bg-red-500/10 hover:bg-red-500/20 text-red-500"><svg xmlns="http://www.w3.org/2000/svg" width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2.5" strokeLinecap="round" strokeLinejoin="round"><path d="M18 6 6 18"/><path d="m6 6 12 12"/></svg></button>
                                                        )}
                                                    </div>
                                                </div>
                                            )
                                        })
                                        : <p className="text-center text-light-text-secondary dark:text-text-secondary py-8 lg:col-span-2">Nenhum agendamento para este dia.</p>
                                    }
                                </div>
                            </div>
                        )}
                    </React.Fragment>
                ))}
            </div>
        </div>
    );
};

const ListView: React.FC<{
    interviews: Candidate[],
    jobMap: Map<string, string>,
    onCancel: (id: string) => void,
    onEdit: (candidate: Candidate) => void,
    onOpenFeedback: (candidate: Candidate) => void,
    onOpenMessaging: (candidateId: string) => void,
}> = ({ interviews, jobMap, onCancel, onEdit, onOpenFeedback, onOpenMessaging }) => (
    <div className="bg-light-surface dark:bg-surface rounded-xl border border-light-border dark:border-border overflow-hidden">
        <div className="overflow-x-auto">
            <table className="w-full text-sm text-left text-light-text-secondary dark:text-text-secondary">
                 <thead className="text-xs text-light-text-secondary dark:text-text-secondary uppercase bg-light-background dark:bg-background">
                    <tr>
                        <th scope="col" className="px-6 py-3">Candidato</th>
                        <th scope="col" className="px-6 py-3">Vaga</th>
                        <th scope="col" className="px-6 py-3">Data & Hora</th>
                        <th scope="col" className="px-6 py-3">Entrevistador(es)</th>
                        <th scope="col" className="px-6 py-3">Status</th>
                        <th scope="col" className="px-6 py-3">Ações</th>
                    </tr>
                </thead>
                <tbody>
                    {interviews.map(candidate => {
                        if (!candidate.interview) return null;
                        const isPast = new Date() > new Date(`${candidate.interview.date}T${candidate.interview.time}`);
                        return (
                        <tr key={candidate.id} className="bg-light-surface dark:bg-surface border-b dark:border-border hover:bg-light-background dark:hover:bg-background">
                            <th scope="row" className="flex items-center px-6 py-4 text-light-text-primary dark:text-text-primary whitespace-nowrap">
                                <InitialsAvatar name={candidate.name} className="w-10 h-10 flex-shrink-0" />
                                <div className="pl-3">
                                    <div className="text-base font-semibold">{candidate.name}</div>
                                </div>  
                            </th>
                            <td className="px-6 py-4">{jobMap.get(candidate.jobId) || 'N/A'}</td>
                            <td className="px-6 py-4">
                                <div className="font-semibold">{new Date(candidate.interview.date).toLocaleDateString('pt-BR', {timeZone: 'UTC'})}</div>
                                <div className="text-xs">{candidate.interview.time}</div>
                            </td>
                            <td className="px-6 py-4">{candidate.interview.interviewers.join(', ')}</td>
                             <td className="px-6 py-4">
                                {candidate.interview.noShow ? (
                                    <span className="bg-yellow-400/10 text-yellow-500 text-xs font-bold px-2.5 py-1 rounded-full border border-yellow-400/20">Não Compareceu</span>
                                ) : isPast ? (
                                    <span className="bg-green-400/10 text-green-500 text-xs font-bold px-2.5 py-1 rounded-full border border-green-400/20">Realizada</span>
                                ) : (
                                    <span className="bg-blue-400/10 text-blue-500 text-xs font-bold px-2.5 py-1 rounded-full border border-blue-400/20">Agendada</span>
                                )}
                            </td>
                            <td className="px-6 py-4 space-x-2">
                                <button type="button" onClick={() => onOpenMessaging(candidate.id)} className="font-medium text-blue-600 dark:text-blue-400 hover:underline">Mensagem</button>
                                {isPast ? (
                                    <button type="button" onClick={() => onOpenFeedback(candidate)} className="font-medium text-light-primary dark:text-primary hover:underline">Feedback</button>
                                ) : (
                                    <button type="button" onClick={() => onEdit(candidate)} className="font-medium text-light-secondary dark:text-secondary hover:underline">Editar</button>
                                )}
                                <button type="button" onClick={() => onCancel(candidate.id)} className="font-medium text-red-600 dark:text-red-400 hover:underline">Cancelar</button>
                            </td>
                        </tr>
                    )})}
                </tbody>
            </table>
        </div>
        {interviews.length === 0 && (
            <div className="text-center py-20">
                <p className="text-light-text-secondary dark:text-text-secondary">Nenhuma entrevista encontrada com os filtros atuais.</p>
            </div>
        )}
    </div>
);

const ScheduleView: React.FC<ScheduleViewProps> = (props) => {
    const { candidates, jobs, users, onUpdateCandidate, onBulkCancelInterviews, onOpenMessaging, dynamics, onAddDynamic, onUpdateDynamic, onDeleteDynamic } = props;
    const [activeTab, setActiveTab] = useState<'agenda' | 'dinamica' | 'relatorios'>('agenda');
    const [view, setView] = useState<'calendar' | 'list'>('calendar');
    const [filterMode, setFilterMode] = useState<'upcoming' | 'past'>('upcoming');
    const [jobFilter, setJobFilter] = useState('all');
    const [interviewerFilter, setInterviewerFilter] = useState('all');
    const [currentDate, setCurrentDate] = useState(new Date());
    const [selectedDateKey, setSelectedDateKey] = useState<string | null>(null);
    const [editingCandidate, setEditingCandidate] = useState<Candidate | null>(null);
    const [feedbackCandidate, setFeedbackCandidate] = useState<Candidate | null>(null);

    const jobMap = useMemo(() => new Map(jobs.map(job => [job.id, job.title])), [jobs]);
    const jobForFeedback = useMemo(() => {
        if (!feedbackCandidate) return null;
        return jobs.find(j => j.id === feedbackCandidate.jobId) || null;
    }, [feedbackCandidate, jobs]);
    
    const recruiters = useMemo(() => users, [users]);

    const handleCancelInterview = (candidateId: string) => {
        const candidate = candidates.find(c => c.id === candidateId);
        if (candidate) {
            const updatedCandidate = { ...candidate };
            delete updatedCandidate.interview;
            updatedCandidate.status = 'approved'; 
            onUpdateCandidate(updatedCandidate);
        }
    };

    const handleSaveInterview = (candidate: Candidate, interviewDetails: CandidateInterview) => {
        onUpdateCandidate({ ...candidate, interview: interviewDetails, status: 'approved' });
        setEditingCandidate(null);
    };

    const filteredInterviews = useMemo(() => {
        const now = new Date();
        now.setHours(0, 0, 0, 0);

        return candidates
            .filter(c => {
                if (!c.interview) return false;
                const interviewDate = new Date(c.interview.date + 'T00:00:00');

                if (filterMode === 'upcoming' && interviewDate < now) return false;
                if (filterMode === 'past' && interviewDate >= now) return false;
                if (jobFilter !== 'all' && c.jobId !== jobFilter) return false;
                if (interviewerFilter !== 'all' && !c.interview.interviewers.includes(interviewerFilter)) return false;

                return true;
            })
            .map(c => ({
                ...c,
                interviewDateTime: new Date(`${c.interview!.date}T${c.interview!.time}`)
            }))
            .sort((a, b) => filterMode === 'upcoming' 
                ? a.interviewDateTime.getTime() - b.interviewDateTime.getTime()
                : b.interviewDateTime.getTime() - a.interviewDateTime.getTime()
            );
    }, [candidates, filterMode, jobFilter, interviewerFilter]);

    const interviewsByDate = useMemo(() => {
        const grouped = new Map<string, Candidate[]>();
        filteredInterviews.forEach(interview => {
            const dateKey = interview.interview!.date;
            if (!grouped.has(dateKey)) {
                grouped.set(dateKey, []);
            }
            grouped.get(dateKey)!.push(interview);
        });
        return grouped;
    }, [filteredInterviews]);

    return (
        <div>
            <div className="flex justify-between items-center mb-6">
                <h1 className="text-3xl font-bold text-light-text-primary dark:text-text-primary">Central de Entrevistas</h1>
                <div className="flex items-center gap-2">
                     <div className="bg-light-surface dark:bg-surface p-1 rounded-lg border border-light-border dark:border-border flex gap-1">
                        <button type="button" onClick={() => setActiveTab('agenda')} className={`px-3 py-1.5 text-sm font-semibold rounded-md transition-colors ${activeTab === 'agenda' ? 'bg-light-primary dark:bg-primary text-white' : 'hover:bg-light-background dark:hover:bg-background'}`}>Agenda</button>
                        <button type="button" onClick={() => setActiveTab('dinamica')} className={`px-3 py-1.5 text-sm font-semibold rounded-md transition-colors ${activeTab === 'dinamica' ? 'bg-light-primary dark:bg-primary text-white' : 'hover:bg-light-background dark:hover:bg-background'}`}>Dinâmica</button>
                        <button type="button" onClick={() => setActiveTab('relatorios')} className={`px-3 py-1.5 text-sm font-semibold rounded-md transition-colors ${activeTab === 'relatorios' ? 'bg-light-primary dark:bg-primary text-white' : 'hover:bg-light-background dark:hover:bg-background'}`}>Relatórios</button>
                    </div>
                </div>
            </div>

            {activeTab === 'agenda' && (
                <div className="animate-fade-in">
                    <div className="flex justify-between items-center mb-6">
                        <h2 className="text-2xl font-bold text-light-text-primary dark:text-text-primary">Agenda</h2>
                        <div className="flex items-center gap-2">
                            <div className="bg-light-surface dark:bg-surface p-1 rounded-lg border border-light-border dark:border-border flex gap-1">
                                <button type="button" onClick={() => setView('calendar')} className={`px-3 py-1 text-sm font-semibold rounded-md ${view === 'calendar' ? 'bg-light-primary dark:bg-primary text-white' : 'hover:bg-light-background dark:hover:bg-background'}`}>Calendário</button>
                                <button type="button" onClick={() => setView('list')} className={`px-3 py-1 text-sm font-semibold rounded-md ${view === 'list' ? 'bg-light-primary dark:bg-primary text-white' : 'hover:bg-light-background dark:hover:bg-background'}`}>Lista</button>
                            </div>
                        </div>
                    </div>
                    <div className="grid grid-cols-1 md:grid-cols-4 gap-4 mb-6 p-4 bg-light-surface dark:bg-surface rounded-xl border border-light-border dark:border-border">
                        <div>
                            <label className="text-xs font-semibold text-light-text-secondary dark:text-text-secondary">Vaga</label>
                            <select onChange={(e) => setJobFilter(e.target.value)} value={jobFilter} className="w-full mt-1 bg-light-background dark:bg-background border border-light-border dark:border-border rounded-lg px-3 py-2 text-light-text-primary dark:text-text-primary focus:outline-none focus:ring-2 focus:ring-light-primary dark:focus:ring-primary">
                            <option value="all">Todas</option>
                            {jobs.filter(j => j.status === 'active').map(j => <option key={j.id} value={j.id}>{j.title}</option>)}
                            </select>
                        </div>
                        <div>
                            <label className="text-xs font-semibold text-light-text-secondary dark:text-text-secondary">Recrutador</label>
                            <select onChange={(e) => setInterviewerFilter(e.target.value)} value={interviewerFilter} className="w-full mt-1 bg-light-background dark:bg-background border border-light-border dark:border-border rounded-lg px-3 py-2 text-light-text-primary dark:text-text-primary focus:outline-none focus:ring-2 focus:ring-light-primary dark:focus:ring-primary">
                            <option value="all">Todos</option>
                            {recruiters.map(r => <option key={r.id} value={r.username}>{r.username}</option>)}
                            </select>
                        </div>
                        <div>
                            <label className="text-xs font-semibold text-light-text-secondary dark:text-text-secondary">Período</label>
                            <div className="w-full mt-1 bg-light-background dark:bg-background border border-light-border dark:border-border rounded-lg p-1 flex">
                                <button type="button" onClick={() => setFilterMode('upcoming')} className={`w-1/2 text-center text-sm rounded-md py-1 ${filterMode === 'upcoming' ? 'bg-light-primary dark:bg-primary text-white' : ''}`}>Próximas</button>
                                <button type="button" onClick={() => setFilterMode('past')} className={`w-1/2 text-center text-sm rounded-md py-1 ${filterMode === 'past' ? 'bg-light-primary dark:bg-primary text-white' : ''}`}>Passadas</button>
                            </div>
                        </div>
                        <div className="flex items-end">
                            <button type="button" onClick={() => { setJobFilter('all'); setInterviewerFilter('all'); }} className="w-full mt-1 bg-light-background dark:bg-background border border-light-border dark:border-border rounded-lg px-3 py-2 text-light-text-secondary dark:text-text-secondary hover:text-light-text-primary dark:hover:text-text-primary transition-colors">
                                Limpar Filtros
                            </button>
                        </div>
                    </div>
                    {view === 'calendar' ? (
                        <CalendarView 
                            interviewsByDate={interviewsByDate} 
                            currentDate={currentDate} 
                            setCurrentDate={setCurrentDate} 
                            onCancel={handleCancelInterview}
                            onEdit={setEditingCandidate}
                            onOpenFeedback={setFeedbackCandidate}
                            onOpenMessaging={onOpenMessaging}
                            selectedDateKey={selectedDateKey}
                            onDateSelect={setSelectedDateKey}
                            jobMap={jobMap}
                            onBulkCancel={onBulkCancelInterviews}
                        />
                    ) : (
                        <ListView 
                            interviews={filteredInterviews} 
                            jobMap={jobMap} 
                            onCancel={handleCancelInterview}
                            onEdit={setEditingCandidate} 
                            onOpenFeedback={setFeedbackCandidate}
                            onOpenMessaging={onOpenMessaging}
                        />
                    )}
                </div>
            )}
            
            {activeTab === 'dinamica' && (
                <DynamicsView
                    dynamics={dynamics}
                    candidates={candidates}
                    jobs={jobs}
                    onAddDynamic={onAddDynamic}
                    onUpdateDynamic={onUpdateDynamic}
                    onDeleteDynamic={onDeleteDynamic}
                    {...props}
                />
            )}

            {activeTab === 'relatorios' && (
                <InterviewReports candidates={candidates} users={users} jobs={jobs} />
            )}

            {editingCandidate && (
                <InterviewSchedulerModal
                    isOpen={!!editingCandidate}
                    onClose={() => setEditingCandidate(null)}
                    candidate={editingCandidate}
                    onSchedule={(details) => handleSaveInterview(editingCandidate, details)}
                    allUsers={users}
                    allCandidates={candidates}
                    allJobs={jobs}
                />
            )}
            {feedbackCandidate && jobForFeedback && (
                <InterviewFeedbackModal
                    isOpen={!!feedbackCandidate}
                    onClose={() => setFeedbackCandidate(null)}
                    candidate={feedbackCandidate}
                    job={jobForFeedback}
                    onUpdateCandidate={onUpdateCandidate}
                    dynamics={dynamics}
                />
            )}
        </div>
    );
};

export default ScheduleView;