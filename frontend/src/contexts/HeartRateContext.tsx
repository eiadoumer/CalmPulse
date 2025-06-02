// src/contexts/HeartRateContext.tsx
import React, { createContext, useContext, useState, useEffect } from 'react';
import { emotionService } from '../services/api';

interface HeartRateContextType {
  currentBPM: number;
  status: 'High' | 'Normal' | 'Low';
  isLoading: boolean;
  refreshHeartRate: () => Promise<void>;
}

const HeartRateContext = createContext<HeartRateContextType | undefined>(undefined);

export const useHeartRate = () => {
  const context = useContext(HeartRateContext);
  if (!context) {
    throw new Error('useHeartRate must be used within HeartRateProvider');
  }
  return context;
};

export const HeartRateProvider: React.FC<{ children: React.ReactNode }> = ({ children }) => {
  const [currentBPM, setCurrentBPM] = useState(0);
  const [status, setStatus] = useState<'High' | 'Normal' | 'Low'>('Normal');
  const [isLoading, setIsLoading] = useState(true);

  const getStatusFromBPM = (bpm: number) => {
    if (bpm > 100) return 'High';
    if (bpm < 60) return 'Low';
    return 'Normal';
  };

  const refreshHeartRate = async () => {
    try {
      const data = await emotionService.getCurrentHeartRate();
      setCurrentBPM(data.bpm);
      setStatus(getStatusFromBPM(data.bpm));
    } catch (error) {
      console.error('Failed to get heart rate:', error);
    } finally {
      setIsLoading(false);
    }
  };

  useEffect(() => {
    refreshHeartRate();
    const interval = setInterval(refreshHeartRate, 30000); // Update every 30s
    return () => clearInterval(interval);
  }, []);

  return (
    <HeartRateContext.Provider value={{ currentBPM, status, isLoading, refreshHeartRate }}>
      {children}
    </HeartRateContext.Provider>
  );
};
export default HeartRateProvider;