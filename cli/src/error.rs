use std::fmt;

/// Errors surfaced by `anchorkit` subcommands. Every variant renders to a
/// single human-readable line via `Display` -- `main` prints that line and
/// exits non-zero instead of unwinding a panic, so a malformed domain or an
/// unreachable anchor never shows a Rust backtrace to the user.
#[derive(Debug)]
pub enum CliError {
    InvalidDomain(String),
    Unreachable { url: String, reason: String },
    HttpStatus { url: String, status: u16 },
    Malformed { url: String, reason: String },
}

impl fmt::Display for CliError {
    fn fmt(&self, f: &mut fmt::Formatter<'_>) -> fmt::Result {
        match self {
            CliError::InvalidDomain(domain) => write!(
                f,
                "'{domain}' is not a syntactically valid anchor domain (see SEP-1 stellar.toml hosting rules)"
            ),
            CliError::Unreachable { url, reason } => {
                write!(f, "could not reach {url}: {reason}")
            }
            CliError::HttpStatus { url, status } => {
                write!(f, "{url} responded with HTTP {status}")
            }
            CliError::Malformed { url, reason } => {
                write!(f, "{url} did not return valid data: {reason}")
            }
        }
    }
}

impl std::error::Error for CliError {}
