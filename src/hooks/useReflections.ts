import { useState, useEffect } from 'react';
import { ReflectionEntry } from '../types';
import { apiService } from '../services/api';

export function useReflections(userId: string) {
  const [reflections, setReflections] = useState<ReflectionEntry[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);

  const fetchReflections = async (startDate?: string, endDate?: string) => {
    try {
      setLoading(true);
      setError(null);
      
      const response = await apiService.getReflectionEntries(userId, startDate, endDate);
      
      if (response.success && response.data) {
        setReflections(response.data);
      } else {
        setError(response.error || 'Failed to fetch reflections');
      }
    } catch (err) {
      setError(err instanceof Error ? err.message : 'An error occurred');
    } finally {
      setLoading(false);
    }
  };

  const createReflection = async (entry: Omit<ReflectionEntry, 'id' | 'createdAt' | 'updatedAt'>) => {
    try {
      const response = await apiService.createReflectionEntry(entry);
      
      if (response.success && response.data) {
        setReflections(prev => [...prev, response.data!]);
        return response.data;
      } else {
        throw new Error(response.error || 'Failed to create reflection');
      }
    } catch (err) {
      setError(err instanceof Error ? err.message : 'An error occurred');
      throw err;
    }
  };

  const updateReflection = async (id: string, entry: Partial<ReflectionEntry>) => {
    try {
      const response = await apiService.updateReflectionEntry(id, entry);
      
      if (response.success && response.data) {
        setReflections(prev => 
          prev.map(reflection => 
            reflection.id === id ? response.data! : reflection
          )
        );
        return response.data;
      } else {
        throw new Error(response.error || 'Failed to update reflection');
      }
    } catch (err) {
      setError(err instanceof Error ? err.message : 'An error occurred');
      throw err;
    }
  };

  const deleteReflection = async (id: string) => {
    try {
      const response = await apiService.deleteReflectionEntry(id);
      
      if (response.success) {
        setReflections(prev => prev.filter(reflection => reflection.id !== id));
      } else {
        throw new Error(response.error || 'Failed to delete reflection');
      }
    } catch (err) {
      setError(err instanceof Error ? err.message : 'An error occurred');
      throw err;
    }
  };

  useEffect(() => {
    if (userId) {
      fetchReflections();
    }
  }, [userId]);

  return {
    reflections,
    loading,
    error,
    fetchReflections,
    createReflection,
    updateReflection,
    deleteReflection,
  };
}
