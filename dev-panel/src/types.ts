/**
 * SEP-10 (Stellar Web Authentication) types and interfaces
 */
export interface SEP10ChallengeRequest {
  account: string;
  memo?: string;
  home_domain?: string;
}

export interface SEP10ChallengeResponse {
  transaction: string;
  network_passphrase: string;
}

/**
 * SEP-6 (Stellar Anchor/Client Interoperability) types
 */
export interface SEP6DepositRequest {
  asset_code: string;
  account?: string;
  memo_type?: 'text' | 'id' | 'hash';
  memo?: string;
  email_address?: string;
  type?: string;
  lang?: string;
}

export interface SEP6WithdrawRequest {
  asset_code: string;
  type?: string;
  dest: string;
  dest_extra?: string;
  account?: string;
  memo_type?: 'text' | 'id' | 'hash';
  memo?: string;
  email_address?: string;
  lang?: string;
}

export interface SEP6TransactionResponse {
  id: string;
  kind: 'deposit' | 'withdrawal';
  status: string;
  status_eta?: number;
  amount_in?: {
    amount: string;
    asset_code: string;
  };
  amount_out?: {
    amount: string;
    asset_code: string;
  };
  amount_fee?: {
    amount: string;
    asset_code: string;
  };
  started_at: string;
  completed_at?: string;
  user_actions_required_by?: string;
  message?: string;
  refunds?: {
    amount_refunded: {
      amount: string;
      asset_code: string;
    };
    amount_fee: {
      amount: string;
      asset_code: string;
    };
    payments: Array<{
      id: string;
      id_type: string;
      amount: {
        amount: string;
        asset_code: string;
      };
      fee: {
        amount: string;
        asset_code: string;
      };
    }>;
  };
}

/**
 * Request/Response logging types
 */
export interface RequestLog {
  id: string;
  timestamp: string;
  method: 'GET' | 'POST' | 'PUT' | 'DELETE';
  endpoint: string;
  requestType: 'sep10_challenge' | 'sep6_deposit' | 'sep6_withdraw';
  requestBody?: Record<string, unknown>;
  responseStatus?: number;
  responseBody?: Record<string, unknown>;
  error?: string;
}

export interface AnchorConfig {
  homeUrl: string;
  sep10Endpoint?: string;
  sep6Endpoint?: string;
}
