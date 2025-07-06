// ========================================
// Serialization - シリアライゼーション機能
// ========================================

use crate::domain::{Agent, AgentId, SimulationStats, SimulationConfig};
use crate::application::{SimulationResult, BattleHistoryResult, EvolutionStatistics};
use serde::{Deserialize, Serialize};
use std::collections::HashMap;

/// CSVエクスポート用のエージェントデータ
#[derive(Debug, Clone, Serialize, Deserialize)]
pub struct AgentCsvData {
    pub id: u64,
    pub x: u32,
    pub y: u32,
    pub cooperation_tendency: f64,
    pub aggression_level: f64,
    pub learning_ability: f64,
    pub movement_tendency: f64,
    pub score: f64,
    pub energy: f64,
    pub age: u32,
    pub battles_fought: u32,
    pub fitness: f64,
    pub is_alive: bool,
}

/// CSVエクスポート用の統計データ
#[derive(Debug, Clone, Serialize, Deserialize)]
pub struct StatsCsvData {
    pub generation: u32,
    pub population: usize,
    pub average_score: f64,
    pub max_score: f64,
    pub min_score: f64,
    pub average_cooperation: f64,
    pub total_battles: u32,
}

/// CSVエクスポート用の戦闘履歴データ
#[derive(Debug, Clone, Serialize, Deserialize)]
pub struct BattleCsvData {
    pub agent_id: u64,
    pub opponent_id: u64,
    pub agent_cooperated: bool,
    pub opponent_cooperated: bool,
    pub agent_score: f64,
    pub round: u32,
}

/// シリアライゼーションサービス
pub struct SerializationService;

/// シリアライゼーションエラー
#[derive(Debug, Clone, PartialEq)]
pub enum SerializationError {
    JsonError(String),
    CsvError(String),
    InvalidData,
}

impl AgentCsvData {
    /// エージェントから作成
    pub fn from_agent(agent: &Agent) -> Self {
        Self {
            id: agent.id().value(),
            x: agent.position().x,
            y: agent.position().y,
            cooperation_tendency: agent.traits().cooperation_tendency(),
            aggression_level: agent.traits().aggression_level(),
            learning_ability: agent.traits().learning_ability(),
            movement_tendency: agent.traits().movement_tendency(),
            score: agent.state().score(),
            energy: agent.state().energy(),
            age: agent.state().age(),
            battles_fought: agent.state().battles_fought(),
            fitness: agent.fitness(),
            is_alive: agent.is_alive(),
        }
    }
}

impl SerializationService {
    /// エージェントをJSONにシリアライズ
    pub fn agents_to_json(agents: &HashMap<AgentId, Agent>) -> Result<String, SerializationError> {
        serde_json::to_string_pretty(agents)
            .map_err(|e| SerializationError::JsonError(e.to_string()))
    }

    /// JSONからエージェントをデシリアライズ
    pub fn agents_from_json(json: &str) -> Result<HashMap<AgentId, Agent>, SerializationError> {
        serde_json::from_str(json)
            .map_err(|e| SerializationError::JsonError(e.to_string()))
    }

    /// シミュレーション結果をJSONにシリアライズ
    pub fn simulation_result_to_json(result: &SimulationResult) -> Result<String, SerializationError> {
        serde_json::to_string_pretty(result)
            .map_err(|e| SerializationError::JsonError(e.to_string()))
    }

    /// シミュレーション設定をJSONにシリアライズ
    pub fn config_to_json(config: &SimulationConfig) -> Result<String, SerializationError> {
        serde_json::to_string_pretty(config)
            .map_err(|e| SerializationError::JsonError(e.to_string()))
    }

    /// JSONからシミュレーション設定をデシリアライズ
    pub fn config_from_json(json: &str) -> Result<SimulationConfig, SerializationError> {
        serde_json::from_str(json)
            .map_err(|e| SerializationError::JsonError(e.to_string()))
    }

