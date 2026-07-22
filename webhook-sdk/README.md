# Webhook SDK for AnchorKit

This module provides webhook delivery for AnchorKit with automatic retry-with-backoff and dead-letter queue support.

## Features

- **Retry-with-Backoff**: Automatic exponential backoff for failed webhook deliveries using the `RetryConfig` helper
- **Dead-Letter Queue**: Failed deliveries that exhaust retries are stored in an inspectable dead-letter queue
- **Idempotent Processing**: Duplicate webhook deliveries are detected via stable idempotency keys and handled without re-executing side effects
- **Webhook Monitor**: Tool to inspect and query dead-lettered deliveries
- **Async/Await**: Built on Tokio for efficient async operations
- **SQLite Storage**: Persistent storage for dead-letter entries and idempotency records

## Architecture

### Core Components

- **`retry.rs`**: Configurable retry-with-backoff helper
  - Exponential backoff calculation
  - Configurable max retries and backoff limits
  - Reusable across the SDK

- **`delivery.rs`**: Webhook delivery with automatic retries
  - Sends payloads to registered webhook endpoints
  - Integrates with retry logic
  - Tracks delivery attempts and errors

- **`idempotency.rs`**: Idempotency key derivation and storage
  - Derives stable SHA256-based keys from webhook payloads
  - Stores processed deliveries for duplicate detection
  - Converts at-least-once to exactly-once semantics

- **`processor.rs`**: Idempotent webhook processor
  - Combines delivery with idempotency checking
  - Returns cached responses for duplicates without re-executing
  - Prevents double-triggering of side effects

- **`dead_letter.rs`**: Dead-letter queue storage backend
  - SQLite-based persistent storage
  - Stores failed deliveries for inspection
  - Queryable by ID or with pagination

- **`monitor.rs`**: Webhook monitoring tool
  - Inspect dead-lettered deliveries
  - Generate reports and metrics
  - Query interface for operational use

## Usage

### Basic Setup

```rust
use webhook_sdk::{
    retry::RetryConfig,
    delivery::WebhookDeliverer,
    dead_letter::DeadLetterQueue,
    monitor::WebhookMonitor,
    types::WebhookDelivery,
};
use sqlx::sqlite::SqlitePool;
use std::time::Duration;

#[tokio::main]
async fn main() {
    // Initialize database
    let pool = SqlitePool::connect("sqlite://webhooks.db").await.unwrap();
    let dlq = DeadLetterQueue::new(pool);
    dlq.initialize().await.unwrap();

    // Create monitor for inspection
    let monitor = WebhookMonitor::new(dlq.clone());

    // Configure retry behavior
    let retry_config = RetryConfig::default(); // 5 retries, exponential backoff

    // Create deliverer
    let deliverer = WebhookDeliverer::new(retry_config);

    // Create and deliver a webhook
    let delivery = WebhookDelivery::new(
        "https://example.com/webhook".to_string(),
        serde_json::json!({"event": "attestation_created"}),
    );

    match deliverer.deliver(delivery).await {
        Ok(result) => println!("Delivered successfully"),
        Err(e) => println!("Delivery failed: {}", e),
    }

    // Inspect dead-letters
    let report = monitor.generate_report().await.unwrap();
    println!("Total dead-letters: {}", report.total_dead_letters);
}
```

### Retry Configuration

The `RetryConfig` provides fine-grained control over retry behavior:

```rust
use webhook_sdk::retry::RetryConfig;
use std::time::Duration;

let config = RetryConfig {
    max_retries: 5,                              // Try up to 5 times
    initial_backoff: Duration::from_millis(100), // Start with 100ms
    max_backoff: Duration::from_secs(60),        // Cap at 60s
    backoff_multiplier: 2.0,                     // 2x exponential growth
};
```

Backoff durations for the default config:
- Attempt 0: 100ms
- Attempt 1: 200ms
- Attempt 2: 400ms
- Attempt 3: 800ms
- Attempt 4: 1.6s
- (Further attempts capped at 60s)

### Monitoring Dead-Letters

The webhook monitor provides tools to inspect failed deliveries:

```rust
let monitor = WebhookMonitor::new(dlq);

// Get specific dead-letter by ID
if let Some(dl) = monitor.get_dead_letter(id).await.unwrap() {
    println!("URL: {}", dl.delivery.url);
    println!("Error: {}", dl.delivery.error.unwrap_or_default());
    println!("Attempts: {}", dl.delivery.attempt);
}

// List dead-letters with pagination
let dead_letters = monitor.list_dead_letters(10, 0).await.unwrap();

// Get total count
let count = monitor.dead_letter_count().await.unwrap();

// Generate report
let report = monitor.generate_report().await.unwrap();
```

### Idempotent Processing

Ensures at-most-once execution of side effects by detecting and handling duplicate deliveries:

```rust
use webhook_sdk::{IdempotentWebhookProcessor, IdempotencyStore, WebhookDeliverer};

let pool = SqlitePool::connect("sqlite://webhooks.db").await?;
let idempotency_store = IdempotencyStore::new(pool);
idempotency_store.initialize().await?;

let deliverer = WebhookDeliverer::new(RetryConfig::default());
let processor = IdempotentWebhookProcessor::new(deliverer, idempotency_store);

// First delivery
let delivery1 = WebhookDelivery::new(url1, payload.clone());
let result1 = processor.process(delivery1).await?;
println!("First: duplicate={}", result1.is_duplicate); // false

// Duplicate delivery with same payload
let delivery2 = WebhookDelivery::new(url2, payload);
let result2 = processor.process(delivery2).await?;
println!("Second: duplicate={}", result2.is_duplicate); // true
// Returns cached response without re-executing side effect
```

#### How It Works

1. **Stable Key Derivation**: SHA256 hash of the payload produces deterministic idempotency key
2. **Duplicate Detection**: First delivery records idempotency key and response
3. **Cached Response**: Subsequent deliveries with same payload return cached response
4. **No Side Effect Re-execution**: Duplicate deliveries skip the webhook POST and return immediately

## Acceptance Criteria (Issue #119)

- ✅ Reuses the existing `retry_with_backoff` helper (implemented as `RetryConfig`)
- ✅ Dead-lettered deliveries are inspectable via the webhook monitor tool
- ✅ Tests cover a delivery exhausting retries and landing in the dead-letter path

## Acceptance Criteria (Issue #120)

- ✅ Uses stable idempotency key derived from webhook payload (SHA256)
- ✅ Duplicate delivery detected and no-op response returned without re-executing side effect
- ✅ Tests cover same delivery arriving twice with only one on-chain action resulting

## Testing

Run tests with:

```bash
cargo test --manifest-path webhook-sdk/Cargo.toml
```

Key test coverage:
- `test_delivery_exhausts_retries_and_lands_in_dead_letter` - Verifies failed deliveries reach dead-letter queue
- `test_dead_letter_storage_and_retrieval` - Confirms dead-letter persistence and querying
- `test_dead_letter_inspection_via_monitor` - Validates monitor inspection capabilities
- `test_same_delivery_twice_only_triggers_once` - Verifies idempotent processing prevents duplicate execution
- `test_idempotency_key_derives_from_payload` - Confirms stable key derivation
- `test_duplicate_delivery_returns_cached_response` - Validates duplicate detection and caching

## Database Schema

The dead-letter queue uses SQLite with the following schema:

```sql
CREATE TABLE dead_letters (
    id TEXT PRIMARY KEY,
    delivery_id TEXT NOT NULL,
    url TEXT NOT NULL,
    payload TEXT NOT NULL,
    status_code INTEGER,
    response_body TEXT,
    attempt INTEGER NOT NULL,
    error TEXT,
    created_at TEXT NOT NULL,
    last_attempted_at TEXT,
    delivered BOOLEAN NOT NULL,
    reason TEXT NOT NULL,
    dead_lettered_at TEXT NOT NULL
);
```

## Future Enhancements

- Replay capability for dead-lettered deliveries
- Webhook delivery queuing (background job system)
- Metrics and observability hooks
- Event sourcing integration with on-chain contract
