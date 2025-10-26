import React, { useState } from 'react';

interface LoginScreenProps {
  onLogin: (email: string, password: string) => Promise<boolean>;
  onSwitchToApplication: () => void;
}

const Spinner: React.FC = () => (
    <div className="animate-spin rounded-full h-5 w-5 border-t-2 border-b-2 border-white"></div>
);

const LoginScreen: React.FC<LoginScreenProps> = ({ onLogin, onSwitchToApplication }) => {
  const [email, setEmail] = useState('');
  const [password, setPassword] = useState('');
  const [rememberMe, setRememberMe] = useState(false);
  const [error, setError] = useState('');
  const [showPassword, setShowPassword] = useState(false);
  const [loading, setLoading] = useState(false);

  useEffect(() => {
    const savedEmail = localStorage.getItem('rememberedEmail');
    if (savedEmail) {
      setEmail(savedEmail);
      setRememberMe(true);
    }
  }, []);

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setError('');
    setLoading(true);

    if (rememberMe) {
      localStorage.setItem('rememberedEmail', email);
    } else {
      localStorage.removeItem('rememberedEmail');
    }

    const success = await onLogin(email, password);
    if (!success) {
      setError('Email ou senha inválidos.');
      setLoading(false);
    }
    // On success, the component will unmount as App state changes, so no need to setLoading(false)
  };

  return (
    <div className="relative flex items-center justify-center min-h-screen overflow-hidden bg-light-background dark:bg-background">
      {/* Animated Background */}
      <div className="absolute inset-0 bg-gradient-to-br from-light-secondary via-light-primary to-green-300 dark:from-secondary dark:via-primary dark:to-teal-500 opacity-60 dark:opacity-40"></div>
      
      {/* Floating Blobs */}
      <div className="absolute inset-0 -z-10">
          <div className="absolute top-1/4 left-1/4 w-72 h-72 bg-light-primary dark:bg-primary opacity-50 rounded-full filter blur-2xl animate-blob"></div>
          <div className="absolute bottom-1/4 right-1/4 w-72 h-72 bg-light-secondary dark:bg-secondary opacity-50 rounded-full filter blur-2xl animate-blob animation-delay-2000"></div>
          <div className="absolute top-1/2 right-1/3 w-48 h-48 bg-yellow-500/50 rounded-full filter blur-xl animate-blob animation-delay-4000"></div>
      </div>

      <div className="relative w-full max-w-lg p-8 space-y-8 bg-light-surface/80 dark:bg-surface/70 backdrop-blur-xl rounded-2xl border border-white/30 dark:border-border/50 shadow-2xl animate-fade-in-up">
        <div className="text-center">
          <h1 className="text-4xl font-extrabold text-light-text-primary dark:text-text-primary">Lacoste Burger</h1>
          <h2 className="text-2xl font-bold text-light-text-primary dark:text-text-primary mt-6">Área do Recrutador</h2>
          <p className="mt-2 text-light-text-secondary dark:text-text-secondary">Faça login para acessar a plataforma.</p>
        </div>
        <form className="mt-8 space-y-6" onSubmit={handleSubmit}>
          <div className="space-y-4">
            <div>
              <label htmlFor="email" className="text-sm font-medium text-light-text-secondary dark:text-text-secondary mb-1 block">Email</label>
              <input
                id="email"
                name="email"
                type="email"
                autoComplete="email"
                required
                className="appearance-none relative block w-full px-4 py-3 border border-light-border dark:border-border bg-light-background dark:bg-background text-light-text-primary dark:text-text-primary placeholder-light-text-secondary dark:placeholder-text-secondary focus:outline-none focus:ring-2 focus:ring-light-primary dark:focus:ring-primary focus:border-light-primary dark:focus:border-primary sm:text-sm rounded-lg transition-transform duration-300 focus:scale-[1.02]"
                placeholder="seu-email@exemplo.com"
                value={email}
                onChange={(e) => setEmail(e.target.value)}
              />
            </div>
            <div className="relative">
              <label htmlFor="password-input" className="text-sm font-medium text-light-text-secondary dark:text-text-secondary mb-1 block">Senha</label>
              <input
                id="password-input"
                name="password"
                type={showPassword ? 'text' : 'password'}
                autoComplete="current-password"
                required
                className="appearance-none relative block w-full px-4 py-3 border border-light-border dark:border-border bg-light-background dark:bg-background text-light-text-primary dark:text-text-primary placeholder-light-text-secondary dark:placeholder-text-secondary focus:outline-none focus:ring-2 focus:ring-light-primary dark:focus:ring-primary focus:border-light-primary dark:focus:border-primary sm:text-sm rounded-lg transition-transform duration-300 focus:scale-[1.02]"
                placeholder="••••••••"
                value={password}
                onChange={(e) => setPassword(e.target.value)}
              />
              <button
                type="button"
                onClick={() => setShowPassword(!showPassword)}
                className="absolute inset-y-0 right-0 top-7 pr-3 flex items-center text-light-text-secondary dark:text-text-secondary hover:text-light-text-primary dark:hover:text-text-primary"
                aria-label={showPassword ? "Ocultar senha" : "Mostrar senha"}
              >
                {showPassword ? (
                  <svg xmlns="http://www.w3.org/2000/svg" width="20" height="20" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round"><path d="M2 12s3-7 10-7 10 7 10 7-3 7-10 7-10-7-10-7Z"/><circle cx="12" cy="12" r="3"/></svg>
                ) : (
                  <svg xmlns="http://www.w3.org/2000/svg" width="20" height="20" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round"><path d="M9.88 9.88a3 3 0 1 0 4.24 4.24"/><path d="M10.73 5.08A10.43 10.43 0 0 1 12 5c7 0 10 7 10 7a13.16 13.16 0 0 1-1.67 2.68"/><path d="M6.61 6.61A13.526 13.526 0 0 0 2 12s3 7 10 7a9.74 9.74 0 0 0 5.39-1.61"/><line x1="2" x2="22" y1="2" y2="22"/></svg>
                )}
              </button>
            </div>
          </div>

          <div className="flex items-center justify-between">
            <div className="flex items-center">
              <input
                id="remember-me"
                name="remember-me"
                type="checkbox"
                checked={rememberMe}
                onChange={(e) => setRememberMe(e.target.checked)}
                className="h-4 w-4 text-light-primary dark:text-primary focus:ring-light-primary dark:focus:ring-primary border-gray-300 rounded"
              />
              <label htmlFor="remember-me" className="ml-2 block text-sm text-light-text-secondary dark:text-text-secondary">
                Lembrar de mim
              </label>
            </div>
          </div>

          {error && <p className="text-red-500 text-sm text-center">{error}</p>}

          <div>
            <button
              type="submit"
              disabled={loading}
              className="group relative w-full flex justify-center py-3 px-4 border border-transparent text-sm font-bold rounded-lg text-white dark:text-background bg-light-primary dark:bg-primary hover:bg-light-primary-hover dark:hover:bg-primary-hover focus:outline-none focus:ring-2 focus:ring-offset-2 focus:ring-offset-light-surface dark:focus:ring-offset-surface focus:ring-light-primary dark:focus:ring-primary transition-colors disabled:bg-gray-400 dark:disabled:bg-gray-600 disabled:cursor-not-allowed"
            >
              {loading ? <Spinner /> : 'Entrar'}
            </button>
          </div>
        </form>
         <div className="text-center mt-8">
            <button onClick={onSwitchToApplication} className="text-sm font-medium text-light-text-secondary dark:text-text-secondary hover:text-light-primary dark:hover:text-primary transition-colors">
                &larr; Voltar para o Portal de Carreiras
            </button>
        </div>
      </div>
    </div>
  );
};

export default LoginScreen;