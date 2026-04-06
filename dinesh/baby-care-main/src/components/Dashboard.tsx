// src/components/Dashboard.tsx
import { useEffect, useState } from 'react';
import { Baby, Volume2, Moon, Bell, Activity } from 'lucide-react';
import { collection, query, orderBy, limit, onSnapshot, doc } from 'firebase/firestore';
import { db, auth } from '../lib/firebase';
import type { SystemStatus, CryEvent, BabyStatus } from '../types/database';
import LocalMonitor from './LocalMonitor';

// ─── MAGICAL BUBBLY UNICORN SVG ───────────────────────────────────────────────
const AnimatedCrawlingUnicorn = () => (
  <svg viewBox="0 0 140 110" width="140" height="110" xmlns="http://www.w3.org/2000/svg" overflow="visible">

    {/* ── Ground shadow: scales with bounce ── */}
    <ellipse className="uni-shadow" cx="65" cy="100" rx="45" ry="6" fill="#cbd5e1" opacity="0.6"/>

    {/* ── BACK LEFT LEG (depth layer) ── */}
    <g className="limb-leg-back">
      <path d="M 35 55 L 25 80 L 15 82" fill="none" stroke="#e2e8f0" strokeWidth="11" strokeLinecap="round" strokeLinejoin="round"/>
      <path d="M 20 78 L 13 83 L 18 86 Z" fill="#fbcfe8" /> {/* Pink Hoof */}
    </g>

    {/* ── FRONT LEFT LEG (depth layer) ── */}
    <g className="limb-arm-back">
      <path d="M 75 55 L 70 80 L 60 82" fill="none" stroke="#e2e8f0" strokeWidth="10" strokeLinecap="round" strokeLinejoin="round"/>
      <path d="M 65 78 L 58 83 L 63 86 Z" fill="#fbcfe8" /> {/* Pink Hoof */}
    </g>

    {/* ── BODY GROUP (bounce + sway + squash) ── */}
    <g className="uni-body-group">
      <g className="body-sway">
        <g className="body-squash">
          
          {/* Bubbly Rainbow Tail */}
          <path d="M 30 50 Q 10 40 5 60 Q 0 80 15 75 Q 20 60 30 65 Z" fill="#c7d2fe" />
          <path d="M 28 48 Q 15 30 8 50 Q 5 65 18 60 Q 25 50 28 55 Z" fill="#fbcfe8" opacity="0.9" />

          {/* Chubby White Torso */}
          <ellipse cx="55" cy="55" rx="32" ry="24" fill="#ffffff" stroke="#f8fafc" strokeWidth="2"/>
          
          {/* Cute Star / Magic Mark on flank */}
          <path d="M 35 48 L 38 52 L 43 52 L 39 55 L 40 60 L 35 57 L 30 60 L 31 55 L 27 52 L 32 52 Z" fill="#fef08a" />
          <circle cx="45" cy="45" r="2" fill="#fef08a" />
          <circle cx="28" cy="42" r="1.5" fill="#fef08a" />
        </g>

        {/* ── BACK RIGHT LEG (foreground) ── */}
        <g className="limb-leg-front">
          <path d="M 42 60 L 35 85 L 25 87" fill="none" stroke="#ffffff" strokeWidth="12" strokeLinecap="round" strokeLinejoin="round"/>
          <path d="M 30 83 L 23 88 L 28 91 Z" fill="#f9a8d4" /> {/* Pink Hoof */}
        </g>

        {/* ── FRONT RIGHT LEG (foreground) ── */}
        <g className="limb-arm-front">
          <path d="M 82 60 L 80 85 L 70 87" fill="none" stroke="#ffffff" strokeWidth="11" strokeLinecap="round" strokeLinejoin="round"/>
          <path d="M 75 83 L 68 88 L 73 91 Z" fill="#f9a8d4" /> {/* Pink Hoof */}
        </g>
      </g>
    </g>

    {/* ── HEAD GROUP (lags body with soft delay) ── */}
    <g className="uni-head-group">
      
      {/* Neck */}
      <path d="M 75 40 L 95 30 L 85 60 Z" fill="#ffffff" />

      {/* Pastel Rainbow Mane */}
      <path d="M 85 10 Q 100 5 105 20 Q 95 25 85 10 Z" fill="#fbcfe8" />
      <path d="M 80 15 Q 95 10 95 30 Q 80 30 80 15 Z" fill="#c7d2fe" />
      <path d="M 75 25 Q 90 25 85 45 Q 70 40 75 25 Z" fill="#bbf7d0" />

      {/* Head Base */}
      <circle cx="98" cy="28" r="18" fill="#ffffff"/>
      <ellipse cx="112" cy="34" rx="14" ry="11" fill="#ffffff"/> {/* Snout */}
      
      {/* Golden Horn */}
      <path d="M 100 12 L 110 -5 L 108 15 Z" fill="#fde047" stroke="#eab308" strokeWidth="1" strokeLinejoin="round"/>
      {/* Horn Spirals */}
      <path d="M 103 6 L 108 8 M 104 1 L 109 3 M 106 -3 L 109 -1" stroke="#ca8a04" strokeWidth="1" strokeLinecap="round"/>

      {/* Cute Ear */}
      <path d="M 88 15 Q 85 5 95 10 Z" fill="#ffffff" stroke="#f1f5f9" strokeWidth="1"/>
      <path d="M 90 14 Q 88 8 93 11 Z" fill="#fbcfe8" />

      {/* Nostril */}
      <circle cx="120" cy="32" r="1.5" fill="#cbd5e1"/>

      {/* Eye with blink */}
      <g className="uni-eye-group">
        {/* Huge Anime Eye */}
        <ellipse className="eye-open" cx="104" cy="25" rx="4.5" ry="5.5" fill="#1e293b"/>
        <circle className="eye-open" cx="105.5" cy="23" r="2" fill="white"/>
        <circle className="eye-open" cx="102.5" cy="27" r="1" fill="white" opacity="0.8"/>
        {/* Lashes */}
        <path className="eye-open" d="M 100 20 Q 104 17 108 22" fill="none" stroke="#1e293b" strokeWidth="1.5" strokeLinecap="round"/>
        
        {/* Blink lid */}
        <ellipse className="eye-blink" cx="104" cy="25" rx="4.5" ry="5.5" fill="#ffffff"/>
        <path className="eye-blink" d="M 99 26 Q 104 22 109 26" fill="none" stroke="#94a3b8" strokeWidth="1.5" strokeLinecap="round"/>
      </g>

      {/* Rosy cheek */}
      <ellipse className="uni-cheek" cx="108" cy="32" rx="5.5" ry="3.5" fill="#f9a8d4" opacity="0.6"/>

      {/* Happy Smile */}
      <path d="M 116 38 Q 120 42 124 37" fill="none" stroke="#cbd5e1" strokeWidth="1.5" strokeLinecap="round"/>
    </g>
  </svg>
);

