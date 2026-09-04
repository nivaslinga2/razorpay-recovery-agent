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
    <div className="card shadow-sm mb-4" style={{ backgroundColor: '#FFFFFF', borderColor: '#E2E8F0' }}>
      {/* Header */}
      <div className="card-header d-flex justify-content-between align-items-center py-3" 
           style={{ borderBottom: '1px solid #E2E8F0', backgroundColor: '#FFFFFF' }}>
        <div className="d-flex align-items-center gap-2">
          <div className="p-1 px-2 rounded" style={{ backgroundColor: 'rgba(12, 107, 245, 0.08)' }}>
            <i className="bi bi-calendar-check-fill text-primary fs-5"></i>
          </div>
          <div>
            <h3 className="card-title fs-5 fw-bold mb-0" style={{ color: '#000000' }}>Promise-to-Pay Commitment Tracker</h3>
            <span className="small text-muted">Customer payment commitments and scheduled reminders</span>
          </div>
        </div>
        <div className="d-flex align-items-center gap-2">
          <button
            className="btn btn-sm btn-primary fw-bold d-flex align-items-center gap-1 shadow-sm"
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
            <div className="p-3 rounded border" style={{ backgroundColor: '#F8FAFC', borderColor: '#E2E8F0' }}>
              <div className="small text-uppercase fw-bold" style={{ color: '#64748B' }}>Active Commitments</div>
              <div className="fs-4 fw-bold font-monospace" style={{ color: '#000000' }}>{promiseData.total_promises}</div>
            </div>
          </div>
          <div className="col-md-3 col-6">
            <div className="p-3 rounded border" style={{ backgroundColor: '#FFFBEB', borderColor: '#FDE68A' }}>
              <div className="text-warning small text-uppercase fw-bold">Pending Payment</div>
              <div className="fs-4 fw-bold text-warning font-monospace">{promiseData.pending_count}</div>
            </div>
          </div>
          <div className="col-md-3 col-6">
            <div className="p-3 rounded border" style={{ backgroundColor: '#ECFDF5', borderColor: '#A7F3D0' }}>
              <div className="text-success small text-uppercase fw-bold">Fulfilled via Webhook</div>
              <div className="fs-4 fw-bold font-monospace text-success">{promiseData.fulfilled_count}</div>
            </div>
          </div>
          <div className="col-md-3 col-6">
            <div className="p-3 rounded border" style={{ backgroundColor: '#FEF2F2', borderColor: '#FECACA' }}>
              <div className="text-danger small text-uppercase fw-bold">Broken / Escalated</div>
              <div className="fs-4 fw-bold text-danger font-monospace">{promiseData.broken_count}</div>
            </div>
          </div>
        </div>

        {/* New Promise Form */}
        {showForm && (
          <form onSubmit={handleSubmit} className="p-4 rounded border mb-4"
                style={{ backgroundColor: '#F8FAFC', borderColor: '#E2E8F0' }}>
            <h6 className="fw-bold mb-3 d-flex align-items-center gap-2" style={{ color: '#000000' }}>
              <i className="bi bi-person-plus-fill text-primary"></i>
              <span>Capture Customer Promise-to-Pay</span>
            </h6>
            <div className="row g-3">
              <div className="col-md-3">
                <label className="form-label small" style={{ color: '#64748B' }}>Customer Name</label>
                <input type="text" className="form-control form-control-sm text-dark"
                       style={{ backgroundColor: '#FFFFFF', borderColor: '#CBD5E1' }}
                       value={custName} onChange={e => setCustName(e.target.value)} required />
              </div>
              <div className="col-md-3">
                <label className="form-label small" style={{ color: '#64748B' }}>Customer ID</label>
                <input type="text" className="form-control form-control-sm text-dark"
                       style={{ backgroundColor: '#FFFFFF', borderColor: '#CBD5E1' }}
                       value={custId} onChange={e => setCustId(e.target.value)} required />
              </div>
              <div className="col-md-2">
                <label className="form-label small" style={{ color: '#64748B' }}>Amount (₹)</label>
                <input type="number" className="form-control form-control-sm text-dark font-monospace"
                       style={{ backgroundColor: '#FFFFFF', borderColor: '#CBD5E1' }}
                       value={amount} onChange={e => setAmount(e.target.value)} required />
              </div>
              <div className="col-md-2">
                <label className="form-label small" style={{ color: '#64748B' }}>Promised Date</label>
                <input type="date" className="form-control form-control-sm text-dark"
                       style={{ backgroundColor: '#FFFFFF', borderColor: '#CBD5E1' }}
                       value={date} onChange={e => setDate(e.target.value)} required />
              </div>
              <div className="col-md-2">
                <label className="form-label small" style={{ color: '#64748B' }}>Phone</label>
                <input type="text" className="form-control form-control-sm text-dark"
                       style={{ backgroundColor: '#FFFFFF', borderColor: '#CBD5E1' }}
                       value={phone} onChange={e => setPhone(e.target.value)} />
              </div>
              <div className="col-12">
                <label className="form-label small" style={{ color: '#64748B' }}>Call / Interaction Notes</label>
                <input type="text" className="form-control form-control-sm text-dark"
                       style={{ backgroundColor: '#FFFFFF', borderColor: '#CBD5E1' }}
                       value={notes} onChange={e => setNotes(e.target.value)} />
              </div>
              <div className="col-12 text-end">
                <button type="submit" className="btn btn-sm btn-primary fw-bold px-4" disabled={submitting}>
                  {submitting ? 'Logging...' : 'Save Promise'}
                </button>
              </div>
            </div>
          </form>
        )}

        {/* Promises Table */}
        <div className="table-responsive">
          <table className="table table-hover align-middle mb-0" style={{ color: '#0F172A', backgroundColor: '#FFFFFF' }}>
            <thead className="small text-uppercase" style={{ color: '#64748B', borderBottom: '1px solid #E2E8F0', backgroundColor: '#F8FAFC' }}>
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
                      <span className="font-monospace fw-bold d-block" style={{ color: '#000000' }}>{p.promise_id}</span>
                      <span className="small fw-bold text-primary">{p.customer_name}</span>
                      <div className="text-muted" style={{ fontSize: '11px' }}>{p.customer_phone}</div>
                    </td>
                    <td className="font-monospace fw-bold fs-6" style={{ color: '#000000' }}>
                      ₹{p.amount?.toLocaleString()}
                    </td>
                    <td>
                      <div className="small text-dark">{p.promised_date}</div>
                      {isPending && (
                        <span className={`badge ${p.days_until_promised > 0 ? 'bg-primary' : p.days_until_promised === 0 ? 'bg-warning text-dark' : 'bg-danger'}`}>
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
                      <span className="badge bg-light text-muted border font-monospace" style={{ borderColor: '#E2E8F0' }}>
                        {p.reminders_sent} Sent
                      </span>
                    </td>
                    <td style={{ maxWidth: '200px' }}>
                      <span className="small text-truncate d-block text-muted" title={p.notes}>
                        {p.notes || '—'}
                      </span>
                    </td>
                    <td className="text-end pe-2">
                      <div className="d-flex justify-content-end gap-1">
                        {isPending && (
                          <>
                            <button
                              className="btn btn-sm btn-outline-primary py-1 px-2 small d-inline-flex align-items-center gap-1"
                              disabled={isExecuting}
                              onClick={() => handleRemindAction(p.promise_id)}
                              title="Send courteous Hinglish reminder"
                            >
                              <i className="bi bi-chat-dots-fill"></i>
                              <span>Remind</span>
                            </button>
                            <button
                              className="btn btn-sm btn-success py-1 px-2 small d-inline-flex align-items-center gap-1 fw-bold"
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
                          <span className="badge bg-success bg-opacity-10 text-success border border-success px-2 py-1">
                            ✓ Payment Captured
                          </span>
                        )}
                        {isBroken && (
                          <span className="badge bg-danger bg-opacity-10 text-danger border border-danger px-2 py-1">
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
