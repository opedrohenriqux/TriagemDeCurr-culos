import React, { useState, useRef, useEffect } from 'react';
import { getAIResponseForChat } from '../../services/geminiService';
import { Job, Candidate, ChatMessage, User } from '../../types';
import InitialsAvatar from '../common/InitialsAvatar';

interface ChatInterfaceProps {
    jobs: Job[];
    candidates: Candidate[];
    user: User;
}

const Spinner: React.FC = () => (
    <div className="animate-spin rounded-full h-5 w-5 border-t-2 border-b-2 border-white dark:border-background"></div>
);

const ChatInterface: React.FC<ChatInterfaceProps> = ({ jobs, candidates, user }) => {
    const [messages, setMessages] = useState<ChatMessage[]>([]);
    const [input, setInput] = useState('');
    const [isLoading, setIsLoading] = useState(false);
    const messagesEndRef = useRef<null | HTMLDivElement>(null);
    const [copiedMessageId, setCopiedMessageId] = useState<number | null>(null);

    useEffect(() => {
        setMessages([
            {
                id: Date.now(),
                sender: 'ai',
                text: `Olá, ${user.username}! Sou a CrocoIA, a assistente de IA do Lacoste Burger. Como posso ajudar você hoje a otimizar seu processo de recrutamento?`,
                timestamp: new Date().toISOString()
            }
        ]);
    }, [user.username]);
    

    const scrollToBottom = () => {
        messagesEndRef.current?.scrollIntoView({ behavior: "smooth" });
    };

    useEffect(scrollToBottom, [messages]);

    const handleSendMessage = async () => {
        if (input.trim() === '' || isLoading) return;

        const userMessage: ChatMessage = {
            id: Date.now(),
            sender: 'user',
            text: input,
            timestamp: new Date().toISOString()
        };

        setMessages(prev => [...prev, userMessage]);
        setInput('');
        setIsLoading(true);

        const aiResponseText = await getAIResponseForChat(input, jobs, candidates);
        
        const aiMessage: ChatMessage = {
            id: Date.now() + 1,
            sender: 'ai',
            text: aiResponseText || "Desculpe, não consegui processar sua solicitação. Tente novamente.",
            timestamp: new Date().toISOString()
        };

        setMessages(prev => [...prev, aiMessage]);
        setIsLoading(false);
    };

    const handleCopy = (text: string, messageId: number) => {
        const tsvContent = text.match(/```([\s\S]*)```/);
        const contentToCopy = tsvContent ? tsvContent[1].trim() : text;
        navigator.clipboard.writeText(contentToCopy).then(() => {
            setCopiedMessageId(messageId);
            setTimeout(() => setCopiedMessageId(null), 2000);
        });
    };
    
    // A simple markdown parser for bold and lists since we can't add libraries
    const SimpleMarkdownRenderer: React.FC<{ text: string }> = ({ text }) => {
        // Handle code blocks (for TSV) first
        if (text.startsWith('```') && text.endsWith('```')) {
            const content = text.slice(3, -3).trim();
            return <pre className="bg-light-background dark:bg-background p-3 rounded-md text-sm whitespace-pre-wrap font-mono">{content}</pre>;
        }

        const lines = text.split('\n');
        return (
            <div>
                {lines.map((line, i) => {
                    if (line.trim().startsWith('* ') || line.trim().startsWith('- ')) {
                        return <li key={i} className="ml-4 list-disc">{line.trim().substring(2)}</li>;
                    }
                    // Simple bold with **text**
                    const parts = line.split('**');
                    return (
                        <p key={i}>
                            {parts.map((part, j) => 
                                j % 2 === 1 ? <strong key={j}>{part}</strong> : <span key={j}>{part}</span>
                            )}
                        </p>
                    );
                })}
            </div>
        );
    };

    return (
        <div className="flex flex-col h-[calc(100vh-10rem)] max-w-4xl mx-auto bg-light-surface dark:bg-surface rounded-xl border border-light-border dark:border-border shadow-xl">
            <div className="p-4 border-b border-light-border dark:border-border">
                <h1 className="text-xl font-bold text-light-text-primary dark:text-text-primary">CrocoIA</h1>
            </div>
            <div className="flex-1 overflow-y-auto p-6 space-y-6">
                {messages.map((msg) => (
                    <div key={msg.id} className={`flex items-start gap-4 ${msg.sender === 'user' ? 'justify-end' : ''}`}>
                        {msg.sender === 'ai' && (
                           <div className="w-10 h-10 flex-shrink-0 bg-light-primary/10 dark:bg-primary/10 text-light-primary dark:text-primary p-2 rounded-full mt-1">
                                <svg xmlns="http://www.w3.org/2000/svg" width="24" height="24" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round"><path d="m12 3-1.912 5.813a2 2 0 0 1-1.275 1.275L3 12l5.813 1.912a2 2 0 0 1 1.275 1.275L12 21l1.912-5.813a2 2 0 0 1 1.275-1.275L21 12l-5.813-1.912a2 2 0 0 1-1.275-1.275L12 3Z"/></svg>
                            </div>
                        )}
                        <div className={`max-w-xl group relative ${msg.sender === 'user' ? 'order-2' : ''}`}>
                            <div className={`px-4 py-3 rounded-2xl text-sm ${msg.sender === 'user' ? 'bg-light-primary dark:bg-primary text-white rounded-br-none' : 'bg-light-background dark:bg-background rounded-bl-none'}`}>
                                <SimpleMarkdownRenderer text={msg.text} />
                            </div>
                            {msg.sender === 'ai' && (
                                <button
                                    onClick={() => handleCopy(msg.text, msg.id)}
                                    className="absolute top-2 right-2 p-1.5 bg-light-surface dark:bg-surface rounded-full text-light-text-secondary dark:text-text-secondary opacity-0 group-hover:opacity-100 transition-opacity"
                                >
                                    {copiedMessageId === msg.id ? 
                                        <svg xmlns="http://www.w3.org/2000/svg" width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2.5" strokeLinecap="round" strokeLinejoin="round"><path d="M20 6 9 17l-5-5"/></svg>
                                        :
                                        <svg xmlns="http://www.w3.org/2000/svg" width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2.5" strokeLinecap="round" strokeLinejoin="round"><rect x="9" y="9" width="13" height="13" rx="2" ry="2"/><path d="M5 15H4a2 2 0 0 1-2-2V4a2 2 0 0 1 2-2h9a2 2 0 0 1 2 2v1"/></svg>
                                    }
                                </button>
                            )}
                        </div>
                         {msg.sender === 'user' && (
                           <div className="w-10 h-10 flex-shrink-0 order-1"><InitialsAvatar name={user.username} /></div>
                        )}
                    </div>
                ))}
                {isLoading && (
                    <div className="flex items-start gap-4">
                        <div className="w-10 h-10 flex-shrink-0 bg-light-primary/10 dark:bg-primary/10 text-light-primary dark:text-primary p-2 rounded-full mt-1">
                            <svg xmlns="http://www.w3.org/2000/svg" width="24" height="24" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round"><path d="m12 3-1.912 5.813a2 2 0 0 1-1.275 1.275L3 12l5.813 1.912a2 2 0 0 1 1.275 1.275L12 21l1.912-5.813a2 2 0 0 1 1.275-1.275L21 12l-5.813-1.912a2 2 0 0 1-1.275-1.275L12 3Z"/></svg>
                        </div>
                        <div className="px-4 py-3 rounded-2xl bg-light-background dark:bg-background rounded-bl-none flex items-center gap-2">
                           <div className="w-2 h-2 bg-light-text-secondary dark:text-text-secondary rounded-full animate-bounce [animation-delay:-0.3s]"></div>
                            <div className="w-2 h-2 bg-light-text-secondary dark:text-text-secondary rounded-full animate-bounce [animation-delay:-0.15s]"></div>
                            <div className="w-2 h-2 bg-light-text-secondary dark:text-text-secondary rounded-full animate-bounce"></div>
                        </div>
                    </div>
                )}
                <div ref={messagesEndRef} />
            </div>
            <div className="p-4 border-t border-light-border dark:border-border">
                <div className="flex items-center gap-2 bg-light-background dark:bg-background rounded-lg border border-light-border dark:border-border focus-within:ring-2 focus-within:ring-light-primary dark:focus-within:ring-primary">
                    <input
                        type="text"
                        value={input}
                        onChange={(e) => setInput(e.target.value)}
                        onKeyPress={(e) => e.key === 'Enter' && handleSendMessage()}
                        placeholder="Digite sua mensagem..."
                        className="w-full bg-transparent border-none focus:ring-0 text-light-text-primary dark:text-text-primary placeholder-light-text-secondary dark:placeholder-text-secondary p-3"
                        disabled={isLoading}
                    />
                    <button onClick={handleSendMessage} disabled={isLoading || !input.trim()} className="p-2 m-1 rounded-full bg-light-primary dark:bg-primary text-white dark:text-background disabled:bg-gray-400 dark:disabled:bg-gray-600 transition-colors">
                        {isLoading ? <Spinner /> : <svg xmlns="http://www.w3.org/2000/svg" width="20" height="20" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2.5" strokeLinecap="round" strokeLinejoin="round"><line x1="22" y1="2" x2="11" y2="13"/><polygon points="22 2 15 22 11 13 2 9 22 2"/></svg>}
                    </button>
                </div>
            </div>
        </div>
    );
};

export default ChatInterface;