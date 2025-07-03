// ========================================
// AgentPopulation Value Object
// ========================================

import type { AgentData } from '../../types';

export class AgentPopulation {
  private readonly _agents: ReadonlyArray<AgentData>;

  constructor(agents: AgentData[]) {
    if (agents.length < 0) {
      throw new Error('AgentPopulation cannot be negative');
    }

    this._agents = Object.freeze([...agents]);
  }

  get agents(): ReadonlyArray<AgentData> {
    return this._agents;
  }

  get size(): number {
    return this._agents.length;
  }

  isEmpty(): boolean {
    return this._agents.length === 0;
  }

  hasMinimumSize(minSize: number): boolean {
    return this._agents.length >= minSize;
  }

  getByIndex(index: number): AgentData | undefined {
    return this._agents[index];
  }

  filterByCooperationRate(minRate: number, maxRate: number): AgentPopulation {
    const filtered = this._agents.filter(
      (agent) => agent.cooperation_rate >= minRate && agent.cooperation_rate <= maxRate
    );
    return new AgentPopulation(filtered);
  }

  sortByFitness(): AgentPopulation {
    const sorted = [...this._agents].sort((a, b) => b.score - a.score);
    return new AgentPopulation(sorted);
  }

  getTopPerformers(percentage: number): AgentPopulation {
    if (percentage <= 0 || percentage > 1) {
      throw new Error('Percentage must be between 0 and 1');
    }

    const sorted = this.sortByFitness();
    const count = Math.floor(this._agents.length * percentage);
    const topPerformers = sorted._agents.slice(0, count);

    return new AgentPopulation(topPerformers);
  }

  calculateAverageCooperation(): number {
    if (this._agents.length === 0) return 0;

    const sum = this._agents.reduce((acc, agent) => acc + agent.cooperation_rate, 0);
    return sum / this._agents.length;
  }

  calculateAverageScore(): number {
    if (this._agents.length === 0) return 0;

    const sum = this._agents.reduce((acc, agent) => acc + agent.score, 0);
    return sum / this._agents.length;
  }

  calculateDiversity(): number {
    if (this._agents.length < 2) return 0;

    const cooperationRates = this._agents.map((agent) => agent.cooperation_rate);
    const mean = this.calculateAverageCooperation();
    const variance =
      cooperationRates.reduce((acc, rate) => acc + (rate - mean) ** 2, 0) / this._agents.length;

    return Math.sqrt(variance);
  }

  equals(other: AgentPopulation): boolean {
    if (this._agents.length !== other._agents.length) {
      return false;
    }

    return this._agents.every((agent, index) => this.agentsEqual(agent, other._agents[index]));
  }

  private agentsEqual(a: AgentData, b: AgentData): boolean {
    return (
      a.id === b.id &&
      a.x === b.x &&
      a.y === b.y &&
      a.cooperation_rate === b.cooperation_rate &&
      a.movement_rate === b.movement_rate &&
      a.score === b.score
    );
  }

  static empty(): AgentPopulation {
    return new AgentPopulation([]);
  }

  static fromArray(agents: AgentData[]): AgentPopulation {
    return new AgentPopulation(agents);
  }
}
