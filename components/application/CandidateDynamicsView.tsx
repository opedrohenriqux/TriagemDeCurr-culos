import React, { useState, useEffect, useMemo, useRef } from 'react';
import { Candidate, Dynamic, ActiveDynamicTimer } from '../../types';
import InitialsAvatar from '../common/InitialsAvatar';

interface CandidateDynamicsViewProps {
    candidate: Candidate;
    dynamics: Dynamic[];
    allCandidates: Candidate[];
    onBack: () => void;
}

const CandidateDynamicsView: React.FC<CandidateDynamicsViewProps> = ({ candidate, dynamics, allCandidates, onBack }) => {
    
    const [activeTimer, setActiveTimer] = useState<ActiveDynamicTimer | null>(null);
    const [displayTime, setDisplayTime] = useState(0);
    const intervalRef = useRef<number | null>(null);
    const audioCtxRef = useRef<AudioContext | null>(null);

    const activeDynamic = useMemo(() => {
        // Find the most recent, upcoming or in-progress dynamic for the candidate
        return dynamics
            .filter(d => d.participants.includes(candidate.id))
            .sort((a, b) => new Date(b.date).getTime() - new Date(a.date).getTime())
            [0] || null;
    }, [dynamics, candidate.id]);

     // Function to play a sound
    const playBeep = (frequency = 440, duration = 100) => {
        if (!audioCtxRef.current) {
            audioCtxRef.current = new (window.AudioContext || (window as any).webkitAudioContext)();
        }
        const audioCtx = audioCtxRef.current;
        if (audioCtx.state === 'suspended') {
            audioCtx.resume();
        }
        const oscillator = audioCtx.createOscillator();
        oscillator.type = 'sine';
        oscillator.frequency.setValueAtTime(frequency, audioCtx.currentTime);
        oscillator.connect(audioCtx.destination);
        oscillator.start();
        setTimeout(() => {
            oscillator.stop();
        }, duration);
    };

    // Effect for polling localStorage and updating timer display
    useEffect(() => {
        const updateTimer = () => {
            try {
                const storedTimer = localStorage.getItem('lacoste-active-dynamic');
                const timerState: ActiveDynamicTimer | null = storedTimer ? JSON.parse(storedTimer) : null;
                
                if (timerState && timerState.dynamicId === activeDynamic?.id) {
                    setActiveTimer(timerState);

                    if (!timerState.isRunning) {
                        if (timerState.startTime === null) { // Reset state
                            setDisplayTime(timerState.mode === 'countdown' ? timerState.duration : 0);
                        } else if (timerState.pauseTime) { // Paused state
                             const elapsedBeforePause = (timerState.pauseTime - timerState.startTime) / 1000;
                             if(timerState.mode === 'countdown') {
                                setDisplayTime(Math.max(0, timerState.duration - elapsedBeforePause));
                             } else {
                                setDisplayTime(elapsedBeforePause);
                             }
                        }
                        return;
                    }

                    const elapsed = (Date.now() - timerState.startTime) / 1000;
                    
                    if (timerState.mode === 'countdown') {
                        const remaining = Math.max(0, timerState.duration - elapsed);
                        setDisplayTime(remaining);
                         if (remaining === 0 && Math.floor(displayTime) > 0) {
                            playBeep(880, 500); // End beep
                        } else if (Math.floor(remaining) > 0 && Math.floor(remaining) % 60 === 0 && Math.floor(remaining) !== Math.floor(displayTime)) {
                            playBeep(); // Minute beep
                        }

                    } else { // countup
                        setDisplayTime(elapsed);
                         if (Math.floor(elapsed) > 0 && Math.floor(elapsed) % 60 === 0 && Math.floor(elapsed) !== Math.floor(displayTime)) {
                            playBeep();
                        }
                    }
                } else {
                    // If no active timer for this dynamic, reset local state
                    setActiveTimer(null);
                    setDisplayTime(0);
                }
            } catch (error) {
                console.error("Error polling for dynamic timer:", error);
            }
        };

        intervalRef.current = window.setInterval(updateTimer, 500); // Poll every half second
        
        return () => {
            if(intervalRef.current) clearInterval(intervalRef.current);
        };
    }, [activeDynamic, displayTime]);

    const formatTime = (seconds: number) => {
        const mins = Math.floor(seconds / 60).toString().padStart(2, '0');
        const secs = Math.floor(seconds % 60).toString().padStart(2, '0');
        return `${mins}:${secs}`;
    };

    const getCandidateName = (id: number) => allCandidates.find(c => c.id === id)?.name || 'Desconhecido';

    if (!activeDynamic) {
        return (
            <div className="text-center p-8">
                <h2 className="text-2xl font-bold">Nenhuma Dinâmica Ativa</h2>
                <p className="mt-2 text-light-text-secondary dark:text-text-secondary">Você não está participando de nenhuma dinâmica no momento.</p>
                <button onClick={onBack} className="mt-6 bg-light-primary dark:bg-primary text-white font-bold px-6 py-2 rounded-lg hover:bg-light-primary-hover dark:hover:bg-primary-hover transition-colors">
                    Voltar ao Painel
                </button>
            </div>
        );
    }
    
    const myGroup = activeDynamic.groups.find(g => g.members.includes(candidate.id));

    return (
        <div className="relative w-full bg-light-surface dark:bg-surface p-6 md:p-8 rounded-xl border border-light-border dark:border-border animate-fade-in flex flex-col items-center">
            <button onClick={onBack} className="absolute top-4 left-4 text-sm font-semibold text-light-secondary dark:text-secondary hover:underline">&larr; Voltar ao Painel</button>
            <h1 className="text-3xl font-bold text-center">{activeDynamic.title}</h1>
            <p className="text-sm font-semibold text-light-text-secondary dark:text-text-secondary mb-6">
                Data: {new Date(activeDynamic.date + 'T00:00:00').toLocaleDateString('pt-BR', { timeZone: 'UTC' })}
            </p>

            <div className="w-full max-w-lg text-center mb-8">
                 <div className="p-4 bg-light-background dark:bg-background rounded-md">
                    <h4 className="text-6xl md:text-8xl font-bold font-mono tracking-wider text-light-text-primary dark:text-text-primary">
                        {formatTime(displayTime)}
                    </h4>
                    {activeTimer && !activeTimer.isRunning && activeTimer.startTime !== null && (
                         <p className="font-semibold text-yellow-500 animate-pulse">TIMER PAUSADO</p>
                    )}
                 </div>
            </div>

            <div className="w-full grid grid-cols-1 lg:grid-cols-2 gap-6">
                <div className="bg-light-background dark:bg-background p-4 rounded-lg border border-light-border dark:border-border">
                    <h3 className="text-lg font-bold text-light-primary dark:text-primary mb-2">Instruções</h3>
                    <p className="text-sm text-light-text-secondary dark:text-text-secondary whitespace-pre-wrap h-48 overflow-y-auto">
                        {activeDynamic.script || "Aguarde as instruções do recrutador."}
                    </p>
                </div>
                 <div className="bg-light-background dark:bg-background p-4 rounded-lg border border-light-border dark:border-border">
                    <h3 className="text-lg font-bold text-light-primary dark:text-primary mb-2">
                        Seu Grupo: {myGroup?.name || 'Aguardando formação'}
                    </h3>
                    <div className="space-y-3 h-48 overflow-y-auto">
                        {myGroup?.members.map(memberId => (
                             <div key={memberId} className="flex items-center gap-3 p-2 bg-light-surface dark:bg-surface rounded-md">
                                <div className="w-8 h-8 flex-shrink-0">
                                    <InitialsAvatar name={getCandidateName(memberId)} />
                                </div>
                                <span className={`text-sm font-medium ${memberId === candidate.id ? 'font-bold' : ''}`}>
                                    {getCandidateName(memberId)} {memberId === candidate.id ? '(Você)' : ''}
                                </span>
                            </div>
                        ))}
                    </div>
                 </div>
            </div>
        </div>
    );
};

export default CandidateDynamicsView;