// ========================================
// Grid - シミュレーショングリッド
// ========================================

use crate::domain::agent::Agent;
use crate::domain::shared::{AgentId, Position, WorldSize, WorldSizeError};
use serde::{Deserialize, Serialize};
use std::collections::HashMap;

/// シミュレーショングリッド
#[derive(Debug, Clone, Serialize, Deserialize)]
pub struct Grid {
    size: WorldSize,
    agents: HashMap<AgentId, Agent>,
    positions: HashMap<Position, AgentId>,
    next_agent_id: u64,
}

/// グリッドエラー
#[derive(Debug, Clone, PartialEq)]
pub enum GridError {
    AgentNotFound,
    PositionOccupied,
    PositionOutOfBounds,
    InvalidWorldSize,
}

impl Grid {
    /// 新しいグリッドを作成
    pub fn new(size: WorldSize) -> Result<Self, GridError> {
        if size.width == 0 || size.height == 0 {
            return Err(GridError::InvalidWorldSize);
        }

        Ok(Self {
            size,
            agents: HashMap::new(),
            positions: HashMap::new(),
            next_agent_id: 1,
        })
    }

    /// エージェントをランダムな位置に追加
    pub fn add_random_agent(&mut self) -> Result<AgentId, GridError> {
        let empty_positions = self.get_empty_positions();
        if empty_positions.is_empty() {
            return Err(GridError::PositionOccupied);
        }

        use rand::seq::SliceRandom;
        let mut rng = rand::thread_rng();
        let position = *empty_positions.choose(&mut rng).unwrap();

        self.add_agent_at(position)
    }

    /// 指定した位置にエージェントを追加
    pub fn add_agent_at(&mut self, position: Position) -> Result<AgentId, GridError> {
        if !self.is_position_valid(position) {
            return Err(GridError::PositionOutOfBounds);
        }

        if self.positions.contains_key(&position) {
            return Err(GridError::PositionOccupied);
        }

        let agent_id = AgentId::new(self.next_agent_id);
        self.next_agent_id += 1;

        let agent = Agent::random(agent_id, position);
        self.agents.insert(agent_id, agent);
        self.positions.insert(position, agent_id);

        Ok(agent_id)
    }

    /// エージェントを移動
    pub fn move_agent(&mut self, agent_id: AgentId, new_position: Position) -> Result<(), GridError> {
        if !self.is_position_valid(new_position) {
            return Err(GridError::PositionOutOfBounds);
        }

        if self.positions.contains_key(&new_position) {
            return Err(GridError::PositionOccupied);
        }

        let agent = self.agents.get_mut(&agent_id).ok_or(GridError::AgentNotFound)?;
        let old_position = agent.position();

        // 位置を更新
        self.positions.remove(&old_position);
        self.positions.insert(new_position, agent_id);
        agent.move_to(new_position);

        Ok(())
    }

    /// エージェントを削除
    pub fn remove_agent(&mut self, agent_id: AgentId) -> Result<Agent, GridError> {
        let agent = self.agents.remove(&agent_id).ok_or(GridError::AgentNotFound)?;
        self.positions.remove(&agent.position());
        Ok(agent)
    }

    /// エージェントを取得
    pub fn get_agent(&self, agent_id: AgentId) -> Option<&Agent> {
        self.agents.get(&agent_id)
    }

    /// エージェントを可変参照で取得
    pub fn get_agent_mut(&mut self, agent_id: AgentId) -> Option<&mut Agent> {
        self.agents.get_mut(&agent_id)
    }

    /// 位置にいるエージェントを取得
    pub fn get_agent_at(&self, position: Position) -> Option<&Agent> {
        let agent_id = self.positions.get(&position)?;
        self.agents.get(agent_id)
    }

