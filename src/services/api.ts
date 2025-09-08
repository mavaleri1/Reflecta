import { 
  User, 
  ReflectionEntry, 
  AnalyticsData, 
  ChatMessage, 
  DailyQuestion,
  ApiResponse 
} from '../types';

// Base API configuration
const API_BASE_URL = process.env.REACT_APP_API_URL || 'http://localhost:3001/api';

class ApiService {
  private baseURL: string;

  constructor(baseURL: string = API_BASE_URL) {
    this.baseURL = baseURL;
  }

  private async request<T>(
    endpoint: string, 
    options: RequestInit = {}
  ): Promise<ApiResponse<T>> {
    try {
      const url = `${this.baseURL}${endpoint}`;
      const response = await fetch(url, {
        headers: {
          'Content-Type': 'application/json',
          ...options.headers,
        },
        ...options,
      });

      const data = await response.json();

      if (!response.ok) {
        return {
          success: false,
          error: data.message || 'An error occurred',
        };
      }

      return {
        success: true,
        data,
      };
    } catch (error) {
      return {
        success: false,
        error: error instanceof Error ? error.message : 'Network error',
      };
    }
  }

  // User endpoints
  async getCurrentUser(): Promise<ApiResponse<User>> {
    return this.request<User>('/user/me');
  }

  async updateUser(userData: Partial<User>): Promise<ApiResponse<User>> {
    return this.request<User>('/user/me', {
      method: 'PUT',
      body: JSON.stringify(userData),
    });
  }

  // Reflection entries endpoints
  async getReflectionEntries(
    userId: string, 
    startDate?: string, 
    endDate?: string
  ): Promise<ApiResponse<ReflectionEntry[]>> {
    const params = new URLSearchParams();
    if (startDate) params.append('startDate', startDate);
    if (endDate) params.append('endDate', endDate);
    
    return this.request<ReflectionEntry[]>(`/reflections/${userId}?${params}`);
  }

  async createReflectionEntry(entry: Omit<ReflectionEntry, 'id' | 'createdAt' | 'updatedAt'>): Promise<ApiResponse<ReflectionEntry>> {
    return this.request<ReflectionEntry>('/reflections', {
      method: 'POST',
      body: JSON.stringify(entry),
    });
  }

  async updateReflectionEntry(id: string, entry: Partial<ReflectionEntry>): Promise<ApiResponse<ReflectionEntry>> {
    return this.request<ReflectionEntry>(`/reflections/${id}`, {
      method: 'PUT',
      body: JSON.stringify(entry),
    });
  }

  async deleteReflectionEntry(id: string): Promise<ApiResponse<void>> {
    return this.request<void>(`/reflections/${id}`, {
      method: 'DELETE',
    });
  }

  // Analytics endpoints
  async getAnalytics(userId: string, period: 'week' | 'month' | 'year' = 'month'): Promise<ApiResponse<AnalyticsData>> {
    return this.request<AnalyticsData>(`/analytics/${userId}?period=${period}`);
  }

  // Daily questions endpoints
  async getDailyQuestions(): Promise<ApiResponse<DailyQuestion[]>> {
    return this.request<DailyQuestion[]>('/questions/daily');
  }

  async getTodaysQuestion(): Promise<ApiResponse<DailyQuestion>> {
    return this.request<DailyQuestion>('/questions/today');
  }

  // Chat endpoints
  async getChatHistory(userId: string, limit: number = 50): Promise<ApiResponse<ChatMessage[]>> {
    return this.request<ChatMessage[]>(`/chat/${userId}?limit=${limit}`);
  }

  async sendMessage(userId: string, message: string): Promise<ApiResponse<ChatMessage>> {
    return this.request<ChatMessage>('/chat/send', {
      method: 'POST',
      body: JSON.stringify({ userId, message }),
    });
  }
}

// Export singleton instance
export const apiService = new ApiService();
export default apiService;
