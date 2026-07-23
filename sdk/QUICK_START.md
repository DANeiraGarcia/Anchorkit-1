# Quick Start Guide

Get the SEP-10 Flow component running in 5 minutes.

## 1. Install Dependencies

```bash
cd Anchorkit-1/sdk
npm install
```

## 2. View in Storybook

```bash
npm run storybook
```

Opens http://localhost:6006 with interactive component previews.

**Navigate to**: "Authentication" → "Sep10Flow" in left sidebar

**View 7 stories**:
- Idle
- RequestingChallenge
- AwaitingSignature
- VerifyingSignature
- Success
- ChallengeRequestError
- SignatureVerificationError

## 3. Use in Your App

### Import
```tsx
import { Sep10Flow } from '@anchorkit/sdk';
```

### Render
```tsx
<Sep10Flow
  config={{
    anchorUrl: 'https://anchor.example.com',
    publicKey: 'G...',
    domain: 'example.com',
  }}
  onAuthenticated={(token) => console.log('Token:', token)}
  onError={(error) => console.error('Error:', error)}
/>
```

### Callbacks
```tsx
// When authentication succeeds
onAuthenticated={(token: string) => {
  // Store token securely
  localStorage.setItem('sep10_token', token);
}}

// When authentication fails
onError={(error: string) => {
  // Handle error (e.g., show notification)
  console.error(error);
}}

// (Optional) Track stage changes
onStageChange={(stage: Sep10Stage) => {
  // For analytics or debugging
  console.log('Auth stage:', stage);
}}
```

## 4. Build for Production

```bash
npm run build
# Creates dist/ folder
```

## Types

```tsx
import type {
  Sep10Config,
  Sep10Stage,
  Sep10State,
  Sep10Error,
} from '@anchorkit/sdk';

const config: Sep10Config = {
  anchorUrl: string;
  publicKey: string;
  domain?: string;
  timeout?: number;
};

type stage: Sep10Stage = 
  | 'idle'
  | 'requesting'
  | 'awaiting_signature'
  | 'verifying'
  | 'done'
  | 'error';
```

## Services

```tsx
import { Sep10Service } from '@anchorkit/sdk';

const service = new Sep10Service({
  anchorUrl: 'https://...',
  publicKey: 'G...',
});

// Request challenge
const { transaction, networkPassphrase } = 
  await service.requestChallenge();

// Submit signed challenge
const { token, expiresIn } = 
  await service.submitSignedChallenge(signedTransaction);

// Check token validity
const { isValid, expiresIn } = 
  service.getTokenValidity(expiresAt);

// Mask token for display
const masked = service.maskToken(token); // "eyJ...bG1u"
```

## Common Patterns

### With Error Notification
```tsx
const [error, setError] = useState<string | null>(null);

return (
  <>
    {error && <div className="error">{error}</div>}
    <Sep10Flow
      config={{...}}
      onError={(err) => {
        setError(err);
        setTimeout(() => setError(null), 5000);
      }}
    />
  </>
);
```

### With Loading State
```tsx
const [isLoading, setIsLoading] = useState(false);

<Sep10Flow
  config={{...}}
  onStageChange={(stage) => {
    setIsLoading(['requesting', 'verifying'].includes(stage));
  }}
/>
```

### With Token Storage
```tsx
const handleAuthenticated = (token: string) => {
  // Secure storage (httpOnly cookie or encrypted storage)
  sessionStorage.setItem('sep10_token', token);
  
  // Or use secure library
  import('jose').then(({ SignJWT }) => {
    // Encrypt before storing
  });
};
```

## Styling

Component uses CSS modules. To customize:

1. Create wrapper component:
```tsx
const CustomSep10 = (props) => (
  <div className="my-auth-container">
    <Sep10Flow {...props} />
  </div>
);
```

2. Add custom CSS:
```css
.my-auth-container :global(.statusCard) {
  border-radius: 16px;
  box-shadow: custom-shadow;
}
```

## Configuration Options

```tsx
interface Sep10Config {
  // Required: Anchor server base URL
  anchorUrl: string;
  
  // Required: Stellar account public key
  publicKey: string;
  
  // Optional: Domain for multi-domain support (SEP-10 extension)
  domain?: string;
  
  // Optional: Request timeout in milliseconds (default: 30000)
  timeout?: number;
}
```

## Error Codes

| Code | Meaning | Recovery |
|------|---------|----------|
| `CHALLENGE_REQUEST_FAILED` | HTTP error from anchor | Check URL, try again |
| `CHALLENGE_REQUEST_ERROR` | Network/timeout error | Check connection, try again |
| `SIGNATURE_VERIFICATION_FAILED` | Anchor rejected signature | Verify public key, try again |
| `SIGNATURE_VERIFICATION_ERROR` | Network error during verify | Check connection, try again |

## Development

### File Structure
```
sdk/
├── src/
│   ├── components/Sep10Flow/
│   │   ├── Sep10Flow.tsx
│   │   ├── Sep10Flow.module.css
│   │   └── Sep10Flow.stories.tsx
│   ├── services/sep10.ts
│   ├── types/sep10.ts
│   └── index.ts
├── .storybook/
├── package.json
└── README.md
```

### Watch Mode (Development)
```bash
# Terminal 1: Storybook
npm run storybook

# Terminal 2: Build watch (if using vite)
npm run build -- --watch
```

### Add New Stories
1. Edit `Sep10Flow.stories.tsx`
2. Add new story function
3. Refresh Storybook (automatic)

## Integration Checklist

- [ ] Install `@anchorkit/sdk` (or use local path)
- [ ] Import `Sep10Flow` component
- [ ] Add `config` with anchor URL and public key
- [ ] Implement `onAuthenticated` callback
- [ ] Implement `onError` callback
- [ ] Test in development
- [ ] Verify token is masked in success state
- [ ] Test error scenarios
- [ ] Deploy to production

## Troubleshooting

### Challenge Request Fails
- [ ] Check `anchorUrl` is correct
- [ ] Verify HTTPS is used
- [ ] Check public key format

### Signature Verification Fails
- [ ] Verify wallet account matches public key
- [ ] Check wallet is on same network
- [ ] Verify anchor server configuration

### Token Not Persisting
- [ ] Implement `onAuthenticated` callback
- [ ] Store token in your storage layer
- [ ] Check storage is not cleared on navigation

### Storybook Not Loading
```bash
# Clear cache and reinstall
rm -rf node_modules package-lock.json
npm install
npm run storybook
```

## Resources

- **API Reference**: See `README.md`
- **Implementation Guide**: See `IMPLEMENTATION.md`
- **Architecture**: See `ARCHITECTURE.md`
- **Examples**: See `src/examples/BasicIntegration.tsx`
- **Stories**: See `Sep10Flow.stories.tsx`

## Support

1. Check `IMPLEMENTATION.md` for detailed guide
2. View stories in Storybook for working examples
3. Check error codes and messages
4. Review `ARCHITECTURE.md` for design details

## Next Steps

1. ✅ Review the component in Storybook
2. ✅ Integrate into your app
3. ✅ Handle `onAuthenticated` callback
4. ✅ Implement secure token storage
5. ✅ Test auth flow end-to-end
6. ✅ Deploy to production

---

Happy authenticating! 🚀
