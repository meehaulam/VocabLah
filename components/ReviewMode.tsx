import React, { useState, useEffect, useMemo } from 'react';
import { VocabWord, Collection } from '../types';
import { SessionLimitOption } from './SettingsView';
import { ChevronLeft, RotateCw, PlayCircle, Check, Calendar, History, Brain, AlertCircle, X } from 'lucide-react';
import { calculateSM2, getSRSIntervalPreview, Difficulty, isCardDue, getNextDueInfo, getSRSSettings, getDailyCounts, incrementDailyCounts } from '../utils/srs';
import { getTodayDate, addDays } from '../utils/date';

// Feedback type for rating animations
type FeedbackType = 'again' | 'hard' | 'good' | 'easy' | null;

// Animated Checkmark Component
const GreenCheckmark: React.FC = () => (
  <div className="checkmark-circle">
    <svg className="checkmark-icon" viewBox="0 0 24 24">
      <path d="M5 13l4 4L19 7" />
    </svg>
  </div>
);

// Animated Star Component
const GoldStar: React.FC = () => (
  <div className="star-circle">
    <span className="star-icon">⭐</span>
  </div>
);

// Animated X Component
const RedX: React.FC = () => (
  <div className="redx-circle">
    <span className="redx-icon">✕</span>
  </div>
);

