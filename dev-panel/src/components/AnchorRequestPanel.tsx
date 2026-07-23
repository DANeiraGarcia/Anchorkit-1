import React, { useState } from 'react';
import { AnchorRequestBuilder } from '../utils/requestBuilder';
import { redactedJSON } from '../utils/secretRedaction';
import type {
  AnchorConfig,
  RequestLog,
  SEP10ChallengeRequest,
  SEP6DepositRequest,
  SEP6WithdrawRequest,
} from '../types';
import styles from './AnchorRequestPanel.module.css';

interface AnchorRequestPanelProps {
  config: AnchorConfig;
}

type RequestTab = 'sep10' | 'sep6_deposit' | 'sep6_withdraw';

export const AnchorRequestPanel: React.FC<AnchorRequestPanelProps> = ({
  config,
}) => {
  const [activeTab, setActiveTab] = useState<RequestTab>('sep10');
  const [builder] = useState(() => new AnchorRequestBuilder(config));
  const [logs, setLogs] = useState<RequestLog[]>([]);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);

  // SEP-10 form state
  const [sep10Account, setSep10Account] = useState('');
  const [sep10Memo, setSep10Memo] = useState('');
  const [sep10HomeDomain, setSep10HomeDomain] = useState('');

  // SEP-6 Deposit form state
  const [depositAsset, setDepositAsset] = useState('');
  const [depositAccount, setDepositAccount] = useState('');
  const [depositMemoType, setDepositMemoType] = useState<
    'text' | 'id' | 'hash'
  >('text');
  const [depositMemo, setDepositMemo] = useState('');

  // SEP-6 Withdraw form state
  const [withdrawAsset, setWithdrawAsset] = useState('');
  const [withdrawDest, setWithdrawDest] = useState('');
  const [withdrawAccount, setWithdrawAccount] = useState('');
  const [withdrawMemoType, setWithdrawMemoType] = useState<
    'text' | 'id' | 'hash'
  >('text');
  const [withdrawMemo, setWithdrawMemo] = useState('');

  const handleSep10Challenge = async () => {
    if (!sep10Account.trim()) {
      setError('Account address is required');
      return;
    }

    setLoading(true);
    setError(null);

    try {
      const request: SEP10ChallengeRequest = {
        account: sep10Account,
        ...(sep10Memo && { memo: sep10Memo }),
        ...(sep10HomeDomain && { home_domain: sep10HomeDomain }),
      };

      const { log } = await builder.sep10Challenge(request);
      setLogs([log, ...logs]);
    } catch (err) {
      setError(
        err instanceof Error ? err.message : 'Failed to fetch SEP-10 challenge'
      );
    } finally {
      setLoading(false);
    }
  };

  const handleSep6Deposit = async () => {
    if (!depositAsset.trim()) {
      setError('Asset code is required');
      return;
    }

    setLoading(true);
    setError(null);

    try {
      const request: SEP6DepositRequest = {
        asset_code: depositAsset,
        ...(depositAccount && { account: depositAccount }),
        ...(depositMemo && {
          memo_type: depositMemoType,
          memo: depositMemo,
        }),
      };

      const { log } = await builder.sep6Deposit(request);
      setLogs([log, ...logs]);
    } catch (err) {
      setError(
        err instanceof Error ? err.message : 'Failed to issue SEP-6 deposit'
      );
    } finally {
      setLoading(false);
    }
  };

  const handleSep6Withdraw = async () => {
    if (!withdrawAsset.trim() || !withdrawDest.trim()) {
      setError('Asset code and destination are required');
      return;
    }

    setLoading(true);
    setError(null);

    try {
      const request: SEP6WithdrawRequest = {
        asset_code: withdrawAsset,
        dest: withdrawDest,
        ...(withdrawAccount && { account: withdrawAccount }),
        ...(withdrawMemo && {
          memo_type: withdrawMemoType,
          memo: withdrawMemo,
        }),
      };

      const { log } = await builder.sep6Withdraw(request);
      setLogs([log, ...logs]);
    } catch (err) {
      setError(
        err instanceof Error ? err.message : 'Failed to issue SEP-6 withdraw'
      );
    } finally {
      setLoading(false);
    }
  };

  return (
    <div className={styles.container}>
      <div className={styles.header}>
        <h1>Anchor Request Debugger</h1>
        <p className={styles.subtitle}>
          Debug SEP-6/SEP-10 requests against{' '}
          <code>{config.homeUrl}</code>
        </p>
      </div>

      <div className={styles.tabs}>
        {(['sep10', 'sep6_deposit', 'sep6_withdraw'] as const).map((tab) => (
          <button
            key={tab}
            className={`${styles.tab} ${activeTab === tab ? styles.active : ''}`}
            onClick={() => setActiveTab(tab)}
          >
            {tab === 'sep10' && 'SEP-10 Challenge'}
            {tab === 'sep6_deposit' && 'SEP-6 Deposit'}
            {tab === 'sep6_withdraw' && 'SEP-6 Withdraw'}
          </button>
        ))}
      </div>

      <div className={styles.content}>
        {activeTab === 'sep10' && (
          <Sep10Form
            account={sep10Account}
            memo={sep10Memo}
            homeDomain={sep10HomeDomain}
            onAccountChange={setSep10Account}
            onMemoChange={setSep10Memo}
            onHomeDomainChange={setSep10HomeDomain}
            onSubmit={handleSep10Challenge}
            loading={loading}
          />
        )}

        {activeTab === 'sep6_deposit' && (
          <Sep6DepositForm
            asset={depositAsset}
            account={depositAccount}
            memoType={depositMemoType}
            memo={depositMemo}
            onAssetChange={setDepositAsset}
            onAccountChange={setDepositAccount}
            onMemoTypeChange={setDepositMemoType}
            onMemoChange={setDepositMemo}
            onSubmit={handleSep6Deposit}
            loading={loading}
          />
        )}

        {activeTab === 'sep6_withdraw' && (
          <Sep6WithdrawForm
            asset={withdrawAsset}
            dest={withdrawDest}
            account={withdrawAccount}
            memoType={withdrawMemoType}
            memo={withdrawMemo}
            onAssetChange={setWithdrawAsset}
            onDestChange={setWithdrawDest}
            onAccountChange={setWithdrawAccount}
            onMemoTypeChange={setWithdrawMemoType}
            onMemoChange={setWithdrawMemo}
            onSubmit={handleSep6Withdraw}
            loading={loading}
          />
        )}
      </div>

      {error && <div className={styles.error}>{error}</div>}

      {logs.length > 0 && (
        <RequestLogs logs={logs} onClearLogs={() => setLogs([])} />
      )}
    </div>
  );
};

