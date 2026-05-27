
import React, { useState, useContext, useEffect, useRef } from 'react';
import { DataContext, AuthContext, LanguageContext } from '../App';
import { Category } from '../types';
import Pagination from './Pagination';
import { useNotification } from './Notification';
import ConfirmModal from './ConfirmModal';
import { UploadIcon, DownloadIcon, FileTextIcon, EditIcon, TrashIcon } from './icons';
import { Product, Sale } from '../types';
import { BulkPriceEditModal } from './BulkPriceEditModal';

const CategoryForm: React.FC<{
  category?: Category;
  onSave: (category: Omit<Category, 'id'> | Category) => void;
  onCancel: () => void;
}> = ({ category, onSave, onCancel }) => {
  const { t } = useContext(LanguageContext);
  const [name, setName] = useState(category?.name || '');
  const [error, setError] = useState('');

  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    if (!name.trim()) {
      setError(t('categoryNameRequired'));
      return;
    }
    
    if (category) {
      onSave({ ...category, name });
    } else {
      onSave({ name });
    }
  };

  return (
    <div className="fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center z-50 p-4">
      <div className="bg-white dark:bg-slate-800 rounded-lg p-8 w-full max-w-md">
        <h2 className="text-2xl font-bold mb-6">{category ? t('editCategory') : t('addCategory')}</h2>
        <form onSubmit={handleSubmit} className="space-y-4">
          <div>
            <label htmlFor="name" className="block text-sm font-medium">{t('categoryName')}</label>
            <input type="text" name="name" id="name" value={name} onChange={(e) => setName(e.target.value)} required className="mt-1 block w-full rounded-md bg-slate-100 dark:bg-slate-700 border-transparent focus:border-primary-500 focus:bg-white dark:focus:bg-slate-600 focus:ring-0 text-slate-900 dark:text-white" />
            {error && <p className="text-red-500 text-xs mt-1">{error}</p>}
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

const CategorySalesDetailsModal: React.FC<{
  category: Category;
  products: Product[];
  sales: Sale[];
  onClose: () => void;
}> = ({ category, products, sales, onClose }) => {
  const { t } = useContext(LanguageContext);
  
  const categoryProducts = products.filter(p => p.categoryId === category.id);
  const categoryProductIds = new Set(categoryProducts.map(p => p.id));
  
  // Aggregate sales per product
  const productSalesMap = new Map<string, { product: Product, quantity: number, revenue: number, profit: number }>();
  
  sales.forEach(sale => {
      if (sale.status === 'completed') {
          (sale.items || []).forEach(item => {
              if (categoryProductIds.has(item.productId)) {
                  const existing = productSalesMap.get(item.productId);
                  if (existing) {
                      existing.quantity += item.quantity;
                      existing.revenue += (item.price * item.quantity);
                      existing.profit += ((item.price - (existing.product.costPrice || 0)) * item.quantity);
                  } else {
                      const product = categoryProducts.find(p => p.id === item.productId);
                      if (product) {
                          productSalesMap.set(item.productId, {
                              product,
                              quantity: item.quantity,
                              revenue: item.price * item.quantity,
                              profit: (item.price - (product.costPrice || 0)) * item.quantity
                          });
                      }
                  }
              }
          });
      }
  });

  const aggregatedSales = Array.from(productSalesMap.values()).sort((a, b) => b.revenue - a.revenue);
  const totalQuantity = aggregatedSales.reduce((acc, curr) => acc + curr.quantity, 0);
  const totalRevenue = aggregatedSales.reduce((acc, curr) => acc + curr.revenue, 0);
  const totalProfit = aggregatedSales.reduce((acc, curr) => acc + curr.profit, 0);

  const downloadCSV = () => {
    const headers = [t('name'), t('quantity'), t('totalRevenue'), t('profits')];
    const rows = aggregatedSales.map(({ product, quantity, revenue, profit }) => [
      `"${product.name.replace(/"/g, '""')}"`,
      quantity,
      revenue.toFixed(2),
      profit.toFixed(2)
    ]);
    
    // Add summary row
    rows.push([
      `"${t('total' as any) || 'Total'}"`,
      totalQuantity,
      totalRevenue.toFixed(2),
      totalProfit.toFixed(2)
    ]);

    const csvContent = [headers.join(','), ...rows.map(row => row.join(','))].join('\n');
    const blob = new Blob([csvContent], { type: 'text/csv;charset=utf-8;' });
    const url = URL.createObjectURL(blob);
    const link = document.createElement('a');
    link.href = url;
    link.setAttribute('download', `report_${category.name.replace(/\s+/g, '_')}_${new Date().toISOString().split('T')[0]}.csv`);
    document.body.appendChild(link);
    link.click();
    document.body.removeChild(link);
  };

  return (
    <div className="fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center z-50 p-4">
      <div className="bg-white dark:bg-slate-800 rounded-lg p-8 w-full max-w-4xl relative">
        <h2 className="text-2xl font-bold mb-2">{t('salesHistory')} - {category.name}</h2>
        <p className="text-md font-medium mb-6 text-slate-500 dark:text-slate-400">{t('totalSold' as any)}: {totalQuantity} (${totalRevenue.toFixed(2)}) | {t('profits')}: <span className="text-green-600 dark:text-green-400">${totalProfit.toFixed(2)}</span></p>
        <div className="max-h-[60vh] overflow-y-auto">
          <table className="w-full text-sm text-left">
            <thead className="text-xs text-slate-700 uppercase bg-slate-50 dark:bg-slate-700 dark:text-slate-300 sticky top-0">
              <tr>
                <th className="px-4 py-2">{t('name')}</th>
                <th className="px-4 py-2 text-right">{t('quantity')}</th>
                <th className="px-4 py-2 text-right">{t('totalRevenue')}</th>
                <th className="px-4 py-2 text-right">{t('profits')}</th>
              </tr>
            </thead>
            <tbody>
              {aggregatedSales.length > 0 ? (
                aggregatedSales.map(({ product, quantity, revenue, profit }) => (
                  <tr key={product.id} className="border-b dark:border-slate-700 text-slate-800 dark:text-slate-300">
                    <td className="px-4 py-2 font-medium">{product.name}</td>
                    <td className="px-4 py-2 text-right">{quantity}</td>
                    <td className="px-4 py-2 font-bold text-slate-900 dark:text-white text-right">${revenue.toFixed(2)}</td>
                    <td className="px-4 py-2 font-bold text-green-600 dark:text-green-400 text-right">${profit.toFixed(2)}</td>
                  </tr>
                ))
              ) : (
                <tr>
                  <td colSpan={3} className="text-center py-8 text-slate-500">
                    {t('noSalesData')}
                  </td>
                </tr>
              )}
            </tbody>
          </table>
        </div>
        <div className="flex justify-between items-center pt-6 mt-4 border-t dark:border-slate-700">
          <button onClick={downloadCSV} className="flex items-center gap-2 px-4 py-2 rounded-md bg-slate-200 dark:bg-slate-700 text-slate-800 dark:text-slate-200 hover:bg-slate-300 dark:hover:bg-slate-600 transition-colors">
            <DownloadIcon className="w-4 h-4" />
            <span>{t('downloadReport' as any) || 'Descargar Reporte'}</span>
          </button>
          <button onClick={onClose} className="px-4 py-2 rounded-md bg-primary-600 text-white hover:bg-primary-700">{t('close')}</button>
        </div>
      </div>
    </div>
  );
};

const Categories: React.FC = () => {
  const { categories, products, sales, addCategory, updateCategory, deleteCategory } = useContext(DataContext);
  const { currentUser } = useContext(AuthContext);
  const { t } = useContext(LanguageContext);
  const addNotification = useNotification();
  const [isModalOpen, setIsModalOpen] = useState(false);
  const [editingCategory, setEditingCategory] = useState<Category | undefined>(undefined);
  const [confirmDeleteCategory, setConfirmDeleteCategory] = useState<Category | null>(null);
  const [viewingCategorySales, setViewingCategorySales] = useState<Category | null>(null);
  const [searchTerm, setSearchTerm] = useState('');
  const [sortBy, setSortBy] = useState<'name' | 'revenue' | 'profit'>('name');
  const [sortDesc, setSortDesc] = useState(false);
  const [currentPage, setCurrentPage] = useState(1);
  const [selectedCategoryIds, setSelectedCategoryIds] = useState<Set<string>>(new Set());
  const [isBulkEditModalOpen, setIsBulkEditModalOpen] = useState(false);
  const fileInputRef = useRef<HTMLInputElement>(null);
  const ITEMS_PER_PAGE = 10;
  
  const role = currentUser?.role || 'salesperson';
  const canEdit = role === 'admin' || role === 'stock_clerk';

  const handleSave = (category: Omit<Category, 'id'> | Category) => {
    if ('id' in category) {
      updateCategory(category);
      addNotification(t('categoryUpdated'), 'success');
    } else {
      addCategory(category);
      addNotification(t('categoryAdded'), 'success');
    }
    setIsModalOpen(false);
    setEditingCategory(undefined);
  };

  const handleDeleteRequest = (category: Category) => {
    const productsInCategory = products.filter(p => p.categoryId === category.id).length;
    if (productsInCategory > 0) {
        addNotification(`${t('categoryDeleteError')} ${productsInCategory} ${t('productsAssigned')}`, 'error');
        return;
    }
    setConfirmDeleteCategory(category);
  }
  
  const handleConfirmDelete = (category: Category) => {
    deleteCategory(category.id);
    addNotification(`${t('categoryDeleted')}`, 'success');
    setConfirmDeleteCategory(null);
  }

  // --- Export Functionality ---
  const handleExport = () => {
    const csvRows = ["name"]; // Header

    for (const category of categories) {
        const row = [`"${category.name.replace(/"/g, '""')}"`];
        csvRows.push(row.join(','));
    }

    const csvString = csvRows.join('\n');
    const blob = new Blob([csvString], { type: 'text/csv;charset=utf-8;' });
    const url = URL.createObjectURL(blob);
    const a = document.createElement('a');
    a.href = url;
    a.download = 'categories.csv';
    document.body.appendChild(a);
    a.click();
    document.body.removeChild(a);
    URL.revokeObjectURL(url);
    addNotification(t('exportCsv'), 'success');
  };

  // --- Import Functionality ---
  const handleImportClick = () => {
    fileInputRef.current?.click();
  };

  const processCSV = async (csvText: string) => {
    const lines = csvText.split(/\r\n|\n/);
    if(lines.length < 2) {
        addNotification(t('csvEmptyError'), 'error');
        return;
    }
    const headers = lines[0].split(',').map(h => h.trim().toLowerCase().replace(/^"|"$/g, ''));
    
    if (!headers.includes('name')) {
        addNotification(t('csvInvalidFormat'), 'error');
        return;
    }

    let addedCount = 0;
    let skippedCount = 0;
    const errors: string[] = [];

    for (let i = 1; i < lines.length; i++) {
        const line = lines[i];
        if (!line.trim()) continue;

        // Basic CSV parsing handling quotes
        const rowData = line.split(',').map(cell => cell.trim().replace(/^"|"$/g, ''));
        const nameIndex = headers.indexOf('name');
        const name = rowData[nameIndex];

        if (!name) {
             skippedCount++;
             continue;
        }

        // Check for duplicates
        const exists = categories.some(c => c.name.toLowerCase() === name.toLowerCase());
        if (exists) {
            skippedCount++;
            continue; 
        }

        try {
            await addCategory({ name });
            addedCount++;
        } catch (e) {
            errors.push(`Line ${i + 1}: Failed to save category "${name}".`);
            skippedCount++;
        }
    }
    
    let summary = `${addedCount} ${t('categoriesAdded')}`;
    if (skippedCount > 0) {
        summary += ` ${skippedCount} ${t('rowsSkipped')}`;
    }
    
    if (errors.length > 0) {
        console.error("CSV Import Errors:", errors);
        addNotification(summary + ' ' + t('importErrorsCheckConsole'), 'warning');
    } else {
        addNotification(summary, 'success');
    }
  };

  const handleFileImport = (event: React.ChangeEvent<HTMLInputElement>) => {
    const file = event.target.files?.[0];
    if (!file) return;

    const reader = new FileReader();
    reader.onload = (e) => {
        const text = e.target?.result as string;
        processCSV(text);
    };
    reader.onerror = () => {
        addNotification(t('fileReadError'), 'error');
    }
    reader.readAsText(file);
    
    if(event.target) {
      event.target.value = '';
    }
  };


  const categoriesWithStats = React.useMemo(() => {
    return categories.map(category => {
      const categoryProducts = products.filter(p => p.categoryId === category.id);
      const productCount = categoryProducts.length;
      const categoryProductIds = new Set(categoryProducts.map(p => p.id));
      
      let productsSold = 0;
      let revenue = 0;
      let profit = 0;
      
      sales.forEach(sale => {
          if (sale.status === 'completed') {
              (sale.items || []).forEach(item => {
                  if (categoryProductIds.has(item.productId)) {
                      const product = categoryProducts.find(p => p.id === item.productId);
                      const cost = product?.costPrice || 0;
                      productsSold += item.quantity;
                      revenue += (item.price * item.quantity);
                      profit += ((item.price - cost) * item.quantity);
                  }
              });
          }
      });
      
      return {
          ...category,
          productCount,
          productsSold,
          revenue,
          profit
      };
    });
  }, [categories, products, sales]);

  const filteredAndSortedCategories = React.useMemo(() => {
    let result = categoriesWithStats.filter(c =>
      c.name.toLowerCase().includes(searchTerm.toLowerCase())
    );

    result.sort((a, b) => {
      let comparison = 0;
      if (sortBy === 'name') {
          comparison = a.name.localeCompare(b.name);
      } else if (sortBy === 'revenue') {
          comparison = a.revenue - b.revenue;
      } else if (sortBy === 'profit') {
          comparison = a.profit - b.profit;
      }
      return sortDesc ? -comparison : comparison;
    });

    return result;
  }, [categoriesWithStats, searchTerm, sortBy, sortDesc]);

  useEffect(() => {
    setCurrentPage(1);
  }, [searchTerm, sortBy, sortDesc]);

  const totalPages = Math.ceil(filteredAndSortedCategories.length / ITEMS_PER_PAGE);
  const paginatedCategories = filteredAndSortedCategories.slice(
    (currentPage - 1) * ITEMS_PER_PAGE,
    currentPage * ITEMS_PER_PAGE
  );

  const toggleSelectAll = () => {
    if (selectedCategoryIds.size === filteredAndSortedCategories.length) {
      setSelectedCategoryIds(new Set());
    } else {
      setSelectedCategoryIds(new Set(filteredAndSortedCategories.map(c => c.id)));
    }
  };

  const toggleCategorySelect = (id: string) => {
    const newSelected = new Set(selectedCategoryIds);
    if (newSelected.has(id)) {
      newSelected.delete(id);
    } else {
      newSelected.add(id);
    }
    setSelectedCategoryIds(newSelected);
  };

  const getProductsForBulkEdit = () => {
    return products.filter(p => selectedCategoryIds.has(p.categoryId));
  };


  return (
    <div>
      {isModalOpen && <CategoryForm onSave={handleSave} onCancel={() => { setIsModalOpen(false); setEditingCategory(undefined); }} category={editingCategory} />}
      {viewingCategorySales && <CategorySalesDetailsModal category={viewingCategorySales} products={products} sales={sales} onClose={() => setViewingCategorySales(null)} />}
      <BulkPriceEditModal 
        isOpen={isBulkEditModalOpen} 
        onClose={() => setIsBulkEditModalOpen(false)} 
        targetProducts={getProductsForBulkEdit()}
        onComplete={() => setSelectedCategoryIds(new Set())}
      />
       <ConfirmModal
        isOpen={!!confirmDeleteCategory}
        onClose={() => setConfirmDeleteCategory(null)}
        onConfirm={() => confirmDeleteCategory && handleConfirmDelete(confirmDeleteCategory)}
        title={t('confirmDelete')}
        message={t('confirmDeleteCategoryMessage').replace('{name}', confirmDeleteCategory?.name || '')}
      />
      
      <div className="flex flex-col sm:flex-row justify-between items-start sm:items-center mb-6 gap-4">
        <h1 className="text-3xl font-bold">{t('categories')}</h1>
        <div className="flex gap-2 flex-wrap">
            {canEdit && (
                <>
                <input type="file" ref={fileInputRef} onChange={handleFileImport} accept=".csv" className="hidden" />
                <button onClick={handleImportClick} className="flex items-center gap-2 px-4 py-2 rounded-md bg-blue-600 text-white hover:bg-blue-700">
                    <UploadIcon className="w-5 h-5"/> {t('importCsv')}
                </button>
                <button onClick={handleExport} className="flex items-center gap-2 px-4 py-2 rounded-md bg-green-600 text-white hover:bg-green-700">
                    <DownloadIcon className="w-5 h-5"/> {t('exportCsv')}
                </button>
                <button onClick={() => { setEditingCategory(undefined); setIsModalOpen(true); }} className="px-4 py-2 rounded-md bg-primary-600 text-white hover:bg-primary-700">{t('addCategory')}</button>
                {selectedCategoryIds.size > 0 && (
                    <button onClick={() => setIsBulkEditModalOpen(true)} className="flex items-center gap-2 px-4 py-2 rounded-md bg-purple-600 text-white hover:bg-purple-700">
                        <EditIcon className="w-5 h-5"/> {t('bulkPriceEdit' as any) || 'Editar Precios'}
                    </button>
                )}
                </>
            )}
             {!canEdit && (
                <button onClick={handleExport} className="flex items-center gap-2 px-4 py-2 rounded-md bg-green-600 text-white hover:bg-green-700">
                    <DownloadIcon className="w-5 h-5"/> {t('exportList')}
                </button>
            )}
        </div>
      </div>

       <div className="mb-4 flex flex-col sm:flex-row gap-4">
            <input 
                type="text"
                placeholder={t('searchPlaceholder')}
                value={searchTerm}
                onChange={(e) => setSearchTerm(e.target.value)}
                className="w-full sm:flex-1 p-2 rounded-md bg-white dark:bg-slate-800 border border-slate-300 dark:border-slate-600 text-slate-900 dark:text-white"
            />
            <div className="flex gap-2 items-center">
                <span className="text-sm font-medium text-slate-500 whitespace-nowrap">{t('sortBy')}:</span>
                <select 
                    value={sortBy}
                    onChange={(e) => setSortBy(e.target.value as 'name' | 'revenue' | 'profit')}
                    className="p-2 rounded-md bg-white dark:bg-slate-800 border border-slate-300 dark:border-slate-600 text-slate-900 dark:text-white"
                >
                    <option value="name">{t('name')}</option>
                    <option value="revenue">{t('totalRevenue')}</option>
                    <option value="profit">{t('profits')}</option>
                </select>
                <button
                    onClick={() => setSortDesc(!sortDesc)}
                    className="p-2 rounded-md bg-slate-200 dark:bg-slate-700 hover:bg-slate-300 dark:hover:bg-slate-600"
                    title={sortDesc ? 'Descendente' : 'Ascendente'}
                >
                    {sortDesc ? '⬇️' : '⬆️'}
                </button>
            </div>
        </div>
      <div className="bg-white dark:bg-slate-800 rounded-xl shadow-lg overflow-hidden">
        <div className="overflow-x-auto min-h-[570px]">
          <table className="responsive-table w-full text-sm text-left text-slate-500 dark:text-slate-400">
            <thead className="text-xs text-slate-700 uppercase bg-slate-50 dark:bg-slate-700 dark:text-slate-300">
              <tr>
                {canEdit && (
                    <th className="px-4 py-3">
                        <input 
                            type="checkbox" 
                            checked={filteredAndSortedCategories.length > 0 && selectedCategoryIds.size === filteredAndSortedCategories.length}
                            onChange={toggleSelectAll}
                            title={t('selectAll' as any) || 'Seleccionar todos'}
                            className="w-4 h-4 text-primary-600 bg-slate-100 border-slate-300 rounded focus:ring-primary-500 dark:focus:ring-primary-600 dark:ring-offset-slate-800 focus:ring-2 dark:bg-slate-700 dark:border-slate-600"
                        />
                    </th>
                )}
                <th className="px-6 py-3">{t('name')}</th>
                <th className="px-6 py-3">{t('productCount')}</th>
                <th className="px-6 py-3">{t('productsSold' as any) || 'Productos Vendidos'}</th>
                <th className="px-6 py-3">{t('totalRevenue')}</th>
                <th className="px-6 py-3">{t('profits')}</th>
                <th className="px-6 py-3">{t('actions')}</th>
              </tr>
            </thead>
            <tbody>
              {paginatedCategories.map(category => {
                  return (
                    <tr key={category.id} className="border-b dark:border-slate-700 hover:bg-slate-50 dark:hover:bg-slate-600">
                      {canEdit && (
                          <td className="px-4 py-4">
                              <input 
                                  type="checkbox"
                                  checked={selectedCategoryIds.has(category.id)}
                                  onChange={() => toggleCategorySelect(category.id)}
                                  className="w-4 h-4 text-primary-600 bg-slate-100 border-slate-300 rounded focus:ring-primary-500 dark:focus:ring-primary-600 dark:ring-offset-slate-800 focus:ring-2 dark:bg-slate-700 dark:border-slate-600"
                              />
                          </td>
                      )}
                      <td className="px-6 py-4 font-medium text-slate-900 dark:text-white">{category.name}</td>
                      <td className="px-6 py-4">{category.productCount}</td>
                      <td className="px-6 py-4">{category.productsSold}</td>
                      <td className="px-6 py-4 font-bold text-slate-900 dark:text-white">${category.revenue.toFixed(2)}</td>
                      <td className="px-6 py-4 font-bold text-green-600 dark:text-green-400">${category.profit.toFixed(2)}</td>
                      <td className="px-6 py-4 flex gap-4">
                        <button onClick={() => setViewingCategorySales(category)} title={t('salesHistory')} className="font-medium text-slate-500 hover:text-primary-600 dark:text-slate-400 dark:hover:text-primary-400">
                          <FileTextIcon className="w-5 h-5"/>
                        </button>
                        {canEdit && (
                            <>
                            <button onClick={() => { setEditingCategory(category); setIsModalOpen(true); }} title={t('edit')} className="font-medium text-primary-600 hover:text-primary-800 dark:text-primary-400 dark:hover:text-primary-200">
                              <EditIcon className="w-5 h-5" />
                            </button>
                            <button onClick={() => handleDeleteRequest(category)} title={t('delete')} className="font-medium text-red-600 hover:text-red-800 dark:text-red-400 dark:hover:text-red-200">
                              <TrashIcon className="w-5 h-5" />
                            </button>
                            </>
                        )}
                        {!canEdit && <span className="text-slate-400 text-xs italic">{t('readOnly')}</span>}
                      </td>
                    </tr>
                  )
              })}
            </tbody>
          </table>
            {filteredAndSortedCategories.length === 0 && (
                <div className="flex items-center justify-center h-96 text-slate-500 dark:text-slate-400">
                    {t('noCategoriesFound')}
                </div>
            )}
        </div>
        <Pagination
            currentPage={currentPage}
            totalPages={totalPages}
            onPageChange={setCurrentPage}
            totalItems={filteredAndSortedCategories.length}
            itemsPerPage={ITEMS_PER_PAGE}
        />
      </div>
    </div>
  );
};

export default Categories;
