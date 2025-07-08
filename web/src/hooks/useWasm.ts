import { useEffect, useState } from 'react';
import type { WasmModule } from '../types/wasm';

export const useWasm = () => {
  const [wasmModule, setWasmModule] = useState<WasmModule | null>(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);

  useEffect(() => {
    const loadWasm = async () => {
      try {
        setLoading(true);

        // Dynamic import of the WASM module
        const wasmModule = await import('../assets/pkg/prisoners_dilemma_2d.js');
        await wasmModule.default();

        // Set panic hook for better error messages
        wasmModule.set_panic_hook();

        setWasmModule(wasmModule as WasmModule);
        setError(null);
      } catch (err) {
        console.error('Failed to load WASM module:', err);
        setError(err instanceof Error ? err.message : 'Failed to load WASM module');
      } finally {
        setLoading(false);
      }
    };

    loadWasm();
  }, []);

  return { error, loading, wasmModule };
};
