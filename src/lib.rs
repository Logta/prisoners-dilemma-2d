// ========================================
// 2D Prisoner's Dilemma - Refactored Architecture
// ========================================

// Legacy modules (temporary compatibility)
mod agent;
mod game;
mod genetic;
mod grid;

// New modular architecture
// pub mod core;
// pub mod evolution;
pub mod wasm_bindings;

// Legacy exports for backward compatibility
pub use agent::Agent;
pub use game::{calculate_payoff, PayoffMatrix};
pub use genetic::{
    crossover, mutate, replace_generation, select_agents, CrossoverMethod, SelectionMethod,
};
pub use grid::Grid;

// New architecture exports
// pub use core::*;
// pub use evolution::*;
