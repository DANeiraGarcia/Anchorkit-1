use chrono::{DateTime, Utc};
use serde::{Deserialize, Serialize};
use uuid::Uuid;

/// A webhook delivery that was sent to a destination URL.
#[derive(Debug, Clone, Serialize, Deserialize)]
pub struct WebhookDelivery {
    /// Unique identifier for this delivery.
    pub id: String,
    /// The destination URL where the webhook was sent.
    pub url: String,
    /// The event payload that was delivered.
    pub payload: serde_json::Value,
    /// HTTP status code of the response (if successful).
    pub status_code: Option<u16>,
    /// Response body from the server (if available).
    pub response_body: Option<String>,
    /// Number of attempts made.
    pub attempt: u32,
    /// Error message from the last failed attempt (if any).
    pub error: Option<String>,
    /// Timestamp when this delivery was created.
    pub created_at: DateTime<Utc>,
    /// Timestamp of the last attempt.
    pub last_attempted_at: Option<DateTime<Utc>>,
    /// Whether this delivery has been successfully delivered.
    pub delivered: bool,
}

impl WebhookDelivery {
    pub fn new(url: String, payload: serde_json::Value) -> Self {
        Self {
            id: Uuid::new_v4().to_string(),
            url,
            payload,
            status_code: None,
            response_body: None,
            attempt: 0,
            error: None,
            created_at: Utc::now(),
            last_attempted_at: None,
            delivered: false,
        }
    }
}

/// A dead-lettered webhook delivery that has exhausted all retries.
#[derive(Debug, Clone, Serialize, Deserialize)]
pub struct DeadLetter {
    /// Unique identifier for this dead-letter entry.
    pub id: String,
    /// The original delivery that was dead-lettered.
    pub delivery: WebhookDelivery,
    /// Why it was dead-lettered (e.g., max retries exceeded).
    pub reason: String,
    /// Timestamp when this was moved to dead-letter queue.
    pub dead_lettered_at: DateTime<Utc>,
}

impl DeadLetter {
    pub fn from_delivery(delivery: WebhookDelivery, reason: String) -> Self {
        Self {
            id: Uuid::new_v4().to_string(),
            delivery,
            reason,
            dead_lettered_at: Utc::now(),
        }
    }
}
