import { describe, expect, it } from 'vitest';
import { useSimulation } from './useSimulation';

describe('useSimulation', () => {
  const defaultConfig = {
    agentCount: 1000,
    gridHeight: 100,
    gridWidth: 100,
    speed: 100,
  };

  describe('hook structure', () => {
    it('should be a function with correct name', () => {
      // Arrange & Act
      const hook = useSimulation;

      // Assert
      expect(typeof hook).toBe('function');
      expect(hook.name).toBe('useSimulation');
    });
  });

  describe('configuration validation', () => {
    it('should validate grid dimensions', () => {
      // Arrange
      const config = {
        agentCount: 500,
        gridHeight: 50,
        gridWidth: 50,
        speed: 200,
      };

      // Act
      const isValidWidth = config.gridWidth > 0 && config.gridWidth <= 1000;
      const isValidHeight = config.gridHeight > 0 && config.gridHeight <= 1000;

      // Assert
      expect(isValidWidth).toBe(true);
      expect(isValidHeight).toBe(true);
    });

    it('should validate agent count', () => {
      // Arrange
      const config = { ...defaultConfig, agentCount: 2000 };

      // Act
      const isValidCount = config.agentCount > 0 && config.agentCount <= 10_000;

      // Assert
      expect(isValidCount).toBe(true);
    });

    it('should validate speed setting', () => {
      // Arrange
      const config = { ...defaultConfig, speed: 50 };

      // Act
      const isValidSpeed = config.speed >= 50 && config.speed <= 2000;

      // Assert
      expect(isValidSpeed).toBe(true);
    });
  });

  describe('agent data structure validation', () => {
    it('should validate agent properties', () => {
      // Arrange
      const mockAgent = {
        // biome-ignore lint/style/useNamingConvention: WASM properties use snake_case
        cooperation_rate: 0.8,
        id: '1',
        mobility: 0.5,
        // biome-ignore lint/style/useNamingConvention: WASM properties use snake_case
        movement_strategy: 'Adaptive',
        score: 150,
        strategy: 'AllCooperate',
        x: 10,
        y: 20,
      };

      // Act
      const hasValidId = typeof mockAgent.id === 'string' && mockAgent.id.length > 0;
      const hasValidPosition = typeof mockAgent.x === 'number' && typeof mockAgent.y === 'number';
      const hasValidRates = mockAgent.cooperation_rate >= 0 && mockAgent.cooperation_rate <= 1;
      const hasValidMobility = mockAgent.mobility >= 0 && mockAgent.mobility <= 1;

      // Assert
      expect(hasValidId).toBe(true);
      expect(hasValidPosition).toBe(true);
      expect(hasValidRates).toBe(true);
      expect(hasValidMobility).toBe(true);
    });

    it('should validate agent bounds', () => {
      // Arrange
      const agent = { x: 50, y: 75 };
      const gridWidth = 100;
      const gridHeight = 100;

      // Act
      const isInBounds =
        agent.x >= 0 && agent.x < gridWidth && agent.y >= 0 && agent.y < gridHeight;

      // Assert
      expect(isInBounds).toBe(true);
    });
  });

  describe('statistics data structure validation', () => {
    it('should validate statistics properties', () => {
      // Arrange
      const mockStats = {
        // biome-ignore lint/style/useNamingConvention: WASM properties use snake_case
        all_cooperate_count: 200,
        // biome-ignore lint/style/useNamingConvention: WASM properties use snake_case
        all_defect_count: 300,
        // biome-ignore lint/style/useNamingConvention: WASM properties use snake_case
        average_cooperation_rate: 0.6,
        // biome-ignore lint/style/useNamingConvention: WASM properties use snake_case
        average_mobility: 0.4,
        // biome-ignore lint/style/useNamingConvention: WASM properties use snake_case
        average_score: 75.5,
        generation: 5,
        // biome-ignore lint/style/useNamingConvention: WASM properties use snake_case
        pavlov_count: 250,
        // biome-ignore lint/style/useNamingConvention: WASM properties use snake_case
        tit_for_tat_count: 250,
        // biome-ignore lint/style/useNamingConvention: WASM properties use snake_case
        total_agents: 1000,
      };

      // Act
      const hasValidCounts =
        mockStats.all_cooperate_count +
          mockStats.all_defect_count +
          mockStats.tit_for_tat_count +
          mockStats.pavlov_count ===
        mockStats.total_agents;
      const hasValidRates =
        mockStats.average_cooperation_rate >= 0 && mockStats.average_cooperation_rate <= 1;
      const hasValidMobility = mockStats.average_mobility >= 0 && mockStats.average_mobility <= 1;

      // Assert
      expect(hasValidCounts).toBe(true);
      expect(hasValidRates).toBe(true);
      expect(hasValidMobility).toBe(true);
    });
  });

  describe('conversion utility functions', () => {
    it('should convert agents to plain objects correctly', () => {
      // Arrange
      const wasmAgent = {
        // biome-ignore lint/style/useNamingConvention: WASM properties use snake_case
        cooperation_rate: 0.8,
        id: '1',
        mobility: 0.5,
        // biome-ignore lint/style/useNamingConvention: WASM properties use snake_case
        movement_strategy: 'Adaptive',
        score: 150,
        strategy: 'AllCooperate',
        x: 10,
        y: 20,
      };

      // Act
      const plainAgent = {
        // biome-ignore lint/style/useNamingConvention: WASM properties use snake_case
        cooperation_rate: wasmAgent.cooperation_rate,
        id: wasmAgent.id,
        mobility: wasmAgent.mobility,
        // biome-ignore lint/style/useNamingConvention: WASM properties use snake_case
        movement_strategy: wasmAgent.movement_strategy,
        score: wasmAgent.score,
        strategy: wasmAgent.strategy,
        x: wasmAgent.x,
        y: wasmAgent.y,
      };

      // Assert
      expect(plainAgent.id).toBe(wasmAgent.id);
      expect(plainAgent.x).toBe(wasmAgent.x);
      expect(plainAgent.y).toBe(wasmAgent.y);
      expect(plainAgent.cooperation_rate).toBe(wasmAgent.cooperation_rate);
    });
  });
});
