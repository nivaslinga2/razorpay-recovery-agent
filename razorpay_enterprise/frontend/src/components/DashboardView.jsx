import React from 'react';
import { MetricsChart } from './MetricsChart.jsx';
import { TransactionTable } from './TransactionTable';

export const DashboardView = ({
  metrics,
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
  return (
    <>
      <div className="card shadow-sm mb-4" style={{ backgroundColor: '#FFFFFF', borderColor: '#E2E8F0' }}>
        <div className="card-header d-flex justify-content-between align-items-center py-3" style={{ borderBottom: '1px solid #E2E8F0', backgroundColor: '#FFFFFF' }}>
          <div className="d-flex align-items-center gap-2">
            <div className="p-1 px-2 rounded" style={{ backgroundColor: 'rgba(12, 107, 245, 0.08)' }}>
              <i className="bi bi-graph-up text-primary fs-5"></i>
            </div>
            <h3 className="card-title fs-5 fw-bold mb-0" style={{ color: '#000000' }}>
              Real-time Recovery Telemetry
            </h3>
          </div>
          <span className="badge px-3 py-2 fw-bold" style={{ background: 'var(--rzp-gradient)', color: '#FFFFFF' }}>
            <i className="bi bi-broadcast me-1"></i>Live Stream Telemetry (4s)
          </span>
        </div>
        <div className="card-body p-3">
          {metrics?.timeline ? (
            <MetricsChart timeline={metrics.timeline} />
          ) : (
            <div className="text-center py-5 text-muted">Connecting to metrics stream...</div>
          )}
        </div>
      </div>

      <TransactionTable
        transactions={transactions}
        onRecoverClick={onRecoverClick}
        onBatchRecover={onBatchRecover}
        selectedIds={selectedIds}
        onToggleSelect={onToggleSelect}
        onSelectAll={onSelectAll}
        searchQuery={searchQuery}
        onSearchChange={onSearchChange}
        statusFilter={statusFilter}
        onStatusFilterChange={onStatusFilterChange}
        batchLoading={batchLoading}
      />
    </>
  );
};

export default DashboardView;
