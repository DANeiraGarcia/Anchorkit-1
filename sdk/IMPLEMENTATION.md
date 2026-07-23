# SEP-10 Flow Component - Implementation Guide

## Overview

This React component implements the complete SEP-10 (Stellar Authentication Protocol) flow end-to-end. It provides a user-friendly interface for Stellar account holders to authenticate with an anchor service.

## Architecture

### Component Structure

```
Sep10Flow (Component)
├── Sep10Service (Service)
│   ├── requestChallenge()
│   ├── submitSignedChallenge()
│   ├── getTokenValidity()
│   └── maskToken()
└── Types (sep10.ts)
    ├── Sep10Stage
    ├── Sep10State
    ├── Sep10Config
    └── Error types
```

### State Machine

The component follows a strict state machine with these transitions:

```
idle
  ↓
requesting ──→ error (can retry)
  ↓
awaiting_signature ──→ error (can retry)
  ↓
verifying ──→ error (can retry)
  ↓
done
```

At any stage, users can retry the flow or start a new session.

## Acceptance Criteria - Met ✓

### 1. Clear Step Status Communication
- **Visual Indicators**: Color-coded status (gray/blue/amber/green/red) with animated pulse
- **Step Progress**: Visual step counter (1→2→3) showing current progress
- **Status Labels**: Descriptive text for each stage:
  - "Ready to authenticate"
  - "Requesting challenge..."
  - "Awaiting your signature"
  - "Verifying signature..."
  - "Authentication successful"
  - "Authentication failed"

### 2. Never Render JWT in Screenshot-Leakable Way
- **Token Masking**: JWT is displayed as `eyJ...bG1u` (first 25% + last 25% visible)
- **Secure Display**: Only mask visible in green success box, never in plaintext
- **Service Method**: `maskToken()` ensures consistent masking everywhere
- **No Copy Button**: Prevents accidental token duplication

### 3. Storybook Stories with Failure Paths
All 6 stages have stories:
1. **Idle** - Initial ready state
2. **RequestingChallenge** - Challenge fetch in progress
3. **AwaitingSignature** - Challenge received, waiting for signature
4. **VerifyingSignature** - Signature verification in progress
5. **Success** - Authentication complete with masked token
6. **ChallengeRequestError** - Network/connection failure
7. **SignatureVerificationError** - Invalid or rejected signature

## Key Features

### 1. SEP-10 Protocol Compliance

The component follows the SEP-10 standard:
- Requests a challenge transaction from the anchor's `/auth` endpoint
- User signs the challenge with their Stellar account
- Submits signed transaction back to `/auth` for verification
- Receives JWT token on success

### 2. Error Handling

Comprehensive error codes and messages:
- `CHALLENGE_REQUEST_FAILED` - 4xx/5xx HTTP responses
- `CHALLENGE_REQUEST_ERROR` - Network timeouts or exceptions
- `SIGNATURE_VERIFICATION_FAILED` - Anchor rejected signature
- `SIGNATURE_VERIFICATION_ERROR` - Network issues during verification

All errors are actionable with "Try Again" option.

### 3. Security by Design

- **HTTPS Enforcement**: Browser naturally enforces HTTPS for fetch
- **No Local Storage**: Component doesn't persist tokens; parent app decides
- **Timeout Protection**: Configurable timeout (default 30s) prevents hanging
- **Token Masking**: Prevents screenshot leaks of sensitive credentials

### 4. Responsive Design

- Desktop: Full 500px card centered on dark gradient background
- Tablet/Mobile: Responsive layout with 1rem padding
- Touch-friendly: Large buttons (44px+ height for mobile)

## Integration Guide

### Basic Usage

```tsx
import { Sep10Flow } from '@anchorkit/sdk';

function App() {
  const handleAuthenticated = (token: string) => {
    // Store token in local storage or secure storage
    localStorage.setItem('sep10_token', token);
    // Redirect or update app state
    navigate('/dashboard');
  };

  const handleError = (error: string) => {
    // Show error notification to user
    console.error('Authentication failed:', error);
  };

  return (
    <Sep10Flow
      config={{
        anchorUrl: 'https://anchor.example.com',
        publicKey: 'G...',
        domain: 'example.com',
      }}
      onAuthenticated={handleAuthenticated}
      onError={handleError}
    />
  );
}
```

### Advanced: Custom Token Handling

```tsx
import { Sep10Flow, Sep10Service } from '@anchorkit/sdk';

function AdvancedAuth() {
  const service = new Sep10Service({
    anchorUrl: 'https://anchor.example.com',
    publicKey: 'G...',
    timeout: 60000, // Custom 60s timeout
  });

  const onAuthenticated = (token: string) => {
    // Custom secure storage
    const masked = service.maskToken(token);
    console.log(`Authenticated with token: ${masked}`);
  };

  return (
    <Sep10Flow
      config={{...}}
      onAuthenticated={onAuthenticated}
      onStageChange={(stage) => {
        analytics.track('sep10_stage_change', { stage });
      }}
    />
  );
}
```

### Wallet Integration

For real-world usage, the component needs integration with Stellar wallets:

