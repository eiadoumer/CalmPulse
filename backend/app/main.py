from fastapi import FastAPI, File, UploadFile, WebSocket, WebSocketDisconnect, HTTPException
from fastapi.middleware.cors import CORSMiddleware
from fastapi.responses import JSONResponse
from pydantic import BaseModel
from typing import List, Optional, Dict
import pandas as pd
import numpy as np
import json
import asyncio
import librosa
import soundfile as sf
import speech_recognition as sr
import tempfile
import os
from datetime import datetime, timedelta
from vaderSentiment.vaderSentiment import SentimentIntensityAnalyzer
from collections import Counter
import re
import random
import logging

# Configure logging
logging.basicConfig(level=logging.INFO)
logger = logging.getLogger(__name__)

app = FastAPI(title="CalmPulse API", version="1.0.0")

# CORS middleware
app.add_middleware(
    CORSMiddleware,
    allow_origins=["http://localhost:3000", "http://127.0.0.1:3000"],
    allow_credentials=True,
    allow_methods=["*"],
    allow_headers=["*"],
)

# Global variables for data storage
emotion_data = {
    "current_emotion": "Neutral",
    "emoji": "😐",
    "timestamp": datetime.now().isoformat(),
    "confidence": 0.5
}

# WebSocket connection manager
class ConnectionManager:
    def __init__(self):
        self.active_connections: List[WebSocket] = []

    async def connect(self, websocket: WebSocket):
        await websocket.accept()
        self.active_connections.append(websocket)

    def disconnect(self, websocket: WebSocket):
        self.active_connections.remove(websocket)

    async def broadcast(self, message: dict):
        for connection in self.active_connections:
            try:
                await connection.send_text(json.dumps(message))
            except:
                pass

manager = ConnectionManager()

# Pydantic models
class EmotionResponse(BaseModel):
    emotion: str
    emoji: str
    confidence: float
    timestamp: str
    factors: Dict[str, bool]

class HeartRateData(BaseModel):
    timestamp: str
    bpm: int
    status: str

class AudioAnalysisResult(BaseModel):
    transcript: str
    sentiment_score: Dict[str, float]
    repetition_count: int
    average_pitch: float
    average_volume: float
    word_frequency: Dict[str, int]

class BreathingSession(BaseModel):
    duration: int = 180  # 3 minutes default
    cycles: int = 3

# Initialize sentiment analyzer
analyzer = SentimentIntensityAnalyzer()

def load_heart_rate_data():
    """Load heart rate data from CSV"""
    try:
        # Try both possible file locations
        for filepath in ["heartBeat.csv", "data/heartBeat.csv"]:
            if os.path.exists(filepath):
                df = pd.read_csv(filepath)
                df['timestamp'] = pd.to_datetime(df['timestamp'])
                logger.info(f"Loaded heart rate data from {filepath}")
                return df
        
        # If no file found, create sample data
        logger.warning("Heart rate CSV not found, generating sample data")
        raise FileNotFoundError("No heart rate data file found")
        
    except FileNotFoundError:
        # Generate sample data if file doesn't exist
        timestamps = pd.date_range(
            start=datetime.now() - timedelta(hours=2),
            periods=120,
            freq='1min'
        )
        bpm_values = np.random.normal(85, 15, 120).astype(int)
        bpm_values = np.clip(bpm_values, 50, 150)  # Keep in reasonable range
        return pd.DataFrame({
            'timestamp': timestamps,
            'bpm': bpm_values
        })

def load_audio_volume_data():
    """Load audio volume data from CSV"""
    try:
        # Try both possible file locations
        for filepath in ["audio_volume.csv", "data/audio_volume.csv"]:
            if os.path.exists(filepath):
                df = pd.read_csv(filepath)
                logger.info(f"Loaded audio volume data from {filepath}")
                return df
        
        logger.warning("Audio volume CSV not found, generating sample data")
        raise FileNotFoundError("No audio volume data file found")
        
    except FileNotFoundError:
        # Generate sample data
        return pd.DataFrame({
            'time_step': range(1, 11),
            'volume': np.random.uniform(0.2, 0.8, 10)
        })

