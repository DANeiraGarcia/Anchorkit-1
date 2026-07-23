use std::io::{self, BufRead, Write};

use stellar_xdr::curr::ScVal;

use crate::args::{parse_address, parse_symbol};
use crate::display::format_scval;
use crate::error::CliError;
use crate::rpc::RpcClient;

const HELP: &str = "\
Commands:
  get_attestation <subject:G...> <attestation_type:symbol>   fetch a stored attestation
  is_valid <subject:G...> <attestation_type:symbol>          true iff active and unexpired
  is_attestor <attestor:G...>                                allow-list membership check
  get_attestation_count                                      running count of attestations
  help                                                       show this message
  exit | quit                                                leave the playground";

/// Runs the interactive read-eval-print loop: reads one line at a time from
/// stdin, dispatches it to a read-only contract method, and prints either
/// the decoded result or a readable error -- never a panic, regardless of
/// what the user types.
pub fn run(client: &RpcClient) {
    println!("anchorkit playground -- read-only contract calls. Type 'help' for commands, 'exit' to quit.");

    let stdin = io::stdin();
    let mut lines = stdin.lock().lines();

    loop {
        print!("anchorkit> ");
        if io::stdout().flush().is_err() {
            break;
        }

        let line = match lines.next() {
            Some(Ok(line)) => line,
            Some(Err(_)) | None => {
                println!();
                break;
            }
        };

        let line = line.trim();
        if line.is_empty() {
            continue;
        }
        if line == "exit" || line == "quit" {
            break;
        }
        if line == "help" {
            println!("{HELP}");
            continue;
        }

        match dispatch(client, line) {
            Ok(value) => println!("{}", format_scval(&value)),
            Err(e) => println!("Error: {e}"),
        }
    }
}

fn dispatch(client: &RpcClient, line: &str) -> Result<ScVal, CliError> {
    let mut parts = line.split_whitespace();
    let command = parts.next().unwrap_or_default();
    let rest: Vec<&str> = parts.collect();

    match command {
        "get_attestation" => {
            let [subject, attestation_type] = require_args(command, &rest, "<subject> <attestation_type>")?;
            client.call("get_attestation", vec![parse_address(subject)?, parse_symbol(attestation_type)?])
        }
        "is_valid" => {
            let [subject, attestation_type] = require_args(command, &rest, "<subject> <attestation_type>")?;
            client.call("is_valid", vec![parse_address(subject)?, parse_symbol(attestation_type)?])
        }
        "is_attestor" => {
            let [attestor] = require_args(command, &rest, "<attestor>")?;
            client.call("is_attestor", vec![parse_address(attestor)?])
        }
        "get_attestation_count" => {
            if !rest.is_empty() {
                return Err(CliError::Usage(format!("get_attestation_count takes no arguments (got {})", rest.len())));
            }
            client.call("get_attestation_count", vec![])
        }
        unknown => Err(CliError::Usage(format!("unknown command '{unknown}' -- type 'help' for the command list"))),
    }
}

/// Destructures `rest` into a fixed-size array of arguments, or a `Usage`
/// error naming the command and its expected shape if the count doesn't
/// match -- so a missing or extra argument is a one-line message, not a
/// panic from an out-of-bounds index.
fn require_args<'a, const N: usize>(command: &str, rest: &[&'a str], usage: &str) -> Result<[&'a str; N], CliError> {
    TryInto::<[&str; N]>::try_into(rest)
        .map_err(|_| CliError::Usage(format!("usage: {command} {usage} (got {} argument(s))", rest.len())))
}
