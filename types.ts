export interface UserData {
  name: string;
  email?: string; // Optional email field
  birthDate: string;
  birthTime: string;
  birthPlace: string;
  focusArea: string;
  imageSize?: "1K" | "2K" | "4K";
}

export interface HoroscopeSection {
  title: string;
  content: string;
  icon: string; // Emoji or icon name
}

export interface HoroscopeReading {
  summary: string;
  sections: HoroscopeSection[];
  luckyNumbers: number[];
  luckyColors: string[];
}

export interface GeneratedImage {
  base64: string;
  mimeType: string;
}

export interface SavedReading {
  id: string;
  timestamp: number;
  userData: UserData;
  readingData: HoroscopeReading;
  imageData: string;
}

export enum AppState {
  INPUT,
  GENERATING,
  READING,
  LIVE_SESSION
}