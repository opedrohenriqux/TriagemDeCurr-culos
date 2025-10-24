import React, { useState, useMemo } from 'react';
import { HistoryEvent, User } from '../../types';

// Helper to format the date
const formatTimestamp = (timestamp: string) => {
    return new Date(timestamp).toLocaleString('pt-BR', {
        day: '2-digit',
        month: '2-digit',
        year: 'numeric',
        hour: '2-digit',
        minute: '2-digit'
    });
};

// Helper to make action names more readable
const formatAction = (action: string) => {
    return action.replace(/_/g, ' ').replace(/\b\w/g, l => l.toUpperCase());
};

const HistoryView: React.FC<{ history: HistoryEvent[], users: User[] }> = ({ history, users }) => {
    const [userFilter, setUserFilter] = useState<string>('all');

    const filteredHistory = useMemo(() => {
        if (userFilter === 'all') {
            return history;
        }
        const userId = parseInt(userFilter, 10);
        return history.filter(event => event.userId === userId);
    }, [history, userFilter]);

    return (
        <div>
            <div className="flex flex-col md:flex-row justify-between items-center mb-8 gap-4">
                <h1 className="text-3xl font-bold text-light-text-primary dark:text-text-primary">Histórico de Atividades</h1>
                <div className="flex items-center gap-4 w-full md:w-auto">
                    <label htmlFor="userFilter" className="text-sm font-semibold text-light-text-secondary dark:text-text-secondary">Filtrar por usuário:</label>
                    <select
                        id="userFilter"
                        value={userFilter}
                        onChange={(e) => setUserFilter(e.target.value)}
                        className="bg-light-surface dark:bg-surface text-light-text-primary dark:text-text-primary px-4 py-2 rounded-lg border border-light-border dark:border-border focus:outline-none focus:ring-2 focus:ring-light-primary dark:focus:ring-primary w-full md:w-48"
                    >
                        <option value="all">Todos os Usuários</option>
                        {users.map(user => (
                            <option key={user.id} value={user.id}>{user.username}</option>
                        ))}
                    </select>
                </div>
            </div>

            <div className="bg-light-surface dark:bg-surface p-4 rounded-xl border border-light-border dark:border-border">
                <div className="space-y-3 max-h-[70vh] overflow-y-auto pr-2">
                    {filteredHistory.length > 0 ? (
                        filteredHistory.map(event => (
                            <div key={event.id} className="flex flex-col sm:flex-row justify-between items-start bg-light-background dark:bg-background p-4 rounded-lg border border-light-border dark:border-border">
                                <div className="flex-1 mb-2 sm:mb-0">
                                    <p className="font-semibold text-light-text-primary dark:text-text-primary">{event.details}</p>
                                    <p className="text-xs text-light-text-secondary dark:text-text-secondary">
                                        Por <span className="font-bold">{event.username}</span> em {formatTimestamp(event.timestamp)}
                                    </p>
                                </div>
                                <span className="text-xs font-bold bg-light-border dark:bg-border px-2 py-1 rounded-full text-light-text-secondary dark:text-text-secondary whitespace-nowrap">
                                    {formatAction(event.action)}
                                </span>
                            </div>
                        ))
                    ) : (
                        <div className="text-center py-20">
                            <p className="text-light-text-secondary dark:text-text-secondary">Nenhuma atividade registrada para o filtro selecionado.</p>
                        </div>
                    )}
                </div>
            </div>
        </div>
    );
};

export default HistoryView;