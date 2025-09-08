import { useState, useEffect } from 'react'
import { supabase, Entry } from '../lib/supabase'

export function useEntries(userId: string) {
  const [entries, setEntries] = useState<Entry[]>([])
  const [loading, setLoading] = useState(true)
  const [error, setError] = useState<string | null>(null)

  // Load all user entries
  const fetchEntries = async () => {
    try {
      setLoading(true)
      setError(null)
      
      const { data, error } = await supabase
        .from('entries')
        .select('*')
        .eq('user_id', userId)
        .order('created_at', { ascending: false })

      if (error) throw error
      setEntries(data || [])
    } catch (err) {
      setError(err instanceof Error ? err.message : 'Error loading entries')
    } finally {
      setLoading(false)
    }
  }

  // Create new entry
  const createEntry = async (content: string, mood: number, topics: string[] = []) => {
    try {
      setError(null)
      
      const { data, error } = await supabase
        .from('entries')
        .insert({
          user_id: userId,
          content,
          mood,
          topics,
        })
        .select()
        .single()

      if (error) throw error
      
      // Update local state
      setEntries(prev => [data, ...prev])
      return { data, error: null }
    } catch (err) {
      const errorMessage = err instanceof Error ? err.message : 'Error creating entry'
      setError(errorMessage)
      return { data: null, error: errorMessage }
    }
  }

  // Update entry
  const updateEntry = async (id: string, updates: Partial<Entry>) => {
    try {
      setError(null)
      
      const { data, error } = await supabase
        .from('entries')
        .update(updates)
        .eq('id', id)
        .select()
        .single()

      if (error) throw error
      
      // Update local state
      setEntries(prev => prev.map(entry => 
        entry.id === id ? { ...entry, ...data } : entry
      ))
      return { data, error: null }
    } catch (err) {
      const errorMessage = err instanceof Error ? err.message : 'Error updating entry'
      setError(errorMessage)
      return { data: null, error: errorMessage }
    }
  }

  // Delete entry
  const deleteEntry = async (id: string) => {
    try {
      setError(null)
      
      const { error } = await supabase
        .from('entries')
        .delete()
        .eq('id', id)

      if (error) throw error
      
      // Update local state
      setEntries(prev => prev.filter(entry => entry.id !== id))
      return { error: null }
    } catch (err) {
      const errorMessage = err instanceof Error ? err.message : 'Error deleting entry'
      setError(errorMessage)
      return { error: errorMessage }
    }
  }

  // Get entries for a specific period
  const getReflectionEntries = async (startDate?: string, endDate?: string) => {
    try {
      setError(null)
      
      let query = supabase
        .from('entries')
        .select('*')
        .eq('user_id', userId)
        .order('created_at', { ascending: false })

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

      const { data, error } = await query;

      if (error) throw error;
      return data || [];
    } catch (err) {
      const errorMessage = err instanceof Error ? err.message : 'Error loading entries';
      setError(errorMessage);
      return [];
    }
  }

  useEffect(() => {
    if (userId) {
      fetchEntries()
    }
  }, [userId])

  return {
    entries,
    loading,
    error,
    createEntry,
    updateEntry,
    deleteEntry,
    getReflectionEntries,
    refetch: fetchEntries,
  }
}