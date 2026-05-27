import React, { Fragment, useContext } from 'react';
import { TriangleAlertIcon, XIcon } from './icons';
import { LanguageContext } from '../App';

interface ConfirmModalProps {
  isOpen: boolean;
  onClose: () => void;
  onConfirm: () => void;
  title: string;
  message: string;
}

const ConfirmModal: React.FC<ConfirmModalProps> = ({ isOpen, onClose, onConfirm, title, message }) => {
  const { t } = useContext(LanguageContext);
  if (!isOpen) return null;

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center p-4" aria-labelledby="modal-title" role="dialog" aria-modal="true">
      {/* Background overlay */}
      <div className="fixed inset-0 bg-black bg-opacity-75 transition-opacity" onClick={onClose}></div>

      {/* Modal panel */}
      <div className="relative bg-white dark:bg-slate-800 rounded-lg text-left overflow-hidden shadow-xl transform transition-all sm:my-8 sm:max-w-lg sm:w-full">
        <div className="bg-white dark:bg-slate-800 px-4 pt-5 pb-4 sm:p-6 sm:pb-4">
          <div className="sm:flex sm:items-start">
            <div className="mx-auto flex-shrink-0 flex items-center justify-center h-12 w-12 rounded-full bg-red-100 dark:bg-red-900/50 sm:mx-0 sm:h-10 sm:w-10">
              <TriangleAlertIcon className="h-6 w-6 text-red-600 dark:text-red-400" aria-hidden="true" />
            </div>
            <div className="mt-3 text-center sm:mt-0 sm:ml-4 sm:text-left">
              <h3 className="text-lg leading-6 font-bold text-slate-900 dark:text-slate-100" id="modal-title">
                {title}
              </h3>
              <div className="mt-2">
                <p className="text-sm text-slate-500 dark:text-slate-400">
                  {message}
                </p>
              </div>
            </div>
          </div>
        </div>
        <div className="bg-slate-50 dark:bg-slate-800/50 px-4 py-3 sm:px-6 sm:flex sm:flex-row-reverse">
          <button
            type="button"
            className="w-full inline-flex justify-center rounded-md border border-transparent shadow-sm px-4 py-2 bg-red-600 text-base font-medium text-white hover:bg-red-700 focus:outline-none focus:ring-2 focus:ring-offset-2 focus:ring-red-500 sm:ml-3 sm:w-auto sm:text-sm"
            onClick={() => {
              onConfirm();
              onClose();
            }}
          >
            {t('confirmDelete')}
          </button>
          <button
            type="button"
            className="mt-3 w-full inline-flex justify-center rounded-md border border-slate-300 dark:border-slate-600 shadow-sm px-4 py-2 bg-white dark:bg-slate-700 text-base font-medium text-slate-700 dark:text-slate-200 hover:bg-slate-50 dark:hover:bg-slate-600 focus:outline-none focus:ring-2 focus:ring-offset-2 focus:ring-primary-500 sm:mt-0 sm:w-auto sm:text-sm"
            onClick={onClose}
          >
            {t('cancel')}
          </button>
        </div>
      </div>
    </div>
  );
};

export default ConfirmModal;
