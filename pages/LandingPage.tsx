import React, { useContext } from 'react';
import { ThemeContext, LanguageContext } from '../App';
import { SunIcon, MoonIcon } from '../components/icons';
import { ArrowRight, Store, BarChart3, Users, ShieldCheck, Zap, Globe } from 'lucide-react';
import { Theme } from '../types';

interface LandingPageProps {
  onLoginClick: () => void;
}

const LandingPage: React.FC<LandingPageProps> = ({ onLoginClick }) => {
  const { theme, toggleTheme } = useContext(ThemeContext);
  const { t, language, setLanguage } = useContext(LanguageContext);

  const toggleLanguage = () => {
    setLanguage(language === 'es' ? 'en' : 'es');
  };

  return (
    <div className="min-h-screen bg-slate-50 dark:bg-slate-950 text-slate-900 dark:text-slate-50 font-sans selection:bg-primary-500/30">
      {/* Header */}
      <header className="sticky top-0 z-50 w-full border-b border-slate-200/80 dark:border-slate-800/80 bg-white/80 dark:bg-slate-950/80 backdrop-blur-md">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 h-16 flex items-center justify-between">
          <div className="flex items-center gap-2.5">
            <div className="bg-primary-600 p-1.5 rounded-lg text-white">
              <Store className="w-5 h-5" />
            </div>
            <span className="text-xl font-bold tracking-tight text-slate-900 dark:text-white">{t('appName')}</span>
          </div>
          <div className="flex items-center gap-2 sm:gap-4">
            <button
              onClick={toggleLanguage}
              className="flex items-center gap-1.5 px-3 py-1.5 rounded-full text-sm font-medium text-slate-600 dark:text-slate-300 hover:text-slate-900 dark:hover:text-white hover:bg-slate-100 dark:hover:bg-slate-800 transition-colors focus:outline-none focus:ring-2 focus:ring-primary-500"
              aria-label="Toggle language"
            >
              <Globe className="w-4 h-4" />
              <span className="uppercase">{language}</span>
            </button>
            <button
              onClick={toggleTheme}
              className="p-2 rounded-full text-slate-500 hover:text-slate-900 dark:text-slate-400 dark:hover:text-white hover:bg-slate-100 dark:hover:bg-slate-800 transition-colors focus:outline-none focus:ring-2 focus:ring-primary-500"
              aria-label="Toggle theme"
            >
              {theme === Theme.Light ? (
                <MoonIcon className="w-5 h-5" />
              ) : (
                <SunIcon className="w-5 h-5" />
              )}
            </button>
            <button
              onClick={onLoginClick}
              className="px-4 sm:px-5 py-2 text-sm font-medium text-white bg-slate-900 hover:bg-slate-800 dark:bg-primary-600 dark:hover:bg-primary-700 rounded-lg transition-colors shadow-sm focus:outline-none focus:ring-2 focus:ring-offset-2 focus:ring-slate-900 dark:focus:ring-primary-500 dark:focus:ring-offset-slate-950"
            >
              {t('signIn')}
            </button>
          </div>
        </div>
      </header>

      {/* Hero Section */}
      <section className="relative pt-24 pb-32 overflow-hidden">
        <div className="absolute inset-0 bg-[radial-gradient(ellipse_at_top,_var(--tw-gradient-stops))] from-primary-100/40 via-slate-50 to-slate-50 dark:from-primary-900/20 dark:via-slate-950 dark:to-slate-950 -z-10"></div>
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 text-center">
          <div className="inline-flex items-center gap-2 px-3 py-1 rounded-full bg-white dark:bg-slate-900 border border-slate-200 dark:border-slate-800 text-slate-600 dark:text-slate-300 text-sm font-medium mb-8 shadow-sm">
            <Zap className="w-4 h-4 text-amber-500" />
            <span>{t('heroBadge')}</span>
          </div>
          <h1 className="text-5xl md:text-7xl font-extrabold tracking-tight mb-8 max-w-4xl mx-auto leading-[1.1]">
            {t('heroTitle1')}<span className="text-transparent bg-clip-text bg-gradient-to-r from-primary-600 to-blue-600 dark:from-primary-400 dark:to-blue-400">{t('heroTitle2')}</span>
          </h1>
          <p className="text-lg md:text-xl text-slate-600 dark:text-slate-400 mb-10 max-w-2xl mx-auto leading-relaxed">
            {t('heroSubtitle')}
          </p>
          <div className="flex flex-col sm:flex-row items-center justify-center gap-4">
            <button
              onClick={onLoginClick}
              className="w-full sm:w-auto px-8 py-4 text-base font-semibold text-white bg-primary-600 hover:bg-primary-700 rounded-xl transition-all shadow-lg shadow-primary-600/20 hover:shadow-primary-600/30 flex items-center justify-center gap-2 focus:outline-none focus:ring-2 focus:ring-offset-2 focus:ring-primary-500 dark:focus:ring-offset-slate-950"
            >
              {t('getStarted')} <ArrowRight className="w-5 h-5" />
            </button>
          </div>
        </div>
      </section>

      {/* Features Section */}
      <section className="py-24 bg-white dark:bg-slate-900 border-t border-slate-200/50 dark:border-slate-800/50">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
          <div className="text-center mb-20">
            <h2 className="text-3xl md:text-4xl font-bold mb-4 tracking-tight text-slate-900 dark:text-white">{t('featuresTitle')}</h2>
            <p className="text-lg text-slate-600 dark:text-slate-400 max-w-2xl mx-auto">
              {t('featuresSubtitle')}
            </p>
          </div>
          
          <div className="grid md:grid-cols-3 gap-8 max-w-5xl mx-auto">
            {/* Feature 1 */}
            <div className="p-8 rounded-3xl bg-slate-50 dark:bg-slate-800/50 border border-slate-100 dark:border-slate-800 hover:border-primary-200 dark:hover:border-primary-900/50 transition-colors group">
              <div className="w-12 h-12 rounded-2xl bg-white dark:bg-slate-800 shadow-sm border border-slate-200 dark:border-slate-700 flex items-center justify-center mb-6 group-hover:scale-110 transition-transform">
                <Store className="w-6 h-6 text-blue-600 dark:text-blue-400" />
              </div>
              <h3 className="text-xl font-semibold mb-3 text-slate-900 dark:text-white">{t('feature1Title')}</h3>
              <p className="text-slate-600 dark:text-slate-400 leading-relaxed">
                {t('feature1Desc')}
              </p>
            </div>

            {/* Feature 2 */}
            <div className="p-8 rounded-3xl bg-slate-50 dark:bg-slate-800/50 border border-slate-100 dark:border-slate-800 hover:border-primary-200 dark:hover:border-primary-900/50 transition-colors group">
              <div className="w-12 h-12 rounded-2xl bg-white dark:bg-slate-800 shadow-sm border border-slate-200 dark:border-slate-700 flex items-center justify-center mb-6 group-hover:scale-110 transition-transform">
                <BarChart3 className="w-6 h-6 text-emerald-600 dark:text-emerald-400" />
              </div>
              <h3 className="text-xl font-semibold mb-3 text-slate-900 dark:text-white">{t('feature2Title')}</h3>
              <p className="text-slate-600 dark:text-slate-400 leading-relaxed">
                {t('feature2Desc')}
              </p>
            </div>

            {/* Feature 3 */}
            <div className="p-8 rounded-3xl bg-slate-50 dark:bg-slate-800/50 border border-slate-100 dark:border-slate-800 hover:border-primary-200 dark:hover:border-primary-900/50 transition-colors group">
              <div className="w-12 h-12 rounded-2xl bg-white dark:bg-slate-800 shadow-sm border border-slate-200 dark:border-slate-700 flex items-center justify-center mb-6 group-hover:scale-110 transition-transform">
                <ShieldCheck className="w-6 h-6 text-purple-600 dark:text-purple-400" />
              </div>
              <h3 className="text-xl font-semibold mb-3 text-slate-900 dark:text-white">{t('feature3Title')}</h3>
              <p className="text-slate-600 dark:text-slate-400 leading-relaxed">
                {t('feature3Desc')}
              </p>
            </div>
          </div>
        </div>
      </section>

      {/* Footer */}
      <footer className="py-12 border-t border-slate-200 dark:border-slate-800 bg-white dark:bg-slate-950 text-center">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 flex flex-col items-center">
          <div className="flex items-center gap-2 mb-4 opacity-50">
            <Store className="w-5 h-5" />
            <span className="font-bold tracking-tight">{t('appName')}</span>
          </div>
          <p className="text-slate-500 dark:text-slate-400 text-sm">
            &copy; {new Date().getFullYear()} {t('footerText')}
          </p>
        </div>
      </footer>
    </div>
  );
};

export default LandingPage;
