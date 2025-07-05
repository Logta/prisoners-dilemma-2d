// ========================================
// Simulation Use Case - シミュレーションユースケース
// ========================================

use crate::domain::{
    SimulationService, SimulationConfig, SimulationStats,
    Agent, AgentId, Position
};
use serde::{Deserialize, Serialize};
use std::collections::HashMap;

/// シミュレーション実行コマンド
#[derive(Debug, Clone, PartialEq, Serialize, Deserialize)]
pub struct RunSimulationCommand {
    pub config: SimulationConfig,
    pub generations: u32,
}

/// シミュレーション結果
#[derive(Debug, Clone, PartialEq, Serialize, Deserialize)]
pub struct SimulationResult {
    pub final_stats: SimulationStats,
    pub generation_history: Vec<SimulationStats>,
    pub final_agents: Vec<Agent>,
}

/// シミュレーション初期化コマンド
#[derive(Debug, Clone, PartialEq, Serialize, Deserialize)]
pub struct InitializeSimulationCommand {
    pub config: SimulationConfig,
}

/// シミュレーション初期化結果
#[derive(Debug, Clone, PartialEq, Serialize, Deserialize)]
pub struct SimulationInitializationResult {
    pub initial_stats: SimulationStats,
    pub agent_count: usize,
}

/// シミュレーションユースケース
pub struct SimulationUseCase {
    service: Option<SimulationService>,
}

/// シミュレーションエラー
#[derive(Debug, Clone, PartialEq)]
pub enum SimulationUseCaseError {
    NotInitialized,
    GridError(String),
    InvalidConfig,
    SimulationFinished,
}

impl SimulationUseCase {
    /// 新しいシミュレーションユースケースを作成
    pub fn new() -> Self {
        Self { service: None }
    }

    /// シミュレーションを初期化
    pub fn initialize(&mut self, command: InitializeSimulationCommand) -> Result<SimulationInitializationResult, SimulationUseCaseError> {
        let mut service = SimulationService::new(command.config)
            .map_err(|e| SimulationUseCaseError::GridError(e.to_string()))?;
        
        service.initialize()
            .map_err(|e| SimulationUseCaseError::GridError(e.to_string()))?;
        
        let initial_stats = service.get_stats();
        let agent_count = service.grid().agent_count();
        
        self.service = Some(service);
        
        Ok(SimulationInitializationResult {
            initial_stats,
            agent_count,
        })
    }

    /// シミュレーションを実行
    pub fn run_simulation(&mut self, command: RunSimulationCommand) -> Result<SimulationResult, SimulationUseCaseError> {
        // 既存のサービスがあるかチェック
        if self.service.is_none() {
            // 新しく初期化
            self.initialize(InitializeSimulationCommand {
                config: command.config,
            })?;
        }

        let service = self.service.as_mut().ok_or(SimulationUseCaseError::NotInitialized)?;
        
        if service.is_finished() {
            return Err(SimulationUseCaseError::SimulationFinished);
        }

        let mut generation_history = Vec::new();
        
        // 初期状態を記録
        generation_history.push(service.get_stats());
        
        // 指定世代数実行
        for _ in 0..command.generations {
            if service.is_finished() {
                break;
            }
            service.run_generation();
            generation_history.push(service.get_stats());
        }
        
        let final_stats = service.get_stats();
        let final_agents: Vec<Agent> = service.grid().agents().values().cloned().collect();
        
        Ok(SimulationResult {
            final_stats,
            generation_history,
            final_agents,
        })
    }

    /// 1ステップ実行
    pub fn step(&mut self) -> Result<SimulationStats, SimulationUseCaseError> {
        let service = self.service.as_mut().ok_or(SimulationUseCaseError::NotInitialized)?;
        
        if service.is_finished() {
            return Err(SimulationUseCaseError::SimulationFinished);
        }
        
        service.step();
        Ok(service.get_stats())
    }

    /// 1世代実行
    pub fn run_generation(&mut self) -> Result<SimulationStats, SimulationUseCaseError> {
        let service = self.service.as_mut().ok_or(SimulationUseCaseError::NotInitialized)?;
        
        if service.is_finished() {
            return Err(SimulationUseCaseError::SimulationFinished);
        }
        
        service.run_generation();
        Ok(service.get_stats())
    }

    /// 現在の統計を取得
    pub fn get_current_stats(&self) -> Result<SimulationStats, SimulationUseCaseError> {
        let service = self.service.as_ref().ok_or(SimulationUseCaseError::NotInitialized)?;
        Ok(service.get_stats())
    }

    /// 現在のエージェント情報を取得
    pub fn get_current_agents(&self) -> Result<HashMap<AgentId, Agent>, SimulationUseCaseError> {
        let service = self.service.as_ref().ok_or(SimulationUseCaseError::NotInitialized)?;
        Ok(service.grid().agents().clone())
    }

    /// 指定位置のエージェントを取得
    pub fn get_agent_at(&self, position: Position) -> Result<Option<Agent>, SimulationUseCaseError> {
        let service = self.service.as_ref().ok_or(SimulationUseCaseError::NotInitialized)?;
        Ok(service.grid().get_agent_at(position).cloned())
    }

    /// シミュレーションが完了しているかチェック
    pub fn is_finished(&self) -> Result<bool, SimulationUseCaseError> {
        let service = self.service.as_ref().ok_or(SimulationUseCaseError::NotInitialized)?;
        Ok(service.is_finished())
    }

    /// シミュレーションをリセット
    pub fn reset(&mut self) {
        self.service = None;
    }
}

impl Default for SimulationUseCase {
    fn default() -> Self {
        Self::new()
    }
}

