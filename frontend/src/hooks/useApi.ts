// services/api.ts - Connected to FastAPI backend
import axios from 'axios';

const API_BASE_URL = 'http://localhost:8000';

const api = axios.create({
  baseURL: API_BASE_URL,
  timeout: 30000, // Increased timeout for audio processing
  headers: {
    'Content-Type': 'application/json',
  },
});

// Request interceptor for debugging
api.interceptors.request.use(
  (config) => {
    console.log(`API Request: ${config.method?.toUpperCase()} ${config.url}`);
    if (config.data instanceof FormData) {
      console.log('FormData request with file upload');
    }
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
    console.log(`API Response: ${response.status} ${response.statusText}`);
    return response.data;
  },
  (error) => {
    console.error('API Response Error:', error);
    if (error.response?.status === 500) {
      const errorMsg = error.response?.data?.detail || 'Server error. Please check if all Python dependencies are installed.';
      throw new Error(`Server Error: ${errorMsg}`);
    } else if (error.response?.status === 422) {
      throw new Error('Invalid request format. Please check your audio file.');
    } else if (error.response?.status === 404) {
      throw new Error('API endpoint not found. Please check if the FastAPI server is running.');
    } else if (error.code === 'ECONNABORTED') {
      throw new Error('Request timeout. Audio processing may take longer for large files.');
    } else if (error.code === 'ERR_NETWORK') {
      throw new Error('Cannot connect to server. Make sure the FastAPI server is running on http://localhost:8000');
    }
    throw error;
  }
);

// Types matching your FastAPI backend
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

interface BreathingPattern {
  id: string;
  name: string;
  description: string;
  inhale: number;
  hold: number;
  exhale: number;
  cycles: number;
  duration: number;
}

// API Service Class
export class EmotionService {
  // ==================== HEALTH & SYSTEM ====================
  
  async healthCheck(): Promise<{ status: string; timestamp: string }> {
    try {
      return await api.get('/health');
    } catch (error) {
      console.error('Backend health check failed:', error);
      throw new Error('FastAPI backend is not running. Please start it with: python main.py');
    }
  }

  async testConnection(): Promise<boolean> {
    try {
      await this.healthCheck();
      return true;
    } catch {
      return false;
    }
  }

  async getSystemStatus(): Promise<{
    api_status: string;
    features: {
      emotion_detection: boolean;
      heart_rate_monitoring: boolean;
      audio_analysis: boolean;
      breathing_exercises: boolean;
    };
  }> {
    try {
      await this.healthCheck();
      return {
        api_status: 'online',
        features: {
          emotion_detection: true,
          heart_rate_monitoring: true,
          audio_analysis: true,
          breathing_exercises: true,
        }
      };
    } catch {
      return {
        api_status: 'offline',
        features: {
          emotion_detection: false,
          heart_rate_monitoring: false,
          audio_analysis: false,
          breathing_exercises: false,
        }
      };
    }
  }

  // ==================== DASHBOARD ROUTES ====================
  
  async getDashboardStatus(): Promise<{
    emotion: string;
    emoji: string;
    confidence: number;
    timestamp: string;
    factors: any;
    current_bpm: number;
    high_bpm: boolean;
    breathing_recommended: boolean;
  }> {
    return api.get('/api/dashboard/status');
  }

  async triggerBreathingExercise(): Promise<{
    message: string;
    duration: number;
    cycles: number;
    instructions: string[];
  }> {
    return api.post('/api/dashboard/breathing/trigger');
  }

  // ==================== EMOTION ROUTES ====================

  async getCurrentEmotion(): Promise<EmotionData> {
    return api.get('/api/emotion/current');
  }

  async getEmotionRadarData(): Promise<{
    labels: string[];
    values: number[];
    raw_data: any;
  }> {
    return api.get('/api/emotion/radar');
  }

  // ==================== HEART RATE ROUTES ====================

  async getHeartRateData(): Promise<HeartRateStats> {
    return api.get('/api/heartrate/data');
  }

  async getCurrentHeartRate(): Promise<{
    bpm: number;
    status: string;
    timestamp: string;
    color: string;
    pulse_speed: string;
  }> {
    return api.get('/api/heartrate/current');
  }

