// ========================================
// Position - 座標値オブジェクト
// ========================================

use serde::{Deserialize, Serialize};

/// 2D座標を表す値オブジェクト
#[derive(Debug, Clone, Copy, PartialEq, Eq, Hash, Serialize, Deserialize)]
pub struct Position {
    pub x: u32,
    pub y: u32,
}

/// 世界の大きさを表す値オブジェクト
#[derive(Debug, Clone, Copy, PartialEq, Eq, Serialize, Deserialize)]
pub struct WorldSize {
    pub width: u32,
    pub height: u32,
}

impl Position {
    /// 新しい座標を作成
    pub fn new(x: u32, y: u32) -> Self {
        Self { x, y }
    }

    /// マンハッタン距離を計算
    pub fn manhattan_distance(&self, other: &Position) -> u32 {
        let dx = if self.x > other.x { self.x - other.x } else { other.x - self.x };
        let dy = if self.y > other.y { self.y - other.y } else { other.y - self.y };
        dx + dy
    }

    /// チェビシェフ距離（最大距離）を計算
    pub fn chebyshev_distance(&self, other: &Position) -> u32 {
        let dx = if self.x > other.x { self.x - other.x } else { other.x - self.x };
        let dy = if self.y > other.y { self.y - other.y } else { other.y - self.y };
        dx.max(dy)
    }

    /// 指定された範囲内にあるかチェック
    pub fn is_within(&self, world_size: &WorldSize) -> bool {
        self.x < world_size.width && self.y < world_size.height
    }

    /// 隣接する8方向の座標を取得（境界内のみ）
    pub fn neighbors(&self, world_size: &WorldSize) -> Vec<Position> {
        let mut neighbors = Vec::new();
        
        for dx in -1i32..=1i32 {
            for dy in -1i32..=1i32 {
                if dx == 0 && dy == 0 {
                    continue;
                }
                
                let new_x = self.x as i32 + dx;
                let new_y = self.y as i32 + dy;
                
                if new_x >= 0 && new_y >= 0 {
                    let pos = Position::new(new_x as u32, new_y as u32);
                    if pos.is_within(world_size) {
                        neighbors.push(pos);
                    }
                }
            }
        }
        
        neighbors
    }
}

impl WorldSize {
    /// 新しい世界サイズを作成
    pub fn new(width: u32, height: u32) -> Result<Self, WorldSizeError> {
        if width == 0 || height == 0 {
            return Err(WorldSizeError::ZeroSize);
        }
        
        if width > 10000 || height > 10000 {
            return Err(WorldSizeError::TooLarge);
        }
        
        Ok(Self { width, height })
    }

    /// 総セル数を取得
    pub fn total_cells(&self) -> u64 {
        self.width as u64 * self.height as u64
    }

    /// ランダムな座標を生成
    pub fn random_position(&self) -> Position {
        use rand::Rng;
        let mut rng = rand::thread_rng();
        Position::new(
            rng.gen_range(0..self.width),
            rng.gen_range(0..self.height),
        )
    }
}

/// 世界サイズエラー
#[derive(Debug, Clone, PartialEq, Eq)]
pub enum WorldSizeError {
    ZeroSize,
    TooLarge,
}

impl std::fmt::Display for WorldSizeError {
    fn fmt(&self, f: &mut std::fmt::Formatter<'_>) -> std::fmt::Result {
        match self {
            WorldSizeError::ZeroSize => write!(f, "World size must be greater than zero"),
            WorldSizeError::TooLarge => write!(f, "World size is too large (max: 10000x10000)"),
        }
    }
}

impl std::error::Error for WorldSizeError {}

#[cfg(test)]
mod tests {
    use super::*;

    #[test]
    fn test_position_creation() {
        let pos = Position::new(5, 10);
        assert_eq!(pos.x, 5);
        assert_eq!(pos.y, 10);
    }

    #[test]
    fn test_position_equality() {
        let pos1 = Position::new(5, 10);
        let pos2 = Position::new(5, 10);
        let pos3 = Position::new(6, 10);

        assert_eq!(pos1, pos2);
        assert_ne!(pos1, pos3);
    }

    #[test]
    fn test_manhattan_distance() {
        let pos1 = Position::new(0, 0);
        let pos2 = Position::new(3, 4);

        assert_eq!(pos1.manhattan_distance(&pos2), 7);
        assert_eq!(pos2.manhattan_distance(&pos1), 7);
    }

    #[test]
    fn test_chebyshev_distance() {
        let pos1 = Position::new(0, 0);
        let pos2 = Position::new(3, 4);

        assert_eq!(pos1.chebyshev_distance(&pos2), 4);
        assert_eq!(pos2.chebyshev_distance(&pos1), 4);
    }

    #[test]
    fn test_position_within_world() {
        let world_size = WorldSize::new(10, 10).unwrap();
        let pos1 = Position::new(5, 5);
        let pos2 = Position::new(9, 9);
        let pos3 = Position::new(10, 5);

        assert!(pos1.is_within(&world_size));
        assert!(pos2.is_within(&world_size));
        assert!(!pos3.is_within(&world_size));
    }

    #[test]
    fn test_neighbors() {
        let world_size = WorldSize::new(10, 10).unwrap();
        let pos = Position::new(5, 5);
        let neighbors = pos.neighbors(&world_size);

        assert_eq!(neighbors.len(), 8); // 8方向すべて境界内

        // 角の場合
        let corner = Position::new(0, 0);
        let corner_neighbors = corner.neighbors(&world_size);
        assert_eq!(corner_neighbors.len(), 3); // 3方向のみ
    }

    #[test]
    fn test_world_size_creation() {
        let world_size = WorldSize::new(100, 50).unwrap();
        assert_eq!(world_size.width, 100);
        assert_eq!(world_size.height, 50);
        assert_eq!(world_size.total_cells(), 5000);
    }

    #[test]
    fn test_world_size_validation() {
        assert!(WorldSize::new(0, 10).is_err());
        assert!(WorldSize::new(10, 0).is_err());
        assert!(WorldSize::new(20000, 10).is_err());
        assert!(WorldSize::new(100, 100).is_ok());
    }

    #[test]
    fn test_random_position() {
        let world_size = WorldSize::new(10, 10).unwrap();
        
        for _ in 0..100 {
            let pos = world_size.random_position();
            assert!(pos.is_within(&world_size));
        }
    }
}