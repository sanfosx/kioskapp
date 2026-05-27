
import React, { useState, useContext, useEffect, useMemo } from 'react';
import { DataContext, AuthContext, LanguageContext } from '../App';
import { Client, Sale } from '../types';
import Pagination from './Pagination';
import { useNotification } from './Notification';
import ConfirmModal from './ConfirmModal';
import { EditIcon, TrashIcon, HistoryIcon } from './icons';

const ClientForm: React.FC<{
  client?: Client;
  onSave: (client: Omit<Client, 'id'> | Client) => void;
  onCancel: () => void;
}> = ({ client, onSave, onCancel }) => {
  const { t } = useContext(LanguageContext);
  const [formData, setFormData] = useState({
    name: client?.name || '',
    email: client?.email || '',
    phone: client?.phone || '',
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
    if (!formData.phone.trim()) newErrors.phone = t('phoneRequired');
    
    setErrors(newErrors);
    return Object.keys(newErrors).length === 0;
  }

  const handleChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    const { name, value } = e.target;
    setFormData(prev => ({ ...prev, [name]: value }));
  };

  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    if (!validate()) return;
    
    if (client) {
      onSave({ ...client, ...formData });
    } else {
      onSave(formData);
    }
  };

  return (
    <div className="fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center z-50 p-4">
      <div className="bg-white dark:bg-slate-800 rounded-lg p-8 w-full max-w-md">
        <h2 className="text-2xl font-bold mb-6">{client ? t('editClient') : t('addClient')}</h2>
        <form onSubmit={handleSubmit} className="space-y-4">
          <div>
            <label htmlFor="name" className="block text-sm font-medium">{t('name')}</label>
            <input type="text" name="name" id="name" value={formData.name} onChange={handleChange} required className="mt-1 block w-full rounded-md bg-slate-100 dark:bg-slate-700 border-transparent focus:border-primary-500 focus:bg-white dark:focus:bg-slate-600 focus:ring-0 text-slate-900 dark:text-white" />
            {errors.name && <p className="text-red-500 text-xs mt-1">{errors.name}</p>}
          </div>
          <div>
            <label htmlFor="email" className="block text-sm font-medium">{t('email')}</label>
            <input type="email" name="email" id="email" value={formData.email} onChange={handleChange} required className="mt-1 block w-full rounded-md bg-slate-100 dark:bg-slate-700 border-transparent focus:border-primary-500 focus:bg-white dark:focus:bg-slate-600 focus:ring-0 text-slate-900 dark:text-white" />
            {errors.email && <p className="text-red-500 text-xs mt-1">{errors.email}</p>}
          </div>
          <div>
            <label htmlFor="phone" className="block text-sm font-medium">{t('phone')}</label>
            <input type="tel" name="phone" id="phone" value={formData.phone} onChange={handleChange} required className="mt-1 block w-full rounded-md bg-slate-100 dark:bg-slate-700 border-transparent focus:border-primary-500 focus:bg-white dark:focus:bg-slate-600 focus:ring-0 text-slate-900 dark:text-white" />
            {errors.phone && <p className="text-red-500 text-xs mt-1">{errors.phone}</p>}
          </div>
          <div className="flex justify-end gap-4 pt-4">
            <button type="button" onClick={onCancel} className="px-4 py-2 rounded-md bg-slate-200 dark:bg-slate-600 hover:bg-slate-300 dark:hover:bg-slate-500">{t('cancel')}</button>
            <button type="submit" className="px-4 py-2 rounded-md bg-primary-600 text-white hover:bg-primary-700">{t('save')}</button>
          </div>
        </form>
      </div>
    </div>
  );
};

