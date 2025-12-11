import React, { useState, useEffect, useMemo } from 'react';
import { VocabWord, Collection } from '../types';
import { SessionLimitOption } from './SettingsView';
import { ChevronLeft, ChevronRight, CheckCircle2, RotateCw, PlayCircle, LayoutDashboard, Check } from 'lucide-react';

interface ReviewModeProps {
  words: VocabWord[];
  collections: Collection[];
  sessionLimit: SessionLimitOption;
  initialCollectionId?: string | null;
  onToggleMastered: (id: number) => void;
  onBackToDashboard: () => void;
}

export const ReviewMode: React.FC<ReviewModeProps> = ({ 
  words, 
  collections,
  sessionLimit,
  initialCollectionId,
  onToggleMastered,
  onBackToDashboard
}) => {
  // Setup State
  const [isSetupComplete, setIsSetupComplete] = useState(false);
  const [selectedCollectionId, setSelectedCollectionId] = useState<string | null>(initialCollectionId || null); // null represents 'all'
  const [isPracticeMode, setIsPracticeMode] = useState(false);
  
  // Session State
  const [sessionWords, setSessionWords] = useState<VocabWord[]>([]);
  const [activeCollectionName, setActiveCollectionName] = useState('All Collections');
  
  // Batch Management
  const [currentBatchIds, setCurrentBatchIds] = useState<number[]>([]);
  const [completedIds, setCompletedIds] = useState<Set<number>>(new Set());
  
  const [currentIndex, setCurrentIndex] = useState(0);
  const [animatingId, setAnimatingId] = useState<number | null>(null);
  const [isBatchComplete, setIsBatchComplete] = useState(false);
  const [batchMasteredCount, setBatchMasteredCount] = useState(0);

  // Sync initialCollectionId if it changes (re-mounting or deep link update)
  useEffect(() => {
    if (initialCollectionId !== undefined) {
      setSelectedCollectionId(initialCollectionId === 'all' ? null : initialCollectionId);
    }
  }, [initialCollectionId]);

  // Calculate unmastered counts for setup screen
  const unmasteredCounts = useMemo(() => {
    const counts: Record<string, number> = {};
    
    // Count for specific collections
    collections.forEach(c => {
      const count = words.filter(w => !w.mastered && w.collectionId === c.id).length;
      counts[c.id] = count;
    });

    // Count for all (unmastered total)
    const totalUnmastered = words.filter(w => !w.mastered).length;
    counts['all'] = totalUnmastered;

    return counts;
  }, [words, collections]);

  // Handle Setup Start
  const handleStartSession = () => {
    let filteredWords = words.filter(w => !w.mastered);

    if (selectedCollectionId && selectedCollectionId !== 'all') {
      filteredWords = filteredWords.filter(w => w.collectionId === selectedCollectionId);
      const col = collections.find(c => c.id === selectedCollectionId);
      setActiveCollectionName(col ? col.name : 'Unknown Collection');
    } else {
      setActiveCollectionName('All Collections');
    }

    // Apply Session Limit
    if (sessionLimit !== 'all') {
      filteredWords = filteredWords.slice(0, sessionLimit);
    }

    // Deep copy words for session to isolate state (important for Practice Mode vs Normal Mode)
    const sessionWordsCopy = filteredWords.map(w => ({ ...w }));
    setSessionWords(sessionWordsCopy);
    setIsPracticeMode(false);
    setIsSetupComplete(true);
    
    // Initialize batch
    const initialBatch = sessionWordsCopy.map(w => w.id);
    setCurrentBatchIds(initialBatch);
    setCompletedIds(new Set());
    setCurrentIndex(0);
    setIsBatchComplete(sessionWordsCopy.length === 0);
    setBatchMasteredCount(0);
  };

  const handleReviewAgain = () => {
    setIsPracticeMode(true);
    
    // Reset mastery for all words in the CURRENT session for practice
    // We reuse sessionWords but reset their status in a new copy
    const resetWords = sessionWords.map(w => ({ ...w, mastered: false }));
    setSessionWords(resetWords);
    
    // Re-initialize batch with these reset words
    const newBatch = resetWords.map(w => w.id);
    setCurrentBatchIds(newBatch);
    setCompletedIds(new Set());
    setCurrentIndex(0);
    setIsBatchComplete(false);
    setBatchMasteredCount(0);
  };

  // --- Session Logic ---

  const currentWordId = currentBatchIds[currentIndex];
  // Look up word in local session state
  const currentWord = sessionWords.find(w => w.id === currentWordId);

  const handleNext = () => {
    if (currentIndex < currentBatchIds.length - 1) {
      setCurrentIndex(prev => prev + 1);
    } else {
      // Mark current batch as completed
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

    const isMastered = currentWord.mastered;
    setAnimatingId(currentWord.id);
    
    // 1. Update local session state immediately
    setSessionWords(prev => prev.map(w => 
      w.id === currentWord.id ? { ...w, mastered: !w.mastered } : w
    ));
    
    setTimeout(() => {
      // 2. Sync global state ONLY if not in practice mode
      if (!isPracticeMode) {
        onToggleMastered(currentWord.id);
      }

      setAnimatingId(null);
      
      if (!isMastered) {
          setBatchMasteredCount(prev => prev + 1);
      } else {
          setBatchMasteredCount(prev => Math.max(0, prev - 1));
      }

      if (currentIndex < currentBatchIds.length - 1) {
        handleNext();
      } else {
        setCompletedIds(prev => {
            const next = new Set(prev);
            currentBatchIds.forEach(id => next.add(id));
            return next;
        });
        setIsBatchComplete(true);
      }
    }, 600);
  };

  // --- Render: Setup Screen ---
  if (!isSetupComplete) {
    const totalUnmastered = unmasteredCounts['all'] || 0;
    
    // Check if user has ANY unmastered words
    if (totalUnmastered === 0) {
      return (
        <div className="h-full flex flex-col items-center justify-center p-6 text-center animate-in fade-in duration-500">
           <div className="text-6xl mb-6 animate-bounce">🎉</div>
           <h2 className="text-2xl font-bold text-dark dark:text-dark-text mb-2">All words mastered!</h2>
           <p className="text-gray-500 dark:text-dark-text-sec mb-8">
             Great job! You've mastered all the words in your collections. Add more to keep learning.
           </p>
           <button
             onClick={onBackToDashboard}
             className="w-full max-w-xs bg-primary hover:bg-primary-hover text-white font-bold py-3.5 px-6 rounded-xl transition-all shadow-lg shadow-primary/20"
           >
             Back to Dashboard
           </button>
        </div>
      );
    }

    // Filter user collections to show only those with unmastered words
    const reviewableCollections = collections
      .filter(c => c.id !== 'all')
      .filter(c => (unmasteredCounts[c.id] || 0) > 0)
      .sort((a, b) => a.name.localeCompare(b.name));

    // Estimated time calculation (30s per card)
    const selectedCount = selectedCollectionId 
       ? (unmasteredCounts[selectedCollectionId] || 0) 
       : totalUnmastered;
    
    // Apply session limit to estimation
    const actualCount = sessionLimit === 'all' ? selectedCount : Math.min(selectedCount, sessionLimit);
    const estimatedMinutes = Math.ceil((actualCount * 30) / 60);

    return (
      <div className="h-full flex flex-col p-4 animate-in fade-in duration-300">
        <div className="flex items-center mb-6">
          <button 
            onClick={onBackToDashboard}
            className="p-2 -ml-2 rounded-full hover:bg-gray-100 dark:hover:bg-dark-surface text-gray-500 transition-colors"
          >
            <ChevronLeft className="w-6 h-6" />
          </button>
          <h2 className="text-xl font-bold ml-2 text-dark dark:text-dark-text">Start Review</h2>
        </div>

        <div className="flex-1 overflow-y-auto -mx-2 px-2 custom-scrollbar">
          <p className="text-sm font-semibold text-gray-500 dark:text-dark-text-sec mb-4 uppercase tracking-wider">
            What do you want to review?
          </p>
          
          <div className="space-y-3">
            {/* All Collections Option */}
            <label className={`flex items-center p-4 rounded-xl border-2 cursor-pointer transition-all ${
              selectedCollectionId === null 
                ? 'border-primary bg-blue-50/50 dark:bg-blue-900/10' 
                : 'border-gray-100 dark:border-dark-border bg-white dark:bg-dark-surface hover:border-gray-200 dark:hover:border-gray-700'
            }`}>
              <div className="flex items-center justify-center w-6 h-6 mr-4 shrink-0">
                <input 
                  type="radio" 
                  name="collection" 
                  checked={selectedCollectionId === null} 
                  onChange={() => setSelectedCollectionId(null)}
                  className="w-5 h-5 text-primary focus:ring-primary border-gray-300"
                />
              </div>
              <div className="flex-1">
                <div className="font-bold text-dark dark:text-dark-text">All Collections</div>
                <div className="text-sm text-gray-500 dark:text-gray-400">{totalUnmastered} words due</div>
              </div>
              <div className="text-2xl opacity-50">📚</div>
            </label>

            {/* Specific Collections */}
            {reviewableCollections.length > 0 && (
              <>
                <p className="text-xs font-semibold text-gray-400 mt-6 mb-2 uppercase tracking-wider">
                  Review by Collection
                </p>
                {reviewableCollections.map(col => (
                  <label key={col.id} className={`flex items-center p-4 rounded-xl border-2 cursor-pointer transition-all ${
                    selectedCollectionId === col.id 
                      ? 'border-primary bg-blue-50/50 dark:bg-blue-900/10' 
                      : 'border-gray-100 dark:border-dark-border bg-white dark:bg-dark-surface hover:border-gray-200 dark:hover:border-gray-700'
                  }`}>
                    <div className="flex items-center justify-center w-6 h-6 mr-4 shrink-0">
                      <input 
                        type="radio" 
                        name="collection" 
                        checked={selectedCollectionId === col.id} 
                        onChange={() => setSelectedCollectionId(col.id)}
                        className="w-5 h-5 text-primary focus:ring-primary border-gray-300"
                      />
                    </div>
                    <div className="flex-1">
                      <div className="font-bold text-dark dark:text-dark-text">{col.name}</div>
                      <div className="text-sm text-gray-500 dark:text-gray-400">{unmasteredCounts[col.id]} words due</div>
                    </div>
                    <div className="text-2xl">{col.icon}</div>
                  </label>
                ))}
              </>
            )}
          </div>
        </div>

        <div className="mt-4 pt-4 border-t border-gray-100 dark:border-dark-border space-y-4">
           <div className="flex items-center justify-between text-sm text-gray-500 dark:text-dark-text-sec px-1">
             <span>Estimated time:</span>
             <span className="font-bold text-dark dark:text-dark-text">~{estimatedMinutes} minute{estimatedMinutes !== 1 ? 's' : ''}</span>
           </div>

           <button
             onClick={handleStartSession}
             className="w-full flex items-center justify-center gap-2 bg-primary hover:bg-primary-hover text-white font-bold py-4 px-6 rounded-xl shadow-lg shadow-blue-500/20 transition-all active:scale-[0.98]"
           >
             <PlayCircle className="w-5 h-5 fill-current" />
             Start Review
           </button>
        </div>
      </div>
    );
  }

  // --- Render: Session Complete ---
  if (isBatchComplete || currentBatchIds.length === 0) {
    return (
      <div className="h-full flex flex-col items-center justify-center p-6 text-center animate-in fade-in duration-500">
         <div className="flex flex-col items-center w-full max-w-sm">
           <div className="text-6xl mb-6 animate-bounce">🎉</div>
           
           <h2 className="text-2xl font-bold text-dark dark:text-dark-text mb-2">
             {isPracticeMode ? "Practice Complete!" : "Session Complete!"}
           </h2>
           <p className="text-sm text-gray-500 dark:text-dark-text-sec mb-1">
             {activeCollectionName}
           </p>
           <p className="text-lg font-medium text-primary mb-8">
              {batchMasteredCount}/{currentBatchIds.length} words mastered
           </p>

           <div className="flex flex-col gap-3 w-full">
             
             {/* Primary: Back to Dashboard */}
             <button
               onClick={onBackToDashboard}
               className="w-full bg-primary hover:bg-primary-hover text-white font-bold py-3.5 px-6 rounded-xl transition-all shadow-lg shadow-primary/20 active:scale-[0.98] flex items-center justify-center gap-2"
             >
               <LayoutDashboard className="w-5 h-5" />
               Back to Dashboard
             </button>

             {/* Secondary: Review Again */}
             <button
               onClick={handleReviewAgain}
               className="w-full bg-transparent border-2 border-gray-200 dark:border-dark-border text-gray-600 dark:text-gray-300 hover:bg-gray-50 dark:hover:bg-dark-surface font-bold py-3.5 px-6 rounded-xl transition-colors flex items-center justify-center gap-2"
             >
               <RotateCw className="w-5 h-5" />
               Review Again
             </button>

             {/* Tertiary: Start New Session (if needed) */}
             {!isPracticeMode && (
               <button
                 onClick={() => {
                   setIsSetupComplete(false);
                   setSessionWords([]);
                   setCurrentBatchIds([]);
                 }}
                 className="mt-2 text-primary font-semibold hover:underline text-sm"
               >
                 Start New Session
               </button>
             )}
           </div>
         </div>
      </div>
    );
  }

  // --- Render: Active Session ---
  if (!currentWord) return null;

  const isMasteredState = currentWord.mastered || animatingId === currentWord.id;

  return (
    <div className="flex flex-col h-full gap-6 animate-in fade-in duration-500 max-w-2xl mx-auto w-full relative">
      
      {/* Session Header */}
      <div className="absolute top-0 left-0 right-0 flex justify-center items-center px-1 py-1 z-10 pointer-events-none">
        <div className="flex flex-col items-center gap-1">
          <div className="text-xs font-medium text-gray-400 dark:text-gray-500 flex items-center gap-1 bg-white/80 dark:bg-dark-bg/80 backdrop-blur-sm px-3 py-1.5 rounded-full shadow-sm border border-gray-100 dark:border-dark-border">
             <span className="font-semibold text-primary">{activeCollectionName}</span>
             <span className="opacity-50">•</span>
             <span>{currentBatchIds.length} cards</span>
          </div>
          {isPracticeMode && (
            <div className="text-[10px] font-bold text-orange-500 bg-orange-50 dark:bg-orange-900/20 px-2 py-0.5 rounded-full border border-orange-100 dark:border-orange-800 shadow-sm animate-in slide-in-from-top-2 fade-in">
              Practice Mode - Progress not saved
            </div>
          )}
        </div>
      </div>

      {/* Main Flashcard Area */}
      <div className="flex-1 flex flex-col justify-center perspective-1000 mt-8">
        <div className="bg-white dark:bg-dark-surface rounded-3xl shadow-xl border border-gray-100 dark:border-dark-border p-8 sm:p-12 w-full flex flex-col items-center text-center relative overflow-hidden transition-all duration-300 min-h-[340px] justify-center">
          
          {/* Progress Indicator */}
          <div className="absolute top-6 right-6 px-3 py-1 bg-gray-50 dark:bg-dark-bg rounded-full border border-gray-100 dark:border-dark-border">
            <span className="text-xs font-semibold text-gray-400 dark:text-gray-500">
              {currentIndex + 1} / {currentBatchIds.length}
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