    /// エージェントをCSV形式に変換
    pub fn agents_to_csv(agents: &HashMap<AgentId, Agent>) -> Result<String, SerializationError> {
        let mut csv_content = String::new();
        csv_content.push_str("id,x,y,cooperation_tendency,aggression_level,learning_ability,movement_tendency,score,energy,age,battles_fought,fitness,is_alive\n");
        
        for agent in agents.values() {
            csv_content.push_str(&format!(
                "{},{},{},{},{},{},{},{},{},{},{},{},{}\n",
                agent.id().value(),
                agent.position().x,
                agent.position().y,
                agent.traits().cooperation_tendency(),
                agent.traits().aggression_level(),
                agent.traits().learning_ability(),
                agent.traits().movement_tendency(),
                agent.state().score(),
                agent.state().energy(),
                agent.state().age(),
                agent.state().battles_fought(),
                agent.fitness(),
                agent.is_alive()
            ));
        }
        
        Ok(csv_content)
    }

    /// 統計履歴をCSV形式に変換
    pub fn stats_history_to_csv(stats_history: &[SimulationStats]) -> Result<String, SerializationError> {
        let mut csv_content = String::new();
        csv_content.push_str("generation,population,average_score,max_score,min_score,average_cooperation,total_battles\n");
        
        for stats in stats_history {
            csv_content.push_str(&format!(
                "{},{},{},{},{},{},{}\n",
                stats.generation,
                stats.population,
                stats.average_score,
                stats.max_score,
                stats.min_score,
                stats.average_cooperation,
                stats.total_battles
            ));
        }
        
        Ok(csv_content)
    }

    /// 戦闘履歴をCSV形式に変換
    pub fn battle_history_to_csv(history: &BattleHistoryResult) -> Result<String, SerializationError> {
        let mut csv_content = String::new();
        csv_content.push_str("agent_id,opponent_id,agent_cooperated,opponent_cooperated,agent_score,round\n");
        
        for battle in &history.battles {
            csv_content.push_str(&format!(
                "{},{},{},{},{},{}\n",
                battle.opponent_id.value(),
                battle.opponent_id.value(),
                battle.agent_cooperated,
                battle.opponent_cooperated,
                battle.agent_score,
                battle.round
            ));
        }
        
        Ok(csv_content)
    }

    /// バイナリ形式でエージェントをシリアライズ (簡易実装)
    pub fn agents_to_binary(agents: &HashMap<AgentId, Agent>) -> Result<Vec<u8>, SerializationError> {
        // 簡易実装: JSONをバイトに変換
        let json = Self::agents_to_json(agents)?;
        Ok(json.into_bytes())
    }

    /// バイナリ形式からエージェントをデシリアライズ (簡易実装)
    pub fn agents_from_binary(data: &[u8]) -> Result<HashMap<AgentId, Agent>, SerializationError> {
        // 簡易実装: バイトからJSONに変換
        let json = String::from_utf8(data.to_vec())
            .map_err(|_| SerializationError::JsonError("UTF-8 conversion error".to_string()))?;
        Self::agents_from_json(&json)
    }

    /// 進化統計をJSON形式に変換
    pub fn evolution_stats_to_json(stats: &EvolutionStatistics) -> Result<String, SerializationError> {
        serde_json::to_string_pretty(stats)
            .map_err(|e| SerializationError::JsonError(e.to_string()))
    }

    /// プリティプリント形式でシミュレーション結果を文字列に変換
    pub fn simulation_result_to_pretty_string(result: &SimulationResult) -> String {
        let mut output = String::new();
        
        output.push_str(&format!("=== Simulation Result ===\n"));
        output.push_str(&format!("Final Generation: {}\n", result.final_stats.generation));
        output.push_str(&format!("Final Population: {}\n", result.final_stats.population));
        output.push_str(&format!("Average Score: {:.2}\n", result.final_stats.average_score));
        output.push_str(&format!("Max Score: {:.2}\n", result.final_stats.max_score));
        output.push_str(&format!("Min Score: {:.2}\n", result.final_stats.min_score));
        output.push_str(&format!("Average Cooperation: {:.2}\n", result.final_stats.average_cooperation));
        output.push_str(&format!("Total Battles: {}\n", result.final_stats.total_battles));
        
        output.push_str(&format!("\n=== Generation History ===\n"));
        for (i, stats) in result.generation_history.iter().enumerate() {
            output.push_str(&format!("Gen {}: Pop={}, Avg Score={:.2}, Cooperation={:.2}\n",
                i, stats.population, stats.average_score, stats.average_cooperation));
        }
        
        output.push_str(&format!("\n=== Final Agents ===\n"));
        output.push_str(&format!("Total: {} agents\n", result.final_agents.len()));
        
        // 上位5エージェントの詳細
        let mut sorted_agents = result.final_agents.clone();
        sorted_agents.sort_by(|a, b| b.fitness().partial_cmp(&a.fitness()).unwrap());
        
        output.push_str(&format!("Top 5 Agents:\n"));
        for (i, agent) in sorted_agents.iter().take(5).enumerate() {
            output.push_str(&format!("  {}: ID={}, Fitness={:.2}, Cooperation={:.2}, Score={:.2}\n",
                i + 1, agent.id().value(), agent.fitness(), 
                agent.traits().cooperation_tendency(), agent.state().score()));
        }
        
        output
    }
}

