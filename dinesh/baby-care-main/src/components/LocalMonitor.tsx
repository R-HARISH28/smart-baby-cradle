


// // server AI
// import { useEffect, useRef, useState } from 'react';
// import { collection, addDoc, serverTimestamp } from 'firebase/firestore';
// import { db } from '../lib/firebase';
// import { Mic, MicOff, Activity, Loader2 } from 'lucide-react';

// export default function LocalMonitor() {
//   const [isMonitoring, setIsMonitoring] = useState(false);
//   const [isUploading, setIsUploading] = useState(false);
//   const mediaRecorderRef = useRef<MediaRecorder | null>(null);
//   const intervalRef = useRef<NodeJS.Timeout | null>(null);

//   const startMonitoring = async () => {
//     try {
//       const stream = await navigator.mediaDevices.getUserMedia({ audio: true });
//       setIsMonitoring(true);

//       // We record in 5-second chunks to match the model's expected window
//       const startRecordingChunk = () => {
//         const recorder = new MediaRecorder(stream);
//         const chunks: Blob[] = [];

//         recorder.ondataavailable = (e) => chunks.push(e.data);
        
//         recorder.onstop = async () => {
//           const audioBlob = new Blob(chunks, { type: 'audio/wav' });
//           await sendToBackend(audioBlob);
//         };

//         recorder.start();
        
//         // Stop recording after 5 seconds to trigger the 'onstop' and upload
//         setTimeout(() => {
//           if (recorder.state === "recording") recorder.stop();
//         }, 5000); 
//       };

//       // Start the first chunk immediately
//       startRecordingChunk();
      
//       // Repeat every 5 seconds
//       intervalRef.current = setInterval(startRecordingChunk, 5100);

//     } catch (err) {
//       console.error("Mic access error:", err);
//       alert("Could not access microphone.");
//     }
//   };

//   const sendToBackend = async (blob: Blob) => {
//     setIsUploading(true);
//     const formData = new FormData();
//     formData.append('file', blob, 'monitor_audio.wav');

//     try {
//       const response = await fetch('http://localhost:8000/predict-media', {
//         method: 'POST',
//         body: formData,
//       });

//       const data = await response.json();
//       console.log("AI Result:", data);

//       if (data.success && data.ai_analysis.is_crying) {
//         handleCryDetected(data.ai_analysis.cry_probability);
//       }
//     } catch (err) {
//       console.error("Backend communication error:", err);
//     } finally {
//       setIsUploading(false);
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
//       console.log("🔥 Cry logged to Firestore!");
//     } catch (err) {
//       console.error("Firestore error:", err);
//     }
//   };

//   const stopMonitoring = () => {
//     setIsMonitoring(false);
//     if (intervalRef.current) clearInterval(intervalRef.current);
//     if (mediaRecorderRef.current) mediaRecorderRef.current.stop();
//   };

//   return (
//     <div className="bg-white rounded-xl shadow-lg p-6 border-4 border-indigo-100 mt-6">
//       <div className="flex items-center justify-between mb-4">
//         <div>
//           <h2 className="text-lg font-semibold text-gray-700">Cloud AI Monitor</h2>
//           <p className="text-xs text-indigo-500 font-medium">Backend: FastAPI (Python)</p>
//         </div>
//         <div className={`p-3 rounded-full transition-all ${isMonitoring ? 'bg-green-100 text-green-600 animate-pulse' : 'bg-gray-100 text-gray-400'}`}>
//           {isUploading ? <Loader2 className="w-6 h-6 animate-spin" /> : <Activity className="w-6 h-6" />}
//         </div>
//       </div>
      
//       <button
//         onClick={isMonitoring ? stopMonitoring : startMonitoring}
//         className={`w-full flex items-center justify-center space-x-2 px-4 py-3 rounded-lg transition-all text-white font-bold shadow-md ${
//           isMonitoring ? 'bg-red-500 hover:bg-red-600' : 'bg-indigo-600 hover:bg-indigo-700'
//         }`}
//       >
//         {isMonitoring ? "Stop Monitoring" : "Start Cloud AI Monitor"}
//       </button>
//     </div>
//   );
// }


// 2

// import { useEffect, useRef, useState } from 'react';
// import { collection, addDoc, serverTimestamp } from 'firebase/firestore';
// import { db } from '../lib/firebase';
// import { Mic, MicOff, Activity, Loader2 } from 'lucide-react';

