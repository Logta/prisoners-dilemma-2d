// ========================================
// WASM Bindings - WebAssembly JavaScript連携
// ========================================

use crate::application::{
    SimulationUseCase, RunSimulationCommand, InitializeSimulationCommand,
    BattleUseCase, ExecuteBattleCommand
};
use crate::domain::{
    SimulationConfig, WorldSize, EvolutionConfig, SelectionMethod, CrossoverMethod,
    Agent, AgentId, Position, PayoffMatrix
};
use wasm_bindgen::prelude::*;
use serde::{Deserialize, Serialize};
use std::collections::HashMap;

// ========================================
// ロギングユーティリティ
// ========================================
#[wasm_bindgen]
extern "C" {
    #[wasm_bindgen(js_namespace = console)]
    fn log(s: &str);

    #[wasm_bindgen(js_namespace = console)]
    fn error(s: &str);
}

#[macro_export]
macro_rules! console_log {
    ($($t:tt)*) => (log(&format_args!($($t)*).to_string()))
}

#[macro_export]
macro_rules! console_error {
    ($($t:tt)*) => (error(&format_args!($($t)*).to_string()))
}

// ========================================
// JavaScript用のエラーハンドリング
// ========================================
fn handle_result<T, E: std::fmt::Display>(result: Result<T, E>) -> Result<T, JsValue> {
    result.map_err(|e| JsValue::from_str(&e.to_string()))
}

// ========================================
// シミュレーション関連のWASMバインディング
// ========================================

/// WebAssembly用のシミュレーション設定
#[wasm_bindgen]
#[derive(Debug, Clone, Serialize, Deserialize)]
pub struct WasmSimulationConfig {
    world_width: u32,
    world_height: u32,
    initial_population: usize,
    max_generations: u32,
    battles_per_generation: u32,
    neighbor_radius: u32,
    mutation_rate: f64,
    mutation_strength: f64,
    elite_ratio: f64,
    selection_method: String,
    crossover_method: String,
}

#[wasm_bindgen]
impl WasmSimulationConfig {
    #[wasm_bindgen(constructor)]
    pub fn new(
        world_width: u32,
        world_height: u32,
        initial_population: usize,
        max_generations: u32,
        battles_per_generation: u32,
        neighbor_radius: u32,
        mutation_rate: f64,
        mutation_strength: f64,
        elite_ratio: f64,
        selection_method: String,
        crossover_method: String,
    ) -> Self {
        Self {
            world_width,
            world_height,
            initial_population,
            max_generations,
            battles_per_generation,
            neighbor_radius,
            mutation_rate,
            mutation_strength,
            elite_ratio,
            selection_method,
            crossover_method,
        }
    }

    #[wasm_bindgen(getter)]
    pub fn world_width(&self) -> u32 { self.world_width }

    #[wasm_bindgen(getter)]
    pub fn world_height(&self) -> u32 { self.world_height }

    #[wasm_bindgen(getter)]
    pub fn initial_population(&self) -> usize { self.initial_population }

    #[wasm_bindgen(getter)]
    pub fn max_generations(&self) -> u32 { self.max_generations }

    #[wasm_bindgen(getter)]
    pub fn battles_per_generation(&self) -> u32 { self.battles_per_generation }

    #[wasm_bindgen(getter)]
    pub fn neighbor_radius(&self) -> u32 { self.neighbor_radius }

    #[wasm_bindgen(getter)]
    pub fn mutation_rate(&self) -> f64 { self.mutation_rate }

    #[wasm_bindgen(getter)]
    pub fn mutation_strength(&self) -> f64 { self.mutation_strength }

    #[wasm_bindgen(getter)]
    pub fn elite_ratio(&self) -> f64 { self.elite_ratio }

    #[wasm_bindgen(getter)]
    pub fn selection_method(&self) -> String { self.selection_method.clone() }

    #[wasm_bindgen(getter)]
    pub fn crossover_method(&self) -> String { self.crossover_method.clone() }

    #[wasm_bindgen(setter)]
    pub fn set_selection_method(&mut self, method: String) { self.selection_method = method; }

    #[wasm_bindgen(setter)]
    pub fn set_crossover_method(&mut self, method: String) { self.crossover_method = method; }
}

