import type { Meta, StoryObj } from '@storybook/react';
import { Sep10Flow } from './Sep10Flow';
import { Sep10Config } from '../../types/sep10';

const meta = {
  title: 'Authentication/Sep10Flow',
  component: Sep10Flow,
  parameters: {
    layout: 'fullscreen',
  },
  tags: ['autodocs'],
} satisfies Meta<typeof Sep10Flow>;

export default meta;
type Story = StoryObj<typeof meta>;

// Mock configuration
const mockConfig: Sep10Config = {
  anchorUrl: 'https://anchor.example.com',
  publicKey: 'GBDS4YKTOJJ4TFI4UQMX4LRXJL5T3MXGUWZVOXC3JRK3FXDBHEZGWYUI',
  domain: 'example.com',
  timeout: 30000,
};

/**
 * Initial state - ready to start authentication
 */
export const Idle: Story = {
  args: {
    config: mockConfig,
  },
};

/**
 * Challenge request in progress
 */
export const RequestingChallenge: Story = {
  args: {
    config: mockConfig,
  },
  render: (args) => {
    // Simulate requesting state by using a custom hook
    return (
      <div style={{ display: 'flex', justifyContent: 'center', alignItems: 'center', minHeight: '100vh', background: '#f3f4f6' }}>
        <div style={{ background: 'white', padding: '2rem', borderRadius: '12px', width: '500px' }}>
          <div style={{ width: '12px', height: '12px', borderRadius: '50%', background: '#f59e0b', marginBottom: '1rem', animation: 'pulse 2s infinite' }} />
          <h2 style={{ fontSize: '1.5rem', fontWeight: '600', marginBottom: '1.5rem' }}>Requesting challenge...</h2>
          <div style={{ marginBottom: '2rem', display: 'flex', justifyContent: 'space-between' }}>
            <div style={{ textAlign: 'center', opacity: 1 }}>
              <div style={{ width: '40px', height: '40px', borderRadius: '50%', background: '#3b82f6', color: 'white', display: 'flex', alignItems: 'center', justifyContent: 'center', fontWeight: '600', margin: '0 auto 0.5rem' }}>1</div>
              <div style={{ fontSize: '0.875rem', color: '#6b7280', maxWidth: '80px', margin: '0 auto' }}>Request Challenge</div>
            </div>
            <div style={{ textAlign: 'center', opacity: 0.5 }}>
              <div style={{ width: '40px', height: '40px', borderRadius: '50%', background: '#e5e7eb', color: '#6b7280', display: 'flex', alignItems: 'center', justifyContent: 'center', fontWeight: '600', margin: '0 auto 0.5rem' }}>2</div>
              <div style={{ fontSize: '0.875rem', color: '#6b7280', maxWidth: '80px', margin: '0 auto' }}>Sign Challenge</div>
            </div>
            <div style={{ textAlign: 'center', opacity: 0.5 }}>
              <div style={{ width: '40px', height: '40px', borderRadius: '50%', background: '#e5e7eb', color: '#6b7280', display: 'flex', alignItems: 'center', justifyContent: 'center', fontWeight: '600', margin: '0 auto 0.5rem' }}>3</div>
              <div style={{ fontSize: '0.875rem', color: '#6b7280', maxWidth: '80px', margin: '0 auto' }}>Verify & Authenticate</div>
            </div>
          </div>
          <div style={{ display: 'flex', justifyContent: 'center', gap: '0.375rem', padding: '1rem 0' }}>
            <span style={{ width: '8px', height: '8px', borderRadius: '50%', background: '#3b82f6', animation: 'bounce 1.4s infinite' }} />
            <span style={{ width: '8px', height: '8px', borderRadius: '50%', background: '#3b82f6', animation: 'bounce 1.4s infinite 0.2s' }} />
            <span style={{ width: '8px', height: '8px', borderRadius: '50%', background: '#3b82f6', animation: 'bounce 1.4s infinite 0.4s' }} />
          </div>
        </div>
      </div>
    );
  },
};

/**
 * Challenge received, awaiting user signature
 */
