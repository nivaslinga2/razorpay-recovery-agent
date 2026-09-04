import React from 'react';

export const TransactionTable = ({
  transactions,
  onRecoverClick,
  onBatchRecover,
  selectedIds,
  onToggleSelect,
  onSelectAll,
  searchQuery,
  onSearchChange,
  statusFilter,
  onStatusFilterChange,
  batchLoading
}) => {
  const unrecovered = transactions.filter(t => !t.is_recovered);
  const isAllSelected = unrecovered.length > 0 && selectedIds.size === unrecovered.length;

  return (
    <div
      className="card shadow-sm mb-4"
      style={{
        backgroundColor: '#FFFFFF',
        borderColor: '#E2E8F0',
        overflow: 'hidden'
      }}
    >
      <div
        className="card-header d-flex justify-content-between align-items-center py-3"
        style={{ borderBottom: '1px solid #E2E8F0', backgroundColor: '#FFFFFF' }}
      >
        <div className="d-flex align-items-center gap-2">
          <div className="p-1 px-2 rounded" style={{ backgroundColor: 'rgba(12, 107, 245, 0.08)' }}>
            <i className="bi bi-shield-check text-primary fs-5"></i>
          </div>
          <h3 className="card-title fs-5 fw-bold mb-0" style={{ color: '#000000' }}>
            At-Risk Transactions Queue
          </h3>
          <span
            className="badge ms-2"
            style={{ backgroundColor: '#F1F5F9', color: '#0C6BF5', border: '1px solid #E2E8F0' }}
          >
            {transactions.length} items
          </span>
        </div>
      </div>

      <div className="card-body p-0 d-flex flex-column">
          {/* Search and Filters bar */}
          <div className="p-3 d-flex flex-wrap justify-content-between align-items-center gap-3" 
               style={{ backgroundColor: '#F8FAFC', borderBottom: '1px solid #E2E8F0' }}>
            <div className="input-group" style={{ maxWidth: '380px' }}>
              <span className="input-group-text" 
                    style={{ backgroundColor: '#FFFFFF', borderColor: '#CBD5E1', color: '#64748B' }}>
                <i className="bi bi-search text-primary"></i>
              </span>
              <input
                type="text"
                className="form-control"
                style={{ backgroundColor: '#FFFFFF', borderColor: '#CBD5E1', color: '#0F172A' }}
                placeholder="Search Txn ID, Email, Error Code..."
                value={searchQuery}
                onChange={e => onSearchChange(e.target.value)}
              />
              {searchQuery && (
                <button className="btn btn-outline-secondary" 
                        style={{ borderColor: '#CBD5E1', color: '#475569' }} 
                        onClick={() => onSearchChange('')}>✕</button>
              )}
            </div>

            <div className="d-flex gap-2 align-items-center flex-wrap">
              {['pending', 'failed', 'abandoned', 'recovered', 'all'].map(status => {
                const isActive = statusFilter === status;
                return (
                  <button
                    key={status}
                    className={`btn btn-sm fw-semibold ${isActive ? 'btn-primary' : 'btn-outline-secondary'}`}
                    style={!isActive ? { borderColor: '#E2E8F0', color: '#475569', backgroundColor: '#FFFFFF' } : {}}
                    onClick={() => onStatusFilterChange(status)}
                  >
                    {status === 'pending' ? '⏳ At-Risk' : status.charAt(0).toUpperCase() + status.slice(1)}
                  </button>
                );
              })}
            </div>
          </div>

          {/* Batch Action Bar */}
          {selectedIds.size > 0 && (
            <div className="px-3 py-2 d-flex justify-content-between align-items-center"
                 style={{ backgroundColor: 'rgba(12, 107, 245, 0.08)', borderBottom: '1px solid #0C6BF5' }}>
              <span className="small fw-bold d-flex align-items-center gap-2" style={{ color: '#0F172A' }}>
                <i className="bi bi-check2-square text-primary fs-5"></i>
                <span>{selectedIds.size} transaction(s) selected for recovery</span>
              </span>
              <button
                className="btn btn-sm fw-bold d-flex align-items-center gap-2"
                style={{ background: 'linear-gradient(135deg, #059669 0%, #047857 100%)', color: '#FFFFFF', border: 'none' }}
                disabled={batchLoading}
                onClick={onBatchRecover}
              >
                {batchLoading ? (
                  <>
                    <span className="spinner-border spinner-border-sm" role="status"></span>
                    <span>Processing Batch...</span>
                  </>
                ) : (
                  <>
                    <i className="bi bi-rocket-takeoff-fill"></i>
                    <span>Batch Recover Selected ({selectedIds.size})</span>
                  </>
                )}
              </button>
            </div>
          )}

          {/* Table */}
          <div className="table-responsive flex-grow-1" style={{ maxHeight: '560px' }}>
            <table className="table table-hover align-middle mb-0" style={{ color: '#0F172A', borderColor: '#E2E8F0' }}>
              <thead style={{ backgroundColor: '#F8FAFC', position: 'sticky', top: 0, zIndex: 1 }}>
                <tr className="small text-uppercase" style={{ color: '#64748B', borderBottom: '1px solid #E2E8F0' }}>
                  <th style={{ width: '40px' }} className="ps-3">
                    <input
                      type="checkbox"
                      className="form-check-input"
                      checked={isAllSelected}
                      onChange={onSelectAll}
                      disabled={unrecovered.length === 0}
                    />
                  </th>
                  <th>Transaction ID</th>
                  <th>Amount</th>
                  <th>Status</th>
                  <th>Diagnosis & Recovery Message</th>
                  <th className="text-end pe-3">Action</th>
                </tr>
              </thead>
              <tbody>
                {transactions.map(txn => {
                  const isChecked = selectedIds.has(txn.id);
                  const hinglish = txn.diagnosis?.hinglish_message || 
                    (txn.error_code === 'CARD_DECLINED' 
                      ? 'Aapka card bank ne decline kiya. Kripya dusra payment method try karein.' 
                      : `Aapki payment of ₹${txn.amount?.toLocaleString()} incomplete reh gayi thi.`);

                  return (
                    <tr key={txn.id} style={{ backgroundColor: isChecked ? 'rgba(12, 107, 245, 0.05)' : 'transparent' }}>
                      <td className="ps-3">
                        {!txn.is_recovered ? (
                          <input
                            type="checkbox"
                            className="form-check-input"
                            checked={isChecked}
                            onChange={() => onToggleSelect(txn.id)}
                          />
                        ) : (
                          <span className="fw-bold text-success">✓</span>
                        )}
                      </td>
                      <td>
                        <span className="font-monospace fw-bold d-block" style={{ color: '#000000' }}>{txn.id}</span>
                        <span className="small" style={{ color: '#64748B' }}>{txn.customer_email || 'customer@example.com'}</span>
                      </td>
                      <td className="fw-bold fs-6 font-monospace" style={{ color: '#000000' }}>
                        ₹{txn.amount?.toLocaleString()}
                      </td>
                      <td>
                        <span className={`badge ${txn.is_recovered ? '' : txn.status === 'halted' ? 'bg-danger text-white' : txn.status === 'failed' ? 'bg-danger' : 'bg-warning text-dark'}`}
                              style={txn.is_recovered ? { backgroundColor: '#059669', color: '#FFFFFF', fontWeight: 'bold' } : {}}>
                          {txn.is_recovered ? 'RECOVERED' : txn.status.toUpperCase()}
                        </span>
                        {txn.error_code && (
                          <span className="badge ms-1 small font-monospace"
                                style={{ backgroundColor: '#F1F5F9', color: '#0C6BF5', border: '1px solid #E2E8F0' }}>
                            {txn.error_code === 'SUBSCRIPTION_RETRIES_EXHAUSTED' ? '🔁 MANDATE HALTED' : txn.error_code}
                          </span>
                        )}
                      </td>
                      <td style={{ maxWidth: '340px' }}>
                        <div className="small text-truncate" title={hinglish} style={{ color: '#334155' }}>
                          <i className="bi bi-chat-left-dots-fill me-1 text-primary"></i>
                          <em>"{hinglish}"</em>
                        </div>
                      </td>
                      <td className="text-end pe-3">
                        {txn.is_recovered ? (
                          <button
                            className="btn btn-sm py-1 px-3 fw-bold disabled"
                            style={{ backgroundColor: '#ECFDF5', color: '#059669', border: '1px solid #A7F3D0' }}
                            disabled
                          >
                            <i className="bi bi-check-circle-fill me-1"></i>Recovered
                          </button>
                        ) : (
                          <button
                            className="btn btn-sm btn-primary py-1 px-3 fw-bold d-inline-flex align-items-center gap-1 shadow-sm"
                            onClick={() => onRecoverClick(txn)}
                          >
                            {txn.status === 'halted' || txn.error_code === 'SUBSCRIPTION_RETRIES_EXHAUSTED' ? (
                              <>
                                <i className="bi bi-arrow-repeat"></i>
                                <span>Re-auth Mandate</span>
                              </>
                            ) : (
                              <>
                                <i className="bi bi-lightning-charge-fill"></i>
                                <span>Recover</span>
                              </>
                            )}
                          </button>
                        )}
                      </td>
                    </tr>
                  );
                })}
                {transactions.length === 0 && (
                  <tr>
                    <td colSpan="6" className="text-center py-5 text-muted">
                      <i className="bi bi-inbox fs-1 d-block mb-2 text-primary"></i>
                      No transactions found matching your criteria.
                    </td>
                  </tr>
                )}
              </tbody>
            </table>
          </div>
        </div>
      </div>
  );
};
