import React, { useState, useEffect } from "react";
import { Button } from "./ui/button";
import { Card } from "./ui/card";
import { ArrowLeft, TrendingUp, Calendar, Tag, MessageCircle, Bot, User, Loader2 } from "lucide-react";
import { useAuth } from '../hooks/useAuth';
import { useSupabaseChat } from '../hooks/useSupabaseChat';
import { useEntries } from '../hooks/useEntries';
import { getMoodEmoji, calculateAverageMood } from '../utils/moodUtils';
import MoodLineChart from './ui/mood-line-chart';

interface AnalyticsScreenProps {
  onBack: () => void;
}

interface AnalyticsData {
  moodData: Array<{ date: string; mood: string; value: number }>;
  topKeywords: Array<{ word: string; count: number; color: string }>;
  insights: string[];
  chatStats: {
    totalMessages: number;
    userMessages: number;
    aiMessages: number;
    avgMessagesPerDay: number;
    mostActiveDay: string;
  };
  weeklyStats: {
    daysActive: number;
    reflections: number;
    avgMood: number;
    chatMessages: number;
  };
}

export function AnalyticsScreen({ onBack }: AnalyticsScreenProps) {
  const [analyticsData, setAnalyticsData] = useState<AnalyticsData>({
    moodData: [],
    topKeywords: [],
    insights: [],
    chatStats: {
      totalMessages: 0,
      userMessages: 0,
      aiMessages: 0,
      avgMessagesPerDay: 0,
      mostActiveDay: ''
    },
    weeklyStats: {
      daysActive: 0,
      reflections: 0,
      avgMood: 0,
      chatMessages: 0
    }
  });
  const [loading, setLoading] = useState(true);
  const [hasLoaded, setHasLoaded] = useState(false);

  const { user } = useAuth();
  const { getMessagesGroupedByDate } = useSupabaseChat(user?.id || '');
  const { getReflectionEntries } = useEntries(user?.id || '');


  const maxValue = analyticsData.moodData.length > 0 ? Math.max(...analyticsData.moodData.map(d => d.value)) : 0;

  // Load analytics data
  useEffect(() => {
    const loadAnalyticsData = async () => {
      if (!user?.id) return;
      
      setLoading(true);
      try {
        const endDate = new Date();
        endDate.setHours(23, 59, 59, 999); // Include the entire current day
        const startDate = new Date();
        startDate.setDate(startDate.getDate() - 30);
        startDate.setHours(0, 0, 0, 0); // Start of the day

        // Load  chat messages
        const chatMessages = await getMessagesGroupedByDate(
          startDate.toISOString().split('T')[0],
          endDate.toISOString().split('T')[0]
        );

        // Load reflection entries
        const reflections = await getReflectionEntries(
          startDate.toISOString().split('T')[0],
          endDate.toISOString().split('T')[0]
        );

        // Analyze chat data
        const allChatMessages = Object.values(chatMessages).flat();
        const userMessages = allChatMessages.filter(msg => msg.is_user_message);
        const aiMessages = allChatMessages.filter(msg => !msg.is_user_message);
        
        // Find the most active day
        const dayActivity = Object.entries(chatMessages).map(([date, messages]) => ({
          date,
          count: messages.length
        }));
        const mostActiveDay = dayActivity.reduce((max, day) => 
          day.count > max.count ? day : max, 
          { date: '', count: 0 }
        );

        // Analyze keywords from user messages
        const userTexts = userMessages.map(msg => msg.message_text.toLowerCase());
        const wordCount: Record<string, number> = {};
        
        userTexts.forEach(text => {
          const words = text.split(/\s+/).filter(word => word.length > 3);
          words.forEach(word => {
            wordCount[word] = (wordCount[word] || 0) + 1;
          });
        });

        const topKeywords = Object.entries(wordCount)
          .sort(([,a], [,b]) => b - a)
          .slice(0, 10)
          .map(([word, count], index) => ({
            word,
            count,
            color: `bg-gradient-to-r from-blue-500/20 to-purple-500/20 text-blue-300`
          }));

        // Generate insights
        const insights: string[] = [];
        if (userMessages.length > 0) {
          insights.push(`You sent ${userMessages.length} messages for the last 30 days`);
        }
        if (mostActiveDay.count > 0) {
          insights.push(`The most active day: ${new Date(mostActiveDay.date).toLocaleDateString('ru-RU')} (${mostActiveDay.count} messages)`);
        }
        if (topKeywords.length > 0) {
          insights.push(`You most often mention: "${topKeywords[0].word}"`);
        }
        if (reflections.length > 0) {
          insights.push(`Created ${reflections.length} reflection entries`);
        }

        // Mood data from reflections - sort by date from old to new
        const moodData = reflections
          .sort((a, b) => new Date(a.created_at).getTime() - new Date(b.created_at).getTime())
          .map((reflection) => ({
            date: new Date(reflection.created_at).toLocaleDateString('en-US', { day: 'numeric', month: 'short' }),
            mood: getMoodEmoji(reflection.mood),
            value: reflection.mood
          }));

        console.log('📊 Analytics: Loaded reflections:', reflections.length);
        console.log('📊 Analytics: Mood data (sorted chronologically):', moodData);
        console.log('📊 Analytics: Date range:', startDate.toISOString().split('T')[0], 'to', endDate.toISOString().split('T')[0]);

        // Weekly statistics
        const weekStart = new Date();
        weekStart.setDate(weekStart.getDate() - 7);
        const weekReflections = reflections.filter(r => new Date(r.created_at) >= weekStart);
        const weekChatMessages = allChatMessages.filter(msg => new Date(msg.created_at) >= weekStart);
        const weekDays = new Set(weekReflections.map(r => new Date(r.created_at).toDateString()));

        // Calculate average mood
        const avgMood = calculateAverageMood(reflections);

        setAnalyticsData({
          moodData,
          topKeywords,
          insights,
          chatStats: {
            totalMessages: allChatMessages.length,
            userMessages: userMessages.length,
            aiMessages: aiMessages.length,
            avgMessagesPerDay: Math.round(allChatMessages.length / 30),
            mostActiveDay: mostActiveDay.date
          },
          weeklyStats: {
            daysActive: weekDays.size,
            reflections: weekReflections.length,
            avgMood: avgMood,
            chatMessages: weekChatMessages.length
          }
        });
        setHasLoaded(true);
      } catch (error) {
        console.error('Error loading analytics:', error);
      } finally {
        setLoading(false);
      }
    };

    loadAnalyticsData();
  }, [user?.id, hasLoaded]); // Add hasLoaded in dependencies

  // Auto-refresh data every 30 seconds
  useEffect(() => {
    if (!user?.id) return;
    
    const interval = setInterval(() => {
      setHasLoaded(false);
    }, 30000); // 30 seconds

    return () => clearInterval(interval);
  }, [user?.id]);

  // Function to refresh data
  const refreshData = () => {
    setHasLoaded(false);
  };

  return (
    <div className="reflecta-gradient min-h-screen">
      {/* Header */}
      <div className="px-4 py-6 border-b border-white/10">
        <div className="flex items-center justify-between">
          <div className="flex items-center space-x-3">
            <Button
              variant="ghost"
              size="icon"
              onClick={onBack}
              className="text-white hover:bg-white/10"
            >
              <ArrowLeft className="w-5 h-5" />
            </Button>
            <h2 className="text-white text-lg">Analytics</h2>
          </div>
          <Button
            variant="ghost"
            size="sm"
            onClick={refreshData}
            className="text-white hover:bg-white/10"
            disabled={loading}
          >
            {loading ? <Loader2 className="w-4 h-4 animate-spin" /> : "Refresh"}
          </Button>
        </div>
      </div>

      <div className="px-4 py-4 space-y-6">
        {loading ? (
          <div className="flex items-center justify-center py-12">
            <div className="flex items-center space-x-3">
              <Loader2 className="w-6 h-6 animate-spin text-white/60" />
              <span className="text-white/60">Loading analytics...</span>
            </div>
          </div>
        ) : (
          <>
            {/* Chat Statistics */}
            <Card className="reflecta-surface border-none reflecta-shadow">
              <div className="p-6">
                <div className="flex items-center space-x-2 mb-4">
                  <MessageCircle className="w-5 h-5 text-white/80" />
                  <h3 className="text-white">Chat statistics</h3>
                </div>
                
                <div className="grid grid-cols-2 gap-4 mb-4">
                  <div className="text-center">
                    <div className="text-2xl mb-1 text-blue-300">{analyticsData.chatStats.totalMessages}</div>
                    <div className="text-white/70 text-xs">Total messages</div>
                  </div>
                  <div className="text-center">
                    <div className="text-2xl mb-1 text-green-300">{analyticsData.chatStats.userMessages}</div>
                    <div className="text-white/70 text-xs">Your messages</div>
                  </div>
                  <div className="text-center">
                    <div className="text-2xl mb-1 text-purple-300">{analyticsData.chatStats.aiMessages}</div>
                    <div className="text-white/70 text-xs">AI responses</div>
                  </div>
                  <div className="text-center">
                    <div className="text-2xl mb-1 text-orange-300">{analyticsData.chatStats.avgMessagesPerDay}</div>
                    <div className="text-white/70 text-xs">Average messages per day</div>
                  </div>
                </div>
                
                {analyticsData.chatStats.mostActiveDay && (
                  <p className="text-white/70 text-sm text-center">
                    The most active day: {new Date(analyticsData.chatStats.mostActiveDay).toLocaleDateString('en-US')}
                  </p>
                )}
              </div>
            </Card>

        {/* Mood Trend */}
            {analyticsData.moodData.length > 0 && (
              <MoodLineChart 
                data={analyticsData.moodData.map(day => ({
                  date: day.date,
                  mood: day.value,
                  emoji: day.mood
                }))}
                title="Trend of Mood"
                description={`Average mood: ${analyticsData.weeklyStats.avgMood}/5`}
                showTrend={true}
              />
            )}

        {/* Key Insights */}
        <Card className="reflecta-surface border-none reflecta-shadow">
          <div className="p-6">
            <div className="flex items-center space-x-2 mb-4">
              <Calendar className="w-5 h-5 text-white/80" />
                  <h3 className="text-white">Key insights</h3>
            </div>
            
            <div className="space-y-3">
                  {analyticsData.insights.length > 0 ? (
                    analyticsData.insights.map((insight, index) => (
                <div key={index} className="flex items-start space-x-3">
                  <div className="w-2 h-2 bg-white/60 rounded-full mt-2 flex-shrink-0" />
                  <p className="text-white/90 text-sm leading-relaxed">{insight}</p>
                </div>
                    ))
                  ) : (
                    <p className="text-white/60 text-sm">No enough data for analysis</p>
                  )}
            </div>
          </div>
        </Card>

        {/* Recurring Keywords */}
            {analyticsData.topKeywords.length > 0 && (
        <Card className="reflecta-surface border-none reflecta-shadow">
          <div className="p-6">
            <div className="flex items-center space-x-2 mb-4">
              <Tag className="w-5 h-5 text-white/80" />
                    <h3 className="text-white">Popular topics</h3>
            </div>
            
            <div className="flex flex-wrap gap-3">
                    {analyticsData.topKeywords.map((keyword, index) => (
                <div
                  key={index}
                  className={`px-3 py-2 rounded-full ${keyword.color} flex items-center space-x-2`}
                >
                  <span className="text-sm font-medium">{keyword.word}</span>
                  <span className="text-xs bg-white/20 px-2 py-0.5 rounded-full">
                    {keyword.count}
                  </span>
                </div>
              ))}
            </div>
            
            <p className="text-white/60 text-xs mt-4">
                    Based on your messages for the last 30 days
            </p>
          </div>
        </Card>
            )}

        {/* Weekly Summary */}
        <Card className="reflecta-surface border-none reflecta-shadow">
          <div className="p-6">
                <h3 className="text-white mb-4">Summary for the week</h3>
                
                <div className="grid grid-cols-2 gap-4 text-center">
                  <div>
                    <div className="text-2xl mb-1 text-blue-300">{analyticsData.weeklyStats.daysActive}</div>
                    <div className="text-white/70 text-xs">Active days</div>
                  </div>
              <div>
                    <div className="text-2xl mb-1 text-green-300">{analyticsData.weeklyStats.reflections}</div>
                    <div className="text-white/70 text-xs">Reflections</div>
              </div>
              <div>
                    <div className="text-2xl mb-1 text-purple-300">{analyticsData.weeklyStats.chatMessages}</div>
                    <div className="text-white/70 text-xs">Chat messages</div>
              </div>
              <div>
                    <div className="text-2xl mb-1 text-orange-300">{analyticsData.weeklyStats.avgMood}</div>
                    <div className="text-white/70 text-xs">Average mood</div>
              </div>
            </div>
          </div>
        </Card>
          </>
        )}
      </div>
    </div>
  );
}