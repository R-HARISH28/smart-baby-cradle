import serial
import wave
import time

# --- CONFIGURATION ---
# Check your Device Manager to see if it's COM3, COM4, etc.
PORT = 'COM10'  
BAUD_RATE = 115200
OUTPUT_FILE = "baby_cry_test_record.wav"
RECORD_SECONDS = 10
SAMPLE_RATE = 16000

try:
    ser = serial.Serial(PORT, BAUD_RATE, timeout=1)
    # Give the ESP32 a second to reset after opening serial
    time.sleep(2) 
    ser.flushInput()

    frames = []
    print(f"🔴 Recording started for {RECORD_SECONDS} seconds...")

    # 16-bit = 2 bytes per sample. 16000 samples per second.
    total_samples = SAMPLE_RATE * RECORD_SECONDS
    
    for _ in range(total_samples):
        # Read 2 bytes (one 16-bit sample)
        data = ser.read(2)
        if data:
            frames.append(data)

    print("🛑 Recording finished. Saving...")

    with wave.open(OUTPUT_FILE, 'wb') as wf:
        wf.setnchannels(1)  # Mono
        wf.setsampwidth(2)  # 2 bytes for 16-bit
        wf.setframerate(SAMPLE_RATE)
        wf.writeframes(b''.join(frames))

    print(f"✅ Success! File saved as: {OUTPUT_FILE}")

except Exception as e:
    print(f"❌ Error: {e}")
finally:
    if 'ser' in locals():
        ser.close()