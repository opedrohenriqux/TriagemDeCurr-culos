import React, { useState, useMemo, useEffect } from 'react';
import { Candidate, AIAnalysis, Job, CandidateStatus, Resume, CandidateInterview, User } from '../../types';
import InterviewSchedulerModal from '../schedules/InterviewSchedulerModal';
import BulkInterviewSchedulerModal from '../schedules/BulkInterviewSchedulerModal';
import { analyzeCandidateWithAI, analyzeResumeWithAI } from '../../services/geminiService';
import InitialsAvatar from '../common/InitialsAvatar';
import Pagination from '../common/Pagination';

const Spinner: React.FC = () => (
    <div className="animate-spin rounded-full h-5 w-5 border-t-2 border-b-2 border-white dark:border-background"></div>
);

const StatusBadge: React.FC<{ status?: CandidateStatus }> = ({ status = 'pending' }) => {
    const statusStyles: Record<CandidateStatus, string> = {
        applied: 'bg-gray-400/10 text-gray-500 dark:text-gray-400 border border-gray-400/20',
        screening: 'bg-purple-400/10 text-purple-500 dark:text-purple-400 border border-purple-400/20',
        offer: 'bg-cyan-400/10 text-cyan-500 dark:text-cyan-400 border border-cyan-400/20',
        approved: 'bg-green-400/10 text-green-500 dark:text-green-400 border border-green-400/20',
        rejected: 'bg-red-400/10 text-red-500 dark:text-red-400 border border-red-400/20',
        hired: 'bg-blue-400/10 text-blue-500 dark:text-blue-400 border border-blue-400/20',
        pending: 'bg-yellow-400/10 text-yellow-500 dark:text-yellow-400 border border-yellow-400/20',
        waitlist: 'bg-amber-400/10 text-amber-500 dark:text-amber-400 border border-amber-400/20',
    };
    const statusText: Record<CandidateStatus, string> = {
        pending: 'Em Análise',
        approved: 'Aprovado (Triagem)',
        rejected: 'Rejeitado',
        hired: 'Contratado',
        screening: 'Triagem',
        offer: 'Oferta',
        applied: 'Inscrito',
        waitlist: 'Lista de Espera',
    };
    return (
        <span className={`inline-block whitespace-nowrap px-2.5 py-1 text-xs font-bold rounded-full ${statusStyles[status] || statusStyles.pending}`}>
            {statusText[status] || 'Pendente'}
        </span>
    );
};


const CompatibilityScore: React.FC<{ score: number }> = ({ score }) => {
    const percentage = score * 10;
    const radius = 30;
    const circumference = 2 * Math.PI * radius;
    const strokeDashoffset = circumference - (percentage / 100) * circumference;

    return (
        <div className="relative flex items-center justify-center w-20 h-20">
            <svg className="w-full h-full" viewBox="0 0 80 80">
                <circle
                className="text-light-border dark:text-border"
                strokeWidth="8"
                stroke="currentColor"
                fill="transparent"
                r={radius}
                cx="40"
                cy="40"
                />
                <circle
                className="text-light-primary dark:text-primary"
                strokeWidth="8"
                stroke="currentColor"
                fill="transparent"
                r={radius}
                cx="40"
                cy="40"
                strokeDasharray={circumference}
                strokeDashoffset={strokeDashoffset}
                strokeLinecap="round"
                transform="rotate(-90 40 40)"
                style={{ transition: 'stroke-dashoffset 0.5s ease-out' }}
                />
            </svg>
            <span className="absolute text-xl font-bold text-light-text-primary dark:text-text-primary">{score.toFixed(1)}</span>
        </div>
    );
};


interface CandidateCardProps {
  candidate: any; // Using any to accommodate processed fields
  onOpenProfile: (candidate: Candidate) => void;
  analysis?: AIAnalysis | null;
  onArchive: (candidateId: string) => void;
  onScheduleInterview: (candidate: Candidate) => void;
  onSelect: (id: string) => void;
  isSelected: boolean;
}

const CandidateCard: React.FC<CandidateCardProps> = ({ candidate, onOpenProfile, analysis, onArchive, onScheduleInterview, onSelect, isSelected }) => {
    const [showTooltip, setShowTooltip] = useState(false);
    const canSchedule = ['applied', 'screening', 'approved'].includes(candidate.status);

    return (
        <div
            onMouseEnter={() => setShowTooltip(true)}
            onMouseLeave={() => setShowTooltip(false)}
            className={`relative p-5 bg-light-surface dark:bg-surface rounded-xl border ${isSelected ? 'border-light-primary dark:border-primary ring-2 ring-light-primary/50 dark:ring-primary/50' : 'border-light-border dark:border-border'} group transition-all duration-200`}
        >
             <input
                type="checkbox"
                checked={isSelected}
                onChange={() => onSelect(candidate.id)}
                className="absolute top-4 left-4 h-5 w-5 rounded text-light-primary dark:text-primary bg-light-surface dark:bg-surface border-light-border dark:border-border focus:ring-light-primary dark:focus:ring-offset-light-surface dark:focus:ring-offset-surface z-10"
                onClick={(e) => e.stopPropagation()}
            />
            <div className="flex items-start justify-between gap-4 ml-8">
                <div className="flex items-center gap-4">
                    <div className="w-16 h-16 rounded-full border-2 border-light-border dark:border-border flex-shrink-0">
                        <InitialsAvatar name={candidate.name} className="text-xl" />
                    </div>
                    <div>
                        <h4 className="text-lg font-bold text-light-text-primary dark:text-text-primary">{candidate.name}, <span className="text-base font-medium text-light-text-secondary dark:text-text-secondary">{candidate.age}</span></h4>
                        <p className="text-sm text-light-text-secondary dark:text-text-secondary">{candidate.location}</p>
                         <div className="mt-2">
                            <StatusBadge status={candidate.status} />
                        </div>
                    </div>
                </div>

                <div className="flex flex-col items-center flex-shrink-0">
                    <CompatibilityScore score={candidate.finalScore} />
                    <p className="text-xs text-light-text-secondary dark:text-text-secondary mt-1 font-semibold">Compatibilidade</p>
                </div>
            </div>
            
            {candidate.interview ? (
                <div className="mt-4 pt-4 border-t border-light-border dark:border-border text-center bg-indigo-500/10 p-2 rounded-lg ml-8">
                    <p className="text-sm font-bold text-indigo-600 dark:text-indigo-300">Entrevista Agendada</p>
                    <p className="text-xs text-light-text-secondary dark:text-text-secondary">{new Date(candidate.interview.date).toLocaleDateString('pt-BR', { timeZone: 'UTC' })} às {candidate.interview.time}</p>
                </div>
            ): (
                 <div className="mt-4 pt-4 border-t border-light-border dark:border-border ml-8">
                    <button
                        type="button"
                        onClick={() => onScheduleInterview(candidate)}
                        disabled={!canSchedule}
                        className="w-full bg-light-secondary/20 dark:bg-secondary/20 text-light-secondary dark:text-secondary font-semibold py-2 rounded-lg hover:bg-light-secondary/30 dark:hover:bg-secondary/40 transition-colors text-sm disabled:bg-light-border dark:disabled:bg-border disabled:text-light-text-secondary dark:disabled:text-text-secondary disabled:cursor-not-allowed"
                    >
                        Agendar Entrevista
                    </button>
                </div>
            )}


            <div className="mt-4 pt-4 border-t border-light-border dark:border-border flex items-center gap-2 ml-8">
                <button
                    type="button"
                    onClick={() => onOpenProfile(candidate)}
                    className="w-full bg-light-primary dark:bg-primary text-white dark:text-background font-semibold py-2 rounded-lg hover:bg-light-primary-hover dark:hover:bg-primary-hover transition-colors text-sm"
                >
                    Ver Perfil & Análise IA
                </button>
                 <button 
                    type="button"
                    onClick={() => onArchive(candidate.id)} 
                    className="p-2 text-light-text-secondary dark:text-text-secondary hover:text-light-text-primary dark:hover:text-text-primary bg-light-background dark:bg-background rounded-lg hover:bg-light-border dark:hover:bg-border transition-colors"
                    aria-label="Arquivar candidato"
                >
                    <svg xmlns="http://www.w3.org/2000/svg" width="20" height="20" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round"><path d="M21 8v11a2 2 0 0 1-2 2H5a2 2 0 0 1-2-2V8"/><rect x="1" y="3" width="22" height="5"/><line x1="10" y1="12" x2="14" y2="12"/></svg>
                </button>
            </div>

            {/* Tooltip */}
            {showTooltip && analysis && (
                <div className="absolute bottom-full mb-2 w-72 p-3 bg-light-surface dark:bg-surface border border-light-border dark:border-border text-xs rounded-lg shadow-lg z-20 left-1/2 -translate-x-1/2 opacity-100 transition-opacity duration-300 pointer-events-none">
                    <h5 className="font-bold text-light-primary dark:text-primary mb-1">Análise Rápida IA</h5>
                    {analysis.strengths?.length > 0 && (
                        <>
                            <p className="font-semibold mt-2 text-green-600 dark:text-green-400">Pontos Fortes:</p>
                            <ul className="list-disc list-inside text-light-text-primary dark:text-text-primary">
                                {analysis.strengths.slice(0, 2).map((s, i) => <li key={`s-${i}`}>{s}</li>)}
                            </ul>
                        </>
                    )}
                     {analysis.weaknesses?.length > 0 && (
                        <>
                            <p className="font-semibold mt-2 text-red-600 dark:text-red-400">Pontos a Desenvolver:</p>
                            <ul className="list-disc list-inside text-light-text-primary dark:text-text-primary">
                                {analysis.weaknesses.slice(0, 2).map((w, i) => <li key={`w-${i}`}>{w}</li>)}
                            </ul>
                        </>
                    )}
                    <div className="absolute bottom-0 left-1/2 -translate-x-1/2 translate-y-1/2 w-3 h-3 bg-light-surface dark:bg-surface border-r border-b border-light-border dark:border-border transform rotate-45"></div>
                </div>
            )}
        </div>
    );
};


