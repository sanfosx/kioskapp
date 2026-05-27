
import React, { useContext } from 'react';
import { ThemeContext, LanguageContext } from '../App';
import { Theme } from '../types';
import { MoonIcon, SunIcon } from './icons';

const Settings: React.FC = () => {
  const { theme, toggleTheme } = useContext(ThemeContext);
  const { language, setLanguage, t } = useContext(LanguageContext);

  return (
    <div className="max-w-2xl mx-auto space-y-8">
      <h1 className="text-3xl font-bold mb-6">{t('configuration')}</h1>
      
      <div className="bg-white dark:bg-slate-800 shadow rounded-lg p-6 space-y-6">
        {/* Language Settings */}
        <div>
          <h2 className="text-xl font-semibold mb-2">{t('language')}</h2>
          <p className="text-slate-500 dark:text-slate-400 mb-4 text-sm">{t('selectLanguage')}</p>
          <div className="flex gap-4">
            <button
              onClick={() => setLanguage('es')}
              className={`px-4 py-2 rounded-md font-medium border transition-colors ${
                language === 'es'
                  ? 'bg-primary-600 text-white border-primary-600'
                  : 'bg-white dark:bg-slate-700 text-slate-700 dark:text-slate-200 border-slate-300 dark:border-slate-600 hover:bg-slate-50 dark:hover:bg-slate-600'
              }`}
            >
              Español
            </button>
            <button
              onClick={() => setLanguage('en')}
              className={`px-4 py-2 rounded-md font-medium border transition-colors ${
                language === 'en'
                  ? 'bg-primary-600 text-white border-primary-600'
                  : 'bg-white dark:bg-slate-700 text-slate-700 dark:text-slate-200 border-slate-300 dark:border-slate-600 hover:bg-slate-50 dark:hover:bg-slate-600'
              }`}
            >
              English
            </button>
          </div>
        </div>

        <hr className="border-slate-200 dark:border-slate-700" />

        {/* Theme Settings */}
        <div>
          <h2 className="text-xl font-semibold mb-2">{t('theme')}</h2>
          <p className="text-slate-500 dark:text-slate-400 mb-4 text-sm">{t('selectTheme')}</p>
          <div className="flex gap-4">
            <button
              onClick={() => theme === Theme.Dark && toggleTheme()}
              className={`flex items-center gap-2 px-4 py-2 rounded-md font-medium border transition-colors ${
                theme === Theme.Light
                  ? 'bg-primary-600 text-white border-primary-600'
                  : 'bg-white dark:bg-slate-700 text-slate-700 dark:text-slate-200 border-slate-300 dark:border-slate-600 hover:bg-slate-50 dark:hover:bg-slate-600'
              }`}
            >
              <SunIcon className="w-5 h-5" />
              {t('light')}
            </button>
            <button
              onClick={() => theme === Theme.Light && toggleTheme()}
              className={`flex items-center gap-2 px-4 py-2 rounded-md font-medium border transition-colors ${
                theme === Theme.Dark
                  ? 'bg-primary-600 text-white border-primary-600'
                  : 'bg-white dark:bg-slate-700 text-slate-700 dark:text-slate-200 border-slate-300 dark:border-slate-600 hover:bg-slate-50 dark:hover:bg-slate-600'
              }`}
            >
              <MoonIcon className="w-5 h-5" />
              {t('dark')}
            </button>
          </div>
        </div>
      </div>
    </div>
  );
};

export default Settings;
