/**
 * Utilities for redacting sensitive information from request/response payloads
 */

const SENSITIVE_KEYS = [
  'secret',
  'password',
  'token',
  'authorization',
  'x-auth-token',
  'x-api-key',
  'api_key',
  'private_key',
  'private',
  'seed',
  'signing_key',
  'access_token',
  'refresh_token',
];

export function redactSecrets(obj: unknown): unknown {
  if (obj === null || obj === undefined) {
    return obj;
  }

  if (typeof obj === 'string') {
    return redactString(obj);
  }

  if (Array.isArray(obj)) {
    return obj.map((item) => redactSecrets(item));
  }

  if (typeof obj === 'object') {
    const redacted: Record<string, unknown> = {};
    for (const [key, value] of Object.entries(obj)) {
      if (isSensitiveKey(key)) {
        redacted[key] = '[REDACTED]';
      } else {
        redacted[key] = redactSecrets(value);
      }
    }
    return redacted;
  }

  return obj;
}

function isSensitiveKey(key: string): boolean {
  const lowerKey = key.toLowerCase();
  return SENSITIVE_KEYS.some((sensKey) => lowerKey.includes(sensKey));
}

function redactString(str: string): string {
  let redacted = str;

  // Redact Stellar private keys (SB...)
  redacted = redacted.replace(/\bSB[A-Z0-9]{54}\b/g, '[REDACTED_PRIVATE_KEY]');

  // Redact tokens (generic bearer token pattern)
  redacted = redacted.replace(
    /bearer\s+[A-Za-z0-9\-_.~+/]+=*/gi,
    'bearer [REDACTED_TOKEN]'
  );

  return redacted;
}

export function redactedJSON(obj: unknown): string {
  return JSON.stringify(redactSecrets(obj), null, 2);
}
