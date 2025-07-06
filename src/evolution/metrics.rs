// ========================================
// Evolution Metrics - 進化過程の監視と分析
// ========================================

use serde::{Deserialize, Serialize};
use std::collections::VecDeque;
use std::time::Duration;

/// 進化メトリクス
#[derive(Debug, Clone, Serialize, Deserialize)]
pub struct EvolutionMetrics {
    pub generation_time: Duration,
    pub fitness_improvement: f64,
    pub max_fitness_improvement: f64,
    pub diversity_score: f64,
    pub selection_intensity: f64,
    pub mutation_rate: f64,
    pub crossover_rate: f64,
    pub population_size: usize,
}

/// 進化履歴トラッカー
#[derive(Debug, Clone)]
pub struct EvolutionTracker {
    history: VecDeque<GenerationRecord>,
    max_history_size: usize,
    start_time: std::time::Instant,
}

/// 世代記録
#[derive(Debug, Clone, Serialize, Deserialize)]
pub struct GenerationRecord {
    pub generation: u32,
    pub timestamp: u64,
    pub population_size: usize,
    pub fitness_stats: FitnessStatistics,
    pub diversity_metrics: DiversityMetrics,
    pub performance_metrics: PerformanceMetrics,
    pub convergence_indicators: ConvergenceIndicators,
}

/// 適応度統計
#[derive(Debug, Clone, Serialize, Deserialize)]
pub struct FitnessStatistics {
    pub mean: f64,
    pub std_dev: f64,
    pub min: f64,
    pub max: f64,
    pub median: f64,
    pub quartile_25: f64,
    pub quartile_75: f64,
    pub improvement_rate: f64,
}

/// 多様性メトリクス
#[derive(Debug, Clone, Serialize, Deserialize)]
pub struct DiversityMetrics {
    pub genetic_diversity: f64,
    pub phenotypic_diversity: f64,
    pub spatial_diversity: f64,
    pub behavioral_diversity: f64,
    pub entropy: f64,
}

/// パフォーマンスメトリクス
#[derive(Debug, Clone, Serialize, Deserialize)]
pub struct PerformanceMetrics {
    pub generation_time_ms: u64,
    pub selection_time_ms: u64,
    pub crossover_time_ms: u64,
    pub mutation_time_ms: u64,
    pub evaluation_time_ms: u64,
    pub memory_usage_mb: f64,
}

/// 収束指標
#[derive(Debug, Clone, Serialize, Deserialize)]
pub struct ConvergenceIndicators {
    pub fitness_stagnation_generations: u32,
    pub diversity_decline_rate: f64,
    pub selection_pressure_actual: f64,
    pub effective_population_size: f64,
    pub convergence_probability: f64,
}

impl EvolutionTracker {
    /// 新しいトラッカーを作成
    pub fn new(max_history_size: usize) -> Self {
        Self {
            history: VecDeque::new(),
            max_history_size,
            start_time: std::time::Instant::now(),
        }
    }

    /// 世代記録を追加
    pub fn record_generation(&mut self, record: GenerationRecord) {
        if self.history.len() >= self.max_history_size {
            self.history.pop_front();
        }
        self.history.push_back(record);
    }

    /// 最新の記録を取得
    pub fn latest_record(&self) -> Option<&GenerationRecord> {
        self.history.back()
    }

    /// 指定世代の記録を取得
    pub fn get_record(&self, generation: u32) -> Option<&GenerationRecord> {
        self.history.iter().find(|r| r.generation == generation)
    }

    /// 全履歴を取得
    pub fn get_history(&self) -> &VecDeque<GenerationRecord> {
        &self.history
    }

    /// 統計サマリーを計算
    pub fn calculate_summary(&self) -> EvolutionSummary {
        if self.history.is_empty() {
            return EvolutionSummary::empty();
        }

        let total_generations = self.history.len();
        let total_runtime = self.start_time.elapsed();

        let fitness_values: Vec<f64> = self.history.iter().map(|r| r.fitness_stats.mean).collect();

        let diversity_values: Vec<f64> = self
            .history
            .iter()
            .map(|r| r.diversity_metrics.genetic_diversity)
            .collect();

        let fitness_trend = self.calculate_trend(&fitness_values);
        let diversity_trend = self.calculate_trend(&diversity_values);

        let avg_generation_time = self
            .history
            .iter()
            .map(|r| r.performance_metrics.generation_time_ms)
            .sum::<u64>() as f64
            / total_generations as f64;

        let convergence_detection = self.detect_convergence();

        EvolutionSummary {
            total_generations,
            total_runtime,
            final_best_fitness: fitness_values.last().copied().unwrap_or(0.0),
            fitness_improvement_rate: fitness_trend,
            diversity_trend,
            avg_generation_time_ms: avg_generation_time,
            convergence_detected: convergence_detection.is_converged,
            convergence_generation: convergence_detection.generation,
            efficiency_score: self.calculate_efficiency_score(),
        }
    }

