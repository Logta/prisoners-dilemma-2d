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
