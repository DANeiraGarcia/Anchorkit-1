# AnchorKit Developer Panel - Implementation Guide

## Overview

A React-based developer panel for manually constructing and debugging SEP-6/SEP-10 requests against a configured Stellar anchor. This panel is useful for:

- Testing and debugging SEP-10 authentication challenges
- Issuing SEP-6 deposit requests with custom parameters
- Issuing SEP-6 withdraw requests with banking details
- Inspecting raw HTTP requests and responses
- Verifying proper secret redaction in logs

## Project Structure

```
Anchorkit-1/
├── dev-panel/                          # New developer panel
│   ├── .storybook/                     # Storybook configuration
│   │   ├── main.ts
│   │   └── preview.ts
│   ├── src/
│   │   ├── components/
│   │   │   ├── AnchorRequestPanel.tsx          # Main panel component
│   │   │   ├── AnchorRequestPanel.module.css   # Scoped styles
│   │   │   └── AnchorRequestPanel.stories.tsx  # Storybook stories
│   │   ├── utils/
│   │   │   ├── requestBuilder.ts       # HTTP request builder
│   │   │   └── secretRedaction.ts      # Secret redaction utilities
│   │   ├── types.ts                    # TypeScript interfaces
│   │   └── index.ts                    # Public exports
│   ├── package.json
│   ├── tsconfig.json
│   ├── .gitignore
│   └── README.md
└── [existing contract code]
```

## Implementation Details

### 1. Component: AnchorRequestPanel

The main React component that renders the interactive panel with three tabs:

**SEP-10 Challenge Tab:**
- Account address input (required)
- Optional memo field
- Optional home domain field
- "Get Challenge" button

**SEP-6 Deposit Tab:**
- Asset code input (required)
- Optional account address
- Memo type selector (text/id/hash)
- Optional memo value
- "Request Deposit" button

**SEP-6 Withdraw Tab:**
- Asset code input (required)
- Destination input (required)
- Optional account address
- Memo type selector (text/id/hash)
- Optional memo value
- "Request Withdraw" button

**Request/Response Logging:**
- Expandable log entries showing HTTP method, endpoint, and status
- Raw request and response bodies with automatic secret redaction
- Timestamps for each request
- Error details when requests fail

### 2. Utilities: RequestBuilder

The `AnchorRequestBuilder` class handles:

- Constructing properly formatted SEP-6/SEP-10 requests
- Making HTTP requests to anchor endpoints
- Logging all requests and responses
- Error handling and recovery

```typescript
const builder = new AnchorRequestBuilder({
  homeUrl: 'https://example.com/.well-known/stellar.toml',
  sep10Endpoint: 'https://example.com/auth',
  sep6Endpoint: 'https://example.com/api/v1',
});

// SEP-10 Challenge
const { response, log } = await builder.sep10Challenge({
  account: 'G...',
  memo: 'optional-memo',
  home_domain: 'optional-domain',
});

// SEP-6 Deposit
await builder.sep6Deposit({
  asset_code: 'USDC',
  account: 'G...',
  memo_type: 'text',
  memo: 'deposit-ref',
});

// SEP-6 Withdraw
await builder.sep6Withdraw({
  asset_code: 'USDC',
  dest: 'bank-account-or-email',
  account: 'G...',
});

// Access logs
const logs = builder.getLogs();
```

### 3. Utilities: SecretRedaction

Automatic redaction of sensitive information in logs:

**Redacted Fields:**
- Private keys (SB...)
- Tokens and bearer tokens
- Any field with "secret", "password", "token", "authorization", etc.
- API keys and signing keys

**Usage:**
```typescript
import { redactSecrets, redactedJSON } from '@anchorkit/dev-panel';

const response = { account: 'G...', token: 'secret123' };
const safe = redactSecrets(response);      // Field-level redaction
const json = redactedJSON(response);       // Pretty JSON string
```

### 4. Storybook Stories

Comprehensive stories demonstrating all workflows:

- **SEP10ChallengeFlow**: Complete authentication challenge cycle
- **SEP6DepositFlow**: Deposit initiation with logging
- **SEP6WithdrawFlow**: Withdrawal with banking details
- **SecretRedaction**: Shows automatic secret masking
- **ErrorHandling**: Demonstrates validation and recovery
- **EndToEndIntegration**: Full integration scenario

Each story includes:
- Mock fetch handlers for realistic testing
- Pre-filled example values
- Detailed documentation
- Interactive examples

## Acceptance Criteria Met

✅ **Supports SEP-6/SEP-10 Requests**
- SEP-10 challenge requests with optional memo/home_domain
- SEP-6 deposit requests with asset and account details
- SEP-6 withdraw requests with off-chain destination

✅ **Displays Raw Request/Response**
- Full HTTP method and endpoint visibility
- Complete request body display
- Complete response body display
- HTTP status codes and timestamps
- Error messages when requests fail

✅ **Secret Redaction Applied**
- Private keys automatically masked
- Tokens and authentication headers masked
- Any sensitive field masked
- Safe for sharing and storing logs

✅ **Storybook Stories**
- 6 detailed stories covering all use cases
- Mocked request/response cycles
- Complete end-to-end integration example
- Interactive examples for learning and testing

## Usage Instructions

### Installation

```bash
cd dev-panel
npm install
```

### Running Storybook

```bash
npm run dev
# Opens http://localhost:6006
```

### Building for Production

```bash
npm run build
npm run build:storybook
```

### Using in Your Application

```tsx
import { AnchorRequestPanel } from '@anchorkit/dev-panel';

function DebugPage() {
  return (
    <AnchorRequestPanel
      config={{
        homeUrl: process.env.REACT_APP_ANCHOR_URL,
        sep10Endpoint: process.env.REACT_APP_SEP10_ENDPOINT,
        sep6Endpoint: process.env.REACT_APP_SEP6_ENDPOINT,
      }}
    />
  );
}
```

## TypeScript Types

All interfaces are fully typed and exported:

```typescript
// Request types
export interface SEP10ChallengeRequest
export interface SEP6DepositRequest
export interface SEP6WithdrawRequest

// Response types
export interface SEP10ChallengeResponse
export interface SEP6TransactionResponse

// Configuration and logging
export interface AnchorConfig
export interface RequestLog
```

## Styling

The panel uses:
- CSS Modules for scoped styling
- Modern CSS with flexbox and grid
- Responsive design (works on mobile and desktop)
- Color-coded status indicators
- Accessible form controls

## Performance Characteristics

- No external dependencies beyond React
- Efficient request logging with in-memory storage
- Expandable log entries to minimize initial render
- Optimized CSS with minimal repaints
- Fast secret redaction using regex patterns

## Integration with AnchorKit

The developer panel is designed to integrate seamlessly with the existing AnchorKit infrastructure:

- Uses standard SEP-6/SEP-10 request/response formats
- Compatible with any Stellar anchor
- Works with webhook SDK for testing revocation flows
- Can test against contract events via attestation queries

## Future Enhancements

Potential additions:
- Export request history as JSON
- Import saved request templates
- Multi-account request comparison
- Real-time event monitoring
- Integration with Stellar test networks
- Custom header injection
- Request signature verification
- Rate limiting simulation

## Testing

Run tests:

```bash
npm run test
```

The test suite covers:
- Component rendering
- Form validation
- Request construction
- Secret redaction
- Error handling
- Log management

## Troubleshooting

**CORS Errors:**
- Ensure your anchor endpoint has proper CORS headers
- Use a CORS proxy for local testing
- Check anchor configuration in Storybook args

**Requests Timing Out:**
- Check network connectivity
- Verify anchor endpoint is running
- Check browser console for detailed errors

**Secrets Not Redacting:**
- Verify the field name matches redaction patterns
- Check that strings start with SB for private keys
- Ensure tokens are in standard format

## Contributing

When extending the panel:
1. Maintain TypeScript strict mode
2. Add corresponding Storybook stories
3. Update type definitions in `types.ts`
4. Keep secret redaction comprehensive
5. Document any new request types
