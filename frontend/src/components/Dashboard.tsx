// src/components/Dashboard.tsx - Fixed conditional rendering
import React, { useState } from 'react';
import { Heart, Mic, Activity, Wind, User, LogOut, Settings } from 'lucide-react';
import HeartRateMonitor from './HeartRateMonitor';
import AudioAnalysis from './AudioAnalysis';
import BreathingExercise from './BreathingExercise';
import { useHeartRate } from '../contexts/HeartRateContext';

interface User {
  email: string;
  type: 'patient' | 'caregiver' | 'professional';
  name: string;
}

interface DashboardProps {
  user: User | null;
  onLogout: () => void;
}

const Dashboard: React.FC<DashboardProps> = ({ user, onLogout }) => {
  const [activeTab, setActiveTab] = useState<'dashboard' | 'heart' | 'audio' | 'breathing'>('dashboard');
  const [showUserMenu, setShowUserMenu] = useState(false);
  const { currentBPM, status, isLoading } = useHeartRate();

  const tabs = [
    { id: 'dashboard', label: 'Dashboard', icon: Activity },
    { id: 'heart', label: 'Heart Rate', icon: Heart },
    { id: 'audio', label: 'Audio', icon: Mic },
    { id: 'breathing', label: 'Breathing', icon: Wind },
  ];

  const getUserTypeColor = (type: string) => {
    switch (type) {
      case 'patient': return 'bg-blue-100 text-blue-800';
      case 'caregiver': return 'bg-green-100 text-green-800';
      case 'professional': return 'bg-purple-100 text-purple-800';
      default: return 'bg-gray-100 text-gray-800';
    }
  };

  const getUserTypeLabel = (type: string) => {
    switch (type) {
      case 'patient': return 'Individual';
      case 'caregiver': return 'Caregiver';
      case 'professional': return 'Professional';
      default: return 'User';
    }
  };

  return (
    <div className="min-h-screen bg-gradient-to-br from-blue-50 to-indigo-100">
      {/* Header */}
      <header className="bg-white shadow-lg border-b border-gray-200">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
          <div className="flex justify-between items-center py-4">
            <div className="flex items-center space-x-3">
              <div className="w-10 h-10">
                <img
                  src="/brainstorm.png"
                  alt="CalmPulse Logo"
                  className="w-full h-full object-contain"
                />
              </div>
              <div>
                <h1 className="text-3xl font-bold" style={{ fontFamily: 'Orbitron, sans-serif', color: '#ff9ea7' }}>
  CalmPulse
</h1>

                <p className="text-sm text-gray-500">Emotion Detection for Autism Support</p>
              </div>
            </div>
            
            <div className="flex items-center space-x-4">
              {/* User Info */}
              {user && (
                <div className="flex items-center space-x-3">
                  <div className="text-right">
                    <p className="text-sm font-medium text-gray-900">{user.name}</p>
                    <p className={`text-xs px-2 py-1 rounded-full ${getUserTypeColor(user.type)}`}>
                      {getUserTypeLabel(user.type)}
                    </p>
                  </div>
                  
                  {/* User Menu */}
                  <div className="relative">
                    <button
                      onClick={() => setShowUserMenu(!showUserMenu)}
                      className="flex items-center space-x-2 p-2 rounded-lg hover:bg-gray-100 transition-colors"
                    >
                      <div className="w-8 h-8 bg-gray-300 rounded-full flex items-center justify-center">
                        <User className="h-4 w-4 text-gray-600" />
                      </div>
                    </button>
                    
                    {/* Dropdown Menu */}
                    {showUserMenu && (
                      <div className="absolute right-0 mt-2 w-48 bg-white rounded-lg shadow-lg border border-gray-200 py-1 z-50">
                        <div className="px-4 py-2 border-b border-gray-100">
                          <p className="text-sm font-medium text-gray-900">{user.name}</p>
                          <p className="text-xs text-gray-500">{user.email}</p>
                        </div>
                        <button className="flex items-center space-x-2 w-full px-4 py-2 text-sm text-gray-700 hover:bg-gray-100">
                          <Settings className="h-4 w-4" />
                          <span>Settings</span>
                        </button>
                        <button 
                          onClick={onLogout}
                          className="flex items-center space-x-2 w-full px-4 py-2 text-sm text-red-600 hover:bg-red-50"
                        >
                          <LogOut className="h-4 w-4" />
                          <span>Sign Out</span>
                        </button>
                      </div>
                    )}
                  </div>
                </div>
              )}
              
              {/* Status Indicator */}
              <div className="flex items-center space-x-2 px-3 py-1 rounded-full bg-green-500 text-white text-sm">
                <div className="w-2 h-2 rounded-full bg-green-200"></div>
                <span>Online</span>
              </div>
            </div>
          </div>
        </div>
      </header>

      {/* Navigation Tabs */}
      <nav className="bg-white shadow-sm border-b border-gray-200">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
          <div className="flex space-x-8">
            {tabs.map((tab) => {
              const Icon = tab.icon;
              return (
                <button
                  key={tab.id}
                  onClick={() => setActiveTab(tab.id as any)}
                  className={`flex items-center space-x-2 py-4 px-1 border-b-2 font-medium text-sm transition-colors ${
                    activeTab === tab.id
                      ? 'border-indigo-500 text-indigo-600'
                      : 'border-transparent text-gray-500 hover:text-gray-700 hover:border-gray-300'
                  }`}
                >
                  <Icon className="h-5 w-5" />
                  <span>{tab.label}</span>
                </button>
              );
            })}
          </div>
        </div>
      </nav>

      {/* Welcome Message - Only show on dashboard */}
      {user && activeTab === 'dashboard' && (
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-4">
          <div className="bg-gradient-to-r from-blue-500 to-purple-600 rounded-lg p-6 text-white">
            <h2 className="text-xl font-bold mb-2">
              Welcome back, {user.name}! 👋
            </h2>
            <p className="opacity-90">
              {user.type === 'patient' && "Let's monitor your emotional wellbeing today."}
              {user.type === 'caregiver' && "Ready to support your loved one's emotional health."}
              {user.type === 'professional' && "Access your patient monitoring dashboard."}
            </p>
          </div>
        </div>
      )}

      {/* Main Content */}
      <main className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-8">
        {/* Dashboard Tab */}
        {activeTab === 'dashboard' && (
          <div className="text-center">
            <div className="bg-white rounded-xl shadow-lg p-8 mb-8">
              <h2 className="text-3xl font-bold text-gray-900 mb-4">Current Feeling</h2>
              
              {/* Emotion Display */}
              <div className="flex justify-center mb-6">
                <div className="w-64 h-64 bg-gradient-to-r from-blue-400 to-blue-600 rounded-full flex items-center justify-center animate-pulse">
                  <div className="text-center text-white">
                    <div className="text-8xl mb-4">😐</div>
                    <div className="text-2xl font-bold">Neutral</div>
                  </div>
                </div>
              </div>
              
              <p className="text-gray-600 text-lg">
                Stable emotional state. Monitoring continues.
              </p>
              
              {/* Personalized Message */}
              <div className="mt-6 bg-blue-50 rounded-lg p-4">
                <p className="text-blue-800 text-sm">
                  {user?.type === 'patient' && "Your emotional state looks stable. Great job managing your wellbeing!"}
                  {user?.type === 'caregiver' && "The individual you're caring for appears to be in a stable emotional state."}
                  {user?.type === 'professional' && "Patient shows stable emotional indicators. Continue monitoring as needed."}
                </p>
              </div>
            </div>

            {/* Quick Stats */}
            <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
              <div className="bg-white rounded-lg shadow p-6">
                <div className="flex items-center">
                  <Heart className="h-8 w-8 text-red-500 mr-3" />
                  <div>
                    <p className="text-sm font-medium text-gray-600">Heart Rate</p>
                    <p className="text-2xl font-semibold text-gray-900">{currentBPM} BPM</p>
                    <p 
                      className={`text-xs ${
                        status === 'Normal' ? 'text-green-600' : status === 'High' ? 'text-yellow-600' : 'text-blue-600'
                      }`}
                    >
                      {status} range
                    </p>

                  </div>
                </div>
              </div>

              <div className="bg-white rounded-lg shadow p-6">
                <div className="flex items-center">
                  <Mic className="h-8 w-8 text-blue-500 mr-3" />
                  <div>
                    <p className="text-sm font-medium text-gray-600">Audio Status</p>
                    <p className="text-2xl font-semibold text-gray-900">Ready</p>
                    <p className="text-xs text-blue-600">Monitoring enabled</p>
                  </div>
                </div>
              </div>

              <div className="bg-white rounded-lg shadow p-6">
                <div className="flex items-center">
                  <Wind className="h-8 w-8 text-green-500 mr-3" />
                  <div>
                    <p className="text-sm font-medium text-gray-600">Breathing</p>
                    <p className="text-2xl font-semibold text-gray-900">Normal</p>
                    <p className="text-xs text-green-600">Relaxed state</p>
                  </div>
                </div>
              </div>
            </div>
          </div>
        )}

        {/* Heart Rate Tab */}
        {activeTab === 'heart' && (
          <HeartRateMonitor />
        )}

        {/* Audio Analysis Tab */}
        {activeTab === 'audio' && (
          <div>
            <AudioAnalysis />
            {user?.type === 'professional' && (
              <div className="mt-6 bg-purple-50 rounded-lg p-4">
                <p className="text-purple-800 text-sm">
                  <strong>Professional Features:</strong> Advanced speech pattern analysis and detailed reports available
                </p>
              </div>
            )}
          </div>
        )}

        {/* Breathing Exercise Tab */}
        {activeTab === 'breathing' && (
          <div>
            <BreathingExercise />
            {user?.type === 'caregiver' && (
              <div className="mt-6 bg-green-50 rounded-lg p-4">
                <p className="text-green-800 text-sm">
                  <strong>Caregiver Mode:</strong> Guide someone through breathing exercises with visual cues and simple instructions
                </p>
              </div>
            )}
          </div>
        )}
      </main>

      {/* Click outside to close user menu */}
      {showUserMenu && (
        <div 
          className="fixed inset-0 z-40" 
          onClick={() => setShowUserMenu(false)}
        ></div>
      )}
    </div>
  );
};

export default Dashboard;