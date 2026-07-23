# Contract wasm size

## Before / after

Measured via a clean `cargo build --target wasm32v1-none --release` on the
same toolchain (`rustc 1.97.1`, `soroban-sdk 26.1.1`):

| | Size |
|---|---:|
| Before | 53,650 bytes (~52.4 KiB) |
| After | 28,704 bytes (~28.0 KiB) |
| Reduction | 24,946 bytes, ~46.5% |

## Profiling

[`twiggy`](https://github.com/rustwasm/twiggy) (`twiggy top`) was used to see
what the binary was actually spending bytes on:

```
 Shallow Bytes │ Shallow % │ Item
───────────────┼───────────┼──────────────────────────────────
         24865 ┊    46.27% ┊ "function names" subsection
          5472 ┊    10.18% ┊ custom section 'contractspecv0'
          1726 ┊     3.21% ┊ data segment ".rodata"
           943 ┊     1.75% ┊ compiler_builtins::mem::memcpy
           ...
```

Nearly half the binary (46%) was the wasm "function names" custom section --
a debug-info subsection embedded by rustc that maps code offsets back to
Rust symbol names. It has no effect on contract execution; it exists purely
to make disassembly/profiling tools show readable names. `contractspecv0`
(10%) is the Soroban contract ABI/spec metadata that `soroban-cli` and SDKs
read to generate bindings -- required, left untouched.

## Changes made

1. **`strip = true`** added to `[profile.release]` in `Cargo.toml`. This
   drops the "function names" subsection (and any other stray debug/symbol
   data) at build time. Verified with a `twiggy top` diff before/after: every
   `code[...]` item and the `contractspecv0` section are byte-for-byte
   identical -- only the debug-names metadata disappeared. This is the
   entire size win (~24.9 KB); no runtime behavior changes.

2. **Removed the unused `ed25519-dalek` direct dependency** from
   `Cargo.toml`. Nothing in `src/` referenced it (`grep -rn ed25519 src/`
   returns nothing) -- it was declared but never called. In practice LTO had
   already dead-code-eliminated it from the wasm output (removing it changed
   the binary by less than 100 bytes), but it's still worth dropping: it
   shrinks the crate's own dependency list and the set of code paths a
   future change could accidentally start pulling in. `soroban-sdk`'s
   `testutils` (dev-only) and the host-side `soroban-env-host` still bring in
   `ed25519-dalek` transitively for auth verification in tests, so removing
   it here does not affect the test suite.

Nothing under `[profile.release]` that affects arithmetic or panic behavior
(`overflow-checks`, `panic = "abort"`) was touched, per the issue's
"without changing behavior" requirement.

## Reproducing

```sh
cargo build --target wasm32v1-none --release
wc -c target/wasm32v1-none/release/anchorkit.wasm

cargo install twiggy --locked
twiggy top -n 25 target/wasm32v1-none/release/anchorkit.wasm
```
