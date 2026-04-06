

// src/components/Dashboard.tsx
import { useEffect, useState } from 'react';
import { Baby, Volume2, Moon, Bell, Activity } from 'lucide-react';
import { collection, query, orderBy, limit, onSnapshot, doc } from 'firebase/firestore';
import { db, auth } from '../lib/firebase';
import type { SystemStatus, CryEvent, BabyStatus } from '../types/database';
import LocalMonitor from './LocalMonitor'; 

export default function Dashboard() {
  const [systemStatus, setSystemStatus] = useState<SystemStatus | null>(null);
  const [recentEvents, setRecentEvents] = useState<CryEvent[]>([]);
  const [babyName, setBabyName] = useState<string | null>(null);
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
        // Alert logic if the status changes to crying
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

    return () => {
      profileUnsubscribe();
      statusUnsubscribe();
      eventsUnsubscribe();
    };
  }, []);

  const triggerAlert = () => {
    setShowAlert(true);
    // Browser notification support
    if ('Notification' in window && Notification.permission === 'granted') {
      new Notification('Baby is Crying!', {
        body: 'The AI monitor has detected a cry.',
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
      default:
        return { icon: Activity, color: 'bg-gray-100 text-gray-600', borderColor: 'border-gray-300', label: 'Standby' };
    }
  };

  const formatDate = (dateString: string) => new Date(dateString).toLocaleString();
  const formatTime = (dateString: string) => new Date(dateString).toLocaleTimeString();

  if (isLoading) {
    return (
      <div className="flex items-center justify-center min-h-screen">
        <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-indigo-600"></div>
      </div>
    );
  }

  const config = systemStatus ? getStatusConfig(systemStatus.current_status) : getStatusConfig('sleeping' as BabyStatus);
  const StatusIcon = config.icon;

  return (
    <div className="min-h-screen bg-gradient-to-br from-blue-50 to-indigo-50 p-4 md:p-8">
      {/* Visual Alert Overlay */}
      {showAlert && (
        <div className="fixed top-4 right-4 z-50 animate-bounce">
          <div className="bg-red-500 text-white px-6 py-4 rounded-lg shadow-2xl flex items-center space-x-3 border-2 border-white">
            <Bell className="w-8 h-8" />
            <div>
              <p className="font-bold text-lg">CRITICAL: Baby Crying!</p>
              <p className="text-sm">Check the cradle immediately</p>
            </div>
          </div>
        </div>
      )}

      <div className="max-w-7xl mx-auto">
        <header className="mb-8 flex flex-col md:flex-row md:items-center md:justify-between">
          <div>
            <h1 className="text-3xl md:text-4xl font-bold text-gray-800 mb-2 capitalize">
              {babyName ? `${babyName}'s Room` : 'Smart Cradle Monitor'}
            </h1>
            <p className="text-gray-600 flex items-center">
              <span className="flex h-3 w-3 rounded-full bg-green-500 mr-2"></span>
              System Live & Monitoring
            </p>
          </div>
          <button
            onClick={requestNotificationPermission}
            className="mt-4 md:mt-0 flex items-center space-x-2 bg-white text-gray-700 px-4 py-2 rounded-lg border border-gray-200 hover:bg-gray-50 transition-all shadow-sm"
          >
            <Bell className="w-4 h-4" />
            <span>Enable Alerts</span>
          </button>
        </header>

        {/* Status Dashboard Grid */}
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6 mb-8">
          {/* Main Status Card */}
          <div className={`bg-white rounded-2xl shadow-xl p-8 border-t-8 transition-all ${config.borderColor}`}>
            <div className="flex items-center justify-between mb-6">
              <h2 className="text-gray-500 font-medium">Baby Status</h2>
              <div className={`p-4 rounded-2xl ${config.color} shadow-inner`}>
                <StatusIcon className="w-8 h-8" />
              </div>
            </div>
            <p className="text-4xl font-black text-gray-900 tracking-tight">{config.label}</p>
            <p className="text-sm text-gray-400 mt-4 font-mono">
              Last Update: {systemStatus ? formatTime(systemStatus.updated_at) : 'Waiting...'}
            </p>
          </div>

          {/* Last Activity Card */}
          <div className="bg-white rounded-2xl shadow-lg p-8">
            <div className="flex items-center justify-between mb-6">
              <h2 className="text-gray-500 font-medium">Last Cry Incident</h2>
              <div className="p-4 rounded-2xl bg-pink-50 text-pink-500">
                <Baby className="w-8 h-8" />
              </div>
            </div>
            <p className="text-xl font-bold text-gray-800 leading-tight">
              {systemStatus?.last_cry_detected
                ? formatDate(systemStatus.last_cry_detected)
                : 'No incidents recorded'}
            </p>
            <p className="text-sm text-gray-400 mt-4">History updated in real-time</p>
          </div>

          {/* Environmental Insight Card */}
          <div className="bg-white rounded-2xl shadow-lg p-8 bg-indigo-600 text-white">
            <div className="flex items-center justify-between mb-6">
              <h2 className="text-indigo-200 font-medium">IoT Sensor Hub</h2>
              <div className="p-4 rounded-2xl bg-indigo-500 text-white">
                <Activity className="w-8 h-8" />
              </div>
            </div>
            <p className="text-lg font-semibold">Active Monitoring</p>
            <p className="text-sm text-indigo-200 mt-2">Connecting Local AI Analysis with Cloud Reporting.</p>
          </div>
        </div>

        {/* Action Center: AI Monitor + Event Feed */}
        <div className="grid grid-cols-1 lg:grid-cols-5 gap-8">
          
          {/* AI Monitor (Occupies 3 columns) */}
          <div className="lg:col-span-3 space-y-6">
            <div className="bg-white rounded-2xl shadow-xl overflow-hidden">
              <div className="bg-gray-800 p-4 flex items-center space-x-2">
                <div className="h-3 w-3 bg-red-500 rounded-full animate-pulse"></div>
                <span className="text-white text-sm font-bold tracking-widest uppercase">Live AI Engine</span>
              </div>
              <div className="p-6">
                <LocalMonitor />
              </div>
            </div>
          </div>

          {/* Recent Event Feed (Occupies 2 columns) */}
          <div className="lg:col-span-2">
            <div className="bg-white rounded-2xl shadow-xl p-6 border border-gray-100">
              <div className="flex items-center justify-between mb-6">
                <h2 className="text-xl font-bold text-gray-800">Event Feed</h2>
                <span className="text-xs font-bold px-2 py-1 bg-gray-100 rounded text-gray-500">RECENT</span>
              </div>
              
              {recentEvents.length === 0 ? (
                <div className="flex flex-col items-center justify-center py-12 text-gray-400">
                  <Activity className="w-12 h-12 mb-2 opacity-20" />
                  <p>Monitoring for activities...</p>
                </div>
              ) : (
                <div className="space-y-4">
                  {recentEvents.map((event) => {
                    const eventConfig = getStatusConfig(event.status);
                    const EventIcon = eventConfig.icon;
                    return (
                      <div
                        key={event.id}
                        className="group flex items-center justify-between p-4 bg-gray-50 rounded-xl hover:shadow-md transition-all cursor-default"
                      >
                        <div className="flex items-center space-x-4">
                          <div className={`p-3 rounded-xl ${eventConfig.color} shadow-sm group-hover:scale-110 transition-transform`}>
                            <EventIcon className="w-5 h-5" />
                          </div>
                          <div>
                            <p className="font-bold text-gray-800">{eventConfig.label}</p>
                            <p className="text-xs text-gray-400 font-medium">
                              {formatDate(event.detected_at)}
                            </p>
                          </div>
                        </div>
                        <div className="text-right">
                          <div className="inline-block px-2 py-1 rounded-md bg-white border border-gray-200 text-xs font-bold text-gray-600">
                            {event.intensity}% Match
                          </div>
                        </div>
                      </div>
                    );
                  })}
                </div>
              )}
            </div>
          </div>

        </div>
      </div>
    </div>
  );
}