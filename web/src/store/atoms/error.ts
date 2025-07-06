import { atom } from 'jotai';

// ========================================
// Error State Atoms
// ========================================

export const errorAtom = atom<string | null>(null);

// ========================================
// Error Action Atoms
// ========================================

// Set error state (simple version without cross-dependencies)
export const setErrorAtom = atom(
  null,
  (_get, set, error: string | null) => {
    set(errorAtom, error);
  }
);

// Clear error state
export const clearErrorAtom = atom(
  null,
  (_get, set) => {
    set(errorAtom, null);
  }
);