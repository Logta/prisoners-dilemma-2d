import { atom } from 'jotai';

// Types from WASM module - these will be available at runtime
type WasmSimulationManager = any;
type WasmSimulationConfig = any;
type WasmBattleManager = any;

// ========================================
// WASM Instance Atoms
// ========================================

export const wasmManagerAtom = atom<WasmSimulationManager | null>(null);
export const wasmConfigAtom = atom<WasmSimulationConfig | null>(null);
export const wasmBattleManagerAtom = atom<WasmBattleManager | null>(null);

// ========================================
// WASM State Management Atoms
// ========================================

export const isWasmInitializedAtom = atom<boolean>(false);
export const isLoadingAtom = atom<boolean>(false);