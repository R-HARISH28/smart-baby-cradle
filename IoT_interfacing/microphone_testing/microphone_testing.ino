#include <WiFi.h>
#include <HTTPClient.h>
#include <driver/i2s.h>

// --- 1. YOUR NETWORK SETTINGS (UPDATE THESE!) ---
const char* WIFI_SSID = "dhev";
const char* WIFI_PASSWORD = "dhevon2005";

// Replace 192.168.X.X with your laptop's actual IPv4 address
const char* SERVER_URL = "http://10.251.153.42/save-audio"; 

// --- 2. MICROPHONE PINS (Matches your wiring) ---
#define I2S_WS 15
#define I2S_SD 32
#define I2S_SCK 14
#define I2S_PORT I2S_NUM_0

// --- 3. AUDIO SETTINGS ---
const int sampleRate = 16000; 
const int durationSeconds = 3; 
const int headerSize = 44;
const int audioSize = sampleRate * 2 * durationSeconds; 
const int totalSize = headerSize + audioSize;

uint8_t* audioBuffer = nullptr; 

void setup() {
  Serial.begin(115200);
  
  // Connect to Wi-Fi
  Serial.print("Connecting to Wi-Fi");
  WiFi.begin(WIFI_SSID, WIFI_PASSWORD);
  while (WiFi.status() != WL_CONNECTED) {
    delay(500);
    Serial.print(".");
  }
  Serial.println("\nWi-Fi Connected!");

  // Configure I2S for the INMP441
  i2s_config_t i2s_config = {
    .mode = (i2s_mode_t)(I2S_MODE_MASTER | I2S_MODE_RX),
    .sample_rate = sampleRate,
    .bits_per_sample = I2S_BITS_PER_SAMPLE_16BIT,
    .channel_format = I2S_CHANNEL_FMT_ONLY_LEFT,
    .communication_format = i2s_comm_format_t(I2S_COMM_FORMAT_I2S | I2S_COMM_FORMAT_I2S_MSB),
    .intr_alloc_flags = ESP_INTR_FLAG_LEVEL1,
    .dma_buf_count = 8,
    .dma_buf_len = 1024,
    .use_apll = false,
    .tx_desc_auto_clear = false,
    .fixed_mclk = 0
  };
  
  i2s_pin_config_t pin_config = {
    .bck_io_num = I2S_SCK,
    .ws_io_num = I2S_WS,
    .data_out_num = I2S_PIN_NO_CHANGE,
    .data_in_num = I2S_SD
  };
  
  i2s_driver_install(I2S_PORT, &i2s_config, 0, NULL);
  i2s_set_pin(I2S_PORT, &pin_config);

  // Allocate memory
  audioBuffer = (uint8_t*)malloc(totalSize);
  if (audioBuffer == nullptr) {
    Serial.println("Memory allocation failed!");
    while(1); 
  }
  
  generateWAVHeader(audioBuffer, audioSize, sampleRate);
}

void loop() {
  if (WiFi.status() == WL_CONNECTED) {
    Serial.println("🎙️ Recording 3 seconds of audio...");
    
    size_t bytesRead = 0;
    i2s_read(I2S_PORT, audioBuffer + headerSize, audioSize, &