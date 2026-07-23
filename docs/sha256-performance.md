# SHA-256 Hashing Performance Guidance

This page documents the performance characteristics of the SHA-256 hashing implementation in the AnchorKit smart contract and provides practical recommendations for callers constructing off-chain data to hash.

## Overview

AnchorKit anchors off-chain decisions on-chain by storing only their 32-byte SHA-256 digest (`payload_hash`). This ensures privacy and minimizes ledger footprint. While hashing can happen off-chain (highly recommended), the contract also provides on-chain wrappers via `compute_payload_hash` and `verify_payload_hash` which call the Soroban host environment's crypto engine (`env.crypto().sha256`).

To understand the cost and scaling of hashing on-chain, we benchmarked `compute_payload_hash` across a range of representative payload sizes.

---

## Benchmark Results

The benchmarks were executed within the metered Soroban environment to isolate CPU instruction (gas) and memory costs. Average wall-clock execution time and throughput were measured across multiple iterations (up to 50,000 runs) to ensure stability and reproducibility.

| Payload Size | CPU Instructions (Gas) | Memory Cost (Bytes) | Avg Wall-Clock Time | Throughput |
|-------------:|-----------------------:|--------------------:|--------------------:|-----------:|
| **32 B**     | 6,645                  | 128 B               | ~38.6 µs            | 0.79 MB/s  |
| **64 B**     | 8,398                  | 128 B               | ~52.0 µs            | 1.17 MB/s  |
| **1 KB**     | 60,988                 | 128 B               | ~277.8 µs           | 3.52 MB/s  |
| **16 KB**    | 902,428                | 128 B               | ~2.65 ms            | 5.89 MB/s  |
| **32 KB**    | 1,799,964              | 128 B               | ~4.75 ms            | 6.59 MB/s  |
| **64 KB**    | 3,595,036              | 128 B               | ~10.66 ms           | 5.86 MB/s  |

---

## Key Findings & Scaling Characteristics

### 1. Linear CPU Instructions Scaling
CPU instruction cost scales linearly with the size of the payload. Based on the benchmark data, the CPU cost model is defined by:

$$\text{CPU Cost (instructions)} = 4,892 + 54.78 \times \text{Size (bytes)}$$

* **Base calling overhead:** ~4,892 instructions.
* **Incremental cost:** ~54.78 instructions per byte.

### 2. Constant Memory Cost
The memory footprint is **flat at exactly 128 bytes** regardless of payload size. 
This is because the Soroban host environment processes the hashing operation natively in its VM host functions without allocating extra memory buffer space inside the WebAssembly contract instance.

### 3. Wall-Clock Latency & Throughput
* Latency scales linearly with size, going from **~38.6 microseconds** for small payloads to **~10.66 milliseconds** for a 64 KB payload.
* Throughput peaks around **6.59 MB/s** at 32 KB and starts to plateau as memory-copy and serialization overheads dominate.

---

## Practical Sizing Guidance for Callers

When designing off-chain payloads (e.g., attestations, user claims, or KYC metadata) to be anchored on-chain, callers must carefully evaluate where hashing occurs.

### 1. Compute Hashes Off-Chain (Recommended)
Whenever possible, **callers should compute the SHA-256 hash off-chain** and submit only the 32-byte digest (`BytesN<32>`) to the smart contract (e.g., using the `attest` method). 
* **Pros:** Saves 100% of the on-chain hashing CPU cost and transaction execution latency.
* **Cons:** Requires the caller to run standard SHA-256 libraries (available in all languages).

### 2. Sizing Targets for On-Chain Hashing
If the smart contract itself must compute or verify the hash on-chain (e.g., checking raw data submitted by a user against a registered hash):

* > [!TIP]
  > **Target Size: Under 1 KB**
  > Hashing payloads under 1 KB (e.g., small JSON objects, token metadata, or structured IDs) consumes **under 61,000 CPU instructions** (less than 0.06% of the 100,000,000 per-transaction CPU limit).

* > [!IMPORTANT]
  > **Moderate Size: 1 KB to 16 KB**
  > Pays up to ~900,000 CPU instructions. This is acceptable for single attestations but will restrict the ability to run batch operations (like `attest_batch`) in a single transaction.

* > [!WARNING]
  > **High Size: Over 16 KB**
  > Avoid hashing payloads larger than 16 KB on-chain. For instance, hashing a 64 KB payload requires **3.59 million CPU instructions** (~3.6% of the total transaction limit) for the hashing operation alone. In batch operations, this limit will quickly exhaust the transaction gas limits.