def analyze_emotion(transcript: str, heart_rate_df: pd.DataFrame, volume_df: pd.DataFrame):
    """Analyze emotion based on multiple factors"""
    
    # Sentiment analysis
    sentiment_score = analyzer.polarity_scores(transcript)
    
    # Detect word repetition
    words = transcript.lower().replace('.', '').replace(',', '').split()
    repetition_count = sum([1 for i in range(1, len(words)) if words[i] == words[i-1]])
    
    # Analyze heart rate
    max_bpm = heart_rate_df['bpm'].max()
    avg_bpm = heart_rate_df['bpm'].mean()
    high_bpm = max_bpm > 100
    
    # Analyze volume
    avg_volume = volume_df['volume'].mean()
    high_volume = avg_volume > 0.5
    
    # Emotion detection flags
    factors = {
        "high_bpm": high_bpm,
        "high_volume": high_volume,
        "repetition_alert": repetition_count >= 2,
        "negative_sentiment": sentiment_score['compound'] < -0.3
    }
    
    # Determine emotion
    if factors["high_bpm"] and factors["high_volume"] and factors["repetition_alert"] and factors["negative_sentiment"]:
        emotion = "Anxious"
        emoji = "😰"
        confidence = 0.9
    elif factors["negative_sentiment"]:
        emotion = "Sad"
        emoji = "😢"
        confidence = 0.7
    elif sentiment_score['compound'] > 0.3:
        emotion = "Happy"
        emoji = "😊"
        confidence = 0.8
    else:
        emotion = "Neutral"
        emoji = "😐"
        confidence = 0.6
    
    return {
        "emotion": emotion,
        "emoji": emoji,
        "confidence": confidence,
        "factors": factors,
        "sentiment_score": sentiment_score,
        "repetition_count": repetition_count,
        "max_bpm": int(max_bpm),
        "avg_volume": float(avg_volume)
    }

# API Endpoints

@app.get("/")
async def root():
    return {"message": "CalmPulse API is running"}

# ==================== MAIN DASHBOARD ROUTES ====================

@app.get("/api/dashboard/status")
async def get_dashboard_status():
    """Get overall dashboard status for main page"""
    heart_rate_df = load_heart_rate_data()
    volume_df = load_audio_volume_data()
    
    # Use sample transcript for demo
    sample_transcript = "I... I don't want to go. I don't want to. Please. Please. It's too loud. It's too loud. I don't like it. I want to go home. I want mom. I want mom."
    
    analysis = analyze_emotion(sample_transcript, heart_rate_df, volume_df)
    
    return {
        "emotion": analysis["emotion"],
        "emoji": analysis["emoji"],
        "confidence": analysis["confidence"],
        "timestamp": datetime.now().isoformat(),
        "factors": analysis["factors"],
        "current_bpm": int(heart_rate_df['bpm'].iloc[-1]),
        "high_bpm": analysis["factors"]["high_bpm"],
        "breathing_recommended": analysis["factors"]["high_bpm"] or analysis["emotion"] == "Anxious"
    }

@app.post("/api/dashboard/breathing/trigger")
async def trigger_breathing_exercise():
    """Trigger breathing exercise from main dashboard"""
    return {
        "message": "Breathing exercise triggered",
        "duration": 180,
        "cycles": 3,
        "instructions": [
            "Breathe in slowly for 4 seconds",
            "Hold your breath for 2 seconds", 
            "Breathe out slowly for 4 seconds"
        ]
    }

# ==================== EMOTION DETECTION ROUTES ====================

@app.get("/api/emotion/current", response_model=EmotionResponse)
async def get_current_emotion():
    """Get current emotion state for CalmPulse page"""
    heart_rate_df = load_heart_rate_data()
    volume_df = load_audio_volume_data()
    
    # Use sample transcript for demo
    sample_transcript = "I... I don't want to go. I don't want to. Please. Please. It's too loud. It's too loud. I don't like it. I want to go home. I want mom. I want mom."
    
    analysis = analyze_emotion(sample_transcript, heart_rate_df, volume_df)
    
    response = EmotionResponse(
        emotion=analysis["emotion"],
        emoji=analysis["emoji"],
        confidence=analysis["confidence"],
        timestamp=datetime.now().isoformat(),
        factors=analysis["factors"]
    )
    
    # Broadcast to WebSocket clients
    await manager.broadcast(response.dict())
    
    return response

