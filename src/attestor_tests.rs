use soroban_sdk::testutils::Address as _;
use soroban_sdk::Address;

use crate::errors::Error;
use crate::test_util::setup;

#[test]
fn add_attestor_registers() {
    let s = setup();
    let attestor = Address::generate(&s.env);
    assert!(!s.client.is_attestor(&attestor));
    s.client.add_attestor(&attestor);
    assert!(s.client.is_attestor(&attestor));
}

#[test]
fn cannot_add_same_attestor_twice() {
    let s = setup();
    let attestor = Address::generate(&s.env);
    s.client.add_attestor(&attestor);
    assert_eq!(
        s.client.try_add_attestor(&attestor),
        Err(Ok(Error::AttestorAlreadyRegistered))
    );
}

#[test]
fn remove_attestor_deregisters() {
    let s = setup();
    let attestor = Address::generate(&s.env);
    s.client.add_attestor(&attestor);
    s.client.remove_attestor(&attestor);
    assert!(!s.client.is_attestor(&attestor));
}

#[test]
fn cannot_remove_unregistered_attestor() {
    let s = setup();
    let attestor = Address::generate(&s.env);
    assert_eq!(
        s.client.try_remove_attestor(&attestor),
        Err(Ok(Error::AttestorNotRegistered))
    );
}

#[test]
fn non_admin_cannot_add_attestor() {
    let s = setup();
    let attestor = Address::generate(&s.env);

    // Clear mocked authorizations: the next call carries none, so the
    // contract's admin.require_auth() must fail.
    s.env.set_auths(&[]);
    let result = s.client.try_add_attestor(&attestor);
    assert!(result.is_err());
}
