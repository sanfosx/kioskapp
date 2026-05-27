import React, { useState, useEffect, useContext, useCallback } from 'react';
import { ActivityLog } from '../types';
import { LanguageContext, DataContext } from '../App';

export const ActivityLogs: React.FC = () => {
    const { t } = useContext(LanguageContext);
    const { users, apiRequest } = useContext(DataContext);
    const [logs, setLogs] = useState<ActivityLog[]>([]);
    const [loading, setLoading] = useState(true);

    const loadLogs = useCallback(async () => {
        try {
            const data = await apiRequest<ActivityLog[]>('/api/activity_logs?limit=100', 'GET');
            setLogs(data || []);
        } catch (error) {
            console.error("Error fetching logs:", error);
        } finally {
            setLoading(false);
        }
    }, [apiRequest]);

    useEffect(() => {
        loadLogs();
        const interval = setInterval(loadLogs, 15000);
        return () => clearInterval(interval);
    }, [loadLogs]);

    const getTypeColor = (type: string) => {
        switch(type) {
            case 'price_change': return 'text-purple-600 bg-purple-100 dark:bg-purple-900 dark:text-purple-200';
            case 'stock_adjustment': return 'text-amber-600 bg-amber-100 dark:bg-amber-900 dark:text-amber-200';
            case 'sale_cancellation': return 'text-red-600 bg-red-100 dark:bg-red-900 dark:text-red-200';
            default: return 'text-slate-600 bg-slate-100 dark:bg-slate-700 dark:text-slate-200';
        }
    };

    const getTypeLabel = (type: string) => {
        switch(type) {
            case 'price_change': return t('priceChange' as any) || 'Price Change';
            case 'stock_adjustment': return t('stockAdjustment' as any) || 'Stock Manual Adjustment';
            case 'sale_cancellation': return t('saleCancellation' as any) || 'Sale Cancellation';
            default: return type;
        }
    };

    return (
        <div className="bg-white dark:bg-slate-800 rounded-xl shadow-sm border border-slate-200 dark:border-slate-700 overflow-hidden mt-6">
            <div className="p-4 sm:p-6 border-b border-slate-200 dark:border-slate-700 bg-slate-50 dark:bg-slate-800">
                <h2 className="text-xl font-bold text-slate-800 dark:text-white flex items-center gap-2">
                    {t('activityLogs' as any) || 'Activity Logs'}
                </h2>
                <p className="text-sm text-slate-500 dark:text-slate-400 mt-1">
                    {t('activityLogsDesc' as any) || 'Recent sensitive administrative actions'}
                </p>
            </div>
            <div className="overflow-x-auto min-h-[400px]">
                {loading ? (
                    <div className="p-8 text-center text-slate-500">{t('loading')}</div>
                ) : logs.length === 0 ? (
                    <div className="p-8 text-center text-slate-500">
                        {t('noLogs' as any) || 'No recent activity logs.'}
                    </div>
                ) : (
                    <table className="responsive-table w-full text-sm text-left">
                        <thead className="text-xs text-slate-700 uppercase bg-slate-50 dark:bg-slate-700 dark:text-slate-300">
                            <tr>
                                <th className="px-6 py-3">{t('date')}</th>
                                <th className="px-6 py-3">{t('user')}</th>
                                <th className="px-6 py-3">{t('action') as any || 'Action'}</th>
                                <th className="px-6 py-3">{t('description')}</th>
                            </tr>
                        </thead>
                        <tbody>
                            {logs.map(log => (
                                <tr key={log.id} className="border-b dark:border-slate-700 hover:bg-slate-50 dark:hover:bg-slate-700">
                                    <td className="px-6 py-4 whitespace-nowrap text-slate-600 dark:text-slate-400">
                                        {new Date(log.date).toLocaleString()}
                                    </td>
                                    <td className="px-6 py-4 font-medium text-slate-900 dark:text-slate-100">
                                        {log.userName || users.find(u => u.id === log.userId)?.name || log.userId}
                                    </td>
                                    <td className="px-6 py-4">
                                        <span className={`px-2 py-1 rounded text-xs font-medium uppercase tracking-wider ${getTypeColor(log.actionType)}`}>
                                            {getTypeLabel(log.actionType)}
                                        </span>
                                    </td>
                                    <td className="px-6 py-4 text-slate-700 dark:text-slate-300">
                                        {log.description}
                                    </td>
                                </tr>
                            ))}
                        </tbody>
                    </table>
                )}
            </div>
        </div>
    );
};