@app.get("/api/emotion/radar")
async def get_emotion_radar_data():
    """Get radar chart data for emotion visualization"""
    heart_rate_df = load_heart_rate_data()
    volume_df = load_audio_volume_data()
    
    # Sample transcript for analysis
    sample_transcript = "I... I don't want to go. I don't want to. Please. Please. It's too loud. It's too loud. I don't like it. I want to go home. I want mom. I want mom."
    
    analysis = analyze_emotion(sample_transcript, heart_rate_df, volume_df)
    
    # Normalize values for radar chart (0-1 scale)
    max_bpm_norm = min(heart_rate_df['bpm'].max() / 150, 1.0)
    avg_volume_norm = min(volume_df['volume'].mean(), 1.0)
    repetition_norm = 1.0 if analysis["factors"]["repetition_alert"] else 0.0
    negative_sentiment_norm = abs(analysis["sentiment_score"]["compound"]) if analysis["sentiment_score"]["compound"] < 0 else 0.0
    
    return {
        "labels": ["Max BPM", "Avg Volume", "Repetition Alert", "Negative Sentiment"],
        "values": [max_bpm_norm, avg_volume_norm, repetition_norm, negative_sentiment_norm],
        "raw_data": {
            "max_bpm": int(heart_rate_df['bpm'].max()),
            "avg_volume": float(volume_df['volume'].mean()),
            "repetition_count": analysis["repetition_count"],
            "sentiment_compound": analysis["sentiment_score"]["compound"]
        }
    }

# ==================== HEART RATE MONITOR ROUTES ====================

@app.get("/api/heartrate/data")
async def get_heart_rate_data():
    """Get heart rate data for heart rate monitor page"""
    df = load_heart_rate_data()
    
    # Convert to list of dictionaries
    data = []
    for _, row in df.iterrows():
        bpm = int(row['bpm'])
        status = "High" if bpm > 100 else "Low" if bpm < 60 else "Normal"
        
        data.append(HeartRateData(
            timestamp=row['timestamp'].isoformat(),
            bpm=bpm,
            status=status
        ))
    
    return {
        "data": data,
        "current_bpm": int(df['bpm'].iloc[-1]),
        "average_bpm": float(df['bpm'].mean()),
        "max_bpm": int(df['bpm'].max()),
        "min_bpm": int(df['bpm'].min())
    }

@app.get("/api/heartrate/current")
async def get_current_heart_rate():
    """Get current heart rate reading with real-time simulation"""
    df = load_heart_rate_data()
    current_bpm = int(df['bpm'].iloc[-1])
    
    # Add some randomization for demo
    current_bpm += random.randint(-5, 5)
    current_bpm = max(50, min(150, current_bpm))  # Keep in reasonable range
    
    status = "High" if current_bpm > 100 else "Low" if current_bpm < 60 else "Normal"
    
    return {
        "bpm": current_bpm,
        "status": status,
        "timestamp": datetime.now().isoformat(),
        "color": "#ff4444" if status == "High" else "#4444ff" if status == "Low" else "#44ff44",
        "pulse_speed": "0.6s" if status == "High" else "1.2s" if status == "Low" else "0.8s"
    }

@app.get("/api/heartrate/insights")
async def get_heart_rate_insights():
    """Get heart rate insights and recommendations"""
    df = load_heart_rate_data()
    current_bmp = int(df['bpm'].iloc[-1]) + random.randint(-5, 5)
    current_bmp = max(50, min(150, current_bmp))
    
    avg_bpm = float(df['bpm'].mean())
    
    insights = []
    recommendations = []
    
    if current_bmp > 100:
        insights.append("Elevated Heart Rate Detected")
        insights.append("Your heart rate is above normal resting range")
        insights.append("This could indicate stress, anxiety, or physical activity")
        recommendations.extend([
            "🫁 Try deep breathing exercises",
            "🪑 Sit or lie down in a comfortable position", 
            "💧 Drink cool water",
            "🌬️ Get fresh air if possible"
        ])
        status = "warning"
    elif current_bmp < 60:
        insights.append("Low Heart Rate Detected")
        insights.append("Your heart rate is below typical resting range")
        insights.append("This could be normal for athletes or indicate relaxation")
        recommendations.extend([
            "☕ Consider a warm drink",
            "🚶‍♀️ Try gentle movement or stretching",
            "🌞 Get some natural light"
        ])
        status = "info"
    else:
        insights.append("Normal Heart Rate Range")
        insights.append("Your heart rate is in a healthy resting range (60-100 BPM)")
        insights.append("This suggests good cardiovascular health")
        recommendations.extend([
            "✅ Continue current activities",
            "🏃‍♀️ Good time for regular exercise",
            "🧘‍♀️ Practice mindfulness"
        ])
        status = "success"
    
    return {
        "current_bpm": current_bmp,
        "status": status,
        "insights": insights,
        "recommendations": recommendations,
        "comparison_to_average": current_bmp - avg_bpm
    }

@app.post("/api/heartrate/breathing/start")
async def start_heart_rate_breathing():
    """Start breathing exercise specifically for heart rate management"""
    return {
        "message": "Heart rate breathing exercise started",
        "type": "heart_rate_focused",
        "duration": 240,  # 4 minutes
        "pattern": "4-7-8",  # Inhale 4, hold 7, exhale 8
        "cycles": 4,
        "instructions": [
            "Inhale slowly through nose for 4 counts",
            "Hold your breath for 7 counts",
            "Exhale completely through mouth for 8 counts",
            "This pattern helps activate the parasympathetic nervous system"
        ]
    }
    
    
    

