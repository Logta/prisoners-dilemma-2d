#[derive(Clone)]
pub struct PayoffMatrix {
    pub both_cooperate: (f64, f64),
    pub cooperate_defect: (f64, f64),
    pub defect_cooperate: (f64, f64),
    pub both_defect: (f64, f64),
}

impl Default for PayoffMatrix {
    fn default() -> Self {
        PayoffMatrix {
            both_cooperate: (3.0, 3.0),
            cooperate_defect: (0.0, 5.0),
            defect_cooperate: (5.0, 0.0),
            both_defect: (1.0, 1.0),
        }
    }
}

pub fn calculate_payoff(matrix: &PayoffMatrix, player1_cooperates: bool, player2_cooperates: bool) -> (f64, f64) {
    match (player1_cooperates, player2_cooperates) {
        (true, true) => matrix.both_cooperate,
        (true, false) => matrix.cooperate_defect,
        (false, true) => matrix.defect_cooperate,
        (false, false) => matrix.both_defect,
    }
}

#[cfg(test)]
mod tests {
    use super::*;

    #[test]
    fn test_payoff_matrix_default() {
        let matrix = PayoffMatrix::default();
        
        assert_eq!(matrix.both_cooperate, (3.0, 3.0));
        assert_eq!(matrix.cooperate_defect, (0.0, 5.0));
        assert_eq!(matrix.defect_cooperate, (5.0, 0.0));
        assert_eq!(matrix.both_defect, (1.0, 1.0));
    }

    #[test]
    fn test_calculate_payoff_both_cooperate() {
        let matrix = PayoffMatrix::default();
        let payoffs = calculate_payoff(&matrix, true, true);
        
        assert_eq!(payoffs, (3.0, 3.0));
    }

    #[test]
    fn test_calculate_payoff_cooperate_defect() {
        let matrix = PayoffMatrix::default();
        let payoffs = calculate_payoff(&matrix, true, false);
        
        assert_eq!(payoffs, (0.0, 5.0));
    }

    #[test]
    fn test_calculate_payoff_defect_cooperate() {
        let matrix = PayoffMatrix::default();
        let payoffs = calculate_payoff(&matrix, false, true);
        
        assert_eq!(payoffs, (5.0, 0.0));
    }

    #[test]
    fn test_calculate_payoff_both_defect() {
        let matrix = PayoffMatrix::default();
        let payoffs = calculate_payoff(&matrix, false, false);
        
        assert_eq!(payoffs, (1.0, 1.0));
    }
}