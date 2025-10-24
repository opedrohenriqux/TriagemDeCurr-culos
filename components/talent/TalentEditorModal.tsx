import React, { useState, useEffect } from 'react';
import { Talent } from '../../types';

interface TalentEditorModalProps {
    isOpen: boolean;
    onClose: () => void;
    onSave: (talent: Talent | Omit<Talent, 'id'>) => void;
    onArchive: (talentId: number) => void;
    talentToEdit?: Talent | null;
}

const TalentEditorModal: React.FC<TalentEditorModalProps> = ({ isOpen, onClose, onSave, onArchive, talentToEdit }) => {
    const [formData, setFormData] = useState({
        name: '',
        age: '',
        city: 'Campinas',
        education: '',
        experience: '',
        skills: '',
        potential: '8.0',
        status: 'Disponível',
        desiredPosition: '',
    });

    useEffect(() => {
        if (isOpen) {
            if (talentToEdit) {
                setFormData({
                    name: talentToEdit.name,
                    age: String(talentToEdit.age),
                    city: talentToEdit.city,
                    education: talentToEdit.education,
                    experience: talentToEdit.experience,
                    skills: talentToEdit.skills.join(', '),
                    potential: String(talentToEdit.potential),
                    status: talentToEdit.status,
                    desiredPosition: talentToEdit.desiredPosition,
                });
            } else {
                setFormData({
                    name: '',
                    age: '',
                    city: 'Campinas',
                    education: '',
                    experience: '',
                    skills: '',
                    potential: '8.0',
                    status: 'Disponível',
                    desiredPosition: '',
                });
            }
        }
    }, [isOpen, talentToEdit]);


    const handleChange = (e: React.ChangeEvent<HTMLInputElement | HTMLTextAreaElement>) => {
        const { name, value } = e.target;
        setFormData(prev => ({ ...prev, [name]: value }));
    };

    const handleSave = () => {
        const baseData = {
            ...formData,
            age: parseInt(formData.age) || 0,
            potential: parseFloat(formData.potential) || 0,
            skills: formData.skills.split(',').map(s => s.trim()).filter(s => s),
        };

        if (talentToEdit) {
            onSave({ ...baseData, id: talentToEdit.id });
        } else {
            onSave(baseData);
        }
    };

    const handleArchive = () => {
        if (talentToEdit) {
            onArchive(talentToEdit.id);
            onClose();
        }
    };

    if (!isOpen) return null;

    return (
        <div className="fixed inset-0 bg-light-background/80 dark:bg-background/90 backdrop-blur-md flex justify-center items-center z-50 animate-fade-in p-4">
            <div className="bg-light-surface dark:bg-surface rounded-xl shadow-2xl w-full max-w-2xl max-h-[90vh] flex flex-col border border-light-border dark:border-border">
                <div className="p-5 border-b border-light-border dark:border-border flex justify-between items-center">
                    <h2 className="text-xl font-bold text-light-text-primary dark:text-text-primary">{talentToEdit ? 'Editar Talento' : 'Adicionar Novo Talento'}</h2>
                    <button type="button" onClick={onClose} className="text-light-text-secondary dark:text-text-secondary hover:text-light-text-primary dark:hover:text-text-primary text-3xl">&times;</button>
                </div>
                <div className="p-6 overflow-y-auto space-y-4">
                    <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                        <div>
                            <label className="block text-sm font-medium text-light-text-secondary dark:text-text-secondary mb-1">Nome Completo</label>
                            <input type="text" name="name" value={formData.name} onChange={handleChange} className="w-full px-3 py-2 bg-light-background dark:bg-background border border-light-border dark:border-border rounded-md focus:ring-2 focus:ring-light-primary dark:focus:ring-primary focus:outline-none text-light-text-primary dark:text-text-primary" />
                        </div>
                        <div>
                            <label className="block text-sm font-medium text-light-text-secondary dark:text-text-secondary mb-1">Idade</label>
                            <input type="number" name="age" value={formData.age} onChange={handleChange} className="w-full px-3 py-2 bg-light-background dark:bg-background border border-light-border dark:border-border rounded-md focus:ring-2 focus:ring-light-primary dark:focus:ring-primary focus:outline-none text-light-text-primary dark:text-text-primary" />
                        </div>
                    </div>
                     <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                        <div>
                            <label className="block text-sm font-medium text-light-text-secondary dark:text-text-secondary mb-1">Cargo Desejado</label>
                            <input type="text" name="desiredPosition" value={formData.desiredPosition} onChange={handleChange} className="w-full px-3 py-2 bg-light-background dark:bg-background border border-light-border dark:border-border rounded-md focus:ring-2 focus:ring-light-primary dark:focus:ring-primary focus:outline-none text-light-text-primary dark:text-text-primary" />
                        </div>
                        <div>
                            <label className="block text-sm font-medium text-light-text-secondary dark:text-text-secondary mb-1">Escolaridade</label>
                            <input type="text" name="education" value={formData.education} onChange={handleChange} className="w-full px-3 py-2 bg-light-background dark:bg-background border border-light-border dark:border-border rounded-md focus:ring-2 focus:ring-light-primary dark:focus:ring-primary focus:outline-none text-light-text-primary dark:text-text-primary" />
                        </div>
                    </div>
                     <div>
                        <label className="block text-sm font-medium text-light-text-secondary dark:text-text-secondary mb-1">Experiência (Resumo)</label>
                        <textarea name="experience" value={formData.experience} onChange={handleChange} rows={3} className="w-full px-3 py-2 bg-light-background dark:bg-background border border-light-border dark:border-border rounded-md focus:ring-2 focus:ring-light-primary dark:focus:ring-primary focus:outline-none text-light-text-primary dark:text-text-primary" />
                    </div>
                    <div>
                        <label className="block text-sm font-medium text-light-text-secondary dark:text-text-secondary mb-1">Habilidades (separadas por vírgula)</label>
                        <input type="text" name="skills" value={formData.skills} onChange={handleChange} className="w-full px-3 py-2 bg-light-background dark:bg-background border border-light-border dark:border-border rounded-md focus:ring-2 focus:ring-light-primary dark:focus:ring-primary focus:outline-none text-light-text-primary dark:text-text-primary" />
                    </div>
                    <div>
                        <label className="block text-sm font-medium text-light-text-secondary dark:text-text-secondary mb-1">Potencial (0.0 a 10.0)</label>
                        <input type="number" step="0.1" name="potential" value={formData.potential} onChange={handleChange} className="w-full px-3 py-2 bg-light-background dark:bg-background border border-light-border dark:border-border rounded-md focus:ring-2 focus:ring-light-primary dark:focus:ring-primary focus:outline-none text-light-text-primary dark:text-text-primary" />
                    </div>
                </div>
                <div className="p-5 border-t border-light-border dark:border-border flex justify-between items-center">
                    {talentToEdit && (
                        <button
                            type="button"
                            onClick={handleArchive}
                            className="bg-yellow-600/20 text-yellow-500 dark:text-yellow-400 font-bold px-5 py-2 rounded-lg hover:bg-yellow-600/30 dark:hover:bg-yellow-600/40 transition-colors"
                        >
                            Arquivar Talento
                        </button>
                    )}
                    <div className="flex justify-end gap-4 ml-auto">
                        <button type="button" onClick={onClose} className="bg-light-border dark:bg-border text-light-text-primary dark:text-text-primary font-bold px-5 py-2 rounded-lg hover:bg-gray-300 dark:hover:bg-border/70 transition-colors">
                            Cancelar
                        </button>
                        <button type="button" onClick={handleSave} className="bg-light-primary dark:bg-primary text-white dark:text-background font-bold px-5 py-2 rounded-lg hover:bg-light-primary-hover dark:hover:bg-primary-hover transition-colors">
                            Salvar Talento
                        </button>
                    </div>
                </div>
            </div>
        </div>
    );
};

export default TalentEditorModal;