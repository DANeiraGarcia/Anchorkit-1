# `anchorkit` CLI

Developer tooling that lives alongside the on-chain contract, in `cli/`
(binary crate `anchorkit-cli`, executable name `anchorkit`).

```sh
cargo run -p anchorkit-cli -- <command>
# or, after `cargo install --path cli`:
anchorkit <command>
```

## `anchorkit discover <domain>`

Fetches an anchor's `stellar.toml` (per [SEP-1]) and, if it advertises a
transfer server, that server's `/info` endpoint. Runs the domain through the
same syntax rules the on-chain contract uses
(`anchorkit::domain_validator`) and reports which SEPs the anchor appears to
support.

Detection is based on which `stellar.toml` fields are present -- it does not
independently verify that the endpoints those fields point to actually
implement the SEP correctly, only that the anchor claims to.

[SEP-1]: https://github.com/stellar/stellar-protocol/blob/master/ecosystem/sep-0001.md

### Sample session

```text
$ anchorkit discover example-anchor.com
anchor: example-anchor.com
network: Public Global Stellar Network ; September 2015

Supported SEPs:
  [yes] SEP-1    stellar.toml (anchor metadata) -- VERSION 2.7.0
  [yes] SEP-10   Web Authentication -- https://auth.example-anchor.com
  [yes] SEP-6    Deposit/Withdrawal -- https://transfer.example-anchor.com (4 assets enabled)
  [no ] SEP-24   Hosted Deposit/Withdrawal
  [yes] SEP-12   KYC API -- https://kyc.example-anchor.com
  [no ] SEP-31   Cross-Border Payments
  [no ] SEP-38   Anchor RFQ (Quotes)
```

### Error handling

Malformed domains, unreachable hosts, non-2xx responses, and unparsable
`stellar.toml`/`/info` bodies all produce a one-line `Error: ...` message on
stderr and a non-zero exit code -- never a panic or stack trace:

```text
$ anchorkit discover not a domain
Error: 'not a domain' is not a syntactically valid anchor domain (see SEP-1 stellar.toml hosting rules)

$ anchorkit discover this-domain-does-not-resolve.invalid
Error: could not reach https://this-domain-does-not-resolve.invalid/.well-known/stellar.toml: error sending request for url (https://this-domain-does-not-resolve.invalid/.well-known/stellar.toml)
```
