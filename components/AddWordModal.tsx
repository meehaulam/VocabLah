import React, { useState } from 'react';
import { PlusCircle, X } from 'lucide-react';

interface AddWordModalProps {
  onAdd: (word: string, meaning: string) => void;
  onCancel: () => void;
}

export const AddWordModal: React.FC<AddWordModalProps> = ({ onAdd, onCancel }) => {
  const [word, setWord] = useState('');
  const [meaning, setMeaning] = useState('');
  const [error, setError] = useState('');

  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    
    if (!word.trim()) {
      setError('Please enter a word.');
      return;
    }
    if (!meaning.trim()) {
      setError('Please enter a meaning.');
      return;
    }

    onAdd(word.trim(), meaning.trim());
  };

  return (
    <div className="fixed inset-0 z-[100] flex items-center justify-center p-4 bg-black/50 backdrop-blur-sm animate-in fade-in duration-200">
      <div className="bg-white dark:bg-dark-surface rounded-xl shadow-xl w-full max-w-md overflow-hidden animate-in zoom-in-95 duration-200 border border-gray-100 dark:border-dark-border">
        
        {/* Header */}
        <div className="px-6 py-4 border-b border-gray-100 dark:border-dark-border flex items-center justify-between">
          <h3 className="text-lg font-bold text-dark dark:text-dark-text">Add New Word</h3>
          <button 
            onClick={onCancel}
            className="text-gray-400 hover:text-gray-600 dark:hover:text-gray-200 transition-colors"
          >
            <X className="w-5 h-5" />
          </button>
        </div>

        {/* Form */}
        <form onSubmit={handleSubmit} className="p-6 space-y-4">
          <div className="space-y-1">
            <label htmlFor="word" className="block text-sm font-semibold text-gray-700 dark:text-dark-text-sec">
              Word
            </label>
            <input
              type="text"
              id="word"
              value={word}
              onChange={(e) => setWord(e.target.value)}
              placeholder="e.g. Serendipity"
              autoFocus
              className="w-full px-4 py-3 rounded-lg bg-gray-50 dark:bg-dark-bg border border-gray-200 dark:border-dark-border focus:bg-white dark:focus:bg-dark-surface focus:border-primary focus:ring-2 focus:ring-primary/20 outline-none transition-all placeholder:text-gray-400 text-dark dark:text-dark-text"
            />
          </div>
          
          <div className="space-y-1">
            <label htmlFor="meaning" className="block text-sm font-semibold text-gray-700 dark:text-dark-text-sec">
              Meaning
            </label>
            <input
              type="text"
              id="meaning"
              value={meaning}
              onChange={(e) => setMeaning(e.target.value)}
              placeholder="e.g. Finding something good without looking for it"
              className="w-full px-4 py-3 rounded-lg bg-gray-50 dark:bg-dark-bg border border-gray-200 dark:border-dark-border focus:bg-white dark:focus:bg-dark-surface focus:border-primary focus:ring-2 focus:ring-primary/20 outline-none transition-all placeholder:text-gray-400 text-dark dark:text-dark-text"
            />
          </div>

          {error && (
            <p className="text-red-500 text-sm font-medium animate-pulse">
              {error}
            </p>
          )}

          <div className="pt-2">
            <button
              type="submit"
              className="w-full flex items-center justify-center gap-2 bg-primary hover:bg-primary-hover text-white font-semibold py-3 px-6 rounded-lg transition-colors duration-200 shadow-sm active:transform active:scale-[0.99]"
            >
              <PlusCircle className="w-5 h-5" />
              <span>Add to Collection</span>
            </button>
          </div>
        </form>
      </div>
    </div>
  );
};