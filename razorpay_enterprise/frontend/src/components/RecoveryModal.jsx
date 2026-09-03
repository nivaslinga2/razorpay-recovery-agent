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
        <div className="modal-content shadow-lg border-primary" style={{ backgroundColor: '#0c2340', color: '#f1f5f9' }}>
          <div className="modal-header border-secondary d-flex justify-content-between align-items-center p-3">
            <h5 className="modal-title d-flex align-items-center gap-2">
              <i className="bi bi-shield-lock-fill text-primary"></i>
              <span>Confirm Human-in-the-Loop Recovery</span>
            </h5>
            <button type="button" className="btn-close btn-close-white" onClick={onHide}></button>
          </div>

          <div className="modal-body p-4">
            {!recoveredLink ? (
              <>
                <p className="fs-5 mb-3">
                  Recover <strong>₹{txn.amount?.toLocaleString()}</strong> from <strong>{txn.customer_email || 'customer'}</strong>?
                </p>

                <div className="p-3 mb-3 rounded border border-secondary" style={{ backgroundColor: '#112a4f' }}>
                  <div className="d-flex justify-content-between mb-2">
                    <span className="badge bg-secondary">Txn ID: {txn.id}</span>
                    <span className="badge bg-danger">{txn.error_code || txn.status}</span>
                  </div>
                  <p className="small mb-1 text-info fw-bold">
                    <i className="bi bi-robot me-1"></i>AI Hinglish Recovery Draft:
                  </p>
                  <p className="small fst-italic text-light mb-0 bg-dark p-2 rounded">
                    "{hinglish}"
                  </p>
                </div>

                <div className="alert alert-info d-flex align-items-center py-2 px-3 small mb-0" role="alert">
                  <i className="bi bi-info-circle-fill me-2 fs-5"></i>
                  <div>
                    This bounded action calls Razorpay API to generate a verifiable payment link and updates the audit log.
                  </div>
                </div>
              </>
            ) : (
              <div className="text-center py-3">
                <i className="bi bi-check-circle-fill text-success fs-1 mb-2 d-block"></i>
                <h4 className="text-success fw-bold">Payment Link Generated!</h4>
                <p className="text-muted small">The recovery link is ready to be sent to the customer.</p>
                <div className="input-group mb-3">
                  <input type="text" className="form-control bg-dark text-white border-secondary" readOnly value={recoveredLink} />
                  <button className="btn btn-outline-info" type="button" onClick={copyLink}>
                    {copied ? '✓ Copied' : 'Copy'}
                  </button>
                </div>
                <a href={recoveredLink} target="_blank" rel="noreferrer" className="btn btn-sm btn-outline-light">
                  Open Checkout in New Tab ↗
                </a>
              </div>
            )}
          </div>

          <div className="modal-footer border-secondary d-flex justify-content-between p-3">
            <button type="button" className="btn btn-secondary" onClick={onHide}>
              {recoveredLink ? 'Close' : 'Cancel'}
            </button>
            {!recoveredLink && (
              <button 
                type="button" 
                className="btn btn-primary d-flex align-items-center gap-2"
                onClick={handleExecute}
                disabled={loading}
              >
                {loading ? (
                  <>
                    <span className="spinner-border spinner-border-sm" role="status" aria-hidden="true"></span>
                    <span>Calling Razorpay API...</span>
                  </>
                ) : (
                  <>
                    <i className="bi bi-rocket-takeoff-fill"></i>
                    <span>Confirm & Recover</span>
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