export const AwaitingSignature: Story = {
  args: {
    config: mockConfig,
  },
  render: (args) => (
    <div style={{ display: 'flex', justifyContent: 'center', alignItems: 'center', minHeight: '100vh', background: '#f3f4f6' }}>
      <div style={{ background: 'white', padding: '2rem', borderRadius: '12px', width: '500px' }}>
        <div style={{ width: '12px', height: '12px', borderRadius: '50%', background: '#f59e0b', marginBottom: '1rem', animation: 'pulse 2s infinite' }} />
        <h2 style={{ fontSize: '1.5rem', fontWeight: '600', marginBottom: '1.5rem' }}>Awaiting your signature</h2>
        <div style={{ marginBottom: '2rem', display: 'flex', justifyContent: 'space-between' }}>
          <div style={{ textAlign: 'center', opacity: 1 }}>
            <div style={{ width: '40px', height: '40px', borderRadius: '50%', background: '#3b82f6', color: 'white', display: 'flex', alignItems: 'center', justifyContent: 'center', fontWeight: '600', margin: '0 auto 0.5rem' }}>✓</div>
            <div style={{ fontSize: '0.875rem', color: '#6b7280', maxWidth: '80px', margin: '0 auto' }}>Request Challenge</div>
          </div>
          <div style={{ textAlign: 'center', opacity: 1 }}>
            <div style={{ width: '40px', height: '40px', borderRadius: '50%', background: '#3b82f6', color: 'white', display: 'flex', alignItems: 'center', justifyContent: 'center', fontWeight: '600', margin: '0 auto 0.5rem' }}>2</div>
            <div style={{ fontSize: '0.875rem', color: '#6b7280', maxWidth: '80px', margin: '0 auto' }}>Sign Challenge</div>
          </div>
          <div style={{ textAlign: 'center', opacity: 0.5 }}>
            <div style={{ width: '40px', height: '40px', borderRadius: '50%', background: '#e5e7eb', color: '#6b7280', display: 'flex', alignItems: 'center', justifyContent: 'center', fontWeight: '600', margin: '0 auto 0.5rem' }}>3</div>
            <div style={{ fontSize: '0.875rem', color: '#6b7280', maxWidth: '80px', margin: '0 auto' }}>Verify & Authenticate</div>
          </div>
        </div>
        <div style={{ background: '#f3f4f6', border: '1px solid #d1d5db', borderRadius: '8px', padding: '1rem', marginBottom: '1rem' }}>
          <div style={{ fontSize: '0.875rem', fontWeight: '600', color: '#374151', textTransform: 'uppercase', letterSpacing: '0.05em', marginBottom: '0.5rem' }}>Challenge Transaction</div>
          <div style={{ fontFamily: 'Monaco, Courier New, monospace', fontSize: '0.85rem', color: '#1f2937', wordBreak: 'break-all', padding: '0.75rem', background: 'white', borderRadius: '4px', border: '1px solid #d1d5db', marginBottom: '0.75rem' }}>
            AAAAAgAAAABrNz9+SUCtRVdhfVfJvDdZtvZJqv+4mE7tJmn3X6psBgAAAGQBfvFpAAAAZQAAAAAAAAABAAAAAAAAAAYAAAAAAAAAAAEAAAAA...
          </div>
          <p style={{ fontSize: '0.85rem', color: '#6b7280', margin: 0, lineHeight: '1.5' }}>
            Sign this challenge with your Stellar wallet to proceed.
          </p>
        </div>
        <div style={{ display: 'flex', gap: '0.75rem', flexDirection: 'column' }}>
          <button style={{ padding: '0.75rem 1.5rem', border: 'none', borderRadius: '6px', fontWeight: '500', cursor: 'pointer', background: '#3b82f6', color: 'white', fontSize: '0.95rem' }}>
            Submit Signed Challenge
          </button>
          <button style={{ padding: '0.75rem 1.5rem', border: 'none', borderRadius: '6px', fontWeight: '500', cursor: 'pointer', background: '#e5e7eb', color: '#374151', fontSize: '0.95rem' }}>
            Cancel
          </button>
        </div>
      </div>
    </div>
  ),
};

/**
 * Signature verification in progress
 */
