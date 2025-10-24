import React, { useState } from 'react';
import { User } from '../../types';
import UserEditorModal from './UserEditorModal';
import { View } from '../layout/MainLayout';

interface AdminPanelProps {
  currentUser: User;
  users: User[];
  onAddUser: (user: Omit<User, 'id' | 'role'> & { password?: string }) => void;
  onRemoveUser: (userId: string) => void;
  onUpdateUser: (user: User) => void;
  onToggleAdminRole: (userId: string) => void;
  setActiveView: (view: View) => void;
}

const AdminPanel: React.FC<AdminPanelProps> = ({ currentUser, users, onAddUser, onRemoveUser, onUpdateUser, onToggleAdminRole, setActiveView }) => {
  const [newUsername, setNewUsername] = useState('');
  const [newPassword, setNewPassword] = useState('');
  const [error, setError] = useState('');
  const [isEditModalOpen, setIsEditModalOpen] = useState(false);
  const [editingUser, setEditingUser] = useState<User | null>(null);

  const handleAddUser = (e: React.FormEvent) => {
    e.preventDefault();
    if (!newUsername || !newPassword) {
      setError('Usuário e senha são obrigatórios.');
      return;
    }
    if (users.find(u => u.username === newUsername)) {
      setError('Nome de usuário já existe.');
      return;
    }
    onAddUser({ username: newUsername, password: newPassword });
    setNewUsername('');
    setNewPassword('');
    setError('');
  };

  const openEditModal = (user: User) => {
    setEditingUser(user);
    setIsEditModalOpen(true);
  };

  const handleSaveUser = (user: User) => {
    onUpdateUser(user);
    setIsEditModalOpen(false);
  }

  return (
    <>
      <div>
        <div className="flex flex-col md:flex-row justify-between items-center mb-8 gap-4">
            <h1 className="text-3xl font-bold text-light-text-primary dark:text-text-primary">Painel de Administração</h1>
            <button
                type="button"
                onClick={() => setActiveView('historico')}
                className="flex items-center gap-2 bg-light-secondary/20 dark:bg-secondary/20 text-light-secondary dark:text-secondary font-semibold px-4 py-2 rounded-lg text-sm hover:bg-light-secondary/30 dark:hover:bg-secondary/40 transition-colors"
            >
                <svg xmlns="http://www.w3.org/2000/svg" width="18" height="18" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round"><path d="M12 22c5.523 0 10-4.477 10-10S17.523 2 12 2 2 6.477 2 12s4.477 10 10 10z"/><path d="M12 6v6l4 2"/></svg>
                Ver Histórico de Atividades
            </button>
        </div>


        {/* Add User Form */}
        <div className="bg-light-surface dark:bg-surface p-6 rounded-xl border border-light-border dark:border-border mb-8">
          <h2 className="text-2xl font-bold mb-4 text-light-primary dark:text-primary">Adicionar Novo Usuário</h2>
          <form onSubmit={handleAddUser} className="flex flex-col md:flex-row gap-4">
            <input
              type="text"
              placeholder="Nome de usuário"
              value={newUsername}
              onChange={(e) => setNewUsername(e.target.value)}
              className="flex-1 bg-light-background dark:bg-background border border-light-border dark:border-border rounded-lg px-4 py-2 focus:outline-none focus:ring-2 focus:ring-light-primary dark:focus:ring-primary text-light-text-primary dark:text-text-primary"
            />
            <input
              type="password"
              placeholder="Senha"
              value={newPassword}
              onChange={(e) => setNewPassword(e.target.value)}
              className="flex-1 bg-light-background dark:bg-background border border-light-border dark:border-border rounded-lg px-4 py-2 focus:outline-none focus:ring-2 focus:ring-light-primary dark:focus:ring-primary text-light-text-primary dark:text-text-primary"
            />
            <button type="submit" className="bg-light-primary dark:bg-primary text-white dark:text-background font-bold px-6 py-2 rounded-lg hover:bg-light-primary-hover dark:hover:bg-primary-hover transition-colors">
              Adicionar
            </button>
          </form>
          {error && <p className="text-red-500 text-sm mt-2">{error}</p>}
        </div>

        {/* User List */}
        <div className="bg-light-surface dark:bg-surface p-6 rounded-xl border border-light-border dark:border-border">
          <h2 className="text-2xl font-bold mb-4 text-light-text-primary dark:text-text-primary">Usuários Atuais</h2>
          <div className="space-y-3">
            {users.map(user => (
              <div key={user.id} className="flex flex-col sm:flex-row justify-between items-center bg-light-background dark:bg-background p-4 rounded-lg border border-light-border dark:border-border">
                <div className="flex items-center mb-2 sm:mb-0">
                  <span className="font-semibold text-light-text-primary dark:text-text-primary">{user.username}</span>
                  {user.role === 'admin' && <span className="ml-2 text-xs bg-yellow-400/10 text-yellow-500 dark:text-yellow-400 border border-yellow-400/20 font-bold px-2 py-0.5 rounded-full">Admin</span>}
                </div>
                <div className="flex gap-2">
                   <label className="flex items-center cursor-pointer">
                        <span className="mr-3 text-sm font-medium text-light-text-secondary dark:text-text-secondary">Admin</span>
                        <div className="relative">
                            <input 
                                type="checkbox" 
                                checked={user.role === 'admin'} 
                                onChange={() => onToggleAdminRole(user.id)}
                                className="sr-only peer"
                                disabled={user.id === currentUser.id || user.id === 1} // Can't demote self or primary admin
                            />
                            <div className="w-11 h-6 bg-light-border dark:bg-border rounded-full peer peer-checked:after:translate-x-full peer-checked:after:border-white after:content-[''] after:absolute after:top-[2px] after:left-[2px] after:bg-white after:border-light-border dark:after:border-border after:border after:rounded-full after:h-5 after:w-5 after:transition-all peer-checked:bg-light-primary dark:peer-checked:bg-primary peer-disabled:opacity-50 peer-disabled:cursor-not-allowed"></div>
                        </div>
                    </label>
                   <div className="w-px h-6 bg-light-border dark:bg-border mx-2"></div>
                  <button
                    type="button"
                    onClick={() => openEditModal(user)}
                    className="bg-light-secondary/20 dark:bg-secondary/20 text-light-secondary dark:text-secondary font-semibold px-4 py-1 rounded-lg text-sm hover:bg-light-secondary/30 dark:hover:bg-secondary/40 transition-colors"
                  >
                    Editar
                  </button>
                  <button
                    type="button"
                    onClick={() => onRemoveUser(user.id)}
                    disabled={user.id === currentUser.id || user.id === 1} // Can't delete self or primary admin
                    className="bg-red-600/20 text-red-500 dark:text-red-400 font-semibold px-4 py-1 rounded-lg text-sm hover:bg-red-600/30 dark:hover:bg-red-600/40 disabled:opacity-50 disabled:cursor-not-allowed transition-colors"
                  >
                    Remover
                  </button>
                </div>
              </div>
            ))}
          </div>
        </div>
      </div>
      <UserEditorModal
        isOpen={isEditModalOpen}
        onClose={() => setIsEditModalOpen(false)}
        onSave={handleSaveUser}
        userToEdit={editingUser}
        allUsers={users}
        onDelete={onRemoveUser}
        currentUser={currentUser}
      />
    </>
  );
};

export default AdminPanel;