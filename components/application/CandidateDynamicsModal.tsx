import React, { useMemo } from 'react';
import { Candidate, Dynamic } from '../../types';
import InitialsAvatar from '../common/InitialsAvatar';

interface CandidateDynamicsModalProps {
    candidate: Candidate;
    dynamics: Dynamic[];
    allCandidates: Candidate[];
    onClose: () => void;
}

const CandidateDynamicsModal: React.FC<CandidateDynamicsModalProps> = ({ candidate, dynamics, allCandidates, onClose }) => {
    
    const candidateDynamics = useMemo(() => {
        return dynamics.filter(d => d.participants.includes(candidate.id))
            .sort((a, b) => new Date(b.date).getTime() - new Date(a.date).getTime());
    }, [dynamics, candidate.id]);
    
    const getCandidateName = (id: number) => allCandidates.find(c => c.id === id)?.name || 'Desconhecido';

    return (
        <div className="fixed inset-0 bg-light-background/80 dark:bg-background/90 backdrop-blur-md flex justify-center items-center z-50 animate-fade-in p-4">
            <div className="bg-light-surface dark:bg-surface rounded-xl shadow-2xl w-full max-w-3xl max-h-[90vh] flex flex-col border border-light-border dark:border-border">
                <div className="p-5 border-b border-light-border dark:border-border flex justify-between items-center">
                    <h2 className="text-xl font-bold text-light-text-primary dark:text-text-primary">Minhas Dinâmicas de Grupo</h2>
                    <button type="button" onClick={onClose} className="text-light-text-secondary dark:text-text-secondary hover:text-light-text-primary dark:hover:text-text-primary text-3xl">&times;</button>
                </div>

                <div className="p-6 overflow-y-auto space-y-6">
                    {candidateDynamics.length > 0 ? (
                        candidateDynamics.map(dynamic => {
                            const myGroup = dynamic.groups.find(g => g.members.includes(candidate.id));
                            return (
                                <div key={dynamic.id} className="bg-light-background dark:bg-background p-4 rounded-lg border border-light-border dark:border-border">
                                    <h3 className="text-lg font-bold text-light-primary dark:text-primary">{dynamic.title}</h3>
                                    <p className="text-sm font-semibold text-light-text-secondary dark:text-text-secondary mb-3">
                                        Data: {new Date(dynamic.date + 'T00:00:00').toLocaleDateString('pt-BR', { timeZone: 'UTC' })}
                                    </p>
                                    
                                    <div className="mb-4">
                                        <h4 className="text-sm font-bold mb-2">Instruções</h4>
                                        <p className="text-sm text-light-text-secondary dark:text-text-secondary whitespace-pre-wrap">{dynamic.script || "As instruções serão fornecidas no dia."}</p>
                                    </div>

                                    {myGroup && (
                                        <div>
                                            <h4 className="text-sm font-bold mb-2">Seu Grupo: {myGroup.name}</h4>
                                            <div className="flex flex-wrap gap-4">
                                                {myGroup.members.map(memberId => (
                                                    <div key={memberId} className="flex items-center gap-2">
                                                        <div className="w-8 h-8 flex-shrink-0">
                                                            <InitialsAvatar name={getCandidateName(memberId)} />
                                                        </div>
                                                        <span className={`text-sm font-medium ${memberId === candidate.id ? 'font-bold' : ''}`}>
                                                            {getCandidateName(memberId)} {memberId === candidate.id ? '(Você)' : ''}
                                                        </span>
                                                    </div>
                                                ))}
                                            </div>
                                        </div>
                                    )}
                                </div>
                            )
                        })
                    ) : (
                        <div className="text-center py-10">
                            <p className="text-light-text-secondary dark:text-text-secondary">Você ainda não foi convidado para nenhuma dinâmica.</p>
                        </div>
                    )}
                </div>

                 <div className="p-4 border-t border-light-border dark:border-border flex justify-end">
                    <button type="button" onClick={onClose} className="bg-light-primary dark:bg-primary text-white font-bold px-5 py-2 rounded-lg hover:bg-light-primary-hover dark:hover:bg-primary-hover transition-colors">
                        Fechar
                    </button>
                </div>
            </div>
        </div>
    );
};

export default CandidateDynamicsModal;