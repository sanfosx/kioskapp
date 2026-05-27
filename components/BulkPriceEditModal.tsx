import React, { useState, useContext } from 'react';
import { Product } from '../types';
import { LanguageContext, DataContext } from '../App';
import { useNotification } from './Notification';

interface BulkPriceEditModalProps {
    isOpen: boolean;
    onClose: () => void;
    targetProducts: Product[];
    onComplete: () => void;
}

export const BulkPriceEditModal: React.FC<BulkPriceEditModalProps> = ({ isOpen, onClose, targetProducts, onComplete }) => {
    const { t } = useContext(LanguageContext);
    const { updateProduct } = useContext(DataContext);
    const addNotification = useNotification();

    const [adjustmentType, setAdjustmentType] = useState<'percentage' | 'fixed'>('percentage');
    const [direction, setDirection] = useState<'increase' | 'decrease' | 'set'>('increase');
    const [value, setValue] = useState<number | ''>('');
    const [isApplying, setIsApplying] = useState(false);

    if (!isOpen) return null;

    const handleApply = async () => {
        if (value === '' || isNaN(value) || value <= 0) return;
        if (targetProducts.length === 0) {
            addNotification(t('selectProductsFirst' as any) || 'Please select some products first.', 'error');
            return;
        }

        setIsApplying(true);
        const numericValue = Number(value);

        try {
            // Update sequentially to avoid overwhelming
            for (const product of targetProducts) {
                let newPrice = product.price;

                if (adjustmentType === 'percentage') {
                    const diff = product.price * (numericValue / 100);
                    if (direction === 'increase') {
                        newPrice += diff;
                    } else if (direction === 'decrease') {
                        newPrice = Math.max(0, newPrice - diff);
                    } else if (direction === 'set') {
                        // For percentage wait, 'set' with percentage doesn't make sense really.
                        // I'll make it only 'set' if 'fixed'. But let's handle just setting direct value if set
                        newPrice = Math.max(0, numericValue);
                    }
                } else if (adjustmentType === 'fixed') {
                    if (direction === 'increase') {
                        newPrice += numericValue;
                    } else if (direction === 'decrease') {
                        newPrice = Math.max(0, newPrice - numericValue);
                    } else if (direction === 'set') {
                        newPrice = Math.max(0, numericValue);
                    }
                }

                // only update if price changed
                if (newPrice !== product.price) {
                    await updateProduct({ ...product, price: newPrice }, 'Bulk price edit');
                }
            }

            addNotification(t('priceUpdateSuccess' as any) || 'Prices updated successfully', 'success');
            onComplete();
            onClose();
        } catch (error) {
            console.error(error);
            addNotification('Error updating prices', 'error');
        } finally {
            setIsApplying(false);
        }
    };

    return (
        <div className="fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center z-50 p-4">
            <div className="bg-white dark:bg-slate-800 rounded-lg p-8 w-full max-w-md shadow-2xl relative">
                <h2 className="text-2xl font-bold mb-6 text-slate-900 dark:text-white">{t('bulkPriceEditTitle' as any) || 'Modify Prices'}</h2>
                <div className="mb-4">
                    <p className="text-sm font-medium text-slate-500 mb-4">
                        {targetProducts.length} {t('selectedItems' as any) || 'products selected'}
                    </p>

                    <div className="flex flex-col gap-4">
                        <div>
                            <label className="block text-sm font-medium text-slate-700 dark:text-slate-300 mb-1">{t('adjustmentType' as any) || 'Adjustment Type'}</label>
                            <select
                                className="w-full p-2 border border-slate-300 dark:border-slate-600 rounded bg-white dark:bg-slate-700 text-slate-900 dark:text-white"
                                value={adjustmentType}
                                onChange={(e) => setAdjustmentType(e.target.value as 'percentage' | 'fixed')}
                            >
                                <option value="percentage">{t('percentage' as any) || 'Percentage (%)'}</option>
                                <option value="fixed">{t('fixedValue' as any) || 'Fixed Value ($)'}</option>
                            </select>
                        </div>
                        <div className="flex gap-4">
                            <label className="flex items-center gap-2 text-slate-700 dark:text-slate-300">
                                <input type="radio" name="direction" checked={direction === 'increase'} onChange={() => setDirection('increase')} />
                                {t('increase' as any) || 'Increase'}
                            </label>
                            <label className="flex items-center gap-2 text-slate-700 dark:text-slate-300">
                                <input type="radio" name="direction" checked={direction === 'decrease'} onChange={() => setDirection('decrease')} />
                                {t('decrease' as any) || 'Decrease'}
                            </label>
                            <label className="flex items-center gap-2 text-slate-700 dark:text-slate-300">
                                <input type="radio" name="direction" checked={direction === 'set'} onChange={() => setDirection('set')} />
                                {t('setValue' as any) || 'Set value'}
                            </label>
                        </div>
                        <div>
                            <label className="block text-sm font-medium text-slate-700 dark:text-slate-300 mb-1">{t('newValue' as any) || 'New Value / Percentage'}</label>
                            <input
                                type="number"
                                min="0"
                                step="0.01"
                                className="w-full p-2 border border-slate-300 dark:border-slate-600 rounded bg-white dark:bg-slate-700 text-slate-900 dark:text-white"
                                value={value}
                                onChange={(e) => setValue(e.target.value !== '' ? Number(e.target.value) : '')}
                            />
                        </div>
                    </div>
                </div>
                <div className="flex justify-end gap-2 mt-6">
                    <button
                        onClick={onClose}
                        disabled={isApplying}
                        className="px-4 py-2 text-slate-600 dark:text-slate-400 hover:bg-slate-100 dark:hover:bg-slate-700 rounded-md"
                    >
                        {t('cancel')}
                    </button>
                    <button
                        onClick={handleApply}
                        disabled={isApplying || value === ''}
                        className="px-4 py-2 bg-primary-600 hover:bg-primary-700 text-white rounded-md flex items-center gap-2 disabled:opacity-50"
                    >
                        {isApplying ? t('updatingPrices' as any) || 'Updating...' : t('apply' as any) || 'Apply'}
                    </button>
                </div>
            </div>
        </div>
    );
};
