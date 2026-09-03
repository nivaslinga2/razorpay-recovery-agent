import React, { useState } from 'react';

export const PromiseTrackerCard = ({ promiseData, onCreate, onRemind, onFulfill }) => {
  const [showForm, setShowForm] = useState(false);
  const [custId, setCustId] = useState('cust_salary_99');
  const [custName, setCustName] = useState('Kabir Mehta');
  const [email, setEmail] = useState('kabir.mehta@fintech.io');
  const [phone, setPhone] = useState('+91 98765 11223');
  const [amount, setAmount] = useState('8500');
  const [date, setDate] = useState(() => {
    const tomorrow = new Date();
    tomorrow.setDate(tomorrow.getDate() + 1);
    return tomorrow.toISOString().split('T')[0];
  });
  const [notes, setNotes] = useState('Salary credit expected tomorrow; promised immediate UPI transfer');
  const [loadingId, setLoadingId] = useState(null);
  const [submitting, setSubmitting] = useState(false);

  if (!promiseData) return null;

  const handleSubmit = async (e) => {
    e.preventDefault();
    setSubmitting(true);
    try {
      await onCreate({
        customer_id: custId,
        customer_name: custName,
        customer_email: email,
        customer_phone: phone,
        amount: Math.round(parseFloat(amount) * 100),
        promised_date: date,
        notes: notes
      });
      setShowForm(false);
    } finally {
      setSubmitting(false);
    }
  };

  const handleRemindAction = async (promiseId) => {
    setLoadingId(promiseId);
    try {
      await onRemind(promiseId);
    } finally {
      setLoadingId(null);
    }
  };

  const handleFulfillAction = async (promiseId) => {
    setLoadingId(promiseId);
    try {
      await onFulfill(promiseId);
    } finally {
      setLoadingId(null);
    }
  };

  return (
    <div className="card shadow-sm mb-4" style={{ backgroundColor: 'var(--obsidian-surface)', borderColor: 'var(--gold-border)' }}>
      {/* Header */}
      <div className="card-header d-flex justify-content-between align-items-center py-3" style={{ borderBottom: '1px solid var(--gold-border)' }}>
        <div className="d-flex align-items-center gap-2">
          <i className="bi bi-calendar-check-fill text-warning fs-5"></i>
          <div>
            <h3 className="card-title fs-5 fw-bold mb-0 text-white">Feature 5: Promise-to-Pay Tracker</h3>
            <span className="text-secondary small">Customer Commitment Tracking, Automated Reminders & Escalation</span>
          </div>
        </div>
        <div className="d-flex align-items-center gap-2">
          <button
            className="btn btn-sm btn-outline-warning fw-bold d-flex align-items-center gap-1"
            onClick={() => setShowForm(!showForm)}
          >
            <i className={`bi bi-${showForm ? 'dash-circle' : 'plus-circle-fill'}`}></i>
            <span>{showForm ? 'Close Form' : 'Log New Promise'}</span>
          </button>
        </div>
      </div>

      <div className="card-body p-4">
        {/* Metric Badges */}
        <div className="row g-3 mb-4">
          <div className="col-md-3 col-6">
            <div className="p-3 rounded border" style={{ backgroundColor: 'var(--obsidian-vault)', borderColor: 'var(--gold-border)' }}>
              <div className="text-secondary small text-uppercase fw-bold">Active Commitments</div>
              <div className="fs-4 fw-bold text-white font-monospace">{promiseData.total_promises}</div>
            </div>
          </div>
          <div className="col-md-3 col-6">
            <div className="p-3 rounded border" style={{ backgroundColor: 'var(--obsidian-vault)', borderColor: 'rgba(245, 158, 11, 0.4)' }}>
              <div className="text-warning small text-uppercase fw-bold">Pending Payment</div>
              <div className="fs-4 fw-bold text-warning font-monospace">{promiseData.pending_count}</div>
            </div>
          </div>
          <div className="col-md-3 col-6">
            <div className="p-3 rounded border" style={{ backgroundColor: 'var(--obsidian-vault)', borderColor: 'rgba(16, 185, 129, 0.4)' }}>
              <div className="text-success small text-uppercase fw-bold">Fulfilled via Webhook</div>
              <div className="fs-4 fw-bold text-success font-monospace">{promiseData.fulfilled_count}</div>
            </div>
          </div>
          <div className="col-md-3 col-6">
            <div className="p-3 rounded border" style={{ backgroundColor: 'var(--obsidian-vault)', borderColor: 'rgba(239, 68, 68, 0.4)' }}>
              <div className="text-danger small text-uppercase fw-bold">Broken / Escalated</div>
              <div className="fs-4 fw-bold text-danger font-monospace">{promiseData.broken_count}</div>
            </div>
          </div>
        </div>

        {/* New Promise Form */}
        {showForm && (
          <form onSubmit={handleSubmit} className="p-4 rounded border mb-4"
                style={{ backgroundColor: 'var(--obsidian-vault)', borderColor: 'var(--gold-border)' }}>
            <h6 className="text-warning fw-bold mb-3"><i className="bi bi-person-plus-fill me-2"></i>Capture Customer Promise-to-Pay</h6>
            <div className="row g-3">
              <div className="col-md-3">
                <label className="form-label text-secondary small">Customer Name</label>
                <input type="text" className="form-control form-control-sm text-light bg-dark border-secondary"
                       value={custName} onChange={e => setCustName(e.target.value)} required />
              </div>
              <div className="col-md-3">
                <label className="form-label text-secondary small">Customer ID</label>
                <input type="text" className="form-control form-control-sm text-light bg-dark border-secondary"
                       value={custId} onChange={e => setCustId(e.target.value)} required />
              </div>
              <div className="col-md-2">
                <label className="form-label text-secondary small">Amount (₹)</label>
                <input type="number" className="form-control form-control-sm text-light bg-dark border-secondary font-monospace"
                       value={amount} onChange={e => setAmount(e.target.value)} required />
              </div>
              <div className="col-md-2">
                <label className="form-label text-secondary small">Promised Date</label>
                <input type="date" className="form-control form-control-sm text-light bg-dark border-secondary"
                       value={date} onChange={e => setDate(e.target.value)} required />
              </div>
              <div className="col-md-2">
                <label className="form-label text-secondary small">Phone</label>
                <input type="text" className="form-control form-control-sm text-light bg-dark border-secondary"
                       value={phone} onChange={e => setPhone(e.target.value)} />
              </div>
              <div className="col-12">
                <label className="form-label text-secondary small">Call / Interaction Notes</label>
                <input type="text" className="form-control form-control-sm text-light bg-dark border-secondary"
                       value={notes} onChange={e => setNotes(e.target.value)} />
              </div>
              <div className="col-12 text-end">
                <button type="submit" className="btn btn-sm btn-warning fw-bold px-4" disabled={submitting}>
                  {submitting ? 'Logging...' : 'Save Promise'}
                </button>
              </div>
            </div>
          </form>
        )}

        {/* Promises Table */}
        <div className="table-responsive">
          <table className="table table-hover align-middle mb-0" style={{ color: '#cbd5e1' }}>
            <thead className="small text-uppercase text-secondary" style={{ borderBottom: '1px solid var(--gold-border)' }}>
              <tr>
                <th>Promise ID & Customer</th>
                <th>Promised Amount</th>
                <th>Promised Date & Due</th>
                <th>Status</th>
                <th>Reminders</th>
                <th>Notes</th>
                <th className="text-end pe-2">Actions</th>
              </tr>
            </thead>
            <tbody>
              {promiseData.promises?.map(p => {
                const isExecuting = loadingId === p.promise_id;
                const isPending = p.status === 'PENDING';
                const isFulfilled = p.status === 'FULFILLED';
                const isBroken = p.status === 'BROKEN' || p.status === 'ESCALATED';

                return (
                  <tr key={p.promise_id}>
                    <td>
                      <span className="font-monospace text-white fw-bold d-block">{p.promise_id}</span>
                      <span className="text-warning small fw-bold">{p.customer_name}</span>
                      <div className="text-muted" style={{ fontSize: '11px' }}>{p.customer_phone}</div>
                    </td>
                    <td className="text-white font-monospace fw-bold fs-6">
                      ₹{p.amount?.toLocaleString()}
                    </td>
                    <td>
                      <div className="text-light small">{p.promised_date}</div>
                      {isPending && (
                        <span className={`badge ${p.days_until_promised > 0 ? 'bg-info text-dark' : p.days_until_promised === 0 ? 'bg-warning text-dark' : 'bg-danger'}`}>
                          {p.days_until_promised > 0 ? `In ${p.days_until_promised} days` : p.days_until_promised === 0 ? 'Due Today' : `${Math.abs(p.days_until_promised)}d Overdue`}
                        </span>
                      )}
                    </td>
                    <td>
                      <span className={`badge ${isFulfilled ? 'bg-success' : isBroken ? 'bg-danger' : 'bg-warning text-dark'} fw-bold`}>
                        {p.status}
                      </span>
                    </td>
                    <td>
                      <span className="badge bg-dark border border-secondary text-secondary">
                        {p.reminders_sent} Sent
                      </span>
                    </td>
                    <td style={{ maxWidth: '200px' }}>
                      <span className="text-muted small text-truncate d-block" title={p.notes}>
                        {p.notes || '—'}
                      </span>
                    </td>
                    <td className="text-end pe-2">
                      <div className="d-flex justify-content-end gap-1">
                        {isPending && (
                          <>
                            <button
                              className="btn btn-sm btn-outline-warning py-1 px-2 small d-inline-flex align-items-center gap-1"
                              disabled={isExecuting}
                              onClick={() => handleRemindAction(p.promise_id)}
                              title="Send courteous Hinglish reminder"
                            >
                              <i className="bi bi-chat-dots-fill"></i>
                              <span>Remind</span>
                            </button>
                            <button
                              className="btn btn-sm btn-success py-1 px-2 small d-inline-flex align-items-center gap-1"
                              disabled={isExecuting}
                              onClick={() => handleFulfillAction(p.promise_id)}
                              title="Mark as paid / fulfilled"
                            >
                              <i className="bi bi-check-circle-fill"></i>
                              <span>Fulfill</span>
                            </button>
                          </>
                        )}
                        {isFulfilled && (
                          <span className="badge bg-success bg-opacity-25 text-success border border-success px-2 py-1">
                            ✓ Payment Captured
                          </span>
                        )}
                        {isBroken && (
                          <span className="badge bg-danger bg-opacity-25 text-danger border border-danger px-2 py-1">
                            ⚠️ Escalated
                          </span>
                        )}
                      </div>
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
