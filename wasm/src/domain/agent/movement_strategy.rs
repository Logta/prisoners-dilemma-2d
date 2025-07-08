use rand::Rng;
use serde::{Deserialize, Serialize};
use wasm_bindgen::prelude::*;

#[wasm_bindgen]
#[derive(Debug, Clone, Copy, PartialEq, Serialize, Deserialize)]
pub enum MovementStrategy {
    Explorer,    // 高移動性：常に新しい場所を探索
    Settler,     // 低移動性：良い場所に定住
    Adaptive,    // 適応的：成績に応じて移動判定（現在の実装と同様）
    Opportunist, // 機会主義：隣接の協力率を見て移動
    Social,      // 社会的：同じ戦略の仲間に近づく
    Antisocial,  // 反社会的：異なる戦略から離れる
}

impl MovementStrategy {
    pub fn random() -> Self {
        let mut rng = rand::thread_rng();
        match rng.gen_range(0..6) {
            0 => MovementStrategy::Explorer,
            1 => MovementStrategy::Settler,
            2 => MovementStrategy::Adaptive,
            3 => MovementStrategy::Opportunist,
            4 => MovementStrategy::Social,
            _ => MovementStrategy::Antisocial,
        }
    }

    pub fn to_string(&self) -> String {
        match self {
            MovementStrategy::Explorer => "Explorer".to_string(),
            MovementStrategy::Settler => "Settler".to_string(),
            MovementStrategy::Adaptive => "Adaptive".to_string(),
            MovementStrategy::Opportunist => "Opportunist".to_string(),
            MovementStrategy::Social => "Social".to_string(),
            MovementStrategy::Antisocial => "Antisocial".to_string(),
        }
    }

    pub fn default_mobility(&self) -> f64 {
        match self {
            MovementStrategy::Explorer => 0.8,     // 高い基本移動性
            MovementStrategy::Settler => 0.2,      // 低い基本移動性
            MovementStrategy::Adaptive => 0.5,     // 中程度の基本移動性
            MovementStrategy::Opportunist => 0.4,  // やや低い基本移動性
            MovementStrategy::Social => 0.6,       // やや高い基本移動性
            MovementStrategy::Antisocial => 0.7,   // 高い基本移動性
        }
    }
}

// wasm_bindgen methods for MovementStrategy
#[wasm_bindgen]
pub fn movement_strategy_to_string(strategy: MovementStrategy) -> String {
    strategy.to_string()
}

#[wasm_bindgen]
pub fn movement_strategy_random() -> MovementStrategy {
    MovementStrategy::random()
}

#[wasm_bindgen]
pub fn movement_strategy_variant_count() -> u32 {
    6
}