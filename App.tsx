import React, { useState, useEffect } from 'react';
import { Header } from './components/Header';
import { VocabWord, Collection } from './types';
import { BottomNav, View } from './components/BottomNav';
import { Dashboard } from './components/Dashboard';
import { WordBank } from './components/WordBank';
import { CollectionsView } from './components/CollectionsView';
import { CollectionDetailView } from './components/CollectionDetailView';
import { ReviewMode } from './components/ReviewMode';
import { AddWordModal } from './components/AddWordModal';
import { SettingsView, SessionLimitOption } from './components/SettingsView';
import { CreateCollectionModal } from './components/CreateCollectionModal';
import { EditCollectionModal } from './components/EditCollectionModal';
import { DeleteCollectionModal } from './components/DeleteCollectionModal';
import { TutorialOverlay } from './components/TutorialOverlay';
import { saveCollections } from './utils/storage';
import { getTodayDate, addDays } from './utils/date';

const LOCAL_STORAGE_KEY = "vocab_lah_words";
const COLLECTIONS_STORAGE_KEY = "vocab_lah_collections";
const SESSION_LIMIT_KEY = "vocab_lah_session_limit";
const TUTORIAL_COMPLETED_KEY = "vocab_lah_tutorial_completed";
const THEME_STORAGE_KEY = "vocab_lah_theme";

