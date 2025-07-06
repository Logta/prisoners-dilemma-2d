// ========================================
// Agent Strategy - エージェントの戦略システム
// ========================================

use serde::{Deserialize, Serialize};
use std::collections::HashMap;
use crate::domain::shared::AgentId;

/// エージェントの戦略タイプ
#[derive(Debug, Clone, Copy, PartialEq, Eq, Hash, Serialize, Deserialize)]
pub enum StrategyType {
    AlwaysCooperate,    // 常に協力
    AlwaysDefect,       // 常に裏切り
    TitForTat,          // しっぺ返し
    Pavlov,             // パブロフ戦略（Win-Stay, Lose-Shift）
    Random,             // ランダム
    ReputationBased,    // 評判ベース
}

/// 戦略の遺伝的エンコーディング
#[derive(Debug, Clone, Copy, PartialEq, Serialize, Deserialize)]
pub struct StrategyGenes {
    /// 戦略選択の遺伝子（0.0-1.0）
    strategy_gene: f64,
    /// 戦略の強度/純度（0.0-1.0）
    strategy_strength: f64,
    /// 学習適応性（0.0-1.0）
    adaptability: f64,
    /// 記憶容量（0.0-1.0）
    memory_capacity: f64,
}

/// エージェントの戦略状態
#[derive(Debug, Clone, PartialEq, Serialize, Deserialize)]
pub struct StrategyState {
    /// 現在の戦略
    current_strategy: StrategyType,
    /// 相手ごとの過去の行動記録
    interaction_history: HashMap<AgentId, Vec<InteractionRecord>>,
    /// 相手の評判スコア
    reputation_scores: HashMap<AgentId, f64>,
    /// 戦略の遺伝子情報
    genes: StrategyGenes,
}

/// 相互作用の記録
#[derive(Debug, Clone, Copy, PartialEq, Serialize, Deserialize)]
pub struct InteractionRecord {
    /// 自分の行動
    my_action: bool,
    /// 相手の行動
    opponent_action: bool,
    /// 結果のスコア
    outcome_score: f64,
}

impl StrategyType {
    /// 戦略の説明を取得
    pub fn description(&self) -> &'static str {
        match self {
            StrategyType::AlwaysCooperate => "常に協力",
            StrategyType::AlwaysDefect => "常に裏切り",
            StrategyType::TitForTat => "しっぺ返し",
            StrategyType::Pavlov => "パブロフ戦略",
            StrategyType::Random => "ランダム",
            StrategyType::ReputationBased => "評判ベース",
        }
    }

    /// 基本的な協力確率を取得
    pub fn base_cooperation_probability(&self) -> f64 {
        match self {
            StrategyType::AlwaysCooperate => 1.0,
            StrategyType::AlwaysDefect => 0.0,
            StrategyType::TitForTat => 0.5,
            StrategyType::Pavlov => 0.5,
            StrategyType::Random => 0.5,
            StrategyType::ReputationBased => 0.6,
        }
    }
}

impl StrategyGenes {
    /// 新しい戦略遺伝子を作成
    pub fn new(strategy_gene: f64, strategy_strength: f64, adaptability: f64, memory_capacity: f64) -> Self {
        Self {
            strategy_gene: strategy_gene.clamp(0.0, 1.0),
            strategy_strength: strategy_strength.clamp(0.0, 1.0),
            adaptability: adaptability.clamp(0.0, 1.0),
            memory_capacity: memory_capacity.clamp(0.0, 1.0),
        }
    }

    /// ランダムな戦略遺伝子を生成
    pub fn random() -> Self {
        use rand::Rng;
        let mut rng = rand::thread_rng();
        
        Self {
            strategy_gene: rng.gen_range(0.0..=1.0),
            strategy_strength: rng.gen_range(0.0..=1.0),
            adaptability: rng.gen_range(0.0..=1.0),
            memory_capacity: rng.gen_range(0.0..=1.0),
        }
    }