## Audio Analysis for testing
@app.post("/api/audio/analyze-simple")
async def analyze_audio_simple(file: UploadFile = File(...)):
    """Simplified audio analysis with proper format conversion"""
    temp_path = None
    converted_path = None
    
    try:
        logger.info(f"Received file: {file.filename}, content_type: {file.content_type}")
        
        # Save uploaded file
        content = await file.read()
        if len(content) == 0:
            raise HTTPException(status_code=400, detail="Empty audio file")
            
        # Save original file
        with tempfile.NamedTemporaryFile(delete=False, suffix=".original") as temp_file:
            temp_file.write(content)
            temp_path = temp_file.name
        
        logger.info(f"Saved original file: {temp_path}")
        
        # Diagnose file format first
        logger.info(f"File size: {len(content)} bytes")
        logger.info(f"First 20 bytes: {content[:20]}")
        
        # Try different approaches for audio conversion
        converted_path = temp_path + ".wav"
        
        # Method 1: Try direct librosa load
        try:
            y, sr_rate = librosa.load(temp_path, sr=None)
            logger.info(f"Method 1 success: Loaded audio: duration={len(y)/sr_rate:.2f}s, sample_rate={sr_rate}")
            
            # Convert to 16kHz mono WAV (optimal for speech recognition)
            if sr_rate != 16000:
                y = librosa.resample(y, orig_sr=sr_rate, target_sr=16000)
                sr_rate = 16000
                logger.info("Resampled to 16kHz")
            
            # Save as proper WAV file
            sf.write(converted_path, y, sr_rate, format='WAV', subtype='PCM_16')
            logger.info(f"Converted to WAV: {converted_path}")
            
        except Exception as e1:
            logger.warning(f"Method 1 (librosa) failed: {e1}")
            
            # Method 2: Try assuming it's already a WAV and just copy it
            try:
                import shutil
                shutil.copy2(temp_path, converted_path)
                logger.info("Method 2: Copied file as WAV (assuming it's already WAV format)")
                
                # Test if speech_recognition can read it directly
                import speech_recognition as sr_test
                r_test = sr_test.Recognizer()
                with sr_test.AudioFile(converted_path) as source_test:
                    audio_test = r_test.record(source_test, duration=1)  # Test first second
                logger.info("Method 2 success: File is readable by speech_recognition")
                
            except Exception as e2:
                logger.warning(f"Method 2 (direct copy) failed: {e2}")
                
                # Method 3: Try to create a basic WAV file with raw audio data
                try:
                    # If it's WebM or other browser format, try a different approach
                    import wave
                    import struct
                    
                    # Create a basic WAV file with assumed parameters
                    # This is a fallback for browser recordings
                    sample_rate = 16000
                    duration = 5.0  # Assume 5 seconds max
                    samples = int(sample_rate * duration)
                    
                    # Generate silence or use partial data if available
                    audio_data = b'\x00' * (samples * 2)  # 16-bit silence
                    
                    with wave.open(converted_path, 'wb') as wav_file:
                        wav_file.setnchannels(1)  # Mono
                        wav_file.setsampwidth(2)  # 2 bytes per sample (16-bit)
                        wav_file.setframerate(sample_rate)
                        wav_file.writeframes(audio_data)
                    
                    logger.info("Method 3: Created fallback WAV file")
                    
                except Exception as e3:
                    logger.error(f"All conversion methods failed. Method 1: {e1}, Method 2: {e2}, Method 3: {e3}")
                    raise HTTPException(
                        status_code=400, 
                        detail=f"Could not process audio file. The file format may not be supported. Please try uploading a WAV, MP3, or M4A file. Error details: {str(e1)}"
                    )
        
        # Speech recognition with enhanced settings
        transcript = ""
        try:
            import speech_recognition as sr_module
            r = sr_module.Recognizer()
            
            # Use the converted WAV file
            with sr_module.AudioFile(converted_path) as source:
                logger.info("Starting speech recognition...")
                
                # Enhanced noise adjustment
                r.adjust_for_ambient_noise(source, duration=1.0)  # Increased duration
                
                # Adjust recognition sensitivity
                r.energy_threshold = 300  # Lower threshold for quiet audio
                r.dynamic_energy_threshold = True
                r.dynamic_energy_adjustment_damping = 0.15
                r.dynamic_energy_ratio = 1.5
                r.pause_threshold = 0.8  # Shorter pause detection
                r.operation_timeout = None  # No timeout
                
                # Record the entire audio file
                audio = r.record(source)
                
                logger.info(f"Audio recorded for recognition. Duration: {len(audio.frame_data)} frames")
                
                # Try multiple recognition attempts with different settings
                recognition_attempts = [
                    # Attempt 1: Default Google recognition
                    lambda: r.recognize_google(audio, language='en-US'),
                    # Attempt 2: With show_all=True to get confidence scores
                    lambda: r.recognize_google(audio, language='en-US', show_all=True),
                    # Attempt 3: Try with different language variants
                    lambda: r.recognize_google(audio, language='en'),
                    # Attempt 4: Try with Sphinx (offline, if available)
                    lambda: r.recognize_sphinx(audio) if hasattr(r, 'recognize_sphinx') else None,
                ]
                
                for i, attempt in enumerate(recognition_attempts, 1):
                    try:
                        logger.info(f"Recognition attempt {i}")
                        result = attempt()
                        
                        if result:
                            if isinstance(result, dict) and 'alternative' in result:
                                # Handle show_all=True response
                                if result['alternative']:
                                    transcript = result['alternative'][0]['transcript']
                                    confidence = result['alternative'][0].get('confidence', 0.0)
                                    logger.info(f"Speech recognition successful with confidence {confidence}: {transcript}")
                                else:
                                    continue
                            elif isinstance(result, str):
                                transcript = result
                                logger.info(f"Speech recognition successful: {transcript}")
                            
                            # If we got a result, break out of attempts
                            if transcript.strip():
                                break
                                
                    except sr_module.UnknownValueError:
                        logger.info(f"Attempt {i}: No speech detected")
                        continue
                    except sr_module.RequestError as e:
                        logger.warning(f"Attempt {i}: Service error: {e}")
                        continue
                    except Exception as e:
                        logger.warning(f"Attempt {i}: Error: {e}")
                        continue
                
                # If still no transcript, provide helpful feedback
                if not transcript.strip():
                    # Analyze audio properties to give better feedback
                    try:
                        if os.path.exists(converted_path):
                            test_y, test_sr = librosa.load(converted_path, sr=None)
                            audio_duration = len(test_y) / test_sr
                            max_amplitude = np.max(np.abs(test_y))
                            rms_energy = np.sqrt(np.mean(test_y**2))
                            
                            logger.info(f"Audio analysis - Duration: {audio_duration:.2f}s, Max amplitude: {max_amplitude:.4f}, RMS energy: {rms_energy:.4f}")
                            
                            if audio_duration < 1.0:
                                transcript = "Audio too short - please record for at least 2-3 seconds"
                            elif max_amplitude < 0.01:
                                transcript = "Audio too quiet - please speak louder or check microphone"
                            elif rms_energy < 0.001:
                                transcript = "Very low audio signal - please check microphone settings"
                            else:
                                transcript = "Speech not detected - please speak clearly and ensure good audio quality"
                        else:
                            transcript = "Could not analyze audio file"
                    except Exception as e:
                        logger.warning(f"Audio analysis failed: {e}")
                        transcript = "Could not understand audio - please try speaking more clearly, louder, or for a longer duration"
                
        except sr_module.RequestError as e:
            logger.error(f"Speech recognition service error: {e}")
            transcript = f"Speech recognition service error: {str(e)}"
        except Exception as e:
            logger.error(f"Speech recognition failed: {e}")
            transcript = f"Speech recognition failed: {str(e)}"
        
        # Basic analysis without librosa audio features
        sentiment_score = analyzer.polarity_scores(transcript)
        words = re.findall(r'\w+', transcript.lower())
        word_freq = Counter(words)
        repetition_count = sum([1 for i in range(1, len(words)) if words[i] == words[i-1]])
        
        # Calculate basic audio features if we have actual audio data
        try:
            # Try to load the converted file to get features
            if os.path.exists(converted_path):
                test_y, test_sr = librosa.load(converted_path, sr=None)
                if len(test_y) > 0:
                    average_pitch = float(np.mean(librosa.feature.spectral_centroid(y=test_y, sr=test_sr)[0]))
                    average_volume = float(np.mean(np.abs(test_y)))
                    # Normalize volume to 0-1 range
                    average_volume = min(average_volume * 10, 1.0)
                else:
                    raise ValueError("No audio data found")
            else:
                raise ValueError("Converted file not found")
        except Exception as e:
            logger.warning(f"Audio feature extraction failed: {e}")
            average_pitch = 150.0  # Default value
            average_volume = 0.5   # Default value
        
        return {
            "transcript": transcript,
            "sentiment_score": sentiment_score,
            "repetition_count": repetition_count,
            "average_pitch": average_pitch,
            "average_volume": average_volume,
            "word_frequency": dict(word_freq.most_common(10))
        }
        
    except HTTPException:
        # Re-raise HTTP exceptions as-is
        raise
    except Exception as e:
        logger.error(f"Audio analysis failed: {str(e)}")
        raise HTTPException(status_code=500, detail=f"Audio analysis failed: {str(e)}")
    finally:
        # Clean up temporary files
        for path in [temp_path, converted_path]:
            if path and os.path.exists(path):
                try:
                    os.unlink(path)
                    logger.info(f"Cleaned up temporary file: {path}")
                except Exception as e:
                    logger.warning(f"Failed to clean up temporary file {path}: {e}")