```tsx
import * as StellarSdk from 'stellar-sdk';

async function signChallenge(challenge: string): Promise<string> {
  // This would integrate with a wallet like Freighter
  const keypair = await window.stellar.getPublicKey();
  const transaction = new StellarSdk.TransactionBuilder.fromXDR(
    challenge,
    StellarSdk.Networks.TESTNET_NETWORK_PASSPHRASE
  ).build();
  
  const signedXdr = await window.stellar.signTransaction(transaction.toXDR());
  return signedXdr;
}
```

## Component Props

### `config: Sep10Config` (Required)

```ts
{
  anchorUrl: string;        // Anchor server base URL (must be HTTPS)
  publicKey: string;        // Stellar account public key
  domain?: string;          // Optional domain for SEP-10 extension
  timeout?: number;         // Request timeout in ms (default 30000)
}
```

### `onAuthenticated?: (token: string) => void`

Called when authentication succeeds with the session JWT.

### `onError?: (error: string) => void`

Called when authentication fails with error message and code.

### `onStageChange?: (stage: Sep10Stage) => void`

Called when the authentication stage changes. Useful for analytics or logging.

## Styling

The component uses CSS modules for scoped styling. Key classes:

- `.container` - Full-screen background with gradient
- `.statusCard` - Main card container
- `.statusIndicator` - Animated status dot
- `.step` / `.stepNumber` / `.stepLabel` - Step indicators
- `.errorBox` - Error message display
- `.challengeBox` - Challenge transaction display (awaiting signature)
- `.successBox` - Success message with masked token
- `.button` - Interactive buttons

All styles are responsive and mobile-friendly.

## Testing

### Unit Tests (Recommended)

```tsx
import { render, screen, fireEvent } from '@testing-library/react';
import { Sep10Flow } from './Sep10Flow';

test('renders initial state', () => {
  render(<Sep10Flow config={{...}} />);
  expect(screen.getByText('Ready to authenticate')).toBeInTheDocument();
});

test('calls onAuthenticated with token', async () => {
  const onAuth = jest.fn();
  render(<Sep10Flow config={{...}} onAuthenticated={onAuth} />);
  
  fireEvent.click(screen.getByText('Start Authentication'));
  
  // Mock responses...
  await waitFor(() => {
    expect(onAuth).toHaveBeenCalledWith(expect.stringContaining('eyJ'));
  });
});
```

### Storybook Tests

Run interactive tests in Storybook:

```bash
npm run storybook
```

Use the Interactions panel to verify:
- Challenge request flow
- Signature submission
- Error handling
- Token masking
- Retry behavior

## Performance Considerations

1. **Service Memoization**: `Sep10Service` is memoized to prevent recreating on every render
2. **State Updates**: Batched updates minimize re-renders
3. **CSS-in-JS**: CSS modules avoid runtime style calculations
4. **Event Handlers**: `useCallback` prevents unnecessary function recreations

## Security Best Practices

1. **Parent App Responsibilities**:
   - Never log the raw token
   - Use secure storage (localStorage with CSP or secure httpOnly cookies)
   - Always use HTTPS
   - Implement token refresh before expiry

2. **Anchor Server Requirements**:
   - Must implement SEP-10 correctly
   - Must validate signatures before issuing JWT
   - Must use strong secret keys for JWT signing
   - Should implement rate limiting

3. **Wallet Integration**:
   - Validate challenge XDR before showing to user
   - Never sign arbitrary transactions
   - Verify anchor domain matches expected domain

## Accessibility

The component is designed with accessibility in mind:

- ✓ Semantic HTML buttons and headings
- ✓ Color not the only indicator (uses text labels + icons)
- ✓ Loading states have descriptive text
- ✓ Error messages are clear and actionable
- ✓ Responsive design works with text zoom

For WCAG full compliance, consider:
- Adding ARIA labels for screen readers
- Testing with assistive technologies
- Ensuring 4.5:1 contrast ratio (currently meets standards)

## Troubleshooting

### Challenge Request Fails

**Symptoms**: "CHALLENGE_REQUEST_FAILED" error immediately

**Solutions**:
1. Verify `anchorUrl` is correct and uses HTTPS
2. Check CORS headers on anchor server
3. Verify public key format is valid
4. Check network connectivity

### Signature Verification Fails

**Symptoms**: "SIGNATURE_VERIFICATION_FAILED" after signing

**Solutions**:
1. Verify wallet is signing with correct account
2. Check wallet is on same network (testnet vs public)
3. Verify anchor server signature validation logic
4. Check JWT secret on anchor server

### Token Doesn't Persist

**Symptoms**: Token received but lost on page reload

**Solutions**:
1. Parent app must call `onAuthenticated` callback
2. Store token in localStorage/sessionStorage in callback
3. Implement token refresh before expiry

## Future Enhancements

1. **Multi-Domain Support** - Full SEP-10 extension for multi-domain anchors
2. **Transaction History** - Log and display past auth attempts
3. **Biometric Auth** - Integrate with device biometrics if available
4. **Progressive Web App** - Offline challenge caching
5. **Rate Limit Display** - Show remaining auth attempts
6. **Token Refresh** - Automatic refresh before expiry

## Related Documentation

- [SEP-10 Standard](https://github.com/stellar/stellar-protocol/blob/master/core/cap-0010.md)
- [Stellar SDK Documentation](https://developers.stellar.org/docs)
- [AnchorKit Contract](../README.md)

## License

MIT
