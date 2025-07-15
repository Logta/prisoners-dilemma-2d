use serde::{Deserialize, Serialize};

#[derive(Debug, Clone, Copy, PartialEq, Eq, Hash, Serialize, Deserialize)]
pub struct Position {
    pub x: usize,
    pub y: usize,
}

impl Position {
    pub fn new(x: usize, y: usize) -> Self {
        Self { x, y }
    }

    pub fn neighbors(&self, grid_width: usize, grid_height: usize) -> Vec<Position> {
        self.neighbors_with_mode(grid_width, grid_height, false)
    }

    pub fn neighbors_with_mode(
        &self,
        grid_width: usize,
        grid_height: usize,
        torus_mode: bool,
    ) -> Vec<Position> {
        let mut neighbors = Vec::new();

        for dx in -1..=1 {
            for dy in -1..=1 {
                if dx == 0 && dy == 0 {
                    continue; // 自分自身は除外
                }

                if torus_mode {
                    // トーラス平面モード：端をループ
                    let new_x = ((self.x as i32 + dx).rem_euclid(grid_width as i32)) as usize;
                    let new_y = ((self.y as i32 + dy).rem_euclid(grid_height as i32)) as usize;
                    neighbors.push(Position::new(new_x, new_y));
                } else {
                    // 通常モード：境界チェック
                    let new_x = self.x as i32 + dx;
                    let new_y = self.y as i32 + dy;

                    if new_x >= 0
                        && new_x < grid_width as i32
                        && new_y >= 0
                        && new_y < grid_height as i32
                    {
                        neighbors.push(Position::new(new_x as usize, new_y as usize));
                    }
                }
            }
        }

        neighbors
    }

    pub fn random_neighbor(&self, grid_width: usize, grid_height: usize) -> Option<Position> {
        let neighbors = self.neighbors(grid_width, grid_height);
        if neighbors.is_empty() {
            None
        } else {
            use rand::Rng;
            let mut rng = rand::thread_rng();
            Some(neighbors[rng.gen_range(0..neighbors.len())])
        }
    }
}

#[cfg(test)]
mod tests {
    use super::*;

    #[test]
    fn test_position_new() {
        // Arrange
        let x = 5;
        let y = 10;
        
        // Act
        let position = Position::new(x, y);
        
        // Assert
        assert_eq!(position.x, x);
        assert_eq!(position.y, y);
    }

    #[test]
    fn test_neighbors_center_position() {
        // Arrange
        let position = Position::new(5, 5);
        let grid_width = 10;
        let grid_height = 10;
        
        // Act
        let neighbors = position.neighbors(grid_width, grid_height);
        
        // Assert
        assert_eq!(neighbors.len(), 8);
        assert!(neighbors.contains(&Position::new(4, 4)));
        assert!(neighbors.contains(&Position::new(4, 5)));
        assert!(neighbors.contains(&Position::new(4, 6)));
        assert!(neighbors.contains(&Position::new(5, 4)));
        assert!(neighbors.contains(&Position::new(5, 6)));
        assert!(neighbors.contains(&Position::new(6, 4)));
        assert!(neighbors.contains(&Position::new(6, 5)));
        assert!(neighbors.contains(&Position::new(6, 6)));
    }

    #[test]
    fn test_neighbors_boundary_conditions() {
        // Arrange
        let grid_width = 10;
        let grid_height = 10;
        
        // Act & Assert: 角の位置
        let corner = Position::new(0, 0);
        let corner_neighbors = corner.neighbors(grid_width, grid_height);
        assert_eq!(corner_neighbors.len(), 3);
        assert!(corner_neighbors.contains(&Position::new(0, 1)));
        assert!(corner_neighbors.contains(&Position::new(1, 0)));
        assert!(corner_neighbors.contains(&Position::new(1, 1)));
        
        // Act & Assert: 端の位置
        let edge = Position::new(0, 5);
        let edge_neighbors = edge.neighbors(grid_width, grid_height);
        assert_eq!(edge_neighbors.len(), 5);
        assert!(edge_neighbors.contains(&Position::new(0, 4)));
        assert!(edge_neighbors.contains(&Position::new(0, 6)));
        assert!(edge_neighbors.contains(&Position::new(1, 4)));
        assert!(edge_neighbors.contains(&Position::new(1, 5)));
        assert!(edge_neighbors.contains(&Position::new(1, 6)));
    }

    #[test]
    fn test_neighbors_with_torus_mode() {
        // Arrange
        let position = Position::new(0, 0);
        let grid_width = 10;
        let grid_height = 10;
        
        // Act
        let neighbors = position.neighbors_with_mode(grid_width, grid_height, true);
        
        // Assert
        assert_eq!(neighbors.len(), 8);
        assert!(neighbors.contains(&Position::new(9, 9)));
        assert!(neighbors.contains(&Position::new(9, 0)));
        assert!(neighbors.contains(&Position::new(9, 1)));
        assert!(neighbors.contains(&Position::new(0, 9)));
        assert!(neighbors.contains(&Position::new(0, 1)));
        assert!(neighbors.contains(&Position::new(1, 9)));
        assert!(neighbors.contains(&Position::new(1, 0)));
        assert!(neighbors.contains(&Position::new(1, 1)));
    }

    #[test]
    fn test_neighbors_excludes_self() {
        // Arrange
        let position = Position::new(5, 5);
        let grid_width = 10;
        let grid_height = 10;
        
        // Act
        let neighbors = position.neighbors(grid_width, grid_height);
        
        // Assert
        assert!(!neighbors.contains(&position));
    }

    #[test]
    fn test_random_neighbor() {
        // Arrange
        let position = Position::new(5, 5);
        let grid_width = 10;
        let grid_height = 10;
        
        // Act
        let neighbor = position.random_neighbor(grid_width, grid_height);
        
        // Assert: 返された隣接位置が有効な隣接位置に含まれる
        assert!(neighbor.is_some());
        if let Some(neighbor) = neighbor {
            let valid_neighbors = position.neighbors(grid_width, grid_height);
            assert!(valid_neighbors.contains(&neighbor));
        }
    }
}
