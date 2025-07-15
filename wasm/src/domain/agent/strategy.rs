use rand::Rng;
use serde::{Deserialize, Serialize};

#[derive(Debug, Clone, Copy, PartialEq, Eq, Hash, Serialize, Deserialize)]
pub enum StrategyType {
    AllCooperate,
    AllDefect,
    TitForTat,
    Pavlov,
}

impl StrategyType {
    pub fn random() -> Self {
        let mut rng = rand::thread_rng();
        match rng.gen_range(0..4) {
            0 => StrategyType::AllCooperate,
            1 => StrategyType::AllDefect,
            2 => StrategyType::TitForTat,
            _ => StrategyType::Pavlov,
        }
    }

    pub fn decide_action(
        &self,
        last_opponent_action: Option<Action>,
        last_my_action: Option<Action>,
        last_payoff: Option<i32>,
    ) -> Action {
        match self {
            StrategyType::AllCooperate => Action::Cooperate,
            StrategyType::AllDefect => Action::Defect,
            StrategyType::TitForTat => {
                match last_opponent_action {
                    Some(action) => action,
                    None => Action::Cooperate, // 初回は協力
                }
            }
            StrategyType::Pavlov => {
                match (last_my_action, last_payoff) {
                    (Some(action), Some(payoff)) => {
                        if payoff >= 3 {
                            // 勝利または相互協力
                            action // 同じ行動を継続
                        } else {
                            action.opposite() // 逆の行動
                        }
                    }
                    _ => Action::Cooperate, // 初回は協力
                }
            }
        }
    }
}

#[derive(Debug, Clone, Copy, PartialEq, Eq, Serialize, Deserialize)]
pub enum Action {
    Cooperate,
    Defect,
}

impl Action {
    pub fn opposite(&self) -> Self {
        match self {
            Action::Cooperate => Action::Defect,
            Action::Defect => Action::Cooperate,
        }
    }
}

#[cfg(test)]
mod tests {
    use super::*;

    #[test]
    fn test_action_opposite() {
        // Arrange & Act & Assert
        assert_eq!(Action::Cooperate.opposite(), Action::Defect);
        assert_eq!(Action::Defect.opposite(), Action::Cooperate);
    }

    #[test]
    fn test_all_cooperate_strategy() {
        // Arrange
        let strategy = StrategyType::AllCooperate;

        // Act & Assert: 常に協力を選択
        assert_eq!(strategy.decide_action(None, None, None), Action::Cooperate);
        assert_eq!(
            strategy.decide_action(Some(Action::Defect), Some(Action::Defect), Some(0)),
            Action::Cooperate
        );
    }

    #[test]
    fn test_all_defect_strategy() {
        // Arrange
        let strategy = StrategyType::AllDefect;

        // Act & Assert: 常に裏切りを選択
        assert_eq!(strategy.decide_action(None, None, None), Action::Defect);
        assert_eq!(
            strategy.decide_action(Some(Action::Cooperate), Some(Action::Cooperate), Some(3)),
            Action::Defect
        );
    }

    #[test]
    fn test_tit_for_tat_strategy() {
        // Arrange
        let strategy = StrategyType::TitForTat;

        // Act & Assert: 初回は協力、その後は相手の前回行動をミラー
        assert_eq!(strategy.decide_action(None, None, None), Action::Cooperate);
        assert_eq!(
            strategy.decide_action(Some(Action::Cooperate), Some(Action::Cooperate), Some(3)),
            Action::Cooperate
        );
        assert_eq!(
            strategy.decide_action(Some(Action::Defect), Some(Action::Cooperate), Some(0)),
            Action::Defect
        );
    }

    #[test]
    fn test_pavlov_strategy() {
        // Arrange
        let strategy = StrategyType::Pavlov;

        // Act & Assert: 初回は協力、その後はwin-stay-lose-shift
        assert_eq!(strategy.decide_action(None, None, None), Action::Cooperate);

        // Win-stay: スコア3以上は同じ行動を継続
        assert_eq!(
            strategy.decide_action(Some(Action::Cooperate), Some(Action::Cooperate), Some(3)),
            Action::Cooperate
        );
        assert_eq!(
            strategy.decide_action(Some(Action::Cooperate), Some(Action::Defect), Some(5)),
            Action::Defect
        );

        // Lose-shift: スコア2以下は反対の行動に変更
        assert_eq!(
            strategy.decide_action(Some(Action::Defect), Some(Action::Cooperate), Some(0)),
            Action::Defect
        );
        assert_eq!(
            strategy.decide_action(Some(Action::Defect), Some(Action::Defect), Some(1)),
            Action::Cooperate
        );
    }

    #[test]
    fn test_strategy_type_random_returns_valid_strategy() {
        // Arrange & Act
        let strategy = StrategyType::random();

        // Assert: 有効な戦略タイプの一つが返される
        assert!(matches!(
            strategy,
            StrategyType::AllCooperate
                | StrategyType::AllDefect
                | StrategyType::TitForTat
                | StrategyType::Pavlov
        ));
    }
}
