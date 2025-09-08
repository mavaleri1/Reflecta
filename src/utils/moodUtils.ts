export const MOOD_EMOJIS = {
  1: '😢', // Very bad
  2: '😔', // Bad  
  3: '😐', // Neutral
  4: '😊', // Good
  5: '😄', // Very good
} as const;

export const MOOD_LABELS = {
  1: 'Very bad',
  2: 'Bad',
  3: 'Neutral', 
  4: 'Good',
  5: 'Very good',
} as const;

export type MoodValue = keyof typeof MOOD_EMOJIS;

/**
 * Convert mood value to emoji
 */
export function getMoodEmoji(mood: number): string {
  return MOOD_EMOJIS[mood as MoodValue] || '😐';
}

/**
 * Convert mood value to text description
 */
export function getMoodLabel(mood: number): string {
  return MOOD_LABELS[mood as MoodValue] || 'Unknown';
}

/**
  * Calculate average mood from array of records
 */
export function calculateAverageMood(reflections: Array<{ mood: number }>): number {
  if (reflections.length === 0) return 0;
  
  const sum = reflections.reduce((total, reflection) => total + reflection.mood, 0);
  return Math.round((sum / reflections.length) * 10) / 10; // to 1 decimal place
}

/**
 * Get color for displaying mood
 */
export function getMoodColor(mood: number): string {
  switch (mood) {
    case 1: return 'text-red-400'; // Very bad - red
    case 2: return 'text-orange-400'; // Bad - orange
    case 3: return 'text-yellow-400'; // Neutral - yellow
    case 4: return 'text-green-400'; // Good - green
    case 5: return 'text-emerald-400'; // Very good - emerald
    default: return 'text-gray-400';
  }
}
