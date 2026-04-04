# import os
# import librosa
# import numpy as np
# import tensorflow as tf
# from tqdm import tqdm

# # --- CONFIG ---
# DATA_PATH = r"D:\BE. CSE\Sem 6\IoT_lab\BabyCry_v2_Pro\data\raw"
# SAVE_PATH = r"D:\BE. CSE\Sem 6\IoT_lab\BabyCry_v2_Pro\data\processed"
# IMG_SIZE = (128, 128) # Square input for the CNN

# def process_audio(file_path):
#     try:
#         # Load 5 seconds at 22050Hz
#         y, sr = librosa.load(file_path, sr=22050, duration=5.0)
#         # Pad if short
#         if len(y) < sr * 5:
#             y = librosa.util.fix_length(y, size=sr * 5)
        
#         # Create Mel Spectrogram
#         mel = librosa.feature.melspectrogram(y=y, sr=sr, n_mels=128)
#         log_mel = librosa.power_to_db(mel, ref=np.max)
        
#         # Resize to 128x128 so the CNN always gets the same image size
#         # This is the "secret" to backend stability!
#         img = tf.image.resize(np.expand_dims(log_mel, axis=-1), IMG_SIZE).numpy()
#         return img
#     except:
#         return None

# X, y = [], []
# # Map your folders to labels
# label_map = {"crying": 1, "speech": 0, "noise": 0}

# for label_name, label_id in label_map.items():
#     folder = os.path.join(DATA_PATH, label_name)
#     print(f"Processing {label_name}...")
#     for root, dirs, files in os.walk(folder):
#         for file in tqdm(files):
#             if file.endswith(".wav"):
#                 feat = process_audio(os.path.join(root, file))
#                 if feat is not None:
#                     X.append(feat)
#                     y.append(label_id)

# X = np.array(X)
# y = np.array(y)

# # Save so you don't have to re-process again
# np.save(os.path.join(SAVE_PATH, "X_data.npy"), X)
# np.save(os.path.join(SAVE_PATH, "y_data.npy"), y)
# print(f"Saved {len(X)} samples!")

import os
import librosa
import numpy as np
import tensorflow as tf
from tqdm import tqdm

# --- CONFIG ---
DATA_PATH = r"D:\BE. CSE\Sem 6\IoT_lab\BabyCry_v2_Pro\data\raw"
SAVE_PATH = r"D:\BE. CSE\Sem 6\IoT_lab\BabyCry_v2_Pro\data\processed"
IMG_SIZE = (128, 128) 

def augment_audio(y, sr):
    """Creates a pitch-shifted version of the audio"""
    # Shift pitch between -2 and +2 semitones
    steps = np.random.uniform(-2.5, 2.5) 
    return librosa.effects.pitch_shift(y, sr=sr, n_steps=steps)

def create_spectrogram(y):
    """Helper to turn raw audio into the 128x128 image format"""
    mel = librosa.feature.melspectrogram(y=y, sr=22050, n_mels=128)
    log_mel = librosa.power_to_db(mel, ref=np.max)
    # Resize and add channel dimension for CNN
    img = tf.image.resize(np.expand_dims(log_mel, axis=-1), IMG_SIZE).numpy()
    return img

def process_audio(file_path, is_crying):
    features = []
    try:
        # Load 5 seconds at 22050Hz
        y, sr = librosa.load(file_path, sr=22050, duration=5.0)
        
        # Standardize length
        if len(y) < sr * 5:
            y = librosa.util.fix_length(y, size=sr * 5)
        
        # 1. Process Original
        features.append(create_spectrogram(y))
        
        # 2. ONLY for crying: Create 2 augmented versions to generalize the "voice"
        if is_crying:
            for _ in range(2):
                y_aug = augment_audio(y, sr)
                features.append(create_spectrogram(y_aug))
                
        return features
    except Exception as e:
        print(f"Error processing {file_path}: {e}")
        return None

X, y_labels = [], []
label_map = {"crying": 1, "speech": 0, "noise": 0}

if not os.path.exists(SAVE_PATH):
    os.makedirs(SAVE_PATH)

for label_name, label_id in label_map.items():
    folder = os.path.join(DATA_PATH, label_name)
    print(f"\n--- Processing {label_name.upper()} ---")
    
    # Check if folder exists
    if not os.path.exists(folder):
        print(f"Warning: Folder {folder} not found. Skipping...")
        continue

    is_crying = (label_id == 1)
    
    for root, dirs, files in os.walk(folder):
        for file in tqdm(files):
            if file.lower().endswith(".wav"):
                file_path = os.path.join(root, file)
                feats = process_audio(file_path, is_crying)
                
                if feats:
                    for f in feats:
                        X.append(f)
                        y_labels.append(label_id)

# Final Conversion to Numpy
X = np.array(X)
y_labels = np.array(y_labels)

# Save
np.save(os.path.join(SAVE_PATH, "X_data.npy"), X)
np.save(os.path.join(SAVE_PATH, "y_data.npy"), y_labels)

print(f"\n--- PROCESSING COMPLETE ---")
print(f"Total samples generated (including augmentation): {len(X)}")
print(f"Dataset Shape: {X.shape}")