export const VerifyingSignature: Story = {
  args: {
    config: mockConfig,
  },
  render: (args) => (
    <div style={{ display: 'flex', justifyContent: 'center', alignItems: 'center', minHeight: '100vh', background: '#f3f4f6' }}>
      <div style={{ background: 'white', padding: '2rem', borderRadius: '12px', width: '500px' }}>
        <div style={{ width: '12px', height: '12px', borderRadius: '50%', background: '#f59e0b', marginBottom: '1rem', animation: 'pulse 2s infinite' }} />
        <h2 style={{ fontSize: '1.5rem', fontWeight: '600', marginBottom: '1.5rem' }}>Verifying signature...</h2>
        <div style={{ marginBottom: '2rem', display: 'flex', justifyContent: 'space-between' }}>
          <div style={{ textAlign: 'center', opacity: 1 }}>
            <div style={{ width: '40px', height: '40px', borderRadius: '50%', background: '#3b82f6', color: 'white', display: 'flex', alignItems: 'center', justifyContent: 'center', fontWeight: '600', margin: '0 auto 0.5rem' }}>✓</div>
            <div style={{ fontSize: '0.875rem', color: '#6b7280', maxWidth: '80px', margin: '0 auto' }}>Request Challenge</div>
          </div>
          <div style={{ textAlign: 'center', opacity: 1 }}>
            <div style={{ width: '40px', height: '40px', borderRadius: '50%', background: '#3b82f6', color: 'white', display: 'flex', alignItems: 'center', justifyContent: 'center', fontWeight: '600', margin: '0 auto 0.5rem' }}>✓</div>
            <div style={{ fontSize: '0.875rem', color: '#6b7280', maxWidth: '80px', margin: '0 auto' }}>Sign Challenge</div>
          </div>
          <div style={{ textAlign: 'center', opacity: 1 }}>
            <div style={{ width: '40px', height: '40px', borderRadius: '50%', background: '#3b82f6', color: 'white', display: 'flex', alignItems: 'center', justifyContent: 'center', fontWeight: '600', margin: '0 auto 0.5rem' }}>3</div>
            <div style={{ fontSize: '0.875rem', color: '#6b7280', maxWidth: '80px', margin: '0 auto' }}>Verify & Authenticate</div>
          </div>
        </div>
        <div style={{ display: 'flex', justifyContent: 'center', gap: '0.375rem', padding: '1rem 0' }}>
          <span style={{ width: '8px', height: '8px', borderRadius: '50%', background: '#3b82f6', animation: 'bounce 1.4s infinite' }} />
          <span style={{ width: '8px', height: '8px', borderRadius: '50%', background: '#3b82f6', animation: 'bounce 1.4s infinite 0.2s' }} />
          <span style={{ width: '8px', height: '8px', borderRadius: '50%', background: '#3b82f6', animation: 'bounce 1.4s infinite 0.4s' }} />
        </div>
      </div>
    </div>
  ),
};

/**
 * Authentication successful
 */
