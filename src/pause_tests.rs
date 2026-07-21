use soroban_sdk::testutils::Address as _;
use soroban_sdk::{Address, Bytes, Symbol};

use crate::errors::Error;
use crate::hash::compute_payload_hash;
use crate::test_util::setup;

const ONE_DAY: u64 = 24 * 60 * 60;

#[test]
fn pause_blocks_attest_and_unpause_restores_it() {
    let s = setup();
    let attestor = Address::generate(&s.env);
    let subject = Address::generate(&s.env);
    s.client.add_attestor(&attestor);

    let kind = Symbol::new(&s.env, "kyc_approved");
    let hash = compute_payload_hash(&s.env, &Bytes::from_slice(&s.env, b"payload"));

    s.client.pause();
    assert!(s.client.is_paused());
    assert_eq!(
        s.client.try_attest(&attestor, &subject, &kind, &hash, &ONE_DAY),
        Err(Ok(Error::ContractPaused))
    );

    s.client.unpause();
    assert!(!s.client.is_paused());
    s.client.attest(&attestor, &subject, &kind, &hash, &ONE_DAY);
    assert!(s.client.is_valid(&subject, &kind));
}

#[test]
fn pause_blocks_revoke() {
    let s = setup();
    let attestor = Address::generate(&s.env);
    let subject = Address::generate(&s.env);
    s.client.add_attestor(&attestor);

    let kind = Symbol::new(&s.env, "kyc_approved");
    let hash = compute_payload_hash(&s.env, &Bytes::from_slice(&s.env, b"payload"));
    s.client.attest(&attestor, &subject, &kind, &hash, &ONE_DAY);

    s.client.pause();
    assert_eq!(
        s.client.try_revoke(&attestor, &subject, &kind),
        Err(Ok(Error::ContractPaused))
    );
}

#[test]
fn reads_still_work_while_paused() {
    let s = setup();
    let attestor = Address::generate(&s.env);
    let subject = Address::generate(&s.env);
    s.client.add_attestor(&attestor);

    let kind = Symbol::new(&s.env, "kyc_approved");
    let hash = compute_payload_hash(&s.env, &Bytes::from_slice(&s.env, b"payload"));
    s.client.attest(&attestor, &subject, &kind, &hash, &ONE_DAY);

    s.client.pause();

    assert!(s.client.is_valid(&subject, &kind));
    let stored = s.client.get_attestation(&subject, &kind);
    assert_eq!(stored.payload_hash, hash);
}

#[test]
fn non_admin_cannot_pause() {
    let s = setup();
    s.env.set_auths(&[]);
    let result = s.client.try_pause();
    assert!(result.is_err());
}
