import React, { useEffect, useState } from 'react';
import { TransactionDetail, fetchTransactionDetails, triggerRecovery } from '../services/api';

interface TransactionModalProps {
  txnId: string | null;
  onClose: () => void;
  onRecovered: () => void;
}

export const TransactionModal: React.FC<TransactionModalProps> = ({ txnId, onClose, onRecovered }) => {
  const [detail, setDetail] = useState<TransactionDetail | null>(null);
  const [loading, setLoading] = useState<boolean>(true);
  const [copyStatus, setCopyStatus] = useState<string | null>(null);
  const [recovering, setRecovering] = useState<boolean>(false);

  useEffect(() => {
    if (!txnId) return;
    setLoading(true);
    fetchTransactionDetails(txnId)
      .then(res => setDetail(res))
      .catch(err => console.error("Error fetching detail:", err))
      .finally(() => setLoading(false));
  }, [txnId]);

  if (!txnId) return null;

  const copyToClipboard = (text: string, label: string) => {
    navigator.clipboard.writeText(text);
    setCopyStatus(`${label} copied!`);
    setTimeout(() => setCopyStatus(null), 2500);
  };

  const handleModalRecover = async () => {
    if (!txnId) return;
    setRecovering(true);
    try {
      const res = await triggerRecovery(txnId);
      setDetail(prev => prev ? { ...prev, is_recovered: true, recovery_link: res.link } : null);
      onRecovered();
    } catch (e) {
      console.error(e);
    } finally {
      setRecovering(false);
    }
  };

  return (
    <div style={styles.backdrop} onClick={onClose}>
      <div style={styles.modal} onClick={e => e.stopPropagation()}>
        {/* Modal Header */}
        <div style={styles.header}>
          <div>
            <span style={styles.tag}>TRANSACTION INTELLIGENCE</span>
            <h2 style={styles.title}>{txnId}</h2>
          </div>
          <button style={styles.closeBtn} onClick={onClose}>✕</button>
        </div>

        {loading ? (
          <div style={styles.loading}>Running AI Diagnostic & Fetching Ledger...</div>
        ) : detail ? (
          <div style={styles.body}>
            {/* Quick stats banner */}
            <div style={styles.statsBanner}>
              <div>
                <div style={styles.statLabel}>Amount</div>
                <div style={styles.statValue}>₹{detail.amount.toLocaleString()}</div>
              </div>
              <div>
                <div style={styles.statLabel}>Status</div>
                <span style={detail.is_recovered ? styles.statusRecovered : styles.statusFailed}>
                  {detail.is_recovered ? 'RECOVERED' : detail.status.toUpperCase()}
                </span>
              </div>
              <div>
                <div style={styles.statLabel}>Customer</div>
                <div style={styles.statEmail}>{detail.customer_email || 'N/A'}</div>
              </div>
              <div>
                <div style={styles.statLabel}>Bank RRN</div>
                <div style={styles.statMeta}>{detail.bank_rrn || 'N/A'}</div>
              </div>
            </div>

            {/* AI Diagnosis Card */}
            <div style={styles.card}>
              <div style={styles.cardTitle}>
                <span>🧠 AI Root Cause Diagnosis</span>
                <span style={styles.aiBadge}>Groq Llama-3 / OSS</span>
              </div>
              <p style={styles.diagnosisText}>
                {detail.diagnosis?.root_cause || "Payment failure due to banking gateway decline."}
              </p>
              <div style={styles.recommendationBox}>
                <strong>Recommended Action:</strong> {detail.diagnosis?.recovery_action || "retry_payment"}
              </div>
            </div>

            {/* Hinglish Communication Template */}
            <div style={styles.card}>
              <div style={styles.cardTitle}>
                <span>💬 Hinglish WhatsApp / SMS Recovery Message</span>
                <button
                  style={styles.actionBtnSmall}
                  onClick={() => copyToClipboard(detail.diagnosis?.hinglish_message || "", "Message")}
                >
                  📋 Copy Message
                </button>
              </div>
              <div style={styles.messageBubble}>
                "{detail.diagnosis?.hinglish_message}"
              </div>
            </div>

            {/* Recovery Action / Link */}
            <div style={styles.card}>
              <div style={styles.cardTitle}>
                <span>🔗 Bounded Recovery Payment Link</span>
              </div>
              {detail.is_recovered ? (
                <div style={styles.linkContainer}>
                  <input
                    type="text"
                    readOnly
                    value={detail.recovery_link || `https://rzp.io/i/${detail.id.slice(0, 8)}`}
                    style={styles.linkInput}
                  />
                  <button
                    style={styles.actionBtnSmall}
                    onClick={() => copyToClipboard(detail.recovery_link || `https://rzp.io/i/${detail.id.slice(0, 8)}`, "Payment Link")}
                  >
                    📋 Copy Link
                  </button>
                  <a
                    href={detail.recovery_link || `https://rzp.io/i/${detail.id.slice(0, 8)}`}
                    target="_blank"
                    rel="noreferrer"
                    style={styles.openLink}
                  >
                    Open Checkout ↗
                  </a>
                </div>
              ) : (
                <div style={styles.unrecoveredBox}>
                  <p style={{ margin: '0 0 12px 0', color: '#94A3B8' }}>
                    This transaction has not yet been recovered. Click below to generate a new Razorpay Payment Link instantly.
                  </p>
                  <button
                    style={recovering ? styles.recoverBtnDisabled : styles.recoverBtn}
                    disabled={recovering}
                    onClick={handleModalRecover}
                  >
                    {recovering ? 'Generating Link...' : '🚀 Generate Recovery Link Now'}
                  </button>
                </div>
              )}
            </div>

            {/* Feedback notification toast */}
            {copyStatus && (
              <div style={styles.copyToast}>{copyStatus}</div>
            )}
          </div>
        ) : (
          <div style={styles.loading}>Failed to load transaction data.</div>
        )}
      </div>
    </div>
  );
};

