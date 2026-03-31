// src/components/Dashboard.tsx
import { useEffect, useState } from 'react';
import { Baby, Volume2, Moon, Bell } from 'lucide-react';
import { collection, query, orderBy, limit, onSnapshot, doc } from 'firebase/firestore';
import { db, auth } from '../lib/firebase'; // Added auth import
import type { SystemStatus, CryEvent, BabyStatus } from '../types/database';

export default function Dashboard() {
  const [systemStatus, setSystemStatus] = useState<SystemStatus | null>(null);
  const [recentEvents, setRecentEvents] = useState<CryEvent[]>([]);
  const [babyName, setBabyName] = useState<string | null>(null); // New state for baby name
  const [isLoading, setIsLoading] = useState(true);
  const [showAlert, setShowAlert] = useState(false);

  useEffect(() => {
    // 1. Listen to the baby profile document
    let profileUnsubscribe = () => {};
    if (auth.currentUser) {
      profileUnsubscribe = onSnapshot(doc(db, 'baby_profiles', auth.currentUser.uid), (docSnapshot) => {
        if (docSnapshot.exists() && docSnapshot.data().name) {
          setBabyName(docSnapshot.data().name);
        }
      });
    }

    // 2. Listen to the current system status document
    const statusUnsubscribe = onSnapshot(doc(db, 'system_status', 'current'), (docSnapshot) => {
      if (docSnapshot.exists()) {
        const data = docSnapshot.data() as SystemStatus;
        setSystemStatus(data);
        if (data.current_status === 'crying') {
          triggerAlert();
        }
      }
      setIsLoading(false);
    });

    // 3. Listen to recent cry events collection
    const eventsQuery = query(
      collection(db, 'cry_events'),
      orderBy('detected_at', 'desc'),
      limit(5)
    );
    
    const eventsUnsubscribe = onSnapshot(eventsQuery, (querySnapshot) => {
      const events = querySnapshot.docs.map(doc => ({
        id: doc.id,
        ...doc.data()
      })) as CryEvent[];
      setRecentEvents(events);
    });

    // Cleanup listeners on unmount
    return () => {
      profileUnsubscribe();
      statusUnsubscribe();
      eventsUnsubscribe();
    };
  }, []);

  const triggerAlert = () => {
    setShowAlert(true);
    if ('Notification' in window && Notification.permission === 'granted') {
      new Notification('Baby is Crying!', {
        body: 'Your baby needs attention',
        icon: '/baby-icon.png',
      });
    }
    setTimeout(() => setShowAlert(false), 5000);
  };

  const requestNotificationPermission = async () => {
    if ('Notification' in window && Notification.permission === 'default') {
      await Notification.requestPermission();
    }
  };

  const getStatusConfig = (status: BabyStatus) => {
    switch (status) {
      case 'sleeping':
        return { icon: Moon, color: 'bg-blue-100 text-blue-600', borderColor: 'border-blue-300', label: 'Sleeping' };
      case 'crying':
        return { icon: Bell, color: 'bg-red-100 text-red-600', borderColor: 'border-red-300', label: 'Crying' };
      case 'noise_detected':
        return { icon: Volume2, color: 'bg-yellow-100 text-yellow-600', borderColor: 'border-yellow-300', label: 'Noise Detected' };
    }
  };

  const formatTime = (dateString: string) => new Date(dateString).toLocaleTimeString();
  const formatDate = (dateString: string) => new Date(dateString).toLocaleString();

  if (isLoading) {
    return (
      <div className="flex items-center justify-center min-h-screen">
        <div className="text-lg text-gray-600">Loading Dashboard...</div>
      </div>
    );
  }

  const config = systemStatus ? getStatusConfig(systemStatus.current_status) : null;
  const StatusIcon = config?.icon || Baby;

  return (
    <div className="min-h-screen bg-gradient-to-br from-blue-50 to-indigo-50 p-4 md:p-8">
      {showAlert && (
        <div className="fixed top-4 right-4 z-50 animate-pulse">
          <div className="bg-red-500 text-white px-6 py-4 rounded-lg shadow-xl flex items-center space-x-3">
            <Bell className="w-6 h-6" />
            <div>
              <p className="font-bold">Baby is Crying!</p>
              <p className="text-sm">Attention needed</p>
            </div>
          </div>
        </div>
      )}

      <div className="max-w-7xl mx-auto">
        <div className="mb-8">
          {/* Dynamically display the baby's name here */}
          <h1 className="text-3xl md:text-4xl font-bold text-gray-800 mb-2 capitalize">
            {babyName ? `${babyName}'s Dashboard` : 'Baby Monitor Dashboard'}
          </h1>
          <p className="text-gray-600">Real-time monitoring system</p>
        </div>

        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6 mb-8">
          <div className={`bg-white rounded-xl shadow-lg p-6 border-4 ${config?.borderColor}`}>
            <div className="flex items-center justify-between mb-4">
              <h2 className="text-lg font-semibold text-gray-700">Current Status</h2>
              <div className={`p-3 rounded-full ${config?.color}`}>
                <StatusIcon className="w-6 h-6" />
              </div>
            </div>
            <p className="text-3xl font-bold text-gray-800">{config?.label}</p>
            <p className="text-sm text-gray-500 mt-2">
              Updated: {systemStatus ? formatTime(systemStatus.updated_at) : 'N/A'}
            </p>
          </div>

          <div className="bg-white rounded-xl shadow-lg p-6">
            <div className="flex items-center justify-between mb-4">
              <h2 className="text-lg font-semibold text-gray-700">Last Cry Detected</h2>
              <div className="p-3 rounded-full bg-pink-100 text-pink-600">
                <Baby className="w-6 h-6" />
              </div>
            </div>
            <p className="text-xl font-bold text-gray-800">
              {systemStatus?.last_cry_detected
                ? formatDate(systemStatus.last_cry_detected)
                : 'No recent cries'}
            </p>
          </div>

          <div className="bg-white rounded-xl shadow-lg p-6">
            <div className="flex items-center justify-between mb-4">
              <h2 className="text-lg font-semibold text-gray-700">Notifications</h2>
              <div className="p-3 rounded-full bg-purple-100 text-purple-600">
                <Bell className="w-6 h-6" />
              </div>
            </div>
            <button
              onClick={requestNotificationPermission}
              className="w-full bg-purple-500 hover:bg-purple-600 text-white px-4 py-2 rounded-lg transition-colors"
            >
              Enable Alerts
            </button>
            <p className="text-xs text-gray-500 mt-2">
              Get notified when baby cries
            </p>
          </div>
        </div>

        <div className="bg-white rounded-xl shadow-lg p-6">
          <h2 className="text-xl font-semibold text-gray-800 mb-4">Recent Events</h2>
          {recentEvents.length === 0 ? (
            <p className="text-gray-500 text-center py-8">No events recorded yet</p>
          ) : (
            <div className="space-y-3">
              {recentEvents.map((event) => {
                const eventConfig = getStatusConfig(event.status);
                if (!eventConfig) return null; 
                const EventIcon = eventConfig.icon;
                return (
                  <div
                    key={event.id}
                    className="flex items-center justify-between p-4 bg-gray-50 rounded-lg hover:bg-gray-100 transition-colors"
                  >
                    <div className="flex items-center space-x-4">
                      <div className={`p-2 rounded-full ${eventConfig.color}`}>
                        <EventIcon className="w-5 h-5" />
                      </div>
                      <div>
                        <p className="font-semibold text-gray-800">{eventConfig.label}</p>
                        <p className="text-sm text-gray-500">
                          {formatDate(event.detected_at)}
                        </p>
                      </div>
                    </div>
                    <div className="text-right">
                      <p className="text-sm font-medium text-gray-700">
                        Intensity: {event.intensity}%
                      </p>
                      {event.duration > 0 && (
                        <p className="text-xs text-gray-500">{event.duration}s</p>
                      )}
                    </div>
                  </div>
                );
              })}
            </div>
          )}
        </div>
      </div>
    </div>
  );
}