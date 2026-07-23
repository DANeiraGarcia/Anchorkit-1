import React, { useState, useCallback } from 'react';
import { Sep10State, Sep10Config } from '../../types/sep10';
import { Sep10Service, Sep10ServiceError } from '../../services/sep10';
import styles from './Sep10Flow.module.css';

export interface Sep10FlowProps {
  config: Sep10Config;
  onAuthenticated?: (token: string) => void;
  onError?: (error: string) => void;
  onStageChange?: (stage: Sep10State['stage']) => void;
}

/**
 * SEP-10 authentication flow component
 * Walks through: requesting challenge → awaiting signature → verifying → done/error
 */
export const Sep10Flow: React.FC<Sep10FlowProps> = ({
  config,
  onAuthenticated,
  onError,
  onStageChange,
}) => {
  const [state, setState] = useState<Sep10State>({
    stage: 'idle',
    challenge: null,
    error: null,
    isAuthenticated: false,
    sessionToken: null,
    expiresAt: null,
  });

  const service = React.useMemo(() => new Sep10Service(config), [config]);

  const updateState = useCallback(
    (updates: Partial<Sep10State>) => {
      setState((prev) => {
        const next = { ...prev, ...updates };
        if (updates.stage && updates.stage !== prev.stage) {
          onStageChange?.(updates.stage);
        }
        return next;
      });
    },
    [onStageChange]
  );

  const requestChallenge = useCallback(async () => {
    updateState({ stage: 'requesting', error: null });

    try {
      const { transaction } = await service.requestChallenge();
      updateState({
        stage: 'awaiting_signature',
        challenge: transaction,
      });
    } catch (error) {
      const errorMessage =
        error instanceof Sep10ServiceError
          ? `${error.code}: ${error.message}`
          : 'Failed to request challenge';
      updateState({
        stage: 'error',
        error: errorMessage,
      });
      onError?.(errorMessage);
    }
  }, [service, updateState, onError]);

  const submitSignedChallenge = useCallback(
    async (signedTransaction: string) => {
      if (!state.challenge) {
        updateState({
          stage: 'error',
          error: 'No challenge available',
        });
        return;
      }

      updateState({ stage: 'verifying', error: null });

      try {
        const { token, expiresIn } = await service.submitSignedChallenge(
          signedTransaction
        );
        const expiresAt = Date.now() + expiresIn * 1000;

        updateState({
          stage: 'done',
          sessionToken: token,
          expiresAt,
          isAuthenticated: true,
        });
        onAuthenticated?.(token);
      } catch (error) {
        const errorMessage =
          error instanceof Sep10ServiceError
            ? `${error.code}: ${error.message}`
            : 'Failed to verify signature';
        updateState({
          stage: 'error',
          error: errorMessage,
        });
        onError?.(errorMessage);
      }
    },
    [state.challenge, service, updateState, onAuthenticated, onError]
  );

  const retry = useCallback(() => {
    updateState({
      stage: 'idle',
      challenge: null,
      error: null,
      sessionToken: null,
      expiresAt: null,
    });
  }, [updateState]);

  const getStageLabel = (stage: Sep10State['stage']): string => {
    const labels: Record<Sep10State['stage'], string> = {
      idle: 'Ready to authenticate',
      requesting: 'Requesting challenge...',
      awaiting_signature: 'Awaiting your signature',
      verifying: 'Verifying signature...',
      done: 'Authentication successful',
      error: 'Authentication failed',
    };
    return labels[stage];
  };

  const { stage, challenge, error, sessionToken, expiresAt } = state;

  return (
    <div className={styles.container}>
      <div className={styles.statusCard}>
        <div className={`${styles.statusIndicator} ${styles[stage]}`} />
        <h2 className={styles.statusTitle}>{getStageLabel(stage)}</h2>

        <div className={styles.flowSteps}>
          <div className={`${styles.step} ${stage === 'requesting' ? styles.active : ''}`}>
            <span className={styles.stepNumber}>1</span>
            <span className={styles.stepLabel}>Request Challenge</span>
          </div>
          <div
            className={`${styles.step} ${['awaiting_signature', 'verifying', 'done'].includes(stage) ? styles.active : ''}`}
          >
            <span className={styles.stepNumber}>2</span>
            <span className={styles.stepLabel}>Sign Challenge</span>
          </div>
          <div
            className={`${styles.step} ${['verifying', 'done'].includes(stage) ? styles.active : ''}`}
          >
            <span className={styles.stepNumber}>3</span>
            <span className={styles.stepLabel}>Verify & Authenticate</span>
          </div>
        </div>

        {error && (
          <div className={styles.errorBox}>
            <div className={styles.errorTitle}>Error</div>
            <div className={styles.errorMessage}>{error}</div>
          </div>
        )}

        {challenge && stage === 'awaiting_signature' && (
          <div className={styles.challengeBox}>
            <div className={styles.challengeLabel}>Challenge Transaction</div>
            <div className={styles.challengeValue}>
              {challenge.slice(0, 40)}...
            </div>
            <p className={styles.challengeHint}>
              Sign this challenge with your Stellar wallet to proceed.
            </p>
          </div>
        )}

        {sessionToken && stage === 'done' && (
          <div className={styles.successBox}>
            <div className={styles.successLabel}>Session Token</div>
            <div className={styles.tokenValue}>
              {service.maskToken(sessionToken)}
            </div>
            {expiresAt && (
              <div className={styles.expiryInfo}>
                Expires in{' '}
                {Math.ceil((expiresAt - Date.now()) / 1000)}s
              </div>
            )}
          </div>
        )}

        <div className={styles.actions}>
          {stage === 'idle' && (
            <button
              className={`${styles.button} ${styles.primary}`}
              onClick={requestChallenge}
            >
              Start Authentication
            </button>
          )}

          {stage === 'awaiting_signature' && (
            <>
              <button
                className={`${styles.button} ${styles.primary}`}
                onClick={() => {
                  /* In real usage, this would be triggered by wallet signing */
                  const demoSignedTx =
                    challenge + '_signed_by_wallet';
                  submitSignedChallenge(demoSignedTx);
                }}
              >
                Submit Signed Challenge
              </button>
              <button className={`${styles.button} ${styles.secondary}`} onClick={retry}>
                Cancel
              </button>
            </>
          )}

          {stage === 'error' && (
            <button className={`${styles.button} ${styles.primary}`} onClick={retry}>
              Try Again
            </button>
          )}

          {stage === 'done' && (
            <button className={`${styles.button} ${styles.secondary}`} onClick={retry}>
              Start New Session
            </button>
          )}

          {['requesting', 'verifying'].includes(stage) && (
            <div className={styles.loadingIndicator}>
              <span></span>
              <span></span>
              <span></span>
            </div>
          )}
        </div>
      </div>
    </div>
  );
};
