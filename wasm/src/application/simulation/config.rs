pub struct SimulationConfig {
    pub strategy_complexity_penalty_enabled: bool,
    pub strategy_complexity_penalty_rate: f32,
}

impl Default for SimulationConfig {
    fn default() -> Self {
        Self {
            strategy_complexity_penalty_enabled: false,
            strategy_complexity_penalty_rate: 0.15, // 15% penalty by default
        }
    }
}

impl SimulationConfig {
    pub fn new() -> Self {
        Self::default()
    }

    pub fn with_strategy_complexity_penalty(mut self, enabled: bool) -> Self {
        self.strategy_complexity_penalty_enabled = enabled;
        self
    }

    pub fn with_penalty_rate(mut self, rate: f32) -> Self {
        self.strategy_complexity_penalty_rate = rate.clamp(0.0, 1.0);
        self
    }
}