// ========================================
// Infrastructure Layer - 外部システムとの連携
// ========================================

pub mod wasm;
pub mod serialization;
pub mod persistence;

pub use wasm::*;
pub use serialization::*;
pub use persistence::*;