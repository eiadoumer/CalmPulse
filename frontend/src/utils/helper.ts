// src/utils/helpers.ts - Utility functions

import { EmotionState, EmotionData, HeartRateReading, SentimentScore } from '../types';

// ============================================================================
// TIME UTILITIES
// ============================================================================

export const formatTime = (seconds: number): string => {
  const mins = Math.floor(seconds / 60);
  const secs = seconds % 60;
  return `${mins}:${secs.toString().padStart(2, '0')}`;
};

export const formatTimestamp = (timestamp: string): string => {
  return new Date(timestamp).toLocaleString();
};

export const formatTimeAgo = (timestamp: string): string => {
  const now = new Date();
  const time = new Date(timestamp);
  const diffInSeconds = Math.floor((now.getTime() - time.getTime()) / 1000);
  
  if (diffInSeconds < 60) return `${diffInSeconds}s ago`;
  if (diffInSeconds < 3600) return `${Math.floor(diffInSeconds / 60)}m ago`;
  if (diffInSeconds < 86400) return `${Math.floor(diffInSeconds / 3600)}h ago`;
  return `${Math.floor(diffInSeconds / 86400)}d ago`;
};

export const getRelativeTime = (timestamp: string): string => {
  const rtf = new Intl.RelativeTimeFormat('en', { numeric: 'auto' });
  const now = new Date();
  const time = new Date(timestamp);
  const diffInSeconds = Math.floor((time.getTime() - now.getTime()) / 1000);
  
  if (Math.abs(diffInSeconds) < 60) return rtf.format(diffInSeconds, 'second');
  if (Math.abs(diffInSeconds) < 3600) return rtf.format(Math.floor(diffInSeconds / 60), 'minute');
  if (Math.abs(diffInSeconds) < 86400) return rtf.format(Math.floor(diffInSeconds / 3600), 'hour');
  return rtf.format(Math.floor(diffInSeconds / 86400), 'day');
};

// ============================================================================
// EMOTION UTILITIES
// ============================================================================

export const getEmotionColor = (emotion: EmotionState): string => {
  switch (emotion) {
    case 'Anxious': return '#ef4444'; // red-500
    case 'Sad': return '#3b82f6';     // blue-500
    case 'Happy': return '#10b981';   // green-500
    case 'Neutral': return '#6b7280'; // gray-500
    default: return '#6b7280';
  }
};

export const getEmotionColorClass = (emotion: EmotionState): string => {
  switch (emotion) {
    case 'Anxious': return 'text-red-600 bg-red-100';
    case 'Sad': return 'text-blue-600 bg-blue-100';
    case 'Happy': return 'text-green-600 bg-green-100';
    case 'Neutral': return 'text-gray-600 bg-gray-100';
    default: return 'text-gray-600 bg-gray-100';
  }
};

export const getEmotionGradient = (emotion: EmotionState): string => {
  switch (emotion) {
    case 'Anxious': return 'from-red-400 to-red-600';
    case 'Sad': return 'from-blue-400 to-blue-600';
    case 'Happy': return 'from-green-400 to-green-600';
    case 'Neutral': return 'from-gray-400 to-gray-600';
    default: return 'from-gray-400 to-gray-600';
  }
};

export const getEmotionDescription = (emotion: EmotionState): string => {
  switch (emotion) {
    case 'Anxious': return 'High stress or anxiety detected. Consider calming activities.';
    case 'Sad': return 'Low mood detected. Support and comfort may be helpful.';
    case 'Happy': return 'Positive mood detected. Great time for activities!';
    case 'Neutral': return 'Stable emotional state. Monitoring continues.';
    default: return 'Emotional state unknown.';
  }
};

export const isHighRiskEmotion = (emotion: EmotionData | null): boolean => {
  if (!emotion) return false;
  return emotion.emotion === 'Anxious' && 
         emotion.factors.high_bpm && 
         emotion.confidence > 0.7;
};

export const getEmotionPriority = (emotion: EmotionState): number => {
  switch (emotion) {
    case 'Anxious': return 4; // Highest priority
    case 'Sad': return 3;
    case 'Neutral': return 2;
    case 'Happy': return 1;   // Lowest priority (good state)
    default: return 0;
  }
};

