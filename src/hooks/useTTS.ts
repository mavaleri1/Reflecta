import { useState, useCallback } from 'react';
import { ElevenLabsService } from '../services/elevenlabs';

export function useTTS() {
  const [isPlaying, setIsPlaying] = useState(false);
  const [isLoading, setIsLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);

  const speak = useCallback(async (text: string) => {
    if (!text.trim()) {
      setError('No text provided for speech synthesis');
      return;
    }

    setIsLoading(true);
    setIsPlaying(true);
    setError(null);

    try {
      console.log('🎤 useTTS: Starting speech synthesis for:', text);
      await ElevenLabsService.speakText(text);
      console.log('✅ useTTS: Speech synthesis completed');
    } catch (err) {
      const errorMessage = err instanceof Error ? err.message : 'Failed to synthesize speech';
      console.error('❌ useTTS: Speech synthesis failed:', errorMessage);
      setError(errorMessage);
    } finally {
      setIsLoading(false);
      setIsPlaying(false);
    }
  }, []);

  const stop = useCallback(() => {
    console.log('⏹️ useTTS: Stopping speech synthesis');
    setIsPlaying(false);
    setIsLoading(false);
    
    // Stop browser speech synthesis if it's running
    if ('speechSynthesis' in window) {
      speechSynthesis.cancel();
    }
  }, []);

  return {
    speak,
    stop,
    isPlaying,
    isLoading,
    error,
  };
}

