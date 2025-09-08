import React, { useState } from "react";
import { Button } from "./ui/button";
import { Card } from "./ui/card";
import { Input } from "./ui/input";
import { ArrowLeft, Mic, Send, Bot, User, Loader2, Volume2, VolumeX, Trash2 } from "lucide-react";
import { useAuth } from '../hooks/useAuth';
import { useEntries } from '../hooks/useEntries';
import { useAI } from '../hooks/useAI';
import { useTTS } from '../hooks/useTTS';
import { useChatHistory, ChatMessage } from '../hooks/useChatHistory';

interface DialogueScreenProps {
  onBack: () => void;
  aiResponse?: string | null;
  userMessage?: string | null;
}

export function DialogueScreen({ onBack, aiResponse, userMessage }: DialogueScreenProps) {
  const [newMessage, setNewMessage] = useState("");
  const [isRecording, setIsRecording] = useState(false);
  const [isSending, setIsSending] = useState(false);
  
  const { user } = useAuth();
  const { createEntry } = useEntries(user?.id || '');
  const { analyzeText, loading: aiLoading, error: aiError } = useAI();
  const { speak, stop, isPlaying, isLoading: ttsLoading } = useTTS();
  const { messages, addUserMessage, addAIMessage, clearHistory, isLoaded, isSyncing } = useChatHistory(user?.id);
  
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
        
        // For now, just save with neutral mood - AI analysis should be done in MainScreen
        console.log('💾 DialogueScreen: Saving entry with neutral mood');
        await createEntry(currentMessage, 3, []);
        
        // AI response will be added via props from MainScreen or through useEffect
      } catch (error) {
        console.error('❌ DialogueScreen: Error processing message:', error);
        // Fallback: save without AI analysis
        await createEntry(currentMessage, 3, []);
        
        // Error fallback AI response will be added via props from MainScreen
      } finally {
        setIsSending(false);
      }
    }
  };

  const toggleRecording = () => {
    setIsRecording(!isRecording);
  };

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
          messages.map((message) => (
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
        )))
        }
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
                <button
                  onClick={toggleRecording}
                  className={`w-10 h-10 rounded-full reflecta-shadow-sm transition-all ${
                    isRecording 
                      ? 'bg-red-500 text-white' 
                      : 'bg-white text-[#1C2526] hover:bg-white/90'
                  }`}
                >
                  <Mic className="w-4 h-4 mx-auto" />
                </button>
                
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