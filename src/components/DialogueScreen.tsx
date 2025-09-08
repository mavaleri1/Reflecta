import React, { useState } from "react";
import { Button } from "./ui/button";
import { Card } from "./ui/card";
import { Input } from "./ui/input";
import { ArrowLeft, Mic, Send, Bot, User, Loader2, Volume2, VolumeX, Trash2, MicOff, AlertCircle } from "lucide-react";
import { useAuth } from '../hooks/useAuth';
import { useEntries } from '../hooks/useEntries';
import { useAI } from '../hooks/useAI';
import { useTTS } from '../hooks/useTTS';
import { useChatHistory, ChatMessage } from '../hooks/useChatHistory';
import { useVoiceRecording } from '../hooks/useVoiceRecording';
import { speechToTextService } from '../services/speechToText';

interface DialogueScreenProps {
  onBack: () => void;
  aiResponse?: string | null;
  userMessage?: string | null;
}

export function DialogueScreen({ onBack, aiResponse, userMessage }: DialogueScreenProps) {
  const [newMessage, setNewMessage] = useState("");
  const [isSending, setIsSending] = useState(false);
  const [isProcessingVoice, setIsProcessingVoice] = useState(false);
  const [showVoiceError, setShowVoiceError] = useState(false);
  
  const { user } = useAuth();
  const { createEntry } = useEntries(user?.id || '');
  const { analyzeText, loading: aiLoading, error: aiError } = useAI();
  const { speak, stop, isPlaying, isLoading: ttsLoading } = useTTS();
  const { messages, addUserMessage, addAIMessage, clearHistory, isLoaded, isSyncing } = useChatHistory(user?.id);
  
  // Hook for voice recording
  const {
    isRecording,
    isProcessing,
    error: voiceError,
    transcript,
    duration,
    isSupported: isVoiceSupported,
    startRecording,
    stopRecording,
    clearTranscript,
    formatDuration
  } = useVoiceRecording();
  
  // add messages from user and AI when received (only once per message)
  const [addedUserMessage, setAddedUserMessage] = useState<string | null>(null);
  const [addedAiResponse, setAddedAiResponse] = useState<string | null>(null);
  const [isAddingMessage, setIsAddingMessage] = useState(false);
  
  React.useEffect(() => {
    const addMessages = async () => {
      if (isAddingMessage) {
        console.log('🚫 DialogueScreen: Already adding messages, skipping');
        return;
      }
      
      setIsAddingMessage(true);
      
      try {
        if (userMessage && isLoaded && userMessage !== addedUserMessage) {
          console.log('💬 DialogueScreen: Adding user message:', userMessage);
          await addUserMessage(userMessage);
          setAddedUserMessage(userMessage);
        }
        
        if (aiResponse && isLoaded && aiResponse !== addedAiResponse) {
          console.log('🤖 DialogueScreen: Adding AI response:', aiResponse);
          await addAIMessage(aiResponse);
          setAddedAiResponse(aiResponse);
        }
      } finally {
        setIsAddingMessage(false);
      }
    };
    
    // Only run if we have new messages to add
    if ((userMessage && userMessage !== addedUserMessage) || (aiResponse && aiResponse !== addedAiResponse)) {
      addMessages();
    }
  }, [userMessage, aiResponse, isLoaded, addedUserMessage, addedAiResponse, isAddingMessage]);

  const handleSendMessage = async () => {
    // Prevent multiple submissions
    if (isSending || aiLoading) {
      console.log('🚫 DialogueScreen: Already sending, ignoring request');
      return;
    }
    
    console.log('💬 DialogueScreen: Send message clicked');
    console.log('📝 Message:', newMessage);
    console.log('👤 User:', user?.id);
    
    if (newMessage.trim() && user && isLoaded) {
      setIsSending(true);
      try {
        // add user message to history
        await addUserMessage(newMessage);
        const currentMessage = newMessage;
        setNewMessage("");
        
        console.log('🤖 DialogueScreen: Starting AI analysis...');
        // Analyze text with AI
        const aiResult = await analyzeText(currentMessage);
        
        if (aiResult) {
          console.log('✅ DialogueScreen: AI analysis successful:', aiResult);
          // Use mood determined by AI
          const aiMood = aiResult.moodAnalysis.mood;
          const aiTopics = aiResult.moodAnalysis.topics;
          
          console.log('💾 DialogueScreen: Saving entry with AI analysis:', { aiMood, aiTopics });
          // Save entry in Supabase with AI analysis
          await createEntry(currentMessage, aiMood, aiTopics);
          
          // Add AI response to chat history
          await addAIMessage(aiResult.response);
        } else {
          console.log('⚠️ DialogueScreen: AI analysis failed, using fallback');
          // Fallback: save with neutral mood
          await createEntry(currentMessage, 3, []);
          
          // Add fallback AI response
          const fallbackResponse = "I'm here to listen whenever you're ready to share. Even a simple message can be a step toward expressing yourself, and I'm here to support you.";
          await addAIMessage(fallbackResponse);
        }
      } catch (error) {
        console.error('❌ DialogueScreen: Error processing message:', error);
        // Fallback: save without AI analysis
        const currentMessage = newMessage;
        await createEntry(currentMessage, 3, []);
        
        // Add fallback AI response
        const fallbackResponse = "I'm here to listen whenever you're ready to share. Even a simple message can be a step toward expressing yourself, and I'm here to support you.";
        await addAIMessage(fallbackResponse);
      } finally {
        setIsSending(false);
      }
    }
  };

  // (voice recording)
  const handleVoiceRecording = async () => {
    if (!isVoiceSupported) {
      console.warn('Voice recording not supported');
      return;
    }

    if (isRecording) {
      // Stop recording
      stopRecording();
      setIsProcessingVoice(true);
      
      // Wait for processing and automatically send message
      setTimeout(async () => {
        if (transcript && user && isLoaded) {
          try {
            // Add user message to history
            await addUserMessage(transcript);
            
            console.log('🤖 DialogueScreen: Starting AI analysis for voice message...');
            // Analyze text with AI
            const aiResult = await analyzeText(transcript);
            
            if (aiResult) {
              console.log('✅ DialogueScreen: AI analysis successful for voice:', aiResult);
              // Use mood determined by AI
              const aiMood = aiResult.moodAnalysis.mood;
              const aiTopics = aiResult.moodAnalysis.topics;
              
              console.log('💾 DialogueScreen: Saving voice entry with AI analysis:', { aiMood, aiTopics });
              // Save entry in Supabase with AI analysis
              await createEntry(transcript, aiMood, aiTopics);
              
              // Add AI response to chat history
              await addAIMessage(aiResult.response);
            } else {
              console.log('⚠️ DialogueScreen: AI analysis failed for voice, using fallback');
              // Fallback: save with neutral mood
              await createEntry(transcript, 3, []);
              
              // Add fallback AI response
              const fallbackResponse = "I'm here to listen whenever you're ready to share. Even a simple message can be a step toward expressing yourself, and I'm here to support you.";
              await addAIMessage(fallbackResponse);
            }
          } catch (error) {
            console.error('❌ DialogueScreen: Error processing voice message:', error);
            // Fallback: save without AI analysis
            await createEntry(transcript, 3, []);
            
            // Add fallback AI response
            const fallbackResponse = "I'm here to listen whenever you're ready to share. Even a simple message can be a step toward expressing yourself, and I'm here to support you.";
            await addAIMessage(fallbackResponse);
          }
        }
        
        clearTranscript();
        setIsProcessingVoice(false);
      }, 1000);
    } else {
      // Start recording
      try {
        await startRecording();
      } catch (error) {
        console.error('Error starting voice recording:', error);
      }
    }
  };

  // Handling voice input errors
  React.useEffect(() => {
    if (voiceError) {
      console.error('Voice recording error:', voiceError);
      setShowVoiceError(true);
      // Automatically hide error through 5 seconds
      setTimeout(() => {
        setShowVoiceError(false);
      }, 5000);
    }
  }, [voiceError]);

  const handleSpeakMessage = (text: string) => {
    if (isPlaying) {
      stop();
    } else {
      speak(text);
    }
  };

  const handleClearHistory = async () => {
    if (window.confirm('Are you sure you want to clear the chat history? This action cannot be undone.')) {
      await clearHistory();
    }
  };

  return (
    <div className="reflecta-gradient min-h-screen flex flex-col">
      {/* Notification of voice input error */}
      {showVoiceError && voiceError && (
        <div className="px-4 py-2 bg-red-500/20 border-b border-red-500/30">
          <div className="flex items-center space-x-2 text-red-200">
            <AlertCircle className="w-4 h-4" />
            <span className="text-sm">{voiceError}</span>
            <button
              onClick={() => setShowVoiceError(false)}
              className="ml-auto text-red-300 hover:text-red-100"
            >
              ×
            </button>
          </div>
        </div>
      )}

      {/* Header */}
      <div className="px-4 py-6 border-b border-white/10 bg-[rgba(135,206,235,0)]">
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
            <div className="flex items-center space-x-3">
              <div className="w-8 h-8 bg-white/20 rounded-full flex items-center justify-center">
                <Bot className="w-4 h-4 text-white" />
              </div>
              <div>
                <h2 className="text-white">AI Companion</h2>
                <p className="text-white/70 text-sm">Always here to listen</p>
              </div>
            </div>
          </div>
          
          <div className="flex items-center space-x-2">
            {isSyncing && (
              <div className="text-white/50 text-xs flex items-center space-x-1">
                <Loader2 className="w-3 h-3 animate-spin" />
                <span>Synchronization...</span>
              </div>
            )}
            {messages.length > 0 && (
              <Button
                variant="ghost"
                size="icon"
                onClick={handleClearHistory}
                className="text-white/70 hover:text-white hover:bg-white/10"
                title="Clear chat history"
              >
                <Trash2 className="w-4 h-4" />
              </Button>
            )}
          </div>
        </div>
      </div>

      {/* Messages */}
      <div className="flex-1 px-4 py-4 space-y-4 overflow-y-auto bg-[rgba(135,206,235,0)] rounded-[1px]">
        {!isLoaded ? (
          <div className="flex justify-center items-center h-full">
            <div className="text-white/70">Loading chat history...</div>
          </div>
        ) : (
          <>
            {/* Indicator of voice recording */}
            {isRecording && (
              <div className="flex justify-end mb-4">
                <div className="max-w-[80%] order-2">
                  <Card className="reflecta-surface border-none reflecta-shadow">
                    <div className="p-4">
                      <div className="flex items-center justify-center space-x-2 mb-3">
                        <div className="w-2 h-2 bg-red-500 rounded-full animate-pulse"></div>
                        <div className="text-white/70 text-sm font-mono">
                          {formatDuration(duration)}
                        </div>
                      </div>
                      
                      {/* Audio visualizer bars */}
                      <div className="w-full h-10 flex items-center justify-center gap-1 px-2">
                        {[...Array(16)].map((_, i) => (
                          <div
                            key={i}
                            className="w-1 rounded-full bg-white"
                            style={{
                              height: `${Math.max(15, Math.random() * 100)}%`,
                              animation: `pulse ${0.3 + Math.random() * 0.4}s ease-in-out infinite`,
                              animationDelay: `${i * 0.1}s`,
                            }}
                          />
                        ))}
                      </div>
                      
                      {transcript && (
                        <div className="mt-3 text-white/80 text-sm italic">
                          "{transcript}"
                        </div>
                      )}
                    </div>
                  </Card>
                </div>
                <div className="order-1 mr-2 flex-shrink-0">
                  <div className="w-8 h-8 rounded-full bg-white/20 flex items-center justify-center">
                    <Mic className="w-4 h-4 text-white animate-pulse" />
                  </div>
                </div>
              </div>
            )}

            {/* Indicator of voice message processing */}
            {isProcessingVoice && (
              <div className="flex justify-end mb-4">
                <div className="max-w-[80%] order-2">
                  <Card className="reflecta-surface border-none reflecta-shadow">
                    <div className="p-4">
                      <div className="flex items-center space-x-3">
                        <Loader2 className="w-4 h-4 text-yellow-500 animate-spin" />
                        <span className="text-white/70 text-sm">Processing voice message</span>
                      </div>
                    </div>
                  </Card>
                </div>
                <div className="order-1 mr-2 flex-shrink-0">
                  <div className="w-8 h-8 rounded-full bg-white/20 flex items-center justify-center">
                    <Loader2 className="w-4 h-4 text-white animate-spin" />
                  </div>
                </div>
              </div>
            )}

            {/* Chat messages */}
            {messages.map((message) => (
          <div
            key={message.id}
            className={`flex ${message.isUser ? 'justify-end' : 'justify-start'} mb-4`}
          >
            <div className={`max-w-[80%] ${message.isUser ? 'order-2' : 'order-1'}`}>
              <Card className={`${
                message.isUser 
                  ? 'reflecta-surface border-none' 
                  : 'bg-white/10 border-white/20'
              } reflecta-shadow`}>
                <div className="p-4">
                  <p className={`${
                    message.isUser ? 'text-white' : 'text-white'
                  } text-sm leading-relaxed`}>
                    {message.text}
                  </p>
                  <div className="flex items-center justify-between mt-2">
                    <p className="text-white/50 text-xs">
                      {message.timestamp.toLocaleTimeString([], { 
                        hour: '2-digit', 
                        minute: '2-digit' 
                      })}
                    </p>
                    {!message.isUser && (
                      <button
                        onClick={() => handleSpeakMessage(message.text)}
                        disabled={ttsLoading}
                        className="p-1 hover:bg-white/10 rounded transition-colors disabled:opacity-50"
                        title={isPlaying ? "Stop speaking" : "Speak message"}
                      >
                        {ttsLoading ? (
                          <Loader2 className="w-3 h-3 text-white/70 animate-spin" />
                        ) : isPlaying ? (
                          <VolumeX className="w-3 h-3 text-white/70" />
                        ) : (
                          <Volume2 className="w-3 h-3 text-white/70" />
                        )}
                      </button>
                    )}
                  </div>
                </div>
              </Card>
            </div>
            
            <div className={`${
              message.isUser ? 'order-1 mr-2' : 'order-2 ml-2'
            } flex-shrink-0`}>
              <div className={`w-8 h-8 rounded-full flex items-center justify-center ${
                message.isUser ? 'bg-white/20' : 'bg-white/10'
              }`}>
                {message.isUser ? (
                  <User className="w-4 h-4 text-white" />
                ) : (
                  <Bot className="w-4 h-4 text-white" />
                )}
              </div>
            </div>
          </div>
        ))}
          </>
        )}
      </div>

      {/* Input Area */}
      <div className="px-4 py-4 border-t border-white/10 bg-[rgba(135,206,235,0)] rounded-[1px]">
        <Card className="reflecta-surface border-none reflecta-shadow">
          <div className="p-3">
            <div className="flex items-end space-x-3">
              <div className="flex-1">
                <Input
                  placeholder="Share more thoughts..."
                  value={newMessage}
                  onChange={(e) => setNewMessage(e.target.value)}
                  onKeyPress={(e) => e.key === 'Enter' && handleSendMessage()}
                  className="bg-transparent border-none text-white placeholder:text-[#A0AEC0] focus:ring-0 focus:ring-offset-0"
                  style={{ fontSize: '16px' }}
                />
              </div>
              
              <div className="flex items-center space-x-2">
                {isVoiceSupported ? (
                  <button
                    onClick={handleVoiceRecording}
                    disabled={isProcessingVoice || isProcessing}
                    className={`w-10 h-10 rounded-full reflecta-shadow-sm transition-all ${
                      isRecording 
                        ? 'bg-red-500 text-white animate-pulse' 
                        : isProcessingVoice || isProcessing
                        ? 'bg-yellow-500 text-white'
                        : 'bg-white text-[#1C2526] hover:bg-white/90'
                    } disabled:opacity-50`}
                    title={
                      isRecording 
                        ? `Recording... ${formatDuration(duration)}` 
                        : isProcessingVoice || isProcessing
                        ? 'Processing...'
                        : 'Start voice recording'
                    }
                  >
                    {isRecording ? (
                      <MicOff className="w-4 h-4 mx-auto" />
                    ) : isProcessingVoice || isProcessing ? (
                      <Loader2 className="w-4 h-4 mx-auto animate-spin" />
                    ) : (
                      <Mic className="w-4 h-4 mx-auto" />
                    )}
                  </button>
                ) : (
                  <div
                    className="w-10 h-10 rounded-full bg-white/20 text-white/50 flex items-center justify-center cursor-not-allowed"
                    title="Recording voice is not supported in your browser"
                  >
                    <Mic className="w-4 h-4 mx-auto" />
                  </div>
                )}
                
                {newMessage.trim() && (
                  <Button
                    onClick={handleSendMessage}
                    disabled={aiLoading || isSending}
                    className="bg-white text-[#1C2526] hover:bg-white/90 h-10 px-3 disabled:opacity-50"
                  >
                    {(aiLoading || isSending) ? (
                      <Loader2 className="w-4 h-4 animate-spin" />
                    ) : (
                      <Send className="w-4 h-4" />
                    )}
                  </Button>
                )}
              </div>
            </div>
          </div>
        </Card>
      </div>
    </div>
  );
}