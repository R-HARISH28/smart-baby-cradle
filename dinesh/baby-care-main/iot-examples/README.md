# IoT Device Examples

This directory contains example code for integrating IoT devices with the Baby Monitoring System.

## Available Examples

### 1. Arduino/ESP32 (arduino_esp32.ino)

**Best for:** Production deployment with real sound sensors

**Requirements:**
- ESP32, ESP8266, or Arduino with WiFi module
- Analog sound sensor module (like LM393 or similar)
- Arduino IDE with WiFi library

**Features:**
- Reads from analog sound sensor
- Averages multiple samples for accuracy
- Adjustable sensitivity thresholds
- WiFi connectivity with auto-reconnect
- LED status indicators
- Serial debugging output

**Setup:**
1. Install ESP32 board support in Arduino IDE
2. Connect sound sensor to analog pin
3. Update WiFi credentials in the code
4. Update API URL from Settings page
5. Upload to device

### 2. Python Simulator (python_simulator.py)

**Best for:** Testing, development, and demonstrations

**Requirements:**
- Python 3.6+
- `requests` library (`pip install requests`)

**Features:**
- Three simulation modes:
  - **Random**: Generates random events (70% sleep, 20% noise, 10% cry)
  - **Pattern**: Simulates realistic daily patterns
  - **Manual**: Interactive control for testing specific scenarios
- API connection testing
- Real-time console output
- Configurable update intervals

**Setup:**
1. Install Python dependencies: `pip install requests`
2. Update API_URL in the script
3. Choose simulation mode (random, pattern, or manual)
4. Run: `python3 python_simulator.py`

## Quick Start Guide

### For Real Hardware (ESP32 + Sound Sensor)

```bash
1. Wire the sound sensor:
   - VCC → 3.3V
   - GND → GND
   - OUT → GPIO 34

2. Configure arduino_esp32.ino:
   - Set WiFi SSID and password
   - Set API URL from Settings page
   - Adjust thresholds if needed

3. Upload to ESP32 and monitor Serial output
```

### For Testing Without Hardware

```bash
1. Install Python and requests:
   pip install requests

2. Update API URL in python_simulator.py

3. Run simulator:
   python3 python_simulator.py

4. Watch the dashboard update in real-time!
```

## API Integration

All devices should send POST requests to:
```
YOUR_SUPABASE_URL/functions/v1/baby-monitor-api/sound-detected
```

### Request Format

```json
{
  "intensity": 85,
  "status": "crying",
  "duration": 5
}
```

**Parameters:**
- `intensity` (0-100): Sound intensity level
- `status`: One of "sleeping", "crying", or "noise_detected"
- `duration` (optional): Duration in seconds

### Response Format

```json
{
  "success": true,
  "message": "Sound event recorded",
  "data": {
    "id": "uuid",
    "intensity": 85,
    "status": "crying",
    "detected_at": "2024-01-01T00:00:00Z"
  }
}
```

## Threshold Guidelines

Recommended intensity thresholds:

- **Sleeping**: 0-25
- **Noise Detected**: 30-60
- **Crying**: 70-100

These can be adjusted based on:
- Room ambient noise level
- Sensor sensitivity
- Baby's crying volume
- Distance from sensor to baby

## Testing Your Device

### 1. Test API Connection

```bash
curl -X POST YOUR_API_URL/sound-detected \
  -H "Content-Type: application/json" \
  -d '{"intensity": 50, "status": "noise_detected"}'
```

### 2. Monitor Serial Output (Arduino)

Open Serial Monitor at 115200 baud to see:
- WiFi connection status
- Sound sensor readings
- API response codes
- Status changes

### 3. Check Dashboard

Visit the web application and verify:
- Events appear on Dashboard
- History page shows new entries
- Real-time updates work
- Notifications trigger for crying

## Troubleshooting

### Arduino/ESP32

**WiFi won't connect:**
- Verify SSID and password
- Check WiFi signal strength
- Ensure 2.4GHz network (ESP32 doesn't support 5GHz)

**API requests failing:**
- Verify API URL is correct (copy from Settings page)
- Check internet connectivity
- Monitor serial output for error codes

**False positives:**
- Increase CRYING_THRESHOLD value
- Add more samples (increase SAMPLE_SIZE)
- Check sensor placement and sensitivity

### Python Simulator

**Connection refused:**
- Verify API URL is correct
- Check internet connection
- Ensure Supabase functions are deployed

**Module not found:**
- Install requests: `pip install requests`
- Use Python 3.6 or higher

## Security Considerations

### For Production Use:

1. **Network Security:**
   - Use WPA2/WPA3 WiFi encryption
   - Consider VPN for remote access
   - Keep devices on isolated network segment

2. **API Security:**
   - The API uses Supabase's built-in security
   - Consider adding authentication for production
   - Monitor API usage and logs

3. **Device Security:**
   - Don't hardcode sensitive credentials in production
   - Use secure storage for WiFi passwords
   - Regular firmware updates

## Hardware Recommendations

### Sound Sensors:
- **LM393 Sound Sensor**: Budget-friendly, adjustable sensitivity
- **MAX4466 Electret Microphone**: Better quality, amplified output
- **INMP441 I2S MEMS Microphone**: Professional grade, digital output

### Microcontrollers:
- **ESP32**: Best choice - WiFi, Bluetooth, plenty of GPIO
- **ESP8266**: Budget option - WiFi, less GPIO
- **Arduino + WiFi Shield**: Works but more expensive

## Advanced Usage

### Multiple Sensors

Deploy multiple devices in different locations:

```cpp
// Add device identifier to payload
String payload = "{";
payload += "\"intensity\":" + String(intensity) + ",";
payload += "\"status\":\"" + status + "\",";
payload += "\"device_id\":\"nursery_room\"";  // Add this
payload += "}";
```

### Power Optimization

For battery-powered devices:

```cpp
// Use deep sleep between readings
esp_sleep_enable_timer_wakeup(UPDATE_INTERVAL * 1000000);
esp_deep_sleep_start();
```

### Local Alerts

Add buzzer or speaker for local alerts:

```cpp
if (status == "crying") {
  tone(BUZZER_PIN, 1000, 500);  // 1000Hz for 500ms
}
```

## Support

- Check the main README.md for API documentation
- Visit Settings page for your specific API endpoint
- Monitor browser console for debugging
- Review Supabase function logs for API issues
