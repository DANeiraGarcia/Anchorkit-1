# Mutation testing (`src/contract.rs`)

[`cargo-mutants`](https://mutants.rs/) is used to find branches in the
contract's dispatch logic that could be deleted or flipped without any
existing test noticing. It's scoped to `src/contract.rs` -- the contract
entry points -- since that's the surface where a silently-wrong branch
(a missing auth check, an inverted comparison) has the highest blast radius.

## Running it locally

```sh
cargo install cargo-mutants --locked
cargo mutants --file src/contract.rs -- --lib
```

Results land in `mutants.out/` (`caught.txt`, `missed.txt`, `unviable.txt`).

## Baseline result

First run, before any fix:

```
Found 35 mutants to test
35 mutants tested in 2m: 1 missed, 32 caught, 2 unviable
```

One mutant survived:

```
src/contract.rs:223:83: replace < with <= in AnchorKitContract::is_valid
```

`is_valid` reads `env.ledger().timestamp() < a.expires_at`. The existing
`is_valid_false_after_expiry` test only checked one second *past* expiry, so
a mutant that let the exact `timestamp == expires_at` instant count as valid
went undetected -- `expires_at` is meant to be exclusive.

**Fix:** added `is_valid_false_exactly_at_expires_at` in
`src/attest_tests.rs`, which sets the ledger timestamp to exactly
`expires_at` and asserts the attestation now reads as invalid.

Result after the fix:

```
Found 35 mutants to test
35 mutants tested in 2m: 33 caught, 2 unviable
```

100% of viable mutants are now caught. The 2 "unviable" mutants are ones
`cargo-mutants` generated that don't compile (e.g. `Ok(Default::default())`
against a type with no `Default`) -- not real survivors, just infeasible
mutations.

## CI wiring

Mutation testing runs on a schedule (weekly) and via manual
`workflow_dispatch`, in `.github/workflows/mutation-testing.yml` -- **not**
on every PR. A full mutant sweep re-builds and re-tests once per surviving
candidate, which is too slow to gate routine PRs on. The report is uploaded
as a build artifact for review.
