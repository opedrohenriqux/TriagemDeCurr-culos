import React, { useMemo } from 'react';
import { Candidate } from '../../types';

interface ReminderToastProps {
    reminder: {
        candidate: Candidate;
        type: 'reminder' | 'now';
    };
    onClose: () => void;
}

const ReminderToast: React.FC<ReminderToastProps> = ({ reminder, onClose }) => {
    const { candidate, type } = reminder;
    const { interview } = candidate;

    const message = useMemo(() => {
        if (!interview) return null;
        const interviewTime = new Date(`${interview.date}T${interview.time}`);
        const now = new Date();
        const diffMins = Math.round((interviewTime.getTime() - now.getTime()) / 60000);

        if (type === 'now') {
            return (
                <span>
                    <strong>É agora!</strong> Entrevista com <strong>{candidate.name}</strong> às {interview.time}.
                </span>
            );
        }

        return (
            <span>
                Lembrete: Entrevista com <strong>{candidate.name}</strong> em <strong>{diffMins} minutos</strong> (às {interview.time}).
            </span>
        );
    }, [candidate, interview, type]);


    if (!message) return null;

    return (
        <div 
            className="fixed bottom-8 right-8 z-[100] w-full max-w-sm bg-amber-50 dark:bg-amber-900/40 border-l-4 border-amber-400 dark:border-amber-500 rounded-lg shadow-2xl p-5 text-amber-800 dark:text-amber-200 animate-fade-in-up"
            role="alert"
        >
            <div className="flex items-start gap-4">
                <div className="flex-shrink-0 text-amber-500 dark:text-amber-400 p-1 rounded-full mt-1">
                   <svg xmlns="http://www.w3.org/2000/svg" width="24" height="24" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round"><path d="M12 22c5.523 0 10-4.477 10-10S17.523 2 12 2 2 6.477 2 12s4.477 10 10 10z"/><path d="M12 6v6l4 2"/></svg>
                </div>
                <div>
                    <h4 className="font-bold text-lg">{type === 'now' ? 'Compromisso Imediato' : 'Lembrete de Agendamento'}</h4>
                    <p className="text-sm mt-1">{message}</p>
                </div>
                <button 
                    type="button" 
                    onClick={onClose} 
                    className="absolute top-3 right-3 text-amber-600 dark:text-amber-300 hover:text-amber-800 dark:hover:text-amber-100 transition-colors"
                    aria-label="Fechar lembrete"
                >
                    <svg xmlns="http://www.w3.org/2000/svg" width="20" height="20" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2.5" strokeLinecap="round" strokeLinejoin="round"><line x1="18" y1="6" x2="6" y2="18"></line><line x1="6" y1="6" x2="18" y2="18"></line></svg>
                </button>
            </div>
        </div>
    );
};

export default ReminderToast;