interface Sep10FormProps {
  account: string;
  memo: string;
  homeDomain: string;
  onAccountChange: (value: string) => void;
  onMemoChange: (value: string) => void;
  onHomeDomainChange: (value: string) => void;
  onSubmit: () => Promise<void>;
  loading: boolean;
}

const Sep10Form: React.FC<Sep10FormProps> = ({
  account,
  memo,
  homeDomain,
  onAccountChange,
  onMemoChange,
  onHomeDomainChange,
  onSubmit,
  loading,
}) => (
  <div className={styles.form}>
    <FormField
      label="Account Address (required)"
      value={account}
      onChange={onAccountChange}
      placeholder="G..."
    />
    <FormField
      label="Memo (optional)"
      value={memo}
      onChange={onMemoChange}
      placeholder="memo value"
    />
    <FormField
      label="Home Domain (optional)"
      value={homeDomain}
      onChange={onHomeDomainChange}
      placeholder="example.com"
    />
    <button
      className={styles.submitBtn}
      onClick={onSubmit}
      disabled={loading || !account}
    >
      {loading ? 'Loading...' : 'Get Challenge'}
    </button>
  </div>
);

interface Sep6DepositFormProps {
  asset: string;
  account: string;
  memoType: 'text' | 'id' | 'hash';
  memo: string;
  onAssetChange: (value: string) => void;
  onAccountChange: (value: string) => void;
  onMemoTypeChange: (value: 'text' | 'id' | 'hash') => void;
  onMemoChange: (value: string) => void;
  onSubmit: () => Promise<void>;
  loading: boolean;
}

const Sep6DepositForm: React.FC<Sep6DepositFormProps> = ({
  asset,
  account,
  memoType,
  memo,
  onAssetChange,
  onAccountChange,
  onMemoTypeChange,
  onMemoChange,
  onSubmit,
  loading,
}) => (
  <div className={styles.form}>
    <FormField
      label="Asset Code (required)"
      value={asset}
      onChange={onAssetChange}
      placeholder="USDC"
    />
    <FormField
      label="Account (optional)"
      value={account}
      onChange={onAccountChange}
      placeholder="G..."
    />
    <div className={styles.formRow}>
      <div className={styles.formGroup}>
        <label>Memo Type</label>
        <select
          value={memoType}
          onChange={(e) =>
            onMemoTypeChange(e.target.value as 'text' | 'id' | 'hash')
          }
        >
          <option value="text">text</option>
          <option value="id">id</option>
          <option value="hash">hash</option>
        </select>
      </div>
      <div className={styles.formGroup} style={{ flex: 1 }}>
        <label>Memo</label>
        <input
          type="text"
          value={memo}
          onChange={(e) => onMemoChange(e.target.value)}
          placeholder="memo value"
        />
      </div>
    </div>
    <button className={styles.submitBtn} onClick={onSubmit} disabled={loading || !asset}>
      {loading ? 'Loading...' : 'Request Deposit'}
    </button>
  </div>
);

