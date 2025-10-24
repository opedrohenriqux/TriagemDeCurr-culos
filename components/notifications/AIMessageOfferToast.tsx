import React from 'react';
import { Candidate, Job } from '../../types';

interface AIMessageOfferToastProps {
  offer: {
    candidate: Candidate;
    job: Job;
  };
  onSend: () => void;
  onDismiss: () => void;
}

const AIMessageOfferToast: React.FC<AIMessageOfferToastProps> = ({ offer, onSend, onDismiss }) => {
  const { candidate } = offer;

  return (
    <div
      className="fixed bottom-8 right-8 z-[100] w-full max-w-sm bg-light-surface dark:bg-surface border-l-4 border-light-primary dark:border-primary rounded-lg shadow-2xl p-5 text-light-text-primary dark:text-text-primary animate-fade-in-up"
      role="alert"
    >
      <div className="flex items-start gap-4">
        <div className="flex-shrink-0 bg-light-primary/10 dark:bg-primary/10 text-light-primary dark:text-primary p-2 rounded-full mt-1">
          <svg xmlns="http://www.w3.org/2000/svg" width="24" height="24" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round"><path d="m12 3-1.912 5.813a2 2 0 0 1-1.275 1.275L3 12l5.813 1.912a2 2 0 0 1 1.275 1.275L12 21l1.912-5.813a2 2 0 0 1 1.275-1.275L21 12l-5.813-1.912a2 2 0 0 1-1.275-1.275L12 3Z"/></svg>
        </div>
        <div>
          <h4 className="font-bold text-lg">Sugestão da IA</h4>
          <p className="text-sm mt-1 text-light-text-secondary dark:text-text-secondary">
            Notei que você aprovou <strong>{candidate.name}</strong>. Deseja que eu envie uma mensagem de parabéns e convite para a entrevista?
          </p>
          <div className="mt-4 flex gap-2">
            <button onClick={onSend} className="flex-1 bg-light-primary dark:bg-primary text-white font-bold px-4 py-2 text-sm rounded-lg hover:bg-light-primary-hover dark:hover:bg-primary-hover transition-colors">
              Sim, Enviar
            </button>
            <button onClick={onDismiss} className="flex-1 bg-light-border dark:bg-border font-bold px-4 py-2 text-sm rounded-lg hover:bg-light-border/70 dark:hover:bg-border/70 transition-colors">
              Não, obrigado
            </button>
          </div>
        </div>
        <button
          type="button"
          onClick={onDismiss}
          className="absolute top-3 right-3 text-light-text-secondary dark:text-text-secondary hover:text-light-text-primary dark:hover:text-text-primary transition-colors"
          aria-label="Dispensar sugestão"
        >
          <svg xmlns="http://www.w3.org/2000/svg" width="20" height="20" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2.5" strokeLinecap="round" strokeLinejoin="round"><line x1="18" y1="6" x2="6" y2="18"></line><line x1="6" y1="6" x2="18" y2="18"></line></svg>
        </button>
      </div>
    </div>
  );
};

export default AIMessageOfferToast;