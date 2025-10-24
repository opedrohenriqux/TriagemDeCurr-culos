import React, { useState, useMemo } from 'react';
import { Job } from '../../types';
import JobEditorModal from './JobEditorModal';

interface JobCardProps {
  job: Job;
  onSelect: (jobId: string) => void;
  onEdit: (job: Job) => void;
  onArchive: (jobId: string) => void;
}

const JobCard: React.FC<JobCardProps> = ({ job, onSelect, onEdit, onArchive }) => (
    <div 
        className="bg-light-surface dark:bg-surface p-6 rounded-xl border border-light-border dark:border-border transition-all duration-300 flex flex-col group hover:border-light-primary dark:hover:border-primary hover:shadow-glow-primary" 
        onClick={() => onSelect(job.id)}
    >
        <div className="flex-grow">
            <div className="flex justify-between items-start mb-2">
                <h3 className="text-xl font-bold text-light-text-primary dark:text-text-primary group-hover:text-light-primary dark:group-hover:text-primary transition-colors pr-2">{job.title}</h3>
                <div className="flex gap-1 opacity-50 group-hover:opacity-100 transition-opacity">
                    <button type="button" onClick={(e) => { e.stopPropagation(); onEdit(job); }} className="p-1.5 text-light-text-secondary dark:text-text-secondary hover:text-light-text-primary dark:hover:text-text-primary hover:bg-light-background dark:hover:bg-background rounded-full transition-colors" aria-label="Editar vaga">
                        <svg xmlns="http://www.w3.org/2000/svg" width="18" height="18" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round"><path d="M17 3a2.828 2.828 0 1 1 4 4L7.5 20.5 2 22l1.5-5.5L17 3z"></path></svg>
                    </button>
                    <button type="button" onClick={(e) => { e.stopPropagation(); onArchive(job.id); }} className="p-1.5 text-light-text-secondary dark:text-text-secondary hover:text-light-text-primary dark:hover:text-text-primary hover:bg-light-background dark:hover:bg-background rounded-full transition-colors" aria-label="Arquivar vaga">
                         <svg xmlns="http://www.w3.org/2000/svg" width="18" height="18" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round"><path d="M21 8v11a2 2 0 0 1-2 2H5a2 2 0 0 1-2-2V8"/><rect x="1" y="3" width="22" height="5"/><line x1="10" y1="12" x2="14" y2="12"/></svg>
                    </button>
                </div>
            </div>
            <p className="text-light-text-secondary dark:text-text-secondary text-sm font-medium">{job.department} - {job.location}</p>
            <p className="text-light-text-secondary dark:text-text-secondary mt-4 text-sm line-clamp-3">{job.description}</p>
        </div>
        <div className="mt-6 flex items-center justify-between cursor-pointer">
            <span className="text-sm font-bold text-light-primary dark:text-primary">Ver Detalhes</span>
            <svg xmlns="http://www.w3.org/2000/svg" width="20" height="20" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2.5" strokeLinecap="round" strokeLinejoin="round" className="text-light-primary dark:text-primary group-hover:translate-x-1 transition-transform"><polyline points="9 18 15 12 9 6"></polyline></svg>
        </div>
    </div>
);

interface JobListProps {
  jobs: Job[];
  onSelectJob: (jobId: string) => void;
  onAddJob: (job: Omit<Job, 'id'>) => void;
  onUpdateJob: (job: Job) => void;
  onArchiveJob: (jobId: string) => void;
}

const JobList: React.FC<JobListProps> = ({ jobs, onSelectJob, onAddJob, onUpdateJob, onArchiveJob }) => {
  const [searchTerm, setSearchTerm] = useState('');
  const [isModalOpen, setIsModalOpen] = useState(false);
  const [editingJob, setEditingJob] = useState<Job | null>(null);

  const activeJobs = useMemo(() => jobs.filter(j => j.status !== 'archived'), [jobs]);

  const filteredJobs = useMemo(() => {
    if (!searchTerm) return activeJobs;
    return activeJobs.filter(job => 
      job.title.toLowerCase().includes(searchTerm.toLowerCase()) ||
      job.description.toLowerCase().includes(searchTerm.toLowerCase())
    );
  }, [activeJobs, searchTerm]);

  const handleOpenEditModal = (job: Job) => {
    setEditingJob(job);
    setIsModalOpen(true);
  };

  const handleOpenCreateModal = () => {
    setEditingJob(null);
    setIsModalOpen(true);
  };

  const handleSaveJob = (jobData: Job | Omit<Job, 'id'>) => {
    if ('id' in jobData) {
      onUpdateJob(jobData as Job);
    } else {
      onAddJob(jobData);
    }
    setIsModalOpen(false);
  };


  return (
    <div>
      <div className="flex flex-col md:flex-row justify-between items-center mb-8 gap-4">
        <h1 className="text-3xl font-bold text-light-text-primary dark:text-text-primary">Vagas Abertas</h1>
        <div className="flex items-center gap-4 w-full md:w-auto">
          <input 
            type="text"
            placeholder="Filtrar vagas..."
            value={searchTerm}
            onChange={(e) => setSearchTerm(e.target.value)}
            className="bg-light-surface dark:bg-surface text-light-text-primary dark:text-text-primary placeholder-light-text-secondary dark:placeholder-text-secondary px-4 py-2 rounded-lg border border-light-border dark:border-border focus:outline-none focus:ring-2 focus:ring-light-primary dark:focus:ring-primary w-full md:w-64"
          />
          <button 
            type="button"
            onClick={handleOpenCreateModal}
            className="flex items-center justify-center gap-2 bg-light-primary dark:bg-primary text-white dark:text-background font-bold px-4 py-2 rounded-lg hover:bg-light-primary-hover dark:hover:bg-primary-hover transition-colors whitespace-nowrap"
          >
            <svg xmlns="http://www.w3.org/2000/svg" width="20" height="20" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2.5" strokeLinecap="round" strokeLinejoin="round"><line x1="12" y1="5" x2="12" y2="19"></line><line x1="5" y1="12" x2="19" y2="12"></line></svg>
            Criar Vaga
          </button>
        </div>
      </div>
      <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
        {filteredJobs.map((job) => (
          <JobCard key={job.id} job={job} onSelect={onSelectJob} onEdit={handleOpenEditModal} onArchive={onArchiveJob} />
        ))}
      </div>
      {filteredJobs.length === 0 && (
        <div className="text-center py-20 bg-light-surface dark:bg-surface rounded-xl border border-light-border dark:border-border">
          <p className="text-light-text-secondary dark:text-text-secondary">Nenhuma vaga encontrada com o filtro atual.</p>
        </div>
      )}
      <JobEditorModal
        isOpen={isModalOpen}
        onClose={() => setIsModalOpen(false)}
        onSave={handleSaveJob}
        jobToEdit={editingJob}
      />
    </div>
  );
};

export default JobList;