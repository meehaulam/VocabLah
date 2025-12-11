import React, { useState, useMemo, useEffect } from 'react';
import { VocabWord, Collection } from '../types';
import { WordList } from './WordList';
import { EditWordModal } from './EditWordModal';
import { ArrowUpDown, Search, X, Plus, Filter } from 'lucide-react';

type SortOption = 'newest' | 'alphabetical' | 'oldest';
type FilterOption = 'all' | 'learning' | 'mastered';

interface WordBankProps {
  words: VocabWord[];
  collections: Collection[];
  initialFilter: FilterOption;
  onAdd: () => void;
  onEdit: (id: number, word: string, meaning: string, collectionId: string | null) => void;
  onDelete: (id: number) => void;
  onToggleMastered: (id: number) => void;
  onRequestCreateCollection: () => void;
  lastCreatedCollectionId: string | null;
}

export const WordBank: React.FC<WordBankProps> = ({ 
  words, 
  collections,
  initialFilter,
  onAdd, 
  onEdit, 
  onDelete, 
  onToggleMastered,
  onRequestCreateCollection,
  lastCreatedCollectionId
}) => {
  const [filter, setFilter] = useState<FilterOption>(initialFilter);
  const [sortOption, setSortOption] = useState<SortOption>('newest');
  const [searchQuery, setSearchQuery] = useState('');
  const [editingWord, setEditingWord] = useState<VocabWord | null>(null);

  // Sync internal filter state if prop changes (deep linking)
  useEffect(() => {
    setFilter(initialFilter);
  }, [initialFilter]);

  const filteredAndSortedWords = useMemo(() => {
    let result = [...words];

    // 1. Status Filter
    if (filter === 'learning') {
      result = result.filter(w => !w.mastered);
    } else if (filter === 'mastered') {
      result = result.filter(w => w.mastered);
    }

    // 2. Search Filter
    if (searchQuery.trim()) {
      const query = searchQuery.toLowerCase().trim();
      result = result.filter(
        w => w.word.toLowerCase().includes(query) || w.meaning.toLowerCase().includes(query)
      );
    }

    // 3. Sort
    if (sortOption === 'alphabetical') {
      return result.sort((a, b) => a.word.localeCompare(b.word));
    }
    if (sortOption === 'oldest') {
        return result.sort((a, b) => a.createdAt - b.createdAt);
    }
    // Default newest
    return result.sort((a, b) => b.createdAt - a.createdAt);
  }, [words, filter, sortOption, searchQuery]);

  const handleSaveEdit = (id: number, word: string, meaning: string, collectionId: string | null) => {
    onEdit(id, word, meaning, collectionId);
    setEditingWord(null);
  };

  // Counts for tabs
  const countLearning = words.filter(w => !w.mastered).length;
  const countMastered = words.filter(w => w.mastered).length;
  const countAll = words.length;

  return (
    <div className="flex flex-col h-full gap-4 animate-in fade-in duration-500">
      
      {/* 1. Header with Add Button */}
      <div className="flex items-center justify-between flex-shrink-0 pt-2">
        <h2 className="text-xl font-bold text-dark dark:text-dark-text">Word Bank</h2>
        <button
          onClick={onAdd}
          className="flex items-center gap-1.5 bg-primary hover:bg-primary-hover text-white px-3 py-1.5 rounded-lg text-sm font-semibold transition-colors shadow-sm active:scale-95"
        >
          <Plus className="w-4 h-4" />
          Add Word
        </button>
      </div>

      {/* 2. Filter Chips */}
      <div className="flex gap-2 overflow-x-auto pb-1 flex-shrink-0 no-scrollbar">
        <button
          onClick={() => setFilter('learning')}
          className={`flex-shrink-0 px-3 py-1.5 rounded-full text-xs font-semibold transition-colors border ${
            filter === 'learning'
              ? 'bg-primary text-white border-primary'
              : 'bg-white dark:bg-dark-surface text-gray-600 dark:text-gray-300 border-gray-200 dark:border-dark-border hover:border-primary/50'
          }`}
        >
          🔴 Need Review ({countLearning})
        </button>
        <button
          onClick={() => setFilter('mastered')}
          className={`flex-shrink-0 px-3 py-1.5 rounded-full text-xs font-semibold transition-colors border ${
            filter === 'mastered'
              ? 'bg-primary text-white border-primary'
              : 'bg-white dark:bg-dark-surface text-gray-600 dark:text-gray-300 border-gray-200 dark:border-dark-border hover:border-primary/50'
          }`}
        >
          ✅ Mastered ({countMastered})
        </button>
        <button
          onClick={() => setFilter('all')}
          className={`flex-shrink-0 px-3 py-1.5 rounded-full text-xs font-semibold transition-colors border ${
            filter === 'all'
              ? 'bg-primary text-white border-primary'
              : 'bg-white dark:bg-dark-surface text-gray-600 dark:text-gray-300 border-gray-200 dark:border-dark-border hover:border-primary/50'
          }`}
        >
          📖 All ({countAll})
        </button>
      </div>

      {/* 3. Search & Sort Bar */}
      <div className="flex gap-2 flex-shrink-0">
         <div className="relative flex-1">
            <div className="absolute inset-y-0 left-0 flex items-center pl-3 pointer-events-none text-gray-400">
              <Search className="w-4 h-4" />
            </div>
            <input
              type="text"
              placeholder="Search words..."
              value={searchQuery}
              onChange={(e) => setSearchQuery(e.target.value)}
              className="w-full pl-9 pr-9 py-2 bg-white dark:bg-dark-surface border border-gray-200 dark:border-dark-border rounded-lg text-sm text-dark dark:text-dark-text placeholder:text-gray-400 focus:outline-none focus:border-primary focus:ring-2 focus:ring-primary/20 transition-all shadow-sm"
            />
            {searchQuery && (
              <button
                onClick={() => setSearchQuery('')}
                className="absolute inset-y-0 right-0 flex items-center pr-3 text-gray-400 hover:text-gray-600 dark:hover:text-gray-200"
              >
                <X className="w-4 h-4" />
              </button>
            )}
          </div>

          <div className="relative">
             <div className="absolute inset-y-0 left-0 flex items-center pl-2 pointer-events-none text-gray-400">
                  <ArrowUpDown className="w-3.5 h-3.5" />
             </div>
             <select 
                value={sortOption}
                onChange={(e) => setSortOption(e.target.value as SortOption)}
                className="h-full pl-8 pr-8 appearance-none bg-white dark:bg-dark-surface border border-gray-200 dark:border-dark-border rounded-lg text-xs font-medium text-gray-600 dark:text-dark-text focus:outline-none focus:border-primary focus:ring-2 focus:ring-primary/20 shadow-sm transition-all"
             >
                <option value="newest">Newest</option>
                <option value="oldest">Oldest</option>
                <option value="alphabetical">A-Z</option>
             </select>
          </div>
      </div>
      
      {/* 4. Scrollable List */}
      <div className="flex-1 overflow-y-auto -mx-2 px-2 custom-scrollbar pb-32 md:pb-48">
        {filteredAndSortedWords.length === 0 ? (
           <div className="flex flex-col items-center justify-center py-16 text-center text-gray-500 dark:text-dark-text-sec">
              {searchQuery ? (
                <>
                  <Search className="w-8 h-8 mb-3 opacity-50" />
                  <p>No matches for "{searchQuery}"</p>
                  <button onClick={() => setSearchQuery('')} className="mt-2 text-primary hover:underline text-sm">Clear Search</button>
                </>
              ) : (
                <>
                  <Filter className="w-8 h-8 mb-3 opacity-50" />
                  <p>No words in this filter.</p>
                  {filter !== 'all' && (
                    <button onClick={() => setFilter('all')} className="mt-2 text-primary hover:underline text-sm">View All Words</button>
                  )}
                </>
              )}
           </div>
        ) : (
          <WordList 
            words={filteredAndSortedWords} 
            onEdit={setEditingWord}
            onDelete={onDelete}
            onToggleMastered={onToggleMastered}
          />
        )}
      </div>

      {/* Edit Modal */}
      {editingWord && (
        <EditWordModal 
          word={editingWord} 
          onSave={handleSaveEdit} 
          onCancel={() => setEditingWord(null)}
          collections={collections}
          onRequestCreateCollection={onRequestCreateCollection}
          lastCreatedCollectionId={lastCreatedCollectionId}
        />
      )}
    </div>
  );
};