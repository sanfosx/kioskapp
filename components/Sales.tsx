
import React, { useState, useContext, useEffect, useRef, useMemo } from 'react';
import { DataContext, AuthContext, LanguageContext } from '../App';
import { Product, Client, SaleItem, PaymentMethod, Sale } from '../types';
import Scanner from './Scanner';
import { QrCodeIcon, TrashIcon, SearchIcon, DownloadIcon, ChevronLeftIcon, FileTextIcon } from './icons';
import { useNotification } from './Notification';
import Pagination from './Pagination';
import ConfirmModal from './ConfirmModal';


// --- New Sale Component ---
const NewSale: React.FC<{ onBack: () => void }> = ({ onBack }) => {
    const { products, clients, addSale, findProductByBarcode } = useContext(DataContext);
    const { t } = useContext(LanguageContext);
    const [currentSale, setCurrentSale] = useState<SaleItem[]>([]);
    const [selectedClient, setSelectedClient] = useState<string | undefined>();
    const [paymentMethod, setPaymentMethod] = useState<PaymentMethod>('Cash');
    const [discount, setDiscount] = useState<number>(0);
    const [isScanning, setIsScanning] = useState(false);
    const [searchTerm, setSearchTerm] = useState('');
    const [searchResults, setSearchResults] = useState<Product[]>([]);
    const searchInputRef = useRef<HTMLInputElement>(null);
    const addNotification = useNotification();
    const [isSubmitting, setIsSubmitting] = useState(false);

    // Helper to calculate stock remaining considering what is currently in the cart
    const getRemainingStock = (productId: string) => {
        const product = products.find(p => p.id === productId);
        if (!product) return 0;
        
        // Calculate quantity of this specific product already in cart
        const inCartItem = currentSale.find(item => item.productId === productId);
        const inCartQty = inCartItem ? inCartItem.quantity : 0;

        if (product.type === 'combo' && product.comboItems) {
            // For combos, we need to check the stock of all components
            // We find the limiting component (the one that restricts the max number of combos)
            let maxCombos = Number.MAX_SAFE_INTEGER;
            
            for (const item of product.comboItems) {
                const component = products.find(p => p.id === item.productId);
                if (!component) {
                    maxCombos = 0;
                    break;
                }
                // How many of this component are available?
                const availableComponentStock = component.stock;
                // How many combos can we make with this component?
                const possibleCombos = Math.floor(availableComponentStock / item.quantity);
                if (possibleCombos < maxCombos) {
                    maxCombos = possibleCombos;
                }
            }
            
            // Also check the combo's own stock limit
            const comboOwnStock = product.stock;
            const finalMaxCombos = Math.min(maxCombos, comboOwnStock);
            
            return Math.max(0, finalMaxCombos - inCartQty);
        } else {
            // For single products, simple check
            return Math.max(0, product.stock - inCartQty);
        }
    };

    const getProductPrice = (product: Product) => {
        if (product.promotionPrice && product.promotionEndDate) {
            const endDate = new Date(product.promotionEndDate);
            const now = new Date();
            if (now <= endDate) {
                return product.promotionPrice;
            }
        }
        return product.price;
    }

    const handleAddItem = (product: Product) => {
        const remaining = getRemainingStock(product.id);

        if (remaining <= 0) {
            addNotification(`${t('noMoreStock')} "${product.name}" ${t('limitReached')}.`, 'warning');
            return;
        }

        const price = getProductPrice(product);

        const existingItem = currentSale.find(item => item.productId === product.id);
        if (existingItem) {
            setCurrentSale(
                currentSale.map(item =>
                    item.productId === product.id ? { ...item, quantity: item.quantity + 1 } : item
                )
            );
        } else {
            setCurrentSale([...currentSale, { productId: product.id, name: product.name, quantity: 1, price: price }]);
        }
        addNotification(t('itemAdded'), 'success');
    };
    
    const handleScannedProduct = (decodedText: string) => {
        const product = findProductByBarcode(decodedText);
        if (product) {
            handleAddItem(product);
        } else {
            addNotification(`${t('productNotFoundBarcode')} ${decodedText}`, 'error');
        }
    }
    
    const removeItem = (productId: string) => {
        setCurrentSale(currentSale.filter(item => item.productId !== productId));
    };

    const updateItemQuantity = (productId: string, newQuantity: number) => {
        const product = products.find(p => p.id === productId);
        if (!product) return;

        if (newQuantity <= 0) {
            removeItem(productId);
            return;
        }

        if (newQuantity > product.stock) {
            addNotification(`${t('maxStockReached')} ${product.stock}.`, 'warning');
            setCurrentSale(
                currentSale.map(item =>
                    item.productId === productId ? { ...item, quantity: product.stock } : item
                )
            );
            return;
        }

        setCurrentSale(
            currentSale.map(item =>
                item.productId === productId ? { ...item, quantity: newQuantity } : item
            )
        );
    };

    const completeSale = async () => {
        if (currentSale.length === 0) {
            addNotification(t('emptySaleError'), 'error');
            return;
        }
        setIsSubmitting(true);
        const clientName = clients.find(c => c.id === selectedClient)?.name;
        
        try {
            await addSale({ 
                items: currentSale, 
                clientId: selectedClient, 
                clientName,
                discount,
                subtotal
            }, paymentMethod);
            addNotification(t('saleCompleted'), 'success');
            onBack();
        } catch (error) {
            console.error("Error completing sale:", error);
            addNotification(t('saleFailedError'), 'error');
        } finally {
            setIsSubmitting(false);
        }
    };
    
    const subtotal = currentSale.reduce((acc, item) => acc + item.price * item.quantity, 0);
    const total = Math.max(0, subtotal - discount);

    useEffect(() => {
        if (!isScanning) {
            searchInputRef.current?.focus();
        }
    }, [isScanning]);

    useEffect(() => {
        if (searchTerm.trim() === '') {
            setSearchResults([]);
            return;
        }
        const filtered = products.filter(p =>
            p.name.toLowerCase().includes(searchTerm.toLowerCase()) ||
            p.barcode.includes(searchTerm)
        );
        setSearchResults(filtered);
    }, [searchTerm, products]);
    
    const handleSelectProduct = (product: Product) => {
        handleAddItem(product);
        setSearchTerm('');
        setSearchResults([]);
    };

    return (
        <div className="space-y-6">
             <button onClick={onBack} className="flex items-center gap-2 text-sm font-medium text-slate-600 dark:text-slate-300 hover:text-primary-600 dark:hover:text-primary-400">
                <ChevronLeftIcon className="w-5 h-5"/> {t('back')}
            </button>
            <div className="grid grid-cols-1 lg:grid-cols-3 gap-8">
                {isScanning && <Scanner onSingleScanSuccess={handleScannedProduct} onClose={() => setIsScanning(false)} />}
                <div className="lg:col-span-2 bg-white dark:bg-slate-800 p-6 rounded-xl shadow-lg">
                    <h2 className="text-2xl font-bold mb-4">{t('registerNewSale')}</h2>
                    <div className="flex flex-col md:flex-row gap-4 mb-4">
                        <div className="relative flex-grow">
                             <div className="absolute inset-y-0 left-0 flex items-center pl-3 pointer-events-none">
                                <SearchIcon className="w-5 h-5 text-slate-400" />
                            </div>
                            <input
                                ref={searchInputRef}
                                type="text"
                                value={searchTerm}
                                onChange={(e) => setSearchTerm(e.target.value)}
                                placeholder={t('searchPlaceholder')}
                                className="w-full bg-slate-100 dark:bg-slate-700 border-slate-300 dark:border-slate-600 rounded-md p-3 pl-10 focus:ring-primary-500 focus:border-primary-500 text-slate-900 dark:text-white"
                            />
                            {searchResults.length > 0 && (
                                <ul className="absolute z-10 w-full mt-1 bg-white dark:bg-slate-900 border border-slate-300 dark:border-slate-600 rounded-md shadow-lg max-h-60 overflow-y-auto">
                                    {searchResults.map(product => {
                                        const remaining = getRemainingStock(product.id);
                                        return (
                                            <li 
                                                key={product.id} 
                                                onClick={() => handleSelectProduct(product)}
                                                className={`p-3 border-b border-slate-200 dark:border-slate-700 last:border-b-0 ${
                                                    remaining === 0 
                                                        ? 'opacity-60 cursor-not-allowed bg-slate-50 dark:bg-slate-800' 
                                                        : 'cursor-pointer hover:bg-slate-100 dark:hover:bg-slate-700'
                                                }`}
                                            >
                                                <div className="font-medium text-slate-900 dark:text-white">{product.name}</div>
                                                <div className="text-sm flex justify-between">
                                                    <span className={`font-medium ${remaining === 0 ? 'text-red-500' : remaining <= 10 ? 'text-amber-500' : 'text-green-600 dark:text-green-400'}`}>
                                                        {remaining === 0 ? t('outOfStock') : `${t('stockRemaining')}: ${remaining}`}
                                                    </span> 
                                                    <span className="text-slate-500 dark:text-slate-400 font-bold">${product.price.toFixed(2)}</span>
                                                </div>
                                            </li>
                                        );
                                    })}
                                </ul>
                            )}
                        </div>
                         <button onClick={() => setIsScanning(true)} className="p-3 bg-primary-600 text-white rounded-md hover:bg-primary-700 flex-shrink-0 flex items-center justify-center gap-2">
                            <QrCodeIcon className="w-6 h-6"/>
                            <span className="hidden sm:inline">{t('scanProduct')}</span>
                        </button>
                    </div>
                    
                    <div className="h-[26rem] overflow-y-auto border dark:border-slate-700 rounded-md">
                        <table className="w-full text-sm text-left">
                            <thead className="text-xs text-slate-700 uppercase bg-slate-50 dark:bg-slate-700 dark:text-slate-300 sticky top-0">
                                <tr>
                                    <th className="px-4 py-2">{t('products')}</th>
                                    <th className="px-4 py-2 text-center">{t('quantity')}</th>
                                    <th className="px-4 py-2">{t('price')}</th>
                                    <th className="px-4 py-2">Subtotal</th>
                                    <th className="px-4 py-2">{t('actions')}</th>
                                </tr>
                            </thead>
                            <tbody>
                                {currentSale.map(item => {
                                    // Calculate remaining stock real-time
                                    const product = products.find(p => p.id === item.productId);
                                    const maxStock = product ? product.stock : 0;
                                    const remaining = maxStock - item.quantity;
                                    const isMaxReached = item.quantity >= maxStock;

                                    return (
                                        <tr key={item.productId} className="border-b dark:border-slate-700">
                                            <td className="px-4 py-2">
                                                <div className="font-medium text-slate-900 dark:text-white">{item.name}</div>
                                                <div className={`text-xs ${remaining === 0 ? 'text-red-500 font-bold' : 'text-slate-500 dark:text-slate-400'}`}>
                                                    {t('stockRemaining')}: {remaining}
                                                </div>
                                            </td>
                                            <td className="px-4 py-2">
                                                <div className="flex items-center justify-center gap-1">
                                                    <button 
                                                        onClick={() => updateItemQuantity(item.productId, item.quantity - 1)} 
                                                        className="px-2 py-1 rounded-md bg-slate-200 dark:bg-slate-600 hover:bg-slate-300 dark:hover:bg-slate-500 text-slate-800 dark:text-slate-200 font-bold"
                                                    >-</button>
                                                    <input 
                                                        type="number"
                                                        value={item.quantity}
                                                        onChange={(e) => {
                                                            const val = parseInt(e.target.value);
                                                            if (!isNaN(val)) updateItemQuantity(item.productId, val);
                                                        }}
                                                        className="w-12 text-center rounded-md bg-slate-100 dark:bg-slate-700 border-transparent focus:border-primary-500 focus:bg-white dark:focus:bg-slate-600 focus:ring-0 text-slate-900 dark:text-white"
                                                    />
                                                    <button 
                                                        onClick={() => updateItemQuantity(item.productId, item.quantity + 1)} 
                                                        disabled={isMaxReached}
                                                        className={`px-2 py-1 rounded-md font-bold text-slate-800 dark:text-slate-200 ${
                                                            isMaxReached 
                                                            ? 'bg-slate-100 dark:bg-slate-800 text-slate-400 dark:text-slate-600 cursor-not-allowed' 
                                                            : 'bg-slate-200 dark:bg-slate-600 hover:bg-slate-300 dark:hover:bg-slate-500'
                                                        }`}
                                                    >+</button>
                                                </div>
                                            </td>
                                            <td className="px-4 py-2 text-slate-600 dark:text-slate-400">${item.price.toFixed(2)}</td>
                                            <td className="px-4 py-2 font-bold text-slate-900 dark:text-white">${(item.price * item.quantity).toFixed(2)}</td>
                                            <td className="px-4 py-2">
                                                <button onClick={() => removeItem(item.productId)} className="text-red-500 hover:text-red-700 p-1 rounded-full hover:bg-red-100 dark:hover:bg-red-900/50">
                                                    <TrashIcon className="w-5 h-5"/>
                                                </button>
                                            </td>
                                        </tr>
                                    );
                                })}
                            </tbody>
                        </table>
                         {currentSale.length === 0 && (
                            <div className="flex items-center justify-center h-full text-slate-500">
                                {t('addProduct')}
                            </div>
                        )}
                    </div>
                </div>
                
                <div className="bg-white dark:bg-slate-800 p-6 rounded-xl shadow-lg flex flex-col">
                    <h3 className="text-xl font-bold mb-4">{t('saleSummary')}</h3>
                    <div className="mb-4">
                        <label htmlFor="client" className="block text-sm font-medium mb-1">{t('selectClient')}</label>
                        <select id="client" value={selectedClient || ''} onChange={(e) => setSelectedClient(e.target.value)} className="w-full bg-slate-100 dark:bg-slate-700 border-slate-300 dark:border-slate-600 rounded-md p-2 text-slate-900 dark:text-white">
                            <option value="">{t('search')}...</option>
                            {clients.map(client => (
                                <option key={client.id} value={client.id}>{client.name}</option>
                            ))}
                        </select>
                    </div>

                    <div className="mb-4">
                        <label className="block text-sm font-medium mb-2">{t('paymentMethod')}</label>
                        <div className="flex items-center justify-around bg-slate-100 dark:bg-slate-700 rounded-lg p-1">
                             {(['Cash', 'Card', 'Online'] as PaymentMethod[]).map((method) => (
                                <button
                                    key={method}
                                    onClick={() => setPaymentMethod(method)}
                                    className={`w-full text-center px-3 py-1.5 text-sm font-medium rounded-md transition-colors ${
                                        paymentMethod === method
                                        ? 'bg-primary-600 text-white shadow'
                                        : 'text-slate-600 dark:text-slate-300 hover:bg-slate-200 dark:hover:bg-slate-600'
                                    }`}
                                >
                                    {t(method.toLowerCase() as any)}
                                </button>
                            ))}
                        </div>
                    </div>

                    <div className="flex-grow space-y-2 min-h-[10rem] overflow-y-auto py-2">
                        {currentSale.length > 0 ? currentSale.map(item => (
                            <div key={item.productId} className="flex justify-between">
                                <span>{item.name} x {item.quantity}</span>
                                <span>${(item.price * item.quantity).toFixed(2)}</span>
                            </div>
                        )) : (
                            <div className="text-slate-500 text-center pt-8">...</div>
                        )}
                    </div>
                    <div className="border-t dark:border-slate-700 pt-4 mt-4 space-y-2">
                        <div className="flex justify-between text-lg">
                            <span>Subtotal</span>
                            <span>${subtotal.toFixed(2)}</span>
                        </div>
                        <div className="flex justify-between items-center">
                            <span className="text-sm font-medium">{t('discount')}</span>
                            <input 
                                type="number" 
                                value={discount} 
                                onChange={(e) => setDiscount(parseFloat(e.target.value) || 0)}
                                className="w-24 p-1 text-right rounded-md bg-slate-100 dark:bg-slate-700 border-slate-300 dark:border-slate-600"
                                min="0"
                            />
                        </div>
                        <div className="flex justify-between text-2xl font-bold pt-2 border-t dark:border-slate-700">
                            <span>{t('total')}</span>
                            <span>${total.toFixed(2)}</span>
                        </div>
                    </div>
                    <div className="mt-6 grid grid-cols-2 gap-4">
                         <button 
                            onClick={onBack}
                            disabled={isSubmitting}
                            className="w-full bg-slate-500 text-white font-bold py-3 rounded-md hover:bg-slate-600 disabled:bg-slate-400"
                        >
                            {t('cancel')}
                        </button>
                        <button 
                            onClick={completeSale}
                            disabled={currentSale.length === 0 || isSubmitting}
                            className="w-full bg-green-600 text-white font-bold py-3 rounded-md hover:bg-green-700 disabled:bg-slate-400 disabled:cursor-not-allowed flex justify-center items-center gap-2"
                        >
                            {isSubmitting && <div className="animate-spin rounded-full h-4 w-4 border-b-2 border-white"></div>}
                            {t('completeSale')}
                        </button>
                    </div>
                </div>
            </div>
        </div>
    );
};


