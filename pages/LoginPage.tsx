
import React, { useState, useContext } from 'react';
import { BarcodeIcon, ChevronLeftIcon } from '../components/icons';
import { LanguageContext, AuthContext } from '../App';
import { SystemUser } from '../types';

interface LoginPageProps {
  onBack?: () => void;
}

const LoginPage: React.FC<LoginPageProps> = ({ onBack }) => {
  const { t } = useContext(LanguageContext);
  const { login } = useContext(AuthContext);
  const [email, setEmail] = useState('');
  const [password, setPassword] = useState('');
  const [error, setError] = useState('');
  const [loading, setLoading] = useState(false);

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setLoading(true);
    setError('');

    try {
      const apiUrl = ((import.meta as any).env?.VITE_API_URL as string) || (
          (window.location.hostname === 'localhost' || window.location.hostname === '127.0.0.1') && window.location.port !== '3000'
          ? 'http://localhost:3001/api' 
          : '/api'
      );
      const response = await fetch(`${apiUrl}/auth/login`, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ email, password })
      });

      if (!response.ok) {
         throw new Error('Invalid credentials');
      }

      const data = await response.json();
      login(data.token, data.user);
    } catch (err: any) {
      console.error(err);
      setError(t('invalidCredentials'));
    } finally {
      setLoading(false);
    }
  };

  return (
    <div className="flex items-center justify-center min-h-screen px-4 bg-slate-50 dark:bg-slate-950 font-sans">
      <div className="w-full max-w-md p-8 sm:p-10 space-y-8 bg-white dark:bg-slate-900 rounded-3xl shadow-xl shadow-slate-200/50 dark:shadow-none border border-slate-200/60 dark:border-slate-800 relative">
        {onBack && (
          <button 
            onClick={onBack}
            className="absolute top-6 left-6 p-2 text-slate-400 hover:text-slate-900 dark:hover:text-white transition-colors rounded-full hover:bg-slate-100 dark:hover:bg-slate-800 focus:outline-none focus:ring-2 focus:ring-primary-500"
            aria-label={t('backToHome')}
          >
            <ChevronLeftIcon className="w-5 h-5" />
          </button>
        )}
        <div className="text-center pt-6">
            <div className="flex justify-center items-center gap-3 mb-6">
                <div className="bg-primary-50 dark:bg-primary-900/30 p-3 rounded-2xl">
                  <BarcodeIcon className="h-8 w-8 text-primary-600 dark:text-primary-400"/>
                </div>
            </div>
            <h1 className="text-3xl font-extrabold tracking-tight text-slate-900 dark:text-white mb-2">{t('appName')}</h1>
            <p className="text-slate-500 dark:text-slate-400 text-sm">{t('loginSubtitle')}</p>
        </div>
        <form className="mt-8 space-y-6" onSubmit={handleSubmit}>
          <div className="space-y-4">
            <div>
              <label htmlFor="email-address" className="block text-sm font-medium text-slate-700 dark:text-slate-300 mb-1.5">{t('emailPlaceholder')}</label>
              <input
                id="email-address"
                name="email"
                type="email" 
                autoComplete="email"
                required
                className="appearance-none block w-full px-4 py-3 border border-slate-300 dark:border-slate-700 placeholder-slate-400 text-slate-900 dark:text-white bg-white dark:bg-slate-900 rounded-xl focus:outline-none focus:ring-2 focus:ring-primary-500 focus:border-transparent sm:text-sm transition-shadow"
                placeholder="admin@example.com"
                value={email}
                onChange={(e) => setEmail(e.target.value)}
              />
            </div>
            <div>
              <label htmlFor="password-input" className="block text-sm font-medium text-slate-700 dark:text-slate-300 mb-1.5">{t('passwordPlaceholder')}</label>
              <input
                id="password-input"
                name="password"
                type="password"
                autoComplete="current-password"
                required
                className="appearance-none block w-full px-4 py-3 border border-slate-300 dark:border-slate-700 placeholder-slate-400 text-slate-900 dark:text-white bg-white dark:bg-slate-900 rounded-xl focus:outline-none focus:ring-2 focus:ring-primary-500 focus:border-transparent sm:text-sm transition-shadow"
                placeholder="••••••••"
                value={password}
                onChange={(e) => setPassword(e.target.value)}
              />
            </div>
          </div>

          {error && (
            <div className="p-3 rounded-xl bg-red-50 dark:bg-red-900/20 border border-red-100 dark:border-red-900/30">
              <p className="text-center text-sm text-red-600 dark:text-red-400 font-medium">{error}</p>
            </div>
          )}

          <div className="pt-2">
            <button
              type="submit"
              disabled={loading}
              className="group relative w-full flex justify-center py-3.5 px-4 border border-transparent text-sm font-semibold rounded-xl text-white bg-primary-600 hover:bg-primary-700 focus:outline-none focus:ring-2 focus:ring-offset-2 focus:ring-primary-500 dark:focus:ring-offset-slate-900 transition-all shadow-sm hover:shadow-md disabled:opacity-70 disabled:cursor-not-allowed"
            >
              {loading ? (
                <span className="flex items-center gap-2">
                  <svg className="animate-spin -ml-1 mr-2 h-4 w-4 text-white" xmlns="http://www.w3.org/2000/svg" fill="none" viewBox="0 0 24 24">
                    <circle className="opacity-25" cx="12" cy="12" r="10" stroke="currentColor" strokeWidth="4"></circle>
                    <path className="opacity-75" fill="currentColor" d="M4 12a8 8 0 018-8V0C5.373 0 0 5.373 0 12h4zm2 5.291A7.962 7.962 0 014 12H0c0 3.042 1.135 5.824 3 7.938l3-2.647z"></path>
                  </svg>
                  {t('signingIn')}
                </span>
              ) : t('signIn')}
            </button>
          </div>
        </form>
      </div>
    </div>
  );
};

export default LoginPage;
