/**
 * Example: Basic SEP-10 Integration
 *
 * This example shows how to integrate the Sep10Flow component
 * in a real application with proper error handling and token storage.
 */

import React, { useState } from 'react';
import { Sep10Flow } from '../components/Sep10Flow/Sep10Flow';
import type { Sep10Config } from '../types/sep10';

interface AuthState {
  isAuthenticated: boolean;
  token: string | null;
  expiresAt: number | null;
  error: string | null;
}

export const BasicIntegration: React.FC = () => {
  const [authState, setAuthState] = useState<AuthState>({
    isAuthenticated: false,
    token: null,
    expiresAt: null,
    error: null,
  });

  const sep10Config: Sep10Config = {
    anchorUrl: 'https://anchor.example.com',
    publicKey: 'GBDS4YKTOJJ4TFI4UQMX4LRXJL5T3MXGUWZVOXC3JRK3FXDBHEZGWYUI',
    domain: 'example.com',
    timeout: 30000,
  };

  const handleAuthenticated = (token: string) => {
    const expiresAt = Date.now() + 3600 * 1000; // 1 hour expiry

    setAuthState({
      isAuthenticated: true,
      token,
      expiresAt,
      error: null,
    });

    // Store in local storage (in production, use secure storage)
    localStorage.setItem('sep10_token', token);
    localStorage.setItem('sep10_expires_at', String(expiresAt));

    // Optionally redirect to app
    console.log('User authenticated successfully');
  };

  const handleError = (error: string) => {
    setAuthState((prev) => ({
      ...prev,
      error,
    }));

    console.error('Authentication error:', error);
  };

  const handleLogout = () => {
    setAuthState({
      isAuthenticated: false,
      token: null,
      expiresAt: null,
      error: null,
    });

    localStorage.removeItem('sep10_token');
    localStorage.removeItem('sep10_expires_at');
  };

  // If not authenticated, show auth flow
  if (!authState.isAuthenticated) {
    return (
      <Sep10Flow
        config={sep10Config}
        onAuthenticated={handleAuthenticated}
        onError={handleError}
      />
    );
  }

  // If authenticated, show dashboard
  return (
    <div style={{ padding: '2rem', maxWidth: '800px', margin: '0 auto' }}>
      <h1>Welcome!</h1>
      <p>You are authenticated with your Stellar account.</p>

      <div
        style={{
          background: '#f3f4f6',
          padding: '1rem',
          borderRadius: '8px',
          marginBottom: '2rem',
        }}
      >
        <h2>Session Information</h2>
        <p>
          <strong>Account:</strong> {sep10Config.publicKey}
        </p>
        <p>
          <strong>Anchor Domain:</strong> {sep10Config.domain}
        </p>
        {authState.expiresAt && (
          <p>
            <strong>Session Expires:</strong>{' '}
            {new Date(authState.expiresAt).toLocaleString()}
          </p>
        )}
      </div>

      <button
        onClick={handleLogout}
        style={{
          padding: '0.75rem 1.5rem',
          background: '#ef4444',
          color: 'white',
          border: 'none',
          borderRadius: '6px',
          cursor: 'pointer',
          fontSize: '0.95rem',
        }}
      >
        Logout
      </button>
    </div>
  );
};

/**
 * Example with Wallet Integration
 *
 * This shows how to integrate with Stellar wallet signing.
 * In production, you would use a library like js-stellar-sdk
 * along with a wallet provider like Freighter or Albedo.
 */
export const WalletIntegration: React.FC = () => {
  const [challenge, setChallenge] = useState<string | null>(null);

  const handleRequestChallenge = async () => {
    try {
      const response = await fetch(
        'https://anchor.example.com/auth?account=G...'
      );
      const data = await response.json();
      setChallenge(data.transaction);
    } catch (error) {
      console.error('Failed to request challenge:', error);
    }
  };

  const handleSignAndSubmit = async () => {
    if (!challenge) return;

    try {
      // This would use a wallet provider in real implementation
      // Example with Freighter:
      // const signed = await window.freighter.signTransaction(challenge);

      // For demo purposes, we'll just show the flow
      console.log('Challenge would be signed by wallet:', challenge);

      // Then submit:
      // const response = await fetch('https://anchor.example.com/auth', {
      //   method: 'POST',
      //   headers: { 'Content-Type': 'application/json' },
      //   body: JSON.stringify({ transaction: signed }),
      // });
      // const token = await response.json();
    } catch (error) {
      console.error('Failed to sign or submit:', error);
    }
  };

  return (
    <div style={{ padding: '2rem' }}>
      <h1>Wallet-Integrated SEP-10 Flow</h1>
      <p>This is a simplified example of wallet integration.</p>
      <button onClick={handleRequestChallenge}>
        Step 1: Request Challenge
      </button>
      {challenge && (
        <button onClick={handleSignAndSubmit}>Step 2: Sign & Submit</button>
      )}
    </div>
  );
};
