// import { useEffect, useRef, useState } from 'react';
// import { useTFLite } from '../hooks/useTFLite';
// import { collection, addDoc } from 'firebase/firestore';
// import { db } from '../lib/firebase';
// import { Mic, MicOff, Activity } from 'lucide-react';

// export default function LocalMonitor() {
//   const { model, isLoading, error } = useTFLite('/cry_detection_model.tflite');
//   const [isMonitoring, setIsMonitoring] = useState(false);
  
//   const audioContextRef = useRef<AudioContext | null>(null);
//   const analyzerRef = useRef<AnalyserNode | null>(null);
//   const streamRef = useRef<MediaStream | null>(null);
//   const requestRef = useRef<number>();

//   const startMonitoring = async () => {
//     try {
//       const stream = await navigator.mediaDevices.getUserMedia({ audio: true });
//       streamRef.current = stream;
      
//       const audioCtx = new window.AudioContext();
//       audioContextRef.current = audioCtx;
      
//       const source = audioCtx.createMediaStreamSource(stream);
//       const analyzer = audioCtx.createAnalyser();
//       analyzer.fftSize = 256; 
      
//       source.connect(analyzer);
//       analyzerRef.current = analyzer;
      
//       setIsMonitoring(true);
//       processAudio();
//     } catch (err) {
//       console.error("Error accessing microphone:", err);
//     }
//   };

//   const stopMonitoring = () => {
//     if (streamRef.current) {
//       streamRef.current.getTracks().forEach(track => track.stop());
//     }
//     if (audioContextRef.current) {
//       audioContextRef.current.close();
//     }
//     if (requestRef.current) {
//       cancelAnimationFrame(requestRef.current);
//     }
//     setIsMonitoring(false);
//   };

//   const processAudio = async () => {
//     if (!model || !analyzerRef.current || !window.tf) return;

//     const dataArray = new Float32Array(analyzerRef.current.frequencyBinCount);
//     analyzerRef.current.getFloatFrequencyData(dataArray);

//     // Using window.tf to bypass the NPM package
//     const inputTensor = window.tf.tensor(dataArray).reshape([1, 128]); 

//     try {
//       const outputTensor = model.predict(inputTensor);
//       const result = await outputTensor.data();
      
//       const cryProbability = result[0];

//       if (cryProbability > 0.85) {
//         handleCryDetected(cryProbability);
//       }

//       inputTensor.dispose();
//       outputTensor.dispose();

//     } catch (err) {
//       console.error("Inference error:", err);
//     }

//     requestRef.current = requestAnimationFrame(processAudio);
//   };

//   const handleCryDetected = async (probability: number) => {
//     try {
//       await addDoc(collection(db, 'cry_events'), {
//         detected_at: new Date().toISOString(),
//         intensity: Math.round(probability * 100),
//         status: 'crying',
//         duration: 0 
//       });
//       console.log("Cry detected and logged!");
//     } catch (err) {
//       console.error("Error logging cry to Firestore:", err);
//     }
//   };

//   useEffect(() => {
//     return () => stopMonitoring();
//   }, []);

//   if (isLoading) return <div className="p-4 text-gray-500 animate-pulse">Loading AI Model...</div>;
//   if (error) return <div className="p-4 text-red-500">Failed to load AI Model: {error}</div>;

//   return (
//     <div className="bg-white rounded-xl shadow-lg p-6 border-4 border-indigo-100 mt-6">
//       <div className="flex items-center justify-between mb-4">
//         <h2 className="text-lg font-semibold text-gray-700">On-Device AI Monitor</h2>
//         <div className={`p-3 rounded-full ${isMonitoring ? 'bg-green-100 text-green-600' : 'bg-gray-100 text-gray-600'}`}>
//           <Activity className="w-6 h-6" />
//         </div>
//       </div>
      
//       <p className="text-sm text-gray-600 mb-6">
//         Uses local TFLite model to analyze audio in the browser without sending raw audio to the server.
//       </p>

