use soroban_sdk::{Address, Env, Symbol};

use crate::errors::Error;
use crate::types::{Attestation, DataKey};

// Storage rent thresholds. Persistent entries are bumped whenever they're
// touched with less than a month of TTL remaining, back out to a year.
const LEDGERS_PER_DAY: u32 = 17_280;
const ATTESTATION_TTL_THRESHOLD: u32 = LEDGERS_PER_DAY * 30;
const ATTESTATION_TTL_EXTEND_TO: u32 = LEDGERS_PER_DAY * 365;

pub fn get_admin(env: &Env) -> Result<Address, Error> {
    env.storage()
        .instance()
        .get(&DataKey::Admin)
        .ok_or(Error::NotInitialized)
}

pub fn set_admin(env: &Env, admin: &Address) {
    env.storage().instance().set(&DataKey::Admin, admin);
}

pub fn is_initialized(env: &Env) -> bool {
    env.storage().instance().has(&DataKey::Admin)
}

pub fn is_paused(env: &Env) -> bool {
    env.storage()
        .instance()
        .get(&DataKey::Paused)
        .unwrap_or(false)
}

pub fn set_paused(env: &Env, paused: bool) {
    env.storage().instance().set(&DataKey::Paused, &paused);
}

pub fn is_attestor(env: &Env, attestor: &Address) -> bool {
    env.storage()
        .persistent()
        .get(&DataKey::Attestor(attestor.clone()))
        .unwrap_or(false)
}

pub fn set_attestor(env: &Env, attestor: &Address, allowed: bool) {
    let key = DataKey::Attestor(attestor.clone());
    if allowed {
        env.storage().persistent().set(&key, &true);
        env.storage().persistent().extend_ttl(
            &key,
            ATTESTATION_TTL_THRESHOLD,
            ATTESTATION_TTL_EXTEND_TO,
        );
    } else {
        env.storage().persistent().remove(&key);
    }
}

pub fn get_attestation(
    env: &Env,
    subject: &Address,
    attestation_type: &Symbol,
) -> Option<Attestation> {
    let key = DataKey::Attestation(subject.clone(), attestation_type.clone());
    env.storage().persistent().get(&key)
}

pub fn set_attestation(
    env: &Env,
    subject: &Address,
    attestation_type: &Symbol,
    attestation: &Attestation,
) {
    let key = DataKey::Attestation(subject.clone(), attestation_type.clone());
    env.storage().persistent().set(&key, attestation);
    env.storage().persistent().extend_ttl(
        &key,
        ATTESTATION_TTL_THRESHOLD,
        ATTESTATION_TTL_EXTEND_TO,
    );
}

pub fn bump_attestation_count(env: &Env) -> u64 {
    let count: u64 = env
        .storage()
        .instance()
        .get(&DataKey::AttestationCount)
        .unwrap_or(0);
    let next = count + 1;
    env.storage()
        .instance()
        .set(&DataKey::AttestationCount, &next);
    next
}

pub fn get_attestation_count(env: &Env) -> u64 {
    env.storage()
        .instance()
        .get(&DataKey::AttestationCount)
        .unwrap_or(0)
}
