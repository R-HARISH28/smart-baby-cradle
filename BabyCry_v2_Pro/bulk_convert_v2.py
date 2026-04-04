import os
import subprocess
from concurrent.futures import ThreadPoolExecutor

# --- CONFIGURATION ---
INPUT_DIR = r"D:\BE. CSE\Sem 6\IoT_lab\BabyCry_v2_Pro\data\raw\speech"
OUTPUT_DIR = r"D:\BE. CSE\Sem 6\IoT_lab\BabyCry_v2_Pro\data\raw\speech_new"
FFMPEG_PATH = r"D:\BE. CSE\Sem 6\IoT_lab\dinesh\baby-care-backend-main\ffmpeg.exe"

def convert_task(task):
    """
    Function to handle a single file conversion.
    task is a tuple: (input_full_path, output_full_path)
    """
    input_path, output_path = task
    
    # ffmpeg command: 
    # -y (overwrite), -i (input), -ar 22050 (sample rate), -ac 1 (mono)
    command = [
        FFMPEG_PATH, "-y", "-i", input_path, 
        "-ar", "22050", "-ac", "1", output_path
    ]
    
    try:
        subprocess.run(command, check=True, stdout=subprocess.DEVNULL, stderr=subprocess.DEVNULL)
        return f"SUCCESS: {os.path.basename(input_path)}"
    except Exception as e:
        return f"ERROR: {os.path.basename(input_path)} -> {e}"

def main():
    tasks = []
    
    print("Scanning folders and building task list...")
    
    # 1. Walk through the entire input directory tree
    for root, dirs, files in os.walk(INPUT_DIR):
        for file in files:
            if file.lower().endswith(".mp3"):
                # Determine the relative path from the input root
                rel_path = os.path.relpath(root, INPUT_DIR)
                
                # Create the corresponding directory in the output root
                target_dir = os.path.join(OUTPUT_DIR, rel_path)
                if not os.path.exists(target_dir):
                    os.makedirs(target_dir)
                
                # Define full paths
                input_full_path = os.path.join(root, file)
                # Change extension to .wav
                file_no_ext = os.path.splitext(file)[0]
                output_full_path = os.path.join(target_dir, f"{file_no_ext}.wav")
                
                tasks.append((input_full_path, output_full_path))

    print(f"Found {len(tasks)} files to convert.")

    # 2. Run conversions in parallel (using 8 threads for speed)
    with ThreadPoolExecutor(max_workers=8) as executor:
        results = list(executor.map(convert_task, tasks))

    # 3. Print a quick summary
    for res in results[-10:]:  # Show last 10 results
        print(res)
    
    print(f"\n--- DONE! All files organized in: {OUTPUT_DIR} ---")

if __name__ == "__main__":
    main()