//       <button
//         onClick={isMonitoring ? stopMonitoring : startMonitoring}
//         className={`w-full flex items-center justify-center space-x-2 px-4 py-3 rounded-lg transition-colors text-white font-medium ${
//           isMonitoring ? 'bg-red-500 hover:bg-red-600' : 'bg-indigo-500 hover:bg-indigo-600'
//         }`}
//       >
//         {isMonitoring ? (
//           <>
//             <MicOff className="w-5 h-5" />
//             <span>Stop Monitoring</span>
//           </>
//         ) : (
//           <>
//             <Mic className="w-5 h-5" />
//             <span>Start AI Monitor</span>
//           </>
//         )}
//       </button>
//     </div>
//   );
// }

//                                                                                        2

// import { useEffect, useRef, useState } from 'react';
// import { useTFLite } from '../hooks/useTFLite';
// import { collection, addDoc, serverTimestamp } from 'firebase/firestore';
// import { db } from '../lib/firebase';
// import { Mic, MicOff, Activity } from 'lucide-react';

// export default function LocalMonitor() {
//   const { model, isLoading, error } = useTFLite('/cry_detection_model.tflite');
//   const [isMonitoring, setIsMonitoring] = useState(false);
//   const [isProcessingCry, setIsProcessingCry] = useState(false);
  
//   const audioContextRef = useRef<AudioContext | null>(null);
//   const analyzerRef = useRef<AnalyserNode | null>(null);
//   const streamRef = useRef<MediaStream | null>(null);
//   const requestRef = useRef<number>();
//   const lastProcessedTime = useRef<number>(0);

//   const startMonitoring = async () => {
//     try {
//       const stream = await navigator.mediaDevices.getUserMedia({ audio: true });
//       streamRef.current = stream;
      
//       const audioCtx = new (window.AudioContext || (window as any).webkitAudioContext)();
      
//       // Resume context if suspended (browser security policy)
//       if (audioCtx.state === 'suspended') {
//         await audioCtx.resume();
//       }

//       audioContextRef.current = audioCtx;
//       const source = audioCtx.createMediaStreamSource(stream);
//       const analyzer = audioCtx.createAnalyser();
      
//       // fftSize 256 results in frequencyBinCount of 128
//       analyzer.fftSize = 1024; 
//       source.connect(analyzer);
//       analyzerRef.current = analyzer;
      
//       setIsMonitoring(true);
//       requestRef.current = requestAnimationFrame(processAudio);
//     } catch (err) {
//       console.error("Error accessing microphone:", err);
//       alert("Could not access microphone. Please check permissions.");
//     }
//   };

//   const stopMonitoring = () => {
//     setIsMonitoring(false);
//     if (requestRef.current) {
//       cancelAnimationFrame(requestRef.current);
//     }
//     if (streamRef.current) {
//       streamRef.current.getTracks().forEach(track => track.stop());
//     }
//     if (audioContextRef.current) {
//       audioContextRef.current.close();
//     }
//   };

//   const processAudio = async (timestamp: number) => {
//     if (!model || !analyzerRef.current || !window.tf) return;

//     // Throttle: Only run inference every 500ms to save CPU/Battery
//     if (timestamp - lastProcessedTime.current < 500) {
//       requestRef.current = requestAnimationFrame(processAudio);
//       return;
//     }
//     lastProcessedTime.current = timestamp;

//     const dataArray = new Float32Array(analyzerRef.current.frequencyBinCount);
//     analyzerRef.current.getFloatFrequencyData(dataArray);

//     try {
//       // Ensure the tensor shape [1, 128] matches your model's expected input
//       // const inputTensor = window.tf.tensor(dataArray).reshape([1, 128]); 
//       const inputTensor = window.tf.tensor(dataArray).reshape([1, 40, 216, 1]); 
//       const outputTensor = model.predict(inputTensor);
//       const result = await outputTensor.data();
      
//       const cryProbability = result[0];

//       // Threshold check
//       if (cryProbability > 0.85 && !isProcessingCry) {
//         handleCryDetected(cryProbability);
//       }

//       inputTensor.dispose();
//       outputTensor.dispose();

//       if (isMonitoring) {
//         requestRef.current = requestAnimationFrame(processAudio);
//       }
//     } catch (err) {
//       console.error("Inference error:", err);
//       stopMonitoring(); // Safety: stop the loop if it crashes
//     }
//   };

