import React, { useState, useEffect, useRef } from 'react';
import LoginScreen from './components/auth/LoginScreen';
import MainLayout, { View } from './components/layout/MainLayout';
import { USERS, INITIAL_JOBS, INITIAL_CANDIDATES, INITIAL_TALENT_POOL, INITIAL_MESSAGES } from './constants';
import { User, Job, Candidate, Talent, CandidateInterview, Message, CandidateStatus, HistoryEvent, HistoryAction, Dynamic, ActiveDynamicTimer } from './types';
import ReminderToast from './components/notifications/ReminderToast';
import UndoToast from './components/notifications/UndoToast';
import ApplicationForm from './components/application/ApplicationForm';
import { generateInterviewInvitationMessage } from './services/geminiService';
import AIMessageOfferToast from './components/notifications/AIMessageOfferToast';

interface ApplicationFormData {
    jobId: string;
    name: string;
    email: string;
    phone: string;
    age: string;
    maritalStatus: string;
    education: string;
    location: string;
    transport: string;
    hasExperience: string;
    experienceDetails: string;
    professionalExperiences: { company: string; role: string; duration: string; }[];
    complementaryCourses: { name: string; institution: string; }[];
    personalSummary: string;
    skills: string;
    motivation: string;
    availability: string[];
    fiveYearPlan: string;
    resumeFile: string | null;
}

// Custom hook for persistent state with localStorage and sync feedback
function useLocalStorage<T>(
    key: string,
    initialValue: T,
    onSync: (status: 'syncing' | 'saved' | 'error') => void
): [T, React.Dispatch<React.SetStateAction<T>>] {
    const [storedValue, setStoredValue] = useState<T>(() => {
        try {
            const item = window.localStorage.getItem(key);
            if (item) {
                const parsedItem = JSON.parse(item);
                // Handle Set deserialization for archived conversations
                if (initialValue instanceof Set && Array.isArray(parsedItem)) {
                    return new Set(parsedItem) as T;
                }
                return parsedItem;
            }
            // If no item, set the initial value in localStorage
            window.localStorage.setItem(key, JSON.stringify(initialValue));
            return initialValue;
        } catch (error) {
            console.error(`Error reading localStorage key “${key}”:`, error);
            return initialValue;
        }
    });

    const setValue = (value: T | ((val: T) => T)) => {
        onSync('syncing'); // Trigger syncing status
        // Add a small delay to make "syncing" visible on fast operations
        setTimeout(() => {
            try {
                const valueToStore = value instanceof Function ? value(storedValue) : value;
                setStoredValue(valueToStore);
                let itemToStore: any = valueToStore;
                // Handle Set serialization
                if (valueToStore instanceof Set) {
                    itemToStore = Array.from(valueToStore.values());
                }
                window.localStorage.setItem(key, JSON.stringify(itemToStore));
                onSync('saved'); // Trigger saved status
            } catch (error) {
                console.error(`Error setting localStorage key “${key}”:`, error);
                onSync('error'); // Trigger error status
            }
        }, 200);
    };

    return [storedValue, setValue as React.Dispatch<React.SetStateAction<T>>];
}


