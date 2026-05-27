
import React, { useState, useContext, useEffect, useMemo } from 'react';
import { DataContext, LanguageContext } from '../App';
import { SystemUser, UserRole, Sale } from '../types';
import Pagination from './Pagination';
import { useNotification } from './Notification';
import ConfirmModal from './ConfirmModal';
import { ShieldIcon, EditIcon, TrashIcon, ShoppingCartIcon, ListIcon } from './icons';

const UserForm: React.FC<{
  user?: SystemUser;
  onSave: (user: any) => void;
  onCancel: () => void;
}> = ({ user, onSave, onCancel }) => {
  const { t } = useContext(LanguageContext);
  const [formData, setFormData] = useState({
    name: user?.name || '',
    email: user?.email || '',
    phone: user?.phone || '',
    role: user?.role || 'salesperson',
    password: '',
    isActive: user ? user.isActive : true,
  });
  const [errors, setErrors] = useState<Record<string, string>>({});

  const validate = () => {
    const newErrors: Record<string, string> = {};
    if (!formData.name.trim()) newErrors.name = t('nameRequired');
    if (!formData.email.trim()) {
        newErrors.email = t('emailRequired');
    } else if (!/\S+@\S+\.\S+/.test(formData.email)) {
        newErrors.email = t('emailInvalid');
    }
    
    // Password required only for new users
    if (!user && !formData.password) {
        newErrors.password = t('passwordRequiredNewUser');
    }
    if (!user && formData.password.length < 6) {
        newErrors.password = t('passwordMinLength');
    }

    setErrors(newErrors);
    return Object.keys(newErrors).length === 0;
  }

  const handleChange = (e: React.ChangeEvent<HTMLInputElement | HTMLSelectElement>) => {
    const { name, value, type } = e.target;
    const val = type === 'checkbox' ? (e.target as HTMLInputElement).checked : value;
    setFormData(prev => ({ ...prev, [name]: val }));
  };

  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    if (!validate()) return;
    
    if (user) {
      // For updates, we don't send password in this simple form (usually handled by a specific reset flow)
      const { password, ...updateData } = formData;
      onSave({ ...user, ...updateData });
    } else {
      onSave(formData);
    }
  };

  return (
    <div className="fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center z-50 p-4">
      <div className="bg-white dark:bg-slate-800 rounded-lg p-8 w-full max-w-md">
        <h2 className="text-2xl font-bold mb-6">{user ? t('editUser') : t('addUser')}</h2>
        <form onSubmit={handleSubmit} className="space-y-4">
          <div>
            <label htmlFor="name" className="block text-sm font-medium">{t('name')}</label>
            <input type="text" name="name" id="name" value={formData.name} onChange={handleChange} required className="mt-1 block w-full rounded-md bg-slate-100 dark:bg-slate-700 border-transparent focus:border-primary-500 focus:bg-white dark:focus:bg-slate-600 focus:ring-0 text-slate-900 dark:text-white" />
            {errors.name && <p className="text-red-500 text-xs mt-1">{errors.name}</p>}
          </div>
          <div>
            <label htmlFor="email" className="block text-sm font-medium">{t('email')}</label>
            <input type="email" name="email" id="email" value={formData.email} onChange={handleChange} required disabled={!!user} className="mt-1 block w-full rounded-md bg-slate-100 dark:bg-slate-700 border-transparent focus:border-primary-500 focus:bg-white dark:focus:bg-slate-600 focus:ring-0 text-slate-900 dark:text-white disabled:opacity-50" />
            {errors.email && <p className="text-red-500 text-xs mt-1">{errors.email}</p>}
          </div>
          {!user && (
              <div>
                <label htmlFor="password" className="block text-sm font-medium">{t('passwordPlaceholder')}</label>
                <input type="password" name="password" id="password" value={formData.password} onChange={handleChange} required className="mt-1 block w-full rounded-md bg-slate-100 dark:bg-slate-700 border-transparent focus:border-primary-500 focus:bg-white dark:focus:bg-slate-600 focus:ring-0 text-slate-900 dark:text-white" />
                {errors.password && <p className="text-red-500 text-xs mt-1">{errors.password}</p>}
              </div>
          )}
          <div>
            <label htmlFor="phone" className="block text-sm font-medium">{t('phone')}</label>
            <input type="tel" name="phone" id="phone" value={formData.phone} onChange={handleChange} className="mt-1 block w-full rounded-md bg-slate-100 dark:bg-slate-700 border-transparent focus:border-primary-500 focus:bg-white dark:focus:bg-slate-600 focus:ring-0 text-slate-900 dark:text-white" />
          </div>
          <div>
            <label htmlFor="role" className="block text-sm font-medium">{t('role')}</label>
            <select name="role" id="role" value={formData.role} onChange={handleChange} className="mt-1 block w-full rounded-md bg-slate-100 dark:bg-slate-700 border-transparent focus:border-primary-500 focus:bg-white dark:focus:bg-slate-600 focus:ring-0 text-slate-900 dark:text-white">
                <option value="admin">{t('admin')}</option>
                <option value="salesperson">{t('salesperson')}</option>
                <option value="stock_clerk">{t('stock_clerk')}</option>
            </select>
          </div>
          {user && (
             <div className="flex items-center mt-2">
                <input
                    id="isActive"
                    name="isActive"
                    type="checkbox"
                    checked={formData.isActive}
                    onChange={handleChange}
                    className="h-4 w-4 text-primary-600 focus:ring-primary-500 border-gray-300 rounded"
                />
                <label htmlFor="isActive" className="ml-2 block text-sm text-slate-900 dark:text-slate-300">
                    {t('activeAccount')}
                </label>
            </div>
          )}

          <div className="flex justify-end gap-4 pt-4">
            <button type="button" onClick={onCancel} className="px-4 py-2 rounded-md bg-slate-200 dark:bg-slate-600 hover:bg-slate-300 dark:hover:bg-slate-500">{t('cancel')}</button>
            <button type="submit" className="px-4 py-2 rounded-md bg-primary-600 text-white hover:bg-primary-700">{t('save')}</button>
          </div>
        </form>
      </div>
    </div>
  );
};

