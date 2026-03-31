#!/usr/bin/env python3
"""
Baby Monitoring System - Python Simulator
This script simulates an IoT sound sensor device for testing purposes.
It can be used to generate test data or as a reference implementation.
"""

import requests
import time
import random
import json
from datetime import datetime

# Configuration
API_URL = "YOUR_SUPABASE_URL/functions/v1/baby-monitor-api/sound-detected"
UPDATE_INTERVAL = 5  # seconds
SIMULATION_MODE = "random"  # "random", "pattern", or "manual"

class BabyMonitorSimulator:
    def __init__(self, api_url):
        self.api_url = api_url
        self.session = requests.Session()
        self.session.headers.update({
            'Content-Type': 'application/json'
        })

    def send_sound_data(self, intensity, status, duration=0):
        """Send sound detection data to the API"""
        payload = {
            "intensity": intensity,
            "status": status,
            "duration": duration
        }

        try:
            response = self.session.post(self.api_url, json=payload)
            response.raise_for_status()

            print(f"[{datetime.now().strftime('%H:%M:%S')}] "
                  f"Status: {status:15} | Intensity: {intensity:3}% | "
                  f"Response: {response.status_code}")

            return response.json()

        except requests.exceptions.RequestException as e:
            print(f"Error sending data: {e}")
            return None

    def random_simulation(self):
        """Generate random sound events"""
        # 70% sleeping, 20% noise, 10% crying
        rand = random.random()

        if rand < 0.7:
            # Sleeping - low intensity
            intensity = random.randint(0, 25)
            status = "sleeping"
        elif rand < 0.9:
            # Noise detected - medium intensity
            intensity = random.randint(30, 60)
            status = "noise_detected"
        else:
            # Crying - high intensity
            intensity = random.randint(70, 100)
            status = "crying"
            duration = random.randint(3, 10)
            return self.send_sound_data(intensity, status, duration)

        return self.send_sound_data(intensity, status)

    def pattern_simulation(self):
        """Simulate a realistic pattern: sleep -> noise -> cry -> sleep"""
        patterns = [
            # Morning routine
            ("sleeping", 10, 0),
            ("sleeping", 8, 0),
            ("noise_detected", 45, 0),
            ("sleeping", 12, 0),
            ("crying", 85, 5),
            ("noise_detected", 40, 0),
            ("sleeping", 15, 0),

            # Midday
            ("sleeping", 5, 0),
            ("noise_detected", 50, 0),
            ("crying", 90, 8),
            ("crying", 75, 3),
            ("noise_detected", 35, 0),
            ("sleeping", 20, 0),

            # Evening
            ("sleeping", 10, 0),
            ("crying", 80, 6),
            ("noise_detected", 45, 0),
            ("sleeping", 18, 0),
        ]

        for status, intensity, duration in patterns:
            self.send_sound_data(intensity, status, duration)
            time.sleep(UPDATE_INTERVAL)

    def manual_mode(self):
        """Interactive manual control"""
        print("\nManual Mode - Enter commands:")
        print("  s [intensity] - Sleeping (0-25)")
        print("  n [intensity] - Noise detected (30-60)")
        print("  c [intensity] [duration] - Crying (70-100)")
        print("  q - Quit")
        print()

        while True:
            try:
                cmd = input("> ").strip().lower().split()

                if not cmd:
                    continue

                if cmd[0] == 'q':
                    break

                elif cmd[0] == 's':
                    intensity = int(cmd[1]) if len(cmd) > 1 else 10
                    self.send_sound_data(intensity, "sleeping")

                elif cmd[0] == 'n':
                    intensity = int(cmd[1]) if len(cmd) > 1 else 45
                    self.send_sound_data(intensity, "noise_detected")

                elif cmd[0] == 'c':
                    intensity = int(cmd[1]) if len(cmd) > 1 else 85
                    duration = int(cmd[2]) if len(cmd) > 2 else 5
                    self.send_sound_data(intensity, "crying", duration)

                else:
                    print("Unknown command")

            except (ValueError, IndexError):
                print("Invalid input")
            except KeyboardInterrupt:
                break

    def run(self, mode="random"):
        """Run the simulator in specified mode"""
        print(f"Baby Monitor Simulator Starting...")
        print(f"API URL: {self.api_url}")
        print(f"Mode: {mode}")
        print(f"Update Interval: {UPDATE_INTERVAL}s")
        print("-" * 60)

        try:
            if mode == "random":
                print("Starting random simulation (Ctrl+C to stop)...\n")
                while True:
                    self.random_simulation()
                    time.sleep(UPDATE_INTERVAL)

            elif mode == "pattern":
                print("Starting pattern simulation...\n")
                self.pattern_simulation()
                print("\nPattern simulation completed!")

            elif mode == "manual":
                self.manual_mode()

            else:
                print(f"Unknown mode: {mode}")

        except KeyboardInterrupt:
            print("\n\nSimulation stopped by user")


def test_api_connection(api_url):
    """Test if the API is accessible"""
    print("Testing API connection...")
    try:
        response = requests.post(
            api_url,
            json={"intensity": 10, "status": "sleeping"},
            timeout=5
        )
        response.raise_for_status()
        print("✓ API connection successful!")
        return True
    except Exception as e:
        print(f"✗ API connection failed: {e}")
        return False


if __name__ == "__main__":
    import sys

    # Check if API URL is configured
    if API_URL == "YOUR_SUPABASE_URL/functions/v1/baby-monitor-api/sound-detected":
        print("ERROR: Please configure API_URL in the script")
        print("Find your API URL in the Settings page of the web application")
        sys.exit(1)

    # Test API connection
    if not test_api_connection(API_URL):
        print("\nPlease check your API URL and try again")
        sys.exit(1)

    print()

    # Create simulator
    simulator = BabyMonitorSimulator(API_URL)

    # Run simulation
    simulator.run(mode=SIMULATION_MODE)
