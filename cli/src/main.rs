mod args;
mod display;
mod error;
mod repl;
mod rpc;

use clap::{Parser, Subcommand};

use rpc::RpcClient;

#[derive(Parser)]
#[command(name = "anchorkit", version, about = "AnchorKit developer CLI")]
struct Cli {
    #[command(subcommand)]
    command: Command,
}

#[derive(Subcommand)]
enum Command {
    /// Interactive REPL for calling read-only methods against a deployed
    /// AnchorKit contract instance.
    Playground {
        /// Soroban RPC endpoint, e.g. https://soroban-testnet.stellar.org
        #[arg(long)]
        rpc_url: String,

        /// Deployed contract address (starts with 'C').
        #[arg(long)]
        contract_id: String,

        /// Any syntactically valid account address (starts with 'G') to use
        /// as the transaction's source for simulation. It never needs to be
        /// funded and nothing here is ever signed or submitted -- every
        /// supported method is read-only.
        #[arg(long)]
        source: String,
    },
}

fn main() {
    let cli = Cli::parse();

    match cli.command {
        Command::Playground { rpc_url, contract_id, source } => {
            match RpcClient::new(&rpc_url, &contract_id, &source) {
                Ok(client) => repl::run(&client),
                Err(e) => {
                    eprintln!("Error: {e}");
                    std::process::exit(1);
                }
            }
        }
    }
}
