import React, { useState, useEffect } from 'react';
import { Job, JobSource } from '../../types';

interface JobEditorModalProps {
    isOpen: boolean;
    onClose: () => void;
    onSave: (job: Job | Omit<Job, 'id'>) => void;
    jobToEdit: Job | null;
}

const JobEditorModal: React.FC<JobEditorModalProps> = ({ isOpen, onClose, onSave, jobToEdit }) => {
    const [formData, setFormData] = useState({
        title: '',
        department: '',
        location: '',
        description: '',
        responsibilities: '',
        benefits: '',
        requirements: '',
    });
    const [sources, setSources] = useState<JobSource[]>([]);

    useEffect(() => {
        if (isOpen) {
            if (jobToEdit) {
                setFormData({
                    ...jobToEdit,
                    responsibilities: jobToEdit.responsibilities.join('\n'),
                    benefits: jobToEdit.benefits.join('\n'),
                    requirements: jobToEdit.requirements.join('\n'),
                });
                setSources(jobToEdit.sources || []);
            } else {
                 setFormData({
                    title: '',
                    department: '',
                    location: '',
                    description: '',
                    responsibilities: '',
                    benefits: '',
                    requirements: '',
                });
                setSources([]);
            }
        }
    }, [isOpen, jobToEdit]);

    const handleChange = (e: React.ChangeEvent<HTMLInputElement | HTMLTextAreaElement>) => {
        const { name, value } = e.target;
        setFormData(prev => ({ ...prev, [name]: value }));
    };

    const handleSourceChange = (index: number, field: keyof JobSource, value: string) => {
        const newSources = [...sources];
        newSources[index][field] = value;
        setSources(newSources);
    };

    const handleAddSource = () => {
        setSources([...sources, { name: '', url: '' }]);
    };

    const handleRemoveSource = (index: number) => {
        setSources(sources.filter((_, i) => i !== index));
    };


    const handleSave = () => {
        const finalJobData = {
            ...formData,
            responsibilities: formData.responsibilities.split('\n').filter(r => r.trim() !== ''),
            benefits: formData.benefits.split('\n').filter(b => b.trim() !== ''),
            requirements: formData.requirements.split('\n').filter(r => r.trim() !== ''),
            sources: sources.filter(s => s.name.trim() !== '' && s.url.trim() !== ''),
        };

        if (jobToEdit) {
            // FIX: The 'status' property was missing. Preserving the existing status when updating a job.
            onSave({ ...finalJobData, id: jobToEdit.id, status: jobToEdit.status });
        } else {
            // FIX: The 'status' property was missing. New jobs should default to 'active'.
            onSave({ ...finalJobData, status: 'active' });
        }
    };

    if (!isOpen) return null;

    return (
        <div className="fixed inset-0 bg-light-background/80 dark:bg-background/90 backdrop-blur-md flex justify-center items-center z-50 animate-fade-in p-4">
            <div className="bg-light-surface dark:bg-surface rounded-xl shadow-2xl w-full max-w-2xl max-h-[90vh] flex flex-col border border-light-border dark:border-border">
                <div className="p-5 border-b border-light-border dark:border-border flex justify-between items-center">
                    <h2 className="text-xl font-bold text-light-text-primary dark:text-text-primary">{jobToEdit ? 'Editar Vaga' : 'Criar Nova Vaga'}</h2>
                    <button type="button" onClick={onClose} className="text-light-text-secondary dark:text-text-secondary hover:text-light-text-primary dark:hover:text-text-primary text-3xl">&times;</button>
                </div>
                <div className="p-6 overflow-y-auto space-y-4">
                    <div>
                        <label htmlFor="title" className="block text-sm font-medium text-light-text-secondary dark:text-text-secondary mb-1">Título da Vaga</label>
                        <input type="text" name="title" id="title" value={formData.title} onChange={handleChange} className="w-full px-3 py-2 bg-light-background dark:bg-background border border-light-border dark:border-border rounded-md focus:ring-2 focus:ring-light-primary dark:focus:ring-primary focus:outline-none text-light-text-primary dark:text-text-primary" />
                    </div>
                    <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                        <div>
                            <label htmlFor="department" className="block text-sm font-medium text-light-text-secondary dark:text-text-secondary mb-1">Departamento</label>
                            <input type="text" name="department" id="department" value={formData.department} onChange={handleChange} className="w-full px-3 py-2 bg-light-background dark:bg-background border border-light-border dark:border-border rounded-md focus:ring-2 focus:ring-light-primary dark:focus:ring-primary focus:outline-none text-light-text-primary dark:text-text-primary" />
                        </div>
                        <div>
                            <label htmlFor="location" className="block text-sm font-medium text-light-text-secondary dark:text-text-secondary mb-1">Localização</label>
                            <input type="text" name="location" id="location" value={formData.location} onChange={handleChange} className="w-full px-3 py-2 bg-light-background dark:bg-background border border-light-border dark:border-border rounded-md focus:ring-2 focus:ring-light-primary dark:focus:ring-primary focus:outline-none text-light-text-primary dark:text-text-primary" />
                        </div>
                    </div>
                    <div>
                        <label htmlFor="description" className="block text-sm font-medium text-light-text-secondary dark:text-text-secondary mb-1">Descrição da Vaga</label>
                        <textarea name="description" id="description" value={formData.description} onChange={handleChange} rows={4} className="w-full px-3 py-2 bg-light-background dark:bg-background border border-light-border dark:border-border rounded-md focus:ring-2 focus:ring-light-primary dark:focus:ring-primary focus:outline-none text-light-text-primary dark:text-text-primary" />
                    </div>
                    <div>
                        <label htmlFor="responsibilities" className="block text-sm font-medium text-light-text-secondary dark:text-text-secondary mb-1">Responsabilidades (uma por linha)</label>
                        <textarea name="responsibilities" id="responsibilities" value={formData.responsibilities} onChange={handleChange} rows={4} className="w-full px-3 py-2 bg-light-background dark:bg-background border border-light-border dark:border-border rounded-md focus:ring-2 focus:ring-light-primary dark:focus:ring-primary focus:outline-none text-light-text-primary dark:text-text-primary" />
                    </div>
                     <div>
                        <label htmlFor="benefits" className="block text-sm font-medium text-light-text-secondary dark:text-text-secondary mb-1">Benefícios (um por linha)</label>
                        <textarea name="benefits" id="benefits" value={formData.benefits} onChange={handleChange} rows={4} className="w-full px-3 py-2 bg-light-background dark:bg-background border border-light-border dark:border-border rounded-md focus:ring-2 focus:ring-light-primary dark:focus:ring-primary focus:outline-none text-light-text-primary dark:text-text-primary" />
                    </div>
                     <div>
                        <label htmlFor="requirements" className="block text-sm font-medium text-light-text-secondary dark:text-text-secondary mb-1">Requisitos (um por linha)</label>
                        <textarea name="requirements" id="requirements" value={formData.requirements} onChange={handleChange} rows={4} className="w-full px-3 py-2 bg-light-background dark:bg-background border border-light-border dark:border-border rounded-md focus:ring-2 focus:ring-light-primary dark:focus:ring-primary focus:outline-none text-light-text-primary dark:text-text-primary" />
                    </div>

                    {/* Job Sources */}
                    <div>
                        <h3 className="text-lg font-medium text-light-text-primary dark:text-text-primary mb-2">Origem da base de candidatos</h3>
                        <div className="space-y-3">
                            {sources.map((source, index) => (
                                <div key={index} className="flex items-center gap-2 p-2 bg-light-background dark:bg-background rounded-md border border-light-border dark:border-border">
                                    <input
                                        type="text"
                                        placeholder="Nome da Fonte (ex: LinkedIn)"
                                        value={source.name}
                                        onChange={(e) => handleSourceChange(index, 'name', e.target.value)}
                                        className="flex-1 px-3 py-2 bg-light-surface dark:bg-surface border border-light-border dark:border-border rounded-md focus:ring-2 focus:ring-light-primary dark:focus:ring-primary focus:outline-none text-light-text-primary dark:text-text-primary"
                                    />
                                    <input
                                        type="url"
                                        placeholder="URL do Link de Inscrição"
                                        value={source.url}
                                        onChange={(e) => handleSourceChange(index, 'url', e.target.value)}
                                        className="flex-1 px-3 py-2 bg-light-surface dark:bg-surface border border-light-border dark:border-border rounded-md focus:ring-2 focus:ring-light-primary dark:focus:ring-primary focus:outline-none text-light-text-primary dark:text-text-primary"
                                    />
                                    <button type="button" onClick={() => handleRemoveSource(index)} className="p-2 text-red-500 hover:bg-red-500/10 rounded-full">
                                        <svg xmlns="http://www.w3.org/2000/svg" width="20" height="20" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round"><polyline points="3 6 5 6 21 6"></polyline><path d="M19 6v14a2 2 0 0 1-2 2H7a2 2 0 0 1-2-2V6m3 0V4a2 2 0 0 1 2-2h4a2 2 0 0 1 2 2v2"></path></svg>
                                    </button>
                                </div>
                            ))}
                        </div>
                        <button type="button" onClick={handleAddSource} className="mt-3 flex items-center gap-2 text-sm text-light-primary dark:text-primary font-semibold hover:text-light-primary-hover dark:hover:text-primary-hover">
                             <svg xmlns="http://www.w3.org/2000/svg" width="18" height="18" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round"><circle cx="12" cy="12" r="10"></circle><line x1="12" y1="8" x2="12" y2="16"></line><line x1="8" y1="12" x2="16" y2="12"></line></svg>
                            Adicionar Origem
                        </button>
                    </div>

                </div>
                <div className="p-5 border-t border-light-border dark:border-border flex justify-end gap-4">
                    <button type="button" onClick={onClose} className="bg-light-border dark:bg-border text-light-text-primary dark:text-text-primary font-bold px-5 py-2 rounded-lg hover:bg-gray-300 dark:hover:bg-border/70 transition-colors">
                        Cancelar
                    </button>
                    <button type="button" onClick={handleSave} className="bg-light-primary dark:bg-primary text-white dark:text-background font-bold px-5 py-2 rounded-lg hover:bg-light-primary-hover dark:hover:bg-primary-hover transition-colors">
                        Salvar Vaga
                    </button>
                </div>
            </div>
        </div>
    );
};

export default JobEditorModal;