mod discovery;
mod error;

use clap::{Parser, Subcommand};

#[derive(Parser)]
#[command(name = "anchorkit", version, about = "AnchorKit developer CLI")]
struct Cli {
    #[command(subcommand)]
    command: Command,
}

#[derive(Subcommand)]
enum Command {
    /// Fetch and validate an anchor's stellar.toml and /info metadata,
    /// reporting which SEPs it appears to support.
    Discover {
        /// The anchor's domain, e.g. anchor.example.com
        domain: String,
    },
}

fn main() {
    let cli = Cli::parse();

    let result = match cli.command {
        Command::Discover { domain } => discovery::discover(&domain).map(|report| {
            discovery::print_report(&report);
        }),
    };

    if let Err(e) = result {
        eprintln!("Error: {e}");
        std::process::exit(1);
    }
}