impl WasmSimulationConfig {
    fn to_domain_config(&self) -> Result<SimulationConfig, JsValue> {
        let world_size = WorldSize::new(self.world_width, self.world_height)
            .map_err(|e| JsValue::from_str(&e.to_string()))?;

        let selection_method = match self.selection_method.as_str() {
            "Tournament" => SelectionMethod::Tournament,
            "Roulette" => SelectionMethod::Roulette,
            "Rank" => SelectionMethod::Rank,
            _ => return Err(JsValue::from_str("Invalid selection method")),
        };

        let crossover_method = match self.crossover_method.as_str() {
            "Uniform" => CrossoverMethod::Uniform,
            "OnePoint" => CrossoverMethod::OnePoint,
            "TwoPoint" => CrossoverMethod::TwoPoint,
            _ => return Err(JsValue::from_str("Invalid crossover method")),
        };

        let evolution_config = EvolutionConfig::new(
            self.mutation_rate,
            self.mutation_strength,
            self.elite_ratio,
            selection_method,
            crossover_method,
        );

        Ok(SimulationConfig::new(
            world_size,
            self.initial_population,
            self.max_generations,
            self.battles_per_generation,
            self.neighbor_radius,
            evolution_config,
        ))
    }
}

/// WebAssembly用のシミュレーションマネージャー
#[wasm_bindgen]
pub struct WasmSimulationManager {
    simulation_use_case: SimulationUseCase,
}

/// カスタムエラー用のWasmエラー
#[wasm_bindgen]
pub struct WasmError {
    message: String,
    error_type: String,
}

#[wasm_bindgen]
impl WasmError {
    #[wasm_bindgen(constructor)]
    pub fn new(message: String, error_type: String) -> Self {
        Self { message, error_type }
    }

    #[wasm_bindgen(getter)]
    pub fn message(&self) -> String {
        self.message.clone()
    }

    #[wasm_bindgen(getter)]
    pub fn error_type(&self) -> String {
        self.error_type.clone()
    }
}

#[wasm_bindgen]
impl WasmSimulationManager {
    #[wasm_bindgen(constructor)]
    pub fn new() -> Self {
        // console_error_panic_hook::set_once(); // 依存関係不足のためコメントアウト
        Self {
            simulation_use_case: SimulationUseCase::new(),
        }
    }

    /// シミュレーションを初期化
    #[wasm_bindgen]
    pub fn initialize(&mut self, config: &WasmSimulationConfig) -> Result<JsValue, JsValue> {
        let domain_config = config.to_domain_config()?;
        let command = InitializeSimulationCommand { config: domain_config };
        
        let result = handle_result(self.simulation_use_case.initialize(command))?;
        
        let json_result = serde_json::to_string(&result)
            .map_err(|e| JsValue::from_str(&format!("JSON serialization error: {}", e)))?;
        Ok(JsValue::from_str(&json_result))
    }

    /// 指定世代数のシミュレーションを実行
    #[wasm_bindgen]
    pub fn run_simulation(&mut self, config: &WasmSimulationConfig, generations: u32) -> Result<JsValue, JsValue> {
        let domain_config = config.to_domain_config()?;
        let command = RunSimulationCommand {
            config: domain_config,
            generations,
        };
        
        let result = handle_result(self.simulation_use_case.run_simulation(command))?;
        
        let json_result = serde_json::to_string(&result)
            .map_err(|e| JsValue::from_str(&format!("JSON serialization error: {}", e)))?;
        Ok(JsValue::from_str(&json_result))
    }

