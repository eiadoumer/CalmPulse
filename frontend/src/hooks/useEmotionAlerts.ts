import { useEffect } from 'react';
import { EmotionData } from '../types/index';

interface UseEmotionAlertsProps {
  emotion: EmotionData | null;
  onHighAnxiety?: () => void;
  onLowMood?: () => void;
  onNormalState?: () => void;
}

export const useEmotionAlerts = ({
  emotion,
  onHighAnxiety,
  onLowMood,
  onNormalState,
}: UseEmotionAlertsProps) => {
  useEffect(() => {
    if (!emotion) return;

    const isHighAnxiety = 
      emotion.emotion === 'Anxious' && 
      emotion.factors.high_bpm && 
      emotion.confidence > 0.7;

    const isLowMood = 
      emotion.emotion === 'Sad' && 
      emotion.factors.negative_sentiment;

    const isNormalState = 
      emotion.emotion === 'Happy' || 
      (emotion.emotion === 'Neutral' && emotion.confidence > 0.6);

    if (isHighAnxiety && onHighAnxiety) {
      onHighAnxiety();
    } else if (isLowMood && onLowMood) {
      onLowMood();
    } else if (isNormalState && onNormalState) {
      onNormalState();
    }
  }, [emotion, onHighAnxiety, onLowMood, onNormalState]);
};