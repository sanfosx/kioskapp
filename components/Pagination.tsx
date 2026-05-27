import React, { useContext } from 'react';
import { ChevronLeftIcon, ChevronRightIcon, ChevronsLeftIcon, ChevronsRightIcon } from './icons';
import { LanguageContext } from '../App';

interface PaginationProps {
  currentPage: number;
  totalPages: number;
  onPageChange: (page: number) => void;
  itemsPerPage: number;
  totalItems: number;
}

const Pagination: React.FC<PaginationProps> = ({
  currentPage,
  totalPages,
  onPageChange,
  itemsPerPage,
  totalItems,
}) => {
  const { t } = useContext(LanguageContext);
  if (totalPages <= 1) return null;

  const startItem = (currentPage - 1) * itemsPerPage + 1;
  const endItem = Math.min(currentPage * itemsPerPage, totalItems);
  
  const getPageNumbers = () => {
    const pageNumbers = [];
    if (totalPages <= 5) {
      for (let i = 1; i <= totalPages; i++) {
        pageNumbers.push(i);
      }
    } else {
      if (currentPage <= 3) {
        pageNumbers.push(1, 2, 3, '...', totalPages);
      } else if (currentPage >= totalPages - 2) {
        pageNumbers.push(1, '...', totalPages - 2, totalPages - 1, totalPages);
      } else {
        pageNumbers.push(1, '...', currentPage - 1, currentPage, currentPage + 1, '...', totalPages);
      }
    }
    return pageNumbers;
  };
  
  const pages = getPageNumbers();

  return (
    <div className="flex items-center justify-between px-4 py-3 sm:px-6 bg-white dark:bg-slate-800 border-t border-slate-200 dark:border-slate-700 rounded-b-xl">
      <div className="flex-1 flex justify-between sm:hidden">
        <button
          onClick={() => onPageChange(currentPage - 1)}
          disabled={currentPage === 1}
          className="relative inline-flex items-center px-4 py-2 border border-slate-300 dark:border-slate-600 text-sm font-medium rounded-md text-slate-700 dark:text-slate-200 bg-white dark:bg-slate-800 hover:bg-slate-50 dark:hover:bg-slate-700 disabled:opacity-50"
        >
          {t('previous')}
        </button>
        <button
          onClick={() => onPageChange(currentPage + 1)}
          disabled={currentPage === totalPages}
          className="relative ml-3 inline-flex items-center px-4 py-2 border border-slate-300 dark:border-slate-600 text-sm font-medium rounded-md text-slate-700 dark:text-slate-200 bg-white dark:bg-slate-800 hover:bg-slate-50 dark:hover:bg-slate-700 disabled:opacity-50"
        >
          {t('next')}
        </button>
      </div>
      <div className="hidden sm:flex-1 sm:flex sm:items-center sm:justify-between">
        <div>
          <p className="text-sm text-slate-700 dark:text-slate-400">
            {t('showing')} <span className="font-medium">{startItem}</span> {t('to')} <span className="font-medium">{endItem}</span> {t('of')}{' '}
            <span className="font-medium">{totalItems}</span> {t('results')}
          </p>
        </div>
        <div>
          <nav className="relative z-0 inline-flex rounded-md shadow-sm -space-x-px" aria-label="Pagination">
            <button
              onClick={() => onPageChange(1)}
              disabled={currentPage === 1}
              className="relative inline-flex items-center px-2 py-2 rounded-l-md border border-slate-300 dark:border-slate-600 bg-white dark:bg-slate-800 text-sm font-medium text-slate-500 dark:text-slate-400 hover:bg-slate-50 dark:hover:bg-slate-700 disabled:opacity-50"
            >
              <span className="sr-only">{t('first')}</span>
              <ChevronsLeftIcon className="h-5 w-5" />
            </button>
            <button
              onClick={() => onPageChange(currentPage - 1)}
              disabled={currentPage === 1}
              className="relative inline-flex items-center px-2 py-2 border border-slate-300 dark:border-slate-600 bg-white dark:bg-slate-800 text-sm font-medium text-slate-500 dark:text-slate-400 hover:bg-slate-50 dark:hover:bg-slate-700 disabled:opacity-50"
            >
              <span className="sr-only">{t('previous')}</span>
              <ChevronLeftIcon className="h-5 w-5" />
            </button>
            
            {pages.map((page, index) =>
              typeof page === 'number' ? (
                <button
                  key={index}
                  onClick={() => onPageChange(page)}
                  className={`relative inline-flex items-center px-4 py-2 border text-sm font-medium ${
                    page === currentPage
                      ? 'z-10 bg-primary-50 border-primary-500 text-primary-600 dark:bg-slate-700 dark:border-primary-500'
                      : 'bg-white dark:bg-slate-800 border-slate-300 dark:border-slate-600 text-slate-500 dark:text-slate-400 hover:bg-slate-50 dark:hover:bg-slate-700'
                  }`}
                >
                  {page}
                </button>
              ) : (
                <span key={index} className="relative inline-flex items-center px-4 py-2 border border-slate-300 dark:border-slate-600 bg-white dark:bg-slate-800 text-sm font-medium text-slate-700 dark:text-slate-200">
                  ...
                </span>
              )
            )}

            <button
              onClick={() => onPageChange(currentPage + 1)}
              disabled={currentPage === totalPages}
              className="relative inline-flex items-center px-2 py-2 border border-slate-300 dark:border-slate-600 bg-white dark:bg-slate-800 text-sm font-medium text-slate-500 dark:text-slate-400 hover:bg-slate-50 dark:hover:bg-slate-700 disabled:opacity-50"
            >
              <span className="sr-only">{t('next')}</span>
              <ChevronRightIcon className="h-5 w-5" />
            </button>
            <button
              onClick={() => onPageChange(totalPages)}
              disabled={currentPage === totalPages}
              className="relative inline-flex items-center px-2 py-2 rounded-r-md border border-slate-300 dark:border-slate-600 bg-white dark:bg-slate-800 text-sm font-medium text-slate-500 dark:text-slate-400 hover:bg-slate-50 dark:hover:bg-slate-700 disabled:opacity-50"
            >
              <span className="sr-only">{t('last')}</span>
              <ChevronsRightIcon className="h-5 w-5" />
            </button>
          </nav>
        </div>
      </div>
    </div>
  );
};

export default Pagination;
