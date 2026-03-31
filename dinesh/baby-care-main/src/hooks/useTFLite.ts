import { useState, useEffect } from 'react';

export function useTFLite(modelUrl: string) {
  const [model, setModel] = useState<any | null>(null);
  const [isLoading, setIsLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);

  useEffect(() => {
    let isMounted = true;

    async function initTFLite() {
      try {
        // Access tflite from the global window object loaded via CDN
        if (!window.tflite) {
          throw new Error("TFLite not loaded. Check your index.html scripts.");
        }

        const loadedModel = await window.tflite.loadTFLiteModel(modelUrl);
        
        if (isMounted) {
          setModel(loadedModel);
          setIsLoading(false);
        }
      } catch (err: any) {
        if (isMounted) {
          console.error("Error loading TFLite model:", err);
          setError(err.message);
          setIsLoading(false);
        }
      }
    }

    initTFLite();

    return () => {
      isMounted = false;
    };
  }, [modelUrl]);

  return { model, isLoading, error };
}