## Add Webhook Retry and Dead-Letter Handling

### Description
This PR implements webhook retry-with-backoff and dead-letter queue support for AnchorKit, addressing issue #119.

Failed webhook deliveries are now automatically retried with exponential backoff. Deliveries that exhaust all retries are stored in a persistent dead-letter queue that can be inspected via the webhook monitor tool, preventing silent failure and enabling operational debugging.

### Changes
- **RetryConfig** - Configurable exponential backoff helper with sensible defaults (5 retries, 100ms→60s)
- **WebhookDeliverer** - Sends webhooks with automatic retry logic and error tracking
- **DeadLetterQueue** - SQLite-based storage for failed deliveries with querying and pagination support
- **WebhookMonitor** - Tool to inspect, list, and generate reports on dead-lettered deliveries
- **Workspace structure** - Converted root Cargo.toml to workspace with webhook-sdk as member

### Acceptance Criteria ✅
- ✅ Reuses existing retry_with_backoff pattern (implemented as RetryConfig)
- ✅ Dead-lettered deliveries are inspectable via webhook monitor tool
- ✅ Tests cover delivery exhausting retries and landing in dead-letter path

### Test Coverage
- `test_delivery_exhausts_retries_and_lands_in_dead_letter` - Verifies max retry exhaustion
- `test_dead_letter_storage_and_retrieval` - Confirms persistence and data integrity
- `test_dead_letter_inspection_via_monitor` - Validates monitor inspection capabilities
- `test_dead_letter_retrieval_by_id` - Tests specific dead-letter lookup and pagination

### Architecture
```
Anchorkit-1/
├── src/                 # On-chain contract (unchanged)
├── webhook-sdk/         # NEW: Off-chain webhook delivery SDK
│   ├── src/
│   │   ├── retry.rs     # Retry-with-backoff logic
│   │   ├── delivery.rs  # Webhook POST with retries
│   │   ├── dead_letter.rs # Dead-letter queue storage
│   │   ├── monitor.rs   # Inspection/monitoring tool
│   │   └── types.rs     # Shared data types
│   └── tests/
└── Cargo.toml          # Workspace configuration
```

### Example Usage
```rust
let pool = SqlitePool::connect("sqlite://webhooks.db").await?;
let dlq = DeadLetterQueue::new(pool);
dlq.initialize().await?;

let monitor = WebhookMonitor::new(dlq);
let deliverer = WebhookDeliverer::new(RetryConfig::default());

// Attempt delivery with automatic retries
let delivery = WebhookDelivery::new(url, payload);
match deliverer.deliver(delivery).await {
    Ok(_) => println!("Success"),
    Err(e) => println!("Failed after retries: {}", e),
}

// Inspect failures
let report = monitor.generate_report().await?;
println!("Dead-letters: {}", report.total_dead_letters);
```

### Breaking Changes
None. This is a new module that doesn't affect existing contract functionality.

### Notes
- Database schema is created automatically on first initialization
- Default retry config: 5 attempts with 100ms→60s exponential backoff
- All operations are async/await compatible with Tokio
