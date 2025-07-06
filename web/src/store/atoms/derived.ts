import { atom } from 'jotai';
import { simulationConfigAtom } from './config';
import { currentGenerationAtom, agentsAtom } from './simulation';

// ========================================
// Derived Atoms (Read-only computed values)
// ========================================

// Grid dimensions derived from config
export const gridDimensionsAtom = atom((get) => {
  const config = get(simulationConfigAtom);
  return {
    width: config.world_width,
    height: config.world_height,
  };
});

// Simulation progress percentage
export const simulationProgressAtom = atom((get) => {
  const config = get(simulationConfigAtom);
  const currentGen = get(currentGenerationAtom);
  return (currentGen / config.max_generations) * 100;
});

// Is simulation finished
export const isSimulationFinishedAtom = atom((get) => {
  const config = get(simulationConfigAtom);
  const currentGen = get(currentGenerationAtom);
  return currentGen >= config.max_generations;
});

// Agent count by type
export const agentStatsByTypeAtom = atom((get) => {
  const agents = get(agentsAtom);
  
  let cooperators = 0;
  let defectors = 0;
  let alive = 0;
  
  agents.forEach(agent => {
    if (agent.is_alive) {
      alive++;
      if (agent.cooperation_tendency > 0.5) {
        cooperators++;
      } else {
        defectors++;
      }
    }
  });
  
  return {
    total: agents.length,
    alive,
    cooperators,
    defectors,
    cooperationRate: alive > 0 ? cooperators / alive : 0,
  };
});