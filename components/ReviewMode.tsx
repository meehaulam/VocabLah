import React, { useState, useEffect, useMemo } from 'react';
import { VocabWord, Collection } from '../types';
import { SessionLimitOption } from './SettingsView';
import { ChevronLeft, RotateCw, PlayCircle, LayoutDashboard, Check, Calendar, Clock, History, Brain, TrendingUp, BookOpen, AlertCircle } from 'lucide-react';
import { calculateSM2, getSRSIntervalPreview, Difficulty, isCardDue, getNextDueInfo, getSRSSettings, getDailyCounts, incrementDailyCounts } from '../utils/srs';
import { getDaysDifference, getTodayDate, addDays } from '../utils/date';
import { Tooltip } from './Tooltip';

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
  const [startTime, setStartTime] = useState<number>(0);
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
  const handleStartSession = () => {
    const srsSettings = getSRSSettings();
    const dailyCounts = getDailyCounts();

    // 1. Base Filter (Due cards only)
    let filteredWords = words.filter(isCardDue);

    if (selectedCollectionId && selectedCollectionId !== 'all') {
      filteredWords = filteredWords.filter(w => w.collectionId === selectedCollectionId);
      const col = collections.find(c => c.id === selectedCollectionId);
      setActiveCollectionName(col ? col.name : 'Unknown Collection');
    } else {
      setActiveCollectionName('All Collections');
    }

    // 2. Apply Daily Limits (New Cards vs Review Cards)
    // Separate New vs Review
    const newCards = filteredWords.filter(w => w.repetitions === 0);
    const reviewCards = filteredWords.filter(w => w.repetitions > 0);

    // Calculate slots available
    const availableNewSlots = Math.max(0, srsSettings.newCardsLimit - dailyCounts.newCards);
    const availableReviewSlots = Math.max(0, srsSettings.maxReviewsLimit - dailyCounts.reviews);

    // Filter New Cards
    const limitedNewCards = newCards.slice(0, availableNewSlots);
    
    // Filter Review Cards (Assuming review slots applies to *all* cards reviewed, but practically we prioritize actual reviews)
    // If maxReviewsLimit tracks TOTAL reviews, we must ensure (limitedNew + limitedReviews) <= availableReviewSlots
    // Usually 'Max Reviews' implies total activity.
    let allowedCards: VocabWord[] = [];
    
    if (availableReviewSlots <= 0) {
        setLimitWarning("You've reached your daily review limit!");
        return; // Or allow start but empty? Better to warn.
    }

    // Prioritize Reviews over New Cards usually, OR mix them.
    // Let's take reviews first to fill the daily quota.
    const limitedReviews = reviewCards.slice(0, availableReviewSlots);
    
    // Check space left for new cards in the daily total quota
    const spaceLeftForNew = Math.max(0, availableReviewSlots - limitedReviews.length);
    // Take new cards, limited by BOTH the new card specific limit AND the total review limit
    const finalNewCards = limitedNewCards.slice(0, spaceLeftForNew);

    allowedCards = [...limitedReviews, ...finalNewCards];
    
    // Sort? Maybe shuffle? For now keep order (usually due first or random)
    // Let's shuffle slightly or keep sorted by due date (which is usually today/past)

    // 3. Apply Session Batch Limit
    if (sessionLimit !== 'all') {
      allowedCards = allowedCards.slice(0, sessionLimit);
    }

    if (allowedCards.length === 0) {
        // If we filtered down to 0 due to limits (but had cards due)
        if (filteredWords.length > 0) {
            setLimitWarning("Daily limits reached for today! Come back tomorrow.");
            return;
        }
    }

    setLimitWarning(null);

    // Deep copy words for session
    const sessionWordsCopy = allowedCards.map(w => ({ ...w }));
    setSessionWords(sessionWordsCopy);
    setIsPracticeMode(false);
    setIsSetupComplete(true);
    setSessionStats({ again: 0, hard: 0, good: 0, easy: 0 });
    setStartTime(Date.now());
    
    // Initialize batch
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
    setStartTime(Date.now());
    
    // Reset mastery for all words in the CURRENT session for practice
    // (In practice mode, 'mastered' flag in session isn't saved, but we use it for UI state)
    const resetWords = sessionWords.map(w => ({ ...w, mastered: false }));
    setSessionWords(resetWords);
    
    // Re-initialize batch with these reset words
    const newBatch = resetWords.map(w => w.id);
    setCurrentBatchIds(newBatch);
    setCompletedIds(new Set());
    setCurrentIndex(0);
    setIsBatchComplete(false);
    setIsFlipped(false);
  };

  // --- Session Logic ---

  const currentWordId = currentBatchIds[currentIndex];
  // Look up word in local session state
  const currentWord = sessionWords.find(w => w.id === currentWordId);

  // SRS Logic - Estimated Intervals
  const intervals = useMemo(() => currentWord ? getSRSIntervalPreview(currentWord) : null, [currentWord]);

  // Track new cards started
  useEffect(() => {
      if (!isPracticeMode && currentWord && currentWord.repetitions === 0 && !newCardsStarted.has(currentWord.id)) {
          setNewCardsStarted(prev => new Set(prev).add(currentWord.id));
      }
  }, [currentWord, isPracticeMode, newCardsStarted]);

  const handleNext = () => {
    setIsFlipped(false); // Reset flip state for new card
    if (currentIndex < currentBatchIds.length - 1) {
      setCurrentIndex(prev => prev + 1);
    } else {
      handleSessionComplete();
    }
  };

  const handleSessionComplete = () => {
      // Update Daily Counts
      if (!isPracticeMode) {
          incrementDailyCounts(completedIds.size, newCardsStarted.size);
      }
      setIsBatchComplete(true);
  };

  const handlePrev = () => {
    setIsFlipped(false); // Reset flip state
    if (currentIndex > 0) {
      setCurrentIndex(prev => prev - 1);
    }
  };

  const handleRate = (difficulty: Difficulty) => {
    if (!currentWord) return;

    // 1. Calculate new SRS values
    const updatedWord = calculateSM2(currentWord, difficulty);
    
    // 2. Track stats
    setSessionStats(prev => ({
      ...prev,
      [difficulty]: prev[difficulty] + 1
    }));

    // 3. Update local session state
    setSessionWords(prev => prev.map(w => 
      w.id === updatedWord.id ? updatedWord : w
    ));

    // 4. Trigger Mastery Animation for positive feedback
    const isMastered = (difficulty === 'good' || difficulty === 'easy');
    if (isMastered) {
      setAnimatingId(currentWord.id);
    }
    
    // 5. Sync global state (only if not practice mode)
    // We update immediately so if they quit, progress is saved
    if (!isPracticeMode) {
       onUpdateWord(updatedWord);
    }

    setTimeout(() => {
      setAnimatingId(null);

      // 6. Handle "Again" logic (Re-queue)
      if (difficulty === 'again') {
         setCurrentBatchIds(prev => [...prev, currentWord.id]);
         // Don't mark as complete yet because we added it back
      } else {
         // Mark as completed for this round
         setCompletedIds(prev => new Set(prev).add(currentWord.id));
      }
      
      handleNext();
    }, isMastered ? 600 : 200);
  };

  // --- Helper for Completion Screen ---
  const getNextReviewsForecast = () => {
    // We use the global 'words' prop which should contain updated data
    const today = getTodayDate();
    const tomorrow = addDays(today, 1);
    const weekEnd = addDays(today, 7);
    
    const tomorrowCount = words.filter(w => w.nextReviewDate === tomorrow).length;
    const weekCount = words.filter(w => w.nextReviewDate > today && w.nextReviewDate <= weekEnd).length;

    return { tomorrowCount, weekCount };
  };

  const getRetentionColor = (rate: number) => {
    if (rate >= 85) return 'text-green-500';
    if (rate >= 70) return 'text-blue-500';
    if (rate >= 60) return 'text-orange-500';
    return 'text-red-500';
  };

  const getRetentionMessage = (rate: number) => {
    if (rate >= 85) return '🎉 Excellent!';
    if (rate >= 70) return '✅ Good job!';
    if (rate >= 60) return '⚠️ Keep practicing';
    return '📚 Needs review';
  };

  // --- Render: Setup Screen ---
  if (!isSetupComplete) {
    const totalDue = dueCounts['all'] || 0;
    
    // Empty State: No Cards Due
    if (totalDue === 0) {
      return (
        <div className="h-full flex flex-col items-center justify-center p-6 text-center animate-in fade-in duration-500">
           <div className="text-6xl mb-6 animate-bounce">🎉</div>
           <h2 className="text-2xl font-bold text-dark dark:text-dark-text mb-2">No cards due today!</h2>
           <p className="text-gray-500 dark:text-dark-text-sec mb-6 max-w-xs">
             All your reviews are up to date. Great work!
           </p>
           
           {/* Next Due Info */}
           {nextDueInfo && (
             <div className="bg-blue-50 dark:bg-blue-900/10 border border-blue-100 dark:border-blue-900/30 rounded-xl p-4 mb-8 flex items-center gap-3">
                <div className="p-2 bg-blue-100 dark:bg-blue-800/30 rounded-full text-blue-600 dark:text-blue-400">
                  <Calendar className="w-5 h-5" />
                </div>
                <div className="text-left">
                  <p className="text-xs text-gray-500 dark:text-gray-400 font-semibold uppercase tracking-wide">Next due</p>
                  <p className="text-sm font-bold text-dark dark:text-dark-text">
                    {nextDueInfo.count} cards {nextDueInfo.timeText}
                  </p>
                </div>
             </div>
           )}

           <button
             onClick={onBackToDashboard}
             className="w-full max-w-xs bg-primary hover:bg-primary-hover text-white font-bold py-3.5 px-6 rounded-xl transition-all shadow-lg shadow-primary/20"
           >
             Back to Dashboard
           </button>
        </div>
      );
    }

    // Filter collections that actually have due cards
    const reviewableCollections = collections
      .filter(c => c.id !== 'all')
      .filter(c => (dueCounts[c.id] || 0) > 0)
      .sort((a, b) => a.name.localeCompare(b.name));

    const selectedCount = selectedCollectionId 
       ? (dueCounts[selectedCollectionId] || 0) 
       : totalDue;
    
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
                <div className="text-sm text-gray-500 dark:text-gray-400">{totalDue} cards due</div>
              </div>
              <div className="text-2xl opacity-50">📚</div>
            </label>

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
                  <div className="text-sm text-gray-500 dark:text-gray-400">{dueCounts[col.id]} cards due</div>
                </div>
                <div className="text-2xl">{col.icon}</div>
              </label>
            ))}
          </div>

          {/* Warning Message if limits are hit */}
          {limitWarning && (
             <div className="mt-4 p-4 bg-orange-50 dark:bg-orange-900/20 border border-orange-200 dark:border-orange-900/30 rounded-xl flex items-start gap-3">
                 <AlertCircle className="w-5 h-5 text-orange-500 shrink-0 mt-0.5" />
                 <p className="text-sm text-orange-700 dark:text-orange-300 font-medium">
                   {limitWarning}
                 </p>
             </div>
          )}
        </div>

        <div className="mt-4 pt-4 border-t border-gray-100 dark:border-dark-border space-y-4">
           {!limitWarning && (
             <div className="flex items-center justify-between text-sm text-gray-500 dark:text-dark-text-sec px-1">
               <span>Estimated time:</span>
               <span className="font-bold text-dark dark:text-dark-text">~{estimatedMinutes} minute{estimatedMinutes !== 1 ? 's' : ''}</span>
             </div>
           )}

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
    const totalReviews = sessionStats.again + sessionStats.hard + sessionStats.good + sessionStats.easy;
    const retentionRate = totalReviews > 0 
      ? Math.round(((sessionStats.good + sessionStats.easy) / totalReviews) * 100)
      : 0;
    
    // Calculate Study Time
    const durationMs = Date.now() - startTime;
    const minutes = Math.floor(durationMs / 60000);
    const seconds = Math.round((durationMs % 60000) / 1000);
    const timeDisplay = minutes > 0 ? `${minutes}m ${seconds}s` : `${seconds}s`;

    // Learning vs Mature counts (based on session end state)
    // Filter sessionWords by those that were actually part of the unique completions
    const finalProcessedWords = sessionWords.filter(w => completedIds.has(w.id));
    const learningCount = finalProcessedWords.filter(w => w.interval < 21).length;
    const matureCount = finalProcessedWords.filter(w => w.interval >= 21).length;

    // Forecast
    const forecast = getNextReviewsForecast();

    return (
      <div className="h-full overflow-y-auto custom-scrollbar animate-in fade-in duration-500">
        <div className="flex flex-col items-center p-6 text-center max-w-md mx-auto">
          
          <div className="text-6xl mb-4 animate-bounce">🎉</div>
          
          <h2 className="text-2xl font-bold text-dark dark:text-dark-text mb-1">
            {isPracticeMode ? "Practice Complete!" : "Session Complete!"}
          </h2>
          <p className="text-sm text-gray-500 dark:text-dark-text-sec mb-6 flex items-center gap-1.5">
            <BookOpen className="w-4 h-4" />
            Reviewed: {activeCollectionName}
          </p>

          {/* 1. Main Stats Grid */}
          <div className="w-full grid grid-cols-2 gap-3 mb-6">
             {/* Retention Card */}
             <div className="bg-white dark:bg-dark-surface rounded-xl p-4 shadow-sm border border-gray-100 dark:border-dark-border flex flex-col items-center justify-center">
                <span className={`text-3xl font-bold ${getRetentionColor(retentionRate)}`}>
                  {retentionRate}%
                </span>
                <span className="text-xs font-semibold text-gray-400 uppercase mt-1">Retention</span>
                <span className="text-[10px] text-gray-500 mt-1">{getRetentionMessage(retentionRate)}</span>
             </div>

             {/* Study Time Card */}
             <div className="bg-white dark:bg-dark-surface rounded-xl p-4 shadow-sm border border-gray-100 dark:border-dark-border flex flex-col items-center justify-center">
                <span className="text-3xl font-bold text-dark dark:text-dark-text">
                  {timeDisplay}
                </span>
                <span className="text-xs font-semibold text-gray-400 uppercase mt-1">Study Time</span>
                <div className="flex items-center gap-1 mt-1">
                   <Clock className="w-3 h-3 text-gray-400" />
                   <span className="text-[10px] text-gray-500">Duration</span>
                </div>
             </div>
          </div>

          {/* 2. Detailed Performance */}
          <div className="w-full bg-white dark:bg-dark-surface rounded-xl shadow-sm border border-gray-100 dark:border-dark-border p-4 mb-6">
            <h3 className="text-xs font-bold text-gray-400 dark:text-gray-500 uppercase tracking-wider mb-4 text-left">Performance Breakdown</h3>
            <div className="grid grid-cols-4 gap-2 text-center">
              <div className="flex flex-col items-center">
                <span className="text-lg font-bold text-red-500">{sessionStats.again}</span>
                <span className="text-[10px] font-medium text-gray-500 dark:text-gray-400">Again</span>
              </div>
              <div className="flex flex-col items-center">
                <span className="text-lg font-bold text-orange-500">{sessionStats.hard}</span>
                <span className="text-[10px] font-medium text-gray-500 dark:text-gray-400">Hard</span>
              </div>
              <div className="flex flex-col items-center">
                <span className="text-lg font-bold text-blue-500">{sessionStats.good}</span>
                <span className="text-[10px] font-medium text-gray-500 dark:text-gray-400">Good</span>
              </div>
              <div className="flex flex-col items-center">
                <span className="text-lg font-bold text-green-500">{sessionStats.easy}</span>
                <span className="text-[10px] font-medium text-gray-500 dark:text-gray-400">Easy</span>
              </div>
            </div>
          </div>

          {/* 3. Card Progress & Forecast */}
          <div className="w-full bg-gray-50 dark:bg-dark-surface/50 rounded-xl border border-gray-200 dark:border-dark-border p-4 mb-8">
             <div className="grid grid-cols-1 sm:grid-cols-2 gap-6 text-left">
                {/* Progress */}
                <div>
                   <h4 className="flex items-center gap-2 text-xs font-bold text-gray-500 dark:text-gray-400 uppercase mb-2">
                     <Brain className="w-3.5 h-3.5" />
                     Card Progress
                   </h4>
                   <ul className="space-y-1.5 text-sm">
                      <li className="flex justify-between">
                        <span className="text-gray-600 dark:text-dark-text-sec">Still Learning</span>
                        <span className="font-bold text-orange-500">{learningCount}</span>
                      </li>
                      <li className="flex justify-between">
                        <span className="text-gray-600 dark:text-dark-text-sec">Now Mature</span>
                        <span className="font-bold text-green-500">{matureCount}</span>
                      </li>
                   </ul>
                </div>
                
                {/* Forecast */}
                <div>
                   <h4 className="flex items-center gap-2 text-xs font-bold text-gray-500 dark:text-gray-400 uppercase mb-2">
                     <Calendar className="w-3.5 h-3.5" />
                     Upcoming Reviews
                   </h4>
                   <ul className="space-y-1.5 text-sm">
                      <li className="flex justify-between">
                        <span className="text-gray-600 dark:text-dark-text-sec">Tomorrow</span>
                        <span className="font-bold text-dark dark:text-dark-text">{forecast.tomorrowCount}</span>
                      </li>
                      <li className="flex justify-between">
                        <span className="text-gray-600 dark:text-dark-text-sec">This Week</span>
                        <span className="font-bold text-dark dark:text-dark-text">{forecast.weekCount}</span>
                      </li>
                   </ul>
                </div>
             </div>
          </div>

          {/* Actions */}
          <div className="flex flex-col gap-3 w-full">
            <button
              onClick={onBackToDashboard}
              className="w-full bg-primary hover:bg-primary-hover text-white font-bold py-3.5 px-6 rounded-xl transition-all shadow-lg shadow-primary/20 active:scale-[0.98] flex items-center justify-center gap-2"
            >
              <LayoutDashboard className="w-5 h-5" />
              Back to Dashboard
            </button>

            <button
              onClick={handleReviewAgain}
              className="w-full bg-white dark:bg-dark-surface border-2 border-gray-200 dark:border-dark-border text-gray-600 dark:text-gray-300 hover:bg-gray-50 dark:hover:bg-dark-bg font-bold py-3.5 px-6 rounded-xl transition-colors flex items-center justify-center gap-2"
            >
              <RotateCw className="w-5 h-5" />
              Review Again
            </button>
          </div>
        </div>
      </div>
    );
  }

  // --- Render: Active Session ---
  if (!currentWord) return null;

  // Calculate session progress
  const progressPercent = ((currentIndex) / currentBatchIds.length) * 100;
  const remainingCards = currentBatchIds.length - currentIndex;
  const estimatedTimeLeft = Math.ceil(remainingCards * 0.5); // 0.5 min per card

  return (
    <div className="flex flex-col h-full bg-background dark:bg-dark-bg transition-colors">
      
      {/* 1. Enhanced Session Header */}
      <div className="bg-white dark:bg-dark-surface border-b border-gray-100 dark:border-dark-border shadow-sm">
         <div className="max-w-2xl mx-auto px-4 py-3">
            <div className="flex justify-between items-center mb-2">
               <h3 className="font-bold text-dark dark:text-dark-text text-sm truncate max-w-[200px]">
                 {activeCollectionName}
               </h3>
               <div className="flex items-center gap-3 text-xs font-medium text-gray-500 dark:text-dark-text-sec">
                  <span>{currentIndex + 1}/{currentBatchIds.length} cards</span>
                  <span className="w-px h-3 bg-gray-300 dark:bg-dark-border"></span>
                  <span className="flex items-center gap-1">
                     <Clock className="w-3 h-3" />
                     ~{estimatedTimeLeft}m left
                  </span>
               </div>
            </div>
            
            {/* Progress Bar */}
            <div className="h-1.5 w-full bg-gray-100 dark:bg-dark-bg rounded-full overflow-hidden">
               <div 
                 className="h-full bg-primary rounded-full transition-all duration-300 ease-out"
                 style={{ width: `${progressPercent}%` }}
               />
            </div>
         </div>
      </div>

      {/* Main Flashcard Area */}
      <div className="flex-1 flex flex-col justify-center perspective-1000 w-full max-w-2xl mx-auto p-4 relative">
        <div 
          className={`flashcard ${isFlipped ? 'flipped' : ''}`} 
          onClick={() => setIsFlipped(!isFlipped)}
        >
          <div className="flashcard-inner">
            
            {/* FRONT FACE */}
            <div className="flashcard-front">
               
               {/* Word */}
               <div className="flex-1 flex flex-col justify-center items-center w-full">
                  <h2 className="text-4xl sm:text-5xl font-bold text-dark dark:text-dark-text mb-6 text-center break-words max-w-full px-4">
                    {currentWord.word}
                  </h2>
                  <div className="h-1 w-12 bg-primary/20 rounded-full"></div>
               </div>

               {/* Hint */}
               <div className="mt-auto mb-4 text-sm text-gray-400 dark:text-gray-500 font-medium animate-pulse flex items-center gap-2">
                  Tap to flip
               </div>
            </div>

            {/* BACK FACE */}
            <div className="flashcard-back relative">
               
               {/* Content */}
               <div className="flex-1 flex flex-col justify-center items-center w-full">
                  <p className="text-xl sm:text-2xl text-gray-700 dark:text-dark-text font-medium leading-relaxed text-center px-4 mb-6">
                      {currentWord.meaning}
                  </p>
                  
                  {/* Card Context Info */}
                  <div className="bg-gray-50 dark:bg-dark-bg/50 rounded-lg p-3 text-xs text-gray-500 dark:text-gray-400 flex flex-col gap-1.5 min-w-[200px] border border-gray-100 dark:border-dark-border">
                     <div className="flex items-center justify-between">
                        <span className="flex items-center gap-1.5">
                           <History className="w-3 h-3" /> Seen
                        </span>
                        <span className="font-semibold">{currentWord.repetitions === 0 ? 'New' : `${currentWord.repetitions} times`}</span>
                     </div>
                     {currentWord.repetitions > 0 && (
                       <>
                         <div className="flex items-center justify-between">
                            <span className="flex items-center gap-1.5">
                               <TrendingUp className="w-3 h-3" /> Interval
                            </span>
                            <span className="font-semibold">{currentWord.interval} days</span>
                         </div>
                         <div className="flex items-center justify-between">
                            <span className="flex items-center gap-1.5">
                               <Calendar className="w-3 h-3" /> Last Review
                            </span>
                            <span className="font-semibold">
                              {currentWord.lastReviewDate 
                                ? `${getDaysDifference(currentWord.lastReviewDate, getTodayDate())} days ago` 
                                : 'Never'}
                            </span>
                         </div>
                       </>
                     )}
                  </div>
               </div>

               <div className="mt-auto mb-4 text-sm text-gray-400 dark:text-gray-500 font-medium">
                  Select difficulty below
               </div>
            </div>
          </div>
        </div>
      </div>

      {/* Controls Area */}
      <div className="w-full max-w-2xl mx-auto p-4 pt-0 relative z-20">
        
        {/* Animated Checkmark Overlay */}
        {animatingId === currentWord.id && (
          <div className="absolute bottom-full left-0 right-0 flex justify-center pointer-events-none z-50 pb-10">
             <div className="animate-check-bounce bg-white dark:bg-dark-surface rounded-full p-4 shadow-xl border-4 border-green-100 dark:border-green-900/30">
                <Check className="w-12 h-12 text-green-500" strokeWidth={4} />
             </div>
          </div>
        )}

        {/* Navigation & Flip Hint */}
        {!isFlipped && (
           <div className="flex items-center justify-between mb-4 px-2">
              <button
                onClick={handlePrev}
                disabled={currentIndex === 0}
                className={`p-2 rounded-full transition-all flex items-center gap-2 ${
                  currentIndex === 0
                    ? 'text-gray-300 dark:text-gray-700 cursor-not-allowed'
                    : 'text-gray-500 hover:bg-gray-100 dark:hover:bg-dark-surface hover:text-primary'
                }`}
              >
                <ChevronLeft className="w-6 h-6" />
              </button>
              
              <span className="text-xs font-semibold text-gray-400 uppercase tracking-widest">
                Flip card to rate
              </span>

              <div className="w-10"></div> {/* Spacer */}
           </div>
        )}

        {/* Difficulty Help Text */}
        <div className={`flex flex-col items-center mb-2 transition-all duration-300 ${isFlipped ? 'opacity-100 translate-y-0' : 'opacity-0 translate-y-4 pointer-events-none'}`}>
            <div className="flex items-center gap-1 text-[13px] text-gray-400 dark:text-gray-500">
               Rate how well you remembered
               <Tooltip content="Again = didn't remember. Hard = struggled. Good = remembered well. Easy = very easy." />
            </div>
        </div>

        {/* 4-Button Difficulty Grid */}
        <div className={`grid grid-cols-4 gap-2 sm:gap-3 w-full transition-all duration-300 ${isFlipped ? 'opacity-100 translate-y-0' : 'opacity-0 translate-y-4 pointer-events-none'}`}>
          {/* Again */}
          <button
            onClick={() => handleRate('again')}
            className="flex flex-col items-center justify-center py-3 px-1 rounded-xl border-b-4 bg-red-50 border-red-200 text-red-700 dark:bg-red-900/20 dark:text-red-300 dark:border-red-900 active:border-b-0 active:translate-y-1 transition-all h-24 sm:h-28 relative"
          >
            <span className="text-xl sm:text-2xl mb-1">❌</span>
            <span className="font-bold text-xs sm:text-sm uppercase tracking-wide flex items-center gap-1">Again</span>
            <span className="text-[10px] opacity-75 font-medium mt-1">{intervals?.again}</span>
          </button>

          {/* Hard */}
          <button
            onClick={() => handleRate('hard')}
            className="flex flex-col items-center justify-center py-3 px-1 rounded-xl border-b-4 bg-orange-50 border-orange-200 text-orange-700 dark:bg-orange-900/20 dark:text-orange-300 dark:border-orange-900 active:border-b-0 active:translate-y-1 transition-all h-24 sm:h-28 relative"
          >
            <span className="text-xl sm:text-2xl mb-1">😐</span>
            <span className="font-bold text-xs sm:text-sm uppercase tracking-wide flex items-center gap-1">Hard</span>
            <span className="text-[10px] opacity-75 font-medium mt-1">{intervals?.hard}</span>
          </button>

          {/* Good */}
          <button
            onClick={() => handleRate('good')}
            className="flex flex-col items-center justify-center py-3 px-1 rounded-xl border-b-4 bg-blue-50 border-blue-200 text-blue-700 dark:bg-blue-900/20 dark:text-blue-300 dark:border-blue-900 active:border-b-0 active:translate-y-1 transition-all h-24 sm:h-28 relative"
          >
            <span className="text-xl sm:text-2xl mb-1">✅</span>
            <span className="font-bold text-xs sm:text-sm uppercase tracking-wide flex items-center gap-1">Good</span>
            <span className="text-[10px] opacity-75 font-medium mt-1">{intervals?.good}</span>
          </button>

          {/* Easy */}
          <button
            onClick={() => handleRate('easy')}
            className="flex flex-col items-center justify-center py-3 px-1 rounded-xl border-b-4 bg-green-50 border-green-200 text-green-700 dark:bg-green-900/20 dark:text-green-300 dark:border-green-900 active:border-b-0 active:translate-y-1 transition-all h-24 sm:h-28 relative"
          >
            <span className="text-xl sm:text-2xl mb-1">💯</span>
            <span className="font-bold text-xs sm:text-sm uppercase tracking-wide flex items-center gap-1">Easy</span>
            <span className="text-[10px] opacity-75 font-medium mt-1">{intervals?.easy}</span>
          </button>
        </div>
      </div>
    </div>
  );
};