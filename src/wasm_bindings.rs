use wasm_bindgen::prelude::*;
use crate::{Grid, PayoffMatrix, SelectionMethod, CrossoverMethod, replace_generation};

#[wasm_bindgen]
extern "C" {
    #[wasm_bindgen(js_namespace = console)]
    fn log(s: &str);
}

#[macro_export]
macro_rules! console_log {
    ($($t:tt)*) => (log(&format_args!($($t)*).to_string()))
}

#[wasm_bindgen]
pub struct SimulationEngine {
    grid: Grid,
    payoff_matrix: PayoffMatrix,
    generation: u32,
}

#[wasm_bindgen]
impl SimulationEngine {
    #[wasm_bindgen(constructor)]
    pub fn new(width: usize, height: usize) -> SimulationEngine {
        // console_log!("Creating simulation engine: {}x{}", width, height);
        
        SimulationEngine {
            grid: Grid::new(width, height),
            payoff_matrix: PayoffMatrix::default(),
            generation: 0,
        }
    }

    #[wasm_bindgen]
    pub fn populate_agents(&mut self, density: f64) {
        self.grid.populate_agents(density);
        // console_log!("Populated agents with density {}", density);
    }

    #[wasm_bindgen]
    pub fn run_generation(&mut self, battle_radius: usize) -> u32 {
        // 全エージェントで対戦実行
        for i in 0..self.grid.agents.len() {
            self.grid.execute_battles_for_agent(i, &self.payoff_matrix, battle_radius);
        }
        
        // エージェント移動
        self.grid.move_agents();
        
        self.generation += 1;
        console_log!("Completed generation {}", self.generation);
        self.generation
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
    ) {
        let selection = match selection_method {
            "top_percent" => SelectionMethod::TopPercent(selection_param),
            "tournament" => SelectionMethod::Tournament(selection_param as usize),
            _ => SelectionMethod::RouletteWheel,
        };

        let crossover = match crossover_method {
            "one_point" => CrossoverMethod::OnePoint,
            "two_point" => CrossoverMethod::TwoPoint,
            "uniform" => CrossoverMethod::Uniform(crossover_param),
            _ => CrossoverMethod::OnePoint,
        };

        let new_generation = replace_generation(
            &self.grid.agents,
            &selection,
            &crossover,
            mutation_rate,
            mutation_strength,
        );

        // グリッドをクリアして新世代を配置
        self.grid.agents.clear();
        for agent in new_generation {
            self.grid.add_agent(agent);
        }

        console_log!("Evolution completed for generation {}", self.generation);
    }

    #[wasm_bindgen]
    pub fn get_agent_data(&self) -> js_sys::Array {
        let result = js_sys::Array::new();
        
        for agent in &self.grid.agents {
            let agent_data = js_sys::Object::new();
            js_sys::Reflect::set(
                &agent_data,
                &"x".into(),
                &(agent.x as f64).into(),
            ).unwrap();
            js_sys::Reflect::set(
                &agent_data,
                &"y".into(),
                &(agent.y as f64).into(),
            ).unwrap();
            js_sys::Reflect::set(
                &agent_data,
                &"cooperation_rate".into(),
                &agent.cooperation_rate.into(),
            ).unwrap();
            js_sys::Reflect::set(
                &agent_data,
                &"movement_rate".into(),
                &agent.movement_rate.into(),
            ).unwrap();
            js_sys::Reflect::set(
                &agent_data,
                &"score".into(),
                &agent.score.into(),
            ).unwrap();
            
            result.push(&agent_data);
        }
        
        result
    }

    #[wasm_bindgen]
    pub fn get_statistics(&self) -> js_sys::Object {
        let stats = js_sys::Object::new();
        
        if self.grid.agents.is_empty() {
            return stats;
        }

        let total_agents = self.grid.agents.len() as f64;
        let avg_cooperation: f64 = self.grid.agents.iter()
            .map(|a| a.cooperation_rate)
            .sum::<f64>() / total_agents;
        let avg_movement: f64 = self.grid.agents.iter()
            .map(|a| a.movement_rate)
            .sum::<f64>() / total_agents;
        let avg_score: f64 = self.grid.agents.iter()
            .map(|a| a.score)
            .sum::<f64>() / total_agents;

        js_sys::Reflect::set(&stats, &"generation".into(), &(self.generation as f64).into()).unwrap();
        js_sys::Reflect::set(&stats, &"population".into(), &total_agents.into()).unwrap();
        js_sys::Reflect::set(&stats, &"avg_cooperation".into(), &avg_cooperation.into()).unwrap();
        js_sys::Reflect::set(&stats, &"avg_movement".into(), &avg_movement.into()).unwrap();
        js_sys::Reflect::set(&stats, &"avg_score".into(), &avg_score.into()).unwrap();

        stats
    }

    #[wasm_bindgen]
    pub fn get_generation(&self) -> u32 {
        self.generation
    }

    #[wasm_bindgen]
    pub fn reset(&mut self) {
        self.grid.agents.clear();
        self.generation = 0;
        console_log!("Simulation reset");
    }
}