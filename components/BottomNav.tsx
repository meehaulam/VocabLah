import React from 'react';
import { Home, Book, Layers } from 'lucide-react';

export type View = 'dashboard' | 'wordbank' | 'review' | 'settings';

interface BottomNavProps {
  currentView: View;
  onViewChange: (view: View) => void;
}

export const BottomNav: React.FC<BottomNavProps> = ({ currentView, onViewChange }) => {
  return (
    <nav className="fixed bottom-0 left-0 right-0 bg-white dark:bg-dark-surface border-t border-gray-200 dark:border-dark-border shadow-[0_-4px_6px_-1px_rgba(0,0,0,0.05)] z-50 safe-area-bottom transition-colors duration-300">
      <div className="flex justify-around items-center h-16 max-w-2xl mx-auto">
        <button
          onClick={() => onViewChange('dashboard')}
          className={`flex flex-col items-center justify-center w-full h-full space-y-1 transition-colors duration-200 ${
            currentView === 'dashboard' ? 'text-primary' : 'text-gray-400 dark:text-gray-500 hover:text-gray-500 dark:hover:text-gray-300'
          }`}
        >
          <Home className={`w-6 h-6 ${currentView === 'dashboard' ? 'stroke-[2.5px]' : 'stroke-2'}`} />
          <span className="text-[10px] font-medium">Dashboard</span>
        </button>

        <button
          onClick={() => onViewChange('wordbank')}
          className={`flex flex-col items-center justify-center w-full h-full space-y-1 transition-colors duration-200 ${
            currentView === 'wordbank' ? 'text-primary' : 'text-gray-400 dark:text-gray-500 hover:text-gray-500 dark:hover:text-gray-300'
          }`}
        >
          <Book className={`w-6 h-6 ${currentView === 'wordbank' ? 'stroke-[2.5px]' : 'stroke-2'}`} />
          <span className="text-[10px] font-medium">Word Bank</span>
        </button>

        <button
          onClick={() => onViewChange('review')}
          className={`flex flex-col items-center justify-center w-full h-full space-y-1 transition-colors duration-200 ${
            currentView === 'review' ? 'text-primary' : 'text-gray-400 dark:text-gray-500 hover:text-gray-500 dark:hover:text-gray-300'
          }`}
        >
          <Layers className={`w-6 h-6 ${currentView === 'review' ? 'stroke-[2.5px]' : 'stroke-2'}`} />
          <span className="text-[10px] font-medium">Review</span>
        </button>
      </div>
    </nav>
  );
};