export const Success: Story = {
  args: {
    config: mockConfig,
  },
  render: (args) => (
    <div style={{ display: 'flex', justifyContent: 'center', alignItems: 'center', minHeight: '100vh', background: '#f3f4f6' }}>
      <div style={{ background: 'white', padding: '2rem', borderRadius: '12px', width: '500px' }}>
        <div style={{ width: '12px', height: '12px', borderRadius: '50%', background: '#10b981', marginBottom: '1rem' }} />
        <h2 style={{ fontSize: '1.5rem', fontWeight: '600', marginBottom: '1.5rem' }}>Authentication successful</h2>
        <div style={{ marginBottom: '2rem', display: 'flex', justifyContent: 'space-between' }}>
          <div style={{ textAlign: 'center', opacity: 1 }}>
            <div style={{ width: '40px', height: '40px', borderRadius: '50%', background: '#3b82f6', color: 'white', display: 'flex', alignItems: 'center', justifyContent: 'center', fontWeight: '600', margin: '0 auto 0.5rem' }}>✓</div>
            <div style={{ fontSize: '0.875rem', color: '#6b7280', maxWidth: '80px', margin: '0 auto' }}>Request Challenge</div>
          </div>
          <div style={{ textAlign: 'center', opacity: 1 }}>
            <div style={{ width: '40px', height: '40px', borderRadius: '50%', background: '#3b82f6', color: 'white', display: 'flex', alignItems: 'center', justifyContent: 'center', fontWeight: '600', margin: '0 auto 0.5rem' }}>✓</div>
            <div style={{ fontSize: '0.875rem', color: '#6b7280', maxWidth: '80px', margin: '0 auto' }}>Sign Challenge</div>
          </div>
          <div style={{ textAlign: 'center', opacity: 1 }}>
            <div style={{ width: '40px', height: '40px', borderRadius: '50%', background: '#3b82f6', color: 'white', display: 'flex', alignItems: 'center', justifyContent: 'center', fontWeight: '600', margin: '0 auto 0.5rem' }}>✓</div>
            <div style={{ fontSize: '0.875rem', color: '#6b7280', maxWidth: '80px', margin: '0 auto' }}>Verify & Authenticate</div>
          </div>
        </div>
        <div style={{ background: '#f0fdf4', border: '1px solid #bbf7d0', borderRadius: '8px', padding: '1rem', marginBottom: '1rem' }}>
          <div style={{ fontSize: '0.875rem', fontWeight: '600', color: '#166534', textTransform: 'uppercase', letterSpacing: '0.05em', marginBottom: '0.5rem' }}>Session Token</div>
          <div style={{ fontFamily: 'Monaco, Courier New, monospace', fontSize: '0.85rem', color: '#1f2937', padding: '0.75rem', background: 'white', borderRadius: '4px', border: '1px solid #bbf7d0', marginBottom: '0.75rem', wordBreak: 'break-all' }}>
            eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9...bG1u
          </div>
          <div style={{ fontSize: '0.85rem', color: '#166534', fontWeight: '500' }}>
            Expires in 3600s
          </div>
        </div>
        <button style={{ width: '100%', padding: '0.75rem 1.5rem', border: 'none', borderRadius: '6px', fontWeight: '500', cursor: 'pointer', background: '#e5e7eb', color: '#374151', fontSize: '0.95rem' }}>
          Start New Session
        </button>
      </div>
    </div>
  ),
};

/**
 * Challenge request failed
 */
export const ChallengeRequestError: Story = {
  args: {
    config: mockConfig,
  },
  render: (args) => (
    <div style={{ display: 'flex', justifyContent: 'center', alignItems: 'center', minHeight: '100vh', background: '#f3f4f6' }}>
      <div style={{ background: 'white', padding: '2rem', borderRadius: '12px', width: '500px' }}>
        <div style={{ width: '12px', height: '12px', borderRadius: '50%', background: '#ef4444', marginBottom: '1rem' }} />
        <h2 style={{ fontSize: '1.5rem', fontWeight: '600', marginBottom: '1.5rem' }}>Authentication failed</h2>
        <div style={{ marginBottom: '2rem', display: 'flex', justifyContent: 'space-between' }}>
          <div style={{ textAlign: 'center', opacity: 1 }}>
            <div style={{ width: '40px', height: '40px', borderRadius: '50%', background: '#ef4444', color: 'white', display: 'flex', alignItems: 'center', justifyContent: 'center', fontWeight: '600', margin: '0 auto 0.5rem' }}>✗</div>
            <div style={{ fontSize: '0.875rem', color: '#6b7280', maxWidth: '80px', margin: '0 auto' }}>Request Challenge</div>
          </div>
          <div style={{ textAlign: 'center', opacity: 0.5 }}>
            <div style={{ width: '40px', height: '40px', borderRadius: '50%', background: '#e5e7eb', color: '#6b7280', display: 'flex', alignItems: 'center', justifyContent: 'center', fontWeight: '600', margin: '0 auto 0.5rem' }}>2</div>
            <div style={{ fontSize: '0.875rem', color: '#6b7280', maxWidth: '80px', margin: '0 auto' }}>Sign Challenge</div>
          </div>
          <div style={{ textAlign: 'center', opacity: 0.5 }}>
            <div style={{ width: '40px', height: '40px', borderRadius: '50%', background: '#e5e7eb', color: '#6b7280', display: 'flex', alignItems: 'center', justifyContent: 'center', fontWeight: '600', margin: '0 auto 0.5rem' }}>3</div>
            <div style={{ fontSize: '0.875rem', color: '#6b7280', maxWidth: '80px', margin: '0 auto' }}>Verify & Authenticate</div>
          </div>
        </div>
        <div style={{ background: '#fee2e2', border: '1px solid #fecaca', borderRadius: '8px', padding: '1rem', marginBottom: '1rem' }}>
          <div style={{ fontWeight: '600', color: '#991b1b', marginBottom: '0.5rem', fontSize: '0.875rem', textTransform: 'uppercase', letterSpacing: '0.05em' }}>Error</div>
          <div style={{ color: '#7f1d1d', fontSize: '0.95rem', wordBreak: 'break-word' }}>
            CHALLENGE_REQUEST_FAILED: Failed to connect to anchor server. Check your network connection and try again.
          </div>
        </div>
        <button style={{ width: '100%', padding: '0.75rem 1.5rem', border: 'none', borderRadius: '6px', fontWeight: '500', cursor: 'pointer', background: '#3b82f6', color: 'white', fontSize: '0.95rem' }}>
          Try Again
        </button>
      </div>
    </div>
  ),
};