// --- Sales History Component ---

const SaleDetailsModal: React.FC<{ sale: Sale, onClose: () => void }> = ({ sale, onClose }) => {
    const { t } = useContext(LanguageContext);
    const { users } = useContext(DataContext);
    
    const seller = users.find(u => u.id === sale.sellerId);
    const sellerName = seller ? seller.name : 'N/A';

    return (
        <div className="fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center z-50 p-4">
            <div className="bg-white dark:bg-slate-800 rounded-lg p-8 w-full max-w-lg relative">
                <h2 className="text-2xl font-bold mb-2">{t('saleDetails')}</h2>
                <p className="text-sm font-mono text-slate-500 dark:text-slate-400 mb-4">ID: {sale.id}</p>
                <div className="space-y-2 mb-4">
                    <p><strong>{t('clients')}:</strong> {sale.clientName || 'N/A'}</p>
                    <p><strong>{t('seller')}:</strong> {sellerName}</p>
                    <p><strong>{t('date')}:</strong> {new Date(sale.date).toLocaleString()}</p>
                    <p><strong>{t('paymentMethod')}:</strong> {t(sale.paymentMethod.toLowerCase() as any)}</p>
                    <p><strong>{t('status')}:</strong> <span className="capitalize">{sale.status}</span></p>
                </div>
                <h3 className="font-bold mb-2 border-t dark:border-slate-700 pt-4">{t('products')}</h3>
                <ul className="space-y-1 max-h-60 overflow-y-auto">
                    {(sale.items || []).map((item, index) => (
                        <li key={item.productId + index} className="flex justify-between">
                            <span>{item.name} x {item.quantity}</span>
                            <span>${(item.price * item.quantity).toFixed(2)}</span>
                        </li>
                    ))}
                </ul>
                <div className="border-t dark:border-slate-700 pt-4 mt-4">
                    {sale.discount && sale.discount > 0 ? (
                        <>
                            <div className="flex justify-between text-lg">
                                <span>{t('subtotal')}</span>
                                <span>${(sale.subtotal || sale.total).toFixed(2)}</span>
                            </div>
                            <div className="flex justify-between text-lg text-green-600 dark:text-green-400">
                                <span>{t('discount')}</span>
                                <span>-${sale.discount.toFixed(2)}</span>
                            </div>
                            <div className="flex justify-between text-xl font-bold mt-2 pt-2 border-t dark:border-slate-700">
                                <span>{t('finalTotal')}</span>
                                <span>${sale.total.toFixed(2)}</span>
                            </div>
                        </>
                    ) : (
                        <div className="flex justify-between text-xl font-bold">
                            <span>{t('total')}</span>
                            <span>${sale.total.toFixed(2)}</span>
                        </div>
                    )}
                </div>
                 <div className="flex justify-end pt-6 mt-4">
                    <button onClick={onClose} className="px-4 py-2 rounded-md bg-primary-600 text-white hover:bg-primary-700">{t('close')}</button>
                </div>
            </div>
        </div>
    )
};

