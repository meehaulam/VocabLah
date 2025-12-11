import React, { useState, useEffect } from 'react';
import { PlusCircle, X, ChevronDown } from 'lucide-react';
import { Collection } from '../types';

interface AddWordModalProps {
  onAdd: (word: string, meaning: string, collectionId: string | null) => void;
  onCancel: () => void;
  collections: Collection[];
  onRequestCreateCollection: () => void;
  lastCreatedCollectionId: string | null;
  initialCollectionId: string | null;
}

export const AddWordModal: React.FC<AddWordModalProps> = ({ 
  onAdd, 
  onCancel, 
  collections,
  onRequestCreateCollection,
  lastCreatedCollectionId,
  initialCollectionId
}) => {
  const [word, setWord] = useState('');
  const [meaning, setMeaning] = useState('');
  const [collectionId, setCollectionId] = useState<string>(initialCollectionId || ''); // '' represents null (All Words)
  const [error, setError] = useState('');
  const [isWaitingForNewCollection, setIsWaitingForNewCollection] = useState(false);

  const userCollections = collections.filter(c => c.type === 'user');

  // Auto-select newly created collection if we requested it
  useEffect(() => {
    if (isWaitingForNewCollection && lastCreatedCollectionId) {
      setCollectionId(lastCreatedCollectionId);
      setIsWaitingForNewCollection(false);
    }
  }, [lastCreatedCollectionId, isWaitingForNewCollection]);

  // If initialCollectionId changes (though usually it's set on mount), update state
  useEffect(() => {
    if (initialCollectionId !== null && initialCollectionId !== undefined) {
      setCollectionId(initialCollectionId);
    }
  }, [initialCollectionId]);

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

    onAdd(word.trim(), meaning.trim(), collectionId === '' ? null : collectionId);
  };

  const handleCollectionChange = (e: React.ChangeEvent<HTMLSelectElement>) => {
    const val = e.target.value;
    if (val === '__CREATE_NEW__') {
      setIsWaitingForNewCollection(true);
      onRequestCreateCollection();
      // Dropdown will close, we don't update collectionId here to keep previous selection 
      // until the new one is created.
    } else {
      setCollectionId(val);
    }
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

          <div className="space-y-1">
            <label htmlFor="collection" className="block text-sm font-semibold text-gray-700 dark:text-dark-text-sec">
              Collection <span className="text-gray-400 font-normal text-xs">(Optional)</span>
            </label>
            <div className="relative">
              <select
                id="collection"
                value={collectionId}
                onChange={handleCollectionChange}
                className="w-full px-4 py-3 pr-10 rounded-lg bg-gray-50 dark:bg-dark-bg border border-gray-200 dark:border-dark-border focus:bg-white dark:focus:bg-dark-surface focus:border-primary focus:ring-2 focus:ring-primary/20 outline-none transition-all text-dark dark:text-dark-text appearance-none cursor-pointer"
              >
                <option value="">None (All Words)</option>
                <option disabled>──────────</option>
                {userCollections.map(c => (
                  <option key={c.id} value={c.id}>
                    {c.icon} {c.name}
                  </option>
                ))}
                <option disabled>──────────</option>
                <option value="__CREATE_NEW__" className="font-bold text-primary">+ Create New Collection</option>
              </select>
              <div className="absolute inset-y-0 right-0 flex items-center pr-3 pointer-events-none text-gray-500 dark:text-gray-400">
                <ChevronDown className="w-5 h-5" />
              </div>
            </div>
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