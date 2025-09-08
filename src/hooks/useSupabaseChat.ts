import { useState, useEffect, useCallback } from 'react';
import { supabase, ChatMessage } from '../lib/supabase';

// Utility function for proper date parsing with timezone support
const parseDateToLocalString = (dateString: string): string => {
  try {
    // Create date from string
    const date = new Date(dateString);
    
    // Get local date in YYYY-MM-DD format
    const year = date.getFullYear();
    const month = String(date.getMonth() + 1).padStart(2, '0');
    const day = String(date.getDate()).padStart(2, '0');
    
    return `${year}-${month}-${day}`;
  } catch (error) {
    console.error('Date parsing error:', dateString, error);
    return dateString.split('T')[0]; // Fallback to old method
  }
};

export interface ChatMessageWithDate extends ChatMessage {
  date: string; // YYYY-MM-DD format
}

export function useSupabaseChat(userId: string) {
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);
  
  // Cache to prevent duplicate requests
  const requestCache = new Map<string, Promise<any>>();

  // Save message to Supabase
  const saveMessage = useCallback(async (messageText: string, isUserMessage: boolean) => {
    try {
      setLoading(true);
      setError(null);

      const { data, error: insertError } = await supabase
        .from('chat_messages')
        .insert({
          user_id: userId,
          message_text: messageText,
          is_user_message: isUserMessage
        })
        .select()
        .single();

      if (insertError) {
        throw insertError;
      }

      return data;
    } catch (err) {
      const errorMessage = err instanceof Error ? err.message : 'Error saving message';
      setError(errorMessage);
      console.error('Error saving message to Supabase:', err);
      throw err;
    } finally {
      setLoading(false);
    }
  }, [userId]);

  // Get messages for a specific day
  const getMessagesByDate = useCallback(async (date: string): Promise<ChatMessage[]> => {
    try {
      setLoading(true);
      setError(null);

      const startOfDay = new Date(date);
      startOfDay.setHours(0, 0, 0, 0);
      
      const endOfDay = new Date(date);
      endOfDay.setHours(23, 59, 59, 999);

      const { data, error: fetchError } = await supabase
        .from('chat_messages')
        .select('*')
        .eq('user_id', userId)
        .gte('created_at', startOfDay.toISOString())
        .lte('created_at', endOfDay.toISOString())
        .order('created_at', { ascending: true });

      if (fetchError) {
        throw fetchError;
      }

      return data || [];
    } catch (err) {
      const errorMessage = err instanceof Error ? err.message : 'Error loading messages';
      setError(errorMessage);
      console.error('Error loading messages from Supabase:', err);
      return [];
    } finally {
      setLoading(false);
    }
  }, [userId]);

  // Get all user messages
  const getAllMessages = useCallback(async (limit: number = 100): Promise<ChatMessage[]> => {
    const cacheKey = `getAllMessages_${userId}_${limit}`;
    
    // Check cache
    if (requestCache.has(cacheKey)) {
      console.log('🚀 useSupabaseChat: Using cached request for getAllMessages');
      return requestCache.get(cacheKey);
    }
    
    const requestPromise = (async () => {
      try {
        setLoading(true);
        setError(null);

        console.log('📡 useSupabaseChat: Fetching all messages for user:', userId);

        const { data, error: fetchError } = await supabase
          .from('chat_messages')
          .select('*')
          .eq('user_id', userId)
          .order('created_at', { ascending: false })
          .limit(limit);

        if (fetchError) {
          throw fetchError;
        }

        const result = (data || []).reverse(); // Return in chronological order
        console.log('📥 useSupabaseChat: Loaded messages:', result.length);
        
        return result;
      } catch (err) {
        const errorMessage = err instanceof Error ? err.message : 'Error loading messages';
        setError(errorMessage);
        console.error('Error loading all messages from Supabase:', err);
        return [];
      } finally {
        setLoading(false);
        // Remove from cache after completion
        requestCache.delete(cacheKey);
      }
    })();
    
    // Save to cache
    requestCache.set(cacheKey, requestPromise);
    
    return requestPromise;
  }, [userId]);

  // Get messages grouped by days
  const getMessagesGroupedByDate = useCallback(async (startDate?: string, endDate?: string): Promise<Record<string, ChatMessage[]>> => {
    const cacheKey = `getMessagesGroupedByDate_${userId}_${startDate}_${endDate}`;
    
    // Check cache
    if (requestCache.has(cacheKey)) {
      console.log('🚀 useSupabaseChat: Using cached request for getMessagesGroupedByDate');
      return requestCache.get(cacheKey);
    }
    
    const requestPromise = (async () => {
      try {
        setLoading(true);
        setError(null);

        console.log('📡 useSupabaseChat: Fetching messages grouped by date for user:', userId, 'from', startDate, 'to', endDate);

        let query = supabase
          .from('chat_messages')
          .select('*')
          .eq('user_id', userId)
          .order('created_at', { ascending: true });

        if (startDate) {
          const start = new Date(startDate);
          start.setHours(0, 0, 0, 0);
          query = query.gte('created_at', start.toISOString());
        }

        if (endDate) {
          const end = new Date(endDate);
          end.setHours(23, 59, 59, 999);
          query = query.lte('created_at', end.toISOString());
        }

        const { data, error: fetchError } = await query;

        if (fetchError) {
          throw fetchError;
        }

        // Group messages by days
        const groupedMessages: Record<string, ChatMessage[]> = {};
        
        (data || []).forEach(message => {
          const date = parseDateToLocalString(message.created_at);
          console.log('💬 Chat message date parsing:', {
            original: message.created_at,
            parsed: date,
            messageId: message.id
          });
          
          if (!groupedMessages[date]) {
            groupedMessages[date] = [];
          }
          groupedMessages[date].push(message);
        });

        console.log('📥 useSupabaseChat: Grouped messages by date:', Object.keys(groupedMessages).length, 'days');
        return groupedMessages;
      } catch (err) {
        const errorMessage = err instanceof Error ? err.message : 'Error loading messages';
        setError(errorMessage);
        console.error('Error loading messages by days from Supabase:', err);
        return {};
      } finally {
        setLoading(false);
        // Remove from cache after completion
        requestCache.delete(cacheKey);
      }
    })();
    
    // Save to cache
    requestCache.set(cacheKey, requestPromise);
    
    return requestPromise;
  }, [userId]);

  // Delete message
  const deleteMessage = useCallback(async (messageId: string) => {
    try {
      setLoading(true);
      setError(null);

      const { error: deleteError } = await supabase
        .from('chat_messages')
        .delete()
        .eq('id', messageId)
        .eq('user_id', userId);

      if (deleteError) {
        throw deleteError;
      }

      return true;
    } catch (err) {
      const errorMessage = err instanceof Error ? err.message : 'Error deleting message';
      setError(errorMessage);
      console.error('Error deleting message from Supabase:', err);
      throw err;
    } finally {
      setLoading(false);
    }
  }, [userId]);

  // Clear all user messages
  const clearAllMessages = useCallback(async () => {
    try {
      setLoading(true);
      setError(null);

      const { error: deleteError } = await supabase
        .from('chat_messages')
        .delete()
        .eq('user_id', userId);

      if (deleteError) {
        throw deleteError;
      }

      return true;
    } catch (err) {
      const errorMessage = err instanceof Error ? err.message : 'Error clearing messages';
      setError(errorMessage);
      console.error('Error clearing all messages from Supabase:', err);
      throw err;
    } finally {
      setLoading(false);
    }
  }, [userId]);

  // Function to clear cache
  const clearCache = () => {
    requestCache.clear();
    console.log('🧹 useSupabaseChat: Cache cleared');
  };

  return {
    loading,
    error,
    saveMessage,
    getMessagesByDate,
    getAllMessages,
    getMessagesGroupedByDate,
    deleteMessage,
    clearAllMessages,
    clearCache
  };
}
