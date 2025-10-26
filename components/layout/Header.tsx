import React, { useMemo, useState, useEffect } from 'react';
import { User, Message, Candidate, Job } from '../../types';
import { View } from './MainLayout';
import MessagingPanel from '../messaging/MessagingPanel';

interface HeaderProps {
  user: User;
  onLogout: () => void;
  activeView: View;
  setActiveView: (view: View) => void;
  theme: 'light' | 'dark';
  onThemeToggle: () => void;
  messages: Message[];
  candidates: Candidate[];
  users: User[];
  jobs: Job[];
  messagingState: { isOpen: boolean; preselectedId: string | null };
  archivedConversations: Set<string>;
  syncStatus: 'idle' | 'syncing' | 'saved' | 'error';
  onOpenMessaging: (candidateId?: number | null) => void;
  onCloseMessaging: () => void;
  onSendMessage: (senderId: string, receiverId: string, text: string) => void;
  onUpdateMessage: (messageId: number, newText: string, isDeleted?: boolean) => void;
  onMarkMessagesAsRead: (senderId: string, receiverId: string) => void;
  onDeleteConversation: (partnerId: string) => void;
  onArchiveConversation: (partnerId: string) => void;
  onUnarchiveConversation: (partnerId: string) => void;
}

const NavItem: React.FC<{ label: string, isActive: boolean, onClick: () => void }> = ({ label, isActive, onClick }) => (
  <button
    onClick={onClick}
    className={`px-3 py-2 text-sm font-semibold rounded-md transition-colors relative ${
      isActive
        ? 'text-light-primary dark:text-primary'
        : 'text-light-text-secondary dark:text-text-secondary hover:text-light-text-primary dark:hover:text-text-primary'
    }`}
  >
    {label}
    {isActive && (
      <span className="absolute bottom-[-1px] left-0 right-0 h-[2px] bg-light-primary dark:bg-primary"></span>
    )}
  </button>
);

const SyncStatusIndicator: React.FC<{ status: 'idle' | 'syncing' | 'saved' | 'error' }> = ({ status }) => {
    if (status === 'idle') {
        return null;
    }

    const styles = {
        syncing: {
            icon: <div className="animate-spin rounded-full h-4 w-4 border-t-2 border-b-2 border-light-secondary dark:border-secondary"></div>,
            text: 'Sincronizando...',
            color: 'text-light-text-secondary dark:text-text-secondary',
        },
        saved: {
            icon: <svg xmlns="http://www.w3.org/2000/svg" width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="3" strokeLinecap="round" strokeLinejoin="round"><path d="M20 6 9 17l-5-5"/></svg>,
            text: 'Salvo automaticamente',
            color: 'text-green-600 dark:text-green-400',
        },
        error: {
            icon: <svg xmlns="http://www.w3.org/2000/svg" width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="3" strokeLinecap="round" strokeLinejoin="round"><line x1="18" y1="6" x2="6" y2="18"></line><line x1="6" y1="6" x2="18" y2="18"></line></svg>,
            text: 'Erro ao salvar',
            color: 'text-red-600 dark:text-red-400',
        },
    };

    const current = styles[status];

    return (
        <div className={`flex items-center gap-2 text-xs font-semibold ${current.color} transition-opacity duration-300 animate-fade-in`}>
            {current.icon}
            <span className="hidden sm:inline">{current.text}</span>
        </div>
    );
};


