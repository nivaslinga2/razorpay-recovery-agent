import React, { useState } from 'react';

export const RecoveryModal = ({ show, onHide, txn, onConfirm }) => {
  const [loading, setLoading] = useState(false);
  const [recoveredLink, setRecoveredLink] = useState(null);
  const [copied, setCopied] = useState(false);

  if (!show || !txn) return null;

  const handleExecute = async () => {
    setLoading(true);
    try {
      const res = await onConfirm(txn.id);
      if (res && res.link) {
        setRecoveredLink(res.link);
      }
    } catch (e) {
      console.error(e);
    } finally {
      setLoading(false);
    }
  };

  const copyLink = () => {
    if (recoveredLink) {
      navigator.clipboard.writeText(recoveredLink);
      setCopied(true);
      setTimeout(() => setCopied(false), 2000);
    }
  };

  const hinglish = txn.diagnosis?.hinglish_message || 
    (txn.error_code === 'CARD_DECLINED' 
      ? 'Aapka card bank ne decline kiya. Kripya dusra card ya UPI use karein.' 
      : `Aapki payment of ₹${txn.amount?.toLocaleString()} fail hui thi. Kripya niche diye link se complete karein.`);

  return (
    <div className="modal-backdrop-custom" onClick={onHide}>
      <div className="modal-dialog modal-dialog-centered" style={{ width: '560px', maxWidth: '92vw' }} onClick={e => e.stopPropagation()}>
        <div className="modal-content shadow-lg" style={{ backgroundColor: '#FFFFFF', borderColor: '#CBD5E1', color: '#0F172A' }}>
          <div className="modal-header d-flex justify-content-between align-items-center p-3" 
               style={{ borderBottom: '1px solid #E2E8F0', backgroundColor: '#FFFFFF' }}>
            <h5 className="modal-title d-flex align-items-center gap-2 mb-0 fs-6 fw-bold" style={{ color: '#000000' }}>
              <div className="p-1 px-2 rounded" style={{ backgroundColor: 'rgba(12, 107, 245, 0.08)' }}>
                <i className="bi bi-shield-lock-fill text-primary"></i>
              </div>
              <span>Confirm Recovery Dispatch</span>
            </h5>
            <button type="button" className="btn-close" onClick={onHide}></button>
          </div>

          <div className="modal-body p-4">
            {!recoveredLink ? (
              <>
                <p className="fs-5 mb-3" style={{ color: '#0F172A' }}>
                  Recover <strong className="text-success">₹{txn.amount?.toLocaleString()}</strong> from <strong style={{ color: '#000000' }}>{txn.customer_email || 'customer'}</strong>?
                </p>

                <div className="p-3 mb-3 rounded border" style={{ backgroundColor: '#F8FAFC', borderColor: '#E2E8F0' }}>
                  <div className="d-flex justify-content-between mb-2">
                    <span className="badge bg-light text-primary border" style={{ borderColor: '#CBD5E1' }}>
                      Txn ID: {txn.id}
                    </span>
                    <span className="badge bg-danger">{txn.error_code || txn.status}</span>
                  </div>
                  <p className="small mb-1 fw-bold text-primary">
                    <i className="bi bi-chat-text-fill me-1"></i>Customer Recovery Message:
                  </p>
                  <p className="small fst-italic text-dark mb-0 p-2 rounded" style={{ backgroundColor: '#FFFFFF', border: '1px solid #E2E8F0' }}>
                    "{hinglish}"
                  </p>
                </div>

                <div className="d-flex align-items-center py-2 px-3 small mb-0 rounded border" 
                     style={{ backgroundColor: 'rgba(12, 107, 245, 0.05)', borderColor: '#E2E8F0' }}>
                  <i className="bi bi-info-circle-fill text-primary me-2 fs-5"></i>
                  <div style={{ color: '#475569' }}>
                    Generates a verified payment link and records the action into the audit ledger.
                  </div>
                </div>
              </>
            ) : (
              <div className="text-center py-3">
                <i className="bi bi-check-circle-fill fs-1 mb-2 d-block text-success"></i>
                <h4 className="fw-bold text-success">Payment Link Generated!</h4>
                <p className="small text-muted">The recovery link is ready to be dispatched to the customer.</p>
                <div className="input-group mb-3">
                  <input type="text" className="form-control font-monospace" 
                         style={{ backgroundColor: '#FFFFFF', borderColor: '#CBD5E1', color: '#0F172A' }}
                         readOnly value={recoveredLink} />
                  <button className="btn btn-primary" type="button" onClick={copyLink}>
                    {copied ? '✓ Copied' : 'Copy'}
                  </button>
                </div>
                <a href={recoveredLink} target="_blank" rel="noreferrer" className="btn btn-sm btn-outline-primary">
                  Open Checkout in New Tab ↗
                </a>
              </div>
            )}
          </div>

          <div className="modal-footer d-flex justify-content-between p-3" 
               style={{ borderTop: '1px solid #E2E8F0', backgroundColor: '#F8FAFC' }}>
            <button type="button" className="btn btn-secondary" onClick={onHide}>
              {recoveredLink ? 'Close' : 'Cancel'}
            </button>
            {!recoveredLink && (
              <button 
                type="button" 
                className="btn btn-primary d-flex align-items-center gap-2 shadow-sm"
                onClick={handleExecute}
                disabled={loading}
              >
                {loading ? (
                  <>
                    <span className="spinner-border spinner-border-sm" role="status" aria-hidden="true"></span>
                    <span>Calling Gateway API...</span>
                  </>
                ) : (
                  <>
                    <i className="bi bi-send-check-fill"></i>
                    <span>Generate & Send Link</span>
                  </>
                )}
              </button>
            )}
          </div>
        </div>
      </div>
    </div>
  );
};
