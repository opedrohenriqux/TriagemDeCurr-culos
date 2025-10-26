import React, { useState, useEffect, useMemo, useRef } from 'react';
import { Dynamic, Candidate, ActiveDynamicTimer } from '../../types';
import InitialsAvatar from '../common/InitialsAvatar';

interface DynamicViewerModalProps {
    isOpen: boolean;
    onClose: () => void;
    dynamic: Dynamic;
    onUpdateDynamic: (dynamic: Dynamic) => void;
    onEdit: () => void;
    allCandidates: Candidate[];
    activeDynamicTimer: ActiveDynamicTimer | null;
    onStartDynamicTimer: (dynamicId: string, durationMinutes: number, mode: 'countdown' | 'countup') => void;
    onPauseDynamicTimer: () => void;
    onResumeDynamicTimer: () => void;
    onResetDynamicTimer: (dynamicId: string) => void;
}

const DynamicViewerModal: React.FC<DynamicViewerModalProps> = (props) => {
    const { isOpen, onClose, dynamic, onUpdateDynamic, onEdit, allCandidates, activeDynamicTimer, onStartDynamicTimer, onPauseDynamicTimer, onResumeDynamicTimer, onResetDynamicTimer } = props;
    
    const [generalNotes, setGeneralNotes] = useState('');
    const [groupNotes, setGroupNotes] = useState<Record<number, string>>({}); // key: group index
    const [individualNotes, setIndividualNotes] = useState<Record<number, Record<number, string>>>({}); // key: group index -> candidateId
    const [isSaved, setIsSaved] = useState(false);
    const [viewMode, setViewMode] = useState<'recruiter' | 'candidate'>('recruiter');

    // Timer State
    const [initialMinutes, setInitialMinutes] = useState(15);
    const [timerMode, setTimerMode] = useState<'countdown' | 'countup'>('countdown');
    const [displayTime, setDisplayTime] = useState(initialMinutes * 60);
    const [isFullscreen, setIsFullscreen] = useState(false);

    const audioCtxRef = useRef<AudioContext | null>(null);
    const intervalRef = useRef<number | null>(null);
    const modalRef = useRef<HTMLDivElement>(null);

    const isTimerRunning = activeDynamicTimer?.isRunning ?? false;

    const toggleFullscreen = () => {
        if (!modalRef.current) return;
        if (!document.fullscreenElement) {
            modalRef.current.requestFullscreen().catch(err => {
                console.error(`Error attempting to enable full-screen mode: ${err.message} (${err.name})`);
            });
        } else {
            document.exitFullscreen();
        }
    };

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
    
    // Effect for the timer display logic
    useEffect(() => {
        const updateDisplay = () => {
            if (activeDynamicTimer && activeDynamicTimer.dynamicId === dynamic.id) {
                if (!activeDynamicTimer.isRunning) {
                     if (activeDynamicTimer.startTime === null) { // Reset state
                        setDisplayTime(activeDynamicTimer.mode === 'countdown' ? activeDynamicTimer.duration : 0);
                    }
                    // If paused, the time is frozen, no need to update display continuously
                    return;
                }

                const elapsed = (Date.now() - activeDynamicTimer.startTime) / 1000;
                
                if (activeDynamicTimer.mode === 'countdown') {
                    const remaining = Math.max(0, activeDynamicTimer.duration - elapsed);
                    setDisplayTime(remaining);
                    if (remaining === 0) {
                        onPauseDynamicTimer();
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
                 setDisplayTime(initialMinutes * 60);
            }
        };

        if (intervalRef.current) clearInterval(intervalRef.current);
        intervalRef.current = window.setInterval(updateDisplay, 250); // Update display frequently

        return () => {
            if (intervalRef.current) clearInterval(intervalRef.current);
        };

    }, [activeDynamicTimer, dynamic.id, displayTime, onPauseDynamicTimer, initialMinutes]);


    useEffect(() => {
        if (dynamic) {
            setGeneralNotes(dynamic.generalNotes || '');
            const initialGroupNotes: Record<number, string> = {};
            const initialIndividualNotes: Record<number, Record<number, string>> = {};

            dynamic.groups.forEach((group, groupIndex) => {
                initialGroupNotes[groupIndex] = group.groupNotes || '';
                initialIndividualNotes[groupIndex] = group.individualNotes || {};
            });
            setGroupNotes(initialGroupNotes);
            setIndividualNotes(initialIndividualNotes);
        }
        // Reset local UI state when modal opens/changes dynamic
        if(activeDynamicTimer?.dynamicId === dynamic.id){
            setInitialMinutes(activeDynamicTimer.duration / 60);
            setTimerMode(activeDynamicTimer.mode);
        } else {
            setInitialMinutes(15);
            setTimerMode('countdown');
        }

    }, [dynamic, isOpen, activeDynamicTimer]);
    
    const handleFinishAndSave = () => {
        const updatedDynamic: Dynamic = {
            ...dynamic,
            generalNotes,
            groups: dynamic.groups.map((group, groupIndex) => ({
                ...group,
                groupNotes: groupNotes[groupIndex] || '',
                individualNotes: individualNotes[groupIndex] || {},
            })),
        };
        onUpdateDynamic(updatedDynamic);
        onClose();
    };

    const handleSaveAndContinue = () => {
         const updatedDynamic: Dynamic = {
            ...dynamic,
            generalNotes,
            groups: dynamic.groups.map((group, groupIndex) => ({
                ...group,
                groupNotes: groupNotes[groupIndex] || '',
                individualNotes: individualNotes[groupIndex] || {},
            })),
        };
        onUpdateDynamic(updatedDynamic);
        setIsSaved(true);
        setTimeout(() => setIsSaved(false), 2000);
    };

    const handleStartTimer = () => {
        onStartDynamicTimer(dynamic.id, initialMinutes, timerMode);
    };
    
    const handleResumeOrPause = () => {
        if (isTimerRunning) {
            onPauseDynamicTimer();
        } else {
            onResumeDynamicTimer();
        }
    };

    const handleResetTimer = () => {
        onResetDynamicTimer();
    };
    
    const formatTime = (seconds: number) => {
        const mins = Math.floor(seconds / 60).toString().padStart(2, '0');
        const secs = Math.floor(seconds % 60).toString().padStart(2, '0');
        return `${mins}:${secs}`;
    };

    const getCandidateName = (id: number) => allCandidates.find(c => c.id === id)?.name || 'Desconhecido';

    useEffect(() => {
        const handleFullscreenChange = () => {
            setIsFullscreen(!!document.fullscreenElement);
        };
        document.addEventListener('fullscreenchange', handleFullscreenChange);
        return () => document.removeEventListener('fullscreenchange', handleFullscreenChange);
    }, []);

    if (!isOpen) return null;

    return (
        <div className="fixed inset-0 bg-light-background/80 dark:bg-background/90 backdrop-blur-md flex justify-center items-center z-[80] p-4 animate-fade-in">
            <div ref={modalRef} className={`bg-light-surface dark:bg-surface flex flex-col border border-light-border dark:border-border ${isFullscreen ? 'w-full h-full' : 'rounded-2xl shadow-2xl w-full max-w-7xl h-[95vh]'}`}>
                <div className="p-5 border-b border-light-border dark:border-border flex justify-between items-center">
                    <div>
                        <h2 className="text-2xl font-bold text-light-text-primary dark:text-text-primary">{dynamic.title}</h2>
                        <p className="text-sm text-light-text-secondary dark:text-text-secondary">Realizada em {new Date(dynamic.date + 'T00:00:00').toLocaleDateString('pt-BR', { timeZone: 'UTC' })}</p>
                    </div>
                    <div className="flex items-center gap-4">
                         <button
                            onClick={() => setViewMode(viewMode === 'recruiter' ? 'candidate' : 'recruiter')}
                            className="flex items-center gap-2 text-sm font-semibold bg-light-background dark:bg-background px-4 py-2 rounded-lg border border-light-border dark:border-border hover:bg-light-border dark:hover:bg-border"
                            title={viewMode === 'recruiter' ? "Mudar para Visão do Candidato" : "Mudar para Visão do Recrutador"}
                        >
                             {viewMode === 'recruiter'
                                ? <svg xmlns="http://www.w3.org/2000/svg" width="18" height="18" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round"><path d="M1 12s4-8 11-8 11 8 11 8-4 8-11 8-11-8-11-8z"></path><circle cx="12" cy="12" r="3"></circle></svg>
                                : <svg xmlns="http://www.w3.org/2000/svg" width="18" height="18" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round"><path d="M16 21v-2a4 4 0 0 0-4-4H6a4 4 0 0 0-4 4v2"></path><circle cx="9" cy="7" r="4"></circle><line x1="17" y1="8" x2="23" y2="8"></line><line x1="20" y1="5" x2="20" y2="11"></line></svg>
                            }
                        </button>
                        <button onClick={toggleFullscreen} className="p-2 rounded-lg bg-light-background dark:bg-background border border-light-border dark:border-border hover:bg-light-border dark:hover:bg-border" title={isFullscreen ? "Sair da Tela Cheia" : "Entrar em Tela Cheia"}>
                            {isFullscreen
                                ? <svg xmlns="http://www.w3.org/2000/svg" width="18" height="18" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round"><path d="m15 19-7-7 7-7"/><path d="m22 19-7-7 7-7"/></svg>
                                : <svg xmlns="http://www.w3.org/2000/svg" width="18" height="18" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round"><path d="m15 5 7 7-7 7"/><path d="m8 5 7 7-7 7"/></svg>
                            }
                        </button>
                        <button onClick={onClose} className="text-light-text-secondary dark:text-text-secondary hover:text-light-text-primary dark:hover:text-text-primary text-4xl">&times;</button>
                    </div>
                </div>
                
                <div className={`flex-1 grid grid-cols-1 ${viewMode === 'recruiter' ? 'lg:grid-cols-2' : ''} min-h-0`}>
                    {/* Left Panel: Script & General Notes */}
                    <div className={`${viewMode === 'recruiter' ? 'lg:col-span-1 border-r' : 'lg:col-span-2'} p-6 border-light-border dark:border-border flex flex-col gap-4 overflow-y-auto`}>
                        <div>
                            <h3 className="text-lg font-bold text-light-primary dark:text-primary mb-2">Script / Instruções</h3>
                            <div className={`p-4 bg-light-background dark:bg-background rounded-md whitespace-pre-wrap ${viewMode === 'candidate' ? 'text-xl flex-grow' : 'text-sm max-h-48'} overflow-y-auto`}>
                                {dynamic.script || "Nenhum script fornecido."}
                            </div>
                        </div>

                        {/* Timer Panel */}
                        <div className="p-4 bg-light-background dark:bg-background rounded-lg border border-light-border dark:border-border">
                            <h3 className="text-lg font-bold text-light-primary dark:text-primary mb-3">Timer da Dinâmica</h3>
                            
                            {activeDynamicTimer?.dynamicId !== dynamic.id ? (
                                <button
                                    onClick={() => onStartDynamicTimer(dynamic.id, initialMinutes, timerMode)}
                                    className="w-full bg-light-primary dark:bg-primary text-white font-bold py-2.5 rounded-lg hover:bg-light-primary-hover dark:hover:bg-primary-hover transition-colors"
                                >
                                    Iniciar Timer
                                </button>
                            ) : (
                                <>
                                    <div className="flex items-center justify-center mb-4 p-4 bg-light-surface dark:bg-surface rounded-md">
                                        <h4 className="text-6xl font-bold font-mono tracking-wider text-light-text-primary dark:text-text-primary">{formatTime(displayTime)}</h4>
                                    </div>
                                    
                                    <div className="grid grid-cols-2 gap-4 mb-4">
                                        <div>
                                            <label className="text-xs font-semibold">Duração (min)</label>
                                            <input 
                                                type="number"
                                                value={initialMinutes}
                                                onChange={(e) => setInitialMinutes(parseInt(e.target.value) || 1)}
                                                disabled={isTimerRunning}
                                                className="w-full mt-1 p-2 bg-light-surface dark:bg-surface border border-light-border dark:border-border rounded-md text-center"
                                            />
                                        </div>
                                        <div>
                                            <label className="text-xs font-semibold">Modo</label>
                                            <div className="w-full mt-1 bg-light-surface dark:bg-surface border border-light-border dark:border-border rounded-lg p-1 flex">
                                                <button onClick={() => { if(!isTimerRunning) setTimerMode('countdown'); }} disabled={isTimerRunning} className={`w-1/2 text-center text-xs rounded-md py-1 ${timerMode === 'countdown' ? 'bg-light-secondary dark:bg-secondary text-white' : ''}`}>Regressivo</button>
                                                <button onClick={() => { if(!isTimerRunning) setTimerMode('countup'); }} disabled={isTimerRunning} className={`w-1/2 text-center text-xs rounded-md py-1 ${timerMode === 'countup' ? 'bg-light-secondary dark:bg-secondary text-white' : ''}`}>Progressivo</button>
                                            </div>
                                        </div>
                                    </div>

                                    <div className="grid grid-cols-2 gap-2">
                                        {!activeDynamicTimer?.startTime ? (
                                            <button onClick={handleStartTimer} className="bg-green-600/20 text-green-500 font-bold py-2 rounded-lg hover:bg-green-600/30">
                                                Iniciar
                                            </button>
                                        ) : (
                                            <button onClick={handleResumeOrPause} className={`${isTimerRunning ? 'bg-yellow-600/20 text-yellow-500 hover:bg-yellow-600/30' : 'bg-green-600/20 text-green-500 hover:bg-green-600/30'} font-bold py-2 rounded-lg`}>
                                                {isTimerRunning ? 'Pausar' : 'Retomar'}
                                            </button>
                                        )}
                                        <button onClick={handleResetTimer} className="bg-red-600/20 text-red-500 font-bold py-2 rounded-lg hover:bg-red-600/30">
                                            Resetar
                                        </button>
                                    </div>
                                </>
                            )}
                        </div>
                        
                        {viewMode === 'recruiter' && (
                            <div>
                                <h3 className="text-lg font-bold text-light-primary dark:text-primary mb-2">Anotações Gerais da Dinâmica</h3>
                                <textarea
                                    value={generalNotes}
                                    onChange={(e) => setGeneralNotes(e.target.value)}
                                    rows={8}
                                    placeholder="Registre aqui suas observações sobre o andamento geral da atividade..."
                                    className="w-full px-3 py-2 bg-light-background dark:bg-background border border-light-border dark:border-border rounded-md focus:ring-2 focus:ring-light-primary dark:focus:ring-primary"
                                />
                            </div>
                        )}
                    </div>

                    {/* Right Panel: Groups & Notes */}
                    {viewMode === 'recruiter' && (
                        <div className="lg:col-span-1 p-6 overflow-y-auto space-y-4">
                            <h3 className="text-lg font-bold text-light-primary dark:text-primary">Grupos e Anotações</h3>
                            {dynamic.groups.map((group, groupIndex) => (
                                <div key={groupIndex} className="p-4 bg-light-background dark:bg-background rounded-lg border border-light-border dark:border-border">
                                    <h4 className="font-bold text-light-text-primary dark:text-text-primary mb-2">{group.name}</h4>
                                    <div className="space-y-3">
                                        {group.members.map(memberId => (
                                            <div key={memberId} className="pl-4 border-l-2 border-light-border dark:border-border">
                                                <div className="flex items-center gap-2 mb-1">
                                                    <div className="w-6 h-6 flex-shrink-0"><InitialsAvatar name={getCandidateName(memberId)} /></div>
                                                    <span className="text-sm font-semibold">{getCandidateName(memberId)}</span>
                                                </div>
                                                <textarea
                                                    value={individualNotes[groupIndex]?.[memberId] || ''}
                                                    onChange={(e) => {
                                                        const newNotes = { ...individualNotes };
                                                        if (!newNotes[groupIndex]) newNotes[groupIndex] = {};
                                                        newNotes[groupIndex][memberId] = e.target.value;
                                                        setIndividualNotes(newNotes);
                                                    }}
                                                    rows={3}
                                                    placeholder={`Anotações sobre ${getCandidateName(memberId)}...`}
                                                    className="w-full text-sm px-2 py-1 bg-light-surface dark:bg-surface border border-light-border dark:border-border rounded-md focus:ring-2 focus:ring-light-secondary dark:focus:ring-secondary"
                                                />
                                            </div>
                                        ))}
                                    </div>
                                    <div className="mt-4 pt-3 border-t border-light-border dark:border-border">
                                        <label className="block text-sm font-semibold mb-1">Anotações do Grupo</label>
                                        <textarea
                                            value={groupNotes[groupIndex] || ''}
                                            onChange={(e) => setGroupNotes(prev => ({...prev, [groupIndex]: e.target.value}))}
                                            rows={3}
                                            placeholder={`Observações sobre o desempenho do ${group.name}...`}
                                            className="w-full text-sm px-2 py-1 bg-light-surface dark:bg-surface border border-light-border dark:border-border rounded-md focus:ring-2 focus:ring-light-secondary dark:focus:ring-secondary"
                                        />
                                    </div>
                                </div>
                            ))}
                            {dynamic.groups.length === 0 && (
                                <div className="text-center py-10 border border-dashed rounded-md">
                                    <p className="text-sm text-light-text-secondary dark:text-text-secondary">Nenhum grupo foi formado para esta dinâmica.</p>
                                </div>
                            )}
                        </div>
                    )}
                </div>

                <div className="p-5 border-t border-light-border dark:border-border flex justify-between items-center">
                    <button type="button" onClick={onEdit} className="bg-light-secondary/20 text-light-secondary dark:bg-secondary/20 dark:text-secondary font-bold px-6 py-2.5 rounded-lg hover:bg-light-secondary/30 dark:hover:bg-secondary/40 transition-colors">
                        Editar Dinâmica
                    </button>
                    <div className="flex gap-4 items-center">
                        {isSaved && <span className="text-sm font-semibold text-green-500 animate-fade-in">✓ Salvo!</span>}
                        <button type="button" onClick={onClose} className="bg-light-border dark:bg-border font-bold px-6 py-2.5 rounded-lg hover:bg-light-border/70 dark:hover:bg-border/70">Fechar</button>
                        <button type="button" onClick={handleSaveAndContinue} className="bg-light-background dark:bg-background border border-light-border dark:border-border font-bold px-6 py-2.5 rounded-lg hover:bg-light-border dark:hover:bg-border transition-colors">
                            Salvar Anotações
                        </button>
                        <button type="button" onClick={handleFinishAndSave} className="bg-light-primary dark:bg-primary text-white font-bold px-6 py-2.5 rounded-lg hover:bg-light-primary-hover dark:hover:bg-primary-hover">
                            Finalizar Dinâmica
                        </button>
                    </div>
                </div>
            </div>
        </div>
    );
};

export default DynamicViewerModal;