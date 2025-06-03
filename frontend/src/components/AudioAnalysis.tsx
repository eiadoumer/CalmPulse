import React, { useState, useRef, useEffect } from 'react';
import { Mic, Upload, Play, Pause, Volume2, FileAudio, Trash2, Download } from 'lucide-react';
import { BarChart, Bar, XAxis, YAxis, CartesianGrid, Tooltip, ResponsiveContainer, PieChart, Pie, Cell } from 'recharts';
import { emotionService } from '../services/api';

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

const AudioAnalysis: React.FC = () => {
  const [isRecording, setIsRecording] = useState(false);
  const [isAnalyzing, setIsAnalyzing] = useState(false);
  const [analysisResult, setAnalysisResult] = useState<AudioAnalysisResult | null>(null);
  const [uploadedFile, setUploadedFile] = useState<File | null>(null);
  const [recordedBlob, setRecordedBlob] = useState<Blob | null>(null);
  const [recordingTime, setRecordingTime] = useState(0);
  const [error, setError] = useState<string | null>(null);

  const mediaRecorderRef = useRef<MediaRecorder | null>(null);
  const streamRef = useRef<MediaStream | null>(null);
  const fileInputRef = useRef<HTMLInputElement>(null);
  const timerRef = useRef<NodeJS.Timeout | null>(null);

  // Cleanup on unmount
  useEffect(() => {
    return () => {
      stopRecording();
      if (timerRef.current) clearInterval(timerRef.current);
    };
  }, []);

  const startRecording = async () => {
    try {
      setError(null);
      const stream = await navigator.mediaDevices.getUserMedia({ audio: true });
      streamRef.current = stream;

      const mediaRecorder = new MediaRecorder(stream);
      mediaRecorderRef.current = mediaRecorder;

      const chunks: BlobPart[] = [];
      
      mediaRecorder.ondataavailable = (event) => {
        if (event.data.size > 0) {
          chunks.push(event.data);
        }
      };

      mediaRecorder.onstop = () => {
        const blob = new Blob(chunks, { type: 'audio/wav' });
        setRecordedBlob(blob);
        chunks.length = 0;
      };

      mediaRecorder.start();
      setIsRecording(true);
      setRecordingTime(0);

      // Start timer
      timerRef.current = setInterval(() => {
        setRecordingTime(prev => prev + 1);
      }, 1000);

    } catch (err) {
      setError('Failed to access microphone. Please check permissions.');
      console.error('Error starting recording:', err);
    }
  };

  const stopRecording = () => {
    if (mediaRecorderRef.current && isRecording) {
      mediaRecorderRef.current.stop();
      setIsRecording(false);
      
      if (timerRef.current) {
        clearInterval(timerRef.current);
      }
    }

    if (streamRef.current) {
      streamRef.current.getTracks().forEach(track => track.stop());
      streamRef.current = null;
    }
  };

  const handleFileUpload = (event: React.ChangeEvent<HTMLInputElement>) => {
    const file = event.target.files?.[0];
    if (file) {
      if (file.type.startsWith('audio/') || file.name.endsWith('.wav') || file.name.endsWith('.mp3')) {
        setUploadedFile(file);
        setRecordedBlob(null);
        setError(null);
      } else {
        setError('Please select a valid audio file (WAV, MP3, etc.)');
      }
    }
  };
  const analyzeAudio = async () => {
    const audioFile = uploadedFile || (recordedBlob ? new File([recordedBlob], 'recording.wav', { type: 'audio/wav' }) : null);
    
    if (!audioFile) {
      setError('No audio file to analyze. Please record or upload an audio file.');
      return;
    }
  
    setIsAnalyzing(true);
    setError(null);
  
    try {
      // Create FormData and append the audio file
      const formData = new FormData();
      formData.append('file', audioFile);
  
      const response = await fetch('http://localhost:8000/api/audio/analyze-simple', {
        method: 'POST',
        body: formData,
      });
  
      if (!response.ok) {
        const errorText = await response.text();
        throw new Error(`HTTP ${response.status}: ${errorText}`);
      }
  
      const data: AudioAnalysisResult = await response.json();
      setAnalysisResult(data);
    } catch (err) {
      const errorMessage = err instanceof Error ? err.message : 'Unknown error occurred';
      setError(`Failed to analyze audio: ${errorMessage}`);
      console.error('Audio analysis error:', err);
    } finally {
      setIsAnalyzing(false);
    }
  };
  const clearAudio = () => {
    setUploadedFile(null);
    setRecordedBlob(null);
    setAnalysisResult(null);
    setError(null);
    if (fileInputRef.current) {
      fileInputRef.current.value = '';
    }
  };

  const downloadRecording = () => {
    if (recordedBlob) {
      const url = URL.createObjectURL(recordedBlob);
      const a = document.createElement('a');
      a.href = url;
      a.download = `recording-${new Date().toISOString().slice(0, 19).replace(/:/g, '-')}.wav`;
      document.body.appendChild(a);
      a.click();
      document.body.removeChild(a);
      URL.revokeObjectURL(url);
    }
  };

  const formatTime = (seconds: number) => {
    const mins = Math.floor(seconds / 60);
    const secs = seconds % 60;
    return `${mins}:${secs.toString().padStart(2, '0')}`;
  };

  const getSentimentColor = (compound: number) => {
    if (compound >= 0.1) return 'text-green-600';
    if (compound <= -0.1) return 'text-red-600';
    return 'text-gray-600';
  };

  const getSentimentLabel = (compound: number) => {
    if (compound >= 0.1) return 'Positive';
    if (compound <= -0.1) return 'Negative';
    return 'Neutral';
  };

  // Prepare chart data
  const sentimentChartData = analysisResult ? [
    { name: 'Positive', value: analysisResult.sentiment_score.pos, color: '#10b981' },
    { name: 'Neutral', value: analysisResult.sentiment_score.neu, color: '#6b7280' },
    { name: 'Negative', value: analysisResult.sentiment_score.neg, color: '#ef4444' },
  ] : [];

  const wordFrequencyData = analysisResult ? 
    Object.entries(analysisResult.word_frequency)
      .slice(0, 10)
      .map(([word, count]) => ({ word, count })) : [];

  return (
    <div className="space-y-6">
      {/* Header */}
      <div>
        <h2 className="text-2xl font-bold text-gray-900 mb-2">Audio Analysis</h2>
        <p className="text-gray-600">Record or upload audio for voice pattern and sentiment analysis</p>
      </div>

      {/* Error Alert */}
      {error && (
        <div className="bg-red-50 border border-red-200 text-red-700 px-4 py-3 rounded-lg">
          {error}
        </div>
      )}

      {/* Audio Input Section */}
      <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
        {/* Recording Section */}
        <div className="bg-white rounded-xl shadow-lg p-6">
          <h3 className="text-lg font-semibold text-gray-900 mb-4 flex items-center">
            <Mic className="h-5 w-5 mr-2" />
            Record Audio
          </h3>
          
          <div className="text-center">
            {!isRecording ? (
              <button
                onClick={startRecording}
                className="w-24 h-24 bg-red-500 hover:bg-red-600 text-white rounded-full flex items-center justify-center transition-colors mb-4 mx-auto"
              >
                <Mic className="h-8 w-8" />
              </button>
            ) : (
              <button
                onClick={stopRecording}
                className="w-24 h-24 bg-gray-600 hover:bg-gray-700 text-white rounded-full flex items-center justify-center transition-colors mb-4 mx-auto animate-pulse"
              >
                <Pause className="h-8 w-8" />
              </button>
            )}
            
            <div className="text-center">
              {isRecording ? (
                <div>
                  <p className="text-red-600 font-medium">Recording...</p>
                  <p className="text-2xl font-mono text-gray-900">{formatTime(recordingTime)}</p>
                </div>
              ) : (
                <p className="text-gray-600">Click to start recording</p>
              )}
            </div>

            {recordedBlob && !isRecording && (
              <div className="mt-4 space-y-2">
                <p className="text-green-600 font-medium">Recording completed!</p>
                <div className="flex justify-center space-x-2">
                  <button
                    onClick={downloadRecording}
                    className="flex items-center space-x-1 text-blue-600 hover:text-blue-700 text-sm"
                  >
                    <Download className="h-4 w-4" />
                    <span>Download</span>
                  </button>
                </div>
              </div>
            )}
          </div>
        </div>

        {/* File Upload Section */}
        <div className="bg-white rounded-xl shadow-lg p-6">
          <h3 className="text-lg font-semibold text-gray-900 mb-4 flex items-center">
            <Upload className="h-5 w-5 mr-2" />
            Upload Audio File
          </h3>
          
          <div className="border-2 border-dashed border-gray-300 rounded-lg p-6 text-center hover:border-gray-400 transition-colors">
            <input
              ref={fileInputRef}
              type="file"
              accept="audio/*,.wav,.mp3,.m4a,.flac"
              onChange={handleFileUpload}
              className="hidden"
            />
            
            {!uploadedFile ? (
              <div onClick={() => fileInputRef.current?.click()} className="cursor-pointer">
                <FileAudio className="h-12 w-12 text-gray-400 mx-auto mb-4" />
                <p className="text-gray-600 mb-2">Click to upload audio file</p>
                <p className="text-sm text-gray-500">Supports WAV, MP3, M4A, FLAC</p>
              </div>
            ) : (
              <div>
                <FileAudio className="h-12 w-12 text-green-500 mx-auto mb-4" />
                <p className="text-green-600 font-medium mb-2">File uploaded!</p>
                <p className="text-sm text-gray-600 mb-4">{uploadedFile.name}</p>
                <button
                  onClick={() => fileInputRef.current?.click()}
                  className="text-blue-600 hover:text-blue-700 text-sm mr-4"
                >
                  Choose different file
                </button>
              </div>
            )}
          </div>
        </div>
      </div>

      {/* Analysis Controls */}
      <div className="bg-white rounded-xl shadow-lg p-6">
        <div className="flex items-center justify-between">
          <div>
            <h3 className="text-lg font-semibold text-gray-900">Audio Analysis</h3>
            <p className="text-gray-600">Analyze speech patterns and emotional content</p>
          </div>
          
          <div className="flex space-x-3">
            {(uploadedFile || recordedBlob) && (
              <button
                onClick={clearAudio}
                className="flex items-center space-x-2 bg-gray-200 hover:bg-gray-300 text-gray-700 px-4 py-2 rounded-lg transition-colors"
              >
                <Trash2 className="h-4 w-4" />
                <span>Clear</span>
              </button>
            )}
            
            <button
              onClick={analyzeAudio}
              disabled={isAnalyzing || (!uploadedFile && !recordedBlob)}
              className="flex items-center space-x-2 bg-blue-600 hover:bg-blue-700 text-white px-6 py-2 rounded-lg font-medium transition-colors disabled:opacity-50 disabled:cursor-not-allowed"
            >
              {isAnalyzing ? (
                <>
                  <div className="animate-spin rounded-full h-4 w-4 border-2 border-white border-t-transparent"></div>
                  <span>Analyzing...</span>
                </>
              ) : (
                <>
                  <Volume2 className="h-4 w-4" />
                  <span>Analyze Audio</span>
                </>
              )}
            </button>
          </div>
        </div>
      </div>

      {/* Analysis Results */}
      {analysisResult && (
        <div className="space-y-6">
          {/* Transcript */}
          <div className="bg-white rounded-xl shadow-lg p-6">
            <h3 className="text-lg font-semibold text-gray-900 mb-4">Speech Transcript</h3>
            <div className="bg-gray-50 rounded-lg p-4">
              <p className="text-gray-900 leading-relaxed">
                {analysisResult.transcript || 'No speech detected in the audio.'}
              </p>
            </div>
          </div>

          {/* Key Metrics */}
          <div className="grid grid-cols-1 md:grid-cols-4 gap-6">
            <div className="bg-white rounded-lg shadow p-6">
              <div className="flex items-center">
                <div className="p-2 bg-blue-100 rounded-lg">
                  <Volume2 className="h-6 w-6 text-blue-600" />
                </div>
                <div className="ml-4">
                  <p className="text-sm font-medium text-gray-600">Avg Volume</p>
                  <p className="text-2xl font-semibold text-gray-900">
                    {(analysisResult.average_volume * 100).toFixed(1)}%
                  </p>
                </div>
              </div>
            </div>

            <div className="bg-white rounded-lg shadow p-6">
              <div className="flex items-center">
                <div className="p-2 bg-purple-100 rounded-lg">
                  <FileAudio className="h-6 w-6 text-purple-600" />
                </div>
                <div className="ml-4">
                  <p className="text-sm font-medium text-gray-600">Avg Pitch</p>
                  <p className="text-2xl font-semibold text-gray-900">
                    {analysisResult.average_pitch.toFixed(0)} Hz
                  </p>
                </div>
              </div>
            </div>

            <div className="bg-white rounded-lg shadow p-6">
              <div className="flex items-center">
                <div className="p-2 bg-yellow-100 rounded-lg">
                  <Mic className="h-6 w-6 text-yellow-600" />
                </div>
                <div className="ml-4">
                  <p className="text-sm font-medium text-gray-600">Repetitions</p>
                  <p className="text-2xl font-semibold text-gray-900">
                    {analysisResult.repetition_count}
                  </p>
                </div>
              </div>
            </div>

            <div className="bg-white rounded-lg shadow p-6">
              <div className="flex items-center">
                <div className={`p-2 rounded-lg ${
                  analysisResult.sentiment_score.compound >= 0.1 ? 'bg-green-100' :
                  analysisResult.sentiment_score.compound <= -0.1 ? 'bg-red-100' : 'bg-gray-100'
                }`}>
                  <Play className={`h-6 w-6 ${getSentimentColor(analysisResult.sentiment_score.compound)}`} />
                </div>
                <div className="ml-4">
                  <p className="text-sm font-medium text-gray-600">Sentiment</p>
                  <p className={`text-2xl font-semibold ${getSentimentColor(analysisResult.sentiment_score.compound)}`}>
                    {getSentimentLabel(analysisResult.sentiment_score.compound)}
                  </p>
                </div>
              </div>
            </div>
          </div>

          {/* Charts */}
          <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
            {/* Sentiment Distribution */}
            <div className="bg-white rounded-xl shadow-lg p-6">
              <h3 className="text-lg font-semibold text-gray-900 mb-4">Sentiment Distribution</h3>
              <ResponsiveContainer width="100%" height={250}>
                <PieChart>
                  <Pie
                    data={sentimentChartData}
                    cx="50%"
                    cy="50%"
                    outerRadius={80}
                    fill="#8884d8"
                    dataKey="value"
                    label={({ name, value }) => `${name}: ${(value * 100).toFixed(1)}%`}
                  >
                    {sentimentChartData.map((entry, index) => (
                      <Cell key={`cell-${index}`} fill={entry.color} />
                    ))}
                  </Pie>
                  <Tooltip formatter={(value: number) => `${(value * 100).toFixed(1)}%`} />
                </PieChart>
              </ResponsiveContainer>
            </div>

            {/* Word Frequency */}
            <div className="bg-white rounded-xl shadow-lg p-6">
              <h3 className="text-lg font-semibold text-gray-900 mb-4">Most Frequent Words</h3>
              <ResponsiveContainer width="100%" height={250}>
                <BarChart data={wordFrequencyData} margin={{ top: 20, right: 30, left: 20, bottom: 5 }}>
                  <CartesianGrid strokeDasharray="3 3" />
                  <XAxis 
                    dataKey="word" 
                    angle={-45}
                    textAnchor="end"
                    height={60}
                    fontSize={12}
                  />
                  <YAxis />
                  <Tooltip />
                  <Bar dataKey="count" fill="#3b82f6" />
                </BarChart>
              </ResponsiveContainer>
            </div>
          </div>

          {/* Detailed Sentiment Scores */}
          <div className="bg-white rounded-xl shadow-lg p-6">
            <h3 className="text-lg font-semibold text-gray-900 mb-4">Detailed Sentiment Analysis</h3>
            <div className="grid grid-cols-1 md:grid-cols-4 gap-4">
              <div className="text-center">
                <p className="text-sm text-gray-600">Positive</p>
                <p className="text-2xl font-bold text-green-600">
                  {(analysisResult.sentiment_score.pos * 100).toFixed(1)}%
                </p>
              </div>
              <div className="text-center">
                <p className="text-sm text-gray-600">Neutral</p>
                <p className="text-2xl font-bold text-gray-600">
                  {(analysisResult.sentiment_score.neu * 100).toFixed(1)}%
                </p>
              </div>
              <div className="text-center">
                <p className="text-sm text-gray-600">Negative</p>
                <p className="text-2xl font-bold text-red-600">
                  {(analysisResult.sentiment_score.neg * 100).toFixed(1)}%
                </p>
              </div>
              <div className="text-center">
                <p className="text-sm text-gray-600">Compound Score</p>
                <p className={`text-2xl font-bold ${getSentimentColor(analysisResult.sentiment_score.compound)}`}>
                  {analysisResult.sentiment_score.compound.toFixed(2)}
                </p>
              </div>
            </div>
            
            <div className="mt-4 bg-gray-50 rounded-lg p-4">
              <h4 className="font-medium text-gray-900 mb-2">Analysis Summary</h4>
              <div className="space-y-2 text-sm text-gray-600">
                {analysisResult.repetition_count > 2 && (
                  <p className="text-yellow-700">⚠️ High repetition detected - may indicate stress or anxiety</p>
                )}
                {analysisResult.sentiment_score.compound < -0.3 && (
                  <p className="text-red-700">⚠️ Strong negative sentiment detected - emotional support may be needed</p>
                )}
                {analysisResult.average_volume > 0.7 && (
                  <p className="text-orange-700">⚠️ High volume detected - may indicate agitation</p>
                )}
                {analysisResult.sentiment_score.compound > 0.3 && (
                  <p className="text-green-700">✅ Positive emotional state detected</p>
                )}
              </div>
            </div>
          </div>
        </div>
      )}

      {/* Help Section */}
      <div className="bg-blue-50 rounded-xl p-6">
        <h3 className="text-lg font-semibold text-blue-900 mb-4">💡 Audio Analysis Tips</h3>
        <div className="grid grid-cols-1 md:grid-cols-2 gap-4 text-sm text-blue-800">
          <div>
            <h4 className="font-medium mb-2">For Best Results:</h4>
            <ul className="space-y-1">
              <li>• Use a quiet environment</li>
              <li>• Speak clearly and naturally</li>
              <li>• Record for at least 10-30 seconds</li>
              <li>• Ensure good microphone quality</li>
            </ul>
          </div>
          <div>
            <h4 className="font-medium mb-2">Analysis Includes:</h4>
            <ul className="space-y-1">
              <li>• Speech-to-text transcription</li>
              <li>• Emotional sentiment analysis</li>
              <li>• Voice pattern detection</li>
              <li>• Word repetition analysis</li>
            </ul>
          </div>
        </div>
      </div>
    </div>
  );
};

export default AudioAnalysis;