    /// トレンドを計算（線形回帰の傾き）
    fn calculate_trend(&self, values: &[f64]) -> f64 {
        if values.len() < 2 {
            return 0.0;
        }

        let n = values.len() as f64;
        let sum_x = (0..values.len()).sum::<usize>() as f64;
        let sum_y = values.iter().sum::<f64>();
        let sum_xy = values
            .iter()
            .enumerate()
            .map(|(i, &y)| i as f64 * y)
            .sum::<f64>();
        let sum_x2 = (0..values.len()).map(|i| (i * i) as f64).sum::<f64>();

        let denominator = n * sum_x2 - sum_x * sum_x;
        if denominator.abs() < f64::EPSILON {
            return 0.0;
        }

        (n * sum_xy - sum_x * sum_y) / denominator
    }

    /// 収束検出
    fn detect_convergence(&self) -> ConvergenceDetection {
        const STAGNATION_THRESHOLD: u32 = 20;
        const DIVERSITY_THRESHOLD: f64 = 0.01;

        if self.history.len() < STAGNATION_THRESHOLD as usize {
            return ConvergenceDetection {
                is_converged: false,
                generation: None,
                reason: "Insufficient generations".to_string(),
            };
        }

        // 適応度停滞をチェック
        let recent_fitness: Vec<f64> = self
            .history
            .iter()
            .rev()
            .take(STAGNATION_THRESHOLD as usize)
            .map(|r| r.fitness_stats.max)
            .collect();

        let fitness_variance = self.calculate_variance(&recent_fitness);
        let recent_diversity = self
            .history
            .back()
            .unwrap()
            .diversity_metrics
            .genetic_diversity;

        if fitness_variance < 0.001 && recent_diversity < DIVERSITY_THRESHOLD {
            let convergence_gen = self.history.len() as u32 - STAGNATION_THRESHOLD;
            return ConvergenceDetection {
                is_converged: true,
                generation: Some(convergence_gen),
                reason: "Fitness stagnation and low diversity".to_string(),
            };
        }

        ConvergenceDetection {
            is_converged: false,
            generation: None,
            reason: "Evolution continuing".to_string(),
        }
    }

    /// 分散を計算
    fn calculate_variance(&self, values: &[f64]) -> f64 {
        if values.is_empty() {
            return 0.0;
        }

        let mean = values.iter().sum::<f64>() / values.len() as f64;
        let variance =
            values.iter().map(|&x| (x - mean).powi(2)).sum::<f64>() / values.len() as f64;

        variance
    }

    /// 効率性スコアを計算
    fn calculate_efficiency_score(&self) -> f64 {
        if self.history.is_empty() {
            return 0.0;
        }

        let first_fitness = self.history.front().map(|r| r.fitness_stats.mean).unwrap_or(0.0);
        let last_fitness = self.history.back().map(|r| r.fitness_stats.mean).unwrap_or(0.0);
        let fitness_improvement = last_fitness - first_fitness;

        let total_time_s = self
            .history
            .iter()
            .map(|r| r.performance_metrics.generation_time_ms)
            .sum::<u64>() as f64
            / 1000.0;

        if total_time_s <= 0.0 {
            return 0.0;
        }

        // 改善量 / 時間の比率（正規化済み）
        (fitness_improvement / total_time_s).max(0.0).min(100.0)
    }

    /// 履歴をクリア
    pub fn clear_history(&mut self) {
        self.history.clear();
        self.start_time = std::time::Instant::now();
    }

    /// CSVエクスポート用データを生成
    pub fn export_csv(&self) -> String {
        let mut csv = String::new();
        csv.push_str("generation,timestamp,population_size,mean_fitness,max_fitness,min_fitness,genetic_diversity,generation_time_ms\n");

        for record in &self.history {
            csv.push_str(&format!(
                "{},{},{},{:.6},{:.6},{:.6},{:.6},{}\n",
                record.generation,
                record.timestamp,
                record.population_size,
                record.fitness_stats.mean,
                record.fitness_stats.max,
                record.fitness_stats.min,
                record.diversity_metrics.genetic_diversity,
                record.performance_metrics.generation_time_ms
            ));
        }

        csv
    }
}