    /// 遺伝子値から戦略タイプを決定
    pub fn determine_strategy(&self) -> StrategyType {
        let gene = self.strategy_gene;
        match gene {
            x if x < 0.16 => StrategyType::AlwaysCooperate,
            x if x < 0.33 => StrategyType::AlwaysDefect,
            x if x < 0.50 => StrategyType::TitForTat,
            x if x < 0.67 => StrategyType::Pavlov,
            x if x < 0.83 => StrategyType::Random,
            _ => StrategyType::ReputationBased,
        }
    }

    /// 戦略の純度（混合戦略の度合い）
    pub fn strategy_purity(&self) -> f64 {
        self.strategy_strength
    }

    /// 学習適応性
    pub fn adaptability(&self) -> f64 {
        self.adaptability
    }

    /// 記憶容量（保持する履歴の長さに影響）
    pub fn memory_capacity(&self) -> f64 {
        self.memory_capacity
    }

    /// 変異
    pub fn mutate(&mut self, mutation_rate: f64, mutation_strength: f64) {
        use rand::Rng;
        use rand_distr::{Distribution, Normal};
        
        let mut rng = rand::thread_rng();
        let normal = Normal::new(0.0, mutation_strength).unwrap();

        if rng.gen_bool(mutation_rate) {
            self.strategy_gene = (self.strategy_gene + normal.sample(&mut rng)).clamp(0.0, 1.0);
        }
        if rng.gen_bool(mutation_rate) {
            self.strategy_strength = (self.strategy_strength + normal.sample(&mut rng)).clamp(0.0, 1.0);
        }
        if rng.gen_bool(mutation_rate) {
            self.adaptability = (self.adaptability + normal.sample(&mut rng)).clamp(0.0, 1.0);
        }
        if rng.gen_bool(mutation_rate) {
            self.memory_capacity = (self.memory_capacity + normal.sample(&mut rng)).clamp(0.0, 1.0);
        }
    }

    /// 交叉
    pub fn crossover(&self, other: &StrategyGenes) -> (StrategyGenes, StrategyGenes) {
        use rand::Rng;
        let mut rng = rand::thread_rng();

        let child1 = StrategyGenes {
            strategy_gene: if rng.gen_bool(0.5) { self.strategy_gene } else { other.strategy_gene },
            strategy_strength: if rng.gen_bool(0.5) { self.strategy_strength } else { other.strategy_strength },
            adaptability: if rng.gen_bool(0.5) { self.adaptability } else { other.adaptability },
            memory_capacity: if rng.gen_bool(0.5) { self.memory_capacity } else { other.memory_capacity },
        };

        let child2 = StrategyGenes {
            strategy_gene: if child1.strategy_gene == self.strategy_gene { other.strategy_gene } else { self.strategy_gene },
            strategy_strength: if child1.strategy_strength == self.strategy_strength { other.strategy_strength } else { self.strategy_strength },
            adaptability: if child1.adaptability == self.adaptability { other.adaptability } else { self.adaptability },
            memory_capacity: if child1.memory_capacity == self.memory_capacity { other.memory_capacity } else { self.memory_capacity },
        };

        (child1, child2)
    }
}

impl StrategyState {
    /// 新しい戦略状態を作成
    pub fn new(genes: StrategyGenes) -> Self {
        let current_strategy = genes.determine_strategy();
        
        Self {
            current_strategy,
            interaction_history: HashMap::new(),
            reputation_scores: HashMap::new(),
            genes,
        }
    }

    /// ランダムな戦略状態を作成
    pub fn random() -> Self {
        Self::new(StrategyGenes::random())
    }

    /// 現在の戦略を取得
    pub fn current_strategy(&self) -> StrategyType {
        self.current_strategy
    }

    /// 戦略遺伝子を取得
    pub fn genes(&self) -> &StrategyGenes {
        &self.genes
    }

    /// 戦略遺伝子を可変取得
    pub fn genes_mut(&mut self) -> &mut StrategyGenes {
        &mut self.genes
    }

    /// 協力判定を行う
    pub fn decide_cooperation(&mut self, opponent_id: AgentId, base_cooperation_tendency: f64) -> bool {
        let strategy_decision = self.calculate_strategy_decision(opponent_id, base_cooperation_tendency);
        
        // 戦略の純度に基づいて混合戦略を適用
        let purity = self.genes.strategy_purity();
        let final_cooperation_prob = strategy_decision * purity + base_cooperation_tendency * (1.0 - purity);
        
        use rand::Rng;
        let mut rng = rand::thread_rng();
        rng.gen::<f64>() < final_cooperation_prob
    }