    /// 近隣のエージェントを取得
    pub fn get_neighbors(&self, position: Position, radius: u32) -> Vec<&Agent> {
        let mut neighbors = Vec::new();
        
        for dx in -(radius as i32)..=(radius as i32) {
            for dy in -(radius as i32)..=(radius as i32) {
                if dx == 0 && dy == 0 {
                    continue;
                }

                let neighbor_pos = Position::new(
                    (position.x as i32 + dx).max(0) as u32,
                    (position.y as i32 + dy).max(0) as u32,
                );

                if self.is_position_valid(neighbor_pos) {
                    if let Some(agent) = self.get_agent_at(neighbor_pos) {
                        neighbors.push(agent);
                    }
                }
            }
        }

        neighbors
    }

    /// 空の位置のリストを取得
    pub fn get_empty_positions(&self) -> Vec<Position> {
        let mut empty_positions = Vec::new();
        
        for x in 0..self.size.width {
            for y in 0..self.size.height {
                let pos = Position::new(x, y);
                if !self.positions.contains_key(&pos) {
                    empty_positions.push(pos);
                }
            }
        }

        empty_positions
    }

    /// 全エージェントを取得
    pub fn agents(&self) -> &HashMap<AgentId, Agent> {
        &self.agents
    }

    /// 全エージェントを可変参照で取得
    pub fn agents_mut(&mut self) -> &mut HashMap<AgentId, Agent> {
        &mut self.agents
    }

    /// エージェント数を取得
    pub fn agent_count(&self) -> usize {
        self.agents.len()
    }

    /// グリッドサイズを取得
    pub fn size(&self) -> WorldSize {
        self.size
    }

    /// 位置が有効かチェック
    fn is_position_valid(&self, position: Position) -> bool {
        position.x < self.size.width && position.y < self.size.height
    }
}

impl std::fmt::Display for GridError {
    fn fmt(&self, f: &mut std::fmt::Formatter<'_>) -> std::fmt::Result {
        match self {
            GridError::AgentNotFound => write!(f, "Agent not found"),
            GridError::PositionOccupied => write!(f, "Position already occupied"),
            GridError::PositionOutOfBounds => write!(f, "Position out of bounds"),
            GridError::InvalidWorldSize => write!(f, "Invalid world size"),
        }
    }
}

impl std::error::Error for GridError {}

impl From<WorldSizeError> for GridError {
    fn from(_: WorldSizeError) -> Self {
        GridError::InvalidWorldSize
    }
}

#[cfg(test)]
mod tests {
    use super::*;

    #[test]
    fn test_grid_creation() {
        let size = WorldSize::new(10, 10).unwrap();
        let grid = Grid::new(size).unwrap();
        
        assert_eq!(grid.size(), size);
        assert_eq!(grid.agent_count(), 0);
    }

    #[test]
    fn test_grid_invalid_size() {
        let invalid_size = WorldSize::new(0, 10);
        assert!(invalid_size.is_err());

        // WorldSizeのフィールドはプライベートなので直接作成不可
    }

    #[test] 
    fn test_add_agent_at_position() {
        let size = WorldSize::new(5, 5).unwrap();
        let mut grid = Grid::new(size).unwrap();
        let position = Position::new(2, 3);
        
        let agent_id = grid.add_agent_at(position).unwrap();
        
        assert_eq!(grid.agent_count(), 1);
        let agent = grid.get_agent(agent_id).unwrap();
        assert_eq!(agent.position(), position);
        assert_eq!(agent.id(), agent_id);
    }

    #[test]
    fn test_add_agent_at_occupied_position() {
        let size = WorldSize::new(5, 5).unwrap();
        let mut grid = Grid::new(size).unwrap();
        let position = Position::new(2, 3);
        
        grid.add_agent_at(position).unwrap();
        let result = grid.add_agent_at(position);
        
        assert!(matches!(result, Err(GridError::PositionOccupied)));
    }

    #[test]
    fn test_add_agent_out_of_bounds() {
        let size = WorldSize::new(5, 5).unwrap();
        let mut grid = Grid::new(size).unwrap();
        let position = Position::new(10, 10);
        
        let result = grid.add_agent_at(position);
        assert!(matches!(result, Err(GridError::PositionOutOfBounds)));
    }

