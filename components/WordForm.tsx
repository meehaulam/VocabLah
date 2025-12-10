import React, { useState } from 'react';
import { PlusCircle } from 'lucide-react';

interface WordFormProps {
  onAdd: (word: string, meaning: string) => void;
}

export const WordForm: React.FC<WordFormProps> = ({ onAdd }) => {
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
    setWord('');
    setMeaning('');
    setError('');
  };

  return (
    <form 
      onSubmit={handleSubmit} 
      className="bg-white dark:bg-dark-surface rounded-xl shadow-md p-6 border border-gray-100 dark:border-dark-border transition-all duration-300 hover:shadow-lg"
    >
      <div className="space-y-4">
        <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
          <div className="space-y-1">
            <label htmlFor="word" className="block text-sm font-semibold text-gray-700 dark:text-dark-text-sec">
              Word
            </label>
            <input
              type="text"
              id="word"
              value={word}
              onChange={(e) => setWord(e.target.value)}
              placeholder="e.g. Ephemeral"
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
              placeholder="e.g. Lasting for a very short time"
              className="w-full px-4 py-3 rounded-lg bg-gray-50 dark:bg-dark-bg border border-gray-200 dark:border-dark-border focus:bg-white dark:focus:bg-dark-surface focus:border-primary focus:ring-2 focus:ring-primary/20 outline-none transition-all placeholder:text-gray-400 text-dark dark:text-dark-text"
            />
          </div>
        </div>

        {error && (
          <p className="text-red-500 text-sm font-medium animate-pulse">
            {error}
          </p>
        )}

        <button
          type="submit"
          className="w-full flex items-center justify-center space-x-2 bg-primary hover:bg-primary-hover text-white font-semibold py-3 px-6 rounded-lg transition-colors duration-200 shadow-sm active:transform active:scale-[0.99]"
        >
          <PlusCircle className="w-5 h-5" />
          <span>Add to List</span>
        </button>
      </div>
    </form>
  );
};