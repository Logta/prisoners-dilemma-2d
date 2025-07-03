use crate::{replace_generation, CrossoverMethod, Grid, PayoffMatrix, SelectionMethod};
use rand::Rng;
use serde::{Deserialize, Serialize};
use std::panic;
use wasm_bindgen::prelude::*;

// ========================================
// ロギングユーティリティ
// ========================================
#[wasm_bindgen]
extern "C" {
    #[wasm_bindgen(js_namespace = console)]
    fn log(s: &str);

    #[wasm_bindgen(js_namespace = console)]
    fn error(s: &str);

    #[wasm_bindgen(js_namespace = console)]
    fn warn(s: &str);
}

#[macro_export]
macro_rules! console_log {
    ($($t:tt)*) => (log(&format_args!($($t)*).to_string()))
}

#[macro_export]
macro_rules! console_error {
    ($($t:tt)*) => (error(&format_args!($($t)*).to_string()))
}

#[macro_export]
macro_rules! console_warn {
    ($($t:tt)*) => (warn(&format_args!($($t)*).to_string()))
}

// ========================================
// エラー型定義
// ========================================
#[derive(Debug, Serialize, Deserialize)]
pub struct SimulationError {
    pub code: String,
    pub message: String,
}

impl SimulationError {
    fn new(code: &str, message: &str) -> Self {
        Self {
            code: code.to_string(),
            message: message.to_string(),
        }
    }
}

// ========================================
// シミュレーション設定
// ========================================
#[derive(Debug, Clone, Serialize, Deserialize)]
pub struct SimulationConfig {
    pub battle_radius: usize,
    pub selection_method: String,
    pub selection_param: f64,
    pub crossover_method: String,
    pub crossover_param: f64,
    pub mutation_rate: f64,
    pub mutation_strength: f64,
}

impl Default for SimulationConfig {
    fn default() -> Self {
        Self {
            battle_radius: 2,
            selection_method: "top_percent".to_string(),
            selection_param: 0.5,
            crossover_method: "one_point".to_string(),
            crossover_param: 0.5,
            mutation_rate: 0.1,
            mutation_strength: 0.05,
        }
    }
}

// ========================================
// エージェントデータ（JS向け）
// ========================================
#[derive(Serialize, Deserialize)]
pub struct AgentData {
    pub x: f64,
    pub y: f64,
    pub cooperation_rate: f64,
    pub movement_rate: f64,
    pub score: f64,
}

// ========================================
// 統計データ（JS向け）
// ========================================
#[derive(Serialize, Deserialize)]
pub struct Statistics {
    pub generation: u32,
    pub population: usize,
    pub avg_cooperation: f64,
    pub avg_movement: f64,
    pub avg_score: f64,
    pub min_cooperation: f64,
    pub max_cooperation: f64,
    pub std_cooperation: f64,
}

// ========================================
// メインのシミュレーションエンジン
// ========================================
#[wasm_bindgen]
pub struct SimulationEngine {
    grid: Grid,
    payoff_matrix: PayoffMatrix,
    generation: u32,
    config: SimulationConfig,
}

#[wasm_bindgen]
impl SimulationEngine {
    #[wasm_bindgen(constructor)]
    pub fn new(width: usize, height: usize) -> Result<SimulationEngine, JsValue> {
        // パニックハンドラーを設定
        panic::set_hook(Box::new(|info| {
            console_error!("Panic occurred: {:?}", info);
        }));

        // 入力検証
        if width == 0 || height == 0 {
            return Err(JsValue::from_str(
                "Grid dimensions must be greater than zero",
            ));
        }

        if width > 2000 || height > 2000 {
            return Err(JsValue::from_str(
                "Grid dimensions are too large (max: 2000x2000)",
            ));
        }

        Ok(SimulationEngine {
            grid: Grid::new(width, height),
            payoff_matrix: PayoffMatrix::default(),
            generation: 0,
            config: SimulationConfig::default(),
        })
    }

    // ========================================
    // エージェント管理
    // ========================================