  async getHeartRateInsights(): Promise<{
    current_bpm: number;
    status: string;
    insights: string[];
    recommendations: string[];
    comparison_to_average: number;
  }> {
    return api.get('/api/heartrate/insights');
  }

  async startHeartRateBreathing(): Promise<{
    message: string;
    type: string;
    duration: number;
    pattern: string;
    cycles: number;
    instructions: string[];
  }> {
    return api.post('/api/heartrate/breathing/start');
  }

  // ==================== AUDIO ANALYSIS ROUTES ====================

  async analyzeAudio(audioFile: File): Promise<AudioAnalysisResult> {
    console.log('Analyzing audio file:', {
      name: audioFile.name,
      size: audioFile.size,
      type: audioFile.type,
      lastModified: audioFile.lastModified
    });

    // Validate file before sending
    if (!audioFile.type.startsWith('audio/') && 
        !audioFile.name.match(/\.(wav|mp3|m4a|flac)$/i)) {
      throw new Error('Invalid audio file format. Please use WAV, MP3, M4A, or FLAC files.');
    }

    if (audioFile.size === 0) {
      throw new Error('Audio file is empty. Please select a valid audio file.');
    }

    if (audioFile.size > 50 * 1024 * 1024) { // 50MB limit
      throw new Error('Audio file is too large. Please use files smaller than 50MB.');
    }

    const formData = new FormData();
    formData.append('file', audioFile);
    
    try {
      const result = await api.post('/api/audio/analyze', formData, {
        headers: {
          'Content-Type': 'multipart/form-data',
        },
        timeout: 60000, // 60 seconds for audio processing
      });

      console.log('Audio analysis successful:', result);
      return result.data;
    } catch (error: any) {
      console.error('Audio analysis failed:', error);
      
      // More specific error messages
      if (error.message.includes('Server Error')) {
        throw new Error('Audio processing failed on server. Please check if speech_recognition, librosa, and other audio dependencies are installed.');
      } else if (error.message.includes('timeout')) {
        throw new Error('Audio processing timed out. Please try with a shorter audio file.');
      } else if (error.response?.status === 400) {
        throw new Error('Invalid audio file. Please ensure the file is not corrupted and is in a supported format.');
      }
      throw error;
    }
  }

  async getAudioVolumeData(): Promise<{
    data: any[];
    average_volume: number;
    max_volume: number;
    analysis: {
      high_volume_detected: boolean;
      volume_spikes: number;
      volume_pattern: string;
    };
  }> {
    return api.get('/api/audio/volume');
  }

  async startLiveRecording(): Promise<{
    session_id: string;
    message: string;
    max_duration: number;
    sample_rate: number;
    format: string;
  }> {
    return api.post('/api/audio/live-record');
  }

  async getAudioAnalysisPresets(): Promise<{
    presets: Array<{
      name: string;
      description: string;
      parameters: any;
    }>;
  }> {
    return api.get('/api/audio/presets');
  }

  // ==================== BREATHING EXERCISE ROUTES ====================

  async startBreathingSession(session: BreathingSession): Promise<{ 
    message: string; 
    duration: number;
    cycles: number;
    session_id: string; 
  }> {
    return api.post('/api/breathing/start', session);
  }

  async getBreathingPatterns(): Promise<{
    patterns: BreathingPattern[];
  }> {
    return api.get('/api/breathing/patterns');
  }

  async startBreathingPattern(patternId: string): Promise<{
    session_id: string;
    pattern: BreathingPattern;
    started_at: string;
    instructions: string[];
  }> {
    return api.post(`/api/breathing/session/${patternId}`);
  }

  async getBreathingProgress(sessionId: string): Promise<{
    session_id: string;
    completed_cycles: number;
    current_phase: string;
    time_remaining: number;
    heart_rate_change: number;
    effectiveness_score: number;
  }> {
    return api.get(`/api/breathing/progress/${sessionId}`);
  }

  // ==================== COMBINED DATA ROUTES ====================

