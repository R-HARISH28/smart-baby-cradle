import { useEffect, useRef, useState } from 'react';
import { Mic, MicOff, Activity } from 'lucide-react';

export default function LocalMonitor() {
  const [isMonitoring, setIsMonitoring] = useState(false);
  const socketRef = useRef<WebSocket | null>(null);
  const mediaRecorderRef = useRef<MediaRecorder | null>(null);

  const startMonitoring = async () => {
    // 1. Open the WebSocket to your FastAPI backend
    // Replace 'localhost:8000' with your ngrok URL if testing remotely
    const socket = new WebSocket('ws://localhost:8000/ws/audio');
    socketRef.current = socket;

    socket.onopen = async () => {
      console.log("Connected to AI Backend");
      const stream = await navigator.mediaDevices.getUserMedia({ audio: true });
      
      // 2. Record in small 1-second slices for "Real-time" feel
      const recorder = new MediaRecorder(stream, { mimeType: 'audio/webm' });
      mediaRecorderRef.current = recorder;

      recorder.ondataavailable = (event) => {
        if (event.data.size > 0 && socket.readyState === WebSocket.OPEN) {
          // Send raw binary data to Python
          socket.send(event.data);
        }
      };

      recorder.start(1000); // Trigger 'ondataavailable' every 1 second
      setIsMonitoring(true);
    };
  };

  const stopMonitoring = () => {
    mediaRecorderRef.current?.stop();
    socketRef.current?.close();
    setIsMonitoring(false);
  };

  return (
    <div className="p-6 bg-white rounded-xl shadow-md border-2 border-indigo-50">
      <h3 className="text-lg font-bold mb-4 flex items-center">
        <Activity className={`mr-2 ${isMonitoring ? 'text-green-500 animate-pulse' : 'text-gray-400'}`} />
        Laptop Mic Monitor
      </h3>
      <button
        onClick={isMonitoring ? stopMonitoring : startMonitoring}
        className={`w-full py-3 rounded-lg font-bold flex items-center justify-center space-x-2 ${
          isMonitoring ? 'bg-red-500 text-white' : 'bg-indigo-600 text-white'
        }`}
      >
        {isMonitoring ? <><MicOff size={20} /><span>Stop Monitor</span></> : <><Mic size={20} /><span>Start Monitor</span></>}
      </button>
    </div>
  );
}