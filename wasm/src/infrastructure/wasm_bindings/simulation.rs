use crate::application::simulation::SimulationService;
use super::{WasmAgent, WasmStatistics};
use wasm_bindgen::prelude::*;

#[wasm_bindgen]
pub struct WasmSimulation {
    service: SimulationService,
}

#[wasm_bindgen]
impl WasmSimulation {
    #[wasm_bindgen(constructor)]
    pub fn new(width: usize, height: usize, agent_count: usize) -> Result<WasmSimulation, JsValue> {
        let service = SimulationService::new(width, height, agent_count)
            .map_err(|e| JsValue::from_str(&e))?;
        
        Ok(WasmSimulation { service })
    }

    #[wasm_bindgen]
    pub fn step(&mut self) -> WasmStatistics {
        let stats = self.service.step();
        WasmStatistics::from(&stats)
    }

    #[wasm_bindgen]
    pub fn get_agents(&self) -> Vec<WasmAgent> {
        self.service
            .get_agents()
            .iter()
            .map(WasmAgent::from)
            .collect()
    }

    #[wasm_bindgen]
    pub fn get_statistics(&self) -> WasmStatistics {
        let stats = self.service.get_statistics();
        WasmStatistics::from(&stats)
    }

    #[wasm_bindgen]
    pub fn get_grid_width(&self) -> usize {
        self.service.get_grid_size().0
    }

    #[wasm_bindgen]
    pub fn get_grid_height(&self) -> usize {
        self.service.get_grid_size().1
    }

    #[wasm_bindgen]
    pub fn get_generation(&self) -> u32 {
        self.service.get_generation()
    }

    #[wasm_bindgen]
    pub fn get_turn(&self) -> u32 {
        self.service.get_turn()
    }

    #[wasm_bindgen]
    pub fn reset(&mut self, agent_count: usize) -> Result<(), JsValue> {
        self.service
            .reset(agent_count)
            .map_err(|e| JsValue::from_str(&e))
    }
}