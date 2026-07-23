# Quick Start Guide

## 5-Minute Setup

### 1. Install Dependencies
```bash
npm install
```

### 2. Run Storybook
```bash
npm run dev
```
This opens http://localhost:6006 with interactive stories.

### 3. Try a Request
Visit the **SEP-10 Challenge Flow** story and:
- Enter account: `GBL3F46SBTBNRYVVGS7QA3LX5NZRX7KRVYCHEW6UPXDVHEYVXF6EPZS`
- Enter memo: `user-123`
- Click "Get Challenge"
- Inspect the request/response logs below

## Common Use Cases

### Test SEP-10 Authentication
1. Open the panel
2. Switch to "SEP-10 Challenge" tab
3. Enter your Stellar account address
4. Click "Get Challenge"
5. Review the transaction envelope in the logs

### Test SEP-6 Deposit
1. Switch to "SEP-6 Deposit" tab
2. Enter asset code: `USDC`
3. Enter your account address (optional)
4. Click "Request Deposit"
5. Check the response for deposit details

### Test SEP-6 Withdraw
1. Switch to "SEP-6 Withdraw" tab
2. Enter asset code: `USDC`
3. Enter destination (bank account or email)
4. Click "Request Withdraw"
5. Check the response for withdrawal details

## Configuration

Update the anchor URL in your component:

```tsx
<AnchorRequestPanel
  config={{
    homeUrl: 'https://your-anchor.com/.well-known/stellar.toml',
    sep10Endpoint: 'https://your-anchor.com/auth',
    sep6Endpoint: 'https://your-anchor.com/api/v1',
  }}
/>
```

## Understanding the Logs

Each log entry shows:
- **Method**: HTTP method (GET, POST, etc.)
- **Endpoint**: Full URL path
- **Status**: HTTP response code (2xx=success, 4xx=client error, 5xx=server error)
- **Time**: ISO timestamp of the request

Click an entry to expand and see:
- **Request**: Exact parameters sent
- **Response**: Raw response from anchor
- **Error**: Error details if the request failed

## Secret Redaction

All sensitive data is automatically masked:
- Private keys (SB...) → `[REDACTED_PRIVATE_KEY]`
- Tokens → `[REDACTED_TOKEN]`
- Passwords/secrets → `[REDACTED]`

Safe to share logs without worrying about credentials.

## Troubleshooting

### "Failed to fetch" Error
- Check that the anchor endpoint is reachable
- Verify CORS is properly configured on the anchor
- Check browser console for detailed error messages

### Empty Response
- Verify the endpoint URL is correct
- Check that you're using the right request parameters
- Ensure the anchor is running and responding

### Secrets Not Masking
- Redaction uses specific patterns (SB... for keys, Bearer tokens)
- Field names must contain: secret, password, token, api_key, etc.
- Check your response structure for these patterns

## Next Steps

1. Read the full [README.md](./README.md) for advanced usage
2. Explore [Component API](./README.md#api) for programmatic access
3. Review [Type Definitions](./src/types.ts) for custom extensions
4. Check [Stories](./src/components/AnchorRequestPanel.stories.tsx) for more examples

## Integration Example

```tsx
import { AnchorRequestPanel } from '@anchorkit/dev-panel';

export function DebugPage() {
  return (
    <AnchorRequestPanel
      config={{
        homeUrl: process.env.REACT_APP_ANCHOR_URL || 'http://localhost:5000',
      }}
    />
  );
}
```

## Building for Production

```bash
# Compile TypeScript
npm run build

# Build Storybook
npm run build:storybook
```

Output in `dist/` directory ready for npm publish.

That's it! You're ready to debug SEP-6/SEP-10 anchor integrations. 🚀
