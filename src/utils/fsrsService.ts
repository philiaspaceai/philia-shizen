import { fsrs, createEmptyCard, Rating, Card, State } from 'ts-fsrs';
import { Language } from './i18n';

export interface StoredCard {
  no: number;
  due: string;
  stability: number;
  difficulty: number;
  elapsed_days: number;
  scheduled_days: number;
  learning_steps: number;
  reps: number;
  lapses: number;
  state: State;
  last_review?: string;
}

export interface ReviewLog {
  no: number;
  hiragana: string;
  romaji: string;
  rating: Rating;
  reviewedAt: string; // ISO string
}

export interface ShizenSettings {
  newCardsPerDay: number;
  request_retention: number;
  maximum_interval: number;
  enable_fuzz: boolean;
  enable_short_term: boolean;
  language: Language;
}

export const DEFAULT_SETTINGS: ShizenSettings = {
  newCardsPerDay: 20,
  request_retention: 0.9,
  maximum_interval: 36500,
  enable_fuzz: false,
  enable_short_term: true,
  language: 'en',
};

const LOCAL_CARDS_KEY = 'shizen_fsrs_cards';
const LOCAL_LOGS_KEY = 'shizen_review_logs';
const STREAK_KEY = 'shizen_study_streak';
const LAST_STUDIED_KEY = 'shizen_last_studied_date';
const SETTINGS_KEY = 'shizen_app_settings';

// Load settings from localStorage with default fallback
export function loadSettings(): ShizenSettings {
  const data = localStorage.getItem(SETTINGS_KEY);
  if (!data) return DEFAULT_SETTINGS;
  try {
    const parsed = JSON.parse(data);
    return {
      ...DEFAULT_SETTINGS,
      ...parsed,
    };
  } catch {
    return DEFAULT_SETTINGS;
  }
}

// Save settings to localStorage
export function saveSettings(settings: ShizenSettings): void {
  localStorage.setItem(SETTINGS_KEY, JSON.stringify(settings));
}

// Create a configured FSRS scheduler instance based on saved settings
export function getFsrsInstance() {
  const settings = loadSettings();
  return fsrs({
    request_retention: settings.request_retention,
    maximum_interval: settings.maximum_interval,
    enable_fuzz: settings.enable_fuzz,
    enable_short_term: settings.enable_short_term,
  });
}

// Calculate the number of new cards studied today (UTC/Local day)
export function getNewCardsStudiedToday(logs: ReviewLog[]): number {
  const today = new Date().toDateString();
  const cardFirstReviewDate: Record<number, string> = {};
  
  // Sort logs chronological ascending to find absolute first study touch point
  const sortedLogs = [...logs].sort((a, b) => new Date(a.reviewedAt).getTime() - new Date(b.reviewedAt).getTime());
  
  sortedLogs.forEach(log => {
    if (!cardFirstReviewDate[log.no]) {
      cardFirstReviewDate[log.no] = new Date(log.reviewedAt).toDateString();
    }
  });
  
  let count = 0;
  Object.keys(cardFirstReviewDate).forEach(noStr => {
    if (cardFirstReviewDate[Number(noStr)] === today) {
      count++;
    }
  });
  
  return count;
}

// Retrieve all cards from localStorage and reconstruct Date objects
export function loadAllCards(): Record<number, Card> {
  const data = localStorage.getItem(LOCAL_CARDS_KEY);
  if (!data) return {};

  try {
    const parsed = JSON.parse(data) as Record<number, StoredCard>;
    const restored: Record<number, Card> = {};
    
    Object.keys(parsed).forEach((key) => {
      const numKey = Number(key);
      const item = parsed[numKey];
      restored[numKey] = {
        due: new Date(item.due),
        stability: item.stability,
        difficulty: item.difficulty,
        elapsed_days: item.elapsed_days,
        scheduled_days: item.scheduled_days,
        learning_steps: item.learning_steps ?? 0,
        reps: item.reps,
        lapses: item.lapses,
        state: item.state,
        last_review: item.last_review ? new Date(item.last_review) : undefined,
      };
    });
    
    return restored;
  } catch (err) {
    console.error("Failed to load cards from localStorage, starting fresh:", err);
    return {};
  }
}

// Save all cards to localStorage
export function saveAllCards(cards: Record<number, Card>): void {
  const serialized: Record<number, StoredCard> = {};
  
  Object.keys(cards).forEach((key) => {
    const numKey = Number(key);
    const item = cards[numKey];
    serialized[numKey] = {
      no: numKey,
      due: item.due.toISOString(),
      stability: item.stability,
      difficulty: item.difficulty,
      elapsed_days: item.elapsed_days,
      scheduled_days: item.scheduled_days,
      learning_steps: item.learning_steps || 0,
      reps: item.reps,
      lapses: item.lapses,
      state: item.state,
      last_review: item.last_review ? item.last_review.toISOString() : undefined,
    };
  });

  localStorage.setItem(LOCAL_CARDS_KEY, JSON.stringify(serialized));
}

// Get or initialize a card for a specific hiragana item
export function getOrInitCard(no: number, cards: Record<number, Card>): Card {
  if (cards[no]) {
    return cards[no];
  }
  return createEmptyCard(new Date());
}

// Retrieve review history logs
export function loadReviewLogs(): ReviewLog[] {
  const data = localStorage.getItem(LOCAL_LOGS_KEY);
  if (!data) return [];
  try {
    return JSON.parse(data) as ReviewLog[];
  } catch {
    return [];
  }
}

// Add a new review log and persist
export function addReviewLog(log: ReviewLog): void {
  const logs = loadReviewLogs();
  logs.push(log);
  localStorage.setItem(LOCAL_LOGS_KEY, JSON.stringify(logs));
  
  // Update study streak
  updateStreak();
}

// Streak handling
export function getStreak(): number {
  const streak = localStorage.getItem(STREAK_KEY);
  return streak ? Number(streak) : 0;
}

function updateStreak(): void {
  const todayStr = new Date().toDateString();
  const lastStudied = localStorage.getItem(LAST_STUDIED_KEY);
  
  if (lastStudied === todayStr) {
    // Already studied today, streak remains unchanged
    return;
  }
  
  const streak = getStreak();
  
  if (!lastStudied) {
    // First time studying
    localStorage.setItem(STREAK_KEY, "1");
  } else {
    const lastDate = new Date(lastStudied);
    const todayDate = new Date();
    // Calculate difference in days
    const diffTime = Math.abs(todayDate.getTime() - lastDate.getTime());
    const diffDays = Math.ceil(diffTime / (1000 * 60 * 60 * 24));
    
    if (diffDays <= 1) {
      // Studied yesterday, increment streak
      localStorage.setItem(STREAK_KEY, String(streak + 1));
    } else {
      // Streak broken, reset to 1
      localStorage.setItem(STREAK_KEY, "1");
    }
  }
  
  localStorage.setItem(LAST_STUDIED_KEY, todayStr);
}

// Reset all study progress (for user reset option)
export function resetAllStudyProgress(): void {
  localStorage.removeItem(LOCAL_CARDS_KEY);
  localStorage.removeItem(LOCAL_LOGS_KEY);
  localStorage.removeItem(STREAK_KEY);
  localStorage.removeItem(LAST_STUDIED_KEY);
}
