import React, { useState, useEffect } from 'react';
import { Candidate, Job, Dynamic } from '../../types';
import InitialsAvatar from '../common/InitialsAvatar';
import { summarizeInterviewFeedback, getDecisionSupportSummary } from '../../services/geminiService';

interface InterviewFeedbackModalProps {
    isOpen: boolean;
    onClose: () => void;
    candidate: Candidate;
    job: Job;
    onUpdateCandidate: (candidate: Candidate) => void;
    dynamics: Dynamic[];
}

const defaultFeedbackTemplate = {
    summary: '[Descreva aqui um resumo geral da conversa com o candidato, suas impressões e principais pontos discutidos.]',
    strengths: 'Ex: Boa comunicação, proatividade.',
    improvements: 'Ex: Pouca experiência com X, precisa desenvolver Y.',
    culturalFit: '[Comente sobre a aderência do candidato aos valores e à cultura da Lacoste Burger.]',
    comments: '[Qualquer outra observação relevante, como pretensão salarial, disponibilidade, etc.]',
};

const FeedbackSection: React.FC<{ label: string; children: React.ReactNode }> = ({ label, children }) => (
    <div>
        <label className="block text-sm font-semibold text-light-text-secondary dark:text-text-secondary mb-2">{label}</label>
        {children}
    </div>
);

