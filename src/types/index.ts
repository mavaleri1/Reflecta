// User and Authentication Types
export interface User {
  id: string;
  email: string;
  name: string;
  createdAt: Date;
  updatedAt: Date;
}

// Reflection and Entry Types
export interface ReflectionEntry {
  id: string;
  userId: string;
  date: string; // ISO date string
  question: string;
  response: string;
  mood: string;
  topics: string[];
  createdAt: Date;
  updatedAt: Date;
}

// Analytics Types
export interface MoodData {
  date: string;
  mood: string;
  value: number;
}

export interface KeywordData {
  word: string;
  count: number;
  color: string;
}

export interface AnalyticsData {
  moodData: MoodData[];
  topKeywords: KeywordData[];
  insights: string[];
  streak: number;
  totalEntries: number;
}

// Chat and Dialogue Types
export interface ChatMessage {
  id: string;
  userId: string;
  text: string;
  isUser: boolean;
  timestamp: Date;
  reflectionId?: string; // Link to reflection entry if applicable
}

// Daily Questions Types
export interface DailyQuestion {
  id: string;
  text: string;
  category: string;
  isActive: boolean;
  createdAt: Date;
}

// API Response Types
export interface ApiResponse<T> {
  success: boolean;
  data?: T;
  error?: string;
  message?: string;
}

// API Error Types
export interface ApiError {
  code: string;
  message: string;
  details?: any;
}
