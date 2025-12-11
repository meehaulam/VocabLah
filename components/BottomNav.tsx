import React from 'react';
import { Home, Folder, Layers, Settings } from 'lucide-react';

export type View = 'dashboard' | 'wordbank' | 'collections' | 'review' | 'settings' | 'collection-detail';

interface BottomNavProps {
  currentView: View;
  onViewChange: (view: View) => void;
}

export const BottomNav: React.FC<BottomNavProps> = ({ currentView, onViewChange }) => {
  return (
    <nav className="fixed bottom-0 left-0 right-0 bg-white dark:bg-dark-surface border-t border-gray-200 dark:border-dark-border shadow-[0_-4px_6px_-1px_rgba(0,0,0,0.05)] z-[1000] safe-area-bottom transition-colors duration-300 py-3 md:py-4">
      <div className="grid grid-cols-4 h-full max-w-2xl mx-auto">
        <button
          onClick={() => onViewChange('dashboard')}
          className={`flex flex-col items-center justify-center w-full h-full space-y-1 transition-colors duration-200 ${
            currentView === 'dashboard' ? 'text-primary' : 'text-gray-400 dark:text-gray-500 hover:text-gray-500 dark:hover:text-gray-300'
          }`}
        >
          <Home className={`w-6 h-6 md:w-7 md:h-7 ${currentView === 'dashboard' ? 'stroke-[2.5px]' : 'stroke-2'}`} />
          <span className="text-[10px] md:text-xs font-medium">Dashboard</span>
        </button>

        <button
          onClick={() => onViewChange('collections')}
          className={`flex flex-col items-center justify-center w-full h-full space-y-1 transition-colors duration-200 ${
            ['collections', 'wordbank', 'collection-detail'].includes(currentView) ? 'text-primary' : 'text-gray-400 dark:text-gray-500 hover:text-gray-500 dark:hover:text-gray-300'
          }`}
        >
          <Folder className={`w-6 h-6 md:w-7 md:h-7 ${['collections', 'wordbank', 'collection-detail'].includes(currentView) ? 'stroke-[2.5px]' : 'stroke-2'}`} />
          <span className="text-[10px] md:text-xs font-medium">Collections</span>
        </button>

        <button
          onClick={() => onViewChange('review')}
          className={`flex flex-col items-center justify-center w-full h-full space-y-1 transition-colors duration-200 ${
            currentView === 'review' ? 'text-primary' : 'text-gray-400 dark:text-gray-500 hover:text-gray-500 dark:hover:text-gray-300'
          }`}
        >
          <Layers className={`w-6 h-6 md:w-7 md:h-7 ${currentView === 'review' ? 'stroke-[2.5px]' : 'stroke-2'}`} />
          <span className="text-[10px] md:text-xs font-medium">Review</span>
        </button>

        <button
          onClick={() => onViewChange('settings')}
          className={`flex flex-col items-center justify-center w-full h-full space-y-1 transition-colors duration-200 ${
            currentView === 'settings' ? 'text-primary' : 'text-gray-400 dark:text-gray-500 hover:text-gray-500 dark:hover:text-gray-300'
          }`}
        >
          <Settings className={`w-6 h-6 md:w-7 md:h-7 ${currentView === 'settings' ? 'stroke-[2.5px]' : 'stroke-2'}`} />
          <span className="text-[10px] md:text-xs font-medium">Settings</span>
        </button>
      </div>
    </nav>
  );
};