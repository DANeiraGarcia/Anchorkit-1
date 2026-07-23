/**
 * SEP-10 authentication service
 * Handles challenge requests, signature verification, and session management
 */

import { ChallengeResponse, AuthResponse, Sep10Config, Sep10Error } from '../types/sep10';

export class Sep10Service {
  private config: Sep10Config;
  private timeout: number;

  constructor(config: Sep10Config) {
    this.config = config;
    this.timeout = config.timeout || 30000;
  }

  /**
   * Request a challenge transaction from the anchor
   */
  async requestChallenge(): Promise<ChallengeResponse> {
    const params = new URLSearchParams({
      account: this.config.publicKey,
    });

    if (this.config.domain) {
      params.append('domain', this.config.domain);
    }

    const url = `${this.config.anchorUrl}/auth?${params}`;

    try {
      const response = await this.fetchWithTimeout(url, {
        method: 'GET',
        headers: { 'Content-Type': 'application/json' },
      });

      if (!response.ok) {
        throw new Sep10ServiceError(
          'CHALLENGE_REQUEST_FAILED',
          `Challenge request failed: ${response.statusText}`
        );
      }

      return response.json();
    } catch (error) {
      if (error instanceof Sep10ServiceError) throw error;
      throw new Sep10ServiceError(
        'CHALLENGE_REQUEST_ERROR',
        'Failed to request challenge',
        { originalError: String(error) }
      );
    }
  }

  /**
   * Submit signed challenge and verify signature
   */
  async submitSignedChallenge(signedTransaction: string): Promise<AuthResponse> {
    try {
      const response = await this.fetchWithTimeout(`${this.config.anchorUrl}/auth`, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ transaction: signedTransaction }),
      });

      if (!response.ok) {
        const errorData = await response.json().catch(() => ({}));
        throw new Sep10ServiceError(
          'SIGNATURE_VERIFICATION_FAILED',
          errorData.error || `Signature verification failed: ${response.statusText}`,
          { status: response.status }
        );
      }

      return response.json();
    } catch (error) {
      if (error instanceof Sep10ServiceError) throw error;
      throw new Sep10ServiceError(
        'SIGNATURE_VERIFICATION_ERROR',
        'Failed to verify signature',
        { originalError: String(error) }
      );
    }
  }

  /**
   * Get remaining validity of a session token
   */
  getTokenValidity(expiresAt: number | null): {
    isValid: boolean;
    expiresIn: number;
  } {
    if (!expiresAt) {
      return { isValid: false, expiresIn: 0 };
    }

    const now = Date.now();
    const expiresIn = expiresAt - now;

    return {
      isValid: expiresIn > 0,
      expiresIn: Math.max(0, expiresIn),
    };
  }

  /**
   * Mask sensitive JWT data for display (prevents screenshot leaks)
   */
  maskToken(token: string): string {
    if (token.length < 20) {
      return '***';
    }
    const visible = Math.ceil(token.length / 4);
    return token.slice(0, visible) + '...' + token.slice(-visible);
  }

  private async fetchWithTimeout(
    url: string,
    options: RequestInit
  ): Promise<Response> {
    const controller = new AbortController();
    const timeoutId = setTimeout(() => controller.abort(), this.timeout);

    try {
      return await fetch(url, {
        ...options,
        signal: controller.signal,
      });
    } finally {
      clearTimeout(timeoutId);
    }
  }
}

export class Sep10ServiceError extends Error implements Sep10Error {
  code: string;
  details?: Record<string, unknown>;

  constructor(code: string, message: string, details?: Record<string, unknown>) {
    super(message);
    this.code = code;
    this.details = details;
    this.name = 'Sep10ServiceError';
  }
}
