import React, { useState } from 'react';
import { Collection, VocabWord } from '../types';
import { Plus, MoreVertical, FolderOpen, Pencil, Trash2, Eye, PlayCircle } from 'lucide-react';
import { isCardDue, getSRSStage } from '../utils/srs';

interface CollectionsViewProps {
  collections: Collection[];
  words: VocabWord[];
  onOpenCollection: (id: string) => void;
  onAddCollection: () => void;
  onEditCollection: (collection: Collection) => void;
  onDeleteCollection: (collection: Collection) => void;
}

export const CollectionsView: React.FC<CollectionsViewProps> = ({
  collections,
  words,
  onOpenCollection,
  onAddCollection,
  onEditCollection,
  onDeleteCollection
}) => {
  // Helper to calculate SRS stats
  const getStats = (collectionId: string) => {
    const collectionWords = words.filter(w => 
      collectionId === 'all' ? true : w.collectionId === collectionId
    );
    
    const total = collectionWords.length;
    const due = collectionWords.filter(isCardDue).length;
    
    // Stages
    let learning = 0;
    let mature = 0;
    
    collectionWords.forEach(w => {
       const stage = getSRSStage(w);
       if (stage.type === 'mature') mature++;
       else if (stage.type === 'learning' || stage.type === 'young') learning++;
       // 'new' is not counted in learning/mature explicitly for the stats line "X learning • Y mature" usually
    });
    
    // Or strictly follow prompt: Learning (interval < 21)
    learning = collectionWords.filter(w => w.repetitions > 0 && w.interval < 21).length;
    mature = collectionWords.filter(w => w.interval >= 21).length;
    
    const maturePercentage = total > 0 ? Math.round((mature / total) * 100) : 0;
    
    return { total, due, learning, mature, maturePercentage };
  };

  const allWordsCollection = collections.find(c => c.id === 'all');
  const userCollections = collections.filter(c => c.id !== 'all').sort((a, b) => b.createdAt - a.createdAt);

  return (
    <div className="flex flex-col h-full animate-in fade-in duration-500 space-y-6">
      
      {/* Header */}
      <div className="flex items-center justify-between pt-2">
        <h2 className="text-xl font-bold text-dark dark:text-dark-text">Collections</h2>
        <button
          onClick={onAddCollection}
          className="flex items-center gap-1.5 bg-primary hover:bg-primary-hover text-white px-3 py-1.5 rounded-lg text-sm font-semibold transition-colors shadow-sm active:scale-95"
        >
          <Plus className="w-4 h-4" />
          New
        </button>
      </div>

      {/* Collections List */}
      <div className="flex-1 overflow-y-auto pb-4 custom-scrollbar -mx-2 px-2 space-y-6">
        
        {/* All Words Card */}
        {allWordsCollection && (
          <CollectionCard
            collection={allWordsCollection}
            stats={getStats('all')}
            onClick={() => onOpenCollection('all')}
            onEdit={onEditCollection}
            onDelete={onDeleteCollection}
            showMenu={false}
          />
        )}

        {/* User Collections Section */}
        {userCollections.length > 0 ? (
          <div className="space-y-3">
            <h3 className="text-xs font-semibold text-gray-400 dark:text-dark-text-sec uppercase tracking-wider pl-1">
              Your Collections
            </h3>
            <div className="space-y-3">
              {userCollections.map(collection => (
                <CollectionCard
                  key={collection.id}
                  collection={collection}
                  stats={getStats(collection.id)}
                  onClick={() => onOpenCollection(collection.id)}
                  onEdit={onEditCollection}
                  onDelete={onDeleteCollection}
                  showMenu={true}
                />
              ))}
            </div>
          </div>
        ) : (
          /* Empty State */
          <div className="flex flex-col items-center justify-center py-12 text-center space-y-3">
            <div className="bg-gray-50 dark:bg-dark-surface p-4 rounded-full">
              <FolderOpen className="w-8 h-8 text-gray-300 dark:text-gray-600" />
            </div>
            <p className="text-gray-500 dark:text-dark-text-sec text-sm max-w-[200px]">
              Create your first collection to organize words
            </p>
          </div>
        )}
      </div>
    </div>
  );
};

interface CollectionCardProps {
  collection: Collection;
  stats: {
    total: number;
    due: number;
    learning: number;
    mature: number;
    maturePercentage: number;
  };
  onClick: () => void;
  onEdit: (c: Collection) => void;
  onDelete: (c: Collection) => void;
  showMenu?: boolean;
}

