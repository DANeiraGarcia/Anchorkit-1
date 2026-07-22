#!/usr/bin/env bash
set -euo pipefail

# Minimum required Rust version
MIN_RUST_VERSION="1.75.0"

echo "==> Running CI Preflight Check..."

# 1. Check if rustc is installed
if ! command -v rustc &> /dev/null; then
    echo "ERROR: Rust compiler (rustc) is not found."
    exit 1
fi

INSTALLED_FULL_VERSION=$(rustc --version)
echo "Found Rust version: ${INSTALLED_FULL_VERSION}"

# Extract semantic version number (e.g., "1.97.1")
INSTALLED_VERSION=$(echo "$INSTALLED_FULL_VERSION" | awk '{print $2}')

# Compare versions using semantic version sorting
LOWER_VERSION=$(printf '%s\n%s' "$MIN_RUST_VERSION" "$INSTALLED_VERSION" | sort -V | head -n1)

if [ "$LOWER_VERSION" != "$MIN_RUST_VERSION" ]; then
    echo "ERROR: Rust version $INSTALLED_VERSION is older than the required minimum version $MIN_RUST_VERSION."
    echo "Please update Rust using: rustup update"
    exit 1
fi

# 2. Check if rustup is installed
if ! command -v rustup &> /dev/null; then
    echo "ERROR: rustup is required to manage toolchains/targets."
    exit 1
fi

# 3. Verify that the wasm32v1-none target is installed
echo "Checking for target: wasm32v1-none..."
if rustup target list | grep -q "wasm32v1-none (installed)"; then
    echo "SUCCESS: Target wasm32v1-none is installed."
else
    echo "ERROR: Required target 'wasm32v1-none' is missing."
    echo "Please install it by running: rustup target add wasm32v1-none"
    exit 1
fi

echo "==> CI Preflight Check passed successfully!"