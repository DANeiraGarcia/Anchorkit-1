# `anchorkit` CLI

Developer tooling that lives alongside the on-chain contract, in `cli/`
(binary crate `anchorkit-cli`, executable name `anchorkit`).

```sh
cargo run -p anchorkit-cli -- <command>
# or, after `cargo install --path cli`:
anchorkit <command>
```

## `anchorkit playground`

An interactive REPL for calling **read-only** methods against a deployed
`AnchorKit` contract instance, without writing a one-off script every time
you want to check an attestation.

```sh
anchorkit playground \
  --rpc-url https://soroban-testnet.stellar.org \
  --contract-id CCONTRACTIDXXXXXXXXXXXXXXXXXXXXXXXXXXXXXXXXXXXXXXXXXXXX \
  --source GSOURCEACCOUNTXXXXXXXXXXXXXXXXXXXXXXXXXXXXXXXXXXXXXXXXXX
```

`--source` just needs to be *a* well-formed account address -- it never
needs to be funded, and nothing the playground does is ever signed or
submitted to the network. Every supported method is a read, invoked via the
RPC endpoint's `simulateTransaction`, so `--source` only exists to make a
syntactically valid transaction envelope.

Supported commands:

| Command | Contract method |
|---|---|
| `get_attestation <subject> <attestation_type>` | `get_attestation` |
| `is_valid <subject> <attestation_type>` | `is_valid` |
| `is_attestor <attestor>` | `is_attestor` |
| `get_attestation_count` | `get_attestation_count` |
| `help` | -- |
| `exit` / `quit` | -- |

`<subject>` / `<attestor>` are Stellar addresses (`G...` accounts or `C...`
contracts); `<attestation_type>` is a contract Symbol (ASCII, 32 characters
or fewer).

### Sample session

```text
$ anchorkit playground --rpc-url https://soroban-testnet.stellar.org --contract-id CCONTRACT... --source GSOURCE...
anchorkit playground -- read-only contract calls. Type 'help' for commands, 'exit' to quit.
anchorkit> get_attestation_count
42
anchorkit> is_attestor GATTESTORXXXXXXXXXXXXXXXXXXXXXXXXXXXXXXXXXXXXXXXXXXXXX
true
anchorkit> get_attestation GSUBJECTXXXXXXXXXXXXXXXXXXXXXXXXXXXXXXXXXXXXXXXXXXXX kyc_approved
{attestor: GATTESTORXXX..., subject: GSUBJECTXXX..., attestation_type: kyc_approved, payload_hash: 0x9f86d0..., issued_at: 1732300000, expires_at: 1763836000, status: [Active]}
anchorkit> is_valid GSUBJECTXXXXXXXXXXXXXXXXXXXXXXXXXXXXXXXXXXXXXXXXXXXX missing_type
false
anchorkit> exit
```

### Error handling

Malformed commands, bad addresses/symbols, and RPC/simulation failures all
print a one-line `Error: ...` message and return to the prompt -- never a
panic:

```text
anchorkit> get_attestation not-an-address kyc_approved
Error: invalid argument 'not-an-address': expected a 'G...' account address or a 'C...' contract address

anchorkit> get_attestation GSUBJECTXXXXXXXXXXXXXXXXXXXXXXXXXXXXXXXXXXXXXXXXXXXX
Error: usage: get_attestation <subject> <attestation_type> (got 1 argument(s))

anchorkit> get_attestation GSUBJECTXXXXXXXXXXXXXXXXXXXXXXXXXXXXXXXXXXXXXXXXXXXX unregistered_type
Error: contract call failed: HostError: Error(Contract, #7)
```
