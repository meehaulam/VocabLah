import React from 'react';
import { VocabWord } from '../types';
import { PlusCircle, Flame, BookOpen } from 'lucide-react';

interface DashboardProps {
  words: VocabWord[];
  streak: number;
  onStartReview: () => void;
  onAddWord: () => void;
  onGoToWordBank: (filter?: 'all' | 'learning' | 'mastered') => void;
}

export const Dashboard: React.FC<DashboardProps> = ({ 
  words, 
  streak,
  onStartReview, 
  onAddWord,
  onGoToWordBank 
}) => {
  const totalWords = words.length;
  const masteredWords = words.filter(w => w.mastered).length;
  const unmasteredWords = totalWords - masteredWords;
  const progress = totalWords > 0 ? Math.round((masteredWords / totalWords) * 100) : 0;

  // Recent words (last 3 added)
  const recentWords = [...words].sort((a, b) => b.createdAt - a.createdAt).slice(0, 3);

  return (
    <div className="flex flex-col h-full gap-8 p-1 animate-in fade-in duration-500">
      
      {/* 1. Streak Badge (Top, prominent) */}
      {streak > 0 && (
        <div className="flex justify-center">
          <div className="inline-flex items-center gap-2 px-4 py-1.5 rounded-full bg-orange-100 dark:bg-orange-900/30 text-orange-600 dark:text-orange-400 font-bold text-sm shadow-sm border border-orange-200 dark:border-orange-800 animate-in slide-in-from-top-4 duration-500">
            <Flame className="w-4 h-4 fill-current" />
            <span>{streak} Day Streak!</span>
          </div>
        </div>
      )}

      {/* 2. Urgency Message & 3. Circular Progress Ring (Center Hero) */}
      <div className="flex flex-col items-center justify-center space-y-6 flex-1 min-h-[300px]">
        
        {/* Urgency Message */}
        <h2 className="text-xl sm:text-2xl font-bold text-dark dark:text-dark-text text-center">
          {totalWords === 0 
            ? "Start your vocabulary journey!" 
            : unmasteredWords > 0 
              ? `${unmasteredWords} words need review` 
              : "All caught up! Add more words 🎉"}
        </h2>

        {/* Circular Ring */}
        <div className="relative w-48 h-48 sm:w-56 sm:h-56">
           <svg viewBox="0 0 36 36" className="w-full h-full transform -rotate-90">
            {/* Background Circle */}
            <path
              className="text-gray-100 dark:text-dark-surface stroke-current"
              d="M18 2.0845 a 15.9155 15.9155 0 0 1 0 31.831 a 15.9155 15.9155 0 0 1 0 -31.831"
              fill="none"
              strokeWidth="3"
            />
            {/* Progress Circle */}
            <path
              className="text-primary drop-shadow-md transition-all duration-1000 ease-out"
              strokeDasharray={`${progress}, 100`}
              d="M18 2.0845 a 15.9155 15.9155 0 0 1 0 31.831 a 15.9155 15.9155 0 0 1 0 -31.831"
              fill="none"
              stroke="currentColor"
              strokeWidth="3"
              strokeLinecap="round"
            />
          </svg>
          
          {/* Center Text */}
          <div className="absolute inset-0 flex flex-col items-center justify-center">
             <span className="text-4xl sm:text-5xl font-bold text-dark dark:text-dark-text tracking-tighter">
               {progress}%
             </span>
             <span className="text-xs sm:text-sm font-medium text-gray-400 dark:text-gray-500 uppercase tracking-wide mt-1">
               Mastered
             </span>
          </div>
        </div>

        {/* 4. Primary Action Button */}
        <div className="w-full max-w-xs space-y-3">
          {totalWords === 0 || unmasteredWords === 0 ? (
            <button
              onClick={onAddWord}
              className="w-full group relative flex items-center justify-center gap-2 bg-gradient-to-r from-primary to-blue-600 hover:to-blue-700 text-white font-bold py-3.5 px-6 rounded-xl shadow-lg shadow-blue-500/20 transition-all active:scale-[0.98] animate-pulse-slow"
            >
              <PlusCircle className="w-5 h-5 group-hover:scale-110 transition-transform" />
              Add New Word
            </button>
          ) : (
            <button
              onClick={onStartReview}
              className="w-full group relative flex items-center justify-center gap-2 bg-gradient-to-r from-primary to-blue-600 hover:to-blue-700 text-white font-bold py-3.5 px-6 rounded-xl shadow-lg shadow-blue-500/20 transition-all active:scale-[0.98] animate-pulse-slow"
            >
              <BookOpen className="w-5 h-5 group-hover:scale-110 transition-transform" />
              Start Review
            </button>
          )}

          {/* 5. Compact Stats Row */}
          <div className="flex items-center justify-center gap-2 text-xs font-medium text-gray-400 dark:text-gray-600">
            <span>{totalWords} total</span>
            <span>•</span>
            <span>{masteredWords} mastered</span>
            <span>•</span>
            <span>{unmasteredWords} left</span>
          </div>
        </div>

      </div>

      {/* 6. Recent Activity (Bottom) */}
      {recentWords.length > 0 && (
        <div className="space-y-3">
          <h3 className="text-xs font-semibold text-gray-400 dark:text-dark-text-sec uppercase tracking-wider pl-1">
            Recent
          </h3>
          <div className="flex flex-wrap gap-2">
            {recentWords.map(word => (
              <button
                key={word.id}
                onClick={() => onGoToWordBank()}
                className="px-3 py-1.5 bg-white dark:bg-dark-surface border border-gray-100 dark:border-dark-border rounded-lg text-sm text-gray-600 dark:text-dark-text hover:border-primary hover:text-primary dark:hover:border-primary transition-colors shadow-sm"
              >
                {word.word}
              </button>
            ))}
          </div>
        </div>
      )}
    </div>
  );
};