//   const handleCryDetected = async (probability: number) => {
//     setIsProcessingCry(true);
//     try {
//       await addDoc(collection(db, 'cry_events'), {
//         detected_at: new Date().toISOString(),
//         server_timestamp: serverTimestamp(), // Better for backend syncing
//         intensity: Math.round(probability * 100),
//         status: 'crying',
//         duration: 0 
//       });
//       console.log("Cry detected and logged to Firestore!");
      
//       // Cooldown for 3 seconds before detecting again
//       setTimeout(() => setIsProcessingCry(false), 3000);
//     } catch (err) {
//       console.error("Error logging cry to Firestore:", err);
//       setIsProcessingCry(false);
//     }
//   };

//   useEffect(() => {
//     return () => stopMonitoring();
//   }, []);

//   if (isLoading) return <div className="p-4 text-gray-500 animate-pulse text-center">Loading AI Model...</div>;
//   if (error) return <div className="p-4 text-red-500 text-center">Failed to load AI Model: {error}</div>;

//   return (
//     <div className="bg-white rounded-xl shadow-lg p-6 border-4 border-indigo-100 mt-6">
//       <div className="flex items-center justify-between mb-4">
//         <div>
//           <h2 className="text-lg font-semibold text-gray-700">On-Device AI Monitor</h2>
//           <p className="text-xs text-indigo-500 font-medium">TFLite Runtime Active</p>
//         </div>
//         <div className={`p-3 rounded-full transition-all ${isMonitoring ? 'bg-green-100 text-green-600 animate-pulse' : 'bg-gray-100 text-gray-400'}`}>
//           <Activity className="w-6 h-6" />
//         </div>
//       </div>
      
//       <p className="text-sm text-gray-600 mb-6">
//         Analyzing local audio stream for infant distress signals. 
//         <span className="block mt-1 text-xs text-gray-400">Data is processed locally; no audio leaves this device.</span>
//       </p>

//       <button
//         onClick={isMonitoring ? stopMonitoring : startMonitoring}
//         className={`w-full flex items-center justify-center space-x-2 px-4 py-3 rounded-lg transition-all text-white font-bold shadow-md ${
//           isMonitoring 
//             ? 'bg-red-500 hover:bg-red-600 active:scale-95' 
//             : 'bg-indigo-600 hover:bg-indigo-700 active:scale-95'
//         }`}
//       >
//         {isMonitoring ? (
//           <>
//             <MicOff className="w-5 h-5" />
//             <span>Stop AI Monitor</span>
//           </>
//         ) : (
//           <>
//             <Mic className="w-5 h-5" />
//             <span>Start AI Monitor</span>
//           </>
//         )}
//       </button>
//     </div>
//   );
// }


// //  3
// import { useEffect, useRef, useState } from 'react';
// import { useTFLite } from '../hooks/useTFLite';
// import { collection, addDoc, serverTimestamp } from 'firebase/firestore';
// import { db } from '../lib/firebase';
// import { Mic, MicOff, Activity } from 'lucide-react';

// export default function LocalMonitor() {
//   const { model, isLoading, error } = useTFLite('/cry_detection_model.tflite');
//   const [isMonitoring, setIsMonitoring] = useState(false);
//   const [isProcessingCry, setIsProcessingCry] = useState(false);
  
//   const audioContextRef = useRef<AudioContext | null>(null);
//   const analyzerRef = useRef<AnalyserNode | null>(null);
//   const streamRef = useRef<MediaStream | null>(null);
//   const requestRef = useRef<number>();
  
//   // BUFFER MANAGEMENT:
//   // We need 216 time steps, each with 40 frequency bins.
//   const audioBufferRef = useRef<number[][]>([]); 
//   const lastProcessedTime = useRef<number>(0);

//   const startMonitoring = async () => {
//     try {
//       const stream = await navigator.mediaDevices.getUserMedia({ audio: true });
//       streamRef.current = stream;
      
//       const audioCtx = new (window.AudioContext || (window as any).webkitAudioContext)();
//       if (audioCtx.state === 'suspended') await audioCtx.resume();

//       audioContextRef.current = audioCtx;
//       const source = audioCtx.createMediaStreamSource(stream);
//       const analyzer = audioCtx.createAnalyser();
      
