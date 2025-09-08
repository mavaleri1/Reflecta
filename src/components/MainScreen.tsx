import React, { useState } from "react";
import { Button } from "./ui/button";
import { Card } from "./ui/card";
import { Textarea } from "./ui/textarea";
import { Mic, Paperclip, Send, StopCircle, Brain, Loader2, RefreshCw, MicOff } from "lucide-react";
import { useAuth } from '../hooks/useAuth';
import { useEntries } from '../hooks/useEntries';
import { useAI } from '../hooks/useAI';
import { useVoiceRecording } from '../hooks/useVoiceRecording';

const cn = (...classes: (string | undefined | null | false)[]) => classes.filter(Boolean).join(" ");

interface MainScreenProps {
  onNavigate: (screen: string) => void;
  onAiResponse?: (response: string) => void;
  onUserMessage?: (message: string) => void;
}

export function MainScreen({ onNavigate, onAiResponse, onUserMessage }: MainScreenProps) {
  const [message, setMessage] = useState("");
  const [mood, setMood] = useState(3); // Default mood value
  const [aiResponse, setAiResponse] = useState<string | null>(null);
  const [isSending, setIsSending] = useState(false);
  const [currentQuestion, setCurrentQuestion] = useState("");
  const [isProcessingVoice, setIsProcessingVoice] = useState(false);

  const { user } = useAuth();
  const { createEntry } = useEntries(user?.id || '');
  const { analyzeText, loading: aiLoading, error: aiError } = useAI();
  
  // Voice recording hook
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

  // Array of welcome questions
  const dailyQuestions: string[] = [
    "How are you feeling today?",
    "Evening vibe check—how's your mood?",
    "How was your day—any highlights?",
    "Feeling good tonight? What made your day?",
    "How's your evening? Busy or chill day?",
    "What's up tonight? Best part of your day?",
    "How's your mood? Any fun moments today?",
    "Evening time! How'd your day go?",
    "What's the evening vibe? Day go well?",
    "How are you tonight? Any big wins?",
    "Reflecting yet? What stood out today?",
    "How's your day been? Any thoughts to share?",
    "What's on your mind this evening?",
    "How are you doing tonight?",
    "Ready to reflect? How was your day?",
    "What's the highlight of your day?",
    "How's your evening going?",
    "Any interesting moments today?",
    "How are you feeling right now?",
    "What made you smile today?"
  ];

  // Random question selection
  const getRandomQuestion = () => {
    const randomIndex = Math.floor(Math.random() * dailyQuestions.length);
    return dailyQuestions[randomIndex];
  };

  // Initialize random question when component loads
  React.useEffect(() => {
    setCurrentQuestion(getRandomQuestion());
  }, []);

  const todayQuestion = currentQuestion;

  // Function to update question
  const handleRefreshQuestion = () => {
    setCurrentQuestion(getRandomQuestion());
  };

  const handleSendMessage = async () => {
    // Prevent multiple submissions
    if (isSending || aiLoading) {
      console.log('🚫 MainScreen: Already sending, ignoring request');
      return;
    }
    
    console.log('📤 MainScreen: Send message clicked');
    console.log('📝 Message:', message);
    console.log('👤 User:', user?.id);
    
    if (message.trim() && user) {
      setIsSending(true);
      try {
        console.log('🤖 MainScreen: Starting AI analysis...');
        // Analyze text with AI
        const aiResult = await analyzeText(message);
        
        if (aiResult) {
          console.log('✅ MainScreen: AI analysis successful:', aiResult);
          // Use mood determined by AI
          const aiMood = aiResult.moodAnalysis.mood;
          const aiTopics = aiResult.moodAnalysis.topics;
          
          console.log('💾 MainScreen: Saving entry with AI analysis:', { aiMood, aiTopics });
          // Save entry in Supabase with AI analysis
          await createEntry(message, aiMood, aiTopics);
          
          // Save AI response for display in dialogue
          setAiResponse(aiResult.response);
          onAiResponse?.(aiResult.response);
          onUserMessage?.(message);
          
          setMessage(""); // Clear field
          onNavigate("dialogue");
        } else {
          console.log('⚠️ MainScreen: AI analysis failed, using fallback');
          // Fallback: save with user selected mood
          await createEntry(message, mood, []);
          setMessage("");
          onNavigate("dialogue");
        }
      } catch (error) {
        console.error('❌ MainScreen: Error processing message:', error);
        console.error('❌ MainScreen: Error details:', {
          message: error instanceof Error ? error.message : 'Unknown error',
          stack: error instanceof Error ? error.stack : undefined
        });
        // Fallback: save without AI analysis
        await createEntry(message, mood, []);
        setMessage("");
        onNavigate("dialogue");
      } finally {
        setIsSending(false);
      }
    }
  };

  // Voice recording handling
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
        if (transcript && user) {
          try {
            console.log('🤖 MainScreen: Starting AI analysis for voice message...');
            // Analyze text with AI
            const aiResult = await analyzeText(transcript);
            
            if (aiResult) {
              console.log('✅ MainScreen: AI analysis successful for voice:', aiResult);
              // Use mood determined by AI
              const aiMood = aiResult.moodAnalysis.mood;
              const aiTopics = aiResult.moodAnalysis.topics;
              
              console.log('💾 MainScreen: Saving voice entry with AI analysis:', { aiMood, aiTopics });
              // Save entry in Supabase with AI analysis
              await createEntry(transcript, aiMood, aiTopics);
              
              // Save AI response for display in dialogue
              setAiResponse(aiResult.response);
              onAiResponse?.(aiResult.response);
              onUserMessage?.(transcript);
              
              clearTranscript();
              onNavigate("dialogue");
            } else {
              console.log('⚠️ MainScreen: AI analysis failed for voice, using fallback');
              // Fallback: save with neutral mood
              await createEntry(transcript, mood, []);
              
              // Fallback AI response
              const fallbackResponse = "I'm here to listen whenever you're ready to share. Even a simple message can be a step toward expressing yourself, and I'm here to support you.";
              setAiResponse(fallbackResponse);
              onAiResponse?.(fallbackResponse);
              onUserMessage?.(transcript);
              
              clearTranscript();
              onNavigate("dialogue");
            }
          } catch (error) {
            console.error('❌ MainScreen: Error processing voice message:', error);
            // Fallback: save without AI analysis
            await createEntry(transcript, mood, []);
            
            // Fallback AI response
            const fallbackResponse = "I'm here to listen whenever you're ready to share. Even a simple message can be a step toward expressing yourself, and I'm here to support you.";
            setAiResponse(fallbackResponse);
            onAiResponse?.(fallbackResponse);
            onUserMessage?.(transcript);
            
            clearTranscript();
            onNavigate("dialogue");
          }
        }
        
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

  return (
    <div className="reflecta-gradient min-h-screen bg-[rgba(135,206,235,0)] rounded-[111px]">
      <div className="px-4 py-6 space-y-6 bg-[rgba(135,206,235,1)] rounded-[12px]">
        {/* Header */}
        <div className="text-center pt-4">
          <h2 className="text-white text-xl mb-2">Evening Reflection</h2>
          <p className="text-white/70 text-sm">
            {new Date().toLocaleDateString('en-US', { 
              weekday: 'long', 
              year: 'numeric', 
              month: 'long', 
              day: 'numeric' 
            })}
          </p>
        </div>

        {/* Daily Question Card */}
        <Card className="reflecta-surface border-none reflecta-shadow mx-2">
          <div className="p-6">
            <div className="flex items-center justify-between mb-2">
              <h3 className="text-white text-lg">Today's Question</h3>
              <Button
                variant="ghost"
                size="icon"
                onClick={handleRefreshQuestion}
                className="text-white/70 hover:text-white hover:bg-white/10 w-8 h-8"
                title="Get new question"
              >
                <RefreshCw className="w-4 h-4" />
              </Button>
            </div>
            <p className="text-white/90 text-base leading-relaxed mb-4">
              {todayQuestion}
            </p>
            
            {/* Mood Selector - commented out as AI analyzes mood automatically
            <div className="mt-4">
              <div className="flex items-center space-x-2 mb-2">
                <Brain className="w-4 h-4 text-white/70" />
                <p className="text-white/70 text-sm">AI will analyze your mood automatically</p>
              </div>
              <div className="flex space-x-2">
                {[1, 2, 3, 4, 5].map((value) => (
                  <button
                    key={value}
                    onClick={() => setMood(value)}
                    className={`w-10 h-10 rounded-full border-2 transition-all ${
                      mood === value
                        ? 'border-white bg-white/20'
                        : 'border-white/30 hover:border-white/50'
                    }`}
                  >
                    <span className="text-white text-lg">
                      {value === 1 ? '😔' : value === 2 ? '😕' : value === 3 ? '😐' : value === 4 ? '😊' : '😄'}
                    </span>
                  </button>
                ))}
              </div>
              <p className="text-white/50 text-xs mt-1">Manual override (AI analysis preferred)</p>
            </div>
            */}
          
          </div>
        </Card>

        {/* Input Area */}
        <div className="space-y-4 mx-2">
          <Card className="reflecta-surface border-none reflecta-shadow">
            <div className="p-4">
              {/* Textarea */}
              <Textarea
                placeholder="Share your thoughts..."
                value={message}
                onChange={(e) => setMessage(e.target.value)}
                className="min-h-[120px] bg-transparent border-none text-white placeholder:text-[#A0AEC0] resize-none focus:ring-0 focus:ring-offset-0"
                style={{ fontSize: '16px' }}
              />
              
              {/* Voice recording indicator */}
              {isRecording && (
                <div className="mt-4 p-4 bg-white/10 rounded-lg">
                  <div className="flex items-center justify-center space-x-2 mb-3">
                    <div className="w-2 h-2 bg-red-500 rounded-full animate-pulse"></div>
                    <div className="text-white/70 text-sm font-mono">
                      {formatDuration(duration)}
                    </div>
                  </div>
                  
                  {/* Audio visualizer bars */}
                  <div className="w-full h-12 flex items-center justify-center gap-1 px-4">
                    {[...Array(20)].map((_, i) => (
                      <div
                        key={i}
                        className="w-1 rounded-full bg-white"
                        style={{
                          height: `${Math.max(20, Math.random() * 100)}%`,
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
              )}

              {/* Voice processing indicator */}
              {isProcessingVoice && (
                <div className="mt-4 p-4 bg-yellow-500/20 rounded-lg">
                  <div className="flex items-center space-x-3">
                    <Loader2 className="w-4 h-4 text-yellow-500 animate-spin" />
                    <span className="text-white/70 text-sm">Processing voice...</span>
                  </div>
                </div>
              )}

              {/* AI Error Display */}
              {aiError && (
                <div className="mt-4 p-3 bg-yellow-500/20 border border-yellow-500/30 rounded-lg">
                  <p className="text-yellow-200 text-sm">
                    AI analysis failed, using manual mood selection
                  </p>
                </div>
              )}

              {/* Voice Error Display */}
              {voiceError && (
                <div className="mt-4 p-3 bg-red-500/20 border border-red-500/30 rounded-lg">
                  <p className="text-red-200 text-sm">
                    {voiceError}
                  </p>
                  <p className="text-red-300 text-xs mt-1">
                    You can still use text input to chat with AI.
                  </p>
                </div>
              )}

              {/* Icon Bar - commented out
              <div className="flex items-center space-x-4 pt-2">
                <button className="p-2 hover:bg-white/10 rounded-lg transition-colors">
                  <Globe className="w-5 h-5 text-[#D1D5DB]" />
                </button>
                <button className="p-2 hover:bg-white/10 rounded-lg transition-colors">
                  <Flower className="w-5 h-5 text-[#D1D5DB]" />
                </button>
                <button className="p-2 hover:bg-white/10 rounded-lg transition-colors">
                  <Code className="w-5 h-5 text-[#D1D5DB]" />
                </button>
              </div>
              */}

              <div className="flex items-center justify-between pt-4 border-t border-white/10">
                <div className="flex items-center space-x-4">
 
                </div>
                
                <div className="flex items-center space-x-3">
                  {isVoiceSupported ? (
                    <button
                      onClick={handleVoiceRecording}
                      disabled={isProcessingVoice || isProcessing}
                      className={`w-12 h-12 rounded-full reflecta-shadow-sm transition-all ${
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
                        <MicOff className="w-5 h-5 mx-auto" />
                      ) : isProcessingVoice || isProcessing ? (
                        <Loader2 className="w-5 h-5 mx-auto animate-spin" />
                      ) : (
                        <Mic className="w-5 h-5 mx-auto" />
                      )}
                    </button>
                  ) : (
                    <div
                      className="w-12 h-12 rounded-full bg-white/20 text-white/50 flex items-center justify-center cursor-not-allowed"
                      title="Voice recording requires HTTPS connection"
                    >
                      <Mic className="w-5 h-5 mx-auto" />
                    </div>
                  )}
                  
                  {message.trim() && !isRecording && (
                    <Button
                      onClick={handleSendMessage}
                      disabled={aiLoading || isSending}
                      className="inline-flex items-center justify-center gap-2 whitespace-nowrap text-sm font-medium transition-all disabled:pointer-events-none [&_svg]:pointer-events-none [&_svg:not([class*='size-'])]:size-4 shrink-0 [&_svg]:shrink-0 outline-none focus-visible:border-ring focus-visible:ring-ring/50 focus-visible:ring-[3px] aria-invalid:ring-destructive/20 dark:aria-invalid:ring-destructive/40 aria-invalid:border-destructive py-2 has-[>svg]:px-3 bg-white text-[#1C2526] hover:bg-white/90 h-10 px-4 rounded-lg disabled:opacity-50"
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

        {/* Quick Actions */}
        <div className="mx-2 space-y-3">
          <p className="text-white/70 text-sm px-2">Quick actions</p>
          <div className="grid grid-cols-2 gap-3">
            <Button
              variant="outline"
              onClick={() => onNavigate("history")}
              className="h-12 bg-white/10 border-white/20 text-white hover:bg-white/20"
            >
              View History
            </Button>
            <Button
              variant="outline"
              onClick={() => onNavigate("analytics")}
              className="h-12 bg-white/10 border-white/20 text-white hover:bg-white/20"
            >
              Analytics
            </Button>
          </div>
        </div>
      </div>
    </div>
  );
}