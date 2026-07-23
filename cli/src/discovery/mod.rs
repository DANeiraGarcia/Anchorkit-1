mod info;
mod seps;
mod stellar_toml;

use std::time::Duration;

use anchorkit::domain_validator::validate_domain_syntax;

use crate::error::CliError;
pub use seps::SepFinding;
use seps::InfoSource;
pub use stellar_toml::StellarToml;

pub struct DiscoveryReport {
    pub domain: String,
    pub toml: StellarToml,
    pub seps: Vec<SepFinding>,
}

/// Fetches `stellar.toml` and (if the anchor advertises one) a transfer
/// server's `/info`, runs both through `validate_domain_syntax` and SEP
/// capability detection, and returns a report ready to print.
///
/// Reuses `anchorkit::domain_validator`'s validation logic (see
/// `validate_domain_syntax`) rather than re-implementing the SEP-1 hostname
/// rules, and never panics on unreachable or malformed input -- every
/// failure mode is a `CliError` with a specific, readable message.
pub fn discover(domain: &str) -> Result<DiscoveryReport, CliError> {
    if !validate_domain_syntax(domain) {
        return Err(CliError::InvalidDomain(domain.to_string()));
    }

    let client = reqwest::blocking::Client::builder()
        .timeout(Duration::from_secs(10))
        .user_agent(concat!("anchorkit-cli/", env!("CARGO_PKG_VERSION")))
        .build()
        .map_err(|e| CliError::Unreachable { url: domain.to_string(), reason: e.to_string() })?;

    let toml = stellar_toml::fetch(&client, domain)?;

    // Prefer the SEP-24 (interactive) transfer server when both are
    // advertised -- it's the more commonly deployed of the two in practice
    // and its /info response is a superset shape of SEP-6's.
    let (info, info_source) = if let Some(base) = &toml.transfer_server_sep24 {
        (Some(info::fetch(&client, base)?), InfoSource::Sep24)
    } else if let Some(base) = &toml.transfer_server {
        (Some(info::fetch(&client, base)?), InfoSource::Sep6)
    } else {
        (None, InfoSource::None)
    };

    let findings = seps::detect(&toml, info.as_ref(), info_source);

    Ok(DiscoveryReport { domain: domain.to_string(), toml, seps: findings })
}

pub fn print_report(report: &DiscoveryReport) {
    println!("anchor: {}", report.domain);
    if let Some(passphrase) = &report.toml.network_passphrase {
        println!("network: {passphrase}");
    }
    println!();
    println!("Supported SEPs:");
    for finding in &report.seps {
        let mark = if finding.supported { "yes" } else { "no " };
        print!("  [{mark}] {:<8} {}", finding.sep, finding.name);
        if finding.supported {
            if let Some(detail) = &finding.detail {
                print!(" -- {detail}");
            }
        }
        println!();
    }
}
