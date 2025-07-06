import { atom } from 'jotai';

// ========================================
// UI State Atoms
// ========================================

export const visualizationModeAtom = atom<'cooperation' | 'score' | 'movement'>('cooperation');
export const showGridAtom = atom<boolean>(true);
export const showCoordinatesAtom = atom<boolean>(false);
export const autoRunAtom = atom<boolean>(false);
export const autoRunSpeedAtom = atom<number>(100); // ms per generation