const ClientSalesHistoryModal: React.FC<{
  client: Client;
  sales: Sale[];
  onClose: () => void;
}> = ({ client, sales, onClose }) => {
  const { t } = useContext(LanguageContext);
  const [sortBy, setSortBy] = useState<'date_desc' | 'date_asc' | 'total_desc' | 'total_asc'>('date_desc');
  const [filterPayment, setFilterPayment] = useState<string>('');

  const clientSales = useMemo(() => {
    let filtered = sales.filter(sale => sale.clientId === client.id);
    
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
  }, [client, sales, sortBy, filterPayment]);

  const totalAccumulated = useMemo(() => {
    return clientSales.reduce((sum, sale) => sum + (sale.total || 0), 0);
  }, [clientSales]);

  return (
    <div className="fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center z-50 p-4">
      <div className="bg-white dark:bg-slate-800 rounded-lg p-8 w-full max-w-4xl relative">
        <h2 className="text-2xl font-bold mb-2">{t('purchaseHistory')}</h2>
        <p className="text-lg font-semibold mb-6 text-slate-600 dark:text-slate-300">
          {client.name} <span className="text-sm font-normal text-slate-500 dark:text-slate-400 ml-2">({t('totalSpent')}: ${totalAccumulated.toFixed(2)})</span>
        </p>
        
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
                <th className="px-4 py-2">{t('saleId')}</th>
                <th className="px-4 py-2">{t('products')}</th>
                <th className="px-4 py-2">{t('paymentMethod')}</th>
                <th className="px-4 py-2">{t('total')}</th>
              </tr>
            </thead>
            <tbody>
              {clientSales.length > 0 ? (
                clientSales.map(sale => (
                  <tr key={sale.id} className="border-b dark:border-slate-700 text-slate-800 dark:text-slate-300">
                    <td className="px-4 py-2">{new Date(sale.date).toLocaleString()}</td>
                    <td className="px-4 py-2 font-mono text-xs">{sale.id.slice(0, 8)}...</td>
                    <td className="px-4 py-2">{(sale.items || []).map(i => `${i.name} (x${i.quantity})`).join(', ')}</td>
                    <td className="px-4 py-2">{t(sale.paymentMethod.toLowerCase() as any)}</td>
                    <td className="px-4 py-2 font-bold text-slate-900 dark:text-white">${sale.total.toFixed(2)}</td>
                  </tr>
                ))
              ) : (
                <tr>
                  <td colSpan={5} className="text-center py-8 text-slate-500">
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

const Clients: React.FC = () => {
  const { clients, sales, addClient, updateClient, deleteClient } = useContext(DataContext);
  const { currentUser } = useContext(AuthContext);
  const { t } = useContext(LanguageContext);
  const addNotification = useNotification();
  const [isModalOpen, setIsModalOpen] = useState(false);
  const [editingClient, setEditingClient] = useState<Client | undefined>(undefined);
  const [confirmDeleteClient, setConfirmDeleteClient] = useState<Client | null>(null);
  const [viewingHistoryFor, setViewingHistoryFor] = useState<Client | null>(null);
  const [searchTerm, setSearchTerm] = useState('');
  const [currentPage, setCurrentPage] = useState(1);
  const ITEMS_PER_PAGE = 10;
  
  const role = currentUser?.role || 'salesperson';
  const canEdit = role === 'admin'; 

  const clientTotalSpentMap = useMemo(() => {
    const map = new Map<string, number>();
    sales.forEach(sale => {
        if (sale.clientId) {
            const currentTotal = map.get(sale.clientId) || 0;
            map.set(sale.clientId, currentTotal + sale.total);
        }
    });
    return map;
  }, [sales]);

  const handleSave = (client: Omit<Client, 'id'> | Client) => {
    if ('id' in client) {
      updateClient(client);
      addNotification(t('clientUpdated'), 'success');
    } else {
      addClient(client);
      addNotification(t('clientAdded'), 'success');
    }
    setIsModalOpen(false);
    setEditingClient(undefined);
  };
  
  const handleDelete = (client: Client) => {
    deleteClient(client.id);
    addNotification(t('clientDeleted').replace('{name}', client.name), 'success');
    setConfirmDeleteClient(null);
  }

  const filteredClients = clients.filter(c =>
    c.name.toLowerCase().includes(searchTerm.toLowerCase()) ||
    c.email.toLowerCase().includes(searchTerm.toLowerCase()) ||
    c.phone.includes(searchTerm)
  ).sort((a, b) => a.name.localeCompare(b.name));

  useEffect(() => {
    setCurrentPage(1);
  }, [searchTerm]);

  const totalPages = Math.ceil(filteredClients.length / ITEMS_PER_PAGE);
  const paginatedClients = filteredClients.slice(
    (currentPage - 1) * ITEMS_PER_PAGE,
    currentPage * ITEMS_PER_PAGE
  );

  return (
    <div>
      {isModalOpen && <ClientForm onSave={handleSave} onCancel={() => { setIsModalOpen(false); setEditingClient(undefined); }} client={editingClient} />}
      {viewingHistoryFor && <ClientSalesHistoryModal client={viewingHistoryFor} sales={sales} onClose={() => setViewingHistoryFor(null)} />}
      <ConfirmModal
        isOpen={!!confirmDeleteClient}
        onClose={() => setConfirmDeleteClient(null)}
        onConfirm={() => confirmDeleteClient && handleDelete(confirmDeleteClient)}
        title={t('confirmDelete')}
        message={t('confirmDeleteClientMessage').replace('{name}', confirmDeleteClient?.name || '')}
      />
      
      <div className="flex justify-between items-center mb-6">
        <h1 className="text-3xl font-bold">{t('clients')}</h1>
        {canEdit && (
            <button onClick={() => { setEditingClient(undefined); setIsModalOpen(true); }} className="px-4 py-2 rounded-md bg-primary-600 text-white hover:bg-primary-700">{t('addClient')}</button>
        )}
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
                <th className="px-6 py-3">{t('phone')}</th>
                <th className="px-6 py-3">{t('totalSpent')}</th>
                <th className="px-6 py-3">{t('actions')}</th>
              </tr>
            </thead>
            <tbody>
              {paginatedClients.map(client => {
                const totalSpent = clientTotalSpentMap.get(client.id) || 0;
                return (
                    <tr key={client.id} className="border-b dark:border-slate-700 hover:bg-slate-50 dark:hover:bg-slate-600">
                      <td className="px-6 py-4 font-medium text-slate-900 dark:text-white">{client.name}</td>
                      <td className="px-6 py-4">{client.email}</td>
                      <td className="px-6 py-4">{client.phone}</td>
                      <td className="px-6 py-4 font-bold text-slate-600 dark:text-slate-300">${totalSpent.toFixed(2)}</td>
                      <td className="px-6 py-4 flex gap-4">
                        <button onClick={() => setViewingHistoryFor(client)} title={t('history')} className="font-medium text-indigo-600 hover:text-indigo-800 dark:text-indigo-400 dark:hover:text-indigo-200">
                          <HistoryIcon className="w-5 h-5" />
                        </button>
                        {canEdit && (
                            <>
                            <button onClick={() => { setEditingClient(client); setIsModalOpen(true); }} title={t('edit')} className="font-medium text-primary-600 hover:text-primary-800 dark:text-primary-400 dark:hover:text-primary-200">
                              <EditIcon className="w-5 h-5" />
                            </button>
                            <button onClick={() => setConfirmDeleteClient(client)} title={t('delete')} className="font-medium text-red-600 hover:text-red-800 dark:text-red-400 dark:hover:text-red-200">
                              <TrashIcon className="w-5 h-5" />
                            </button>
                            </>
                        )}
                      </td>
                    </tr>
                );
              })}
            </tbody>
          </table>
            {filteredClients.length === 0 && (
                <div className="flex items-center justify-center h-96 text-slate-500 dark:text-slate-400">
                    {t('noClientsFound')}
                </div>
            )}
        </div>
        <Pagination
            currentPage={currentPage}
            totalPages={totalPages}
            onPageChange={setCurrentPage}
            totalItems={filteredClients.length}
            itemsPerPage={ITEMS_PER_PAGE}
        />
      </div>
    </div>
  );
};

export default Clients;
