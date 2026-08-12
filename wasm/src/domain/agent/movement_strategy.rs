use rand::RngExt;
use serde::{Deserialize, Serialize};
use std::fmt;

#[derive(Debug, Clone, Copy, PartialEq, Eq, Hash, Serialize, Deserialize)]
pub enum MovementStrategy {
    Explorer,    // 高移動性：常に新しい場所を探索
    Settler,     // 低移動性：良い場所に定住
    Adaptive,    // 適応的：成績に応じて移動判定
    Opportunist, // 機会主義：隣接の協力率を見て移動
    Social,      // 社会的：同じ戦略の仲間に近づく
    Antisocial,  // 反社会的：異なる戦略から離れる
}

impl MovementStrategy {
    /// 全バリアントの一覧。統計の集計やUI側への列挙に利用する単一の真実源。
    /// バリアントを追加・削除した場合はここも更新すること。
    pub const ALL: [MovementStrategy; 6] = [
        MovementStrategy::Explorer,
        MovementStrategy::Settler,
        MovementStrategy::Adaptive,
        MovementStrategy::Opportunist,
        MovementStrategy::Social,
        MovementStrategy::Antisocial,
    ];

    pub fn random() -> Self {
        let mut rng = rand::rng();
        Self::ALL[rng.random_range(0..Self::ALL.len())]
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
    fn test_movement_strategy_all_contains_every_variant_exactly_once() {
        // Arrange & Act
        let all = MovementStrategy::ALL;

        // Assert: 各バリアントがちょうど1回ずつ含まれる
        for variant in [
            MovementStrategy::Explorer,
            MovementStrategy::Settler,
            MovementStrategy::Adaptive,
            MovementStrategy::Opportunist,
            MovementStrategy::Social,
            MovementStrategy::Antisocial,
        ] {
            assert_eq!(
                all.iter().filter(|s| **s == variant).count(),
                1,
                "{variant} が ALL にちょうど1回含まれるはず"
            );
        }
    }
}
