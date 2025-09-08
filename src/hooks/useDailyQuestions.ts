import { useState, useEffect } from 'react';
import { DailyQuestion } from '../types';
import { apiService } from '../services/api';

export function useDailyQuestions() {
  const [questions, setQuestions] = useState<DailyQuestion[]>([]);
  const [todaysQuestion, setTodaysQuestion] = useState<DailyQuestion | null>(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);

  const fetchQuestions = async () => {
    try {
      setLoading(true);
      setError(null);
      
      const response = await apiService.getDailyQuestions();
      
      if (response.success && response.data) {
        setQuestions(response.data);
      } else {
        setError(response.error || 'Failed to fetch questions');
      }
    } catch (err) {
      setError(err instanceof Error ? err.message : 'An error occurred');
    } finally {
      setLoading(false);
    }
  };

  const fetchTodaysQuestion = async () => {
    try {
      const response = await apiService.getTodaysQuestion();
      
      if (response.success && response.data) {
        setTodaysQuestion(response.data);
      } else {
        setError(response.error || 'Failed to fetch today\'s question');
      }
    } catch (err) {
      setError(err instanceof Error ? err.message : 'An error occurred');
    }
  };

  useEffect(() => {
    fetchQuestions();
    fetchTodaysQuestion();
  }, []);

  return {
    questions,
    todaysQuestion,
    loading,
    error,
    refetch: fetchQuestions,
    refetchTodays: fetchTodaysQuestion,
  };
}