impl std::fmt::Display for SerializationError {
    fn fmt(&self, f: &mut std::fmt::Formatter<'_>) -> std::fmt::Result {
        match self {
            SerializationError::JsonError(msg) => write!(f, "JSON error: {}", msg),
            SerializationError::CsvError(msg) => write!(f, "CSV error: {}", msg),
            SerializationError::InvalidData => write!(f, "Invalid data"),
        }
    }
}

impl std::error::Error for SerializationError {}

#[cfg(test)]
mod tests {
    use super::*;
    use crate::domain::{Agent, AgentTraits, Position, WorldSize, EvolutionConfig, SelectionMethod, CrossoverMethod};

    fn create_test_agent(id: u64) -> Agent {
        let agent_id = AgentId::new(id);
        let position = Position::new(5, 10);
        let traits = AgentTraits::new(0.7, 0.3, 0.8, 0.4).unwrap();
        let mut agent = Agent::new(agent_id, position, traits);
        agent.add_score(25.0);
        agent
    }

    fn create_test_agents() -> HashMap<AgentId, Agent> {
        let mut agents = HashMap::new();
        for i in 1..=3 {
            let agent = create_test_agent(i);
            agents.insert(agent.id(), agent);
        }
        agents
    }

    fn create_test_config() -> SimulationConfig {
        SimulationConfig::new(
            WorldSize::new(10, 10).unwrap(),
            20,
            100,
            50,
            2,
            EvolutionConfig::new(0.1, 0.05, 0.1, SelectionMethod::Tournament, CrossoverMethod::Uniform),
        )
    }

    #[test]
    fn test_agents_to_json() {
        let agents = create_test_agents();
        let json = SerializationService::agents_to_json(&agents).unwrap();
        
        assert!(json.contains("1")); // AgentIdの値
        assert!(json.contains("cooperation_tendency"));
        assert!(json.contains("0.7"));
    }

    #[test]
    fn test_agents_json_roundtrip() {
        let agents = create_test_agents();
        let json = SerializationService::agents_to_json(&agents).unwrap();
        let restored_agents = SerializationService::agents_from_json(&json).unwrap();
        
        assert_eq!(agents.len(), restored_agents.len());
        
        for (id, agent) in &agents {
            let restored = restored_agents.get(id).unwrap();
            assert_eq!(agent.id(), restored.id());
            assert_eq!(agent.position(), restored.position());
            assert_eq!(agent.traits().cooperation_tendency(), restored.traits().cooperation_tendency());
        }
    }

    #[test]
    fn test_config_json_roundtrip() {
        let config = create_test_config();
        let json = SerializationService::config_to_json(&config).unwrap();
        let restored_config = SerializationService::config_from_json(&json).unwrap();
        
        assert_eq!(config.initial_population, restored_config.initial_population);
        assert_eq!(config.max_generations, restored_config.max_generations);
    }

    #[test]
    fn test_agents_to_csv() {
        let agents = create_test_agents();
        let csv = SerializationService::agents_to_csv(&agents).unwrap();
        
        assert!(csv.contains("id,x,y,cooperation_tendency"));
        assert!(csv.contains("5,10,0.7"));
        assert!(csv.contains("25")); // score
    }