// ============================================================================
// HEART RATE UTILITIES
// ============================================================================

export const getHeartRateStatus = (bpm: number): 'High' | 'Normal' | 'Low' => {
  if (bpm > 100) return 'High';
  if (bpm < 60) return 'Low';
  return 'Normal';
};

export const getHeartRateColor = (status: string): string => {
  switch (status) {
    case 'High': return 'text-red-600 bg-red-100';
    case 'Low': return 'text-blue-600 bg-blue-100';
    case 'Normal': return 'text-green-600 bg-green-100';
    default: return 'text-gray-600 bg-gray-100';
  }
};

export const isHeartRateAbnormal = (bpm: number): boolean => {
  return bpm > 100 || bpm < 60;
};

export const getHeartRateVariability = (readings: HeartRateReading[]): number => {
  if (readings.length < 2) return 0;
  
  const bpmValues = readings.map(r => r.bpm);
  const mean = bpmValues.reduce((sum, bpm) => sum + bpm, 0) / bpmValues.length;
  const variance = bpmValues.reduce((sum, bpm) => sum + Math.pow(bpm - mean, 2), 0) / bpmValues.length;
  
  return Math.sqrt(variance);
};

// ============================================================================
// AUDIO UTILITIES
// ============================================================================

export const getSentimentLabel = (compound: number): string => {
  if (compound >= 0.1) return 'Positive';
  if (compound <= -0.1) return 'Negative';
  return 'Neutral';
};

export const getSentimentColor = (compound: number): string => {
  if (compound >= 0.1) return 'text-green-600';
  if (compound <= -0.1) return 'text-red-600';
  return 'text-gray-600';
};

export const getSentimentIntensity = (compound: number): 'Low' | 'Medium' | 'High' => {
  const abs = Math.abs(compound);
  if (abs >= 0.6) return 'High';
  if (abs >= 0.3) return 'Medium';
  return 'Low';
};

export const formatAudioDuration = (seconds: number): string => {
  const mins = Math.floor(seconds / 60);
  const secs = Math.floor(seconds % 60);
  return `${mins}:${secs.toString().padStart(2, '0')}`;
};

export const analyzeRepetitionSeverity = (count: number): 'Low' | 'Medium' | 'High' => {
  if (count >= 5) return 'High';
  if (count >= 3) return 'Medium';
  return 'Low';
};

// ============================================================================
// DATA PROCESSING UTILITIES
// ============================================================================

export const smoothData = (data: number[], windowSize: number = 3): number[] => {
  const smoothed: number[] = [];
  
  for (let i = 0; i < data.length; i++) {
    const start = Math.max(0, i - Math.floor(windowSize / 2));
    const end = Math.min(data.length, i + Math.ceil(windowSize / 2));
    const slice = data.slice(start, end);
    const average = slice.reduce((sum, val) => sum + val, 0) / slice.length;
    smoothed.push(average);
  }
  
  return smoothed;
};

export const calculateTrend = (data: number[]): 'increasing' | 'decreasing' | 'stable' => {
  if (data.length < 2) return 'stable';
  
  const first = data[0];
  const last = data[data.length - 1];
  const threshold = Math.abs(first) * 0.1; // 10% change threshold
  
  if (last - first > threshold) return 'increasing';
  if (first - last > threshold) return 'decreasing';
  return 'stable';
};

export const normalizeValue = (value: number, min: number, max: number): number => {
  return (value - min) / (max - min);
};

export const clampValue = (value: number, min: number, max: number): number => {
  return Math.max(min, Math.min(max, value));
};

// ============================================================================
// VALIDATION UTILITIES
// ============================================================================

export const isValidAudioFile = (file: File): boolean => {
  const validTypes = ['audio/wav', 'audio/mpeg', 'audio/mp3', 'audio/m4a', 'audio/flac'];
  const validExtensions = ['.wav', '.mp3', '.m4a', '.flac'];
  
  return validTypes.includes(file.type) || 
         validExtensions.some(ext => file.name.toLowerCase().endsWith(ext));
};

export const isValidHeartRate = (bpm: number): boolean => {
  return bpm >= 30 && bpm <= 220; // Reasonable human heart rate range
};

export const isValidConfidence = (confidence: number): boolean => {
  return confidence >= 0 && confidence <= 1;
};

