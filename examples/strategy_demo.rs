// ========================================
// Strategy System Demonstration
// ========================================

use prisoners_dilemma_2d::domain::agent::{Agent, AgentTraits, StrategyGenes, StrategyType};
use prisoners_dilemma_2d::domain::shared::{AgentId, Position};

fn main() {
    println!("=== 2D Prisoner's Dilemma - Strategy System Demo ===\n");

    // Create agents with different strategy genes
    let agents = create_strategy_agents();
    
    // Display agent strategies
    display_agent_strategies(&agents);
    
    // Simulate interactions between agents
    simulate_interactions(&agents);
}

fn create_strategy_agents() -> Vec<Agent> {
    let mut agents = Vec::new();
    
    // Agent 1: Always Cooperate (strategy_gene = 0.1)
    let traits1 = AgentTraits::new(0.8, 0.2, 0.7, 0.3).unwrap();
    let strategy_genes1 = StrategyGenes::new(0.1, 0.9, 0.5, 0.6);
    let agent1 = Agent::new_with_strategy(AgentId::new(1), Position::new(0, 0), traits1, strategy_genes1);
    agents.push(agent1);
    
    // Agent 2: Always Defect (strategy_gene = 0.2)
    let traits2 = AgentTraits::new(0.3, 0.8, 0.5, 0.4).unwrap();
    let strategy_genes2 = StrategyGenes::new(0.2, 0.9, 0.3, 0.4);
    let agent2 = Agent::new_with_strategy(AgentId::new(2), Position::new(1, 0), traits2, strategy_genes2);
    agents.push(agent2);
    
    // Agent 3: Tit-for-Tat (strategy_gene = 0.4)
    let traits3 = AgentTraits::new(0.6, 0.4, 0.8, 0.5).unwrap();
    let strategy_genes3 = StrategyGenes::new(0.4, 0.8, 0.7, 0.8);
    let agent3 = Agent::new_with_strategy(AgentId::new(3), Position::new(2, 0), traits3, strategy_genes3);
    agents.push(agent3);
    
    // Agent 4: Pavlov (strategy_gene = 0.6)
    let traits4 = AgentTraits::new(0.5, 0.5, 0.6, 0.6).unwrap();
    let strategy_genes4 = StrategyGenes::new(0.6, 0.7, 0.8, 0.7);
    let agent4 = Agent::new_with_strategy(AgentId::new(4), Position::new(3, 0), traits4, strategy_genes4);
    agents.push(agent4);
    
    // Agent 5: Random (strategy_gene = 0.75)
    let traits5 = AgentTraits::new(0.5, 0.5, 0.5, 0.5).unwrap();
    let strategy_genes5 = StrategyGenes::new(0.75, 0.5, 0.4, 0.5);
    let agent5 = Agent::new_with_strategy(AgentId::new(5), Position::new(4, 0), traits5, strategy_genes5);
    agents.push(agent5);
    
    // Agent 6: Reputation-based (strategy_gene = 0.9)
    let traits6 = AgentTraits::new(0.7, 0.3, 0.9, 0.7).unwrap();
    let strategy_genes6 = StrategyGenes::new(0.9, 0.8, 0.9, 0.9);
    let agent6 = Agent::new_with_strategy(AgentId::new(6), Position::new(5, 0), traits6, strategy_genes6);
    agents.push(agent6);
    
    agents
}

fn display_agent_strategies(agents: &[Agent]) {
    println!("Agent Strategies:");
    println!("{:<8} {:<20} {:<15} {:<12} {:<15} {:<15}", 
             "Agent", "Strategy", "Cooperation", "Strength", "Adaptability", "Memory");
    println!("{}", "-".repeat(90));
    
    for agent in agents {
        let strategy = agent.strategy().current_strategy();
        let genes = agent.strategy().genes();
        let cooperation = agent.traits().cooperation_tendency();
        
        println!("{:<8} {:<20} {:<15.2} {:<12.2} {:<15.2} {:<15.2}",
                 format!("Agent{}", agent.id().value()),
                 strategy.description(),
                 cooperation,
                 genes.strategy_purity(),
                 genes.adaptability(),
                 genes.memory_capacity());
    }
    println!();
}

