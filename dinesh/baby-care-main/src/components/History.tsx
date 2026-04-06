// src/components/History.tsx
import { useEffect, useState } from 'react';
import { Clock, Activity, Calendar, AlertCircle, Timer, Filter } from 'lucide-react';
import { collection, query, orderBy, limit, onSnapshot, where } from 'firebase/firestore';
import { db } from '../lib/firebase';
import type { CryEvent, BabyStatus } from '../types/database';

// ─── SAD WEEPING BABY SVG WITH OVERFLOWING TEARS & QUIVERING POUT ─────────────
const AnimatedCryingBaby = () => (
  <div className="relative w-40 h-40 mx-auto my-6 drop-shadow-lg">
    <style>{`
      /* Gentle weeping/sniffling animation for the head */
      @keyframes gentleWeep {
        0%, 100% { transform: translateY(0px) rotate(0deg); }
        50% { transform: translateY(3px) rotate(-1deg); }
        75% { transform: translateY(1px) rotate(1deg); }
      }

      /* Subtle, rapid quivering for the closed sad mouth */
      @keyframes lipQuiver {
        0%, 100% { transform: translateY(0); }
        50% { transform: translateY(1.5px); }
      }

      /* Tears overflow from the EYES (x=34/86), trace the cheeks outward, then drop */
      @keyframes tearStreamLeftOutward {
        0% { transform: translate(34px, 52px) scale(0); opacity: 0; }
        10% { transform: translate(34px, 52px) scale(1); opacity: 1; } 
        25% { transform: translate(24px, 68px) scale(1); opacity: 1; } 
        40% { transform: translate(20px, 80px) scale(1); opacity: 1; } 
        85% { transform: translate(20px, 108px) scale(1); opacity: 1; } 
        90% { transform: translate(20px, 110px) scaleX(2) scaleY(0.1); opacity: 0; } 
        100% { transform: translate(20px, 110px) scale(0); opacity: 0; }
      }
      
      @keyframes tearStreamRightOutward {
        0% { transform: translate(86px, 52px) scale(0); opacity: 0; }
        10% { transform: translate(86px, 52px) scale(1); opacity: 1; } 
        25% { transform: translate(96px, 68px) scale(1); opacity: 1; } 
        40% { transform: translate(100px, 80px) scale(1); opacity: 1; } 
        85% { transform: translate(100px, 108px) scale(1); opacity: 1; } 
        90% { transform: translate(100px, 110px) scaleX(2) scaleY(0.1); opacity: 0; } 
        100% { transform: translate(100px, 110px) scale(0); opacity: 0; }
      }

      /* Puddling tears in the eyes */
      @keyframes tearPuddle {
        0%, 100% { transform: scaleY(1); opacity: 0.6; }
        50% { transform: scaleY(1.15); opacity: 0.9; }
      }

      .weeping-head {
        animation: gentleWeep 1.8s infinite ease-in-out;
        transform-origin: 60px 60px;
      }
      
      .quivering-mouth {
        animation: lipQuiver 0.3s infinite ease-in-out;
        transform-origin: 60px 75px;
      }

      .tear-puddle { 
        animation: tearPuddle 2s infinite ease-in-out; 
        transform-origin: 50% 50%; 
      }
      
      /* Staggered outward tear drops */
      .tear-l-1 { animation: tearStreamLeftOutward 2.5s infinite ease-in; }
      .tear-l-2 { animation: tearStreamLeftOutward 2.5s infinite ease-in 1.25s; }
      .tear-r-1 { animation: tearStreamRightOutward 2.5s infinite ease-in 0.6s; }
      .tear-r-2 { animation: tearStreamRightOutward 2.5s infinite ease-in 1.85s; }
    `}</style>
    
    <svg viewBox="0 0 120 120" className="w-full h-full overflow-visible" xmlns="http://www.w3.org/2000/svg">
      
      {/* Ground shadow */}
      <ellipse cx="60" cy="110" rx="38" ry="4" fill="#cbd5e1" opacity="0.5" />

      {/* Falling Tear Drops (Placed behind the head so they trace the jawline smoothly) */}
      <g fill="#60a5fa">
        <path className="tear-l-1" d="M 0 0 C 3 4 5 7 3 9 C 0 12 -3 12 -3 9 C -5 7 -3 4 0 0 Z" />
        <path className="tear-l-2" d="M 0 0 C 3 4 5 7 3 9 C 0 12 -3 12 -3 9 C -5 7 -3 4 0 0 Z" />
        <path className="tear-r-1" d="M 0 0 C 3 4 5 7 3 9 C 0 12 -3 12 -3 9 C -5 7 -3 4 0 0 Z" />
        <path className="tear-r-2" d="M 0 0 C 3 4 5 7 3 9 C 0 12 -3 12 -3 9 C -5 7 -3 4 0 0 Z" />
      </g>

      <g className="weeping-head">
        {/* Head (Normal peach skin tone) */}
        <circle cx="60" cy="60" r="45" fill="#ffe4e1" /> 
        
        {/* Ears */}
        <circle cx="15" cy="60" r="8" fill="#ffbfa8" />
        <circle cx="105" cy="60" r="8" fill="#ffbfa8" />
        
        {/* Hair Tufts */}
        <path d="M 50 15 Q 60 0 70 15" fill="none" stroke="#2a1f1d" strokeWidth="3" strokeLinecap="round"/>
        <path d="M 55 12 Q 65 -5 75 12" fill="none" stroke="#2a1f1d" strokeWidth="3" strokeLinecap="round"/>
        
        {/* Sad Puppy-Dog Eyebrows */}
        <path d="M 28 36 Q 38 28 46 31" fill="none" stroke="#2a1f1d" strokeWidth="2.5" strokeLinecap="round" />
        <path d="M 92 36 Q 82 28 74 31" fill="none" stroke="#2a1f1d" strokeWidth="2.5" strokeLinecap="round" />

        {/* Huge Sad Watery Anime Eyes */}
        {/* Left Eye */}
        <circle cx="38" cy="46" r="9" fill="#1e1e1e" />
        <circle cx="40" cy="43" r="3" fill="#ffffff" />
        <circle cx="35" cy="49" r="1.5" fill="#ffffff" />
        {/* Right Eye */}
        <circle cx="82" cy="46" r="9" fill="#1e1e1e" />
        <circle cx="84" cy="43" r="3" fill="#ffffff" />
        <circle cx="79" cy="49" r="1.5" fill="#ffffff" />

        {/* Watery Puddles at the bottom of the eyes */}
        <path className="tear-puddle" d="M 29.5 46 A 8.5 8.5 0 0 0 46.5 46 Z" fill="#60a5fa" />
        <path className="tear-puddle" d="M 73.5 46 A 8.5 8.5 0 0 0 90.5 46 Z" fill="#60a5fa" />

        {/* Rosy Cheeks */}
        <ellipse cx="30" cy="60" rx="6" ry="4" fill="#ff6b8b" opacity="0.3"/>
        <ellipse cx="90" cy="60" rx="6" ry="4" fill="#ff6b8b" opacity="0.3"/>

        {/* Closed, Sad, Quivering Pout */}
        <g className="quivering-mouth">
          <path d="M 54 77 Q 60 73 66 77" fill="none" stroke="#2a050c" strokeWidth="2.5" strokeLinecap="round" />
        </g>
      </g>
    </svg>
  </div>
);

