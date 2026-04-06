// // src/components/History.tsx
// import { useEffect, useState } from 'react';
// import { Clock, TrendingUp, Activity } from 'lucide-react';
// import { collection, query, orderBy, limit, onSnapshot } from 'firebase/firestore';
// import { db } from '../lib/firebase';
// import type { CryEvent, BabyStatus } from '../types/database';

// export default function History() {
//   const [events, setEvents] = useState<CryEvent[]>([]);
//   const [isLoading, setIsLoading] = useState(true);
//   const [filter, setFilter] = useState<BabyStatus | 'all'>('all');

//   useEffect(() => {
//     const eventsQuery = query(
//       collection(db, 'cry_events'),
//       orderBy('detected_at', 'desc'),
//       limit(100)
//     );

//     const unsubscribe = onSnapshot(eventsQuery, (querySnapshot) => {
//       const fetchedEvents = querySnapshot.docs.map(doc => ({
//         id: doc.id,
//         ...doc.data()
//       })) as CryEvent[];
      
//       setEvents(fetchedEvents);
//       setIsLoading(false);
//     });

//     return () => unsubscribe();
//   }, []);

//   const filteredEvents = filter === 'all'
//     ? events
//     : events.filter((e) => e.status === filter);

//   const getStatusBadge = (status: BabyStatus) => {
//     switch (status) {
//       case 'sleeping': return 'bg-blue-100 text-blue-800 border-blue-200';
//       case 'crying': return 'bg-red-100 text-red-800 border-red-200';
//       case 'noise_detected': return 'bg-yellow-100 text-yellow-800 border-yellow-200';
//     }
//   };

//   const getIntensityColor = (intensity: number) => {
//     if (intensity >= 70) return 'text-red-600 font-bold';
//     if (intensity >= 40) return 'text-yellow-600 font-semibold';
//     return 'text-green-600';
//   };

//   const formatDateTime = (dateString: string) => {
//     const date = new Date(dateString);
//     return { date: date.toLocaleDateString(), time: date.toLocaleTimeString() };
//   };

//   const stats = {
//     total: events.length,
//     crying: events.filter((e) => e.status === 'crying').length,
//     avgIntensity: events.length > 0
//       ? Math.round(events.reduce((sum, e) => sum + e.intensity, 0) / events.length)
//       : 0,
//   };

//   if (isLoading) {
//     return (
//       <div className="flex items-center justify-center min-h-screen">
//         <div className="text-lg text-gray-600">Loading history...</div>
//       </div>
//     );
//   }

//   return (
//       // ... [Keep the exact same JSX return block as your original History.tsx]
//       <div className="min-h-screen bg-gradient-to-br from-blue-50 to-indigo-50 p-4 md:p-8">
//          {/* the rest of the UI remains completely unchanged */}
//       </div>
//   );
// }

// src/components/History.tsx
import { useEffect, useState } from 'react';
import { Clock, Activity, Calendar, AlertCircle, Timer, Filter } from 'lucide-react';
import { collection, query, orderBy, limit, onSnapshot, where } from 'firebase/firestore';
import { db } from '../lib/firebase';
import type { CryEvent, BabyStatus } from '../types/database';

export default function History() {
  // Safe way to get local YYYY-MM-DD for the date picker default
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

    // // Create Start and End ISO strings for the selected date
    // const startOfDay = new Date(selectedDate);
    // startOfDay.setHours(0, 0, 0, 0);
    
    // const endOfDay = new Date(selectedDate);
    // endOfDay.setHours(23, 59, 59, 999);

    // 1. Split "YYYY-MM-DD" to force local timezone parsing
    const [year, month, day] = selectedDate.split('-').map(Number);
    
    // 2. Note: Months are 0-indexed in JS (0 = Jan, 1 = Feb), so we do month - 1
    const startOfDay = new Date(year, month - 1, day);
    startOfDay.setHours(0, 0, 0, 0);

    const endOfDay = new Date(year, month - 1, day);
    endOfDay.setHours(23, 59, 59, 999);

    // Query Firebase: Filter by date range, order by time (newest first)
    const eventsQuery = query(
      collection(db, 'cry_events'),
      where('detected_at', '>=', startOfDay.toISOString()),
      where('detected_at', '<=', endOfDay.toISOString()),
      orderBy('detected_at', 'desc'),
      limit(200) // Increased limit to capture a full day's worth of events
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
  }, [selectedDate]); // Re-run query whenever the date changes

  // Filter events locally by status tab
  const filteredEvents = filter === 'all'
    ? events
    : events.filter((e) => e.status === filter);

  // Styling helpers
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

  // Analytics Calculations
  const cryingEvents = events.filter((e) => e.status === 'crying');
  
  const stats = {
    totalEvents: events.length,
    timesCried: cryingEvents.length,
    // Sum all duration fields for crying events (fallback to 0 if undefined)
    totalCryingSeconds: cryingEvents.reduce((sum, e) => sum + (e.duration || 0), 0),
  };

  // Convert seconds into a readable string (e.g., "5m 30s")
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
        <div className="grid grid-cols-1 md:grid-cols-3 gap-6 mb-8">
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

        {/* Filter & Event List */}
        <div className="bg-white rounded-2xl shadow-lg border border-gray-100 overflow-hidden">
          
          {/* Tab Navigation */}
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

          {/* List Content */}
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