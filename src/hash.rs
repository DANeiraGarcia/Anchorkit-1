use soroban_sdk::{Bytes, BytesN, Env};

/// Computes the sha256 digest of an off-chain payload. The contract stores
/// only this digest, never the payload itself, so attestors can later prove
/// (off-chain) that a specific payload matches what was anchored on-chain.
pub fn compute_payload_hash(env: &Env, data: &Bytes) -> BytesN<32> {
    env.crypto().sha256(data).into()
}

/// Verifies that `data` hashes to `expected`.
pub fn verify_payload_hash(env: &Env, data: &Bytes, expected: &BytesN<32>) -> bool {
    &compute_payload_hash(env, data) == expected
}

#[cfg(test)]
mod tests {
    use super::*;
    use soroban_sdk::Env;

    #[test]
    fn same_input_hashes_the_same() {
        let env = Env::default();
        let data = Bytes::from_slice(&env, b"kyc-approved:alice");
        let a = compute_payload_hash(&env, &data);
        let b = compute_payload_hash(&env, &data);
        assert_eq!(a, b);
    }

    #[test]
    fn different_input_hashes_differently() {
        let env = Env::default();
        let a = compute_payload_hash(&env, &Bytes::from_slice(&env, b"payload-a"));
        let b = compute_payload_hash(&env, &Bytes::from_slice(&env, b"payload-b"));
        assert_ne!(a, b);
    }

    #[test]
    fn verify_matches_computed_hash() {
        let env = Env::default();
        let data = Bytes::from_slice(&env, b"payment-confirmed:12345");
        let hash = compute_payload_hash(&env, &data);
        assert!(verify_payload_hash(&env, &data, &hash));
    }

    #[test]
    fn verify_rejects_tampered_payload() {
        let env = Env::default();
        let original = Bytes::from_slice(&env, b"payment-confirmed:12345");
        let hash = compute_payload_hash(&env, &original);
        let tampered = Bytes::from_slice(&env, b"payment-confirmed:99999");
        assert!(!verify_payload_hash(&env, &tampered, &hash));
    }
}
