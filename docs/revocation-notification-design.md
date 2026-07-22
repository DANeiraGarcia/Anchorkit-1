# Revocation notification design

## Goal

Define a webhook-style payload and delivery contract that lets an Anchor notify downstream subscribers when an attestation should be revoked (for example, when an off-chain KYC decision is reversed).

The design must be compatible with the contract's current revoke surface and must avoid exposing the underlying off-chain payload.

## Contract-grounded design

The current revoke method is:

```rust
pub fn revoke(env: Env, caller: Address, subject: Address, attestation_type: Symbol)
```

That means the on-chain revoke event only gives us three durable identifiers:

- `caller`: who triggered the revocation
- `subject`: the attested subject
- `attestation_type`: the attestation type/key

The existing attest flow already records a `payload_hash`, which is enough to reference the attested decision without exposing the payload itself. A revocation notification should therefore identify the attestation using the same stable identifiers that the contract exposes, plus the hash that was already anchored for the original attestation.

## Proposed event envelope

Use a JSON object with an envelope plus an attestation reference block.

```json
{
  "event_id": "01J9Z8Y4MG3QY8P6AQ2R3S4T5V",
  "event_type": "attestation.revoked",
  "occurred_at": "2026-07-22T12:34:56Z",
  "delivery_attempt": 1,
  "idempotency_key": "testnet:GB...:0xabc123:kyc_status:G...",
  "contract": {
    "network": "testnet",
    "contract_id": "CA..."
  },
  "attestation": {
    "subject": "GCC4Q...",
    "attestation_type": "kyc_status",
    "attestor": "GJQ2R...",
    "payload_hash": "sha256:4d7b4d5f2f2c9f8e0d6b0e9a1c3d2a4d8b7e6f5a4d3c2b1a0f9e8d7c6b5a4d3c2b1",
    "revoked_by": "GCC4Q..."
  },
  "reason": {
    "code": "offchain_decision_reversed",
    "message": "The underlying KYC decision was reversed off-chain."
  },
  "state": {
    "before": "active",
    "after": "revoked"
  }
}
```

### Field notes

- `event_id`: unique identifier for this delivery; used for deduplication.
- `idempotency_key`: stable key that the subscriber can persist to avoid double-processing.
- `contract.network` and `contract.contract_id`: help subscribers disambiguate the contract instance and chain.
- `attestation.subject` and `attestation.attestation_type`: the core identifiers that map directly to the contract's revoke inputs.
- `attestation.payload_hash`: allows subscribers to correlate the revocation with the original attestation without exposing the original payload.
- `attestation.revoked_by`: mirrors the `caller` passed to the revoke method.
- `reason.code` and `reason.message`: optional business context for human-readable downstream handling.

## Delivery semantics

### Guarantee

Anchors should treat delivery as at-least-once:

- a subscriber may receive the same notification more than once if a retry or network timeout occurs;
- the delivery should be retried until the subscriber acknowledges success or the retry window expires.

### Recommended transport

Use an HTTPS `POST` to each subscriber endpoint.

- Return `2xx` to acknowledge success.
- Return `5xx`, `429`, or a network timeout to trigger a retry.
- Retry with exponential backoff and jitter (for example: 1s, 5s, 30s, 2m, 10m).
- Stop retrying after a bounded window (for example 24 hours) or when the subscriber explicitly marks the event as dead-lettered.

### Consumer handling

Consumers should be idempotent:

1. Persist `event_id` (or `idempotency_key`) in a local deduplication store.
2. If the same event arrives again, treat it as a duplicate and return success without re-applying the business effect.
3. Reconcile the notification against the current on-chain state before acting. If the attestation is already absent, already revoked, or expired, treat it as a no-op.
4. If the subscriber cannot process the event immediately, it should store it for later processing rather than assuming the delivery failed.

## Why this design fits the current contract

This design is intentionally aligned with the actual revoke contract parameters:

- `subject` and `attestation_type` are included directly because they are the two identifiers the revoke method uses to locate the attestation.
- `revoked_by` is included because the contract exposes `caller` as the actor that initiated the revoke.
- `payload_hash` is included because it is already part of the attestation record and is sufficient to correlate with the original attestation without exposing the full payload.

The payload therefore gives consumers a stable, auditable reference to the attestation while staying privacy-safe.

## Suggested subscriber contract

Subscribers should accept the payload over HTTPS and respond with:

- `2xx` for success and deduplication-safe completion;
- `4xx` for validation errors (for example, malformed payloads) that should not be retried;
- `5xx` or timeout for transient failures that should be retried.

## Recommendation

Adopt this format as the default revocation notification payload for Anchor-issued webhook notifications. It is compact, privacy-preserving, directly derived from the contract's existing attestation model, and safe for at-least-once delivery pipelines.