// ─── DASHBOARD ────────────────────────────────────────────────────────────────
export default function Dashboard() {
  const [systemStatus, setSystemStatus] = useState<SystemStatus | null>(null);
  const [recentEvents, setRecentEvents] = useState<CryEvent[]>([]);
  const [babyName, setBabyName] = useState<string | null>(null);
  const [isLoading, setIsLoading] = useState(true);
  const [showAlert, setShowAlert] = useState(false);

  useEffect(() => {
    let profileUnsubscribe = () => {};
    if (auth.currentUser) {
      profileUnsubscribe = onSnapshot(doc(db, 'baby_profiles', auth.currentUser.uid), (docSnapshot) => {
        if (docSnapshot.exists() && docSnapshot.data().name) {
          setBabyName(docSnapshot.data().name);
        }
      });
    }

    const statusUnsubscribe = onSnapshot(doc(db, 'system_status', 'current'), (docSnapshot) => {
      if (docSnapshot.exists()) {
        const data = docSnapshot.data() as SystemStatus;
        setSystemStatus(data);
        if (data.current_status === 'crying') triggerAlert();
      }
      setIsLoading(false);
    });

    const eventsQuery = query(collection(db, 'cry_events'), orderBy('detected_at', 'desc'), limit(5));
    const eventsUnsubscribe = onSnapshot(eventsQuery, (querySnapshot) => {
      const events = querySnapshot.docs.map(doc => ({ id: doc.id, ...doc.data() })) as CryEvent[];
      setRecentEvents(events);
    });

    return () => { profileUnsubscribe(); statusUnsubscribe(); eventsUnsubscribe(); };
  }, []);

  const triggerAlert = () => {
    setShowAlert(true);
    if ('Notification' in window && Notification.permission === 'granted') {
      new Notification('Baby is Crying!', { body: 'The AI monitor has detected a cry.', icon: '/baby-icon.png' });
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
      case 'sleeping':       return { icon: Moon,     color: 'bg-blue-100 text-blue-600',     borderColor: 'border-blue-300',   label: 'Sleeping' };
      case 'crying':         return { icon: Bell,     color: 'bg-red-100 text-red-600',       borderColor: 'border-red-300',    label: 'Crying' };
      case 'noise_detected': return { icon: Volume2,  color: 'bg-yellow-100 text-yellow-600', borderColor: 'border-yellow-300', label: 'Noise Detected' };
      default:               return { icon: Activity, color: 'bg-gray-100 text-gray-600',     borderColor: 'border-gray-300',   label: 'Standby' };
    }
  };

  const formatDate = (d: string) => new Date(d).toLocaleString();
  const formatTime = (d: string) => new Date(d).toLocaleTimeString();

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
    <div className="min-h-screen bg-gradient-to-br from-blue-50 to-indigo-50 p-4 md:p-8 overflow-hidden relative">

      {/* ═══════════════════════════════════════════════════════════════════
          MAGICAL UNICORN — FULL PHYSICS ANIMATION SYSTEM
          ───────────────────────────────────────────────────────────────── */}
      <style>{`

        /* ── 1. HORIZONTAL TRAVERSE ── */
        @keyframes crawlTraverse {
          0%    { left: calc(100% - 150px); transform: scaleX(-1); }
          3%    { left: calc(100% - 150px); transform: scaleX(-1); }
          46%   { left: 4px;                transform: scaleX(-1); }
          49%   { left: 4px;                transform: scaleX(-1); }
          52%   { left: 4px;                transform: scaleX(1);  }
          95%   { left: calc(100% - 150px); transform: scaleX(1);  }
          98%   { left: calc(100% - 150px); transform: scaleX(1);  }
          100%  { left: calc(100% - 150px); transform: scaleX(-1); }
        }
        .uni-wrapper {
          position: absolute;
          bottom: -5px;
          width: 150px;
          height: 120px;
          animation: crawlTraverse 20s ease-in-out infinite;
          z-index: 0;
          will-change: left, transform;
        }

        /* ── 2. GROUND SHADOW ── */
        @keyframes shadowPulse {
          0%, 100% { transform: scaleX(1.0);  opacity: 0.6; }
          50%  { transform: scaleX(0.85); opacity: 0.3; }
        }
        .uni-shadow {
          animation: shadowPulse 1.2s ease-in-out infinite;
          transform-origin: 65px 100px;
        }

        /* ── 3. BODY VERTICAL BOUNCE ── */
        @keyframes bodyBounce {
          0%, 100% { transform: translateY(0px);    }
          25%, 75% { transform: translateY(-2.5px); }
          50%      { transform: translateY(-1px);   }
        }
        .uni-body-group {
          animation: bodyBounce 1.2s ease-in-out infinite;
          transform-origin: 55px 55px;
        }

        /* ── 4. SIDE-TO-SIDE WEIGHT SHIFT ── */
        @keyframes bodySway {
          0%, 100% { transform: rotate(-1.5deg) translateX(0px);   }
          25%      { transform: rotate(-0.5deg) translateX(1px);   }
          50%      { transform: rotate(1.5deg)  translateX(0px);   }
          75%      { transform: rotate(0.5deg)  translateX(-1px);  }
        }
        .body-sway {
          animation: bodySway 1.4s ease-in-out infinite;
          transform-origin: 55px 55px;
        }

        /* ── 5. TORSO SQUASH & STRETCH ── */
        @keyframes bodySquash {
          0%, 100% { transform: scaleX(1.00) scaleY(1.00); }
          20%, 80% { transform: scaleX(1.02) scaleY(0.97); }
          50%      { transform: scaleX(0.98) scaleY(1.03); }
        }
        .body-squash {
          animation: bodySquash 1.2s ease-in-out infinite;
          transform-origin: 55px 55px;
        }

        /* ── 6. HEAD BOB (soft neck lag) ── */
        @keyframes headBob {
          0%, 100% { transform: translateY(0px)    rotate(1deg);  }
          20%      { transform: translateY(-1.5px) rotate(-1deg); }
          40%      { transform: translateY(-3px)   rotate(0.5deg); }
          60%      { transform: translateY(-1.5px) rotate(1.5deg); }
          80%      { transform: translateY(-0.5px) rotate(-0.5deg); }
        }
        .uni-head-group {
          animation: headBob 1.2s ease-in-out 0.15s infinite;
          transform-origin: 85px 35px;
        }

        /* ── 7. BLINK ── */
        @keyframes blinkOpen {
          0%, 88%, 96%, 100% { opacity: 1; transform: scaleY(1);    }
          90%, 94%           { opacity: 0; transform: scaleY(0.05); }
        }
        @keyframes blinkClose {
          0%, 88%, 96%, 100% { opacity: 0; transform: scaleY(0.05); }
          90%, 94%           { opacity: 1; transform: scaleY(1);    }
        }
        .eye-open  { animation: blinkOpen  4s ease-in-out infinite; transform-origin: 104px 25px; }
        .eye-blink { animation: blinkClose 4s ease-in-out infinite; transform-origin: 104px 25px; }

        /* ── 8. CHEEK PUFF ── */
        @keyframes cheekPuff {
          0%, 100% { transform: scale(1);    opacity: 0.6; }
          40%      { transform: scale(1.1);  opacity: 0.8; }
          70%      { transform: scale(0.9);  opacity: 0.5; }
        }
        .uni-cheek {
          animation: cheekPuff 1.2s ease-in-out 0.2s infinite;
          transform-origin: 108px 32px;
        }

        /* ── 9. LIMB GAIT (Trotting) ── */
        @keyframes limbFwd {
          0%, 100% { transform: rotate(-15deg) translateY(0px);  }
          45%, 55% { transform: rotate(12deg)  translateY(-3px); }
        }
        @keyframes limbBwd {
          0%, 100% { transform: rotate(12deg)  translateY(0px);  }
          45%, 55% { transform: rotate(-15deg) translateY(-3px); }
        }

        .limb-arm-front { animation: limbFwd 1.2s ease-in-out 0s infinite;     transform-origin: 82px 60px; }
        .limb-leg-front { animation: limbFwd 1.2s ease-in-out 0.05s infinite;  transform-origin: 42px 60px; }
        .limb-arm-back  { animation: limbBwd 1.2s ease-in-out 0.6s infinite;   transform-origin: 75px 55px; }
        .limb-leg-back  { animation: limbBwd 1.2s ease-in-out 0.65s infinite;  transform-origin: 35px 55px; }

      `}</style>

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

        {/* HEADER WITH CRAWLING UNICORN */}
        <header className="mb-8 relative flex flex-col md:flex-row md:items-center md:justify-between pb-8 pt-4 border-b border-indigo-100">

          <div className="uni-wrapper">
            <AnimatedCrawlingUnicorn />
          </div>

          <div className="relative z-10">
            <h1 className="text-3xl md:text-4xl font-bold text-gray-800 mb-2 capitalize drop-shadow-sm">
              {babyName ? `${babyName}'s Room` : 'Smart Cradle Monitor'}
            </h1>
            <p className="text-gray-600 flex items-center bg-white/60 inline-flex px-3 py-1.5 rounded-lg backdrop-blur-sm shadow-sm">
              <span className="flex h-3 w-3 rounded-full bg-green-500 mr-2 shadow-[0_0_8px_rgba(34,197,94,0.8)] animate-pulse"></span>
              <span className="font-medium">System Live & Monitoring</span>
            </p>
          </div>

          <button
            onClick={requestNotificationPermission}
            className="relative z-10 mt-4 md:mt-0 flex items-center space-x-2 bg-white text-gray-700 px-4 py-2 rounded-lg border border-gray-200 hover:bg-gray-50 transition-all shadow-sm hover:shadow-md"
          >
            <Bell className="w-4 h-4 text-indigo-500" />
            <span className="font-medium">Enable Alerts</span>
          </button>
        </header>

        {/* Status Dashboard Grid */}
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6 mb-8">
          <div className={`bg-white rounded-2xl shadow-xl p-8 border-t-8 transition-all ${config.borderColor} relative overflow-hidden`}>
            <div className="flex items-center justify-between mb-6">
              <h2 className="text-gray-500 font-medium tracking-wide">Baby Status</h2>
              <div className={`p-4 rounded-2xl ${config.color} shadow-inner`}>
                <StatusIcon className="w-8 h-8" />
              </div>
            </div>
            <p className="text-4xl font-black text-gray-900 tracking-tight">{config.label}</p>
            <p className="text-sm text-gray-400 mt-4 font-mono">
              Last Update: {systemStatus ? formatTime(systemStatus.updated_at) : 'Waiting...'}
            </p>
          </div>

          <div className="bg-white rounded-2xl shadow-lg p-8 hover:shadow-xl transition-shadow">
            <div className="flex items-center justify-between mb-6">
              <h2 className="text-gray-500 font-medium tracking-wide">Last Cry Incident</h2>
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

          <div className="bg-gradient-to-br from-indigo-500 to-indigo-700 rounded-2xl shadow-lg p-8 text-white relative overflow-hidden">
            <div className="absolute -right-4 -top-4 w-24 h-24 bg-white/10 rounded-full blur-2xl"></div>
            <div className="flex items-center justify-between mb-6 relative z-10">
              <h2 className="text-indigo-100 font-medium tracking-wide">IoT Sensor Hub</h2>
              <div className="p-4 rounded-2xl bg-white/20 text-white backdrop-blur-md border border-white/10">
                <Activity className="w-8 h-8" />
              </div>
            </div>
            <p className="text-lg font-semibold relative z-10">Active Monitoring</p>
            <p className="text-sm text-indigo-100 mt-2 relative z-10">Connecting Local AI Analysis with Cloud Reporting.</p>
          </div>
        </div>

        {/* Action Center: AI Monitor + Event Feed */}
        <div className="grid grid-cols-1 lg:grid-cols-5 gap-8">

          <div className="lg:col-span-3 space-y-6">
            <div className="bg-white rounded-2xl shadow-xl overflow-hidden border border-gray-100">
              <div className="bg-gray-900 p-4 flex items-center justify-between">
                <div className="flex items-center space-x-3">
                  <div className="relative flex h-3 w-3">
                    <span className="animate-ping absolute inline-flex h-full w-full rounded-full bg-red-400 opacity-75"></span>
                    <span className="relative inline-flex rounded-full h-3 w-3 bg-red-500"></span>
                  </div>
                  <span className="text-white text-sm font-bold tracking-widest uppercase">Live AI Engine</span>
                </div>
              </div>
              <div className="p-6 bg-gray-50/50">
                <LocalMonitor />
              </div>
            </div>
          </div>

          <div className="lg:col-span-2">
            <div className="bg-white rounded-2xl shadow-xl p-6 border border-gray-100 h-full">
              <div className="flex items-center justify-between mb-6 pb-4 border-b border-gray-100">
                <h2 className="text-xl font-bold text-gray-800">Event Feed</h2>
                <span className="text-xs font-bold px-3 py-1 bg-indigo-50 text-indigo-600 rounded-full">LIVE</span>
              </div>

              {recentEvents.length === 0 ? (
                <div className="flex flex-col items-center justify-center py-16 text-gray-400 bg-gray-50 rounded-xl border border-dashed border-gray-200">
                  <Activity className="w-12 h-12 mb-3 text-gray-300" />
                  <p className="font-medium text-sm">Monitoring for activities...</p>
                </div>
              ) : (
                <div className="space-y-3">
                  {recentEvents.map((event) => {
                    const eventConfig = getStatusConfig(event.status);
                    const EventIcon = eventConfig.icon;
                    return (
                      <div
                        key={event.id}
                        className="group flex items-center justify-between p-4 bg-white border border-gray-100 rounded-xl hover:shadow-md hover:border-indigo-100 transition-all cursor-default"
                      >
                        <div className="flex items-center space-x-4">
                          <div className={`p-3 rounded-xl ${eventConfig.color} shadow-sm group-hover:scale-110 transition-transform`}>
                            <EventIcon className="w-5 h-5" />
                          </div>
                          <div>
                            <p className="font-bold text-gray-800">{eventConfig.label}</p>
                            <p className="text-xs text-gray-500 font-medium">{formatDate(event.detected_at)}</p>
                          </div>
                        </div>
                        <div className="text-right">
                          <div className={`inline-flex items-center px-2.5 py-1 rounded-md border text-xs font-bold
                            ${event.intensity >= 75 ? 'bg-red-50 text-red-600 border-red-100' :
                              event.intensity >= 40 ? 'bg-yellow-50 text-yellow-600 border-yellow-100' :
                              'bg-green-50 text-green-600 border-green-100'}`}>
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