
import React, { useState, useContext, useRef, useEffect, useMemo } from 'react';
import { DataContext, AuthContext, LanguageContext } from '../App';
import { Product, Sale, ProductType, ComboItem } from '../types';
import { PrintIcon, RefreshCwIcon, HistoryIcon, QrCodeIcon, UploadIcon, DownloadIcon, ShoppingCartIcon, TrashIcon, EditIcon, PlusIcon } from './icons';
import Pagination from './Pagination';
import Scanner from './Scanner';
import { useNotification } from './Notification';
import ConfirmModal from './ConfirmModal';
import { BulkPriceEditModal } from './BulkPriceEditModal';

declare var JsBarcode: any;
declare var QRCode: any;

const ProductCodesModal: React.FC<{
  product: Product;
  onClose: () => void;
}> = ({ product, onClose }) => {
  const { t } = useContext(LanguageContext);
  const barcodeRef = useRef<HTMLCanvasElement>(null);
  const qrCodeRef = useRef<HTMLCanvasElement>(null);
  const printableContentRef = useRef<HTMLDivElement>(null);

  useEffect(() => {
    if (product?.barcode) {
      if (barcodeRef.current) {
        try {
          JsBarcode(barcodeRef.current, product.barcode, {
            format: "CODE128",
            displayValue: true,
            fontSize: 18,
            textMargin: 0,
            margin: 10,
          });
        } catch (e) {
          console.error("Failed to generate barcode:", e);
        }
      }
      if (qrCodeRef.current) {
        try {
          QRCode.toCanvas(qrCodeRef.current, product.barcode, { width: 160 }, (error: any) => {
            if (error) console.error("Failed to generate QR Code:", error);
          });
        } catch (e) {
            console.error("Failed to generate QR Code:", e);
        }
      }
    }
  }, [product]);

  const handlePrint = () => {
    const printableArea = printableContentRef.current;
    const barcodeCanvas = barcodeRef.current;
    const qrCodeCanvas = qrCodeRef.current;

    if (!printableArea || !barcodeCanvas || !qrCodeCanvas) return;
    
    // Clone the content to avoid modifying the displayed modal
    const contentToPrint = printableArea.cloneNode(true) as HTMLElement;
    
    // Replace canvas elements with images for reliable printing
    const barcodeImg = new Image();
    barcodeImg.src = barcodeCanvas.toDataURL("image/png");
    const qrCodeImg = new Image();
    qrCodeImg.src = qrCodeCanvas.toDataURL("image/png");

    const barcodeCanvasInClone = contentToPrint.querySelector('canvas:nth-of-type(1)');
    const qrCodeCanvasInClone = contentToPrint.querySelector('canvas:nth-of-type(2)');
    
    if (barcodeCanvasInClone?.parentNode) {
      barcodeCanvasInClone.parentNode.replaceChild(barcodeImg, barcodeCanvasInClone);
    }
    if (qrCodeCanvasInClone?.parentNode) {
       qrCodeCanvasInClone.parentNode.replaceChild(qrCodeImg, qrCodeCanvasInClone);
    }
    
    const printWindow = window.open('', '_blank');
    if (printWindow) {
        printWindow.document.write(`
            <html>
                <head>
                    <title>${t('print')} - ${product.name}</title>
                    <script src="https://cdn.tailwindcss.com"></script>
                </head>
                <body onload="window.print(); setTimeout(function(){ window.close(); }, 250);">
                    <div class="p-8 flex flex-col items-center justify-center min-h-screen">
                        ${contentToPrint.innerHTML}
                    </div>
                </body>
            </html>
        `);
        printWindow.document.close();
    }
  };


  return (
    <div className="fixed inset-0 bg-slate-900/75 backdrop-blur-sm flex items-center justify-center z-50 p-4 sm:p-6">
      <div className="bg-white dark:bg-slate-800 rounded-2xl shadow-2xl w-full max-w-lg flex flex-col overflow-hidden">
        <div className="px-6 py-4 border-b border-slate-200 dark:border-slate-700 flex justify-between items-center bg-slate-50 dark:bg-slate-800/50">
          <h2 className="text-xl font-bold text-slate-800 dark:text-white">
            {t('productCodes')}
          </h2>
          <button onClick={onClose} className="text-slate-400 hover:text-slate-600 dark:hover:text-slate-300 transition-colors">
            <svg className="w-6 h-6" fill="none" viewBox="0 0 24 24" stroke="currentColor"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M6 18L18 6M6 6l12 12" /></svg>
          </button>
        </div>
        
        <div className="p-6 overflow-y-auto flex-1">
          <div ref={printableContentRef}>
            <div className="text-center mb-8">
              <p className="text-lg font-semibold text-slate-800 dark:text-white">{product.name}</p>
              <p className="text-sm text-slate-500 dark:text-slate-400">{product.barcode}</p>
            </div>
            
            <div className="flex flex-col sm:flex-row items-center justify-center gap-8 print:flex-row">
              <div className="text-center flex-1 min-w-0 bg-slate-50 dark:bg-slate-800/50 p-4 rounded-xl border border-slate-200 dark:border-slate-700">
                <h3 className="text-sm font-medium text-slate-500 dark:text-slate-400 uppercase tracking-wider mb-4">{t('barcodeCode128')}</h3>
                <div className="bg-white p-2 rounded-lg inline-block">
                  <canvas ref={barcodeRef} className="max-w-full h-auto" />
                </div>
              </div>
              <div className="text-center flex-shrink-0 bg-slate-50 dark:bg-slate-800/50 p-4 rounded-xl border border-slate-200 dark:border-slate-700">
                <h3 className="text-sm font-medium text-slate-500 dark:text-slate-400 uppercase tracking-wider mb-4">{t('qrCode')}</h3>
                <div className="bg-white p-2 rounded-lg inline-block">
                  <canvas ref={qrCodeRef} />
                </div>
              </div>
            </div>
          </div>
        </div>
        
        <div className="px-6 py-4 border-t border-slate-200 dark:border-slate-700 bg-slate-50 dark:bg-slate-800/50 flex justify-end gap-3">
            <button onClick={handlePrint} className="flex items-center gap-2 px-4 py-2 rounded-lg border border-slate-300 dark:border-slate-600 bg-white dark:bg-slate-700 text-slate-700 dark:text-slate-200 hover:bg-slate-50 dark:hover:bg-slate-600 font-medium text-sm transition-colors focus:outline-none focus:ring-2 focus:ring-offset-2 focus:ring-primary-500 dark:focus:ring-offset-slate-800">
                <PrintIcon className="w-4 h-4"/> {t('print')}
            </button>
            <button onClick={onClose} className="px-4 py-2 rounded-lg bg-primary-600 text-white hover:bg-primary-700 font-medium text-sm transition-colors shadow-sm focus:outline-none focus:ring-2 focus:ring-offset-2 focus:ring-primary-500 dark:focus:ring-offset-slate-800">
              {t('close')}
            </button>
        </div>
      </div>
    </div>
  );
};

