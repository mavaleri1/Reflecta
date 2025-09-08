export interface SpeechToTextResult {
  transcript: string;
  confidence: number;
  isFinal: boolean;
}

export interface SpeechToTextOptions {
  language?: string;
  continuous?: boolean;
  interimResults?: boolean;
  maxAlternatives?: number;
}

export class SpeechToTextService {
  private recognition: SpeechRecognition | null = null;
  private isListening = false;
  private callbacks: {
    onResult?: (result: SpeechToTextResult) => void;
    onError?: (error: string) => void;
    onStart?: () => void;
    onEnd?: () => void;
  } = {};

  constructor() {
    this.initializeRecognition();
  }

  private initializeRecognition(): void {
    if (typeof window === 'undefined') return;

    const SpeechRecognition = window.SpeechRecognition || window.webkitSpeechRecognition;
    
    if (!SpeechRecognition) {
      console.warn('Speech Recognition not supported in this browser');
      return;
    }

    this.recognition = new SpeechRecognition();
    this.setupEventListeners();
  }

  private setupEventListeners(): void {
    if (!this.recognition) return;

    this.recognition.onresult = (event) => {
      const result = event.results[event.results.length - 1];
      const transcript = result[0].transcript;
      const confidence = result[0].confidence;
      const isFinal = result.isFinal;

      this.callbacks.onResult?.({
        transcript: transcript.trim(),
        confidence,
        isFinal
      });
    };

    this.recognition.onerror = (event) => {
      console.error('Speech recognition error:', event.error);
      this.callbacks.onError?.(this.getErrorMessage(event.error));
    };

    this.recognition.onstart = () => {
      this.isListening = true;
      this.callbacks.onStart?.();
    };

    this.recognition.onend = () => {
      this.isListening = false;
      this.callbacks.onEnd?.();
    };
  }

  private getErrorMessage(error: string): string {
    const errorMessages: Record<string, string> = {
      'no-speech': 'No speech detected. Try speaking louder.',
      'audio-capture': 'Failed to access microphone.',
      'not-allowed': 'Microphone access denied. Please allow microphone usage.',
      'network': 'Network error. Check your internet connection.',
      'aborted': 'Speech recognition aborted.',
      'language-not-supported': 'Selected language is not supported.',
      'service-not-allowed': 'Speech recognition service is unavailable.',
    };

    return errorMessages[error] || `Speech recognition error: ${error}`;
  }

  public startListening(options: SpeechToTextOptions = {}): Promise<string> {
    return new Promise((resolve, reject) => {
      if (!this.recognition) {
        reject(new Error('Speech Recognition is not supported in this browser'));
        return;
      }

      if (this.isListening) {
        reject(new Error('Speech recognition is already running'));
        return;
      }

      // Configure parameters
      this.recognition.continuous = options.continuous ?? true;
      this.recognition.interimResults = options.interimResults ?? true;
      this.recognition.lang = options.language ?? 'en-US';
      this.recognition.maxAlternatives = options.maxAlternatives ?? 1;

      let finalTranscript = '';

      // Set callbacks
      this.callbacks.onResult = (result) => {
        if (result.isFinal) {
          finalTranscript = result.transcript;
        }
      };

      this.callbacks.onError = (error) => {
        reject(new Error(error));
      };

      this.callbacks.onEnd = () => {
        resolve(finalTranscript);
      };

      try {
        this.recognition.start();
      } catch (error) {
        reject(new Error('Failed to start speech recognition'));
      }
    });
  }

  public stopListening(): void {
    if (this.recognition && this.isListening) {
      this.recognition.stop();
    }
  }

  public isSupported(): boolean {
    return !!(window.SpeechRecognition || window.webkitSpeechRecognition);
  }

  public getSupportedLanguages(): string[] {
    // Main supported languages
    return [
      'en-US', // English (US)
      'en-GB', // English (UK)
      'ru-RU', // Russian
      'es-ES', // Spanish
      'fr-FR', // French
      'de-DE', // German
      'it-IT', // Italian
      'pt-BR', // Portuguese (Brazil)
      'ja-JP', // Japanese
      'ko-KR', // Korean
      'zh-CN', // Chinese (Simplified)
    ];
  }

  public setLanguage(language: string): void {
    if (this.recognition) {
      this.recognition.lang = language;
    }
  }

  public destroy(): void {
    if (this.recognition) {
      this.recognition.stop();
      this.recognition = null;
    }
    this.callbacks = {};
    this.isListening = false;
  }
}

// Create singleton instance
export const speechToTextService = new SpeechToTextService();

// Extend types for Speech Recognition support
declare global {
  interface Window {
    SpeechRecognition: typeof SpeechRecognition;
    webkitSpeechRecognition: typeof SpeechRecognition;
  }
}
