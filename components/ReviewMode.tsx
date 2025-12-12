import React, { useState, useEffect, useMemo } from 'react';
import { VocabWord, Collection } from '../types';
import { SessionLimitOption } from './SettingsView';
import { ChevronLeft, RotateCw, PlayCircle, Check, Calendar, History, Brain, AlertCircle, X, CheckCircle2 } from 'lucide-react';
import { calculateSM2, getSRSIntervalPreview, Difficulty, isCardDue, getNextDueInfo, getSRSSettings, getDailyCounts, incrementDailyCounts } from '../utils/srs';
import { getTodayDate, addDays } from '../utils/date';

interface ReviewModeProps {
  words: VocabWord[];
  collections: Collection[];
  sessionLimit: SessionLimitOption;
  initialCollectionId?: string | null;
  onUpdateWord: (word: VocabWord) => void;
  onBackToDashboard: () => void;
}

export const ReviewMode: React.FC<ReviewModeProps> = ({ 
  words, 
  collections,
  sessionLimit,
  initialCollectionId,
  onUpdateWord,
  onBackToDashboard
}) => {
  // Setup State
  const [isSetupComplete, setIsSetupComplete] = useState(false);
  const [selectedCollectionId, setSelectedCollectionId] = useState<string | null>(initialCollectionId || null); // null represents 'all'
  const [isPracticeMode, setIsPracticeMode] = useState(false);
  
  // Session State
  const [sessionWords, setSessionWords] = useState<VocabWord[]>([]);
  const [activeCollectionName, setActiveCollectionName] = useState('All Collections');
  const [limitWarning, setLimitWarning] = useState<string | null>(null);
  
  // Stats
  const [sessionStats, setSessionStats] = useState({ again: 0, hard: 0, good: 0, easy: 0 });
  
  // Batch Management
  const [currentBatchIds, setCurrentBatchIds] = useState<number[]>([]);
  const [completedIds, setCompletedIds] = useState<Set<number>>(new Set());
  const [newCardsStarted, setNewCardsStarted] = useState<Set<number>>(new Set()); // Track which *new* cards were actually started in this session
  
  const [currentIndex, setCurrentIndex] = useState(0);
  const [animatingId, setAnimatingId] = useState<number | null>(null);
  const [isBatchComplete, setIsBatchComplete] = useState(false);

  // Card Flip State
  const [isFlipped, setIsFlipped] = useState(false);

  // Sync initialCollectionId if it changes
  useEffect(() => {
    if (initialCollectionId !== undefined) {
      setSelectedCollectionId(initialCollectionId === 'all' ? null : initialCollectionId);
    }
  }, [initialCollectionId]);

  // Calculate DUE counts for setup screen
  const dueCounts = useMemo(() => {
    const counts: Record<string, number> = {};
    
    // Count for specific collections
    collections.forEach(c => {
      const count = words.filter(w => isCardDue(w) && w.collectionId === c.id).length;
      counts[c.id] = count;
    });

    // Count for all (due total)
    const totalDue = words.filter(isCardDue).length;
    counts['all'] = totalDue;

    return counts;
  }, [words, collections]);

  const nextDueInfo = useMemo(() => getNextDueInfo(words), [words]);

  // Handle Setup Start
  const handleStartSession = (practiceMode = false) => {
    const srsSettings = getSRSSettings();
    const dailyCounts = getDailyCounts();

    // 1. Base Filter - Practice mode uses ALL cards, normal mode uses only DUE cards
    let filteredWords = practiceMode ? words : words.filter(isCardDue);

    if (selectedCollectionId && selectedCollectionId !== 'all') {
      filteredWords = filteredWords.filter(w => w.collectionId === selectedCollectionId);
      const col = collections.find(c => c.id === selectedCollectionId);
      setActiveCollectionName(col ? col.name : 'Unknown Collection');
    } else {
      setActiveCollectionName('All Collections');
    }

    // 2. Apply Daily Limits (only for normal mode, not practice mode)
    let allowedCards: VocabWord[] = [];

    if (practiceMode) {
      // Practice mode: use all cards (ignore limits)
      allowedCards = filteredWords;

      // Apply session limit if set
      if (sessionLimit !== 'all') {
        allowedCards = allowedCards.slice(0, sessionLimit);
      }
    } else {
      // Normal mode: apply daily limits
      const newCards = filteredWords.filter(w => w.repetitions === 0);
      const reviewCards = filteredWords.filter(w => w.repetitions > 0);

      const availableNewSlots = Math.max(0, srsSettings.newCardsLimit - dailyCounts.newCards);
      const availableReviewSlots = Math.max(0, srsSettings.maxReviewsLimit - dailyCounts.reviews);

      if (availableReviewSlots <= 0) {
          setLimitWarning("You've reached your daily review limit!");
          return;
      }

      const limitedReviews = reviewCards.slice(0, availableReviewSlots);
      const spaceLeftForNew = Math.max(0, availableReviewSlots - limitedReviews.length);
      const finalNewCards = newCards.slice(0, Math.min(availableNewSlots, spaceLeftForNew));

      allowedCards = [...limitedReviews, ...finalNewCards];

      if (sessionLimit !== 'all') {
        allowedCards = allowedCards.slice(0, sessionLimit);
      }

      if (allowedCards.length === 0 && filteredWords.length > 0) {
          setLimitWarning("Daily limits reached for today! Come back tomorrow.");
          return;
      }
    }

    if (allowedCards.length === 0) {
      setLimitWarning("No cards available!");
      return;
    }

    setLimitWarning(null);

    const sessionWordsCopy = allowedCards.map(w => ({ ...w }));
    setSessionWords(sessionWordsCopy);
    setIsPracticeMode(practiceMode);
    setIsSetupComplete(true);
    setSessionStats({ again: 0, hard: 0, good: 0, easy: 0 });

    const initialBatch = sessionWordsCopy.map(w => w.id);
    setCurrentBatchIds(initialBatch);
    setCompletedIds(new Set());
    setNewCardsStarted(new Set());
    setCurrentIndex(0);
    setIsBatchComplete(sessionWordsCopy.length === 0);
    setIsFlipped(false);
  };

  const handlePracticeAnyway = () => {
    handleStartSession(true);
  };

  const handleReviewAgain = () => {
    setIsPracticeMode(true);
    setSessionStats({ again: 0, hard: 0, good: 0, easy: 0 });
    
    const resetWords = sessionWords.map(w => ({ ...w, mastered: false }));
    setSessionWords(resetWords);
    
    const newBatch = resetWords.map(w => w.id);
    setCurrentBatchIds(newBatch);
    setCompletedIds(new Set());
    setCurrentIndex(0);
    setIsBatchComplete(false);
    setIsFlipped(false);
  };

  // --- Session Logic ---

  const currentWordId = currentBatchIds[currentIndex];
  const currentWord = sessionWords.find(w => w.id === currentWordId);
  const intervals = useMemo(() => currentWord ? getSRSIntervalPreview(currentWord) : null, [currentWord]);

  useEffect(() => {
      if (!isPracticeMode && currentWord && currentWord.repetitions === 0 && !newCardsStarted.has(currentWord.id)) {
          setNewCardsStarted(prev => new Set(prev).add(currentWord.id));
      }
  }, [currentWord, isPracticeMode, newCardsStarted]);

  const handleNext = () => {
    setIsFlipped(false);
    if (currentIndex < currentBatchIds.length - 1) {
      setCurrentIndex(prev => prev + 1);
    } else {
      handleSessionComplete();
    }
  };

  const handleSessionComplete = () => {
      if (!isPracticeMode) {
          incrementDailyCounts(completedIds.size, newCardsStarted.size);
      }
      setIsBatchComplete(true);
  };

  const handleRate = (difficulty: Difficulty) => {
    if (!currentWord) return;

    const updatedWord = calculateSM2(currentWord, difficulty);
    
    setSessionStats(prev => ({
      ...prev,
      [difficulty]: prev[difficulty] + 1
    }));

    setSessionWords(prev => prev.map(w => 
      w.id === updatedWord.id ? updatedWord : w
    ));

    const isMastered = (difficulty === 'good' || difficulty === 'easy');
    if (isMastered) {
      setAnimatingId(currentWord.id);
    }
    
    if (!isPracticeMode) {
       onUpdateWord(updatedWord);
    }

    setTimeout(() => {
      setAnimatingId(null);
      if (difficulty === 'again') {
         setCurrentBatchIds(prev => [...prev, currentWord.id]);
      } else {
         setCompletedIds(prev => new Set(prev).add(currentWord.id));
      }
      handleNext();
    }, isMastered ? 600 : 200);
  };

  const getNextReviewsForecast = () => {
    const today = getTodayDate();
    const tomorrow = addDays(today, 1);
    const weekEnd = addDays(today, 7);
    
    const tomorrowCount = words.filter(w => w.nextReviewDate === tomorrow).length;
    const weekCount = words.filter(w => w.nextReviewDate > today && w.nextReviewDate <= weekEnd).length;

    return { tomorrowCount, weekCount };
  };

  // --- Render: Setup Screen ---
  if (!isSetupComplete) {
    const totalDue = dueCounts['all'] || 0;
    
    if (totalDue === 0) {
      return (
        <div className="h-full flex flex-col items-center justify-center p-6 text-center animate-in fade-in duration-500">
           <div className="text-6xl mb-6 animate-bounce">🎉</div>
           <h2 className="text-2xl font-bold text-dark dark:text-dark-text mb-2">No cards due today!</h2>
           <p className="text-gray-500 dark:text-dark-text-sec mb-6 max-w-xs">
             All your reviews are up to date. Great work!
           </p>
           
           {nextDueInfo && (
             <div className="bg-blue-50 dark:bg-blue-900/10 border border-blue-100 dark:border-blue-900/30 rounded-xl p-4 mb-8 flex items-center gap-3">
                <div className="p-2 bg-blue-100 dark:bg-blue-800/30 rounded-full text-blue-600 dark:text-blue-400">
                  <Calendar className="w-5 h-5" />
                </div>
                <div>
                  <div className="font-bold text-dark dark:text-dark-text">Next Review: {nextDueInfo.timeText}</div>
                  <div className="text-xs text-gray-500 dark:text-gray-400">{nextDueInfo.count} cards due</div>
                </div>
             </div>
           )}

           <div className="flex flex-col gap-3 w-full max-w-xs">
              <button
                 onClick={() => onBackToDashboard()}
                 className="w-full py-3.5 rounded-xl font-bold bg-gray-100 dark:bg-dark-surface text-gray-700 dark:text-gray-200 hover:bg-gray-200 dark:hover:bg-gray-700 transition-colors"
              >
                Back to Dashboard
              </button>

              {words.length > 0 && (
                <button
                   onClick={handlePracticeAnyway}
                   className="text-primary font-semibold hover:underline text-sm"
                >
                  Practice anyway? ({words.length} cards available)
                </button>
              )}
           </div>
        </div>
      );
    }

    return (
      <div className="h-full flex flex-col p-4 animate-in fade-in duration-500">
         <header className="flex items-center justify-between mb-8">
            <button onClick={onBackToDashboard} className="p-2 -ml-2 text-gray-500 hover:text-gray-800 dark:text-gray-400 dark:hover:text-gray-200">
               <ChevronLeft className="w-6 h-6" />
            </button>
            <h2 className="text-lg font-bold text-dark dark:text-dark-text">Session Setup</h2>
            <div className="w-10"></div>
         </header>

         <div className="flex-1 flex flex-col items-center justify-center space-y-8">
            <div className="text-center space-y-2">
               <div className="inline-flex items-center justify-center w-20 h-20 bg-primary/10 rounded-full mb-4">
                  <Brain className="w-10 h-10 text-primary" />
               </div>
               <h1 className="text-3xl font-bold text-dark dark:text-dark-text">
                 {dueCounts[selectedCollectionId || 'all']} Cards
               </h1>
               <p className="text-gray-500 dark:text-gray-400">
                 Ready for review in {selectedCollectionId ? (collections.find(c => c.id === selectedCollectionId)?.name) : 'All Collections'}
               </p>
            </div>
            
            {limitWarning && (
              <div className="bg-orange-50 dark:bg-orange-900/20 text-orange-600 dark:text-orange-400 p-4 rounded-xl flex items-center gap-3 max-w-sm text-left text-sm border border-orange-200 dark:border-orange-900/30">
                 <AlertCircle className="w-5 h-5 shrink-0" />
                 {limitWarning}
              </div>
            )}

            <div className="w-full max-w-xs space-y-3">
               <button
                 onClick={handleStartSession}
                 className="w-full bg-primary hover:bg-primary-hover text-white font-bold py-4 rounded-xl shadow-lg shadow-primary/25 transition-all active:scale-[0.98] text-lg flex items-center justify-center gap-2"
               >
                 <PlayCircle className="w-6 h-6 fill-current" />
                 Start Session
               </button>
               
               {!initialCollectionId && collections.length > 1 && (
                  <div className="relative mt-4">
                     <select
                       value={selectedCollectionId || 'all'}
                       onChange={(e) => setSelectedCollectionId(e.target.value === 'all' ? null : e.target.value)}
                       className="w-full custom-select bg-gray-50 dark:bg-dark-surface border border-gray-200 dark:border-dark-border py-3 px-4 rounded-xl text-center text-sm font-semibold text-gray-700 dark:text-gray-300 focus:ring-2 focus:ring-primary/20 outline-none"
                     >
                        <option value="all">All Collections ({dueCounts['all']})</option>
                        {collections.filter(c => c.id !== 'all').map(c => (
                           <option key={c.id} value={c.id}>{c.name} ({dueCounts[c.id] || 0})</option>
                        ))}
                     </select>
                  </div>
               )}
            </div>
         </div>
      </div>
    );
  }

  // --- Render: Summary Screen ---
  if (isBatchComplete) {
    const { tomorrowCount } = getNextReviewsForecast();

    return (
      <div className="h-full flex flex-col p-6 text-center animate-in zoom-in-95 duration-500">
         <div className="flex-1 flex flex-col items-center justify-center space-y-6">
            <div className="w-24 h-24 bg-green-100 dark:bg-green-900/20 rounded-full flex items-center justify-center mb-2 animate-bounce">
               <Check className="w-12 h-12 text-green-600 dark:text-green-400" strokeWidth={3} />
            </div>

            {isPracticeMode ? (
              <>
                <h2 className="text-3xl font-bold text-dark dark:text-dark-text">Practice Session Complete!</h2>
                <p className="text-gray-500 dark:text-gray-400 max-w-xs mx-auto">
                   You reviewed <span className="font-bold text-dark dark:text-dark-text">{completedIds.size}</span> cards for extra practice.
                </p>
                <p className="text-sm text-purple-600 dark:text-purple-400 bg-purple-50 dark:bg-purple-900/20 px-4 py-2 rounded-lg border border-purple-200 dark:border-purple-800/30 max-w-xs">
                   💡 These reviews didn't affect your schedule
                </p>
              </>
            ) : (
              <>
                <h2 className="text-3xl font-bold text-dark dark:text-dark-text">Session Complete!</h2>
                <p className="text-gray-500 dark:text-gray-400 max-w-xs mx-auto">
                   You reviewed <span className="font-bold text-dark dark:text-dark-text">{completedIds.size}</span> cards.
                </p>
              </>
            )}

            <div className="grid grid-cols-2 gap-4 w-full max-w-xs mt-4">
               <div className="bg-gray-50 dark:bg-dark-surface p-4 rounded-xl border border-gray-100 dark:border-dark-border">
                  <div className="text-2xl font-bold text-orange-500">{sessionStats.hard + sessionStats.again}</div>
                  <div className="text-xs font-semibold text-gray-400 uppercase">{isPracticeMode ? 'To Review More' : 'Struggled'}</div>
               </div>
               <div className="bg-gray-50 dark:bg-dark-surface p-4 rounded-xl border border-gray-100 dark:border-dark-border">
                  <div className="text-2xl font-bold text-green-500">{sessionStats.good + sessionStats.easy}</div>
                  <div className="text-xs font-semibold text-gray-400 uppercase">{isPracticeMode ? 'Doing Great!' : 'Mastered'}</div>
               </div>
            </div>

            {!isPracticeMode && (
              <div className="flex items-center gap-2 text-sm text-gray-500 dark:text-gray-400 bg-blue-50 dark:bg-blue-900/10 px-4 py-2 rounded-full">
                 <History className="w-4 h-4" />
                 <span>{tomorrowCount} cards due tomorrow</span>
              </div>
            )}
         </div>

         <div className="flex flex-col gap-3 w-full max-w-xs mx-auto mb-8">
            <button
               onClick={onBackToDashboard}
               className="w-full bg-primary hover:bg-primary-hover text-white font-bold py-3.5 rounded-xl shadow-lg shadow-primary/20 transition-all active:scale-[0.98]"
            >
               Finish
            </button>
            <button
               onClick={handleReviewAgain}
               className="w-full bg-white dark:bg-dark-surface border border-gray-200 dark:border-dark-border text-gray-700 dark:text-gray-200 font-bold py-3.5 rounded-xl transition-all hover:bg-gray-50 dark:hover:bg-dark-bg"
            >
               <div className="flex items-center justify-center gap-2">
                 <RotateCw className="w-4 h-4" /> {isPracticeMode ? 'Practice More' : 'Review These Again'}
               </div>
            </button>
         </div>
      </div>
    );
  }

  // --- Render: Flashcard Session ---
  if (!currentWord) return null;

  return (
    <>
      <div className="h-full w-full bg-transparent relative overflow-hidden flex flex-col">
        {/* Progress Bar */}
        <div className="h-1.5 w-full bg-gray-200 dark:bg-gray-700/50 shrink-0">
            <div 
              className="h-full bg-primary transition-all duration-300 ease-out"
              style={{ width: `${((currentIndex) / currentBatchIds.length) * 100}%` }}
            />
        </div>

        {/* Header */}
        <div className="flex items-center justify-between px-4 py-3 shrink-0">
            <button onClick={onBackToDashboard} className="text-gray-400 hover:text-gray-600 dark:hover:text-gray-200 transition-colors">
              <X className="w-6 h-6" />
            </button>
            <div className="text-xs font-bold text-gray-400 uppercase tracking-widest">
              {activeCollectionName}
            </div>
            <div className="text-sm font-medium text-gray-500 dark:text-gray-400">
              {currentIndex + 1} / {currentBatchIds.length}
            </div>
        </div>

        {/* Practice Mode Banner */}
        {isPracticeMode && (
          <div className="mx-4 mb-2 px-3 py-2 bg-purple-50 dark:bg-purple-900/20 border border-purple-200 dark:border-purple-800/30 rounded-lg flex items-center gap-2 animate-in slide-in-from-top duration-300">
            <span className="text-lg">⭐</span>
            <p className="text-xs font-semibold text-purple-700 dark:text-purple-300">
              Practice Mode - Extra review (doesn't affect scheduling)
            </p>
          </div>
        )}

        {/* Scrollable Content Area */}
        <div className="review-content flex-1 px-4">
            <div className="flashcard-container perspective-1000">
                <div 
                  className={`flashcard relative w-full max-w-md aspect-[4/5] sm:aspect-[4/3] transition-all duration-500 transform-style-3d cursor-pointer ${isFlipped ? 'flipped' : ''}`}
                  onClick={() => setIsFlipped(!isFlipped)}
                >
                  <div className="flashcard-inner">
                      {/* Front */}
                      <div className="flashcard-front">
                          <div className="text-xs font-bold text-white/60 uppercase tracking-wider mb-8">Word</div>
                          <h2 className="text-3xl sm:text-4xl font-bold text-white break-words w-full">
                            {currentWord.word}
                          </h2>
                          <div className="absolute bottom-8 text-sm text-white/60 animate-pulse">
                            Tap to reveal
                          </div>
                      </div>

                      {/* Back */}
                      <div className="flashcard-back">
                          <div className="text-xs font-bold text-white/60 uppercase tracking-wider mb-8">Meaning</div>
                          <p className="text-xl sm:text-2xl font-medium text-white leading-relaxed break-words w-full">
                            {currentWord.meaning}
                          </p>
                      </div>
                  </div>
                </div>
                
                {/* Animation Overlay */}
                {animatingId === currentWord.id && (
                  <div className="absolute inset-0 flex items-center justify-center pointer-events-none z-50 animate-out zoom-out duration-500">
                      <CheckCircle2 className="w-32 h-32 text-green-500 drop-shadow-2xl" strokeWidth={3} />
                  </div>
                )}
            </div>
        </div>
      </div>

      {/* Fixed Controls at Bottom */}
      <div className="difficulty-buttons-container safe-area-bottom">
          {!isFlipped ? (
             <div className="max-w-md mx-auto">
                 <button
                   onClick={() => setIsFlipped(true)}
                   className="w-full bg-primary hover:bg-primary-hover text-white font-bold py-4 rounded-xl shadow-lg shadow-primary/20 transition-all active:scale-[0.98] text-lg"
                 >
                   Show Answer
                 </button>
             </div>
          ) : (
             <div className="difficulty-buttons-grid">
                <button
                  onClick={() => handleRate('again')}
                  className="flex flex-col items-center justify-center py-3 rounded-xl bg-red-50 dark:bg-red-900/20 border border-red-100 dark:border-red-900/30 hover:bg-red-100 dark:hover:bg-red-900/40 transition-colors active:scale-95 group shadow-sm bg-white/90 dark:bg-dark-surface/90 backdrop-blur-sm"
                >
                   <span className="text-sm font-bold text-red-600 dark:text-red-400">Again</span>
                   <span className="text-[10px] text-red-400/80 group-hover:text-red-500 mt-1">{intervals?.again}</span>
                </button>
                
                <button
                  onClick={() => handleRate('hard')}
                  className="flex flex-col items-center justify-center py-3 rounded-xl bg-orange-50 dark:bg-orange-900/20 border border-orange-100 dark:border-orange-900/30 hover:bg-orange-100 dark:hover:bg-orange-900/40 transition-colors active:scale-95 group shadow-sm bg-white/90 dark:bg-dark-surface/90 backdrop-blur-sm"
                >
                   <span className="text-sm font-bold text-orange-600 dark:text-orange-400">Hard</span>
                   <span className="text-[10px] text-orange-400/80 group-hover:text-orange-500 mt-1">{intervals?.hard}</span>
                </button>

                <button
                  onClick={() => handleRate('good')}
                  className="flex flex-col items-center justify-center py-3 rounded-xl bg-blue-50 dark:bg-blue-900/20 border border-blue-100 dark:border-blue-900/30 hover:bg-blue-100 dark:hover:bg-blue-900/40 transition-colors active:scale-95 group shadow-sm bg-white/90 dark:bg-dark-surface/90 backdrop-blur-sm"
                >
                   <span className="text-sm font-bold text-blue-600 dark:text-blue-400">Good</span>
                   <span className="text-[10px] text-blue-400/80 group-hover:text-blue-500 mt-1">{intervals?.good}</span>
                </button>

                <button
                  onClick={() => handleRate('easy')}
                  className="flex flex-col items-center justify-center py-3 rounded-xl bg-green-50 dark:bg-green-900/20 border border-green-100 dark:border-green-900/30 hover:bg-green-100 dark:hover:bg-green-900/40 transition-colors active:scale-95 group shadow-sm bg-white/90 dark:bg-dark-surface/90 backdrop-blur-sm"
                >
                   <span className="text-sm font-bold text-green-600 dark:text-green-400">Easy</span>
                   <span className="text-[10px] text-green-400/80 group-hover:text-green-500 mt-1">{intervals?.easy}</span>
                </button>
             </div>
          )}
      </div>
    </>
  );
};