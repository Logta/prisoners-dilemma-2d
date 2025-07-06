// ========================================
// Custom Errors - カスタムエラー定義
// ========================================

use serde::{Deserialize, Serialize};
use std::fmt;

/// Index out of bounds エラーの詳細情報
#[derive(Debug, Clone, PartialEq, Serialize, Deserialize)]
pub struct IndexOutOfBoundsError {
    pub operation: String,       // 実行していた操作
    pub index: usize,           // アクセスしようとしたインデックス
    pub length: usize,          // 配列/ベクターの実際の長さ
    pub context: String,        // エラーが発生したコンテキスト
    pub suggestion: String,     // 修正提案
}

impl IndexOutOfBoundsError {
    /// 新しいIndexOutOfBoundsErrorを作成
    pub fn new(
        operation: impl Into<String>,
        index: usize,
        length: usize,
        context: impl Into<String>,
        suggestion: impl Into<String>,
    ) -> Self {
        Self {
            operation: operation.into(),
            index,
            length,
            context: context.into(),
            suggestion: suggestion.into(),
        }
    }

    /// 配列アクセスエラー用のヘルパー
    pub fn array_access(
        array_name: impl Into<String>,
        index: usize,
        length: usize,
        context: impl Into<String>,
    ) -> Self {
        let array_name = array_name.into();
        Self::new(
            format!("Array access: {}[{}]", array_name, index),
            index,
            length,
            context,
            format!("Ensure index is within range [0, {})", length),
        )
    }

    /// ベクターアクセスエラー用のヘルパー
    pub fn vector_access(
        vector_name: impl Into<String>,
        index: usize,
        length: usize,
        context: impl Into<String>,
    ) -> Self {
        let vector_name = vector_name.into();
        Self::new(
            format!("Vector access: {}[{}]", vector_name, index),
            index,
            length,
            context,
            format!("Use .get({}) for safe access or ensure index < {}", index, length),
        )
    }

    /// スライスエラー用のヘルパー
    pub fn slice_access(
        slice_name: impl Into<String>,
        start: usize,
        end: usize,
        length: usize,
        context: impl Into<String>,
    ) -> Self {
        Self::new(
            format!("Slice access: {}[{}..{}]", slice_name.into(), start, end),
            end,
            length,
            context,
            format!("Ensure slice range [{}..{}] is within bounds [0..{}]", start, end, length),
        )
    }

    /// パーセンタイルエラー用のヘルパー
    pub fn percentile_calculation(
        percentile: f64,
        data_length: usize,
        calculated_index: usize,
        context: impl Into<String>,
    ) -> Self {
        Self::new(
            format!("Percentile calculation: {}th percentile", percentile),
            calculated_index,
            data_length,
            context,
            format!("Check if data is not empty and percentile is in valid range [0.0, 100.0]"),
        )
    }

    /// 進化選択エラー用のヘルパー
    pub fn evolution_selection(
        selection_method: impl Into<String>,
        population_size: usize,
        context: impl Into<String>,
    ) -> Self {
        Self::new(
            format!("Evolution selection: {}", selection_method.into()),
            0,
            population_size,
            context,
            "Ensure population is not empty before applying selection",
        )
    }
}

impl fmt::Display for IndexOutOfBoundsError {
    fn fmt(&self, f: &mut fmt::Formatter<'_>) -> fmt::Result {
        write!(
            f,
            "Index Out of Bounds: {} (index: {}, length: {}) in {}\nSuggestion: {}",
            self.operation, self.index, self.length, self.context, self.suggestion
        )
    }
}

impl std::error::Error for IndexOutOfBoundsError {}

/// 空コレクションエラー
#[derive(Debug, Clone, PartialEq, Serialize, Deserialize)]
pub struct EmptyCollectionError {
    pub operation: String,
    pub collection_type: String,
    pub context: String,
    pub suggestion: String,
}

impl EmptyCollectionError {
    pub fn new(
        operation: impl Into<String>,
        collection_type: impl Into<String>,
        context: impl Into<String>,
        suggestion: impl Into<String>,
    ) -> Self {
        Self {
            operation: operation.into(),
            collection_type: collection_type.into(),
            context: context.into(),
            suggestion: suggestion.into(),
        }
    }

    /// 空の選択エラー用のヘルパー
    pub fn empty_selection(
        selection_method: impl Into<String>,
        context: impl Into<String>,
    ) -> Self {
        Self::new(
            format!("Selection from empty collection: {}", selection_method.into()),
            "Agent population",
            context,
            "Ensure agents are available before selection or implement fallback behavior",
        )
    }
}

impl fmt::Display for EmptyCollectionError {
    fn fmt(&self, f: &mut fmt::Formatter<'_>) -> fmt::Result {
        write!(
            f,
            "Empty Collection: {} on {} in {}\nSuggestion: {}",
            self.operation, self.collection_type, self.context, self.suggestion
        )
    }
}

impl std::error::Error for EmptyCollectionError {}

/// 統合エラー型
#[derive(Debug, Clone, PartialEq)]
pub enum SafeAccessError {
    IndexOutOfBounds(IndexOutOfBoundsError),
    EmptyCollection(EmptyCollectionError),
    InvalidRange { start: usize, end: usize, length: usize },
    ArithmeticOverflow { operation: String, context: String },
}

