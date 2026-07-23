use serde::Deserialize;

use crate::error::CliError;

/// The subset of SEP-1 `stellar.toml` fields relevant to capability
/// detection. Fields we don't otherwise use (CURRENCIES, PRINCIPALS, ORG_*,
/// ...) are left unparsed -- `toml`/`serde` ignore unknown keys by default.
#[derive(Debug, Default, Deserialize)]
pub struct StellarToml {
    #[serde(rename = "VERSION")]
    pub version: Option<String>,
    #[serde(rename = "NETWORK_PASSPHRASE")]
    pub network_passphrase: Option<String>,
    #[serde(rename = "FEDERATION_SERVER")]
    pub federation_server: Option<String>,
    #[serde(rename = "WEB_AUTH_ENDPOINT")]
    pub web_auth_endpoint: Option<String>,
    #[serde(rename = "SIGNING_KEY")]
    pub signing_key: Option<String>,
    #[serde(rename = "TRANSFER_SERVER")]
    pub transfer_server: Option<String>,
    #[serde(rename = "TRANSFER_SERVER_SEP0024")]
    pub transfer_server_sep24: Option<String>,
    #[serde(rename = "KYC_SERVER")]
    pub kyc_server: Option<String>,
    #[serde(rename = "DIRECT_PAYMENT_SERVER")]
    pub direct_payment_server: Option<String>,
    #[serde(rename = "ANCHOR_QUOTE_SERVER")]
    pub anchor_quote_server: Option<String>,
}

/// Fetches and parses `https://{domain}/.well-known/stellar.toml` per SEP-1.
/// Anchors are required to publish it over plain HTTPS with no redirects
/// needed, so we don't follow cross-origin redirects here.
pub fn fetch(client: &reqwest::blocking::Client, domain: &str) -> Result<StellarToml, CliError> {
    let url = format!("https://{domain}/.well-known/stellar.toml");

    let response = client
        .get(&url)
        .send()
        .map_err(|e| CliError::Unreachable { url: url.clone(), reason: e.to_string() })?;

    let status = response.status();
    if !status.is_success() {
        return Err(CliError::HttpStatus { url, status: status.as_u16() });
    }

    let body = response
        .text()
        .map_err(|e| CliError::Unreachable { url: url.clone(), reason: e.to_string() })?;

    toml::from_str(&body).map_err(|e| CliError::Malformed { url, reason: e.to_string() })
}