const UserSalesHistoryModal: React.FC<{
  user: SystemUser;
  sales: Sale[];
  onClose: () => void;
}> = ({ user, sales, onClose }) => {
  const { t } = useContext(LanguageContext);
  const [sortBy, setSortBy] = useState<'date_desc' | 'date_asc' | 'total_desc' | 'total_asc'>('date_desc');
  const [filterPayment, setFilterPayment] = useState<string>('');
  
  const userSales = useMemo(() => {
    let filtered = sales.filter(sale => sale.sellerId === user.id && sale.status === 'completed');
    
    if (filterPayment) {
      filtered = filtered.filter(sale => sale.paymentMethod === filterPayment);
    }

    return filtered.sort((a, b) => {
      if (sortBy === 'date_desc') return new Date(b.date).getTime() - new Date(a.date).getTime();
      if (sortBy === 'date_asc') return new Date(a.date).getTime() - new Date(b.date).getTime();
      if (sortBy === 'total_desc') return b.total - a.total;
      if (sortBy === 'total_asc') return a.total - b.total;
      return 0;
    });
  }, [user, sales, sortBy, filterPayment]);

  const totalRevenue = useMemo(() => userSales.reduce((acc, curr) => acc + curr.total, 0), [userSales]);
  const totalSalesCount = userSales.length;

  return (
    <div className="fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center z-50 p-4">
      <div className="bg-white dark:bg-slate-800 rounded-lg p-8 w-full max-w-4xl relative">
        <h2 className="text-2xl font-bold mb-2">{t('salesHistory')} - {user.name}</h2>
        <p className="text-md font-medium mb-6 text-slate-500 dark:text-slate-400">{t('totalSales' as any) || 'Ventas Totales'}: {totalSalesCount} (${totalRevenue.toFixed(2)})</p>
        
        <div className="flex flex-wrap gap-4 mb-4">
          <select 
            value={filterPayment} 
            onChange={(e) => setFilterPayment(e.target.value)}
            className="p-2 rounded-md bg-slate-100 dark:bg-slate-700 border-transparent focus:border-primary-500 focus:bg-white dark:focus:bg-slate-600 focus:ring-0 text-slate-900 dark:text-white"
          >
            <option value="">{t('allMethods')}</option>
            <option value="Cash">{t('cash')}</option>
            <option value="Card">{t('card')}</option>
            <option value="Online">{t('online')}</option>
          </select>
          
          <select 
            value={sortBy} 
            onChange={(e) => setSortBy(e.target.value as any)}
            className="p-2 rounded-md bg-slate-100 dark:bg-slate-700 border-transparent focus:border-primary-500 focus:bg-white dark:focus:bg-slate-600 focus:ring-0 text-slate-900 dark:text-white"
          >
            <option value="date_desc">{t('date')} ({t('newest')})</option>
            <option value="date_asc">{t('date')} ({t('oldest')})</option>
            <option value="total_desc">{t('total')} ({t('highest')})</option>
            <option value="total_asc">{t('total')} ({t('lowest')})</option>
          </select>
        </div>

        <div className="max-h-[60vh] overflow-y-auto">
          <table className="w-full text-sm text-left">
            <thead className="text-xs text-slate-700 uppercase bg-slate-50 dark:bg-slate-700 dark:text-slate-300 sticky top-0">
              <tr>
                <th className="px-4 py-2">{t('date')}</th>
                <th className="px-4 py-2">{t('client')}</th>
                <th className="px-4 py-2">{t('paymentMethod')}</th>
                <th className="px-4 py-2 text-right">{t('total')}</th>
              </tr>
            </thead>
            <tbody>
              {userSales.length > 0 ? (
                userSales.map(sale => (
                  <tr key={sale.id} className="border-b dark:border-slate-700 text-slate-800 dark:text-slate-300">
                    <td className="px-4 py-2">{new Date(sale.date).toLocaleString()}</td>
                    <td className="px-4 py-2 font-medium">{sale.clientName || t('walkInClient')}</td>
                    <td className="px-4 py-2">{t(sale.paymentMethod.toLowerCase() as any) || sale.paymentMethod}</td>
                    <td className="px-4 py-2 font-bold text-slate-900 dark:text-white text-right">${sale.total.toFixed(2)}</td>
                  </tr>
                ))
              ) : (
                <tr>
                  <td colSpan={4} className="text-center py-8 text-slate-500">
                    {t('noSalesData')}
                  </td>
                </tr>
              )}
            </tbody>
          </table>
        </div>
        <div className="flex justify-end pt-6 mt-4 border-t dark:border-slate-700">
          <button onClick={onClose} className="px-4 py-2 rounded-md bg-primary-600 text-white hover:bg-primary-700">{t('close')}</button>
        </div>
      </div>
    </div>
  );
};

