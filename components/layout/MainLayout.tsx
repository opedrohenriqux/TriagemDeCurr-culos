import React, { useState } from 'react';
import Header from './Header';
import { User, Job, Candidate, Talent, CandidateInterview, Message, HistoryEvent, Dynamic, ActiveDynamicTimer } from '../../types';

// Import views
import JobList from '../jobs/JobList';
import JobDetails from '../jobs/JobDetails';
import TalentPool from '../talent/TalentPool';
import ChatInterface from '../chat/ChatInterface';
import AdminPanel from '../admin/AdminPanel';
import Dashboard from '../dashboard/Dashboard';
import ArchiveView from '../archive/ArchiveView';
import ScheduleView from '../schedules/ScheduleView';
import ReportsView from '../reports/ReportsView';
import DevsView from '../devs/DevsView';
import HiresView from '../hires/HiresView';
import HistoryView from '../history/HistoryView';


export type View = 'vagas' | 'talentos' | 'assistencia' | 'dashboard' | 'relatorios' | 'entrevistas' | 'contratacoes' | 'arquivo' | 'admin' | 'devs' | 'historico';

interface MainLayoutProps {
  user: User;
  onLogout: () => void;
  activeView: View;
  setActiveView: (view: View) => void;
  theme: 'light' | 'dark';
  onThemeToggle: () => void;
  jobs: Job[];
  candidates: Candidate[];
  talentPool: Talent[];
  users: User[];
  messages: Message[];
  history: HistoryEvent[];
  messagingState: { isOpen: boolean, preselectedId: string | null };
  archivedConversations: Set<string>;
  dynamics: Dynamic[];
  syncStatus: 'idle' | 'syncing' | 'saved' | 'error';
  activeDynamicTimer: ActiveDynamicTimer | null;
  onOpenMessaging: (candidateId?: number | null) => void;
  onCloseMessaging: () => void;
  onSendMessage: (senderId: string, receiverId: string, text: string) => void;
  onUpdateMessage: (messageId: number, newText: string, isDeleted?: boolean) => void;
  onMarkMessagesAsRead: (senderId: string, receiverId: string) => void;
  onDeleteConversation: (partnerId: string) => void;
  onArchiveConversation: (partnerId: string) => void;
  onUnarchiveConversation: (partnerId: string) => void;
  onAddJob: (job: Omit<Job, 'id'>) => void;
  onUpdateJob: (job: Job) => void;
  onArchiveJob: (jobId: string) => void;
  onRestoreJob: (jobId: string) => void;
  onDeleteJob: (jobId: string) => void;
  onUpdateCandidate: (candidate: Candidate) => void;
  onBulkUpdateCandidates: (updatedCandidates: Candidate[]) => void;
  onArchiveCandidate: (candidateId: number) => void;
  onRestoreCandidate: (candidateId: number) => void;
  onPermanentDeleteCandidate: (candidateId: number) => void;
  onInterviewScheduled: (candidate: Candidate, interviewDetails: CandidateInterview) => void;
  onBulkInterviewScheduled: (candidateIds: number[], interviewDetails: Omit<CandidateInterview, 'notes'>) => void;
  onBulkCancelInterviews: (candidateIds: number[]) => void;
  onAddTalent: (talent: Omit<Talent, 'id'>) => void;
  onUpdateTalent: (talent: Talent) => void;
  onArchiveTalent: (talentId: number) => void;
  onRestoreTalent: (talentId: number) => void;
  onDeleteTalent: (talentId: number) => void;
  onSendTalentToJob: (talentId: number, jobId: string) => void;
  onAddUser: (user: Omit<User, 'id' | 'role'> & { password?: string }) => void;
  onRemoveUser: (userId: number) => void;
  onUpdateUser: (user: User) => void;
  onToggleAdminRole: (userId: number) => void;
  onRestoreAll: () => void;
  onDeleteAllPermanently: () => void;
  onAddDynamic: (dynamic: Omit<Dynamic, 'id'>) => void;
  onUpdateDynamic: (dynamic: Dynamic) => void;
  onDeleteDynamic: (dynamicId: string) => void;
  onStartDynamicTimer: (dynamicId: string, durationMinutes: number, mode: 'countdown' | 'countup') => void;
  onPauseDynamicTimer: () => void;
  onResumeDynamicTimer: () => void;
  onResetDynamicTimer: (dynamicId: string) => void;
}