const ProductForm: React.FC<{
  product?: Product;
  onSave: (product: Omit<Product, 'id' | 'stockHistory'> | Product, reason?: string) => void;
  onCancel: () => void;
}> = ({ product, onSave, onCancel }) => {
  const { categories, products } = useContext(DataContext);
  const { t } = useContext(LanguageContext);
  const [formData, setFormData] = useState({
    barcode: product?.barcode || '',
    name: product?.name || '',
    categoryId: product?.categoryId || (categories[0]?.id || ''),
    costPrice: product?.costPrice || 0,
    price: product?.price || 0,
    stock: product?.stock || 0,
    promotionPrice: product?.promotionPrice || 0,
    promotionEndDate: product?.promotionEndDate ? new Date(product.promotionEndDate).toISOString().split('T')[0] : '',
    promotionDescription: product?.promotionDescription || '',
    type: product?.type || 'single' as ProductType,
    comboItems: product?.comboItems || [] as ComboItem[],
    expiryDate: product?.expiryDate ? new Date(product.expiryDate).toISOString().split('T')[0] : '',
  });
  const [originalStock] = useState(product?.stock);
  const [stockChangeReason, setStockChangeReason] = useState('');
  const [isScanning, setIsScanning] = useState(false);
  const [errors, setErrors] = useState<Record<string, string>>({});
  const [comboSearchTerm, setComboSearchTerm] = useState('');

  const showReasonInput = product && formData.stock !== originalStock;

  const validate = () => {
    const newErrors: Record<string, string> = {};
    if (!formData.name.trim()) newErrors.name = t('productNameRequired');
    if (!formData.barcode.trim()) newErrors.barcode = t('barcodeRequired');
    if (!formData.categoryId) newErrors.categoryId = t('categoryRequired');
    if (formData.price < 0) newErrors.price = t('priceNegative');
    if (formData.costPrice < 0) newErrors.costPrice = t('costPriceNegative') || 'Cost price cannot be negative';
    if (!product && formData.stock < 0) newErrors.stock = t('stockNegative');
    if (formData.promotionPrice < 0) newErrors.promotionPrice = t('promoPriceNegative');
    if (formData.promotionPrice > 0 && !formData.promotionEndDate) newErrors.promotionEndDate = t('promoEndDateRequired');
    if (showReasonInput && !stockChangeReason.trim()) {
        newErrors.stockChangeReason = t('stockChangeReasonRequired');
    }
    if (formData.type === 'combo' && formData.comboItems.length === 0) {
        newErrors.comboItems = t('comboItemsRequired');
    }
    setErrors(newErrors);
    return Object.keys(newErrors).length === 0;
  }

  const handleChange = (e: React.ChangeEvent<HTMLInputElement | HTMLSelectElement | HTMLTextAreaElement>) => {
    const { name, value } = e.target;
    const isNumberField = name === 'costPrice' || name === 'price' || name === 'stock' || name === 'promotionPrice';
    setFormData(prev => ({
      ...prev,
      [name]: isNumberField ? parseFloat(value) || 0 : value,
    }));
  };
  
  const generateBarcode = () => {
    setFormData(prev => ({...prev, barcode: Date.now().toString()}));
  }

  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    if (!validate()) return;
    
    if (product) {
      onSave({ 
          ...product, 
          ...formData,
          promotionEndDate: formData.promotionEndDate ? new Date(formData.promotionEndDate).toISOString() : undefined,
          expiryDate: formData.expiryDate ? new Date(formData.expiryDate).toISOString() : undefined
      }, showReasonInput ? stockChangeReason : undefined);
    } else {
      onSave({
          ...formData,
          promotionEndDate: formData.promotionEndDate ? new Date(formData.promotionEndDate).toISOString() : undefined,
          expiryDate: formData.expiryDate ? new Date(formData.expiryDate).toISOString() : undefined
      });
    }
  };

  const handleScanSuccess = (decodedText: string) => {
    setFormData(prev => ({ ...prev, barcode: decodedText }));
    setIsScanning(false);
  };

  const addComboItem = (productToAdd: Product) => {
      const existing = formData.comboItems.find(i => i.productId === productToAdd.id);
      if (existing) {
          setFormData(prev => ({
              ...prev,
              comboItems: prev.comboItems.map(i => i.productId === productToAdd.id ? { ...i, quantity: i.quantity + 1 } : i)
          }));
      } else {
          setFormData(prev => ({
              ...prev,
              comboItems: [...prev.comboItems, { productId: productToAdd.id, name: productToAdd.name, quantity: 1 }]
          }));
      }
      setComboSearchTerm('');
  };

  const removeComboItem = (productId: string) => {
      setFormData(prev => ({
          ...prev,
          comboItems: prev.comboItems.filter(i => i.productId !== productId)
      }));
  };

  const updateComboItemQuantity = (productId: string, quantity: number) => {
      if (quantity <= 0) {
          removeComboItem(productId);
          return;
      }
      setFormData(prev => ({
          ...prev,
          comboItems: prev.comboItems.map(i => i.productId === productId ? { ...i, quantity } : i)
      }));
  };

  const filteredProductsForCombo = products.filter(p => 
      p.id !== product?.id && // Cannot add self to combo (avoid recursion)
      p.type !== 'combo' && // Nested combos not supported for simplicity
      (p.name.toLowerCase().includes(comboSearchTerm.toLowerCase()) || p.barcode.includes(comboSearchTerm))
  );

  if (isScanning) {
    return (
      <Scanner
        onSingleScanSuccess={handleScanSuccess}
        onClose={() => setIsScanning(false)}
      />
    );
  }

  return (
    <div className="fixed inset-0 bg-slate-900/75 backdrop-blur-sm flex items-center justify-center z-50 p-4 sm:p-6">
      <div className="bg-white dark:bg-slate-800 rounded-2xl shadow-2xl w-full max-w-2xl max-h-[90vh] flex flex-col overflow-hidden">
        <div className="px-6 py-4 border-b border-slate-200 dark:border-slate-700 flex justify-between items-center bg-slate-50 dark:bg-slate-800/50">
          <h2 className="text-xl font-bold text-slate-800 dark:text-white">
            {product ? t('editProductTitle') : t('addProductTitle')}
          </h2>
          <button onClick={onCancel} className="text-slate-400 hover:text-slate-600 dark:hover:text-slate-300 transition-colors">
            <svg className="w-6 h-6" fill="none" viewBox="0 0 24 24" stroke="currentColor"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M6 18L18 6M6 6l12 12" /></svg>
          </button>
        </div>
        
        <div className="p-6 overflow-y-auto flex-1">
          <form id="product-form" onSubmit={handleSubmit} className="space-y-8">
            {/* Basic Info Section */}
            <section>
              <h3 className="text-sm font-semibold text-slate-500 dark:text-slate-400 uppercase tracking-wider mb-4">{t('basicInformation') || 'Basic Information'}</h3>
              <div className="grid grid-cols-1 sm:grid-cols-2 gap-6">
                <div className="sm:col-span-2">
                  <label htmlFor="name" className="block text-sm font-medium text-slate-700 dark:text-slate-300 mb-1">{t('name')}</label>
                  <input type="text" name="name" id="name" value={formData.name} onChange={handleChange} required className="block w-full rounded-lg border-slate-300 dark:border-slate-600 bg-white dark:bg-slate-700 text-slate-900 dark:text-white shadow-sm focus:border-primary-500 focus:ring-primary-500 sm:text-sm" />
                  {errors.name && <p className="text-red-500 text-xs mt-1">{errors.name}</p>}
                </div>
                
                <div>
                  <label htmlFor="barcode" className="block text-sm font-medium text-slate-700 dark:text-slate-300 mb-1">{t('barcode')}</label>
                  <div className="relative">
                    <input type="text" name="barcode" id="barcode" value={formData.barcode} onChange={handleChange} required className="block w-full rounded-lg border-slate-300 dark:border-slate-600 bg-white dark:bg-slate-700 text-slate-900 dark:text-white shadow-sm focus:border-primary-500 focus:ring-primary-500 sm:text-sm pr-20" />
                    <div className="absolute inset-y-0 right-0 flex items-center pr-1">
                      <button type="button" onClick={() => setIsScanning(true)} className="p-1.5 text-slate-400 hover:text-primary-500 transition-colors" title="Scan Barcode">
                        <QrCodeIcon className="w-4 h-4"/>
                      </button>
                      <button type="button" onClick={generateBarcode} className="p-1.5 text-slate-400 hover:text-primary-500 transition-colors" title="Generate Barcode">
                        <RefreshCwIcon className="w-4 h-4"/>
                      </button>
                    </div>
                  </div>
                  {errors.barcode && <p className="text-red-500 text-xs mt-1">{errors.barcode}</p>}
                </div>

                <div>
                  <label htmlFor="categoryId" className="block text-sm font-medium text-slate-700 dark:text-slate-300 mb-1">{t('category')}</label>
                  <select name="categoryId" id="categoryId" value={formData.categoryId} onChange={handleChange} required className="block w-full rounded-lg border-slate-300 dark:border-slate-600 bg-white dark:bg-slate-700 text-slate-900 dark:text-white shadow-sm focus:border-primary-500 focus:ring-primary-500 sm:text-sm">
                    <option value="" disabled>{t('search')}...</option>
                    {categories.map(cat => <option key={cat.id} value={cat.id}>{cat.name}</option>)}
                  </select>
                  {errors.categoryId && <p className="text-red-500 text-xs mt-1">{errors.categoryId}</p>}
                </div>
              </div>
            </section>

            {/* Pricing & Inventory Section */}
            <section>
              <h3 className="text-sm font-semibold text-slate-500 dark:text-slate-400 uppercase tracking-wider mb-4">{t('pricingAndInventory') || 'Pricing & Inventory'}</h3>
              <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-6">
                <div>
                  <label htmlFor="type" className="block text-sm font-medium text-slate-700 dark:text-slate-300 mb-1">{t('type')}</label>
                  <select name="type" id="type" value={formData.type} onChange={handleChange} className="block w-full rounded-lg border-slate-300 dark:border-slate-600 bg-white dark:bg-slate-700 text-slate-900 dark:text-white shadow-sm focus:border-primary-500 focus:ring-primary-500 sm:text-sm">
                    <option value="single">{t('single')}</option>
                    <option value="combo">{t('combo')}</option>
                  </select>
                </div>
                <div>
                  <label htmlFor="costPrice" className="block text-sm font-medium text-slate-700 dark:text-slate-300 mb-1">{t('costPrice') || 'Cost Price'}</label>
                  <div className="relative">
                    <div className="absolute inset-y-0 left-0 pl-3 flex items-center pointer-events-none">
                      <span className="text-slate-500 sm:text-sm">$</span>
                    </div>
                    <input type="number" name="costPrice" id="costPrice" step="0.01" value={formData.costPrice} onChange={handleChange} required className="block w-full pl-7 rounded-lg border-slate-300 dark:border-slate-600 bg-white dark:bg-slate-700 text-slate-900 dark:text-white shadow-sm focus:border-primary-500 focus:ring-primary-500 sm:text-sm" />
                  </div>
                  {errors.costPrice && <p className="text-red-500 text-xs mt-1">{errors.costPrice}</p>}
                </div>
                <div>
                  <label htmlFor="price" className="block text-sm font-medium text-slate-700 dark:text-slate-300 mb-1">{t('price')}</label>
                  <div className="relative">
                    <div className="absolute inset-y-0 left-0 pl-3 flex items-center pointer-events-none">
                      <span className="text-slate-500 sm:text-sm">$</span>
                    </div>
                    <input type="number" name="price" id="price" step="0.01" value={formData.price} onChange={handleChange} required className="block w-full pl-7 rounded-lg border-slate-300 dark:border-slate-600 bg-white dark:bg-slate-700 text-slate-900 dark:text-white shadow-sm focus:border-primary-500 focus:ring-primary-500 sm:text-sm" />
                  </div>
                  {errors.price && <p className="text-red-500 text-xs mt-1">{errors.price}</p>}
                </div>
                {/* Stock is only visible when creating a new product */}
                {!product && (
                  <div>
                    <label htmlFor="stock" className="block text-sm font-medium text-slate-700 dark:text-slate-300 mb-1">{t('stock')}</label>
                    <input type="number" name="stock" id="stock" value={formData.stock} onChange={handleChange} required className="block w-full rounded-lg border-slate-300 dark:border-slate-600 bg-white dark:bg-slate-700 text-slate-900 dark:text-white shadow-sm focus:border-primary-500 focus:ring-primary-500 sm:text-sm" />
                    {errors.stock && <p className="text-red-500 text-xs mt-1">{errors.stock}</p>}
                  </div>
                )}
              </div>
            </section>

            {/* Combo Items Section (Conditional) */}
            {formData.type === 'combo' && (
              <section className="bg-slate-50 dark:bg-slate-800/50 p-5 rounded-xl border border-slate-200 dark:border-slate-700">
                <h3 className="text-sm font-semibold text-slate-700 dark:text-slate-300 mb-4">{t('comboItems')}</h3>
                <div className="relative mb-4">
                  <input 
                    type="text" 
                    placeholder={t('searchPlaceholderProduct')} 
                    value={comboSearchTerm}
                    onChange={(e) => setComboSearchTerm(e.target.value)}
                    className="block w-full rounded-lg border-slate-300 dark:border-slate-600 bg-white dark:bg-slate-700 text-slate-900 dark:text-white shadow-sm focus:border-primary-500 focus:ring-primary-500 sm:text-sm"
                  />
                  {comboSearchTerm && (
                    <ul className="absolute z-10 w-full mt-1 bg-white dark:bg-slate-800 border border-slate-200 dark:border-slate-700 rounded-lg shadow-lg max-h-48 overflow-y-auto">
                      {filteredProductsForCombo.map(p => (
                        <li 
                          key={p.id} 
                          onClick={() => addComboItem(p)}
                          className="p-3 hover:bg-slate-50 dark:hover:bg-slate-700 cursor-pointer text-sm border-b border-slate-100 dark:border-slate-700 last:border-0"
                        >
                          <div className="font-medium text-slate-900 dark:text-white">{p.name}</div>
                          <div className="text-slate-500 dark:text-slate-400">${p.price.toFixed(2)}</div>
                        </li>
                      ))}
                      {filteredProductsForCombo.length === 0 && (
                        <li className="p-3 text-slate-500 text-sm text-center">{t('noProductsFound')}</li>
                      )}
                    </ul>
                  )}
                </div>
                
                <div className="space-y-2 max-h-48 overflow-y-auto pr-1">
                  {formData.comboItems.map(item => (
                    <div key={item.productId} className="flex items-center justify-between bg-white dark:bg-slate-700 p-3 rounded-lg border border-slate-200 dark:border-slate-600 shadow-sm">
                      <span className="text-sm font-medium text-slate-900 dark:text-white truncate flex-1 pr-4">{item.name}</span>
                      <div className="flex items-center gap-3">
                        <input 
                          type="number" 
                          value={item.quantity} 
                          onChange={(e) => updateComboItemQuantity(item.productId, parseInt(e.target.value))}
                          className="w-16 p-1.5 text-center rounded-md border-slate-300 dark:border-slate-500 bg-slate-50 dark:bg-slate-600 text-sm focus:ring-primary-500 focus:border-primary-500"
                          min="1"
                        />
                        <button type="button" onClick={() => removeComboItem(item.productId)} className="text-red-500 hover:text-red-700 p-1.5 rounded-md hover:bg-red-50 dark:hover:bg-red-900/20 transition-colors">
                          <TrashIcon className="w-4 h-4" />
                        </button>
                      </div>
                    </div>
                  ))}
                  {formData.comboItems.length === 0 && (
                    <div className="text-sm text-slate-500 text-center py-4 bg-white dark:bg-slate-700 rounded-lg border border-dashed border-slate-300 dark:border-slate-600">
                      {t('noItemsInCombo')}
                    </div>
                  )}
                </div>
                {errors.comboItems && <p className="text-red-500 text-xs mt-2">{errors.comboItems}</p>}
              </section>
            )}

            {/* Promotions Section */}
            <section>
              <h3 className="text-sm font-semibold text-slate-500 dark:text-slate-400 uppercase tracking-wider mb-4">{t('promotions')}</h3>
              <div className="grid grid-cols-1 sm:grid-cols-2 gap-6">
                <div>
                  <label htmlFor="promotionPrice" className="block text-sm font-medium text-slate-700 dark:text-slate-300 mb-1">{t('promotionPrice')}</label>
                  <div className="relative">
                    <div className="absolute inset-y-0 left-0 pl-3 flex items-center pointer-events-none">
                      <span className="text-slate-500 sm:text-sm">$</span>
                    </div>
                    <input type="number" name="promotionPrice" id="promotionPrice" step="0.01" value={formData.promotionPrice} onChange={handleChange} className="block w-full pl-7 rounded-lg border-slate-300 dark:border-slate-600 bg-white dark:bg-slate-700 text-slate-900 dark:text-white shadow-sm focus:border-primary-500 focus:ring-primary-500 sm:text-sm" />
                  </div>
                  {errors.promotionPrice && <p className="text-red-500 text-xs mt-1">{errors.promotionPrice}</p>}
                </div>
                <div>
                  <label htmlFor="promotionEndDate" className="block text-sm font-medium text-slate-700 dark:text-slate-300 mb-1">{t('promotionEndDate')}</label>
                  <input type="date" name="promotionEndDate" id="promotionEndDate" value={formData.promotionEndDate} onChange={handleChange} className="block w-full rounded-lg border-slate-300 dark:border-slate-600 bg-white dark:bg-slate-700 text-slate-900 dark:text-white shadow-sm focus:border-primary-500 focus:ring-primary-500 sm:text-sm" />
                  {errors.promotionEndDate && <p className="text-red-500 text-xs mt-1">{errors.promotionEndDate}</p>}
                </div>
                <div className="sm:col-span-2">
                  <label htmlFor="promotionDescription" className="block text-sm font-medium text-slate-700 dark:text-slate-300 mb-1">{t('promotionDescription')}</label>
                  <input type="text" name="promotionDescription" id="promotionDescription" value={formData.promotionDescription} onChange={handleChange} className="block w-full rounded-lg border-slate-300 dark:border-slate-600 bg-white dark:bg-slate-700 text-slate-900 dark:text-white shadow-sm focus:border-primary-500 focus:ring-primary-500 sm:text-sm" />
                </div>
              </div>
            </section>

            {/* Additional Settings */}
            <section>
              <h3 className="text-sm font-semibold text-slate-500 dark:text-slate-400 uppercase tracking-wider mb-4">{t('additionalInfo') || 'Additional Info'}</h3>
              <div className="grid grid-cols-1 sm:grid-cols-2 gap-6">
                <div>
                  <label htmlFor="expiryDate" className="block text-sm font-medium text-slate-700 dark:text-slate-300 mb-1">{t('expiryDate') || 'Expiry Date'}</label>
                  <input type="date" name="expiryDate" id="expiryDate" value={formData.expiryDate} onChange={handleChange} className="block w-full rounded-lg border-slate-300 dark:border-slate-600 bg-white dark:bg-slate-700 text-slate-900 dark:text-white shadow-sm focus:border-primary-500 focus:ring-primary-500 sm:text-sm" />
                </div>
              </div>
            </section>

            {/* Stock Change Reason (Conditional) */}
            {/* Disabled in edit by user request */}
          </form>
        </div>
        
        <div className="px-6 py-4 border-t border-slate-200 dark:border-slate-700 bg-slate-50 dark:bg-slate-800/50 flex justify-end gap-3">
          <button type="button" onClick={onCancel} className="px-4 py-2 rounded-lg border border-slate-300 dark:border-slate-600 bg-white dark:bg-slate-700 text-slate-700 dark:text-slate-200 hover:bg-slate-50 dark:hover:bg-slate-600 font-medium text-sm transition-colors focus:outline-none focus:ring-2 focus:ring-offset-2 focus:ring-primary-500 dark:focus:ring-offset-slate-800">
            {t('cancel')}
          </button>
          <button type="submit" form="product-form" className="px-4 py-2 rounded-lg bg-primary-600 text-white hover:bg-primary-700 font-medium text-sm transition-colors shadow-sm focus:outline-none focus:ring-2 focus:ring-offset-2 focus:ring-primary-500 dark:focus:ring-offset-slate-800">
            {t('save')}
          </button>
        </div>
      </div>
    </div>
  );
};

