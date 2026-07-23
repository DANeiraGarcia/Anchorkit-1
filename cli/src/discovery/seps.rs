use super::info::InfoResponse;
use super::stellar_toml::StellarToml;

/// One SEP capability finding: whether the anchor appears to support it, and
/// (when supported) a short human-readable detail -- an endpoint URL or an
/// enabled-asset count, whichever is more informative for that SEP.
pub struct SepFinding {
    pub sep: &'static str,
    pub name: &'static str,
    pub supported: bool,
    pub detail: Option<String>,
}

/// Which transfer server (if any) we fetched `/info` from, so the SEP-6/
/// SEP-24 findings can attach asset counts only to the one we actually
/// queried, rather than guessing about the other.
pub enum InfoSource {
    None,
    Sep6,
    Sep24,
}

/// Runs `toml` (and, if fetched, `info`) through capability detection and
/// returns one finding per SEP `anchorkit discover` knows how to recognize.
/// Detection is field-presence based: a SEP is "supported" if the
/// `stellar.toml` fields it requires are present, regardless of whether the
/// endpoints they point to are actually reachable.
pub fn detect(toml: &StellarToml, info: Option<&InfoResponse>, info_source: InfoSource) -> Vec<SepFinding> {
    let mut findings = Vec::with_capacity(6);

    findings.push(SepFinding {
        sep: "SEP-1",
        name: "stellar.toml (anchor metadata)",
        supported: true,
        detail: toml.version.clone().map(|v| format!("VERSION {v}")),
    });

    let sep10_supported = toml.web_auth_endpoint.is_some() && toml.signing_key.is_some();
    findings.push(SepFinding {
        sep: "SEP-10",
        name: "Web Authentication",
        supported: sep10_supported,
        detail: toml.web_auth_endpoint.clone(),
    });

    let sep6_supported = toml.transfer_server.is_some();
    findings.push(SepFinding {
        sep: "SEP-6",
        name: "Deposit/Withdrawal",
        supported: sep6_supported,
        detail: asset_detail(toml.transfer_server.as_deref(), info, matches!(info_source, InfoSource::Sep6)),
    });

    let sep24_supported = toml.transfer_server_sep24.is_some();
    findings.push(SepFinding {
        sep: "SEP-24",
        name: "Hosted Deposit/Withdrawal",
        supported: sep24_supported,
        detail: asset_detail(toml.transfer_server_sep24.as_deref(), info, matches!(info_source, InfoSource::Sep24)),
    });

    findings.push(SepFinding {
        sep: "SEP-12",
        name: "KYC API",
        supported: toml.kyc_server.is_some(),
        detail: toml.kyc_server.clone(),
    });

    findings.push(SepFinding {
        sep: "SEP-31",
        name: "Cross-Border Payments",
        supported: toml.direct_payment_server.is_some(),
        detail: toml.direct_payment_server.clone(),
    });

    findings.push(SepFinding {
        sep: "SEP-38",
        name: "Anchor RFQ (Quotes)",
        supported: toml.anchor_quote_server.is_some(),
        detail: toml.anchor_quote_server.clone(),
    });

    findings
}

fn asset_detail(endpoint: Option<&str>, info: Option<&InfoResponse>, is_this_endpoint: bool) -> Option<String> {
    if is_this_endpoint {
        if let Some(info) = info {
            let count = info.enabled_asset_count();
            return Some(format!(
                "{} ({} asset{} enabled)",
                endpoint?,
                count,
                if count == 1 { "" } else { "s" }
            ));
        }
    }
    endpoint.map(str::to_string)
}

#[cfg(test)]
mod tests {
    use super::*;

    fn empty_toml() -> StellarToml {
        StellarToml::default()
    }

    #[test]
    fn sep1_always_reported_supported() {
        let findings = detect(&empty_toml(), None, InfoSource::None);
        let sep1 = findings.iter().find(|f| f.sep == "SEP-1").unwrap();
        assert!(sep1.supported);
    }

    #[test]
    fn sep10_requires_both_endpoint_and_signing_key() {
        let mut toml = empty_toml();
        toml.web_auth_endpoint = Some("https://auth.example.com".into());
        // signing_key missing -- SEP-10 needs both.
        let findings = detect(&toml, None, InfoSource::None);
        assert!(!findings.iter().find(|f| f.sep == "SEP-10").unwrap().supported);

        toml.signing_key = Some("GABC...".into());
        let findings = detect(&toml, None, InfoSource::None);
        assert!(findings.iter().find(|f| f.sep == "SEP-10").unwrap().supported);
    }

    #[test]
    fn sep6_and_sep24_are_detected_independently() {
        let mut toml = empty_toml();
        toml.transfer_server = Some("https://transfer.example.com".into());
        let findings = detect(&toml, None, InfoSource::None);
        assert!(findings.iter().find(|f| f.sep == "SEP-6").unwrap().supported);
        assert!(!findings.iter().find(|f| f.sep == "SEP-24").unwrap().supported);
    }

    #[test]
    fn asset_count_only_attached_to_the_endpoint_actually_queried() {
        let mut toml = empty_toml();
        toml.transfer_server = Some("https://transfer.example.com".into());
        toml.transfer_server_sep24 = Some("https://sep24.example.com".into());

        let info: InfoResponse =
            serde_json::from_str(r#"{"deposit": {"USD": {"enabled": true}}}"#).unwrap();

        // Info was fetched from the SEP-24 endpoint (the preferred one), so
        // only its finding should carry an asset count.
        let findings = detect(&toml, Some(&info), InfoSource::Sep24);
        let sep6 = findings.iter().find(|f| f.sep == "SEP-6").unwrap();
        let sep24 = findings.iter().find(|f| f.sep == "SEP-24").unwrap();
        assert_eq!(sep6.detail.as_deref(), Some("https://transfer.example.com"));
        assert!(sep24.detail.as_ref().unwrap().contains("1 asset enabled"));
    }

    #[test]
    fn unsupported_seps_have_no_detail() {
        let findings = detect(&empty_toml(), None, InfoSource::None);
        for finding in &findings {
            if finding.sep != "SEP-1" {
                assert!(!finding.supported);
                assert!(finding.detail.is_none());
            }
        }
    }
}
