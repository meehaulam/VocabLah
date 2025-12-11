export interface Collection {
  id: string;
  name: string;
  icon: string;
  color: string;
  type: 'system' | 'user';
  canEdit: boolean;
  canDelete: boolean;
  createdAt: number;
}

export interface VocabWord {
  id: number;
  word: string;
  meaning: string;
  mastered: boolean;
  createdAt: number;
  collectionId: string | null;
  // SRS Fields
  easeFactor: number;
  interval: number;
  repetitions: number;
  nextReviewDate: string; // ISO Date YYYY-MM-DD
  lastReviewDate: string | null; // ISO Date YYYY-MM-DD or null
}