    /// 1ステップ実行
    #[wasm_bindgen]
    pub fn step(&mut self) -> Result<JsValue, JsValue> {
        // ステップ実行前にシミュレーションが終了していないかチェック
        if let Ok(is_finished) = self.simulation_use_case.is_finished() {
            if is_finished {
                console_log!("Simulation has finished, cannot step further");
                let error_obj = js_sys::Object::new();
                js_sys::Reflect::set(
                    &error_obj,
                    &JsValue::from_str("message"),
                    &JsValue::from_str("Simulation has finished"),
                ).unwrap();
                js_sys::Reflect::set(
                    &error_obj,
                    &JsValue::from_str("type"),
                    &JsValue::from_str("SimulationFinished"),
                ).unwrap();
                return Err(error_obj.into());
            }
        }
        
        // ステップ実行前にエージェント数をチェック（強化版）
        if let Ok(stats) = self.simulation_use_case.get_current_stats() {
            console_log!("Step execution - population: {}, generation: {}", stats.population, stats.generation);
            if stats.population == 0 {
                console_error!("Critical: No agents available for step execution - attempting recovery");
                
                // 自動復旧を試みる
                if let Err(recovery_err) = self.simulation_use_case.reset() {
                    console_error!("Failed to reset simulation during recovery: {}", recovery_err);
                }
                
                let error_obj = js_sys::Object::new();
                js_sys::Reflect::set(
                    &error_obj,
                    &JsValue::from_str("message"),
                    &JsValue::from_str("Population reached zero. Simulation reset attempted."),
                ).unwrap();
                js_sys::Reflect::set(
                    &error_obj,
                    &JsValue::from_str("type"),
                    &JsValue::from_str("PopulationExtinctionError"),
                ).unwrap();
                js_sys::Reflect::set(
                    &error_obj,
                    &JsValue::from_str("generation"),
                    &JsValue::from_f64(stats.generation as f64),
                ).unwrap();
                return Err(error_obj.into());
            }
        } else {
            console_error!("Failed to get simulation stats before step execution");
            let error_obj = js_sys::Object::new();
            js_sys::Reflect::set(
                &error_obj,
                &JsValue::from_str("message"),
                &JsValue::from_str("Unable to verify simulation state before step"),
            ).unwrap();
            js_sys::Reflect::set(
                &error_obj,
                &JsValue::from_str("type"),
                &JsValue::from_str("SimulationStateError"),
            ).unwrap();
            return Err(error_obj.into());
        }
        
        // 実際のステップ実行をtry-catchで包む
        let result = match self.simulation_use_case.step() {
            Ok(result) => result,
            Err(e) => {
                console_error!("Step execution failed: {}", e);
                let error_obj = js_sys::Object::new();
                js_sys::Reflect::set(
                    &error_obj,
                    &JsValue::from_str("message"),
                    &JsValue::from_str(&format!("Step execution failed: {}", e)),
                ).unwrap();
                js_sys::Reflect::set(
                    &error_obj,
                    &JsValue::from_str("type"),
                    &JsValue::from_str("StepExecutionError"),
                ).unwrap();
                return Err(error_obj.into());
            }
        };
        
        // ステップ実行後の結果をログ出力と安全性チェック
        console_log!("Step result: population: {}, generation: {}", result.population, result.generation);
        
        // ステップ後に人口が0になった場合の警告
        if result.population == 0 {
            console_error!("Warning: Population became zero after step execution at generation {}", result.generation);
        }
        
        let json_result = serde_json::to_string(&result)
            .map_err(|e| JsValue::from_str(&format!("JSON serialization error: {}", e)))?;
        Ok(JsValue::from_str(&json_result))
    }

