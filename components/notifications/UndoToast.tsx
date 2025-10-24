import React, { useEffect, useState, useMemo } from 'react';
import { CandidateStatus } from '../../types';

interface UndoToastProps {
    candidateName: string;
    newStatus: CandidateStatus;
    onUndo: () => void;
    onClose: () => void;
}

const UndoToast: React.FC<UndoToastProps> = ({ candidateName, newStatus, onUndo, onClose }) => {
    const [progress, setProgress] = useState(100);

    useEffect(() => {
        const timer = setTimeout(onClose, 6000);
        const interval = setInterval(() => {
            setProgress(prev => Math.max(0, prev - (100 / (6000 / 100)) ));
        }, 100);

        return () => {
            clearTimeout(timer);
            clearInterval(interval);
        };
    }, [onClose]);

    const statusTextMap: Record<CandidateStatus, string> = {
        applied: 'Inscrito',
        screening: 'Triagem',
        approved: 'Aprovado (Triagem)',
        offer: 'Aprovado para o Time',
        hired: 'Contratado',
        rejected: 'Rejeitado',
        waitlist: 'em Lista de Espera',
        pending: 'Pendente',
    };

    const message = useMemo(() => 
        `Status de ${candidateName} alterado para "${statusTextMap[newStatus]}".`
    , [candidateName, newStatus]);

    return (
        <div 
            className="fixed bottom-8 right-8 z-[100] w-full max-w-sm bg-light-surface dark:bg-surface border-l-4 border-light-secondary dark:border-secondary rounded-lg shadow-2xl p-4 text-light-text-primary dark:text-text-primary animate-fade-in-up"
            role="alert"
        >
            <div className="flex items-center justify-between gap-4">
                <p className="text-sm">{message}</p>
                <button onClick={onUndo} className="font-bold text-sm text-light-secondary dark:text-secondary hover:underline flex-shrink-0">
                    Desfazer
                </button>
            </div>
            <div className="absolute bottom-0 left-0 right-0 h-1 bg-light-secondary/20 dark:bg-secondary/20 rounded-b-lg overflow-hidden">
                <div 
                    className="h-full bg-light-secondary dark:bg-secondary" 
                    style={{ width: `${progress}%`, transition: 'width 0.1s linear' }}
                ></div>
            </div>
        </div>
    );
};

export default UndoToast;