/**
 * Signature verification failed
 */
export const SignatureVerificationError: Story = {
  args: {
    config: mockConfig,
  },
  render: (args) => (
    <div style={{ display: 'flex', justifyContent: 'center', alignItems: 'center', minHeight: '100vh', background: '#f3f4f6' }}>
      <div style={{ background: 'white', padding: '2rem', borderRadius: '12px', width: '500px' }}>
        <div style={{ width: '12px', height: '12px', borderRadius: '50%', background: '#ef4444', marginBottom: '1rem' }} />
        <h2 style={{ fontSize: '1.5rem', fontWeight: '600', marginBottom: '1.5rem' }}>Authentication failed</h2>
        <div style={{ marginBottom: '2rem', display: 'flex', justifyContent: 'space-between' }}>
          <div style={{ textAlign: 'center', opacity: 1 }}>
            <div style={{ width: '40px', height: '40px', borderRadius: '50%', background: '#3b82f6', color: 'white', display: 'flex', alignItems: 'center', justifyContent: 'center', fontWeight: '600', margin: '0 auto 0.5rem' }}>✓</div>
            <div style={{ fontSize: '0.875rem', color: '#6b7280', maxWidth: '80px', margin: '0 auto' }}>Request Challenge</div>
          </div>
          <div style={{ textAlign: 'center', opacity: 1 }}>
            <div style={{ width: '40px', height: '40px', borderRadius: '50%', background: '#3b82f6', color: 'white', display: 'flex', alignItems: 'center', justifyContent: 'center', fontWeight: '600', margin: '0 auto 0.5rem' }}>✓</div>
            <div style={{ fontSize: '0.875rem', color: '#6b7280', maxWidth: '80px', margin: '0 auto' }}>Sign Challenge</div>
          </div>
          <div style={{ textAlign: 'center', opacity: 1 }}>
            <div style={{ width: '40px', height: '40px', borderRadius: '50%', background: '#ef4444', color: 'white', display: 'flex', alignItems: 'center', justifyContent: 'center', fontWeight: '600', margin: '0 auto 0.5rem' }}>✗</div>
            <div style={{ fontSize: '0.875rem', color: '#6b7280', maxWidth: '80px', margin: '0 auto' }}>Verify & Authenticate</div>
          </div>
        </div>
        <div style={{ background: '#fee2e2', border: '1px solid #fecaca', borderRadius: '8px', padding: '1rem', marginBottom: '1rem' }}>
          <div style={{ fontWeight: '600', color: '#991b1b', marginBottom: '0.5rem', fontSize: '0.875rem', textTransform: 'uppercase', letterSpacing: '0.05em' }}>Error</div>
          <div style={{ color: '#7f1d1d', fontSize: '0.95rem', wordBreak: 'break-word' }}>
            SIGNATURE_VERIFICATION_FAILED: Invalid signature. The transaction signature could not be verified. Please try again with a valid signature.
          </div>
        </div>
        <button style={{ width: '100%', padding: '0.75rem 1.5rem', border: 'none', borderRadius: '6px', fontWeight: '500', cursor: 'pointer', background: '#3b82f6', color: 'white', fontSize: '0.95rem' }}>
          Try Again
        </button>
      </div>
    </div>
  ),
};
