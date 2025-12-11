import { Collection, VocabWord } from '../types';

const COLLECTIONS_KEY = "vocab_lah_collections";
const WORDS_KEY = "vocab_lah_words";

export const getCollections = (): Collection[] => {
  try {
    const stored = localStorage.getItem(COLLECTIONS_KEY);
    return stored ? JSON.parse(stored) : [];
  } catch (e) {
    console.error("Error loading collections:", e);
    return [];
  }
};

export const saveCollections = (collections: Collection[]): void => {
  try {
    localStorage.setItem(COLLECTIONS_KEY, JSON.stringify(collections));
  } catch (e) {
    console.error("Error saving collections:", e);
  }
};

export const getCollectionById = (id: string): Collection | null => {
  const collections = getCollections();
  return collections.find(c => c.id === id) || null;
};

export const getWordsByCollection = (collectionId: string | null): VocabWord[] => {
  try {
    const storedWords = localStorage.getItem(WORDS_KEY);
    const words: VocabWord[] = storedWords ? JSON.parse(storedWords) : [];
    
    if (collectionId === 'all') {
      return words;
    }
    
    // Explicit null check for uncategorized, or matching specific ID
    return words.filter(w => w.collectionId === collectionId);
  } catch (e) {
    console.error("Error loading words for collection:", e);
    return [];
  }
};

export const getCollectionWordCount = (collectionId: string | null): number => {
  return getWordsByCollection(collectionId).length;
};