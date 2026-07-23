# Storage rent cost analysis

## Goal

Model actual Soroban persistent-storage rent pricing against the TTL bump
thresholds/extend-to values in `src/storage.rs`, and tune them to minimize
attestor cost while keeping data safely alive. This document is the worked
cost comparison and rationale referenced by the constants in that file.

## The rent model

Soroban charges rent for a persistent entry through `extend_ttl(key,
threshold, extend_to)`:

- `extend_to` is what's paid for: the fee scales linearly with the entry's
  size in bytes and with the number of ledgers `extend_to` requests. Buying
  a longer window costs proportionally more; buying it in fewer, larger
  bumps doesn't cost more per ledger than buying it in many small ones.
- `threshold` doesn't affect cost directly — it only gates *whether* a call
  pays anything. If the entry's current remaining TTL is already above
  `threshold`, the call is a free no-op. If it's below, the entry's TTL is
  reset so that `live_until_ledger = current_ledger + extend_to`.

So for a given entry, total rent paid over time is: (rent per bump) ×
(number of bumps). Rent per bump is `R × S × extend_to`, where `R` is the
network's per-byte-per-ledger rent rate (a governance-set parameter) and
`S` is the entry's size in bytes. Because both scenarios below store the
exact same `Attestation`/`Attestor` shape, `R` and `S` are identical on
both sides of every comparison — they cancel out, so the percentage
differences below hold regardless of their exact current values. (The
live values of `R` and the entry's exact XDR-encoded size can be read off
a `simulateTransaction` resource-fee breakdown for this contract if an
absolute stroop figure is ever needed; they aren't needed for the relative
comparison here.)

One fact about `extend_to` matters more than the fee formula: **Soroban
clamps any `extend_ttl` request to the network's `max_entry_ttl`, silently,
without erroring.** This was confirmed directly against the SDK's bundled
network defaults (`soroban_sdk::testutils::ledger::LedgerInfo::default()`
in `soroban-sdk` 26.1.1 sets `max_entry_ttl: 6_312_000` — see
`src/storage.rs`'s `MAX_ENTRY_TTL_LEDGERS`, and
`src/storage_ttl_tests.rs` exercises it): asking for more than
6,312,000 ledgers (≈365 days at the network's 5-second average ledger
close time) doesn't buy more TTL, it's capped down to that ceiling. No
single bump can pre-purchase a persistent entry's TTL beyond that,
regardless of size or fee.

## What the old thresholds got wrong

```rust
const ATTESTATION_TTL_THRESHOLD: u32 = LEDGERS_PER_DAY * 30;
const ATTESTATION_TTL_EXTEND_TO: u32 = LEDGERS_PER_DAY * 365;
```

Both `Attestor` allow-list entries and `Attestation` entries shared this
flat 30-day/365-day window, regardless of how long either entry actually
needed to live:

- **Attestations already carry their own logical lifetime** (`ttl_seconds`,
  tracked as `expires_at`), set by the caller at `attest` time. The flat
  365-day window ignored it completely.
- **Attestor entries have no natural expiry** (membership lasts until an
  admin calls `remove_attestor`) and are essentially write-once — nothing
  re-touches the key between `add_attestor` and `remove_attestor`, so the
  30-day/365-day pair chosen for attestations (which *do* get touched again,
  on `revoke`) was an arbitrary carryover rather than a value chosen for how
  this key type actually behaves.

## Worked comparison: attestation rent by TTL bucket

The new scheme (`storage::attestation_extend_to`) sizes `extend_to` to the
attestation's own remaining lifetime, floored at 30 days (below which the
purchased window becomes impractically short relative to write overhead)
and capped at `MAX_ENTRY_TTL_LEDGERS` (above which the network won't grant
more anyway). Expressing cost as "days of rent bought per write" (with
`R × S` — the per-day rent for one entry — as the common unit, since it's
identical old vs. new):

| Attestation `ttl_seconds` | Old: days bought | New: days bought | Rent per write, relative to old |
|---|---|---|---|
| 1 day (e.g. a short-lived confirmation) | 365 | 30 (floor) | **−92%** |
| 7 days | 365 | 30 (floor) | **−92%** |
| 30 days | 365 | 30 | **−92%** |
| 90 days (a typical KYC re-verification window) | 365 | 90 | **−75%** |
| 180 days | 365 | 180 | **−51%** |
| 365 days | 365 | ~365 | ~0% |
| 730 days (2 years) | 365 | ~365 (clamped to network max) | +0.08%, but see below |