# ==================== AUDIO ANALYSIS ROUTES ====================

@app.post("/api/audio/analyze")
async def analyze_audio(file: UploadFile = File(...)):
    """Analyze uploaded audio file for audio analysis page"""
    logger.info(f"Received audio file: {file.filename}, content_type: {file.content_type}")
    
    # Validate file type
    if not (file.filename.lower().endswith(('.wav', '.mp3', '.m4a', '.flac')) or 
            (file.content_type and file.content_type.startswith('audio/'))):
        raise HTTPException(status_code=400, detail="Unsupported audio format. Please use WAV, MP3, M4A, or FLAC files.")
    
    try:
        # Read file content
        content = await file.read()
        if len(content) == 0:
            raise HTTPException(status_code=400, detail="Empty audio file")
        
        logger.info(f"Audio file size: {len(content)} bytes")
        
        # Save uploaded file temporarily
        with tempfile.NamedTemporaryFile(delete=False, suffix=".wav") as temp_file:
            temp_file.write(content)
            temp_path = temp_file.name
        
        logger.info(f"Saved temporary file: {temp_path}")
        
        try:
            # Load audio file with better error handling
            try:
                y, sr = librosa.load(temp_path)
                logger.info(f"Loaded audio: duration={len(y)/sr:.2f}s, sample_rate={sr}")
            except Exception as e:
                logger.error(f"Failed to load audio with librosa: {e}")
                raise Exception(f"Could not load audio file. Please ensure it's a valid audio format.")
            
            # Speech recognition with better error handling
            r = sr.Recognizer()
            transcript = ""
            
            try:
                # Try using the temporary file directly
                with sr.AudioFile(temp_path) as source:
                    # Adjust for ambient noise
                    r.adjust_for_ambient_noise(source, duration=0.5)
                    audio = r.record(source)
                    transcript = r.recognize_google(audio)
                    logger.info(f"Transcript: {transcript}")
            except sr.UnknownValueError:
                transcript = "Could not understand audio - please speak more clearly"
                logger.warning("Speech recognition failed - no speech detected")
            except sr.RequestError as e:
                logger.error(f"Speech recognition service error: {e}")
                transcript = "Speech recognition service temporarily unavailable"
            except Exception as e:
                logger.error(f"Unexpected speech recognition error: {e}")
                transcript = "Error processing audio for speech recognition"
            
            # Sentiment analysis
            sentiment_score = analyzer.polarity_scores(transcript)
            
            # Word frequency
            words = re.findall(r'\w+', transcript.lower())
            word_freq = Counter(words)
            
            # Repetition detection
            repetition_count = sum([1 for i in range(1, len(words)) if len(words) > i and words[i] == words[i-1]])
            
            # Pitch analysis with better error handling
            try:
                pitches, magnitudes = librosa.piptrack(y=y, sr=sr)
                if len(pitches) > 0 and len(magnitudes) > 0:
                    pitch_values = pitches[magnitudes > np.median(magnitudes)]
                    avg_pitch = float(np.mean(pitch_values)) if len(pitch_values) > 0 else 0.0
                else:
                    avg_pitch = 0.0
            except Exception as e:
                logger.warning(f"Pitch analysis failed: {e}")
                avg_pitch = 0.0
            
            # Volume analysis
            try:
                avg_volume = float(np.mean(np.abs(y)))
                # Normalize volume to 0-1 range
                avg_volume = min(avg_volume * 10, 1.0)  # Scale and cap at 1.0
            except Exception as e:
                logger.warning(f"Volume analysis failed: {e}")
                avg_volume = 0.5  # Default value
            
            result = AudioAnalysisResult(
                transcript=transcript,
                sentiment_score=sentiment_score,
                repetition_count=repetition_count,
                average_pitch=avg_pitch,
                average_volume=avg_volume,
                word_frequency=dict(word_freq.most_common(10))
            )
            
            logger.info("Audio analysis completed successfully")
            return result
            
        finally:
            # Clean up temporary file
            try:
                os.unlink(temp_path)
                logger.info(f"Cleaned up temporary file: {temp_path}")
            except Exception as e:
                logger.warning(f"Failed to clean up temporary file: {e}")
        
    except HTTPException:
        # Re-raise HTTP exceptions as-is
        raise
    except Exception as e:
        logger.error(f"Audio analysis failed: {str(e)}")
        raise HTTPException(status_code=500, detail=f"Audio analysis failed: {str(e)}")

