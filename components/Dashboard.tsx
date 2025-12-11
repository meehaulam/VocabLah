import React, { useState, useEffect } from 'react';
import { VocabWord } from '../types';
import { PlusCircle, BookOpen, CheckCircle2, CalendarClock, AlertTriangle, X, Calendar } from 'lucide-react';
import { isCardDue } from '../utils/srs';
import { getTodayDate, addDays } from '../utils/date';
import { Tooltip } from './Tooltip';

interface DashboardProps {
  words: VocabWord[];
  onStartReview: () => void;
  onAddWord: () => void;
  onGoToWordBank: (filter?: 'all' | 'learning' | 'mastered') => void;
}

const REMINDER_DISMISSED_KEY = 'vocab_lah_reminder_dismissed';

const MOTIVATIONAL_MESSAGES = [
  "Ready to strengthen your memory? 💪",
  "A few minutes of review goes a long way! 🌟",
  "Your brain is ready to learn! 🧠",
  "Quick review session? ⚡"
];

export const Dashboard: React.FC<DashboardProps> = ({ 
  words, 
  onStartReview, 
  onAddWord,
  onGoToWordBank 
}) => {
  const totalWords = words.length;
  
  // SRS Stats
  const dueCards = words.filter(isCardDue);
  const dueCount = dueCards.length;
  const overdueCount = dueCards.filter(w => w.nextReviewDate < getTodayDate()).length;
  
  const newCount = words.filter(w => w.repetitions === 0).length;
  // Learning: Started (reps > 0) but not yet mastered/mature
  const learningCount = words.filter(w => w.repetitions > 0 && !w.mastered).length; 
  const matureCount = words.filter(w => w.mastered).length;
  
  // Progress Ring (Mature %)
  const progress = totalWords > 0 ? Math.round((matureCount / totalWords) * 100) : 0;

  // Forecast
  const today = getTodayDate();
  const tomorrow = addDays(today, 1);
  const weekEnd = addDays(today, 7);
  
  const dueTomorrow = words.filter(w => w.nextReviewDate === tomorrow).length;
  const dueThisWeek = words.filter(w => w.nextReviewDate > today && w.nextReviewDate <= weekEnd).length;

  const isUrgent = dueCount > 15;

  // Banner State
  const [isBannerVisible, setIsBannerVisible] = useState(false);
  const [motivationalMessage, setMotivationalMessage] = useState("");

  useEffect(() => {
    setMotivationalMessage(MOTIVATIONAL_MESSAGES[Math.floor(Math.random() * MOTIVATIONAL_MESSAGES.length)]);
  }, []);

  useEffect(() => {
    const dismissedDate = localStorage.getItem(REMINDER_DISMISSED_KEY);
    
    // Show banner if: cards are due AND not dismissed today
    if (dueCount > 0 && dismissedDate !== today) {
      setIsBannerVisible(true);
    } else {
      setIsBannerVisible(false);
    }
  }, [dueCount, today]);

  const handleDismissBanner = () => {
    setIsBannerVisible(false);
    localStorage.setItem(REMINDER_DISMISSED_KEY, today);
  };

  const handleReviewFromBanner = () => {
    handleDismissBanner();
    onStartReview();
  };

  // Banner Config based on urgency
  const getBannerConfig = () => {
    if (dueCount <= 10) {
      return {
        style: "bg-blue-50 dark:bg-blue-900/20 border-blue-500",
        icon: <BookOpen className="w-6 h-6 text-blue-600 dark:text-blue-400" />,
        textClass: "text-blue-900 dark:text-blue-100",
        btnPrimary: "bg-blue-600 hover:bg-blue-700 text-white",
        btnSecondary: "text-blue-600 dark:text-blue-300 border-blue-200 dark:border-blue-800 hover:bg-blue-100 dark:hover:bg-blue-900/30"
      };
    } else if (dueCount <= 20) {
      return {
        style: "bg-orange-50 dark:bg-orange-900/20 border-orange-500",
        icon: <Calendar className="w-6 h-6 text-orange-600 dark:text-orange-400" />,
        textClass: "text-orange-900 dark:text-orange-100",
        btnPrimary: "bg-orange-600 hover:bg-orange-700 text-white",
        btnSecondary: "text-orange-600 dark:text-orange-300 border-orange-200 dark:border-orange-800 hover:bg-orange-100 dark:hover:bg-orange-900/30"
      };
    } else {
      return {
        style: "bg-red-50 dark:bg-red-900/20 border-red-500",
        icon: <AlertTriangle className="w-6 h-6 text-red-600 dark:text-red-400" />,
        textClass: "text-red-900 dark:text-red-100",
        btnPrimary: "bg-red-600 hover:bg-red-700 text-white",
        btnSecondary: "text-red-600 dark:text-red-300 border-red-200 dark:border-red-800 hover:bg-red-100 dark:hover:bg-red-900/30"
      };
    }
  };

  const bannerConfig = getBannerConfig();
  const bannerMessage = `You have ${dueCount} cards due today. ${motivationalMessage}`;

  return (
    <div className="flex flex-col h-full gap-6 p-1 animate-in fade-in duration-500">
      
      {/* Reminder Banner */}
      {isBannerVisible && (
        <div className={`relative flex flex-col sm:flex-row items-start sm:items-center justify-between p-4 -mb-2 rounded-xl shadow-sm border-l-4 animate-in slide-in-from-top duration-300 ${bannerConfig.style}`}>
          <div className="flex items-start sm:items-center gap-3 flex-1 mr-8">
            <div className="shrink-0 mt-0.5 sm:mt-0">
              {bannerConfig.icon}
            </div>
            <p className={`text-sm font-medium leading-relaxed ${bannerConfig.textClass}`}>
              {bannerMessage}
            </p>
          </div>
          
          <div className="flex gap-2 mt-3 sm:mt-0 w-full sm:w-auto">
            <button
              onClick={handleReviewFromBanner}
              className={`flex-1 sm:flex-none px-4 py-2 rounded-lg text-sm font-bold shadow-sm transition-colors active:scale-95 ${bannerConfig.btnPrimary}`}
            >
              Review Now
            </button>
            <button
              onClick={handleDismissBanner}
              className={`flex-1 sm:flex-none px-4 py-2 rounded-lg text-sm font-medium border transition-colors ${bannerConfig.btnSecondary}`}
            >
              Dismiss
            </button>
          </div>

          <button 
            onClick={handleDismissBanner}
            className="absolute top-2 right-2 p-1 text-gray-400 hover:text-gray-600 dark:hover:text-gray-300 rounded-full transition-colors"
          >
            <X className="w-4 h-4" />
          </button>
        </div>
      )}

      {/* 2. Hero Section (Urgency + Ring + Action) */}
      <div className="flex flex-col items-center justify-center space-y-6 flex-1 min-h-[280px]">
        
        {/* Urgency Message */}
        <div className={`text-center transition-colors duration-300 ${isUrgent ? 'animate-pulse' : ''}`}>
           {totalWords === 0 ? (
             <h2 className="text-xl sm:text-2xl font-bold text-dark dark:text-dark-text">Start your journey!</h2>
           ) : dueCount > 0 ? (
             <div className="space-y-1">
               <h2 className={`text-2xl sm:text-3xl font-bold ${isUrgent ? 'text-orange-600 dark:text-orange-500' : 'text-dark dark:text-dark-text'}`}>
                 {dueCount} cards due today
                 <Tooltip content="Cards ready for review based on spaced repetition. The app shows cards when your brain is ready to learn!" />
               </h2>
               {overdueCount > 0 && (
                 <p className="flex items-center justify-center gap-1.5 text-sm font-semibold text-red-500 bg-red-50 dark:bg-red-900/20 py-1 px-3 rounded-full inline-flex">
                   <AlertTriangle className="w-3.5 h-3.5" />
                   {overdueCount} overdue
                 </p>
               )}
             </div>
           ) : (
             <div className="space-y-1">
               <h2 className="text-2xl sm:text-3xl font-bold text-green-600 dark:text-green-500 flex items-center gap-2 justify-center">
                  <span>No cards due!</span>
                  <span className="text-2xl">🎉</span>
               </h2>
               <p className="text-gray-500 dark:text-dark-text-sec font-medium">You're all caught up</p>
             </div>
           )}
        </div>

        {/* Circular Ring (Mature %) */}
        <div className="relative w-40 h-40 sm:w-48 sm:h-48 group cursor-default">
           <div className="absolute inset-0 bg-white/50 dark:bg-white/5 rounded-full blur-xl transform group-hover:scale-110 transition-transform duration-700"></div>
           <svg viewBox="0 0 36 36" className="w-full h-full transform -rotate-90 relative z-10">
            <path
              className="text-gray-100 dark:text-dark-surface stroke-current"
              d="M18 2.0845 a 15.9155 15.9155 0 0 1 0 31.831 a 15.9155 15.9155 0 0 1 0 -31.831"
              fill="none"
              strokeWidth="3"
            />
            <path
              className={`${progress === 100 ? 'text-green-500' : 'text-primary'} drop-shadow-md transition-all duration-1000 ease-out`}
              strokeDasharray={`${progress}, 100`}
              d="M18 2.0845 a 15.9155 15.9155 0 0 1 0 31.831 a 15.9155 15.9155 0 0 1 0 -31.831"
              fill="none"
              stroke="currentColor"
              strokeWidth="3"
              strokeLinecap="round"
            />
          </svg>
          
          <div className="absolute inset-0 flex flex-col items-center justify-center z-20">
             <span className="text-3xl sm:text-4xl font-bold text-dark dark:text-dark-text tracking-tighter">
               {progress}%
             </span>
             <span className="text-[10px] sm:text-xs font-bold text-gray-400 dark:text-gray-500 uppercase tracking-wide mt-1">
               Mature
             </span>
          </div>
        </div>

        {/* Primary Action Button */}
        <div className="w-full max-w-xs space-y-4">
          {totalWords === 0 ? (
            <button
              onClick={onAddWord}
              className="w-full group relative flex items-center justify-center gap-2 bg-gradient-to-r from-primary to-blue-600 hover:to-blue-700 text-white font-bold py-3.5 px-6 rounded-xl shadow-lg shadow-blue-500/20 transition-all active:scale-[0.98] animate-pulse-slow"
            >
              <PlusCircle className="w-5 h-5 group-hover:scale-110 transition-transform" />
              Add First Word
            </button>
          ) : dueCount > 0 ? (
            <button
              onClick={onStartReview}
              className="w-full group relative flex items-center justify-center gap-2 bg-gradient-to-r from-primary to-blue-600 hover:to-blue-700 text-white font-bold py-3.5 px-6 rounded-xl shadow-lg shadow-blue-500/20 transition-all active:scale-[0.98] animate-pulse-slow"
            >
              <BookOpen className="w-5 h-5 group-hover:scale-110 transition-transform" />
              Review Now ({dueCount})
            </button>
          ) : (
             <button
              disabled
              className="w-full flex items-center justify-center gap-2 bg-gray-100 dark:bg-dark-surface text-gray-400 dark:text-gray-500 font-bold py-3.5 px-6 rounded-xl cursor-default transition-all border border-gray-200 dark:border-dark-border"
            >
              <CheckCircle2 className="w-5 h-5" />
              All Caught Up!
            </button>
          )}

          {/* SRS Stats Row */}
          <div className="flex items-center justify-center gap-4 text-xs font-medium text-gray-500 dark:text-gray-400 flex-wrap">
            {newCount > 0 && (
              <div className="flex items-center gap-1.5" title="New cards">
                 <span className="w-2 h-2 rounded-full bg-blue-400"></span>
                 <span>{newCount} new</span>
              </div>
            )}
            <div className="flex items-center gap-1.5" title="Cards in learning phase">
               <span className="w-2 h-2 rounded-full bg-orange-400"></span>
               <span>{learningCount} learning</span>
               <Tooltip content="Cards you're still memorizing. Reviewed more frequently." />
            </div>
            <div className="flex items-center gap-1.5" title="Mature cards (interval > 21 days)">
               <span className="w-2 h-2 rounded-full bg-green-500"></span>
               <span>{matureCount} mature</span>
               <Tooltip content="Cards in long-term memory. Reviewed less often (21+ days interval)." />
            </div>
          </div>
        </div>
      </div>

      {/* 3. Forecast Section (New) */}
      {(dueTomorrow > 0 || dueThisWeek > 0) && dueCount === 0 && (
        <div className="upcoming-section bg-gray-50 dark:bg-dark-surface rounded-xl p-4 border border-gray-100 dark:border-dark-border animate-in slide-in-from-bottom-2 mb-16">
           <div className="flex items-center gap-2 mb-3 text-sm font-bold text-gray-700 dark:text-dark-text uppercase tracking-wide">
              <CalendarClock className="w-4 h-4 text-primary" />
              <span>Upcoming</span>
           </div>
           <div className="grid grid-cols-2 gap-4">
              <div className="flex flex-col">
                 <span className="text-2xl font-bold text-dark dark:text-dark-text">{dueTomorrow}</span>
                 <span className="text-xs text-gray-500 dark:text-dark-text-sec">Due Tomorrow</span>
              </div>
              <div className="flex flex-col">
                 <span className="text-2xl font-bold text-dark dark:text-dark-text">{dueThisWeek}</span>
                 <span className="text-xs text-gray-500 dark:text-dark-text-sec">Due This Week</span>
              </div>
           </div>
        </div>
      )}
    </div>
  );
};