// Animated Warning Component
const OrangeWarning: React.FC = () => (
  <div className="warning-circle">
    <span className="warning-icon">!</span>
  </div>
);

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
  const [isBatchComplete, setIsBatchComplete] = useState(false);

  // Card Flip State
  const [isFlipped, setIsFlipped] = useState(false);

  // Feedback Overlay State
  const [showFeedback, setShowFeedback] = useState(false);
  const [feedbackType, setFeedbackType] = useState<FeedbackType>(null);

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
  const handleStartSession = (practiceAllCards = false) => {
    const srsSettings = getSRSSettings();
    const dailyCounts = getDailyCounts();

    // 1. Base Filter - Practice mode: all cards, Normal mode: due cards only
    let filteredWords = practiceAllCards ? [...words] : words.filter(isCardDue);

    if (selectedCollectionId && selectedCollectionId !== 'all') {
      filteredWords = filteredWords.filter(w => w.collectionId === selectedCollectionId);
      const col = collections.find(c => c.id === selectedCollectionId);
      setActiveCollectionName(col ? col.name : 'Unknown Collection');
    } else {
      setActiveCollectionName('All Collections');
    }

    // Skip daily limits in practice mode
    let allowedCards: VocabWord[] = [];

    if (practiceAllCards) {
      // Practice mode: use all filtered cards (no daily limits)
      allowedCards = filteredWords;
      if (sessionLimit !== 'all') {
        allowedCards = allowedCards.slice(0, sessionLimit);
      }
    } else {
      // 2. Apply Daily Limits for normal mode
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
      setLimitWarning("No cards available to practice.");
      return;
    }

    setLimitWarning(null);

    const sessionWordsCopy = allowedCards.map(w => ({ ...w }));
    setSessionWords(sessionWordsCopy);
    setIsPracticeMode(practiceAllCards);
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

    // Show feedback overlay
    setFeedbackType(difficulty);
    setShowFeedback(true);

    // Haptic feedback (mobile)
    if (navigator.vibrate) {
      navigator.vibrate(50);
    }

    const updatedWord = calculateSM2(currentWord, difficulty);

    setSessionStats(prev => ({
      ...prev,
      [difficulty]: prev[difficulty] + 1
    }));

    setSessionWords(prev => prev.map(w =>
      w.id === updatedWord.id ? updatedWord : w
    ));

    if (!isPracticeMode) {
       onUpdateWord(updatedWord);
    }

    // Wait for feedback animation, then advance
    setTimeout(() => {
      setShowFeedback(false);
      setFeedbackType(null);
      setIsFlipped(false);

      if (difficulty === 'again') {
         setCurrentBatchIds(prev => [...prev, currentWord.id]);
      } else {
         setCompletedIds(prev => new Set(prev).add(currentWord.id));
      }
      handleNext();
    }, 800);
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
              
              <button
                 onClick={() => handleStartSession(true)}
                 className="text-primary font-semibold hover:underline text-sm"
              >
                Practice anyway?
              </button>
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
      <div className="h-full flex flex-col p-6 pb-40 text-center animate-in zoom-in-95 duration-500 overflow-y-auto">
         <div className="flex-1 flex flex-col items-center justify-center space-y-6">
            <div className="w-24 h-24 bg-green-100 dark:bg-green-900/20 rounded-full flex items-center justify-center mb-2 animate-bounce">
               <Check className="w-12 h-12 text-green-600 dark:text-green-400" strokeWidth={3} />
            </div>

            <h2 className="text-3xl font-bold text-dark dark:text-dark-text">Session Complete!</h2>
            <p className="text-gray-500 dark:text-gray-400 max-w-xs mx-auto">
               You reviewed <span className="font-bold text-dark dark:text-dark-text">{completedIds.size}</span> cards.
            </p>

            <div className="grid grid-cols-2 gap-4 w-full max-w-xs mt-4">
               <div className="bg-gray-50 dark:bg-dark-surface p-4 rounded-xl border border-gray-100 dark:border-dark-border">
                  <div className="text-2xl font-bold text-orange-500">{sessionStats.hard + sessionStats.again}</div>
                  <div className="text-xs font-semibold text-gray-400 uppercase">Struggled</div>
               </div>
               <div className="bg-gray-50 dark:bg-dark-surface p-4 rounded-xl border border-gray-100 dark:border-dark-border">
                  <div className="text-2xl font-bold text-green-500">{sessionStats.good + sessionStats.easy}</div>
                  <div className="text-xs font-semibold text-gray-400 uppercase">Mastered</div>
               </div>
            </div>

            <div className="flex items-center gap-2 text-sm text-gray-500 dark:text-gray-400 bg-blue-50 dark:bg-blue-900/10 px-4 py-2 rounded-full">
               <History className="w-4 h-4" />
               <span>{tomorrowCount} cards due tomorrow</span>
            </div>
         </div>

         <div className="flex flex-col gap-3 w-full max-w-xs mx-auto mt-8">
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
                 <RotateCw className="w-4 h-4" /> Review These Again
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
      <div className="review-container h-full w-full bg-transparent relative overflow-hidden flex flex-col">
        {/* Session Progress Header */}
        <div className="session-progress-header">
          <span className="progress-text">Session Progress</span>
          <span className="progress-count">{currentIndex + 1} / {currentBatchIds.length}</span>
        </div>
        <div className="progress-bar">
          <div
            className="progress-fill"
            style={{ width: `${((currentIndex + 1) / currentBatchIds.length) * 100}%` }}
          />
        </div>

        {/* Header with close and collection name */}
        <div className="flex items-center justify-between px-5 py-2 shrink-0">
            <button onClick={onBackToDashboard} className="text-gray-400 hover:text-gray-600 dark:hover:text-gray-200 transition-colors">
              <X className="w-6 h-6" />
            </button>
            <div className="text-xs font-bold text-gray-400 uppercase tracking-widest">
              {activeCollectionName}
            </div>
            <div className="w-6"></div>
        </div>

        {/* Flashcard Wrapper - Tappable Card */}
        <div className="flashcard-wrapper flex-1">
          <div
            className="flashcard"
            onClick={() => !isFlipped && setIsFlipped(true)}
          >
            {!isFlipped ? (
              /* Front: Word */
              <div className="card-front">
                <div className="word-main">{currentWord.word}</div>
                <div className="tap-hint">Tap to reveal →</div>
              </div>
            ) : (
              /* Back: Meaning */
              <div className="card-back">
                <div className="word-main-small">{currentWord.word}</div>
                <div className="divider"></div>
                <div className="word-meaning">{currentWord.meaning}</div>
              </div>
            )}
          </div>
        </div>

        {/* 1x4 Difficulty Buttons Row */}
        {isFlipped && (
          <div className="difficulty-buttons-row">
            <button
              className="diff-btn btn-again"
              onClick={() => handleRate('again')}
            >
              <span className="diff-icon">↻</span>
              <span className="diff-label">Again</span>
              <span className="diff-time">{intervals?.again}</span>
            </button>

            <button
              className="diff-btn btn-hard"
              onClick={() => handleRate('hard')}
            >
              <span className="diff-icon">😐</span>
              <span className="diff-label">Hard</span>
              <span className="diff-time">{intervals?.hard}</span>
            </button>

            <button
              className="diff-btn btn-good"
              onClick={() => handleRate('good')}
            >
              <span className="diff-icon">😊</span>
              <span className="diff-label">Good</span>
              <span className="diff-time">{intervals?.good}</span>
            </button>

            <button
              className="diff-btn btn-easy"
              onClick={() => handleRate('easy')}
            >
              <span className="diff-icon">😎</span>
              <span className="diff-label">Easy</span>
              <span className="diff-time">{intervals?.easy}</span>
            </button>
          </div>
        )}
      </div>

      {/* Checkmark Feedback Overlay */}
      {showFeedback && (
        <div className="feedback-overlay">
          <div className="feedback-animation">
            {feedbackType === 'good' && <GreenCheckmark />}
            {feedbackType === 'easy' && <GoldStar />}
            {feedbackType === 'again' && <RedX />}
            {feedbackType === 'hard' && <OrangeWarning />}
          </div>
        </div>
      )}
    </>
  );
};