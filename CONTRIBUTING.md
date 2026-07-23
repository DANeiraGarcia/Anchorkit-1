# Contributing Guidelines

Thank you for contributing to AnchorKit!

## Local Development Requirements

Before running tests or submitting a Pull Request, ensure your environment meets the toolchain requirements:

1. Rust installed (`rustc`, `cargo`, `rustup`).
2. Target `wasm32v1-none` added:

   ```bash
   rustup target add wasm32v1-none
   ```
   > **Windows users:** see [WINDOWS_SETUP.md](./WINDOWS_SETUP.md) for toolchain installation via PowerShell, plus known gotchas (path length limits, line endings).

## Local CI Preflight Check

To verify that your toolchain and target are correctly set up before submitting a PR, run the preflight script:

```bash
./scripts/ci_preflight_check.sh
```

>On Windows, run this via **Git Bash** or **WSL** — PowerShell cannot execute `.sh` scripts directly. See [WINDOWS_SETUP.md](./WINDOWS_SETUP.md) for details.