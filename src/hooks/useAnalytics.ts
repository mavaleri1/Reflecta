import { useState, useEffect } from 'react';
import { AnalyticsData } from '../types';
import { apiService } from '../services/api';

export function useAnalytics(userId: string, period: 'week' | 'month' | 'year' = 'month') {
  const [analytics, setAnalytics] = useState<AnalyticsData | null>(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);

  const fetchAnalytics = async () => {
    try {
      setLoading(true);
      setError(null);
      
      const response = await apiService.getAnalytics(userId, period);
      
      if (response.success && response.data) {
        setAnalytics(response.data);
      } else {
        setError(response.error || 'Failed to fetch analytics');
      }
    } catch (err) {
      setError(err instanceof Error ? err.message : 'An error occurred');
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    if (userId) {
      fetchAnalytics();
    }
  }, [userId, period]);

  return {
    analytics,
    loading,
    error,
    refetch: fetchAnalytics,
  };
}
