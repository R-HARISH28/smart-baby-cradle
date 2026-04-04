


// import { useEffect, useRef, useState } from 'react';
// import { collection, addDoc, serverTimestamp, doc, setDoc } from 'firebase/firestore';
// import { db } from '../lib/firebase';
// import { Mic, MicOff, Activity, Loader2, Brain } from 'lucide-react';

// export default function LocalMonitor() {
//   const [isMonitoring, setIsMonitoring] = useState(false);
//   const [isUploading, setIsUploading] = useState(false);
//   const [lastResult, setLastResult] = useState<{ status: string; confidence: number } | null>(null);
  
//   const streamRef = useRef<MediaStream | null>(null);
//   const mediaRecorderRef = useRef<MediaRecorder | null>(null);
//   const intervalRef = useRef<NodeJS.Timeout | null>(null);

//   const startMonitoring = async () => {
//     try {
//       const stream = await navigator.mediaDevices.getUserMedia({ 
//         audio: {
//           channelCount: 1,           
//           sampleRate: 22050,         // Updated to 22.05kHz to match your training SR
//           echoCancellation: false,   
//           noiseSuppression: false,   
//           autoGainControl: false
//         } 
//       });
      
//       streamRef.current = stream;
//       setIsMonitoring(true);

//       const startRecordingChunk = () => {
//         if (!streamRef.current) return;
        
//         const recorder = new MediaRecorder(streamRef.current);
//         mediaRecorderRef.current = recorder;
//         const chunks: Blob[] = [];

//         recorder.ondataavailable = (e) => {
//           if (e.data.size > 0) chunks.push(e.data);
//         };
        
//         recorder.onstop = async () => {
//           const audioBlob = new Blob(chunks, { type: recorder.mimeType });
//           await sendToBackend(audioBlob);
//         };

//         recorder.start();
        
//         setTimeout(() => {
//           if (recorder.state === "recording") {
//             recorder.stop();
//           }
//         }, 5000); 
//       };

//       startRecordingChunk();
//       intervalRef.current = setInterval(startRecordingChunk, 5100);

//     } catch (err) {
//       console.error("Mic access error:", err);
//       alert("Could not access microphone. Please check permissions.");
//     }
//   };

//   const sendToBackend = async (blob: Blob) => {
//     setIsUploading(true);


//       // --- NEW: SAVE CHUNK LOCALLY ---
//   const timestamp = new Date().getTime();
//   const blobUrl = URL.createObjectURL(blob);
//   const link = document.createElement('a');
//   link.href = blobUrl;
//   link.download = `baby_audio_chunk_${timestamp}.webm`; // Saves as webm
//   document.body.appendChild(link);
//   link.click(); // Triggers the download
//   document.body.removeChild(link);
//   // Optional: Clean up memory after a delay
//   setTimeout(() => URL.revokeObjectURL(blobUrl), 10000);
//   // -------------------------------

//     const formData = new FormData();
//     formData.append('file', blob, 'monitor_audio_chunk.webm'); 

//     try {
//       const response = await fetch('http://localhost:8000/predict-media', {
//         method: 'POST',
//         body: formData,
//       });

//       const data = await response.json();
      
//       if (data.success) {
//         const isCrying = data.ai_analysis.is_crying;
//         const confidence = Math.round(data.ai_analysis.cry_probability * 100);
        
//         setLastResult({ status: isCrying ? 'crying' : 'sleeping', confidence });

//         // ALWAYS sync the result to Firestore so the Dashboard updates
//         await updateGlobalStatus(isCrying ? 'crying' : 'sleeping', confidence);

//         // If it's a confirmed cry, log it to history
//         if (isCrying) {
//           await handleCryDetected(data.ai_analysis.cry_probability);
//         }
//       }
//     } catch (err) {
//       console.error("Backend communication error:", err);
//     } finally {
//       setIsUploading(false);
//     }
//   };

//   // NEW: This function bridges the AI result to the Dashboard UI
//   const updateGlobalStatus = async (status: string, intensity: number) => {
//     try {
//       const statusRef = doc(db, 'system_status', 'current');
//       await setDoc(statusRef, {
//         current_status: status,
//         intensity: intensity,
//         updated_at: new Date().toISOString(),
//         // Only update the "last_cry" timestamp if a cry is actually happening
//         ...(status === 'crying' && { last_cry_detected: new Date().toISOString() })
//       }, { merge: true });
//     } catch (err) {
//       console.error("Global status update error:", err);
//     }
//   };

//   const handleCryDetected = async (probability: number) => {
//     try {
//       await addDoc(collection(db, 'cry_events'), {
//         detected_at: new Date().toISOString(),
//         server_timestamp: serverTimestamp(),
//         intensity: Math.round(probability * 100),
//         status: 'crying'
//       });
//     } catch (err) {
//       console.error("Firestore log error:", err);
//     }
//   };

//   const stopMonitoring = () => {
//     setIsMonitoring(false);
//     setLastResult(null);
//     if (intervalRef.current) { clearInterval(intervalRef.current); intervalRef.current = null; }
//     if (mediaRecorderRef.current && mediaRecorderRef.current.state !== 'inactive') { mediaRecorderRef.current.stop(); }
//     if (streamRef.current) { streamRef.current.getTracks().forEach(track => track.stop()); streamRef.current = null; }
    
//     // Set status back to sleeping when monitor stops
//     updateGlobalStatus('sleeping', 0);
//   };

//   useEffect(() => { return () => stopMonitoring(); }, []);