@app.get("/api/audio/volume")
async def get_audio_volume_data():
    """Get audio volume data for audio analysis page"""
    df = load_audio_volume_data()
    return {
        "data": df.to_dict('records'),
        "average_volume": float(df['volume'].mean()),
        "max_volume": float(df['volume'].max()),
        "analysis": {
            "high_volume_detected": df['volume'].mean() > 0.5,
            "volume_spikes": len(df[df['volume'] > 0.7]),
            "volume_pattern": "stable" if df['volume'].std() < 0.2 else "variable"
        }
    }

@app.post("/api/audio/live-record")
async def start_live_recording():
    """Start live audio recording session"""
    session_id = f"recording_{datetime.now().strftime('%Y%m%d_%H%M%S')}"
    return {
        "session_id": session_id,
        "message": "Live recording session started",
        "max_duration": 300,  # 5 minutes
        "sample_rate": 44100,
        "format": "wav"
    }

@app.get("/api/audio/presets")
async def get_audio_analysis_presets():
    """Get preset analysis configurations"""
    return {
        "presets": [
            {
                "name": "Anxiety Detection",
                "description": "Optimized for detecting signs of anxiety and stress",
                "parameters": {
                    "focus_repetition": True,
                    "sentiment_threshold": -0.3,
                    "volume_sensitivity": "high"
                }
            },
            {
                "name": "General Emotion",
                "description": "Balanced analysis for general emotional state",
                "parameters": {
                    "focus_repetition": False,
                    "sentiment_threshold": -0.1,
                    "volume_sensitivity": "medium"
                }
            },
            {
                "name": "Speech Patterns",
                "description": "Focused on speech patterns and communication",
                "parameters": {
                    "focus_repetition": True,
                    "sentiment_threshold": 0,
                    "volume_sensitivity": "low"
                }
            }
        ]
    }

