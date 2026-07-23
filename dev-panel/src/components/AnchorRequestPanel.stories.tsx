import type { Meta, StoryObj } from '@storybook/react';
import { AnchorRequestPanel } from './AnchorRequestPanel';
import type { AnchorConfig } from '../types';

const meta: Meta<typeof AnchorRequestPanel> = {
  title: 'Anchor Request Panel',
  component: AnchorRequestPanel,
  parameters: {
    layout: 'fullscreen',
  },
};

export default meta;
type Story = StoryObj<typeof AnchorRequestPanel>;

// Mock fetch for Storybook stories
const mockFetch = (endpoint: string, options?: RequestInit) => {
  return new Promise<Response>((resolve) => {
    // Simulate network delay
    setTimeout(() => {
      const url = new URL(endpoint, 'http://localhost');
      const method = options?.method || 'GET';

      // SEP-10 Challenge response
      if (endpoint.includes('/auth') || endpoint.includes('challenge')) {
        resolve(
          new Response(
            JSON.stringify({
              transaction:
                'AAAAAgAAAAD1nJVB/QvRXhLSYpEJ8fKb7ebEVn6CJz8BhQYfHAKvwAAAIAACSBkAAAABAAAAAAAAAAEAAAAAAAAAAAEAAAADAAAAAQAAAAA1nJVB/QvRXhLSYpEJ8fKb7ebEVn6CJz8BhQYfHAKvwAAAAAEAAAADAAAADgAAABhHYXlhIF9Db25zaWdlIFRlc3RpbmcBAAAADwAAAGo1YjcwYzAxLTQzNWQtNDkzMi05MGQ1LWM1ZmY1ZmEwMDJkNAAAAAEAAAAAJsLczTHpqBAAAAAAAAAAAAA=',
              network_passphrase: 'Test SDF Network ; September 2015',
            }),
            {
              status: 200,
              statusText: 'OK',
              headers: { 'content-type': 'application/json' },
            }
          )
        );
        return;
      }

      // SEP-6 Deposit response
      if (endpoint.includes('/deposit') && method === 'POST') {
        resolve(
          new Response(
            JSON.stringify({
              id: 'dep_12345',
              kind: 'deposit',
              status: 'ready',
              amount_in: {
                amount: '100.00',
                asset_code: 'USDC',
              },
              amount_out: {
                amount: '100.00',
                asset_code: 'USDC',
              },
              started_at: new Date().toISOString(),
            }),
            {
              status: 200,
              statusText: 'OK',
              headers: { 'content-type': 'application/json' },
            }
          )
        );
        return;
      }

      // SEP-6 Withdraw response
      if (endpoint.includes('/withdraw') && method === 'POST') {
        resolve(
          new Response(
            JSON.stringify({
              id: 'wth_12345',
              kind: 'withdrawal',
              status: 'pending_user_transfer_start',
              amount_out: {
                amount: '500.00',
                asset_code: 'USDC',
              },
              started_at: new Date().toISOString(),
              user_actions_required_by: new Date(
                Date.now() + 3600000
              ).toISOString(),
            }),
            {
              status: 200,
              statusText: 'OK',
              headers: { 'content-type': 'application/json' },
            }
          )
        );
        return;
      }

      // Default 404
      resolve(
        new Response(JSON.stringify({ error: 'Not found' }), {
          status: 404,
          statusText: 'Not Found',
        })
      );
    }, 800);
  });
};

// Setup global mock for fetch
if (typeof window !== 'undefined' && !window.fetch) {
  (window as any).fetch = mockFetch;
} else if (typeof window !== 'undefined') {
  const originalFetch = window.fetch;
  (window as any).fetch = (...args: any[]) => {
    // Use mock for story endpoints, otherwise delegate to original
    const endpoint = typeof args[0] === 'string' ? args[0] : args[0]?.toString();
    if (
      endpoint?.includes('storybook-mock') ||
      endpoint?.includes('localhost')
    ) {
      return mockFetch(...args);
    }
    return originalFetch(...args);
  };
}

const testnetConfig: AnchorConfig = {
  homeUrl: 'http://localhost:5000/.well-known/stellar.toml',
  sep10Endpoint: 'http://localhost:5000/auth',
  sep6Endpoint: 'http://localhost:5000',
};

export const Default: Story = {
  args: {
    config: testnetConfig,
  },
};

export const WithCustomEndpoints: Story = {
  args: {
    config: {
      homeUrl: 'https://example-anchor.com/.well-known/stellar.toml',
      sep10Endpoint: 'https://example-anchor.com/auth',
      sep6Endpoint: 'https://example-anchor.com/api/v1',
    },
  },
};

/**
 * Story demonstrating a complete SEP-10 challenge flow with realistic data.
 * Shows how the panel handles auth request/response cycles and secret redaction.
 */