The common case for `attest`/`attest_batch` in a KYC/payment-confirmation
workload is TTLs measured in days to a few months, not years — those are
the rows that matter most in aggregate, and they're 51-92% cheaper per
write under the new scheme with no change in correctness (the purchased
window still comfortably outlives the attestation's own logical expiry).

The last row is the one case that needs more than a bigger constant: an
attestation whose stated TTL exceeds what a single bump can buy. Both old
and new code buy essentially the same ~365-day window here (the old flat
constant happened to be very close to the network's actual ceiling), so
this isn't a regression — but neither one can make a single `attest` call
cover a 2-year lifetime, because the protocol itself won't allow it. See
"Long-lived attestations" below for how this is handled.

## Worked comparison: attestor allow-list rent

Attestor entries move from the shared 30-day/365-day pair to a dedicated
90-day threshold and a `MAX_ENTRY_TTL_LEDGERS` extend-to:

```rust
const ATTESTOR_TTL_THRESHOLD: u32 = LEDGERS_PER_DAY * 90;
const ATTESTOR_TTL_EXTEND_TO: u32 = MAX_ENTRY_TTL_LEDGERS;
```

The absolute rent-per-bump barely changes (both old and new buy ~365 days
in the one call `add_attestor` makes), so this isn't primarily a cost
optimization for attestors — it's a correctness one. The real fix is the
threshold: 90 days rather than 30 gives three times the margin for an
operator to notice and renew a long-standing attestor before its allow-list
entry would otherwise archive, and — since `add_attestor` is realistically
never called again for an attestor that's already registered (it's
rejected with `AttestorAlreadyRegistered`) — there was previously no way to
push that TTL back out at all short of removing and re-adding the
attestor. See "Long-lived attestor entries" below.

## Premature-expiry risk: long-lived entries and the renewal path

Given the `max_entry_ttl` ceiling, any entry that needs to outlive ~365
days — a multi-year attestation, or a long-standing attestor — cannot have
its whole lifetime pre-purchased in a single `extend_ttl` call, no matter
how the constants are tuned. The old code had no answer for this at all:
once `attest` or `add_attestor` ran, nothing else touched that storage key
again until a natural rewrite (`revoke`, or removing and re-adding an
attestor), so a long-lived entry would silently archive roughly a year
after it was written even though it was still supposed to be logically
valid or the attestor still supposed to be allow-listed.

This PR adds two maintenance entrypoints purely for that purpose:

- `renew_attestation(caller, subject, attestation_type)` — re-touches an
  attestation's storage TTL without changing its content. Callable by the
  admin or the original attestor, same authorization as `revoke`.
- `renew_attestor(attestor)` — re-touches an attestor's storage TTL.
  Admin-only, same authorization as `add_attestor`/`remove_attestor`.

Neither changes stored data; both simply give operators (or an off-chain
cron job) a way to keep a long-lived entry alive by calling them well
before the ~365-day ceiling elapses, which is the only way to guarantee no
premature expiry for entries whose natural lifetime exceeds what Soroban
allows in one bump. See `src/storage_ttl_tests.rs` for tests exercising
this against the actual TTL the test host grants.

## Threshold rationale (hysteresis, not cost)

`threshold` doesn't change what's charged, only how often a write actually
triggers a charge. For attestations, threshold is set to half of whatever
window was purchased (`storage::attestation_ttl_window`): a call only pays
again once at least half the bought window has elapsed, so a `revoke` (the
only other thing that touches an attestation's key) doesn't re-trigger
full-price rent unless the attestation is already more than halfway through
its purchased life. For attestor entries, 90 days (up from 30) simply
widens the safety margin before an unrenewed entry would be at risk, given
there's no automatic rewrite to rely on.

## Summary

| | Old | New |
|---|---|---|
| Attestation extend-to | flat 365 days | proportional to `ttl_seconds`, clamped to [30 days, network max] |
| Attestation threshold | flat 30 days | half of the purchased window |
| Attestor extend-to | flat 365 days | network max (`MAX_ENTRY_TTL_LEDGERS`) |
| Attestor threshold | flat 30 days | 90 days |
| Renewal path for entries beyond the network ceiling | none | `renew_attestation` / `renew_attestor` |

Net effect: 51-92% less rent per write for the common short-to-medium-TTL
attestation case, no change for the already-near-ceiling long-TTL case, and
a genuine reduction in premature-expiry risk everywhere, backed by a
renewal mechanism for the one class of entry (multi-year lifetimes) that
no constant tuning alone can fix.
