import { useState, useEffect, useCallback } from 'react';
import { useSupabaseChat } from './useSupabaseChat';

export interface ChatMessage {
  id: number;
  text: string;
  isUser: boolean;
  timestamp: Date;
}

const CHAT_HISTORY_KEY = 'reflecta_chat_history';

export function useChatHistory(userId?: string) {
  const [messages, setMessages] = useState<ChatMessage[]>([]);
  const [isLoaded, setIsLoaded] = useState(false);
  const [isSyncing, setIsSyncing] = useState(false);
  const [hasLoaded, setHasLoaded] = useState(false);
  
  const { saveMessage, getAllMessages, clearAllMessages } = useSupabaseChat(userId || '');

  // Load chat history from localStorage and sync with Supabase
  useEffect(() => {
    const loadChatHistory = async () => {
      if (hasLoaded || !userId) return;
      
      console.log('🔄 useChatHistory: Loading chat history for user:', userId);
      
      try {
        // First load from localStorage for quick display
        const savedHistory = localStorage.getItem(CHAT_HISTORY_KEY);
        if (savedHistory) {
          const parsedMessages = JSON.parse(savedHistory).map((msg: any) => ({
            ...msg,
            timestamp: new Date(msg.timestamp)
          }));
          setMessages(parsedMessages);
        }

        // Sync with Supabase
        setIsSyncing(true);
        const supabaseMessages = await getAllMessages();
        
        console.log('📥 useChatHistory: Loaded messages from Supabase:', supabaseMessages.length);
        
        if (supabaseMessages.length > 0) {
          // Convert messages from Supabase to local format
          const convertedMessages = supabaseMessages.map(msg => ({
            id: Date.now() + Math.random(), // Temporary ID
            text: msg.message_text,
            isUser: msg.is_user_message,
            timestamp: new Date(msg.created_at)
          }));
          
          setMessages(convertedMessages);
          // Save to localStorage for offline access
          localStorage.setItem(CHAT_HISTORY_KEY, JSON.stringify(convertedMessages));
        }
      } catch (error) {
        console.error('Error loading chat history:', error);
      } finally {
        setIsLoaded(true);
        setIsSyncing(false);
        setHasLoaded(true);
      }
    };

    loadChatHistory();
  }, [userId]); // Remove hasLoaded from dependencies

  // Save chat history to localStorage when changed
  useEffect(() => {
    if (isLoaded) {
      try {
        localStorage.setItem(CHAT_HISTORY_KEY, JSON.stringify(messages));
      } catch (error) {
        console.error('Error saving chat history:', error);
      }
    }
  }, [messages, isLoaded]);

  const addMessage = useCallback(async (message: Omit<ChatMessage, 'id' | 'timestamp'>) => {
    const newMessage: ChatMessage = {
      ...message,
      id: Date.now() + Math.random(), // Unique ID
      timestamp: new Date()
    };
    
    // Add to local state
    setMessages(prev => [...prev, newMessage]);
    
    // Save to Supabase if userId exists
    if (userId) {
      try {
        await saveMessage(message.text, message.isUser);
      } catch (error) {
        console.error('Error saving message to Supabase:', error);
        // Continue working even if failed to save to Supabase
      }
    }
    
    return newMessage;
  }, [userId, saveMessage]);

  const addUserMessage = useCallback(async (text: string) => {
    return await addMessage({ text, isUser: true });
  }, [addMessage]);

  const addAIMessage = useCallback(async (text: string) => {
    return await addMessage({ text, isUser: false });
  }, [addMessage]);

  const clearHistory = useCallback(async () => {
    setMessages([]);
    localStorage.removeItem(CHAT_HISTORY_KEY);
    
    // Clear in Supabase if userId exists
    if (userId) {
      try {
        await clearAllMessages();
      } catch (error) {
        console.error('Error clearing messages in Supabase:', error);
      }
    }
  }, [userId, clearAllMessages]);

  const getLastMessages = useCallback((count: number = 10) => {
    return messages.slice(-count);
  }, [messages]);

  // Function for forced data refresh
  const refreshData = useCallback(() => {
    setHasLoaded(false);
    setMessages([]);
    console.log('🔄 useChatHistory: Forcing data refresh');
  }, []);

  return {
    messages,
    isLoaded,
    isSyncing,
    addMessage,
    addUserMessage,
    addAIMessage,
    clearHistory,
    getLastMessages,
    setMessages,
    refreshData
  };
}