impl std::fmt::Display for SimulationUseCaseError {
    fn fmt(&self, f: &mut std::fmt::Formatter<'_>) -> std::fmt::Result {
        match self {
            SimulationUseCaseError::NotInitialized => write!(f, "Simulation not initialized"),
            SimulationUseCaseError::GridError(msg) => write!(f, "Grid error: {}", msg),
            SimulationUseCaseError::InvalidConfig => write!(f, "Invalid configuration"),
            SimulationUseCaseError::SimulationFinished => write!(f, "Simulation has finished"),
        }
    }
}

impl std::error::Error for SimulationUseCaseError {}

#[cfg(test)]
mod tests {
    use super::*;
    use crate::domain::{WorldSize, EvolutionConfig, SelectionMethod, CrossoverMethod};

    fn create_test_config() -> SimulationConfig {
        SimulationConfig::new(
            WorldSize::new(10, 10).unwrap(),
            20,
            5,
            10,
            1,
            EvolutionConfig::new(
                0.1,
                0.05,
                0.2,
                SelectionMethod::Tournament,
                CrossoverMethod::Uniform,
            ),
        )
    }

    #[test]
    fn test_simulation_use_case_creation() {
        let use_case = SimulationUseCase::new();
        
        // 初期化前は使用不可
        assert!(use_case.get_current_stats().is_err());
        assert!(matches!(
            use_case.get_current_stats().unwrap_err(),
            SimulationUseCaseError::NotInitialized
        ));
    }

    #[test]
    fn test_simulation_initialization() {
        let mut use_case = SimulationUseCase::new();
        let config = create_test_config();
        
        let command = InitializeSimulationCommand { config };
        let result = use_case.initialize(command).unwrap();
        
        assert_eq!(result.agent_count, 20);
        assert_eq!(result.initial_stats.generation, 0);
        assert_eq!(result.initial_stats.population, 20);
    }

    #[test]
    fn test_simulation_step() {
        let mut use_case = SimulationUseCase::new();
        let config = create_test_config();
        
        use_case.initialize(InitializeSimulationCommand { config }).unwrap();
        
        let stats = use_case.step().unwrap();
        assert_eq!(stats.generation, 0); // ステップでは世代は変わらない
        // 戦闘が発生したかもしれない（u32なので常に非負）
    }

    #[test]
    fn test_simulation_run_generation() {
        let mut use_case = SimulationUseCase::new();
        let config = create_test_config();
        
        use_case.initialize(InitializeSimulationCommand { config }).unwrap();
        
        let stats = use_case.run_generation().unwrap();
        assert_eq!(stats.generation, 1); // 世代が進む
    }

    #[test]
    fn test_simulation_run_full() {
        let mut use_case = SimulationUseCase::new();
        let config = create_test_config();
        
        let command = RunSimulationCommand {
            config,
            generations: 3,
        };
        
        let result = use_case.run_simulation(command).unwrap();
        
        assert_eq!(result.final_stats.generation, 3);
        assert_eq!(result.generation_history.len(), 4); // 初期 + 3世代
        assert!(result.final_agents.len() > 0);
    }

    #[test]
    fn test_simulation_get_current_agents() {
        let mut use_case = SimulationUseCase::new();
        let config = create_test_config();
        
        use_case.initialize(InitializeSimulationCommand { config }).unwrap();
        
        let agents = use_case.get_current_agents().unwrap();
        assert_eq!(agents.len(), 20);
    }

    #[test]
    fn test_simulation_get_agent_at() {
        let mut use_case = SimulationUseCase::new();
        let config = create_test_config();
        
        use_case.initialize(InitializeSimulationCommand { config }).unwrap();
        
        // 存在しない位置
        let empty_position = Position::new(9, 9);
        let _agent = use_case.get_agent_at(empty_position).unwrap();
        // グリッドに配置されているかは不定なので、結果がOkであることのみチェック
    }

    #[test]
    fn test_simulation_not_initialized_error() {
        let mut use_case = SimulationUseCase::new();
        
        assert!(matches!(
            use_case.step().unwrap_err(),
            SimulationUseCaseError::NotInitialized
        ));
        
        assert!(matches!(
            use_case.run_generation().unwrap_err(),
            SimulationUseCaseError::NotInitialized
        ));
    }

    #[test]
    fn test_simulation_reset() {
        let mut use_case = SimulationUseCase::new();
        let config = create_test_config();
        
        use_case.initialize(InitializeSimulationCommand { config }).unwrap();
        assert!(use_case.get_current_stats().is_ok());
        
        use_case.reset();
        assert!(matches!(
            use_case.get_current_stats().unwrap_err(),
            SimulationUseCaseError::NotInitialized
        ));
    }

    #[test]
    fn test_simulation_finished_condition() {
        let mut use_case = SimulationUseCase::new();
        
        // 非常に小さな設定で即座に終了させる
        let config = SimulationConfig::new(
            WorldSize::new(2, 2).unwrap(),
            1, // 1個のエージェント
            1, // 1世代で終了
            1,
            1,
            EvolutionConfig::standard(),
        );
        
        use_case.initialize(InitializeSimulationCommand { config }).unwrap();
        
        // 多数回実行して終了状態にする
        for _ in 0..10 {
            if use_case.is_finished().unwrap() {
                break;
            }
            let _ = use_case.run_generation();
        }
        
        // 終了状態での操作はエラー
        if use_case.is_finished().unwrap() {
            assert!(matches!(
                use_case.step().unwrap_err(),
                SimulationUseCaseError::SimulationFinished
            ));
        }
    }
}