// ============================================================================
// FORMATTING UTILITIES
// ============================================================================

export const formatPercentage = (value: number, decimals: number = 1): string => {
  return `${(value * 100).toFixed(decimals)}%`;
};

export const formatNumber = (value: number, decimals: number = 2): string => {
  return value.toFixed(decimals);
};

export const formatFileSize = (bytes: number): string => {
  if (bytes === 0) return '0 Bytes';
  
  const k = 1024;
  const sizes = ['Bytes', 'KB', 'MB', 'GB'];
  const i = Math.floor(Math.log(bytes) / Math.log(k));
  
  return parseFloat((bytes / Math.pow(k, i)).toFixed(2)) + ' ' + sizes[i];
};

export const capitalizeFirst = (str: string): string => {
  return str.charAt(0).toUpperCase() + str.slice(1).toLowerCase();
};

export const truncateText = (text: string, maxLength: number): string => {
  if (text.length <= maxLength) return text;
  return text.slice(0, maxLength - 3) + '...';
};

// ============================================================================
// CHART DATA UTILITIES
// ============================================================================

export const prepareChartData = (data: any[], xKey: string, yKey: string) => {
  return data.map(item => ({
    ...item,
    [xKey]: new Date(item[xKey]).toLocaleTimeString('en-US', { 
      hour: '2-digit', 
      minute: '2-digit' 
    }),
  }));
};

export const generateRadarData = (emotion: EmotionData | null) => {
  if (!emotion) return [];
  
  return [
    { subject: 'Heart Rate', value: emotion.factors.high_bpm ? 1 : 0, fullMark: 1 },
    { subject: 'Volume', value: emotion.factors.high_volume ? 1 : 0, fullMark: 1 },
    { subject: 'Repetition', value: emotion.factors.repetition_alert ? 1 : 0, fullMark: 1 },
    { subject: 'Sentiment', value: emotion.factors.negative_sentiment ? 1 : 0, fullMark: 1 },
  ];
};

export const createSentimentChartData = (sentimentScore: SentimentScore) => {
  return [
    { name: 'Positive', value: sentimentScore.pos, color: '#10b981' },
    { name: 'Neutral', value: sentimentScore.neu, color: '#6b7280' },
    { name: 'Negative', value: sentimentScore.neg, color: '#ef4444' },
  ];
};

// ============================================================================
// ERROR HANDLING UTILITIES
// ============================================================================

export const getErrorMessage = (error: any): string => {
  if (typeof error === 'string') return error;
  if (error?.message) return error.message;
  if (error?.response?.data?.message) return error.response.data.message;
  return 'An unexpected error occurred';
};

export const isNetworkError = (error: any): boolean => {
  return error?.code === 'NETWORK_ERROR' || 
         error?.message?.includes('Network Error') ||
         error?.code === 'ECONNABORTED';
};

export const retryWithBackoff = async (
  fn: () => Promise<any>,
  maxAttempts: number = 3,
  baseDelay: number = 1000
): Promise<any> => {
  let attempt = 1;
  
  while (attempt <= maxAttempts) {
    try {
      return await fn();
    } catch (error) {
      if (attempt === maxAttempts) throw error;
      
      const delay = baseDelay * Math.pow(2, attempt - 1);
      await new Promise(resolve => setTimeout(resolve, delay));
      attempt++;
    }
  }
};

// ============================================================================
// DEVICE UTILITIES
// ============================================================================

export const isMobileDevice = (): boolean => {
  return /Mobi|Android/i.test(navigator.userAgent);
};

export const hasMediaDevices = (): boolean => {
  return !!(navigator.mediaDevices && navigator.mediaDevices.getUserMedia);
};

export const checkMicrophonePermission = async (): Promise<boolean> => {
  try {
    const result = await navigator.permissions.query({ name: 'microphone' as PermissionName });
    return result.state === 'granted';
  } catch {
    return false;
  }
};

// ============================================================================
// STORAGE UTILITIES
// ============================================================================

export const saveToLocalStorage = (key: string, value: any): void => {
  try {
    localStorage.setItem(key, JSON.stringify(value));
  } catch (error) {
    console.warn('Failed to save to localStorage:', error);
  }
};