impl fmt::Display for SafeAccessError {
    fn fmt(&self, f: &mut fmt::Formatter<'_>) -> fmt::Result {
        match self {
            SafeAccessError::IndexOutOfBounds(err) => write!(f, "{}", err),
            SafeAccessError::EmptyCollection(err) => write!(f, "{}", err),
            SafeAccessError::InvalidRange { start, end, length } => {
                write!(f, "Invalid range [{}..{}] for collection of length {}", start, end, length)
            }
            SafeAccessError::ArithmeticOverflow { operation, context } => {
                write!(f, "Arithmetic overflow in {} (context: {})", operation, context)
            }
        }
    }
}

impl std::error::Error for SafeAccessError {}

impl From<IndexOutOfBoundsError> for SafeAccessError {
    fn from(err: IndexOutOfBoundsError) -> Self {
        SafeAccessError::IndexOutOfBounds(err)
    }
}

impl From<EmptyCollectionError> for SafeAccessError {
    fn from(err: EmptyCollectionError) -> Self {
        SafeAccessError::EmptyCollection(err)
    }
}

/// 安全な配列アクセス用のヘルパー関数
pub fn safe_index_access<'a, T>(
    collection: &'a [T],
    index: usize,
    collection_name: &str,
    context: &str,
) -> Result<&'a T, SafeAccessError> {
    collection.get(index).ok_or_else(|| {
        IndexOutOfBoundsError::array_access(collection_name, index, collection.len(), context).into()
    })
}

/// 安全なベクターアクセス用のヘルパー関数
pub fn safe_vector_access<'a, T>(
    vector: &'a Vec<T>,
    index: usize,
    vector_name: &str,
    context: &str,
) -> Result<&'a T, SafeAccessError> {
    vector.get(index).ok_or_else(|| {
        IndexOutOfBoundsError::vector_access(vector_name, index, vector.len(), context).into()
    })
}

/// 安全なスライスアクセス用のヘルパー関数
pub fn safe_slice_access<'a, T>(
    collection: &'a [T],
    start: usize,
    end: usize,
    collection_name: &str,
    context: &str,
) -> Result<&'a [T], SafeAccessError> {
    if start > end {
        return Err(SafeAccessError::InvalidRange { 
            start, 
            end, 
            length: collection.len() 
        });
    }
    
    if end > collection.len() {
        return Err(IndexOutOfBoundsError::slice_access(
            collection_name, start, end, collection.len(), context
        ).into());
    }

    Ok(&collection[start..end])
}

#[cfg(test)]
mod tests {
    use super::*;

    #[test]
    fn test_index_out_of_bounds_error_creation() {
        let err = IndexOutOfBoundsError::array_access("test_array", 5, 3, "unit test");
        
        assert_eq!(err.operation, "Array access: test_array[5]");
        assert_eq!(err.index, 5);
        assert_eq!(err.length, 3);
        assert_eq!(err.context, "unit test");
        assert!(err.suggestion.contains("range [0, 3)"));
    }

    #[test]
    fn test_empty_collection_error() {
        let err = EmptyCollectionError::empty_selection("tournament", "evolution test");
        
        assert!(err.operation.contains("tournament"));
        assert_eq!(err.collection_type, "Agent population");
        assert_eq!(err.context, "evolution test");
    }

    #[test]
    fn test_safe_index_access_success() {
        let data = vec![1, 2, 3, 4, 5];
        let result = safe_index_access(&data, 2, "test_data", "test context");
        
        assert!(result.is_ok());
        assert_eq!(*result.unwrap(), 3);
    }

    #[test]
    fn test_safe_index_access_error() {
        let data = vec![1, 2, 3];
        let result = safe_index_access(&data, 5, "test_data", "test context");
        
        assert!(result.is_err());
        if let SafeAccessError::IndexOutOfBounds(err) = result.unwrap_err() {
            assert_eq!(err.index, 5);
            assert_eq!(err.length, 3);
        } else {
            panic!("Expected IndexOutOfBounds error");
        }
    }

    #[test]
    fn test_safe_slice_access_success() {
        let data = vec![1, 2, 3, 4, 5];
        let result = safe_slice_access(&data, 1, 4, "test_data", "test context");
        
        assert!(result.is_ok());
        assert_eq!(result.unwrap(), &[2, 3, 4]);
    }

    #[test]
    fn test_safe_slice_access_error() {
        let data = vec![1, 2, 3];
        let result = safe_slice_access(&data, 1, 5, "test_data", "test context");
        
        assert!(result.is_err());
        if let SafeAccessError::IndexOutOfBounds(err) = result.unwrap_err() {
            assert_eq!(err.index, 5);
            assert_eq!(err.length, 3);
        } else {
            panic!("Expected IndexOutOfBounds error");
        }
    }

    #[test]
    fn test_invalid_range_error() {
        let data = vec![1, 2, 3];
        let result = safe_slice_access(&data, 3, 1, "test_data", "test context");
        
        assert!(result.is_err());
        if let SafeAccessError::InvalidRange { start, end, length } = result.unwrap_err() {
            assert_eq!(start, 3);
            assert_eq!(end, 1);
            assert_eq!(length, 3);
        } else {
            panic!("Expected InvalidRange error");
        }
    }
}