const UserLoginLogsModal: React.FC<{
  user: SystemUser;
  onClose: () => void;
}> = ({ user, onClose }) => {
  const { t } = useContext(LanguageContext);
  
  const loginLogs = user.loginLogs ? [...user.loginLogs].reverse() : [];

  const calculateDuration = (login: string, logout?: string) => {
    const start = new Date(login).getTime();
    const end = logout ? new Date(logout).getTime() : new Date().getTime();
    const diff = end - start;
    
    const hours = Math.floor(diff / (1000 * 60 * 60));
    const minutes = Math.floor((diff % (1000 * 60 * 60)) / (1000 * 60));
    
    if (hours > 0) {
        return `${hours}h ${minutes}m`;
    }
    return `${minutes}m`;
  };

  return (
    <div className="fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center z-50 p-4">
      <div className="bg-white dark:bg-slate-800 rounded-lg p-8 w-full max-w-3xl relative">
        <h2 className="text-2xl font-bold mb-6">{t('loginLogs' as any) || 'Logs de Conexión'} - {user.name}</h2>
        <div className="max-h-[60vh] overflow-y-auto">
          <table className="w-full text-sm text-left">
            <thead className="text-xs text-slate-700 uppercase bg-slate-50 dark:bg-slate-700 dark:text-slate-300 sticky top-0">
              <tr>
                <th className="px-4 py-2">{t('loginTime' as any) || 'Inicio de Sesión'}</th>
                <th className="px-4 py-2">{t('logoutTime' as any) || 'Fin de Sesión'}</th>
                <th className="px-4 py-2">{t('duration' as any) || 'Tiempo Online'}</th>
                <th className="px-4 py-2">{t('status')}</th>
              </tr>
            </thead>
            <tbody>
              {loginLogs.length > 0 ? (
                loginLogs.map((log, index) => (
                  <tr key={index} className="border-b dark:border-slate-700 text-slate-800 dark:text-slate-300">
                    <td className="px-4 py-2">{new Date(log.loginTime).toLocaleString()}</td>
                    <td className="px-4 py-2">{log.logoutTime ? new Date(log.logoutTime).toLocaleString() : '-'}</td>
                    <td className="px-4 py-2">{calculateDuration(log.loginTime, log.logoutTime)}</td>
                    <td className="px-4 py-2">
                        {!log.logoutTime ? (
                            <span className="text-green-600 dark:text-green-400 font-semibold">{t('online' as any) || 'Online'}</span>
                        ) : (
                            <span className="text-slate-500">{t('offline' as any) || 'Offline'}</span>
                        )}
                    </td>
                  </tr>
                ))
              ) : (
                <tr>
                  <td colSpan={4} className="text-center py-8 text-slate-500">
                    {t('noData' as any) || 'No hay datos'}
                  </td>
                </tr>
              )}
            </tbody>
          </table>
        </div>
        <div className="flex justify-end pt-6 mt-4 border-t dark:border-slate-700">
          <button onClick={onClose} className="px-4 py-2 rounded-md bg-primary-600 text-white hover:bg-primary-700">{t('close')}</button>
        </div>
      </div>
    </div>
  );
};

