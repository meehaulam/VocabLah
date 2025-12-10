import React, { useState, useEffect } from 'react';
import { Header } from './components/Header';
import { VocabWord } from './types';
import { BottomNav, View } from './components/BottomNav';
import { Dashboard } from './components/Dashboard';
import { WordBank } from './components/WordBank';
import { ReviewMode } from './components/ReviewMode';
import { AddWordModal } from './components/AddWordModal';
import { SettingsView, ThemeOption, SessionLimitOption } from './components/SettingsView';

const LOCAL_STORAGE_KEY = "vocab_lah_words";
const THEME_STORAGE_KEY = "vocab_lah_theme";
const SESSION_LIMIT_KEY = "vocab_lah_session_limit";
const STREAK_KEY = "vocab_lah_streak";
const LAST_ACTIVITY_KEY = "vocab_lah_last_activity";

const App: React.FC = () => {
  const [words, setWords] = useState<VocabWord[]>([]);
  const [isLoaded, setIsLoaded] = useState(false);
  const [currentView, setCurrentView] = useState<View>('dashboard');
  const [previousView, setPreviousView] = useState<View>('dashboard'); // For back navigation
  const [isDarkMode, setIsDarkMode] = useState(false); // Kept for styling reference if needed elsewhere
  
  // Settings State
  const [themeMode, setThemeMode] = useState<ThemeOption>('auto');
  const [sessionLimit, setSessionLimit] = useState<SessionLimitOption>(20);
  
  // State for deep linking / navigation parameters
  const [reviewFilter, setReviewFilter] = useState<'all' | 'learning'>('learning');
  const [wordBankFilter, setWordBankFilter] = useState<'all' | 'learning' | 'mastered'>('all');
  
  // Modal State
  const [isAddModalOpen, setIsAddModalOpen] = useState(false);
  
  // Streak State
  const [streak, setStreak] = useState(0);

  // Load words from LocalStorage on mount
  useEffect(() => {
    try {
      const storedWords = localStorage.getItem(LOCAL_STORAGE_KEY);
      if (storedWords) {
        setWords(JSON.parse(storedWords));
      }
    } catch (error) {
      console.error("Failed to load words from local storage", error);
    } finally {
      setIsLoaded(true);
    }
  }, []);

  // Load Settings from LocalStorage
  useEffect(() => {
    // Theme
    const storedTheme = localStorage.getItem(THEME_STORAGE_KEY) as ThemeOption | null;
    if (storedTheme) {
      setThemeMode(storedTheme);
    }

    // Session Limit
    const storedLimit = localStorage.getItem(SESSION_LIMIT_KEY);
    if (storedLimit) {
        setSessionLimit(storedLimit === 'all' ? 'all' : parseInt(storedLimit) as SessionLimitOption);
    }
  }, []);

  // Theme Logic Effect
  useEffect(() => {
    const applyTheme = () => {
      const isSystemDark = window.matchMedia('(prefers-color-scheme: dark)').matches;
      const shouldBeDark = themeMode === 'dark' || (themeMode === 'auto' && isSystemDark);
      
      setIsDarkMode(shouldBeDark);
      if (shouldBeDark) {
        document.documentElement.classList.add('dark');
      } else {
        document.documentElement.classList.remove('dark');
      }
    };

    applyTheme();

    // Listener for system changes if auto
    const mediaQuery = window.matchMedia('(prefers-color-scheme: dark)');
    const handler = () => {
        if (themeMode === 'auto') applyTheme();
    };
    
    mediaQuery.addEventListener('change', handler);
    return () => mediaQuery.removeEventListener('change', handler);
  }, [themeMode]);

  // Calculate Streak on mount
  useEffect(() => {
    const today = new Date().toDateString();
    const lastActivity = localStorage.getItem(LAST_ACTIVITY_KEY);
    const storedStreak = parseInt(localStorage.getItem(STREAK_KEY) || '0');

    if (lastActivity !== today) {
       const yesterday = new Date();
       yesterday.setDate(yesterday.getDate() - 1);
       
       if (lastActivity === yesterday.toDateString()) {
         // Consecutive day
         const newStreak = storedStreak + 1;
         setStreak(newStreak);
         localStorage.setItem(STREAK_KEY, newStreak.toString());
       } else if (!lastActivity) {
         // First time
         setStreak(1);
         localStorage.setItem(STREAK_KEY, '1');
       } else {
         // Streak broken (or > 1 day gap), reset to 1 (active today)
         setStreak(1);
         localStorage.setItem(STREAK_KEY, '1');
       }
       localStorage.setItem(LAST_ACTIVITY_KEY, today);
    } else {
      setStreak(storedStreak);
    }
  }, []);

  // Save words to LocalStorage whenever words change
  useEffect(() => {
    if (isLoaded) {
      localStorage.setItem(LOCAL_STORAGE_KEY, JSON.stringify(words));
    }
  }, [words, isLoaded]);

  // --- Handlers ---

  const handleThemeChange = (newTheme: ThemeOption) => {
    setThemeMode(newTheme);
    localStorage.setItem(THEME_STORAGE_KEY, newTheme);
  };

  const handleSessionLimitChange = (newLimit: SessionLimitOption) => {
    setSessionLimit(newLimit);
    localStorage.setItem(SESSION_LIMIT_KEY, newLimit.toString());
  };

  const handleOpenSettings = () => {
    if (currentView !== 'settings') {
      setPreviousView(currentView);
      setCurrentView('settings');
    }
  };

  const handleBackFromSettings = () => {
    setCurrentView(previousView);
  };

  const handleResetData = () => {
    localStorage.removeItem(LOCAL_STORAGE_KEY);
    localStorage.removeItem(THEME_STORAGE_KEY);
    localStorage.removeItem(STREAK_KEY);
    localStorage.removeItem(LAST_ACTIVITY_KEY);
    localStorage.removeItem(SESSION_LIMIT_KEY);
    
    setWords([]);
    setStreak(1);
    setThemeMode('auto');
    setSessionLimit(20);
    setCurrentView('dashboard');
    setPreviousView('dashboard');
    
    // Reset theme to auto visually immediately
    const isSystemDark = window.matchMedia('(prefers-color-scheme: dark)').matches;
    setIsDarkMode(isSystemDark);
    if (isSystemDark) {
      document.documentElement.classList.add('dark');
    } else {
      document.documentElement.classList.remove('dark');
    }
  };

  const handleAddWord = (word: string, meaning: string) => {
    const newWord: VocabWord = {
      id: Date.now(),
      word,
      meaning,
      mastered: false,
      createdAt: Date.now(),
    };
    setWords((prev) => [newWord, ...prev]);
    setIsAddModalOpen(false);
  };

  const handleEditWord = (id: number, newWord: string, newMeaning: string) => {
    setWords((prev) => 
      prev.map(w => w.id === id ? { ...w, word: newWord, meaning: newMeaning } : w)
    );
  };

  const handleDeleteWord = (id: number) => {
    setWords((prev) => prev.filter((w) => w.id !== id));
  };

  const handleToggleMastered = (id: number) => {
    setWords((prev) =>
      prev.map((w) => (w.id === id ? { ...w, mastered: !w.mastered } : w))
    );
  };

  // Navigation Handlers
  const handleStartReview = () => {
    setReviewFilter('learning');
    setCurrentView('review');
  };

  const handleGoToWordBank = (filter: 'all' | 'learning' | 'mastered' = 'all') => {
    setWordBankFilter(filter);
    setCurrentView('wordbank');
  };

  const renderContent = () => {
    switch (currentView) {
      case 'dashboard':
        return (
          <div className="h-full overflow-y-auto custom-scrollbar">
            <Dashboard 
              words={words} 
              streak={streak}
              onStartReview={handleStartReview}
              onAddWord={() => setIsAddModalOpen(true)}
              onGoToWordBank={handleGoToWordBank}
            />
          </div>
        );
      case 'wordbank':
        return (
          <WordBank 
            words={words}
            initialFilter={wordBankFilter}
            onAdd={() => setIsAddModalOpen(true)}
            onEdit={handleEditWord}
            onDelete={handleDeleteWord}
            onToggleMastered={handleToggleMastered}
          />
        );
      case 'review':
        return (
          <ReviewMode 
            words={words}
            sessionLimit={sessionLimit}
            initialFilter={reviewFilter}
            onToggleMastered={handleToggleMastered}
            onBackToDashboard={() => setCurrentView('dashboard')}
          />
        );
      case 'settings':
        return (
          <SettingsView 
             theme={themeMode}
             setTheme={handleThemeChange}
             sessionLimit={sessionLimit}
             setSessionLimit={handleSessionLimitChange}
             onBack={handleBackFromSettings}
             onResetData={handleResetData}
          />
        );
      default:
        return null;
    }
  };

  return (
    <div className="h-screen bg-background dark:bg-dark-bg text-dark dark:text-dark-text flex flex-col overflow-hidden transition-colors duration-300">
      
      {/* Show Global Header unless in Settings */}
      {currentView !== 'settings' && (
        <Header onOpenSettings={handleOpenSettings} />
      )}
      
      {/* Main Content Area - padded at bottom for nav if visible */}
      <main className={`flex-1 w-full max-w-2xl mx-auto ${currentView !== 'settings' ? 'p-4 sm:p-6 pb-20' : ''} overflow-hidden relative`}>
        <div className="h-full w-full">
          {renderContent()}
        </div>
      </main>

      {/* Show Bottom Nav unless in Settings */}
      {currentView !== 'settings' && (
        <BottomNav currentView={currentView} onViewChange={setCurrentView} />
      )}

      {/* Global Add Word Modal */}
      {isAddModalOpen && (
        <AddWordModal 
          onAdd={handleAddWord} 
          onCancel={() => setIsAddModalOpen(false)} 
        />
      )}
    </div>
  );
};

export default App;