const App: React.FC = () => {
  const [words, setWords] = useState<VocabWord[]>([]);
  const [collections, setCollections] = useState<Collection[]>([]);
  const [isLoaded, setIsLoaded] = useState(false);
  const [currentView, setCurrentView] = useState<View>('dashboard');
  
  // Settings State
  const [sessionLimit, setSessionLimit] = useState<SessionLimitOption>(20);
  const [isDarkMode, setIsDarkMode] = useState(false);
  
  // State for deep linking / navigation parameters
  const [wordBankFilter, setWordBankFilter] = useState<'all' | 'learning' | 'mastered'>('all');
  const [selectedCollectionId, setSelectedCollectionId] = useState<string | null>(null);
  const [reviewTargetCollectionId, setReviewTargetCollectionId] = useState<string | null>(null);
  
  // Modal State
  const [isAddModalOpen, setIsAddModalOpen] = useState(false);
  const [addModalInitialCollectionId, setAddModalInitialCollectionId] = useState<string | null>(null);
  const [isCreateCollectionModalOpen, setIsCreateCollectionModalOpen] = useState(false);
  const [showTutorial, setShowTutorial] = useState(false);
  
  // Collection Action States
  const [editingCollection, setEditingCollection] = useState<Collection | null>(null);
  const [deletingCollection, setDeletingCollection] = useState<Collection | null>(null);
  const [lastCreatedCollectionId, setLastCreatedCollectionId] = useState<string | null>(null);
  
  // Initialize Data (Words & Collections)
  useEffect(() => {
    const initializeData = () => {
      try {
        // 1. Initialize Collections
        const storedCollections = localStorage.getItem(COLLECTIONS_STORAGE_KEY);
        let loadedCollections: Collection[] = [];

        if (storedCollections) {
          loadedCollections = JSON.parse(storedCollections);
          // Ensure "All Words" exists
          if (!loadedCollections.find(c => c.id === 'all')) {
            const systemCollection: Collection = {
              id: "all",
              name: "All Words",
              icon: "📚",
              color: "#6B7280",
              type: "system",
              canEdit: false,
              canDelete: false,
              createdAt: Date.now()
            };
            loadedCollections.unshift(systemCollection);
            localStorage.setItem(COLLECTIONS_STORAGE_KEY, JSON.stringify(loadedCollections));
            console.log("Re-added missing 'All Words' system collection");
          }
        } else {
          // Create default system collection
          const systemCollection: Collection = {
            id: "all",
            name: "All Words",
            icon: "📚",
            color: "#6B7280",
            type: "system",
            canEdit: false,
            canDelete: false,
            createdAt: Date.now()
          };
          loadedCollections = [systemCollection];
          localStorage.setItem(COLLECTIONS_STORAGE_KEY, JSON.stringify(loadedCollections));
          console.log("Initialized default 'All Words' collection");
        }
        setCollections(loadedCollections);
        console.log("Current Collections:", loadedCollections);

        // 2. Initialize Words & Migrate
        const storedWords = localStorage.getItem(LOCAL_STORAGE_KEY);
        if (storedWords) {
          const rawWords = JSON.parse(storedWords);
          let migrationNeeded = false;
          const today = getTodayDate();
          
          const migratedWords = rawWords.map((w: any) => {
             let word = { ...w };

             // Migration for collectionId
             if (!('collectionId' in word)) {
               migrationNeeded = true;
               word.collectionId = null;
             }

             // Migration for SRS fields
             if (!('easeFactor' in word)) {
               migrationNeeded = true;
               word.easeFactor = 2.5;
               word.repetitions = 0;
               word.lastReviewDate = null;
               
               if (word.mastered) {
                 // Assume mastered words are mature
                 word.interval = 21;
                 word.repetitions = 3;
                 word.nextReviewDate = addDays(today, 21);
               } else {
                 // New/unmastered words
                 word.interval = 0;
                 word.nextReviewDate = today;
               }
             }

             return word as VocabWord;
          });

          if (migrationNeeded) {
            localStorage.setItem(LOCAL_STORAGE_KEY, JSON.stringify(migratedWords));
            console.log("Migrated words to include collectionId and SRS structure");
          }
          
          setWords(migratedWords);
          console.log("Current Words:", migratedWords);
        }
      } catch (error) {
        console.error("Data initialization error:", error);
      } finally {
        setIsLoaded(true);
      }
    };

    initializeData();
  }, []);

  // Check Tutorial Status
  useEffect(() => {
    const isTutorialCompleted = localStorage.getItem(TUTORIAL_COMPLETED_KEY);
    if (!isTutorialCompleted) {
      // Small delay for smoother entry
      const timer = setTimeout(() => {
        setShowTutorial(true);
      }, 800);
      return () => clearTimeout(timer);
    }
  }, []);

  const handleTutorialComplete = () => {
    localStorage.setItem(TUTORIAL_COMPLETED_KEY, 'true');
    setShowTutorial(false);
  };

  const handleReplayTutorial = () => {
    setShowTutorial(true);
  };

  // Cleanup Streak Data (One-time)
  useEffect(() => {
    localStorage.removeItem("vocab_lah_streak");
    localStorage.removeItem("vocab_lah_last_activity");
  }, []);

  // Load Settings from LocalStorage
  useEffect(() => {
    // Session Limit
    const storedLimit = localStorage.getItem(SESSION_LIMIT_KEY);
    if (storedLimit) {
        setSessionLimit(storedLimit === 'all' ? 'all' : parseInt(storedLimit) as SessionLimitOption);
    }
    
    // Theme
    const storedTheme = localStorage.getItem(THEME_STORAGE_KEY);
    if (storedTheme === 'dark') {
      setIsDarkMode(true);
      document.documentElement.classList.add('dark');
    } else if (storedTheme === 'light') {
      setIsDarkMode(false);
      document.documentElement.classList.remove('dark');
    } else {
      // System preference
      if (window.matchMedia && window.matchMedia('(prefers-color-scheme: dark)').matches) {
        setIsDarkMode(true);
        document.documentElement.classList.add('dark');
      }
    }
  }, []);

  // Save words to LocalStorage whenever words change
  useEffect(() => {
    if (isLoaded) {
      localStorage.setItem(LOCAL_STORAGE_KEY, JSON.stringify(words));
    }
  }, [words, isLoaded]);

  // --- Handlers ---

  const toggleDarkMode = () => {
    const newMode = !isDarkMode;
    setIsDarkMode(newMode);
    if (newMode) {
      document.documentElement.classList.add('dark');
      localStorage.setItem(THEME_STORAGE_KEY, 'dark');
    } else {
      document.documentElement.classList.remove('dark');
      localStorage.setItem(THEME_STORAGE_KEY, 'light');
    }
  };

  const handleSessionLimitChange = (newLimit: SessionLimitOption) => {
    setSessionLimit(newLimit);
    localStorage.setItem(SESSION_LIMIT_KEY, newLimit.toString());
  };

  const handleResetData = () => {
    localStorage.removeItem(LOCAL_STORAGE_KEY);
    localStorage.removeItem(SESSION_LIMIT_KEY);
    localStorage.removeItem(COLLECTIONS_STORAGE_KEY);
    localStorage.removeItem(TUTORIAL_COMPLETED_KEY);
    
    setWords([]);
    // Reset collections to default state
    const defaultCollection: Collection = {
       id: "all",
       name: "All Words",
       icon: "📚",
       color: "#6B7280",
       type: "system",
       canEdit: false,
       canDelete: false,
       createdAt: Date.now()
    };
    setCollections([defaultCollection]);
    
    setSessionLimit(20);
    setCurrentView('dashboard');
    
    // Show tutorial again after reset
    setTimeout(() => setShowTutorial(true), 800);
  };

  const handleResetSRSData = () => {
    const today = getTodayDate();
    setWords(prev => prev.map(word => ({
      ...word,
      easeFactor: 2.5,
      interval: 0,
      repetitions: 0,
      nextReviewDate: today,
      lastReviewDate: null,
      mastered: false
    })));
  };

  const handleOpenAddModal = (collectionId: string | null = null) => {
    setAddModalInitialCollectionId(collectionId);
    setIsAddModalOpen(true);
  };

  const handleAddWord = (word: string, meaning: string, collectionId: string | null) => {
    const newWord: VocabWord = {
      id: Date.now(),
      word,
      meaning,
      mastered: false,
      createdAt: Date.now(),
      collectionId: collectionId,
      // SRS Defaults
      easeFactor: 2.5,
      interval: 0,
      repetitions: 0,
      nextReviewDate: getTodayDate(),
      lastReviewDate: null
    };
    setWords((prev) => [newWord, ...prev]);
    setIsAddModalOpen(false);
  };

  const handleUpdateWord = (updatedWord: VocabWord) => {
    setWords((prev) => 
      prev.map(w => w.id === updatedWord.id ? updatedWord : w)
    );
  };

  const handleCreateCollection = (name: string, icon: string, color: string) => {
    const newCollection: Collection = {
      id: "col_" + Date.now(),
      name,
      icon,
      color,
      type: "user",
      canEdit: true,
      canDelete: true,
      createdAt: Date.now(),
    };

    const updatedCollections = [...collections, newCollection];
    setCollections(updatedCollections);
    saveCollections(updatedCollections);
    setIsCreateCollectionModalOpen(false);
    setLastCreatedCollectionId(newCollection.id);
  };

  const handleUpdateCollection = (id: string, name: string, icon: string, color: string) => {
    const updatedCollections = collections.map(c => 
      c.id === id ? { ...c, name, icon, color } : c
    );
    setCollections(updatedCollections);
    saveCollections(updatedCollections);
    setEditingCollection(null);
  };

  const handleDeleteCollection = (deleteWords: boolean) => {
    if (!deletingCollection) return;
    
    const id = deletingCollection.id;

    // 1. Handle Words
    if (deleteWords) {
        // Remove words belonging to this collection
        setWords(prev => prev.filter(w => w.collectionId !== id));
    } else {
        // Move words to All Words (collectionId: null)
        setWords(prev => prev.map(w => 
            w.collectionId === id ? { ...w, collectionId: null } : w
        ));
    }

    // 2. Remove Collection
    const updatedCollections = collections.filter(c => c.id !== id);
    setCollections(updatedCollections);
    saveCollections(updatedCollections);
    setDeletingCollection(null);
    
    // If we were viewing this collection, go back
    if (currentView === 'collection-detail' && selectedCollectionId === id) {
      setCurrentView('collections');
      setSelectedCollectionId(null);
    }
  };

  const handleEditWord = (id: number, newWord: string, newMeaning: string, collectionId: string | null) => {
    setWords((prev) => 
      prev.map(w => w.id === id ? { ...w, word: newWord, meaning: newMeaning, collectionId: collectionId } : w)
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
  const handleStartReview = (collectionId: string | null = null) => {
    setReviewTargetCollectionId(collectionId);
    setCurrentView('review');
  };

  const handleGoToWordBank = (filter: 'all' | 'learning' | 'mastered' = 'all') => {
    setWordBankFilter(filter);
    setCurrentView('wordbank');
  };

  const handleOpenCollection = (id: string) => {
    setSelectedCollectionId(id);
    setCurrentView('collection-detail');
  };

  const renderContent = () => {
    switch (currentView) {
      case 'dashboard':
        return (
          <div className="h-full overflow-y-auto custom-scrollbar pb-32 md:pb-48">
            <Dashboard 
              words={words} 
              onStartReview={() => handleStartReview(null)}
              onAddWord={() => handleOpenAddModal()}
              onGoToWordBank={handleGoToWordBank}
            />
          </div>
        );
      case 'collections':
        return (
          <CollectionsView 
            collections={collections}
            words={words}
            onOpenCollection={handleOpenCollection}
            onAddCollection={() => setIsCreateCollectionModalOpen(true)}
            onEditCollection={(col) => setEditingCollection(col)}
            onDeleteCollection={(col) => setDeletingCollection(col)}
          />
        );
      case 'collection-detail':
         const activeCollection = collections.find(c => c.id === selectedCollectionId);
         if (!activeCollection) return null; // Should ideally redirect back
         
         return (
           <CollectionDetailView
             collection={activeCollection}
             words={words}
             onBack={() => {
               setCurrentView('collections');
               setSelectedCollectionId(null);
             }}
             onAddWord={(colId) => handleOpenAddModal(colId)}
             onEditWord={handleEditWord}
             onDeleteWord={handleDeleteWord}
             onToggleMastered={handleToggleMastered}
             onReview={() => handleStartReview(activeCollection.id)}
             onEditCollection={(col) => setEditingCollection(col)}
             onDeleteCollection={(col) => setDeletingCollection(col)}
             collections={collections}
             onRequestCreateCollection={() => setIsCreateCollectionModalOpen(true)}
             lastCreatedCollectionId={lastCreatedCollectionId}
           />
         );
      case 'wordbank':
        return (
          <WordBank 
            words={words}
            collections={collections}
            initialFilter={wordBankFilter}
            onAdd={() => handleOpenAddModal()}
            onEdit={handleEditWord}
            onDelete={handleDeleteWord}
            onToggleMastered={handleToggleMastered}
            onRequestCreateCollection={() => setIsCreateCollectionModalOpen(true)}
            lastCreatedCollectionId={lastCreatedCollectionId}
          />
        );
      case 'review':
        return (
          <div className="h-full w-full bg-gray-50 dark:bg-dark-bg">
            <ReviewMode 
              words={words}
              collections={collections}
              sessionLimit={sessionLimit}
              initialCollectionId={reviewTargetCollectionId}
              onUpdateWord={handleUpdateWord}
              onBackToDashboard={() => {
                setCurrentView('dashboard');
                setReviewTargetCollectionId(null);
              }}
            />
          </div>
        );
      case 'settings':
        return (
          <div className="h-full overflow-y-auto custom-scrollbar pb-32 md:pb-48 px-1">
            <SettingsView 
               sessionLimit={sessionLimit}
               setSessionLimit={handleSessionLimitChange}
               onResetData={handleResetData}
               words={words}
               onResetSRSData={handleResetSRSData}
               onReplayTutorial={handleReplayTutorial}
               isDarkMode={isDarkMode}
               toggleTheme={toggleDarkMode}
            />
          </div>
        );
      default:
        return null;
    }
  };

  return (
    <div className="h-screen bg-transparent text-dark dark:text-dark-text flex flex-col overflow-hidden">
      
      {/* Show Global Header unless in Settings or Collection Detail (which has its own header) */}
      {currentView !== 'settings' && currentView !== 'collection-detail' && (
        <Header />
      )}
      
      {/* Main Content Area */}
      <main className={`flex-1 w-full max-w-2xl mx-auto ${currentView !== 'collection-detail' && currentView !== 'review' ? 'px-4 sm:px-6 pt-4 sm:pt-6' : ''} overflow-hidden relative`}>
        <div className="h-full w-full">
          {renderContent()}
        </div>
      </main>

      {/* Show Bottom Nav unless in Collection Detail */}
      {currentView !== 'collection-detail' && (
        <BottomNav currentView={currentView} onViewChange={setCurrentView} />
      )}

      {/* Global Add Word Modal */}
      {isAddModalOpen && (
        <AddWordModal 
          onAdd={handleAddWord} 
          onCancel={() => setIsAddModalOpen(false)}
          collections={collections}
          onRequestCreateCollection={() => setIsCreateCollectionModalOpen(true)}
          lastCreatedCollectionId={lastCreatedCollectionId}
          initialCollectionId={addModalInitialCollectionId}
        />
      )}
      
      {/* Global Create Collection Modal */}
      <CreateCollectionModal 
        isOpen={isCreateCollectionModalOpen}
        onClose={() => setIsCreateCollectionModalOpen(false)}
        onCreate={handleCreateCollection}
        existingCollections={collections}
      />
      
      {/* Edit Collection Modal */}
      <EditCollectionModal 
        isOpen={!!editingCollection}
        onClose={() => setEditingCollection(null)}
        onSave={handleUpdateCollection}
        collection={editingCollection}
        existingCollections={collections}
      />

      {/* Delete Collection Modal */}
      <DeleteCollectionModal
        isOpen={!!deletingCollection}
        onClose={() => setDeletingCollection(null)}
        onDelete={handleDeleteCollection}
        collection={deletingCollection}
        wordCount={deletingCollection ? words.filter(w => w.collectionId === deletingCollection.id).length : 0}
      />

      {/* Tutorial Overlay */}
      <TutorialOverlay 
        isOpen={showTutorial} 
        onComplete={handleTutorialComplete}
        onClose={() => setShowTutorial(false)}
      />

    </div>
  );
};

export default App;