import { renderHook, waitFor } from '@testing-library/react';
import { afterEach, describe, expect, it, vi } from 'vitest';
import { useWasm } from './useWasm';

const initWasm = vi.fn().mockResolvedValue(undefined);
const setPanicHook = vi.fn();

vi.mock('@/assets/pkg/prisoners_dilemma_2d.js', () => ({
  default: (...args: unknown[]) => initWasm(...args),
  // biome-ignore lint/style/useNamingConvention: WASM binding uses snake_case from Rust
  set_panic_hook: (...args: unknown[]) => setPanicHook(...args),
  // biome-ignore lint/style/useNamingConvention: WASM binding class name from Rust
  WasmSimulation: class {},
}));

describe('useWasm', () => {
  afterEach(() => {
    vi.clearAllMocks();
  });

  it('starts in a loading state with no module', async () => {
    const { result } = renderHook(() => useWasm());

    expect(result.current.loading).toBe(true);
    expect(result.current.wasmModule).toBeNull();
    expect(result.current.error).toBeNull();

    // 次のテストに非同期処理が漏れ出さないよう、ロード完了まで待つ
    await waitFor(() => expect(result.current.loading).toBe(false));
  });

  it('loads the WASM module and installs the panic hook', async () => {
    const { result } = renderHook(() => useWasm());

    await waitFor(() => expect(result.current.loading).toBe(false));

    expect(initWasm).toHaveBeenCalledTimes(1);
    expect(setPanicHook).toHaveBeenCalledTimes(1);
    expect(result.current.wasmModule).not.toBeNull();
    expect(result.current.error).toBeNull();
  });

  it('exposes an error message and clears loading when initialization fails', async () => {
    initWasm.mockRejectedValueOnce(new Error('failed to instantiate'));

    const { result } = renderHook(() => useWasm());

    await waitFor(() => expect(result.current.loading).toBe(false));

    expect(result.current.error).toBe('failed to instantiate');
    expect(result.current.wasmModule).toBeNull();
  });

  it('falls back to a generic message when a non-Error is thrown', async () => {
    initWasm.mockRejectedValueOnce('not an Error instance');

    const { result } = renderHook(() => useWasm());

    await waitFor(() => expect(result.current.loading).toBe(false));

    expect(result.current.error).toBe('Failed to load WASM module');
  });
});
