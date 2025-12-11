import React from 'react';
import { VocabWord } from '../types';
import { Trash2, Pencil, Calendar, Clock, Sprout, TreeDeciduous, BookOpen } from 'lucide-react';
import { isCardDue, getSRSStage } from '../utils/srs';
import { getDaysDifference, getTodayDate } from '../utils/date';

interface WordCardProps {
  word: VocabWord;
  onEdit: () => void;
  onDelete: (id: number) => void;
  onToggleMastered: (id: number) => void; // Kept for compatibility but might not be used in SRS view
}

export const WordCard: React.FC<WordCardProps> = ({ word, onEdit, onDelete }) => {
  const isDue = isCardDue(word);
  const stage = getSRSStage(word);
  const today = getTodayDate();
  
  let statusColor = '';
  let statusText = '';
  let statusIcon = null;

  // Status Indicator Logic
  if (isDue) {
    statusColor = 'text-red-500 bg-red-50 dark:bg-red-900/20 border-red-200 dark:border-red-900/30';
    statusText = 'Due today';
    statusIcon = <Calendar className="w-3.5 h-3.5" />;
  } else {
    const daysUntil = getDaysDifference(today, word.nextReviewDate);
    statusColor = 'text-green-600 bg-green-50 dark:bg-green-900/20 border-green-200 dark:border-green-900/30';
    statusText = `Due in ${daysUntil} days`;
    statusIcon = <Clock className="w-3.5 h-3.5" />;
  }

  // Stage Indicator Logic
  let stageIcon = null;
  let stageColorClass = '';
  
  switch(stage.type) {
    case 'new': 
      stageIcon = <div className="text-base">🆕</div>;
      stageColorClass = 'text-blue-500';
      break;
    case 'learning':
      stageIcon = <BookOpen className="w-3.5 h-3.5" />;
      stageColorClass = 'text-orange-500';
      break;
    case 'young':
      stageIcon = <Sprout className="w-3.5 h-3.5" />;
      stageColorClass = 'text-lime-600';
      break;
    case 'mature':
      stageIcon = <TreeDeciduous className="w-3.5 h-3.5" />;
      stageColorClass = 'text-green-600';
      break;
  }

  return (
    <div className={`
      group relative rounded-xl p-4 shadow-sm border transition-all duration-200
      bg-white dark:bg-dark-surface border-gray-100 dark:border-dark-border hover:border-blue-200 dark:hover:border-primary/30 hover:shadow-md
    `}>
      <div className="flex items-start justify-between gap-3">
        
        <div className="flex-1 min-w-0">
          
          {/* Header with Word and Due Status */}
          <div className="flex items-center justify-between gap-2 mb-1.5">
             <div className="flex items-center gap-2">
                 {/* Status Icon Only on small visual */}
                 <span className={`flex items-center justify-center w-6 h-6 rounded-full text-xs ${isDue ? 'bg-red-100 text-red-600 dark:bg-red-900/40 dark:text-red-400' : 'bg-green-100 text-green-600 dark:bg-green-900/40 dark:text-green-400'}`}>
                    {isDue ? '📅' : '✅'}
                 </span>
                 <h3 className="text-lg font-bold leading-tight text-dark dark:text-dark-text">
                   {word.word}
                 </h3>
             </div>
          </div>

          <p className="text-sm sm:text-base leading-relaxed text-gray-600 dark:text-dark-text-sec mb-3 pl-8">
            {word.meaning}
          </p>

          {/* Footer Info: Status & Stage */}
          <div className="flex flex-wrap items-center gap-3 pl-8">
             <div className={`flex items-center gap-1.5 px-2 py-0.5 rounded-md text-xs font-medium border ${statusColor}`}>
                {statusIcon}
                <span>{statusText}</span>
             </div>
             
             <div className="flex items-center gap-1.5 text-xs font-medium text-gray-500 dark:text-gray-400">
                <span className={stageColorClass}>{stageIcon}</span>
                <span>{stage.label} ({word.interval}d)</span>
             </div>
          </div>

        </div>

        {/* Actions */}
        <div className="flex flex-col gap-1 shrink-0 ml-1">
          <button
            type="button"
            onClick={(e) => {
              e.stopPropagation();
              onEdit();
            }}
            title="Edit word"
             className="p-2 rounded-lg text-gray-400 dark:text-gray-500 hover:bg-gray-100 dark:hover:bg-dark-bg hover:text-primary dark:hover:text-primary transition-colors duration-200"
          >
            <Pencil className="w-4 h-4" />
          </button>
          
          <button
            type="button"
            onClick={(e) => {
              e.stopPropagation();
              onDelete(word.id);
            }}
            title="Delete word"
            className="p-2 rounded-lg text-gray-400 dark:text-gray-500 hover:bg-red-50 dark:hover:bg-red-900/20 hover:text-red-500 transition-colors duration-200"
          >
            <Trash2 className="w-4 h-4" />
          </button>
        </div>

      </div>
    </div>
  );
};