//       // We set fftSize higher (1024) to get enough resolution to pick 40 bins
//       analyzer.fftSize = 1024; 
//       source.connect(analyzer);
//       analyzerRef.current = analyzer;
      
//       setIsMonitoring(true);
//       requestRef.current = requestAnimationFrame(processAudio);
//     } catch (err) {
//       console.error("Error accessing microphone:", err);
//       alert("Could not access microphone.");
//     }
//   };

//   const processAudio = async (timestamp: number) => {
//     if (!model || !analyzerRef.current || !window.tf || !isMonitoring) return;

//     // Throttle inference frequency to match your model's temporal window
//     // 50ms is roughly the time resolution for a 216-step window in real-time
//     if (timestamp - lastProcessedTime.current < 50) {
//       requestRef.current = requestAnimationFrame(processAudio);
//       return;
//     }
//     lastProcessedTime.current = timestamp;

//     const dataArray = new Float32Array(analyzerRef.current.frequencyBinCount);
//     analyzerRef.current.getFloatFrequencyData(dataArray);

//     // 1. Feature Selection: Extract the first 40 frequency bins
//     const currentFrame = Array.from(dataArray.slice(0, 40));

//     // 2. Sliding Window: Add frame to buffer
//     audioBufferRef.current.push(currentFrame);
//     if (audioBufferRef.current.length > 216) {
//       audioBufferRef.current.shift(); // Remove oldest frame
//     }

//     // 3. Inference: Only run when the buffer is full (40x216)
//     if (audioBufferRef.current.length === 216) {
//       try {
//         // Flatten the 2D buffer into a 1D array of 8640 elements
//         const flatData = audioBufferRef.current.flat();
        
//         // Match the model's exact expected shape: [Batch, Height, Width, Channels]
//         const inputTensor = window.tf.tensor(flatData).reshape([1, 40, 216, 1]); 
        
//         const outputTensor = model.predict(inputTensor);
//         const result = await (outputTensor as any).data();
        
//         const cryProbability = result[0];

//         if (cryProbability > 0.85 && !isProcessingCry) {
//           handleCryDetected(cryProbability);
//         }

//         inputTensor.dispose();
//         outputTensor.dispose();
//       } catch (err) {
//         console.error("Inference error:", err);
//       }
//     }

//     requestRef.current = requestAnimationFrame(processAudio);
//   };

//   const handleCryDetected = async (probability: number) => {
//     setIsProcessingCry(true);
//     try {
//       await addDoc(collection(db, 'cry_events'), {
//         detected_at: new Date().toISOString(),
//         server_timestamp: serverTimestamp(),
//         intensity: Math.round(probability * 100),
//         status: 'crying'
//       });
//       console.log("Cry logged!");
//       setTimeout(() => setIsProcessingCry(false), 5000); // 5s cooldown
//     } catch (err) {
//       setIsProcessingCry(false);
//     }
//   };

//   const stopMonitoring = () => {
//     setIsMonitoring(false);
//     audioBufferRef.current = []; // Clear buffer
//     if (requestRef.current) cancelAnimationFrame(requestRef.current);
//     if (streamRef.current) streamRef.current.getTracks().forEach(t => t.stop());
//     if (audioContextRef.current) audioContextRef.current.close();
//   };

//   useEffect(() => {
//     return () => stopMonitoring();
//   }, []);

//   // ... (Keep the same JSX return as before)
//   return (
//     <div className="bg-white rounded-xl shadow-lg p-6 border-4 border-indigo-100 mt-6">
//        <div className="flex items-center justify-between mb-4">
//          <div>
//            <h2 className="text-lg font-semibold text-gray-700">On-Device AI Monitor</h2>
//            <p className="text-xs text-indigo-500 font-medium">TFLite Runtime Active</p>
//          </div>
//          <div className={`p-3 rounded-full transition-all ${isMonitoring ? 'bg-green-100 text-green-600 animate-pulse' : 'bg-gray-100 text-gray-400'}`}>
//            <Activity className="w-6 h-6" />
//          </div>
//        </div>
//        <button
//          onClick={isMonitoring ? stopMonitoring : startMonitoring}
//          className={`w-full flex items-center justify-center space-x-2 px-4 py-3 rounded-lg transition-all text-white font-bold shadow-md ${
//            isMonitoring ? 'bg-red-500 hover:bg-red-600' : 'bg-indigo-600 hover:bg-indigo-700'
//          }`}
//        >
//          {isMonitoring ? "Stop AI Monitor" : "Start AI Monitor"}
//        </button>
//      </div>
//   );
// }



