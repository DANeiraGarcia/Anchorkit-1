# Platform-specific build quirks

## Verified platforms

| Platform | Rust version tested | `wasm32v1-none` build | `cargo test` (native) | Notes |
|---|---|---|---|---|
| Windows 11 (x86_64-pc-windows-gnu) | 1.95.0 | ✅ | ❌ see issue below | Export-ordinal overflow, see #WIN-1 |
| Linux (ubuntu-latest, GitHub Actions) | stable (≥ 1.91 effective) | ✅ | ✅ | CI green |
| macOS (macos-latest, GitHub Actions) | stable (≥ 1.91 effective) | ✅ | ✅ | No quirks observed |

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
- Toolchain: `x86_64-pc-windows-gnu` (the default `rustup` target on Windows
  when MinGW is used as the linker back-end)
- Command: `cargo test` (debug or release, either works the same way)

### Unaffected

- `cargo build --target wasm32v1-none --release` — produces the deployable
  contract and succeeds on all platforms including Windows.
- `x86_64-pc-windows-msvc` toolchain — would avoid the GNU linker but requires
  Visual Studio Build Tools (`link.exe`).  Confirmed absent in the test
  environment; **not yet verified as a workaround**.

### Workaround (current)

Run the test suite on Linux or macOS (or the Linux GitHub Actions runner).  The
CI matrix skips `cargo test` on `windows-latest` with an explanatory comment
and covers both Linux and macOS instead.

### Recommended follow-up actions

1. Verify whether `x86_64-pc-windows-msvc` + VS Build Tools resolves the
   ordinal overflow (most likely yes, because MSVC uses a different export
   mechanism).
2. Investigate whether `--target x86_64-pc-windows-gnu` with a linker flag
   (`-Wl,--exclude-libs,ALL` or reducing symbols with `#[cfg(test)]` feature
   gates) can bring the export count below the ceiling.
3. Once a Windows-native test path is confirmed, re-enable `cargo test` in the
   CI matrix for `windows-latest`.

### References

- PE/COFF spec §5.3 — Export Directory Table, ordinal field width
- Rust issue tracker: search "export ordinal too large mingw"
- CI matrix workaround: `.github/workflows/ci.yml`