function App() {
  const [currentUser, setCurrentUser] = useState<User | null>(null);
  const [theme, setTheme] = useState<'light' | 'dark'>('dark');
  const [activeView, setActiveView] = useState<View>('vagas');
  const [appState, setAppState] = useState<'application' | 'login'>('application');
  const [syncStatus, setSyncStatus] = useState<'idle' | 'syncing' | 'saved' | 'error'>('idle');
  const syncTimeoutRef = useRef<number | null>(null);

  const handleSync = (status: 'syncing' | 'saved' | 'error') => {
      if (syncTimeoutRef.current) {
          clearTimeout(syncTimeoutRef.current);
      }
      setSyncStatus(status);
      if (status === 'saved' || status === 'error') {
          syncTimeoutRef.current = window.setTimeout(() => setSyncStatus('idle'), 3000);
      }
  };

  // Replace useState with useLocalStorage for data persistence
  const [users, setUsers] = useLocalStorage<User[]>('lacoste-users', USERS, handleSync);
  const [jobs, setJobs] = useLocalStorage<Job[]>('lacoste-jobs', INITIAL_JOBS, handleSync);
  const [candidates, setCandidates] = useLocalStorage<Candidate[]>('lacoste-candidates', INITIAL_CANDIDATES, handleSync);
  const [talentPool, setTalentPool] = useLocalStorage<Talent[]>('lacoste-talent-pool', INITIAL_TALENT_POOL, handleSync);
  const [messages, setMessages] = useLocalStorage<Message[]>('lacoste-messages', INITIAL_MESSAGES, handleSync);
  const [archivedConversations, setArchivedConversations] = useLocalStorage<Set<string>>('lacoste-archived-convos', new Set(), handleSync);
  const [history, setHistory] = useLocalStorage<HistoryEvent[]>('lacoste-history', [], handleSync);
  const [dynamics, setDynamics] = useLocalStorage<Dynamic[]>('lacoste-dynamics', [], handleSync);
  const [activeDynamicTimer, setActiveDynamicTimer] = useLocalStorage<ActiveDynamicTimer | null>('lacoste-active-dynamic', null, handleSync);


  const [activeReminder, setActiveReminder] = useState<{ candidate: Candidate; type: 'reminder' | 'now' } | null>(null);
  const [remindedIntervals, setRemindedIntervals] = useState<Record<string, boolean>>({});
  
  const [messagingState, setMessagingState] = useState({ isOpen: false, preselectedId: null as string | null });

  // State for undo functionality
  const [undoState, setUndoState] = useState<{ originalCandidate: Candidate; newStatus: CandidateStatus } | null>(null);
  const undoTimeoutRef = useRef<number | null>(null);

  // State for AI message offer
  const [aiMessageOffer, setAiMessageOffer] = useState<{ candidate: Candidate; job: Job } | null>(null);

  const logHistory = (action: HistoryAction, details: string) => {
    if (!currentUser) return;
    const newEvent: HistoryEvent = {
      id: Date.now(),
      timestamp: new Date().toISOString(),
      userId: currentUser.id,
      username: currentUser.username,
      action: action,
      details: details,
    };
    setHistory(prev => [newEvent, ...prev]);
  };

  const handleOpenMessaging = (candidateId: number | null = null) => {
    setMessagingState({ isOpen: true, preselectedId: candidateId ? `candidate-${candidateId}` : null });
  };

  const handleCloseMessaging = () => {
    setMessagingState({ isOpen: false, preselectedId: null });
  };


  useEffect(() => {
    try {
      const savedUser = localStorage.getItem('lacoste-burger-user');
      if (savedUser) {
        setCurrentUser(JSON.parse(savedUser));
      }
      const savedTheme = localStorage.getItem('lacoste-burger-theme');
      if (savedTheme) {
        setTheme(savedTheme as 'light' | 'dark');
      }
    } catch (error) {
      console.error("Failed to load data from localStorage", error);
      // Avoid clearing all data if one key is corrupted
    }
  }, []);

  useEffect(() => {
    if (theme === 'dark') {
      document.documentElement.classList.add('dark');
    } else {
      document.documentElement.classList.remove('dark');
    }
    localStorage.setItem('lacoste-burger-theme', theme);
  }, [theme]);

  // Effect for scheduling reminders
  useEffect(() => {
    if (!currentUser) return; // Don't run if not logged in

    const intervalId = setInterval(() => {
        const now = new Date();
        
        // --- Cleanup old reminders from state to prevent memory leak ---
        const activeInterviewIds = new Set(
            candidates
                .filter(c => c.interview && new Date(`${c.interview.date}T${c.interview.time}`) > now)
                .map(c => c.id)
        );
        const cleanedReminders: Record<string, boolean> = {};
        let needsCleaning = false;
        Object.keys(remindedIntervals).forEach(key => {
            const candidateId = parseInt(key.split('_')[0]);
            if (activeInterviewIds.has(candidateId)) {
                cleanedReminders[key] = true;
            } else {
                needsCleaning = true;
            }
        });
        if (needsCleaning) {
            setRemindedIntervals(cleanedReminders);
        }

        // --- Check for interviews happening NOW ---
        const interviewNow = candidates.find(c => {
            if (!c.interview || c.interview.noShow) return false;
            const interviewTime = new Date(`${c.interview.date}T${c.interview.time}`);
            const diffMins = (now.getTime() - interviewTime.getTime()) / 60000;
            return diffMins >= 0 && diffMins < 1; // Started within the last minute
        });

        if (interviewNow) {
            const reminderKey = `${interviewNow.id}_0`;
            if (!remindedIntervals[reminderKey]) {
                setActiveReminder({ candidate: interviewNow, type: 'now' });
                setRemindedIntervals(prev => ({...prev, [reminderKey]: true}));
                return; // Prioritize "now" notification
            }
        }
        
        // --- Check for upcoming interviews to remind ---
        const nextInterviewToNotify = candidates
            .filter(c => c.interview && !c.interview.noShow && new Date(`${c.interview.date}T${c.interview.time}`) > now)
            .sort((a, b) => new Date(`${a.interview!.date}T${a.interview!.time}`).getTime() - new Date(`${b.interview!.date}T${b.interview!.time}`).getTime())
            [0];
        
        if (nextInterviewToNotify) {
            const interviewTime = new Date(`${nextInterviewToNotify.interview!.date}T${nextInterviewToNotify.interview!.time}`);
            const diffMins = (interviewTime.getTime() - now.getTime()) / 60000;
            
            if (diffMins > 0 && diffMins <= 30) {
                const reminderInterval = Math.ceil(diffMins / 5) * 5; // Groups into 30, 25, 20...
                const reminderKey = `${nextInterviewToNotify.id}_${reminderInterval}`;
                
                if (!remindedIntervals[reminderKey] && !activeReminder) {
                    setActiveReminder({ candidate: nextInterviewToNotify, type: 'reminder' });
                    setRemindedIntervals(prev => ({...prev, [reminderKey]: true}));
                }
            }
        }

    }, 1000 * 5); // Check every 5 seconds

    return () => clearInterval(intervalId);
  }, [candidates, remindedIntervals, currentUser, activeReminder]);


  const handleLogin = (username: string, password: string, rememberMe: boolean): boolean => {
    const user = users.find(u => u.username === username && u.password === password);
    if (user) {
      setCurrentUser(user);
      localStorage.setItem('lacoste-burger-user', JSON.stringify(user));
      if (rememberMe) {
        localStorage.setItem('lacoste-burger-creds', JSON.stringify({ username, password }));
      } else {
        localStorage.removeItem('lacoste-burger-creds');
      }
      return true;
    }
    return false;
  };

  const handleLogout = () => {
    setCurrentUser(null);
    localStorage.removeItem('lacoste-burger-user');
    setAppState('application');
  };

  // User Management
  const handleAddUser = (userData: Omit<User, 'id' | 'role'>) => {
    const newUser: User = { ...userData, id: Date.now(), role: 'user' };
    setUsers(prev => [...prev, newUser]);
    logHistory('CREATE_USER', `Criou o usuário '${newUser.username}'.`);
  };

  const handleRemoveUser = (userId: number) => {
    const userToRemove = users.find(u => u.id === userId);
    setUsers(prev => prev.filter(u => u.id !== userId));
    if(userToRemove) logHistory('DELETE_USER', `Removeu o usuário '${userToRemove.username}'.`);
  };

  const handleUpdateUser = (updatedUser: User) => {
    setUsers(prev => prev.map(u => u.id === updatedUser.id ? updatedUser : u));
    logHistory('UPDATE_USER', `Atualizou os dados do usuário '${updatedUser.username}'.`);
  };

  const handleToggleAdminRole = (userId: number) => {
    const userToToggle = users.find(u => u.id === userId);
    setUsers(prev => prev.map(u => u.id === userId ? { ...u, role: u.role === 'admin' ? 'user' : 'admin' } : u));
    if(userToToggle) logHistory('TOGGLE_ADMIN', `Alterou a permissão de admin para o usuário '${userToToggle.username}'.`);
  };

  // Job Management
  const handleAddJob = (jobData: Omit<Job, 'id'>) => {
    const newJob: Job = { ...jobData, id: `job-${Date.now()}-${Math.random()}` };
    setJobs(prev => [newJob, ...prev]);
    logHistory('CREATE_JOB', `Criou a vaga '${newJob.title}'.`);
  };

  const handleUpdateJob = (updatedJob: Job) => {
    setJobs(prev => prev.map(j => j.id === updatedJob.id ? updatedJob : j));
    logHistory('UPDATE_JOB', `Atualizou a vaga '${updatedJob.title}'.`);
  };

  const handleArchiveJob = (jobId: string) => {
    const jobToArchive = jobs.find(j => j.id === jobId);
    setJobs(prev => prev.map(j => j.id === jobId ? { ...j, status: 'archived' } : j));
    if(jobToArchive) logHistory('ARCHIVE_JOB', `Arquivou a vaga '${jobToArchive.title}'.`);
  };

  const handleRestoreJob = (jobId: string) => {
    const jobToRestore = jobs.find(j => j.id === jobId);
    setJobs(prev => prev.map(j => j.id === jobId ? { ...j, status: 'active' } : j));
    if(jobToRestore) logHistory('RESTORE_JOB', `Restaurou a vaga '${jobToRestore.title}'.`);
  };

  const handlePermanentDeleteJob = (jobId: string) => {
    const jobToDelete = jobs.find(j => j.id === jobId);
    setJobs(prev => prev.filter(j => j.id !== jobId));
    if(jobToDelete) logHistory('DELETE_JOB', `Excluiu permanentemente a vaga '${jobToDelete.title}'.`);
  };


  // Candidate Management
  const handleAddCandidate = (formData: ApplicationFormData): number => {
    const experiences = formData.professionalExperiences
        .filter(exp => exp.company.trim() || exp.role.trim() || exp.duration.trim())
        .map(exp => ({ ...exp, description: '' }));
        
    if (experiences.length === 0 && formData.hasExperience === 'Sim' && formData.experienceDetails.trim()) {
         experiences.push({
            company: 'Não especificado',
            role: 'Experiência em lanchonete',
            duration: 'Não especificado',
            description: formData.experienceDetails
        });
    }

    const courses = formData.complementaryCourses.filter(course => course.name.trim() || course.institution.trim());

    const newCandidate: Candidate = {
        id: Date.now(),
        name: formData.name,
        age: parseInt(formData.age, 10) || 0,
        maritalStatus: formData.maritalStatus,
        location: formData.location,
        experience: formData.hasExperience === 'Sim' 
            ? formData.experienceDetails || 'Experiência prévia em lanchonete.'
            : 'Sem experiência anterior em lanchonete.',
        education: formData.education,
        skills: formData.skills.split(',').map(s => s.trim()).filter(s => s),
        summary: formData.personalSummary,
        jobId: formData.jobId,
        fitScore: parseFloat((Math.random() * 4 + 5).toFixed(1)), // Assign a random base score
        status: 'applied',
        applicationDate: new Date().toISOString(),
        source: 'Portal de Carreiras',
        isArchived: false,
        resumeUrl: formData.resumeFile || undefined,
        resume: {
            professionalExperience: experiences,
            courses: courses,
            availability: formData.availability.join(', '),
            contact: {
                phone: formData.phone || 'Não informado',
                email: formData.email || 'Não informado'
            },
            personalSummary: formData.personalSummary,
            conducaoPropria: formData.transport,
            motivo: formData.motivation,
            fiveYearPlan: formData.fiveYearPlan,
        }
    };

    setCandidates(prev => [newCandidate, ...prev]);
    // Note: History is logged by recruiters, not candidates.
    return newCandidate.id;
  };

  const handleUpdateCandidate = async (updatedCandidate: Candidate) => {
    const originalCandidate = candidates.find(c => c.id === updatedCandidate.id);
    
    // --- AI Message Offer Trigger ---
    if (originalCandidate &&
        (originalCandidate.status === 'applied' || originalCandidate.status === 'screening') &&
        updatedCandidate.status === 'approved'
    ) {
        const job = jobs.find(j => j.id === updatedCandidate.jobId);
        if (job) {
            setAiMessageOffer({ candidate: updatedCandidate, job });
        }
    }


    // If candidate is being rejected, add them to the talent pool automatically
    if (originalCandidate && updatedCandidate.status === 'rejected' && originalCandidate.status !== 'rejected') {
        const jobTitle = jobs.find(j => j.id === originalCandidate.jobId)?.title || 'Cargo Anterior';
        const isScreeningRejection = (originalCandidate.status === 'applied' || originalCandidate.status === 'screening');
        
        const newTalent: Omit<Talent, 'id'> = {
            originalCandidateId: originalCandidate.id,
            name: originalCandidate.name,
            age: originalCandidate.age,
            city: originalCandidate.location.split('(')[0].trim(),
            education: originalCandidate.education,
            experience: originalCandidate.experience,
            skills: originalCandidate.skills,
            potential: originalCandidate.fitScore || 5.0,
            status: isScreeningRejection ? 'Rejeitado (Triagem)' : 'Rejeitado (Entrevista)',
            desiredPosition: jobTitle,
            avatarUrl: originalCandidate.avatarUrl,
            gender: originalCandidate.gender,
            rejectionReason: isScreeningRejection 
                ? `Rejeitado na triagem inicial por baixa compatibilidade (Score: ${originalCandidate.fitScore?.toFixed(1) || 'N/A'}).`
                : 'Candidato não aprovado na fase de entrevista por critérios comportamentais ou técnicos.'
        };
        
        const talentExists = talentPool.some(t => t.originalCandidateId === originalCandidate.id);
        if (!talentExists) {
             handleAddTalent(newTalent);
        }
    }

    // --- UNDO LOGIC ---
    // Trigger undo toast for decisions made after an interview
    const decisionStatuses: CandidateStatus[] = ['offer', 'rejected', 'waitlist'];
    if (originalCandidate &&
        originalCandidate.status !== updatedCandidate.status &&
        decisionStatuses.includes(updatedCandidate.status) &&
        originalCandidate.interview
    ) {
        if (undoTimeoutRef.current) {
            clearTimeout(undoTimeoutRef.current);
        }
        // FIX: Create a shallow copy of the original candidate to prevent potential reference issues.
        const originalCandidateCopy = {
            ...originalCandidate,
            interview: originalCandidate.interview ? { ...originalCandidate.interview } : undefined,
        };
        setUndoState({ originalCandidate: originalCandidateCopy, newStatus: updatedCandidate.status });
        undoTimeoutRef.current = window.setTimeout(() => {
            setUndoState(null);
        }, 6000); // 6 seconds to undo
    }

    setCandidates(prev => prev.map(c => c.id === updatedCandidate.id ? updatedCandidate : c));

    if (originalCandidate && originalCandidate.status !== updatedCandidate.status) {
        logHistory('UPDATE_CANDIDATE', `Alterou o status de '${originalCandidate.name}' para '${updatedCandidate.status}'.`);
    } else {
        logHistory('UPDATE_CANDIDATE', `Atualizou os dados do candidato '${updatedCandidate.name}'.`);
    }
  };

  const handleBulkUpdateCandidates = (updatedCandidates: Candidate[]) => {
    // --- Find the first candidate that was approved from screening ---
    const candidateForAiOffer = updatedCandidates.find(updatedCandidate => {
        const originalCandidate = candidates.find(c => c.id === updatedCandidate.id);
        return originalCandidate &&
               (originalCandidate.status === 'applied' || originalCandidate.status === 'screening') &&
               updatedCandidate.status === 'approved';
    });

    // --- Trigger AI Message Offer for that one candidate ---
    if (candidateForAiOffer) {
        const job = jobs.find(j => j.id === candidateForAiOffer.jobId);
        if (job) {
            setAiMessageOffer({ candidate: candidateForAiOffer, job });
        }
    }

    const updatesMap = new Map(updatedCandidates.map(c => [c.id, c]));
    setCandidates(prev =>
        prev.map(c => updatesMap.get(c.id) || c)
    );
    if (updatedCandidates.length > 0) {
        logHistory('UPDATE_CANDIDATE', `Atualizou em lote o status de ${updatedCandidates.length} candidatos.`);
    }
  };

  const handleUndoUpdate = () => {
    if (undoState) {
        // Revert the candidate to its original state
        const original = undoState.originalCandidate;
        setCandidates(prev => prev.map(c => c.id === original.id ? original : c));
        logHistory('UPDATE_CANDIDATE', `Desfez a alteração de status para '${original.name}'.`);
        setUndoState(null);
        if (undoTimeoutRef.current) {
            clearTimeout(undoTimeoutRef.current);
            undoTimeoutRef.current = null;
        }
    }
  };


  const handleArchiveCandidate = (candidateId: number) => {
    const candidate = candidates.find(c => c.id === candidateId);
    setCandidates(prev => prev.map(c => c.id === candidateId ? { ...c, isArchived: true } : c));
    if(candidate) logHistory('ARCHIVE_CANDIDATE', `Arquivou o candidato '${candidate.name}'.`);
  };
  
  const handleRestoreCandidate = (candidateId: number) => {
    const candidate = candidates.find(c => c.id === candidateId);
    setCandidates(prev => prev.map(c => c.id === candidateId ? { ...c, isArchived: false } : c));
    if(candidate) logHistory('RESTORE_CANDIDATE', `Restaurou o candidato '${candidate.name}'.`);
  };

  const handlePermanentDeleteCandidate = (candidateId: number) => {
    const candidate = candidates.find(c => c.id === candidateId);
    setCandidates(prev => prev.filter(c => c.id !== candidateId));
    if(candidate) logHistory('DELETE_CANDIDATE', `Excluiu permanentemente o candidato '${candidate.name}'.`);
  };
  
  const handleInterviewScheduled = (candidate: Candidate, interviewDetails: CandidateInterview) => {
    handleUpdateCandidate({ ...candidate, interview: interviewDetails, status: 'approved' });
    logHistory('UPDATE_CANDIDATE', `Agendou entrevista para '${candidate.name}'.`);
  };
  
  const handleBulkInterviewScheduled = (candidateIds: number[], interviewDetails: Omit<CandidateInterview, 'notes'>) => {
    setCandidates(prev => prev.map(c => {
        if(candidateIds.includes(c.id)) {
            return { ...c, interview: { ...interviewDetails, notes: '' }, status: 'approved' };
        }
        return c;
    }));
    logHistory('UPDATE_CANDIDATE', `Agendou entrevistas em lote para ${candidateIds.length} candidatos.`);
  };

  const handleBulkCancelInterviews = (candidateIds: number[]) => {
    setCandidates(prev => prev.map(c => {
        if(candidateIds.includes(c.id)) {
            const updated = { ...c };
            delete updated.interview;
            updated.status = 'approved';
            return updated;
        }
        return c;
    }));
    logHistory('UPDATE_CANDIDATE', `Cancelou entrevistas em lote para ${candidateIds.length} candidatos.`);
  };


  // Talent Pool Management
  const handleAddTalent = (talentData: Omit<Talent, 'id'>) => {
    const newTalent: Talent = { ...talentData, id: Date.now() };
    setTalentPool(prev => [newTalent, ...prev]);
    logHistory('CREATE_TALENT', `Adicionou '${newTalent.name}' ao banco de talentos.`);
  };

  const handleUpdateTalent = (updatedTalent: Talent) => {
    setTalentPool(prev => prev.map(t => t.id === updatedTalent.id ? updatedTalent : t));
    logHistory('UPDATE_TALENT', `Atualizou os dados do talento '${updatedTalent.name}'.`);
  };
  
  const handleArchiveTalent = (talentId: number) => {
      const talent = talentPool.find(t => t.id === talentId);
      setTalentPool(prev => prev.map(t => t.id === talentId ? { ...t, isArchived: true } : t));
      if(talent) logHistory('ARCHIVE_TALENT', `Arquivou o talento '${talent.name}'.`);
  };

  const handleRestoreTalent = (talentId: number) => {
    const talent = talentPool.find(t => t.id === talentId);
    setTalentPool(prev => prev.map(t => t.id === talentId ? { ...t, isArchived: false } : t));
    if(talent) logHistory('RESTORE_TALENT', `Restaurou o talento '${talent.name}'.`);
  };

  const handlePermanentDeleteTalent = (talentId: number) => {
    const talent = talentPool.find(t => t.id === talentId);
    setTalentPool(prev => prev.filter(t => t.id !== talentId));
    if(talent) logHistory('DELETE_TALENT', `Excluiu permanentemente o talento '${talent.name}'.`);
  };

  const handleSendTalentToJob = (talentId: number, jobId: string) => {
    const talent = talentPool.find(t => t.id === talentId);
    if (!talent) return;

    const newCandidate: Candidate = {
        id: Date.now(),
        name: talent.name,
        age: talent.age,
        maritalStatus: 'Não informado',
        location: talent.city,
        experience: talent.experience,
        education: talent.education,
        skills: talent.skills,
        summary: `Talento do banco de dados com ${talent.experience}.`,
        jobId: jobId,
        fitScore: talent.potential,
        status: 'screening',
        applicationDate: new Date().toISOString(),
        source: 'Banco de Talentos',
        isArchived: false,
        gender: talent.gender,
        resume: {
            professionalExperience: [{ company: 'Informação não disponível', role: 'Informação não disponível', duration: talent.experience, description: talent.experience }],
            courses: [],
            availability: 'A confirmar',
            contact: { phone: 'Não informado', email: 'Não informado' },
            personalSummary: `Talento do banco de dados com ${talent.experience}.`,
        }
    };

    setCandidates(prev => [newCandidate, ...prev]);
    setTalentPool(prev => prev.filter(t => t.id !== talentId));
    const jobTitle = jobs.find(j => j.id === jobId)?.title;
    logHistory('SEND_TALENT_TO_JOB', `Enviou o talento '${talent.name}' para a vaga '${jobTitle}'.`);
  };

  // Messaging Management
  const handleSendMessage = (senderId: string, receiverId: string, text: string) => {
    const newMessage: Message = {
      id: Date.now(),
      senderId,
      receiverId,
      text,
      timestamp: new Date().toISOString(),
      isRead: false,
    };
    setMessages(prev => [...prev, newMessage]);
    logHistory('SEND_MESSAGE', `Enviou uma mensagem para '${receiverId}'.`);
  };

  const handleUpdateMessage = (messageId: number, newText: string, isDeleted: boolean = false) => {
    setMessages(prev => prev.map(msg =>
      msg.id === messageId ? { ...msg, text: newText, isDeleted } : msg
    ));
    if (!isDeleted) {
      logHistory('UPDATE_MESSAGE', `Editou uma mensagem.`);
    }
  };

  const handleMarkMessagesAsRead = (senderId: string, receiverId: string) => {
    setMessages(prev =>
      prev.map(msg =>
        msg.senderId === senderId && msg.receiverId === receiverId && !msg.isRead
          ? { ...msg, isRead: true }
          : msg
      )
    );
  };

  const handleDeleteConversation = (partnerId: string) => {
    if (!currentUser) return;
    const currentUserId = `user-${currentUser.id}`;
    setMessages(prev => prev.filter(msg =>
        !((msg.senderId === currentUserId && msg.receiverId === partnerId) ||
          (msg.senderId === partnerId && msg.receiverId === currentUserId))
    ));
    logHistory('DELETE_CONVERSATION', `Excluiu a conversa com '${partnerId}'.`);
    // Close the panel if the currently viewed conversation is deleted
    if (messagingState.preselectedId === partnerId) {
        handleCloseMessaging();
    }
  };

  const handleArchiveConversation = (partnerId: string) => {
    setArchivedConversations(prev => new Set(prev).add(partnerId));
    logHistory('ARCHIVE_CONVERSATION', `Arquivou a conversa com '${partnerId}'.`);
  };

  const handleUnarchiveConversation = (partnerId: string) => {
    setArchivedConversations(prev => {
        const newSet = new Set(prev);
        newSet.delete(partnerId);
        return newSet;
    });
    logHistory('UNARCHIVE_CONVERSATION', `Desarquivou a conversa com '${partnerId}'.`);
  };

  // AI Message Offer Handlers
  const handleSendAiInvitation = async () => {
    if (!aiMessageOffer || !currentUser) return;
    const { candidate } = aiMessageOffer;

    const messageText = await generateInterviewInvitationMessage(candidate.name);
    if (messageText) {
        handleSendMessage(`user-${currentUser.id}`, `candidate-${candidate.id}`, messageText);
    }
    setAiMessageOffer(null);
  };

  const handleDismissAiOffer = () => {
      setAiMessageOffer(null);
  };


  // Archive Management
  const handleRestoreAll = () => {
    setJobs(prev => prev.map(j => ({...j, status: 'active'})));
    setCandidates(prev => prev.map(c => ({...c, isArchived: false})));
    setTalentPool(prev => prev.map(t => ({...t, isArchived: false})));
    logHistory('RESTORE_ALL', 'Restaurou todos os itens do arquivo.');
  };

  const handleDeleteAllPermanently = () => {
    setJobs(prev => prev.filter(j => j.status !== 'archived'));
    setCandidates(prev => prev.filter(c => !c.isArchived));
    setTalentPool(prev => prev.filter(t => !t.isArchived));
    logHistory('DELETE_ALL', 'Excluiu permanentemente todos os itens do arquivo.');
  };

  // Dynamics Management
  const handleAddDynamic = (dynamicData: Omit<Dynamic, 'id'>) => {
    const newDynamic: Dynamic = { ...dynamicData, id: `dyn-${Date.now()}` };
    setDynamics(prev => [newDynamic, ...prev]);
    logHistory('CREATE_DYNAMIC', `Criou a dinâmica '${newDynamic.title}'.`);
  };

  const handleUpdateDynamic = (updatedDynamic: Dynamic) => {
    setDynamics(prev => prev.map(d => d.id === updatedDynamic.id ? updatedDynamic : d));
    logHistory('UPDATE_DYNAMIC', `Atualizou a dinâmica '${updatedDynamic.title}'.`);
  };

  const handleDeleteDynamic = (dynamicId: string) => {
    const dynamicToDelete = dynamics.find(d => d.id === dynamicId);
    setDynamics(prev => prev.filter(d => d.id !== dynamicId));
    if (dynamicToDelete) {
        logHistory('DELETE_DYNAMIC', `Excluiu a dinâmica '${dynamicToDelete.title}'.`);
    }
  };

  // Dynamics Timer Management
  const handleStartDynamicTimer = (dynamicId: string, durationMinutes: number, mode: 'countdown' | 'countup') => {
      setActiveDynamicTimer({
          dynamicId,
          startTime: Date.now(),
          duration: durationMinutes * 60,
          isRunning: true,
          mode,
          pauseTime: null,
      });
  };

  const handlePauseDynamicTimer = () => {
      setActiveDynamicTimer(prev => {
          if (!prev || !prev.isRunning) return prev;
          return { ...prev, isRunning: false, pauseTime: Date.now() };
      });
  };

  const handleResumeDynamicTimer = () => {
      setActiveDynamicTimer(prev => {
          if (!prev || prev.isRunning || !prev.pauseTime) return prev;
          const elapsedPausedTime = Date.now() - prev.pauseTime;
          return { ...prev, isRunning: true, startTime: prev.startTime + elapsedPausedTime, pauseTime: null };
      });
  };

  const handleResetDynamicTimer = (dynamicId: string) => {
      setActiveDynamicTimer(prev => {
          if (!prev || prev.dynamicId !== dynamicId) return prev;
          return { ...prev, startTime: null, isRunning: false, pauseTime: null };
      });
  };



  if (!currentUser) {
    if (appState === 'application') {
      return <ApplicationForm onSwitchToLogin={() => setAppState('login')} onAddCandidate={handleAddCandidate} candidates={candidates} users={users} messages={messages} onSendMessage={handleSendMessage} onMarkMessagesAsRead={handleMarkMessagesAsRead} jobs={jobs} dynamics={dynamics} />;
    }
    return <LoginScreen onLogin={handleLogin} onSwitchToApplication={() => setAppState('application')} />;
  }

  return (
    <>
      <MainLayout
        user={currentUser}
        onLogout={handleLogout}
        activeView={activeView}
        setActiveView={setActiveView}
        theme={theme}
        onThemeToggle={() => setTheme(theme === 'dark' ? 'light' : 'dark')}
        jobs={jobs}
        candidates={candidates}
        talentPool={talentPool}
        users={users}
        messages={messages}
        history={history}
        messagingState={messagingState}
        archivedConversations={archivedConversations}
        dynamics={dynamics}
        syncStatus={syncStatus}
        activeDynamicTimer={activeDynamicTimer}
        onOpenMessaging={handleOpenMessaging}
        onCloseMessaging={handleCloseMessaging}
        onSendMessage={handleSendMessage}
        onUpdateMessage={handleUpdateMessage}
        onMarkMessagesAsRead={handleMarkMessagesAsRead}
        onDeleteConversation={handleDeleteConversation}
        onArchiveConversation={handleArchiveConversation}
        onUnarchiveConversation={handleUnarchiveConversation}
        onAddJob={handleAddJob}
        onUpdateJob={handleUpdateJob}
        onArchiveJob={handleArchiveJob}
        onRestoreJob={handleRestoreJob}
        onDeleteJob={handlePermanentDeleteJob}
        onUpdateCandidate={handleUpdateCandidate}
        onBulkUpdateCandidates={handleBulkUpdateCandidates}
        onArchiveCandidate={handleArchiveCandidate}
        onRestoreCandidate={handleRestoreCandidate}
        onPermanentDeleteCandidate={handlePermanentDeleteCandidate}
        onInterviewScheduled={handleInterviewScheduled}
        onBulkInterviewScheduled={handleBulkInterviewScheduled}
        onBulkCancelInterviews={handleBulkCancelInterviews}
        onAddTalent={handleAddTalent}
        onUpdateTalent={handleUpdateTalent}
        onArchiveTalent={handleArchiveTalent}
        onRestoreTalent={handleRestoreTalent}
        onDeleteTalent={handlePermanentDeleteTalent}
        onSendTalentToJob={handleSendTalentToJob}
        onAddUser={handleAddUser}
        onRemoveUser={handleRemoveUser}
        onUpdateUser={handleUpdateUser}
        onToggleAdminRole={handleToggleAdminRole}
        onRestoreAll={handleRestoreAll}
        onDeleteAllPermanently={handleDeleteAllPermanently}
        onAddDynamic={handleAddDynamic}
        onUpdateDynamic={handleUpdateDynamic}
        onDeleteDynamic={handleDeleteDynamic}
        onStartDynamicTimer={handleStartDynamicTimer}
        onPauseDynamicTimer={handlePauseDynamicTimer}
        onResumeDynamicTimer={handleResumeDynamicTimer}
        onResetDynamicTimer={handleResetDynamicTimer}
      />
      {activeReminder && (
        <ReminderToast
            reminder={activeReminder}
            onClose={() => setActiveReminder(null)}
        />
      )}
      {undoState && (
          <UndoToast
              candidateName={undoState.originalCandidate.name}
              newStatus={undoState.newStatus}
              onUndo={handleUndoUpdate}
              onClose={() => setUndoState(null)}
          />
      )}
      {aiMessageOffer && (
          <AIMessageOfferToast
              offer={aiMessageOffer}
              onSend={handleSendAiInvitation}
              onDismiss={handleDismissAiOffer}
          />
      )}
    </>
  );
}

export default App;