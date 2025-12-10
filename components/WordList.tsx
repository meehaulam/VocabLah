import React from 'react';
import { VocabWord } from '../types';
import { WordCard } from './WordCard';
import { Inbox } from 'lucide-react';

interface WordListProps {
  words: VocabWord[];
  onEdit: (word: VocabWord) => void;
  onDelete: (id: number) => void;
  onToggleMastered: (id: number) => void;
}

export const WordList: React.FC<WordListProps> = ({ words, onEdit, onDelete, onToggleMastered }) => {
  if (words.length === 0) {
    return (
      <div className="flex flex-col items-center justify-center py-12 px-4 bg-white dark:bg-dark-surface rounded-xl shadow-sm border border-dashed border-gray-300 dark:border-dark-border transition-colors duration-300">
        <div className="bg-gray-50 dark:bg-dark-bg p-4 rounded-full mb-4">
          <Inbox className="w-8 h-8 text-gray-400" />
        </div>
        <h3 className="text-lg font-semibold text-gray-800 dark:text-dark-text mb-1">No words yet</h3>
        <p className="text-gray-500 dark:text-dark-text-sec text-center max-w-xs">
          Start building your vocabulary by adding a new word above!
        </p>
      </div>
    );
  }

  return (
    <div className="grid gap-4 sm:grid-cols-1">
      {words.map((word) => (
        <WordCard 
          key={word.id} 
          word={word} 
          onEdit={() => onEdit(word)}
          onDelete={onDelete} 
          onToggleMastered={onToggleMastered}
        />
      ))}
    </div>
  );
};