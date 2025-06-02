import React, { useEffect, useState } from 'react';
import { AlertCircle, Heart, Volume2, RotateCcw, TrendingUp } from 'lucide-react';

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

interface EmotionDisplayProps {
  emotion: EmotionData | null;
  onStartBreathing: () => void;
}

const EmotionDisplay: React.FC<EmotionDisplayProps> = ({ emotion, onStartBreathing }) => {
  const [isAnimating, setIsAnimating] = useState(false);

  useEffect(() => {
    if (emotion) {
      setIsAnimating(true);
      const timer = setTimeout(() => setIsAnimating(false), 1000);
      return () => clearTimeout(timer);
    }
  }, [emotion]);

  const getEmotionColor = (emotionType: string) => {
    switch (emotionType) {
      case 'Anxious':
        return 'from-red-400 to-red-600';
      case 'Sad':
        return 'from-blue-400 to-blue-600';
      case 'Happy':
        return 'from-green-400 to-green-600';
      default:
        return 'from-gray-400 to-gray-600';
    }
  };

  const getEmotionDescription = (emotionType: string) => {
    switch (emotionType) {
      case 'Anxious':
        return 'High stress or anxiety detected. Consider calming activities.';
      case 'Sad':
        return 'Low mood detected. Support and comfort may be helpful.';
      case 'Happy':
        return 'Positive mood detected. Great time for activities!';
      default:
        return 'Stable emotional state. Monitoring continues.';
    }
  };

  if (!emotion) {
    return (
      <div className="bg-white rounded-xl shadow-lg p-8 text-center">
        <div className="animate-pulse">
          <div className="w-32 h-32 bg-gray-200 rounded-full mx-auto mb-4"></div>
          <div className="h-8 bg-gray-200 rounded w-48 mx-auto mb-2"></div>
          <div className="h-4 bg-gray-200 rounded w-64 mx-auto"></div>
        </div>
      </div>
    );
  }

  const isHighRisk = emotion.emotion === 'Anxious' && emotion.factors.high_bpm;

  return (
    <div className={`bg-white rounded-xl shadow-lg overflow-hidden ${isHighRisk ? 'ring-2 ring-red-500' : ''}`}>
      {/* Header */}
      <div className={`bg-gradient-to-r ${getEmotionColor(emotion.emotion)} p-6 text-white`}>
        <div className="flex items-center justify-between">
          <div>
            <h2 className="text-2xl font-bold mb-1">Current Feeling</h2>
            <p className="text-white/80 text-sm">
              Last updated: {new Date(emotion.timestamp).toLocaleTimeString()}
            </p>
          </div>
          <div className="text-right">
            <div className="text-sm opacity-80">Confidence</div>
            <div className="text-xl font-semibold">{Math.round(emotion.confidence * 100)}%</div>
          </div>
        </div>
      </div>

      {/* Main Emotion Display */}
      <div className="p-8 text-center">
        <div className={`inline-block ${isAnimating ? 'animate-pulse' : ''}`}>
          <div className={`text-8xl mb-4 transition-transform duration-500 ${
            isAnimating ? 'scale-110' : 'scale-100'
          }`}>
            {emotion.emoji}
          </div>
          <h3 className="text-3xl font-bold text-gray-900 mb-2">{emotion.emotion}</h3>
          <p className="text-gray-600 text-lg max-w-md mx-auto">
            {getEmotionDescription(emotion.emotion)}
          </p>
        </div>
      </div>

      {/* Factors Analysis */}
      <div className="px-8 pb-6">
        <h4 className="text-lg font-semibold text-gray-900 mb-4">Detection Factors</h4>
        <div className="grid grid-cols-2 gap-4">
          <div className={`p-3 rounded-lg border-2 ${
            emotion.factors.high_bpm 
              ? 'bg-red-50 border-red-200' 
              : 'bg-gray-50 border-gray-200'
          }`}>
            <div className="flex items-center space-x-2">
              <Heart className={`h-5 w-5 ${
                emotion.factors.high_bpm ? 'text-red-600' : 'text-gray-400'
              }`} />
              <span className={`font-medium ${
                emotion.factors.high_bpm ? 'text-red-900' : 'text-gray-600'
              }`}>
                Heart Rate
              </span>
            </div>
            <p className="text-sm mt-1 text-gray-600">
              {emotion.factors.high_bpm ? 'Elevated (>100 BPM)' : 'Normal range'}
            </p>
          </div>

          <div className={`p-3 rounded-lg border-2 ${
            emotion.factors.high_volume 
              ? 'bg-orange-50 border-orange-200' 
              : 'bg-gray-50 border-gray-200'
          }`}>
            <div className="flex items-center space-x-2">
              <Volume2 className={`h-5 w-5 ${
                emotion.factors.high_volume ? 'text-orange-600' : 'text-gray-400'
              }`} />
              <span className={`font-medium ${
                emotion.factors.high_volume ? 'text-orange-900' : 'text-gray-600'
              }`}>
                Voice Volume
              </span>
            </div>
            <p className="text-sm mt-1 text-gray-600">
              {emotion.factors.high_volume ? 'Above average' : 'Normal levels'}
            </p>
          </div>

          <div className={`p-3 rounded-lg border-2 ${
            emotion.factors.repetition_alert 
              ? 'bg-yellow-50 border-yellow-200' 
              : 'bg-gray-50 border-gray-200'
          }`}>
            <div className="flex items-center space-x-2">
              <RotateCcw className={`h-5 w-5 ${
                emotion.factors.repetition_alert ? 'text-yellow-600' : 'text-gray-400'
              }`} />
              <span className={`font-medium ${
                emotion.factors.repetition_alert ? 'text-yellow-900' : 'text-gray-600'
              }`}>
                Speech Pattern
              </span>
            </div>
            <p className="text-sm mt-1 text-gray-600">
              {emotion.factors.repetition_alert ? 'Repetitive words detected' : 'Normal speech'}
            </p>
          </div>

          <div className={`p-3 rounded-lg border-2 ${
            emotion.factors.negative_sentiment 
              ? 'bg-blue-50 border-blue-200' 
              : 'bg-gray-50 border-gray-200'
          }`}>
            <div className="flex items-center space-x-2">
              <TrendingUp className={`h-5 w-5 ${
                emotion.factors.negative_sentiment ? 'text-blue-600' : 'text-gray-400'
              }`} />
              <span className={`font-medium ${
                emotion.factors.negative_sentiment ? 'text-blue-900' : 'text-gray-600'
              }`}>
                Sentiment
              </span>
            </div>
            <p className="text-sm mt-1 text-gray-600">
              {emotion.factors.negative_sentiment ? 'Negative tone' : 'Neutral/positive'}
            </p>
          </div>
        </div>
      </div>

      {/* Action Buttons */}
      {isHighRisk && (
        <div className="bg-red-50 border-t border-red-200 p-6">
          <div className="flex items-center justify-between">
            <div className="flex items-center space-x-3">
              <AlertCircle className="h-6 w-6 text-red-600" />
              <div>
                <h4 className="font-medium text-red-900">High Anxiety Alert</h4>
                <p className="text-sm text-red-700">Immediate support recommended</p>
              </div>
            </div>
            <button
              onClick={onStartBreathing}
              className="bg-red-600 hover:bg-red-700 text-white px-6 py-2 rounded-lg font-medium transition-colors"
            >
              Start Breathing Exercise
            </button>
          </div>
        </div>
      )}

      {/* Confidence Meter */}
      <div className="px-8 pb-6">
        <div className="flex items-center justify-between mb-2">
          <span className="text-sm font-medium text-gray-700">Detection Confidence</span>
          <span className="text-sm text-gray-600">{Math.round(emotion.confidence * 100)}%</span>
        </div>
        <div className="w-full bg-gray-200 rounded-full h-2">
          <div
            className={`h-2 rounded-full transition-all duration-500 bg-gradient-to-r ${getEmotionColor(emotion.emotion)}`}
            style={{ width: `${emotion.confidence * 100}%` }}
          ></div>
        </div>
        <p className="text-xs text-gray-500 mt-2">
          Based on physiological and behavioral indicators
        </p>
      </div>
    </div>
  );
};

export default EmotionDisplay;