const AddStockModal: React.FC<{
  product: Product;
  onSave: (product: Product, quantityToAdd: number, reason: string, costPrice: number, price: number) => void;
  onClose: () => void;
}> = ({ product, onSave, onClose }) => {
  const { t } = useContext(LanguageContext);
  const [quantity, setQuantity] = useState(0);
  const [costPrice, setCostPrice] = useState(product.costPrice || 0);
  const [price, setPrice] = useState(product.price || 0);
  const [error, setError] = useState('');

  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    if (quantity <= 0) {
      setError(t('quantityMustBePositive') || 'Quantity must be positive');
      return;
    }
    if (costPrice < 0 || price < 0) {
      setError(t('priceNegative') || 'Prices cannot be negative');
      return;
    }
    onSave(product, quantity, 'Restock', costPrice, price);
  };

  return (
    <div className="fixed inset-0 bg-slate-900/75 backdrop-blur-sm flex items-center justify-center z-50 p-4 sm:p-6">
      <div className="bg-white dark:bg-slate-800 rounded-2xl shadow-2xl w-full max-w-sm flex flex-col overflow-hidden">
        <div className="px-6 py-4 border-b border-slate-200 dark:border-slate-700 flex justify-between items-center bg-slate-50 dark:bg-slate-800/50">
          <h2 className="text-xl font-bold text-slate-800 dark:text-white">
            {t('addStock') || 'Add Stock'}
          </h2>
          <button onClick={onClose} className="text-slate-400 hover:text-slate-600 dark:hover:text-slate-300 transition-colors">
            <svg className="w-6 h-6" fill="none" viewBox="0 0 24 24" stroke="currentColor"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M6 18L18 6M6 6l12 12" /></svg>
          </button>
        </div>
        
        <div className="p-6">
          <p className="text-sm font-medium text-slate-600 dark:text-slate-400 mb-6">
            {product.name} - {t('currentStock') || 'Current Stock'}: <span className="font-bold text-slate-900 dark:text-white">{product.stock}</span>
          </p>
          <form id="add-stock-form" onSubmit={handleSubmit} className="space-y-4">
            <div>
              <label htmlFor="quantity" className="block text-sm font-medium text-slate-700 dark:text-slate-300 mb-1">{t('quantityToAdd') || 'Quantity to Add'}</label>
              <input type="number" id="quantity" value={quantity} onChange={(e) => setQuantity(parseInt(e.target.value) || 0)} required min="1" className="block w-full rounded-lg border-slate-300 dark:border-slate-600 bg-white dark:bg-slate-700 text-slate-900 dark:text-white shadow-sm focus:border-primary-500 focus:ring-primary-500 sm:text-sm" />
            </div>
            <div>
              <label htmlFor="costPrice" className="block text-sm font-medium text-slate-700 dark:text-slate-300 mb-1">{t('costPrice') || 'Cost Price'}</label>
              <div className="relative">
                <div className="absolute inset-y-0 left-0 pl-3 flex items-center pointer-events-none">
                  <span className="text-slate-500 sm:text-sm">$</span>
                </div>
                <input type="number" id="costPrice" step="0.01" value={costPrice} onChange={(e) => setCostPrice(parseFloat(e.target.value) || 0)} required className="block w-full pl-7 rounded-lg border-slate-300 dark:border-slate-600 bg-white dark:bg-slate-700 text-slate-900 dark:text-white shadow-sm focus:border-primary-500 focus:ring-primary-500 sm:text-sm" />
              </div>
            </div>
            <div>
              <label htmlFor="price" className="block text-sm font-medium text-slate-700 dark:text-slate-300 mb-1">{t('price') || 'Selling Price'}</label>
              <div className="relative">
                <div className="absolute inset-y-0 left-0 pl-3 flex items-center pointer-events-none">
                  <span className="text-slate-500 sm:text-sm">$</span>
                </div>
                <input type="number" id="price" step="0.01" value={price} onChange={(e) => setPrice(parseFloat(e.target.value) || 0)} required className="block w-full pl-7 rounded-lg border-slate-300 dark:border-slate-600 bg-white dark:bg-slate-700 text-slate-900 dark:text-white shadow-sm focus:border-primary-500 focus:ring-primary-500 sm:text-sm" />
              </div>
            </div>
            {error && <p className="text-red-500 text-xs mt-2">{error}</p>}
          </form>
        </div>
        
        <div className="px-6 py-4 border-t border-slate-200 dark:border-slate-700 bg-slate-50 dark:bg-slate-800/50 flex justify-end gap-3">
          <button type="button" onClick={onClose} className="px-4 py-2 rounded-lg border border-slate-300 dark:border-slate-600 bg-white dark:bg-slate-700 text-slate-700 dark:text-slate-200 hover:bg-slate-50 dark:hover:bg-slate-600 font-medium text-sm transition-colors">
            {t('cancel')}
          </button>
          <button type="submit" form="add-stock-form" className="px-4 py-2 rounded-lg bg-primary-600 text-white hover:bg-primary-700 font-medium text-sm transition-colors shadow-sm">
            {t('save')}
          </button>
        </div>
      </div>
    </div>
  );
};

