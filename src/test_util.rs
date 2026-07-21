use soroban_sdk::testutils::Address as _;
use soroban_sdk::{Address, Env};

use crate::contract::{AnchorKitContract, AnchorKitContractClient};

pub struct Setup<'a> {
    pub env: Env,
    pub client: AnchorKitContractClient<'a>,
    pub admin: Address,
}

/// Spins up a fresh contract instance with mocked auth and an initialized
/// admin, ready for a test to register attestors and submit attestations.
pub fn setup<'a>() -> Setup<'a> {
    let env = Env::default();
    env.mock_all_auths();

    let contract_id = env.register(AnchorKitContract, ());
    let client = AnchorKitContractClient::new(&env, &contract_id);

    let admin = Address::generate(&env);
    client.initialize(&admin);

    Setup { env, client, admin }
}
