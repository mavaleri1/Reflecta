import { useState, useRef, useCallback } from 'react';

interface VoiceRecordingState {
  isRecording: boolean;
  isProcessing: boolean;
  error: string | null;
  transcript: string | null;
  duration: number;
}

export function useVoiceRecording() {
  const [state, setState] = useState<VoiceRecordingState>({
    isRecording: false,
    isProcessing: false,
    error: null,
    transcript: null,
    duration: 0,
  });

  const mediaRecorderRef = useRef<MediaRecorder | null>(null);
  const audioChunksRef = useRef<Blob[]>([]);
  const recognitionRef = useRef<SpeechRecognition | null>(null);
  const timerRef = useRef<NodeJS.Timeout | null>(null);

  // Check browser support
  const isSupported = useCallback(() => {
    // Check if we're on HTTPS or localhost
    const isSecure = window.location.protocol === 'https:' || window.location.hostname === 'localhost';
    
    // Check for Speech Recognition support
    const hasSpeechRecognition = 'webkitSpeechRecognition' in window || 'SpeechRecognition' in window;
    
    console.log('Voice recording support check:', {
      isSecure,
      hasSpeechRecognition,
      protocol: window.location.protocol,
      hostname: window.location.hostname,
      userAgent: navigator.userAgent
    });
    
    return (
      isSecure &&
      'MediaRecorder' in window &&
      hasSpeechRecognition
    );
  }, []);

  // Start recording
  const startRecording = useCallback(async () => {
    if (!isSupported()) {
      setState(prev => ({
        ...prev,
        error: 'Voice recording is not supported in your browser'
      }));
      return;
    }

    try {
      setState(prev => ({
        ...prev,
        isRecording: true,
        error: null,
        transcript: null,
        duration: 0
      }));

      // Get access to microphone
      const stream = await navigator.mediaDevices.getUserMedia({ 
        audio: {
          echoCancellation: true,
          noiseSuppression: true,
          sampleRate: 44100
        } 
      });

      // Configure MediaRecorder for audio recording
      const mediaRecorder = new MediaRecorder(stream, {
        mimeType: 'audio/webm;codecs=opus'
      });

      mediaRecorderRef.current = mediaRecorder;
      audioChunksRef.current = [];

      mediaRecorder.ondataavailable = (event) => {
        if (event.data.size > 0) {
          audioChunksRef.current.push(event.data);
        }
      };

      mediaRecorder.onstop = () => {
        // Stop all stream tracks
        stream.getTracks().forEach(track => track.stop());
      };

      // Configure Speech Recognition for real-time
      const SpeechRecognition = window.SpeechRecognition || window.webkitSpeechRecognition;
      const recognition = new SpeechRecognition();
      
      recognition.continuous = true;
      recognition.interimResults = true;
      recognition.lang = 'en-US'; // English language
      recognition.maxAlternatives = 1;
      
      // Add timeout for Vercel deployments
      recognition.timeout = 10000; // 10 seconds
      recognition.serviceURI = undefined; // Use default service

      recognitionRef.current = recognition;

      recognition.onresult = (event) => {
        let finalTranscript = '';
        let interimTranscript = '';

        for (let i = event.resultIndex; i < event.results.length; i++) {
          const transcript = event.results[i][0].transcript;
          if (event.results[i].isFinal) {
            finalTranscript += transcript;
          } else {
            interimTranscript += transcript;
          }
        }

        if (finalTranscript) {
          setState(prev => ({
            ...prev,
            transcript: finalTranscript
          }));
        }
      };

      recognition.onerror = (event) => {
        console.error('Speech recognition error:', event.error);
        console.error('Error details:', {
          error: event.error,
          type: event.type,
          timeStamp: event.timeStamp,
          isTrusted: event.isTrusted,
          location: window.location.href,
          userAgent: navigator.userAgent
        });
        
        let errorMessage = 'Speech recognition error';
        switch (event.error) {
          case 'network':
            errorMessage = 'Network error. This might be a Vercel deployment issue. Please try refreshing the page or use text input instead.';
            break;
          case 'not-allowed':
            errorMessage = 'Microphone access denied. Please allow microphone usage in your browser settings.';
            break;
          case 'no-speech':
            errorMessage = 'No speech detected. Try speaking louder or closer to the microphone.';
            break;
          case 'audio-capture':
            errorMessage = 'Failed to access microphone. Please check your microphone permissions.';
            break;
          case 'service-not-allowed':
            errorMessage = 'Speech recognition service is unavailable. This might be a browser or network issue.';
            break;
          case 'aborted':
            errorMessage = 'Speech recognition was aborted. Please try again.';
            break;
          case 'language-not-supported':
            errorMessage = 'Selected language is not supported. Please try English.';
            break;
          default:
            errorMessage = `Speech recognition error: ${event.error}. Please try using text input instead.`;
        }
        
        setState(prev => ({
          ...prev,
          error: errorMessage
        }));
      };

      recognition.onend = () => {
        // Automatically restart recognition if recording continues
        if (state.isRecording) {
          recognition.start();
        }
      };

      // Start recording and recognition
      mediaRecorder.start(1000); // Record in 1-second chunks
      
      try {
        recognition.start();
      } catch (error) {
        console.warn('Failed to start speech recognition, continuing with audio recording only:', error);
        // Continue with audio recording even if speech recognition fails
      }

      // Start timer
      timerRef.current = setInterval(() => {
        setState(prev => ({
          ...prev,
          duration: prev.duration + 1
        }));
      }, 1000);

    } catch (error) {
      console.error('Error starting recording:', error);
      setState(prev => ({
        ...prev,
        isRecording: false,
        error: 'Failed to start recording. Check microphone permissions.'
      }));
    }
  }, [isSupported, state.isRecording]);

  // Stop recording
  const stopRecording = useCallback(() => {
    setState(prev => ({
      ...prev,
      isRecording: false,
      isProcessing: true
    }));

    // Stop timer
    if (timerRef.current) {
      clearInterval(timerRef.current);
      timerRef.current = null;
    }

    // Stop MediaRecorder
    if (mediaRecorderRef.current && mediaRecorderRef.current.state === 'recording') {
      mediaRecorderRef.current.stop();
    }

    // Stop Speech Recognition
    if (recognitionRef.current) {
      recognitionRef.current.stop();
    }

    // Process final result
    setTimeout(() => {
      setState(prev => ({
        ...prev,
        isProcessing: false
      }));
    }, 1000);
  }, []);

  // Clear state
  const clearTranscript = useCallback(() => {
    setState(prev => ({
      ...prev,
      transcript: null,
      error: null,
      duration: 0
    }));
  }, []);

  // Format time
  const formatDuration = useCallback((seconds: number) => {
    const mins = Math.floor(seconds / 60);
    const secs = seconds % 60;
    return `${mins.toString().padStart(2, '0')}:${secs.toString().padStart(2, '0')}`;
  }, []);

  return {
    ...state,
    isSupported: isSupported(),
    startRecording,
    stopRecording,
    clearTranscript,
    formatDuration,
  };
}

// Extend types for Speech Recognition support
declare global {
  interface Window {
    SpeechRecognition: typeof SpeechRecognition;
    webkitSpeechRecognition: typeof SpeechRecognition;
  }
}