    /// 1世代実行
    #[wasm_bindgen]
    pub fn run_generation(&mut self) -> Result<JsValue, JsValue> {
        // 世代実行前にシミュレーションが終了していないかチェック
        if let Ok(is_finished) = self.simulation_use_case.is_finished() {
            if is_finished {
                console_log!("Simulation has finished, cannot run generation");
                let error_obj = js_sys::Object::new();
                js_sys::Reflect::set(
                    &error_obj,
                    &JsValue::from_str("message"),
                    &JsValue::from_str("Simulation has finished"),
                ).unwrap();
                js_sys::Reflect::set(
                    &error_obj,
                    &JsValue::from_str("type"),
                    &JsValue::from_str("SimulationFinished"),
                ).unwrap();
                return Err(error_obj.into());
            }
        }
        
        // 世代実行前にエージェント数をチェック（強化版）
        if let Ok(stats) = self.simulation_use_case.get_current_stats() {
            console_log!("Generation execution - population: {}, generation: {}", stats.population, stats.generation);
            if stats.population == 0 {
                console_error!("Critical: No agents available for generation execution - attempting recovery");
                
                // 自動復旧を試みる
                if let Err(recovery_err) = self.simulation_use_case.reset() {
                    console_error!("Failed to reset simulation during recovery: {}", recovery_err);
                }
                
                let error_obj = js_sys::Object::new();
                js_sys::Reflect::set(
                    &error_obj,
                    &JsValue::from_str("message"),
                    &JsValue::from_str("Population reached zero. Simulation reset attempted."),
                ).unwrap();
                js_sys::Reflect::set(
                    &error_obj,
                    &JsValue::from_str("type"),
                    &JsValue::from_str("PopulationExtinctionError"),
                ).unwrap();
                js_sys::Reflect::set(
                    &error_obj,
                    &JsValue::from_str("generation"),
                    &JsValue::from_f64(stats.generation as f64),
                ).unwrap();
                return Err(error_obj.into());
            }
        } else {
            console_error!("Failed to get simulation stats before generation execution");
            let error_obj = js_sys::Object::new();
            js_sys::Reflect::set(
                &error_obj,
                &JsValue::from_str("message"),
                &JsValue::from_str("Unable to verify simulation state before generation"),
            ).unwrap();
            js_sys::Reflect::set(
                &error_obj,
                &JsValue::from_str("type"),
                &JsValue::from_str("SimulationStateError"),
            ).unwrap();
            return Err(error_obj.into());
        }
        
        // 実際の世代実行をtry-catchで包む
        let result = match self.simulation_use_case.run_generation() {
            Ok(result) => result,
            Err(e) => {
                console_error!("Generation execution failed: {}", e);
                let error_obj = js_sys::Object::new();
                js_sys::Reflect::set(
                    &error_obj,
                    &JsValue::from_str("message"),
                    &JsValue::from_str(&format!("Generation execution failed: {}", e)),
                ).unwrap();
                js_sys::Reflect::set(
                    &error_obj,
                    &JsValue::from_str("type"),
                    &JsValue::from_str("GenerationExecutionError"),
                ).unwrap();
                return Err(error_obj.into());
            }
        };
        
        // 世代実行後の結果をログ出力と安全性チェック
        console_log!("Generation result: population: {}, generation: {}", result.population, result.generation);
        
        // 世代後に人口が0になった場合の警告
        if result.population == 0 {
            console_error!("Warning: Population became zero after generation {} execution", result.generation);
        }
        
        let json_result = serde_json::to_string(&result)
            .map_err(|e| JsValue::from_str(&format!("JSON serialization error: {}", e)))?;
        Ok(JsValue::from_str(&json_result))
    }

    /// 現在の統計を取得
    #[wasm_bindgen]
    pub fn get_current_stats(&self) -> Result<JsValue, JsValue> {
        // シミュレーションが初期化されていない場合の安全チェック
        if let Err(e) = self.simulation_use_case.get_current_stats() {
            console_error!("get_current_stats error: {}", e);
            
            // カスタムエラーオブジェクトを返す
            let error_obj = js_sys::Object::new();
            js_sys::Reflect::set(
                &error_obj,
                &JsValue::from_str("message"),
                &JsValue::from_str(&format!("Failed to get current stats: {}", e)),
            ).unwrap();
            js_sys::Reflect::set(
                &error_obj,
                &JsValue::from_str("type"),
                &JsValue::from_str("StatsError"),
            ).unwrap();
            
            return Err(error_obj.into());
        }
        
        let result = handle_result(self.simulation_use_case.get_current_stats())?;
        
        let json_result = serde_json::to_string(&result)
            .map_err(|e| JsValue::from_str(&format!("JSON serialization error: {}", e)))?;
        Ok(JsValue::from_str(&json_result))
    }