const Users: React.FC = () => {
  const { users, sales, addUser, updateUser, deleteUser } = useContext(DataContext);
  const { t } = useContext(LanguageContext);
  const addNotification = useNotification();
  const [isModalOpen, setIsModalOpen] = useState(false);
  const [editingUser, setEditingUser] = useState<SystemUser | undefined>(undefined);
  const [confirmDeleteUser, setConfirmDeleteUser] = useState<SystemUser | null>(null);
  const [viewingSalesFor, setViewingSalesFor] = useState<SystemUser | null>(null);
  const [viewingLogsFor, setViewingLogsFor] = useState<SystemUser | null>(null);
  const [searchTerm, setSearchTerm] = useState('');
  const [currentPage, setCurrentPage] = useState(1);
  const ITEMS_PER_PAGE = 10;

  const handleSave = async (userData: any) => {
    try {
        if (userData.id) {
            await updateUser(userData);
            addNotification(t('userUpdated'), 'success');
        } else {
            await addUser(userData);
            addNotification(t('userAdded'), 'success');
        }
        setIsModalOpen(false);
        setEditingUser(undefined);
    } catch (error) {
        console.error(error);
        addNotification(t('operationFailed'), 'error');
    }
  };
  
  const handleDelete = (user: SystemUser) => {
    deleteUser(user.id);
    addNotification(t('userDeleted').replace('{name}', user.name), 'success');
    setConfirmDeleteUser(null);
  }

  const getRoleBadge = (role: string) => {
    const roleName = t(role as any) || role;
    switch(role) {
        case 'admin':
            return <span className="bg-red-100 text-red-800 dark:bg-red-900 dark:text-red-200 text-xs font-medium px-2.5 py-0.5 rounded border border-red-400">{roleName}</span>
        case 'salesperson':
            return <span className="bg-blue-100 text-blue-800 dark:bg-blue-900 dark:text-blue-200 text-xs font-medium px-2.5 py-0.5 rounded border border-blue-400">{roleName}</span>
        case 'stock_clerk':
            return <span className="bg-purple-100 text-purple-800 dark:bg-purple-900 dark:text-purple-200 text-xs font-medium px-2.5 py-0.5 rounded border border-purple-400">{roleName}</span>
        default:
            return <span className="bg-gray-100 text-gray-800 dark:bg-gray-700 dark:text-gray-300 text-xs font-medium px-2.5 py-0.5 rounded border border-gray-500">{roleName}</span>
    }
  }

  const filteredUsers = users.filter(u =>
    u.name.toLowerCase().includes(searchTerm.toLowerCase()) ||
    u.email.toLowerCase().includes(searchTerm.toLowerCase())
  ).sort((a, b) => a.name.localeCompare(b.name));

  useEffect(() => {
    setCurrentPage(1);
  }, [searchTerm]);

  const totalPages = Math.ceil(filteredUsers.length / ITEMS_PER_PAGE);
  const paginatedUsers = filteredUsers.slice(
    (currentPage - 1) * ITEMS_PER_PAGE,
    currentPage * ITEMS_PER_PAGE
  );

  return (
    <div>
      {isModalOpen && <UserForm onSave={handleSave} onCancel={() => { setIsModalOpen(false); setEditingUser(undefined); }} user={editingUser} />}
      {viewingSalesFor && <UserSalesHistoryModal user={viewingSalesFor} sales={sales} onClose={() => setViewingSalesFor(null)} />}
      {viewingLogsFor && <UserLoginLogsModal user={viewingLogsFor} onClose={() => setViewingLogsFor(null)} />}
      <ConfirmModal
        isOpen={!!confirmDeleteUser}
        onClose={() => setConfirmDeleteUser(null)}
        onConfirm={() => confirmDeleteUser && handleDelete(confirmDeleteUser)}
        title={t('confirmDelete')}
        message={t('confirmDeleteUserMessage').replace('{name}', confirmDeleteUser?.name || '')}
      />
      
      <div className="flex justify-between items-center mb-6">
        <div className="flex items-center gap-3">
             <ShieldIcon className="w-8 h-8 text-primary-600 dark:text-primary-400"/>
             <h1 className="text-3xl font-bold">{t('systemUsers')}</h1>
        </div>
        <button onClick={() => { setEditingUser(undefined); setIsModalOpen(true); }} className="px-4 py-2 rounded-md bg-primary-600 text-white hover:bg-primary-700">{t('addUser')}</button>
      </div>
       <div className="mb-4">
            <input 
                type="text"
                placeholder={t('searchPlaceholder')}
                value={searchTerm}
                onChange={(e) => setSearchTerm(e.target.value)}
                className="w-full p-2 rounded-md bg-white dark:bg-slate-800 border border-slate-300 dark:border-slate-600 text-slate-900 dark:text-white"
            />
        </div>
      <div className="bg-white dark:bg-slate-800 rounded-xl shadow-lg overflow-hidden">
        <div className="overflow-x-auto min-h-[570px]">
          <table className="responsive-table w-full text-sm text-left text-slate-500 dark:text-slate-400">
            <thead className="text-xs text-slate-700 uppercase bg-slate-50 dark:bg-slate-700 dark:text-slate-300">
              <tr>
                <th className="px-6 py-3">{t('name')}</th>
                <th className="px-6 py-3">{t('email')}</th>
                <th className="px-6 py-3">{t('role')}</th>
                <th className="px-6 py-3">{t('status')}</th>
                <th className="px-6 py-3">{t('date')}</th>
                <th className="px-6 py-3">{t('actions')}</th>
              </tr>
            </thead>
            <tbody>
              {paginatedUsers.map(user => (
                <tr key={user.id} className="border-b dark:border-slate-700 hover:bg-slate-50 dark:hover:bg-slate-600">
                  <td className="px-6 py-4 font-medium text-slate-900 dark:text-white">{user.name}</td>
                  <td className="px-6 py-4">{user.email}</td>
                  <td className="px-6 py-4">{getRoleBadge(user.role)}</td>
                  <td className="px-6 py-4">
                      {user.isActive ? 
                        <span className="text-green-600 dark:text-green-400 font-semibold flex items-center gap-1"><span className="w-2 h-2 rounded-full bg-green-500"></span> {t('active')}</span> : 
                        <span className="text-slate-500 font-semibold flex items-center gap-1"><span className="w-2 h-2 rounded-full bg-slate-400"></span> {t('inactive')}</span>
                      }
                  </td>
                  <td className="px-6 py-4 text-xs">{new Date(user.createdAt).toLocaleDateString()}</td>
                  <td className="px-6 py-4 flex gap-4">
                    <button onClick={() => setViewingLogsFor(user)} title={t('loginLogs' as any) || 'Logs de Conexión'} className="font-medium text-blue-600 hover:text-blue-800 dark:text-blue-400 dark:hover:text-blue-200">
                      <ListIcon className="w-5 h-5" />
                    </button>
                    <button onClick={() => setViewingSalesFor(user)} title={t('salesHistory')} className="font-medium text-green-600 hover:text-green-800 dark:text-green-400 dark:hover:text-green-200">
                      <ShoppingCartIcon className="w-5 h-5" />
                    </button>
                    <button onClick={() => { setEditingUser(user); setIsModalOpen(true); }} title={t('edit')} className="font-medium text-primary-600 hover:text-primary-800 dark:text-primary-400 dark:hover:text-primary-200">
                      <EditIcon className="w-5 h-5" />
                    </button>
                    <button onClick={() => setConfirmDeleteUser(user)} title={t('delete')} className="font-medium text-red-600 hover:text-red-800 dark:text-red-400 dark:hover:text-red-200">
                      <TrashIcon className="w-5 h-5" />
                    </button>
                  </td>
                </tr>
              ))}
            </tbody>
          </table>
            {filteredUsers.length === 0 && (
                <div className="flex items-center justify-center h-96 text-slate-500 dark:text-slate-400">
                    {t('noUsersFound')}
                </div>
            )}
        </div>
        <Pagination
            currentPage={currentPage}
            totalPages={totalPages}
            onPageChange={setCurrentPage}
            totalItems={filteredUsers.length}
            itemsPerPage={ITEMS_PER_PAGE}
        />
      </div>
    </div>
  );
};

export default Users;
