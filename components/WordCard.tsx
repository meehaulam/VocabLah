import React from 'react';
import { VocabWord } from '../types';
import { Trash2, CheckCircle2, Circle, Pencil } from 'lucide-react';

interface WordCardProps {
  word: VocabWord;
  onEdit: () => void;
  onDelete: (id: number) => void;
  onToggleMastered: (id: number) => void;
}

export const WordCard: React.FC<WordCardProps> = ({ word, onEdit, onDelete, onToggleMastered }) => {
  return (
    <div className={`
      group relative rounded-xl p-4 shadow-sm border transition-all duration-200
      ${word.mastered 
        ? 'border-green-200 bg-green-50/40 dark:bg-green-900/10 dark:border-green-900/30' 
        : 'bg-white dark:bg-dark-surface border-gray-100 dark:border-dark-border hover:border-blue-200 dark:hover:border-primary/30 hover:shadow-md'}
    `}>
      <div className="flex items-start justify-between gap-3">
        
        <div className="flex-1 min-w-0 pt-1">
          <div className="flex flex-wrap items-center gap-2 mb-1">
            <h3 className={`text-lg font-bold leading-tight ${word.mastered ? 'text-green-800 dark:text-green-400' : 'text-dark dark:text-dark-text'}`}>
              {word.word}
            </h3>
            {word.mastered && (
              <span className="inline-flex items-center px-2 py-0.5 rounded-full text-[10px] font-bold uppercase tracking-wider bg-green-100 text-green-700 border border-green-200 dark:bg-green-900/30 dark:text-green-400 dark:border-green-800">
                Mastered
              </span>
            )}
          </div>
          <p className={`text-sm sm:text-base leading-relaxed ${word.mastered ? 'text-gray-500 dark:text-gray-400' : 'text-gray-600 dark:text-dark-text-sec'}`}>
            {word.meaning}
          </p>
          <p className="text-[10px] text-gray-400 dark:text-gray-500 mt-2 font-medium">
            Added {new Date(word.createdAt).toLocaleDateString()}
          </p>
        </div>

        <div className="flex flex-col gap-2 shrink-0">
          <button
            type="button"
            onClick={(e) => {
              e.stopPropagation();
              onToggleMastered(word.id);
            }}
            title={word.mastered ? "Mark as unlearned" : "Mark as mastered"}
            className={`
              relative p-2 rounded-lg transition-all duration-200 border
              ${word.mastered 
                ? 'text-green-600 bg-green-100 border-green-200 dark:bg-green-900/20 dark:border-green-800 dark:text-green-400 hover:bg-green-200 dark:hover:bg-green-900/40 shadow-sm' 
                : 'text-gray-400 bg-white dark:bg-dark-bg border-gray-100 dark:border-dark-border hover:border-primary/30 hover:bg-blue-50 dark:hover:bg-primary/10 hover:text-primary'}
            `}
          >
            {word.mastered ? (
              <CheckCircle2 className="w-6 h-6" />
            ) : (
              <Circle className="w-6 h-6" />
            )}
          </button>

          <button
            type="button"
            onClick={(e) => {
              e.stopPropagation();
              onEdit();
            }}
            title="Edit word"
             className="p-2 rounded-lg text-gray-400 dark:text-gray-500 hover:bg-gray-100 dark:hover:bg-dark-bg hover:text-primary dark:hover:text-primary transition-colors duration-200 group-hover:opacity-100"
          >
            <Pencil className="w-5 h-5" />
          </button>
          
          <button
            type="button"
            onClick={(e) => {
              e.stopPropagation();
              onDelete(word.id);
            }}
            title="Delete word"
            className="p-2 rounded-lg text-gray-400 dark:text-gray-500 hover:bg-red-50 dark:hover:bg-red-900/20 hover:text-red-500 transition-colors duration-200 group-hover:opacity-100"
          >
            <Trash2 className="w-5 h-5" />
          </button>
        </div>

      </div>
    </div>
  );
};