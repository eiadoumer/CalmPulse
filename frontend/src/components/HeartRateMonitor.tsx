// src/components/HeartRateMonitor.tsx - With Recharts (Fixed)
import React, { useState, useEffect } from 'react';
import { Heart, Activity, TrendingUp, TrendingDown, Wind, RefreshCw, BarChart3 } from 'lucide-react';
import { LineChart, Line, XAxis, YAxis, CartesianGrid, Tooltip, ResponsiveContainer, ReferenceLine, Area, AreaChart, BarChart, Bar } from 'recharts';
import { emotionService } from '../services/api';

// Local interfaces for the component
interface LocalHeartRateData {
  timestamp: string;
  bpm: number;
  status: 'High' | 'Normal' | 'Low';
  time: string; // Formatted time for charts
}

interface LocalHeartRateStats {
  current_bpm: number;
  average_bpm: number;
  max_bpm: number;
  min_bpm: number;
  data: LocalHeartRateData[];
}

interface ChartDataPoint {
  time: string;
  bpm: number;
  status: string;
  timestamp: string;
  normalizedTime: number;
}

const HeartRateMonitor: React.FC = () => {
  const [heartRateData, setHeartRateData] = useState<LocalHeartRateStats | null>(null);
  const [isLoading, setIsLoading] = useState(true);
  const [isRefreshing, setIsRefreshing] = useState(false);
  const [showBreathingGuide, setShowBreathingGuide] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [backendStatus, setBackendStatus] = useState<'checking' | 'online' | 'offline'>('checking');
  const [chartView, setChartView] = useState<'line' | 'area' | 'histogram'>('area');

  // Helper function to normalize status from API
  const normalizeStatus = (status: string): 'High' | 'Normal' | 'Low' => {
    const normalizedStatus = status.toLowerCase();
    if (normalizedStatus === 'high') return 'High';
    if (normalizedStatus === 'low') return 'Low';
    return 'Normal';
  };

  // Helper function to determine status from BPM
  const getStatusFromBPM = (bpm: number): 'High' | 'Normal' | 'Low' => {
    if (bpm > 100) return 'High';
    if (bpm < 60) return 'Low';
    return 'Normal';
  };

  // Convert API response to local format with chart data
  const convertApiDataToLocal = (apiData: any): LocalHeartRateStats => {
    const convertedData: LocalHeartRateData[] = apiData.data.map((item: any) => {
      const timestamp = new Date(item.timestamp);
      return {
        timestamp: item.timestamp,
        bpm: item.bpm,
        status: item.status ? normalizeStatus(item.status) : getStatusFromBPM(item.bpm),
        time: timestamp.toLocaleTimeString('en-US', { 
          hour: '2-digit', 
          minute: '2-digit',
          hour12: false
        })
      };
    });

    return {
      current_bpm: apiData.current_bpm,
      average_bpm: apiData.average_bpm,
      max_bpm: apiData.max_bpm,
      min_bpm: apiData.min_bpm,
      data: convertedData
    };
  };

  // Prepare chart data
  const prepareChartData = (data: LocalHeartRateData[]): ChartDataPoint[] => {
    return data.map((item, index) => ({
      time: item.time,
      bpm: item.bpm,
      status: item.status,
      timestamp: item.timestamp,
      normalizedTime: index
    }));
  };

  // Prepare histogram data
  const prepareHistogramData = (data: LocalHeartRateData[]) => {
    const ranges = [
      { range: '50-60', min: 50, max: 60, count: 0, color: '#3b82f6' },
      { range: '60-70', min: 60, max: 70, count: 0, color: '#10b981' },
      { range: '70-80', min: 70, max: 80, count: 0, color: '#10b981' },
      { range: '80-90', min: 80, max: 90, count: 0, color: '#10b981' },
      { range: '90-100', min: 90, max: 100, count: 0, color: '#10b981' },
      { range: '100-110', min: 100, max: 110, count: 0, color: '#f59e0b' },
      { range: '110+', min: 110, max: 200, count: 0, color: '#ef4444' },
    ];

    data.forEach(item => {
      const range = ranges.find(r => item.bpm >= r.min && item.bpm < r.max);
      if (range) range.count++;
    });

    return ranges.filter(r => r.count > 0);
  };

  // Check if backend is running
  const checkBackendHealth = async () => {
    try {
      await emotionService.healthCheck();
      setBackendStatus('online');
      setError(null);
    } catch (err) {
      setBackendStatus('offline');
      setError('FastAPI backend is not running. Please start it with: python main.py');
    }
  };

  const loadHeartRateData = async () => {
    try {
      setError(null);
      
      // First check if backend is running
      await checkBackendHealth();
      
      // Try to get real data from FastAPI
      const apiData = await emotionService.getHeartRateData();
      const localData = convertApiDataToLocal(apiData);
      setHeartRateData(localData);
      
    } catch (error: any) {
      console.error('Failed to load heart rate data:', error);
      setError(error.message || 'Failed to connect to backend');
      
      // Fallback to simulated data if backend is not available
      const simulatedData = generateSimulatedData();
      setHeartRateData(simulatedData);
    } finally {
      setIsLoading(false);
      setIsRefreshing(false);
    }
  };

  // Fallback: Generate simulated data if backend is not available
  const generateSimulatedData = (): LocalHeartRateStats => {
    const now = new Date();
    const data: LocalHeartRateData[] = [];
    
    // Generate 20 data points over the last hour
    for (let i = 19; i >= 0; i--) {
      const timestamp = new Date(now.getTime() - i * 3 * 60 * 1000); // Every 3 minutes
      const baseBPM = 75 + Math.random() * 30; // 75-105 range
      const bpm = Math.round(baseBPM + (Math.random() - 0.5) * 20);
      const normalizedBPM = Math.max(50, Math.min(150, bpm)); // Keep in reasonable range
      const status = getStatusFromBPM(normalizedBPM);
      
      data.push({
        timestamp: timestamp.toISOString(),
        bpm: normalizedBPM,
        status,
        time: timestamp.toLocaleTimeString('en-US', { 
          hour: '2-digit', 
          minute: '2-digit',
          hour12: false
        })
      });
    }

    const bpmValues = data.map(d => d.bpm);
    return {
      current_bpm: bpmValues[bpmValues.length - 1],
      average_bpm: Math.round(bpmValues.reduce((a, b) => a + b, 0) / bpmValues.length),
      max_bpm: Math.max(...bpmValues),
      min_bpm: Math.min(...bpmValues),
      data
    };
  };

  useEffect(() => {
    // Initial load
    loadHeartRateData();
    
    // Auto-refresh every 30 seconds
    const interval = setInterval(loadHeartRateData, 30000);
    return () => clearInterval(interval);
  }, []);

  const handleRefresh = async () => {
    setIsRefreshing(true);
    await loadHeartRateData();
  };

  const getStatusColor = (status: 'High' | 'Normal' | 'Low') => {
    switch (status) {
      case 'High': return 'text-red-600 bg-red-100';
      case 'Low': return 'text-blue-600 bg-blue-100';
      default: return 'text-green-600 bg-green-100';
    }
  };

  const getStatusIcon = (status: 'High' | 'Normal' | 'Low') => {
    switch (status) {
      case 'High': return <TrendingUp className="h-5 w-5" />;
      case 'Low': return <TrendingDown className="h-5 w-5" />;
      default: return <Activity className="h-5 w-5" />;
    }
  };

  // Custom tooltip for charts
  const CustomTooltip = ({ active, payload, label }: any) => {
    if (active && payload && payload.length) {
      const data = payload[0].payload;
      return (
        <div className="bg-white p-3 border border-gray-300 rounded-lg shadow-lg">
          <p className="font-medium">{`Time: ${data.time}`}</p>
          <p className="text-red-600">{`BPM: ${data.bpm}`}</p>
          <p className={`text-sm ${
            data.status === 'High' ? 'text-red-600' :
            data.status === 'Low' ? 'text-blue-600' : 'text-green-600'
          }`}>
            Status: {data.status}
          </p>
        </div>
      );
    }
    return null;
  };

  if (isLoading) {
    return (
      <div className="space-y-6">
        <div className="bg-white rounded-xl shadow-lg p-6">
          <div className="animate-pulse space-y-4">
            <div className="h-8 bg-gray-200 rounded w-1/3"></div>
            <div className="grid grid-cols-4 gap-4">
              {[...Array(4)].map((_, i) => (
                <div key={i} className="h-24 bg-gray-200 rounded"></div>
              ))}
            </div>
            <div className="h-64 bg-gray-200 rounded"></div>
          </div>
        </div>
      </div>
    );
  }

  const currentStatus: 'High' | 'Normal' | 'Low' = heartRateData 
    ? getStatusFromBPM(heartRateData.current_bpm)
    : 'Normal';

  const chartData = heartRateData ? prepareChartData(heartRateData.data) : [];
  const histogramData = heartRateData ? prepareHistogramData(heartRateData.data) : [];

  return (
    <div className="space-y-6">
      {/* Header with Backend Status */}
      <div className="flex items-center justify-between">
        <div>
          <h2 className="text-2xl font-bold text-gray-900">Heart Rate Monitor</h2>
          <div className="flex items-center space-x-4">
            <p className="text-gray-600">Real-time cardiovascular monitoring</p>
            <div className={`flex items-center space-x-2 px-2 py-1 rounded-full text-xs ${
              backendStatus === 'online' ? 'bg-green-100 text-green-800' :
              backendStatus === 'offline' ? 'bg-red-100 text-red-800' :
              'bg-yellow-100 text-yellow-800'
            }`}>
              <div className={`w-2 h-2 rounded-full ${
                backendStatus === 'online' ? 'bg-green-500' :
                backendStatus === 'offline' ? 'bg-red-500' :
                'bg-yellow-500'
              }`}></div>
              <span>
                {backendStatus === 'online' ? 'Backend Connected' :
                 backendStatus === 'offline' ? 'Backend Offline' :
                 'Checking...'}
              </span>
            </div>
          </div>
        </div>
        <button
          onClick={handleRefresh}
          disabled={isRefreshing}
          className="flex items-center space-x-2 bg-black border border-gray-300 rounded-lg px-4 py-2 hover:bg-black-50 transition-colors disabled:opacity-50"
        >
          <RefreshCw className={`h-4 w-4 ${isRefreshing ? 'animate-spin' : ''}`} />
          <span>Refresh</span>
        </button>
      </div>

      {/* Error Alert */}
      {error && (
        <div className="bg-yellow-50 border border-yellow-200 rounded-lg p-4">
          <div className="flex items-center">
            <div className="w-4 h-4 bg-yellow-400 rounded-full mr-3"></div>
            <div>
              <h4 className="font-medium text-yellow-900">Backend Connection Issue</h4>
              <p className="text-yellow-700 text-sm mt-1">{error}</p>
              <p className="text-yellow-600 text-xs mt-2">Using simulated data for demonstration.</p>
            </div>
          </div>
        </div>
      )}

      {!heartRateData ? (
        <div className="bg-white rounded-xl shadow-lg p-6 text-center">
          <Heart className="h-12 w-12 text-gray-400 mx-auto mb-4" />
          <h3 className="text-lg font-medium text-gray-900 mb-2">No Heart Rate Data</h3>
          <p className="text-gray-600 mb-4">Unable to load heart rate information.</p>
          <button
            onClick={handleRefresh}
            className="bg-indigo-600 hover:bg-indigo-700 text-white px-4 py-2 rounded-lg transition-colors"
          >
            Try Again
          </button>
        </div>
      ) : (
        <>
          {/* Current Reading */}
          <div className="bg-white rounded-xl shadow-lg p-6">
            <div className="flex items-center justify-between mb-6">
              <h3 className="text-lg font-semibold text-gray-900">Current Reading</h3>
              <div className={`flex items-center space-x-2 px-3 py-1 rounded-full ${getStatusColor(currentStatus)}`}>
                {getStatusIcon(currentStatus)}
                <span className="font-medium">{currentStatus}</span>
              </div>
            </div>

            <div className="text-center">
              <div className="relative inline-block">
                {/* Animated Heart */}
                 <div className="w-24 h-24 bg-red-100 rounded-full shadow-lg">
                <div className="absolute inset-0 flex items-center justify-center">
                <div className="text-6xl animate-pulse mb-4">
                {currentStatus === 'High' ? '💛' : currentStatus === 'Low' ? '💙' : '❤️'}
                </div>
                    </div >
                 
                    </div>
              
                
                {/* Pulse Rings */}
                <div className="absolute inset-0 flex items-center justify-center">
                  <div className="w-24 h-24 border-4 border-red-300 rounded-full animate-ping"></div>
                </div>
              </div>
              
              <div className="text-4xl font-bold text-gray-900 mb-2">
                {heartRateData.current_bpm} <span className="text-lg text-gray-500">BPM</span>
              </div>
              
              <p className="text-gray-600">
                {backendStatus === 'online' ? 'Live from FastAPI backend' : 'Simulated data (backend offline)'}
              </p>
              <p className="text-gray-500 text-sm">
                Last updated: {new Date().toLocaleTimeString()}
              </p>
            </div>

            {/* Quick Actions */}
            {currentStatus === 'High' && (
              <div className="mt-6 bg-red-50 border border-red-200 rounded-lg p-4">
                <div className="flex items-center justify-between">
                  <div>
                    <h4 className="font-medium text-red-900">Elevated Heart Rate</h4>
                    <p className="text-sm text-red-700">Consider breathing exercises to help relax</p>
                  </div>
                  <button
                    onClick={() => setShowBreathingGuide(true)}
                    className="bg-red-600 hover:bg-red-700 text-white px-4 py-2 rounded-lg text-sm font-medium transition-colors"
                  >
                    Start Breathing
                  </button>
                </div>
              </div>
            )}
          </div>

          {/* Statistics Cards */}
          <div className="grid grid-cols-1 md:grid-cols-4 gap-6">
            <div className="bg-white rounded-lg shadow p-6">
              <div className="flex items-center">
                <div className="p-2 bg-blue-100 rounded-lg">
                  <Activity className="h-6 w-6 text-blue-600" />
                </div>
                <div className="ml-4">
                  <p className="text-sm font-medium text-gray-600">Average</p>
                  <p className="text-2xl font-semibold text-gray-900">{Math.round(heartRateData.average_bpm)}</p>
                </div>
              </div>
            </div>

            <div className="bg-white rounded-lg shadow p-6">
              <div className="flex items-center">
                <div className="p-2 bg-red-100 rounded-lg">
                  <TrendingUp className="h-6 w-6 text-red-600" />
                </div>
                <div className="ml-4">
                  <p className="text-sm font-medium text-gray-600">Maximum</p>
                  <p className="text-2xl font-semibold text-gray-900">{heartRateData.max_bpm}</p>
                </div>
              </div>
            </div>

            <div className="bg-white rounded-lg shadow p-6">
              <div className="flex items-center">
                <div className="p-2 bg-green-100 rounded-lg">
                  <TrendingDown className="h-6 w-6 text-green-600" />
                </div>
                <div className="ml-4">
                  <p className="text-sm font-medium text-gray-600">Minimum</p>
                  <p className="text-2xl font-semibold text-gray-900">{heartRateData.min_bpm}</p>
                </div>
              </div>
            </div>

            <div className="bg-white rounded-lg shadow p-6">
              <div className="flex items-center">
                <div className="p-2 bg-purple-100 rounded-lg">
                  <Heart className="h-6 w-6 text-purple-600" />
                </div>
                <div className="ml-4">
                  <p className="text-sm font-medium text-gray-600">Variance</p>
                  <p className="text-2xl font-semibold text-gray-900">
                    {heartRateData.max_bpm - heartRateData.min_bpm}
                  </p>
                </div>
              </div>
            </div>
          </div>

          {/* Heart Rate Charts */}
          <div className="bg-white rounded-xl shadow-lg p-6">
            <div className="flex items-center justify-between mb-6">
              <h3 className="text-lg font-semibold text-gray-900">Heart Rate Analysis</h3>
              
              {/* Chart Type Selector */}
              <div className="flex items-center space-x-2 bg-gray-100 rounded-lg p-1">
                <button
                  onClick={() => setChartView('area')}
                  className={`px-3 py-1 rounded text-sm font-medium transition-colors ${
                    chartView === 'area' ? 'bg-white text-gray-900 shadow' : 'text-gray-600 hover:text-gray-900'
                  }`}
                >
                  Trend
                </button>
                <button
                  onClick={() => setChartView('line')}
                  className={`px-3 py-1 rounded text-sm font-medium transition-colors ${
                    chartView === 'line' ? 'bg-white text-gray-900 shadow' : 'text-gray-600 hover:text-gray-900'
                  }`}
                >
                  Line
                </button>
                <button
                  onClick={() => setChartView('histogram')}
                  className={`px-3 py-1 rounded text-sm font-medium transition-colors ${
                    chartView === 'histogram' ? 'bg-white text-gray-900 shadow' : 'text-gray-600 hover:text-gray-900'
                  }`}
                >
                  Distribution
                </button>
              </div>
            </div>
            
            {/* Charts */}
            <div className="h-80">
              {chartView === 'area' && (
                <ResponsiveContainer width="100%" height="100%">
                  <AreaChart data={chartData}>
                    <CartesianGrid strokeDasharray="3 3" stroke="#f0f0f0" />
                    <XAxis 
                      dataKey="time" 
                      stroke="#666"
                      fontSize={12}
                      tick={{ fill: '#666' }}
                    />
                    <YAxis 
                      domain={[50, 150]}
                      stroke="#666"
                      fontSize={12}
                      tick={{ fill: '#666' }}
                      label={{ value: 'BPM', angle: -90, position: 'insideLeft' }}
                    />
                    <Tooltip content={<CustomTooltip />} />
                    
                    {/* Reference lines for normal range */}
                    <ReferenceLine y={60} stroke="#3b82f6" strokeDasharray="5 5" label="Low Threshold" />
                    <ReferenceLine y={100} stroke="#ef4444" strokeDasharray="5 5" label="High Threshold" />
                    
                    <Area
                      type="monotone"
                      dataKey="bpm"
                      stroke="#ef4444"
                      strokeWidth={2}
                      fill="url(#heartRateGradient)"
                      fillOpacity={0.6}
                    />
                    
                    {/* Gradient definition */}
                    <defs>
                      <linearGradient id="heartRateGradient" x1="0" y1="0" x2="0" y2="1">
                        <stop offset="0%" stopColor="#ef4444" stopOpacity={0.8}/>
                        <stop offset="100%" stopColor="#ef4444" stopOpacity={0.1}/>
                      </linearGradient>
                    </defs>
                  </AreaChart>
                </ResponsiveContainer>
              )}

              {chartView === 'line' && (
                <ResponsiveContainer width="100%" height="100%">
                  <LineChart data={chartData}>
                    <CartesianGrid strokeDasharray="3 3" stroke="#f0f0f0" />
                    <XAxis 
                      dataKey="time" 
                      stroke="#666"
                      fontSize={12}
                      tick={{ fill: '#666' }}
                    />
                    <YAxis 
                      domain={[50, 150]}
                      stroke="#666"
                      fontSize={12}
                      tick={{ fill: '#666' }}
                      label={{ value: 'BPM', angle: -90, position: 'insideLeft' }}
                    />
                    <Tooltip content={<CustomTooltip />} />
                    
                    {/* Reference lines */}
                    <ReferenceLine y={60} stroke="#3b82f6" strokeDasharray="5 5" label="Low Threshold" />
                    <ReferenceLine y={100} stroke="#ef4444" strokeDasharray="5 5" label="High Threshold" />
                    
                    <Line
                      type="monotone"
                      dataKey="bpm"
                      stroke="#ef4444"
                      strokeWidth={3}
                      dot={{ fill: '#ef4444', strokeWidth: 2, r: 4 }}
                      activeDot={{ r: 6, stroke: '#ef4444', strokeWidth: 2, fill: '#fff' }}
                    />
                  </LineChart>
                </ResponsiveContainer>
              )}

              {chartView === 'histogram' && (
                <ResponsiveContainer width="100%" height="100%">
                  <BarChart data={histogramData}>
                    <CartesianGrid strokeDasharray="3 3" stroke="#f0f0f0" />
                    <XAxis 
                      dataKey="range" 
                      stroke="#666"
                      fontSize={12}
                      tick={{ fill: '#666' }}
                    />
                    <YAxis 
                      stroke="#666"
                      fontSize={12}
                      tick={{ fill: '#666' }}
                      label={{ value: 'Frequency', angle: -90, position: 'insideLeft' }}
                    />
                    <Tooltip 
                      formatter={(value: any, name: any) => [value, 'Count']}
                      labelFormatter={(label: any) => `Range: ${label} BPM`}
                    />
                    <Bar
                      dataKey="count"
                      fill="#6366f1"
                      radius={[4, 4, 0, 0]}
                    />
                  </BarChart>
                </ResponsiveContainer>
              )}
            </div>
            
            {/* Chart Legend */}
            <div className="flex justify-center mt-4 space-x-6 text-sm">
              <div className="flex items-center space-x-2">
                <div className="w-4 h-2 bg-green-500"></div>
                <span className="text-gray-600">Normal (60-100)</span>
              </div>
              <div className="flex items-center space-x-2">
                <div className="w-4 h-2 bg-red-500"></div>
                <span className="text-gray-600">High ({">"}100)</span>
              </div>
              <div className="flex items-center space-x-2">
                <div className="w-4 h-2 bg-blue-500"></div>
                <span className="text-gray-600">Low ({'<'}60)</span>
              </div>
            </div>
          </div>

          {/* Health Insights */}
          <div className="bg-white rounded-xl shadow-lg p-6">
            <h3 className="text-lg font-semibold text-gray-900 mb-4">Health Insights</h3>
            
            <div className="space-y-4">
              {currentStatus === 'High' && (
                <div className="bg-red-50 border-l-4 border-red-400 p-4">
                  <div className="flex items-center">
                    <TrendingUp className="h-5 w-5 text-red-600 mr-3" />
                    <div>
                      <h4 className="font-medium text-red-900">Elevated Heart Rate</h4>
                      <p className="text-red-700 text-sm">
                        Your heart rate is above the normal resting range. Consider relaxation techniques 
                        and monitor for any symptoms.
                      </p>
                    </div>
                  </div>
                </div>
              )}
              
              {currentStatus === 'Low' && (
                <div className="bg-blue-50 border-l-4 border-blue-400 p-4">
                  <div className="flex items-center">
                    <TrendingDown className="h-5 w-5 text-blue-600 mr-3" />
                    <div>
                      <h4 className="font-medium text-blue-900">Low Heart Rate</h4>
                      <p className="text-blue-700 text-sm">
                        Your heart rate is below typical range. This may be normal for athletes or during rest.
                      </p>
                    </div>
                  </div>
                </div>
              )}
              
              {currentStatus === 'Normal' && (
                <div className="bg-green-50 border-l-4 border-green-400 p-4">
                  <div className="flex items-center">
                    <Activity className="h-5 w-5 text-green-600 mr-3" />
                    <div>
                      <h4 className="font-medium text-green-900">Healthy Heart Rate</h4>
                      <p className="text-green-700 text-sm">
                        Your heart rate is in a healthy range. Keep up the good work!
                      </p>
                    </div>
                  </div>
                </div>
              )}
            </div>
          </div>
        </>
      )}

      {/* Breathing Guide Modal */}
      {showBreathingGuide && (
        <div className="fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center z-50">
          <div className="bg-white rounded-xl shadow-2xl max-w-md w-full mx-4 p-6">
            <div className="flex items-center justify-between mb-6">
              <h3 className="text-lg font-semibold text-gray-900">Breathing Exercise</h3>
              <button
                onClick={() => setShowBreathingGuide(false)}
                className="text-gray-400 hover:text-gray-600"
              >
                ✕
              </button>
            </div>
            
            <div className="text-center">
              <div className="w-32 h-32 bg-blue-100 rounded-full mx-auto mb-6 flex items-center justify-center animate-pulse">
                <Wind className="h-12 w-12 text-blue-600" />
              </div>
              
              <h4 className="text-xl font-semibold text-gray-900 mb-2">Deep Breathing</h4>
              <p className="text-gray-600 mb-6">
                Follow the rhythm to help lower your heart rate
              </p>
              
              <div className="space-y-4">
                <div className="text-sm text-gray-600">
                  • Breathe in for 4 seconds<br/>
                  • Hold for 4 seconds<br/>
                  • Breathe out for 6 seconds<br/>
                  • Repeat 5-10 times
                </div>
                <button
                  onClick={() => setShowBreathingGuide(false)}
                  className="w-full bg-blue-600 hover:bg-blue-700 text-white px-4 py-2 rounded-lg transition-colors"
                >
                    Got it!
                </button>
              </div>
            </div>
          </div>
        </div>
      )}
    </div>
    );
}
export default HeartRateMonitor;