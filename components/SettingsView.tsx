import React, { useState, useEffect } from 'react';
import { ArrowLeft, Trash2, AlertTriangle, RotateCcw, BarChart3, X, Activity, Layers, Calendar } from 'lucide-react';
import { VocabWord } from '../types';
import { SRS_SETTINGS_KEYS, getSRSSettings, getDailyCounts } from '../utils/srs';

export type ThemeOption = 'light' | 'dark' | 'auto';
export type SessionLimitOption = 10 | 20 | 50 | 'all';

interface SettingsViewProps {
  theme: ThemeOption;
  setTheme: (theme: ThemeOption) => void;
  sessionLimit: SessionLimitOption;
  setSessionLimit: (limit: SessionLimitOption) => void;
  onBack: () => void;
  onResetData: () => void;
  words: VocabWord[];
  onResetSRSData: () => void;
}

export const SettingsView: React.FC<SettingsViewProps> = ({
  theme,
  setTheme,
  sessionLimit,
  setSessionLimit,
  onBack,
  onResetData,
  words,
  onResetSRSData
}) => {
  const [isResetModalOpen, setIsResetModalOpen] = useState(false);
  const [isResetSRSModalOpen, setIsResetSRSModalOpen] = useState(false);
  const [isStatsModalOpen, setIsStatsModalOpen] = useState(false);
  
  // SRS Settings State
  const [newCardsLimit, setNewCardsLimit] = useState<string>('10');
  const [maxReviewsLimit, setMaxReviewsLimit] = useState<string>('100');
  const [autoMature, setAutoMature] = useState<boolean>(true);
  const [step1, setStep1] = useState<number>(1);
  const [step2, setStep2] = useState<number>(6);

  // Load SRS Settings on Mount
  useEffect(() => {
    const settings = getSRSSettings();
    setNewCardsLimit(settings.newCardsLimit === Infinity ? 'unlimited' : settings.newCardsLimit.toString());
    setMaxReviewsLimit(settings.maxReviewsLimit === Infinity ? 'unlimited' : settings.maxReviewsLimit.toString());
    setAutoMature(settings.autoMature);
    setStep1(settings.learningSteps[0]);
    setStep2(settings.learningSteps[1]);
  }, []);

  // Handlers
  const handleNewCardsLimitChange = (e: React.ChangeEvent<HTMLSelectElement>) => {
    const val = e.target.value;
    setNewCardsLimit(val);
    localStorage.setItem(SRS_SETTINGS_KEYS.NEW_CARDS_LIMIT, val);
  };

  const handleMaxReviewsLimitChange = (e: React.ChangeEvent<HTMLSelectElement>) => {
    const val = e.target.value;
    setMaxReviewsLimit(val);
    localStorage.setItem(SRS_SETTINGS_KEYS.MAX_REVIEWS_LIMIT, val);
  };

  const handleAutoMatureChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    const val = e.target.checked;
    setAutoMature(val);
    localStorage.setItem(SRS_SETTINGS_KEYS.AUTO_MATURE, val.toString());
  };

  const updateSteps = (s1: number, s2: number) => {
    localStorage.setItem(SRS_SETTINGS_KEYS.LEARNING_STEPS, JSON.stringify([s1, s2]));
  };

  const handleStep1Change = (e: React.ChangeEvent<HTMLInputElement>) => {
    const val = Math.max(1, parseInt(e.target.value) || 1);
    setStep1(val);
    updateSteps(val, step2);
  };

  const handleStep2Change = (e: React.ChangeEvent<HTMLInputElement>) => {
    const val = Math.max(1, parseInt(e.target.value) || 1);
    setStep2(val);
    updateSteps(step1, val);
  };

  // Stats Data
  const getStatsData = () => {
    const daily = getDailyCounts();
    const total = words.length;
    const newCards = words.filter(w => w.repetitions === 0).length;
    const learning = words.filter(w => w.repetitions > 0 && w.interval < 21).length;
    const mature = words.filter(w => w.interval >= 21).length; // Using standard 21d threshold for display
    const mastered = words.filter(w => w.mastered).length;

    return { total, newCards, learning, mature, mastered, daily };
  };

  const stats = getStatsData();

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
        
        {/* Section 1: Spaced Repetition */}
        <section className="space-y-4">
          <h2 className="text-xs font-bold text-gray-400 dark:text-gray-500 uppercase tracking-wider pl-1 flex items-center gap-2">
            <Activity className="w-4 h-4" />
            Spaced Repetition
          </h2>
          
          <div className="bg-white dark:bg-dark-surface rounded-xl p-4 shadow-sm border border-gray-100 dark:border-dark-border space-y-6">
            
            {/* New Cards Limit */}
            <div className="flex flex-col gap-2">
              <div className="flex justify-between items-center">
                <label htmlFor="newCards" className="text-sm font-semibold text-dark dark:text-dark-text">New Cards Per Day</label>
                <select 
                  id="newCards" 
                  value={newCardsLimit} 
                  onChange={handleNewCardsLimitChange}
                  className="bg-gray-50 dark:bg-dark-bg border border-gray-200 dark:border-dark-border rounded-lg text-sm px-3 py-1.5 outline-none focus:border-primary text-gray-700 dark:text-gray-300"
                >
                  <option value="5">5 cards</option>
                  <option value="10">10 cards</option>
                  <option value="20">20 cards</option>
                  <option value="50">50 cards</option>
                  <option value="unlimited">Unlimited</option>
                </select>
              </div>
              <p className="text-xs text-gray-500 dark:text-dark-text-sec">Limit new words introduced daily to prevent overload.</p>
            </div>

            {/* Max Reviews Limit */}
            <div className="flex flex-col gap-2">
              <div className="flex justify-between items-center">
                <label htmlFor="maxReviews" className="text-sm font-semibold text-dark dark:text-dark-text">Max Reviews Per Day</label>
                <select 
                  id="maxReviews" 
                  value={maxReviewsLimit} 
                  onChange={handleMaxReviewsLimitChange}
                  className="bg-gray-50 dark:bg-dark-bg border border-gray-200 dark:border-dark-border rounded-lg text-sm px-3 py-1.5 outline-none focus:border-primary text-gray-700 dark:text-gray-300"
                >
                  <option value="50">50 reviews</option>
                  <option value="100">100 reviews</option>
                  <option value="200">200 reviews</option>
                  <option value="unlimited">Unlimited</option>
                </select>
              </div>
              <p className="text-xs text-gray-500 dark:text-dark-text-sec">Cap total reviews to avoid burnout.</p>
            </div>

            {/* Auto Mature */}
            <div className="flex items-center justify-between">
               <div className="flex flex-col gap-1 pr-4">
                 <label htmlFor="autoMature" className="text-sm font-semibold text-dark dark:text-dark-text">Auto-Mark as Mature</label>
                 <p className="text-xs text-gray-500 dark:text-dark-text-sec">Automatically mark cards with 60+ day intervals as mastered.</p>
               </div>
               <div className="relative inline-flex items-center cursor-pointer">
                 <input 
                    type="checkbox" 
                    id="autoMature" 
                    className="sr-only peer" 
                    checked={autoMature}
                    onChange={handleAutoMatureChange}
                 />
                 <div className="w-11 h-6 bg-gray-200 peer-focus:outline-none peer-focus:ring-2 peer-focus:ring-primary/20 dark:peer-focus:ring-primary/30 rounded-full peer dark:bg-gray-700 peer-checked:after:translate-x-full peer-checked:after:border-white after:content-[''] after:absolute after:top-[2px] after:left-[2px] after:bg-white after:border-gray-300 after:border after:rounded-full after:h-5 after:w-5 after:transition-all dark:border-gray-600 peer-checked:bg-primary"></div>
               </div>
            </div>

            {/* Learning Steps */}
            <div className="flex flex-col gap-2">
               <label className="text-sm font-semibold text-dark dark:text-dark-text">Learning Steps</label>
               <div className="flex items-center gap-2 text-sm text-gray-600 dark:text-gray-300 bg-gray-50 dark:bg-dark-bg p-3 rounded-lg border border-gray-100 dark:border-dark-border">
                  <input 
                    type="number" 
                    min="1" max="10" 
                    value={step1} 
                    onChange={handleStep1Change}
                    className="w-12 px-2 py-1 rounded border border-gray-300 dark:border-dark-border text-center bg-white dark:bg-dark-surface"
                  />
                  <span>day(s)</span>
                  <span className="text-gray-400">→</span>
                  <input 
                    type="number" 
                    min="1" max="30" 
                    value={step2} 
                    onChange={handleStep2Change}
                    className="w-12 px-2 py-1 rounded border border-gray-300 dark:border-dark-border text-center bg-white dark:bg-dark-surface"
                  />
                  <span>day(s)</span>
               </div>
               <p className="text-xs text-gray-500 dark:text-dark-text-sec">Intervals for the first two successful reviews.</p>
            </div>

            {/* View Stats Button */}
            <button
               onClick={() => setIsStatsModalOpen(true)}
               className="w-full flex items-center justify-center gap-2 bg-blue-50 dark:bg-blue-900/20 text-blue-600 dark:text-blue-300 font-semibold py-2.5 px-4 rounded-lg border border-blue-200 dark:border-blue-800 hover:bg-blue-100 dark:hover:bg-blue-900/30 transition-colors"
            >
               <BarChart3 className="w-4 h-4" />
               View SRS Statistics
            </button>
          </div>
        </section>

        {/* Section 2: General */}
        <section className="space-y-4">
          <h2 className="text-xs font-bold text-gray-400 dark:text-gray-500 uppercase tracking-wider pl-1">General</h2>
          
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

          {/* Session Limit (Batch) */}
          <div className="bg-white dark:bg-dark-surface rounded-xl p-4 shadow-sm border border-gray-100 dark:border-dark-border space-y-3">
             <label className="block text-sm font-semibold text-dark dark:text-dark-text">Session Batch Size</label>
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
             <p className="text-xs text-gray-500 dark:text-dark-text-sec">How many cards to load into the player at once.</p>
          </div>
        </section>

        {/* Section 3: Danger Zone */}
        <section className="space-y-4">
          <h2 className="text-xs font-bold text-red-500/80 uppercase tracking-wider pl-1">Danger Zone</h2>
          
          <div className="space-y-3">
            <div className="bg-orange-50 dark:bg-orange-900/10 rounded-xl p-4 border border-orange-100 dark:border-orange-900/30">
              <button
                onClick={() => setIsResetSRSModalOpen(true)}
                className="w-full flex items-center justify-center gap-2 text-orange-600 dark:text-orange-400 font-semibold py-3 px-4 rounded-lg border border-orange-200 dark:border-orange-800 hover:bg-orange-100 dark:hover:bg-orange-900/20 transition-colors"
              >
                <RotateCcw className="w-5 h-5" />
                Reset SRS Data
              </button>
              <p className="text-xs text-orange-500/80 mt-2 text-center">
                Keep words but reset all scheduling and mastery progress.
              </p>
            </div>

            <div className="bg-red-50 dark:bg-red-900/10 rounded-xl p-4 border border-red-100 dark:border-red-900/30">
              <button
                onClick={() => setIsResetModalOpen(true)}
                className="w-full flex items-center justify-center gap-2 text-red-600 dark:text-red-400 font-semibold py-3 px-4 rounded-lg border border-red-200 dark:border-red-800 hover:bg-red-100 dark:hover:bg-red-900/20 transition-colors"
              >
                <Trash2 className="w-5 h-5" />
                Reset All Data
              </button>
              <p className="text-xs text-red-400 mt-2 text-center opacity-80">
                Permanently delete all words and progress. This action cannot be undone.
              </p>
            </div>
          </div>
        </section>
      </div>

      {/* Stats Modal */}
      {isStatsModalOpen && (
        <div className="fixed inset-0 z-[100] flex items-center justify-center p-4 bg-black/50 backdrop-blur-sm animate-in fade-in duration-200">
           <div className="bg-white dark:bg-dark-surface rounded-xl shadow-2xl w-full max-w-sm overflow-hidden animate-in zoom-in-95 duration-200 border border-gray-100 dark:border-dark-border flex flex-col max-h-[90vh]">
              <div className="p-4 border-b border-gray-100 dark:border-dark-border flex items-center justify-between">
                 <h3 className="font-bold text-dark dark:text-dark-text flex items-center gap-2">
                   <BarChart3 className="w-5 h-5 text-primary" /> SRS Statistics
                 </h3>
                 <button onClick={() => setIsStatsModalOpen(false)} className="text-gray-400 hover:text-gray-600 dark:hover:text-gray-200">
                   <X className="w-5 h-5" />
                 </button>
              </div>
              <div className="p-4 overflow-y-auto custom-scrollbar space-y-4">
                 <div className="grid grid-cols-2 gap-3">
                    <div className="p-3 bg-gray-50 dark:bg-dark-bg rounded-lg border border-gray-100 dark:border-dark-border text-center">
                       <div className="text-2xl font-bold text-dark dark:text-dark-text">{stats.total}</div>
                       <div className="text-xs text-gray-500 dark:text-gray-400 uppercase font-semibold">Total Cards</div>
                    </div>
                    <div className="p-3 bg-gray-50 dark:bg-dark-bg rounded-lg border border-gray-100 dark:border-dark-border text-center">
                       <div className="text-2xl font-bold text-primary">{stats.mastered}</div>
                       <div className="text-xs text-gray-500 dark:text-gray-400 uppercase font-semibold">Mastered</div>
                    </div>
                 </div>

                 <div className="space-y-2">
                    <h4 className="text-xs font-bold text-gray-400 dark:text-gray-500 uppercase tracking-wider">Stages</h4>
                    <div className="bg-gray-50 dark:bg-dark-bg rounded-lg p-3 space-y-2 border border-gray-100 dark:border-dark-border">
                       <div className="flex justify-between text-sm">
                          <span className="flex items-center gap-2"><div className="w-2 h-2 rounded-full bg-blue-500"></div> New</span>
                          <span className="font-mono">{stats.newCards}</span>
                       </div>
                       <div className="flex justify-between text-sm">
                          <span className="flex items-center gap-2"><div className="w-2 h-2 rounded-full bg-orange-500"></div> Learning</span>
                          <span className="font-mono">{stats.learning}</span>
                       </div>
                       <div className="flex justify-between text-sm">
                          <span className="flex items-center gap-2"><div className="w-2 h-2 rounded-full bg-green-500"></div> Mature</span>
                          <span className="font-mono">{stats.mature}</span>
                       </div>
                    </div>
                 </div>

                 <div className="space-y-2">
                    <h4 className="text-xs font-bold text-gray-400 dark:text-gray-500 uppercase tracking-wider">Today's Activity</h4>
                    <div className="bg-gray-50 dark:bg-dark-bg rounded-lg p-3 space-y-2 border border-gray-100 dark:border-dark-border">
                       <div className="flex justify-between text-sm">
                          <span className="text-gray-600 dark:text-gray-400">Reviews Done</span>
                          <span className="font-mono font-bold text-dark dark:text-dark-text">{stats.daily.reviews}</span>
                       </div>
                       <div className="flex justify-between text-sm">
                          <span className="text-gray-600 dark:text-gray-400">New Cards Started</span>
                          <span className="font-mono font-bold text-dark dark:text-dark-text">{stats.daily.newCards}</span>
                       </div>
                    </div>
                 </div>
              </div>
           </div>
        </div>
      )}

      {/* Reset SRS Confirmation Modal */}
      {isResetSRSModalOpen && (
        <div className="fixed inset-0 z-[100] flex items-center justify-center p-4 bg-black/50 backdrop-blur-sm animate-in fade-in duration-200">
           <div className="bg-white dark:bg-dark-surface rounded-xl shadow-2xl w-full max-w-sm overflow-hidden animate-in zoom-in-95 duration-200 border border-gray-100 dark:border-dark-border p-6 text-center">
              <div className="w-12 h-12 bg-orange-100 dark:bg-orange-900/30 rounded-full flex items-center justify-center mx-auto mb-4">
                 <RotateCcw className="w-6 h-6 text-orange-600 dark:text-orange-400" />
              </div>
              <h3 className="text-lg font-bold text-dark dark:text-dark-text mb-2">Reset SRS Progress?</h3>
              <p className="text-sm text-gray-500 dark:text-dark-text-sec mb-6">
                Your words will be kept, but all intervals and ease factors will be reset. All cards will become "New".
              </p>
              
              <div className="flex gap-3">
                <button
                   onClick={() => setIsResetSRSModalOpen(false)}
                   className="flex-1 py-2.5 rounded-lg border border-gray-300 dark:border-dark-border text-gray-700 dark:text-gray-300 font-medium hover:bg-gray-50 dark:hover:bg-dark-bg transition-colors"
                >
                  Cancel
                </button>
                <button
                   onClick={() => {
                     onResetSRSData();
                     setIsResetSRSModalOpen(false);
                   }}
                   className="flex-1 py-2.5 rounded-lg bg-orange-600 hover:bg-orange-700 text-white font-medium shadow-sm transition-colors"
                >
                  Reset Progress
                </button>
              </div>
           </div>
        </div>
      )}

      {/* Reset All Data Confirmation Modal */}
      {isResetModalOpen && (
        <div className="fixed inset-0 z-[100] flex items-center justify-center p-4 bg-black/50 backdrop-blur-sm animate-in fade-in duration-200">
           <div className="bg-white dark:bg-dark-surface rounded-xl shadow-2xl w-full max-w-sm overflow-hidden animate-in zoom-in-95 duration-200 border border-gray-100 dark:border-dark-border p-6 text-center">
              <div className="w-12 h-12 bg-red-100 dark:bg-red-900/30 rounded-full flex items-center justify-center mx-auto mb-4">
                 <AlertTriangle className="w-6 h-6 text-red-600 dark:text-red-400" />
              </div>
              <h3 className="text-lg font-bold text-dark dark:text-dark-text mb-2">Reset All Data?</h3>
              <p className="text-sm text-gray-500 dark:text-dark-text-sec mb-6">
                Permanently delete all words and progress. This action cannot be undone.
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