const SalesHistory: React.FC<{ onNewSaleClick: () => void }> = ({ onNewSaleClick }) => {
    const { sales, cancelSale } = useContext(DataContext);
    const { currentUser } = useContext(AuthContext);
    const { t } = useContext(LanguageContext);
    const [searchTerm, setSearchTerm] = useState('');
    const [startDate, setStartDate] = useState('');
    const [endDate, setEndDate] = useState('');
    const [paymentMethodFilter, setPaymentMethodFilter] = useState('');
    const [currentPage, setCurrentPage] = useState(1);
    const [viewingSale, setViewingSale] = useState<Sale | null>(null);
    const [saleToCancel, setSaleToCancel] = useState<Sale | null>(null);
    const [showReport, setShowReport] = useState(false);
    const addNotification = useNotification();
    const ITEMS_PER_PAGE = 10;
    
    const role = currentUser?.role || 'salesperson';

    const handleCancelSale = async (sale: Sale) => {
        try {
            await cancelSale(sale.id);
            addNotification(t('saleCancelled').replace('{id}', sale.id.slice(0, 8)), 'success');
            setSaleToCancel(null);
        } catch (error) {
            console.error("Error cancelling sale:", error);
            addNotification(t('saleCancelError'), 'error');
        }
    }

    const filteredSales = useMemo(() => sales.filter(sale => {
        // --- Added Role-based Filter ---
        if (role === 'salesperson' && sale.sellerId !== currentUser?.id) {
            return false;
        }
        // -------------------------------

        const searchMatch = sale.id.toLowerCase().includes(searchTerm.toLowerCase()) ||
            sale.clientName?.toLowerCase().includes(searchTerm.toLowerCase()) ||
            sale.status.toLowerCase().includes(searchTerm.toLowerCase());
        
        const saleDate = new Date(sale.date);
        const start = startDate ? new Date(startDate) : null;
        const end = endDate ? new Date(endDate) : null;

        if (start) start.setHours(0, 0, 0, 0);
        if (end) end.setHours(23, 59, 59, 999);

        const dateMatch = (!start || saleDate >= start) && (!end || saleDate <= end);
        const paymentMatch = !paymentMethodFilter || sale.paymentMethod === paymentMethodFilter;

        return searchMatch && dateMatch && paymentMatch;
    }), [sales, searchTerm, startDate, endDate, paymentMethodFilter, role, currentUser]);

    const filteredTotal = useMemo(() =>
        filteredSales
            .filter(sale => sale.status === 'completed')
            .reduce((acc, sale) => acc + sale.total, 0),
    [filteredSales]);

    const handleExportSales = () => {
        if (filteredSales.length === 0) {
            addNotification(t('noSalesToExport'), 'error');
            return;
        }

        const csvRows = [
            "ID,Date,Client,Products,Payment Method,Status,Total"
        ];

        for (const sale of filteredSales) {
            const clientName = sale.clientName || 'N/A';
            const productsSummary = (sale.items || [])
                .map(item => `${item.name} (x${item.quantity})`)
                .join('; ');
            
            const row = [
                `"${sale.id}"`,
                `"${new Date(sale.date).toLocaleString()}"`,
                `"${clientName.replace(/"/g, '""')}"`,
                `"${productsSummary.replace(/"/g, '""')}"`,
                sale.paymentMethod,
                sale.status,
                sale.total.toFixed(2)
            ].join(',');
            csvRows.push(row);
        }

        const csvString = csvRows.join('\n');
        const blob = new Blob([csvString], { type: 'text/csv;charset=utf-8;' });
        const url = URL.createObjectURL(blob);
        const a = document.createElement('a');
        a.href = url;
        const startDateString = startDate ? `_from_${startDate}` : '';
        const endDateString = endDate ? `_to_${endDate}` : '';
        a.download = `sales_report${startDateString}${endDateString}.csv`;
        document.body.appendChild(a);
        a.click();
        document.body.removeChild(a);
        URL.revokeObjectURL(url);
        addNotification(t('exportReport'), 'success');
    };

    const handleResetFilters = () => {
        setSearchTerm('');
        setStartDate('');
        setEndDate('');
        setPaymentMethodFilter('');
        setCurrentPage(1);
    };

    useEffect(() => {
        setCurrentPage(1);
    }, [searchTerm, startDate, endDate, paymentMethodFilter]);

    const totalPages = Math.ceil(filteredSales.length / ITEMS_PER_PAGE);
    const paginatedSales = filteredSales.slice(
        (currentPage - 1) * ITEMS_PER_PAGE,
        currentPage * ITEMS_PER_PAGE
    );
    
    return (
        <div className="space-y-6">
            {viewingSale && <SaleDetailsModal sale={viewingSale} onClose={() => setViewingSale(null)} />}
            <ConfirmModal
                isOpen={!!saleToCancel}
                onClose={() => setSaleToCancel(null)}
                onConfirm={() => saleToCancel && handleCancelSale(saleToCancel)}
                title={t('cancelSaleTitle')}
                message={t('cancelSaleMessage')}
            />
            <div className="flex flex-col sm:flex-row justify-between items-start sm:items-center gap-4">
                <h1 className="text-3xl font-bold">{t('sales')}</h1>
                <div className="flex gap-2">
                    <button onClick={() => setShowReport(!showReport)} className="px-4 py-2 rounded-md bg-slate-200 dark:bg-slate-700 text-slate-800 dark:text-slate-200 hover:bg-slate-300 dark:hover:bg-slate-600 flex items-center gap-2">
                        <FileTextIcon className="w-5 h-5"/> {showReport ? t('hideReport' as any) : t('generateReport')}
                    </button>
                    <button onClick={onNewSaleClick} className="px-4 py-2 rounded-md bg-primary-600 text-white hover:bg-primary-700">{t('newSale')}</button>
                </div>
            </div>
            
            {showReport && (
            <div className="bg-white dark:bg-slate-800 p-4 rounded-xl shadow-lg space-y-4">
                <h2 className="text-xl font-bold">{t('generateReport')}</h2>
                <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
                    <div>
                        <label htmlFor="start-date" className="block text-sm font-medium mb-1">{t('startDate')}</label>
                        <input id="start-date" type="date" value={startDate} onChange={e => setStartDate(e.target.value)} className="w-full p-2 rounded-md bg-slate-100 dark:bg-slate-700 border border-slate-300 dark:border-slate-600"/>
                    </div>
                     <div>
                        <label htmlFor="end-date" className="block text-sm font-medium mb-1">{t('endDate')}</label>
                        <input id="end-date" type="date" value={endDate} onChange={e => setEndDate(e.target.value)} className="w-full p-2 rounded-md bg-slate-100 dark:bg-slate-700 border border-slate-300 dark:border-slate-600"/>
                    </div>
                     <div>
                        <label htmlFor="payment-method" className="block text-sm font-medium mb-1">{t('paymentMethod')}</label>
                        <select id="payment-method" value={paymentMethodFilter} onChange={e => setPaymentMethodFilter(e.target.value)} className="w-full p-2 rounded-md bg-slate-100 dark:bg-slate-700 border border-slate-300 dark:border-slate-600">
                            <option value="">{t('allMethods')}</option>
                            <option value="Cash">{t('cash')}</option>
                            <option value="Card">{t('card')}</option>
                            <option value="Online">{t('online')}</option>
                        </select>
                    </div>
                </div>
                 <div className="flex flex-col sm:flex-row gap-4">
                    <button onClick={handleExportSales} className="flex items-center justify-center gap-2 px-4 py-2 rounded-md bg-green-600 text-white hover:bg-green-700">
                        <DownloadIcon className="w-5 h-5"/> {t('exportReport')}
                    </button>
                    <button onClick={handleResetFilters} className="px-4 py-2 rounded-md bg-slate-500 text-white hover:bg-slate-600">{t('resetFilters')}</button>
                </div>
                <div className="border-t dark:border-slate-700 pt-4">
                    <p className="text-lg font-semibold">
                        {t('reportSummary')}: <span className="font-bold text-primary-600 dark:text-primary-400">{filteredSales.length}</span> {t('salesFound')} <span className="font-bold text-primary-600 dark:text-primary-400">${filteredTotal.toFixed(2)}</span>
                    </p>
                </div>
            </div>
            )}

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
                                <th className="px-6 py-3">{t('saleId')}</th>
                                <th className="px-6 py-3">{t('date')}</th>
                                <th className="px-6 py-3">{t('clients')}</th>
                                <th className="px-6 py-3">{t('status')}</th>
                                <th className="px-6 py-3">{t('total')}</th>
                                <th className="px-6 py-3">{t('actions')}</th>
                            </tr>
                        </thead>
                        <tbody>
                            {paginatedSales.map(sale => {
                                // Salesperson can only cancel their own sales
                                const canCancel = role === 'admin' || (role === 'salesperson' && sale.sellerId === currentUser?.id);
                                
                                return (
                                <tr key={sale.id} className="border-b dark:border-slate-700 hover:bg-slate-50 dark:hover:bg-slate-600">
                                    <td className="px-6 py-4 font-mono text-xs">{sale.id.slice(0, 8)}...</td>
                                    <td className="px-6 py-4">{new Date(sale.date).toLocaleString()}</td>
                                    <td className="px-6 py-4">{sale.clientName || 'N/A'}</td>
                                    <td className="px-6 py-4">
                                        <span className={`px-2 py-1 text-xs font-medium rounded-full ${
                                            sale.status === 'completed' ? 'bg-green-100 text-green-800 dark:bg-green-900 dark:text-green-200' : 'bg-slate-100 text-slate-800 dark:bg-slate-700 dark:text-slate-300'
                                        }`}>
                                            {t(sale.status)}
                                        </span>
                                    </td>
                                    <td className="px-6 py-4 font-bold text-slate-900 dark:text-white">${sale.total.toFixed(2)}</td>
                                    <td className="px-6 py-4 flex items-center gap-2">
                                        <button onClick={() => setViewingSale(sale)} title={t('viewDetails')} className="p-1 text-slate-500 hover:text-primary-600"><FileTextIcon className="w-5 h-5"/></button>
                                        <button 
                                            onClick={() => setSaleToCancel(sale)}
                                            disabled={sale.status === 'cancelled' || !canCancel}
                                            title={!canCancel ? t('onlyCancelOwnSales') : t('cancelSale')}
                                            className="p-1 text-slate-500 hover:text-red-600 disabled:text-slate-300 disabled:cursor-not-allowed"
                                        >
                                            <TrashIcon className="w-5 h-5"/>
                                        </button>
                                    </td>
                                </tr>
                            )})}
                        </tbody>
                    </table>
                    {filteredSales.length === 0 && (
                        <div className="flex items-center justify-center h-96 text-slate-500 dark:text-slate-400">
                            {role === 'salesperson' ? t('onlyOwnSales') : t('noSalesData')}
                        </div>
                    )}
                </div>
                <Pagination
                    currentPage={currentPage}
                    totalPages={totalPages}
                    onPageChange={setCurrentPage}
                    totalItems={filteredSales.length}
                    itemsPerPage={ITEMS_PER_PAGE}
                />
            </div>
        </div>
    );
};

// --- Main Sales Component ---
const Sales: React.FC<{
  startNewSale?: boolean;
  onNewSaleHandled?: () => void;
}> = ({ startNewSale, onNewSaleHandled }) => {
  const [view, setView] = useState<'history' | 'new'>('history');

  useEffect(() => {
    if (startNewSale) {
      setView('new');
      onNewSaleHandled?.();
    }
  }, [startNewSale, onNewSaleHandled]);

  if (view === 'new') {
    return <NewSale onBack={() => setView('history')} />;
  }

  return <SalesHistory onNewSaleClick={() => setView('new')} />;
};

export default Sales;
