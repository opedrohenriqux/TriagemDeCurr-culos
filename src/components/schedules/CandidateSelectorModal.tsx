import React, { useState, useMemo, useEffect } from 'react';
import { Job, Candidate, User } from '../../types';
import Modal from '../common/Modal';
import InitialsAvatar from '../common/InitialsAvatar';

interface CandidateSelectorModalProps {
    isOpen: boolean;
    onClose: () => void;
    onSchedule: (data: {
        candidateIds: string[];
        jobId: string;
        date: string;
        time: string;
        interviewers: string[];
    }) => void;
    jobs: Job[];
    candidates: Candidate[];
    users: User[];
    selectedDate: string;
}

const CandidateSelectorModal: React.FC<CandidateSelectorModalProps> = ({
    isOpen,
    onClose,
    onSchedule,
    jobs,
    candidates,
    users,
    selectedDate,
}) => {
    const [selectedJobId, setSelectedJobId] = useState<string>('');
    const [selectedCandidateIds, setSelectedCandidateIds] = useState<string[]>([]);
    const [time, setTime] = useState('');
    const [selectedInterviewers, setSelectedInterviewers] = useState<string[]>([]);

    useEffect(() => {
        // Reset state when modal opens or job changes
        setSelectedCandidateIds([]);
    }, [isOpen, selectedJobId]);

    const approvedCandidatesForJob = useMemo(() => {
        if (!selectedJobId) return [];
        return candidates.filter(c => c.jobId === selectedJobId && c.status === 'approved' && !c.interview);
    }, [candidates, selectedJobId]);

    const handleToggleCandidate = (candidateId: string) => {
        setSelectedCandidateIds(prev =>
            prev.includes(candidateId)
                ? prev.filter(id => id !== candidateId)
                : [...prev, candidateId]
        );
    };

    const handleSelectAll = () => {
        setSelectedCandidateIds(approvedCandidatesForJob.map(c => c.id));
    };

    const handleDeselectAll = () => {
        setSelectedCandidateIds([]);
    };

    const handleSubmit = () => {
        if (!selectedJobId || selectedCandidateIds.length === 0 || !time || selectedInterviewers.length === 0) {
            alert('Por favor, preencha todos os campos obrigatórios.');
            return;
        }
        onSchedule({
            candidateIds: selectedCandidateIds,
            jobId: selectedJobId,
            date: selectedDate,
            time,
            interviewers: selectedInterviewers,
        });
        onClose();
    };

    const recruiters = useMemo(() => users.filter(u => u.role === 'recruiter' || u.role === 'admin'), [users]);


    return (
        <Modal
            isOpen={isOpen}
            onClose={onClose}
            title={`Agendar Entrevistas para ${new Date(selectedDate + 'T00:00:00').toLocaleDateString('pt-BR')}`}
            size="2xl"
        >
            <div className="space-y-4">
                {/* Job Selector */}
                <div>
                    <label htmlFor="job-select" className="block text-sm font-medium text-light-text-secondary dark:text-text-secondary">Vaga</label>
                    <select
                        id="job-select"
                        value={selectedJobId}
                        onChange={(e) => setSelectedJobId(e.target.value)}
                        className="mt-1 block w-full pl-3 pr-10 py-2 text-base border-gray-300 focus:outline-none focus:ring-indigo-500 focus:border-indigo-500 sm:text-sm rounded-md bg-light-background dark:bg-background border dark:border-border"
                    >
                        <option value="" disabled>Selecione uma vaga</option>
                        {jobs.filter(j => j.status === 'active').map(job => (
                            <option key={job.id} value={job.id}>{job.title}</option>
                        ))}
                    </select>
                </div>

                {/* Candidate List */}
                {selectedJobId && (
                    <div className="border rounded-lg p-3 max-h-60 overflow-y-auto">
                         <div className="flex justify-between items-center mb-2">
                            <h3 className="text-md font-semibold">Candidatos Aprovados</h3>
                            <div className="space-x-2">
                                <button onClick={handleSelectAll} className="text-xs text-blue-500">Selecionar Todos</button>
                                <button onClick={handleDeselectAll} className="text-xs text-gray-500">Limpar</button>
                            </div>
                        </div>
                        <ul className="space-y-2">
                            {approvedCandidatesForJob.length > 0 ? approvedCandidatesForJob.map(candidate => (
                                <li
                                    key={candidate.id}
                                    onClick={() => handleToggleCandidate(candidate.id)}
                                    className={`flex items-center p-2 rounded-md cursor-pointer ${selectedCandidateIds.includes(candidate.id) ? 'bg-blue-100 dark:bg-blue-900' : 'hover:bg-gray-100 dark:hover:bg-gray-700'}`}
                                >
                                    <input
                                        type="checkbox"
                                        checked={selectedCandidateIds.includes(candidate.id)}
                                        readOnly
                                        className="h-4 w-4 text-indigo-600 border-gray-300 rounded"
                                    />
                                    <InitialsAvatar name={candidate.name} className="w-8 h-8 ml-3 mr-3"/>
                                    <span>{candidate.name}</span>
                                </li>
                            )) : <p className="text-sm text-gray-500 text-center py-4">Nenhum candidato aprovado para esta vaga.</p>}
                        </ul>
                    </div>
                )}

                {/* Interview Details */}
                <div className="grid grid-cols-2 gap-4">
                    <div>
                        <label htmlFor="interview-time" className="block text-sm font-medium text-light-text-secondary dark:text-text-secondary">Horário</label>
                        <input
                            type="time"
                            id="interview-time"
                            value={time}
                            onChange={(e) => setTime(e.target.value)}
                            className="mt-1 block w-full pl-3 pr-10 py-2 text-base border-gray-300 focus:outline-none focus:ring-indigo-500 focus:border-indigo-500 sm:text-sm rounded-md bg-light-background dark:bg-background border dark:border-border"
                        />
                    </div>
                    <div>
                        <label htmlFor="interviewers" className="block text-sm font-medium text-light-text-secondary dark:text-text-secondary">Entrevistadores</label>
                        <select
                            multiple
                            id="interviewers"
                            value={selectedInterviewers}
                            onChange={(e) => setSelectedInterviewers(Array.from(e.target.selectedOptions, option => option.value))}
                            className="mt-1 block w-full pl-3 pr-10 py-2 text-base border-gray-300 focus:outline-none focus:ring-indigo-500 focus:border-indigo-500 sm:text-sm rounded-md bg-light-background dark:bg-background border dark:border-border"
                        >
                            {recruiters.map(user => (
                                <option key={user.id} value={user.username}>{user.username}</option>
                            ))}
                        </select>
                    </div>
                </div>
            </div>

            <div className="mt-6 flex justify-end space-x-3">
                <button type="button" onClick={onClose} className="px-4 py-2 text-sm font-medium text-gray-700 bg-white border border-gray-300 rounded-md shadow-sm hover:bg-gray-50 focus:outline-none focus:ring-2 focus:ring-offset-2 focus:ring-indigo-500 dark:bg-gray-700 dark:text-gray-200 dark:border-gray-600 dark:hover:bg-gray-600">Cancelar</button>
                <button type="button" onClick={handleSubmit} className="px-4 py-2 text-sm font-medium text-white bg-indigo-600 border border-transparent rounded-md shadow-sm hover:bg-indigo-700 focus:outline-none focus:ring-2 focus:ring-offset-2 focus:ring-indigo-500">Agendar {selectedCandidateIds.length} Entrevista(s)</button>
            </div>
        </Modal>
    );
};

export default CandidateSelectorModal;
