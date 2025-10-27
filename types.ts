// FIX: The content of this file was incorrect, containing a React component. 
// It has been replaced with the correct type definitions for the application,
// which resolves numerous import errors across all files.

export type CandidateStatus = 'applied' | 'screening' | 'approved' | 'rejected' | 'hired' | 'pending' | 'waitlist' | 'offer';

export interface User {
    id: string;
    username: string;
    password?: string;
    role: 'admin' | 'user';
    specialty: string;
}

export interface JobSource {
    name: string;
    url: string;
}

export interface Job {
    id: string;
    title: string;
    department: string;
    location: string;
    description: string;
    responsibilities: string[];
    benefits: string[];
    requirements: string[];
    sources: JobSource[];
    status: 'active' | 'archived';
}

export interface Resume {
    professionalExperience: {
        company: string;
        role: string;
        duration: string;
        description?: string;
    }[];
    courses: {
        name: string;
        institution: string;
    }[];
    availability: string;
    contact: {
        phone: string;
        email: string;
    };
    personalSummary: string;
    conducaoPropria?: string;
    motivo?: string;
    fiveYearPlan?: string;
}

export interface CandidateInterview {
    date: string;
    time: string;
    location: string;
    interviewers: string[];
    notes: string;
    noShow?: boolean;
}

export interface Candidate {
    id: string;
    name: string;
    age: number;
    maritalStatus: string;
    location: string;
    experience: string;
    education: string;
    skills: string[];
    summary: string;
    jobId: string;
    fitScore: number;
    status: CandidateStatus;
    applicationDate: string;
    source: string;
    isArchived: boolean;
    resume: Resume;
    avatarUrl?: string;
    gender?: 'male' | 'female';
    interview?: CandidateInterview;
    hireDate?: string;
    resumeUrl?: string;
    aiAnalysis?: AIAnalysis;
}

export interface Talent {
    id:string;
    originalCandidateId?: string;
    name: string;
    age: number;
    city: string;
    education: string;
    experience: string;
    skills: string[];
    potential: number;
    status: string;
    desiredPosition: string;
    avatarUrl?: string;
    gender?: 'male' | 'female';
    rejectionReason?: string;
    isArchived?: boolean;
}

export interface Message {
    id: string;
    senderId: string;
    receiverId: string;
    text: string;
    timestamp: string;
    isRead: boolean;
    isDeleted?: boolean;
}

export type HistoryAction = 
    | 'CREATE_USER' | 'DELETE_USER' | 'UPDATE_USER' | 'TOGGLE_ADMIN'
    | 'CREATE_JOB' | 'UPDATE_JOB' | 'ARCHIVE_JOB' | 'RESTORE_JOB' | 'DELETE_JOB'
    | 'UPDATE_CANDIDATE' | 'ARCHIVE_CANDIDATE' | 'RESTORE_CANDIDATE' | 'DELETE_CANDIDATE'
    | 'CREATE_TALENT' | 'UPDATE_TALENT' | 'ARCHIVE_TALENT' | 'RESTORE_TALENT' | 'DELETE_TALENT'
    | 'SEND_TALENT_TO_JOB' | 'SEND_MESSAGE' | 'UPDATE_MESSAGE' | 'DELETE_CONVERSATION'
    | 'ARCHIVE_CONVERSATION' | 'UNARCHIVE_CONVERSATION' | 'RESTORE_ALL' | 'DELETE_ALL'
    | 'CREATE_DYNAMIC' | 'UPDATE_DYNAMIC' | 'DELETE_DYNAMIC';

export interface HistoryEvent {
    id: string;
    timestamp: string;
    userId: string;
    username: string;
    action: HistoryAction;
    details: string;
}

export interface DynamicGroup {
    name: string;
    members: string[];
    groupNotes?: string;
    individualNotes?: { [candidateId: string]: string };
}

export interface Dynamic {
    id: string;
    title: string;
    script: string;
    date: string;
    participants: string[];
    groups: DynamicGroup[];
    generalNotes?: string;
    aiSummary?: any;
    status?: 'scheduled' | 'completed';
}

export interface ActiveDynamicTimer {
    dynamicId: string;
    startTime: number | null;
    duration: number;
    isRunning: boolean;
    mode: 'countdown' | 'countup';
    pauseTime: number | null;
}

export interface AIAnalysis {
    summary: string;
    strengths: string[];
    weaknesses: string[];
    fitScore: number;
    interviewQuestions: string[];
    resumeAnalysis?: string;
}

export interface ChatMessage {
    id: string;
    sender: 'user' | 'ai';
    text: string;
    timestamp: string;
}
