use soroban_sdk::testutils::Address as _;
use soroban_sdk::Address;

use crate::contract::{AnchorKitContract, AnchorKitContractClient};
use crate::errors::Error;
use crate::test_util::setup;

#[test]
fn initialize_sets_admin() {
    let s = setup();
    assert_eq!(s.client.get_admin(), s.admin);
}

#[test]
fn cannot_initialize_twice() {
    let s = setup();
    let other = Address::generate(&s.env);
    assert_eq!(
        s.client.try_initialize(&other),
        Err(Ok(Error::AlreadyInitialized))
    );
}

#[test]
fn set_admin_transfers_control() {
    let s = setup();
    let new_admin = Address::generate(&s.env);
    s.client.set_admin(&new_admin);
    assert_eq!(s.client.get_admin(), new_admin);
}

#[test]
fn get_admin_before_initialize_fails() {
    let env = soroban_sdk::Env::default();
    let contract_id = env.register(AnchorKitContract, ());
    let client = AnchorKitContractClient::new(&env, &contract_id);
    assert_eq!(client.try_get_admin(), Err(Ok(Error::NotInitialized)));
}

#[test]
fn initialize_requires_admin_authorization() {
    let env = soroban_sdk::Env::default();
    let contract_id = env.register(AnchorKitContract, ());
    let client = AnchorKitContractClient::new(&env, &contract_id);
    let admin = Address::generate(&env);

    // No auths mocked at all: the contract's admin.require_auth() call must
    // fail since nothing authorized this invocation.
    let result = client.try_initialize(&admin);
    assert!(result.is_err());
}