const MainLayout: React.FC<MainLayoutProps> = (props) => {
  const [selectedJobId, setSelectedJobId] = useState<string | null>(null);

  const activeJobs = props.jobs.filter(j => j.status === 'active');
  const archivedJobs = props.jobs.filter(j => j.status === 'archived');
  const activeCandidates = props.candidates.filter(c => !c.isArchived);
  const archivedCandidates = props.candidates.filter(c => c.isArchived);
  const activeTalents = props.talentPool.filter(t => !t.isArchived);
  const archivedTalents = props.talentPool.filter(t => t.isArchived);

  const handleSelectJob = (jobId: string) => {
    setSelectedJobId(jobId);
  };
  
  const handleBackToList = () => {
    setSelectedJobId(null);
  };

  const renderContent = () => {
    if (props.activeView === 'vagas') {
      if (selectedJobId) {
        return <JobDetails 
          jobId={selectedJobId} 
          onBack={handleBackToList}
          jobs={props.jobs}
          candidates={activeCandidates}
          users={props.users}
          onUpdateCandidate={props.onUpdateCandidate}
          onBulkUpdateCandidates={props.onBulkUpdateCandidates}
          onArchiveCandidate={props.onArchiveCandidate}
          onRestoreCandidate={props.onRestoreCandidate}
          onPermanentDeleteCandidate={props.onPermanentDeleteCandidate}
          onInterviewScheduled={props.onInterviewScheduled}
          onBulkInterviewScheduled={props.onBulkInterviewScheduled}
        />;
      }
      return <JobList 
        jobs={activeJobs} 
        onSelectJob={handleSelectJob}
        onAddJob={props.onAddJob}
        onUpdateJob={props.onUpdateJob}
        onArchiveJob={props.onArchiveJob}
      />;
    }

    switch (props.activeView) {
      case 'talentos':
        return <TalentPool 
            talentPool={activeTalents} 
            jobs={activeJobs}
            onAddTalent={props.onAddTalent}
            onUpdateTalent={props.onUpdateTalent}
            onArchiveTalent={props.onArchiveTalent}
            onSendTalentToJob={props.onSendTalentToJob}
        />;
      case 'assistencia':
        return <ChatInterface 
            jobs={props.jobs} 
            candidates={props.candidates} 
            user={props.user}
        />;
      case 'dashboard':
        return <Dashboard jobs={props.jobs} candidates={props.candidates} />;
      case 'relatorios':
        return <ReportsView jobs={props.jobs} candidates={props.candidates} talentPool={props.talentPool} />;
      case 'entrevistas':
        return <ScheduleView 
            candidates={activeCandidates} 
            jobs={props.jobs} 
            users={props.users} 
            onUpdateCandidate={props.onUpdateCandidate}
            onBulkCancelInterviews={props.onBulkCancelInterviews}
            onOpenMessaging={props.onOpenMessaging}
            dynamics={props.dynamics}
            onAddDynamic={props.onAddDynamic}
            onUpdateDynamic={props.onUpdateDynamic}
            onDeleteDynamic={props.onDeleteDynamic}
            activeDynamicTimer={props.activeDynamicTimer}
            onStartDynamicTimer={props.onStartDynamicTimer}
            onPauseDynamicTimer={props.onPauseDynamicTimer}
            onResumeDynamicTimer={props.onResumeDynamicTimer}
            onResetDynamicTimer={props.onResetDynamicTimer}
        />;
      case 'contratacoes':
        return <HiresView 
            candidates={props.candidates} 
            jobs={props.jobs}
            onUpdateCandidate={props.onUpdateCandidate}
        />;
      case 'arquivo':
        return <ArchiveView 
            archivedJobs={archivedJobs}
            archivedCandidates={archivedCandidates}
            archivedTalents={archivedTalents}
            allJobs={props.jobs}
            onRestoreJob={props.onRestoreJob}
            onDeleteJob={props.onDeleteJob}
            onRestoreCandidate={props.onRestoreCandidate}
            onDeleteCandidate={props.onPermanentDeleteCandidate}
            onRestoreTalent={props.onRestoreTalent}
            onDeleteTalent={props.onDeleteTalent}
            onRestoreAll={props.onRestoreAll}
            onDeleteAllPermanently={props.onDeleteAllPermanently}
        />;
      case 'admin':
        return <AdminPanel 
            currentUser={props.user} 
            users={props.users} 
            onAddUser={props.onAddUser}
            onRemoveUser={props.onRemoveUser}
            onUpdateUser={props.onUpdateUser}
            onToggleAdminRole={props.onToggleAdminRole}
            setActiveView={props.setActiveView}
        />;
      case 'devs':
        return <DevsView />;
      case 'historico':
        return <HistoryView history={props.history} users={props.users} />;
      default:
        return <JobList jobs={activeJobs} onSelectJob={handleSelectJob} onAddJob={props.onAddJob} onUpdateJob={props.onUpdateJob} onArchiveJob={props.onArchiveJob} />;
    }
  };

  return (
    <div className="bg-light-background dark:bg-background text-light-text-primary dark:text-text-primary min-h-screen transition-colors duration-300">
      <Header 
        user={props.user} 
        onLogout={props.onLogout} 
        activeView={props.activeView} 
        setActiveView={props.setActiveView} 
        theme={props.theme}
        onThemeToggle={props.onThemeToggle}
        messages={props.messages}
        candidates={props.candidates}
        users={props.users}
        jobs={props.jobs}
        messagingState={props.messagingState}
        archivedConversations={props.archivedConversations}
        syncStatus={props.syncStatus}
        onOpenMessaging={props.onOpenMessaging}
        onCloseMessaging={props.onCloseMessaging}
        onSendMessage={props.onSendMessage}
        onUpdateMessage={props.onUpdateMessage}
        onMarkMessagesAsRead={props.onMarkMessagesAsRead}
        onDeleteConversation={props.onDeleteConversation}
        onArchiveConversation={props.onArchiveConversation}
        onUnarchiveConversation={props.onUnarchiveConversation}
      />
      <main 
        key={props.activeView} 
        className="w-full max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-8 animate-fade-in-up"
      >
        {renderContent()}
      </main>
    </div>
  );
};

export default MainLayout;