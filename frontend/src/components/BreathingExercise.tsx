import React, { useState, useEffect, useCallback } from 'react';
import { Wind, Play, Pause, RotateCcw, X, Settings, Heart } from 'lucide-react';

interface BreathingExerciseProps {
  onClose?: () => void;
}

interface BreathingState {
  phase: 'inhale' | 'hold' | 'exhale' | 'rest';
  timeRemaining: number;
  cycleCount: number;
  totalCycles: number;
  isActive: boolean;
  progress: number;
}

const BreathingExercise: React.FC<BreathingExerciseProps> = ({ onClose }) => {
  const [breathingState, setBreathingState] = useState<BreathingState>({
    phase: 'inhale',
    timeRemaining: 4,
    cycleCount: 0,
    totalCycles: 5,
    isActive: false,
    progress: 0,
  });

  const [settings, setSettings] = useState({
    inhaleTime: 4,
    holdTime: 4,
    exhaleTime: 6,
    restTime: 2,
    totalCycles: 5,
  });

  const [showSettings, setShowSettings] = useState(false);
  const [completedCycles, setCompletedCycles] = useState(0);

  const phases = {
    inhale: { duration: settings.inhaleTime, next: 'hold', instruction: 'Breathe in slowly...', color: 'from-blue-400 to-blue-600' },
    hold: { duration: settings.holdTime, next: 'exhale', instruction: 'Hold your breath...', color: 'from-yellow-400 to-yellow-600' },
    exhale: { duration: settings.exhaleTime, next: 'rest', instruction: 'Breathe out slowly...', color: 'from-green-400 to-green-600' },
    rest: { duration: settings.restTime, next: 'inhale', instruction: 'Rest and prepare...', color: 'from-purple-400 to-purple-600' },
  };

  const getCurrentPhase = () => phases[breathingState.phase];

  const nextPhase = useCallback(() => {
    setBreathingState(prev => {
      const currentPhase = phases[prev.phase];
      const nextPhaseName = currentPhase.next as keyof typeof phases;
      const nextPhase = phases[nextPhaseName];
      
      let newCycleCount = prev.cycleCount;
      
      // If completing a full cycle (exhale -> rest)
      if (prev.phase === 'exhale' && nextPhaseName === 'rest') {
        newCycleCount += 1;
        setCompletedCycles(newCycleCount);
        
        // Check if we've completed all cycles
        if (newCycleCount >= prev.totalCycles) {
          return {
            ...prev,
            phase: nextPhaseName,
            timeRemaining: nextPhase.duration,
            cycleCount: newCycleCount,
            isActive: false,
            progress: 100,
          };
        }
      }
      
      return {
        ...prev,
        phase: nextPhaseName,
        timeRemaining: nextPhase.duration,
        cycleCount: newCycleCount,
      };
    });
  }, [phases]);

  const tick = useCallback(() => {
    setBreathingState(prev => {
      if (!prev.isActive) return prev;
      
      const newTimeRemaining = prev.timeRemaining - 0.1;
      const currentPhase = phases[prev.phase];
      const progress = ((currentPhase.duration - newTimeRemaining) / currentPhase.duration) * 100;
      
      if (newTimeRemaining <= 0) {
        // Move to next phase
        setTimeout(nextPhase, 100);
        return prev;
      }
      
      return {
        ...prev,
        timeRemaining: newTimeRemaining,
        progress: Math.max(0, Math.min(100, progress)),
      };
    });
  }, [phases, nextPhase]);

  useEffect(() => {
    let interval: NodeJS.Timeout;
    
    if (breathingState.isActive) {
      interval = setInterval(tick, 100);
    }
    
    return () => {
      if (interval) clearInterval(interval);
    };
  }, [breathingState.isActive, tick]);

  const startExercise = () => {
    setBreathingState(prev => ({
      ...prev,
      isActive: true,
      phase: 'inhale',
      timeRemaining: settings.inhaleTime,
      cycleCount: 0,
      progress: 0,
    }));
    setCompletedCycles(0);
  };

  const pauseExercise = () => {
    setBreathingState(prev => ({ ...prev, isActive: false }));
  };

  const resumeExercise = () => {
    setBreathingState(prev => ({ ...prev, isActive: true }));
  };

  const resetExercise = () => {
    setBreathingState({
      phase: 'inhale',
      timeRemaining: settings.inhaleTime,
      cycleCount: 0,
      totalCycles: settings.totalCycles,
      isActive: false,
      progress: 0,
    });
    setCompletedCycles(0);
  };

  const isCompleted = completedCycles >= settings.totalCycles;
  const currentPhase = getCurrentPhase();

  return (
    <div className="max-w-lg mx-auto">
      {/* Header */}
      <div className="flex items-center justify-between p-6 border-b border-gray-200">
        <div className="flex items-center space-x-3">
          <div className="p-2 bg-blue-100 rounded-lg">
            <Wind className="h-6 w-6 text-blue-600" />
          </div>
          <div>
            <h2 className="text-xl font-semibold text-gray-900">Breathing Exercise</h2>
            <p className="text-sm text-gray-600">Guided relaxation technique</p>
          </div>
        </div>
        
        <div className="flex items-center space-x-2">
          <button
            onClick={() => setShowSettings(!showSettings)}
            className="p-2 text-gray-400 hover:text-gray-600 transition-colors"
          >
            <Settings className="h-5 w-5" />
          </button>
          {onClose &&  (
            <button
              onClick={onClose}
              className="p-2 text-gray-400 hover:text-gray-600 transition-colors"
            >
              <X className="h-5 w-5" />
            </button>
          )}
        </div>
      </div>

      {/* Settings Panel */}
      {showSettings && (
        <div className="p-6 bg-gray-50 border-b border-gray-200">
          <h3 className="text-lg font-medium text-gray-900 mb-4">Exercise Settings</h3>
          <div className="grid grid-cols-2 gap-4">
            <div>
              <label className="block text-sm font-medium text-gray-700 mb-1">
                Inhale (seconds)
              </label>
              <input
                type="number"
                min="2"
                max="10"
                value={settings.inhaleTime}
                onChange={(e) => setSettings(prev => ({ ...prev, inhaleTime: parseInt(e.target.value) }))}
                className="w-full px-3 py-2 border border-gray-300 rounded-md focus:outline-none focus:ring-2 focus:ring-blue-500"
              />
            </div>
            <div>
              <label className="block text-sm font-medium text-gray-700 mb-1">
                Hold (seconds)
              </label>
              <input
                type="number"
                min="2"
                max="10"
                value={settings.holdTime}
                onChange={(e) => setSettings(prev => ({ ...prev, holdTime: parseInt(e.target.value) }))}
                className="w-full px-3 py-2 border border-gray-300 rounded-md focus:outline-none focus:ring-2 focus:ring-blue-500"
              />
            </div>
            <div>
              <label className="block text-sm font-medium text-gray-700 mb-1">
                Exhale (seconds)
              </label>
              <input
                type="number"
                min="2"
                max="10"
                value={settings.exhaleTime}
                onChange={(e) => setSettings(prev => ({ ...prev, exhaleTime: parseInt(e.target.value) }))}
                className="w-full px-3 py-2 border border-gray-300 rounded-md focus:outline-none focus:ring-2 focus:ring-blue-500"
              />
            </div>
            <div>
              <label className="block text-sm font-medium text-gray-700 mb-1">
                Total Cycles
              </label>
              <input
                type="number"
                min="3"
                max="20"
                value={settings.totalCycles}
                onChange={(e) => setSettings(prev => ({ ...prev, totalCycles: parseInt(e.target.value) }))}
                className="w-full px-3 py-2 border border-gray-300 rounded-md focus:outline-none focus:ring-2 focus:ring-blue-500"
              />
            </div>
          </div>
        </div>
      )}

      {/* Main Exercise Area */}
      <div className="p-8">
        {/* Progress Indicator */}
        <div className="mb-8">
          <div className="flex justify-between text-sm text-gray-600 mb-2">
            <span>Cycle {completedCycles + 1} of {settings.totalCycles}</span>
            <span>{isCompleted ? 'Complete!' : currentPhase.instruction}</span>
          </div>
          <div className="w-full bg-gray-200 rounded-full h-2">
            <div
              className="h-2 rounded-full bg-gradient-to-r from-blue-500 to-green-500 transition-all duration-300"
              style={{ 
                width: `${(completedCycles / settings.totalCycles) * 100}%` 
              }}
            ></div>
          </div>
        </div>

        {/* Breathing Circle */}
        <div className="flex justify-center mb-8">
          <div className="relative">
            {/* Outer ring for progress */}
            <div className="w-64 h-64 rounded-full border-8 border-gray-200 relative overflow-hidden">
              <div
                className={`absolute inset-0 rounded-full border-8 border-transparent bg-gradient-to-r ${currentPhase.color} transition-all duration-300`}
                style={{
                  clipPath: `polygon(50% 50%, 50% 0%, ${
                    50 + (breathingState.progress / 100) * 50 * Math.cos((breathingState.progress / 100) * 2 * Math.PI - Math.PI / 2)
                  }% ${
                    50 + (breathingState.progress / 100) * 50 * Math.sin((breathingState.progress / 100) * 2 * Math.PI - Math.PI / 2)
                  }%, 50% 50%)`,
                }}
              ></div>
            </div>

            {/* Inner breathing circle */}
            <div
              className={`absolute inset-8 rounded-full bg-gradient-to-r ${currentPhase.color} flex items-center justify-center transition-all duration-300 ${
                breathingState.phase === 'inhale' ? 'scale-110' : 
                breathingState.phase === 'hold' ? 'scale-105' : 'scale-95'
              }`}
            >
              <div className="text-center text-white">
                <div className="text-4xl font-bold mb-2">
                  {Math.ceil(breathingState.timeRemaining)}
                </div>
                <div className="text-sm font-medium opacity-90">
                  {breathingState.phase.toUpperCase()}
                </div>
              </div>
            </div>
          </div>
        </div>

        {/* Instruction Text */}
        <div className="text-center mb-8">
          <h3 className="text-2xl font-semibold text-gray-900 mb-2">
            {isCompleted ? '🎉 Exercise Complete!' : currentPhase.instruction}
          </h3>
          {isCompleted && (
            <p className="text-gray-600">
              Great job! You've completed {settings.totalCycles} breathing cycles. 
              Your heart rate should begin to normalize.
            </p>
          )}
        </div>

        {/* Control Buttons */}
        <div className="flex justify-center space-x-4">
          {!breathingState.isActive && !isCompleted && (
            <button
              onClick={breathingState.cycleCount > 0 ? resumeExercise : startExercise}
              className="flex items-center space-x-2 bg-blue-600 hover:bg-blue-700 text-white px-6 py-3 rounded-lg font-medium transition-colors"
            >
              <Play className="h-5 w-5" />
              <span>{breathingState.cycleCount > 0 ? 'Resume' : 'Start Exercise'}</span>
            </button>
          )}

          {breathingState.isActive && (
            <button
              onClick={pauseExercise}
              className="flex items-center space-x-2 bg-yellow-600 hover:bg-yellow-700 text-white px-6 py-3 rounded-lg font-medium transition-colors"
            >
              <Pause className="h-5 w-5" />
              <span>Pause</span>
            </button>
          )}

          <button
            onClick={resetExercise}
            className="flex items-center space-x-2 bg-gray-600 hover:bg-gray-700 text-white px-6 py-3 rounded-lg font-medium transition-colors"
          >
            <RotateCcw className="h-5 w-5" />
            <span>Reset</span>
          </button>

          {isCompleted && onClose && (
            <button
              onClick={onClose}
              className="flex items-center space-x-2 bg-green-600 hover:bg-green-700 text-white px-6 py-3 rounded-lg font-medium transition-colors"
            >
              <Heart className="h-5 w-5" />
              <span>Done</span>
            </button>
          )}
        </div>

        {/* Tips */}
        <div className="mt-8 bg-blue-50 rounded-lg p-4">
          <h4 className="font-medium text-blue-900 mb-2">💡 Breathing Tips</h4>
          <ul className="text-sm text-blue-800 space-y-1">
            <li>• Find a comfortable, quiet position</li>
            <li>• Focus on your breath and try to clear your mind</li>
            <li>• If you feel dizzy, pause and breathe normally</li>
            <li>• Practice regularly for best results</li>
          </ul>
        </div>
      </div>
    </div>
  );
};

export default BreathingExercise;