/// 進化サマリー
#[derive(Debug, Clone, Serialize, Deserialize)]
pub struct EvolutionSummary {
    pub total_generations: usize,
    pub total_runtime: Duration,
    pub final_best_fitness: f64,
    pub fitness_improvement_rate: f64,
    pub diversity_trend: f64,
    pub avg_generation_time_ms: f64,
    pub convergence_detected: bool,
    pub convergence_generation: Option<u32>,
    pub efficiency_score: f64,
}

impl EvolutionSummary {
    pub fn empty() -> Self {
        Self {
            total_generations: 0,
            total_runtime: Duration::from_secs(0),
            final_best_fitness: 0.0,
            fitness_improvement_rate: 0.0,
            diversity_trend: 0.0,
            avg_generation_time_ms: 0.0,
            convergence_detected: false,
            convergence_generation: None,
            efficiency_score: 0.0,
        }
    }
}

/// 収束検出結果
#[derive(Debug, Clone)]
pub struct ConvergenceDetection {
    pub is_converged: bool,
    pub generation: Option<u32>,
    pub reason: String,
}

/// メトリクス計算ユーティリティ
pub struct MetricsCalculator;

impl MetricsCalculator {
    /// 適応度統計を計算
    pub fn calculate_fitness_stats(fitness_values: &[f64]) -> FitnessStatistics {
        if fitness_values.is_empty() {
            return FitnessStatistics {
                mean: 0.0,
                std_dev: 0.0,
                min: 0.0,
                max: 0.0,
                median: 0.0,
                quartile_25: 0.0,
                quartile_75: 0.0,
                improvement_rate: 0.0,
            };
        }

        let mut sorted_values = fitness_values.to_vec();
        sorted_values.sort_by(|a, b| a.partial_cmp(b).unwrap_or(std::cmp::Ordering::Equal));

        let mean = fitness_values.iter().sum::<f64>() / fitness_values.len() as f64;
        let variance = fitness_values
            .iter()
            .map(|&x| (x - mean).powi(2))
            .sum::<f64>()
            / fitness_values.len() as f64;
        let std_dev = variance.sqrt();

        let min = sorted_values.first().copied().unwrap_or(0.0);
        let max = sorted_values.last().copied().unwrap_or(0.0);
        let median = Self::percentile(&sorted_values, 0.5);
        let quartile_25 = Self::percentile(&sorted_values, 0.25);
        let quartile_75 = Self::percentile(&sorted_values, 0.75);

        FitnessStatistics {
            mean,
            std_dev,
            min,
            max,
            median,
            quartile_25,
            quartile_75,
            improvement_rate: 0.0, // 前世代との比較で計算される
        }
    }

    /// パーセンタイルを計算
    fn percentile(sorted_values: &[f64], p: f64) -> f64 {
        if sorted_values.is_empty() {
            return 0.0;
        }

        let index = (sorted_values.len() as f64 - 1.0) * p;
        let lower = index.floor() as usize;
        let upper = index.ceil() as usize;

        if lower == upper {
            sorted_values[lower]
        } else {
            let weight = index - index.floor();
            sorted_values[lower] * (1.0 - weight) + sorted_values[upper] * weight
        }
    }

    /// 遺伝的多様性を計算（ハミング距離ベース）
    pub fn calculate_genetic_diversity(traits: &[crate::core::AgentTraits]) -> f64 {
        if traits.len() < 2 {
            return 0.0;
        }

        let mut total_distance = 0.0;
        let mut comparisons = 0;

        for i in 0..traits.len() {
            for j in (i + 1)..traits.len() {
                let distance = Self::calculate_trait_distance(&traits[i], &traits[j]);
                total_distance += distance;
                comparisons += 1;
            }
        }

        if comparisons > 0 {
            total_distance / comparisons as f64
        } else {
            0.0
        }
    }

    /// 特性間の距離を計算
    fn calculate_trait_distance(
        traits1: &crate::core::AgentTraits,
        traits2: &crate::core::AgentTraits,
    ) -> f64 {
        let d1 = (traits1.cooperation_rate - traits2.cooperation_rate).powi(2);
        let d2 = (traits1.movement_rate - traits2.movement_rate).powi(2);
        let d3 = (traits1.aggression_level - traits2.aggression_level).powi(2);
        let d4 = (traits1.learning_rate - traits2.learning_rate).powi(2);

        (d1 + d2 + d3 + d4).sqrt()
    }

