import React, { useState, useMemo, useEffect } from 'react';
import { Collection, VocabWord } from '../types';
import { WordList } from './WordList';
import { EditWordModal } from './EditWordModal';
import { ArrowLeft, Search, X, Plus, MoreVertical, PlayCircle, Pencil, Trash2, ArrowUpDown, Calendar, CheckCircle2 } from 'lucide-react';
import { isCardDue, getSRSStage } from '../utils/srs';

interface CollectionDetailViewProps {
  collection: Collection;
  words: VocabWord[];
  onBack: () => void;
  onAddWord: (collectionId: string | null) => void;
  onEditWord: (id: number, word: string, meaning: string, collectionId: string | null) => void;
  onDeleteWord: (id: number) => void;
  onToggleMastered: (id: number) => void;
  onReview: () => void;
  onEditCollection: (collection: Collection) => void;
  onDeleteCollection: (collection: Collection) => void;
  collections: Collection[];
  onRequestCreateCollection: () => void;
  lastCreatedCollectionId: string | null;
}

type SortOption = 'due-first' | 'newest' | 'oldest' | 'a-z' | 'z-a';
type FilterOption = 'all' | 'due' | 'learning' | 'mature';

export const CollectionDetailView: React.FC<CollectionDetailViewProps> = ({
  collection,
  words,
  onBack,
  onAddWord,
  onEditWord,
  onDeleteWord,
  onToggleMastered,
  onReview,
  onEditCollection,
  onDeleteCollection,
  collections,
  onRequestCreateCollection,
  lastCreatedCollectionId
}) => {
  const [searchQuery, setSearchQuery] = useState('');
  const [debouncedSearchQuery, setDebouncedSearchQuery] = useState('');
  const [sortOption, setSortOption] = useState<SortOption>('due-first');
  const [filterOption, setFilterOption] = useState<FilterOption>('all');
  const [editingWord, setEditingWord] = useState<VocabWord | null>(null);
  const [isMenuOpen, setIsMenuOpen] = useState(false);

  // Debounce search input
  useEffect(() => {
    const handler = setTimeout(() => {
      setDebouncedSearchQuery(searchQuery);
    }, 300);
    return () => clearTimeout(handler);
  }, [searchQuery]);

  // Filter words by collection
  const collectionWords = useMemo(() => {
    if (collection.id === 'all') {
      return words;
    }
    return words.filter(w => w.collectionId === collection.id);
  }, [words, collection.id]);

  // Calculate detailed stats
  const stats = useMemo(() => {
    const total = collectionWords.length;
    const due = collectionWords.filter(isCardDue).length;
    const learning = collectionWords.filter(w => w.repetitions > 0 && w.interval < 21).length;
    const mature = collectionWords.filter(w => w.interval >= 21).length;
    return { total, due, learning, mature };
  }, [collectionWords]);

  // Apply search, filter and sort
  const displayWords = useMemo(() => {
    let result = [...collectionWords];

    // Filter
    if (filterOption === 'due') {
      result = result.filter(isCardDue);
    } else if (filterOption === 'learning') {
      result = result.filter(w => w.repetitions > 0 && w.interval < 21);
    } else if (filterOption === 'mature') {
      result = result.filter(w => w.interval >= 21);
    }

    // Search
    if (debouncedSearchQuery.trim()) {
      const q = debouncedSearchQuery.toLowerCase().trim();
      result = result.filter(w => 
        w.word.toLowerCase().includes(q) || w.meaning.toLowerCase().includes(q)
      );
    }

    // Sort
    result.sort((a, b) => {
      switch (sortOption) {
        case 'due-first':
          const aDue = isCardDue(a);
          const bDue = isCardDue(b);
          if (aDue && !bDue) return -1;
          if (!aDue && bDue) return 1;
          // If both due or not due, sort by nextReviewDate
          return a.nextReviewDate.localeCompare(b.nextReviewDate);
        case 'newest': return b.createdAt - a.createdAt;
        case 'oldest': return a.createdAt - b.createdAt;
        case 'a-z': return a.word.localeCompare(b.word);
        case 'z-a': return b.word.localeCompare(a.word);
        default: return b.createdAt - a.createdAt;
      }
    });

    return result;
  }, [collectionWords, debouncedSearchQuery, sortOption, filterOption]);

  const handleSaveEdit = (id: number, word: string, meaning: string, collectionId: string | null) => {
    onEditWord(id, word, meaning, collectionId);
    setEditingWord(null);
  };

  return (
    <div className="flex flex-col h-full bg-background dark:bg-dark-bg text-dark dark:text-dark-text animate-in fade-in slide-in-from-right-4 duration-300">
      
      {/* Header */}
      <header className="sticky top-0 z-50 bg-white/80 dark:bg-dark-surface/80 backdrop-blur-md shadow-sm border-b border-gray-100 dark:border-dark-border px-4 py-3 flex items-center justify-between">
        <button 
          onClick={onBack}
          className="p-2 -ml-2 rounded-full hover:bg-gray-100 dark:hover:bg-dark-bg text-gray-600 dark:text-gray-300 transition-colors"
        >
          <ArrowLeft className="w-6 h-6" />
        </button>
        
        <div className="flex items-center gap-2">
           <span className="text-xl">{collection.icon}</span>
           <h1 className="text-lg font-bold truncate max-w-[180px] sm:max-w-[240px]">{collection.name}</h1>
        </div>

        <div className="relative">
          {collection.id !== 'all' ? (
             <button 
               onClick={() => setIsMenuOpen(!isMenuOpen)}
               className="p-2 -mr-2 rounded-full hover:bg-gray-100 dark:hover:bg-dark-bg text-gray-600 dark:text-gray-300 transition-colors"
             >
               <MoreVertical className="w-6 h-6" />
             </button>
          ) : (
            <div className="w-10"></div>
          )}

          {/* Menu Dropdown */}
          {isMenuOpen && (
            <>
              <div className="fixed inset-0 z-10" onClick={() => setIsMenuOpen(false)} />
              <div className="absolute right-0 top-10 z-20 w-48 bg-white dark:bg-dark-surface rounded-xl shadow-xl border border-gray-100 dark:border-dark-border py-1.5 animate-in fade-in zoom-in-95 duration-200 origin-top-right">
                <button 
                   onClick={() => {
                     setIsMenuOpen(false);
                     onEditCollection(collection);
                   }}
                   className="w-full text-left px-4 py-2.5 text-sm hover:bg-gray-50 dark:hover:bg-dark-bg transition-colors flex items-center gap-2 text-gray-700 dark:text-gray-300"
                >
                   <Pencil className="w-4 h-4" />
                   Edit Collection
                </button>
                <div className="h-px bg-gray-100 dark:bg-dark-border my-1" />
                <button 
                   onClick={() => {
                     setIsMenuOpen(false);
                     onDeleteCollection(collection);
                   }}
                   className="w-full text-left px-4 py-2.5 text-sm hover:bg-red-50 dark:hover:bg-red-900/10 transition-colors text-red-600 dark:text-red-400 flex items-center gap-2"
                >
                   <Trash2 className="w-4 h-4" />
                   Delete Collection
                </button>
              </div>
            </>
          )}
        </div>
      </header>

      <div className="flex-1 overflow-y-auto px-4 pb-4 pt-2 custom-scrollbar">
        
        {/* Header SRS Stats */}
        <div className="flex flex-wrap items-center gap-x-3 gap-y-1 text-xs sm:text-sm text-gray-500 dark:text-dark-text-sec mb-4 px-1">
          <span className="font-medium text-dark dark:text-dark-text">{stats.total} words</span>
          <span className="text-gray-300 dark:text-gray-600">•</span>
          <span className={`${stats.due > 0 ? 'text-red-500 font-bold' : ''}`}>
             {stats.due > 0 ? `${stats.due} due today` : '0 due today'}
          </span>
          <span className="text-gray-300 dark:text-gray-600">•</span>
          <span className="text-orange-500">{stats.learning} learning</span>
          <span className="text-gray-300 dark:text-gray-600">•</span>
          <span className="text-green-500">{stats.mature} mature</span>
        </div>

        {/* Action Buttons */}
        <div className="space-y-3 mb-4">
          {stats.due > 0 && (
            <button
              onClick={onReview}
              className="w-full flex items-center justify-center gap-3 text-white font-bold py-4 px-6 rounded-xl transition-all active:scale-[0.98] shadow-lg"
              style={{
                background: 'linear-gradient(135deg, #A855F7 0%, #9333EA 100%)',
                boxShadow: '0 4px 16px rgba(168, 85, 247, 0.4)',
                fontSize: '18px'
              }}
              onMouseOver={(e) => {
                e.currentTarget.style.transform = 'translateY(-2px)';
                e.currentTarget.style.boxShadow = '0 6px 20px rgba(168, 85, 247, 0.5)';
              }}
              onMouseOut={(e) => {
                e.currentTarget.style.transform = '';
                e.currentTarget.style.boxShadow = '0 4px 16px rgba(168, 85, 247, 0.4)';
              }}
            >
              <span style={{ fontSize: '20px' }}>▶️</span>
              Review {collection.name} ({stats.due} due)
            </button>
          )}

          <button
            onClick={() => onAddWord(collection.id === 'all' ? null : collection.id)}
            className={`w-full flex items-center justify-center gap-2 py-3.5 px-5 rounded-xl border-2 transition-all active:scale-[0.98] ${
               stats.due > 0
               ? 'bg-transparent border-primary text-primary hover:bg-purple-50 dark:hover:bg-purple-900/10 font-semibold'
               : 'bg-primary hover:bg-primary-hover border-transparent text-white shadow-lg shadow-blue-500/20 font-bold'
            }`}
            style={stats.due > 0 ? { fontSize: '16px' } : { fontSize: '18px' }}
          >
            <Plus className="w-5 h-5" />
            Add Word to {collection.name}
          </button>
        </div>

        {/* Filter Chips */}
        <div className="flex gap-2 overflow-x-auto pb-2 mb-2 no-scrollbar">
           <button
             onClick={() => setFilterOption('all')}
             className={`flex-shrink-0 px-3 py-1.5 rounded-full text-xs font-semibold transition-colors border ${
               filterOption === 'all'
                 ? 'bg-gray-800 text-white border-gray-800 dark:bg-gray-200 dark:text-dark-bg'
                 : 'bg-white dark:bg-dark-surface text-gray-600 dark:text-gray-300 border-gray-200 dark:border-dark-border'
             }`}
           >
             📖 All ({stats.total})
           </button>
           <button
             onClick={() => setFilterOption('due')}
             className={`flex-shrink-0 px-3 py-1.5 rounded-full text-xs font-semibold transition-colors border ${
               filterOption === 'due'
                 ? 'bg-red-500 text-white border-red-500'
                 : 'bg-white dark:bg-dark-surface text-gray-600 dark:text-gray-300 border-gray-200 dark:border-dark-border'
             }`}
           >
             📅 Due Today ({stats.due})
           </button>
           <button
             onClick={() => setFilterOption('learning')}
             className={`flex-shrink-0 px-3 py-1.5 rounded-full text-xs font-semibold transition-colors border ${
               filterOption === 'learning'
                 ? 'bg-orange-500 text-white border-orange-500'
                 : 'bg-white dark:bg-dark-surface text-gray-600 dark:text-gray-300 border-gray-200 dark:border-dark-border'
             }`}
           >
             📚 Learning ({stats.learning})
           </button>
           <button
             onClick={() => setFilterOption('mature')}
             className={`flex-shrink-0 px-3 py-1.5 rounded-full text-xs font-semibold transition-colors border ${
               filterOption === 'mature'
                 ? 'bg-green-500 text-white border-green-500'
                 : 'bg-white dark:bg-dark-surface text-gray-600 dark:text-gray-300 border-gray-200 dark:border-dark-border'
             }`}
           >
             🌳 Mature ({stats.mature})
           </button>
        </div>

        {/* Search & Sort Bar */}
        <div className="flex gap-2 mb-4">
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

            <div className="relative min-w-[120px]">
               <div className="absolute inset-y-0 left-0 flex items-center pl-2 pointer-events-none text-gray-400">
                    <ArrowUpDown className="w-3.5 h-3.5" />
               </div>
               <select 
                  value={sortOption}
                  onChange={(e) => setSortOption(e.target.value as SortOption)}
                  className="h-full w-full pl-8 pr-4 appearance-none bg-white dark:bg-dark-surface border border-gray-200 dark:border-dark-border rounded-lg text-xs font-medium text-gray-600 dark:text-dark-text focus:outline-none focus:border-primary focus:ring-2 focus:ring-primary/20 shadow-sm transition-all"
               >
                  <option value="due-first">Due First</option>
                  <option value="newest">Newest</option>
                  <option value="oldest">Oldest</option>
                  <option value="a-z">A-Z</option>
                  <option value="z-a">Z-A</option>
               </select>
            </div>
        </div>

        {/* Word List */}
        <div>
           {collectionWords.length === 0 ? (
             <div className="flex flex-col items-center justify-center py-16 text-center space-y-4">
               <div className="bg-gray-50 dark:bg-dark-surface p-4 rounded-full">
                 <Search className="w-10 h-10 text-gray-300 dark:text-gray-600" />
               </div>
               <div>
                  <h3 className="text-lg font-bold text-gray-700 dark:text-dark-text">No words yet</h3>
                  <p className="text-gray-500 dark:text-dark-text-sec text-sm mt-1">
                    Add words to this collection to get started.
                  </p>
               </div>
               <button
                  onClick={() => onAddWord(collection.id === 'all' ? null : collection.id)}
                  className="text-primary font-semibold hover:underline"
               >
                 + Add your first word
               </button>
             </div>
           ) : displayWords.length === 0 ? (
             <div className="flex flex-col items-center justify-center py-16 text-center text-gray-500 dark:text-dark-text-sec">
               {filterOption === 'due' ? (
                 <>
                   <div className="w-16 h-16 bg-green-100 dark:bg-green-900/20 rounded-full flex items-center justify-center mb-4">
                      <CheckCircle2 className="w-8 h-8 text-green-500" />
                   </div>
                   <h3 className="text-lg font-bold text-dark dark:text-dark-text">All cards reviewed!</h3>
                   <p className="max-w-[200px] mt-2">No cards due in this collection right now.</p>
                   <button onClick={() => setFilterOption('all')} className="mt-4 text-primary font-bold hover:underline">
                      View all cards
                   </button>
                 </>
               ) : (
                 <>
                   <Search className="w-8 h-8 mb-3 opacity-50" />
                   <p>No matches found.</p>
                   <button onClick={() => { setSearchQuery(''); setFilterOption('all'); }} className="mt-2 text-primary hover:underline text-sm">Clear filters</button>
                 </>
               )}
             </div>
           ) : (
             <WordList 
               words={displayWords} 
               onEdit={setEditingWord}
               onDelete={onDeleteWord}
               onToggleMastered={onToggleMastered}
             />
           )}
        </div>
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