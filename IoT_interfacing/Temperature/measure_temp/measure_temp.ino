// #include <DHT.h>
// #include <DHT_U.h>

// #include <Adafruit_Sensor.h>

// #include "DHT.h"

// #define DHTPIN 4     // Digital pin connected to the DHT sensor
// #define DHTTYPE DHT11   // Specifying the sensor type

// DHT dht(DHTPIN, DHTTYPE);

// void setup() {
//   Serial.begin(115200);
//   Serial.println(F("DHT11 Test Starting..."));

//   dht.begin();
// }

// void loop() {
//   // Wait a few seconds between measurements (DHT11 is slow!)
//   delay(2000);

//   // Reading humidity takes about 250 milliseconds!
//   float h = dht.readHumidity();
//   // Read temperature as Celsius (the default)
//   float t = dht.readTemperature();

//   // Check if any reads failed and exit early (to try again).
//   if (isnan(h) || isnan(t)) {
//     Serial.println(F("Failed to read from DHT sensor!"));
//     return;
//   }

//   Serial.print(F("Humidity: "));
//   Serial.print(h);
//   Serial.print(F("%  Temperature: "));
//   Serial.print(t);
//   Serial.println(F("°C "));
// }


#include <Adafruit_Sensor.h>
#include <DHT.h>
#include <DHT_U.h>

#define DHTPIN 4        // Digital pin connected to the DHT sensor
#define DHTTYPE DHT11      // Specifying the sensor type

DHT dht(DHTPIN, DHTTYPE);

void setup() {
  Serial.begin(115200);
  Serial.println(F("DHT11 Test Starting..."));

  dht.begin();
}

void loop() {
  // Wait a few seconds between measurements (DHT11 is slow!)
  delay(2000);

  // Reading humidity and temperature
  float h = dht.readHumidity();
  float t = dht.readTemperature();

  // Check if any reads failed
  if (isnan(h) || isnan(t)) {
    Serial.println(F("Failed to read from DHT sensor! Check wiring."));
    return;
  }

  Serial.print(F("Humidity: "));
  Serial.print(h);
  Serial.print(F("%  Temperature: "));
  Serial.print(t);
  Serial.println(F("°C "));
}