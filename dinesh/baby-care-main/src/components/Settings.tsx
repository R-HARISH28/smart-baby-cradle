import { useState } from 'react';
import { Settings as SettingsIcon, Wifi, Bell, Info, Code } from 'lucide-react';

export default function Settings() {
  const [apiEndpoint] = useState(
    `${import.meta.env.VITE_SUPABASE_URL}/functions/v1/baby-monitor-api`
  );
  const [notificationsEnabled, setNotificationsEnabled] = useState(
    Notification.permission === 'granted'
  );

  const handleEnableNotifications = async () => {
    if ('Notification' in window) {
      const permission = await Notification.requestPermission();
      setNotificationsEnabled(permission === 'granted');
    }
  };

  const testNotification = () => {
    if (Notification.permission === 'granted') {
      new Notification('Test Notification', {
        body: 'Baby monitor notifications are working!',
        icon: '/baby-icon.png',
      });
    }
  };

  const copyToClipboard = (text: string) => {
    navigator.clipboard.writeText(text);
  };

  return (
    <div className="min-h-screen bg-gradient-to-br from-blue-50 to-indigo-50 p-4 md:p-8">
      <div className="max-w-4xl mx-auto">
        <div className="mb-8">
          <h1 className="text-3xl md:text-4xl font-bold text-gray-800 mb-2">
            Settings
          </h1>
          <p className="text-gray-600">Configure your baby monitoring system</p>
        </div>

        <div className="space-y-6">
          <div className="bg-white rounded-xl shadow-lg p-6">
            <div className="flex items-center space-x-3 mb-4">
              <div className="p-2 bg-purple-100 rounded-lg">
                <Bell className="w-6 h-6 text-purple-600" />
              </div>
              <h2 className="text-xl font-semibold text-gray-800">Notifications</h2>
            </div>

            <div className="space-y-4">
              <div className="flex items-center justify-between p-4 bg-gray-50 rounded-lg">
                <div>
                  <p className="font-semibold text-gray-800">Browser Notifications</p>
                  <p className="text-sm text-gray-500">
                    Get alerted when baby is crying
                  </p>
                </div>
                <button
                  onClick={handleEnableNotifications}
                  className={`px-4 py-2 rounded-lg transition-colors ${
                    notificationsEnabled
                      ? 'bg-green-500 text-white'
                      : 'bg-gray-300 text-gray-700 hover:bg-gray-400'
                  }`}
                >
                  {notificationsEnabled ? 'Enabled' : 'Enable'}
                </button>
              </div>

              {notificationsEnabled && (
                <button
                  onClick={testNotification}
                  className="w-full py-2 px-4 bg-blue-500 hover:bg-blue-600 text-white rounded-lg transition-colors"
                >
                  Send Test Notification
                </button>
              )}
            </div>
          </div>

          <div className="bg-white rounded-xl shadow-lg p-6">
            <div className="flex items-center space-x-3 mb-4">
              <div className="p-2 bg-blue-100 rounded-lg">
                <Wifi className="w-6 h-6 text-blue-600" />
              </div>
              <h2 className="text-xl font-semibold text-gray-800">IoT Device Connection</h2>
            </div>

            <div className="space-y-4">
              <div>
                <label className="block text-sm font-semibold text-gray-700 mb-2">
                  API Endpoint
                </label>
                <div className="flex gap-2">
                  <input
                    type="text"
                    value={apiEndpoint}
                    readOnly
                    className="flex-1 px-4 py-2 border border-gray-300 rounded-lg bg-gray-50"
                  />
                  <button
                    onClick={() => copyToClipboard(apiEndpoint)}
                    className="px-4 py-2 bg-gray-700 hover:bg-gray-800 text-white rounded-lg transition-colors"
                  >
                    Copy
                  </button>
                </div>
              </div>

              <div className="p-4 bg-blue-50 border border-blue-200 rounded-lg">
                <div className="flex items-start space-x-2">
                  <Info className="w-5 h-5 text-blue-600 mt-0.5" />
                  <div className="text-sm text-blue-800">
                    <p className="font-semibold mb-1">Device Setup Instructions:</p>
                    <ol className="list-decimal list-inside space-y-1">
                      <li>Configure your IoT device with the API endpoint above</li>
                      <li>Send POST requests to /sound-detected with sound data</li>
                      <li>Include intensity (0-100) and status in the payload</li>
                    </ol>
                  </div>
                </div>
              </div>
            </div>
          </div>

          <div className="bg-white rounded-xl shadow-lg p-6">
            <div className="flex items-center space-x-3 mb-4">
              <div className="p-2 bg-green-100 rounded-lg">
                <Code className="w-6 h-6 text-green-600" />
              </div>
              <h2 className="text-xl font-semibold text-gray-800">Example IoT Code</h2>
            </div>

            <div className="space-y-4">
              <div>
                <p className="text-sm font-semibold text-gray-700 mb-2">
                  Arduino/ESP32 Example:
                </p>
                <pre className="bg-gray-900 text-gray-100 p-4 rounded-lg overflow-x-auto text-xs">
{`#include <WiFi.h>
#include <HTTPClient.h>

const char* apiUrl = "${apiEndpoint}/sound-detected";

void sendSoundData(int intensity, String status) {
  HTTPClient http;
  http.begin(apiUrl);
  http.addHeader("Content-Type", "application/json");

  String payload = "{\\"intensity\\":" + String(intensity) +
                   ",\\"status\\":\\"" + status + "\\"}";

  int httpCode = http.POST(payload);
  http.end();
}

void loop() {
  int soundLevel = analogRead(SOUND_SENSOR_PIN);
  int intensity = map(soundLevel, 0, 1023, 0, 100);

  if (intensity > 70) {
    sendSoundData(intensity, "crying");
  }
  delay(1000);
}`}
                </pre>
              </div>

              <div>
                <p className="text-sm font-semibold text-gray-700 mb-2">
                  cURL Test Command:
                </p>
                <pre className="bg-gray-900 text-gray-100 p-4 rounded-lg overflow-x-auto text-xs">
{`curl -X POST ${apiEndpoint}/sound-detected \\
  -H "Content-Type: application/json" \\
  -d '{"intensity": 85, "status": "crying", "duration": 5}'`}
                </pre>
                <button
                  onClick={() => copyToClipboard(
                    `curl -X POST ${apiEndpoint}/sound-detected -H "Content-Type: application/json" -d '{"intensity": 85, "status": "crying", "duration": 5}'`
                  )}
                  className="mt-2 text-sm text-blue-600 hover:text-blue-700"
                >
                  Copy command
                </button>
              </div>
            </div>
          </div>

          <div className="bg-white rounded-xl shadow-lg p-6">
            <div className="flex items-center space-x-3 mb-4">
              <div className="p-2 bg-gray-100 rounded-lg">
                <SettingsIcon className="w-6 h-6 text-gray-600" />
              </div>
              <h2 className="text-xl font-semibold text-gray-800">System Information</h2>
            </div>

            <div className="space-y-2 text-sm">
              <div className="flex justify-between p-3 bg-gray-50 rounded-lg">
                <span className="text-gray-600">Version</span>
                <span className="font-semibold text-gray-800">1.0.0</span>
              </div>
              <div className="flex justify-between p-3 bg-gray-50 rounded-lg">
                <span className="text-gray-600">Database</span>
                <span className="font-semibold text-gray-800">Supabase</span>
              </div>
              <div className="flex justify-between p-3 bg-gray-50 rounded-lg">
                <span className="text-gray-600">Real-time Updates</span>
                <span className="font-semibold text-green-600">Active</span>
              </div>
            </div>
          </div>
        </div>
      </div>
    </div>
  );
}
