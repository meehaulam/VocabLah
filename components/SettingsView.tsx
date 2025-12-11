import React, { useState } from 'react';
import { Trash2, AlertTriangle, RotateCcw, ChevronDown, ChevronUp, HelpCircle, Moon, Sun } from 'lucide-react';
import { VocabWord } from '../types';
import { SRS_SETTINGS_KEYS, getSRSSettings, getDailyCounts } from '../utils/srs';
import { Tooltip } from './Tooltip';

export type SessionLimitOption = 10 | 20 | 50 | 'all';

interface SettingsViewProps {
  sessionLimit: SessionLimitOption;
  setSessionLimit: (limit: SessionLimitOption) => void;
  onResetData: () => void;
  words: VocabWord[];
  onResetSRSData: () => void;
  onReplayTutorial: () => void;
  isDarkMode: boolean;
  toggleTheme: () => void;
}

const FAQ_DATA = [
  {
    category: "Getting Started",
    items: [
      { q: "How do I add words?", a: "Tap \"+ Add Word\" button on Dashboard or in Collections. Enter the word and meaning, optionally select a collection, then save." },
      { q: "What are Collections?", a: "Collections help organize words by topic (Work, Food, Transport, etc.). You can create unlimited collections and review them separately." }
    ]
  },
  {
    category: "Reviewing",
    items: [
      { q: "What does \"Due today\" mean?", a: "Cards ready for review based on spaced repetition. The app shows cards when your brain is ready to learn them for maximum retention." },
      { q: "Why can't I review all my words?", a: "The app uses spaced repetition - only showing cards that are due. This is scientifically proven to be more effective than reviewing everything at once." },
      { q: "How do the difficulty buttons work?", a: (
        <div className="space-y-1">
          <p><span className="font-bold text-gray-800">Again:</span> Didn't remember - review again today</p>
          <p><span className="font-bold text-gray-800">Hard:</span> Struggled to recall - shorter interval</p>
          <p><span className="font-bold text-gray-800">Good:</span> Remembered well - normal interval</p>
          <p><span className="font-bold text-gray-800">Easy:</span> Very easy - longer interval</p>
          <p className="pt-2">The app adjusts intervals based on your ratings.</p>
        </div>
      )}
    ]
  },
  {
    category: "Understanding Progress",
    items: [
      { q: "What is \"Learning\" vs \"Mature\"?", a: (
        <div className="space-y-1">
          <p><span className="font-bold text-gray-800">Learning:</span> Cards you're still memorizing (reviewed frequently)</p>
          <p><span className="font-bold text-gray-800">Mature:</span> Cards in long-term memory with 21+ day intervals (reviewed less often)</p>
        </div>
      )},
      { 
        q: "What is spaced repetition?", 
        isSRSLink: true,
        a: "A scientifically proven learning technique that shows information at increasing intervals. It improves retention by 200-300% compared to traditional studying." 
      }
    ]
  },
  {
    category: "Settings",
    items: [
      { q: "How do I change review limits?", a: "Go to Settings → Session Limit to adjust cards per review session. You can also set \"New Cards Per Day\" limit in SRS settings." },
      { q: "How do I backup my data?", a: "Currently data is stored locally on your device. Avoid clearing browser data to preserve your words. Cloud sync coming soon!" }
    ]
  },
  {
    category: "Troubleshooting",
    items: [
      { q: "My cards disappeared!", a: "Check if you're viewing the correct collection. If cards are truly missing, you may have cleared browser data. Always keep browser data for Vocab Lah." }
    ]
  }
];

interface FAQItemProps {
  question: string;
  answer: React.ReactNode;
  onSRSLink?: () => void;
}

const FAQItem: React.FC<FAQItemProps> = ({ question, answer, onSRSLink }) => {
  const [isOpen, setIsOpen] = useState(false);

  return (
    <div className="border border-gray-200 dark:border-dark-border rounded-lg overflow-hidden mb-2 bg-white dark:bg-dark-surface">
      <button 
        onClick={() => setIsOpen(!isOpen)}
        className="w-full flex items-center justify-between p-4 bg-gray-50 dark:bg-dark-bg hover:bg-gray-100 dark:hover:bg-gray-800 transition-colors text-left"
      >
        <span className="font-medium text-dark dark:text-dark-text text-sm sm:text-base pr-4">{question}</span>
        {isOpen ? <ChevronUp className="w-4 h-4 text-gray-500 shrink-0" /> : <ChevronDown className="w-4 h-4 text-gray-500 shrink-0" />}
      </button>
      {isOpen && (
        <div className="p-4 text-sm text-gray-600 dark:text-dark-text-sec leading-relaxed border-t border-gray-200 dark:border-dark-border">
          {answer}
          {onSRSLink && (
             <button onClick={onSRSLink} className="block mt-2 text-primary font-semibold hover:underline">
               Learn more about Spaced Repetition
             </button>
          )}
        </div>
      )}
    </div>
  );
};