    /// エントロピーを計算
    pub fn calculate_entropy(values: &[f64], bins: usize) -> f64 {
        if values.is_empty() {
            return 0.0;
        }

        let min_val = values.iter().fold(f64::INFINITY, |a, &b| a.min(b));
        let max_val = values.iter().fold(f64::NEG_INFINITY, |a, &b| a.max(b));

        if (max_val - min_val) < f64::EPSILON {
            return 0.0;
        }

        let bin_width = (max_val - min_val) / bins as f64;
        let mut histogram = vec![0; bins];

        for &value in values {
            let bin_index = ((value - min_val) / bin_width).floor() as usize;
            let bin_index = bin_index.min(bins - 1);
            histogram[bin_index] += 1;
        }

        let total = values.len() as f64;
        let mut entropy = 0.0;

        for &count in &histogram {
            if count > 0 {
                let p = count as f64 / total;
                entropy -= p * p.ln();
            }
        }

        entropy
    }
}

#[cfg(test)]
mod tests {
    use super::*;

    #[test]
    fn test_fitness_stats_calculation() {
        let fitness_values = vec![1.0, 2.0, 3.0, 4.0, 5.0];
        let stats = MetricsCalculator::calculate_fitness_stats(&fitness_values);

        assert_eq!(stats.mean, 3.0);
        assert_eq!(stats.min, 1.0);
        assert_eq!(stats.max, 5.0);
        assert_eq!(stats.median, 3.0);
    }

    #[test]
    fn test_evolution_tracker() {
        let mut tracker = EvolutionTracker::new(100);

        let record = GenerationRecord {
            generation: 1,
            timestamp: 0,
            population_size: 100,
            fitness_stats: FitnessStatistics {
                mean: 50.0,
                std_dev: 10.0,
                min: 20.0,
                max: 80.0,
                median: 50.0,
                quartile_25: 40.0,
                quartile_75: 60.0,
                improvement_rate: 0.0,
            },
            diversity_metrics: DiversityMetrics {
                genetic_diversity: 0.5,
                phenotypic_diversity: 0.5,
                spatial_diversity: 0.5,
                behavioral_diversity: 0.5,
                entropy: 2.0,
            },
            performance_metrics: PerformanceMetrics {
                generation_time_ms: 100,
                selection_time_ms: 20,
                crossover_time_ms: 30,
                mutation_time_ms: 10,
                evaluation_time_ms: 40,
                memory_usage_mb: 50.0,
            },
            convergence_indicators: ConvergenceIndicators {
                fitness_stagnation_generations: 0,
                diversity_decline_rate: 0.0,
                selection_pressure_actual: 2.0,
                effective_population_size: 90.0,
                convergence_probability: 0.1,
            },
        };

        tracker.record_generation(record);

        assert_eq!(tracker.get_history().len(), 1);
        assert!(tracker.latest_record().is_some());
    }

    #[test]
    fn test_csv_export() {
        let mut tracker = EvolutionTracker::new(100);

        let record = GenerationRecord {
            generation: 1,
            timestamp: 1000,
            population_size: 100,
            fitness_stats: FitnessStatistics {
                mean: 50.0,
                std_dev: 10.0,
                min: 20.0,
                max: 80.0,
                median: 50.0,
                quartile_25: 40.0,
                quartile_75: 60.0,
                improvement_rate: 0.0,
            },
            diversity_metrics: DiversityMetrics {
                genetic_diversity: 0.5,
                phenotypic_diversity: 0.5,
                spatial_diversity: 0.5,
                behavioral_diversity: 0.5,
                entropy: 2.0,
            },
            performance_metrics: PerformanceMetrics {
                generation_time_ms: 100,
                selection_time_ms: 20,
                crossover_time_ms: 30,
                mutation_time_ms: 10,
                evaluation_time_ms: 40,
                memory_usage_mb: 50.0,
            },
            convergence_indicators: ConvergenceIndicators {
                fitness_stagnation_generations: 0,
                diversity_decline_rate: 0.0,
                selection_pressure_actual: 2.0,
                effective_population_size: 90.0,
                convergence_probability: 0.1,
            },
        };

        tracker.record_generation(record);

        let csv = tracker.export_csv();
        assert!(csv.contains("generation,timestamp"));
        assert!(csv.contains("1,1000,100"));
    }
}