    #[wasm_bindgen]
    pub fn populate_agents(&mut self, density: f64) -> Result<(), JsValue> {
        if density < 0.0 || density > 1.0 {
            return Err(JsValue::from_str("Density must be between 0.0 and 1.0"));
        }

        self.grid.populate_agents(density);
        console_log!(
            "Populated {} agents (density: {:.2}%)",
            self.grid.agents.len(),
            density * 100.0
        );
        Ok(())
    }

    // ========================================
    // シミュレーション実行
    // ========================================

    #[wasm_bindgen]
    pub fn run_generation(&mut self, battle_radius: usize) -> Result<u32, JsValue> {
        if self.grid.agents.is_empty() {
            console_warn!("No agents in the simulation");
            return Ok(self.generation);
        }

        // バトル実行（並列化可能な構造に変更）
        self.execute_all_battles(battle_radius)?;

        // エージェント移動
        self.grid.move_agents();

        self.generation += 1;
        Ok(self.generation)
    }

    #[wasm_bindgen]
    pub fn run_generations(&mut self, count: u32, battle_radius: usize) -> Result<u32, JsValue> {
        for _ in 0..count {
            self.run_generation(battle_radius)?;
        }
        Ok(self.generation)
    }

    // ========================================
    // 進化処理
    // ========================================

    #[wasm_bindgen]
    pub fn evolve_population_with_config(&mut self, config_json: &str) -> Result<(), JsValue> {
        let config: SimulationConfig = serde_json::from_str(config_json)
            .map_err(|e| JsValue::from_str(&format!("Invalid config: {}", e)))?;

        self.config = config.clone();
        self.evolve_population_internal()?;
        Ok(())
    }

    #[wasm_bindgen]
    pub fn evolve_population(
        &mut self,
        selection_method: &str,
        selection_param: f64,
        crossover_method: &str,
        crossover_param: f64,
        mutation_rate: f64,
        mutation_strength: f64,
    ) -> Result<(), JsValue> {
        self.config = SimulationConfig {
            battle_radius: self.config.battle_radius,
            selection_method: selection_method.to_string(),
            selection_param,
            crossover_method: crossover_method.to_string(),
            crossover_param,
            mutation_rate,
            mutation_strength,
        };

        self.evolve_population_internal()
    }

    // ========================================
    // データ取得（最適化版）
    // ========================================

    #[wasm_bindgen]
    pub fn get_agent_data_json(&self) -> String {
        let agent_data: Vec<AgentData> = self
            .grid
            .agents
            .iter()
            .map(|agent| AgentData {
                x: agent.x as f64,
                y: agent.y as f64,
                cooperation_rate: agent.cooperation_rate,
                movement_rate: agent.movement_rate,
                score: agent.score,
            })
            .collect();

        serde_json::to_string(&agent_data).unwrap_or_else(|_| "[]".to_string())
    }

    #[wasm_bindgen]
    pub fn get_agent_data(&self) -> js_sys::Array {
        let result = js_sys::Array::new();

        for agent in &self.grid.agents {
            let agent_obj = js_sys::Object::new();

            // バッチ設定で効率化
            let _ = js_sys::Reflect::set(&agent_obj, &"x".into(), &(agent.x as f64).into());
            let _ = js_sys::Reflect::set(&agent_obj, &"y".into(), &(agent.y as f64).into());
            let _ = js_sys::Reflect::set(
                &agent_obj,
                &"cooperation_rate".into(),
                &agent.cooperation_rate.into(),
            );
            let _ = js_sys::Reflect::set(
                &agent_obj,
                &"movement_rate".into(),
                &agent.movement_rate.into(),
            );
            let _ = js_sys::Reflect::set(&agent_obj, &"score".into(), &agent.score.into());

            result.push(&agent_obj);
        }

        result
    }

    #[wasm_bindgen]
    pub fn get_statistics_json(&self) -> String {
        let stats = self.calculate_statistics();
        serde_json::to_string(&stats).unwrap_or_else(|_| "{}".to_string())
    }