export const SettingsView: React.FC<SettingsViewProps> = ({
  sessionLimit,
  setSessionLimit,
  onResetData,
  words,
  onResetSRSData,
  onReplayTutorial,
  isDarkMode,
  toggleTheme
}) => {
  const handleHardReset = () => {
    if (window.confirm("Are you sure you want to delete ALL data? This cannot be undone.")) {
      if (window.confirm("Seriously, this will wipe everything. Confirm?")) {
        onResetData();
      }
    }
  };

  const handleSRSReset = () => {
    if (window.confirm("This will reset progress for ALL words (interval, repetitions, ease factor). Words will remain but you will have to relearn them. Continue?")) {
      onResetSRSData();
    }
  };

  return (
    <div className="flex flex-col gap-6 animate-in fade-in duration-500 text-dark dark:text-dark-text">
      
      {/* Header */}
      <div className="pt-2">
        <h2 className="text-xl font-bold text-dark dark:text-dark-text">Settings</h2>
      </div>

      {/* Appearance */}
      <section className="bg-white dark:bg-dark-surface rounded-xl p-4 shadow-sm border border-gray-100 dark:border-dark-border space-y-4">
        <h3 className="text-sm font-bold text-gray-400 dark:text-gray-500 uppercase tracking-wider">Appearance</h3>
        
        <div className="flex items-center justify-between">
          <div className="flex items-center gap-3">
             <div className="p-2 bg-gray-100 dark:bg-dark-bg rounded-full">
                {isDarkMode ? <Moon className="w-5 h-5 text-primary" /> : <Sun className="w-5 h-5 text-orange-500" />}
             </div>
             <div className="space-y-0.5">
               <span className="font-semibold text-dark dark:text-dark-text">Dark Mode</span>
               <p className="text-xs text-gray-500 dark:text-dark-text-sec">Easy on the eyes</p>
             </div>
          </div>
          <button 
            onClick={toggleTheme}
            className={`w-12 h-6 rounded-full p-1 transition-colors duration-300 ease-in-out ${isDarkMode ? 'bg-primary' : 'bg-gray-300'}`}
          >
            <div className={`w-4 h-4 rounded-full bg-white shadow-sm transform transition-transform duration-300 ease-in-out ${isDarkMode ? 'translate-x-6' : 'translate-x-0'}`} />
          </button>
        </div>
      </section>

      {/* Review Settings */}
      <section className="bg-white dark:bg-dark-surface rounded-xl p-4 shadow-sm border border-gray-100 dark:border-dark-border space-y-4">
        <h3 className="text-sm font-bold text-gray-400 dark:text-gray-500 uppercase tracking-wider">Review Session</h3>
        
        <div className="flex items-center justify-between">
          <div className="space-y-0.5">
             <span className="font-semibold text-dark dark:text-dark-text">Cards per session</span>
             <p className="text-xs text-gray-500 dark:text-dark-text-sec">Maximum cards to review at once</p>
          </div>
          <select
            value={sessionLimit}
            onChange={(e) => setSessionLimit(e.target.value === 'all' ? 'all' : parseInt(e.target.value) as SessionLimitOption)}
            className="bg-gray-50 dark:bg-dark-bg border border-gray-200 dark:border-dark-border rounded-lg px-3 py-2 text-sm font-semibold text-dark dark:text-dark-text outline-none focus:ring-2 focus:ring-primary/20"
          >
            <option value={10}>10 cards</option>
            <option value={20}>20 cards</option>
            <option value={50}>50 cards</option>
            <option value="all">All due</option>
          </select>
        </div>
      </section>

      {/* Help & Support */}
      <section className="space-y-4">
         <div className="flex items-center justify-between px-1">
             <h3 className="text-sm font-bold text-gray-400 dark:text-gray-500 uppercase tracking-wider">Help & FAQ</h3>
             <button 
               onClick={onReplayTutorial}
               className="text-xs font-semibold text-primary hover:underline flex items-center gap-1"
             >
               <HelpCircle className="w-3.5 h-3.5" /> Replay Tutorial
             </button>
         </div>

         <div className="space-y-4">
            {FAQ_DATA.map((section, idx) => (
               <div key={idx}>
                  <h4 className="text-xs font-bold text-gray-500 dark:text-gray-400 mb-2 pl-1">{section.category}</h4>
                  <div>
                    {section.items.map((item, i) => (
                      <FAQItem key={i} question={item.q} answer={item.a} onSRSLink={item.isSRSLink ? () => {} : undefined} />
                    ))}
                  </div>
               </div>
            ))}
         </div>
      </section>

      {/* Danger Zone */}
      <section className="bg-red-50 dark:bg-red-900/10 rounded-xl p-4 shadow-sm border border-red-100 dark:border-red-900/30 space-y-4 mt-4">
        <h3 className="text-sm font-bold text-red-500 uppercase tracking-wider flex items-center gap-2">
           <AlertTriangle className="w-4 h-4" /> Danger Zone
        </h3>
        
        <div className="space-y-3">
           <button
             onClick={handleSRSReset}
             className="w-full flex items-center justify-between p-3 bg-white dark:bg-dark-surface border border-red-200 dark:border-red-900/30 rounded-lg hover:bg-red-50 dark:hover:bg-red-900/20 transition-colors group"
           >
              <div className="text-left">
                <div className="font-semibold text-red-600 dark:text-red-400">Reset Progress</div>
                <div className="text-xs text-red-400 dark:text-red-400/70">Keep words, reset SRS intervals</div>
              </div>
              <RotateCcw className="w-5 h-5 text-red-400 group-hover:text-red-600" />
           </button>

           <button
             onClick={handleHardReset}
             className="w-full flex items-center justify-between p-3 bg-white dark:bg-dark-surface border border-red-200 dark:border-red-900/30 rounded-lg hover:bg-red-50 dark:hover:bg-red-900/20 transition-colors group"
           >
              <div className="text-left">
                <div className="font-semibold text-red-600 dark:text-red-400">Delete Everything</div>
                <div className="text-xs text-red-400 dark:text-red-400/70">Remove all words and collections</div>
              </div>
              <Trash2 className="w-5 h-5 text-red-400 group-hover:text-red-600" />
           </button>
        </div>
      </section>

      <div className="text-center text-xs text-gray-400 dark:text-gray-600 pb-4">
         VocabLah v1.0 • Purple Edition
      </div>
    </div>
  );
};