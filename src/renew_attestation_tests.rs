use soroban_sdk::testutils::Address as _;
use soroban_sdk::{Address, Bytes, Symbol};

use crate::errors::Error;
use crate::hash::compute_payload_hash;
use crate::test_util::setup;

const ONE_DAY: u64 = 24 * 60 * 60;

fn attested_kind(env: &soroban_sdk::Env) -> Symbol {
    Symbol::new(env, "kyc_approved")
}

#[test]
fn attestor_can_renew_own_attestation() {
    let s = setup();
    let attestor = Address::generate(&s.env);
    let subject = Address::generate(&s.env);
    s.client.add_attestor(&attestor);

    let kind = attested_kind(&s.env);
    let hash = compute_payload_hash(&s.env, &Bytes::from_slice(&s.env, b"payload"));
    s.client.attest(&attestor, &subject, &kind, &hash, &ONE_DAY);

    s.client.renew_attestation(&attestor, &subject, &kind);

    // Content is unchanged by a renewal.
    let stored = s.client.get_attestation(&subject, &kind);
    assert_eq!(stored.payload_hash, hash);
}

#[test]
fn admin_can_renew_any_attestation() {
    let s = setup();
    let attestor = Address::generate(&s.env);
    let subject = Address::generate(&s.env);
    s.client.add_attestor(&attestor);

    let kind = attested_kind(&s.env);
    let hash = compute_payload_hash(&s.env, &Bytes::from_slice(&s.env, b"payload"));
    s.client.attest(&attestor, &subject, &kind, &hash, &ONE_DAY);

    s.client.renew_attestation(&s.admin, &subject, &kind);

    let stored = s.client.get_attestation(&subject, &kind);
    assert_eq!(stored.payload_hash, hash);
}

#[test]
fn cannot_renew_nonexistent_attestation() {
    let s = setup();
    let subject = Address::generate(&s.env);
    let kind = attested_kind(&s.env);

    assert_eq!(
        s.client.try_renew_attestation(&s.admin, &subject, &kind),
        Err(Ok(Error::AttestationNotFound))
    );
}

#[test]
fn unrelated_caller_cannot_renew() {
    let s = setup();
    let attestor = Address::generate(&s.env);
    let subject = Address::generate(&s.env);
    let bystander = Address::generate(&s.env);
    s.client.add_attestor(&attestor);

    let kind = attested_kind(&s.env);
    let hash = compute_payload_hash(&s.env, &Bytes::from_slice(&s.env, b"payload"));
    s.client.attest(&attestor, &subject, &kind, &hash, &ONE_DAY);

    assert_eq!(
        s.client.try_renew_attestation(&bystander, &subject, &kind),
        Err(Ok(Error::Unauthorized))
    );
}
