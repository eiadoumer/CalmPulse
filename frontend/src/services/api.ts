
import axios from 'axios';

import { useState, useEffect, useRef } from 'react';
const API_BASE_URL = 'http://localhost:8000';

const api = axios.create({
  baseURL: API_BASE_URL,
  timeout: 10000,
  headers: {
    'Content-Type': 'application/json',
  },
});

// Request interceptor for debugging
api.interceptors.request.use(
  (config) => {
    console.log(`API Request: ${config.method?.toUpperCase()} ${config.url}`);
    return config;
  },
  (error) => {
    console.error('API Request Error:', error);
    return Promise.reject(error);
  }
);

// Response interceptor for error handling
api.interceptors.response.use(
  (response) => {
    return response.data;
  },
  (error) => {
    console.error('API Response Error:', error);
    if (error.response?.status === 500) {
      throw new Error('Server error. Please try again later.');
    } else if (error.response?.status === 404) {
      throw new Error('Resource not found.');
    } else if (error.code === 'ECONNABORTED') {
      throw new Error('Request timeout. Please check your connection.');
    }
    throw error;
  }
);

// Types
interface EmotionData {
  emotion: string;
  emoji: string;
  confidence: number;
  timestamp: string;
  factors: {
    high_bpm: boolean;
    high_volume: boolean;
    repetition_alert: boolean;
    negative_sentiment: boolean;
  };
}

interface HeartRateData {
  timestamp: string;
  bpm: number;
  status: string;
}

interface HeartRateStats {
  data: HeartRateData[];
  current_bpm: number;
  average_bpm: number;
  max_bpm: number;
  min_bpm: number;
}

interface AudioAnalysisResult {
  transcript: string;
  sentiment_score: {
    neg: number;
    neu: number;
    pos: number;
    compound: number;
  };
  repetition_count: number;
  average_pitch: number;
  average_volume: number;
  word_frequency: Record<string, number>;
}

interface BreathingSession {
  duration?: number;
  cycles?: number;
}

// API Service Class
export class EmotionService {
  // Emotion endpoints
  async getCurrentEmotion(): Promise<EmotionData> {
    return api.get('/api/emotion/current');
  }

  // Heart rate endpoints
  async getHeartRateData(): Promise<HeartRateStats> {
    return api.get('/api/heartrate/data');
  }

  async getCurrentHeartRate(): Promise<{ bpm: number; status: string; timestamp: string }> {
    return api.get('/api/heartrate/current');
  }

  // Audio analysis endpoints
  async analyzeAudio(audioFile: File): Promise<AudioAnalysisResult> {
    const formData = new FormData();
    formData.append('file', audioFile);
    
    return api.post('/api/audio/analyze', formData, {
      headers: {
        'Content-Type': 'multipart/form-data',
      },
    });
  }

  async getAudioVolumeData(): Promise<{ data: any[]; average_volume: number; max_volume: number }> {
    return api.get('/api/audio/volume');
  }

  // Breathing session endpoints
  async startBreathingSession(session: BreathingSession): Promise<{ message: string; session_id: string }> {
    return api.post('/api/breathing/start', session);
  }

  // Health check
  async healthCheck(): Promise<{ status: string; timestamp: string }> {
    return api.get('/health');
  }
}

// Export singleton instance
export const emotionService = new EmotionService();



interface UseWebSocketReturn {
  isConnected: boolean;
  lastMessage: string | null;
  sendMessage: (message: string) => void;
  disconnect: () => void;
}

export const useWebSocket = (url: string): UseWebSocketReturn => {
  const [isConnected, setIsConnected] = useState(false);
  const [lastMessage, setLastMessage] = useState<string | null>(null);
  const ws = useRef<WebSocket | null>(null);
  const reconnectAttempts = useRef(0);
  const maxReconnectAttempts = 5;

  const connect = () => {
    try {
      ws.current = new WebSocket(url);
      
      ws.current.onopen = () => {
        console.log('WebSocket connected');
        setIsConnected(true);
        reconnectAttempts.current = 0;
      };

      ws.current.onmessage = (event) => {
        setLastMessage(event.data);
      };

      ws.current.onclose = (event) => {
        console.log('WebSocket disconnected:', event.code, event.reason);
        setIsConnected(false);
        
        // Auto-reconnect with exponential backoff
        if (reconnectAttempts.current < maxReconnectAttempts) {
          const delay = Math.pow(2, reconnectAttempts.current) * 1000;
          setTimeout(() => {
            reconnectAttempts.current++;
            connect();
          }, delay);
        }
      };

      ws.current.onerror = (error) => {
        console.error('WebSocket error:', error);
        setIsConnected(false);
      };
    } catch (error) {
      console.error('Failed to create WebSocket connection:', error);
      setIsConnected(false);
    }
  };

  useEffect(() => {
    connect();
    
    return () => {
      if (ws.current) {
        ws.current.close();
      }
    };
  }, [url]);

  const sendMessage = (message: string) => {
    if (ws.current?.readyState === WebSocket.OPEN) {
      ws.current.send(message);
    } else {
      console.warn('WebSocket is not connected');
    }
  };

  const disconnect = () => {
    if (ws.current) {
      ws.current.close();
    }
  };

  return {
    isConnected,
    lastMessage,
    sendMessage,
    disconnect,
  };
};

// Utility functions
export const formatTimestamp = (timestamp: string): string => {
  return new Date(timestamp).toLocaleString();
};

export const getEmotionColor = (emotion: string): string => {
  switch (emotion) {
    case 'Anxious':
      return 'red';
    case 'Sad':
      return 'blue';
    case 'Happy':
      return 'green';
    default:
      return 'gray';
  }
};

export const isHighRiskEmotion = (emotion: string, factors: any): boolean => {
  return emotion === 'Anxious' && factors.high_bpm && factors.repetition_alert;
};