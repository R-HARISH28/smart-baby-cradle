/*
 * Baby Monitoring System - IoT Device Code
 * Compatible with: Arduino with WiFi module, ESP32, ESP8266
 *
 * This code reads sound levels from an analog sound sensor,
 * determines the baby's status, and sends data to the API.
 */

#include <WiFi.h>
#include <HTTPClient.h>

// WiFi Configuration
const char* ssid = "YOUR_WIFI_SSID";
const char* password = "YOUR_WIFI_PASSWORD";

// API Configuration
const char* apiUrl = "YOUR_SUPABASE_URL/functions/v1/baby-monitor-api/sound-detected";

// Hardware Configuration
const int SOUND_SENSOR_PIN = 34;  // Analog pin for sound sensor
const int LED_PIN = 2;             // Built-in LED for status indication

// Threshold Configuration
const int CRYING_THRESHOLD = 70;    // Intensity level for crying
const int NOISE_THRESHOLD = 30;     // Intensity level for noise detection
const int SAMPLE_SIZE = 10;         // Number of samples to average
const int SAMPLE_DELAY = 50;        // Delay between samples (ms)
const int UPDATE_INTERVAL = 2000;   // Update interval (ms)

// Global Variables
unsigned long lastUpdateTime = 0;
String lastStatus = "sleeping";

void setup() {
  Serial.begin(115200);
  pinMode(LED_PIN, OUTPUT);
  pinMode(SOUND_SENSOR_PIN, INPUT);

  Serial.println("Baby Monitor IoT Device Starting...");

  // Connect to WiFi
  connectToWiFi();

  Serial.println("Device Ready!");
  Serial.println("Monitoring baby...");
}

void loop() {
  // Check if it's time to send an update
  if (millis() - lastUpdateTime >= UPDATE_INTERVAL) {
    // Read sound level
    int intensity = readSoundLevel();

    // Determine status based on intensity
    String status = determineStatus(intensity);

    // Send data to API
    sendSoundData(intensity, status);

    // Update last status and time
    lastStatus = status;
    lastUpdateTime = millis();

    // Visual feedback on LED
    blinkLED(status);

    // Print to serial for debugging
    Serial.print("Status: ");
    Serial.print(status);
    Serial.print(" | Intensity: ");
    Serial.println(intensity);
  }

  delay(100);
}

void connectToWiFi() {
  Serial.print("Connecting to WiFi");
  WiFi.begin(ssid, password);

  int attempts = 0;
  while (WiFi.status() != WL_CONNECTED && attempts < 20) {
    delay(500);
    Serial.print(".");
    attempts++;
  }

  if (WiFi.status() == WL_CONNECTED) {
    Serial.println("\nWiFi Connected!");
    Serial.print("IP Address: ");
    Serial.println(WiFi.localIP());
  } else {
    Serial.println("\nWiFi Connection Failed!");
  }
}

int readSoundLevel() {
  // Take multiple samples and average them
  long sum = 0;
  int maxValue = 0;

  for (int i = 0; i < SAMPLE_SIZE; i++) {
    int value = analogRead(SOUND_SENSOR_PIN);
    sum += value;
    if (value > maxValue) {
      maxValue = value;
    }
    delay(SAMPLE_DELAY);
  }

  // Calculate average
  int avgValue = sum / SAMPLE_SIZE;

  // Convert to 0-100 scale (ESP32 ADC is 12-bit: 0-4095)
  int intensity = map(maxValue, 0, 4095, 0, 100);

  // Ensure intensity is within bounds
  intensity = constrain(intensity, 0, 100);

  return intensity;
}

String determineStatus(int intensity) {
  if (intensity >= CRYING_THRESHOLD) {
    return "crying";
  } else if (intensity >= NOISE_THRESHOLD) {
    return "noise_detected";
  } else {
    return "sleeping";
  }
}

void sendSoundData(int intensity, String status) {
  // Check WiFi connection
  if (WiFi.status() != WL_CONNECTED) {
    Serial.println("WiFi not connected. Attempting to reconnect...");
    connectToWiFi();
    return;
  }

  HTTPClient http;

  // Initialize HTTP request
  http.begin(apiUrl);
  http.addHeader("Content-Type", "application/json");

  // Create JSON payload
  String payload = "{";
  payload += "\"intensity\":" + String(intensity) + ",";
  payload += "\"status\":\"" + status + "\",";
  payload += "\"duration\":0";
  payload += "}";

  // Send POST request
  int httpResponseCode = http.POST(payload);

  // Handle response
  if (httpResponseCode > 0) {
    String response = http.getString();
    Serial.print("API Response Code: ");
    Serial.println(httpResponseCode);

    if (httpResponseCode == 200) {
      Serial.println("Data sent successfully!");
    } else {
      Serial.print("Error: ");
      Serial.println(response);
    }
  } else {
    Serial.print("HTTP Request Failed, Error: ");
    Serial.println(http.errorToString(httpResponseCode).c_str());
  }

  http.end();
}

void blinkLED(String status) {
  // Visual feedback based on status
  if (status == "crying") {
    // Fast blink for crying
    for (int i = 0; i < 3; i++) {
      digitalWrite(LED_PIN, HIGH);
      delay(100);
      digitalWrite(LED_PIN, LOW);
      delay(100);
    }
  } else if (status == "noise_detected") {
    // Single blink for noise
    digitalWrite(LED_PIN, HIGH);
    delay(200);
    digitalWrite(LED_PIN, LOW);
  } else {
    // LED off for sleeping
    digitalWrite(LED_PIN, LOW);
  }
}

/*
 * HARDWARE SETUP:
 *
 * 1. Sound Sensor Module:
 *    - VCC -> 3.3V
 *    - GND -> GND
 *    - OUT -> GPIO 34 (or any analog pin)
 *
 * 2. LED (Built-in on most ESP32 boards):
 *    - Connected to GPIO 2
 *
 * CONFIGURATION:
 *
 * 1. Update WiFi credentials:
 *    - Replace YOUR_WIFI_SSID with your WiFi network name
 *    - Replace YOUR_WIFI_PASSWORD with your WiFi password
 *
 * 2. Update API URL:
 *    - Replace YOUR_SUPABASE_URL with your Supabase project URL
 *    - The full URL should look like:
 *      https://xxxxx.supabase.co/functions/v1/baby-monitor-api/sound-detected
 *
 * 3. Adjust thresholds if needed:
 *    - CRYING_THRESHOLD: Sound level for crying detection
 *    - NOISE_THRESHOLD: Sound level for general noise
 *    - UPDATE_INTERVAL: How often to send updates (ms)
 *
 * TROUBLESHOOTING:
 *
 * - Open Serial Monitor (115200 baud) to see debug output
 * - Check WiFi connection status and IP address
 * - Verify API endpoint URL is correct
 * - Monitor sound sensor readings to adjust thresholds
 * - Ensure sound sensor is properly connected and powered
 */
