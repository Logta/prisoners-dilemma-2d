// ========================================
// Value Objects - 不変なビジネス概念を表現
// ========================================

use serde::{Deserialize, Serialize};
use std::fmt;

/// 二次元座標位置
#[derive(Debug, Clone, Copy, PartialEq, Eq, Hash, Serialize, Deserialize)]
pub struct Position {
    pub x: usize,
    pub y: usize,
}

impl Position {
    pub fn new(x: usize, y: usize) -> Self {
        Self { x, y }
    }

    /// マンハッタン距離を計算
    pub fn manhattan_distance(&self, other: &Position) -> usize {
        let dx = if self.x > other.x {
            self.x - other.x
        } else {
            other.x - self.x
        };
        let dy = if self.y > other.y {
            self.y - other.y
        } else {
            other.y - self.y
        };
        dx + dy
    }

    /// チェビシェフ距離（最大距離）を計算
    pub fn chebyshev_distance(&self, other: &Position) -> usize {
        let dx = if self.x > other.x {
            self.x - other.x
        } else {
            other.x - self.x
        };
        let dy = if self.y > other.y {
            self.y - other.y
        } else {
            other.y - self.y
        };
        dx.max(dy)
    }

    /// 隣接する8方向の位置を取得
    pub fn neighbors(&self, bounds: &WorldDimensions) -> Vec<Position> {
        let mut neighbors = Vec::new();

        for dx in -1i32..=1i32 {
            for dy in -1i32..=1i32 {
                if dx == 0 && dy == 0 {
                    continue; // 自分自身は除外
                }

                let new_x = self.x as i32 + dx;
                let new_y = self.y as i32 + dy;

                if new_x >= 0 && new_y >= 0 {
                    let new_x = new_x as usize;
                    let new_y = new_y as usize;

                    if new_x < bounds.width && new_y < bounds.height {
                        neighbors.push(Position::new(new_x, new_y));
                    }
                }
            }
        }

        neighbors
    }
}

impl fmt::Display for Position {
    fn fmt(&self, f: &mut fmt::Formatter<'_>) -> fmt::Result {
        write!(f, "({}, {})", self.x, self.y)
    }
}

/// 世界の大きさ
#[derive(Debug, Clone, Copy, PartialEq, Eq, Serialize, Deserialize)]
pub struct WorldDimensions {
    pub width: usize,
    pub height: usize,
}

impl WorldDimensions {
    pub fn new(width: usize, height: usize) -> Result<Self, DimensionError> {
        if width == 0 || height == 0 {
            return Err(DimensionError::ZeroSize);
        }

        if width > 10000 || height > 10000 {
            return Err(DimensionError::TooLarge);
        }

        Ok(Self { width, height })
    }

    pub fn total_cells(&self) -> usize {
        self.width * self.height
    }

    pub fn contains(&self, position: &Position) -> bool {
        position.x < self.width && position.y < self.height
    }

    pub fn random_position<R: rand::Rng>(&self, rng: &mut R) -> Position {
        Position::new(rng.gen_range(0..self.width), rng.gen_range(0..self.height))
    }
}

/// 寸法エラー
#[derive(Debug, Clone, PartialEq, Eq)]
pub enum DimensionError {
    ZeroSize,
    TooLarge,
}

impl fmt::Display for DimensionError {
    fn fmt(&self, f: &mut fmt::Formatter<'_>) -> fmt::Result {
        match self {
            DimensionError::ZeroSize => write!(f, "Dimensions must be greater than zero"),
            DimensionError::TooLarge => write!(f, "Dimensions are too large (max: 10000x10000)"),
        }
    }
}

impl std::error::Error for DimensionError {}

/// 利得マトリックス - 囚人のジレンマの結果
#[derive(Debug, Clone, Copy, Serialize, Deserialize)]
pub struct PayoffMatrix {
    pub cooperate_cooperate: (f64, f64), // 両方協力
    pub cooperate_defect: (f64, f64),    // 協力 vs 裏切り
    pub defect_cooperate: (f64, f64),    // 裏切り vs 協力
    pub defect_defect: (f64, f64),       // 両方裏切り
}

impl PayoffMatrix {
    /// 標準的な囚人のジレンママトリックス
    pub fn classic() -> Self {
        Self {
            cooperate_cooperate: (3.0, 3.0),
            cooperate_defect: (0.0, 5.0),
            defect_cooperate: (5.0, 0.0),
            defect_defect: (1.0, 1.0),
        }
    }

    /// より協力を促進するマトリックス
    pub fn cooperation_favoring() -> Self {
        Self {
            cooperate_cooperate: (4.0, 4.0),
            cooperate_defect: (1.0, 3.0),
            defect_cooperate: (3.0, 1.0),
            defect_defect: (0.0, 0.0),
        }
    }

    /// より競争的なマトリックス
    pub fn competitive() -> Self {
        Self {
            cooperate_cooperate: (2.0, 2.0),
            cooperate_defect: (-1.0, 6.0),
            defect_cooperate: (6.0, -1.0),
            defect_defect: (0.0, 0.0),
        }
    }

    /// カスタムマトリックス
    pub fn custom(cc: f64, cd: f64, dc: f64, dd: f64) -> Self {
        Self {
            cooperate_cooperate: (cc, cc),
            cooperate_defect: (cd, dc),
            defect_cooperate: (dc, cd),
            defect_defect: (dd, dd),
        }
    }

