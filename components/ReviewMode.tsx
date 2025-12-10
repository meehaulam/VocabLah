import React, { useState, useEffect, useMemo, useCallback } from 'react';
import { VocabWord } from '../types';
import { SessionLimitOption } from './SettingsView';
import { ChevronLeft, ChevronRight, CheckCircle2, Award, BookOpen, Check, LayoutDashboard, RotateCw } from 'lucide-react';

interface ReviewModeProps {
  words: VocabWord[];
  initialFilter: 'all' | 'learning';
  sessionLimit: SessionLimitOption;
  onToggleMastered: (id: number) => void;
  onBackToDashboard: () => void;
}

export const ReviewMode: React.FC<ReviewModeProps> = ({ 
  words, 
  initialFilter,
  sessionLimit,
  onToggleMastered,
  onBackToDashboard
}) => {
  const [filter, setFilter] = useState<'all' | 'learning'>(initialFilter);
  
  // Batch Management
  const [currentBatchIds, setCurrentBatchIds] = useState<number[]>([]);
  // Store IDs of words completed in previous batches within this session to avoid repeats
  const [completedIds, setCompletedIds] = useState<Set<number>>(new Set());
  
  const [currentIndex, setCurrentIndex] = useState(0);
  const [animatingId, setAnimatingId] = useState<number | null>(null);
  const [isBatchComplete, setIsBatchComplete] = useState(false);
  const [batchMasteredCount, setBatchMasteredCount] = useState(0);

  // Sync prop changes
  useEffect(() => {
    setFilter(initialFilter);
  }, [initialFilter]);

  // Derived: All eligible words for the current filter, excluding those we already finished this session
  const eligibleWords = useMemo(() => {
     return words.filter(w => (filter === 'all' || !w.mastered));
  }, [words, filter]);

  // Derived: Calculate remaining count
  // Words that are eligible AND not in current batch AND not in completed list
  const remainingCount = useMemo(() => {
     const currentBatchSet = new Set(currentBatchIds);
     return eligibleWords.filter(w => !currentBatchSet.has(w.id) && !completedIds.has(w.id)).length;
  }, [eligibleWords, currentBatchIds, completedIds]);

  // Function to initialize or continue session
  const startBatch = useCallback((reset: boolean) => {
    // If reset, clear completed history
    const history = reset ? new Set<number>() : completedIds;
    if (reset) setCompletedIds(new Set());

    // Get candidates: eligible words minus history
    const candidates = words.filter(w => 
        (filter === 'all' || !w.mastered) && !history.has(w.id)
    );

    if (candidates.length === 0) {
        setCurrentBatchIds([]);
        setIsBatchComplete(true);
        return;
    }

    // Slice based on limit
    const limit = sessionLimit === 'all' ? candidates.length : sessionLimit;
    const nextBatch = candidates.slice(0, limit);

    setCurrentBatchIds(nextBatch.map(w => w.id));
    setCurrentIndex(0);
    setIsBatchComplete(false);
    setBatchMasteredCount(0);
  }, [words, filter, sessionLimit, completedIds]);

  // Start initial batch on mount or when filter/limit changes
  useEffect(() => {
    startBatch(true);
  }, [filter, sessionLimit]); // Re-start if filter or limit changes

  // Helper to get current word object from ID
  const currentWordId = currentBatchIds[currentIndex];
  const currentWord = words.find(w => w.id === currentWordId);

  // -- Handlers --

  const handleFilterChange = (newFilter: 'all' | 'learning') => {
    setFilter(newFilter);
    // Effect will trigger startBatch(true)
  };

  const handleNext = () => {
    if (currentIndex < currentBatchIds.length - 1) {
      setCurrentIndex(prev => prev + 1);
    } else {
      // Mark current batch as completed in history
      setCompletedIds(prev => {
          const next = new Set(prev);
          currentBatchIds.forEach(id => next.add(id));
          return next;
      });
      setIsBatchComplete(true);
    }
  };

  const handlePrev = () => {
    if (currentIndex > 0) {
      setCurrentIndex(prev => prev - 1);
    }
  };

  const handleMaster = () => {
    if (!currentWord) return;

    // If already mastered (visually in this session) or mastered in data
    const isMastered = currentWord.mastered;

    setAnimatingId(currentWord.id);
    
    // Optimistic UI update logic handled by animatingId mostly, 
    // but actual data update happens after timeout
    setTimeout(() => {
      onToggleMastered(currentWord.id);
      setAnimatingId(null);
      
      // If we are marking as mastered (not un-mastering)
      if (!isMastered) {
          setBatchMasteredCount(prev => prev + 1);
      } else {
          setBatchMasteredCount(prev => Math.max(0, prev - 1));
      }

      // Auto-advance
      if (currentIndex < currentBatchIds.length - 1) {
        handleNext();
      } else {
        // Last card
        setCompletedIds(prev => {
            const next = new Set(prev);
            currentBatchIds.forEach(id => next.add(id));
            return next;
        });
        setIsBatchComplete(true);
      }
    }, 600);
  };

  // --- Render States ---

  // 1. Completion Screen (Batch End or Empty)
  if (isBatchComplete || currentBatchIds.length === 0) {
    const isTrulyEmpty = words.length === 0;
    const isFilterEmpty = !isTrulyEmpty && currentBatchIds.length === 0 && remainingCount === 0;

    return (
      <div className="h-full flex flex-col items-center justify-center p-6 text-center animate-in fade-in duration-500">
        
        {isTrulyEmpty ? (
           // No words in app
           <div className="flex flex-col items-center">
              <div className="bg-white dark:bg-dark-surface p-6 rounded-full shadow-sm mb-6">
                 <BookOpen className="w-12 h-12 text-primary/50" />
              </div>
              <h2 className="text-xl font-bold text-dark dark:text-dark-text mb-2">No words yet</h2>
              <p className="text-gray-500 dark:text-dark-text-sec max-w-xs">
                 Add some words to your collection to start reviewing!
              </p>
           </div>
        ) : (
           // Session/Batch Complete
           <div className="flex flex-col items-center w-full max-w-sm">
             <div className="text-6xl mb-6 animate-bounce">🎉</div>
             
             {isFilterEmpty ? (
                <>
                   <h2 className="text-2xl font-bold text-dark dark:text-dark-text mb-2">All words reviewed!</h2>
                   <p className="text-gray-500 dark:text-dark-text-sec mb-8">
                     You've reviewed everything in this list.
                   </p>
                </>
             ) : (
                <>
                   <h2 className="text-2xl font-bold text-dark dark:text-dark-text mb-2">Session Complete!</h2>
                   <p className="text-lg font-medium text-primary mb-1">
                      {batchMasteredCount}/{currentBatchIds.length} words mastered
                   </p>
                   <p className="text-sm text-gray-400 dark:text-gray-500 mb-8">in this session</p>
                </>
             )}

             <div className="flex flex-col gap-3 w-full">
               {/* Only show continue if there are more words available */}
               {!isFilterEmpty && remainingCount > 0 && (
                 <>
                    <p className="text-sm text-gray-500 dark:text-dark-text-sec mb-1">
                       {remainingCount} more words available
                    </p>
                    <button
                      onClick={() => startBatch(false)}
                      className="w-full bg-primary hover:bg-primary-hover text-white font-bold py-3.5 px-6 rounded-xl transition-all shadow-lg shadow-primary/20 active:scale-[0.98] flex items-center justify-center gap-2"
                    >
                      <RotateCw className="w-5 h-5" />
                      Continue Reviewing
                    </button>
                 </>
               )}

               <button
                 onClick={onBackToDashboard}
                 className={`w-full font-bold py-3.5 px-6 rounded-xl transition-colors flex items-center justify-center gap-2 ${
                    remainingCount > 0 && !isFilterEmpty
                       ? 'bg-transparent border-2 border-gray-200 dark:border-dark-border text-gray-600 dark:text-gray-300 hover:bg-gray-50 dark:hover:bg-dark-surface'
                       : 'bg-primary hover:bg-primary-hover text-white shadow-lg shadow-primary/20'
                 }`}
               >
                 <LayoutDashboard className="w-5 h-5" />
                 Back to Dashboard
               </button>
               
               {isFilterEmpty && filter === 'learning' && (
                 <button
                   onClick={() => handleFilterChange('all')}
                   className="mt-2 text-sm text-gray-500 hover:text-primary transition-colors"
                 >
                   Review all words instead
                 </button>
               )}
             </div>
           </div>
        )}
      </div>
    );
  }

  if (!currentWord) return null;

  const isMasteredState = currentWord.mastered || animatingId === currentWord.id;

  return (
    <div className="flex flex-col h-full gap-6 animate-in fade-in duration-500 max-w-2xl mx-auto w-full relative">
      
      {/* Session Header */}
      <div className="absolute top-0 left-0 right-0 flex justify-between items-center px-1 py-1 z-10 pointer-events-none">
        {/* Session Stats */}
        <div className="text-xs font-medium text-gray-400 dark:text-gray-500 flex items-center gap-1 bg-white/50 dark:bg-dark-bg/50 backdrop-blur-sm px-2 py-1 rounded-full">
           <span>Reviewing {currentBatchIds.length} words</span>
           {remainingCount > 0 && (
              <>
                 <span className="opacity-50">•</span>
                 <span>{remainingCount} more</span>
              </>
           )}
        </div>

        {/* Filter buttons (pointer-events-auto needed because parent is none) */}
        <div className="flex bg-gray-100 dark:bg-dark-surface p-0.5 rounded-lg border border-gray-200 dark:border-dark-border pointer-events-auto">
          <button
             onClick={() => handleFilterChange('learning')}
             className={`px-2 py-0.5 text-[10px] font-bold rounded-md transition-colors ${filter === 'learning' ? 'bg-white dark:bg-dark-bg shadow-sm text-primary' : 'text-gray-400'}`}
          >
            Learning
          </button>
          <button
             onClick={() => handleFilterChange('all')}
             className={`px-2 py-0.5 text-[10px] font-bold rounded-md transition-colors ${filter === 'all' ? 'bg-white dark:bg-dark-bg shadow-sm text-primary' : 'text-gray-400'}`}
          >
            All
          </button>
        </div>
      </div>

      {/* Main Flashcard Area */}
      <div className="flex-1 flex flex-col justify-center perspective-1000 mt-8">
        <div className="bg-white dark:bg-dark-surface rounded-3xl shadow-xl border border-gray-100 dark:border-dark-border p-8 sm:p-12 w-full flex flex-col items-center text-center relative overflow-hidden transition-all duration-300 min-h-[340px] justify-center">
          
          {/* Progress Indicator */}
          <div className="absolute top-6 right-6 px-3 py-1 bg-gray-50 dark:bg-dark-bg rounded-full border border-gray-100 dark:border-dark-border">
            <span className="text-xs font-semibold text-gray-400 dark:text-gray-500">
              Card {currentIndex + 1} / {currentBatchIds.length}
            </span>
          </div>

          <div className="space-y-8 w-full">
            <div>
              <h2 className="text-4xl sm:text-5xl font-bold text-dark dark:text-dark-text mb-4 tracking-tight break-words">
                {currentWord.word}
              </h2>
              <div className="h-1.5 w-16 bg-primary/20 mx-auto rounded-full"></div>
            </div>
            
            <p className="text-xl text-gray-600 dark:text-dark-text-sec font-medium leading-relaxed max-w-md mx-auto">
              {currentWord.meaning}
            </p>
          </div>

          {currentWord.mastered && !animatingId && (
             <div className="absolute top-6 left-6 flex items-center gap-1.5 text-green-600 bg-green-50 px-3 py-1 rounded-full border border-green-100 dark:bg-green-900/20 dark:text-green-400 dark:border-green-800 animate-in fade-in zoom-in duration-300">
                <CheckCircle2 className="w-3.5 h-3.5" />
                <span className="text-xs font-bold uppercase tracking-wide">Mastered</span>
             </div>
          )}
        </div>
      </div>

      {/* Controls Area */}
      <div className="flex flex-col gap-4 mt-auto relative z-20 pb-2">
        
        {/* Animated Checkmark Overlay */}
        {animatingId === currentWord.id && (
          <div className="absolute bottom-[calc(100%-20px)] left-0 right-0 flex justify-center pointer-events-none z-50">
             <div className="animate-check-bounce">
                <Check className="w-20 h-20 text-green-500 drop-shadow-sm" strokeWidth={4} />
             </div>
          </div>
        )}

        {/* Navigation */}
        <div className="flex items-center justify-between px-4">
          <button
            onClick={handlePrev}
            disabled={currentIndex === 0}
            className={`p-3 rounded-full transition-all duration-200 flex items-center gap-2 ${
              currentIndex === 0
                ? 'text-gray-300 dark:text-gray-700 cursor-not-allowed'
                : 'text-gray-600 dark:text-dark-text-sec hover:bg-white dark:hover:bg-dark-surface hover:shadow-md hover:text-primary active:scale-95'
            }`}
          >
            <ChevronLeft className="w-6 h-6" />
            <span className="text-sm font-medium hidden sm:block">Previous</span>
          </button>

          <button
            onClick={handleNext}
            className="p-3 rounded-full transition-all duration-200 flex items-center gap-2 text-gray-600 dark:text-dark-text-sec hover:bg-white dark:hover:bg-dark-surface hover:shadow-md hover:text-primary active:scale-95"
          >
            <span className="text-sm font-medium hidden sm:block">
               {currentIndex === currentBatchIds.length - 1 ? 'Finish Session' : 'Next'}
            </span>
            <ChevronRight className="w-6 h-6" />
          </button>
        </div>

        {/* Action Button */}
        <button
          onClick={handleMaster}
          className={`w-full py-4 rounded-xl font-bold text-white shadow-md transition-all duration-300 ease-out active:scale-[0.98] flex items-center justify-center gap-2 relative overflow-hidden
            ${isMasteredState
              ? 'bg-green-500 hover:bg-green-600 ring-2 ring-green-200 dark:ring-green-900' 
              : 'bg-accent hover:bg-accent-hover ring-2 ring-orange-200/50 dark:ring-orange-900/30'
            }`}
        >
          {isMasteredState ? (
            <>
              <CheckCircle2 className="w-5 h-5 animate-in zoom-in spin-in-90 duration-300" />
              <span className="animate-in fade-in duration-300">Mastered</span>
            </>
          ) : (
            <>
              <CheckCircle2 className="w-5 h-5" />
              <span>I Know This</span>
            </>
          )}
        </button>
      </div>
    </div>
  );
};