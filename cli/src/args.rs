use stellar_xdr::curr::{AccountId, ContractId, Hash, PublicKey, ScAddress, ScSymbol, ScVal, Uint256};

use crate::error::CliError;

/// Parses a Stellar address (either a `G...` account or a `C...` contract
/// strkey) into the `ScVal::Address` a contract call expects. Anything that
/// isn't a well-formed strkey of one of those two kinds is rejected with a
/// message naming the argument, rather than left to panic deeper in the
/// XDR/RPC layer.
pub fn parse_address(raw: &str) -> Result<ScVal, CliError> {
    if let Ok(account) = stellar_strkey::ed25519::PublicKey::from_string(raw) {
        let address = ScAddress::Account(AccountId(PublicKey::PublicKeyTypeEd25519(Uint256(account.0))));
        return Ok(ScVal::Address(address));
    }
    if let Ok(contract) = stellar_strkey::Contract::from_string(raw) {
        let address = ScAddress::Contract(ContractId(Hash(contract.0)));
        return Ok(ScVal::Address(address));
    }
    Err(CliError::InvalidArgument {
        arg: raw.to_string(),
        reason: "expected a 'G...' account address or a 'C...' contract address".to_string(),
    })
}

/// Parses a contract `Symbol` argument (an ASCII string up to 32 bytes).
pub fn parse_symbol(raw: &str) -> Result<ScVal, CliError> {
    let symbol: ScSymbol = raw.try_into().map_err(|_| CliError::InvalidArgument {
        arg: raw.to_string(),
        reason: "not a valid symbol (must be ASCII, 32 characters or fewer)".to_string(),
    })?;
    Ok(ScVal::Symbol(symbol))
}

#[cfg(test)]
mod tests {
    use super::*;

    #[test]
    fn parses_account_address() {
        let addr = parse_address("GAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAWHF").unwrap();
        assert!(matches!(addr, ScVal::Address(ScAddress::Account(_))));
    }

    #[test]
    fn parses_contract_address() {
        let addr = parse_address("CAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAABSC4").unwrap();
        assert!(matches!(addr, ScVal::Address(ScAddress::Contract(_))));
    }

    #[test]
    fn rejects_garbage_address() {
        let err = parse_address("not-an-address").unwrap_err();
        assert!(matches!(err, CliError::InvalidArgument { .. }));
    }

    #[test]
    fn parses_short_symbol() {
        let val = parse_symbol("kyc_approved").unwrap();
        assert!(matches!(val, ScVal::Symbol(_)));
    }

    #[test]
    fn rejects_oversized_symbol() {
        let too_long = "a".repeat(33);
        let err = parse_symbol(&too_long).unwrap_err();
        assert!(matches!(err, CliError::InvalidArgument { .. }));
    }
}
