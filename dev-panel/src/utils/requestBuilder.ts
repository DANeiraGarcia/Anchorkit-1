import type {
  SEP10ChallengeRequest,
  SEP6DepositRequest,
  SEP6WithdrawRequest,
  AnchorConfig,
  RequestLog,
} from '../types';

export class AnchorRequestBuilder {
  private config: AnchorConfig;
  private logs: RequestLog[] = [];

  constructor(config: AnchorConfig) {
    this.config = config;
  }

  async sep10Challenge(
    request: SEP10ChallengeRequest
  ): Promise<{ response: Record<string, unknown>; log: RequestLog }> {
    const endpoint = this.config.sep10Endpoint ?? `${this.config.homeUrl}/auth`;
    const log: RequestLog = {
      id: generateId(),
      timestamp: new Date().toISOString(),
      method: 'GET',
      endpoint,
      requestType: 'sep10_challenge',
      requestBody: request as Record<string, unknown>,
    };

    try {
      const url = new URL(endpoint);
      url.searchParams.append('account', request.account);
      if (request.memo) url.searchParams.append('memo', request.memo);
      if (request.home_domain)
        url.searchParams.append('home_domain', request.home_domain);

      const response = await fetch(url.toString(), { method: 'GET' });
      const data = (await response.json()) as Record<string, unknown>;

      log.responseStatus = response.status;
      log.responseBody = data;

      if (!response.ok) {
        log.error = `HTTP ${response.status}`;
        throw new Error(`SEP-10 challenge failed: ${response.status}`);
      }

      this.logs.push(log);
      return { response: data, log };
    } catch (error) {
      log.error = error instanceof Error ? error.message : String(error);
      this.logs.push(log);
      throw error;
    }
  }

  async sep6Deposit(
    request: SEP6DepositRequest
  ): Promise<{ response: Record<string, unknown>; log: RequestLog }> {
    const endpoint = this.config.sep6Endpoint
      ? `${this.config.sep6Endpoint}/deposit`
      : `${this.config.homeUrl}/deposit`;

    const log: RequestLog = {
      id: generateId(),
      timestamp: new Date().toISOString(),
      method: 'POST',
      endpoint,
      requestType: 'sep6_deposit',
      requestBody: request as Record<string, unknown>,
    };

    try {
      const response = await fetch(endpoint, {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
        },
        body: JSON.stringify(request),
      });

      const data = (await response.json()) as Record<string, unknown>;

      log.responseStatus = response.status;
      log.responseBody = data;

      if (!response.ok) {
        log.error = `HTTP ${response.status}`;
        throw new Error(`SEP-6 deposit failed: ${response.status}`);
      }

      this.logs.push(log);
      return { response: data, log };
    } catch (error) {
      log.error = error instanceof Error ? error.message : String(error);
      this.logs.push(log);
      throw error;
    }
  }

  async sep6Withdraw(
    request: SEP6WithdrawRequest
  ): Promise<{ response: Record<string, unknown>; log: RequestLog }> {
    const endpoint = this.config.sep6Endpoint
      ? `${this.config.sep6Endpoint}/withdraw`
      : `${this.config.homeUrl}/withdraw`;

    const log: RequestLog = {
      id: generateId(),
      timestamp: new Date().toISOString(),
      method: 'POST',
      endpoint,
      requestType: 'sep6_withdraw',
      requestBody: request as Record<string, unknown>,
    };

    try {
      const response = await fetch(endpoint, {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
        },
        body: JSON.stringify(request),
      });

      const data = (await response.json()) as Record<string, unknown>;

      log.responseStatus = response.status;
      log.responseBody = data;

      if (!response.ok) {
        log.error = `HTTP ${response.status}`;
        throw new Error(`SEP-6 withdraw failed: ${response.status}`);
      }

      this.logs.push(log);
      return { response: data, log };
    } catch (error) {
      log.error = error instanceof Error ? error.message : String(error);
      this.logs.push(log);
      throw error;
    }
  }

  getLogs(): RequestLog[] {
    return [...this.logs];
  }

  clearLogs(): void {
    this.logs = [];
  }
}

function generateId(): string {
  return `req_${Date.now()}_${Math.random().toString(36).substr(2, 9)}`;
}
