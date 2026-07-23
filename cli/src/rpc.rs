use std::time::Duration;

use serde::Deserialize;
use serde_json::json;
use stellar_xdr::curr::{
    ContractId, Hash, HostFunction, InvokeContractArgs, InvokeHostFunctionOp, Limits, Memo,
    MuxedAccount, Operation, OperationBody, Preconditions, ReadXdr, ScAddress, ScSymbol, ScVal,
    SequenceNumber, Transaction, TransactionEnvelope, TransactionExt, TransactionV1Envelope,
    Uint256, VecM, WriteXdr,
};

use crate::error::CliError;

/// Talks to a single Soroban RPC endpoint to simulate (never submit)
/// read-only invocations of one deployed contract. Simulation needs a
/// syntactically valid source account and a fee/sequence number to build a
/// well-formed transaction envelope, but since none of the methods this
/// playground supports call `require_auth`, nothing here ever needs to be
/// signed -- `source_account` never needs to be funded, just a validly
/// formatted address.
pub struct RpcClient {
    http: reqwest::blocking::Client,
    rpc_url: String,
    contract_id: [u8; 32],
    source_account: [u8; 32],
}

impl RpcClient {
    pub fn new(rpc_url: &str, contract_id: &str, source_account: &str) -> Result<Self, CliError> {
        let contract_id = stellar_strkey::Contract::from_string(contract_id)
            .map_err(|e| CliError::InvalidArgument { arg: contract_id.to_string(), reason: e.to_string() })?
            .0;
        let source_account = stellar_strkey::ed25519::PublicKey::from_string(source_account)
            .map_err(|e| CliError::InvalidArgument { arg: source_account.to_string(), reason: e.to_string() })?
            .0;
        let http = reqwest::blocking::Client::builder()
            .timeout(Duration::from_secs(20))
            .build()
            .map_err(|e| CliError::Rpc(e.to_string()))?;

        Ok(Self { http, rpc_url: rpc_url.to_string(), contract_id, source_account })
    }

    /// Simulates `function_name(args...)` against the configured contract
    /// and returns the decoded return value. Never signs or submits
    /// anything -- this is a read-only, side-effect-free RPC call.
    pub fn call(&self, function_name: &str, args: Vec<ScVal>) -> Result<ScVal, CliError> {
        let envelope = self.build_envelope(function_name, args)?;
        let tx_xdr = envelope
            .to_xdr_base64(Limits::none())
            .map_err(|e| CliError::Xdr(format!("could not encode transaction: {e}")))?;

        let request_body = json!({
            "jsonrpc": "2.0",
            "id": 1,
            "method": "simulateTransaction",
            "params": { "transaction": tx_xdr },
        });

        let response = self.http.post(&self.rpc_url).json(&request_body).send().map_err(|e| {
            CliError::Rpc(format!("could not reach {}: {e}", self.rpc_url))
        })?;

        let status = response.status();
        if !status.is_success() {
            return Err(CliError::Rpc(format!("{} responded with HTTP {status}", self.rpc_url)));
        }

        let body: JsonRpcResponse = response
            .json()
            .map_err(|e| CliError::Rpc(format!("{} sent a response that wasn't valid JSON-RPC: {e}", self.rpc_url)))?;

        if let Some(err) = body.error {
            return Err(CliError::Rpc(err.message));
        }

        let result = body
            .result
            .ok_or_else(|| CliError::Rpc(format!("{} returned an empty response", self.rpc_url)))?;

        if let Some(sim_error) = result.error {
            return Err(CliError::Simulation(sim_error));
        }

        let first = result
            .results
            .and_then(|r| r.into_iter().next())
            .ok_or_else(|| CliError::Simulation("simulation returned no result value".to_string()))?;

        ScVal::from_xdr_base64(first.xdr, Limits::none())
            .map_err(|e| CliError::Xdr(format!("could not decode return value: {e}")))
    }

    fn build_envelope(&self, function_name: &str, args: Vec<ScVal>) -> Result<TransactionEnvelope, CliError> {
        let function_name: ScSymbol = function_name.try_into().map_err(|_| CliError::InvalidArgument {
            arg: function_name.to_string(),
            reason: "not a valid contract method name (must be ASCII, 32 characters or fewer)".to_string(),
        })?;

        let args: VecM<ScVal> = args
            .try_into()
            .map_err(|_| CliError::InvalidArgument { arg: "args".to_string(), reason: "too many arguments".to_string() })?;

        let host_function = HostFunction::InvokeContract(InvokeContractArgs {
            contract_address: ScAddress::Contract(ContractId(Hash(self.contract_id))),
            function_name,
            args,
        });

        let operation = Operation {
            source_account: None,
            body: OperationBody::InvokeHostFunction(InvokeHostFunctionOp { host_function, auth: VecM::default() }),
        };

        let operations: VecM<Operation, 100> = vec![operation]
            .try_into()
            .map_err(|_| CliError::Xdr("could not build operation list".to_string()))?;

        let tx = Transaction {
            source_account: MuxedAccount::Ed25519(Uint256(self.source_account)),
            fee: 100,
            seq_num: SequenceNumber(0),
            cond: Preconditions::None,
            memo: Memo::None,
            operations,
            ext: TransactionExt::V0,
        };

        Ok(TransactionEnvelope::Tx(TransactionV1Envelope { tx, signatures: VecM::default() }))
    }
}

// Only the fields the playground actually reads are modeled here --
// `simulateTransaction`'s response carries more (cost estimates, state
// diffs, events) that a read-only REPL has no use for.

#[derive(Deserialize)]
struct JsonRpcResponse {
    #[serde(default)]
    result: Option<SimulateResult>,
    #[serde(default)]
    error: Option<JsonRpcError>,
}

#[derive(Deserialize)]
struct JsonRpcError {
    message: String,
}

#[derive(Deserialize)]
struct SimulateResult {
    #[serde(default)]
    error: Option<String>,
    #[serde(default)]
    results: Option<Vec<SimulateHostFunctionResult>>,
}

#[derive(Deserialize)]
struct SimulateHostFunctionResult {
    xdr: String,
}