    /// 現在のエージェント情報を取得
    #[wasm_bindgen]
    pub fn get_current_agents(&self) -> Result<JsValue, JsValue> {
        // シミュレーションが初期化されていない場合の安全チェック
        let agents_map = match self.simulation_use_case.get_current_agents() {
            Ok(agents) => agents,
            Err(e) => {
                console_error!("get_current_agents error: {}", e);
                
                // カスタムエラーオブジェクトを返す
                let error_obj = js_sys::Object::new();
                js_sys::Reflect::set(
                    &error_obj,
                    &JsValue::from_str("message"),
                    &JsValue::from_str(&format!("Failed to get current agents: {}", e)),
                ).unwrap();
                js_sys::Reflect::set(
                    &error_obj,
                    &JsValue::from_str("type"),
                    &JsValue::from_str("AgentsError"),
                ).unwrap();
                
                return Err(error_obj.into());
            }
        };
        
        // エージェントが0の場合は空の配列を返す
        if agents_map.is_empty() {
            console_log!("No agents found, returning empty array");
            let empty_vec: Vec<serde_json::Value> = Vec::new();
            let json_result = serde_json::to_string(&empty_vec)
                .map_err(|e| JsValue::from_str(&format!("JSON serialization error: {}", e)))?;
            return Ok(JsValue::from_str(&json_result));
        }
        
        // HashMapをVecに変換してフロントエンドで使いやすくする
        // 安全にエージェントデータを変換
        let agents_vec: Vec<serde_json::Value> = agents_map
            .values()
            .map(|agent| {
                serde_json::json!({
                    "id": agent.id().value(),
                    "x": agent.position().x,
                    "y": agent.position().y,
                    "cooperation_tendency": agent.traits().cooperation_tendency(),
                    "aggression_level": agent.traits().aggression_level(),
                    "learning_ability": agent.traits().learning_ability(),
                    "movement_tendency": agent.traits().movement_tendency(),
                    "score": agent.state().score(),
                    "age": agent.state().age(),
                    "battles_fought": agent.state().battles_fought(),
                    "fitness": agent.fitness()
                })
            })
            .collect();
        
        let json_result = serde_json::to_string(&agents_vec)
            .map_err(|e| JsValue::from_str(&format!("JSON serialization error: {}", e)))?;
        Ok(JsValue::from_str(&json_result))
    }

    /// 指定位置のエージェントを取得
    #[wasm_bindgen]
    pub fn get_agent_at(&self, x: u32, y: u32) -> Result<JsValue, JsValue> {
        let position = Position::new(x, y);
        let result = handle_result(self.simulation_use_case.get_agent_at(position))?;
        
        let json_result = serde_json::to_string(&result)
            .map_err(|e| JsValue::from_str(&format!("JSON serialization error: {}", e)))?;
        Ok(JsValue::from_str(&json_result))
    }

    /// シミュレーションが完了しているかチェック
    #[wasm_bindgen]
    pub fn is_finished(&self) -> Result<bool, JsValue> {
        handle_result(self.simulation_use_case.is_finished())
    }

    /// シミュレーションをリセット
    #[wasm_bindgen]
    pub fn reset(&mut self) -> Result<JsValue, JsValue> {
        match self.simulation_use_case.reset() {
            Ok(()) => {
                console_log!("Simulation reset successfully");
                Ok(JsValue::from_str("Reset successful"))
            },
            Err(e) => {
                console_error!("Failed to reset simulation: {}", e);
                let error_obj = js_sys::Object::new();
                js_sys::Reflect::set(
                    &error_obj,
                    &JsValue::from_str("message"),
                    &JsValue::from_str(&format!("Reset failed: {}", e)),
                ).unwrap();
                js_sys::Reflect::set(
                    &error_obj,
                    &JsValue::from_str("type"),
                    &JsValue::from_str("ResetError"),
                ).unwrap();
                Err(error_obj.into())
            }
        }
    }
}

/// WebAssembly用の戦闘マネージャー
#[wasm_bindgen]
pub struct WasmBattleManager {
    battle_use_case: BattleUseCase,
}

#[wasm_bindgen]
impl WasmBattleManager {
    #[wasm_bindgen(constructor)]
    pub fn new() -> Self {
        Self {
            battle_use_case: BattleUseCase::new(),
        }
    }

    /// カスタム利得マトリクスで戦闘マネージャーを作成
    #[wasm_bindgen]
    pub fn with_payoff_matrix(
        mutual_cooperation: f64,
        mutual_defection: f64,
        cooperation_exploited: f64,
        defection_advantage: f64,
    ) -> Self {
        let matrix = PayoffMatrix::new(
            mutual_cooperation,
            mutual_defection,
            cooperation_exploited,
            defection_advantage,
        );
        Self {
            battle_use_case: BattleUseCase::with_payoff_matrix(matrix),
        }
    }

    /// 戦闘を実行
    #[wasm_bindgen]
    pub fn execute_battle(&mut self, agent1_id: u64, agent2_id: u64, agents_json: &str) -> Result<JsValue, JsValue> {
        let agents: HashMap<AgentId, Agent> = serde_json::from_str(agents_json)
            .map_err(|e| JsValue::from_str(&format!("JSON parse error: {}", e)))?;

        let command = ExecuteBattleCommand {
            agent1_id: AgentId::new(agent1_id),
            agent2_id: AgentId::new(agent2_id),
        };

        let result = handle_result(self.battle_use_case.execute_battle(command, &agents))?;
        
        let json_result = serde_json::to_string(&result)
            .map_err(|e| JsValue::from_str(&format!("JSON serialization error: {}", e)))?;
        Ok(JsValue::from_str(&json_result))
    }