# ==================== BREATHING EXERCISE ROUTES ====================

@app.post("/api/breathing/start")
async def start_breathing_session(session: BreathingSession):
    """Start a breathing exercise session"""
    return {
        "message": "Breathing session started",
        "duration": session.duration,
        "cycles": session.cycles,
        "session_id": f"session_{datetime.now().strftime('%Y%m%d_%H%M%S')}"
    }

@app.get("/api/breathing/patterns")
async def get_breathing_patterns():
    """Get available breathing exercise patterns"""
    return {
        "patterns": [
            {
                "id": "basic",
                "name": "Basic Relaxation",
                "description": "Simple breathing for general relaxation",
                "inhale": 4,
                "hold": 2,
                "exhale": 4,
                "cycles": 3,
                "duration": 180
            },
            {
                "id": "anxiety_relief",
                "name": "Anxiety Relief",
                "description": "4-7-8 breathing for anxiety and stress",
                "inhale": 4,
                "hold": 7,
                "exhale": 8,
                "cycles": 4,
                "duration": 240
            },
            {
                "id": "heart_rate",
                "name": "Heart Rate Control",
                "description": "Longer exhales to slow heart rate",
                "inhale": 4,
                "hold": 4,
                "exhale": 6,
                "cycles": 5,
                "duration": 300
            },
            {
                "id": "quick_calm",
                "name": "Quick Calm",
                "description": "Short session for immediate relief",
                "inhale": 3,
                "hold": 3,
                "exhale": 3,
                "cycles": 2,
                "duration": 90
            }
        ]
    }

@app.post("/api/breathing/session/{pattern_id}")
async def start_breathing_pattern(pattern_id: str):
    """Start breathing session with specific pattern"""
    patterns = (await get_breathing_patterns())["patterns"]
    pattern = next((p for p in patterns if p["id"] == pattern_id), None)
    
    if not pattern:
        raise HTTPException(status_code=404, detail="Breathing pattern not found")
    
    session_id = f"breathing_{pattern_id}_{datetime.now().strftime('%Y%m%d_%H%M%S')}"
    
    return {
        "session_id": session_id,
        "pattern": pattern,
        "started_at": datetime.now().isoformat(),
        "instructions": [
            f"Breathe in for {pattern['inhale']} seconds",
            f"Hold for {pattern['hold']} seconds",
            f"Breathe out for {pattern['exhale']} seconds",
            f"Repeat for {pattern['cycles']} cycles"
        ]
    }

