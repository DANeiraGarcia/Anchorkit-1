/**
 * SEP-10 authentication flow types
 */

export type Sep10Stage = 'idle' | 'requesting' | 'awaiting_signature' | 'verifying' | 'done' | 'error';

export interface Sep10State {
  stage: Sep10Stage;
  challenge: string | null;
  error: string | null;
  isAuthenticated: boolean;
  sessionToken: string | null;
  expiresAt: number | null;
}

export interface Sep10Config {
  /** Anchor server base URL for challenge requests */
  anchorUrl: string;
  /** Stellar account public key */
  publicKey: string;
  /** Optional domain for multi-domain support (SEP-10 extension) */
  domain?: string;
  /** Request timeout in milliseconds */
  timeout?: number;
}

export interface ChallengeResponse {
  transaction: string;
  networkPassphrase: string;
}

export interface AuthResponse {
  token: string;
  expiresIn: number;
}

export interface Sep10Error {
  code: string;
  message: string;
  details?: Record<string, unknown>;
}
