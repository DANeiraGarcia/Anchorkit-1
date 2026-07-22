use crate::errors::{Result, WebhookError};
use crate::retry::RetryConfig;
use crate::types::WebhookDelivery;
use chrono::Utc;
use reqwest::Client;

/// Handles webhook delivery with retry logic.
pub struct WebhookDeliverer {
    client: Client,
    retry_config: RetryConfig,
}

impl WebhookDeliverer {
    pub fn new(retry_config: RetryConfig) -> Self {
        Self {
            client: Client::new(),
            retry_config,
        }
    }

    /// Delivers a webhook with automatic retry-with-backoff on failure.
    /// Returns the delivery result including attempt count and any errors.
    pub async fn deliver(&self, mut delivery: WebhookDelivery) -> Result<WebhookDelivery> {
        loop {
            delivery.attempt += 1;
            delivery.last_attempted_at = Some(Utc::now());

            match self.send(&delivery).await {
                Ok((status, response_body)) => {
                    delivery.status_code = Some(status);
                    delivery.response_body = response_body;
                    delivery.delivered = true;
                    return Ok(delivery);
                }
                Err(e) => {
                    delivery.error = Some(e.to_string());

                    if !self.retry_config.should_retry(delivery.attempt) {
                        // Max retries exceeded, return delivery with error
                        return Err(WebhookError::MaxRetriesExceeded);
                    }

                    // Wait before retrying
                    let backoff = self.retry_config.backoff_duration(delivery.attempt - 1);
                    tokio::time::sleep(backoff).await;
                }
            }
        }
    }

    async fn send(&self, delivery: &WebhookDelivery) -> Result<(u16, Option<String>)> {
        let response = self
            .client
            .post(&delivery.url)
            .json(&delivery.payload)
            .send()
            .await?;

        let status = response.status().as_u16();
        let body = response.text().await.ok();

        if (200..300).contains(&status) {
            Ok((status, body))
        } else {
            Err(WebhookError::DeliveryFailed(format!(
                "HTTP {}: {}",
                status,
                body.unwrap_or_default()
            )))
        }
    }
}

#[cfg(test)]
mod tests {
    use super::*;

    #[tokio::test]
    async fn test_delivery_success_on_first_attempt() {
        let deliverer = WebhookDeliverer::new(RetryConfig::default());
        let delivery = WebhookDelivery::new(
            "https://httpbin.org/post".to_string(),
            serde_json::json!({"test": "data"}),
        );

        // Note: This test requires a real HTTP endpoint. In a real test suite,
        // you'd mock this with something like `mockito` or `httpmock`.
        // For now, this is a placeholder showing the intended usage.
        let _result = deliverer.deliver(delivery).await;
    }
}