export const loadFromLocalStorage = <T>(key: string, defaultValue: T): T => {
  try {
    const item = localStorage.getItem(key);
    return item ? JSON.parse(item) : defaultValue;
  } catch (error) {
    console.warn('Failed to load from localStorage:', error);
    return defaultValue;
  }
};

export const removeFromLocalStorage = (key: string): void => {
  try {
    localStorage.removeItem(key);
  } catch (error) {
    console.warn('Failed to remove from localStorage:', error);
  }
};

// ============================================================================
// NOTIFICATION UTILITIES
// ============================================================================

export const requestNotificationPermission = async (): Promise<boolean> => {
  if (!('Notification' in window)) return false;
  
  const permission = await Notification.requestPermission();
  return permission === 'granted';
};

export const showNotification = (title: string, options?: NotificationOptions): void => {
  if (Notification.permission === 'granted') {
    new Notification(title, {
      icon: '/favicon.ico',
      ...options,
    });
  }
};

// ============================================================================
// AUDIO UTILITIES
// ============================================================================

export const createAudioContext = (): AudioContext | null => {
  try {
    return new (window.AudioContext || (window as any).webkitAudioContext)();
  } catch {
    return null;
  }
};

export const analyzeAudioVolume = (audioBuffer: AudioBuffer): number => {
  const channelData = audioBuffer.getChannelData(0);
  let sum = 0;
  
  for (let i = 0; i < channelData.length; i++) {
    sum += Math.abs(channelData[i]);
  }
  
  return sum / channelData.length;
};

// ============================================================================
// BREATHING EXERCISE UTILITIES
// ============================================================================

export const calculateBreathingProgress = (
  currentPhase: string,
  timeRemaining: number,
  phaseDuration: number
): number => {
  return ((phaseDuration - timeRemaining) / phaseDuration) * 100;
};

export const getBreathingInstruction = (phase: string): string => {
  switch (phase) {
    case 'inhale': return 'Breathe in slowly through your nose...';
    case 'hold': return 'Hold your breath gently...';
    case 'exhale': return 'Breathe out slowly through your mouth...';
    case 'rest': return 'Rest and prepare for the next cycle...';
    default: return 'Follow the breathing pattern...';
  }
};

export const getBreathingPhaseColor = (phase: string): string => {
  switch (phase) {
    case 'inhale': return 'from-blue-400 to-blue-600';
    case 'hold': return 'from-yellow-400 to-yellow-600';
    case 'exhale': return 'from-green-400 to-green-600';
    case 'rest': return 'from-purple-400 to-purple-600';
    default: return 'from-gray-400 to-gray-600';
  }
};

// ============================================================================
// DEBOUNCE & THROTTLE UTILITIES
// ============================================================================

export const debounce = <T extends (...args: any[]) => any>(
  func: T,
  wait: number
): (...args: Parameters<T>) => void => {
  let timeout: NodeJS.Timeout;
  
  return (...args: Parameters<T>) => {
    clearTimeout(timeout);
    timeout = setTimeout(() => func(...args), wait);
  };
};

export const throttle = <T extends (...args: any[]) => any>(
  func: T,
  limit: number
): (...args: Parameters<T>) => void => {
  let inThrottle: boolean;
  
  return (...args: Parameters<T>) => {
    if (!inThrottle) {
      func(...args);
      inThrottle = true;
      setTimeout(() => inThrottle = false, limit);
    }
  };
};

// ============================================================================
// CONSTANTS
// ============================================================================

export const STORAGE_KEYS = {
  USER_SETTINGS: 'calmpulse_user_settings',
  BREATHING_PREFERENCES: 'calmpulse_breathing_prefs',
  HEART_RATE_HISTORY: 'calmpulse_hr_history',
  AUDIO_SETTINGS: 'calmpulse_audio_settings',
} as const;

export const DEFAULT_CHART_COLORS = [
  '#3b82f6', '#ef4444', '#10b981', '#f59e0b', '#8b5cf6', 
  '#06b6d4', '#f97316', '#84cc16', '#ec4899', '#6366f1'
];

export const EMOTION_EMOJIS = {
  'Anxious': '😰',
  'Sad': '😢',
  'Happy': '😊',
  'Neutral': '😐',
} as const;