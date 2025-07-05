// ========================================
// Infrastructure Layer - 外部システムとの連携
// ========================================

pub mod persistence;
pub mod wasm;

pub use persistence::*;
pub use wasm::*;