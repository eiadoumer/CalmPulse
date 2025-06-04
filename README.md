# CalmPulse

**CalmPulse** is an intelligent, real-time emotional and physical state monitoring app designed to support autistic individuals and their caregivers. It combines sensor data from a mobile device, voice analysis, and AI-based or heuristic motion classification to track and infer behavioral and emotional states — helping caregivers respond proactively to stress, panic, or discomfort.

---

##  Features

###  Frontend

* **Interactive caregiver dashboard** for real-time activity and emotional summaries.
* **Child-friendly interface** with customizable animal avatars.
* Visual timeline and alerts like:

  * *"Emma had a panic attack at 3:00 PM"*
  * *"Calm and stable from 1:00 PM to 2:15 PM"*

###  Backend

* WebSocket integration with **SensorServer** to capture:

  * Real-time **accelerometer** and **gyroscope** data.
  * Heart rate (via Google Fit or Health Connect – planned).
* Data buffers and threaded processing for:

  * **Rule-based motion classification** (`Running`, `Walking`, `Standing`, `Sleeping`).
  * **Minute-wise behavior logs** in JSON.

###  Transcript & Sentiment Analysis

* Processes audio to:

  * Transcribe speech.
  * Extract **term frequency** and **voice frequency**.
  * Perform **sentiment analysis** (using Hugging Face or other pretrained models).
* Detect emotional states: `Calm`, `Happy`, `Anxious`, `Distressed`.


---

## 🚀 Getting Started

### Prerequisites

* Python 3.8+
* Install dependencies:

```bash
pip install -r requirements.txt
```

### SensorServer Setup

Install **SensorServer** from the Play Store on your Android device and ensure:

* It's on the same Wi-Fi network.
* Sensor type is set to **accelerometer** or **gyroscope**.
* You use the correct local IP in `MotionClassifier.py` like:



##  Example Output

```
WebSocket connected
10-sec label: Walking
10-sec label: Walking
Saved: {'timestamp': '2025-06-04T19:06:12.439335', 'activity': 'Walking'}
```

---

##  Future Work

*   Integration with **Health Connect** for heart rate and sleep stages.
*  Lightweight on-device model for finer emotion detection.
*  Caregiver notifications via SMS or push.
*   Data visualization in real-time.

---

##  Contributors:
 *   Eiad Oumar 
 *   Samira Jawish
 *   Nour Falha 
 *   Mustafa Ergaibi
 
---
