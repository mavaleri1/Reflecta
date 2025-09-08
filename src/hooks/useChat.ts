import { useState, useEffect } from 'react';
import { ChatMessage } from '../types';
import { apiService } from '../services/api';

export function useChat(userId: string) {
  const [messages, setMessages] = useState<ChatMessage[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const [sending, setSending] = useState(false);

  const fetchChatHistory = async () => {
    try {
      setLoading(true);
      setError(null);
      
      const response = await apiService.getChatHistory(userId);
      
      if (response.success && response.data) {
        setMessages(response.data);
      } else {
        setError(response.error || 'Failed to fetch chat history');
      }
    } catch (err) {
      setError(err instanceof Error ? err.message : 'An error occurred');
    } finally {
      setLoading(false);
    }
  };

  const sendMessage = async (message: string) => {
    try {
      setSending(true);
      setError(null);
      
      const response = await apiService.sendMessage(userId, message);
      
      if (response.success && response.data) {
        setMessages(prev => [...prev, response.data!]);
        return response.data;
      } else {
        throw new Error(response.error || 'Failed to send message');
      }
    } catch (err) {
      setError(err instanceof Error ? err.message : 'An error occurred');
      throw err;
    } finally {
      setSending(false);
    }
  };

  useEffect(() => {
    if (userId) {
      fetchChatHistory();
    }
  }, [userId]);

  return {
    messages,
    loading,
    error,
    sending,
    sendMessage,
    refetch: fetchChatHistory,
  };
}
