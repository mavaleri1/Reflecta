export class ElevenLabsService {
  private static readonly API_URL = 'https://api.elevenlabs.io/v1/text-to-speech';
  private static readonly VOICE_ID = '21m00Tcm4TlvDq8ikWAM'; // Rachel voice (default)
  private static readonly API_KEY = (import.meta as any).env?.VITE_ELEVENLABS_API_KEY || 'sk_2bb16beee6a3df0d469e10f8437bda772127b1ea61d01eee';

  static async textToSpeech(text: string): Promise<AudioBuffer | null> {
    console.log('🎤 ElevenLabs: Starting text-to-speech conversion');
    console.log('📝 Text:', text);
    console.log('🔑 API Key available:', !!this.API_KEY);

    if (!this.API_KEY) {
      console.error('❌ ElevenLabs API key not configured');
      return null;
    }

    if (!text.trim()) {
      console.error('❌ Empty text provided for TTS');
      return null;
    }

    try {
      console.log('📡 ElevenLabs: Making API request...');
      
      const response = await fetch(`${this.API_URL}/${this.VOICE_ID}`, {
        method: 'POST',
        headers: {
          'Accept': 'audio/mpeg',
          'Content-Type': 'application/json',
          'xi-api-key': this.API_KEY,
        },
        body: JSON.stringify({
          text: text,
          model_id: "eleven_multilingual_v2",
          output_format: "mp3_44100_128",
          voice_settings: {
            stability: 0.5,
            similarity_boost: 0.5,
            style: 0.0,
            use_speaker_boost: true
          }
        }),
      });

      console.log('📡 ElevenLabs Response Status:', response.status);

      if (!response.ok) {
        const errorText = await response.text();
        console.error('❌ ElevenLabs API Error:', errorText);
        return null;
      }

      const audioArrayBuffer = await response.arrayBuffer();
      console.log('✅ ElevenLabs: Audio received, size:', audioArrayBuffer.byteLength);

      // Convert to AudioBuffer for playback
      const audioContext = new (window.AudioContext || (window as any).webkitAudioContext)();
      const audioBuffer = await audioContext.decodeAudioData(audioArrayBuffer);
      
      console.log('🎵 ElevenLabs: Audio decoded successfully');
      return audioBuffer;

    } catch (error) {
      console.error('❌ ElevenLabs TTS error:', error);
      return null;
    }
  }

  static async playAudio(audioBuffer: AudioBuffer): Promise<void> {
    try {
      const audioContext = new (window.AudioContext || (window as any).webkitAudioContext)();
      const source = audioContext.createBufferSource();
      source.buffer = audioBuffer;
      source.connect(audioContext.destination);
      
      console.log('🔊 ElevenLabs: Playing audio');
      source.start();
      
      // Wait for audio to finish
      return new Promise((resolve) => {
        source.onended = () => {
          console.log('✅ ElevenLabs: Audio playback finished');
          resolve();
        };
      });
    } catch (error) {
      console.error('❌ ElevenLabs: Audio playback error:', error);
    }
  }

  static async speakText(text: string): Promise<void> {
    console.log('🗣️ ElevenLabs: Starting speech synthesis');
    
    const audioBuffer = await this.textToSpeech(text);
    if (audioBuffer) {
      await this.playAudio(audioBuffer);
    } else {
      console.log('⚠️ ElevenLabs: Using fallback speech synthesis');
      // Fallback to browser's built-in speech synthesis
      this.fallbackSpeechSynthesis(text);
    }
  }

  private static fallbackSpeechSynthesis(text: string): void {
    if ('speechSynthesis' in window) {
      const utterance = new SpeechSynthesisUtterance(text);
      utterance.lang = 'en-US';
      utterance.rate = 0.9;
      utterance.pitch = 1.0;
      utterance.volume = 0.8;
      
      console.log('🔊 Using browser fallback speech synthesis');
      speechSynthesis.speak(utterance);
    } else {
      console.warn('⚠️ Speech synthesis not supported in this browser');
    }
  }
}
