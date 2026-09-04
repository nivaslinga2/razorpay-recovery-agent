import React, { useState } from 'react';

export const MandateSequencerCard = ({ mandateData, onRetry }) => {
  const [loadingId, setLoadingId] = useState(null);

  if (!mandateData) return null;

  const handleExecute = async (mandateId, force = false) => {
    setLoadingId(mandateId);
    try {
      await onRetry(mandateId, force);
    } finally {
      setLoadingId(null);
    }
  };

  return (
    <div className="card shadow-sm mb-4" style={{ backgroundColor: '#FFFFFF', borderColor: '#E2E8F0' }}>
      {/* Header */}
      <div className="card-header d-flex justify-content-between align-items-center py-3" 
           style={{ borderBottom: '1px solid #E2E8F0', backgroundColor: '#FFFFFF' }}>
        <div className="d-flex align-items-center gap-2">
          <div className="p-1 px-2 rounded" style={{ backgroundColor: 'rgba(12, 107, 245, 0.08)' }}>
            <i className="bi bi-calendar2-week-fill text-primary fs-5"></i>
          </div>
          <div>
            <h3 className="card-title fs-5 fw-bold mb-0" style={{ color: '#000000' }}>Mandate Retry Sequencer</h3>
            <span className="small text-muted">UPI Autopay & e-NACH mandate timing</span>
          </div>
        </div>
        <div className="d-flex align-items-center gap-2">
          <span className="badge px-3 py-2 fw-bold"
                style={mandateData.is_bank_hours ? { backgroundColor: '#ECFDF5', color: '#059669', border: '1px solid #A7F3D0' } : { backgroundColor: '#F1F5F9', color: '#64748B' }}>
            <i className={`bi bi-${mandateData.is_bank_hours ? 'check-circle-fill' : 'moon-stars-fill'} me-1`}></i>
            {mandateData.is_bank_hours ? 'Banking Window Open' : 'Banking Hours Closed (IST)'}
          </span>
        </div>
      </div>

      <div className="card-body p-4">
        {/* Rules Overview Bar */}
        <div className="p-3 mb-4 rounded border d-flex flex-wrap justify-content-between align-items-center gap-3"
             style={{ backgroundColor: '#F8FAFC', borderColor: '#E2E8F0' }}>
          <div className="d-flex align-items-center gap-3">
            <span className="badge bg-primary text-white fw-bold px-2 py-1">Rule 1</span>
            <span className="small text-dark"><strong>Bank Hours:</strong> 09:00 - 17:00 IST (Current: {mandateData.ist_time})</span>
          </div>
          <div className="d-flex align-items-center gap-3">
            <span className="badge bg-primary text-white fw-bold px-2 py-1">Rule 2</span>
            <span className="small text-dark"><strong>Cooldown:</strong> 4 Hours between re-attempts</span>
          </div>
          <div className="d-flex align-items-center gap-3">
            <span className="badge bg-primary text-white fw-bold px-2 py-1">Rule 3</span>
            <span className="small text-dark"><strong>Circuit Cap:</strong> Max 3 Retries per billing cycle</span>
          </div>
        </div>

        {/* Mandate List Table */}
        <div className="table-responsive">
          <table className="table table-hover align-middle mb-0" style={{ color: '#0F172A', backgroundColor: '#FFFFFF' }}>
            <thead className="small text-uppercase" style={{ color: '#64748B', borderBottom: '1px solid #E2E8F0', backgroundColor: '#F8FAFC' }}>
              <tr>
                <th>Mandate ID</th>
                <th>Token ID</th>
                <th>Amount</th>
                <th>Attempt Count</th>
                <th>Sequencer Verdict</th>
                <th>Next Scheduled Window (IST)</th>
                <th className="text-end pe-2">Action</th>
              </tr>
            </thead>
            <tbody>
              {mandateData.mandates?.map(m => {
                const isExecuting = loadingId === m.mandate_id;
                const isReady = m.can_retry_now;
                const isOutsideHours = m.sequencer_verdict === 'OUTSIDE_BANK_HOURS';
                const isCooldown = m.sequencer_verdict?.startsWith('COOLDOWN');

                return (
                  <tr key={m.mandate_id}>
                    <td>
                      <span className="font-monospace fw-bold d-block" style={{ color: '#000000' }}>{m.mandate_id}</span>
                      <span className="small text-muted">{m.customer_id}</span>
                    </td>
                    <td>
                      <span className="badge font-monospace" style={{ backgroundColor: '#F1F5F9', color: '#0C6BF5', border: '1px solid #E2E8F0' }}>
                        {m.token_id}
                      </span>
                    </td>
                    <td className="font-monospace fw-bold fs-6" style={{ color: '#000000' }}>
                      ₹{m.amount?.toLocaleString()}
                    </td>
                    <td>
                      <span className={`badge ${m.retry_count >= m.max_retries ? 'bg-danger' : 'bg-secondary'}`}>
                        {m.retry_count} / {m.max_retries} Attempts
                      </span>
                    </td>
                    <td>
                      <span className={`badge ${isReady ? 'bg-success' : isOutsideHours ? 'bg-warning text-dark' : isCooldown ? 'bg-info text-white' : 'bg-danger'}`}>
                        <i className={`bi bi-${isReady ? 'check-circle-fill' : isOutsideHours ? 'clock' : 'hourglass-split'} me-1`}></i>
                        {m.sequencer_verdict}
                      </span>
                    </td>
                    <td>
                      <span className="font-monospace small text-dark">{m.next_optimal_window_ist}</span>
                    </td>
                    <td className="text-end pe-2">
                      <button
                        className="btn btn-sm fw-bold py-1 px-3 d-inline-flex align-items-center gap-1 shadow-sm"
                        style={isReady ? { background: 'linear-gradient(135deg, #059669 0%, #047857 100%)', color: '#FFFFFF', border: 'none' } : { background: 'var(--rzp-gradient)', color: '#FFFFFF', border: 'none' }}
                        disabled={isExecuting}
                        onClick={() => handleExecute(m.mandate_id, !isReady)}
                        title={isReady ? 'Execute Debit Now' : 'Override Sequencer & Force Immediate Debit'}
                      >
                        {isExecuting ? (
                          <>
                            <span className="spinner-border spinner-border-sm" role="status"></span>
                            <span>Debiting...</span>
                          </>
                        ) : isReady ? (
                          <>
                            <i className="bi bi-lightning-charge-fill"></i>
                            <span>Execute Debit</span>
                          </>
                        ) : (
                          <>
                            <i className="bi bi-play-fill"></i>
                            <span>Override & Charge</span>
                          </>
                        )}
                      </button>
                    </td>
                  </tr>
                );
              })}
            </tbody>
          </table>
        </div>
      </div>
    </div>
  );
};
