// src/types/index.ts - Main type definitions

// ============================================================================
// EMOTION TYPES
// ============================================================================

export interface EmotionFactors {
    high_bpm: boolean;
    high_volume: boolean;
    repetition_alert: boolean;
    negative_sentiment: boolean;
  }
  
  export interface EmotionData {
    emotion: 'Anxious' | 'Sad' | 'Happy' | 'Neutral';
    emoji: string;
    confidence: number;
    timestamp: string;
    factors: EmotionFactors;
  }
  
  export type EmotionState = 'Anxious' | 'Sad' | 'Happy' | 'Neutral';
  
  // ============================================================================
  // HEART RATE TYPES
  // ============================================================================
  
  export interface HeartRateReading {
    timestamp: string;
    bpm: number;
    status: 'High' | 'Normal' | 'Low';
  }
  
  export interface HeartRateStats {
    data: HeartRateReading[];
    current_bpm: number;
    average_bpm: number;
    max_bpm: number;
    min_bpm: number;
  }
  
  export interface HeartRateThresholds {
    high: number;
    low: number;
  }
  
  // ============================================================================
  // AUDIO ANALYSIS TYPES
  // ============================================================================
  
  export interface SentimentScore {
    neg: number;
    neu: number;
    pos: number;
    compound: number;
  }
  
  export interface AudioAnalysisResult {
    transcript: string;
    sentiment_score: SentimentScore;
    repetition_count: number;
    average_pitch: number;
    average_volume: number;
    word_frequency: Record<string, number>;
  }
  
  export interface AudioRecordingState {
    isRecording: boolean;
    recordingTime: number;
    audioBlob: Blob | null;
    error: string | null;
  }
  
  export interface VolumeData {
    time_step: number;
    volume: number;
  }
  
  // ============================================================================
  // BREATHING EXERCISE TYPES
  // ============================================================================
  
  export type BreathingPhase = 'inhale' | 'hold' | 'exhale' | 'rest';
  
  export interface BreathingState {
    phase: BreathingPhase;
    timeRemaining: number;
    cycleCount: number;
    totalCycles: number;
    isActive: boolean;
    progress: number;
  }
  
  export interface BreathingSettings {
    inhaleTime: number;
    holdTime: number;
    exhaleTime: number;
    restTime: number;
    totalCycles: number;
  }
  
  export interface BreathingSession {
    duration?: number;
    cycles?: number;
  }
  
  export interface BreathingSessionResponse {
    message: string;
    session_id: string;
    duration: number;
    cycles: number;
  }
  
  // ============================================================================
  // API TYPES
  // ============================================================================
  
  export interface ApiResponse<T> {
    data: T;
    message?: string;
    status: number;
  }
  
  export interface ApiError {
    message: string;
    status: number;
    details?: string;
  }
  
  export interface WebSocketMessage {
    type: 'update' | 'error' | 'heartbeat';
    data?: any;
    timestamp: string;
  }
  
  // ============================================================================
  // UI COMPONENT TYPES
  // ============================================================================
  
  export interface TabItem {
    id: string;
    label: string;
    icon: React.ComponentType<any>;
    component?: React.ComponentType<any>;
  }
  
  export interface AlertConfig {
    type: 'success' | 'warning' | 'error' | 'info';
    title: string;
    message: string;
    duration?: number;
  }
  
  export interface ChartDataPoint {
    timestamp: string;
    value: number;
    label?: string;
  }
  
  export interface RadarChartData {
    subject: string;
    value: number;
    fullMark: number;
  }
  
  // ============================================================================
  // DASHBOARD TYPES
  // ============================================================================
  
  export type DashboardTab = 'dashboard' | 'heart' | 'audio' | 'breathing';
  
  export interface DashboardState {
    activeTab: DashboardTab;
    showBreathingModal: boolean;
    isLoading: boolean;
    error: string | null;
  }
  
  export interface ConnectionState {
    isConnected: boolean;
    lastSeen: string | null;
    reconnectAttempts: number;
  }
  
  // ============================================================================
  // SETTINGS TYPES
  // ============================================================================
  
  export interface UserSettings {
    notifications: {
      enabled: boolean;
      highAnxiety: boolean;
      lowMood: boolean;
      heartRateAlerts: boolean;
    };
    breathing: BreathingSettings;
    heartRate: HeartRateThresholds;
    audio: {
      autoAnalyze: boolean;
      recordingQuality: 'low' | 'medium' | 'high';
    };
    ui: {
      theme: 'light' | 'dark' | 'auto';
      animations: boolean;
      compactMode: boolean;
    };
  }
  
  // ============================================================================
  // UTILITY TYPES
  // ============================================================================
  
  export type LoadingState = 'idle' | 'loading' | 'success' | 'error';
  
  export interface TimestampedData {
    timestamp: string;
    [key: string]: any;
  }
  
  export type EmotionColor = 'red' | 'blue' | 'green' | 'gray';
  
  export interface ColorScheme {
    primary: string;
    secondary: string;
    background: string;
    text: string;
  }
  
  // ============================================================================
  // FORM TYPES
  // ============================================================================
  
  export interface FormError {
    field: string;
    message: string;
  }
  
  export interface FormState<T> {
    data: T;
    errors: FormError[];
    isSubmitting: boolean;
    isDirty: boolean;
  }
  
  // ============================================================================
  // EVENT TYPES
  // ============================================================================
  
  export interface EmotionEvent {
    type: 'emotion_change';
    data: EmotionData;
    timestamp: string;
  }
  
  export interface HeartRateEvent {
    type: 'heart_rate_update';
    data: HeartRateReading;
    timestamp: string;
  }
  
  export interface AudioEvent {
    type: 'audio_analyzed';
    data: AudioAnalysisResult;
    timestamp: string;
  }
  
  export type AppEvent = EmotionEvent | HeartRateEvent | AudioEvent;
  
  // ============================================================================
  // COMPONENT PROP TYPES
  // ============================================================================
  
  export interface EmotionDisplayProps {
    emotion: EmotionData | null;
    onStartBreathing: () => void;
    className?: string;
  }
  
  export interface HeartRateMonitorProps {
    realTime?: boolean;
    showHistory?: boolean;
    onThresholdExceeded?: (reading: HeartRateReading) => void;
  }
  
  export interface AudioAnalysisProps {
    onAnalysisComplete?: (result: AudioAnalysisResult) => void;
    autoStart?: boolean;
  }
  
  export interface BreathingExerciseProps {
    onClose?: () => void;
    onComplete?: () => void;
    settings?: Partial<BreathingSettings>;
  }
  
  // ============================================================================
  // HOOK RETURN TYPES
  // ============================================================================
  
  export interface UseWebSocketReturn {
    isConnected: boolean;
    lastMessage: string | null;
    sendMessage: (message: string) => void;
    disconnect: () => void;
    reconnect: () => void;
  }
  
  export interface UseAudioRecorderReturn {
    isRecording: boolean;
    recordingTime: number;
    audioBlob: Blob | null;
    startRecording: () => Promise<void>;
    stopRecording: () => void;
    clearRecording: () => void;
    error: string | null;
  }
  
  // ============================================================================
  // CONSTANTS
  // ============================================================================
  
  export const EMOTION_COLORS: Record<EmotionState, string> = {
    'Anxious': '#ef4444',
    'Sad': '#3b82f6',
    'Happy': '#10b981',
    'Neutral': '#6b7280',
  };
  
  export const HEART_RATE_THRESHOLDS = {
    HIGH: 100,
    LOW: 60,
  } as const;
  
  export const BREATHING_DEFAULTS: BreathingSettings = {
    inhaleTime: 4,
    holdTime: 4,
    exhaleTime: 6,
    restTime: 2,
    totalCycles: 5,
  };
  
  export const API_ENDPOINTS = {
    EMOTION_CURRENT: '/api/emotion/current',
    HEART_RATE_DATA: '/api/heartrate/data',
    HEART_RATE_CURRENT: '/api/heartrate/current',
    AUDIO_ANALYZE: '/api/audio/analyze',
    AUDIO_VOLUME: '/api/audio/volume',
    BREATHING_START: '/api/breathing/start',
    HEALTH_CHECK: '/health',
    AUDIO_ANALYZE_SIMPLE:'/api/audio/analyze-simple'
  } as const;