import React, { useState } from 'react';

export const B2BInvoiceChaserCard = ({ chaserData, onChase }) => {
  const [loadingId, setLoadingId] = useState(null);
  const [selectedMessage, setSelectedMessage] = useState(null);

  if (!chaserData) return null;

  const handleDispatch = async (invId, medium) => {
    setLoadingId(invId);
    try {
      await onChase(invId, medium);
    } finally {
      setLoadingId(null);
    }
  };

  const mediumIcon = (medium) => {
    switch (medium) {
      case 'whatsapp': return 'bi-whatsapp text-success';
      case 'sms': return 'bi-chat-dots-fill text-warning';
      case 'email': return 'bi-envelope-fill text-primary';
      default: return 'bi-bell-fill';
    }
  };

  return (
    <div className="card shadow-sm mb-4" style={{ backgroundColor: 'var(--obsidian-surface)', borderColor: 'var(--gold-border)' }}>
      {/* Header */}
      <div className="card-header d-flex justify-content-between align-items-center py-3" style={{ borderBottom: '1px solid var(--gold-border)' }}>
        <div className="d-flex align-items-center gap-2">
          <i className="bi bi-receipt-cutoff text-warning fs-5"></i>
          <div>
            <h3 className="card-title fs-5 fw-bold mb-0 text-white">Feature 3: B2B Receivables Chaser</h3>
            <span className="text-secondary small">Automated Escalation Pipeline via Razorpay POST /invoices/notify_by</span>
          </div>
        </div>
        <div className="d-flex align-items-center gap-2">
          <span className="badge bg-danger bg-opacity-25 text-danger border border-danger px-3 py-2 fw-bold">
            {chaserData.total_overdue_invoices} Overdue Invoices
          </span>
          <span className="badge bg-warning text-dark fw-bold px-3 py-2">
            ₹{chaserData.total_overdue_receivables?.toLocaleString()} Pending
          </span>
        </div>
      </div>

      <div className="card-body p-4">
        {/* Escalation Sequence Stepper */}
        <div className="p-3 mb-4 rounded border" style={{ backgroundColor: 'var(--obsidian-vault)', borderColor: 'var(--gold-border)' }}>
          <div className="small fw-bold text-secondary text-uppercase mb-3">
            <i className="bi bi-diagram-3-fill text-warning me-2"></i>
            Progressive Urgency Escalation Schedule
          </div>
          <div className="row g-2 text-center">
            <div className="col-md-3 col-6">
              <div className="p-2 rounded border border-secondary border-opacity-50" style={{ backgroundColor: 'rgba(56, 189, 248, 0.08)' }}>
                <span className="badge bg-primary mb-1">Stage 1 (Day 1)</span>
                <div className="fw-bold text-white small"><i className="bi bi-envelope-fill me-1"></i>Email</div>
                <div className="text-muted" style={{ fontSize: '11px' }}>Gentle Reminder</div>
              </div>
            </div>
            <div className="col-md-3 col-6">
              <div className="p-2 rounded border border-secondary border-opacity-50" style={{ backgroundColor: 'rgba(245, 158, 11, 0.08)' }}>
                <span className="badge bg-warning text-dark mb-1">Stage 2 (Day 3)</span>
                <div className="fw-bold text-white small"><i className="bi bi-chat-dots-fill me-1"></i>SMS</div>
                <div className="text-muted" style={{ fontSize: '11px' }}>Standard Notice</div>
              </div>
            </div>
            <div className="col-md-3 col-6">
              <div className="p-2 rounded border border-secondary border-opacity-50" style={{ backgroundColor: 'rgba(16, 185, 129, 0.08)' }}>
                <span className="badge bg-success mb-1">Stage 3 (Day 7)</span>
                <div className="fw-bold text-white small"><i className="bi bi-whatsapp me-1"></i>WhatsApp</div>
                <div className="text-muted" style={{ fontSize: '11px' }}>Urgent Demand</div>
              </div>
            </div>
            <div className="col-md-3 col-6">
              <div className="p-2 rounded border border-secondary border-opacity-50" style={{ backgroundColor: 'rgba(239, 68, 68, 0.08)' }}>
                <span className="badge bg-danger mb-1">Stage 4 (Day 14)</span>
                <div className="fw-bold text-white small"><i className="bi bi-shield-exclamation me-1"></i>Final Email</div>
                <div className="text-muted" style={{ fontSize: '11px' }}>Account Suspension</div>
              </div>
            </div>
          </div>
        </div>

        {/* Invoices Table */}
        <div className="table-responsive">
          <table className="table table-hover align-middle mb-0" style={{ color: '#cbd5e1' }}>
            <thead className="small text-uppercase text-secondary" style={{ borderBottom: '1px solid var(--gold-border)' }}>
              <tr>
                <th>Invoice & Entity</th>
                <th>Receivable Amount</th>
                <th>Due Date & Overdue</th>
                <th>Escalation History</th>
                <th>Next Action</th>
                <th className="text-end pe-2">Dispatch Reminder</th>
              </tr>
            </thead>
            <tbody>
              {chaserData.invoices?.map(inv => {
                const isExecuting = loadingId === inv.invoice_id;

                return (
                  <tr key={inv.invoice_id}>
                    <td>
                      <span className="font-monospace text-white fw-bold d-block">{inv.invoice_id}</span>
                      <span className="text-warning small fw-bold">{inv.customer_name}</span>
                      <div className="text-muted" style={{ fontSize: '11px' }}>{inv.customer_email}</div>
                    </td>
                    <td className="text-white font-monospace fw-bold fs-6">
                      ₹{inv.amount?.toLocaleString()}
                    </td>
                    <td>
                      <div className="small text-light">Due: {inv.due_date}</div>
                      <span className={`badge ${inv.days_overdue >= 14 ? 'bg-danger' : inv.days_overdue >= 7 ? 'bg-warning text-dark' : 'bg-secondary'}`}>
                        {inv.days_overdue} Days Overdue
                      </span>
                    </td>
                    <td>
                      <div className="d-flex gap-1 flex-wrap">
                        {['1', '3', '7', '14'].map(d => (
                          <span
                            key={d}
                            className={`badge ${inv.reminders_sent[d] ? 'bg-success text-white' : 'bg-dark text-muted border border-secondary'}`}
                            style={{ fontSize: '10px' }}
                            title={inv.reminders_sent[d] ? `Day ${d} reminder sent` : `Day ${d} reminder not yet triggered`}
                          >
                            D{d} {inv.reminders_sent[d] ? '✓' : '—'}
                          </span>
                        ))}
                      </div>
                    </td>
                    <td style={{ maxWidth: '240px' }}>
                      <div className="d-flex align-items-center gap-1 mb-1">
                        <i className={`bi ${mediumIcon(inv.next_medium)} fs-6`}></i>
                        <span className="badge bg-warning text-dark fw-bold text-uppercase">{inv.next_medium}</span>
                        <span className="badge bg-danger small">{inv.next_urgency}</span>
                      </div>
                      <button
                        className="btn btn-sm btn-link p-0 text-info small text-decoration-none"
                        onClick={() => setSelectedMessage(inv.next_message_preview)}
                      >
                        <i className="bi bi-eye me-1"></i>View Message Preview
                      </button>
                    </td>
                    <td className="text-end pe-2">
                      <button
                        className="btn btn-sm btn-primary fw-bold py-1 px-3 d-inline-flex align-items-center gap-1 shadow-sm"
                        disabled={isExecuting}
                        onClick={() => handleDispatch(inv.invoice_id, inv.next_medium)}
                      >
                        {isExecuting ? (
                          <>
                            <span className="spinner-border spinner-border-sm" role="status"></span>
                            <span>Notifying...</span>
                          </>
                        ) : (
                          <>
                            <i className={`bi ${mediumIcon(inv.next_medium)} me-1`}></i>
                            <span>Chase via {inv.next_medium.toUpperCase()}</span>
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

      {/* Message Preview Modal */}
      {selectedMessage && (
        <div className="modal-backdrop-custom" onClick={() => setSelectedMessage(null)}>
          <div className="modal-dialog modal-dialog-centered" onClick={e => e.stopPropagation()} style={{ maxWidth: '480px' }}>
            <div className="modal-content shadow-lg border-warning" style={{ backgroundColor: 'var(--obsidian-surface)', color: '#f1f5f9' }}>
              <div className="modal-header border-secondary p-3">
                <h5 className="modal-title fs-6 fw-bold text-warning">
                  <i className="bi bi-chat-left-text-fill me-2"></i>
                  Dispatched Razorpay Notification Template
                </h5>
                <button type="button" className="btn-close btn-close-white" onClick={() => setSelectedMessage(null)}></button>
              </div>
              <div className="modal-body p-3">
                <div className="p-3 rounded bg-dark border border-secondary font-monospace small text-light">
                  {selectedMessage}
                </div>
              </div>
              <div className="modal-footer border-secondary p-2">
                <button className="btn btn-sm btn-secondary" onClick={() => setSelectedMessage(null)}>Close</button>
              </div>
            </div>
          </div>
        </div>
      )}
    </div>
  );
};
