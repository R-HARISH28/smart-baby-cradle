import io
import librosa
import numpy as np
import tensorflow as tf
import os
from fastapi import FastAPI, UploadFile, File
from fastapi.middleware.cors import CORSMiddleware
from pydub import AudioSegment


import os
import io
import librosa
import numpy as np
import tensorflow as tf
from pydub import AudioSegment

# --- FFmpeg Configuration ---
# This ensures pydub finds the ffmpeg.exe you have in your folder
base_path = os.path.dirname(os.path.abspath(__file__))
AudioSegment.converter = os.path.join(base_path, "ffmpeg.exe")
AudioSegment.ffprobe = os.path.join(base_path, "ffprobe.exe")

app = FastAPI()

# Enable CORS so your React app can talk to this server
app.add_middleware(
    CORSMiddleware,
    allow_origins=["http://localhost:5173"], # Allow your React app
    allow_credentials=True,
    allow_methods=["*"],
    allow_headers=["*"],
)

# Load your TFLite model
# interpreter = tf.lite.Interpreter(model_path="baby_sound_classifier.tflite")


# This finds the folder where main2.py actually lives
base_dir = os.path.dirname(os.path.abspath(__file__))
model_path = os.path.join(base_dir, "baby_cry_v2_pro.tflite")

interpreter = tf.lite.Interpreter(model_path=model_path)


interpreter.allocate_tensors()
input_details = interpreter.get_input_details()
output_details = interpreter.get_output_details()

# def predict_cry(audio_bytes):
#     # 1. Load bytes into librosa (22050Hz to match your training)
#     y, sr = librosa.load(io.BytesIO(audio_bytes), sr=22050)
    
#     # 2. Extract Mel Spectrogram (Match your training shape!)
#     mel_spec = librosa.feature.melspectrogram(y=y, sr=sr, n_mels=128)
#     log_mel_spec = librosa.power_to_db(mel_spec, ref=np.max)
    
#     # 3. Resize/Reshape to match model input (e.g., [1, 128, 128, 1])
#     # Note: Adjust these dimensions to match YOUR specific model input shape
#     input_data = np.expand_dims(log_mel_spec, axis=(0, -1))
#     input_data = tf.image.resize(input_data, [128, 128]).numpy()

#     # 4. Inference
#     interpreter.set_tensor(input_details[0]['index'], input_data)
#     interpreter.invoke()
#     prediction = interpreter.get_tensor(output_details[0]['index'])
    
#     # Assuming index 0 is 'baby_cry'
#     confidence = float(prediction[0][0]) 
#     return confidence


# def predict_cry(audio_bytes):
#     try:
#         audio = AudioSegment.from_file(io.BytesIO(audio_bytes))
#         wav_buffer = io.BytesIO()
#         audio.export(wav_buffer, format="wav")
#         wav_buffer.seek(0)
        
#         y, sr = librosa.load(wav_buffer, sr=22050)

#         # 1. Keep n_mels at 40
#         mel_spec = librosa.feature.melspectrogram(y=y, sr=sr, n_mels=40) 
#         log_mel_spec = librosa.power_to_db(mel_spec, ref=np.max)

#         # 2. Reshape to match [1, 40, 216, 1]
#         input_data = np.expand_dims(log_mel_spec, axis=(0, -1))
        
#         # --- CRITICAL CHANGE HERE ---
#         # Height: 40, Width: 216
#         input_data = tf.image.resize(input_data, [40, 216]).numpy()

#         # 3. Run Inference
#         interpreter.set_tensor(input_details[0]['index'], input_data)
#         interpreter.invoke()
#         prediction = interpreter.get_tensor(output_details[0]['index'])

#         confidence = float(prediction[0][0])
#         print(f"Prediction: {confidence:.4f}")
#         return confidence
        
#     except Exception as e:
#         print(f"CRITICAL ERROR: {e}")
#         return 0.0

def predict_cry(audio_bytes):
    try:
        # 1. Convert to WAV
        audio = AudioSegment.from_file(io.BytesIO(audio_bytes))
        wav_buffer = io.BytesIO()
        audio.export(wav_buffer, format="wav")
        wav_buffer.seek(0)
        
        # 2. Load with librosa at 22050Hz
        y, sr = librosa.load(wav_buffer, sr=22050)

        # --- UPDATE THIS: Match your new Training Settings ---
        # 3. Change n_mels from 40 to 128
        mel_spec = librosa.feature.melspectrogram(y=y, sr=sr, n_mels=128) 
        log_mel_spec = librosa.power_to_db(mel_spec, ref=np.max)

        # 4. Prepare for CNN [Batch, Height, Width, Channels]
        input_data = np.expand_dims(log_mel_spec, axis=(0, -1))
        
        # 5. Resize to exactly 128x128 (Matches your new IMG_SIZE)
        input_data = tf.image.resize(input_data, [128, 128]).numpy()

        # 6. Run Inference
        interpreter.set_tensor(input_details[0]['index'], input_data)
        interpreter.invoke()
        prediction = interpreter.get_tensor(output_details[0]['index'])

        # Since your new model is a sigmoid (binary), confidence is prediction[0][0]
        confidence = float(prediction[0][0])
        print(f"Prediction: {confidence:.4f}")
        return confidence
        
    except Exception as e:
        print(f"CRITICAL ERROR: {e}")
        return 0.0    

@app.post("/predict")
async def predict(file: UploadFile = File(...)):
    audio_bytes = await file.read()
    confidence = predict_cry(audio_bytes)
    
    # Add this check to prevent the crash
    if confidence is None:
        return {"is_crying": False, "confidence": 0, "label": "Error processing audio"}

    is_crying = confidence > 0.80 
    return {
        "is_crying": is_crying,
        "confidence": round(float(confidence) * 100, 2),
        "label": "Crying" if is_crying else "Quiet/Noise"
    }