    #[wasm_bindgen]
    pub fn get_statistics(&self) -> js_sys::Object {
        let stats_obj = js_sys::Object::new();
        let stats = self.calculate_statistics();

        let _ = js_sys::Reflect::set(
            &stats_obj,
            &"generation".into(),
            &(stats.generation as f64).into(),
        );
        let _ = js_sys::Reflect::set(
            &stats_obj,
            &"population".into(),
            &(stats.population as f64).into(),
        );
        let _ = js_sys::Reflect::set(
            &stats_obj,
            &"avg_cooperation".into(),
            &stats.avg_cooperation.into(),
        );
        let _ = js_sys::Reflect::set(
            &stats_obj,
            &"avg_movement".into(),
            &stats.avg_movement.into(),
        );
        let _ = js_sys::Reflect::set(&stats_obj, &"avg_score".into(), &stats.avg_score.into());
        let _ = js_sys::Reflect::set(
            &stats_obj,
            &"min_cooperation".into(),
            &stats.min_cooperation.into(),
        );
        let _ = js_sys::Reflect::set(
            &stats_obj,
            &"max_cooperation".into(),
            &stats.max_cooperation.into(),
        );
        let _ = js_sys::Reflect::set(
            &stats_obj,
            &"std_cooperation".into(),
            &stats.std_cooperation.into(),
        );

        stats_obj
    }

    // ========================================
    // ユーティリティメソッド
    // ========================================

    #[wasm_bindgen]
    pub fn get_generation(&self) -> u32 {
        self.generation
    }

    #[wasm_bindgen]
    pub fn get_population_size(&self) -> usize {
        self.grid.agents.len()
    }

    #[wasm_bindgen]
    pub fn get_grid_dimensions(&self) -> js_sys::Object {
        let dims = js_sys::Object::new();
        let _ = js_sys::Reflect::set(&dims, &"width".into(), &(self.grid.width as f64).into());
        let _ = js_sys::Reflect::set(&dims, &"height".into(), &(self.grid.height as f64).into());
        dims
    }

    #[wasm_bindgen]
    pub fn reset(&mut self) {
        self.grid.agents.clear();
        self.generation = 0;
        console_log!("Simulation reset");
    }

    #[wasm_bindgen]
    pub fn set_payoff_matrix(&mut self, cc: f64, cd: f64, dc: f64, dd: f64) -> Result<(), JsValue> {
        if cc.is_nan() || cd.is_nan() || dc.is_nan() || dd.is_nan() {
            return Err(JsValue::from_str("Payoff values cannot be NaN"));
        }

        self.payoff_matrix = PayoffMatrix {
            both_cooperate: (cc, cc),
            cooperate_defect: (cd, dc),
            defect_cooperate: (dc, cd),
            both_defect: (dd, dd),
        };
        console_log!(
            "Payoff matrix updated: CC={}, CD={}, DC={}, DD={}",
            cc,
            cd,
            dc,
            dd
        );
        Ok(())
    }
}

// ========================================
// プライベート実装
// ========================================
impl SimulationEngine {
    fn execute_all_battles(&mut self, battle_radius: usize) -> Result<(), JsValue> {
        // スナップショット時点でのエージェント数を取得
        let agent_count = self.grid.agents.len();
        
        if agent_count == 0 {
            return Ok(());
        }

        // バトル実行（将来的に並列化可能）
        for i in 0..agent_count {
            // 毎回サイズをチェック（agents vectorが変更される可能性に対応）
            let current_size = self.grid.agents.len();
            if i >= current_size {
                console_error!("Agent index {} out of bounds (size: {}, original: {})", i, current_size, agent_count);
                return Err(JsValue::from_str(&format!("Agent index {} out of bounds", i)));
            }
            
            self.grid
                .execute_battles_for_agent(i, &self.payoff_matrix, battle_radius);
        }

        Ok(())
    }

