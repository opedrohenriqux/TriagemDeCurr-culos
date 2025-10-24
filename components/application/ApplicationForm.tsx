import React, { useState, useMemo, useEffect } from 'react';
import { USERS } from '../../constants';
import { Candidate, Message, User, CandidateStatus, Job, Dynamic } from '../../types';
import MessagingPanel from '../messaging/MessagingPanel';
import CandidateDynamicsView from './CandidateDynamicsView';

interface ApplicationFormProps {
    onSwitchToLogin: () => void;
    onAddCandidate: (formData: any) => number;
    candidates: Candidate[];
    users: User[];
    jobs: Job[];
    messages: Message[];
    dynamics: Dynamic[];
    onSendMessage: (senderId: string, receiverId: string, text: string) => void;
    onMarkMessagesAsRead: (senderId: string, receiverId: string) => void;
}

const JobViewerModal: React.FC<{ job: Job; onClose: () => void }> = ({ job, onClose }) => (
    <div className="fixed inset-0 bg-light-background/80 dark:bg-background/90 backdrop-blur-md flex justify-center items-center z-50 animate-fade-in p-4">
        <div className="bg-light-surface dark:bg-surface rounded-xl shadow-2xl w-full max-w-2xl max-h-[90vh] flex flex-col border border-light-border dark:border-border">
            <div className="p-5 border-b border-light-border dark:border-border flex justify-between items-center">
                <div>
                    <h2 className="text-xl font-bold text-light-text-primary dark:text-text-primary">{job.title}</h2>
                    <p className="text-sm text-light-text-secondary dark:text-text-secondary">{job.department} - {job.location}</p>
                </div>
                <button type="button" onClick={onClose} className="text-light-text-secondary dark:text-text-secondary hover:text-light-text-primary dark:hover:text-text-primary text-3xl">&times;</button>
            </div>
            <div className="p-6 overflow-y-auto space-y-4 text-sm">
                <div>
                    <h3 className="font-bold text-light-primary dark:text-primary mb-2">Descrição</h3>
                    <p className="text-light-text-secondary dark:text-text-secondary">{job.description}</p>
                </div>
                <div>
                    <h3 className="font-bold text-light-primary dark:text-primary mb-2">Responsabilidades</h3>
                    <ul className="list-disc list-inside space-y-1 text-light-text-secondary dark:text-text-secondary">
                        {job.responsibilities.map((item, index) => <li key={index}>{item}</li>)}
                    </ul>
                </div>
                <div>
                    <h3 className="font-bold text-light-primary dark:text-primary mb-2">Benefícios</h3>
                    <ul className="list-disc list-inside space-y-1 text-light-text-secondary dark:text-text-secondary">
                        {job.benefits.map((item, index) => <li key={index}>{item}</li>)}
                    </ul>
                </div>
                <div>
                    <h3 className="font-bold text-light-primary dark:text-primary mb-2">Requisitos</h3>
                    <ul className="list-disc list-inside space-y-1 text-light-text-secondary dark:text-text-secondary">
                        {job.requirements.map((item, index) => <li key={index}>{item}</li>)}
                    </ul>
                </div>
            </div>
             <div className="p-4 border-t border-light-border dark:border-border flex justify-end">
                <button type="button" onClick={onClose} className="bg-light-primary dark:bg-primary text-white font-bold px-5 py-2 rounded-lg hover:bg-light-primary-hover dark:hover:bg-primary-hover transition-colors">
                    Fechar
                </button>
            </div>
        </div>
    </div>
);


