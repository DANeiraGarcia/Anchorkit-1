//! Stress benchmark for the attestor allow-list at scale.
//!
//! Gated behind the `stress-tests` feature so it never runs as part of a
//! normal `cargo test`. Run it explicitly with:
//!
//!   cargo test --release --features stress-tests allow_list_scaling -- --nocapture
//!
//! Each allow-list entry is its own persistent storage key (see
//! `storage::is_attestor` / `storage::set_attestor`), which is the design
//! that would need to change if this benchmark shows cost climbing
//! unacceptably with allow-list size. It grows the allow-list to thousands
//! of entries and samples the metered cost of `add_attestor` and
//! `is_attestor` along the way, so scaling behavior shows up in the printed
//! table instead of needing to be spotted by eye in production.

extern crate std;

use soroban_sdk::testutils::{Address as _, EnvTestConfig};
use soroban_sdk::{Address, Env};

use crate::contract::{AnchorKitContract, AnchorKitContractClient};

const CHECKPOINTS: &[u32] = &[1, 100, 500, 1_000, 2_500, 5_000, 10_000];

#[test]
#[allow(deprecated)]
fn allow_list_scaling() {
    let mut env = Env::default();
    env.mock_all_auths();

    // A 10k-entry allow-list serialized to a test snapshot file would be
    // tens of megabytes; this benchmark's value is the printed table, not a
    // ledger snapshot committed to version control. This has to happen
    // before the client is built below, since the client keeps its own
    // clone of `env` and its test config travels with that clone.
    env.set_config(EnvTestConfig {
        capture_snapshot_at_drop: false,
    });

    let contract_id = env.register(AnchorKitContract, ());
    let client = AnchorKitContractClient::new(&env, &contract_id);
    let admin = Address::generate(&env);
    client.initialize(&admin);

    let mut budget = env.budget();

    let target = *CHECKPOINTS.last().expect("checkpoints is non-empty");
    let mut watched: Option<Address> = None;
    let mut next_checkpoint = 0;

    std::println!(
        "{:>10} | {:>16} | {:>16} | {:>18} | {:>18}",
        "list_size",
        "add_cpu_insns",
        "add_mem_bytes",
        "lookup_cpu_insns",
        "lookup_mem_bytes"
    );

    for size in 1..=target {
        let attestor = Address::generate(&env);

        budget.reset_unlimited();
        client.add_attestor(&attestor);
        let add_cpu = budget.cpu_instruction_cost();
        let add_mem = budget.memory_bytes_cost();

        if watched.is_none() {
            watched = Some(attestor);
        }
        let watched_ref = watched.as_ref().expect("set on the first iteration");

        if next_checkpoint < CHECKPOINTS.len() && size == CHECKPOINTS[next_checkpoint] {
            budget.reset_unlimited();
            let hit = client.is_attestor(watched_ref);
            let lookup_cpu = budget.cpu_instruction_cost();
            let lookup_mem = budget.memory_bytes_cost();
            assert!(hit, "the first attestor added must still be registered");

            std::println!(
                "{:>10} | {:>16} | {:>16} | {:>18} | {:>18}",
                size,
                add_cpu,
                add_mem,
                lookup_cpu,
                lookup_mem
            );
            next_checkpoint += 1;
        }
    }

    assert_eq!(
        next_checkpoint,
        CHECKPOINTS.len(),
        "every checkpoint should have been sampled"
    );

    // A miss walks the same single-key lookup path as a hit, so it should
    // cost about the same regardless of allow-list size. If it doesn't, the
    // allow-list's storage shape needs to change.
    let stranger = Address::generate(&env);
    budget.reset_unlimited();
    let hit = client.is_attestor(&stranger);
    let miss_cpu = budget.cpu_instruction_cost();
    let miss_mem = budget.memory_bytes_cost();
    assert!(!hit, "a never-registered address must not be an attestor");

    std::println!(
        "miss lookup at list_size={}: {} cpu insns, {} bytes",
        target,
        miss_cpu,
        miss_mem
    );
}