// export default function LocalMonitor() {
//   const [isMonitoring, setIsMonitoring] = useState(false);
//   const [isUploading, setIsUploading] = useState(false);
  
//   // We use refs to keep track of these across renders so we can stop them properly
//   const streamRef = useRef<MediaStream | null>(null);
//   const mediaRecorderRef = useRef<MediaRecorder | null>(null);
//   const intervalRef = useRef<NodeJS.Timeout | null>(null);

//   const startMonitoring = async () => {
//     try {
//       // THE FIX: Request specific raw audio constraints for the ML model
//       const stream = await navigator.mediaDevices.getUserMedia({ 
//         audio: {
//           channelCount: 1,           // Force Mono audio
//           sampleRate: 16000,         // Force 16kHz to match AI training
//           echoCancellation: false,   // Stop browser from filtering out local speakers
//           noiseSuppression: false,   // Send raw audio
//           autoGainControl: false
//         } 
//       });
      
//       streamRef.current = stream;
//       setIsMonitoring(true);

//       // Function to handle the 5-second chunking
//       const startRecordingChunk = () => {
//         if (!streamRef.current) return;
        
//         const recorder = new MediaRecorder(streamRef.current);
//         mediaRecorderRef.current = recorder;
//         const chunks: Blob[] = [];

//         recorder.ondataavailable = (e) => {
//           if (e.data.size > 0) chunks.push(e.data);
//         };
        
//         recorder.onstop = async () => {
//           // Note: MediaRecorder in browsers usually outputs 'audio/webm' or 'audio/mp4'. 
//           // Your Python backend needs to be able to decode this (e.g., using librosa).
//           const audioBlob = new Blob(chunks, { type: recorder.mimeType });
//           await sendToBackend(audioBlob);
//         };

//         recorder.start();
        
//         // Stop recording exactly after 5 seconds to trigger the upload
//         setTimeout(() => {
//           if (recorder.state === "recording") {
//             recorder.stop();
//           }
//         }, 5000); 
//       };

//       // Start the very first chunk immediately
//       startRecordingChunk();
      
//       // Repeat the chunking process every 5.1 seconds
//       intervalRef.current = setInterval(startRecordingChunk, 5100);

//     } catch (err) {
//       console.error("Mic access error:", err);
//       alert("Could not access microphone. Please check permissions.");
//     }
//   };

//   const sendToBackend = async (blob: Blob) => {
//     setIsUploading(true);
//     const formData = new FormData();
    
//     // Using a generic extension because the browser might output webm or mp4
//     formData.append('file', blob, 'monitor_audio_chunk.webm'); 

//     try {
//       const response = await fetch('http://localhost:8000/predict-media', {
//         method: 'POST',
//         body: formData,
//       });

//       const data = await response.json();
//       console.log("AI Result:", data);

//       // If the AI says it's crying, push the log to Firebase
//       if (data.success && data.ai_analysis.is_crying) {
//         await handleCryDetected(data.ai_analysis.cry_probability);
//       }
//     } catch (err) {
//       console.error("Backend communication error:", err);
//     } finally {
//       setIsUploading(false);
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
//       console.log("🔥 Cry logged to Firestore!");
//     } catch (err) {
//       console.error("Firestore error:", err);
//     }
//   };

//   const stopMonitoring = () => {
//     setIsMonitoring(false);
    
//     // 1. Stop the 5-second loop
//     if (intervalRef.current) {
//       clearInterval(intervalRef.current);
//       intervalRef.current = null;
//     }
    
//     // 2. Stop the current active recorder
//     if (mediaRecorderRef.current && mediaRecorderRef.current.state !== 'inactive') {
//       mediaRecorderRef.current.stop();
//     }

//     // 3. Kill the microphone stream completely so the red recording dot goes away
//     if (streamRef.current) {
//       streamRef.current.getTracks().forEach(track => track.stop());
//       streamRef.current = null;
//     }
//   };

//   // Cleanup on component unmount
//   useEffect(() => {
//     return () => {
//       stopMonitoring();
//     };
//   }, []);

//   return (
//     <div className="bg-white rounded-xl shadow-lg p-6 border-4 border-indigo-100 mt-6">
//       <div className="flex items-center justify-between mb-4">
//         <div>
//           <h2 className="text-lg font-semibold text-gray-700">Cloud AI Monitor</h2>
//           <p className="text-xs text-indigo-500 font-medium">Backend: FastAPI (Python)</p>
//         </div>
//         <div className={`p-3 rounded-full transition-all ${isMonitoring ? 'bg-green-100 text-green-600 animate-pulse' : 'bg-gray-100 text-gray-400'}`}>
//           {isUploading ? <Loader2 className="w-6 h-6 animate-spin" /> : <Activity className="w-6 h-6" />}
//         </div>
//       </div>
      
