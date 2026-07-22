use std::time::Duration;

/// Configuration for retry-with-backoff behavior.
#[derive(Debug, Clone)]
pub struct RetryConfig {
    /// Maximum number of retry attempts.
    pub max_retries: u32,
    /// Initial backoff duration.
    pub initial_backoff: Duration,
    /// Maximum backoff duration (prevents exponential explosion).
    pub max_backoff: Duration,
    /// Multiplier for exponential backoff.
    pub backoff_multiplier: f64,
}

impl Default for RetryConfig {
    fn default() -> Self {
        Self {
            max_retries: 5,
            initial_backoff: Duration::from_millis(100),
            max_backoff: Duration::from_secs(60),
            backoff_multiplier: 2.0,
        }
    }
}

impl RetryConfig {
    /// Calculates the backoff duration for a given retry attempt.
    pub fn backoff_duration(&self, attempt: u32) -> Duration {
        let backoff_ms = self.initial_backoff.as_millis() as f64
            * self.backoff_multiplier.powi(attempt as i32);
        let capped = backoff_ms.min(self.max_backoff.as_millis() as f64) as u64;
        Duration::from_millis(capped)
    }

    /// Determines if a given attempt number should be retried.
    pub fn should_retry(&self, attempt: u32) -> bool {
        attempt < self.max_retries
    }
}

#[cfg(test)]
mod tests {
    use super::*;

    #[test]
    fn test_backoff_duration_exponential_growth() {
        let config = RetryConfig::default();
        let attempt_0 = config.backoff_duration(0);
        let attempt_1 = config.backoff_duration(1);
        let attempt_2 = config.backoff_duration(2);

        assert_eq!(attempt_0.as_millis(), 100);
        assert_eq!(attempt_1.as_millis(), 200);
        assert_eq!(attempt_2.as_millis(), 400);
    }

    #[test]
    fn test_backoff_duration_capped_at_max() {
        let config = RetryConfig::default();
        let attempt_10 = config.backoff_duration(10);
        assert_eq!(attempt_10, config.max_backoff);
    }

    #[test]
    fn test_should_retry() {
        let config = RetryConfig::default();
        assert!(config.should_retry(0));
        assert!(config.should_retry(4));
        assert!(!config.should_retry(5));
        assert!(!config.should_retry(6));
    }
}
