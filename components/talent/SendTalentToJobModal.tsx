import React, { useState, useEffect } from 'react';
import { Job, Talent } from '../../types';

interface SendTalentToJobModalProps {
    isOpen: boolean;
    onClose: () => void;
    onSend: (jobId: string) => void;
    talent: Talent;
    activeJobs: Job[];
}

const SendTalentToJobModal: React.FC<SendTalentToJobModalProps> = ({ isOpen, onClose, onSend, talent, activeJobs }) => {
    const [selectedJobId, setSelectedJobId] = useState<string>('');
    const [error, setError] = useState('');

    useEffect(() => {
        if (activeJobs.length > 0) {
            setSelectedJobId(activeJobs[0].id);
        }
    }, [activeJobs]);

    if (!isOpen) return null;

    const handleSend = () => {
        if (!selectedJobId) {
            setError('Por favor, selecione uma vaga.');
            return;
        }
        onSend(selectedJobId);
        onClose();
    };

    return (
        <div className="fixed inset-0 bg-light-background/80 dark:bg-background/90 backdrop-blur-md flex justify-center items-center z-50 animate-fade-in p-4">
            <div className="bg-light-surface dark:bg-surface rounded-xl shadow-2xl w-full max-w-md flex flex-col border border-light-border dark:border-border">
                <div className="p-5 border-b border-light-border dark:border-border flex justify-between items-center">
                    <h2 className="text-xl font-bold text-light-text-primary dark:text-text-primary">Enviar Talento para Vaga</h2>
                    <button type="button" onClick={onClose} className="text-light-text-secondary dark:text-text-secondary hover:text-light-text-primary dark:hover:text-text-primary text-3xl">&times;</button>
                </div>
                <div className="p-6 space-y-4">
                    <p className="text-light-text-secondary dark:text-text-secondary">
                        Selecione a vaga para a qual deseja enviar o talento <strong className="text-light-text-primary dark:text-text-primary">{talent.name}</strong>. Ele será removido do Banco de Talentos e adicionado como candidato na vaga escolhida.
                    </p>
                    <div>
                        <label htmlFor="job-select" className="block text-sm font-medium text-light-text-secondary dark:text-text-secondary mb-1">Vagas Ativas</label>
                        <select
                            id="job-select"
                            value={selectedJobId}
                            onChange={(e) => setSelectedJobId(e.target.value)}
                            className="w-full px-3 py-2 bg-light-background dark:bg-background border border-light-border dark:border-border rounded-md focus:ring-2 focus:ring-light-primary dark:focus:ring-primary focus:outline-none text-light-text-primary dark:text-text-primary"
                        >
                            {activeJobs.length > 0 ? (
                                activeJobs.map(job => (
                                    <option key={job.id} value={job.id}>{job.title}</option>
                                ))
                            ) : (
                                <option disabled>Nenhuma vaga ativa</option>
                            )}
                        </select>
                    </div>
                    {error && <p className="text-red-500 text-sm">{error}</p>}
                </div>
                <div className="p-5 border-t border-light-border dark:border-border flex justify-end gap-4">
                    <button type="button" onClick={onClose} className="bg-light-border dark:bg-border text-light-text-primary dark:text-text-primary font-bold px-5 py-2 rounded-lg hover:bg-gray-300 dark:hover:bg-border/70 transition-colors">
                        Cancelar
                    </button>
                    <button type="button" onClick={handleSend} disabled={!selectedJobId} className="bg-light-primary dark:bg-primary text-white dark:text-background font-bold px-5 py-2 rounded-lg hover:bg-light-primary-hover dark:hover:bg-primary-hover transition-colors disabled:opacity-50">
                        Enviar para Vaga
                    </button>
                </div>
            </div>
        </div>
    );
};

export default SendTalentToJobModal;