const StockHistoryModal: React.FC<{
  product: Product;
  onClose: () => void;
}> = ({ product, onClose }) => {
  const { t } = useContext(LanguageContext);
  return (
    <div className="fixed inset-0 bg-slate-900/75 backdrop-blur-sm flex items-center justify-center z-50 p-4 sm:p-6">
      <div className="bg-white dark:bg-slate-800 rounded-2xl shadow-2xl w-full max-w-3xl flex flex-col overflow-hidden max-h-[90vh]">
        <div className="px-6 py-4 border-b border-slate-200 dark:border-slate-700 flex justify-between items-center bg-slate-50 dark:bg-slate-800/50">
          <div>
            <h2 className="text-xl font-bold text-slate-800 dark:text-white">
              {t('stockHistory')}
            </h2>
            <p className="text-sm font-medium mt-1 text-slate-600 dark:text-slate-400">
              {product.name} - {t('stock')}: <span className="font-bold text-slate-900 dark:text-white">{product.stock}</span>
            </p>
          </div>
          <button onClick={onClose} className="text-slate-400 hover:text-slate-600 dark:hover:text-slate-300 transition-colors">
            <svg className="w-6 h-6" fill="none" viewBox="0 0 24 24" stroke="currentColor"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M6 18L18 6M6 6l12 12" /></svg>
          </button>
        </div>

        <div className="overflow-y-auto flex-1 p-0">
          <table className="w-full text-sm text-left">
            <thead className="text-xs text-slate-500 dark:text-slate-400 uppercase bg-slate-50 dark:bg-slate-800/80 sticky top-0 backdrop-blur-sm z-10 border-b border-slate-200 dark:border-slate-700">
              <tr>
                <th className="px-6 py-4 font-semibold">{t('date')}</th>
                <th className="px-6 py-4 font-semibold">{t('type')}</th>
                <th className="px-6 py-4 font-semibold">{t('quantity')}</th>
                <th className="px-6 py-4 font-semibold">{t('costPrice') || 'Cost'}</th>
                <th className="px-6 py-4 font-semibold">{t('price') || 'Selling'}</th>
                <th className="px-6 py-4 font-semibold">{t('stock')}</th>
                <th className="px-6 py-4 font-semibold">{t('stockChangeReason')}</th>
              </tr>
            </thead>
            <tbody className="divide-y divide-slate-200 dark:divide-slate-700/50">
              {[...(product.stockHistory || [])]
                .sort((a, b) => new Date(b.date).getTime() - new Date(a.date).getTime())
                .map((entry, index) => (
                <tr key={index} className="hover:bg-slate-50/50 dark:hover:bg-slate-700/30 transition-colors text-slate-700 dark:text-slate-300">
                  <td className="px-6 py-4 whitespace-nowrap">{new Date(entry.date).toLocaleString()}</td>
                  <td className="px-6 py-4 capitalize">
                    <span className={`inline-flex items-center px-2.5 py-0.5 rounded-full text-xs font-medium ${
                      entry.type === 'add' ? 'bg-green-100 text-green-800 dark:bg-green-900/30 dark:text-green-400' :
                      entry.type === 'sale' ? 'bg-blue-100 text-blue-800 dark:bg-blue-900/30 dark:text-blue-400' :
                      'bg-slate-100 text-slate-800 dark:bg-slate-700 dark:text-slate-300'
                    }`}>
                      {entry.type}
                    </span>
                  </td>
                  <td className={`px-6 py-4 font-medium whitespace-nowrap ${entry.quantityChange >= 0 ? 'text-green-600 dark:text-green-400' : 'text-red-600 dark:text-red-400'}`}>
                    {entry.quantityChange > 0 ? `+${entry.quantityChange}` : entry.quantityChange}
                  </td>
                  <td className="px-6 py-4 whitespace-nowrap">${(entry.costPrice || 0).toFixed(2)}</td>
                  <td className="px-6 py-4 whitespace-nowrap">${(entry.price || 0).toFixed(2)}</td>
                  <td className="px-6 py-4 font-bold text-slate-900 dark:text-white">{entry.newStock}</td>
                  <td className="px-6 py-4 text-slate-500 dark:text-slate-400">{entry.reason || '-'}</td>
                </tr>
              ))}
              {(!product.stockHistory || product.stockHistory.length === 0) && (
                <tr>
                  <td colSpan={7} className="px-6 py-8 text-center text-slate-500 dark:text-slate-400">
                    No history available
                  </td>
                </tr>
              )}
            </tbody>
          </table>
        </div>
        
        <div className="px-6 py-4 border-t border-slate-200 dark:border-slate-700 bg-slate-50 dark:bg-slate-800/50 flex justify-end">
            <button onClick={onClose} className="px-4 py-2 rounded-lg bg-primary-600 text-white hover:bg-primary-700 font-medium text-sm transition-colors shadow-sm focus:outline-none focus:ring-2 focus:ring-offset-2 focus:ring-primary-500 dark:focus:ring-offset-slate-800">
              {t('close')}
            </button>
        </div>
      </div>
    </div>
  );
};

