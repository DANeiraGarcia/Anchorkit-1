# AnchorKit-1

AnchorKit is a Soroban-native toolkit for anchoring off-chain attestations to
Stellar. It enables smart contracts to verify real-world events such as KYC
approvals, payment confirmations, and signed claims in a trust-minimized way.

An attestor (an off-chain authority a subject already trusts, e.g. a KYC
provider or a payment processor) submits a sha256 fingerprint of an
off-chain decision to the contract. Any other contract or client can then
check on-chain whether that fingerprint is present, active, and unexpired,
without the anchor ever having to store or expose the underlying payload.

## Status: core contract only, ~50% of the planned surface

This repository currently implements the **on-chain Soroban contract** —
attestation lifecycle, attestor allow-listing, admin control, pause/circuit
breaker, and payload hashing — with a full unit test suite. It intentionally
does **not** yet include the off-chain SDK layer (SEP-10 auth, SEP-6
deposit/withdraw flows, rate limiting/retry helpers, anchor discovery), the
CLI, the React/Storybook UI components, or the docs site that a complete
toolkit would ship. Those are tracked as GitHub issues (see below) rather
than stubbed out in-tree.

## Contract surface

| Method | Description |
|---|---|
| `initialize(admin)` | One-time setup; `admin` must authorize the call. |
| `get_admin()` / `set_admin(new_admin)` | Read/transfer contract administration. |
| `pause()` / `unpause()` / `is_paused()` | Admin circuit breaker; blocks `attest`/`revoke` while active, reads still work. |
| `add_attestor(attestor)` / `remove_attestor(attestor)` / `is_attestor(attestor)` | Admin-managed allow-list of addresses permitted to attest. |
| `attest(attestor, subject, attestation_type, payload_hash, ttl_seconds)` | Anchors a sha256 payload hash on-chain for `subject` under `attestation_type`. Requires `attestor` to be allow-listed and to authorize the call. |
| `get_attestation(subject, attestation_type)` | Fetches a stored attestation, or `AttestationNotFound`. |
| `is_valid(subject, attestation_type)` | `true` iff an attestation exists, is active, and hasn't expired. |
| `revoke(caller, subject, attestation_type)` | Revokes an attestation; `caller` must be the admin or the original attestor. |
| `get_attestation_count()` | Running count of attestations ever submitted. |

Supporting modules:
- `hash` — `compute_payload_hash` / `verify_payload_hash`, thin wrappers over the host's sha256.
- `domain_validator` — syntactic validation of anchor domain strings (the kind of hostname an attestor would publish a `stellar.toml` under).

## Building and testing

```sh
# Run the unit test suite (native target)
cargo test

# Build the deployable contract (requires Rust 1.84+ for wasm32v1-none)
rustup target add wasm32v1-none
cargo build --target wasm32v1-none --release
```

## Roadmap

The gap between this ~50%-built core and a complete toolkit is tracked as
GitHub issues, labeled by area and difficulty. Expect issues covering:
off-chain SEP-10/SEP-6 flows, rate limiting and retry/backoff, anchor
discovery and health scoring, attestation pagination and audit logging,
replay-window protection, a CLI, UI components, and end-to-end docs.

## License

MIT
