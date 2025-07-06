import { atom } from 'jotai';
import type { AgentData, Statistics } from '../../types';

// ========================================
// Simulation State Atoms
// ========================================

export const isSimulationRunningAtom = atom<boolean>(false);

// ========================================
// Simulation Data Atoms
// ========================================

export const currentGenerationAtom = atom<number>(0);
export const agentsAtom = atom<AgentData[]>([]);
export const statisticsAtom = atom<Statistics>({
  generation: 0,
  population: 0,
  average_score: 0,
  max_score: 0,
  min_score: 0,
  average_cooperation: 0,
  total_battles: 0,
});

// ========================================
// History Tracking Atoms
// ========================================

export const generationHistoryAtom = atom<Statistics[]>([]);
export const selectedAgentAtom = atom<AgentData | null>(null);
export const selectedPositionAtom = atom<{ x: number; y: number } | null>(null);