const ProductSalesHistoryModal: React.FC<{
  product: Product;
  sales: Sale[];
  onClose: () => void;
}> = ({ product, sales, onClose }) => {
  const { t } = useContext(LanguageContext);
  const [sortBy, setSortBy] = useState<'date_desc' | 'date_asc' | 'total_desc' | 'total_asc'>('date_desc');
  const [filterPayment, setFilterPayment] = useState<string>('');

  const productSales = useMemo(() => {
    let filtered = sales
      .map(sale => {
        const item = (sale.items || []).find(i => i.productId === product.id);
        return item ? { sale, item } : null;
      })
      .filter((item): item is { sale: Sale, item: any } => item !== null);

    if (filterPayment) {
      filtered = filtered.filter(({ sale }) => sale.paymentMethod === filterPayment);
    }

    return filtered.sort((a, b) => {
      if (sortBy === 'date_desc') return new Date(b.sale.date).getTime() - new Date(a.sale.date).getTime();
      if (sortBy === 'date_asc') return new Date(a.sale.date).getTime() - new Date(b.sale.date).getTime();
      if (sortBy === 'total_desc') return (b.item.price * b.item.quantity) - (a.item.price * a.item.quantity);
      if (sortBy === 'total_asc') return (a.item.price * a.item.quantity) - (b.item.price * b.item.quantity);
      return 0;
    });
  }, [product, sales, sortBy, filterPayment]);

  const totalQuantitySold = useMemo(() => productSales.reduce((acc, { item }) => acc + item.quantity, 0), [productSales]);
  const totalRevenue = useMemo(() => productSales.reduce((acc, { item }) => acc + (item.price * item.quantity), 0), [productSales]);

  return (
    <div className="fixed inset-0 bg-slate-900/75 backdrop-blur-sm flex items-center justify-center z-50 p-4 sm:p-6">
      <div className="bg-white dark:bg-slate-800 rounded-2xl shadow-2xl w-full max-w-4xl flex flex-col overflow-hidden max-h-[90vh]">
        <div className="px-6 py-4 border-b border-slate-200 dark:border-slate-700 flex justify-between items-center bg-slate-50 dark:bg-slate-800/50">
          <div>
            <h2 className="text-xl font-bold text-slate-800 dark:text-white">
              {t('salesHistory')}
            </h2>
            <div className="flex items-center gap-4 mt-1">
              <p className="text-sm font-medium text-slate-600 dark:text-slate-400">
                {product.name} - {t('stock')}: <span className="font-bold text-slate-900 dark:text-white">{product.stock}</span>
              </p>
              <span className="text-slate-300 dark:text-slate-600">|</span>
              <p className="text-sm font-medium text-slate-600 dark:text-slate-400">
                {t('totalSold' as any)}: <span className="font-bold text-slate-900 dark:text-white">{totalQuantitySold}</span> <span className="text-green-600 dark:text-green-400">(${totalRevenue.toFixed(2)})</span>
              </p>
            </div>
          </div>
          <button onClick={onClose} className="text-slate-400 hover:text-slate-600 dark:hover:text-slate-300 transition-colors">
            <svg className="w-6 h-6" fill="none" viewBox="0 0 24 24" stroke="currentColor"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M6 18L18 6M6 6l12 12" /></svg>
          </button>
        </div>
        
        <div className="p-6 border-b border-slate-200 dark:border-slate-700 bg-white dark:bg-slate-800">
          <div className="flex flex-wrap gap-4">
            <select 
              value={filterPayment} 
              onChange={(e) => setFilterPayment(e.target.value)}
              className="block rounded-lg border-slate-300 dark:border-slate-600 bg-slate-50 dark:bg-slate-700 text-slate-900 dark:text-white shadow-sm focus:border-primary-500 focus:ring-primary-500 sm:text-sm"
            >
              <option value="">{t('allMethods')}</option>
              <option value="Cash">{t('cash')}</option>
              <option value="Card">{t('card')}</option>
              <option value="Online">{t('online')}</option>
            </select>
            
            <select 
              value={sortBy} 
              onChange={(e) => setSortBy(e.target.value as any)}
              className="block rounded-lg border-slate-300 dark:border-slate-600 bg-slate-50 dark:bg-slate-700 text-slate-900 dark:text-white shadow-sm focus:border-primary-500 focus:ring-primary-500 sm:text-sm"
            >
              <option value="date_desc">{t('date')} ({t('newest')})</option>
              <option value="date_asc">{t('date')} ({t('oldest')})</option>
              <option value="total_desc">{t('total')} ({t('highest')})</option>
              <option value="total_asc">{t('total')} ({t('lowest')})</option>
            </select>
          </div>
        </div>

        <div className="overflow-y-auto flex-1 p-0">
          <table className="w-full text-sm text-left">
            <thead className="text-xs text-slate-500 dark:text-slate-400 uppercase bg-slate-50 dark:bg-slate-800/80 sticky top-0 backdrop-blur-sm z-10 border-b border-slate-200 dark:border-slate-700">
              <tr>
                <th className="px-6 py-4 font-semibold">{t('date')}</th>
                <th className="px-6 py-4 font-semibold">{t('saleId')}</th>
                <th className="px-6 py-4 font-semibold">{t('clients')}</th>
                <th className="px-6 py-4 font-semibold">{t('quantity')}</th>
                <th className="px-6 py-4 font-semibold">{t('subtotal')}</th>
              </tr>
            </thead>
            <tbody className="divide-y divide-slate-200 dark:divide-slate-700/50">
              {productSales.length > 0 ? (
                productSales.map(({ sale, item }) => (
                  <tr key={sale.id} className="hover:bg-slate-50/50 dark:hover:bg-slate-700/30 transition-colors text-slate-700 dark:text-slate-300">
                    <td className="px-6 py-4 whitespace-nowrap">{new Date(sale.date).toLocaleString()}</td>
                    <td className="px-6 py-4 font-mono text-xs text-slate-500 dark:text-slate-400">{sale.id.slice(0, 8)}...</td>
                    <td className="px-6 py-4">{sale.clientName || <span className="text-slate-400 italic">N/A</span>}</td>
                    <td className="px-6 py-4 font-medium">{item!.quantity}</td>
                    <td className="px-6 py-4 font-bold text-slate-900 dark:text-white">${(item!.price * item!.quantity).toFixed(2)}</td>
                  </tr>
                ))
              ) : (
                <tr>
                  <td colSpan={5} className="px-6 py-8 text-center text-slate-500 dark:text-slate-400">
                    {t('noSalesData')}
                  </td>
                </tr>
              )}
            </tbody>
          </table>
        </div>
        
        <div className="px-6 py-4 border-t border-slate-200 dark:border-slate-700 bg-slate-50 dark:bg-slate-800/50 flex justify-end">
          <button onClick={onClose} className="px-4 py-2 rounded-lg bg-primary-600 text-white hover:bg-primary-700 font-medium text-sm transition-colors shadow-sm focus:outline-none focus:ring-2 focus:ring-offset-2 focus:ring-primary-500 dark:focus:ring-offset-slate-800">
            {t('close')}
          </button>
        </div>
      </div>
    </div>
  );
};