interface Sep6WithdrawFormProps {
  asset: string;
  dest: string;
  account: string;
  memoType: 'text' | 'id' | 'hash';
  memo: string;
  onAssetChange: (value: string) => void;
  onDestChange: (value: string) => void;
  onAccountChange: (value: string) => void;
  onMemoTypeChange: (value: 'text' | 'id' | 'hash') => void;
  onMemoChange: (value: string) => void;
  onSubmit: () => Promise<void>;
  loading: boolean;
}

const Sep6WithdrawForm: React.FC<Sep6WithdrawFormProps> = ({
  asset,
  dest,
  account,
  memoType,
  memo,
  onAssetChange,
  onDestChange,
  onAccountChange,
  onMemoTypeChange,
  onMemoChange,
  onSubmit,
  loading,
}) => (
  <div className={styles.form}>
    <FormField
      label="Asset Code (required)"
      value={asset}
      onChange={onAssetChange}
      placeholder="USDC"
    />
    <FormField
      label="Destination (required)"
      value={dest}
      onChange={onDestChange}
      placeholder="bank account, email, etc."
    />
    <FormField
      label="Account (optional)"
      value={account}
      onChange={onAccountChange}
      placeholder="G..."
    />
    <div className={styles.formRow}>
      <div className={styles.formGroup}>
        <label>Memo Type</label>
        <select
          value={memoType}
          onChange={(e) =>
            onMemoTypeChange(e.target.value as 'text' | 'id' | 'hash')
          }
        >
          <option value="text">text</option>
          <option value="id">id</option>
          <option value="hash">hash</option>
        </select>
      </div>
      <div className={styles.formGroup} style={{ flex: 1 }}>
        <label>Memo</label>
        <input
          type="text"
          value={memo}
          onChange={(e) => onMemoChange(e.target.value)}
          placeholder="memo value"
        />
      </div>
    </div>
    <button
      className={styles.submitBtn}
      onClick={onSubmit}
      disabled={loading || !asset || !dest}
    >
      {loading ? 'Loading...' : 'Request Withdraw'}
    </button>
  </div>
);

interface FormFieldProps {
  label: string;
  value: string;
  onChange: (value: string) => void;
  placeholder?: string;
}

const FormField: React.FC<FormFieldProps> = ({
  label,
  value,
  onChange,
  placeholder,
}) => (
  <div className={styles.formGroup}>
    <label>{label}</label>
    <input
      type="text"
      value={value}
      onChange={(e) => onChange(e.target.value)}
      placeholder={placeholder}
    />
  </div>
);

interface RequestLogsProps {
  logs: RequestLog[];
  onClearLogs: () => void;
}

const RequestLogs: React.FC<RequestLogsProps> = ({ logs, onClearLogs }) => (
  <div className={styles.logsContainer}>
    <div className={styles.logsHeader}>
      <h2>Request/Response Logs</h2>
      <button className={styles.clearBtn} onClick={onClearLogs}>
        Clear
      </button>
    </div>
    <div className={styles.logsList}>
      {logs.map((log) => (
        <RequestLogEntry key={log.id} log={log} />
      ))}
    </div>
  </div>
);

interface RequestLogEntryProps {
  log: RequestLog;
}

const RequestLogEntry: React.FC<RequestLogEntryProps> = ({ log }) => {
  const [expanded, setExpanded] = useState(false);

  return (
    <div className={styles.logEntry}>
      <div
        className={styles.logHeader}
        onClick={() => setExpanded(!expanded)}
      >
        <span className={styles.logMethod}>{log.method}</span>
        <span className={styles.logEndpoint}>{log.endpoint}</span>
        <span
          className={`${styles.logStatus} ${log.responseStatus ? (log.responseStatus < 300 ? styles.success : styles.error) : styles.pending}`}
        >
          {log.responseStatus ? log.responseStatus : 'pending'}
        </span>
        <span className={styles.logTime}>{log.timestamp}</span>
      </div>

      {expanded && (
        <div className={styles.logDetails}>
          <div className={styles.logSection}>
            <h4>Request</h4>
            <pre>{redactedJSON(log.requestBody)}</pre>
          </div>
          {log.responseBody && (
            <div className={styles.logSection}>
              <h4>Response</h4>
              <pre>{redactedJSON(log.responseBody)}</pre>
            </div>
          )}
          {log.error && (
            <div className={styles.logSection}>
              <h4>Error</h4>
              <pre className={styles.errorText}>{log.error}</pre>
            </div>
          )}
        </div>
      )}
    </div>
  );
};

export default AnchorRequestPanel;
