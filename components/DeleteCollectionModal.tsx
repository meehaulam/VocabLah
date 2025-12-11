import React, { useState } from 'react';
import { Collection } from '../types';
import { AlertTriangle } from 'lucide-react';

interface DeleteCollectionModalProps {
  isOpen: boolean;
  onClose: () => void;
  onDelete: (deleteWords: boolean) => void;
  collection: Collection | null;
  wordCount: number;
}

export const DeleteCollectionModal: React.FC<DeleteCollectionModalProps> = ({
  isOpen,
  onClose,
  onDelete,
  collection,
  wordCount,
}) => {
  const [step, setStep] = useState<1 | 2>(1);
  const [deleteOption, setDeleteOption] = useState<'keep' | 'delete'>('keep');
  const [confirmInput, setConfirmInput] = useState('');

  if (!isOpen || !collection) return null;

  const handleStep1Submit = () => {
    if (deleteOption === 'keep') {
      onDelete(false); // False means don't delete words, just move them
    } else {
      setStep(2);
    }
  };

  const handleStep2Submit = () => {
    if (confirmInput === 'DELETE') {
      onDelete(true); // True means delete words permanently
    }
  };

  // Reset state when closing
  const handleClose = () => {
    setStep(1);
    setDeleteOption('keep');
    setConfirmInput('');
    onClose();
  };

  return (
    <div className="fixed inset-0 z-[100] flex items-center justify-center p-4 bg-black/50 backdrop-blur-sm animate-in fade-in duration-200">
      <div className="bg-white dark:bg-dark-surface rounded-xl shadow-2xl w-full max-w-sm overflow-hidden animate-in zoom-in-95 duration-200 border border-gray-100 dark:border-dark-border">
        
        {step === 1 ? (
          // STEP 1: Choose Action
          <div className="p-6">
            <div className="flex items-center gap-3 mb-4 text-red-600 dark:text-red-400">
              <AlertTriangle className="w-6 h-6" />
              <h3 className="text-lg font-bold">Delete "{collection.name}"?</h3>
            </div>
            
            <p className="text-gray-600 dark:text-gray-300 mb-4">
              This collection has <span className="font-bold">{wordCount}</span> words.
              <br/>
              What should happen to them?
            </p>

            <div className="space-y-3 mb-6">
              <label className={`flex items-start gap-3 p-3 rounded-lg border cursor-pointer transition-colors ${deleteOption === 'keep' ? 'bg-blue-50 border-blue-200 dark:bg-blue-900/20 dark:border-blue-800' : 'bg-gray-50 border-gray-200 dark:bg-dark-bg dark:border-dark-border hover:bg-gray-100 dark:hover:bg-gray-800'}`}>
                <input 
                  type="radio" 
                  name="deleteOption" 
                  value="keep" 
                  checked={deleteOption === 'keep'} 
                  onChange={() => setDeleteOption('keep')}
                  className="mt-1 w-4 h-4 text-primary focus:ring-primary"
                />
                <div>
                  <span className="block text-sm font-bold text-dark dark:text-dark-text">Keep words</span>
                  <span className="block text-xs text-gray-500 dark:text-gray-400">Move them to "All Words"</span>
                </div>
              </label>

              <label className={`flex items-start gap-3 p-3 rounded-lg border cursor-pointer transition-colors ${deleteOption === 'delete' ? 'bg-red-50 border-red-200 dark:bg-red-900/20 dark:border-red-800' : 'bg-gray-50 border-gray-200 dark:bg-dark-bg dark:border-dark-border hover:bg-gray-100 dark:hover:bg-gray-800'}`}>
                <input 
                  type="radio" 
                  name="deleteOption" 
                  value="delete" 
                  checked={deleteOption === 'delete'} 
                  onChange={() => setDeleteOption('delete')}
                  className="mt-1 w-4 h-4 text-red-600 focus:ring-red-600"
                />
                <div>
                  <span className="block text-sm font-bold text-red-600 dark:text-red-400">Delete words permanently ⚠️</span>
                  <span className="block text-xs text-gray-500 dark:text-gray-400">This cannot be undone</span>
                </div>
              </label>
            </div>

            <div className="flex gap-3">
              <button
                onClick={handleClose}
                className="flex-1 py-2.5 rounded-lg border border-gray-300 dark:border-dark-border text-gray-700 dark:text-gray-300 font-medium hover:bg-gray-50 dark:hover:bg-dark-bg transition-colors"
              >
                Cancel
              </button>
              <button
                onClick={handleStep1Submit}
                className="flex-1 py-2.5 rounded-lg bg-red-600 hover:bg-red-700 text-white font-medium shadow-sm transition-colors"
              >
                Delete Collection
              </button>
            </div>
          </div>
        ) : (
          // STEP 2: Confirm Permanent Deletion
          <div className="p-6 text-center">
            <div className="w-12 h-12 bg-red-100 dark:bg-red-900/30 rounded-full flex items-center justify-center mx-auto mb-4">
               <AlertTriangle className="w-6 h-6 text-red-600 dark:text-red-400" />
            </div>
            
            <h3 className="text-lg font-bold text-dark dark:text-dark-text mb-2 uppercase text-red-600 dark:text-red-400">
              Delete {wordCount} Words Permanently?
            </h3>
            
            <div className="text-sm text-gray-500 dark:text-dark-text-sec mb-6 space-y-2 text-left bg-red-50 dark:bg-red-900/10 p-4 rounded-lg border border-red-100 dark:border-red-900/30">
               <p>This will delete:</p>
               <ul className="list-disc list-inside">
                 <li>The <strong>"{collection.name}"</strong> collection</li>
                 <li>ALL <strong>{wordCount}</strong> words inside it</li>
               </ul>
               <p className="font-bold pt-2">This action CANNOT be undone!</p>
            </div>

            <div className="mb-6">
              <p className="text-sm font-semibold mb-2 text-dark dark:text-dark-text">Type "DELETE" to confirm:</p>
              <input 
                 type="text" 
                 value={confirmInput}
                 onChange={(e) => setConfirmInput(e.target.value)}
                 className={`w-full p-3 text-center tracking-widest font-bold border-2 rounded-lg outline-none transition-all ${
                   confirmInput === 'DELETE' 
                     ? 'border-red-500 text-red-600 bg-red-50 dark:bg-red-900/20' 
                     : 'border-gray-200 dark:border-dark-border dark:bg-dark-bg'
                 }`}
                 placeholder="DELETE"
              />
            </div>

            <div className="flex gap-3">
              <button
                onClick={handleClose}
                className="flex-1 py-2.5 rounded-lg border border-gray-300 dark:border-dark-border text-gray-700 dark:text-gray-300 font-medium hover:bg-gray-50 dark:hover:bg-dark-bg transition-colors"
              >
                Cancel
              </button>
              <button
                onClick={handleStep2Submit}
                disabled={confirmInput !== 'DELETE'}
                className={`flex-1 py-2.5 rounded-lg font-medium shadow-sm transition-colors ${
                   confirmInput === 'DELETE'
                    ? 'bg-red-600 hover:bg-red-700 text-white'
                    : 'bg-gray-200 dark:bg-gray-700 text-gray-400 dark:text-gray-500 cursor-not-allowed'
                }`}
              >
                Delete Everything
              </button>
            </div>
          </div>
        )}
      </div>
    </div>
  );
};