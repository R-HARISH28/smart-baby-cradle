# import serial
# import wave
# import struct
# import time

# # --- Configuration ---
# PORT = 'COM10'        # Change this if your COM port changed
# BAUD = 115200
# FILENAME = "baby_cry_test.wav"
# RECORD_SECONDS = 10   # Exactly 10 seconds as requested
# SAMPLE_RATE = 16000   # Must match the ESP32 code

# def record_from_esp32():
#     try:
#         # 1. Connect to ESP32
#         ser = serial.Serial(PORT, BAUD, timeout=1)
#         print(f"✅ Connected to {PORT}")
        
#         audio_samples = []
#         total_samples_needed = SAMPLE_RATE * RECORD_SECONDS
        
#         print(f"🎙️ Recording START... (Talk for {RECORD_SECONDS}s)")
        
#         # 2. Collect data until we have 10 seconds worth
#         start_time = time.time()
#         while len(audio_samples) < total_samples_needed:
#             line = ser.readline().decode('utf-8').strip()
#             if line:
#                 try:
#                     audio_samples.append(int(line))
#                 except ValueError:
#                     continue
            
#             # Progress update every 2 seconds
#             if int(time.time() - start_time) % 2 == 0 and int(time.time() - start_time) > 0:
#                 print(f"Progress: {len(audio_samples)//SAMPLE_RATE}s collected...")

#         ser.close()
#         print("🛑 Recording finished. Processing file...")

#         # 3. Save as a playable WAV file
#         with wave.open(FILENAME, 'wb') as wav_file:
#             wav_file.setnchannels(1)  # Mono
#             wav_file.setsampwidth(2) # 16-bit
#             wav_file.setframerate(SAMPLE_RATE)
            
#             for s in audio_samples:
#                 # Clamp value to prevent distortion/crashing
#                 s = max(-32768, min(32767, s))
#                 wav_file.writeframesraw(struct.pack('<h', int(s)))

#         print(f"✨ SUCCESS! File saved as: {FILENAME}")

#     except Exception as e:
#         print(f"❌ Error: {e}")

# if __name__ == "__main__":
#     record_from_esp32()

import serial
import wave
import struct
import time

# --- Configuration ---
PORT = 'COM10'
BAUD = 115200
FILENAME = "debug_recording.wav"
RECORD_SECONDS = 10
TIMEOUT_SECONDS = 15  # Terminate if no data for 15s
SAMPLE_RATE = 16000

def record_with_debug():
    try:
        ser = serial.Serial(PORT, BAUD, timeout=1)
        print(f"Connected to {PORT}. Waiting for data...")
        
        audio_samples = []
        zero_count = 0
        start_time = time.time()

        while len(audio_samples) < (SAMPLE_RATE * RECORD_SECONDS):
            # 1. Check for global timeout
            if time.time() - start_time > TIMEOUT_SECONDS:
                print("\nTERMINATED: No data received within 15 seconds.")
                print("Check: Is the ESP32 plugged in? Is the correct COM port selected?")
                break

            line = ser.readline().decode('utf-8').strip()
            
            if line:
                try:
                    val = int(line)
                    audio_samples.append(val)
                    if val == 0:
                        zero_count += 1
                except ValueError:
                    continue
            else:
                continue

        ser.close()

        # --- Analysis of what happened ---
        if len(audio_samples) == 0:
            print("ERROR: Collected 0 samples. The ESP32 is not sending anything.")
            return

        zero_percentage = (zero_count / len(audio_samples)) * 100
        print(f"\nAnalysis: Collected {len(audio_samples)} samples.")
        print(f"Zero-Data Rate: {zero_percentage:.1f}%")

        if zero_percentage > 99:
            print("ERROR: Your sensor is sending ONLY ZEROS.")
            print("Fix: Connect the L/R pin to GND and check the SD/SCK wiring!")
        elif len(audio_samples) < (SAMPLE_RATE * RECORD_SECONDS):
            print("WARNING: Recording was incomplete due to timeout.")
        else:
            print("SUCCESS: Data received! Saving file...")
            save_wav(audio_samples)

    except Exception as e:
        print(f"Connection Error: {e}")

def save_wav(data):
    with wave.open(FILENAME, 'wb') as wav_file:
        wav_file.setnchannels(1)
        wav_file.setsampwidth(2)
        wav_file.setframerate(SAMPLE_RATE)
        for s in data:
            s = max(-32768, min(32767, s))
            wav_file.writeframesraw(struct.pack('<h', int(s)))
    print(f"File saved as: {FILENAME}")

if __name__ == "__main__":
    record_with_debug() 

    