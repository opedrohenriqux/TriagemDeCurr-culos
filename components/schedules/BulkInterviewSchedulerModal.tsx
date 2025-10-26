import React, { useState, useEffect, useMemo } from 'react';
import { Candidate, CandidateInterview, User, Job } from '../../types';
import InitialsAvatar from '../common/InitialsAvatar';

interface BulkInterviewSchedulerModalProps {
    isOpen: boolean;
    onClose: () => void;
    candidatesToSchedule: Candidate[];
    onScheduleBulk: (interviewDetails: Omit<CandidateInterview, 'notes'>) => void;
    allUsers: User[];
    allCandidates: Candidate[];
    allJobs: Job[];
}

const Calendar: React.FC<{
    currentMonth: Date;
    onMonthChange: (newMonth: Date) => void;
    selectedDate: Date | null;
    onDateSelect: (date: Date) => void;
}> = ({ currentMonth, onMonthChange, selectedDate, onDateSelect }) => {
    const startOfMonth = new Date(currentMonth.getFullYear(), currentMonth.getMonth(), 1);
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

    const isSelected = (date: Date) => {
        if (!selectedDate) return false;
        return date.getDate() === selectedDate.getDate() &&
               date.getMonth() === selectedDate.getMonth() &&
               date.getFullYear() === selectedDate.getFullYear();
    };

    return (
        <div className="w-full">
            <div className="flex justify-between items-center mb-2">
                <button type="button" onClick={() => onMonthChange(new Date(currentMonth.setMonth(currentMonth.getMonth() - 1)))} className="p-1.5 rounded-full hover:bg-light-background dark:hover:bg-background">&lt;</button>
                <h3 className="text-sm font-semibold text-light-text-primary dark:text-text-primary">{currentMonth.toLocaleString('pt-BR', { month: 'long', year: 'numeric' })}</h3>
                <button type="button" onClick={() => onMonthChange(new Date(currentMonth.setMonth(currentMonth.getMonth() + 1)))} className="p-1.5 rounded-full hover:bg-light-background dark:hover:bg-background">&gt;</button>
            </div>
            <div className="grid grid-cols-7 gap-1 text-center text-xs font-semibold text-light-text-secondary dark:text-text-secondary mb-2">
                {['D', 'S', 'T', 'Q', 'Q', 'S', 'S'].map(day => <div key={day}>{day}</div>)}
            </div>
            <div className="grid grid-cols-7 gap-1">
                {days.map((day, index) => {
                    const isCurrentMonth = day.getMonth() === currentMonth.getMonth();
                    const isPast = day < new Date(new Date().toDateString());

                    return (
                        <button
                            type="button"
                            key={index}
                            onClick={() => !isPast && onDateSelect(day)}
                            disabled={isPast}
                            className={`w-8 h-8 flex items-center justify-center text-xs rounded-full transition-colors
                                ${isCurrentMonth ? '' : 'text-light-text-secondary/30 dark:text-text-secondary/30'}
                                ${isPast ? 'text-light-text-secondary/30 dark:text-text-secondary/30 cursor-not-allowed' : 'hover:bg-light-primary/10 dark:hover:bg-primary/10'}
                                ${isSelected(day) ? 'bg-light-primary dark:bg-primary text-white font-bold' : ''}
                                ${isToday(day) && !isSelected(day) ? 'border border-light-primary dark:border-primary' : ''}
                            `}
                        >
                            {day.getDate()}
                        </button>
                    );
                })}
            </div>
        </div>
    );
};