    /// 戦闘履歴を取得
    #[wasm_bindgen]
    pub fn get_battle_history(&self, agent_id: u64, opponent_id: Option<u64>, limit: Option<usize>) -> Result<JsValue, JsValue> {
        let query = crate::application::BattleHistoryQuery {
            agent_id: AgentId::new(agent_id),
            opponent_id: opponent_id.map(AgentId::new),
            limit,
        };

        let result = handle_result(self.battle_use_case.get_battle_history(query))?;
        
        let json_result = serde_json::to_string(&result)
            .map_err(|e| JsValue::from_str(&format!("JSON serialization error: {}", e)))?;
        Ok(JsValue::from_str(&json_result))
    }

    /// 現在のラウンドを取得
    #[wasm_bindgen]
    pub fn current_round(&self) -> u32 {
        self.battle_use_case.current_round()
    }

    /// ラウンドを進める
    #[wasm_bindgen]
    pub fn advance_round(&mut self) {
        self.battle_use_case.advance_round();
    }

    /// 履歴をクリア
    #[wasm_bindgen]
    pub fn clear_history(&mut self) {
        self.battle_use_case.clear_history();
    }
}

/// エージェントの協力決定をテストする関数
#[wasm_bindgen]
pub fn test_agent_cooperation_decision(agent_json: &str, opponent_id: u64) -> Result<bool, JsValue> {
    let mut agent: Agent = serde_json::from_str(agent_json)
        .map_err(|e| JsValue::from_str(&format!("JSON parse error: {}", e)))?;
    
    let opponent_agent_id = AgentId::new(opponent_id);
    
    match agent.decides_to_cooperate_with(opponent_agent_id) {
        Ok(cooperation_decision) => Ok(cooperation_decision),
        Err(err_msg) => {
            // カスタムエラーメッセージとタイプを含むJavaScriptエラーを投げる
            let error_obj = js_sys::Object::new();
            js_sys::Reflect::set(
                &error_obj,
                &JsValue::from_str("message"),
                &JsValue::from_str(&err_msg),
            ).unwrap();
            js_sys::Reflect::set(
                &error_obj,
                &JsValue::from_str("type"),
                &JsValue::from_str("AgentCooperationError"),
            ).unwrap();
            js_sys::Reflect::set(
                &error_obj,
                &JsValue::from_str("agentId"),
                &JsValue::from_f64(agent.id().value() as f64),
            ).unwrap();
            
            Err(error_obj.into())
        }
    }
}

