import React, { useState, useEffect } from 'react';
import { ChevronRight } from 'lucide-react';

interface TutorialOverlayProps {
  isOpen: boolean;
  onComplete: () => void;
  onClose: () => void;
}

export const TutorialOverlay: React.FC<TutorialOverlayProps> = ({ isOpen, onComplete, onClose }) => {
  const [currentStep, setCurrentStep] = useState(1);
  const [isDemoFlipped, setIsDemoFlipped] = useState(false);
  const totalSteps = 5;

  // Reset step when opened
  useEffect(() => {
    if (isOpen) {
      setCurrentStep(1);
      setIsDemoFlipped(false);
    }
  }, [isOpen]);

  // Reset flip state when changing steps
  useEffect(() => {
    setIsDemoFlipped(false);
  }, [currentStep]);

  if (!isOpen) return null;

  const handleNext = () => {
    if (currentStep < totalSteps) {
      setCurrentStep(prev => prev + 1);
    } else {
      onComplete();
    }
  };

  const handleSkip = () => {
    const confirmed = window.confirm('Skip tutorial? You can access help in Settings anytime.');
    if (confirmed) {
      onComplete();
    }
  };

  return (
    <div className="fixed inset-0 z-[9999] flex items-center justify-center p-4 bg-black/85 backdrop-blur-sm animate-in fade-in duration-300">
      <div className="tutorial-step bg-white dark:bg-dark-surface rounded-2xl w-full max-w-[500px] shadow-2xl relative flex flex-col items-center text-center animate-in zoom-in-95 duration-300 border border-gray-100 dark:border-dark-border">
        
        {/* Step 1: Welcome */}
        {currentStep === 1 && (
          <>
            <div className="tutorial-header">
              <div className="tutorial-icon text-6xl mb-4">👋</div>
              <h2 className="text-2xl font-bold text-dark dark:text-dark-text mb-3">Welcome to Vocab Lah!</h2>
            </div>
            <div className="tutorial-body">
              <p className="text-gray-600 dark:text-gray-300 text-base leading-relaxed">
                Let's take a quick 30-second tour.
              </p>
            </div>
            <div className="tutorial-footer">
              <button
                onClick={handleNext}
                className="w-full bg-primary hover:bg-primary-hover text-white font-bold py-3.5 rounded-xl shadow-lg shadow-primary/20 transition-all active:scale-[0.98]"
              >
                Get Started
              </button>
              <button
                onClick={handleSkip}
                className="mt-4 text-sm font-medium text-gray-500 hover:text-gray-700 dark:text-gray-400 dark:hover:text-gray-200 transition-colors"
              >
                Skip Tutorial
              </button>
            </div>
          </>
        )}

        {/* Step 2: Add Words */}
        {currentStep === 2 && (
          <>
            <div className="tutorial-header">
              <div className="tutorial-icon text-6xl mb-4">📖</div>
              <h2 className="text-2xl font-bold text-dark dark:text-dark-text mb-3">Add Your Words</h2>
            </div>
            <div className="tutorial-body">
              <p className="text-gray-600 dark:text-gray-300 text-base mb-4">
                Add any word you want to learn with its meaning.
              </p>
              <div className="tutorial-example bg-gray-50 dark:bg-dark-bg p-4 rounded-xl text-left border border-gray-100 dark:border-dark-border">
                <div className="text-xs font-bold text-gray-500 dark:text-gray-400 uppercase mb-2">Example:</div>
                <div className="text-xl font-bold text-dark dark:text-dark-text mb-1">Serendipity</div>
                <div className="text-gray-600 dark:text-dark-text-sec">Finding something good without looking for it</div>
              </div>
            </div>
            <div className="tutorial-footer">
              <button
                onClick={handleNext}
                className="w-full bg-primary hover:bg-primary-hover text-white font-bold py-3.5 rounded-xl shadow-lg shadow-primary/20 transition-all active:scale-[0.98] flex items-center justify-center gap-2"
              >
                Got it! Next <ChevronRight className="w-5 h-5" />
              </button>
            </div>
          </>
        )}

        {/* Step 3: Review Flashcards */}
        {currentStep === 3 && (
          <>
            <div className="tutorial-header">
              <div className="tutorial-icon text-6xl mb-4">🎴</div>
              <h2 className="text-2xl font-bold text-dark dark:text-dark-text mb-3">Review with Flashcards</h2>
            </div>
            <div className="tutorial-body">
              <p className="text-gray-600 dark:text-gray-300 text-base mb-4">
                Tap the card to reveal the answer.
              </p>
              <div className="relative mx-auto w-full max-w-[280px] tutorial-card-demo">
                <div
                  onClick={() => setIsDemoFlipped(!isDemoFlipped)}
                  className={`demo-card ${isDemoFlipped ? 'flipped' : ''}`}
                >
                  <div className="demo-front">
                    <div className="text-2xl font-bold mb-3 text-center">PERSEVERANCE</div>
                    <div className="text-sm opacity-90 text-center animate-pulse mt-auto absolute bottom-6">Tap to reveal →</div>
                  </div>
                  <div className="demo-back">
                    <div className="text-lg font-medium text-center leading-relaxed px-4">
                      Continued effort despite difficulties
                    </div>
                  </div>
                </div>
              </div>
            </div>
            <div className="tutorial-footer">
              <button
                onClick={handleNext}
                className="w-full bg-primary hover:bg-primary-hover text-white font-bold py-3.5 rounded-xl shadow-lg shadow-primary/20 transition-all active:scale-[0.98] flex items-center justify-center gap-2"
              >
                Next <ChevronRight className="w-5 h-5" />
              </button>
            </div>
          </>
        )}

        {/* Step 4: Smart Scheduling */}
        {currentStep === 4 && (
          <>
            <div className="tutorial-header">
              <div className="tutorial-icon text-6xl mb-4">🧠</div>
              <h2 className="text-2xl font-bold text-dark dark:text-dark-text mb-3">Smart Scheduling</h2>
            </div>
            <div className="tutorial-body">
              <p className="text-gray-600 dark:text-gray-300 text-base mb-3">
                The app remembers when you're about to forget.
              </p>
              <div className="tutorial-timeline simple-timeline">
                <div className="timeline-item">
                  <div className="timeline-day">Day 1</div>
                  <div className="timeline-action">Learn word</div>
                </div>
                <div className="timeline-arrow">→</div>
                <div className="timeline-item">
                  <div className="timeline-day">Day 2</div>
                  <div className="timeline-action">Review</div>
                </div>
                <div className="timeline-arrow">→</div>
                <div className="timeline-item">
                  <div className="timeline-day">Day 7</div>
                  <div className="timeline-action">Review</div>
                </div>
                <div className="timeline-arrow">→</div>
                <div className="timeline-item">
                  <div className="timeline-day">Day 21</div>
                  <div className="timeline-action">Mastered!</div>
                </div>
              </div>
              <div className="tutorial-highlight bg-orange-50 dark:bg-orange-900/20 border-l-4 border-orange-500 p-3 rounded-r-lg text-left">
                <p className="font-medium text-orange-800 dark:text-orange-200 text-sm">
                  📅 "Due today" = Ready to review now
                </p>
              </div>
              <p className="text-sm text-gray-400 dark:text-gray-500 italic">
                Review less, remember more!
              </p>
            </div>
            <div className="tutorial-footer">
              <button
                onClick={handleNext}
                className="w-full bg-primary hover:bg-primary-hover text-white font-bold py-3.5 rounded-xl shadow-lg shadow-primary/20 transition-all active:scale-[0.98] flex items-center justify-center gap-2"
              >
                Got it! Next <ChevronRight className="w-5 h-5" />
              </button>
            </div>
          </>
        )}

        {/* Step 5: Collections */}
        {currentStep === 5 && (
          <>
            <div className="tutorial-header">
              <div className="tutorial-icon text-6xl mb-4">📁</div>
              <h2 className="text-2xl font-bold text-dark dark:text-dark-text mb-3">Organize with Collections</h2>
            </div>
            <div className="tutorial-body">
              <p className="text-gray-600 dark:text-gray-300 text-base mb-4">
                Group words by topic or category.
              </p>
              <div className="flex flex-wrap justify-center gap-3">
                <span className="bg-blue-50 dark:bg-blue-900/20 text-blue-600 dark:text-blue-300 px-4 py-2 rounded-full font-medium text-sm">
                  🚗 Transport
                </span>
                <span className="bg-green-50 dark:bg-green-900/20 text-green-600 dark:text-green-300 px-4 py-2 rounded-full font-medium text-sm">
                  🍔 Food
                </span>
                <span className="bg-purple-50 dark:bg-purple-900/20 text-purple-600 dark:text-purple-300 px-4 py-2 rounded-full font-medium text-sm">
                  💼 Work
                </span>
              </div>
            </div>
            <div className="tutorial-footer">
              <button
                onClick={handleNext}
                className="w-full bg-primary hover:bg-primary-hover text-white font-bold py-3.5 rounded-xl shadow-lg shadow-primary/20 transition-all active:scale-[0.98]"
              >
                Start Learning! 🚀
              </button>
            </div>
          </>
        )}

        {/* Progress Dots - Fixed at bottom */}
        <div className="tutorial-progress flex gap-2 justify-center">
          {[1, 2, 3, 4, 5].map((step) => (
            <div
              key={step}
              className={`h-2.5 rounded-full transition-all duration-300 ${
                step <= currentStep
                  ? step === currentStep
                    ? 'w-6 bg-primary'
                    : 'w-2.5 bg-gray-300 dark:bg-gray-600'
                  : 'w-2.5 bg-gray-200 dark:bg-gray-700'
              }`}
            />
          ))}
        </div>
      </div>
    </div>
  );
};