export default function History() {
  const [selectedDate, setSelectedDate] = useState(() => {
    const today = new Date();
    const offset = today.getTimezoneOffset() * 60000;
    return new Date(today.getTime() - offset).toISOString().split('T')[0];
  });

  const [events, setEvents] = useState<CryEvent[]>([]);
  const [isLoading, setIsLoading] = useState(true);
  const [filter, setFilter] = useState<BabyStatus | 'all'>('all');

  useEffect(() => {
    setIsLoading(true);

    const [year, month, day] = selectedDate.split('-').map(Number);
    
    const startOfDay = new Date(year, month - 1, day);
    startOfDay.setHours(0, 0, 0, 0);

    const endOfDay = new Date(year, month - 1, day);
    endOfDay.setHours(23, 59, 59, 999);

    const eventsQuery = query(
      collection(db, 'cry_events'),
      where('detected_at', '>=', startOfDay.toISOString()),
      where('detected_at', '<=', endOfDay.toISOString()),
      orderBy('detected_at', 'desc'),
      limit(200) 
    );

    const unsubscribe = onSnapshot(eventsQuery, (querySnapshot) => {
      const fetchedEvents = querySnapshot.docs.map(doc => ({
        id: doc.id,
        ...doc.data()
      })) as CryEvent[];
      
      setEvents(fetchedEvents);
      setIsLoading(false);
    });

    return () => unsubscribe();
  }, [selectedDate]);

  const filteredEvents = filter === 'all'
    ? events
    : events.filter((e) => e.status === filter);

  const getStatusBadge = (status: BabyStatus) => {
    switch (status) {
      case 'sleeping': return 'bg-blue-100 text-blue-800 border-blue-200';
      case 'crying': return 'bg-red-100 text-red-800 border-red-200';
      case 'noise_detected': return 'bg-yellow-100 text-yellow-800 border-yellow-200';
      default: return 'bg-gray-100 text-gray-800 border-gray-200';
    }
  };

  const getIntensityColor = (intensity: number) => {
    if (intensity >= 75) return 'text-red-600 font-bold';
    if (intensity >= 40) return 'text-yellow-600 font-semibold';
    return 'text-green-600 font-medium';
  };

  const formatTime = (dateString: string) => {
    return new Date(dateString).toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' });
  };

  const cryingEvents = events.filter((e) => e.status === 'crying');
  
  const stats = {
    totalEvents: events.length,
    timesCried: cryingEvents.length,
    totalCryingSeconds: cryingEvents.reduce((sum, e) => sum + (e.duration || 0), 0),
  };

  const formatDuration = (totalSeconds: number) => {
    if (totalSeconds === 0) return '0m 0s';
    const m = Math.floor(totalSeconds / 60);
    const s = totalSeconds % 60;
    return `${m}m ${s}s`;
  };

  return (
    <div className="min-h-screen bg-gradient-to-br from-blue-50 to-indigo-50 p-4 md:p-8">
      <div className="max-w-5xl mx-auto">
        
        {/* Header & Date Picker */}
        <div className="flex flex-col md:flex-row md:items-center justify-between mb-8 gap-4">
          <div>
            <h1 className="text-3xl md:text-4xl font-bold text-gray-800 mb-2">
              History & Analytics
            </h1>
            <p className="text-gray-600">Review historical data and crying patterns</p>
          </div>
          
          <div className="bg-white p-3 rounded-xl shadow-sm border border-gray-200 flex items-center gap-3">
            <div className="p-2 bg-indigo-50 rounded-lg text-indigo-600">
              <Calendar className="w-5 h-5" />
            </div>
            <div className="flex flex-col">
              <label className="text-xs font-bold text-gray-400 uppercase tracking-wider">Select Date</label>
              <input 
                type="date" 
                value={selectedDate}
                onChange={(e) => setSelectedDate(e.target.value)}
                className="outline-none bg-transparent font-semibold text-gray-800 cursor-pointer"
              />
            </div>
          </div>
        </div>

        {/* Analytics Summary Cards */}
        <div className="grid grid-cols-1 md:grid-cols-3 gap-6 mb-4">
          <div className="bg-white rounded-2xl shadow-sm border border-gray-100 p-6 flex items-center gap-4">
            <div className="p-4 bg-gray-50 rounded-2xl text-gray-600">
              <Activity className="w-8 h-8" />
            </div>
            <div>
              <p className="text-sm font-medium text-gray-500">Total Activity Logs</p>
              <p className="text-2xl font-bold text-gray-800">{stats.totalEvents}</p>
            </div>
          </div>

          <div className="bg-white rounded-2xl shadow-sm border border-red-50 p-6 flex items-center gap-4 relative overflow-hidden">
            <div className="absolute -right-4 -top-4 w-24 h-24 bg-red-50 rounded-full opacity-50"></div>
            <div className="p-4 bg-red-100 rounded-2xl text-red-600 relative z-10">
              <AlertCircle className="w-8 h-8" />
            </div>
            <div className="relative z-10">
              <p className="text-sm font-medium text-red-400">Times Cried</p>
              <p className="text-3xl font-black text-red-600">{stats.timesCried}</p>
            </div>
          </div>

          <div className="bg-white rounded-2xl shadow-sm border border-indigo-50 p-6 flex items-center gap-4 relative overflow-hidden">
            <div className="absolute -right-4 -top-4 w-24 h-24 bg-indigo-50 rounded-full opacity-50"></div>
            <div className="p-4 bg-indigo-100 rounded-2xl text-indigo-600 relative z-10">
              <Timer className="w-8 h-8" />
            </div>
            <div className="relative z-10">
              <p className="text-sm font-medium text-indigo-400">Total Crying Time</p>
              <p className="text-3xl font-black text-indigo-600">{formatDuration(stats.totalCryingSeconds)}</p>
            </div>
          </div>
        </div>

        {/* ─── SAD WEEPING BABY ─── */}
        <AnimatedCryingBaby />

        {/* Filter & Event List */}
        <div className="bg-white rounded-2xl shadow-lg border border-gray-100 overflow-hidden mt-4">
          
          <div className="flex border-b border-gray-100 bg-gray-50/50 p-4 gap-2 overflow-x-auto">
            <div className="flex items-center gap-2 mr-4 text-gray-400">
              <Filter className="w-4 h-4" />
              <span className="text-sm font-semibold uppercase tracking-wider">Filter</span>
            </div>
            {(['all', 'crying', 'noise_detected', 'sleeping'] as const).map((f) => (
              <button
                key={f}
                onClick={() => setFilter(f)}
                className={`px-4 py-2 rounded-lg text-sm font-semibold capitalize transition-all whitespace-nowrap ${
                  filter === f 
                    ? 'bg-indigo-600 text-white shadow-md' 
                    : 'bg-white text-gray-600 border border-gray-200 hover:bg-gray-100'
                }`}
              >
                {f.replace('_', ' ')}
              </button>
            ))}
          </div>

          <div className="p-6">
            {isLoading ? (
              <div className="flex flex-col items-center justify-center py-12">
                <div className="animate-spin rounded-full h-10 w-10 border-b-2 border-indigo-600 mb-4"></div>
                <p className="text-gray-500 font-medium">Fetching history for {selectedDate}...</p>
              </div>
            ) : filteredEvents.length === 0 ? (
              <div className="text-center py-16">
                <div className="bg-gray-50 w-20 h-20 rounded-full flex items-center justify-center mx-auto mb-4">
                  <Clock className="w-8 h-8 text-gray-300" />
                </div>
                <p className="text-lg font-semibold text-gray-700">No records found</p>
                <p className="text-gray-500 mt-1">There are no events matching this filter for the selected date.</p>
              </div>
            ) : (
              <div className="space-y-4">
                {filteredEvents.map((event) => (
                  <div 
                    key={event.id} 
                    className="flex flex-col sm:flex-row sm:items-center justify-between p-5 bg-white rounded-xl border border-gray-100 hover:border-indigo-100 hover:shadow-md transition-all gap-4"
                  >
                    <div className="flex items-center gap-4">
                      <div className="flex flex-col items-center justify-center w-16 h-16 rounded-2xl bg-gray-50 border border-gray-100">
                        <Clock className="w-5 h-5 text-gray-400 mb-1" />
                        <span className="text-xs font-bold text-gray-600">{formatTime(event.detected_at)}</span>
                      </div>
                      
                      <div>
                        <span className={`inline-block px-3 py-1 rounded-full border text-xs font-bold uppercase tracking-wide mb-2 ${getStatusBadge(event.status)}`}>
                          {event.status.replace('_', ' ')}
                        </span>
                        <div className="flex items-center gap-4 text-sm">
                          <p>
                            Confidence: <span className={getIntensityColor(event.intensity)}>{event.intensity}%</span>
                          </p>
                          {event.duration > 0 && (
                            <>
                              <span className="text-gray-300">•</span>
                              <p className="text-gray-600 font-medium flex items-center gap-1">
                                <Timer className="w-4 h-4" /> {event.duration}s duration
                              </p>
                            </>
                          )}
                        </div>
                      </div>
                    </div>
                  </div>
                ))}
              </div>
            )}
          </div>

        </div>
      </div>
    </div>
  );
}