    #[test]
    fn test_stats_history_to_csv() {
        let stats1 = SimulationStats {
            generation: 0,
            population: 100,
            average_score: 25.5,
            max_score: 50.0,
            min_score: 10.0,
            average_cooperation: 0.6,
            total_battles: 500,
        };
        
        let stats2 = SimulationStats {
            generation: 1,
            population: 100,
            average_score: 30.0,
            max_score: 55.0,
            min_score: 15.0,
            average_cooperation: 0.65,
            total_battles: 1000,
        };
        
        let history = vec![stats1, stats2];
        let csv = SerializationService::stats_history_to_csv(&history).unwrap();
        
        assert!(csv.contains("generation,population,average_score"));
        assert!(csv.contains("0,100,25.5"));
        assert!(csv.contains("1,100,30"));
    }

    #[test]
    fn test_agents_binary_roundtrip() {
        let agents = create_test_agents();
        let binary = SerializationService::agents_to_binary(&agents).unwrap();
        let restored_agents = SerializationService::agents_from_binary(&binary).unwrap();
        
        assert_eq!(agents.len(), restored_agents.len());
        
        for (id, agent) in &agents {
            let restored = restored_agents.get(id).unwrap();
            assert_eq!(agent.id(), restored.id());
            assert_eq!(agent.state().score(), restored.state().score());
        }
    }

    #[test]
    fn test_evolution_stats_to_json() {
        let stats = EvolutionStatistics {
            original_population: 100,
            new_population: 100,
            elite_count: 10,
            average_fitness: 45.5,
            max_fitness: 80.0,
            min_fitness: 20.0,
            average_cooperation: 0.65,
            average_aggression: 0.35,
            average_learning: 0.7,
            average_movement: 0.4,
        };
        
        let json = SerializationService::evolution_stats_to_json(&stats).unwrap();
        
        assert!(json.contains("original_population"));
        assert!(json.contains("100"));
        assert!(json.contains("45.5"));
    }

    #[test]
    fn test_simulation_result_to_pretty_string() {
        let final_stats = SimulationStats {
            generation: 10,
            population: 95,
            average_score: 42.5,
            max_score: 75.0,
            min_score: 15.0,
            average_cooperation: 0.68,
            total_battles: 5000,
        };
        
        let result = SimulationResult {
            final_stats,
            generation_history: vec![],
            final_agents: create_test_agents().into_values().collect(),
        };
        
        let pretty = SerializationService::simulation_result_to_pretty_string(&result);
        
        assert!(pretty.contains("=== Simulation Result ==="));
        assert!(pretty.contains("Final Generation: 10"));
        assert!(pretty.contains("Average Score: 42.50"));
        assert!(pretty.contains("=== Final Agents ==="));
        assert!(pretty.contains("Total: 3 agents"));
    }

    #[test]
    fn test_invalid_json() {
        let invalid_json = "{ invalid json }";
        let result = SerializationService::agents_from_json(invalid_json);
        
        assert!(result.is_err());
        assert!(matches!(result.unwrap_err(), SerializationError::JsonError(_)));
    }

    #[test]
    fn test_agent_csv_data_creation() {
        let agent = create_test_agent(1);
        let csv_data = AgentCsvData {
            id: agent.id().value(),
            x: agent.position().x,
            y: agent.position().y,
            cooperation_tendency: agent.traits().cooperation_tendency(),
            aggression_level: agent.traits().aggression_level(),
            learning_ability: agent.traits().learning_ability(),
            movement_tendency: agent.traits().movement_tendency(),
            score: agent.state().score(),
            energy: agent.state().energy(),
            age: agent.state().age(),
            battles_fought: agent.state().battles_fought(),
            fitness: agent.fitness(),
            is_alive: agent.is_alive(),
        };
        
        assert_eq!(csv_data.id, 1);
        assert_eq!(csv_data.x, 5);
        assert_eq!(csv_data.y, 10);
        assert_eq!(csv_data.cooperation_tendency, 0.7);
        assert_eq!(csv_data.score, 25.0);
        assert!(csv_data.is_alive);
    }
}