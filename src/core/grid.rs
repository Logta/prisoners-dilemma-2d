// ========================================
// Grid Module - 新しいグリッド実装
// ========================================

use crate::core::entities::{Agent, AgentId};
use crate::core::value_objects::{Position, WorldDimensions, BattleRadius};
use crate::core::strategies::BattleHistory;
use std::collections::HashMap;

/// 2Dグリッド上のエージェント管理
#[derive(Debug, Clone)]
pub struct Grid {
    pub dimensions: WorldDimensions,
    pub agents: HashMap<Position, Agent>,
    pub battle_history: BattleHistory,
}

impl Grid {
    /// 新しいグリッドを作成
    pub fn new(dimensions: WorldDimensions) -> Self {
        Grid {
            dimensions,
            agents: HashMap::new(),
            battle_history: BattleHistory::new(),
        }
    }

    /// エージェントを追加
    pub fn add_agent(&mut self, agent: Agent) -> Result<(), GridError> {
        if !self.dimensions.contains(&agent.position) {
            return Err(GridError::OutOfBounds);
        }
        
        if self.agents.contains_key(&agent.position) {
            return Err(GridError::PositionOccupied);
        }
        
        self.agents.insert(agent.position, agent);
        Ok(())
    }

    /// 指定位置のエージェントを取得
    pub fn get_agent_at(&self, position: &Position) -> Option<&Agent> {
        self.agents.get(position)
    }

    /// 指定位置のエージェントを可変参照で取得
    pub fn get_agent_at_mut(&mut self, position: &Position) -> Option<&mut Agent> {
        self.agents.get_mut(position)
    }

    /// 指定半径内の隣接エージェントを検索
    pub fn find_neighbors_within_radius(
        &self,
        center: &Position,
        radius: &BattleRadius,
    ) -> Vec<&Agent> {
        self.agents
            .values()
            .filter(|agent| {
                agent.position != *center && radius.is_within_range(center, &agent.position)
            })
            .collect()
    }

    /// エージェントを移動
    pub fn move_agent(&mut self, from: Position, to: Position) -> Result<(), GridError> {
        if !self.dimensions.contains(&to) {
            return Err(GridError::OutOfBounds);
        }

        if self.agents.contains_key(&to) {
            return Err(GridError::PositionOccupied);
        }

        if let Some(mut agent) = self.agents.remove(&from) {
            agent.move_to(to);
            self.agents.insert(to, agent);
            Ok(())
        } else {
            Err(GridError::NoAgentAtPosition)
        }
    }

    /// 生存しているエージェントのみを残す
    pub fn remove_dead_agents(&mut self) {
        self.agents.retain(|_, agent| agent.is_alive());
    }

    /// 全エージェントのリストを取得
    pub fn all_agents(&self) -> Vec<&Agent> {
        self.agents.values().collect()
    }

    /// 全エージェントの可変参照リストを取得
    pub fn all_agents_mut(&mut self) -> Vec<&mut Agent> {
        self.agents.values_mut().collect()
    }
}

/// グリッドエラー
#[derive(Debug, PartialEq)]
pub enum GridError {
    OutOfBounds,
    PositionOccupied,
    NoAgentAtPosition,
}

#[cfg(test)]
mod tests {
    use super::*;
    use crate::core::entities::AgentTraits;

    #[test]
    fn test_grid_creation() {
        let dimensions = WorldDimensions::new(10, 10).unwrap();
        let grid = Grid::new(dimensions);
        
        assert_eq!(grid.dimensions.width, 10);
        assert_eq!(grid.dimensions.height, 10);
        assert_eq!(grid.agents.len(), 0);
    }

    #[test]
    fn test_add_agent() {
        let dimensions = WorldDimensions::new(10, 10).unwrap();
        let mut grid = Grid::new(dimensions);
        
        let position = Position::new(5, 5);
        let traits = AgentTraits {
            cooperation_rate: 0.5,
            movement_rate: 0.3,
            aggression_level: 0.2,
            learning_rate: 0.1,
        };
        
        let agent = Agent::new(AgentId(1), position, traits);
        assert!(grid.add_agent(agent).is_ok());
        assert_eq!(grid.agents.len(), 1);
    }

    #[test]
    fn test_add_agent_out_of_bounds() {
        let dimensions = WorldDimensions::new(10, 10).unwrap();
        let mut grid = Grid::new(dimensions);
        
        let position = Position::new(15, 15); // Out of bounds
        let traits = AgentTraits {
            cooperation_rate: 0.5,
            movement_rate: 0.3,
            aggression_level: 0.2,
            learning_rate: 0.1,
        };
        
        let agent = Agent::new(AgentId(1), position, traits);
        assert_eq!(grid.add_agent(agent), Err(GridError::OutOfBounds));
    }

    #[test]
    fn test_find_neighbors() {
        let dimensions = WorldDimensions::new(10, 10).unwrap();
        let mut grid = Grid::new(dimensions);
        
        // 中心にエージェントを配置
        let center = Position::new(5, 5);
        let traits = AgentTraits {
            cooperation_rate: 0.5,
            movement_rate: 0.3,
            aggression_level: 0.2,
            learning_rate: 0.1,
        };
        
        grid.add_agent(Agent::new(AgentId(1), center, traits)).unwrap();
        
        // 隣接エージェントを配置
        grid.add_agent(Agent::new(AgentId(2), Position::new(4, 5), traits)).unwrap();
        grid.add_agent(Agent::new(AgentId(3), Position::new(6, 5), traits)).unwrap();
        grid.add_agent(Agent::new(AgentId(4), Position::new(5, 4), traits)).unwrap();
        
        // 半径1で検索
        let radius = BattleRadius::new(1).unwrap();
        let neighbors = grid.find_neighbors_within_radius(&center, &radius);
        assert_eq!(neighbors.len(), 3);
    }

    #[test]
    fn test_move_agent() {
        let dimensions = WorldDimensions::new(10, 10).unwrap();
        let mut grid = Grid::new(dimensions);
        
        let from = Position::new(5, 5);
        let to = Position::new(6, 6);
        let traits = AgentTraits {
            cooperation_rate: 0.5,
            movement_rate: 0.3,
            aggression_level: 0.2,
            learning_rate: 0.1,
        };
        
        let agent = Agent::new(AgentId(1), from, traits);
        grid.add_agent(agent).unwrap();
        
        assert!(grid.move_agent(from, to).is_ok());
        assert!(grid.get_agent_at(&from).is_none());
        assert!(grid.get_agent_at(&to).is_some());
    }
}