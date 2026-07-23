use std::collections::HashMap;

use serde::Deserialize;

use crate::error::CliError;

/// The shared shape of a SEP-6 and SEP-24 `/info` response: a per-asset
/// enabled flag for deposit and withdraw. Both SEPs use this same shape, so
/// one struct covers whichever transfer server we end up querying.
#[derive(Debug, Default, Deserialize)]
pub struct InfoResponse {
    #[serde(default)]
    pub deposit: HashMap<String, AssetOperation>,
    #[serde(default)]
    pub withdraw: HashMap<String, AssetOperation>,
}

#[derive(Debug, Default, Deserialize)]
pub struct AssetOperation {
    #[serde(default)]
    pub enabled: bool,
}

impl InfoResponse {
    /// Number of distinct assets with at least one enabled deposit or
    /// withdraw operation.
    pub fn enabled_asset_count(&self) -> usize {
        let mut assets: Vec<&str> = self
            .deposit
            .iter()
            .filter(|(_, op)| op.enabled)
            .map(|(code, _)| code.as_str())
            .chain(
                self.withdraw
                    .iter()
                    .filter(|(_, op)| op.enabled)
                    .map(|(code, _)| code.as_str()),
            )
            .collect();
        assets.sort_unstable();
        assets.dedup();
        assets.len()
    }
}

/// Fetches `{base_url}/info`, tolerating a trailing slash on `base_url`.
pub fn fetch(client: &reqwest::blocking::Client, base_url: &str) -> Result<InfoResponse, CliError> {
    let url = format!("{}/info", base_url.trim_end_matches('/'));

    let response = client
        .get(&url)
        .send()
        .map_err(|e| CliError::Unreachable { url: url.clone(), reason: e.to_string() })?;

    let status = response.status();
    if !status.is_success() {
        return Err(CliError::HttpStatus { url, status: status.as_u16() });
    }

    response
        .json::<InfoResponse>()
        .map_err(|e| CliError::Malformed { url, reason: e.to_string() })
}

#[cfg(test)]
mod tests {
    use super::*;

    #[test]
    fn parses_deposit_and_withdraw_enabled_flags() {
        let json = r#"{
            "deposit": {"USD": {"enabled": true}, "EUR": {"enabled": false}},
            "withdraw": {"USD": {"enabled": true}}
        }"#;
        let info: InfoResponse = serde_json::from_str(json).unwrap();
        assert!(info.deposit["USD"].enabled);
        assert!(!info.deposit["EUR"].enabled);
        assert!(info.withdraw["USD"].enabled);
    }

    #[test]
    fn counts_distinct_enabled_assets_across_deposit_and_withdraw() {
        let json = r#"{
            "deposit": {"USD": {"enabled": true}, "EUR": {"enabled": false}},
            "withdraw": {"USD": {"enabled": true}, "GBP": {"enabled": true}}
        }"#;
        let info: InfoResponse = serde_json::from_str(json).unwrap();
        // USD counted once even though it appears in both maps; EUR excluded
        // (disabled); GBP included. Total: USD, GBP.
        assert_eq!(info.enabled_asset_count(), 2);
    }

    #[test]
    fn missing_sections_default_to_empty() {
        let info: InfoResponse = serde_json::from_str("{}").unwrap();
        assert_eq!(info.enabled_asset_count(), 0);
    }
}
