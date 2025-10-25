import React, { useState, useEffect, useRef } from 'react';
import { getAuth, onAuthStateChanged, signInWithEmailAndPassword, signOut, User as FirebaseAuthUser } from 'firebase/auth';
import LoginScreen from './components/auth/LoginScreen';
import MainLayout, { View } from './components/layout/MainLayout';
import { User, Job, Candidate, Talent, CandidateInterview, Message, CandidateStatus, HistoryEvent, HistoryAction, Dynamic, ActiveDynamicTimer } from './types';
import ReminderToast from './components/notifications/ReminderToast';
import UndoToast from './components/notifications/UndoToast';
import ApplicationForm from './components/application/ApplicationForm';
import { generateInterviewInvitationMessage } from './services/geminiService';
import AIMessageOfferToast from './components/notifications/AIMessageOfferToast';
import { auth } from './services/firebase';
import { jobService, candidateService, talentService, messageService, historyService, dynamicService, userService } from './services/firestoreService';

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



function App() {
  const [currentUser, setCurrentUser] = useState<User | null>(null);
  const [theme, setTheme] = useState<'light' | 'dark'>('dark');
  const [activeView, setActiveView] = useState<View>('vagas');
  const [appState, setAppState] = useState<'application' | 'login'>('application');
  const [syncStatus, setSyncStatus] = useState<'idle' | 'syncing' | 'saved' | 'error'>('idle');
  const syncTimeoutRef = useRef<number | null>(null);

  const [jobs, setJobs] = useState<Job[]>([]);
  const [candidates, setCandidates] = useState<Candidate[]>([]);
  const [talentPool, setTalentPool] = useState<Talent[]>([]);
  const [messages, setMessages] = useState<Message[]>([]);
  const [archivedConversations, setArchivedConversations] = useState<Set<string>>(new Set());
  const [history, setHistory] = useState<HistoryEvent[]>([]);
  const [dynamics, setDynamics] = useState<Dynamic[]>([]);
  const [activeDynamicTimer, setActiveDynamicTimer] = useState<ActiveDynamicTimer | null>(null);
  const [users, setUsers] = useState<User[]>([]);


  const [activeReminder, setActiveReminder] = useState<{ candidate: Candidate; type: 'reminder' | 'now' } | null>(null);
  const [remindedIntervals, setRemindedIntervals] = useState<Record<string, boolean>>({});
  
  const [messagingState, setMessagingState] = useState({ isOpen: false, preselectedId: null as string | null });

  // State for undo functionality
  const [undoState, setUndoState] = useState<{ originalCandidate: Candidate; newStatus: CandidateStatus } | null>(null);
  const undoTimeoutRef = useRef<number | null>(null);

  // State for AI message offer
  const [aiMessageOffer, setAiMessageOffer] = useState<{ candidate: Candidate; job: Job } | null>(null);

  const logHistory = async (action: HistoryAction, details: string) => {
    if (!currentUser) return;
    const newEvent: Omit<HistoryEvent, 'id'> = {
      timestamp: new Date().toISOString(),
      userId: currentUser.id,
      username: currentUser.username,
      action: action,
      details: details,
    };
    const savedEvent = await historyService.create(newEvent);
    setHistory(prev => [savedEvent, ...prev]);
  };

  const handleOpenMessaging = (candidateId: number | null = null) => {
    setMessagingState({ isOpen: true, preselectedId: candidateId ? `candidate-${candidateId}` : null });
  };

  const handleCloseMessaging = () => {
    setMessagingState({ isOpen: false, preselectedId: null });
  };


  useEffect(() => {
    // Listen for public data immediately
    const jobUnsubscribe = jobService.listen(setJobs);
    const userUnsubscribe = userService.listen(setUsers);

    const authUnsubscribe = onAuthStateChanged(auth, async (firebaseUser) => {
      if (firebaseUser) {
        const existingUsers = await userService.getAll();
        let appUser = existingUsers.find(u => u.id === firebaseUser.uid);

        if (!appUser) {
          const newUser: User = {
            id: firebaseUser.uid,
            username: firebaseUser.email || 'Usuário Anônimo',
            role: 'user', // Default role
            specialty: 'Generalista',
          };
          await userService.set(firebaseUser.uid, newUser);
          appUser = newUser;
        }

        setCurrentUser(appUser);

        // Listen for protected data only after login
        const unsubscribes = [
          candidateService.listen(setCandidates),
          talentService.listen(setTalentPool),
          messageService.listen(setMessages),
          historyService.listen(setHistory),
          dynamicService.listen(setDynamics),
        ];

        return () => unsubscribes.forEach(unsub => unsub());
      } else {
        setCurrentUser(null);
        // Clear only protected data on logout
        setCandidates([]);
        setTalentPool([]);
        setMessages([]);
        setHistory([]);
        setDynamics([]);
      }
    });

    return () => {
      jobUnsubscribe();
      userUnsubscribe();
      authUnsubscribe();
    };
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


  const handleLogin = async (email: string, password: string): Promise<boolean> => {
    try {
      await signInWithEmailAndPassword(auth, email, password);
      return true;
    } catch (error) {
      console.error("Failed to sign in", error);
      return false;
    }
  };

  const handleLogout = async () => {
    try {
      await signOut(auth);
      setAppState('application');
    } catch (error) {
      console.error("Failed to sign out", error);
    }
  };

  // Job Management
  const handleAddJob = async (jobData: Omit<Job, 'id'>) => {
    const newJob = await jobService.create(jobData);
    logHistory('CREATE_JOB', `Criou a vaga '${newJob.title}'.`);
  };

  const handleUpdateJob = async (updatedJob: Job) => {
    await jobService.update(updatedJob.id, updatedJob);
    logHistory('UPDATE_JOB', `Atualizou os dados da vaga '${updatedJob.title}'.`);
  };

  const handleArchiveJob = async (jobId: string) => {
    const job = jobs.find(j => j.id === jobId);
    if (!job) return;
    await jobService.update(jobId, { status: 'archived' });
    logHistory('ARCHIVE_JOB', `Arquivou a vaga '${job.title}'.`);
  };

  const handleRestoreJob = async (jobId: string) => {
    const job = jobs.find(j => j.id === jobId);
    if (!job) return;
    await jobService.update(jobId, { status: 'active' });
    logHistory('RESTORE_JOB', `Restaurou a vaga '${job.title}'.`);
  };

  const handlePermanentDeleteJob = async (jobId: string) => {
    const job = jobs.find(j => j.id === jobId);
    if (!job) return;
    await jobService.delete(jobId);
    logHistory('DELETE_JOB', `Excluiu permanentemente a vaga '${job.title}'.`);
  };


  // Candidate Management
  const handleAddCandidate = async (formData: ApplicationFormData): Promise<string> => {
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

    const newCandidateData: Omit<Candidate, 'id'> = {
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

    const newCandidate = await candidateService.create(newCandidateData);
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

    await candidateService.update(updatedCandidate.id, updatedCandidate);

    if (originalCandidate && originalCandidate.status !== updatedCandidate.status) {
        logHistory('UPDATE_CANDIDATE', `Alterou o status de '${originalCandidate.name}' para '${updatedCandidate.status}'.`);
    } else {
        logHistory('UPDATE_CANDIDATE', `Atualizou os dados do candidato '${updatedCandidate.name}'.`);
    }
  };

  const handleBulkUpdateCandidates = async (updatedCandidates: Candidate[]) => {
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

    const updatePromises = updatedCandidates.map(c => candidateService.update(c.id, c));
    await Promise.all(updatePromises);

    if (updatedCandidates.length > 0) {
        logHistory('UPDATE_CANDIDATE', `Atualizou em lote o status de ${updatedCandidates.length} candidatos.`);
    }
  };

  const handleUndoUpdate = async () => {
    if (undoState) {
        const original = undoState.originalCandidate;
        await candidateService.update(original.id, original);
        logHistory('UPDATE_CANDIDATE', `Desfez a alteração de status para '${original.name}'.`);
        setUndoState(null);
        if (undoTimeoutRef.current) {
            clearTimeout(undoTimeoutRef.current);
            undoTimeoutRef.current = null;
        }
    }
  };


  const handleArchiveCandidate = async (candidateId: string) => {
    const candidate = candidates.find(c => c.id === candidateId);
    if(candidate) {
      await candidateService.update(candidateId, { isArchived: true });
      logHistory('ARCHIVE_CANDIDATE', `Arquivou o candidato '${candidate.name}'.`);
    }
  };
  
  const handleRestoreCandidate = async (candidateId: string) => {
    const candidate = candidates.find(c => c.id === candidateId);
    if(candidate) {
      await candidateService.update(candidateId, { isArchived: false });
      logHistory('RESTORE_CANDIDATE', `Restaurou o candidato '${candidate.name}'.`);
    }
  };

  const handlePermanentDeleteCandidate = async (candidateId: string) => {
    const candidate = candidates.find(c => c.id === candidateId);
    if(candidate) {
      await candidateService.delete(candidateId);
      logHistory('DELETE_CANDIDATE', `Excluiu permanentemente o candidato '${candidate.name}'.`);
    }
  };
  
  const handleInterviewScheduled = (candidate: Candidate, interviewDetails: CandidateInterview) => {
    handleUpdateCandidate({ ...candidate, interview: interviewDetails, status: 'approved' });
    logHistory('UPDATE_CANDIDATE', `Agendou entrevista para '${candidate.name}'.`);
  };
  
  const handleBulkInterviewScheduled = async (candidateIds: string[], interviewDetails: Omit<CandidateInterview, 'notes'>) => {
    const candidatesToUpdate = candidates.filter(c => candidateIds.includes(c.id));
    const updatePromises = candidatesToUpdate.map(c =>
      candidateService.update(c.id, { ...c, interview: { ...interviewDetails, notes: '' }, status: 'approved' })
    );
    await Promise.all(updatePromises);
    logHistory('UPDATE_CANDIDATE', `Agendou entrevistas em lote para ${candidateIds.length} candidatos.`);
  };

  const handleBulkCancelInterviews = async (candidateIds: string[]) => {
    const candidatesToUpdate = candidates.filter(c => candidateIds.includes(c.id));
    const updatePromises = candidatesToUpdate.map(c => {
      const updated = { ...c };
      delete updated.interview;
      updated.status = 'approved';
      return candidateService.update(c.id, updated);
    });
    await Promise.all(updatePromises);
    logHistory('UPDATE_CANDIDATE', `Cancelou entrevistas em lote para ${candidateIds.length} candidatos.`);
  };


  // Talent Pool Management
  const handleAddTalent = async (talentData: Omit<Talent, 'id'>) => {
    const newTalent = await talentService.create(talentData);
    logHistory('CREATE_TALENT', `Adicionou '${newTalent.name}' ao banco de talentos.`);
  };

  const handleUpdateTalent = async (updatedTalent: Talent) => {
    await talentService.update(updatedTalent.id, updatedTalent);
    logHistory('UPDATE_TALENT', `Atualizou os dados do talento '${updatedTalent.name}'.`);
  };
  
  const handleArchiveTalent = async (talentId: string) => {
    const talent = talentPool.find(t => t.id === talentId);
    if (!talent) return;
    await talentService.update(talentId, { isArchived: true });
    logHistory('ARCHIVE_TALENT', `Arquivou o talento '${talent.name}'.`);
  };

  const handleRestoreTalent = async (talentId: string) => {
    const talent = talentPool.find(t => t.id === talentId);
    if (!talent) return;
    await talentService.update(talentId, { isArchived: false });
    logHistory('RESTORE_TALENT', `Restaurou o talento '${talent.name}'.`);
  };

  const handlePermanentDeleteTalent = async (talentId: string) => {
    const talent = talentPool.find(t => t.id === talentId);
    if (!talent) return;
    await talentService.delete(talentId);
    logHistory('DELETE_TALENT', `Excluiu permanentemente o talento '${talent.name}'.`);
  };

  const handleSendTalentToJob = async (talentId: string, jobId: string) => {
    const talent = talentPool.find(t => t.id === talentId);
    if (!talent) return;

    const newCandidateData: Omit<Candidate, 'id'> = {
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

    await candidateService.create(newCandidateData);
    await talentService.delete(talentId);

    const jobTitle = jobs.find(j => j.id === jobId)?.title;
    logHistory('SEND_TALENT_TO_JOB', `Enviou o talento '${talent.name}' para a vaga '${jobTitle}'.`);
  };

  // Messaging Management
  const handleSendMessage = async (senderId: string, receiverId: string, text: string) => {
    const newMessageData: Omit<Message, 'id'> = {
      senderId,
      receiverId,
      text,
      timestamp: new Date().toISOString(),
      isRead: false,
    };
    await messageService.create(newMessageData);
    logHistory('SEND_MESSAGE', `Enviou uma mensagem para '${receiverId}'.`);
  };

  const handleUpdateMessage = async (messageId: string, newText: string, isDeleted: boolean = false) => {
    await messageService.update(messageId, { text: newText, isDeleted });
    if (!isDeleted) {
      logHistory('UPDATE_MESSAGE', `Editou uma mensagem.`);
    }
  };

  const handleMarkMessagesAsRead = async (senderId: string, receiverId: string) => {
    const unreadMessages = messages.filter(msg => msg.senderId === senderId && msg.receiverId === receiverId && !msg.isRead);
    const updatePromises = unreadMessages.map(msg => messageService.update(msg.id, { isRead: true }));
    await Promise.all(updatePromises);
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

    // User Management
  const handleUpdateUser = async (updatedUser: User) => {
    await userService.update(updatedUser.id, updatedUser);
    logHistory('UPDATE_USER', `Atualizou os dados do usuário '${updatedUser.username}'.`);
  };

  const handlePermanentDeleteUser = async (userId: string) => {
    const user = users.find(u => u.id === userId);
    if (!user) return;
    await userService.delete(userId);
    logHistory('DELETE_USER', `Excluiu permanentemente o usuário '${user.username}'.`);
  };

  const handleToggleAdminRole = async (userId: string) => {
    const user = users.find(u => u.id === userId);
    if (user) {
      const newRole = user.role === 'admin' ? 'user' : 'admin';
      await userService.update(userId, { role: newRole });
      logHistory('UPDATE_USER', `Alterou o cargo de '${user.username}' para '${newRole}'.`);
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
        onAddUser={() => {}} // Not implemented as users are created on login
        onRemoveUser={handlePermanentDeleteUser}
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