//   return (
//     <div className="bg-white rounded-2xl p-6 shadow-sm border border-gray-100">
//       <div className="flex items-center justify-between mb-6">
//         <div className="flex items-center space-x-3">
//           <div className="p-2 bg-indigo-100 rounded-lg text-indigo-600">
//             <Brain className="w-5 h-5" />
//           </div>
//           <div>
//             <h3 className="font-bold text-gray-800">AI Neural Engine</h3>
//             <p className="text-xs text-gray-500">Processing 5s audio windows</p>
//           </div>
//         </div>
//         {isMonitoring && (
//           <div className="flex items-center space-x-2">
//             <span className="text-[10px] font-black text-indigo-400 animate-pulse">LIVE ANALYSIS</span>
//             <Activity className="w-4 h-4 text-indigo-500 animate-bounce" />
//           </div>
//         )}
//       </div>

//       {lastResult && isMonitoring && (
//         <div className={`mb-6 p-4 rounded-xl border-2 transition-all ${lastResult.status === 'crying' ? 'bg-red-50 border-red-200' : 'bg-green-50 border-green-200'}`}>
//           <div className="flex justify-between items-center">
//             <span className="text-sm font-bold text-gray-600">AI Confidence:</span>
//             <span className={`text-lg font-black ${lastResult.status === 'crying' ? 'text-red-600' : 'text-green-600'}`}>
//               {lastResult.confidence}%
//             </span>
//           </div>
//           <div className="w-full bg-gray-200 rounded-full h-2 mt-2">
//             <div 
//               className={`h-2 rounded-full transition-all duration-500 ${lastResult.status === 'crying' ? 'bg-red-500' : 'bg-green-500'}`} 
//               style={{ width: `${lastResult.confidence}%` }}
//             ></div>
//           </div>
//         </div>
//       )}

//       <button
//         onClick={isMonitoring ? stopMonitoring : startMonitoring}
//         disabled={isUploading && !isMonitoring}
//         className={`w-full group relative flex items-center justify-center space-x-3 px-6 py-4 rounded-xl transition-all font-bold text-lg ${
//           isMonitoring 
//             ? 'bg-red-50 text-red-600 hover:bg-red-100 border-2 border-red-200' 
//             : 'bg-indigo-600 text-white hover:bg-indigo-700 shadow-lg shadow-indigo-200'
//         }`}
//       >
//         {isUploading ? (
//           <Loader2 className="w-6 h-6 animate-spin" />
//         ) : isMonitoring ? (
//           <MicOff className="w-6 h-6" />
//         ) : (
//           <Mic className="w-6 h-6" />
//         )}
//         <span>{isMonitoring ? 'Stop Monitoring' : 'Start Cloud AI Monitor'}</span>
//       </button>
      
//       <p className="text-center text-[10px] text-gray-400 mt-4 uppercase tracking-widest font-bold">
//         Secure End-to-End Encryption Active
//       </p>
//     </div>
//   );
// }



import { useState, useRef } from 'react';
import { Mic, Activity, Loader2 } from 'lucide-react';

export default function LocalMonitor() {
  const [isMonitoring, setIsMonitoring] = useState(false);
  const [result, setResult] = useState<{ label: string; confidence: number } | null>(null);
  const [isProcessing, setIsProcessing] = useState(false);
  const mediaRecorderRef = useRef<MediaRecorder | null>(null);

  const startRecording = async () => {
    const stream = await navigator.mediaDevices.getUserMedia({ audio: true });
    const recorder = new MediaRecorder(stream);
    mediaRecorderRef.current = recorder;
    const chunks: Blob[] = [];

    recorder.ondataavailable = (e) => chunks.push(e.data);
    recorder.onstop = async () => {
      const blob = new Blob(chunks, { type: 'audio/wav' });
      await sendToAI(blob);
    };

    recorder.start();
    setIsMonitoring(true);

    // Record for 5 seconds then stop automatically
    setTimeout(() => {
      recorder.stop();
      stream.getTracks().forEach(t => t.stop());
      setIsMonitoring(false);
    }, 5000);
  };

  const sendToAI = async (blob: Blob) => {
    setIsProcessing(true);
    const formData = new FormData();
    formData.append('file', blob, 'clip.wav');

    try {
      const res = await fetch('http://localhost:8000/predict', {
        method: 'POST',
        body: formData,
      });
      const data = await res.json();
      setResult({ label: data.label, confidence: data.confidence });
    } catch (err) {
      console.error("AI Server Error:", err);
    } finally {
      setIsProcessing(false);
    }
  };

  return (
    <div className="p-6 bg-white rounded-2xl shadow-xl border border-indigo-100">
      <div className="flex justify-between items-center mb-6">
        <h3 className="font-bold text-gray-800">Local AI Tester</h3>
        {isMonitoring && <Activity className="text-red-500 animate-pulse" />}
      </div>

      <button
        onClick={startRecording}
        disabled={isMonitoring || isProcessing}
        className="w-full bg-indigo-600 text-white py-4 rounded-xl font-bold flex items-center justify-center space-x-2 disabled:opacity-50"
      >
        {isProcessing ? <Loader2 className="animate-spin" /> : <Mic size={20} />}
        <span>{isMonitoring ? 'Recording 5s...' : 'Test 5s Sample'}</span>
      </button>

      {result && (
        <div className={`mt-6 p-4 rounded-xl border-2 ${result.label === 'Crying' ? 'bg-red-50 border-red-200' : 'bg-green-50 border-green-200'}`}>
          <p className="text-sm font-bold text-gray-500 uppercase tracking-wider">Result</p>
          <p className={`text-2xl font-black ${result.label === 'Crying' ? 'text-red-600' : 'text-green-600'}`}>
            {result.label} ({result.confidence}%)
          </p>
        </div>
      )}
    </div>
  );
}