@app.get("/api/breathing/progress/{session_id}")
async def get_breathing_progress(session_id: str):
    """Get breathing session progress (mock data for demo)"""
    return {
        "session_id": session_id,
        "completed_cycles": random.randint(0, 3),
        "current_phase": random.choice(["inhale", "hold", "exhale", "rest"]),
        "time_remaining": random.randint(30, 180),
        "heart_rate_change": random.randint(-10, -2),  # Usually decreases
        "effectiveness_score": random.uniform(0.7, 1.0)
    }

# ==================== COMBINED DATA ROUTES ====================

@app.get("/api/combined/overview")
async def get_combined_overview():
    """Get combined data overview for dashboard"""
    heart_rate_df = load_heart_rate_data()
    volume_df = load_audio_volume_data()
    
    current_bpm = int(heart_rate_df['bpm'].iloc[-1]) + random.randint(-3, 3)
    current_bpm = max(50, min(150, current_bpm))
    
    # Sample analysis
    sample_transcript = "I feel okay today but sometimes worry about things"
    analysis = analyze_emotion(sample_transcript, heart_rate_df, volume_df)
    
    return {
        "emotion": {
            "current": analysis["emotion"],
            "emoji": analysis["emoji"],
            "confidence": analysis["confidence"]
        },
        "heart_rate": {
            "current": current_bpm,
            "status": "High" if current_bpm > 100 else "Low" if current_bpm < 60 else "Normal",
            "average": float(heart_rate_df['bpm'].mean())
        },
        "audio": {
            "average_volume": float(volume_df['volume'].mean()),
            "last_analysis": datetime.now().isoformat()
        },
        "alerts": [
            alert for alert in [
                {"type": "warning", "message": "Elevated heart rate detected"} if current_bpm > 100 else None,
                {"type": "info", "message": "Consider breathing exercise"} if analysis["emotion"] == "Anxious" else None,
                {"type": "success", "message": "All vitals normal"} if current_bpm <= 100 and analysis["emotion"] != "Anxious" else None
            ] if alert is not None
        ]
    }

@app.get("/api/analytics/trends")
async def get_analytics_trends():
    """Get trend analytics across all metrics"""
    heart_rate_df = load_heart_rate_data()
    
    # Generate trend data for the last 24 hours
    hours = list(range(24))
    heart_rate_trend = [random.randint(70, 110) for _ in hours]
    emotion_trend = [random.choice(["Happy", "Neutral", "Sad", "Anxious"]) for _ in hours]
    
    return {
        "time_range": "24h",
        "heart_rate_trend": {
            "hours": hours,
            "values": heart_rate_trend,
            "average": sum(heart_rate_trend) / len(heart_rate_trend)
        },
        "emotion_trend": {
            "hours": hours,
            "emotions": emotion_trend,
            "most_common": max(set(emotion_trend), key=emotion_trend.count)
        },
        "correlations": {
            "heart_rate_emotion": random.uniform(0.3, 0.8),
            "volume_emotion": random.uniform(0.4, 0.7)
        }
    }

@app.websocket("/ws/realtime")
async def websocket_endpoint(websocket: WebSocket):
    """WebSocket endpoint for real-time data"""
    await manager.connect(websocket)
    
    try:
        while True:
            # Send real-time updates every 5 seconds
            await asyncio.sleep(5)
            
            # Get current data
            heart_rate_data = await get_current_heart_rate()
            emotion_data = await get_current_emotion()
            
            # Broadcast updates
            await manager.broadcast({
                "type": "update",
                "heart_rate": heart_rate_data,
                "emotion": emotion_data.dict(),
                "timestamp": datetime.now().isoformat()
            })
            
    except WebSocketDisconnect:
        manager.disconnect(websocket)

# Health check endpoint
@app.get("/health")
async def health_check():
    return {"status": "healthy", "timestamp": datetime.now().isoformat()}

if __name__ == "__main__":
    import uvicorn
    
    # Check for required dependencies
    try:
        import speech_recognition
        import librosa
        import soundfile
        logger.info("All audio processing dependencies are available")
    except ImportError as e:
        logger.error(f"Missing dependency: {e}")
        logger.error("Please install missing packages with: pip install speech_recognition librosa soundfile")
    
    logger.info("Starting CalmPulse API server...")
    uvicorn.run(app, host="0.0.0.0", port=8000)