const AnalysisSkeleton: React.FC = () => (
  <div className="space-y-5 animate-pulse p-4">
    <div>
      <div className="h-4 bg-light-border dark:bg-border rounded w-1/3 mb-2"></div>
      <div className="h-4 bg-light-border dark:bg-border rounded"></div>
    </div>
    <div>
      <div className="h-4 bg-light-border dark:bg-border rounded w-1/2 mb-3"></div>
      <div className="h-3 bg-light-border dark:bg-border rounded w-full"></div>
      <div className="h-3 bg-light-border dark:bg-border rounded w-5/6 mt-2"></div>
    </div>
    <div>
      <div className="h-4 bg-light-border dark:bg-border rounded w-1/4 mb-3"></div>
      <div className="h-3 bg-light-border dark:bg-border rounded w-full"></div>
    </div>
    <div>
      <div className="h-4 bg-light-border dark:bg-border rounded w-1/3 mb-3"></div>
      <div className="h-3 bg-light-border dark:bg-border rounded w-full"></div>
    </div>
  </div>
);

const AnalysisError: React.FC<{ message: string; onRetry: () => void }> = ({ message, onRetry }) => (
    <div className="text-center p-4 m-4 bg-red-100 dark:bg-red-900/20 border border-red-200 dark:border-red-500/30 rounded-lg">
        <svg xmlns="http://www.w3.org/2000/svg" className="mx-auto h-10 w-10 text-red-500 dark:text-red-400" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={2}>
            <path strokeLinecap="round" strokeLinejoin="round" d="M12 8v4m0 4h.01M21 12a9 9 0 11-18 0 9 9 0 0118 0z" />
        </svg>
        <p className="mt-2 text-sm text-red-700 dark:text-red-300">{message}</p>
        <button type="button" onClick={onRetry} className="mt-4 bg-red-600 text-white px-4 py-1.5 text-sm font-semibold rounded-lg hover:bg-red-700 transition-colors">
            Tentar Novamente
        </button>
    </div>
);


interface ResumeModalProps {
  candidate: Candidate;
  onClose: () => void;
}

const ResumeSection: React.FC<{ title: string; children: React.ReactNode }> = ({ title, children }) => (
    <div>
        <h3 className="text-lg font-semibold text-light-primary dark:text-primary mb-3 border-b-2 border-light-primary/30 dark:border-primary/30 pb-2">{title}</h3>
        <div className="text-light-text-primary dark:text-text-primary space-y-2">{children}</div>
    </div>
);

const ResumeModal: React.FC<ResumeModalProps> = ({ candidate, onClose }) => {
    const { resume } = candidate;

    return (
        <div className="fixed inset-0 bg-light-background/80 dark:bg-background/90 backdrop-blur-md flex justify-center items-center z-[60] p-4 animate-fade-in">
            <div className="bg-light-surface dark:bg-surface rounded-xl shadow-2xl w-full max-w-4xl h-full max-h-[95vh] flex flex-col relative border border-light-border dark:border-border">
                <div className="p-5 border-b border-light-border dark:border-border flex justify-between items-center flex-shrink-0">
                    <h2 className="text-2xl font-bold text-light-text-primary dark:text-text-primary">Currículo de {candidate.name}</h2>
                    <button type="button" onClick={onClose} className="text-light-text-secondary dark:text-text-secondary hover:text-light-text-primary dark:hover:text-text-primary text-4xl">&times;</button>
                </div>
                <div className="p-8 overflow-y-auto space-y-8">
                    {/* Personal Info */}
                    <div className="grid grid-cols-2 md:grid-cols-4 gap-4 text-center bg-light-background dark:bg-background p-4 rounded-lg">
                        <div><strong className="block text-light-text-secondary dark:text-text-secondary text-sm">Idade</strong>{candidate.age} anos</div>
                        <div><strong className="block text-light-text-secondary dark:text-text-secondary text-sm">Cidade</strong>{candidate.location.split('(')[0]}</div>
                        <div><strong className="block text-light-text-secondary dark:text-text-secondary text-sm">Estado Civil</strong>{candidate.maritalStatus}</div>
                        <div><strong className="block text-light-text-secondary dark:text-text-secondary text-sm">Escolaridade</strong>{candidate.education}</div>
                    </div>
                    
                    {/* Professional Experience */}
                    <ResumeSection title="Experiência Profissional">
                        {resume.professionalExperience.length > 0 ? resume.professionalExperience.map((exp, index) => (
                            <div key={index} className="pl-4 border-l-2 border-light-border dark:border-border py-1">
                                <h4 className="font-bold text-light-text-primary dark:text-text-primary">{exp.role}</h4>
                                <p className="text-sm font-semibold text-light-text-secondary dark:text-text-secondary">{exp.company} | {exp.duration}</p>
                                <p className="text-sm mt-1 text-light-text-secondary dark:text-text-secondary">{exp.description}</p>
                            </div>
                        )) : <p className="text-light-text-secondary dark:text-text-secondary">Nenhuma experiência profissional registrada.</p>}
                    </ResumeSection>
                    
                    {/* Skills */}
                    <ResumeSection title="Habilidades e Competências">
                        <div className="flex flex-wrap gap-2">
                           {candidate.skills.map(skill => <span key={skill} className="bg-light-background dark:bg-background text-xs font-semibold px-2.5 py-1 rounded-full text-light-text-secondary dark:text-text-secondary border border-light-border dark:border-border">{skill}</span>)}
                        </div>
                    </ResumeSection>
                    
                    {/* Courses */}
                     {resume.courses.length > 0 && (
                        <ResumeSection title="Cursos e Certificações">
                            <ul className="list-disc list-inside text-light-text-secondary dark:text-text-secondary">
                                {resume.courses.map((course, index) => (
                                    <li key={index}><span className="text-light-text-primary dark:text-text-primary">{course.name}</span> - <em>{course.institution}</em></li>
                                ))}
                            </ul>
                        </ResumeSection>
                    )}
                    
                    {/* Availability & Contact */}
                    <div className="grid grid-cols-1 md:grid-cols-2 gap-8">
                       <ResumeSection title="Disponibilidade e Outros">
                            <p><strong>Disponibilidade:</strong> {resume.availability}</p>
                            <p><strong>Condução Própria:</strong> {resume.conducaoPropria || 'Não informado'}</p>
                        </ResumeSection>
                        <ResumeSection title="Contato">
                            <p><strong>Email:</strong> {resume.contact.email}</p>
                            <p><strong>Telefone:</strong> {resume.contact.phone}</p>
                        </ResumeSection>
                    </div>

                    {resume.personalSummary && (
                        <ResumeSection title="Resumo Pessoal">
                            <blockquote className="border-l-4 border-light-primary dark:border-primary pl-4 text-light-text-secondary dark:text-text-secondary italic">"{resume.personalSummary}"</blockquote>
                        </ResumeSection>
                    )}
                    
                    {resume.motivo && (
                        <ResumeSection title="Motivação para a Vaga">
                            <blockquote className="border-l-4 border-light-primary dark:border-primary pl-4 text-light-text-secondary dark:text-text-secondary italic">"{resume.motivo}"</blockquote>
                        </ResumeSection>
                    )}

                    {resume.fiveYearPlan && (
                        <ResumeSection title="Como se imagina daqui a 5 anos?">
                            <blockquote className="border-l-4 border-light-primary dark:border-primary pl-4 text-light-text-secondary dark:text-text-secondary italic">"{resume.fiveYearPlan}"</blockquote>
                        </ResumeSection>
                    )}

                </div>
            </div>
        </div>
    );
};

