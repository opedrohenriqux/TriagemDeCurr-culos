// FIX: Replaced corrupted file content with a functional UserEditorModal component.
// This resolves the missing default export error and allows the application to compile.
import React, { useState, useEffect } from 'react';
import { User } from '../../types';

interface UserEditorModalProps {
    isOpen: boolean;
    onClose: () => void;
    onSave: (user: User) => void;
    onDelete: (userId: number) => void;
    userToEdit: User | null;
    allUsers: User[];
    currentUser: User;
}

const UserEditorModal: React.FC<UserEditorModalProps> = ({ isOpen, onClose, onSave, onDelete, userToEdit, allUsers, currentUser }) => {
    const [username, setUsername] = useState('');
    const [password, setPassword] = useState('');
    const [confirmPassword, setConfirmPassword] = useState('');
    const [error, setError] = useState('');

    useEffect(() => {
        if (isOpen && userToEdit) {
            setUsername(userToEdit.username);
            setPassword('');
            setConfirmPassword('');
            setError('');
        }
    }, [isOpen, userToEdit]);

    const handleSave = () => {
        setError('');
        if (!username.trim()) {
            setError('O nome de usuário não pode estar em branco.');
            return;
        }

        if (allUsers.some(u => u.username === username && u.id !== userToEdit?.id)) {
            setError('Este nome de usuário já está em uso.');
            return;
        }

        if (password && password !== confirmPassword) {
            setError('As senhas não coincidem.');
            return;
        }
        
        const updatedUser: User = {
            ...userToEdit!,
            username: username,
        };

        if (password) {
            updatedUser.password = password;
        }

        onSave(updatedUser);
        onClose();
    };
    
    const handleDelete = () => {
        if (userToEdit) {
            onDelete(userToEdit.id);
            onClose();
        }
    }

    if (!isOpen) return null;

    return (
        <div className="fixed inset-0 bg-light-background/80 dark:bg-background/90 backdrop-blur-md flex justify-center items-center z-50 animate-fade-in p-4">
            <div className="bg-light-surface dark:bg-surface rounded-xl shadow-2xl w-full max-w-lg flex flex-col border border-light-border dark:border-border">
                <div className="p-5 border-b border-light-border dark:border-border flex justify-between items-center">
                    <h2 className="text-xl font-bold text-light-text-primary dark:text-text-primary">Editar Usuário</h2>
                    <button type="button" onClick={onClose} className="text-light-text-secondary dark:text-text-secondary hover:text-light-text-primary dark:hover:text-text-primary text-3xl">&times;</button>
                </div>
                <div className="p-6 space-y-4">
                    {error && <p className="text-red-500 text-sm bg-red-500/10 p-2 rounded-md">{error}</p>}
                    <div>
                        <label className="block text-sm font-medium text-light-text-secondary dark:text-text-secondary mb-1">Nome de Usuário</label>
                        <input
                            type="text"
                            value={username}
                            onChange={(e) => setUsername(e.target.value)}
                            className="w-full px-3 py-2 bg-light-background dark:bg-background border border-light-border dark:border-border rounded-md focus:ring-2 focus:ring-light-primary dark:focus:ring-primary focus:outline-none text-light-text-primary dark:text-text-primary"
                        />
                    </div>
                    <div>
                        <label className="block text-sm font-medium text-light-text-secondary dark:text-text-secondary mb-1">Nova Senha (deixe em branco para não alterar)</label>
                        <input
                            type="password"
                            placeholder="••••••••"
                            value={password}
                            onChange={(e) => setPassword(e.target.value)}
                            className="w-full px-3 py-2 bg-light-background dark:bg-background border border-light-border dark:border-border rounded-md focus:ring-2 focus:ring-light-primary dark:focus:ring-primary focus:outline-none text-light-text-primary dark:text-text-primary"
                        />
                    </div>
                    <div>
                        <label className="block text-sm font-medium text-light-text-secondary dark:text-text-secondary mb-1">Confirmar Nova Senha</label>
                        <input
                            type="password"
                            placeholder="••••••••"
                            value={confirmPassword}
                            onChange={(e) => setConfirmPassword(e.target.value)}
                            className="w-full px-3 py-2 bg-light-background dark:bg-background border border-light-border dark:border-border rounded-md focus:ring-2 focus:ring-light-primary dark:focus:ring-primary focus:outline-none text-light-text-primary dark:text-text-primary"
                        />
                    </div>
                </div>
                <div className="p-5 border-t border-light-border dark:border-border flex justify-between items-center">
                    <button 
                        type="button"
                        onClick={handleDelete}
                        disabled={userToEdit?.id === currentUser.id || userToEdit?.id === 1}
                        className="bg-red-600/20 text-red-500 dark:text-red-400 font-bold px-5 py-2 rounded-lg hover:bg-red-600/30 dark:hover:bg-red-600/40 transition-colors disabled:opacity-50 disabled:cursor-not-allowed"
                    >
                        Excluir Usuário
                    </button>
                    <div className="flex gap-4">
                        <button type="button" onClick={onClose} className="bg-light-border dark:bg-border text-light-text-primary dark:text-text-primary font-bold px-5 py-2 rounded-lg hover:bg-gray-300 dark:hover:bg-border/70 transition-colors">
                            Cancelar
                        </button>
                        <button type="button" onClick={handleSave} className="bg-light-primary dark:bg-primary text-white dark:text-background font-bold px-5 py-2 rounded-lg hover:bg-light-primary-hover dark:hover:bg-primary-hover transition-colors">
                            Salvar Alterações
                        </button>
                    </div>
                </div>
            </div>
        </div>
    );
};

export default UserEditorModal;