const CollectionCard: React.FC<CollectionCardProps> = ({ 
  collection, 
  stats, 
  onClick, 
  onEdit,
  onDelete,
  showMenu = false 
}) => {
  const [isMenuOpen, setIsMenuOpen] = useState(false);

  return (
    <div 
      onClick={onClick}
      className="bg-white dark:bg-dark-surface rounded-xl shadow-sm border border-gray-100 dark:border-dark-border p-4 cursor-pointer hover:shadow-md transition-all active:scale-[0.99] relative group"
    >
      {/* Accent Color Border/Tint */}
      <div 
        className="absolute left-0 top-0 bottom-0 w-1.5 rounded-l-xl"
        style={{ backgroundColor: collection.color }}
      />
      
      <div className="pl-3">
        {/* Header Row */}
        <div className="flex items-start justify-between mb-2">
          <div className="flex items-center flex-wrap gap-2">
            <span className="text-2xl" role="img" aria-label="icon">{collection.icon}</span>
            <h3 className="text-lg font-bold text-dark dark:text-dark-text truncate max-w-[180px] sm:max-w-[200px] flex items-center">
              {collection.name} 
              <span className="text-gray-400 dark:text-gray-500 font-normal text-base ml-1">({stats.total})</span>
            </h3>
            
            {/* Due Badge */}
            {stats.due > 0 && (
              <span className="bg-red-500 text-white rounded-full px-2 py-0.5 text-xs font-bold animate-pulse">
                {stats.due} due
              </span>
            )}
          </div>
          
          {showMenu && (
            <div className="relative">
              <button 
                onClick={(e) => {
                  e.stopPropagation();
                  setIsMenuOpen(!isMenuOpen);
                }}
                className={`p-1.5 rounded-lg transition-colors z-20 relative ${isMenuOpen ? 'bg-gray-100 dark:bg-dark-bg text-gray-600' : 'text-gray-400 hover:bg-gray-100 dark:hover:bg-dark-bg hover:text-gray-600 dark:hover:text-gray-300'}`}
              >
                <MoreVertical className="w-5 h-5" />
              </button>

              {/* Menu Dropdown */}
              {isMenuOpen && (
                <>
                  <div 
                    className="fixed inset-0 z-10" 
                    onClick={(e) => {
                      e.stopPropagation();
                      setIsMenuOpen(false);
                    }}
                  />
                  <div className="absolute right-0 top-8 z-20 w-52 bg-white dark:bg-dark-surface rounded-xl shadow-xl border border-gray-100 dark:border-dark-border py-1.5 animate-in fade-in zoom-in-95 duration-200 origin-top-right">
                    <button 
                      onClick={(e) => {
                         e.stopPropagation();
                         setIsMenuOpen(false);
                         onClick();
                      }}
                      className="w-full text-left px-4 py-2.5 text-sm hover:bg-gray-50 dark:hover:bg-dark-bg transition-colors flex items-center gap-2 text-gray-700 dark:text-gray-300"
                    >
                       <Eye className="w-4 h-4" />
                       View Collection
                    </button>
                    <button 
                      onClick={(e) => {
                         e.stopPropagation();
                         setIsMenuOpen(false);
                         onEdit(collection);
                      }}
                      className="w-full text-left px-4 py-2.5 text-sm hover:bg-gray-50 dark:hover:bg-dark-bg transition-colors flex items-center gap-2 text-gray-700 dark:text-gray-300"
                    >
                       <Pencil className="w-4 h-4" />
                       Edit Collection
                    </button>
                    <div className="h-px bg-gray-100 dark:bg-dark-border my-1" />
                    <button 
                      onClick={(e) => {
                         e.stopPropagation();
                         setIsMenuOpen(false);
                         onDelete(collection);
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
          )}
        </div>

        {/* Stats Row */}
        <div className="space-y-2">
          <div className="flex flex-wrap items-center gap-x-2 gap-y-1 text-xs font-medium text-gray-500 dark:text-dark-text-sec">
             <span className={`${stats.due > 0 ? 'text-red-500 font-bold' : ''}`}>
               {stats.due} due
             </span>
             <span>•</span>
             <span className="text-orange-500">{stats.learning} learning</span>
             <span>•</span>
             <span className="text-green-500">{stats.mature} mature</span>
          </div>

          {/* Progress Bar (Maturity) */}
          <div className="h-1.5 w-full bg-gray-100 dark:bg-dark-bg rounded-full overflow-hidden">
            <div 
              className="h-full rounded-full transition-all duration-500 ease-out"
              style={{ 
                width: `${stats.maturePercentage}%`,
                backgroundColor: collection.color === '#6B7280' ? '#10B981' : collection.color 
              }}
            />
          </div>
        </div>
      </div>
    </div>
  );
};