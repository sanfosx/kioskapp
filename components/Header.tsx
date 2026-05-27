import React, { useContext } from 'react';
import { ThemeContext, AuthContext, LanguageContext } from '../App';
import { Theme } from '../types';
import { SunIcon, MoonIcon, LogOutIcon, MenuIcon } from './icons';
import { GlobalSearch } from './GlobalSearch';

interface HeaderProps {
    onMenuClick: () => void;
    onSearchResultSelect: (type: 'product' | 'client' | 'category', id: string) => void;
}

const Header: React.FC<HeaderProps> = ({ onMenuClick, onSearchResultSelect }) => {
  const { theme, toggleTheme } = useContext(ThemeContext);
  const { logout } = useContext(AuthContext);
  const { t } = useContext(LanguageContext);

  return (
    <header className="bg-white dark:bg-slate-800 shadow-md p-4 flex justify-between items-center space-x-4">
        <div className="flex items-center flex-1">
            <button
                onClick={onMenuClick}
                className="mr-2 p-2 rounded-full text-slate-500 dark:text-slate-400 hover:bg-slate-100 dark:hover:bg-slate-700 focus:outline-none focus:ring-2 focus:ring-offset-2 focus:ring-primary-500 dark:focus:ring-offset-slate-800 md:hidden"
            >
                <MenuIcon className="h-6 w-6" />
            </button>
            <GlobalSearch onResultClick={onSearchResultSelect} />
        </div>
      
      <div className="flex items-center space-x-4">
        <button
            onClick={toggleTheme}
            className="p-2 rounded-full text-slate-500 dark:text-slate-400 hover:bg-slate-100 dark:hover:bg-slate-700 focus:outline-none focus:ring-2 focus:ring-offset-2 focus:ring-primary-500 dark:focus:ring-offset-slate-800"
        >
            {theme === Theme.Light ? <MoonIcon className="h-6 w-6" /> : <SunIcon className="h-6 w-6" />}
        </button>
        <button
            onClick={logout}
            className="flex items-center space-x-2 p-2 rounded-md text-slate-500 dark:text-slate-400 hover:bg-slate-100 dark:hover:bg-slate-700 focus:outline-none focus:ring-2 focus:ring-offset-2 focus:ring-primary-500 dark:focus:ring-offset-slate-800"
        >
            <LogOutIcon className="h-6 w-6" />
            <span className="hidden sm:inline">{t('logout')}</span>
        </button>
      </div>
    </header>
  );
};

export default Header;