fn simulate_interactions(agents: &[Agent]) {
    println!("Simulating interactions between agents...\n");
    
    // Create mutable copies for the simulation
    let mut agent1 = agents[0].clone(); // Always Cooperate
    let mut agent2 = agents[1].clone(); // Always Defect  
    let mut agent3 = agents[2].clone(); // Tit-for-Tat
    
    // Simulate multiple rounds between Agent1 (Always Cooperate) and Agent3 (Tit-for-Tat)
    println!("=== Agent1 (Always Cooperate) vs Agent3 (Tit-for-Tat) ===");
    for round in 1..=5 {
        let agent1_cooperates = agent1.decides_to_cooperate_with(agent3.id());
        let agent3_cooperates = agent3.decides_to_cooperate_with(agent1.id());
        
        println!("Round {}: Agent1 {} | Agent3 {}", 
                 round,
                 if agent1_cooperates { "Cooperates" } else { "Defects" },
                 if agent3_cooperates { "Cooperates" } else { "Defects" });
        
        // Record interactions (simplified scoring)
        let agent1_score = if agent1_cooperates && agent3_cooperates { 3.0 }
                          else if agent1_cooperates && !agent3_cooperates { 0.0 }
                          else if !agent1_cooperates && agent3_cooperates { 5.0 }
                          else { 1.0 };
        
        let agent3_score = if agent3_cooperates && agent1_cooperates { 3.0 }
                          else if agent3_cooperates && !agent1_cooperates { 0.0 }
                          else if !agent3_cooperates && agent1_cooperates { 5.0 }
                          else { 1.0 };
        
        agent1.record_interaction(agent3.id(), agent1_cooperates, agent3_cooperates, agent1_score);
        agent3.record_interaction(agent1.id(), agent3_cooperates, agent1_cooperates, agent3_score);
    }
    
    println!();
    
    // Simulate between Agent2 (Always Defect) and Agent3 (Tit-for-Tat)
    println!("=== Agent2 (Always Defect) vs Agent3 (Tit-for-Tat) ===");
    for round in 1..=5 {
        let agent2_cooperates = agent2.decides_to_cooperate_with(agent3.id());
        let agent3_cooperates = agent3.decides_to_cooperate_with(agent2.id());
        
        println!("Round {}: Agent2 {} | Agent3 {}", 
                 round,
                 if agent2_cooperates { "Cooperates" } else { "Defects" },
                 if agent3_cooperates { "Cooperates" } else { "Defects" });
        
        // Record interactions
        let agent2_score = if agent2_cooperates && agent3_cooperates { 3.0 }
                          else if agent2_cooperates && !agent3_cooperates { 0.0 }
                          else if !agent2_cooperates && agent3_cooperates { 5.0 }
                          else { 1.0 };
        
        let agent3_score = if agent3_cooperates && agent2_cooperates { 3.0 }
                          else if agent3_cooperates && !agent2_cooperates { 0.0 }
                          else if !agent3_cooperates && agent2_cooperates { 5.0 }
                          else { 1.0 };
        
        agent2.record_interaction(agent3.id(), agent2_cooperates, agent3_cooperates, agent2_score);
        agent3.record_interaction(agent2.id(), agent3_cooperates, agent2_cooperates, agent3_score);
    }
    
    println!("\n=== Strategy Demonstration Complete ===");
    println!("観察結果:");
    println!("- Always Cooperate は常に協力");
    println!("- Always Defect は常に裏切り");
    println!("- Tit-for-Tat は初回協力、その後相手の前回行動を模倣");
    println!("- 各戦略は遺伝子情報によって決定され、進化可能");
}