import React, { useState, useEffect } from "react";
import { Button } from "./ui/button";
import { Card } from "./ui/card";
import { Calendar } from "./ui/calendar";
import { ArrowLeft, Calendar as CalendarIcon, List, MessageCircle, Bot, User, Loader2, RefreshCw } from "lucide-react";
import { useAuth } from '../hooks/useAuth';
import { useSupabaseChat } from '../hooks/useSupabaseChat';
import { useEntries } from '../hooks/useEntries';
import { getMoodEmoji, getMoodColor } from '../utils/moodUtils';

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

interface HistoryScreenProps {
  onBack: () => void;
}

interface DayEntry {
  date: string;
  summary: string;
  mood: string;
  moodValue: number;
  topics: string[];
}

interface DayData {
  date: string;
  reflections: DayEntry[];
  chatMessages: any[];
  hasData: boolean;
}

export function HistoryScreen({ onBack }: HistoryScreenProps) {
  const [selectedDate, setSelectedDate] = useState<Date>(new Date());
  const [viewMode, setViewMode] = useState<'calendar' | 'list'>('calendar');
  const [dayData, setDayData] = useState<Record<string, DayData>>({});
  const [loading, setLoading] = useState(false);
  const [activeTab, setActiveTab] = useState<'reflections' | 'chat'>('reflections');
  const [hasLoaded, setHasLoaded] = useState(false);

  // Function for forced data refresh
  const refreshData = () => {
    setHasLoaded(false);
    setDayData({});
  };

  const { user } = useAuth();
  const { getMessagesGroupedByDate } = useSupabaseChat(user?.id || '');
  const { getReflectionEntries } = useEntries(user?.id || '');


  // Load data for the last 30 days
  useEffect(() => {
    const loadHistoryData = async () => {
      if (!user?.id || hasLoaded) return;
      
      setLoading(true);
      try {
        const endDate = new Date();
        const startDate = new Date();
        startDate.setDate(startDate.getDate() - 30);

        // Load chat messages
        const chatMessages = await getMessagesGroupedByDate(
          startDate.toISOString().split('T')[0],
          endDate.toISOString().split('T')[0]
        );

        // Load reflection entries
        const reflections = await getReflectionEntries(
          startDate.toISOString().split('T')[0],
          endDate.toISOString().split('T')[0]
        );

        // Combine data by days
        const combinedData: Record<string, DayData> = {};
        
        // Add days with chat messages
        Object.entries(chatMessages).forEach(([date, messages]) => {
          console.log('💬 Chat messages for date:', {
            date,
            messageCount: messages.length,
            firstMessage: messages[0]?.created_at
          });
          
          combinedData[date] = {
            date,
            reflections: [],
            chatMessages: messages,
            hasData: true
          };
        });

        // Add days with reflections
        reflections.forEach(reflection => {
          const date = parseDateToLocalString(reflection.created_at);
          console.log('🔍 Reflection date parsing:', {
            original: reflection.created_at,
            parsed: date,
            reflectionId: reflection.id
          });
          
          if (!combinedData[date]) {
            combinedData[date] = {
              date,
              reflections: [],
              chatMessages: [],
              hasData: true
            };
          }
          combinedData[date].reflections.push({
            date,
            summary: reflection.content,
            mood: getMoodEmoji(reflection.mood),
            moodValue: reflection.mood,
            topics: reflection.topics || []
          });
        });

        console.log('📊 Final combined data:', {
          totalDays: Object.keys(combinedData).length,
          datesWithData: Object.keys(combinedData).sort(),
          combinedData
        });
        
        setDayData(combinedData);
        setHasLoaded(true);
      } catch (error) {
        console.error('Error loading history:', error);
      } finally {
        setLoading(false);
      }
    };

    loadHistoryData();
  }, [user?.id, hasLoaded]); // Add hasLoaded to dependencies

  const getDataForDate = (date: Date) => {
    const dateStr = parseDateToLocalString(date.toISOString());
    return dayData[dateStr] || { date: dateStr, reflections: [], chatMessages: [], hasData: false };
  };

  const selectedDayData = getDataForDate(selectedDate);
  const datesWithData = Object.keys(dayData).filter(date => dayData[date].hasData);

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
            <h2 className="text-white text-lg">History</h2>
            <Button
              variant="ghost"
              size="icon"
              onClick={refreshData}
              className="text-white hover:bg-white/10"
              disabled={loading}
            >
              <RefreshCw className={`w-4 h-4 ${loading ? 'animate-spin' : ''}`} />
            </Button>
          </div>
          
          <div className="flex bg-white/10 rounded-lg p-1">
            <Button
              variant={viewMode === 'calendar' ? 'default' : 'ghost'}
              size="sm"
              onClick={() => setViewMode('calendar')}
              className={`${
                viewMode === 'calendar' 
                  ? 'bg-white text-[#1C2526]' 
                  : 'text-white hover:bg-white/10'
              } h-8 px-3`}
            >
              <CalendarIcon className="w-4 h-4" />
            </Button>
            <Button
              variant={viewMode === 'list' ? 'default' : 'ghost'}
              size="sm"
              onClick={() => setViewMode('list')}
              className={`${
                viewMode === 'list' 
                  ? 'bg-white text-[#1C2526]' 
                  : 'text-white hover:bg-white/10'
              } h-8 px-3`}
            >
              <List className="w-4 h-4" />
            </Button>
          </div>
        </div>
      </div>

      <div className="px-4 py-4 space-y-4">
        {viewMode === 'calendar' ? (
          <>
            {/* Calendar */}
            <Card className="reflecta-surface border-none reflecta-shadow">
              <div className="p-4">
                <Calendar
                  mode="single"
                  selected={selectedDate}
                  onSelect={(date) => date && setSelectedDate(date)}
                  className="text-white"
                  modifiers={{
                    hasData: datesWithData.map(date => new Date(date))
                  }}
                  modifiersClassNames={{
                    hasData: "bg-white/20 text-white font-semibold rounded-full"
                  }}
                />
              </div>
            </Card>

            {/* Selected Day Data */}
            {selectedDayData.hasData ? (
              <Card className="reflecta-surface border-none reflecta-shadow">
                <div className="p-6">
                  <div className="flex items-center justify-between mb-4">
                    <h3 className="text-white text-lg">
                      {selectedDate.toLocaleDateString('ru-RU', { 
                        weekday: 'long',
                        month: 'long',
                        day: 'numeric'
                      })}
                    </h3>
                    <div className="flex items-center space-x-2">
                      {selectedDayData.reflections.length > 0 && (
                        <span className="text-xs bg-blue-500/20 text-blue-300 px-2 py-1 rounded-full">
                          {selectedDayData.reflections.length} reflections
                        </span>
                      )}
                      {selectedDayData.chatMessages.length > 0 && (
                        <span className="text-xs bg-green-500/20 text-green-300 px-2 py-1 rounded-full">
                          {selectedDayData.chatMessages.length} messages
                        </span>
                      )}
                    </div>
                  </div>

                  {/* Tabs */}
                  <div className="flex bg-white/10 rounded-lg p-1 mb-4">
                    <Button
                      variant={activeTab === 'reflections' ? 'default' : 'ghost'}
                      size="sm"
                      onClick={() => setActiveTab('reflections')}
                      className={`${
                        activeTab === 'reflections' 
                          ? 'bg-white text-[#1C2526]' 
                          : 'text-white hover:bg-white/10'
                      } h-8 px-3 flex-1`}
                    >
                      Reflections
                    </Button>
                    <Button
                      variant={activeTab === 'chat' ? 'default' : 'ghost'}
                      size="sm"
                      onClick={() => setActiveTab('chat')}
                      className={`${
                        activeTab === 'chat' 
                          ? 'bg-white text-[#1C2526]' 
                          : 'text-white hover:bg-white/10'
                      } h-8 px-3 flex-1`}
                    >
                      Chat
                    </Button>
                  </div>

                  {/* Content */}
                  {activeTab === 'reflections' && selectedDayData.reflections.length > 0 ? (
                    <div className="space-y-4">
                      {selectedDayData.reflections.map((reflection, index) => (
                        <div key={index} className="border-l-2 border-white/20 pl-4">
                          <div className="flex items-center justify-between mb-2">
                            <div className="flex items-center space-x-2">
                              <span className="text-2xl">{reflection.mood}</span>
                              <span className={`text-sm ${getMoodColor(reflection.moodValue)}`}>
                                {reflection.moodValue}/5
                              </span>
                            </div>
                            <span className="text-white/50 text-xs">
                              {new Date(reflection.date).toLocaleTimeString('ru-RU', {
                                hour: '2-digit',
                                minute: '2-digit'
                              })}
                            </span>
                          </div>
                          <p className="text-white/90 text-sm leading-relaxed mb-3">
                            {reflection.summary}
                          </p>
                          {reflection.topics.length > 0 && (
                            <div className="flex flex-wrap gap-2">
                              {reflection.topics.map((topic, topicIndex) => (
                                <span
                                  key={topicIndex}
                                  className="px-3 py-1 bg-white/10 text-white/80 text-xs rounded-full"
                                >
                                  {topic}
                                </span>
                              ))}
                            </div>
                          )}
                        </div>
                      ))}
                    </div>
                  ) : activeTab === 'chat' && selectedDayData.chatMessages.length > 0 ? (
                    <div className="space-y-3 max-h-64 overflow-y-auto">
                      {selectedDayData.chatMessages.map((message, index) => (
                        <div
                          key={index}
                          className={`flex ${message.is_user_message ? 'justify-end' : 'justify-start'}`}
                        >
                          <div className={`max-w-[80%] flex items-start space-x-2 ${
                            message.is_user_message ? 'flex-row-reverse space-x-reverse' : ''
                          }`}>
                            <div className={`w-6 h-6 rounded-full flex items-center justify-center flex-shrink-0 ${
                              message.is_user_message ? 'bg-white/20' : 'bg-white/10'
                            }`}>
                              {message.is_user_message ? (
                                <User className="w-3 h-3 text-white" />
                              ) : (
                                <Bot className="w-3 h-3 text-white" />
                              )}
                            </div>
                            <div className={`px-3 py-2 rounded-lg ${
                              message.is_user_message 
                                ? 'bg-white/20 text-white' 
                                : 'bg-white/10 text-white'
                            }`}>
                              <p className="text-sm">{message.message_text}</p>
                              <p className="text-xs text-white/50 mt-1">
                                {new Date(message.created_at).toLocaleTimeString('ru-RU', {
                                  hour: '2-digit',
                                  minute: '2-digit'
                                })}
                              </p>
                            </div>
                          </div>
                        </div>
                      ))}
                    </div>
                  ) : (
                    <div className="text-center py-8">
                      <p className="text-white/60">
                        {activeTab === 'reflections' 
                          ? 'No reflections for this day' 
                          : 'No chat messages for this day'
                        }
                      </p>
                    </div>
                  )}
                </div>
              </Card>
            ) : (
              <Card className="reflecta-surface border-none reflecta-shadow">
                <div className="p-6 text-center">
                  {loading ? (
                    <div className="flex items-center justify-center space-x-2">
                      <Loader2 className="w-4 h-4 animate-spin text-white/60" />
                      <p className="text-white/60">Loading...</p>
                    </div>
                  ) : (
                    <p className="text-white/60">No data for this day</p>
                  )}
                </div>
              </Card>
            )}
          </>
        ) : (
          /* List View */
          <div className="space-y-3">
            {loading ? (
              <div className="flex items-center justify-center py-8">
                <Loader2 className="w-6 h-6 animate-spin text-white/60" />
                <span className="text-white/60 ml-2">Loading history...</span>
              </div>
            ) : datesWithData.length > 0 ? (
              datesWithData
                .sort((a, b) => new Date(b).getTime() - new Date(a).getTime())
                .map((date) => {
                  const dayDataItem = dayData[date];
                  return (
                    <Card key={date} className="reflecta-surface border-none reflecta-shadow">
                      <div className="p-4">
                        <div className="flex items-center justify-between mb-3">
                          <span className="text-white/80 text-sm">
                            {new Date(date).toLocaleDateString('ru-RU', {
                              weekday: 'short',
                              month: 'short',
                              day: 'numeric'
                            })}
                          </span>
                          <div className="flex items-center space-x-2">
                            {dayDataItem.reflections.length > 0 && (
                              <span className="text-xs bg-blue-500/20 text-blue-300 px-2 py-1 rounded-full">
                                {dayDataItem.reflections.length} reflections
                              </span>
                            )}
                            {dayDataItem.chatMessages.length > 0 && (
                              <span className="text-xs bg-green-500/20 text-green-300 px-2 py-1 rounded-full">
                                {dayDataItem.chatMessages.length} messages
                              </span>
                            )}
                          </div>
                        </div>
                        
                        {dayDataItem.reflections.length > 0 && (
                          <div className="mb-3">
                            <div className="flex items-center space-x-2 mb-2">
                              <span className="text-lg">{dayDataItem.reflections[0].mood}</span>
                              <span className={`text-xs ${getMoodColor(dayDataItem.reflections[0].moodValue)}`}>
                                {dayDataItem.reflections[0].moodValue}/5
                              </span>
                            </div>
                            <p className="text-white/90 text-sm leading-relaxed">
                              {dayDataItem.reflections[0].summary}
                            </p>
                            {dayDataItem.reflections[0].topics.length > 0 && (
                              <div className="flex flex-wrap gap-2 mt-2">
                                {dayDataItem.reflections[0].topics.slice(0, 3).map((topic, topicIndex) => (
                                  <span
                                    key={topicIndex}
                                    className="px-2 py-1 bg-white/10 text-white/70 text-xs rounded-full"
                                  >
                                    {topic}
                                  </span>
                                ))}
                                {dayDataItem.reflections[0].topics.length > 3 && (
                                  <span className="px-2 py-1 bg-white/10 text-white/50 text-xs rounded-full">
                                    +{dayDataItem.reflections[0].topics.length - 3}
                                  </span>
                                )}
                              </div>
                            )}
                          </div>
                        )}
                        
                        {dayDataItem.chatMessages.length > 0 && (
                          <div className="text-white/60 text-xs">
                            Last message: "{dayDataItem.chatMessages[dayDataItem.chatMessages.length - 1].message_text.slice(0, 50)}..."
                          </div>
                        )}
                      </div>
                    </Card>
                  );
                })
            ) : (
              <div className="text-center py-8">
                <p className="text-white/60">No data for the last 30 days</p>
              </div>
            )}
          </div>
        )}
      </div>
    </div>
  );
}