interface MoodAnalysis {
  mood: number; // 1-5 scale
  confidence: number; // 0-1
  emotions: string[]; // ['happy', 'sad', 'anxious', etc.]
  topics: string[]; // extracted topics
}

interface AIResponse {
  response: string;
  moodAnalysis: MoodAnalysis;
}

const DEEPSEEK_API_URL = 'https://api.deepseek.com/v1/chat/completions';
const DEEPSEEK_API_KEY = (import.meta as any).env?.VITE_DEEPSEEK_API_KEY || '';

console.log('🔑 DeepSeek API Key check:', {
  fromEnv: (import.meta as any).env?.VITE_DEEPSEEK_API_KEY,
  using: DEEPSEEK_API_KEY,
  allEnvVars: (import.meta as any).env
});

export class DeepSeekService {
  private static async makeRequest(messages: any[]) {
    console.log('🤖 DeepSeek API Request:', {
      url: DEEPSEEK_API_URL,
      hasApiKey: !!DEEPSEEK_API_KEY,
      messages: messages
    });

    if (!DEEPSEEK_API_KEY) {
      console.error('❌ DeepSeek API key not configured');
      throw new Error('DeepSeek API key not configured');
    }

    const requestBody = {
      model: 'deepseek-chat',
      messages,
      temperature: 0.7,
      max_tokens: 1000,
    };

    console.log('📤 DeepSeek Request Body:', JSON.stringify(requestBody, null, 2));

    const response = await fetch(DEEPSEEK_API_URL, {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
        'Authorization': `Bearer ${DEEPSEEK_API_KEY}`,
      },
      body: JSON.stringify(requestBody),
    });

    console.log('📡 DeepSeek API Response Status:', response.status);

    if (!response.ok) {
      const errorText = await response.text();
      console.error('❌ DeepSeek API Error:', errorText);
      throw new Error(`DeepSeek API error: ${response.status} - ${errorText}`);
    }

    const result = await response.json();
    console.log('✅ DeepSeek API Success:', result);
    return result;
  }

  static async analyzeMoodAndRespond(userText: string): Promise<AIResponse> {
    console.log('🧠 Starting mood analysis for text:', userText);
    
    const systemPrompt = `You are a compassionate AI therapist and mood analyzer. Your task is to:

1. Analyze the emotional tone of the user's text
2. Provide a supportive, empathetic response
3. Return structured data about their mood

Respond in this EXACT JSON format:
{
  "response": "Your empathetic response to the user (2-3 sentences)",
  "moodAnalysis": {
    "mood": 1-5 (1=very negative, 2=negative, 3=neutral, 4=positive, 5=very positive),
    "confidence": 0.0-1.0 (how confident you are in the mood assessment),
    "emotions": ["emotion1", "emotion2", "emotion3"] (max 3 emotions detected),
    "topics": ["topic1", "topic2", "topic3"] (max 3 main topics mentioned)
  }
}

Be empathetic, supportive, and helpful. Focus on understanding their feelings and offering gentle guidance.`;

    const messages = [
      { role: 'system', content: systemPrompt },
      { role: 'user', content: userText }
    ];

    try {
      const result = await this.makeRequest(messages);
      const content = result.choices[0]?.message?.content;
      
      console.log('📝 Raw AI Response:', content);
      
      if (!content) {
        throw new Error('No response from DeepSeek');
      }

      // Parse JSON response
      const parsed = JSON.parse(content);
      console.log('🔍 Parsed AI Response:', parsed);
      
      // Validate the response structure
      if (!parsed.response || !parsed.moodAnalysis) {
        throw new Error('Invalid response format from DeepSeek');
      }

      console.log('✅ Mood Analysis Complete:', parsed.moodAnalysis);
      return parsed as AIResponse;
    } catch (error) {
      console.error('❌ DeepSeek API error:', error);
      console.error('❌ Error details:', {
        message: error instanceof Error ? error.message : 'Unknown error',
        stack: error instanceof Error ? error.stack : undefined,
        type: typeof error
      });
      
      // Fallback response if API fails
      console.log('🔄 Using fallback response due to API error');
      return {
        response: "Thank you for sharing your thoughts with me. I'm here to listen and help you reflect on your feelings.",
        moodAnalysis: {
          mood: 3,
          confidence: 0.5,
          emotions: ['neutral'],
          topics: ['general']
        }
      };
    }
  }
}
