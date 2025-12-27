import { useState, useEffect } from 'react';
import { createInstance, initSDK, type FhevmInstanceConfig } from '@zama-fhe/relayer-sdk/bundle';

// Custom Sepolia config with correct relayer URL
const SEPOLIA_CONFIG: FhevmInstanceConfig = {
  aclContractAddress: '0x687820221192C5B662b25367F70076A37bc79b6c',
  kmsContractAddress: '0x1364cBBf2cDF5032C47d8226a6f6FBD2AFCDacAC',
  inputVerifierContractAddress: '0xbc91f3daD1A5F19F8390c400196e58073B6a0BC4',
  verifyingContractAddressDecryption: '0xb6E160B1ff80D67Bfe90A85eE06Ce0A2613607D1',
  verifyingContractAddressInputVerification: '0x7048C39f048125eDa9d678AEbaDfB22F7900a29F',
  chainId: 11155111,
  gatewayChainId: 55815,
  relayerUrl: 'https://relayer.testnet.zama.org', // Correct URL (.org not .cloud)
};

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
        console.log('[FHE] Using relayer URL:', SEPOLIA_CONFIG.relayerUrl);

        // Initialize the SDK first
        await initSDK();
        console.log('[FHE] SDK initialized successfully');

        // Create instance with custom Sepolia config
        const zamaInstance = await createInstance(SEPOLIA_CONFIG);
        console.log('[FHE] Instance created successfully');

        if (mounted && zamaInstance) {
          setInstance(zamaInstance);
          setError(null);
          return true;
        }
        return false;
      } catch (err: any) {
        console.error('[FHE] Initialization error:', err);
        console.error('[FHE] Error name:', err?.name);
        console.error('[FHE] Error message:', err?.message);
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
