# @anchorkit/sdk

React component library for AnchorKit authentication and integration.

## Features

- **SEP-10 Authentication Flow** - Complete walk-through component for Stellar authentication
- **Status Communication** - Clear visual indicators for each stage (requesting, awaiting signature, verifying, done/error)
- **Secure Token Handling** - JWT tokens are masked to prevent screenshot leaks
- **Storybook Stories** - Comprehensive story coverage including failure paths
- **TypeScript** - Full type safety and documentation

## Installation

```bash
npm install @anchorkit/sdk
```

## Quick Start

```tsx
import { Sep10Flow } from '@anchorkit/sdk';

function App() {
  return (
    <Sep10Flow
      config={{
        anchorUrl: 'https://anchor.example.com',
        publicKey: 'G...',
        domain: 'example.com',
      }}
      onAuthenticated={(token) => console.log('Authenticated!', token)}
      onError={(error) => console.error('Auth failed:', error)}
    />
  );
}
```

## Components

### Sep10Flow

The main authentication flow component that walks users through the SEP-10 challenge/response flow.

**Props:**
- `config` - SEP-10 configuration (anchor URL, public key, domain)
- `onAuthenticated` - Callback when authentication succeeds with session token
- `onError` - Callback when authentication fails with error message
- `onStageChange` - Callback when authentication stage changes

**Stages:**
1. `idle` - Initial state, ready to authenticate
2. `requesting` - Fetching challenge from anchor server
3. `awaiting_signature` - Waiting for user to sign the challenge with their wallet
4. `verifying` - Verifying the signed transaction with the anchor server
5. `done` - Authentication successful
6. `error` - Authentication failed

## Services

### Sep10Service

Core service for SEP-10 authentication operations.

**Methods:**
- `requestChallenge()` - Request a challenge transaction from the anchor
- `submitSignedChallenge(signedTransaction)` - Submit the signed challenge and receive session token
- `getTokenValidity(expiresAt)` - Check token expiration status
- `maskToken(token)` - Mask a JWT token to prevent screenshot leaks

## Security Considerations

1. **Token Masking** - Session tokens are automatically masked in the UI to prevent accidental screenshot leaks
2. **HTTPS Only** - Anchor URLs must use HTTPS (enforced by browser security)
3. **Timeout Protection** - Configurable request timeout prevents hanging requests
4. **No Token Storage** - Component does not persist tokens to localStorage; parent app controls storage

## Storybook

Preview all authentication flow stages:

```bash
npm run storybook
```

Stories include:
- Idle (initial state)
- Requesting challenge
- Awaiting signature
- Verifying signature
- Success
- Challenge request error
- Signature verification error

## Error Handling

All errors include an error code and message for better debugging:

- `CHALLENGE_REQUEST_FAILED` - Failed to fetch challenge from anchor
- `CHALLENGE_REQUEST_ERROR` - Network/timeout error during challenge request
- `SIGNATURE_VERIFICATION_FAILED` - Anchor rejected the signature
- `SIGNATURE_VERIFICATION_ERROR` - Network/timeout error during verification

## TypeScript

Full TypeScript support with exported types:

```tsx
import type { Sep10Config, Sep10State, Sep10Stage } from '@anchorkit/sdk';

const config: Sep10Config = {
  anchorUrl: 'https://anchor.example.com',
  publicKey: 'G...',
  domain: 'example.com',
  timeout: 30000,
};
```

## Development

```bash
# Install dependencies
npm install

# Run Storybook
npm run storybook

# Build for production
npm run build
```

## License

MIT