const Header: React.FC<HeaderProps> = (props) => {
  const { user, onLogout, activeView, setActiveView, theme, onThemeToggle, messages, messagingState, onOpenMessaging, onCloseMessaging, syncStatus } = props;
  const [liveMessages, setLiveMessages] = useState<Message[]>(messages);

  useEffect(() => {
      // Sync with upstream prop changes (e.g., after sending a message)
      setLiveMessages(messages);
  }, [messages]);

  useEffect(() => {
      // Only poll for new messages when the messaging panel is open
      if (messagingState.isOpen) {
          const intervalId = setInterval(() => {
              try {
                  const storedMessages = window.localStorage.getItem('lacoste-messages');
                  if (storedMessages) {
                      const parsedMessages: Message[] = JSON.parse(storedMessages);
                      // Simple check to see if messages have changed to trigger a re-render.
                      if (parsedMessages.length !== liveMessages.length) {
                          setLiveMessages(parsedMessages);
                      }
                  }
              } catch (error) {
                  console.error("Error polling for messages:", error);
              }
          }, 3000); // Poll every 3 seconds

          return () => clearInterval(intervalId);
      }
  }, [messagingState.isOpen, liveMessages.length]);

  const menuItems: { id: View, label: string }[] = [
    { id: 'vagas', label: 'Vagas' },
    { id: 'talentos', label: 'Banco de Talentos' },
    { id: 'assistencia', label: 'CrocoIA' },
    { id: 'dashboard', label: 'Dashboard' },
    { id: 'relatorios', label: 'Relatórios' },
    { id: 'entrevistas', label: 'Entrevistas' },
    { id: 'contratacoes', label: 'Contratações' },
    { id: 'arquivo', label: 'Arquivo' },
  ];
  
  const adminMenuItems: { id: View, label: string }[] = [
    { id: 'admin', label: 'Painel Admin' },
  ];

  const unreadCount = useMemo(() => {
    const userId = `user-${user.id}`;
    return liveMessages.filter(m => m.receiverId === userId && !m.isRead).length;
  }, [liveMessages, user.id]);

  return (
    <>
      <header className="sticky top-0 z-40 w-full bg-light-surface/80 dark:bg-background/80 backdrop-blur-sm border-b border-light-border dark:border-border">
        <div className="w-full max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
          <div className="flex items-center justify-between h-16">
            <div className="flex items-center">
              <svg className="w-8 h-8 text-light-primary dark:text-primary" fill="none" stroke="currentColor" viewBox="0 0 24 24" xmlns="http://www.w3.org/2000/svg"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M16 12a4 4 0 10-8 0 4 4 0 008 0zm0 0v1.5a2.5 2.5 0 005 0V12a9 9 0 10-9 9m4.5-1.206a8.959 8.959 0 01-4.5 1.207"></path></svg>
              <span className="ml-2 text-xl font-bold text-light-text-primary dark:text-text-primary">Lacoste Burger</span>
            </div>
            
            <nav className="hidden md:flex items-center space-x-6">
              {menuItems.map(item => (
                <NavItem
                  key={item.id}
                  label={item.label}
                  isActive={activeView === item.id}
                  onClick={() => setActiveView(item.id)}
                />
              ))}
              {user.role === 'admin' && (
                <>
                  <div className="w-px h-6 bg-light-border dark:bg-border mx-6"></div>
                  {adminMenuItems.map(item => (
                    <NavItem
                      key={item.id}
                      label={item.label}
                      isActive={activeView === item.id}
                      onClick={() => setActiveView(item.id)}
                    />
                  ))}
                </>
              )}
            </nav>

            <div className="flex items-center gap-2">
              <SyncStatusIndicator status={syncStatus} />
              <button
                onClick={() => onOpenMessaging()}
                className="relative p-2 rounded-full text-light-text-secondary dark:text-text-secondary hover:bg-light-surface dark:hover:bg-surface hover:text-light-text-primary dark:hover:text-text-primary focus:outline-none"
                aria-label="Abrir mensagens"
              >
                  <svg xmlns="http://www.w3.org/2000/svg" width="20" height="20" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round"><path d="M4 4h16c1.1 0 2 .9 2 2v12c0 1.1-.9 2-2 2H4c-1.1 0-2-.9-2-2V6c0-1.1.9-2 2-2z"></path><polyline points="22,6 12,13 2,6"></polyline></svg>
                  {unreadCount > 0 && (
                      <span className="absolute top-1 right-1 flex h-4 w-4">
                          <span className="animate-ping absolute inline-flex h-full w-full rounded-full bg-red-400 opacity-75"></span>
                          <span className="relative inline-flex rounded-full h-4 w-4 bg-red-500 text-white text-xs items-center justify-center">{unreadCount}</span>
                      </span>
                  )}
              </button>
              <button
                onClick={onThemeToggle}
                className="p-2 rounded-full text-light-text-secondary dark:text-text-secondary hover:bg-light-surface dark:hover:bg-surface hover:text-light-text-primary dark:hover:text-text-primary focus:outline-none"
                aria-label="Toggle theme"
              >
                {theme === 'dark' ? (
                  <svg xmlns="http://www.w3.org/2000/svg" width="20" height="20" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round"><circle cx="12" cy="12" r="5"/><line x1="12" y1="1" x2="12" y2="3"/><line x1="12" y1="21" x2="12" y2="23"/><line x1="4.22" y1="4.22" x2="5.64" y2="5.64"/><line x1="18.36" y1="18.36" x2="19.78" y2="19.78"/><line x1="1" y1="12" x2="3" y2="12"/><line x1="21" y1="12" x2="23" y2="12"/><line x1="4.22" y1="19.78" x2="5.64" y2="18.36"/><line x1="18.36" y1="5.64" x2="19.78" y2="4.22"/></svg>
                ) : (
                  <svg xmlns="http://www.w3.org/2000/svg" width="20" height="20" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round"><path d="M21 12.79A9 9 0 1 1 11.21 3 7 7 0 0 0 21 12.79z"></path></svg>
                )}
              </button>
              <button
                onClick={onLogout}
                className="p-2 rounded-full text-light-text-secondary dark:text-text-secondary hover:bg-light-surface dark:hover:bg-surface hover:text-light-text-primary dark:hover:text-text-primary focus:outline-none"
                aria-label="Sair"
              >
                <svg xmlns="http://www.w3.org/2000/svg" width="20" height="20" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round"><path d="M9 21H5a2 2 0 0 1-2-2V5a2 2 0 0 1 2-2h4"></path><polyline points="16 17 21 12 16 7"></polyline><line x1="21" y1="12" x2="9" y2="12"></line></svg>
              </button>
            </div>
          </div>
        </div>
      </header>
      {messagingState.isOpen && (
        <MessagingPanel
          currentUser={{ id: `user-${user.id}`, name: user.username, type: 'user' }}
          messages={liveMessages}
          users={props.users}
          candidates={props.candidates}
          jobs={props.jobs}
          archivedConversations={props.archivedConversations}
          onClose={onCloseMessaging}
          onSendMessage={(receiverId, text) => props.onSendMessage(`user-${user.id}`, receiverId, text)}
          onUpdateMessage={props.onUpdateMessage}
          onMarkAsRead={(senderId) => props.onMarkMessagesAsRead(senderId, `user-${user.id}`)}
          onDeleteConversation={props.onDeleteConversation}
          onArchiveConversation={props.onArchiveConversation}
          onUnarchiveConversation={props.onUnarchiveConversation}
          preselectedId={messagingState.preselectedId}
        />
      )}
    </>
  );
};

export default Header;