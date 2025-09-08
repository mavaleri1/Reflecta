import { useState } from 'react';
import { DeepSeekService } from '../services/deepseek';

export interface AIAnalysis {
  mood: number;
  confidence: number;
  emotions: string[];
  topics: string[];
}

export interface AIResponse {
  response: string;
  moodAnalysis: AIAnalysis;
}

export function useAI() {
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);

  const analyzeText = async (text: string): Promise<AIResponse | null> => {
    console.log('🎯 useAI: Starting text analysis for:', text);
    
    if (!text.trim()) {
      console.log('❌ useAI: Empty text provided');
      setError('Text is required for analysis');
      return null;
    }

    setLoading(true);
    setError(null);
    console.log('⏳ useAI: Loading started');

    try {
      const result = await DeepSeekService.analyzeMoodAndRespond(text);
      console.log('✅ useAI: Analysis successful:', result);
      return result;
    } catch (err) {
      const errorMessage = err instanceof Error ? err.message : 'Failed to analyze text';
      console.error('❌ useAI: Analysis failed:', errorMessage);
      setError(errorMessage);
      return null;
    } finally {
      setLoading(false);
      console.log('🏁 useAI: Loading finished');
    }
  };

  return {
    loading,
    error,
    analyzeText,
  };
}
