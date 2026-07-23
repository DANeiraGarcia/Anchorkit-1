# Platform-specific build quirks

## Verified platforms

| Platform | Rust version tested | `wasm32v1-none` build | `cargo test` (native) | Notes |
|---|---|---|---|---|
| Windows (windows-latest, GitHub Actions, `x86_64-pc-windows-msvc`) | stable (≥ 1.91 effective) | ✅ | ✅ | CI green — MSVC's export mechanism isn't subject to #WIN-1 |
| Windows 11, local (`x86_64-pc-windows-gnu`) | 1.95.0 | ✅ | ❌ see issue below | Export-ordinal overflow, see #WIN-1 -- GNU-toolchain-specific, not hit in CI |
| Linux (ubuntu-latest, GitHub Actions) | stable (≥ 1.91 effective) | ✅ | ✅ | CI green |
| macOS (macos-latest, GitHub Actions) | stable (≥ 1.91 effective) | ✅ | ✅ | No quirks observed |

The CI matrix (`.github/workflows/ci.yml`) runs `cargo test` on all three
platforms. `dtolnay/rust-toolchain@stable` installs `windows-latest`'s
default host toolchain, `x86_64-pc-windows-msvc`, since the workflow doesn't
override the host triple; the runner image ships Visual Studio Build Tools
preinstalled specifically to support that default. #WIN-1 below is
specific to a `x86_64-pc-windows-gnu`/MinGW setup, which is what a local
Windows install (or a manually GNU-targeted CI job) would pick up if not
explicitly avoided — it does not affect this CI matrix.

---

## Issue #WIN-1 — `cargo test` fails on `x86_64-pc-windows-gnu` with "export ordinal too large"

### Summary

Running `cargo test` on a Windows host using the `x86_64-pc-windows-gnu` Rust
toolchain fails at the link step with:

```
ld: error: export ordinal too large: 76164
error: linking with `x86_64-w64-mingw32-gcc` failed: exit code: 1
```

### Root cause

The PE/COFF DLL format limits exported symbol ordinals to 16 bits (max 65 535).
The `soroban-sdk` test harness (`features = ["testutils"]`) brings in the full
host environment — cryptographic curves, WASM interpreter, XDR codecs — which
pushes the combined symbol count well past that ceiling when linked as a Windows
DLL.  This is a fundamental PE format constraint, not a bug in the project code.

### Affected configuration

- OS: Windows (any version)
- Toolchain: `x86_64-pc-windows-gnu` (picked up when MinGW is used as the
  linker back-end, e.g. a local `rustup` install that defaults to or
  explicitly adds the GNU target)
- Command: `cargo test` (debug or release, either works the same way)

### Unaffected

- `cargo build --target wasm32v1-none --release` — produces the deployable
  contract and succeeds on all platforms including Windows.
- `x86_64-pc-windows-msvc` toolchain — confirmed as a working alternative.
  This is `windows-latest`'s default host toolchain in GitHub Actions (Visual
  Studio Build Tools are preinstalled on the runner image), so the CI matrix
  hits this path automatically without any extra configuration and runs
  `cargo test` on Windows same as Linux/macOS.

### Workaround (current)

If you hit this locally on a `x86_64-pc-windows-gnu` toolchain, either switch
to the `x86_64-pc-windows-msvc` toolchain (`rustup toolchain install
stable-x86_64-pc-windows-msvc`, requires Visual Studio Build Tools) or run the
test suite on Linux/macOS/WSL instead. This does not affect CI, which already
runs on MSVC.

### Recommended follow-up actions

1. ~~Verify whether `x86_64-pc-windows-msvc` + VS Build Tools resolves the
   ordinal overflow~~ — done: CI's `windows-latest` runner uses MSVC by
   default and runs the full suite green.
2. Investigate whether `--target x86_64-pc-windows-gnu` with a linker flag
   (`-Wl,--exclude-libs,ALL` or reducing symbols with `#[cfg(test)]` feature
   gates) can bring the export count below the ceiling, for contributors who
   specifically need a GNU-toolchain Windows setup.
3. ~~Once a Windows-native test path is confirmed, re-enable `cargo test` in
   the CI matrix for `windows-latest`~~ — done, see `.github/workflows/ci.yml`.

### References

- PE/COFF spec §5.3 — Export Directory Table, ordinal field width
- Rust issue tracker: search "export ordinal too large mingw"
- CI matrix: `.github/workflows/ci.yml`
