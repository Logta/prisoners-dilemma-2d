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
}