const ApplicationForm: React.FC<ApplicationFormProps> = (props) => {
    const { onSwitchToLogin, onAddCandidate, candidates, users, jobs, messages, dynamics, onSendMessage, onMarkMessagesAsRead } = props;
    const activeJobs = jobs.filter(job => job.status === 'active');
    
    const initialFormState = {
        jobId: activeJobs.length > 0 ? activeJobs[0].id : '',
        name: '', email: '', phone: '', age: '', maritalStatus: '', education: '',
        location: '', transport: '', hasExperience: '', experienceDetails: '',
        professionalExperiences: [{ company: '', role: '', duration: '' }],
        complementaryCourses: [{ name: '', institution: '' }],
        personalSummary: '', skills: '', motivation: '', availability: [] as string[],
        fiveYearPlan: '',
    };
    const [formData, setFormData] = useState(initialFormState);
    const [resumeDataUrl, setResumeDataUrl] = useState<string | null>(null);
    const [resumeFileName, setResumeFileName] = useState('');
    const [lgpdConsent, setLgpdConsent] = useState(false);

    const [view, setView] = useState<'form' | 'success' | 'status_check' | 'status_display'>('form');
    const [candidateView, setCandidateView] = useState<'dashboard' | 'dynamics'>('dashboard');
    const [submittedCandidateId, setSubmittedCandidateId] = useState<number | null>(null);
    const [statusCheckId, setStatusCheckId] = useState('');
    const [statusCandidate, setStatusCandidate] = useState<Candidate | null>(null);
    const [statusError, setStatusError] = useState('');
    
    const [isMessagingOpen, setIsMessagingOpen] = useState(false);
    const [messagingError, setMessagingError] = useState('');
    
    const [isJobModalOpen, setIsJobModalOpen] = useState(false);
    const [viewingJob, setViewingJob] = useState<Job | null>(null);
    
    const [liveMessages, setLiveMessages] = useState<Message[]>(messages);

    // This useEffect ensures the local message state is always in sync with the parent state (App.tsx).
    // This is crucial for the unidirectional data flow to work correctly.
    useEffect(() => {
        setLiveMessages(messages);
    }, [messages]);


    useEffect(() => {
        if (!statusCandidate) return;

        const intervalId = setInterval(() => {
            try {
                const storedMessages = window.localStorage.getItem('lacoste-messages');
                if (storedMessages) {
                    const parsedMessages: Message[] = JSON.parse(storedMessages);
                    if (parsedMessages.length !== liveMessages.length) {
                        setLiveMessages(parsedMessages);
                    }
                }
            } catch (error) {
                console.error("Error polling for messages:", error);
            }
        }, 3000); // Poll every 3 seconds

        return () => clearInterval(intervalId);
    }, [statusCandidate, liveMessages.length]);

    const handleCandidateSendMessage = (receiverId: string, text: string) => {
        if (!statusCandidate) return;
        const senderId = `candidate-${statusCandidate.id}`;
        // The child component calls this function, which in turn calls the parent's (App.tsx) function.
        // This ensures the message is added to the central source of truth (localStorage via useLocalStorage hook)
        // and the change propagates down correctly to all components.
        onSendMessage(senderId, receiverId, text);
    };

    const unreadCount = useMemo(() => {
        if (!statusCandidate) return 0;
        const candidateId = `candidate-${statusCandidate.id}`;
        return liveMessages.filter(m => m.receiverId === candidateId && !m.isRead).length;
    }, [liveMessages, statusCandidate]);

    const handleChange = (e: React.ChangeEvent<HTMLInputElement | HTMLSelectElement | HTMLTextAreaElement>) => {
        const { name, value } = e.target;
        setFormData(prev => ({ ...prev, [name]: value }));
    };

    const handleAvailabilityChange = (e: React.ChangeEvent<HTMLInputElement>) => {
        const { value, checked } = e.target;
        setFormData(prev => {
            const currentAvailability = prev.availability;
            if (checked) {
                return { ...prev, availability: [...currentAvailability, value] };
            } else {
                return { ...prev, availability: currentAvailability.filter(item => item !== value) };
            }
        });
    };
    
    const handleFileChange = (e: React.ChangeEvent<HTMLInputElement>) => {
        const file = e.target.files?.[0];
        if (file) {
            if (file.size > 5 * 1024 * 1024) { // 5MB limit
                alert("O arquivo é muito grande. O limite é de 5MB.");
                e.target.value = ''; // Reset the input
                return;
            }
            const reader = new FileReader();
            reader.onloadend = () => {
                setResumeDataUrl(reader.result as string);
                setResumeFileName(file.name);
            };
            reader.readAsDataURL(file);
        } else {
            setResumeDataUrl(null);
            setResumeFileName('');
        }
    };

    const handleExperienceChange = (index: number, event: React.ChangeEvent<HTMLInputElement>) => {
        const newExperiences = [...formData.professionalExperiences];
        // The logic was incorrect. It should update the object at the specified index.
        (newExperiences[index] as any)[event.target.name] = event.target.value;
        setFormData(prev => ({ ...prev, professionalExperiences: newExperiences }));
    };

    const handleAddExperience = () => {
        setFormData(prev => ({ ...prev, professionalExperiences: [...prev.professionalExperiences, { company: '', role: '', duration: '' }] }));
    };

    const handleRemoveExperience = (index: number) => {
        setFormData(prev => ({ ...prev, professionalExperiences: formData.professionalExperiences.filter((_, i) => i !== index) }));
    };

    const handleCourseChange = (index: number, event: React.ChangeEvent<HTMLInputElement>) => {
        (formData.complementaryCourses[index] as any)[event.target.name] = event.target.value;
        setFormData({ ...formData });
    };

    const handleAddCourse = () => {
        setFormData(prev => ({ ...prev, complementaryCourses: [...prev.complementaryCourses, { name: '', institution: '' }] }));
    };

    const handleRemoveCourse = (index: number) => {
        setFormData(prev => ({ ...prev, complementaryCourses: formData.complementaryCourses.filter((_, i) => i !== index) }));
    };
    
    const handleViewJob = () => {
        const selectedJob = activeJobs.find(job => job.id === formData.jobId);
        if (selectedJob) {
            setViewingJob(selectedJob);
            setIsJobModalOpen(true);
        }
    };

    const handleSubmit = (e: React.FormEvent) => {
        e.preventDefault();
        const newId = onAddCandidate({ ...formData, resumeFile: resumeDataUrl });
        setSubmittedCandidateId(newId);
        setView('success');
        window.scrollTo(0, 0);
    };
    
    const handleStatusCheckSubmit = (e: React.FormEvent) => {
        e.preventDefault();
        setStatusError('');
        const input = statusCheckId.trim();

        if (!input) {
            setStatusError('Por favor, insira seu ID ou e-mail.');
            return;
        }

        let foundCandidate: Candidate | undefined;

        // Check if input is a number (ID)
        const id = parseInt(input, 10);
        if (!isNaN(id)) {
            foundCandidate = candidates.find(c => c.id === id);
        }

        // If not found by ID, or if it wasn't a number, try searching by email
        if (!foundCandidate) {
            foundCandidate = candidates.find(c => c.resume.contact.email.toLowerCase() === input.toLowerCase());
        }

        if (foundCandidate) {
            setStatusCandidate(foundCandidate);
            setCandidateView('dashboard');
            setView('status_display');
        } else {
            setStatusError(`Nenhuma inscrição encontrada com o ID ou e-mail fornecido.`);
        }
        window.scrollTo(0, 0);
    };
    
    const handleOpenMessaging = () => {
        setMessagingError('');
        if (statusCandidate) {
            const allowedStatus: CandidateStatus[] = ['screening', 'approved', 'offer', 'hired', 'waitlist'];
            if (allowedStatus.includes(statusCandidate.status)) {
                setIsMessagingOpen(true);
            } else {
                setMessagingError('As mensagens só estão disponíveis a partir da fase de triagem. Por favor, aguarde seu status ser atualizado.');
            }
        } else {
            setMessagingError('Você precisa consultar o status da sua inscrição primeiro para acessar as mensagens.');
        }
    }


    const resetToForm = () => {
        setFormData(initialFormState);
        setResumeDataUrl(null);
        setResumeFileName('');
        setLgpdConsent(false);
        setSubmittedCandidateId(null);
        setStatusCheckId('');
        setStatusCandidate(null);
        setStatusError('');
        setView('form');
        window.scrollTo(0, 0);
    };

    const mainClassName = useMemo(() => {
        if (view === 'status_display' && candidateView === 'dynamics') {
            return "w-full max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-12";
        }
        return "w-full max-w-3xl mx-auto px-4 sm:px-6 lg:px-8 py-12";
    }, [view, candidateView]);

    const formFieldClass = "w-full px-3 py-2 bg-light-background dark:bg-background border border-light-border dark:border-border rounded-md focus:ring-2 focus:ring-light-primary dark:focus:ring-primary focus:outline-none";
    const labelClass = "block text-sm font-medium text-light-text-secondary dark:text-text-secondary mb-1";
    const radioCheckboxClass = "h-4 w-4 text-light-primary dark:text-primary bg-light-surface dark:bg-surface border-light-border dark:border-border focus:ring-light-primary dark:focus:ring-primary";
    
    // --- Views Rendering ---
    const renderSuccessView = () => (
        <div className="bg-light-surface dark:bg-surface p-8 rounded-xl border border-light-border dark:border-border text-center animate-fade-in">
            <svg className="mx-auto h-16 w-16 text-green-500" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M9 12l2 2 4-4m6 2a9 9 0 11-18 0 9 9 0 0118 0z" />
            </svg>
            <h2 className="mt-4 text-2xl font-bold">Inscrição Enviada!</h2>
            <p className="mt-2 text-light-text-secondary dark:text-text-secondary">Agradecemos seu interesse! Seu ID de acompanhamento é:</p>
            <p className="text-2xl font-bold my-4 bg-light-background dark:bg-background py-2 rounded-md border border-dashed border-light-border dark:border-border">{submittedCandidateId}</p>
            <p className="text-sm text-light-text-secondary dark:text-text-secondary">Guarde este número para consultar o status da sua inscrição a qualquer momento em nosso portal.</p>
            <button onClick={resetToForm} className="mt-6 bg-light-primary dark:bg-primary text-white font-bold px-6 py-2 rounded-lg hover:bg-light-primary-hover dark:hover:bg-primary-hover transition-colors">
                Voltar ao Início
            </button>
        </div>
    );
    
    const renderStatusCheckView = () => (
        <div className="bg-light-surface dark:bg-surface p-8 rounded-xl border border-light-border dark:border-border text-center animate-fade-in">
            <h2 className="text-2xl font-bold">Consultar Status da Inscrição</h2>
            <p className="mt-2 text-light-text-secondary dark:text-text-secondary">Insira o ID de acompanhamento ou o e-mail que você usou na inscrição.</p>
            <form onSubmit={handleStatusCheckSubmit} className="mt-6 flex flex-col items-center gap-4">
                <input 
                    type="text"
                    value={statusCheckId}
                    onChange={(e) => setStatusCheckId(e.target.value)}
                    placeholder="Seu ID de acompanhamento ou e-mail"
                    className={`${formFieldClass} max-w-sm text-center`}
                    required
                />
                {statusError && <p className="text-red-500 text-sm">{statusError}</p>}
                <div className="flex gap-4">
                     <button type="button" onClick={resetToForm} className="bg-light-border dark:bg-border font-bold px-6 py-2 rounded-lg hover:bg-light-border/70 dark:hover:bg-border/70 transition-colors">
                        Voltar
                    </button>
                    <button type="submit" className="bg-light-primary dark:bg-primary text-white font-bold px-6 py-2 rounded-lg hover:bg-light-primary-hover dark:hover:bg-primary-hover transition-colors">
                        Consultar
                    </button>
                </div>
            </form>
        </div>
    );

    const renderStatusDisplayView = () => {
        if (!statusCandidate) return null;

        if (candidateView === 'dynamics') {
            return (
                <CandidateDynamicsView
                    candidate={statusCandidate}
                    dynamics={dynamics}
                    allCandidates={candidates}
                    onBack={() => setCandidateView('dashboard')}
                />
            );
        }

        const steps = [
            { name: 'Inscrição Recebida', statuses: ['applied', 'screening'] },
            { name: 'Triagem', statuses: ['screening'] },
            { name: 'Entrevista', statuses: ['approved', 'offer', 'waitlist'] },
            { name: 'Oferta', statuses: ['offer', 'waitlist'] },
            { name: 'Processo Finalizado', statuses: ['hired', 'rejected'] }
        ];

        let currentStepIndex = steps.findIndex(step => step.statuses.includes(statusCandidate.status));
        if (currentStepIndex === -1 && statusCandidate.status === 'applied') currentStepIndex = 0;
        
        const statusTextMap: Record<Candidate['status'], string> = {
            'applied': 'Sua inscrição foi recebida e está na fila para análise.',
            'screening': 'Seu perfil está sendo analisado por nossa equipe de RH.',
            'approved': 'Parabéns! Você foi aprovado na triagem e em breve será contatado para uma entrevista.',
            'offer': 'Você recebeu uma oferta de emprego! Verifique seu e-mail para mais detalhes.',
            'hired': 'Parabéns e seja bem-vindo(a) à equipe Lacoste Burger!',
            'rejected': 'Agradecemos seu interesse, mas optamos por seguir com outros candidatos neste momento.',
            'waitlist': 'Seu perfil é muito bom! Você está em nossa lista de espera para futuras oportunidades.',
            'pending': 'Sua candidatura está pendente de alguma informação.'
        };

        return (
            <div className="bg-light-surface dark:bg-surface p-8 rounded-xl border border-light-border dark:border-border animate-fade-in">
                <h2 className="text-2xl font-bold text-center">Andamento da sua Inscrição</h2>
                <div className="mt-6 text-center">
                    <p className="text-light-text-secondary dark:text-text-secondary">Olá, <strong className="text-light-text-primary dark:text-text-primary">{statusCandidate.name}</strong>!</p>
                    <p className="text-sm text-light-text-secondary dark:text-text-secondary mt-1">Seu ID de inscrição é: <strong className="text-light-text-primary dark:text-text-primary">{statusCandidate.id}</strong></p>
                    <p className="mt-4 p-4 bg-light-background dark:bg-background rounded-md border border-light-border dark:border-border font-semibold">{statusTextMap[statusCandidate.status]}</p>
                </div>

                <div className="mt-8">
                    {steps.map((step, index) => (
                        <div key={step.name} className="flex items-start">
                            <div className="flex flex-col items-center mr-4">
                                <div className={`w-8 h-8 rounded-full flex items-center justify-center font-bold border-2 ${index <= currentStepIndex ? 'bg-light-primary dark:bg-primary border-light-primary dark:border-primary text-white' : 'bg-light-surface dark:bg-surface border-light-border dark:border-border'}`}>
                                    {index <= currentStepIndex ? '✓' : index + 1}
                                </div>
                                {index < steps.length - 1 && <div className={`w-0.5 h-12 ${index < currentStepIndex ? 'bg-light-primary dark:bg-primary' : 'bg-light-border dark:bg-border'}`}></div>}
                            </div>
                            <div className={`pt-1 ${index <= currentStepIndex ? 'font-bold text-light-text-primary dark:text-text-primary' : 'text-light-text-secondary dark:text-text-secondary'}`}>{step.name}</div>
                        </div>
                    ))}
                </div>

                <div className="mt-8 pt-6 border-t border-light-border dark:border-border">
                    <h3 className="text-lg font-bold text-center mb-4 text-light-text-primary dark:text-text-primary">Painel do Candidato</h3>
                    <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                        <button
                            onClick={handleOpenMessaging}
                            className="relative flex items-center justify-center gap-2 w-full p-4 text-left bg-light-background dark:bg-background rounded-lg border border-light-border dark:border-border hover:border-light-primary dark:hover:border-primary hover:bg-light-surface dark:hover:bg-surface transition-colors"
                        >
                            <svg xmlns="http://www.w3.org/2000/svg" width="24" height="24" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round" className="text-light-secondary dark:text-secondary"><path d="M4 4h16c1.1 0 2 .9 2 2v12c0 1.1-.9 2-2 2H4c-1.1 0-2-.9-2-2V6c0-1.1.9-2 2-2z"></path><polyline points="22,6 12,13 2,6"></polyline></svg>
                            <div>
                                <span className="font-bold">Mensagens</span>
                                <p className="text-xs text-light-text-secondary dark:text-text-secondary">Converse com os recrutadores</p>
                            </div>
                            {unreadCount > 0 && (
                                <span className="absolute top-2 right-2 flex h-5 w-5">
                                    <span className="relative inline-flex rounded-full h-5 w-5 bg-red-500 text-white text-xs items-center justify-center">{unreadCount}</span>
                                </span>
                            )}
                        </button>
                        <button
                            onClick={() => setCandidateView('dynamics')}
                            className="flex items-center justify-center gap-2 w-full p-4 text-left bg-light-background dark:bg-background rounded-lg border border-light-border dark:border-border hover:border-light-primary dark:hover:border-primary hover:bg-light-surface dark:hover:bg-surface transition-colors"
                        >
                            <svg xmlns="http://www.w3.org/2000/svg" width="24" height="24" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round" className="text-light-secondary dark:text-secondary"><path d="M17 21v-2a4 4 0 0 0-4-4H5a4 4 0 0 0-4 4v2"/><circle cx="9" cy="7" r="4"/><path d="M23 21v-2a4 4 0 0 0-3-3.87"/><path d="M16 3.13a4 4 0 0 1 0 7.75"/></svg>
                            <div>
                                <span className="font-bold">Dinâmicas</span>
                                <p className="text-xs text-light-text-secondary dark:text-text-secondary">Veja as atividades agendadas</p>
                            </div>
                        </button>
                    </div>
                    {messagingError && <p className="text-red-500 text-sm mt-4 text-center">{messagingError}</p>}
                </div>

                <div className="text-center mt-8">
                    <button onClick={resetToForm} className="bg-light-border dark:bg-border font-bold px-6 py-2 rounded-lg hover:bg-light-border/70 dark:hover:bg-border/70 transition-colors">
                        Voltar ao Início
                    </button>
                </div>
            </div>
        );
    }

    const renderFormView = () => (
        <form onSubmit={handleSubmit} className="bg-light-surface dark:bg-surface p-8 rounded-xl border border-light-border dark:border-border space-y-6 animate-fade-in-up">
            <div>
                <h1 className="text-3xl font-bold">Portal de Carreiras</h1>
                <p className="mt-2 text-light-text-secondary dark:text-text-secondary">Faça parte da nossa equipe! Preencha o formulário abaixo para se candidatar.</p>
            </div>
            {/* ... All form fields ... */}
            <div>
                <label htmlFor="jobId" className={labelClass}>Vaga Desejada*</label>
                <div className="flex items-center gap-2">
                    <select id="jobId" name="jobId" value={formData.jobId} onChange={handleChange} required className={`${formFieldClass} flex-grow`}>
                        {activeJobs.length > 0 ? (
                            activeJobs.map(job => (
                                <option key={job.id} value={job.id}>
                                    {job.title}
                                </option>
                            ))
                        ) : (
                            <option value="" disabled>Nenhuma vaga disponível no momento</option>
                        )}
                    </select>
                    <button 
                        type="button" 
                        onClick={handleViewJob}
                        className="flex-shrink-0 h-10 px-4 text-sm font-semibold bg-light-background dark:bg-background border border-light-border dark:border-border rounded-md hover:bg-light-border dark:hover:bg-border transition-colors text-light-text-secondary dark:text-text-secondary disabled:opacity-50 disabled:cursor-not-allowed"
                        disabled={activeJobs.length === 0 || !formData.jobId}
                    >
                        Visualizar Vaga
                    </button>
                </div>
            </div>
            <div>
                <label htmlFor="name" className={labelClass}>Nome Completo*</label>
                <input type="text" id="name" name="name" value={formData.name} onChange={handleChange} required className={formFieldClass} />
            </div>
            <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
                <div><label htmlFor="email" className={labelClass}>E-mail*</label><input type="email" id="email" name="email" value={formData.email} onChange={handleChange} required className={formFieldClass} placeholder="seuemail@exemplo.com" /></div>
                <div><label htmlFor="phone" className={labelClass}>Número de Telefone</label><input type="tel" id="phone" name="phone" value={formData.phone} onChange={handleChange} className={formFieldClass} placeholder="(XX) XXXXX-XXXX" /></div>
            </div>
            <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
               <div><label htmlFor="age" className={labelClass}>Idade*</label><input type="number" id="age" name="age" value={formData.age} onChange={handleChange} required className={formFieldClass} /></div>
                <div><label htmlFor="maritalStatus" className={labelClass}>Estado Civil*</label><select id="maritalStatus" name="maritalStatus" value={formData.maritalStatus} onChange={handleChange} required className={formFieldClass}><option value="">Selecione...</option><option value="Solteiro">Solteiro(a)</option><option value="Casado">Casado(a)</option><option value="Divorciado">Divorciado(a)</option><option value="Viúvo">Viúvo(a)</option></select></div>
            </div>
            <div><label htmlFor="education" className={labelClass}>Escolaridade*</label><select id="education" name="education" value={formData.education} onChange={handleChange} required className={formFieldClass}><option value="">Selecione...</option><option value="Fundamental Incompleto">Fundamental Incompleto</option><option value="Fundamental Completo">Fundamental Completo</option><option value="Médio Incompleto">Médio Incompleto</option><option value="Médio Completo">Médio Completo</option><option value="Superior Incompleto">Superior Incompleto</option><option value="Superior Completo">Superior Completo</option></select></div>
            <div><label htmlFor="personalSummary" className={labelClass}>Faça um resumo sobre você*</label><textarea id="personalSummary" name="personalSummary" rows={4} value={formData.personalSummary} onChange={handleChange} required className={formFieldClass}></textarea></div>
             <div><label htmlFor="location" className={labelClass}>Bairro e Cidade*</label><input type="text" id="location" name="location" value={formData.location} onChange={handleChange} required className={formFieldClass} placeholder="Ex: Centro, Campinas-SP"/></div>
            <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
                <div><label className={labelClass}>Possui meio de transporte*</label><div className="flex gap-4 mt-2"><label className="flex items-center gap-2 cursor-pointer"><input type="radio" name="transport" value="Sim" checked={formData.transport === 'Sim'} onChange={handleChange} required className={radioCheckboxClass} /> Sim</label><label className="flex items-center gap-2 cursor-pointer"><input type="radio" name="transport" value="Não" checked={formData.transport === 'Não'} onChange={handleChange} required className={radioCheckboxClass} /> Não</label></div></div>
                 <div><label className={labelClass}>Tem experiência anterior em lanchonete?*</label><div className="flex gap-4 mt-2"><label className="flex items-center gap-2 cursor-pointer"><input type="radio" name="hasExperience" value="Sim" checked={formData.hasExperience === 'Sim'} onChange={handleChange} required className={radioCheckboxClass} /> Sim</label><label className="flex items-center gap-2 cursor-pointer"><input type="radio" name="hasExperience" value="Não" checked={formData.hasExperience === 'Não'} onChange={handleChange} required className={radioCheckboxClass} /> Não</label></div></div>
            </div>
            {formData.hasExperience === 'Sim' && (<div className="animate-fade-in"><label htmlFor="experienceDetails" className={labelClass}>Se sim, pode nos contar um pouco mais?</label><textarea id="experienceDetails" name="experienceDetails" rows={3} value={formData.experienceDetails} onChange={handleChange} className={formFieldClass}></textarea></div>)}
            <div><label className={labelClass}>Experiências Profissionais</label>{formData.professionalExperiences.map((exp, index) => (<div key={index} className="grid grid-cols-1 md:grid-cols-4 gap-2 mb-2 p-2 border border-dashed border-light-border dark:border-border rounded-lg"><input type="text" name="company" placeholder="Empresa" value={exp.company} onChange={e => handleExperienceChange(index, e)} className={formFieldClass} /><input type="text" name="role" placeholder="Cargo" value={exp.role} onChange={e => handleExperienceChange(index, e)} className={formFieldClass} /><input type="text" name="duration" placeholder="Período" value={exp.duration} onChange={e => handleExperienceChange(index, e)} className={formFieldClass} />{formData.professionalExperiences.length > 1 && (<button type="button" onClick={() => handleRemoveExperience(index)} className="text-red-500 hover:text-red-700 text-sm font-semibold">Remover</button>)}</div>))}<button type="button" onClick={handleAddExperience} className="mt-2 text-sm font-semibold text-light-primary dark:text-primary hover:text-light-primary-hover dark:hover:text-primary-hover">+ Adicionar Experiência</button></div>
            <div><label className={labelClass}>Cursos Complementares</label>{formData.complementaryCourses.map((course, index) => (<div key={index} className="grid grid-cols-1 md:grid-cols-3 gap-2 mb-2 p-2 border border-dashed border-light-border dark:border-border rounded-lg"><input type="text" name="name" placeholder="Nome do Curso" value={course.name} onChange={e => handleCourseChange(index, e)} className={`${formFieldClass} md:col-span-1`} /><input type="text" name="institution" placeholder="Instituição" value={course.institution} onChange={e => handleCourseChange(index, e)} className={`${formFieldClass} md:col-span-1`} />{formData.complementaryCourses.length > 1 && (<button type="button" onClick={() => handleRemoveCourse(index)} className="text-red-500 hover:text-red-700 text-sm font-semibold">Remover</button>)}</div>))}<button type="button" onClick={handleAddCourse} className="mt-2 text-sm font-semibold text-light-primary dark:text-primary hover:text-light-primary-hover dark:hover:text-primary-hover">+ Adicionar Curso</button></div>
            <div><label htmlFor="skills" className={labelClass}>Escreva as habilidades (palavras) que te definem*</label><textarea id="skills" name="skills" rows={3} value={formData.skills} onChange={handleChange} required className={formFieldClass} placeholder="Marketing, Administração, Disposição, etc*"></textarea></div>
            <div><label htmlFor="motivation" className={labelClass}>O que te motiva a querer trabalhar com a gente?</label><textarea id="motivation" name="motivation" rows={4} value={formData.motivation} onChange={handleChange} className={formFieldClass}></textarea></div>
            <div><label className={labelClass}>Qual período você tem disponibilidade?*</label><div className="flex flex-wrap gap-x-6 gap-y-2 mt-2"><label className="flex items-center gap-2 cursor-pointer"><input type="checkbox" value="Manhã" onChange={handleAvailabilityChange} checked={formData.availability.includes('Manhã')} className={radioCheckboxClass} /> Manhã</label><label className="flex items-center gap-2 cursor-pointer"><input type="checkbox" value="Tarde" onChange={handleAvailabilityChange} checked={formData.availability.includes('Tarde')} className={radioCheckboxClass} /> Tarde</label><label className="flex items-center gap-2 cursor-pointer"><input type="checkbox" value="Noite" onChange={handleAvailabilityChange} checked={formData.availability.includes('Noite')} className={radioCheckboxClass} /> Noite</label><label className="flex items-center gap-2 cursor-pointer"><input type="checkbox" value="Período Integral" onChange={handleAvailabilityChange} checked={formData.availability.includes('Período Integral')} className={radioCheckboxClass} /> Período Integral</label></div></div>
            <div><label htmlFor="fiveYearPlan" className={labelClass}>Como se imagina daqui a 5 anos?*</label><textarea id="fiveYearPlan" name="fiveYearPlan" rows={4} value={formData.fiveYearPlan} onChange={handleChange} required className={formFieldClass}></textarea></div>
            <div><label htmlFor="resumeFile" className={labelClass}>Anexar Currículo (Opcional, máx 5MB)</label><div className="mt-1 flex items-center gap-3"><label htmlFor="resumeFile" className="cursor-pointer bg-light-background dark:bg-background border border-light-border dark:border-border rounded-md px-4 py-2 text-sm font-semibold text-light-text-secondary dark:text-text-secondary hover:bg-light-border dark:hover:bg-border">Escolher Arquivo</label><input type="file" id="resumeFile" name="resumeFile" className="sr-only" onChange={handleFileChange} accept=".pdf,.doc,.docx" />{resumeFileName && <span className="text-sm text-light-text-secondary dark:text-text-secondary truncate max-w-xs">{resumeFileName}</span>}</div></div>
            <div className="pt-4 border-t border-light-border dark:border-border"><div className="space-y-3"><p className="text-xs text-light-text-secondary dark:text-text-secondary">Ao se inscrever, você concorda com a nossa Política de Privacidade e com a Lei Geral de Proteção de Dados (LGPD). Seus dados permanecerão em nosso banco de talentos pelo período de 12 meses para futuras análises e oportunidades.</p><label className="flex items-center gap-2 cursor-pointer text-sm"><input type="checkbox" checked={lgpdConsent} onChange={(e) => setLgpdConsent(e.target.checked)} required className={radioCheckboxClass} /> Li e concordo com os termos.*</label></div><button type="submit" disabled={!lgpdConsent || activeJobs.length === 0} className="w-full mt-4 bg-light-primary dark:bg-primary text-white font-bold py-3 rounded-lg hover:bg-light-primary-hover dark:hover:bg-primary-hover transition-colors disabled:bg-gray-400 dark:disabled:bg-gray-600 disabled:cursor-not-allowed">Enviar Inscrição</button></div>
        </form>
    );

    const renderContent = () => {
        switch (view) {
            case 'success': return renderSuccessView();
            case 'status_check': return renderStatusCheckView();
            case 'status_display': return renderStatusDisplayView();
            case 'form':
            default: return renderFormView();
        }
    };
    
    return (
        <div className="min-h-screen bg-light-background dark:bg-background text-light-text-primary dark:text-text-primary">
            <header className="bg-light-surface/80 dark:bg-background/80 backdrop-blur-sm border-b border-light-border dark:border-border sticky top-0 z-10">
                <div className="w-full max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 flex items-center justify-between h-16">
                     <div className="flex items-center">
                        <svg className="w-8 h-8 text-light-primary dark:text-primary" fill="none" stroke="currentColor" viewBox="0 0 24 24" xmlns="http://www.w3.org/2000/svg"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M16 12a4 4 0 10-8 0 4 4 0 008 0zm0 0v1.5a2.5 2.5 0 005 0V12a9 9 0 10-9 9m4.5-1.206a8.959 8.959 0 01-4.5 1.207"></path></svg>
                        <span className="ml-2 text-xl font-bold">Lacoste Burger</span>
                    </div>
                    <div className="flex items-center gap-4">
                        <button onClick={() => setView('status_check')} className="text-sm font-semibold text-light-text-secondary dark:text-text-secondary hover:text-light-primary dark:hover:text-primary transition-colors">
                            Acesso Candidato
                        </button>
                        <div className="h-6 w-px bg-light-border dark:bg-border"></div>
                        <button onClick={onSwitchToLogin} className="text-sm font-semibold text-light-text-secondary dark:text-text-secondary hover:text-light-primary dark:hover:text-primary transition-colors">
                            Área do Recrutador &rarr;
                        </button>
                    </div>
                </div>
            </header>
            
            <main className={mainClassName}>
                {renderContent()}
            </main>
            
            {isMessagingOpen && statusCandidate && (
                <MessagingPanel
                    currentUser={{ id: `candidate-${statusCandidate.id}`, name: statusCandidate.name, type: 'candidate' }}
                    messages={liveMessages}
                    users={users}
                    candidates={candidates}
                    jobs={jobs}
                    onClose={() => setIsMessagingOpen(false)}
                    onSendMessage={handleCandidateSendMessage}
                    onUpdateMessage={() => {}}
                    onMarkAsRead={(senderId) => onMarkMessagesAsRead(senderId, `candidate-${statusCandidate.id}`)}
                    archivedConversations={new Set<string>()}
                    onDeleteConversation={() => {}}
                    onArchiveConversation={() => {}}
                    onUnarchiveConversation={() => {}}
                    preselectedId={null}
                />
            )}

            {messagingError && (
                 <div className="fixed inset-0 bg-black/50 flex items-center justify-center z-50 p-4" onClick={() => setMessagingError('')}>
                    <div className="bg-light-surface dark:bg-surface p-6 rounded-lg shadow-xl text-center max-w-sm" onClick={e => e.stopPropagation()}>
                        <h3 className="text-lg font-bold text-yellow-600 dark:text-yellow-400">Acesso Restrito</h3>
                        <p className="mt-2 text-sm text-light-text-secondary dark:text-text-secondary">{messagingError}</p>
                        <button onClick={() => setMessagingError('')} className="mt-4 bg-light-primary dark:bg-primary text-white font-bold px-4 py-2 rounded-lg">Entendi</button>
                    </div>
                </div>
            )}
            
            {isJobModalOpen && viewingJob && (
                <JobViewerModal job={viewingJob} onClose={() => setIsJobModalOpen(false)} />
            )}
        </div>
    );
};

export default ApplicationForm;