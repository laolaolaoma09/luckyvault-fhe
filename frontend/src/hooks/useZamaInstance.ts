import { useState, useEffect } from 'react';
import { createInstance, initSDK, SepoliaConfig } from '@zama-fhe/relayer-sdk/bundle';

const MAX_RETRIES = 3;
const RETRY_DELAY = 2000;

export function useZamaInstance() {
  const [instance, setInstance] = useState<any>(null);
  const [isLoading, setIsLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);

  useEffect(() => {
    let mounted = true;
    let retryCount = 0;

    const delay = (ms: number) => new Promise(resolve => setTimeout(resolve, ms));

    const initZama = async (): Promise<boolean> => {
      try {
        console.log(`[FHE] Initializing SDK (attempt ${retryCount + 1}/${MAX_RETRIES})...`);

        // Initialize the SDK first
        await initSDK();
        console.log('[FHE] SDK initialized successfully');

        // Create instance with Sepolia config
        const zamaInstance = await createInstance(SepoliaConfig);
        console.log('[FHE] Instance created successfully');

        if (mounted && zamaInstance) {
          setInstance(zamaInstance);
          setError(null);
          return true;
        }
        return false;
      } catch (err) {
        console.error('[FHE] Initialization error:', err);
        return false;
      }
    };

    const initWithRetry = async () => {
      setIsLoading(true);
      setError(null);

      while (retryCount < MAX_RETRIES && mounted) {
        const success = await initZama();
        if (success) {
          setIsLoading(false);
          return;
        }

        retryCount++;
        if (retryCount < MAX_RETRIES && mounted) {
          console.log(`[FHE] Retrying in ${RETRY_DELAY}ms...`);
          await delay(RETRY_DELAY);
        }
      }

      if (mounted) {
        setError('Decryption unavailable. Draw rewards still work.');
        setIsLoading(false);
      }
    };

    initWithRetry();

    return () => {
      mounted = false;
    };
  }, []);

  return { instance, isLoading, error };
}