export const SEP10ChallengeFlow: Story = {
  args: {
    config: testnetConfig,
  },
  play: async ({ canvasElement }) => {
    // This story is designed to be manually clicked through in Storybook
    // to demonstrate the SEP-10 challenge flow
  },
  parameters: {
    docs: {
      description: {
        story: `
Demonstrates the SEP-10 authentication challenge flow:

1. User enters their Stellar account address (G...)
2. Panel issues GET request to /auth endpoint with account + optional memo/home_domain
3. Server responds with transaction envelope containing challenge
4. Response is displayed with request/response logging
5. Sensitive data (private keys, tokens) are automatically redacted

Try it:
- Account: GBL3F46SBTBNRYVVGS7QA3LX5NZRX7KRVYCHEW6UPXDVHEYVXF6EPZS
- Memo: user-123
- Home Domain: example.com
        `,
      },
    },
  },
};

/**
 * Story demonstrating SEP-6 deposit request with complete logging.
 * Shows form validation, request construction, and response handling.
 */
export const SEP6DepositFlow: Story = {
  args: {
    config: testnetConfig,
  },
  parameters: {
    docs: {
      description: {
        story: `
Demonstrates the SEP-6 deposit initiation flow:

1. User specifies asset code (e.g., USDC)
2. Optionally provides account address and memo for routing
3. Panel issues POST request to /deposit endpoint
4. Server responds with deposit transaction details
5. Request/response are logged with proper secret redaction

Try it:
- Asset Code: USDC
- Account: GBL3F46SBTBNRYVVGS7QA3LX5NZRX7KRVYCHEW6UPXDVHEYVXF6EPZS
- Memo Type: text
- Memo: deposit-ref-123
        `,
      },
    },
  },
};

/**
 * Story demonstrating SEP-6 withdraw request with banking details.
 * Shows how the panel handles off-chain destination information.
 */
export const SEP6WithdrawFlow: Story = {
  args: {
    config: testnetConfig,
  },
  parameters: {
    docs: {
      description: {
        story: `
Demonstrates the SEP-6 withdrawal initiation flow:

1. User specifies asset code and withdrawal destination
2. Destination can be bank account, email, or other off-chain reference
3. Optionally provides account address and memo
4. Panel issues POST request to /withdraw endpoint
5. Server responds with withdrawal transaction details
6. All logs display with automatic secret redaction

Try it:
- Asset Code: USDC
- Destination: user@example.com or account number
- Account: GBL3F46SBTBNRYVVGS7QA3LX5NZRX7KRVYCHEW6UPXDVHEYVXF6EPZS
- Memo Type: text
- Memo: withdrawal-ref-456
        `,
      },
    },
  },
};

/**
 * Story showing secret redaction in action.
 * Demonstrates how sensitive data is automatically masked in logs.
 */
export const SecretRedaction: Story = {
  args: {
    config: testnetConfig,
  },
  parameters: {
    docs: {
      description: {
        story: `
Demonstrates the panel's secret redaction capabilities:

All sensitive data in request/response logs is automatically redacted:
- Private keys (SB...) are masked as [REDACTED_PRIVATE_KEY]
- Bearer tokens are masked as [REDACTED_TOKEN]
- Any field with "secret", "password", "token", etc. in the name becomes [REDACTED]
- Account secrets are masked while maintaining readability

This ensures debug logs are safe to share and store without exposing credentials.
        `,
      },
    },
  },
};

/**
 * Story showing error handling and recovery.
 * Demonstrates how the panel handles network errors and validation failures.
 */
export const ErrorHandling: Story = {
  args: {
    config: testnetConfig,
  },
  parameters: {
    docs: {
      description: {
        story: `
Demonstrates error handling in the developer panel:

The panel validates required fields before sending requests:
- SEP-10: Account address is required
- SEP-6 Deposit: Asset code is required
- SEP-6 Withdraw: Asset code and destination are required

Error messages are displayed clearly above the form.
Network errors are caught and logged with full error details.
        `,
      },
    },
  },
};

/**
 * Complete end-to-end story showing a full SEP-6/SEP-10 integration flow.
 */
export const EndToEndIntegration: Story = {
  args: {
    config: testnetConfig,
  },
  parameters: {
    docs: {
      description: {
        story: `
Demonstrates a complete end-to-end integration flow:

1. SEP-10 Challenge Flow
   - Get challenge transaction from /auth
   - Sign the transaction with your Stellar account
   - Submit signed transaction for validation

2. SEP-6 Deposit Flow
   - Request deposit for specific asset
   - Receive deposit transaction details
   - Submit deposit on-chain or follow anchor instructions

3. SEP-6 Withdraw Flow
   - Request withdrawal for specific asset
   - Provide off-chain destination (bank, email, etc.)
   - Follow anchor instructions to complete withdrawal

All requests and responses are logged with secret redaction applied.
This panel is useful for:
- Debugging anchor integration issues
- Testing SEP-6/SEP-10 implementations
- Verifying request/response formats
- Ensuring proper error handling
        `,
      },
    },
  },
};