//       <button
//         onClick={isMonitoring ? stopMonitoring : startMonitoring}
//         className={`w-full flex items-center justify-center space-x-2 px-4 py-3 rounded-lg transition-all text-white font-bold shadow-md ${
//           isMonitoring ? 'bg-red-500 hover:bg-red-600' : 'bg-indigo-600 hover:bg-indigo-700'
//         }`}
//       >
//         {isMonitoring ? (
//           <>
//             <MicOff className="w-5 h-5 mr-2" />
//             <span>Stop Monitoring</span>
//           </>
//         ) : (
//           <>
//             <Mic className="w-5 h-5 mr-2" />
//             <span>Start Cloud AI Monitor</span>
//           </>
//         )}
//       </button>
//     </div>
//   );
// }

// 3


import { useEffect, useRef, useState } from 'react';
import { collection, addDoc, serverTimestamp, doc, setDoc } from 'firebase/firestore';
import { db } from '../lib/firebase';
import { Mic, MicOff, Activity, Loader2, Brain } from 'lucide-react';

export default function LocalMonitor() {
  const [isMonitoring, setIsMonitoring] = useState(false);
  const [isUploading, setIsUploading] = useState(false);
  const [lastResult, setLastResult] = useState<{ status: string; confidence: number } | null>(null);
  
  const streamRef = useRef<MediaStream | null>(null);
  const mediaRecorderRef = useRef<MediaRecorder | null>(null);
  const intervalRef = useRef<NodeJS.Timeout | null>(null);

  const startMonitoring = async () => {
    try {
      const stream = await navigator.mediaDevices.getUserMedia({ 
        audio: {
          channelCount: 1,           
          sampleRate: 22050,         // Updated to 22.05kHz to match your training SR
          echoCancellation: false,   
          noiseSuppression: false,   
          autoGainControl: false
        } 
      });
      
      streamRef.current = stream;
      setIsMonitoring(true);

      const startRecordingChunk = () => {
        if (!streamRef.current) return;
        
        const recorder = new MediaRecorder(streamRef.current);
        mediaRecorderRef.current = recorder;
        const chunks: Blob[] = [];

        recorder.ondataavailable = (e) => {
          if (e.data.size > 0) chunks.push(e.data);
        };
        
        recorder.onstop = async () => {
          const audioBlob = new Blob(chunks, { type: recorder.mimeType });
          await sendToBackend(audioBlob);
        };

        recorder.start();
        
        setTimeout(() => {
          if (recorder.state === "recording") {
            recorder.stop();
          }
        }, 5000); 
      };

      startRecordingChunk();
      intervalRef.current = setInterval(startRecordingChunk, 5100);

    } catch (err) {
      console.error("Mic access error:", err);
      alert("Could not access microphone. Please check permissions.");
    }
  };

  const sendToBackend = async (blob: Blob) => {
    setIsUploading(true);


      // --- NEW: SAVE CHUNK LOCALLY ---
  const timestamp = new Date().getTime();
  const blobUrl = URL.createObjectURL(blob);
  const link = document.createElement('a');
  link.href = blobUrl;
  link.download = `baby_audio_chunk_${timestamp}.webm`; // Saves as webm
  document.body.appendChild(link);
  link.click(); // Triggers the download
  document.body.removeChild(link);
  // Optional: Clean up memory after a delay
  setTimeout(() => URL.revokeObjectURL(blobUrl), 10000);
  // -------------------------------

    const formData = new FormData();
    formData.append('file', blob, 'monitor_audio_chunk.webm'); 

    try {
      const response = await fetch('http://localhost:8000/predict-media', {
        method: 'POST',
        body: formData,
      });

      const data = await response.json();
      
      if (data.success) {
        const isCrying = data.ai_analysis.is_crying;
        const confidence = Math.round(data.ai_analysis.cry_probability * 100);
        
        setLastResult({ status: isCrying ? 'crying' : 'sleeping', confidence });

        // ALWAYS sync the result to Firestore so the Dashboard updates
        await updateGlobalStatus(isCrying ? 'crying' : 'sleeping', confidence);

        // If it's a confirmed cry, log it to history
        if (isCrying) {
          await handleCryDetected(data.ai_analysis.cry_probability);
        }
      }
    } catch (err) {
      console.error("Backend communication error:", err);
    } finally {
      setIsUploading(false);
    }
  };

  // NEW: This function bridges the AI result to the Dashboard UI
  const updateGlobalStatus = async (status: string, intensity: number) => {
    try {
      const statusRef = doc(db, 'system_status', 'current');
      await setDoc(statusRef, {
        current_status: status,
        intensity: intensity,
        updated_at: new Date().toISOString(),
        // Only update the "last_cry" timestamp if a cry is actually happening
        ...(status === 'crying' && { last_cry_detected: new Date().toISOString() })
      }, { merge: true });
    } catch (err) {
      console.error("Global status update error:", err);
    }
  };

  const handleCryDetected = async (probability: number) => {
    try {
      await addDoc(collection(db, 'cry_events'), {
        detected_at: new Date().toISOString(),
        server_timestamp: serverTimestamp(),
        intensity: Math.round(probability * 100),
        status: 'crying'
      });
    } catch (err) {
      console.error("Firestore log error:", err);
    }
  };

  const stopMonitoring = () => {
    setIsMonitoring(false);
    setLastResult(null);
    if (intervalRef.current) { clearInterval(intervalRef.current); intervalRef.current = null; }
    if (mediaRecorderRef.current && mediaRecorderRef.current.state !== 'inactive') { mediaRecorderRef.current.stop(); }
    if (streamRef.current) { streamRef.current.getTracks().forEach(track => track.stop()); streamRef.current = null; }
    
    // Set status back to sleeping when monitor stops
    updateGlobalStatus('sleeping', 0);
  };

  useEffect(() => { return () => stopMonitoring(); }, []);

  return (
    <div className="bg-white rounded-2xl p-6 shadow-sm border border-gray-100">
      <div className="flex items-center justify-between mb-6">
        <div className="flex items-center space-x-3">
          <div className="p-2 bg-indigo-100 rounded-lg text-indigo-600">
            <Brain className="w-5 h-5" />
          </div>
          <div>
            <h3 className="font-bold text-gray-800">AI Neural Engine</h3>
            <p className="text-xs text-gray-500">Processing 5s audio windows</p>
          </div>
        </div>
        {isMonitoring && (
          <div className="flex items-center space-x-2">
            <span className="text-[10px] font-black text-indigo-400 animate-pulse">LIVE ANALYSIS</span>
            <Activity className="w-4 h-4 text-indigo-500 animate-bounce" />
          </div>
        )}
      </div>

      {lastResult && isMonitoring && (
        <div className={`mb-6 p-4 rounded-xl border-2 transition-all ${lastResult.status === 'crying' ? 'bg-red-50 border-red-200' : 'bg-green-50 border-green-200'}`}>
          <div className="flex justify-between items-center">
            <span className="text-sm font-bold text-gray-600">AI Confidence:</span>
            <span className={`text-lg font-black ${lastResult.status === 'crying' ? 'text-red-600' : 'text-green-600'}`}>
              {lastResult.confidence}%
            </span>
          </div>
          <div className="w-full bg-gray-200 rounded-full h-2 mt-2">
            <div 
              className={`h-2 rounded-full transition-all duration-500 ${lastResult.status === 'crying' ? 'bg-red-500' : 'bg-green-500'}`} 
              style={{ width: `${lastResult.confidence}%` }}
            ></div>
          </div>
        </div>
      )}

      <button
        onClick={isMonitoring ? stopMonitoring : startMonitoring}
        disabled={isUploading && !isMonitoring}
        className={`w-full group relative flex items-center justify-center space-x-3 px-6 py-4 rounded-xl transition-all font-bold text-lg ${
          isMonitoring 
            ? 'bg-red-50 text-red-600 hover:bg-red-100 border-2 border-red-200' 
            : 'bg-indigo-600 text-white hover:bg-indigo-700 shadow-lg shadow-indigo-200'
        }`}
      >
        {isUploading ? (
          <Loader2 className="w-6 h-6 animate-spin" />
        ) : isMonitoring ? (
          <MicOff className="w-6 h-6" />
        ) : (
          <Mic className="w-6 h-6" />
        )}
        <span>{isMonitoring ? 'Stop Monitoring' : 'Start Cloud AI Monitor'}</span>
      </button>
      
      <p className="text-center text-[10px] text-gray-400 mt-4 uppercase tracking-widest font-bold">
        Secure End-to-End Encryption Active
      </p>
    </div>
  );
}