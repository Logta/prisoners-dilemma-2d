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