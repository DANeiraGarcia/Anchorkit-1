# AnchorKit Developer Panel

A React-based developer panel for manually constructing and debugging SEP-6/SEP-10 requests against Stellar anchors. Useful for testing anchor integrations and troubleshooting issues during development.

## Features

- **SEP-10 Challenge Requests**: Get and inspect authentication challenges
- **SEP-6 Deposit Requests**: Initiate and test deposit flows with custom parameters
- **SEP-6 Withdraw Requests**: Initiate and test withdrawal flows with banking details
- **Raw Request/Response Logging**: Full visibility into HTTP requests and responses
- **Automatic Secret Redaction**: Sensitive data (private keys, tokens) automatically masked in logs
- **Storybook Stories**: Complete example workflows with mocked responses for learning and testing

## Installation

```bash
npm install @anchorkit/dev-panel
```

## Usage

### React Component

```tsx
import { AnchorRequestPanel } from '@anchorkit/dev-panel';

function MyApp() {
  return (
    <AnchorRequestPanel
      config={{
        homeUrl: 'https://my-anchor.example.com/.well-known/stellar.toml',
        sep10Endpoint: 'https://my-anchor.example.com/auth',
        sep6Endpoint: 'https://my-anchor.example.com/api/v1',
      }}
    />
  );
}
```

### Request Builder (Programmatic)

```tsx
import { AnchorRequestBuilder } from '@anchorkit/dev-panel';

const builder = new AnchorRequestBuilder({
  homeUrl: 'https://my-anchor.example.com',
});

// SEP-10 Challenge
const { response, log } = await builder.sep10Challenge({
  account: 'GXXXXX...',
  memo: 'user-123',
});

// SEP-6 Deposit
const depositResult = await builder.sep6Deposit({
  asset_code: 'USDC',
  account: 'GXXXXX...',
});

// SEP-6 Withdraw
const withdrawResult = await builder.sep6Withdraw({
  asset_code: 'USDC',
  dest: 'user@example.com',
  account: 'GXXXXX...',
});

// Access logs
const logs = builder.getLogs();
```

### Secret Redaction

```tsx
import { redactSecrets, redactedJSON } from '@anchorkit/dev-panel';

const response = {
  account: 'GXXXXX...',
  token: 'secret_token_xyz',
};

// Redact sensitive fields
const safe = redactSecrets(response);
// { account: 'GXXXXX...', token: '[REDACTED]' }

// Pretty JSON with redaction
const json = redactedJSON(response);
// Returns minified JSON string with secrets masked
```

## Storybook

View the component stories:

```bash
npm run dev
```

Then open `http://localhost:6006` and navigate to "Anchor Request Panel" stories.

### Example Stories

- **SEP10ChallengeFlow**: Complete authentication challenge workflow
- **SEP6DepositFlow**: Deposit initiation with logging
- **SEP6WithdrawFlow**: Withdrawal with off-chain destination
- **SecretRedaction**: Demonstrates automatic secret masking
- **ErrorHandling**: Shows validation and error recovery
- **EndToEndIntegration**: Full integration scenario

## API

### AnchorRequestPanel Props

```tsx
interface AnchorRequestPanelProps {
  config: AnchorConfig;
}

interface AnchorConfig {
  homeUrl: string;                    // Base anchor URL
  sep10Endpoint?: string;             // SEP-10 auth endpoint (auto-discovered if omitted)
  sep6Endpoint?: string;              // SEP-6 anchor endpoint (auto-discovered if omitted)
}
```

### Request Types

```tsx
// SEP-10
interface SEP10ChallengeRequest {
  account: string;        // Stellar account (G...)
  memo?: string;          // Optional memo
  home_domain?: string;   // Optional home domain
}

// SEP-6 Deposit
interface SEP6DepositRequest {
  asset_code: string;     // Asset to deposit (e.g., USDC)
  account?: string;       // Stellar account
  memo_type?: string;     // text | id | hash
  memo?: string;          // Memo value
  email_address?: string; // Optional email
  type?: string;          // Optional transaction type
  lang?: string;          // Optional language preference
}

// SEP-6 Withdraw
interface SEP6WithdrawRequest {
  asset_code: string;     // Asset to withdraw
  type?: string;          // Optional transaction type
  dest: string;           // Destination (bank, email, etc.)
  dest_extra?: string;    // Optional extra destination info
  account?: string;       // Stellar account
  memo_type?: string;     // text | id | hash
  memo?: string;          // Memo value
  email_address?: string; // Optional email
  lang?: string;          // Optional language preference
}
```

### RequestLog Structure

```tsx
interface RequestLog {
  id: string;                              // Unique ID
  timestamp: string;                       // ISO 8601 timestamp
  method: 'GET' | 'POST' | 'PUT' | 'DELETE'; // HTTP method
  endpoint: string;                        // Full URL
  requestType: 'sep10_challenge' | 'sep6_deposit' | 'sep6_withdraw';
  requestBody?: Record<string, unknown>;   // Request payload
  responseStatus?: number;                 // HTTP status
  responseBody?: Record<string, unknown>;  // Response payload
  error?: string;                          // Error message if failed
}
```

## Secret Redaction

The panel automatically redacts:

- Private keys (SB...)
- Bearer tokens
- Fields named: secret, password, token, authorization, api_key, etc.
- Account secrets in various formats

This ensures logs are safe to share and store without exposing credentials.

## Development

```bash
# Install dependencies
npm install

# Run Storybook
npm run dev

# Build for production
npm run build

# Build Storybook
npm run build:storybook

# Type check
npm run build

# Lint
npm run lint

# Tests
npm run test
```

## License

MIT