    /// 戦略に基づく協力判定
    fn calculate_strategy_decision(&self, opponent_id: AgentId, base_cooperation_tendency: f64) -> f64 {
        match self.current_strategy {
            StrategyType::AlwaysCooperate => 1.0,
            StrategyType::AlwaysDefect => 0.0,
            StrategyType::TitForTat => self.tit_for_tat_decision(opponent_id),
            StrategyType::Pavlov => self.pavlov_decision(opponent_id),
            StrategyType::Random => {
                use rand::Rng;
                let mut rng = rand::thread_rng();
                rng.gen::<f64>()
            },
            StrategyType::ReputationBased => self.reputation_based_decision(opponent_id, base_cooperation_tendency),
        }
    }

    /// Tit-for-Tat戦略の判定
    fn tit_for_tat_decision(&self, opponent_id: AgentId) -> f64 {
        if let Some(history) = self.interaction_history.get(&opponent_id) {
            if let Some(last_interaction) = history.last() {
                // 相手の最後の行動を模倣
                if last_interaction.opponent_action { 1.0 } else { 0.0 }
            } else {
                1.0 // 初回は協力
            }
        } else {
            1.0 // 初回は協力
        }
    }

    /// パブロフ戦略の判定（Win-Stay, Lose-Shift）
    fn pavlov_decision(&self, opponent_id: AgentId) -> f64 {
        if let Some(history) = self.interaction_history.get(&opponent_id) {
            if let Some(last_interaction) = history.last() {
                // 前回の結果が良ければ同じ行動、悪ければ変更
                if last_interaction.outcome_score > 0.0 {
                    if last_interaction.my_action { 1.0 } else { 0.0 }
                } else {
                    if last_interaction.my_action { 0.0 } else { 1.0 }
                }
            } else {
                1.0 // 初回は協力
            }
        } else {
            1.0 // 初回は協力
        }
    }

    /// 評判ベース戦略の判定
    fn reputation_based_decision(&self, opponent_id: AgentId, base_cooperation_tendency: f64) -> f64 {
        let reputation = self.reputation_scores.get(&opponent_id).copied().unwrap_or(0.5);
        
        // 評判スコアに基づいて協力確率を調整
        let reputation_factor = (reputation - 0.5) * 0.4; // -0.2 to 0.2
        (base_cooperation_tendency + reputation_factor).clamp(0.0, 1.0)
    }

    /// 相互作用の記録を追加
    pub fn record_interaction(&mut self, opponent_id: AgentId, my_action: bool, opponent_action: bool, outcome_score: f64) {
        let record = InteractionRecord {
            my_action,
            opponent_action,
            outcome_score,
        };

        // 記憶容量に基づいて履歴の長さを制限
        let max_history_length = (self.genes.memory_capacity() * 20.0) as usize + 1;
        
        let history = self.interaction_history.entry(opponent_id).or_insert_with(Vec::new);
        history.push(record);
        
        if history.len() > max_history_length {
            history.remove(0);
        }

        // 評判スコアを更新
        self.update_reputation(opponent_id, opponent_action, outcome_score);
    }

    /// 評判スコアを更新
    fn update_reputation(&mut self, opponent_id: AgentId, opponent_action: bool, outcome_score: f64) {
        let current_reputation = self.reputation_scores.get(&opponent_id).copied().unwrap_or(0.5);
        
        let reputation_change = if opponent_action {
            outcome_score * 0.1 // 協力行動による評判向上
        } else {
            -outcome_score * 0.1 // 裏切り行動による評判低下
        };

        let new_reputation = (current_reputation + reputation_change * self.genes.adaptability()).clamp(0.0, 1.0);
        self.reputation_scores.insert(opponent_id, new_reputation);
    }

