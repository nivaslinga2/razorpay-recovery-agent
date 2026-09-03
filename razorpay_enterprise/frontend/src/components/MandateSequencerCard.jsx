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
    <div className="card shadow-sm mb-4" style={{ backgroundColor: 'var(--obsidian-surface)', borderColor: 'var(--gold-border)' }}>
      {/* Header */}
      <div className="card-header d-flex justify-content-between align-items-center py-3" style={{ borderBottom: '1px solid var(--gold-border)' }}>
        <div className="d-flex align-items-center gap-2">
          <i className="bi bi-calendar2-week-fill text-warning fs-5"></i>
          <div>
            <h3 className="card-title fs-5 fw-bold mb-0 text-white">Feature 2: Mandate Retry Sequencer</h3>
            <span className="text-secondary small">Smart Timing for UPI Autopay & e-NACH Mandate Debits</span>
          </div>
        </div>
        <div className="d-flex align-items-center gap-2">
          <span className={`badge ${mandateData.is_bank_hours ? 'bg-success text-white' : 'bg-secondary text-light'} px-3 py-2 fw-bold`}>
            <i className={`bi bi-${mandateData.is_bank_hours ? 'check-circle-fill' : 'moon-stars-fill'} me-1`}></i>
            {mandateData.is_bank_hours ? 'Banking Window Open' : 'Banking Hours Closed (IST)'}
          </span>
        </div>
      </div>

      <div className="card-body p-4">
        {/* Rules Overview Bar */}
        <div className="p-3 mb-4 rounded border d-flex flex-wrap justify-content-between align-items-center gap-3"
             style={{ backgroundColor: 'var(--obsidian-vault)', borderColor: 'var(--gold-border)' }}>
          <div className="d-flex align-items-center gap-3">
            <span className="badge bg-warning text-dark fw-bold px-2 py-1">Rule 1</span>
            <span className="small text-light"><strong>Bank Hours:</strong> 09:00 - 17:00 IST (Current: {mandateData.ist_time})</span>
          </div>
          <div className="d-flex align-items-center gap-3">
            <span className="badge bg-warning text-dark fw-bold px-2 py-1">Rule 2</span>
            <span className="small text-light"><strong>Cooldown:</strong> 4 Hours between attempts</span>
          </div>
          <div className="d-flex align-items-center gap-3">
            <span className="badge bg-warning text-dark fw-bold px-2 py-1">Rule 3</span>
            <span className="small text-light"><strong>Limit:</strong> Max 3 Retries per cycle</span>
          </div>
        </div>

        {/* Mandate List Table */}
        <div className="table-responsive">
          <table className="table table-hover align-middle mb-0" style={{ color: '#cbd5e1' }}>
            <thead className="small text-uppercase text-secondary" style={{ borderBottom: '1px solid var(--gold-border)' }}>
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
                      <span className="font-monospace text-white fw-bold d-block">{m.mandate_id}</span>
                      <span className="text-muted small">{m.customer_id}</span>
                    </td>
                    <td>
                      <span className="badge bg-dark text-secondary font-monospace">{m.token_id}</span>
                    </td>
                    <td className="text-white font-monospace fw-bold fs-6">
                      ₹{m.amount?.toLocaleString()}
                    </td>
                    <td>
                      <span className={`badge ${m.retry_count >= m.max_retries ? 'bg-danger' : 'bg-secondary'}`}>
                        {m.retry_count} / {m.max_retries} Attempts
                      </span>
                    </td>
                    <td>
                      <span className={`badge ${isReady ? 'bg-success' : isOutsideHours ? 'bg-warning text-dark' : isCooldown ? 'bg-info text-dark' : 'bg-danger'}`}>
                        <i className={`bi bi-${isReady ? 'check-circle' : isOutsideHours ? 'clock' : 'hourglass-split'} me-1`}></i>
                        {m.sequencer_verdict}
                      </span>
                    </td>
                    <td>
                      <span className="font-monospace text-light small">{m.next_optimal_window_ist}</span>
                    </td>
                    <td className="text-end pe-2">
                      <button
                        className={`btn btn-sm ${isReady ? 'btn-success' : 'btn-primary'} fw-bold py-1 px-3 d-inline-flex align-items-center gap-1`}
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
