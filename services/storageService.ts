import { SavedReading } from '../types';

const STORAGE_KEY = 'omni_cosmos_journal';

export const saveReadingToLocal = (reading: SavedReading): boolean => {
  try {
    const existing = getReadingsFromLocal();
    // Check for duplicate content to avoid spamming save
    const isDuplicate = existing.some(r => 
      r.timestamp === reading.timestamp || 
      (r.readingData.summary === reading.readingData.summary)
    );
    
    if (isDuplicate) return true;

    // Limit to last 5 items to prevent LocalStorage quota limits (images are heavy)
    // Decreased from 10 to 5 to ensure stability.
    const updated = [reading, ...existing].slice(0, 5);
    localStorage.setItem(STORAGE_KEY, JSON.stringify(updated));
    return true;
  } catch (e) {
    console.error("Storage failed (likely quota exceeded)", e);
    return false;
  }
};

export const getReadingsFromLocal = (): SavedReading[] => {
  try {
    const data = localStorage.getItem(STORAGE_KEY);
    return data ? JSON.parse(data) : [];
  } catch (e) {
    console.error("Failed to load readings", e);
    return [];
  }
};

export const deleteReadingFromLocal = (id: string): SavedReading[] => {
  try {
    const existing = getReadingsFromLocal();
    const updated = existing.filter(r => r.id !== id);
    localStorage.setItem(STORAGE_KEY, JSON.stringify(updated));
    return updated;
  } catch (e) {
    console.error("Failed to delete reading", e);
    return [];
  }
};