    #[test]
    fn test_add_random_agent() {
        let size = WorldSize::new(5, 5).unwrap();
        let mut grid = Grid::new(size).unwrap();
        
        let agent_id = grid.add_random_agent().unwrap();
        
        assert_eq!(grid.agent_count(), 1);
        let agent = grid.get_agent(agent_id).unwrap();
        assert!(grid.is_position_valid(agent.position()));
    }

    #[test]
    fn test_move_agent() {
        let size = WorldSize::new(5, 5).unwrap();
        let mut grid = Grid::new(size).unwrap();
        let initial_pos = Position::new(1, 1);
        let new_pos = Position::new(3, 3);
        
        let agent_id = grid.add_agent_at(initial_pos).unwrap();
        grid.move_agent(agent_id, new_pos).unwrap();
        
        let agent = grid.get_agent(agent_id).unwrap();
        assert_eq!(agent.position(), new_pos);
        assert!(grid.get_agent_at(initial_pos).is_none());
        assert!(grid.get_agent_at(new_pos).is_some());
    }

    #[test]
    fn test_move_agent_to_occupied_position() {
        let size = WorldSize::new(5, 5).unwrap();
        let mut grid = Grid::new(size).unwrap();
        let pos1 = Position::new(1, 1);
        let pos2 = Position::new(2, 2);
        
        let agent1_id = grid.add_agent_at(pos1).unwrap();
        let _agent2_id = grid.add_agent_at(pos2).unwrap();
        
        let result = grid.move_agent(agent1_id, pos2);
        assert!(matches!(result, Err(GridError::PositionOccupied)));
    }

    #[test]
    fn test_remove_agent() {
        let size = WorldSize::new(5, 5).unwrap();
        let mut grid = Grid::new(size).unwrap();
        let position = Position::new(2, 3);
        
        let agent_id = grid.add_agent_at(position).unwrap();
        assert_eq!(grid.agent_count(), 1);
        
        let removed_agent = grid.remove_agent(agent_id).unwrap();
        assert_eq!(grid.agent_count(), 0);
        assert_eq!(removed_agent.id(), agent_id);
        assert!(grid.get_agent_at(position).is_none());
    }

    #[test]
    fn test_get_neighbors() {
        let size = WorldSize::new(5, 5).unwrap();
        let mut grid = Grid::new(size).unwrap();
        let center = Position::new(2, 2);
        
        // 中心にエージェントを配置
        let center_id = grid.add_agent_at(center).unwrap();
        
        // 近隣にエージェントを配置
        grid.add_agent_at(Position::new(1, 2)).unwrap();
        grid.add_agent_at(Position::new(3, 2)).unwrap();
        grid.add_agent_at(Position::new(2, 1)).unwrap();
        
        let neighbors = grid.get_neighbors(center, 1);
        assert_eq!(neighbors.len(), 3);
        
        // 中心のエージェント自身は含まれない
        assert!(!neighbors.iter().any(|a| a.id() == center_id));
    }

    #[test]
    fn test_get_empty_positions() {
        let size = WorldSize::new(3, 3).unwrap();
        let mut grid = Grid::new(size).unwrap();
        
        // 最初は全て空
        let empty = grid.get_empty_positions();
        assert_eq!(empty.len(), 9);
        
        // エージェントを1つ追加
        grid.add_agent_at(Position::new(1, 1)).unwrap();
        let empty = grid.get_empty_positions();
        assert_eq!(empty.len(), 8);
        assert!(!empty.contains(&Position::new(1, 1)));
    }

    #[test]
    fn test_grid_full() {
        let size = WorldSize::new(2, 2).unwrap();
        let mut grid = Grid::new(size).unwrap();
        
        // 全ての位置にエージェントを配置
        for x in 0..2 {
            for y in 0..2 {
                grid.add_agent_at(Position::new(x, y)).unwrap();
            }
        }
        
        // もう追加できない
        let result = grid.add_random_agent();
        assert!(matches!(result, Err(GridError::PositionOccupied)));
    }
}