from fastapi import FastAPI, File, UploadFile
from fastapi.middleware.cors import CORSMiddleware
import numpy as np
import librosa
import tensorflow as tf
import pygame
import os

app = FastAPI()

# Allow your React frontend to communicate with this server
app.add_middleware(
    CORSMiddleware,
    allow_origins=["*"],
    allow_credentials=True,
    allow_methods=["*"],
    allow_headers=["*"],
)

# --- 1. Initialize Audio Player ---
pygame.mixer.init()

# --- 2. Load the TFLite Model ---
interpreter = tf.lite.Interpreter(model_path="baby_sound_classifier.tflite")
interpreter.allocate_tensors()
input_details = interpreter.get_input_details()
output_details = interpreter.get_output_details()

categories = ['baby_cry', 'baby_laugh', 'noise', 'silence']

@app.post("/predict-media")
async def predict_audio(file: UploadFile = File(...)):
    temp_file_path = f"temp_{file.filename}"
    
    try:
        # 1. Save the incoming audio chunk from the ESP32
        with open(temp_file_path, "wb") as buffer:
            buffer.write(await file.read())

        # 2. Process the audio exactly like your Tkinter app did
        y, sr = librosa.load(temp_file_path, sr=22050, duration=5)
        target_length = 22050 * 5
        
        if len(y) < target_length:
            y = np.pad(y, (0, target_length - len(y)))
        else:
            y = y[:target_length]
        
        mfcc = librosa.feature.mfcc(y=y, sr=sr, n_mfcc=40)
        
        expected_width = 216 
        if mfcc.shape[1] < expected_width:
            mfcc = np.pad(mfcc, ((0, 0), (0, expected_width - mfcc.shape[1])))
        else:
            mfcc = mfcc[:, :expected_width]
        
        mfcc = mfcc.astype(np.float32)
        input_data = np.expand_dims(np.expand_dims(mfcc, axis=0), axis=-1)

        # 3. Run Inference
        interpreter.set_tensor(input_details[0]['index'], input_data)
        interpreter.invoke()
        output_data = interpreter.get_tensor(output_details[0]['index'])
        
        predicted_index = np.argmax(output_data)
        result = categories[predicted_index]
        confidence = float(output_data[0][predicted_index]) # Convert to standard float for JSON
        
        is_crying = (result == 'baby_cry' and confidence > 0.60) # 60% threshold

        # 4. Trigger the Lullaby if crying is detected!
        if is_crying:
            print("🚨 BABY CRY DETECTED! Playing Lullaby...")
            # Only play if music isn't already playing to avoid overlapping sounds
            if not pygame.mixer.music.get_busy(): 
                pygame.mixer.music.load("lullaby.mp3")
                pygame.mixer.music.play()
        else:
            print(f"Status: {result} ({confidence*100:.1f}%)")

        return {
            "success": True, 
            "ai_analysis": {
                "is_crying": is_crying, 
                "cry_probability": confidence,
                "detected_sound": result
            }
        }

    except Exception as e:
        print(f"Error processing audio: {e}")
        return {"success": False, "error": str(e)}
        
    finally:
        # Clean up the temporary file so your hard drive doesn't fill up!
        if os.path.exists(temp_file_path):
            os.remove(temp_file_path)