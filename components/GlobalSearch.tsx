import React, { useState, useEffect, useContext, useRef } from 'react';
import { DataContext, LanguageContext } from '../App';
import { SearchIcon, PackageIcon, UsersIcon, TagIcon } from './icons';
import { Product, Client, Category } from '../types';

interface GlobalSearchProps {
    onResultClick: (type: 'product' | 'client' | 'category', id: string) => void;
}

export const GlobalSearch: React.FC<GlobalSearchProps> = ({ onResultClick }) => {
    const { products, clients, categories } = useContext(DataContext);
    const { t } = useContext(LanguageContext);
    const [searchTerm, setSearchTerm] = useState('');
    const [isOpen, setIsOpen] = useState(false);
    const wrapperRef = useRef<HTMLDivElement>(null);

    useEffect(() => {
        const handleClickOutside = (event: MouseEvent) => {
            if (wrapperRef.current && !wrapperRef.current.contains(event.target as Node)) {
                setIsOpen(false);
            }
        };
        document.addEventListener('mousedown', handleClickOutside);
        return () => document.removeEventListener('mousedown', handleClickOutside);
    }, []);

    const filteredProducts = products.filter(p => 
        p.name.toLowerCase().includes(searchTerm.toLowerCase()) || 
        p.barcode.includes(searchTerm)
    ).slice(0, 3);

    const filteredClients = clients.filter(c => 
        c.name.toLowerCase().includes(searchTerm.toLowerCase()) || 
        c.email?.toLowerCase().includes(searchTerm.toLowerCase())
    ).slice(0, 3);

    const filteredCategories = categories.filter(c => 
        c.name.toLowerCase().includes(searchTerm.toLowerCase())
    ).slice(0, 3);

    const hasResults = filteredProducts.length > 0 || filteredClients.length > 0 || filteredCategories.length > 0;

    const handleSelect = (type: 'product' | 'client' | 'category', id: string) => {
        setIsOpen(false);
        setSearchTerm('');
        onResultClick(type, id);
    };

    return (
        <div ref={wrapperRef} className="relative w-full max-w-md flex-1 mx-2 sm:mx-0">
            <div className="relative">
                <div className="absolute inset-y-0 left-0 pl-3 flex items-center pointer-events-none">
                    <SearchIcon className="h-5 w-5 text-slate-400" />
                </div>
                <input
                    type="text"
                    value={searchTerm}
                    onChange={(e) => {
                        setSearchTerm(e.target.value);
                        setIsOpen(true);
                    }}
                    onFocus={() => {
                        if (searchTerm.trim() !== '') setIsOpen(true);
                    }}
                    placeholder={t('searchPlaceholder' as any) || 'Buscar...'}
                    className="block w-full pl-10 pr-3 py-2 border border-slate-300 dark:border-slate-600 rounded-md leading-5 bg-white dark:bg-slate-700 text-slate-900 dark:text-white placeholder-slate-500 focus:outline-none focus:ring-1 focus:ring-primary-500 focus:border-primary-500 sm:text-sm"
                />
            </div>

            {isOpen && searchTerm.trim() !== '' && (
                <div className="absolute mt-1 w-full bg-white dark:bg-slate-800 shadow-lg rounded-md border border-slate-200 dark:border-slate-700 overflow-hidden z-50">
                    {!hasResults ? (
                        <div className="px-4 py-3 text-sm text-slate-500 dark:text-slate-400 text-center">
                            {t('noResults' as any) || 'No results found'}
                        </div>
                    ) : (
                        <div className="max-h-96 overflow-y-auto">
                            {filteredProducts.length > 0 && (
                                <div>
                                    <div className="bg-slate-50 dark:bg-slate-700/50 px-4 py-1 text-xs font-semibold text-slate-500 dark:text-slate-400 uppercase tracking-wider">
                                        {t('products')}
                                    </div>
                                    <ul>
                                        {filteredProducts.map(product => (
                                            <li 
                                                key={product.id}
                                                onClick={() => handleSelect('product', product.id)}
                                                className="px-4 py-2 hover:bg-slate-100 dark:hover:bg-slate-700 cursor-pointer flex items-center gap-3"
                                            >
                                                <PackageIcon className="w-4 h-4 text-slate-400" />
                                                <div className="flex flex-col">
                                                    <span className="text-sm font-medium text-slate-900 dark:text-slate-100">{product.name}</span>
                                                    <span className="text-xs text-slate-500 dark:text-slate-400">{product.barcode} - ${product.price.toFixed(2)}</span>
                                                </div>
                                            </li>
                                        ))}
                                    </ul>
                                </div>
                            )}

                            {filteredClients.length > 0 && (
                                <div>
                                    <div className="bg-slate-50 dark:bg-slate-700/50 px-4 py-1 text-xs font-semibold text-slate-500 dark:text-slate-400 uppercase tracking-wider">
                                        {t('clients')}
                                    </div>
                                    <ul>
                                        {filteredClients.map(client => (
                                            <li 
                                                key={client.id}
                                                onClick={() => handleSelect('client', client.id)}
                                                className="px-4 py-2 hover:bg-slate-100 dark:hover:bg-slate-700 cursor-pointer flex items-center gap-3"
                                            >
                                                <UsersIcon className="w-4 h-4 text-slate-400" />
                                                <div className="flex flex-col">
                                                    <span className="text-sm font-medium text-slate-900 dark:text-slate-100">{client.name}</span>
                                                    {client.email && <span className="text-xs text-slate-500 dark:text-slate-400">{client.email}</span>}
                                                </div>
                                            </li>
                                        ))}
                                    </ul>
                                </div>
                            )}

                            {filteredCategories.length > 0 && (
                                <div>
                                    <div className="bg-slate-50 dark:bg-slate-700/50 px-4 py-1 text-xs font-semibold text-slate-500 dark:text-slate-400 uppercase tracking-wider">
                                        {t('categories' as any) || 'Categories'}
                                    </div>
                                    <ul>
                                        {filteredCategories.map(category => (
                                            <li 
                                                key={category.id}
                                                onClick={() => handleSelect('category', category.id)}
                                                className="px-4 py-2 hover:bg-slate-100 dark:hover:bg-slate-700 cursor-pointer flex items-center gap-3"
                                            >
                                                <TagIcon className="w-4 h-4 text-slate-400" />
                                                <span className="text-sm font-medium text-slate-900 dark:text-slate-100">{category.name}</span>
                                            </li>
                                        ))}
                                    </ul>
                                </div>
                            )}
                        </div>
                    )}
                </div>
            )}
        </div>
    );
};
