#[derive(Clone)]
pub struct Agent {
    pub x: usize,
    pub y: usize,
    pub cooperation_rate: f64,
    pub movement_rate: f64,
    pub score: f64,
}

impl Agent {
    pub fn new(x: usize, y: usize, cooperation_rate: f64, movement_rate: f64) -> Self {
        Agent {
            x,
            y,
            cooperation_rate,
            movement_rate,
            score: 0.0,
        }
    }
    
    pub fn decides_to_cooperate(&self) -> bool {
        use rand::Rng;
        let mut rng = rand::thread_rng();
        rng.gen::<f64>() < self.cooperation_rate
    }
    
    pub fn update_score(&mut self, points: f64) {
        self.score += points;
    }
    
    pub fn decides_to_move(&self) -> bool {
        use rand::Rng;
        let mut rng = rand::thread_rng();
        rng.gen::<f64>() < self.movement_rate
    }
    
    pub fn move_to(&mut self, new_x: usize, new_y: usize) {
        self.x = new_x;
        self.y = new_y;
    }
}

#[cfg(test)]
mod tests {
    use super::*;

    #[test]
    fn test_agent_creation() {
        let agent = Agent::new(5, 10, 0.7, 0.3);
        
        assert_eq!(agent.x, 5);
        assert_eq!(agent.y, 10);
        assert_eq!(agent.cooperation_rate, 0.7);
        assert_eq!(agent.movement_rate, 0.3);
        assert_eq!(agent.score, 0.0);
    }

    #[test]
    fn test_agent_decides_cooperation() {
        let agent = Agent::new(0, 0, 1.0, 0.0); // 常に協力
        assert!(agent.decides_to_cooperate());
        
        let agent = Agent::new(0, 0, 0.0, 0.0); // 常に裏切り
        assert!(!agent.decides_to_cooperate());
    }

    #[test]
    fn test_agent_update_score() {
        let mut agent = Agent::new(0, 0, 0.5, 0.5);
        assert_eq!(agent.score, 0.0);
        
        agent.update_score(5.0);
        assert_eq!(agent.score, 5.0);
        
        agent.update_score(3.0);
        assert_eq!(agent.score, 8.0);
    }

    #[test]
    fn test_agent_decides_to_move() {
        let agent = Agent::new(0, 0, 0.5, 1.0); // 常に移動
        assert!(agent.decides_to_move());
        
        let agent = Agent::new(0, 0, 0.5, 0.0); // 常に移動しない
        assert!(!agent.decides_to_move());
    }

    #[test]
    fn test_agent_move_to() {
        let mut agent = Agent::new(5, 5, 0.5, 0.5);
        assert_eq!(agent.x, 5);
        assert_eq!(agent.y, 5);
        
        agent.move_to(10, 15);
        assert_eq!(agent.x, 10);
        assert_eq!(agent.y, 15);
    }
}