    /// 戦略の学習と適応
    pub fn adapt_strategy(&mut self) {
        // 適応性が高い場合、過去の結果に基づいて戦略を微調整
        if self.genes.adaptability() > 0.7 {
            // 簡単な学習アルゴリズム：成功率に基づく調整
            let success_rate = self.calculate_average_success_rate();
            
            if success_rate < 0.3 {
                // 成功率が低い場合、戦略遺伝子を微調整
                use rand::Rng;
                let mut rng = rand::thread_rng();
                self.genes.strategy_gene = (self.genes.strategy_gene + rng.gen_range(-0.1..=0.1)).clamp(0.0, 1.0);
                self.current_strategy = self.genes.determine_strategy();
            }
        }
    }

    /// 平均成功率を計算
    fn calculate_average_success_rate(&self) -> f64 {
        let mut total_score = 0.0;
        let mut total_interactions = 0;

        for history in self.interaction_history.values() {
            for record in history {
                total_score += record.outcome_score;
                total_interactions += 1;
            }
        }

        if total_interactions > 0 {
            (total_score / total_interactions as f64).clamp(0.0, 1.0)
        } else {
            0.5
        }
    }
}

#[cfg(test)]
mod tests {
    use super::*;
    use crate::domain::shared::AgentId;

    #[test]
    fn test_strategy_genes_creation() {
        let genes = StrategyGenes::new(0.5, 0.8, 0.3, 0.7);
        assert_eq!(genes.strategy_gene, 0.5);
        assert_eq!(genes.strategy_strength, 0.8);
        assert_eq!(genes.adaptability, 0.3);
        assert_eq!(genes.memory_capacity, 0.7);
    }

    #[test]
    fn test_strategy_determination() {
        let genes = StrategyGenes::new(0.1, 0.5, 0.5, 0.5);
        assert_eq!(genes.determine_strategy(), StrategyType::AlwaysCooperate);
        
        let genes = StrategyGenes::new(0.9, 0.5, 0.5, 0.5);
        assert_eq!(genes.determine_strategy(), StrategyType::ReputationBased);
    }

    #[test]
    fn test_strategy_state_creation() {
        let genes = StrategyGenes::new(0.1, 0.5, 0.5, 0.5);
        let state = StrategyState::new(genes);
        assert_eq!(state.current_strategy(), StrategyType::AlwaysCooperate);
    }

    #[test]
    fn test_cooperation_decision() {
        let genes = StrategyGenes::new(0.1, 1.0, 0.5, 0.5); // AlwaysCooperate
        let mut state = StrategyState::new(genes);
        
        let opponent_id = AgentId::new(1);
        assert!(state.decide_cooperation(opponent_id, 0.5));
    }

    #[test]
    fn test_tit_for_tat_strategy() {
        let genes = StrategyGenes::new(0.4, 1.0, 0.5, 0.5); // TitForTat
        let mut state = StrategyState::new(genes);
        
        let opponent_id = AgentId::new(1);
        
        // 初回は協力
        assert!(state.decide_cooperation(opponent_id, 0.5));
        
        // 相手が裏切った場合の記録
        state.record_interaction(opponent_id, true, false, -1.0);
        
        // 次回は裏切り
        assert!(!state.decide_cooperation(opponent_id, 0.5));
    }

    #[test]
    fn test_interaction_recording() {
        let genes = StrategyGenes::new(0.5, 0.5, 0.5, 0.5);
        let mut state = StrategyState::new(genes);
        
        let opponent_id = AgentId::new(1);
        state.record_interaction(opponent_id, true, false, -1.0);
        
        assert!(state.interaction_history.contains_key(&opponent_id));
        assert_eq!(state.interaction_history[&opponent_id].len(), 1);
    }

    #[test]
    fn test_reputation_update() {
        let genes = StrategyGenes::new(0.9, 1.0, 0.8, 0.5); // ReputationBased
        let mut state = StrategyState::new(genes);
        
        let opponent_id = AgentId::new(1);
        
        // 相手が協力した場合
        state.record_interaction(opponent_id, true, true, 2.0);
        
        let reputation = state.reputation_scores.get(&opponent_id).copied().unwrap_or(0.5);
        assert!(reputation > 0.5);
    }
}