const InterviewFeedbackModal: React.FC<InterviewFeedbackModalProps> = ({ isOpen, onClose, candidate, job, onUpdateCandidate, dynamics }) => {
    const [feedback, setFeedback] = useState(defaultFeedbackTemplate);
    const [aiSummary, setAiSummary] = useState<string | null>(null);
    const [isGenerating, setIsGenerating] = useState(false);
    const [error, setError] = useState('');
    const [decisionSupportSummary, setDecisionSupportSummary] = useState<string | null>(null);
    const [isGeneratingSupport, setIsGeneratingSupport] = useState(false);
    const [dynamicNotes, setDynamicNotes] = useState<string | undefined>(undefined);


    useEffect(() => {
        if (isOpen) {
            // Reset states
            setDynamicNotes(undefined);
            setDecisionSupportSummary(null);
            setIsGenerating(false);
            setIsGeneratingSupport(false);
            setError('');
            
            // Populate feedback from existing notes
            const notes = candidate.interview?.notes || '';
            const summaryMatch = notes.match(/\*\*Resumo da Entrevista:\*\*\n([\s\S]*?)(?=\n\*\*|$)/);
            const strengthsMatch = notes.match(/\*\*Pontos Fortes:\*\*\n([\s\S]*?)(?=\n\*\*|$)/);
            const improvementsMatch = notes.match(/\*\*Pontos a Desenvolver:\*\*\n([\s\S]*?)(?=\n\*\*|$)/);
            const culturalFitMatch = notes.match(/\*\*Fit Cultural:\*\*\n([\s\S]*?)(?=\n\*\*|$)/);
            const commentsMatch = notes.match(/\*\*Comentários Adicionais:\*\*\n([\s\S]*?)(?=\n\*\*|$)/);
            const aiSummaryMatch = notes.match(/\*\*Sumário da IA:\*\*\n([\s\S]*)/);

            if (summaryMatch) { // If notes are already structured
                setFeedback({
                    summary: summaryMatch[1].trim(),
                    strengths: strengthsMatch ? strengthsMatch[1].trim().replace(/^- /gm, '') : '',
                    improvements: improvementsMatch ? improvementsMatch[1].trim().replace(/^- /gm, '') : '',
                    culturalFit: culturalFitMatch ? culturalFitMatch[1].trim() : '',
                    comments: commentsMatch ? commentsMatch[1].trim() : '',
                });
            } else if (notes) { // If old unstructured notes exist
                setFeedback({ ...defaultFeedbackTemplate, summary: notes });
            } else { // New feedback
                setFeedback(defaultFeedbackTemplate);
            }
            setAiSummary(aiSummaryMatch ? aiSummaryMatch[1].trim() : null);

            // Find dynamic notes
            const interviewDate = candidate.interview?.date;
            if (interviewDate) {
                const relevantDynamic = dynamics.find(d => d.date === interviewDate && d.participants.includes(candidate.id));
                if (relevantDynamic) {
                    for (const group of relevantDynamic.groups) {
                        if (group.members.includes(candidate.id) && group.individualNotes?.[candidate.id]) {
                            setDynamicNotes(group.individualNotes[candidate.id]);
                            break; // Found the note, exit loop
                        }
                    }
                }
            }
        }
    }, [isOpen, candidate, dynamics]);

    if (!isOpen) return null;

    const handleFeedbackChange = (field: keyof typeof feedback, value: string) => {
        setFeedback(prev => ({ ...prev, [field]: value }));
    };

    const handleGenerateSupport = async () => {
        setIsGeneratingSupport(true);
        setDecisionSupportSummary(null);
        setError('');

        const userFeedbackText = [
            `**Resumo da Entrevista:**\n${feedback.summary}`,
            `**Pontos Fortes:**\n${feedback.strengths}`,
            `**Pontos a Desenvolver:**\n${feedback.improvements}`,
            `**Fit Cultural:**\n${feedback.culturalFit}`,
            `**Comentários Adicionais:**\n${feedback.comments}`
        ].join('\n\n');

        try {
            const summary = await getDecisionSupportSummary(candidate, job, userFeedbackText, dynamicNotes);
            if (summary) {
                setDecisionSupportSummary(summary);
            } else {
                setError("Não foi possível gerar a análise. Tente novamente.");
            }
        } catch (e) {
            console.error("AI decision support generation failed.", e);
            setError("Ocorreu um erro ao contatar a IA. Verifique sua conexão.");
        } finally {
            setIsGeneratingSupport(false);
        }
    };


    const handleSave = async (newStatus: 'offer' | 'rejected' | 'waitlist') => {
        setIsGenerating(true);
        setError('');

        const userFeedbackText = [
            `**Resumo da Entrevista:**\n${feedback.summary}`,
            `**Pontos Fortes:**\n${feedback.strengths.split('\n').filter(s => s.trim()).map(s => `- ${s}`).join('\n')}`,
            `**Pontos a Desenvolver:**\n${feedback.improvements.split('\n').filter(s => s.trim()).map(s => `- ${s}`).join('\n')}`,
            `**Fit Cultural:**\n${feedback.culturalFit}`,
            `**Comentários Adicionais:**\n${feedback.comments}`
        ].join('\n\n');

        let finalNotes = userFeedbackText;
        try {
            const summary = await summarizeInterviewFeedback(candidate, job, userFeedbackText, newStatus, dynamicNotes);
            if (summary) {
                finalNotes += `\n\n**Sumário da IA:**\n${summary}`;
            }
        } catch (e) {
            console.error("AI Summary generation failed, saving without it.", e);
            setError("Falha ao gerar o resumo da IA. A decisão será salva sem ele.");
        } finally {
            const updatedCandidate: Candidate = {
                ...candidate,
                status: newStatus,
                interview: {
                    ...candidate.interview!,
                    notes: finalNotes,
                },
            };
            delete updatedCandidate.hireDate;
            onUpdateCandidate(updatedCandidate);
            onClose();
            setIsGenerating(false);
        }
    };
    
    const interviewHappened = new Date() > new Date(`${candidate.interview!.date}T${candidate.interview!.time}`);
    const isDecided = ['hired', 'rejected', 'offer', 'waitlist'].includes(candidate.status);

    return (
        <div className="fixed inset-0 bg-light-background/80 dark:bg-background/90 backdrop-blur-md flex justify-center items-center z-[70] p-4 animate-fade-in">
            <div className="bg-light-surface dark:bg-surface rounded-2xl shadow-2xl w-full max-w-3xl max-h-[95vh] flex flex-col border border-light-border dark:border-border relative">
                {(isGenerating || isGeneratingSupport) && (
                    <div className="absolute inset-0 bg-light-surface/80 dark:bg-surface/80 flex flex-col justify-center items-center z-10 rounded-2xl">
                        <div className="animate-spin rounded-full h-12 w-12 border-t-2 border-b-2 border-light-primary dark:border-primary"></div>
                        <p className="mt-4 font-semibold text-light-text-primary dark:text-text-primary">
                            {isGenerating ? 'Gerando resumo final com IA...' : 'Analisando suas anotações...'}
                        </p>
                    </div>
                )}
                <div className="p-5 border-b border-light-border dark:border-border flex justify-between items-center">
                    <h2 className="text-2xl font-bold text-light-text-primary dark:text-text-primary">Feedback da Entrevista</h2>
                    <button onClick={onClose} className="text-light-text-secondary dark:text-text-secondary hover:text-light-text-primary dark:hover:text-text-primary text-4xl">&times;</button>
                </div>
                <div className="p-6 overflow-y-auto space-y-5">
                    <div className="flex items-center gap-4 p-4 bg-light-background dark:bg-background rounded-lg">
                        <div className="w-16 h-16 flex-shrink-0">
                            <InitialsAvatar name={candidate.name} className="text-2xl"/>
                        </div>
                        <div>
                            <h3 className="text-xl font-bold text-light-text-primary dark:text-text-primary">{candidate.name}</h3>
                            <p className="text-sm text-light-text-secondary dark:text-text-secondary">
                                Entrevista em {new Date(candidate.interview!.date).toLocaleDateString('pt-BR', { timeZone: 'UTC' })} às {candidate.interview!.time}
                            </p>
                        </div>
                    </div>

                    {dynamicNotes && (
                        <div className="p-4 bg-indigo-100 dark:bg-indigo-500/10 border-l-4 border-indigo-400 dark:border-indigo-500 rounded-r-lg">
                            <h4 className="font-bold text-indigo-800 dark:text-indigo-300 mb-2 flex items-center gap-2">
                                Anotações da Dinâmica de Grupo
                            </h4>
                            <p className="text-sm text-indigo-700 dark:text-indigo-200 italic">"{dynamicNotes}"</p>
                        </div>
                    )}

                    <div className="space-y-4">
                        <FeedbackSection label="Resumo da Entrevista">
                            <textarea rows={4} value={feedback.summary} onChange={(e) => handleFeedbackChange('summary', e.target.value)} className="w-full px-3 py-2 bg-light-background dark:bg-background border border-light-border dark:border-border rounded-md focus:ring-2 focus:ring-light-primary dark:focus:ring-primary focus:outline-none" disabled={isDecided}/>
                        </FeedbackSection>
                        <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                            <FeedbackSection label="Pontos Fortes (um por linha)">
                                <textarea rows={4} value={feedback.strengths} onChange={(e) => handleFeedbackChange('strengths', e.target.value)} className="w-full px-3 py-2 bg-light-background dark:bg-background border border-light-border dark:border-border rounded-md focus:ring-2 focus:ring-light-primary dark:focus:ring-primary focus:outline-none" disabled={isDecided}/>
                            </FeedbackSection>
                            <FeedbackSection label="Pontos a Desenvolver (um por linha)">
                                <textarea rows={4} value={feedback.improvements} onChange={(e) => handleFeedbackChange('improvements', e.target.value)} className="w-full px-3 py-2 bg-light-background dark:bg-background border border-light-border dark:border-border rounded-md focus:ring-2 focus:ring-light-primary dark:focus:ring-primary focus:outline-none" disabled={isDecided}/>
                            </FeedbackSection>
                        </div>
                         <FeedbackSection label="Análise de Fit Cultural">
                            <textarea rows={3} value={feedback.culturalFit} onChange={(e) => handleFeedbackChange('culturalFit', e.target.value)} className="w-full px-3 py-2 bg-light-background dark:bg-background border border-light-border dark:border-border rounded-md focus:ring-2 focus:ring-light-primary dark:focus:ring-primary focus:outline-none" disabled={isDecided}/>
                        </FeedbackSection>
                        <FeedbackSection label="Comentários Adicionais">
                            <textarea rows={2} value={feedback.comments} onChange={(e) => handleFeedbackChange('comments', e.target.value)} className="w-full px-3 py-2 bg-light-background dark:bg-background border border-light-border dark:border-border rounded-md focus:ring-2 focus:ring-light-primary dark:focus:ring-primary focus:outline-none" disabled={isDecided}/>
                        </FeedbackSection>
                    </div>

                    {!isDecided && (
                        <div className="my-4 p-4 border border-dashed border-light-border dark:border-border rounded-lg">
                            <div className="flex justify-between items-center">
                                <div>
                                    <h4 className="font-bold text-light-primary dark:text-primary">Ajuda da IA para Decisão</h4>
                                    <p className="text-xs text-light-text-secondary dark:text-text-secondary">Receba uma análise objetiva das suas anotações.</p>
                                </div>
                                <button
                                    type="button"
                                    onClick={handleGenerateSupport}
                                    disabled={isGeneratingSupport || isDecided}
                                    className="flex items-center gap-2 bg-light-secondary dark:bg-secondary text-white font-bold px-4 py-2 text-sm rounded-lg hover:bg-indigo-700 dark:hover:bg-indigo-500 disabled:bg-gray-400 dark:disabled:bg-gray-600 transition-colors"
                                >
                                    {isGeneratingSupport ? (
                                        <div className="animate-spin rounded-full h-4 w-4 border-t-2 border-b-2 border-white"></div>
                                    ) : (
                                        <svg xmlns="http://www.w3.org/2000/svg" width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2.5" strokeLinecap="round" strokeLinejoin="round"><path d="m12 3-1.912 5.813a2 2 0 0 1-1.275 1.275L3 12l5.813 1.912a2 2 0 0 1 1.275 1.275L12 21l1.912-5.813a2 2 0 0 1 1.275-1.275L21 12l-5.813-1.912a2 2 0 0 1-1.275-1.275L12 3Z"/></svg>
                                    )}
                                    {isGeneratingSupport ? 'Analisando...' : 'Gerar Análise'}
                                </button>
                            </div>
                            {decisionSupportSummary && (
                                <div className="mt-3 p-3 bg-light-background dark:bg-background rounded-md text-sm text-light-text-secondary dark:text-text-secondary italic">
                                    <p>"{decisionSupportSummary}"</p>
                                </div>
                            )}
                        </div>
                    )}


                    {aiSummary && (
                        <div className="p-4 bg-light-primary/10 dark:bg-primary/10 border-l-4 border-light-primary dark:border-primary rounded-r-lg">
                            <h4 className="font-bold text-light-primary dark:text-primary mb-2 flex items-center gap-2">
                               <svg xmlns="http://www.w3.org/2000/svg" width="20" height="20" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2.5" strokeLinecap="round" strokeLinejoin="round"><path d="m12 3-1.912 5.813a2 2 0 0 1-1.275 1.275L3 12l5.813 1.912a2 2 0 0 1 1.275 1.275L12 21l1.912-5.813a2 2 0 0 1 1.275-1.275L21 12l-5.813-1.912a2 2 0 0 1-1.275-1.275L12 3Z"/></svg>
                               Sumário da IA sobre a Decisão
                            </h4>
                            <p className="text-sm text-light-text-secondary dark:text-text-secondary italic">"{aiSummary}"</p>
                        </div>
                    )}
                </div>
                <div className="p-5 border-t border-light-border dark:border-border flex justify-between items-center">
                     <div>
                        {isDecided && (
                            <span className={`px-4 py-2 text-sm font-bold rounded-full whitespace-nowrap ${
                                candidate.status === 'hired' ? 'bg-green-400/10 text-green-500 border border-green-400/20' 
                                : candidate.status === 'offer' ? 'bg-cyan-400/10 text-cyan-500 border border-cyan-400/20'
                                : candidate.status === 'waitlist' ? 'bg-amber-400/10 text-amber-500 border border-amber-400/20'
                                : 'bg-red-400/10 text-red-500 border border-red-400/20'
                            }`}>
                                Decisão: {
                                    candidate.status === 'hired' ? 'Contratado' 
                                    : candidate.status === 'offer' ? 'Oferta Feita' 
                                    : candidate.status === 'waitlist' ? 'Em Lista de Espera'
                                    : 'Rejeitado'
                                }
                            </span>
                        )}
                    </div>
                    <div className="flex gap-4">
                        <button 
                            type="button" 
                            onClick={() => handleSave('rejected')}
                            disabled={isDecided || !interviewHappened}
                            className="bg-red-600/20 text-red-500 font-bold px-5 py-2.5 rounded-lg hover:bg-red-600/30 transition-colors disabled:opacity-50 disabled:cursor-not-allowed"
                        >
                            Rejeitar Candidato
                        </button>
                         <button 
                            type="button" 
                            onClick={() => handleSave('waitlist')}
                            disabled={isDecided || !interviewHappened}
                            className="bg-amber-500/20 text-amber-600 font-bold px-5 py-2.5 rounded-lg hover:bg-amber-500/30 transition-colors disabled:opacity-50 disabled:cursor-not-allowed"
                        >
                            Lista de Espera
                        </button>
                        <button 
                            type="button" 
                            onClick={() => handleSave('offer')}
                            disabled={isDecided || !interviewHappened}
                            className="bg-green-600/20 text-green-500 font-bold px-5 py-2.5 rounded-lg hover:bg-green-600/30 transition-colors disabled:opacity-50 disabled:cursor-not-allowed"
                        >
                            Aprovar para o Time
                        </button>
                    </div>
                </div>
            </div>
        </div>
    );
};

export default InterviewFeedbackModal;