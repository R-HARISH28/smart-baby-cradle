import serial
import wave
import struct

# --- CONFIGURATION ---
PORT = 'COM10'        # Your ESP32 Port
BAUD = 115200         # Must match Serial.begin(115200)
FILENAME = "recording.wav"
SECONDS = 5           # Length of recording
FS = 16000            # Sample rate from Arduino code

def start_recording():
    try:
        ser = serial.Serial(PORT, BAUD, timeout=1)
        print(f"🔗 Connected to {PORT}. Starting {SECONDS}s recording...")
        
        audio_samples = []
        required_samples = FS * SECONDS
        
        while len(audio_samples) < required_samples:
            line = ser.readline().decode('utf-8').strip()
            if line:
                try:
                    # Convert the string from ESP32 to an integer
                    val = int(line)
                    audio_samples.append(val)
                except ValueError:
                    continue
                    
        ser.close()
        print("💾 Saving file...")

        with wave.open(FILENAME, 'wb') as wav_file:
            wav_file.setnchannels(1)     # Mono
            wav_file.setsampwidth(2)    # 16-bit
            wav_file.setframerate(FS)
            
            for sample in audio_samples:
                # Clip to 16-bit range to prevent distortion
                sample = max(-32768, min(32767, sample))
                wav_file.writeframesraw(struct.pack('<h', int(sample)))
                
        print(f"✅ Done! Open '{FILENAME}' in your folder to listen.")

    except Exception as e:
        print(f"❌ Error: {e}")

if __name__ == "__main__":
    start_recording()