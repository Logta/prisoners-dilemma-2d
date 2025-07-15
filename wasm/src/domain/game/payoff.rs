use crate::domain::agent::Action;

pub struct PayoffMatrix;

impl PayoffMatrix {
    pub fn calculate(my_action: Action, opponent_action: Action) -> (i32, i32) {
        match (my_action, opponent_action) {
            (Action::Cooperate, Action::Cooperate) => (3, 3),
            (Action::Cooperate, Action::Defect) => (0, 5),
            (Action::Defect, Action::Cooperate) => (5, 0),
            (Action::Defect, Action::Defect) => (1, 1),
        }
    }
}

#[cfg(test)]
mod tests {
    use super::*;

    #[test]
    fn test_cooperate_vs_cooperate() {
        // Arrange
        let my_action = Action::Cooperate;
        let opponent_action = Action::Cooperate;
        
        // Act
        let (my_payoff, opponent_payoff) = PayoffMatrix::calculate(my_action, opponent_action);
        
        // Assert
        assert_eq!(my_payoff, 3);
        assert_eq!(opponent_payoff, 3);
    }

    #[test]
    fn test_cooperate_vs_defect() {
        // Arrange
        let my_action = Action::Cooperate;
        let opponent_action = Action::Defect;
        
        // Act
        let (my_payoff, opponent_payoff) = PayoffMatrix::calculate(my_action, opponent_action);
        
        // Assert
        assert_eq!(my_payoff, 0);
        assert_eq!(opponent_payoff, 5);
    }

    #[test]
    fn test_defect_vs_cooperate() {
        // Arrange
        let my_action = Action::Defect;
        let opponent_action = Action::Cooperate;
        
        // Act
        let (my_payoff, opponent_payoff) = PayoffMatrix::calculate(my_action, opponent_action);
        
        // Assert
        assert_eq!(my_payoff, 5);
        assert_eq!(opponent_payoff, 0);
    }

    #[test]
    fn test_defect_vs_defect() {
        // Arrange
        let my_action = Action::Defect;
        let opponent_action = Action::Defect;
        
        // Act
        let (my_payoff, opponent_payoff) = PayoffMatrix::calculate(my_action, opponent_action);
        
        // Assert
        assert_eq!(my_payoff, 1);
        assert_eq!(opponent_payoff, 1);
    }
}
