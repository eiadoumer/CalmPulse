import sounddevice as sd
from scipy.io.wavfile import write
import numpy as np
import whisper
import os
import re
import json
from collections import Counter
import time
import nltk
from nltk.corpus import stopwords
from datetime import datetime
from queue import Queue
from textblob import TextBlob


# --- CONFIGURATION ---
SAMPLE_RATE = 16000
CHUNK_SECONDS = 10
CHUNK_SIZE = SAMPLE_RATE * CHUNK_SECONDS
JSON_LOG = "audio_log.json"
VOLUME_THRESHOLDS = {"low": 0.02, "high": 0.1}

# --- INITIALIZE ---
nltk.download('stopwords')
STOPWORDS = set(stopwords.words('english'))
model = whisper.load_model("base")

# --- GLOBAL BUFFER ---
audio_queue = Queue()

# --- AUDIO CALLBACK ---
def audio_callback(indata, frames, time_info, status):
    audio_queue.put(indata.copy())

# --- ANALYZE VOLUME ---
def get_volume_level(audio_data):
    volume = np.abs(audio_data).mean()
    if volume < VOLUME_THRESHOLDS["low"]:
        return "Low"
    elif volume > VOLUME_THRESHOLDS["high"]:
        return "High"
    else:
        return "Normal"

# --- TRANSCRIBE AUDIO ---
def transcribe_audio(file_path):
    print("🧠 Transcribing...")
    result = model.transcribe(file_path)
    return result["text"]

# --- PREPROCESS AND TERM FREQUENCY ---
from textblob import TextBlob

# --- PREPROCESS AND TERM FREQUENCY + SENTIMENT ---
def preprocess_and_analyze(text):
    print("🧪 Analyzing...")

    # Clean and tokenize
    cleaned = re.sub(r"[^\w\s]", "", text.lower())
    words = cleaned.split()
    meaningful_terms = [word for word in words if word not in STOPWORDS and len(word) > 2]

    # Frequency and repeated terms
    counts = Counter(meaningful_terms)
    repeated = [word for word, count in counts.items() if count > 1]

    # Sentiment analysis
    blob = TextBlob(text)
    polarity = blob.sentiment.polarity
    if polarity > 0.1:
        sentiment = "Positive"
    elif polarity < -0.1:
        sentiment = "Negative"
    else:
        sentiment = "Neutral"

    return repeated, counts, meaningful_terms, sentiment

# --- SAVE RESULTS TO JSON ---
def save_to_json(transcript, volume_level, repeated_words, freq, meaningful_terms, sentiment):
    log_entry = {
        "timestamp": datetime.utcnow().isoformat(),
        "audio": {
            "volume_level": volume_level,
            "transcript": transcript,
            "meaningful_terms": meaningful_terms,
            "repeated_words": repeated_words,
            "word_frequency": dict(freq),
            "sentiment": sentiment  # ✅ Add this
        }
    }
    ...

    if not os.path.exists(JSON_LOG):
        with open(JSON_LOG, 'w') as f:
            json.dump([log_entry], f, indent=4)
    else:
        with open(JSON_LOG, 'r+') as f:
            data = json.load(f)
            data.append(log_entry)
            f.seek(0)
            json.dump(data, f, indent=4)

    print(f"💾 Logged to {JSON_LOG} (Sentiment: {sentiment})")

# --- MAIN LOOP ---
def main_loop():
    print("🎙️ Starting continuous recording. Press Ctrl+C to stop.\n")
    audio_buffer = []

    try:
        with sd.InputStream(samplerate=SAMPLE_RATE, channels=1, callback=audio_callback):
            while True:
                # Wait for audio chunks
                chunk = audio_queue.get()
                audio_buffer.append(chunk)

                # If enough data for 5 seconds, process it
                total_samples = sum(len(b) for b in audio_buffer)
                if total_samples >= CHUNK_SIZE:
                    combined = np.concatenate(audio_buffer)[:CHUNK_SIZE]
                    audio_buffer = [np.concatenate(audio_buffer)[CHUNK_SIZE:]]  # Keep leftover

                    file_path = "temp.wav"
                    write(file_path, SAMPLE_RATE, combined)

                    volume_level = get_volume_level(combined)
                    print(f"🔊 Volume level: {volume_level}")

                    transcript = transcribe_audio(file_path)
                    print(f"📝 Transcript: {transcript}")

                    repeated_words, freq, meaningful_terms, sentiment = preprocess_and_analyze(transcript)

                    print(f"🔁 Repeated words: {repeated_words}")
                    print(f"📊 Word frequency: {dict(freq)}")
                    print(f"🌟 Meaningful terms: {meaningful_terms}")

                    save_to_json(transcript, volume_level, repeated_words, freq, meaningful_terms, sentiment)

    except KeyboardInterrupt:
        print("\n🛑 Stopped by user.")

# --- RUN SCRIPT ---
if __name__ == "__main__":
    main_loop()
