import React, { useState, useEffect } from 'react';
import { VocabWord, Collection } from '../types';
import { Save, X } from 'lucide-react';

interface EditWordModalProps {
  word: VocabWord;
  onSave: (id: number, word: string, meaning: string, collectionId: string | null) => void;
  onCancel: () => void;
  collections: Collection[];
  onRequestCreateCollection: () => void;
  lastCreatedCollectionId: string | null;
}

export const EditWordModal: React.FC<EditWordModalProps> = ({ 
  word: initialWord, 
  onSave, 
  onCancel, 
  collections,
  onRequestCreateCollection,
  lastCreatedCollectionId
}) => {
  const [word, setWord] = useState(initialWord.word);
  const [meaning, setMeaning] = useState(initialWord.meaning);
  const [collectionId, setCollectionId] = useState<string>(initialWord.collectionId || ''); // '' for null
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

    onSave(initialWord.id, word.trim(), meaning.trim(), collectionId === '' ? null : collectionId);
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
      <div className="bg-white dark:bg-dark-surface rounded-xl shadow-xl w-full max-w-md overflow-hidden animate-in zoom-in-95 duration-200">
        
        {/* Header */}
        <div className="px-6 py-4 border-b border-gray-100 dark:border-dark-border flex items-center justify-between">
          <h3 className="text-lg font-bold text-dark dark:text-dark-text">Edit Word</h3>
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
            <label htmlFor="edit-word" className="block text-sm font-semibold text-gray-700 dark:text-dark-text-sec">
              Word
            </label>
            <input
              type="text"
              id="edit-word"
              value={word}
              onChange={(e) => setWord(e.target.value)}
              className="w-full px-4 py-3 rounded-lg bg-gray-50 dark:bg-dark-bg border border-gray-200 dark:border-dark-border focus:bg-white dark:focus:bg-dark-surface focus:border-primary focus:ring-2 focus:ring-primary/20 outline-none transition-all placeholder:text-gray-400 dark:text-dark-text"
            />
          </div>
          
          <div className="space-y-1">
            <label htmlFor="edit-meaning" className="block text-sm font-semibold text-gray-700 dark:text-dark-text-sec">
              Meaning
            </label>
            <input
              type="text"
              id="edit-meaning"
              value={meaning}
              onChange={(e) => setMeaning(e.target.value)}
              className="w-full px-4 py-3 rounded-lg bg-gray-50 dark:bg-dark-bg border border-gray-200 dark:border-dark-border focus:bg-white dark:focus:bg-dark-surface focus:border-primary focus:ring-2 focus:ring-primary/20 outline-none transition-all placeholder:text-gray-400 dark:text-dark-text"
            />
          </div>

          <div className="space-y-1">
            <label htmlFor="edit-collection" className="block text-sm font-semibold text-gray-700 dark:text-dark-text-sec">
              Collection <span className="text-gray-400 font-normal text-xs">(Optional)</span>
            </label>
            <select
              id="edit-collection"
              value={collectionId}
              onChange={handleCollectionChange}
              className="w-full px-4 py-3 rounded-lg bg-gray-50 dark:bg-dark-bg border border-gray-200 dark:border-dark-border focus:bg-white dark:focus:bg-dark-surface focus:border-primary focus:ring-2 focus:ring-primary/20 outline-none transition-all text-dark dark:text-dark-text cursor-pointer custom-select"
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
          </div>

          {error && (
            <p className="text-red-500 text-sm font-medium animate-pulse">
              {error}
            </p>
          )}

          <div className="flex gap-3 pt-2">
            <button
              type="button"
              onClick={onCancel}
              className="flex-1 px-4 py-2.5 rounded-lg border border-gray-200 dark:border-dark-border text-gray-600 dark:text-dark-text-sec font-medium hover:bg-gray-50 dark:hover:bg-dark-bg transition-colors"
            >
              Cancel
            </button>
            <button
              type="submit"
              className="flex-1 flex items-center justify-center gap-2 bg-primary hover:bg-primary-hover text-white font-semibold py-2.5 px-4 rounded-lg transition-colors shadow-sm"
            >
              <Save className="w-4 h-4" />
              <span>Save Changes</span>
            </button>
          </div>
        </form>
      </div>
    </div>
  );
};