/// 安全なパーセンタイル計算をテストする関数
#[wasm_bindgen]
pub fn test_safe_percentile_calculation(values_json: &str, percentile: f64) -> Result<f64, JsValue> {
    
    let values: Vec<f64> = serde_json::from_str(values_json)
        .map_err(|e| JsValue::from_str(&format!("JSON parse error: {}", e)))?;
    
    if values.is_empty() {
        let error_obj = js_sys::Object::new();
        js_sys::Reflect::set(
            &error_obj,
            &JsValue::from_str("message"),
            &JsValue::from_str("Cannot calculate percentile on empty data"),
        ).unwrap();
        js_sys::Reflect::set(
            &error_obj,
            &JsValue::from_str("type"),
            &JsValue::from_str("EmptyDataError"),
        ).unwrap();
        return Err(error_obj.into());
    }
    
    if !(0.0..=1.0).contains(&percentile) {
        let error_obj = js_sys::Object::new();
        js_sys::Reflect::set(
            &error_obj,
            &JsValue::from_str("message"),
            &JsValue::from_str(&format!("Percentile {} out of range [0.0, 1.0]", percentile)),
        ).unwrap();
        js_sys::Reflect::set(
            &error_obj,
            &JsValue::from_str("type"),
            &JsValue::from_str("InvalidPercentileError"),
        ).unwrap();
        js_sys::Reflect::set(
            &error_obj,
            &JsValue::from_str("percentile"),
            &JsValue::from_f64(percentile),
        ).unwrap();
        return Err(error_obj.into());
    }
    
    let mut sorted_values = values;
    sorted_values.sort_by(|a, b| a.partial_cmp(b).unwrap_or(std::cmp::Ordering::Equal));
    
    // 簡単なパーセンタイル計算
    let result = match percentile {
        p if (p - 0.25).abs() < f64::EPSILON => {
            let index = (sorted_values.len() as f64 - 1.0) * 0.25;
            let lower = index.floor() as usize;
            if lower < sorted_values.len() { sorted_values[lower] } else { 0.0 }
        },
        p if (p - 0.5).abs() < f64::EPSILON => {
            let index = (sorted_values.len() as f64 - 1.0) * 0.5;
            let lower = index.floor() as usize;
            if lower < sorted_values.len() { sorted_values[lower] } else { 0.0 }
        },
        p if (p - 0.75).abs() < f64::EPSILON => {
            let index = (sorted_values.len() as f64 - 1.0) * 0.75;
            let lower = index.floor() as usize;
            if lower < sorted_values.len() { sorted_values[lower] } else { 0.0 }
        },
        _ => {
            // カスタムパーセンタイル計算
            let index = (sorted_values.len() as f64 - 1.0) * percentile;
            let lower = index.floor() as usize;
            let upper = index.ceil() as usize;
            
            if lower >= sorted_values.len() || upper >= sorted_values.len() {
                let error_obj = js_sys::Object::new();
                js_sys::Reflect::set(
                    &error_obj,
                    &JsValue::from_str("message"),
                    &JsValue::from_str(&format!("Index out of bounds in percentile calculation: lower={}, upper={}, length={}", lower, upper, sorted_values.len())),
                ).unwrap();
                js_sys::Reflect::set(
                    &error_obj,
                    &JsValue::from_str("type"),
                    &JsValue::from_str("IndexOutOfBoundsError"),
                ).unwrap();
                return Err(error_obj.into());
            }
            
            if lower == upper {
                sorted_values[lower]
            } else {
                let weight = index - index.floor();
                sorted_values[lower] * (1.0 - weight) + sorted_values[upper] * weight
            }
        }
    };
    
    Ok(result)
}

/// 安全な島モデル進化をテストする関数
#[wasm_bindgen]
pub fn test_safe_island_evolution(agents_json: &str, num_islands: usize) -> Result<JsValue, JsValue> {
    
    let agents: Vec<Agent> = serde_json::from_str(agents_json)
        .map_err(|e| JsValue::from_str(&format!("JSON parse error: {}", e)))?;
    
    if agents.is_empty() {
        let error_obj = js_sys::Object::new();
        js_sys::Reflect::set(
            &error_obj,
            &JsValue::from_str("message"),
            &JsValue::from_str("Cannot perform island evolution with empty agent population"),
        ).unwrap();
        js_sys::Reflect::set(
            &error_obj,
            &JsValue::from_str("type"),
            &JsValue::from_str("EmptyPopulationError"),
        ).unwrap();
        return Err(error_obj.into());
    }
    
    if num_islands == 0 {
        let error_obj = js_sys::Object::new();
        js_sys::Reflect::set(
            &error_obj,
            &JsValue::from_str("message"),
            &JsValue::from_str("Number of islands must be greater than 0"),
        ).unwrap();
        js_sys::Reflect::set(
            &error_obj,
            &JsValue::from_str("type"),
            &JsValue::from_str("InvalidIslandCountError"),
        ).unwrap();
        js_sys::Reflect::set(
            &error_obj,
            &JsValue::from_str("numIslands"),
            &JsValue::from_f64(num_islands as f64),
        ).unwrap();
        return Err(error_obj.into());
    }
    
    // 島に人口を分割（安全版の模倣）
    let island_size = agents.len() / num_islands;
    let mut island_populations = Vec::new();
    
    for i in 0..num_islands {
        let start = i * island_size;
        let end = if i == num_islands - 1 {
            agents.len()
        } else {
            (i + 1) * island_size
        };
        
        if start >= agents.len() || end > agents.len() || start > end {
            let error_obj = js_sys::Object::new();
            js_sys::Reflect::set(
                &error_obj,
                &JsValue::from_str("message"),
                &JsValue::from_str(&format!("Invalid slice range [{}..{}] for agents length {}", start, end, agents.len())),
            ).unwrap();
            js_sys::Reflect::set(
                &error_obj,
                &JsValue::from_str("type"),
                &JsValue::from_str("IndexOutOfBoundsError"),
            ).unwrap();
            js_sys::Reflect::set(
                &error_obj,
                &JsValue::from_str("start"),
                &JsValue::from_f64(start as f64),
            ).unwrap();
            js_sys::Reflect::set(
                &error_obj,
                &JsValue::from_str("end"),
                &JsValue::from_f64(end as f64),
            ).unwrap();
            js_sys::Reflect::set(
                &error_obj,
                &JsValue::from_str("length"),
                &JsValue::from_f64(agents.len() as f64),
            ).unwrap();
            return Err(error_obj.into());
        }
        
        island_populations.push(agents[start..end].to_vec());
    }
    
    // 結果をJSONとして返す
    let result = serde_json::json!({
        "success": true,
        "numIslands": num_islands,
        "islandSizes": island_populations.iter().map(|pop| pop.len()).collect::<Vec<_>>(),
        "totalAgents": agents.len(),
        "message": "Island division completed successfully"
    });
    
    Ok(JsValue::from_str(&result.to_string()))
}

