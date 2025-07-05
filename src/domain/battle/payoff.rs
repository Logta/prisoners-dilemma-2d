// ========================================
// Payoff Matrix - 囚人のジレンマの利得マトリクス
// ========================================

use serde::{Deserialize, Serialize};

/// 囚人のジレンマの利得マトリクス
#[derive(Debug, Clone, Copy, PartialEq, Serialize, Deserialize)]
pub struct PayoffMatrix {
    mutual_cooperation: f64,    // 相互協力時の利得
    mutual_defection: f64,      // 相互裏切り時の利得
    cooperation_exploited: f64, // 自分協力、相手裏切り時の利得
    defection_advantage: f64,   // 自分裏切り、相手協力時の利得
}

/// 戦闘結果
#[derive(Debug, Clone, Copy, PartialEq, Serialize, Deserialize)]
pub struct BattleOutcome {
    pub agent1_score: f64,
    pub agent2_score: f64,
    pub agent1_cooperated: bool,
    pub agent2_cooperated: bool,
}

impl PayoffMatrix {
    /// 標準的な囚人のジレンマのマトリクスを作成
    pub fn standard() -> Self {
        Self {
            mutual_cooperation: 3.0,
            mutual_defection: 1.0,
            cooperation_exploited: 0.0,
            defection_advantage: 5.0,
        }
    }

    /// カスタムマトリクスを作成
    pub fn new(
        mutual_cooperation: f64,
        mutual_defection: f64,
        cooperation_exploited: f64,
        defection_advantage: f64,
    ) -> Self {
        Self {
            mutual_cooperation,
            mutual_defection,
            cooperation_exploited,
            defection_advantage,
        }
    }

    /// 戦闘結果を計算
    pub fn calculate_outcome(&self, agent1_cooperates: bool, agent2_cooperates: bool) -> BattleOutcome {
        let (agent1_score, agent2_score) = match (agent1_cooperates, agent2_cooperates) {
            (true, true) => (self.mutual_cooperation, self.mutual_cooperation),
            (false, false) => (self.mutual_defection, self.mutual_defection),
            (true, false) => (self.cooperation_exploited, self.defection_advantage),
            (false, true) => (self.defection_advantage, self.cooperation_exploited),
        };

        BattleOutcome {
            agent1_score,
            agent2_score,
            agent1_cooperated: agent1_cooperates,
            agent2_cooperated: agent2_cooperates,
        }
    }

    /// ゲッター
    pub fn mutual_cooperation(&self) -> f64 { self.mutual_cooperation }
    pub fn mutual_defection(&self) -> f64 { self.mutual_defection }
    pub fn cooperation_exploited(&self) -> f64 { self.cooperation_exploited }
    pub fn defection_advantage(&self) -> f64 { self.defection_advantage }
}

#[cfg(test)]
mod tests {
    use super::*;

    #[test]
    fn test_payoff_matrix_standard() {
        let matrix = PayoffMatrix::standard();
        
        assert_eq!(matrix.mutual_cooperation(), 3.0);
        assert_eq!(matrix.mutual_defection(), 1.0);
        assert_eq!(matrix.cooperation_exploited(), 0.0);
        assert_eq!(matrix.defection_advantage(), 5.0);
    }

    #[test]
    fn test_payoff_matrix_custom() {
        let matrix = PayoffMatrix::new(2.0, 0.5, -1.0, 4.0);
        
        assert_eq!(matrix.mutual_cooperation(), 2.0);
        assert_eq!(matrix.mutual_defection(), 0.5);
        assert_eq!(matrix.cooperation_exploited(), -1.0);
        assert_eq!(matrix.defection_advantage(), 4.0);
    }

    #[test]
    fn test_battle_outcome_mutual_cooperation() {
        let matrix = PayoffMatrix::standard();
        let outcome = matrix.calculate_outcome(true, true);
        
        assert_eq!(outcome.agent1_score, 3.0);
        assert_eq!(outcome.agent2_score, 3.0);
        assert!(outcome.agent1_cooperated);
        assert!(outcome.agent2_cooperated);
    }

    #[test]
    fn test_battle_outcome_mutual_defection() {
        let matrix = PayoffMatrix::standard();
        let outcome = matrix.calculate_outcome(false, false);
        
        assert_eq!(outcome.agent1_score, 1.0);
        assert_eq!(outcome.agent2_score, 1.0);
        assert!(!outcome.agent1_cooperated);
        assert!(!outcome.agent2_cooperated);
    }

    #[test]
    fn test_battle_outcome_agent1_exploited() {
        let matrix = PayoffMatrix::standard();
        let outcome = matrix.calculate_outcome(true, false);
        
        assert_eq!(outcome.agent1_score, 0.0);
        assert_eq!(outcome.agent2_score, 5.0);
        assert!(outcome.agent1_cooperated);
        assert!(!outcome.agent2_cooperated);
    }

    #[test]
    fn test_battle_outcome_agent2_exploited() {
        let matrix = PayoffMatrix::standard();
        let outcome = matrix.calculate_outcome(false, true);
        
        assert_eq!(outcome.agent1_score, 5.0);
        assert_eq!(outcome.agent2_score, 0.0);
        assert!(!outcome.agent1_cooperated);
        assert!(outcome.agent2_cooperated);
    }
}