
import React, { createContext, useContext, useState, useCallback, ReactNode } from 'react';
import { Notification as NotificationType } from '../types';
import { CheckCircleIcon, XCircleIcon, XIcon, TriangleAlertIcon } from './icons';

type NotificationContextType = (message: string, type: 'success' | 'error' | 'warning') => void;

const NotificationContext = createContext<NotificationContextType>(() => {});

export const useNotification = () => useContext(NotificationContext);

export const NotificationProvider: React.FC<{ children: ReactNode }> = ({ children }) => {
  const [notifications, setNotifications] = useState<NotificationType[]>([]);

  const addNotification = useCallback((message: string, type: 'success' | 'error' | 'warning') => {
    const id = crypto.randomUUID();
    setNotifications(prev => [...prev, { id, message, type }]);
    setTimeout(() => {
      removeNotification(id);
    }, 5000);
  }, []);

  const removeNotification = (id: string) => {
    setNotifications(prev => prev.filter(n => n.id !== id));
  };

  return (
    <NotificationContext.Provider value={addNotification}>
      {children}
      <NotificationContainer notifications={notifications} removeNotification={removeNotification} />
    </NotificationContext.Provider>
  );
};

interface NotificationContainerProps {
  notifications: NotificationType[];
  removeNotification: (id: string) => void;
}

export const NotificationContainer: React.FC<NotificationContainerProps> = ({ notifications, removeNotification }) => {
  return (
    <div className="fixed top-5 right-5 z-50 space-y-3 w-80">
      {notifications.map(notification => (
        <Notification key={notification.id} notification={notification} onClose={() => removeNotification(notification.id)} />
      ))}
    </div>
  );
};


const Notification: React.FC<{ notification: NotificationType; onClose: () => void; }> = ({ notification, onClose }) => {
    let Icon;
    let iconColor;

    switch (notification.type) {
        case 'success':
            Icon = CheckCircleIcon;
            iconColor = 'text-green-500';
            break;
        case 'warning':
            Icon = TriangleAlertIcon;
            iconColor = 'text-amber-500';
            break;
        case 'error':
        default:
            Icon = XCircleIcon;
            iconColor = 'text-red-500';
            break;
    }
    
    return (
        <div className="bg-white dark:bg-slate-800 shadow-lg rounded-lg pointer-events-auto ring-1 ring-black ring-opacity-5 overflow-hidden animate-fade-in-right">
            <div className="p-4">
                <div className="flex items-start">
                    <div className="flex-shrink-0">
                        <Icon className={`h-6 w-6 ${iconColor}`} aria-hidden="true" />
                    </div>
                    <div className="ml-3 w-0 flex-1 pt-0.5">
                        <p className="text-sm font-medium text-slate-900 dark:text-slate-100">{notification.message}</p>
                    </div>
                    <div className="ml-4 flex-shrink-0 flex">
                        <button
                            onClick={onClose}
                            className="bg-white dark:bg-slate-800 rounded-md inline-flex text-slate-400 hover:text-slate-500 focus:outline-none focus:ring-2 focus:ring-offset-2 focus:ring-primary-500 dark:focus:ring-offset-slate-800"
                        >
                            <span className="sr-only">Close</span>
                            <XIcon className="h-5 w-5" aria-hidden="true" />
                        </button>
                    </div>
                </div>
            </div>
            <style>{`
                @keyframes fade-in-right {
                    from {
                        opacity: 0;
                        transform: translateX(100%);
                    }
                    to {
                        opacity: 1;
                        transform: translateX(0);
                    }
                }
                .animate-fade-in-right {
                    animation: fade-in-right 0.3s ease-out forwards;
                }
            `}</style>
        </div>
    );
};