  async getCombinedOverview(): Promise<{
    emotion: {
      current: string;
      emoji: string;
      confidence: number;
    };
    heart_rate: {
      current: number;
      status: string;
      average: number;
    };
    audio: {
      average_volume: number;
      last_analysis: string;
    };
    alerts: Array<{
      type: string;
      message: string;
    }>;
  }> {
    return api.get('/api/combined/overview');
  }

  async getAnalyticsTrends(): Promise<{
    time_range: string;
    heart_rate_trend: {
      hours: number[];
      values: number[];
      average: number;
    };
    emotion_trend: {
      hours: number[];
      emotions: string[];
      most_common: string;
    };
    correlations: {
      heart_rate_emotion: number;
      volume_emotion: number;
    };
  }> {
    return api.get('/api/analytics/trends');
  }

  // ==================== WEBSOCKET CONNECTIONS ====================

  connectWebSocket(onMessage: (data: any) => void, onError?: (error: Event) => void): WebSocket {
    const ws = new WebSocket(`ws://localhost:8000/ws/realtime`);
    
    ws.onopen = () => {
      console.log('WebSocket connected successfully');
    };

    ws.onmessage = (event) => {
      try {
        const data = JSON.parse(event.data);
        onMessage(data);
      } catch (error) {
        console.error('Failed to parse WebSocket message:', error);
      }
    };

    ws.onerror = (error) => {
      console.error('WebSocket error:', error);
      if (onError) onError(error);
    };

    ws.onclose = (event) => {
      console.log('WebSocket connection closed:', event.code, event.reason);
    };

    return ws;
  }

  // ==================== CONVENIENCE METHODS ====================

  // Method to get all data needed for main dashboard
  async getMainDashboardData(): Promise<{
    status: any;
    heartRate: any;
    emotion: any;
  }> {
    try {
      const [status, heartRate, emotion] = await Promise.all([
        this.getDashboardStatus(),
        this.getCurrentHeartRate(),
        this.getCurrentEmotion()
      ]);
      
      return { status, heartRate, emotion };
    } catch (error) {
      console.error('Failed to get main dashboard data:', error);
      throw error;
    }
  }

  // Method to get all data needed for heart rate page
  async getHeartRatePageData(): Promise<{
    current: any;
    data: any;
    insights: any;
  }> {
    try {
      const [current, data, insights] = await Promise.all([
        this.getCurrentHeartRate(),
        this.getHeartRateData(),
        this.getHeartRateInsights()
      ]);
      
      return { current, data, insights };
    } catch (error) {
      console.error('Failed to get heart rate page data:', error);
      throw error;
    }
  }

  // Method to get all data needed for emotion page
  async getEmotionPageData(): Promise<{
    emotion: any;
    radar: any;
  }> {
    try {
      const [emotion, radar] = await Promise.all([
        this.getCurrentEmotion(),
        this.getEmotionRadarData()
      ]);
      
      return { emotion, radar };
    } catch (error) {
      console.error('Failed to get emotion page data:', error);
      throw error;
    }
  }
}

// Export singleton instance
export const emotionService = new EmotionService();

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
  return emotion === 'Anxious' && factors?.high_bpm && factors?.repetition_alert;
};

export const getBpmStatus = (bpm: number): { status: string; color: string; message: string } => {
  if (bpm > 100) {
    return {
      status: 'High',
      color: '#ff4444',
      message: 'Heart rate is elevated. Consider relaxation techniques.'
    };
  } else if (bpm < 60) {
    return {
      status: 'Low',
      color: '#4444ff',
      message: 'Heart rate is low. This may be normal for athletes.'
    };
  } else {
    return {
      status: 'Normal',
      color: '#44ff44',
      message: 'Heart rate is in healthy range.'
    };
  }
};

export const getSentimentColor = (compound: number): string => {
  if (compound >= 0.1) return '#10b981'; // green
  if (compound <= -0.1) return '#ef4444'; // red
  return '#6b7280'; // gray
};

export const getSentimentLabel = (compound: number): string => {
  if (compound >= 0.1) return 'Positive';
  if (compound <= -0.1) return 'Negative';
  return 'Neutral';
};

// Export types for use in components
export type {
  AudioAnalysisResult,
  EmotionData,
  HeartRateData,
  HeartRateStats,
  BreathingSession,
  BreathingPattern,
};