const styles: { [key: string]: React.CSSProperties } = {
  backdrop: {
    position: 'fixed',
    top: 0,
    left: 0,
    right: 0,
    bottom: 0,
    backgroundColor: 'rgba(11, 20, 38, 0.82)',
    backdropFilter: 'blur(6px)',
    display: 'flex',
    justifyContent: 'center',
    alignItems: 'center',
    zIndex: 1000,
  },
  modal: {
    backgroundColor: '#0C1A30',
    border: '1px solid #1E3A5F',
    borderRadius: '16px',
    width: '680px',
    maxWidth: '92vw',
    maxHeight: '88vh',
    overflowY: 'auto',
    padding: '28px',
    boxShadow: '0 25px 50px -12px rgba(0, 0, 0, 0.7)',
    color: '#F8FAFC',
    position: 'relative',
  },
  header: {
    display: 'flex',
    justifyContent: 'space-between',
    alignItems: 'flex-start',
    marginBottom: '20px',
    borderBottom: '1px solid #1E293B',
    paddingBottom: '14px',
  },
  tag: {
    fontSize: '11px',
    fontWeight: 700,
    color: '#38BDF8',
    letterSpacing: '1px',
  },
  title: {
    margin: '4px 0 0 0',
    fontSize: '22px',
    fontFamily: 'monospace',
    color: '#FFFFFF',
  },
  closeBtn: {
    background: 'none',
    border: 'none',
    color: '#94A3B8',
    fontSize: '20px',
    cursor: 'pointer',
    padding: '4px 8px',
  },
  loading: {
    padding: '48px',
    textAlign: 'center',
    color: '#94A3B8',
  },
  body: {
    display: 'flex',
    flexDirection: 'column',
    gap: '16px',
  },
  statsBanner: {
    display: 'grid',
    gridTemplateColumns: 'repeat(4, 1fr)',
    gap: '12px',
    backgroundColor: '#112240',
    padding: '14px 18px',
    borderRadius: '10px',
    border: '1px solid #1E3A5F',
  },
  statLabel: {
    fontSize: '11px',
    color: '#94A3B8',
    textTransform: 'uppercase',
  },
  statValue: {
    fontSize: '18px',
    fontWeight: 800,
    color: '#10B981',
    marginTop: '2px',
  },
  statEmail: {
    fontSize: '13px',
    color: '#CBD5E1',
    marginTop: '2px',
    overflow: 'hidden',
    textOverflow: 'ellipsis',
  },
  statMeta: {
    fontSize: '12px',
    fontFamily: 'monospace',
    color: '#94A3B8',
    marginTop: '2px',
  },
  statusRecovered: {
    display: 'inline-block',
    marginTop: '4px',
    backgroundColor: '#064E3B',
    color: '#6EE7B7',
    padding: '2px 8px',
    borderRadius: '4px',
    fontSize: '11px',
    fontWeight: 700,
  },
  statusFailed: {
    display: 'inline-block',
    marginTop: '4px',
    backgroundColor: '#451A03',
    color: '#FDBA74',
    padding: '2px 8px',
    borderRadius: '4px',
    fontSize: '11px',
    fontWeight: 700,
  },
  card: {
    backgroundColor: '#112240',
    borderRadius: '10px',
    padding: '16px',
    border: '1px solid #1E3A5F',
  },
  cardTitle: {
    display: 'flex',
    justifyContent: 'space-between',
    alignItems: 'center',
    fontSize: '14px',
    fontWeight: 700,
    color: '#E2E8F0',
    marginBottom: '10px',
  },
  aiBadge: {
    backgroundColor: '#1E3A5F',
    color: '#38BDF8',
    fontSize: '11px',
    padding: '2px 8px',
    borderRadius: '999px',
  },
  diagnosisText: {
    color: '#CBD5E1',
    fontSize: '14px',
    margin: '0 0 10px 0',
    lineHeight: 1.5,
  },
  recommendationBox: {
    backgroundColor: '#0F172A',
    padding: '8px 12px',
    borderRadius: '6px',
    fontSize: '13px',
    color: '#94A3B8',
  },
  messageBubble: {
    backgroundColor: '#0A192F',
    borderLeft: '3px solid #2B84EA',
    padding: '12px 14px',
    borderRadius: '0 6px 6px 0',
    color: '#F1F5F9',
    fontSize: '14px',
    fontStyle: 'italic',
  },
  linkContainer: {
    display: 'flex',
    gap: '8px',
    alignItems: 'center',
  },
  linkInput: {
    flex: 1,
    backgroundColor: '#0A192F',
    border: '1px solid #1E3A5F',
    borderRadius: '6px',
    padding: '8px 12px',
    color: '#38BDF8',
    fontSize: '13px',
    fontFamily: 'monospace',
  },
  actionBtnSmall: {
    backgroundColor: '#1E3A5F',
    border: 'none',
    color: '#F8FAFC',
    padding: '8px 12px',
    borderRadius: '6px',
    fontSize: '12px',
    fontWeight: 600,
    cursor: 'pointer',
    whiteSpace: 'nowrap',
  },
  openLink: {
    color: '#38BDF8',
    fontSize: '13px',
    textDecoration: 'none',
    fontWeight: 600,
    whiteSpace: 'nowrap',
  },
  unrecoveredBox: {
    textAlign: 'center',
    padding: '12px 0',
  },
  recoverBtn: {
    backgroundColor: '#2B84EA',
    color: '#FFFFFF',
    border: 'none',
    padding: '10px 24px',
    borderRadius: '8px',
    fontWeight: 700,
    fontSize: '14px',
    cursor: 'pointer',
    transition: 'background 0.2s',
  },
  recoverBtnDisabled: {
    backgroundColor: '#475569',
    color: '#94A3B8',
    border: 'none',
    padding: '10px 24px',
    borderRadius: '8px',
    fontWeight: 700,
    fontSize: '14px',
    cursor: 'not-allowed',
  },
  copyToast: {
    position: 'absolute',
    bottom: '20px',
    right: '28px',
    backgroundColor: '#10B981',
    color: '#FFFFFF',
    padding: '8px 16px',
    borderRadius: '6px',
    fontSize: '13px',
    fontWeight: 600,
    boxShadow: '0 4px 6px rgba(0,0,0,0.3)',
  }
};