const Products: React.FC<{
  productIdToEdit: string | null;
  setProductIdToEdit: (id: string | null) => void;
}> = ({ productIdToEdit, setProductIdToEdit }) => {
  const { products, categories, sales, addProduct, updateProduct, deleteProduct, findProductByBarcode, addCategory } = useContext(DataContext);
  const { currentUser } = useContext(AuthContext);
  const { t } = useContext(LanguageContext);
  const addNotification = useNotification();
  const [isModalOpen, setIsModalOpen] = useState(false);
  const [editingProduct, setEditingProduct] = useState<Product | undefined>(undefined);
  const [confirmDeleteProduct, setConfirmDeleteProduct] = useState<Product | null>(null);
  const [searchTerm, setSearchTerm] = useState('');
  const [categoryFilter, setCategoryFilter] = useState('');
  const [stockFilter, setStockFilter] = useState('');
  const [sortOption, setSortOption] = useState('name-asc');
  const [viewingCodesFor, setViewingCodesFor] = useState<Product | undefined>(undefined);
  const [stockHistoryProduct, setStockHistoryProduct] = useState<Product | undefined>(undefined);
  const [salesHistoryProduct, setSalesHistoryProduct] = useState<Product | undefined>(undefined);
  const [addingStockProduct, setAddingStockProduct] = useState<Product | undefined>(undefined);
  const [currentPage, setCurrentPage] = useState(1);
  const [selectedProductIds, setSelectedProductIds] = useState<Set<string>>(new Set());
  const [isBulkEditModalOpen, setIsBulkEditModalOpen] = useState(false);
  const fileInputRef = useRef<HTMLInputElement>(null);
  const ITEMS_PER_PAGE = 10;
  
  const role = currentUser?.role || 'salesperson';
  // Salespeople cannot edit/delete products
  const canEdit = role === 'admin' || role === 'stock_clerk';

  const productStatsMap = useMemo(() => {
    const map = new Map<string, { revenue: number, quantitySold: number }>();
    sales.forEach(sale => {
        (sale.items || []).forEach(item => {
            const current = map.get(item.productId) || { revenue: 0, quantitySold: 0 };
            map.set(item.productId, {
                revenue: current.revenue + (item.price * item.quantity),
                quantitySold: current.quantitySold + item.quantity
            });
        });
    });
    return map;
  }, [sales]);

  useEffect(() => {
    if (productIdToEdit) {
      const productToEdit = products.find(p => p.id === productIdToEdit);
      if (productToEdit) {
        setEditingProduct(productToEdit);
        setIsModalOpen(true);
        setProductIdToEdit(null); // Reset the state in parent
      }
    }
  }, [productIdToEdit, products, setProductIdToEdit]);

  const handleSave = (product: Omit<Product, 'id' | 'stockHistory'> | Product, reason?: string) => {
    if ('id' in product) {
      updateProduct(product, reason);
      addNotification(t('productUpdated'), 'success');
    } else {
      addProduct(product);
      addNotification(t('productAdded'), 'success');
    }
    setIsModalOpen(false);
    setEditingProduct(undefined);
  };

  const handleStockSave = (product: Product, quantityToAdd: number, reason: string, costPrice: number, price: number) => {
    const updatedProduct = {
      ...product,
      stock: product.stock + quantityToAdd,
      costPrice,
      price,
    };
    // Include actionType to explicitly log 'add' instead of 'adjustment'
    updateProduct({ ...updatedProduct, actionType: 'add' } as any, reason);
    addNotification(t('stockAddedSuccess') || 'Stock added successfully', 'success');
    setAddingStockProduct(undefined);
  };

  const handleDelete = (product: Product) => {
    deleteProduct(product.id);
    addNotification(t('productDeleted').replace('{name}', product.name), 'success');
    setConfirmDeleteProduct(null);
  };
  
  const handleExport = () => {
    const csvRows = [
        "barcode,name,category,price,stock"
    ];

    for (const product of products) {
        const categoryName = categories.find(c => c.id === product.categoryId)?.name || 'N/A';
        const row = [
            `"${product.barcode}"`,
            `"${product.name.replace(/"/g, '""')}"`, // Escape double quotes
            `"${categoryName.replace(/"/g, '""')}"`,
            product.price,
            product.stock
        ].join(',');
        csvRows.push(row);
    }

    const csvString = csvRows.join('\n');
    const blob = new Blob([csvString], { type: 'text/csv;charset=utf-8;' });
    const url = URL.createObjectURL(blob);
    const a = document.createElement('a');
    a.href = url;
    a.download = 'products.csv';
    document.body.appendChild(a);
    a.click();
    document.body.removeChild(a);
    URL.revokeObjectURL(url);
    addNotification(t('exportCsv'), 'success');
  };

  const handleImportClick = () => {
    fileInputRef.current?.click();
  };

  const processCSV = async (csvText: string) => {
    const lines = csvText.split(/\r\n|\n/);
    if(lines.length < 2) {
        addNotification(t('csvEmptyError'), 'error');
        return;
    }
    const headers = lines[0].split(',').map(h => h.trim().toLowerCase());
    const requiredHeaders = ['barcode', 'name', 'category', 'price', 'stock'];
    
    if (!requiredHeaders.every(h => headers.includes(h))) {
        addNotification(t('csvMissingHeaders') + requiredHeaders.join(', '), 'error');
        return;
    }

    let addedCount = 0;
    let updatedCount = 0;
    let skippedCount = 0;
    const errors: string[] = [];
    
    // Create a local map of existing categories to avoid relying on stale state during the loop
    const localCategories = new Map<string, string>();
    categories.forEach(c => localCategories.set(c.name.toLowerCase(), c.id));

    for (let i = 1; i < lines.length; i++) {
        const line = lines[i];
        if (!line.trim()) continue;

        const data = line.split(',');
        const row = headers.reduce((obj, header, index) => {
            obj[header] = data[index]?.trim().replace(/^"|"$/g, ''); // Handle quoted fields
            return obj;
        }, {} as Record<string, string>);

        const categoryName = row.category?.trim();
        let categoryId = localCategories.get(categoryName?.toLowerCase() || '');
        
        if (!categoryId && categoryName) {
            try {
                // If category doesn't exist locally, create it via API
                // Note: This waits for the API, then updates the local map so subsequent rows can use it
                const newCategory = await addCategory({ name: categoryName });
                if (newCategory && newCategory.id) {
                    categoryId = newCategory.id;
                    localCategories.set(categoryName.toLowerCase(), categoryId);
                } else {
                     errors.push(`Line ${i + 1}: Failed to create category "${categoryName}". Skipping.`);
                     skippedCount++;
                     continue;
                }
            } catch (error) {
                errors.push(`Line ${i + 1}: Error creating category "${categoryName}". Skipping.`);
                skippedCount++;
                continue;
            }
        } else if (!categoryId) {
             // Category name is missing
             errors.push(`Line ${i + 1}: Category name missing. Skipping.`);
             skippedCount++;
             continue;
        }

        const price = parseFloat(row.price);
        const stock = parseInt(row.stock, 10);
        if (isNaN(price) || price < 0 || isNaN(stock) || stock < 0 || !row.barcode || !row.name) {
             errors.push(`Line ${i + 1}: Invalid data format for price, stock, barcode or name. Skipping.`);
             skippedCount++;
             continue;
        }

        const productData = {
            barcode: row.barcode,
            name: row.name,
            categoryId: categoryId, // Use the resolved ID
            price: price,
            stock: stock,
        };

        const existingProduct = findProductByBarcode(productData.barcode);
        if (existingProduct) {
            await updateProduct({ ...existingProduct, ...productData }, 'CSV Import Update');
            updatedCount++;
        } else {
            await addProduct(productData);
            addedCount++;
        }
    }
    
    let summary = `${addedCount} ${t('productsAdded')}, ${updatedCount} ${t('productsUpdated')}.`;
    if (skippedCount > 0) {
        summary += ` ${skippedCount} ${t('rowsSkipped')}`;
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

  const filteredAndSortedProducts = useMemo(() => {
    let tempProducts = [...products];

    // Filtering
    tempProducts = tempProducts.filter(p => {
        const category = categories.find(c => c.id === p.categoryId);
        const searchMatch = p.name.toLowerCase().includes(searchTerm.toLowerCase()) ||
            p.barcode.includes(searchTerm) ||
            (category && category.name.toLowerCase().includes(searchTerm.toLowerCase()));
        
        const categoryMatch = !categoryFilter || p.categoryId === categoryFilter;

        const stockMatch = !stockFilter || (
            (stockFilter === 'in-stock' && p.stock > 10) ||
            (stockFilter === 'low-stock' && p.stock > 0 && p.stock <= 10) ||
            (stockFilter === 'out-of-stock' && p.stock === 0)
        );

        return searchMatch && categoryMatch && stockMatch;
    });

    // Sorting
    const [sortBy, sortOrder] = sortOption.split('-');
    tempProducts.sort((a, b) => {
        let comparison = 0;
        switch (sortBy) {
            case 'name':
                comparison = a.name.localeCompare(b.name);
                break;
            case 'price':
                comparison = a.price - b.price;
                break;
            case 'stock':
                comparison = a.stock - b.stock;
                break;
            default:
                break;
        }
        return sortOrder === 'desc' ? comparison * -1 : comparison;
    });

    return tempProducts;
  }, [products, categories, searchTerm, categoryFilter, stockFilter, sortOption]);


  const handleResetFilters = () => {
    setSearchTerm('');
    setCategoryFilter('');
    setStockFilter('');
    setSortOption('name-asc');
    setCurrentPage(1);
  };

  useEffect(() => {
    setCurrentPage(1);
  }, [searchTerm, categoryFilter, stockFilter]);

  const totalPages = Math.ceil(filteredAndSortedProducts.length / ITEMS_PER_PAGE);
  const paginatedProducts = filteredAndSortedProducts.slice(
    (currentPage - 1) * ITEMS_PER_PAGE,
    currentPage * ITEMS_PER_PAGE
  );

  const toggleSelectAll = () => {
    if (selectedProductIds.size === filteredAndSortedProducts.length) {
      setSelectedProductIds(new Set());
    } else {
      setSelectedProductIds(new Set(filteredAndSortedProducts.map(p => p.id)));
    }
  };

  const toggleProductSelect = (id: string) => {
    const newSelected = new Set(selectedProductIds);
    if (newSelected.has(id)) {
      newSelected.delete(id);
    } else {
      newSelected.add(id);
    }
    setSelectedProductIds(newSelected);
  };

  const getSelectedProducts = () => {
    return products.filter(p => selectedProductIds.has(p.id));
  };

  return (
    <div>
      {isModalOpen && <ProductForm onSave={handleSave} onCancel={() => { setIsModalOpen(false); setEditingProduct(undefined); }} product={editingProduct} />}
      {viewingCodesFor && <ProductCodesModal product={viewingCodesFor} onClose={() => setViewingCodesFor(undefined)} />}
      {stockHistoryProduct && <StockHistoryModal product={stockHistoryProduct} onClose={() => setStockHistoryProduct(undefined)} />}
      {salesHistoryProduct && <ProductSalesHistoryModal product={salesHistoryProduct} sales={sales} onClose={() => setSalesHistoryProduct(undefined)} />}
      {addingStockProduct && <AddStockModal product={addingStockProduct} onSave={handleStockSave} onClose={() => setAddingStockProduct(undefined)} />}
      <BulkPriceEditModal 
        isOpen={isBulkEditModalOpen} 
        onClose={() => setIsBulkEditModalOpen(false)} 
        targetProducts={getSelectedProducts()}
        onComplete={() => setSelectedProductIds(new Set())}
      />
      <ConfirmModal
        isOpen={!!confirmDeleteProduct}
        onClose={() => setConfirmDeleteProduct(null)}
        onConfirm={() => confirmDeleteProduct && handleDelete(confirmDeleteProduct)}
        title={t('confirmDelete')}
        message={`Are you sure you want to delete "${confirmDeleteProduct?.name}"? This action is irreversible.`}
      />
      
      <div className="flex flex-col sm:flex-row justify-between items-start sm:items-center mb-6 gap-4">
        <h1 className="text-3xl font-bold">{t('products')}</h1>
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
                <button onClick={() => { setEditingProduct(undefined); setIsModalOpen(true); }} className="px-4 py-2 rounded-md bg-primary-600 text-white hover:bg-primary-700">{t('addProduct')}</button>
                {selectedProductIds.size > 0 && (
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

       <div className="bg-white dark:bg-slate-800 p-4 rounded-xl shadow-lg mb-6 space-y-4">
            <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
                <input 
                    type="text"
                    placeholder={t('searchPlaceholder')}
                    value={searchTerm}
                    onChange={(e) => setSearchTerm(e.target.value)}
                    className="w-full p-2 rounded-md bg-slate-100 dark:bg-slate-700 border border-slate-300 dark:border-slate-600 text-slate-900 dark:text-white"
                />
                 <select value={categoryFilter} onChange={(e) => setCategoryFilter(e.target.value)} className="w-full p-2 rounded-md bg-slate-100 dark:bg-slate-700 border border-slate-300 dark:border-slate-600 text-slate-900 dark:text-white">
                    <option value="">{t('category')}</option>
                    {categories.map(cat => <option key={cat.id} value={cat.id}>{cat.name}</option>)}
                </select>
                 <select value={stockFilter} onChange={(e) => setStockFilter(e.target.value)} className="w-full p-2 rounded-md bg-slate-100 dark:bg-slate-700 border border-slate-300 dark:border-slate-600 text-slate-900 dark:text-white">
                    <option value="">{t('stock')}</option>
                    <option value="in-stock">{t('inStock')}</option>
                    <option value="low-stock">{t('lowStock')}</option>
                    <option value="out-of-stock">{t('outOfStockFilter')}</option>
                </select>
            </div>
            <div className="flex flex-col sm:flex-row gap-4">
                 <select value={sortOption} onChange={(e) => setSortOption(e.target.value)} className="w-full sm:w-auto p-2 rounded-md bg-slate-100 dark:bg-slate-700 border border-slate-300 dark:border-slate-600 text-slate-900 dark:text-white">
                    <option value="name-asc">{t('sortByNameAsc')}</option>
                    <option value="name-desc">{t('sortByNameDesc')}</option>
                    <option value="price-asc">{t('sortByPriceAsc')}</option>
                    <option value="price-desc">{t('sortByPriceDesc')}</option>
                    <option value="stock-asc">{t('sortByStockAsc')}</option>
                    <option value="stock-desc">{t('sortByStockDesc')}</option>
                </select>
                <button onClick={handleResetFilters} className="px-4 py-2 rounded-md bg-slate-500 text-white hover:bg-slate-600">{t('resetFilters')}</button>
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
                            checked={filteredAndSortedProducts.length > 0 && selectedProductIds.size === filteredAndSortedProducts.length}
                            onChange={toggleSelectAll}
                            title={t('selectAll' as any) || 'Seleccionar todos'}
                            className="w-4 h-4 text-primary-600 bg-slate-100 border-slate-300 rounded focus:ring-primary-500 dark:focus:ring-primary-600 dark:ring-offset-slate-800 focus:ring-2 dark:bg-slate-700 dark:border-slate-600"
                        />
                    </th>
                )}
                <th className="px-6 py-3">{t('barcode')}</th>
                <th className="px-6 py-3">{t('name')}</th>
                <th className="px-6 py-3">{t('category')}</th>
                <th className="px-6 py-3">{t('costPrice')}</th>
                <th className="px-6 py-3">{t('price')}</th>
                <th className="px-6 py-3">{t('stock')}</th>
                <th className="px-6 py-3">{t('expiryDate') || 'Expiry Date'}</th>
                <th className="px-6 py-3">{t('revenue')}</th>
                <th className="px-6 py-3">{t('profits')}</th>
                <th className="px-6 py-3">{t('actions')}</th>
              </tr>
            </thead>
            <tbody>
              {paginatedProducts.map(product => {
                const category = categories.find(c => c.id === product.categoryId);
                const stats = productStatsMap.get(product.id) || { revenue: 0, quantitySold: 0 };
                const revenue = stats.revenue;
                const profit = revenue - (stats.quantitySold * (product.costPrice || 0));
                
                let expiryStatus = '';
                let expiryClass = 'text-slate-500';
                if (product.expiryDate) {
                  const now = new Date();
                  now.setHours(0,0,0,0);
                  const expiry = new Date(product.expiryDate);
                  const daysToExpiry = Math.ceil((expiry.getTime() - now.getTime()) / (1000 * 3600 * 24));
                  
                  if (daysToExpiry < 0) {
                    expiryStatus = t('expired') || 'Expired';
                    expiryClass = 'bg-red-100 text-red-800 dark:bg-red-900/30 dark:text-red-400';
                  } else if (daysToExpiry <= 7) {
                    expiryStatus = t('expiringSoon') || 'Expiring';
                    expiryClass = 'bg-orange-100 text-orange-800 dark:bg-orange-900/30 dark:text-orange-400';
                  } else {
                    expiryStatus = t('valid') || 'Valid';
                    expiryClass = 'bg-green-100 text-green-800 dark:bg-green-900/30 dark:text-green-400';
                  }
                }

                return (
                  <tr key={product.id} className="border-b dark:border-slate-700 hover:bg-slate-50 dark:hover:bg-slate-600">
                    {canEdit && (
                        <td className="px-4 py-4">
                            <input 
                                type="checkbox"
                                checked={selectedProductIds.has(product.id)}
                                onChange={() => toggleProductSelect(product.id)}
                                className="w-4 h-4 text-primary-600 bg-slate-100 border-slate-300 rounded focus:ring-primary-500 dark:focus:ring-primary-600 dark:ring-offset-slate-800 focus:ring-2 dark:bg-slate-700 dark:border-slate-600"
                            />
                        </td>
                    )}
                    <td className="px-6 py-4">{product.barcode}</td>
                    <td className="px-6 py-4 font-medium text-slate-900 dark:text-white">{product.name}</td>
                    <td className="px-6 py-4">{category?.name || 'N/A'}</td>
                    <td className="px-6 py-4">${(product.costPrice || 0).toFixed(2)}</td>
                    <td className="px-6 py-4">${product.price.toFixed(2)}</td>
                    <td className="px-6 py-4">
                      <span className={`inline-flex items-center px-2.5 py-0.5 rounded-full text-xs font-medium ${
                        product.stock === 0 
                          ? 'bg-red-100 text-red-800 dark:bg-red-900/30 dark:text-red-400' 
                          : product.stock <= 10 
                            ? 'bg-amber-100 text-amber-800 dark:bg-amber-900/30 dark:text-amber-400' 
                            : 'bg-green-100 text-green-800 dark:bg-green-900/30 dark:text-green-400'
                      }`}>
                        {product.stock}
                      </span>
                    </td>
                    <td className="px-6 py-4">
                      {product.expiryDate ? (
                        <div className="flex flex-col gap-1">
                          <span className="text-sm">{new Date(product.expiryDate).toLocaleDateString()}</span>
                          {expiryStatus && (
                            <span className={`inline-flex items-center px-2 py-0.5 rounded text-[10px] font-medium w-fit ${expiryClass}`}>
                              {expiryStatus}
                            </span>
                          )}
                        </div>
                      ) : '-'}
                    </td>
                    <td className="px-6 py-4 font-medium text-slate-600 dark:text-slate-300">${revenue.toFixed(2)}</td>
                    <td className="px-6 py-4 font-bold text-green-600 dark:text-green-400">${profit.toFixed(2)}</td>
                    <td className="px-6 py-4 flex items-center gap-2 flex-wrap">
                      <button onClick={() => setViewingCodesFor(product)} title={t('codes')} className="font-medium text-indigo-600 hover:text-indigo-800 dark:text-indigo-400 dark:hover:text-indigo-200">
                        <QrCodeIcon className="w-5 h-5" />
                      </button>
                      <button onClick={() => setStockHistoryProduct(product)} title={t('stockHistoryBtn')} className="font-medium text-slate-600 hover:text-slate-800 dark:text-slate-400 dark:hover:text-slate-200">
                        <HistoryIcon className="w-5 h-5" />
                      </button>
                      {role !== 'stock_clerk' && (
                         <button onClick={() => setSalesHistoryProduct(product)} title={t('salesHistoryBtn')} className="font-medium text-green-600 hover:text-green-800 dark:text-green-400 dark:hover:text-green-200">
                           <ShoppingCartIcon className="w-5 h-5" />
                         </button>
                      )}
                      {canEdit && (
                          <>
                           <button onClick={() => setAddingStockProduct(product)} title={t('addStock') || 'Add Stock'} className="font-medium text-amber-600 hover:text-amber-800 dark:text-amber-400 dark:hover:text-amber-200">
                             <PlusIcon className="w-5 h-5" />
                           </button>
                           <button onClick={() => { setEditingProduct(product); setIsModalOpen(true); }} title={t('edit')} className="font-medium text-primary-600 hover:text-primary-800 dark:text-primary-400 dark:hover:text-primary-200">
                             <EditIcon className="w-5 h-5" />
                           </button>
                           <button onClick={() => setConfirmDeleteProduct(product)} title={t('delete')} className="font-medium text-red-600 hover:text-red-800 dark:text-red-400 dark:hover:text-red-200">
                             <TrashIcon className="w-5 h-5" />
                           </button>
                          </>
                      )}
                    </td>
                  </tr>
                )
              })}
            </tbody>
          </table>
          {filteredAndSortedProducts.length === 0 && (
            <div className="flex items-center justify-center h-96 text-slate-500 dark:text-slate-400">
                {t('noProductsFound')}
            </div>
           )}
        </div>
         <Pagination
            currentPage={currentPage}
            totalPages={totalPages}
            onPageChange={setCurrentPage}
            totalItems={filteredAndSortedProducts.length}
            itemsPerPage={ITEMS_PER_PAGE}
        />
      </div>
    </div>
  );
};

export default Products;
