#include <driver/i2s.h>

// --- Microphone Pins ---
#define I2S_WS 15
#define I2S_SD 32
#define I2S_SCK 14
#define I2S_PORT I2S_NUM_0

void setup() {
  // Fast baud rate for live audio data
  Serial.begin(115200);

  // Configure I2S to read from the INMP441
  i2s_config_t i2s_config = {
    .mode = (i2s_mode_t)(I2S_MODE_MASTER | I2S_MODE_RX),
    .sample_rate = 16000,
    // The INMP441 outputs 24-bit data, so we read as 32-bit and scale it down
    .bits_per_sample = I2S_BITS_PER_SAMPLE_32BIT, 
    .channel_format = I2S_CHANNEL_FMT_ONLY_LEFT,
    .communication_format = i2s_comm_format_t(I2S_COMM_FORMAT_I2S | I2S_COMM_FORMAT_I2S_MSB),
    .intr_alloc_flags = ESP_INTR_FLAG_LEVEL1,
    .dma_buf_count = 8,
    .dma_buf_len = 64, // Small buffer for fast, real-time plotting
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
}

void loop() {
  int32_t sample = 0;
  size_t bytesIn = 0;
  
  // Read one chunk of audio from the microphone
  esp_err_t result = i2s_read(I2S_PORT, &sample, sizeof(sample), &bytesIn, portMAX_DELAY);

  if (result == ESP_OK && bytesIn > 0) {
    // Shift the 32-bit data down so it fits nicely on the graph
    sample >>= 14; 
    
    // Print the raw sound wave number!
    Serial.println(sample);
  }
}