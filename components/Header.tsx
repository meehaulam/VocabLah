import React from 'react';
import { Sparkles, Settings } from 'lucide-react';

interface HeaderProps {
  onOpenSettings: () => void;
}

export const Header: React.FC<HeaderProps> = ({ onOpenSettings }) => {
  return (
    <header className="sticky top-0 z-50 bg-white/80 dark:bg-dark-surface/80 backdrop-blur-md shadow-sm border-b border-gray-100 dark:border-dark-border transition-colors duration-300">
      <div className="max-w-4xl mx-auto px-4 sm:px-6 h-16 flex items-center justify-between">
        <div className="flex items-center space-x-2">
          <Sparkles className="w-6 h-6 text-primary fill-current" />
          <h1 className="text-2xl font-bold tracking-tight text-dark dark:text-white">
            Vocab<span className="text-primary">Lah</span>
          </h1>
        </div>

        <button
          onClick={onOpenSettings}
          className="p-2 rounded-lg bg-gray-100 dark:bg-dark-bg text-gray-500 dark:text-gray-300 hover:bg-gray-200 dark:hover:bg-opacity-80 transition-all duration-200"
          aria-label="Open settings"
        >
          <Settings className="w-5 h-5" />
        </button>
      </div>
    </header>
  );
};