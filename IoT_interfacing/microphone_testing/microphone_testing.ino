#include <Adafruit_MPU6050.h>
#include <Adafruit_Sensor.h>
#include <Wire.h>

Adafruit_MPU6050 mpu;

void setup() {
  Serial.begin(115200);

  // Initialize the sensor
  if (!mpu.begin()) {
    Serial.println("Failed to find MPU6050 chip");
    while (1) { delay(10); }
  }

  // Standard ranges for baby monitoring
  mpu.setAccelerometerRange(MPU6050_RANGE_2_G);
  mpu.setFilterBandwidth(MPU6050_BAND_21_HZ);
}

void loop() {
  sensors_event_t a, g, temp;
  mpu.getEvent(&a, &g, &temp);

  // --- Exact Format Request ---
  Serial.print("Accel X: ");
  Serial.print(a.acceleration.x, 2); // '2' sets it to 2 decimal places
  Serial.print(", Y: ");
  Serial.print(a.acceleration.y, 2);
  Serial.print(", Z: ");
  Serial.print(a.acceleration.z, 2);
  Serial.println(" m/s^2");

  delay(500); // Wait half a second between readings
}