const BulkInterviewSchedulerModal: React.FC<BulkInterviewSchedulerModalProps> = ({ isOpen, onClose, candidatesToSchedule, onScheduleBulk, allUsers, allCandidates }) => {
    const [details, setDetails] = useState({ date: '', time: '', location: 'Online (Google Meet)', interviewers: [] as string[] });
    const [error, setError] = useState('');
    const [suggestions, setSuggestions] = useState<{ slots: { date: string; time: string }[] }>({ slots: [] });
    const [currentMonth, setCurrentMonth] = useState(new Date());
    const [selectedDate, setSelectedDate] = useState<Date | null>(new Date());

    const bookedSlotsForSelectedDay = useMemo(() => {
        const slots = new Set<string>();
        if (!selectedDate) return slots;
        
        const selectedDateString = selectedDate.toISOString().split('T')[0];

        allCandidates.forEach(c => {
            if (c.interview && c.interview.date === selectedDateString) {
                slots.add(c.interview.time);
            }
        });
        return slots;
    }, [allCandidates, selectedDate]);
    
    useEffect(() => {
        if (isOpen) {
            setError('');
            const initialDate = new Date();
            setSelectedDate(initialDate);
            setDetails({
                date: initialDate.toISOString().split('T')[0], time: '', location: 'Online (Google Meet)', interviewers: []
            });

            // --- Generate AI Suggestions for Slots ---
            const bookedSlots = new Set<string>();
            allCandidates.forEach(c => {
                if (c.interview) {
                    const slotDate = new Date(`${c.interview.date}T${c.interview.time}:00`);
                    if (!isNaN(slotDate.getTime())) bookedSlots.add(slotDate.toISOString());
                }
            });

            const availableSlots = [];
            let checkDate = new Date();
            checkDate.setMinutes(0, 0, 0);
            checkDate.setHours(checkDate.getHours() + 1);

            while (availableSlots.length < 3 && availableSlots.length < 100) { 
                if (checkDate.getHours() >= 23) { checkDate.setDate(checkDate.getDate() + 1); checkDate.setHours(8, 0, 0, 0); }
                if (checkDate.getHours() < 8) { checkDate.setHours(8, 0, 0, 0); }
                if (checkDate.getDay() === 0 || checkDate.getDay() === 6) { checkDate.setDate(checkDate.getDate() + (checkDate.getDay() === 6 ? 2 : 1)); checkDate.setHours(8, 0, 0, 0); }
                if (checkDate < new Date()) { checkDate.setHours(checkDate.getHours() + 1); continue; }
                
                if (!bookedSlots.has(checkDate.toISOString())) {
                    availableSlots.push({ date: checkDate.toISOString().split('T')[0], time: checkDate.toTimeString().substring(0, 5) });
                }
                checkDate.setHours(checkDate.getHours() + 1);
            }
            setSuggestions({ slots: availableSlots });
        }
    }, [isOpen, allCandidates]);

    if (!isOpen) return null;

    const handleDateSelect = (date: Date) => {
        setSelectedDate(date);
        setDetails(prev => ({...prev, date: date.toISOString().split('T')[0], time: ''}));
    };

    const handleInterviewerToggle = (username: string) => {
        setDetails(prev => {
            const newInterviewers = prev.interviewers.includes(username)
                ? prev.interviewers.filter(i => i !== username)
                : [...prev.interviewers, username];
            return { ...prev, interviewers: newInterviewers };
        });
    };

    const handleSubmit = (e: React.FormEvent) => {
        e.preventDefault();
        setError('');
        if (!details.date || !details.time) { setError('Data e hora são obrigatórias.'); return; }
        if (details.interviewers.length === 0) { setError('Selecione pelo menos um entrevistador.'); return; }

        const selectedDateTime = new Date(`${details.date}T${details.time}`);
        if (selectedDateTime < new Date()) { setError('Não é possível agendar uma entrevista para uma data ou hora passada.'); return; }

        onScheduleBulk(details);
        onClose();
    };
    
    return (
        <div className="fixed inset-0 bg-light-background/80 dark:bg-background/90 backdrop-blur-md flex justify-center items-center z-[60] p-4 animate-fade-in">
            <div className="bg-light-surface dark:bg-surface rounded-2xl shadow-2xl w-full max-w-4xl max-h-[95vh] flex flex-col border border-light-border dark:border-border">
                <div className="p-5 border-b border-light-border dark:border-border flex justify-between items-center flex-shrink-0">
                    <h2 className="text-2xl font-bold text-light-text-primary dark:text-text-primary">Agendar Entrevista em Lote ({candidatesToSchedule.length})</h2>
                    <button onClick={onClose} className="text-light-text-secondary dark:text-text-secondary hover:text-light-text-primary dark:hover:text-text-primary text-4xl">&times;</button>
                </div>
                
                <div className="flex-1 grid grid-cols-1 lg:grid-cols-3 min-h-0">
                    {/* Left Panel: Info & AI */}
                    <div className="lg:col-span-1 p-6 border-r border-light-border dark:border-border flex flex-col gap-6 bg-light-background/50 dark:bg-background/50">
                        <div>
                            <h3 className="text-lg font-bold text-light-text-primary dark:text-text-primary mb-2">Candidatos Selecionados</h3>
                            <div className="space-y-2 max-h-48 overflow-y-auto pr-2">
                                {candidatesToSchedule.map(c => (
                                    <div key={c.id} className="flex items-center gap-2 p-2 bg-light-surface dark:bg-surface rounded-md">
                                        <div className="w-8 h-8 flex-shrink-0"><InitialsAvatar name={c.name} /></div>
                                        <span className="text-sm font-medium">{c.name}</span>
                                    </div>
                                ))}
                            </div>
                        </div>
                        <div className="p-4 bg-light-surface dark:bg-surface border-l-4 border-light-primary dark:border-primary rounded-r-lg flex-1">
                            <h3 className="text-md font-bold text-light-primary dark:text-primary mb-3 flex items-center gap-2">
                                <svg xmlns="http://www.w3.org/2000/svg" width="20" height="20" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2.5" strokeLinecap="round" strokeLinejoin="round"><path d="m12 3-1.912 5.813a2 2 0 0 1-1.275 1.275L3 12l5.813 1.912a2 2 0 0 1 1.275 1.275L12 21l1.912-5.813a2 2 0 0 1 1.275-1.275L21 12l-5.813-1.912a2 2 0 0 1-1.275-1.275L12 3Z"/></svg>
                                Sugestões de Horários
                            </h3>
                            <div className="flex flex-wrap gap-2">
                                {suggestions.slots.map((slot, index) => (
                                    <button type="button" key={index} onClick={() => { handleDateSelect(new Date(slot.date+'T00:00:00')); setDetails(prev => ({...prev, time: slot.time})); }} className="px-3 py-1.5 text-xs font-semibold bg-light-background dark:bg-background border border-light-border dark:border-border rounded-full hover:border-light-primary dark:hover:border-primary hover:text-light-primary dark:hover:text-primary transition-colors">
                                        {new Date(`${slot.date}T00:00:00`).toLocaleDateString('pt-BR', { day: '2-digit', month: 'short' })} às {slot.time}
                                    </button>
                                ))}
                            </div>
                        </div>
                    </div>

                    {/* Right Panel: Form */}
                    <div className="lg:col-span-2 p-6 overflow-y-auto">
                        <form id="bulk-schedule-form" onSubmit={handleSubmit} className="space-y-4">
                             {error && <p className="text-red-500 text-sm text-center bg-red-500/10 p-3 rounded-lg">{error}</p>}
                            <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
                                <div>
                                    <label className="block text-sm font-semibold text-light-text-primary dark:text-text-primary mb-2">1. Selecione a Data</label>
                                    <Calendar currentMonth={currentMonth} onMonthChange={setCurrentMonth} selectedDate={selectedDate} onDateSelect={handleDateSelect} />
                                </div>
                                <div>
                                    <label htmlFor="bulk-interview-time" className="block text-sm font-semibold text-light-text-primary dark:text-text-primary mb-2">2. Escolha o Horário</label>
                                    <input
                                        id="bulk-interview-time"
                                        type="time"
                                        value={details.time}
                                        onChange={(e) => setDetails(prev => ({...prev, time: e.target.value}))}
                                        className="w-full px-3 py-2 bg-light-background dark:bg-background border border-light-border dark:border-border rounded-md focus:ring-2 focus:ring-light-primary dark:focus:ring-primary focus:outline-none"
                                        step="300" // 5-minute increments
                                    />
                                    {bookedSlotsForSelectedDay.has(details.time) && (
                                        <p className="text-xs text-yellow-600 dark:text-yellow-400 mt-1">
                                            Atenção: Já existe uma entrevista agendada para este horário.
                                        </p>
                                    )}
                                    <div className="mt-4 text-xs text-light-text-secondary dark:text-text-secondary">
                                        <p className="font-semibold mb-1">Horários já agendados neste dia:</p>
                                        <div className="flex flex-wrap gap-1">
                                            {Array.from(bookedSlotsForSelectedDay).sort().map(time => (
                                                <span key={time} className="px-2 py-0.5 bg-light-border dark:bg-border rounded-full text-light-text-primary dark:text-text-primary">{time}</span>
                                            ))}
                                            {bookedSlotsForSelectedDay.size === 0 && <p className="italic">Nenhum agendamento para este dia.</p>}
                                        </div>
                                    </div>
                                </div>
                            </div>
                             <div>
                                <label className="block text-sm font-semibold text-light-text-primary dark:text-text-primary mb-2">3. Selecione os Entrevistadores</label>
                                <div className="grid grid-cols-2 sm:grid-cols-3 gap-3">
                                    {allUsers.map(user => (
                                        <label
                                            key={user.id}
                                            className={`flex items-center gap-3 p-3 rounded-lg border-2 cursor-pointer transition-colors ${details.interviewers.includes(user.username) ? 'border-light-primary dark:border-primary bg-light-primary/5 dark:bg-primary/5' : 'border-light-border dark:border-border hover:border-light-border/70 dark:hover:border-border/70'}`}
                                        >
                                            <input type="checkbox" checked={details.interviewers.includes(user.username)} onChange={() => handleInterviewerToggle(user.username)} className="h-4 w-4 rounded text-light-primary dark:text-primary bg-light-surface dark:bg-surface border-light-border dark:border-border focus:ring-light-primary dark:focus:ring-offset-light-surface dark:focus:ring-offset-surface"/>
                                            <div className="w-8 h-8 flex-shrink-0"><InitialsAvatar name={user.username} /></div>
                                            <span className="text-sm font-medium">{user.username}</span>
                                        </label>
                                    ))}
                                </div>
                            </div>
                            <div>
                                <label className="block text-sm font-semibold text-light-text-primary dark:text-text-primary mb-2">4. Local</label>
                                 <select value={details.location} onChange={e => setDetails({...details, location: e.target.value})} className="w-full px-3 py-2 bg-light-background dark:bg-background border border-light-border dark:border-border rounded-md focus:ring-2 focus:ring-light-primary dark:focus:ring-primary focus:outline-none">
                                    <option>Online (Google Meet)</option>
                                    <option>Presencial (Restaurante)</option>
                                </select>
                            </div>
                        </form>
                    </div>
                </div>

                <div className="p-5 border-t border-light-border dark:border-border flex justify-end gap-4 flex-shrink-0">
                    <button type="button" onClick={onClose} className="bg-light-border dark:bg-border text-light-text-primary dark:text-text-primary font-bold px-6 py-2.5 rounded-lg hover:bg-light-border/70 dark:hover:bg-border/70 transition-colors">
                        Cancelar
                    </button>
                    <button type="submit" form="bulk-schedule-form" className="bg-light-primary dark:bg-primary text-white dark:text-background font-bold px-6 py-2.5 rounded-lg hover:bg-light-primary-hover dark:hover:bg-primary-hover transition-colors">
                        Agendar para Todos
                    </button>
                </div>
            </div>
        </div>
    );
};

export default BulkInterviewSchedulerModal;