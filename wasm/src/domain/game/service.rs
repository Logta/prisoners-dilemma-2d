use super::PayoffMatrix;
use crate::domain::agent::{Action, Agent};

pub struct GameService;

impl GameService {
    pub fn play_game(agent1: &mut Agent, agent2: &mut Agent) -> (Action, Action) {
        let action1 = agent1.decide_action(&agent2.id);
        let action2 = agent2.decide_action(&agent1.id);

        let (payoff1, payoff2) = PayoffMatrix::calculate(action1, action2);

        agent1.add_game_result(agent2.id, action1, action2, payoff1);
        agent2.add_game_result(agent1.id, action2, action1, payoff2);

        (action1, action2)
    }
}