// ========================================
// ユーティリティ関数
// ========================================

/// 標準的なシミュレーション設定を作成
#[wasm_bindgen]
pub fn create_standard_config() -> WasmSimulationConfig {
    WasmSimulationConfig::new(
        50, 50,           // world size
        100,              // initial population
        1000,             // max generations
        100,              // battles per generation
        2,                // neighbor radius
        0.1,              // mutation rate
        0.05,             // mutation strength
        0.1,              // elite ratio
        "Tournament".to_string(),
        "Uniform".to_string(),
    )
}

/// パニックフックを設定
#[wasm_bindgen(start)]
pub fn main() {
    // console_error_panic_hook::set_once(); // 依存関係不足のためコメントアウト
}

#[cfg(all(test, target_arch = "wasm32"))]
mod tests {
    use super::*;

    #[test]
    fn test_wasm_simulation_config_creation() {
        let config = WasmSimulationConfig::new(
            10, 10, 20, 100, 50, 1,
            0.1, 0.05, 0.2,
            "Tournament".to_string(),
            "Uniform".to_string(),
        );

        assert_eq!(config.world_width(), 10);
        assert_eq!(config.world_height(), 10);
        assert_eq!(config.initial_population(), 20);
    }

    #[test]
    fn test_wasm_simulation_config_to_domain() {
        let config = WasmSimulationConfig::new(
            5, 5, 10, 50, 25, 1,
            0.1, 0.05, 0.1,
            "Tournament".to_string(),
            "Uniform".to_string(),
        );

        let domain_config = config.to_domain_config().unwrap();
        assert_eq!(domain_config.initial_population, 10);
        assert_eq!(domain_config.max_generations, 50);
    }

    #[test]
    fn test_wasm_simulation_manager_creation() {
        let _manager = WasmSimulationManager::new();
        // 作成に成功することを確認
    }

    #[test]
    fn test_wasm_battle_manager_creation() {
        let manager = WasmBattleManager::new();
        assert_eq!(manager.current_round(), 0);
    }

    #[test]
    fn test_wasm_battle_manager_with_custom_matrix() {
        let manager = WasmBattleManager::with_payoff_matrix(2.0, 0.5, -1.0, 4.0);
        assert_eq!(manager.current_round(), 0);
    }

    #[test]
    fn test_standard_config_creation() {
        let config = create_standard_config();
        assert_eq!(config.world_width(), 50);
        assert_eq!(config.world_height(), 50);
        assert_eq!(config.initial_population(), 100);
    }

    #[test]
    fn test_invalid_selection_method() {
        let config = WasmSimulationConfig::new(
            5, 5, 10, 50, 25, 1,
            0.1, 0.05, 0.1,
            "InvalidMethod".to_string(),
            "Uniform".to_string(),
        );

        assert!(config.to_domain_config().is_err());
    }

    #[test]
    fn test_invalid_crossover_method() {
        let config = WasmSimulationConfig::new(
            5, 5, 10, 50, 25, 1,
            0.1, 0.05, 0.1,
            "Tournament".to_string(),
            "InvalidMethod".to_string(),
        );

        assert!(config.to_domain_config().is_err());
    }
}