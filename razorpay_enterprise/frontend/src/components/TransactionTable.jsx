import React, { useState } from 'react';

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
  const [collapsed, setCollapsed] = useState(false);
  const [maximized, setMaximized] = useState(false);

  const unrecovered = transactions.filter(t => !t.is_recovered);
  const isAllSelected = unrecovered.length > 0 && selectedIds.size === unrecovered.length;

  return (
    <div className={`card card-primary card-outline shadow-sm mb-4 ${maximized ? 'position-fixed top-0 start-0 w-100 h-100 z-3 m-0 rounded-0' : ''}`}
         style={{ backgroundColor: '#0c2340', borderColor: '#1e3a5f', overflow: 'hidden' }}>
      
      {/* Card Header with Operations Tools */}
      <div className="card-header d-flex justify-content-between align-items-center py-3" style={{ borderBottom: '1px solid #1e3a5f' }}>
        <div className="d-flex align-items-center gap-2">
          <i className="bi bi-table text-primary fs-5"></i>
          <h3 className="card-title fs-5 fw-bold mb-0 text-white">At-Risk Transactions</h3>
          <span className="badge bg-secondary ms-2">{transactions.length} items</span>
        </div>

        <div className="card-tools d-flex align-items-center gap-2">
          {/* Card tool buttons */}
          <button
            type="button"
            className="btn btn-sm btn-outline-secondary text-white"
            onClick={() => setCollapsed(!collapsed)}
            title={collapsed ? "Expand" : "Collapse"}
          >
            <i className={`bi bi-${collapsed ? 'plus-lg' : 'dash-lg'}`}></i>
          </button>
          <button
            type="button"
            className="btn btn-sm btn-outline-secondary text-white"
            onClick={() => setMaximized(!maximized)}
            title={maximized ? "Restore" : "Maximize"}
          >
            <i className={`bi bi-${maximized ? 'fullscreen-exit' : 'arrows-fullscreen'}`}></i>
          </button>
        </div>
      </div>

      {!collapsed && (
        <div className="card-body p-0" style={{ display: 'flex', flexDirection: 'column', height: maximized ? 'calc(100vh - 60px)' : 'auto' }}>
          {/* Search and Filters bar */}
          <div className="p-3 d-flex flex-wrap justify-content-between align-items-center gap-3" style={{ backgroundColor: '#091c33', borderBottom: '1px solid #1e3a5f' }}>
            <div className="input-group" style={{ maxWidth: '380px' }}>
              <span className="input-group-text bg-dark border-secondary text-muted">
                <i className="bi bi-search"></i>
              </span>
              <input
                type="text"
                className="form-control bg-dark border-secondary text-white"
                placeholder="Search Txn ID, Email, Error..."
                value={searchQuery}
                onChange={e => onSearchChange(e.target.value)}
              />
              {searchQuery && (
                <button className="btn btn-outline-secondary text-white" onClick={() => onSearchChange('')}>✕</button>
              )}
            </div>

            <div className="d-flex gap-2 align-items-center flex-wrap">
              {['pending', 'failed', 'abandoned', 'recovered', 'all'].map(status => (
                <button
                  key={status}
                  className={`btn btn-sm ${statusFilter === status ? 'btn-primary' : 'btn-outline-secondary text-light'}`}
                  onClick={() => onStatusFilterChange(status)}
                >
                  {status === 'pending' ? '⏳ At-Risk' : status.charAt(0).toUpperCase() + status.slice(1)}
                </button>
              ))}
            </div>
          </div>

          {/* Batch Action Bar */}
          {selectedIds.size > 0 && (
            <div className="px-3 py-2 bg-primary bg-opacity-25 border-bottom border-primary d-flex justify-content-between align-items-center">
              <span className="small text-white fw-bold">
                <i className="bi bi-check2-square me-2"></i>
                {selectedIds.size} transaction(s) selected
              </span>
              <button
                className="btn btn-sm btn-success fw-bold d-flex align-items-center gap-1"
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
          <div className="table-responsive flex-grow-1" style={{ maxHeight: maximized ? '100%' : '520px' }}>
            <table className="table table-hover align-middle mb-0" style={{ color: '#e2e8f0', borderColor: '#1e3a5f' }}>
              <thead style={{ backgroundColor: '#091c33', position: 'sticky', top: 0, zIndex: 1 }}>
                <tr className="text-secondary small text-uppercase">
                  <th style={{ width: '40px' }} className="ps-3">
                    <input
                      type="checkbox"
                      className="form-check-input"
                      checked={isAllSelected}
                      onChange={onSelectAll}
                      disabled={unrecovered.length === 0}
                    />
                  </th>
                  <th>ID</th>
                  <th>Amount</th>
                  <th>Status</th>
                  <th>AI Diagnosis & Hinglish Draft</th>
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
                    <tr key={txn.id} style={{ backgroundColor: isChecked ? 'rgba(43, 132, 234, 0.12)' : 'transparent' }}>
                      <td className="ps-3">
                        {!txn.is_recovered ? (
                          <input
                            type="checkbox"
                            className="form-check-input"
                            checked={isChecked}
                            onChange={() => onToggleSelect(txn.id)}
                          />
                        ) : (
                          <span className="text-success fw-bold">✓</span>
                        )}
                      </td>
                      <td>
                        <span className="font-monospace fw-bold text-white d-block">{txn.id}</span>
                        <span className="text-muted small">{txn.customer_email || 'customer@example.com'}</span>
                      </td>
                      <td className="fw-bold text-white fs-6">
                        ₹{txn.amount?.toLocaleString()}
                      </td>
                      <td>
                        <span className={`badge ${txn.is_recovered ? 'bg-success' : txn.status === 'halted' ? 'bg-danger text-white' : txn.status === 'failed' ? 'bg-danger' : 'bg-warning text-dark'}`}>
                          {txn.is_recovered ? 'RECOVERED' : txn.status.toUpperCase()}
                        </span>
                        {txn.error_code && (
                          <span className={`badge ${txn.error_code === 'SUBSCRIPTION_RETRIES_EXHAUSTED' ? 'bg-warning text-dark' : 'bg-secondary'} ms-1 small font-monospace`}>
                            {txn.error_code === 'SUBSCRIPTION_RETRIES_EXHAUSTED' ? '🔁 MANDATE HALTED' : txn.error_code}
                          </span>
                        )}
                      </td>
                      <td style={{ maxWidth: '340px' }}>
                        <div className="small text-light text-truncate" title={hinglish}>
                          <i className="bi bi-chat-left-dots-fill text-info me-1"></i>
                          <em>"{hinglish}"</em>
                        </div>
                      </td>
                      <td className="text-end pe-3">
                        {txn.is_recovered ? (
                          <button
                            className="btn btn-sm btn-outline-success disabled py-1 px-3"
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
                      <i className="bi bi-inbox fs-1 d-block mb-2"></i>
                      No transactions found matching your criteria.
                    </td>
                  </tr>
                )}
              </tbody>
            </table>
          </div>
        </div>
      )}
    </div>
  );
};
