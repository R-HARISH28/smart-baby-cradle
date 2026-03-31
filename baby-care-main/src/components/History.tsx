// src/components/History.tsx
import { useEffect, useState } from 'react';
import { Clock, TrendingUp, Activity } from 'lucide-react';
import { collection, query, orderBy, limit, onSnapshot } from 'firebase/firestore';
import { db } from '../lib/firebase';
import type { CryEvent, BabyStatus } from '../types/database';

export default function History() {
  const [events, setEvents] = useState<CryEvent[]>([]);
  const [isLoading, setIsLoading] = useState(true);
  const [filter, setFilter] = useState<BabyStatus | 'all'>('all');

  useEffect(() => {
    const eventsQuery = query(
      collection(db, 'cry_events'),
      orderBy('detected_at', 'desc'),
      limit(100)
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
  }, []);

  const filteredEvents = filter === 'all'
    ? events
    : events.filter((e) => e.status === filter);

  const getStatusBadge = (status: BabyStatus) => {
    switch (status) {
      case 'sleeping': return 'bg-blue-100 text-blue-800 border-blue-200';
      case 'crying': return 'bg-red-100 text-red-800 border-red-200';
      case 'noise_detected': return 'bg-yellow-100 text-yellow-800 border-yellow-200';
    }
  };

  const getIntensityColor = (intensity: number) => {
    if (intensity >= 70) return 'text-red-600 font-bold';
    if (intensity >= 40) return 'text-yellow-600 font-semibold';
    return 'text-green-600';
  };

  const formatDateTime = (dateString: string) => {
    const date = new Date(dateString);
    return { date: date.toLocaleDateString(), time: date.toLocaleTimeString() };
  };

  const stats = {
    total: events.length,
    crying: events.filter((e) => e.status === 'crying').length,
    avgIntensity: events.length > 0
      ? Math.round(events.reduce((sum, e) => sum + e.intensity, 0) / events.length)
      : 0,
  };

  if (isLoading) {
    return (
      <div className="flex items-center justify-center min-h-screen">
        <div className="text-lg text-gray-600">Loading history...</div>
      </div>
    );
  }

  return (
      // ... [Keep the exact same JSX return block as your original History.tsx]
      <div className="min-h-screen bg-gradient-to-br from-blue-50 to-indigo-50 p-4 md:p-8">
         {/* the rest of the UI remains completely unchanged */}
      </div>
  );
}