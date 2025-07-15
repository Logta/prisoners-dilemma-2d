use rand::Rng;
use serde::{Deserialize, Serialize};
use std::fmt;
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

impl fmt::Display for MovementStrategy {
    fn fmt(&self, f: &mut fmt::Formatter<'_>) -> fmt::Result {
        let s = match self {
            MovementStrategy::Explorer => "Explorer",
            MovementStrategy::Settler => "Settler",
            MovementStrategy::Adaptive => "Adaptive",
            MovementStrategy::Opportunist => "Opportunist",
            MovementStrategy::Social => "Social",
            MovementStrategy::Antisocial => "Antisocial",
        };
        write!(f, "{s}")
    }
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

    pub fn default_mobility(&self) -> f64 {
        match self {
            MovementStrategy::Explorer => 0.8,    // 高い基本移動性
            MovementStrategy::Settler => 0.2,     // 低い基本移動性
            MovementStrategy::Adaptive => 0.5,    // 中程度の基本移動性
            MovementStrategy::Opportunist => 0.4, // やや低い基本移動性
            MovementStrategy::Social => 0.6,      // やや高い基本移動性
            MovementStrategy::Antisocial => 0.7,  // 高い基本移動性
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

#[cfg(test)]
mod tests {
    use super::*;

    #[test]
    fn test_movement_strategy_random_returns_valid_strategy() {
        // Arrange & Act
        let strategy = MovementStrategy::random();

        // Assert
        assert!(matches!(
            strategy,
            MovementStrategy::Explorer
                | MovementStrategy::Settler
                | MovementStrategy::Adaptive
                | MovementStrategy::Opportunist
                | MovementStrategy::Social
                | MovementStrategy::Antisocial
        ));
    }

    #[test]
    fn test_movement_strategy_default_mobility_values() {
        // Arrange & Act & Assert
        assert_eq!(MovementStrategy::Explorer.default_mobility(), 0.8);
        assert_eq!(MovementStrategy::Settler.default_mobility(), 0.2);
        assert_eq!(MovementStrategy::Adaptive.default_mobility(), 0.5);
        assert_eq!(MovementStrategy::Opportunist.default_mobility(), 0.4);
        assert_eq!(MovementStrategy::Social.default_mobility(), 0.6);
        assert_eq!(MovementStrategy::Antisocial.default_mobility(), 0.7);
    }

    #[test]
    fn test_movement_strategy_display() {
        // Arrange & Act & Assert
        assert_eq!(MovementStrategy::Explorer.to_string(), "Explorer");
        assert_eq!(MovementStrategy::Settler.to_string(), "Settler");
        assert_eq!(MovementStrategy::Adaptive.to_string(), "Adaptive");
        assert_eq!(MovementStrategy::Opportunist.to_string(), "Opportunist");
        assert_eq!(MovementStrategy::Social.to_string(), "Social");
        assert_eq!(MovementStrategy::Antisocial.to_string(), "Antisocial");
    }

    #[test]
    fn test_movement_strategy_wasm_functions() {
        // Arrange
        let strategy = MovementStrategy::Explorer;

        // Act
        let str_result = movement_strategy_to_string(strategy);
        let random_result = movement_strategy_random();
        let count_result = movement_strategy_variant_count();

        // Assert
        assert_eq!(str_result, "Explorer");
        assert!(matches!(
            random_result,
            MovementStrategy::Explorer
                | MovementStrategy::Settler
                | MovementStrategy::Adaptive
                | MovementStrategy::Opportunist
                | MovementStrategy::Social
                | MovementStrategy::Antisocial
        ));
        assert_eq!(count_result, 6);
    }
}