    /// 利得を計算
    pub fn calculate_payoff(
        &self,
        player1_cooperates: bool,
        player2_cooperates: bool,
    ) -> (f64, f64) {
        match (player1_cooperates, player2_cooperates) {
            (true, true) => self.cooperate_cooperate,
            (true, false) => self.cooperate_defect,
            (false, true) => self.defect_cooperate,
            (false, false) => self.defect_defect,
        }
    }

    /// ナッシュ均衡をチェック
    pub fn is_nash_equilibrium(&self) -> bool {
        // 単純化された実装：両方裏切りがナッシュ均衡かチェック
        self.defect_defect.0 >= self.cooperate_defect.0
            && self.defect_defect.1 >= self.defect_cooperate.1
    }

    /// パレート効率性をチェック
    pub fn is_pareto_efficient(&self) -> bool {
        let outcomes = [
            self.cooperate_cooperate,
            self.cooperate_defect,
            self.defect_cooperate,
            self.defect_defect,
        ];

        // 協力-協力が他のどの結果よりも両プレイヤーにとって良いかチェック
        let cc = self.cooperate_cooperate;
        outcomes.iter().all(|&outcome| {
            outcome == cc
                || (outcome.0 <= cc.0 && outcome.1 <= cc.1)
                || (outcome.0 < cc.0 || outcome.1 < cc.1)
        })
    }
}

impl Default for PayoffMatrix {
    fn default() -> Self {
        Self::classic()
    }
}

/// 戦闘半径 - エージェント間の相互作用距離
#[derive(Debug, Clone, Copy, PartialEq, Eq, Serialize, Deserialize)]
pub struct BattleRadius(pub usize);

impl BattleRadius {
    pub fn new(radius: usize) -> Result<Self, RadiusError> {
        if radius > 10 {
            return Err(RadiusError::TooLarge);
        }
        Ok(Self(radius))
    }

    pub fn value(&self) -> usize {
        self.0
    }

    /// 指定された位置が戦闘範囲内かチェック
    pub fn is_within_range(&self, center: &Position, target: &Position) -> bool {
        center.chebyshev_distance(target) <= self.0
    }
}

/// 半径エラー
#[derive(Debug, Clone, PartialEq, Eq)]
pub enum RadiusError {
    TooLarge,
}

impl fmt::Display for RadiusError {
    fn fmt(&self, f: &mut fmt::Formatter<'_>) -> fmt::Result {
        match self {
            RadiusError::TooLarge => write!(f, "Battle radius is too large (max: 10)"),
        }
    }
}

impl std::error::Error for RadiusError {}

/// エージェント密度
#[derive(Debug, Clone, Copy, PartialEq, Serialize, Deserialize)]
pub struct AgentDensity(pub f64);

impl AgentDensity {
    pub fn new(density: f64) -> Result<Self, DensityError> {
        if density < 0.0 || density > 1.0 {
            return Err(DensityError::OutOfRange);
        }
        Ok(Self(density))
    }

    pub fn value(&self) -> f64 {
        self.0
    }

    pub fn calculate_agent_count(&self, world_size: &WorldDimensions) -> usize {
        (world_size.total_cells() as f64 * self.0) as usize
    }
}

/// 密度エラー
#[derive(Debug, Clone, PartialEq)]
pub enum DensityError {
    OutOfRange,
}

impl fmt::Display for DensityError {
    fn fmt(&self, f: &mut fmt::Formatter<'_>) -> fmt::Result {
        match self {
            DensityError::OutOfRange => write!(f, "Density must be between 0.0 and 1.0"),
        }
    }
}

impl std::error::Error for DensityError {}

#[cfg(test)]
mod tests {
    use super::*;

    #[test]
    fn test_position_distance() {
        let p1 = Position::new(0, 0);
        let p2 = Position::new(3, 4);

        assert_eq!(p1.manhattan_distance(&p2), 7);
        assert_eq!(p1.chebyshev_distance(&p2), 4);
    }

    #[test]
    fn test_world_dimensions() {
        let dims = WorldDimensions::new(100, 50).unwrap();
        assert_eq!(dims.total_cells(), 5000);

        let pos = Position::new(50, 25);
        assert!(dims.contains(&pos));

        let out_of_bounds = Position::new(100, 50);
        assert!(!dims.contains(&out_of_bounds));
    }

    #[test]
    fn test_payoff_matrix() {
        let matrix = PayoffMatrix::classic();

        let (p1_score, p2_score) = matrix.calculate_payoff(true, true);
        assert_eq!((p1_score, p2_score), (3.0, 3.0));

        let (p1_score, p2_score) = matrix.calculate_payoff(true, false);
        assert_eq!((p1_score, p2_score), (0.0, 5.0));
    }

    #[test]
    fn test_battle_radius() {
        let radius = BattleRadius::new(2).unwrap();
        let center = Position::new(5, 5);
        let target = Position::new(7, 7);

        assert!(radius.is_within_range(&center, &target));

        let far_target = Position::new(10, 10);
        assert!(!radius.is_within_range(&center, &far_target));
    }

    #[test]
    fn test_agent_density() {
        let density = AgentDensity::new(0.3).unwrap();
        let world = WorldDimensions::new(100, 100).unwrap();

        let agent_count = density.calculate_agent_count(&world);
        assert_eq!(agent_count, 3000);
    }
}
