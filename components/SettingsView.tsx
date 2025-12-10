import React, { useState } from 'react';
import { ArrowLeft, Trash2, AlertTriangle } from 'lucide-react';

export type ThemeOption = 'light' | 'dark' | 'auto';
export type SessionLimitOption = 10 | 20 | 50 | 'all';

interface SettingsViewProps {
  theme: ThemeOption;
  setTheme: (theme: ThemeOption) => void;
  sessionLimit: SessionLimitOption;
  setSessionLimit: (limit: SessionLimitOption) => void;
  onBack: () => void;
  onResetData: () => void;
}

export const SettingsView: React.FC<SettingsViewProps> = ({
  theme,
  setTheme,
  sessionLimit,
  setSessionLimit,
  onBack,
  onResetData,
}) => {
  const [isResetModalOpen, setIsResetModalOpen] = useState(false);

  return (
    <div className="flex flex-col h-full bg-background dark:bg-dark-bg text-dark dark:text-dark-text animate-in fade-in slide-in-from-right-4 duration-300">
      {/* Header */}
      <div className="flex items-center p-4 border-b border-gray-200 dark:border-dark-border bg-white dark:bg-dark-surface shrink-0">
        <button 
          onClick={onBack} 
          className="p-2 -ml-2 rounded-full hover:bg-gray-100 dark:hover:bg-dark-bg text-gray-600 dark:text-gray-300 transition-colors"
        >
          <ArrowLeft className="w-6 h-6" />
        </button>
        <h1 className="flex-1 text-center text-lg font-bold mr-8 text-dark dark:text-dark-text">Settings</h1>
      </div>

      <div className="flex-1 overflow-y-auto p-4 space-y-8 custom-scrollbar">
        
        {/* Section 1: Preferences */}
        <section className="space-y-4">
          <h2 className="text-xs font-bold text-gray-400 dark:text-gray-500 uppercase tracking-wider pl-1">Preferences</h2>
          
          {/* Theme */}
          <div className="bg-white dark:bg-dark-surface rounded-xl p-4 shadow-sm border border-gray-100 dark:border-dark-border space-y-3">
            <label className="block text-sm font-semibold text-dark dark:text-dark-text">Theme</label>
            <div className="flex bg-gray-100 dark:bg-dark-bg p-1 rounded-lg">
              {(['light', 'dark', 'auto'] as ThemeOption[]).map((option) => (
                <button
                  key={option}
                  onClick={() => setTheme(option)}
                  className={`flex-1 py-2 rounded-md text-sm font-medium capitalize transition-all duration-200 ${
                    theme === option
                      ? 'bg-white dark:bg-dark-surface text-primary shadow-sm'
                      : 'text-gray-500 dark:text-gray-400 hover:text-gray-700 dark:hover:text-gray-200'
                  }`}
                >
                  {option}
                </button>
              ))}
            </div>
          </div>

          {/* Session Limit */}
          <div className="bg-white dark:bg-dark-surface rounded-xl p-4 shadow-sm border border-gray-100 dark:border-dark-border space-y-3">
             <label className="block text-sm font-semibold text-dark dark:text-dark-text">Cards per session</label>
             <div className="grid grid-cols-4 gap-2">
                {([10, 20, 50, 'all'] as const).map((opt) => (
                   <button
                     key={opt}
                     onClick={() => setSessionLimit(opt)}
                     className={`py-2 rounded-lg text-sm font-medium border transition-all ${
                        sessionLimit === opt
                        ? 'border-primary bg-primary/5 text-primary'
                        : 'border-gray-200 dark:border-dark-border bg-gray-50 dark:bg-dark-bg text-gray-600 dark:text-gray-400 hover:bg-gray-50 dark:hover:bg-dark-bg'
                     }`}
                   >
                     {opt === 'all' ? 'All' : opt}
                   </button>
                ))}
             </div>
          </div>
        </section>

        {/* Section 2: Danger Zone */}
        <section className="space-y-4">
          <h2 className="text-xs font-bold text-red-500/80 uppercase tracking-wider pl-1">Danger Zone</h2>
          
          <div className="bg-red-50/50 dark:bg-red-900/10 rounded-xl p-4 border border-red-100 dark:border-red-900/30">
            <button
              onClick={() => setIsResetModalOpen(true)}
              className="w-full flex items-center justify-center gap-2 text-red-600 dark:text-red-400 font-semibold py-3 px-4 rounded-lg border border-red-200 dark:border-red-800 hover:bg-red-100 dark:hover:bg-red-900/20 transition-colors"
            >
              <Trash2 className="w-5 h-5" />
              Reset All Data
            </button>
            <p className="text-xs text-red-400 mt-2 text-center opacity-80">
              Permanently delete all words and progress.
            </p>
          </div>
        </section>
      </div>

      {/* Reset Confirmation Modal */}
      {isResetModalOpen && (
        <div className="fixed inset-0 z-[100] flex items-center justify-center p-4 bg-black/50 backdrop-blur-sm animate-in fade-in duration-200">
           <div className="bg-white dark:bg-dark-surface rounded-xl shadow-2xl w-full max-w-sm overflow-hidden animate-in zoom-in-95 duration-200 border border-gray-100 dark:border-dark-border p-6 text-center">
              <div className="w-12 h-12 bg-red-100 dark:bg-red-900/30 rounded-full flex items-center justify-center mx-auto mb-4">
                 <AlertTriangle className="w-6 h-6 text-red-600 dark:text-red-400" />
              </div>
              <h3 className="text-lg font-bold text-dark dark:text-dark-text mb-2">Reset All Data?</h3>
              <p className="text-sm text-gray-500 dark:text-dark-text-sec mb-6">
                This will permanently delete all your words, progress, and streak. This action cannot be undone.
              </p>
              
              <div className="flex gap-3">
                <button
                   onClick={() => setIsResetModalOpen(false)}
                   className="flex-1 py-2.5 rounded-lg border border-gray-300 dark:border-dark-border text-gray-700 dark:text-gray-300 font-medium hover:bg-gray-50 dark:hover:bg-dark-bg transition-colors"
                >
                  Cancel
                </button>
                <button
                   onClick={() => {
                     onResetData();
                     setIsResetModalOpen(false);
                   }}
                   className="flex-1 py-2.5 rounded-lg bg-red-600 hover:bg-red-700 text-white font-medium shadow-sm transition-colors"
                >
                  Delete Everything
                </button>
              </div>
           </div>
        </div>
      )}
    </div>
  );
};