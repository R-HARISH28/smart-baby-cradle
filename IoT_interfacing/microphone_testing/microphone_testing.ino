#include <driver/i2s.h>

// --- PIN CONFIGURATION ---
#define I2S_WS 15
#define I2S_SD 32
#define I2S_SCK 14
#define I2S_PORT I2S_NUM_0

// Buffer for reading data
#define bufferLen 64
int32_t sBuffer[bufferLen];

void setup() {
  // Initialize Serial at 115200 - Make sure Serial Plotter matches this!
  Serial.begin(115200);
  while (!Serial) { ; }
  
  delay(1000); 
  Serial.println("INMP441 Clean Waveform Test Starting...");

  // I2S Configuration
  const i2s_config_t i2s_config = {
    .mode = (i2s_mode_t)(I2S_MODE_MASTER | I2S_MODE_RX),
    .sample_rate = 16000,
    .bits_per_sample = I2S_BITS_PER_SAMPLE_32BIT,
    .channel_format = I2S_CHANNEL_FMT_ONLY_LEFT,
    .communication_format = I2S_COMM_FORMAT_I2S,
    .intr_alloc_flags = ESP_INTR_FLAG_LEVEL1,
    .dma_buf_count = 8,
    .dma_buf_len = bufferLen,
    .use_apll = false
  };

  const i2s_pin_config_t pin_config = {
    .bck_io_num = I2S_SCK,
    .ws_io_num = I2S_WS,
    .data_out_num = I2S_PIN_NO_CHANGE, 
    .data_in_num = I2S_SD
  };

  // Install and Start Driver
  i2s_driver_install(I2S_PORT, &i2s_config, 0, NULL);
  i2s_set_pin(I2S_PORT, &pin_config);
  i2s_start(I2S_PORT);

  Serial.println("Mic Ready! Open Serial Plotter to see waves.");
}

void loop() {
  size_t bytesIn = 0;
  
  // Read data from the I2S mic
  esp_err_t result = i2s_read(I2S_PORT, &sBuffer, bufferLen * sizeof(int32_t), &bytesIn, portMAX_DELAY);

  if (result == ESP_OK) {
    int samples_read = bytesIn / sizeof(int32_t);
    for (int i = 0; i < samples_read; i++) {
      
      // Shift bits to bring the high-precision 32-bit data down 
      // to a range the Serial Plotter can display clearly.
      int32_t sample = sBuffer[i] >> 14; 
      
      // Only print if there is a signal to avoid filling the screen with 0s
      // if (sample != 0) {
        Serial.println(sample);
      // }
    }
  }
}