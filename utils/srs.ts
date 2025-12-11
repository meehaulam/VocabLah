import { VocabWord } from '../types';
import { getTodayDate, addDays, isDue, getDaysDifference } from './date';

export type Difficulty = 'again' | 'hard' | 'good' | 'easy';

// --- SRS Settings & Storage Keys ---

export const SRS_SETTINGS_KEYS = {
  NEW_CARDS_LIMIT: 'vocab_lah_new_cards_limit',
  MAX_REVIEWS_LIMIT: 'vocab_lah_max_reviews_limit',
  AUTO_MATURE: 'vocab_lah_auto_mature',
  LEARNING_STEPS: 'vocab_lah_learning_steps',
  DAILY_REVIEWS: 'vocab_lah_daily_reviews',
  DAILY_NEW: 'vocab_lah_daily_new_cards'
};

export const getSRSSettings = () => {
  const newCardsLimit = localStorage.getItem(SRS_SETTINGS_KEYS.NEW_CARDS_LIMIT) || '10';
  const maxReviewsLimit = localStorage.getItem(SRS_SETTINGS_KEYS.MAX_REVIEWS_LIMIT) || '100';
  const autoMature = localStorage.getItem(SRS_SETTINGS_KEYS.AUTO_MATURE) !== 'false';
  const learningSteps = JSON.parse(localStorage.getItem(SRS_SETTINGS_KEYS.LEARNING_STEPS) || '[1, 6]');

  return {
    newCardsLimit: newCardsLimit === 'unlimited' ? Infinity : parseInt(newCardsLimit),
    maxReviewsLimit: maxReviewsLimit === 'unlimited' ? Infinity : parseInt(maxReviewsLimit),
    autoMature,
    learningSteps: Array.isArray(learningSteps) && learningSteps.length >= 2 ? learningSteps : [1, 6]
  };
};

export const getDailyCounts = () => {
  const today = getTodayDate();
  const reviewData = JSON.parse(localStorage.getItem(SRS_SETTINGS_KEYS.DAILY_REVIEWS) || '{}');
  const newData = JSON.parse(localStorage.getItem(SRS_SETTINGS_KEYS.DAILY_NEW) || '{}');
  
  return {
    reviews: reviewData[today] || 0,
    newCards: newData[today] || 0
  };
};

export const incrementDailyCounts = (reviewsCount: number, newCardsCount: number) => {
  const today = getTodayDate();
  
  const reviewData = JSON.parse(localStorage.getItem(SRS_SETTINGS_KEYS.DAILY_REVIEWS) || '{}');
  reviewData[today] = (reviewData[today] || 0) + reviewsCount;
  localStorage.setItem(SRS_SETTINGS_KEYS.DAILY_REVIEWS, JSON.stringify(reviewData));

  const newData = JSON.parse(localStorage.getItem(SRS_SETTINGS_KEYS.DAILY_NEW) || '{}');
  newData[today] = (newData[today] || 0) + newCardsCount;
  localStorage.setItem(SRS_SETTINGS_KEYS.DAILY_NEW, JSON.stringify(newData));
};

// --- Standard SRS Logic ---

export const isCardDue = (word: VocabWord): boolean => {
  return isDue(word.nextReviewDate);
};

export const getDueCards = (words: VocabWord[]): VocabWord[] => {
  return words.filter(isCardDue);
};

export const getNextDueInfo = (words: VocabWord[]) => {
  const today = getTodayDate();
  const futureCards = words.filter(w => w.nextReviewDate > today);
  
  if (futureCards.length === 0) {
    return null;
  }
  
  // Sort by nextReviewDate ascending
  futureCards.sort((a, b) => a.nextReviewDate.localeCompare(b.nextReviewDate));
  
  const nextDueDate = futureCards[0].nextReviewDate;
  const nextDueCount = futureCards.filter(w => 
    w.nextReviewDate === nextDueDate
  ).length;
  
  // Calculate days until
  const daysUntil = getDaysDifference(today, nextDueDate);
  
  let timeText = 'later';
  if (daysUntil <= 1) timeText = 'tomorrow'; 
  else if (daysUntil <= 7) timeText = `in ${daysUntil} days`;
  else timeText = `on ${new Date(nextDueDate).toLocaleDateString()}`;
  
  return {
    date: nextDueDate,
    count: nextDueCount,
    timeText: timeText
  };
};

export const getSRSStage = (word: VocabWord): { label: string; type: 'new' | 'learning' | 'young' | 'mature' } => {
  if (word.repetitions === 0) return { label: 'New', type: 'new' };
  if (word.interval < 21) return { label: 'Learning', type: 'learning' };
  if (word.interval < 60) return { label: 'Young', type: 'young' };
  return { label: 'Mature', type: 'mature' };
};

export const calculateSM2 = (word: VocabWord, difficulty: Difficulty): VocabWord => {
  const today = getTodayDate();
  const settings = getSRSSettings();

  let newInterval = 0;
  let newRepetitions = word.repetitions;
  let newEaseFactor = word.easeFactor;

  // Map difficulty to quality (0-5 scale roughly)
  // Again: < 3 (Fail)
  // Hard/Good/Easy: >= 3 (Pass)

  if (difficulty === 'again') {
    // FAIL
    newRepetitions = 0;
    newInterval = 0; // Review again today/soon
    // Decrease ease factor (make it harder), min 1.3
    newEaseFactor = Math.max(1.3, newEaseFactor - 0.2);
  } else {
    // PASS
    if (newRepetitions === 0) {
      newInterval = settings.learningSteps[0]; // First custom step
    } else if (newRepetitions === 1) {
      newInterval = settings.learningSteps[1]; // Second custom step
    } else {
      newInterval = Math.round(word.interval * newEaseFactor);
    }

    newRepetitions += 1;

    // Adjust Ease Factor
    if (difficulty === 'hard') {
      newEaseFactor = Math.max(1.3, newEaseFactor - 0.15);
    } else if (difficulty === 'good') {
      // No change
    } else if (difficulty === 'easy') {
      newEaseFactor = newEaseFactor + 0.15;
    }
  }

  // Calculate next review date
  const nextReviewDate = addDays(today, newInterval);

  // Auto-mastery logic
  let isMastered = word.mastered;
  
  if (settings.autoMature) {
      // If setting is ON, check interval threshold (60 days)
      if (newInterval >= 60) {
          isMastered = true;
      }
  } else {
      // If setting is OFF, only manual mastery is allowed (or if already mastered, stay mastered)
      // We do NOT set it to true automatically here.
  }
  
  // Legacy logic: if already mastered, keep it.
  if (word.mastered) isMastered = true;

  return {
    ...word,
    interval: newInterval,
    repetitions: newRepetitions,
    easeFactor: newEaseFactor,
    nextReviewDate: nextReviewDate,
    lastReviewDate: today,
    mastered: isMastered
  };
};

export const getSRSIntervalPreview = (word: VocabWord) => {
  const intervals: Record<Difficulty, string> = {
    again: '',
    hard: '',
    good: '',
    easy: ''
  };

  const difficulties: Difficulty[] = ['again', 'hard', 'good', 'easy'];

  difficulties.forEach(diff => {
    // Calculate simulated result without mutating original word
    const simulated = calculateSM2({ ...word }, diff);
    const days = simulated.interval;

    if (days === 0) {
      intervals[diff] = '<1d';
    } else if (days === 1) {
      intervals[diff] = '1d';
    } else {
      intervals[diff] = `${days}d`;
    }
  });

  return intervals;
};