// server AI
import { useEffect, useRef, useState } from 'react';
import { collection, addDoc, serverTimestamp } from 'firebase/firestore';
import { db } from '../lib/firebase';
import { Mic, MicOff, Activity, Loader2 } from 'lucide-react';

export default function LocalMonitor() {
  const [isMonitoring, setIsMonitoring] = useState(false);
  const [isUploading, setIsUploading] = useState(false);
  const mediaRecorderRef = useRef<MediaRecorder | null>(null);
  const intervalRef = useRef<NodeJS.Timeout | null>(null);

  const startMonitoring = async () => {
    try {
      const stream = await navigator.mediaDevices.getUserMedia({ audio: true });
      setIsMonitoring(true);

      // We record in 5-second chunks to match the model's expected window
      const startRecordingChunk = () => {
        const recorder = new MediaRecorder(stream);
        const chunks: Blob[] = [];

        recorder.ondataavailable = (e) => chunks.push(e.data);
        
        recorder.onstop = async () => {
          const audioBlob = new Blob(chunks, { type: 'audio/wav' });
          await sendToBackend(audioBlob);
        };

        recorder.start();
        
        // Stop recording after 5 seconds to trigger the 'onstop' and upload
        setTimeout(() => {
          if (recorder.state === "recording") recorder.stop();
        }, 5000); 
      };

      // Start the first chunk immediately
      startRecordingChunk();
      
      // Repeat every 5 seconds
      intervalRef.current = setInterval(startRecordingChunk, 5100);

    } catch (err) {
      console.error("Mic access error:", err);
      alert("Could not access microphone.");
    }
  };

  const sendToBackend = async (blob: Blob) => {
    setIsUploading(true);
    const formData = new FormData();
    formData.append('file', blob, 'monitor_audio.wav');

    try {
      const response = await fetch('http://localhost:8000/predict-media', {
        method: 'POST',
        body: formData,
      });

      const data = await response.json();
      console.log("AI Result:", data);

      if (data.success && data.ai_analysis.is_crying) {
        handleCryDetected(data.ai_analysis.cry_probability);
      }
    } catch (err) {
      console.error("Backend communication error:", err);
    } finally {
      setIsUploading(false);
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
      console.log("🔥 Cry logged to Firestore!");
    } catch (err) {
      console.error("Firestore error:", err);
    }
  };

  const stopMonitoring = () => {
    setIsMonitoring(false);
    if (intervalRef.current) clearInterval(intervalRef.current);
    if (mediaRecorderRef.current) mediaRecorderRef.current.stop();
  };

  return (
    <div className="bg-white rounded-xl shadow-lg p-6 border-4 border-indigo-100 mt-6">
      <div className="flex items-center justify-between mb-4">
        <div>
          <h2 className="text-lg font-semibold text-gray-700">Cloud AI Monitor</h2>
          <p className="text-xs text-indigo-500 font-medium">Backend: FastAPI (Python)</p>
        </div>
        <div className={`p-3 rounded-full transition-all ${isMonitoring ? 'bg-green-100 text-green-600 animate-pulse' : 'bg-gray-100 text-gray-400'}`}>
          {isUploading ? <Loader2 className="w-6 h-6 animate-spin" /> : <Activity className="w-6 h-6" />}
        </div>
      </div>
      
      <button
        onClick={isMonitoring ? stopMonitoring : startMonitoring}
        className={`w-full flex items-center justify-center space-x-2 px-4 py-3 rounded-lg transition-all text-white font-bold shadow-md ${
          isMonitoring ? 'bg-red-500 hover:bg-red-600' : 'bg-indigo-600 hover:bg-indigo-700'
        }`}
      >
        {isMonitoring ? "Stop Monitoring" : "Start Cloud AI Monitor"}
      </button>
    </div>
  );
}