
import React, { useContext } from 'react';
import { AuthContext, LanguageContext } from '../App';
import { BarcodeIcon, DashboardIcon, ShoppingCartIcon, PackageIcon, UsersIcon, LogOutIcon, TagIcon, ShieldIcon, MenuIcon, FileTextIcon } from './icons';

// Simple Settings Gear Icon since it wasn't in original icons
const SettingsIcon = ({ className }: { className?: string }) => (
  <svg className={className} xmlns="http://www.w3.org/2000/svg" width="24" height="24" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round"><path d="M12.22 2h-.44a2 2 0 0 0-2 2v.18a2 2 0 0 1-1 1.73l-.43.25a2 2 0 0 1-2 0l-.15-.08a2 2 0 0 0-2.73.73l-.22.38a2 2 0 0 0 .73 2.73l.15.1a2 2 0 0 1 1 1.72v.51a2 2 0 0 1-1 1.74l-.15.09a2 2 0 0 0-.73 2.73l.22.38a2 2 0 0 0 2.73.73l.15-.08a2 2 0 0 1 2 0l.43.25a2 2 0 0 1 1 1.73V20a2 2 0 0 0 2 2h.44a2 2 0 0 0 2-2v-.18a2 2 0 0 1 1-1.73l.43-.25a2 2 0 0 1 2 0l.15.08a2 2 0 0 0 2.73-.73l.22-.38a2 2 0 0 0-.73-2.73l-.15-.1a2 2 0 0 1-1-1.72v-.51a2 2 0 0 1 1-1.74l.15-.09a2 2 0 0 0 .73-2.73l-.22-.38a2 2 0 0 0-2.73-.73l-.15.08a2 2 0 0 1-2 0l-.43-.25a2 2 0 0 1-1-1.73V4a2 2 0 0 0-2-2z"/><circle cx="12" cy="12" r="3"/></svg>
);

type Page = 'dashboard' | 'sales' | 'products' | 'clients' | 'categories' | 'users' | 'settings' | 'activity_logs';

interface SidebarProps {
  activePage: Page;
  setActivePage: (page: Page) => void;
  isOpen: boolean;
  setIsOpen: (isOpen: boolean) => void;
}

const NavItem: React.FC<{
  icon: React.ReactNode;
  label: string;
  isActive: boolean;
  onClick: () => void;
}> = ({ icon, label, isActive, onClick }) => (
  <button
    onClick={onClick}
    className={`flex items-center w-full px-4 py-3 text-sm font-medium rounded-lg transition-colors duration-200 ${
      isActive
        ? 'bg-primary-500 text-white'
        : 'text-slate-600 dark:text-slate-300 hover:bg-slate-200 dark:hover:bg-slate-700'
    }`}
  >
    {icon}
    <span className="ml-3">{label}</span>
  </button>
);

const Sidebar: React.FC<SidebarProps> = ({ activePage, setActivePage, isOpen, setIsOpen }) => {
    const { logout, currentUser } = useContext(AuthContext);
    const { t } = useContext(LanguageContext);
    const role = currentUser?.role || 'salesperson'; 

  return (
    <>
        {/* Overlay for mobile */}
        <div 
            className={`fixed inset-0 bg-black bg-opacity-50 z-30 md:hidden transition-opacity duration-300 ${isOpen ? 'opacity-100' : 'opacity-0 pointer-events-none'}`}
            onClick={() => setIsOpen(false)}
        ></div>
        
        <aside className={`w-64 h-full flex-shrink-0 bg-white dark:bg-slate-800 shadow-lg flex flex-col p-4 fixed md:static inset-y-0 left-0 z-40 transform transition-transform duration-300 ease-in-out ${isOpen ? 'translate-x-0' : '-translate-x-full'} md:translate-x-0`}>
          <div className="flex items-center gap-2 px-4 py-3 border-b border-slate-200 dark:border-slate-700">
            <BarcodeIcon className="h-8 w-8 text-primary-500"/>
            <div>
                 <span className="text-xl font-bold block">{t('appName')}</span>
                 <span className="text-xs text-slate-500 dark:text-slate-400 capitalize">{t(role)}</span>
            </div>
          </div>
          <nav className="mt-6 flex-1 overflow-y-auto space-y-2 scrollbar-thin scrollbar-thumb-slate-300 dark:scrollbar-thumb-slate-600">
            <NavItem
              icon={<DashboardIcon className="h-5 w-5" />}
              label={t('dashboard')}
              isActive={activePage === 'dashboard'}
              onClick={() => setActivePage('dashboard')}
            />
            
            {/* Sales and Clients: Hidden for Stock Clerks */}
            {role !== 'stock_clerk' && (
                <>
                    <NavItem
                    icon={<ShoppingCartIcon className="h-5 w-5" />}
                    label={t('sales')}
                    isActive={activePage === 'sales'}
                    onClick={() => setActivePage('sales')}
                    />
                    <NavItem
                    icon={<UsersIcon className="h-5 w-5" />}
                    label={t('clients')}
                    isActive={activePage === 'clients'}
                    onClick={() => setActivePage('clients')}
                    />
                </>
            )}

            {/* Products and Categories: Visible to everyone */}
            <NavItem
              icon={<PackageIcon className="h-5 w-5" />}
              label={t('products')}
              isActive={activePage === 'products'}
              onClick={() => setActivePage('products')}
            />
            <NavItem
              icon={<TagIcon className="h-5 w-5" />}
              label={t('categories')}
              isActive={activePage === 'categories'}
              onClick={() => setActivePage('categories')}
            />
            
            {/* Users: Only for Admin */}
            {role === 'admin' && (
                <>
                <NavItem
                icon={<ShieldIcon className="h-5 w-5" />}
                label={t('users')}
                isActive={activePage === 'users'}
                onClick={() => setActivePage('users')}
                />
                <NavItem
                icon={<FileTextIcon className="h-5 w-5" />}
                label={t('activityLogs' as any) || 'Activity Logs'}
                isActive={activePage === 'activity_logs' as Page}
                onClick={() => setActivePage('activity_logs' as Page)}
                />
                </>
            )}

            <NavItem
              icon={<SettingsIcon className="h-5 w-5" />}
              label={t('settings')}
              isActive={activePage === 'settings'}
              onClick={() => setActivePage('settings')}
            />
          </nav>
          <div className="mt-auto">
            <button
                onClick={logout}
                className="flex items-center w-full px-4 py-3 text-sm font-medium rounded-lg text-slate-600 dark:text-slate-300 hover:bg-slate-200 dark:hover:bg-slate-700"
            >
                <LogOutIcon className="h-5 w-5" />
                <span className="ml-3">{t('logout')}</span>
            </button>
          </div>
        </aside>
    </>
  );
};

export default Sidebar;