    fn evolve_population_internal(&mut self) -> Result<(), JsValue> {
        if self.grid.agents.is_empty() {
            return Err(JsValue::from_str("No agents to evolve"));
        }

        // 選択方法のパース
        let selection = self.parse_selection_method()?;
        let crossover = self.parse_crossover_method()?;

        // 新世代の生成
        let new_generation = replace_generation(
            &self.grid.agents,
            &selection,
            &crossover,
            self.config.mutation_rate,
            self.config.mutation_strength,
        );

        if new_generation.is_empty() {
            return Err(JsValue::from_str(
                "Evolution failed - no new generation created",
            ));
        }

        // 新世代の配置
        self.place_new_generation(new_generation);

        console_log!(
            "Evolution completed: generation {} with {} agents",
            self.generation,
            self.grid.agents.len()
        );
        Ok(())
    }

    fn parse_selection_method(&self) -> Result<SelectionMethod, JsValue> {
        match self.config.selection_method.as_str() {
            "top_percent" => Ok(SelectionMethod::TopPercent(self.config.selection_param)),
            "tournament" => Ok(SelectionMethod::Tournament(
                self.config.selection_param as usize,
            )),
            "roulette_wheel" => Ok(SelectionMethod::RouletteWheel),
            _ => Err(JsValue::from_str(&format!(
                "Unknown selection method: {}",
                self.config.selection_method
            ))),
        }
    }

    fn parse_crossover_method(&self) -> Result<CrossoverMethod, JsValue> {
        match self.config.crossover_method.as_str() {
            "one_point" => Ok(CrossoverMethod::OnePoint),
            "two_point" => Ok(CrossoverMethod::TwoPoint),
            "uniform" => Ok(CrossoverMethod::Uniform(self.config.crossover_param)),
            _ => Err(JsValue::from_str(&format!(
                "Unknown crossover method: {}",
                self.config.crossover_method
            ))),
        }
    }

    fn place_new_generation(&mut self, new_generation: Vec<crate::Agent>) {
        self.grid.agents.clear();
        let mut rng = rand::thread_rng();

        for mut agent in new_generation {
            agent.x = rng.gen_range(0..self.grid.width);
            agent.y = rng.gen_range(0..self.grid.height);
            agent.score = 0.0;
            self.grid.add_agent(agent);
        }
    }

    fn calculate_statistics(&self) -> Statistics {
        if self.grid.agents.is_empty() {
            return Statistics {
                generation: self.generation,
                population: 0,
                avg_cooperation: 0.0,
                avg_movement: 0.0,
                avg_score: 0.0,
                min_cooperation: 0.0,
                max_cooperation: 0.0,
                std_cooperation: 0.0,
            };
        }

        let total_agents = self.grid.agents.len() as f64;

        // 基本統計
        let cooperation_rates: Vec<f64> = self
            .grid
            .agents
            .iter()
            .map(|a| a.cooperation_rate)
            .collect();

        let avg_cooperation = cooperation_rates.iter().sum::<f64>() / total_agents;
        let avg_movement = self
            .grid
            .agents
            .iter()
            .map(|a| a.movement_rate)
            .sum::<f64>()
            / total_agents;
        let avg_score = self.grid.agents.iter().map(|a| a.score).sum::<f64>() / total_agents;

        // 最小・最大値
        let min_cooperation = cooperation_rates
            .iter()
            .min_by(|a, b| a.partial_cmp(b).unwrap())
            .copied()
            .unwrap_or(0.0);
        let max_cooperation = cooperation_rates
            .iter()
            .max_by(|a, b| a.partial_cmp(b).unwrap())
            .copied()
            .unwrap_or(0.0);

        // 標準偏差
        let variance = cooperation_rates
            .iter()
            .map(|&x| (x - avg_cooperation).powi(2))
            .sum::<f64>()
            / total_agents;
        let std_cooperation = variance.sqrt();

        Statistics {
            generation: self.generation,
            population: self.grid.agents.len(),
            avg_cooperation,
            avg_movement,
            avg_score,
            min_cooperation,
            max_cooperation,
            std_cooperation,
        }
    }
}
