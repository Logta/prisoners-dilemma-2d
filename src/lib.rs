// ========================================
// 2D Prisoner's Dilemma - Refactored Architecture
// ========================================

// Legacy modules (temporary compatibility)
// mod agent;
// mod game;
// mod genetic;
// mod grid;

// New modular architecture
pub mod core;
// pub mod evolution;
// pub mod wasm_bindings; // 一時的に無効化

// New architecture exports
pub use core::*;