interface ProfileModalProps {
    candidate: Candidate;
    jobTitle: string;
    onClose: () => void;
    onAnalysisComplete: (candidateId: number, analysis: AIAnalysis) => void;
    onUpdateCandidate: (candidate: Candidate) => void;
    onViewResume: () => void;
    onArchiveCandidate: (candidateId: number) => void;
}

const ProfileModal: React.FC<ProfileModalProps> = ({ candidate, jobTitle, onClose, onAnalysisComplete, onUpdateCandidate, onViewResume, onArchiveCandidate }) => {
    const [isLoading, setIsLoading] = useState(false);
    const [analysis, setAnalysis] = useState<AIAnalysis | null>(candidate.aiAnalysis || null);
    const [error, setError] = useState<string | null>(null);
    const [isAnalyzingResume, setIsAnalyzingResume] = useState(false);
    const [resumeAnalysisResult, setResumeAnalysisResult] = useState<string | null>(null);

    useEffect(() => {
        // Se já existe uma análise, exiba-a. Se não, pode-se optar por buscar automaticamente.
        // Por enquanto, a busca é manual através do botão "Analisar".
        if (candidate.aiAnalysis) {
            setAnalysis(candidate.aiAnalysis);
        }
    }, [candidate.aiAnalysis]);

    const handleResumeAnalysis = async () => {
        if (!candidate.resumeUrl) return;

        setIsAnalyzingResume(true);
        setResumeAnalysisResult(null);
        setError(null);

        const result = await analyzeResumeWithAI(candidate.resumeUrl);

        if (result) {
            setResumeAnalysisResult(result);
        } else {
            setError("Falha ao analisar o currículo.");
            setResumeAnalysisResult("Ocorreu um erro durante a análise. Por favor, tente novamente.");
        }

        setIsAnalyzingResume(false);
    };

    const handleAnalyze = async () => {
        setIsLoading(true);
        setAnalysis(null);
        setError(null);
        
        const result = await analyzeCandidateWithAI(candidate, jobTitle);
        
        if (result) {
            setAnalysis(result);
            onAnalysisComplete(candidate.id, result);

            // Salva a análise no perfil do candidato
            const updatedCandidate = { ...candidate, aiAnalysis: result };
            onUpdateCandidate(updatedCandidate);

        } else {
            setError("Não foi possível concluir a análise. Verifique sua conexão ou a configuração da API e tente novamente.");
        }
        
        setIsLoading(false);
    };

    const handleStatusChange = (e: React.ChangeEvent<HTMLSelectElement>) => {
        const newStatus = e.target.value as CandidateStatus;
        const updatedCandidate: Candidate = { ...candidate, status: newStatus };
        if (newStatus === 'hired') {
            updatedCandidate.hireDate = new Date().toISOString();
        }
        onUpdateCandidate(updatedCandidate);
    }
    
    return (
        <div className="fixed inset-0 bg-light-background/80 dark:bg-background/90 backdrop-blur-md flex justify-center items-center z-50 animate-fade-in p-4">
            <div className="bg-light-surface dark:bg-surface rounded-xl shadow-2xl w-full max-w-4xl max-h-[90vh] flex flex-col border border-light-border dark:border-border">
                <div className="p-5 border-b border-light-border dark:border-border flex justify-between items-center">
                    <h2 className="text-2xl font-bold text-light-text-primary dark:text-text-primary">Perfil do Candidato</h2>
                    <button type="button" onClick={onClose} className="text-light-text-secondary dark:text-text-secondary hover:text-light-text-primary dark:hover:text-text-primary text-4xl">&times;</button>
                </div>
                <div className="p-6 overflow-y-auto grid grid-cols-1 md:grid-cols-2 gap-6">
                    {/* Left Column: Candidate Info */}
                    <div className="space-y-6">
                        <div className="flex items-start">
                            <div className="w-24 h-24 rounded-full border-2 border-light-border dark:border-border flex-shrink-0 mr-6">
                                <InitialsAvatar name={candidate.name} className="text-4xl" />
                            </div>
                            <div className='flex-grow'>
                                <h3 className="text-2xl font-bold text-light-text-primary dark:text-text-primary">{candidate.name}</h3>
                                <p className="text-light-text-secondary dark:text-text-secondary">{candidate.age} anos, {candidate.maritalStatus}</p>
                                <p className="text-light-text-secondary dark:text-text-secondary">{candidate.location}</p>
                                <div className="mt-3 flex items-center gap-4">
                                    <button type="button" onClick={onViewResume} className="text-sm text-light-primary dark:text-primary font-semibold hover:text-light-primary-hover dark:hover:text-primary-hover">
                                        Visualizar Informações
                                    </button>
                                     {candidate.resumeUrl && (
                                        <a
                                            href={candidate.resumeUrl}
                                            download={`CV_${candidate.name.replace(/ /g, '_')}`}
                                            className="inline-flex items-center gap-2 text-sm text-green-600 dark:text-green-400 font-semibold hover:text-green-700 dark:hover:text-green-300 transition-colors"
                                        >
                                            <svg xmlns="http://www.w3.org/2000/svg" width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2.5" strokeLinecap="round" strokeLinejoin="round"><path d="M21 15v4a2 2 0 0 1-2 2H5a2 2 0 0 1-2-2v-4"/><polyline points="7 10 12 15 17 10"/><line x1="12" y1="15" x2="12" y2="3"/></svg>
                                            Baixar Anexo
                                        </a>
                                    )}
                                </div>
                            </div>
                        </div>

                        {candidate.interview && (
                            <div className="bg-indigo-100 dark:bg-indigo-500/10 p-4 rounded-lg border border-indigo-200 dark:border-indigo-500/30">
                                <h4 className="font-bold text-indigo-800 dark:text-indigo-300 mb-2">Entrevista Agendada</h4>
                                <div className="text-sm space-y-1 text-light-text-secondary dark:text-text-secondary">
                                    <p><strong>Data:</strong> {new Date(candidate.interview.date).toLocaleDateString('pt-BR', { timeZone: 'UTC' })}</p>
                                    <p><strong>Horário:</strong> {candidate.interview.time}</p>
                                    <p><strong>Local:</strong> {candidate.interview.location}</p>
                                    <p><strong>Entrevistador(es):</strong> {candidate.interview.interviewers.join(', ')}</p>
                                </div>
                            </div>
                        )}

                         <div>
                            <label htmlFor="status" className="block text-sm font-medium text-light-text-secondary dark:text-text-secondary mb-1">Status da Candidatura</label>
                            <select
                                id="status"
                                value={candidate.status}
                                onChange={handleStatusChange}
                                className="w-full bg-light-background dark:bg-background border border-light-border dark:border-border rounded-md px-3 py-2 text-light-text-primary dark:text-text-primary focus:outline-none focus:ring-2 focus:ring-light-primary dark:focus:ring-primary"
                            >
                               <option value="applied">Inscrito</option>
                               <option value="screening">Triagem</option>
                               <option value="approved">Aprovado (Triagem)</option>
                               <option value="offer">Oferta</option>
                               <option value="hired">Contratado</option>
                               <option value="rejected">Rejeitado</option>
                            </select>
                        </div>

                        <div>
                            <h4 className="font-bold text-light-primary dark:text-primary mb-2">Resumo</h4>
                            <p className="text-light-text-secondary dark:text-text-secondary text-sm">{candidate.summary}</p>
                            <h4 className="font-bold text-light-primary dark:text-primary mt-4 mb-2">Educação</h4>
                            <p className="text-light-text-secondary dark:text-text-secondary text-sm">{candidate.education}</p>
                            <h4 className="font-bold text-light-primary dark:text-primary mt-4 mb-2">Experiência</h4>
                            <p className="text-light-text-secondary dark:text-text-secondary text-sm">{candidate.experience}</p>
                            <h4 className="font-bold text-light-primary dark:text-primary mt-4 mb-2">Habilidades</h4>
                            <div className="flex flex-wrap gap-2">
                                {candidate.skills.map(skill => <span key={skill} className="bg-light-background dark:bg-background text-xs font-semibold px-2.5 py-1 rounded-full text-light-text-secondary dark:text-text-secondary border border-light-border dark:border-border">{skill}</span>)}
                            </div>
                        </div>
                    </div>

                    {/* Right Column: AI Analysis */}
                    <div className="bg-light-background dark:bg-background p-4 rounded-lg border border-light-border dark:border-border">
                        <div className="flex justify-between items-center mb-4">
                            <h4 className="font-bold text-light-primary dark:text-primary">Análise com IA</h4>
                            <button type="button" onClick={handleAnalyze} disabled={isLoading} className="flex items-center gap-2 bg-light-primary dark:bg-primary text-white dark:text-background font-bold px-4 py-2 text-sm rounded-lg hover:bg-light-primary-hover dark:hover:bg-primary-hover disabled:bg-gray-400 dark:disabled:bg-gray-600 transition-colors">
                                {isLoading ? <Spinner /> : <svg xmlns="http://www.w3.org/2000/svg" width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2.5" strokeLinecap="round" strokeLinejoin="round"><path d="m12 3-1.912 5.813a2 2 0 0 1-1.275 1.275L3 12l5.813 1.912a2 2 0 0 1 1.275 1.275L12 21l1.912-5.813a2 2 0 0 1 1.275-1.275L21 12l-5.813-1.912a2 2 0 0 1-1.275-1.275L12 3Z"/></svg>}
                                {isLoading ? 'Analisando...' : 'Analisar'}
                            </button>
                        </div>

                        {isLoading ? (
                            <AnalysisSkeleton />
                        ) : error ? (
                            <AnalysisError message={error} onRetry={handleAnalyze} />
                        ) : analysis ? (
                            <div className="space-y-4">
                                 <div>
                                    <h5 className="font-semibold text-light-text-primary dark:text-text-primary">Score de Compatibilidade</h5>
                                    <div className="w-full bg-light-border dark:bg-border rounded-full h-4 mt-1">
                                        <div className="bg-light-primary dark:bg-primary h-4 rounded-full text-right" style={{ width: `${analysis.fitScore * 10}%` }}>
                                           <span className="px-2 text-xs font-bold text-white dark:text-background">{analysis.fitScore}/10</span>
                                        </div>
                                    </div>
                                </div>
                                <div>
                                    <h5 className="font-semibold text-light-text-primary dark:text-text-primary">Resumo da IA</h5>
                                    <p className="text-sm text-light-text-secondary dark:text-text-secondary">{analysis.summary}</p>
                                </div>
                                {resumeAnalysisResult && (
                                    <div>
                                        <h5 className="font-semibold text-light-text-primary dark:text-text-primary">Análise de Currículo</h5>
                                        <p className="text-sm text-light-text-secondary dark:text-text-secondary whitespace-pre-wrap">{resumeAnalysisResult}</p>
                                    </div>
                                )}
                                <div>
                                    <h5 className="font-semibold text-light-text-primary dark:text-text-primary">Pontos Fortes</h5>
                                    <ul className="list-disc list-inside text-sm text-light-text-secondary dark:text-text-secondary">
                                        {analysis.strengths.map((s,i) => <li key={i}>{s}</li>)}
                                    </ul>
                                </div>
                                <div>
                                    <h5 className="font-semibold text-light-text-primary dark:text-text-primary">Pontos a Desenvolver</h5>
                                    <ul className="list-disc list-inside text-sm text-light-text-secondary dark:text-text-secondary">
                                        {analysis.weaknesses.map((w,i) => <li key={i}>{w}</li>)}
                                    </ul>
                                </div>
                                 {analysis.interviewQuestions && analysis.interviewQuestions.length > 0 && (
                                    <div>
                                        <h5 className="font-semibold text-light-text-primary dark:text-text-primary">Sugestões de Perguntas para Entrevista</h5>
                                        <ul className="list-decimal list-inside text-sm text-light-text-secondary dark:text-text-secondary mt-1 space-y-1">
                                            {analysis.interviewQuestions.map((q,i) => <li key={`q-${i}`}>{q}</li>)}
                                        </ul>
                                    </div>
                                )}
                            </div>
                        ) : (
                            <div className="text-center text-light-text-secondary dark:text-text-secondary p-4 border border-dashed border-light-border dark:border-border rounded-lg">
                              <p className="text-sm">Clique em "Analisar" para obter insights detalhados sobre a compatibilidade deste candidato com a vaga.</p>
                            </div>
                        )}
                    </div>
                </div>
                 <div className="p-4 border-t border-light-border dark:border-border flex justify-end gap-2 flex-shrink-0">
                    <button
                        type="button"
                        onClick={handleResumeAnalysis}
                        disabled={!candidate.resumeUrl || isAnalyzingResume}
                        className="bg-blue-400/20 text-blue-600 dark:bg-blue-600/20 dark:text-blue-400 font-bold px-4 py-2 rounded-lg hover:bg-blue-400/40 dark:hover:bg-blue-600/40 transition-colors text-sm flex items-center gap-2 disabled:opacity-50 disabled:cursor-not-allowed"
                    >
                        {isAnalyzingResume ? <Spinner /> : null}
                        Análise de Currículo
                    </button>
                    <button 
                        type="button"
                        onClick={() => { onArchiveCandidate(candidate.id); onClose(); }} 
                        className="bg-yellow-400/20 text-yellow-600 dark:bg-yellow-600/20 dark:text-yellow-400 font-bold px-4 py-2 rounded-lg hover:bg-yellow-400/40 dark:hover:bg-yellow-600/40 transition-colors text-sm"
                    >
                        Arquivar Candidato
                    </button>
                 </div>
            </div>
        </div>
    );
};


interface AISuggestionPopupProps {
    onClose: () => void;
}

const AISuggestionPopup: React.FC<AISuggestionPopupProps> = ({ onClose }) => (
    <div className="fixed bottom-8 right-8 z-50 w-full max-w-sm bg-light-surface dark:bg-surface border border-light-primary/50 dark:border-primary/50 rounded-lg shadow-2xl p-5 text-light-text-primary dark:text-text-primary animate-fade-in-up">
        <div className="flex items-start gap-4">
             <div className="flex-shrink-0 bg-light-primary/10 dark:bg-primary/10 text-light-primary dark:text-primary p-2 rounded-full mt-1">
                <svg xmlns="http://www.w3.org/2000/svg" width="24" height="24" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round"><path d="m12 3-1.912 5.813a2 2 0 0 1-1.275 1.275L3 12l5.813 1.912a2 2 0 0 1 1.275 1.275L12 21l1.912-5.813a2 2 0 0 1 1.275-1.275L21 12l-5.813-1.912a2 2 0 0 1-1.275-1.275L12 3Z"/></svg>
            </div>
            <div>
                <h4 className="font-bold text-lg">Dica da IA</h4>
                <p className="text-sm text-light-text-secondary dark:text-text-secondary mt-1">Para otimizar sua seleção, foque nos 10 candidatos com maior compatibilidade. Eles já estão no topo da lista!</p>
            </div>
            <button type="button" onClick={onClose} className="absolute top-3 right-3 text-light-text-secondary dark:text-text-secondary hover:text-light-text-primary dark:hover:text-text-primary transition-colors">
                <svg xmlns="http://www.w3.org/2000/svg" width="20" height="20" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round"><line x1="18" y1="6" x2="6" y2="18"></line><line x1="6" y1="6" x2="18" y2="18"></line></svg>
            </button>
        </div>
    </div>
);

interface JobDetailsProps {
  jobId: string;
  onBack: () => void;
  jobs: Job[];
  candidates: Candidate[];
  users: User[];
  onUpdateCandidate: (candidate: Candidate) => void;
  onBulkUpdateCandidates: (updatedCandidates: Candidate[]) => void;
  onArchiveCandidate: (candidateId: number) => void;
  onRestoreCandidate: (candidateId: number) => void;
  onPermanentDeleteCandidate: (candidateId: number) => void;
  onInterviewScheduled: (candidate: Candidate, interviewDetails: CandidateInterview) => void;
  onBulkInterviewScheduled: (candidateIds: number[], interviewDetails: Omit<CandidateInterview, 'notes'>) => void;
}

type SortKey = 'finalScore' | 'name' | 'applicationDate';
type SortDirection = 'asc' | 'desc';
type StatusFilter = 'all' | 'approved' | 'rejected' | 'applied';
type SourceFilter = 'all' | 'portal';

const FilterButton: React.FC<{label: string; count: number; isActive: boolean; onClick: () => void;}> = ({ label, count, isActive, onClick }) => (
    <button
        type="button"
        onClick={onClick}
        className={`px-4 py-2 text-sm font-semibold rounded-lg transition-colors flex items-center gap-2 ${
            isActive
                ? 'bg-light-primary dark:bg-primary text-white dark:text-background'
                : 'bg-light-surface dark:bg-surface text-light-text-secondary dark:text-text-secondary hover:bg-light-border dark:hover:bg-border'
        }`}
    >
        {label}
        <span className={`px-2 py-0.5 rounded-full text-xs font-bold ${
            isActive ? 'bg-black/20 dark:bg-black/20' : 'bg-light-background dark:bg-background'
        }`}>
            {count}
        </span>
    </button>
);


const JobDetails: React.FC<JobDetailsProps> = ({ jobId, onBack, jobs, candidates, users, onUpdateCandidate, onBulkUpdateCandidates, onArchiveCandidate, onRestoreCandidate, onPermanentDeleteCandidate, onInterviewScheduled, onBulkInterviewScheduled }) => {
  const [selectedCandidate, setSelectedCandidate] = useState<Candidate | null>(null);
  const [schedulingCandidate, setSchedulingCandidate] = useState<Candidate | null>(null);
  const [isResumeModalOpen, setIsResumeModalOpen] = useState(false);
  const [showAIPanel, setShowAIPanel] = useState(true);
  const [showAISuggestion, setShowAISuggestion] = useState(false);
  const [aiConfig, setAiConfig] = useState({
    requiredKeywords: '',
    excludeKeywords: '',
    minScore: 7,
    autoReject: false,
  });
  const [analyses, setAnalyses] = useState<Record<number, AIAnalysis | null>>({});
  const [sortConfig, setSortConfig] = useState<{ key: SortKey; direction: SortDirection }>({ key: 'finalScore', direction: 'desc' });
  const [statusFilter, setStatusFilter] = useState<StatusFilter>('all');
  const [sourceFilter, setSourceFilter] = useState<SourceFilter>('all');
  const [isArchivedPanelOpen, setIsArchivedPanelOpen] = useState(false);

  const [selectedCandidateIds, setSelectedCandidateIds] = useState<Set<number>>(new Set());
  const [isBulkModalOpen, setIsBulkModalOpen] = useState(false);
  const [screeningApplied, setScreeningApplied] = useState(false);

  // Pagination state
  const [currentPage, setCurrentPage] = useState(1);
  const CANDIDATES_PER_PAGE = 8;


  useEffect(() => {
    const suggestionShown = sessionStorage.getItem(`suggestionShown_${jobId}`);
    if (!suggestionShown) {
        const timer = setTimeout(() => {
            setShowAISuggestion(true);
            sessionStorage.setItem(`suggestionShown_${jobId}`, 'true');
        }, 2000);
        
        const dismissTimer = setTimeout(() => {
            setShowAISuggestion(false);
        }, 12000);
        
        return () => {
            clearTimeout(timer);
            clearTimeout(dismissTimer);
        }
    }
  }, [jobId]);

  useEffect(() => {
    setCurrentPage(1);
  }, [sortConfig, statusFilter, sourceFilter, aiConfig]);

  const job = useMemo(() => jobs.find((j) => j.id === jobId), [jobId, jobs]);
  const activeApplicants = useMemo(() => candidates.filter((c) => c.jobId === jobId && !c.isArchived), [jobId, candidates]);
  const archivedApplicants = useMemo(() => candidates.filter(c => c.jobId === jobId && c.isArchived), [jobId, candidates]);


  const handleAnalysisComplete = (candidateId: number, analysis: AIAnalysis) => {
    setAnalyses(prev => ({ ...prev, [candidateId]: analysis }));
  };
  
   const handleScheduleInterview = (interviewDetails: CandidateInterview) => {
        if (schedulingCandidate) {
            onInterviewScheduled(schedulingCandidate, interviewDetails);
        }
   };

  const scoredCandidates = useMemo(() => {
    if (!activeApplicants) return [];
    
    return activeApplicants.map(candidate => {
        // FIX: Renamed 'required' to 'requiredKeywordsArr' to avoid using a reserved keyword as a variable name, which could confuse the TypeScript parser.
        const requiredKeywordsArr = aiConfig.requiredKeywords.toLowerCase().split(',').map(k => k.trim()).filter(k => k);
        const combinedText = `${candidate.skills.join(', ')} ${candidate.summary}`.toLowerCase();
        const matchedRequiredCount = requiredKeywordsArr.length > 0 ? requiredKeywordsArr.filter(keyword => combinedText.includes(keyword)).length : 0;
        const requiredMatchScore = requiredKeywordsArr.length > 0 ? (matchedRequiredCount / requiredKeywordsArr.length) * 10 : 10;
        const baseScore = candidate.fitScore || 5;
        const finalScore = (baseScore * 0.8) + (requiredMatchScore * 0.2);

        return { ...candidate, finalScore };
    });
  }, [activeApplicants, aiConfig.requiredKeywords]);

  const statusCounts = useMemo(() => {
    const approvedStatuses: CandidateStatus[] = ['approved', 'offer', 'waitlist', 'hired'];
    return {
        all: scoredCandidates.length,
        applied: scoredCandidates.filter(c => ['applied', 'screening'].includes(c.status)).length,
        approved: scoredCandidates.filter(c => approvedStatuses.includes(c.status)).length,
        rejected: scoredCandidates.filter(c => c.status === 'rejected').length,
    };
  }, [scoredCandidates]);

  const approvedForScheduling = useMemo(() => 
    scoredCandidates.filter(c => c.status === 'approved'), 
  [scoredCandidates]);

  const handleScheduleAllApproved = () => {
    if (approvedForScheduling.length === 0) return;
    const ids = approvedForScheduling.map(c => c.id);
    setSelectedCandidateIds(new Set(ids));
    setIsBulkModalOpen(true);
  };


  const filteredAndSortedCandidates = useMemo(() => {
    let candidatesToProcess = [...scoredCandidates];

    if (statusFilter !== 'all') {
        if (statusFilter === 'approved') {
            const approvedStatuses: CandidateStatus[] = ['approved', 'offer', 'waitlist', 'hired'];
            candidatesToProcess = candidatesToProcess.filter(c => approvedStatuses.includes(c.status));
        } else if (statusFilter === 'applied') {
            candidatesToProcess = candidatesToProcess.filter(c => ['applied', 'screening'].includes(c.status));
        } else {
            candidatesToProcess = candidatesToProcess.filter(c => c.status === statusFilter);
        }
    }

    if (sourceFilter === 'portal') {
        candidatesToProcess = candidatesToProcess.filter(c => c.source === 'Portal de Carreiras');
    }
    
    return candidatesToProcess.sort((a, b) => {
        if (sortConfig.key === 'name') {
            return sortConfig.direction === 'asc'
                ? a.name.localeCompare(b.name)
                : b.name.localeCompare(a.name);
        }
        if (sortConfig.key === 'applicationDate') {
            const dateA = new Date(a.applicationDate).getTime();
            const dateB = new Date(b.applicationDate).getTime();
            // FIX: The right-hand side of an arithmetic operation must be of type 'any', 'number', 'bigint' or an enum type.
            return sortConfig.direction === 'asc' ? dateA - dateB : dateB - dateA;
        }
        return sortConfig.direction === 'asc'
            ? a.finalScore - b.finalScore
            : b.finalScore - a.finalScore;
    });

  }, [scoredCandidates, statusFilter, sourceFilter, sortConfig]);

  const totalPages = useMemo(() => {
    return Math.ceil(filteredAndSortedCandidates.length / CANDIDATES_PER_PAGE);
  }, [filteredAndSortedCandidates]);

  const paginatedCandidates = useMemo(() => {
    const startIndex = (currentPage - 1) * CANDIDATES_PER_PAGE;
    return filteredAndSortedCandidates.slice(startIndex, startIndex + CANDIDATES_PER_PAGE);
  }, [currentPage, filteredAndSortedCandidates]);
  
    const handleExportCSV = () => {
        if (!job || filteredAndSortedCandidates.length === 0) {
            alert("Nenhum candidato para exportar.");
            return;
        }

        const headers = [
            'ID', 'Nome', 'Idade', 'Status', 'Data Inscrição', 'Score IA', 'Habilidades', 'Educação', 'Experiência', 'Email', 'Telefone'
        ];

        const rows = filteredAndSortedCandidates.map(c => {
            const escapeCSV = (field: string | number) => {
                const str = String(field);
                if (str.includes(',') || str.includes('"') || str.includes('\n')) {
                    return `"${str.replace(/"/g, '""')}"`;
                }
                return str;
            };

            const data = [
                c.id,
                c.name,
                c.age,
                c.status,
                new Date(c.applicationDate).toLocaleDateString('pt-BR'),
                c.finalScore.toFixed(1),
                c.skills.join(', '),
                c.education,
                c.experience,
                c.resume.contact.email,
                c.resume.contact.phone
            ].map(escapeCSV);
            return data.join(',');
        });

        const csvContent = [headers.join(','), ...rows].join('\n');
        const blob = new Blob([`\uFEFF${csvContent}`], { type: 'text/csv;charset=utf-8;' });

        const link = document.createElement('a');
        const url = URL.createObjectURL(blob);
        const jobTitleSlug = job.title.toLowerCase().replace(/[^a-z0-9]/g, '-');
        link.setAttribute('href', url);
        link.setAttribute('download', `candidatos-${jobTitleSlug}.csv`);
        link.style.visibility = 'hidden';
        document.body.appendChild(link);
        link.click();
        document.body.removeChild(link);
        URL.revokeObjectURL(url);
    };

    const handleSelectCandidate = (candidateId: number) => {
        setSelectedCandidateIds(prev => {
            const newSet = new Set(prev);
            if (newSet.has(candidateId)) {
                newSet.delete(candidateId);
            } else {
                newSet.add(candidateId);
            }
            return newSet;
        });
    };

    const selectedCandidatesForBulk = useMemo(() => {
        return filteredAndSortedCandidates.filter(c => selectedCandidateIds.has(c.id));
    }, [filteredAndSortedCandidates, selectedCandidateIds]);


  if (!job) {
    return <div>Vaga não encontrada.</div>;
  }
  
    const screeningPreview = useMemo(() => {
    const requiredKeywordsArr = aiConfig.requiredKeywords.toLowerCase().split(',').map(k => k.trim()).filter(k => k);
    const excluded = aiConfig.excludeKeywords.toLowerCase().split(',').map(k => k.trim()).filter(k => k);
    
    let approved = 0;
    let rejected = 0;

    const screenableApplicants = activeApplicants.filter(c => ['applied', 'screening'].includes(c.status));

    screenableApplicants.forEach(candidate => {
        const combinedText = `${candidate.skills.join(', ')} ${candidate.summary}`.toLowerCase();

        const hasExcludedKeyword = excluded.length > 0 && excluded.some(keyword => combinedText.includes(keyword));
        if (hasExcludedKeyword && aiConfig.autoReject) {
            rejected++;
            return;
        }
        
        const matchedRequiredCount = requiredKeywordsArr.length > 0 ? requiredKeywordsArr.filter(keyword => combinedText.includes(keyword)).length : 0;
        const requiredMatchScore = requiredKeywordsArr.length > 0 ? (matchedRequiredCount / requiredKeywordsArr.length) * 10 : 10;
        const baseScore = candidate.fitScore || 5;
        const screeningScore = (baseScore * 0.8) + (requiredMatchScore * 0.2);

        if (screeningScore >= aiConfig.minScore) {
            approved++;
        } else if (aiConfig.autoReject) {
            rejected++;
        }
    });

    return { approved, rejected, total: screenableApplicants.length };
  }, [aiConfig, activeApplicants]);

 const handleApplyAIScreening = () => {
    const updatedCandidates: Candidate[] = [];
    const requiredKeywordsArr = aiConfig.requiredKeywords.toLowerCase().split(',').map(k => k.trim()).filter(k => k);
    const excluded = aiConfig.excludeKeywords.toLowerCase().split(',').map(k => k.trim()).filter(k => k);

    activeApplicants.forEach(candidate => {
        if (!['applied', 'screening'].includes(candidate.status)) {
            return;
        }

        const combinedText = `${candidate.skills.join(', ')} ${candidate.summary}`.toLowerCase();
        
        const hasExcludedKeyword = excluded.length > 0 && excluded.some(keyword => combinedText.includes(keyword));
        
        let newStatus: CandidateStatus | null = null;

        if (hasExcludedKeyword && aiConfig.autoReject) {
            newStatus = 'rejected';
        } else {
            const matchedRequiredCount = requiredKeywordsArr.length > 0 ? requiredKeywordsArr.filter(keyword => combinedText.includes(keyword)).length : 0;
            const requiredMatchScore = requiredKeywordsArr.length > 0 ? (matchedRequiredCount / requiredKeywordsArr.length) * 10 : 10;
            const baseScore = candidate.fitScore || 5;
            const screeningScore = (baseScore * 0.8) + (requiredMatchScore * 0.2);

            if (screeningScore >= aiConfig.minScore) {
                newStatus = 'approved';
            } else if (aiConfig.autoReject) {
                newStatus = 'rejected';
            }
        }
        
        if (newStatus) {
            updatedCandidates.push({ ...candidate, status: newStatus });
        }
    });
    
    if (updatedCandidates.length > 0) {
        onBulkUpdateCandidates(updatedCandidates);
    }
    setScreeningApplied(true);
 };
 
 const handleUndoScreening = () => {
    const screenableStatuses: CandidateStatus[] = ['applied', 'screening'];
    const candidatesToRevert = activeApplicants
        .filter(c => !screenableStatuses.includes(c.status)) // Find those changed from screenable statuses
        .map(c => ({ ...c, status: 'applied' as CandidateStatus }));

    if (candidatesToRevert.length > 0) {
        onBulkUpdateCandidates(candidatesToRevert);
    }
    setScreeningApplied(false);
  };

  return (
    <div>
      <div className="flex items-center mb-8">
        <button type="button" onClick={onBack} className="text-light-text-secondary dark:text-text-secondary hover:text-light-text-primary dark:hover:text-text-primary mr-4 p-2 rounded-full hover:bg-light-surface dark:hover:bg-surface">
            <svg xmlns="http://www.w3.org/2000/svg" width="24" height="24" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2.5" strokeLinecap="round" strokeLinejoin="round"><polyline points="15 18 9 12 15 6"></polyline></svg>
        </button>
        <div>
            <h1 className="text-3xl font-bold text-light-text-primary dark:text-text-primary">{job.title}</h1>
            <p className="text-light-text-secondary dark:text-text-secondary">{job.department} - {job.location}</p>
        </div>
      </div>

      <div className="grid grid-cols-1 lg:grid-cols-3 gap-8">
        <div className="lg:col-span-1">
          {/* AI Screening Panel */}
           <div className="bg-light-surface dark:bg-surface p-6 rounded-xl border border-light-border dark:border-border sticky top-20">
                <div className="flex justify-between items-center mb-4">
                    <h3 className="text-lg font-bold text-light-text-primary dark:text-text-primary">Triagem com IA</h3>
                    <button type="button" onClick={() => setShowAIPanel(!showAIPanel)} className="text-light-text-secondary dark:text-text-secondary">
                        {showAIPanel ? 'Ocultar' : 'Mostrar'}
                    </button>
                </div>
                {showAIPanel && (
                    <div className="space-y-4 animate-fade-in">
                        <div>
                            <label className="text-sm font-semibold text-light-text-secondary dark:text-text-secondary">Palavras-chave obrigatórias <span className="text-xs">(separadas por vírgula)</span></label>
                            <input 
                                type="text" 
                                value={aiConfig.requiredKeywords}
                                onChange={(e) => setAiConfig(prev => ({ ...prev, requiredKeywords: e.target.value }))}
                                placeholder="Ex: agilidade, trabalho em equipe"
                                className="mt-1 w-full bg-light-background dark:bg-background text-light-text-primary dark:text-text-primary placeholder-light-text-secondary dark:placeholder-text-secondary px-3 py-2 rounded-lg border border-light-border dark:border-border focus:outline-none focus:ring-2 focus:ring-light-primary dark:focus:ring-primary text-sm"
                            />
                        </div>
                        <div>
                            <label className="text-sm font-semibold text-light-text-secondary dark:text-text-secondary">Excluir candidatos com <span className="text-xs">(separadas por vírgula)</span></label>
                            <input 
                                type="text" 
                                placeholder="Ex: SEO, contabilidade"
                                value={aiConfig.excludeKeywords}
                                onChange={(e) => setAiConfig(prev => ({ ...prev, excludeKeywords: e.target.value }))}
                                className="mt-1 w-full bg-light-background dark:bg-background text-light-text-primary dark:text-text-primary placeholder-light-text-secondary dark:placeholder-text-secondary px-3 py-2 rounded-lg border border-light-border dark:border-border focus:outline-none focus:ring-2 focus:ring-light-primary dark:focus:ring-primary text-sm"
                            />
                        </div>
                         <div>
                            <label className="text-sm font-semibold text-light-text-secondary dark:text-text-secondary">Pontuação mínima de compatibilidade ({aiConfig.minScore.toFixed(1)})</label>
                            <input 
                                type="range" 
                                min="1" 
                                max="10" 
                                step="0.5"
                                value={aiConfig.minScore}
                                onChange={(e) => setAiConfig(prev => ({ ...prev, minScore: parseFloat(e.target.value) }))}
                                className="w-full h-2 bg-light-border dark:bg-border rounded-lg appearance-none cursor-pointer range-thumb-primary"
                            />
                        </div>
                        <div className="flex items-center">
                            <input 
                                type="checkbox" 
                                id="autoReject"
                                checked={aiConfig.autoReject}
                                onChange={(e) => setAiConfig(prev => ({ ...prev, autoReject: e.target.checked }))}
                                className="h-4 w-4 rounded border-light-border dark:border-border text-light-primary dark:text-primary focus:ring-light-primary dark:focus:ring-primary bg-light-background dark:bg-background"
                            />
                            <label htmlFor="autoReject" className="ml-2 text-sm text-light-text-secondary dark:text-text-secondary">Rejeitar automaticamente quem não atingir os critérios</label>
                        </div>
                        <div className="pt-4 border-t border-light-border dark:border-border">
                            <h4 className="font-semibold text-light-text-primary dark:text-text-primary">Previsão da Triagem <span className="text-xs text-light-text-secondary dark:text-text-secondary">({screeningPreview.total} para triar)</span></h4>
                             <div className="mt-2 flex justify-around text-center">
                                <div>
                                    <p className="text-2xl font-bold text-green-500">{screeningPreview.approved}</p>
                                    <p className="text-xs text-green-500">Aprovados</p>
                                </div>
                                 <div>
                                    <p className="text-2xl font-bold text-red-500">{screeningPreview.rejected}</p>
                                    <p className="text-xs text-red-500">Rejeitados</p>
                                </div>
                            </div>
                            {screeningApplied ? (
                                <button 
                                    type="button"
                                    onClick={handleUndoScreening}
                                    className="mt-4 w-full bg-yellow-500 text-white font-bold py-2 rounded-lg hover:bg-yellow-600 transition-colors flex items-center justify-center gap-2"
                                >
                                    <svg xmlns="http://www.w3.org/2000/svg" width="18" height="18" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2.5" strokeLinecap="round" strokeLinejoin="round"><path d="M3 12a9 9 0 1 0 9-9 9.75 9.75 0 0 0-6.74 2.74L3 8"/><path d="M3 3v5h5"/></svg>
                                    Desfazer Triagem
                                </button>
                            ) : (
                                <button 
                                    type="button"
                                    onClick={handleApplyAIScreening}
                                    className="mt-4 w-full bg-light-primary dark:bg-primary text-white dark:text-background font-bold py-2 rounded-lg hover:bg-light-primary-hover dark:hover:bg-primary-hover transition-colors flex items-center justify-center gap-2"
                                >
                                    <svg xmlns="http://www.w3.org/2000/svg" width="18" height="18" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2.5" strokeLinecap="round" strokeLinejoin="round"><path d="m12 3-1.912 5.813a2 2 0 0 1-1.275 1.275L3 12l5.813 1.912a2 2 0 0 1 1.275 1.275L12 21l1.912-5.813a2 2 0 0 1 1.275-1.275L21 12l-5.813-1.912a2 2 0 0 1-1.275-1.275L12 3Z"/></svg>
                                    Aplicar Triagem
                                </button>
                            )}
                        </div>
                    </div>
                )}
            </div>
            
            {/* Archived Candidates Panel */}
             <div className="mt-8 bg-light-surface dark:bg-surface p-6 rounded-xl border border-light-border dark:border-border">
                <div className="flex justify-between items-center mb-4">
                    <h3 className="text-lg font-bold text-light-text-primary dark:text-text-primary">Arquivados nesta vaga</h3>
                    <button type="button" onClick={() => setIsArchivedPanelOpen(!isArchivedPanelOpen)} className="text-light-text-secondary dark:text-text-secondary">
                        {isArchivedPanelOpen ? 'Ocultar' : 'Mostrar'} ({archivedApplicants.length})
                    </button>
                </div>
                {isArchivedPanelOpen && (
                    <div className="space-y-2 max-h-48 overflow-y-auto pr-2 animate-fade-in">
                        {archivedApplicants.length > 0 ? archivedApplicants.map(c => (
                            <div key={c.id} className="flex justify-between items-center text-sm p-2 bg-light-background dark:bg-background rounded-md">
                                <span className="text-light-text-secondary dark:text-text-secondary">{c.name}</span>
                                <div className="flex gap-2">
                                    <button type="button" onClick={() => onRestoreCandidate(c.id)} className="text-green-600 dark:text-green-400 font-semibold hover:underline">Restaurar</button>
                                    <button type="button" onClick={() => onPermanentDeleteCandidate(c.id)} className="text-red-600 dark:text-red-400 font-semibold hover:underline">Excluir</button>
                                </div>
                            </div>
                        )) : <p className="text-sm text-center text-light-text-secondary dark:text-text-secondary py-4">Nenhum candidato arquivado.</p>}
                    </div>
                )}
            </div>

        </div>

        <div className="lg:col-span-2">
           {/* Filters and Actions */}
           <div className="flex flex-col md:flex-row justify-between items-center mb-6 gap-4">
               <div className="flex gap-2 flex-wrap">
                   <FilterButton label="Todos" count={statusCounts.all} isActive={statusFilter === 'all'} onClick={() => setStatusFilter('all')} />
                   <FilterButton label="Aprovados" count={statusCounts.approved} isActive={statusFilter === 'approved'} onClick={() => setStatusFilter('approved')} />
                   <FilterButton label="Rejeitados" count={statusCounts.rejected} isActive={statusFilter === 'rejected'} onClick={() => setStatusFilter('rejected')} />
                   <FilterButton label="Inscritos" count={statusCounts.applied} isActive={statusFilter === 'applied'} onClick={() => setStatusFilter('applied')} />
                   <FilterButton 
                        label="Portal de Carreiras" 
                        count={scoredCandidates.filter(c => c.source === 'Portal de Carreiras').length} 
                        isActive={sourceFilter === 'portal'} 
                        onClick={() => setSourceFilter(prev => prev === 'portal' ? 'all' : 'portal')} 
                    />
               </div>
               <div className="flex gap-2 items-center flex-wrap">
                    <label className="text-sm font-semibold text-light-text-secondary dark:text-text-secondary">Ordenar por:</label>
                    <select
                        value={sortConfig.key}
                        onChange={(e) => setSortConfig(prev => ({...prev, key: e.target.value as SortKey}))}
                        className="bg-light-surface dark:bg-surface text-light-text-primary dark:text-text-primary px-3 py-2 text-sm rounded-lg border border-light-border dark:border-border focus:outline-none focus:ring-2 focus:ring-light-primary dark:focus:ring-primary"
                    >
                        <option value="finalScore">Compatibilidade</option>
                        <option value="name">Nome</option>
                        <option value="applicationDate">Data</option>
                    </select>
                    <button
                        type="button"
                        onClick={() => setSortConfig(prev => ({ ...prev, direction: prev.direction === 'asc' ? 'desc' : 'asc' }))}
                        className="p-2 bg-light-surface dark:bg-surface rounded-lg border border-light-border dark:border-border text-light-text-secondary dark:text-text-secondary hover:bg-light-border dark:hover:bg-border"
                        aria-label={`Ordenar ${sortConfig.direction === 'asc' ? 'descendente' : 'ascendente'}`}
                    >
                        {sortConfig.direction === 'asc' ? 
                            <svg xmlns="http://www.w3.org/2000/svg" width="20" height="20" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round"><path d="M12 5v14M18 11l-6-6M6 11l6-6"/></svg> :
                            <svg xmlns="http://www.w3.org/2000/svg" width="20" height="20" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round"><path d="M12 5v14M18 13l-6 6M6 13l6 6"/></svg>
                        }
                    </button>
                     <button 
                        type="button"
                        onClick={handleScheduleAllApproved}
                        disabled={approvedForScheduling.length === 0}
                        className="flex items-center gap-2 bg-light-secondary dark:bg-secondary text-white dark:text-background px-3 py-2 text-sm rounded-lg border border-transparent hover:bg-indigo-700 dark:hover:bg-indigo-500 disabled:bg-light-border dark:disabled:bg-border disabled:text-light-text-secondary dark:disabled:text-text-secondary disabled:cursor-not-allowed transition-colors"
                    >
                        <svg xmlns="http://www.w3.org/2000/svg" width="18" height="18" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round"><rect x="3" y="4" width="18" height="18" rx="2" ry="2"></rect><line x1="16" y1="2" x2="16" y2="6"></line><line x1="8" y1="2" x2="8" y2="6"></line><line x1="3" y1="10" x2="21" y2="10"></line><path d="m9 16 2 2 4-4"></path></svg>
                        Agendar Aprovados ({approvedForScheduling.length})
                    </button>
                     <button type="button" onClick={handleExportCSV} className="flex items-center gap-2 bg-light-surface dark:bg-surface text-light-text-secondary dark:text-text-secondary px-3 py-2 text-sm rounded-lg border border-light-border dark:border-border hover:bg-light-border dark:hover:bg-border">
                        <svg xmlns="http://www.w3.org/2000/svg" width="18" height="18" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round"><path d="M21 15v4a2 2 0 0 1-2 2H5a2 2 0 0 1-2-2v-4"/><polyline points="7 10 12 15 17 10"/><line x1="12" y1="15" x2="12" y2="3"/></svg>
                        Exportar
                    </button>
               </div>
           </div>
            
            {/* Bulk Actions Panel */}
            {selectedCandidateIds.size > 0 && (
                <div className="bg-light-surface dark:bg-surface p-4 rounded-xl border border-light-border dark:border-border mb-6 flex justify-between items-center animate-fade-in">
                    <p className="text-sm font-semibold text-light-text-primary dark:text-text-primary">{selectedCandidateIds.size} candidato(s) selecionado(s).</p>
                    <button 
                        type="button"
                        onClick={() => setIsBulkModalOpen(true)}
                        className="bg-light-secondary dark:bg-secondary text-white dark:text-background font-bold px-4 py-2 rounded-lg hover:bg-indigo-700 dark:hover:bg-indigo-500 transition-colors text-sm"
                    >
                        Agendar Entrevista em Lote
                    </button>
                </div>
            )}


           {/* Candidate List */}
           <div className="grid grid-cols-1 xl:grid-cols-2 gap-5">
                {paginatedCandidates.map((candidate) => (
                    <CandidateCard
                        key={candidate.id}
                        candidate={candidate}
                        analysis={analyses[candidate.id]}
                        onOpenProfile={() => setSelectedCandidate(candidate)}
                        onArchive={onArchiveCandidate}
                        onScheduleInterview={() => setSchedulingCandidate(candidate)}
                        onSelect={handleSelectCandidate}
                        isSelected={selectedCandidateIds.has(candidate.id)}
                    />
                ))}
           </div>
           {filteredAndSortedCandidates.length === 0 && (
               <div className="text-center py-20 bg-light-surface dark:bg-surface rounded-xl border border-dashed border-light-border dark:border-border">
                  <p className="text-light-text-secondary dark:text-text-secondary">Nenhum candidato encontrado com os filtros atuais.</p>
                </div>
           )}
           {totalPages > 1 && (
                <Pagination
                    currentPage={currentPage}
                    totalPages={totalPages}
                    onPageChange={setCurrentPage}
                />
            )}
        </div>
      </div>
      
      {selectedCandidate && (
          <ProfileModal 
            candidate={selectedCandidate} 
            jobTitle={job.title} 
            onClose={() => setSelectedCandidate(null)}
            onAnalysisComplete={handleAnalysisComplete}
            onUpdateCandidate={onUpdateCandidate}
            onViewResume={() => setIsResumeModalOpen(true)}
            onArchiveCandidate={onArchiveCandidate}
          />
      )}
      {isResumeModalOpen && selectedCandidate && (
          <ResumeModal 
            candidate={selectedCandidate}
            onClose={() => setIsResumeModalOpen(false)}
          />
      )}
      {schedulingCandidate && (
        <InterviewSchedulerModal 
            isOpen={!!schedulingCandidate}
            onClose={() => setSchedulingCandidate(null)}
            candidate={schedulingCandidate}
            onSchedule={handleScheduleInterview}
            allUsers={users}
            allCandidates={candidates}
            allJobs={jobs}
        />
      )}
      {isBulkModalOpen && (
          <BulkInterviewSchedulerModal
            isOpen={isBulkModalOpen}
            onClose={() => setIsBulkModalOpen(false)}
            candidatesToSchedule={selectedCandidatesForBulk}
            onScheduleBulk={(details) => {
                onBulkInterviewScheduled(Array.from(selectedCandidateIds), details);
                setIsBulkModalOpen(false);
                setSelectedCandidateIds(new Set());
            }}
            allUsers={users}
            allCandidates={candidates}
            allJobs={jobs}
          />
      )}
      {showAISuggestion && (
          <AISuggestionPopup onClose={() => setShowAISuggestion(false)} />
      )}
    </div>
  );
};

export default JobDetails;