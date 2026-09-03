import React, { useEffect, useState, useMemo } from 'react';
import {
  fetchAtRisk,
  fetchMetrics,
  triggerRecovery,
  triggerBatchRecovery,
  Transaction,
  SystemMetrics
} from '../services/api';
import { MetricsChart } from '../components/MetricsChart';
import { TransactionModal } from '../components/TransactionModal';

export const Dashboard: React.FC = () => {
  const [metrics, setMetrics] = useState<SystemMetrics | null>(null);
  const [transactions, setTransactions] = useState<Transaction[]>([]);
  const [loading, setLoading] = useState<boolean>(true);
  const [searchQuery, setSearchQuery] = useState<string>('');
  const [selectedStatusTab, setSelectedStatusTab] = useState<string>('pending');
  const [selectedIds, setSelectedIds] = useState<Set<string>>(new Set());
  const [recoveringIds, setRecoveringIds] = useState<{ [id: string]: boolean }>({});
  const [inspectingTxnId, setInspectingTxnId] = useState<string | null>(null);
  const [notification, setNotification] = useState<{ message: string; type: 'success' | 'error' } | null>(null);
  const [batchLoading, setBatchLoading] = useState<boolean>(false);

  const loadData = async () => {
    try {
      const [m, txs] = await Promise.all([
        fetchMetrics(),
        fetchAtRisk(searchQuery, selectedStatusTab)
      ]);
      setMetrics(m);
      setTransactions(txs);
    } catch (err) {
      console.error("Error loading dashboard data:", err);
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    loadData();
    const interval = setInterval(() => {
      fetchMetrics().then(setMetrics).catch(() => {});
    }, 4000);
    return () => clearInterval(interval);
  }, [selectedStatusTab]);

  // Debounced search
  useEffect(() => {
    const timer = setTimeout(() => {
      fetchAtRisk(searchQuery, selectedStatusTab).then(setTransactions).catch(() => {});
    }, 250);
    return () => clearTimeout(timer);
  }, [searchQuery, selectedStatusTab]);

  const notify = (message: string, type: 'success' | 'error' = 'success') => {
    setNotification({ message, type });
    setTimeout(() => setNotification(null), 5000);
  };

  // Toggle selection
  const toggleSelect = (id: string) => {
    setSelectedIds(prev => {
      const next = new Set(prev);
      if (next.has(id)) next.delete(id);
      else next.add(id);
      return next;
    });
  };

  const selectAll = () => {
    const unrecovered = transactions.filter(t => !t.is_recovered).map(t => t.id);
    if (selectedIds.size === unrecovered.length) {
      setSelectedIds(new Set());
    } else {
      setSelectedIds(new Set(unrecovered));
    }
  };

  // Single Recover with Optimistic Update
  const handleSingleRecover = async (e: React.MouseEvent, txnId: string) => {
    e.stopPropagation();
    setRecoveringIds(prev => ({ ...prev, [txnId]: true }));
    
    // Optimistic UI update
    setTransactions(prev => prev.map(t => t.id === txnId ? { ...t, is_recovered: true } : t));

    try {
      const res = await triggerRecovery(txnId);
      notify(`Recovered ${txnId}! Payment Link: ${res.link || 'Generated'}`, 'success');
      loadData();
    } catch (err: any) {
      // Revert optimistic update on error
      setTransactions(prev => prev.map(t => t.id === txnId ? { ...t, is_recovered: false } : t));
      notify(`Failed to recover ${txnId}: ${err.message}`, 'error');
    } finally {
      setRecoveringIds(prev => {
        const copy = { ...prev };
        delete copy[txnId];
        return copy;
      });
    }
  };

  // High-Speed Batch Recovery
  const handleBatchRecover = async () => {
    const ids = Array.from(selectedIds);
    if (ids.length === 0) return;

    setBatchLoading(true);
    // Optimistic UI update for all selected
    setTransactions(prev => prev.map(t => ids.includes(t.id) ? { ...t, is_recovered: true } : t));
    setSelectedIds(new Set());

    try {
      const res = await triggerBatchRecovery(ids);
      notify(`Batch Complete: Recovered ${res.successful} of ${res.total} transactions instantly!`, 'success');
      loadData();
    } catch (err: any) {
      notify(`Batch recovery failed: ${err.message}`, 'error');
      loadData();
    } finally {
      setBatchLoading(false);
    }
  };

  // Export CSV
  const handleExportCSV = () => {
    const headers = ["Transaction ID", "Merchant ID", "Customer Email", "Amount (INR)", "Status", "Error Code", "Is Recovered"];
    const rows = transactions.map(t => [
      t.id,
      t.merchant_id || "",
      t.customer_email || "",
      t.amount,
      t.status,
      t.error_code || "",
      t.is_recovered ? "YES" : "NO"
    ]);

    const csvContent = "data:text/csv;charset=utf-8," + [headers.join(","), ...rows.map(e => e.join(","))].join("\n");
    const encodedUri = encodeURI(csvContent);
    const link = document.createElement("a");
    link.setAttribute("href", encodedUri);
    link.setAttribute("download", `razorpay_recovery_report_${new Date().toISOString().slice(0, 10)}.csv`);
    document.body.appendChild(link);
    link.click();
    document.body.removeChild(link);
    notify("Exported transaction report to CSV", "success");
  };

  const unrecoveredInView = transactions.filter(t => !t.is_recovered);

  return (
    <div style={styles.container}>
      {/* Top Navbar */}
      <header style={styles.navbar}>
        <div style={styles.navLeft}>
          <div style={styles.logoBadge}>
            <span style={styles.logoIcon}>⚡</span>
            <div>
              <span style={styles.logoBrand}>RAZORPAY</span>
              <span style={styles.logoProduct}>RECOVERY SUITE</span>
            </div>
          </div>
          <span style={styles.merchantPill}>Merchant: <strong>merch_enterprise_flagship</strong></span>
        </div>

        <div style={styles.navRight}>
          <div style={styles.statusPill}>
            <span style={styles.livePulse}></span>
            <span>PostgreSQL + Redis + Celery: Healthy</span>
          </div>
          <button style={styles.exportBtn} onClick={handleExportCSV}>
            📥 Export CSV
          </button>
        </div>
      </header>

      {/* Main Container */}
      <main style={styles.content}>
        {/* Toast */}
        {notification && (
          <div style={notification.type === 'success' ? styles.toastSuccess : styles.toastError}>
            <span>{notification.message}</span>
            <button style={styles.toastClose} onClick={() => setNotification(null)}>✕</button>
          </div>
        )}

        {/* Executive KPI Metric Cards */}
        <section style={styles.kpiGrid}>
          <div style={styles.kpiCard}>
            <div style={styles.kpiHeader}>
              <span style={styles.kpiLabel}>Total Revenue At-Risk</span>
              <span style={styles.kpiBadgeAmber}>Attention Required</span>
            </div>
            <div style={{ ...styles.kpiValue, color: '#F59E0B' }}>
              ₹{metrics ? metrics.total_risk.toLocaleString() : '---'}
            </div>
            <span style={styles.kpiMeta}>Unresolved failed & abandoned transactions</span>
          </div>

          <div style={styles.kpiCard}>
            <div style={styles.kpiHeader}>
              <span style={styles.kpiLabel}>Recovered Today</span>
              <span style={styles.kpiBadgeGreen}>+Active Recovery</span>
            </div>
            <div style={{ ...styles.kpiValue, color: '#10B981' }}>
              ₹{metrics ? metrics.recovered_today.toLocaleString() : '---'}
            </div>
            <span style={styles.kpiMeta}>
              Total Lifetime: <strong>₹{metrics ? metrics.total_recovered.toLocaleString() : '---'}</strong>
            </span>
          </div>

          <div style={styles.kpiCard}>
            <div style={styles.kpiHeader}>
              <span style={styles.kpiLabel}>LLM Inference Latency</span>
              <span style={styles.kpiBadgeBlue}>Groq SLA</span>
            </div>
            <div style={{ ...styles.kpiValue, color: '#38BDF8' }}>
              {metrics ? `${metrics.avg_llm_latency_ms} ms` : '---'}
            </div>
            <span style={styles.kpiMeta}>Sub-second AI root-cause diagnosis</span>
          </div>

          <div style={styles.kpiCard}>
            <div style={styles.kpiHeader}>
              <span style={styles.kpiLabel}>AI Spend & ROI Multiple</span>
              <span style={styles.kpiBadgePurple}>Value Driven</span>
            </div>
            <div style={{ ...styles.kpiValue, color: '#A78BFA' }}>
              {metrics?.roi_multiple ? `${metrics.roi_multiple.toLocaleString()}x ROI` : 'High ROI'}
            </div>
            <span style={styles.kpiMeta}>
              Total AI Compute Cost: <strong>₹{metrics ? metrics.total_llm_cost.toFixed(4) : '0.0000'}</strong>
            </span>
          </div>
        </section>

        {/* Live Chart.js Telemetry Graph */}
        <section style={styles.chartContainer}>
          <div style={styles.chartHeader}>
            <div>
              <h2 style={styles.sectionTitle}>Real-time Recovery Telemetry</h2>
              <span style={styles.sectionSub}>Live hourly reconciliation: Recovered Revenue vs. At-Risk Portfolio</span>
            </div>
            <span style={styles.telemetryTag}>LIVE FEED (4s)</span>
          </div>
          {metrics?.timeline ? (
            <MetricsChart timeline={metrics.timeline} />
          ) : (
            <div style={styles.chartLoading}>Connecting to telemetry stream...</div>
          )}
        </section>

        {/* Operations Center Table */}
        <section style={styles.operationsCard}>
          {/* Controls Bar: Search & Status Tabs */}
          <div style={styles.controlsBar}>
            {/* Search Input */}
            <div style={styles.searchWrapper}>
              <span style={styles.searchIcon}>🔍</span>
              <input
                type="text"
                placeholder="Search by Txn ID, Email, Error Code..."
                value={searchQuery}
                onChange={e => setSearchQuery(e.target.value)}
                style={styles.searchInput}
              />
              {searchQuery && (
                <button style={styles.clearSearch} onClick={() => setSearchQuery('')}>✕</button>
              )}
            </div>

            {/* Filter Tabs */}
            <div style={styles.tabGroup}>
              {[
                { key: 'pending', label: '⏳ At-Risk Pending' },
                { key: 'failed', label: '⚠️ Bank Failures' },
                { key: 'abandoned', label: '🛒 Abandoned' },
                { key: 'recovered', label: '✅ Recovered' },
                { key: 'all', label: '📋 All Records' }
              ].map(tab => (
                <button
                  key={tab.key}
                  style={selectedStatusTab === tab.key ? styles.tabActive : styles.tabInactive}
                  onClick={() => setSelectedStatusTab(tab.key)}
                >
                  {tab.label}
                </button>
              ))}
            </div>
          </div>

          {/* Batch Action Bar */}
          {selectedIds.size > 0 && (
            <div style={styles.batchBar}>
              <div>
                <strong>{selectedIds.size}</strong> transaction{selectedIds.size > 1 ? 's' : ''} selected for instant recovery
              </div>
              <button
                style={batchLoading ? styles.batchBtnDisabled : styles.batchBtn}
                disabled={batchLoading}
                onClick={handleBatchRecover}
              >
                {batchLoading ? 'Processing Batch...' : `🚀 Recover Selected (${selectedIds.size})`}
              </button>
            </div>
          )}

          {/* Table */}
          <div style={styles.tableWrapper}>
            <table style={styles.table}>
              <thead>
                <tr style={styles.thRow}>
                  <th style={styles.thCheckbox}>
                    <input
                      type="checkbox"
                      checked={unrecoveredInView.length > 0 && selectedIds.size === unrecoveredInView.length}
                      onChange={selectAll}
                      disabled={unrecoveredInView.length === 0}
                    />
                  </th>
                  <th style={styles.th}>Transaction ID</th>
                  <th style={styles.th}>Customer</th>
                  <th style={styles.th}>Amount</th>
                  <th style={styles.th}>Status</th>
                  <th style={styles.th}>Error Code</th>
                  <th style={styles.thAction}>Action</th>
                </tr>
              </thead>
              <tbody>
                {transactions.map(txn => {
                  const isChecked = selectedIds.has(txn.id);
                  const isRecovering = Boolean(recoveringIds[txn.id]);

                  return (
                    <tr
                      key={txn.id}
                      style={styles.tr}
                      onClick={() => setInspectingTxnId(txn.id)}
                    >
                      <td style={styles.tdCheckbox} onClick={e => e.stopPropagation()}>
                        {!txn.is_recovered ? (
                          <input
                            type="checkbox"
                            checked={isChecked}
                            onChange={() => toggleSelect(txn.id)}
                          />
                        ) : (
                          <span style={styles.checkDone}>✓</span>
                        )}
                      </td>
                      <td style={styles.tdId}>
                        <span>{txn.id}</span>
                        <span style={styles.viewLink}>Inspect ↗</span>
                      </td>
                      <td style={styles.td}>{txn.customer_email || 'N/A'}</td>
                      <td style={styles.tdAmount}>₹{txn.amount.toLocaleString()}</td>
                      <td style={styles.td}>
                        <span style={txn.is_recovered ? styles.badgeRecovered : txn.status === 'failed' ? styles.badgeFailed : styles.badgeAbandoned}>
                          {txn.is_recovered ? 'RECOVERED' : txn.status.toUpperCase()}
                        </span>
                      </td>
                      <td style={styles.td}>
                        <span style={styles.errorCodeBadge}>{txn.error_code || 'None'}</span>
                      </td>
                      <td style={styles.tdAction} onClick={e => e.stopPropagation()}>
                        {txn.is_recovered ? (
                          <button
                            style={styles.btnViewLink}
                            onClick={() => setInspectingTxnId(txn.id)}
                          >
                            View Link ↗
                          </button>
                        ) : (
                          <button
                            style={isRecovering ? styles.btnRecovering : styles.btnRecover}
                            disabled={isRecovering}
                            onClick={e => handleSingleRecover(e, txn.id)}
                          >
                            {isRecovering ? 'Processing...' : '🚀 Recover'}
                          </button>
                        )}
                      </td>
                    </tr>
                  );
                })}
                {transactions.length === 0 && !loading && (
                  <tr>
                    <td colSpan={7} style={styles.emptyState}>
                      No transactions match your search filter.
                    </td>
                  </tr>
                )}
              </tbody>
            </table>
          </div>
        </section>
      </main>

      {/* Transaction Details Modal */}
      {inspectingTxnId && (
        <TransactionModal
          txnId={inspectingTxnId}
          onClose={() => setInspectingTxnId(null)}
          onRecovered={loadData}
        />
      )}
    </div>
  );
};

const styles: { [key: string]: React.CSSProperties } = {
  container: {
    minHeight: '100vh',
    backgroundColor: '#0B1426',
    color: '#F8FAFC',
    fontFamily: '"Inter", -apple-system, BlinkMacSystemFont, sans-serif',
  },
  navbar: {
    display: 'flex',
    justifyContent: 'space-between',
    alignItems: 'center',
    padding: '16px 36px',
    backgroundColor: '#0C2340',
    borderBottom: '1px solid #1E3A5F',
  },
  navLeft: {
    display: 'flex',
    alignItems: 'center',
    gap: '24px',
  },
  logoBadge: {
    display: 'flex',
    alignItems: 'center',
    gap: '12px',
  },
  logoIcon: {
    fontSize: '22px',
    backgroundColor: '#2B84EA',
    color: '#FFF',
    padding: '6px 10px',
    borderRadius: '8px',
    boxShadow: '0 0 12px rgba(43, 132, 234, 0.4)',
  },
  logoBrand: {
    fontSize: '18px',
    fontWeight: 900,
    letterSpacing: '1px',
    color: '#FFFFFF',
    display: 'block',
  },
  logoProduct: {
    fontSize: '11px',
    fontWeight: 700,
    letterSpacing: '1.5px',
    color: '#38BDF8',
    display: 'block',
  },
  merchantPill: {
    backgroundColor: '#112A4F',
    padding: '6px 14px',
    borderRadius: '6px',
    fontSize: '12px',
    color: '#94A3B8',
    border: '1px solid #1E3A5F',
  },
  navRight: {
    display: 'flex',
    alignItems: 'center',
    gap: '16px',
  },
  statusPill: {
    display: 'flex',
    alignItems: 'center',
    gap: '8px',
    backgroundColor: '#0E2A47',
    padding: '6px 14px',
    borderRadius: '999px',
    fontSize: '12px',
    color: '#E2E8F0',
    border: '1px solid #1E3A5F',
  },
  livePulse: {
    width: '8px',
    height: '8px',
    borderRadius: '50%',
    backgroundColor: '#10B981',
    boxShadow: '0 0 8px #10B981',
  },
  exportBtn: {
    backgroundColor: '#1E3A5F',
    color: '#FFF',
    border: 'none',
    padding: '8px 16px',
    borderRadius: '6px',
    fontSize: '13px',
    fontWeight: 600,
    cursor: 'pointer',
  },
  content: {
    padding: '28px 36px',
  },
  toastSuccess: {
    backgroundColor: '#064E3B',
    color: '#A7F3D0',
    padding: '12px 20px',
    borderRadius: '8px',
    marginBottom: '20px',
    display: 'flex',
    justifyContent: 'space-between',
    alignItems: 'center',
    border: '1px solid #059669',
  },
  toastError: {
    backgroundColor: '#451A03',
    color: '#FDBA74',
    padding: '12px 20px',
    borderRadius: '8px',
    marginBottom: '20px',
    display: 'flex',
    justifyContent: 'space-between',
    alignItems: 'center',
    border: '1px solid #D97706',
  },
  toastClose: {
    background: 'none',
    border: 'none',
    color: 'inherit',
    cursor: 'pointer',
    fontSize: '16px',
  },
  kpiGrid: {
    display: 'grid',
    gridTemplateColumns: 'repeat(auto-fit, minmax(250px, 1fr))',
    gap: '20px',
    marginBottom: '28px',
  },
  kpiCard: {
    backgroundColor: '#0C2340',
    padding: '20px 24px',
    borderRadius: '12px',
    border: '1px solid #1E3A5F',
    boxShadow: '0 4px 6px -1px rgba(0, 0, 0, 0.2)',
  },
  kpiHeader: {
    display: 'flex',
    justifyContent: 'space-between',
    alignItems: 'center',
  },
  kpiLabel: {
    fontSize: '12px',
    color: '#94A3B8',
    fontWeight: 700,
    textTransform: 'uppercase',
    letterSpacing: '0.5px',
  },
  kpiBadgeAmber: {
    fontSize: '10px',
    backgroundColor: '#451A03',
    color: '#FDBA74',
    padding: '2px 8px',
    borderRadius: '999px',
    fontWeight: 700,
  },
  kpiBadgeGreen: {
    fontSize: '10px',
    backgroundColor: '#064E3B',
    color: '#6EE7B7',
    padding: '2px 8px',
    borderRadius: '999px',
    fontWeight: 700,
  },
  kpiBadgeBlue: {
    fontSize: '10px',
    backgroundColor: '#0C4A6E',
    color: '#7DD3FC',
    padding: '2px 8px',
    borderRadius: '999px',
    fontWeight: 700,
  },
  kpiBadgePurple: {
    fontSize: '10px',
    backgroundColor: '#3B0764',
    color: '#D8B4FE',
    padding: '2px 8px',
    borderRadius: '999px',
    fontWeight: 700,
  },
  kpiValue: {
    fontSize: '30px',
    fontWeight: 800,
    margin: '10px 0 6px 0',
  },
  kpiMeta: {
    fontSize: '12px',
    color: '#64748B',
  },
  chartContainer: {
    backgroundColor: '#0C2340',
    borderRadius: '12px',
    padding: '24px',
    border: '1px solid #1E3A5F',
    marginBottom: '28px',
  },
  chartHeader: {
    display: 'flex',
    justifyContent: 'space-between',
    alignItems: 'flex-start',
    marginBottom: '16px',
  },
  sectionTitle: {
    fontSize: '18px',
    fontWeight: 800,
    margin: 0,
    color: '#F8FAFC',
  },
  sectionSub: {
    fontSize: '13px',
    color: '#94A3B8',
  },
  telemetryTag: {
    backgroundColor: '#1E3A5F',
    color: '#38BDF8',
    padding: '4px 10px',
    borderRadius: '4px',
    fontSize: '11px',
    fontWeight: 700,
  },
  chartLoading: {
    height: '320px',
    display: 'flex',
    alignItems: 'center',
    justifyContent: 'center',
    color: '#64748B',
  },
  operationsCard: {
    backgroundColor: '#0C2340',
    borderRadius: '12px',
    border: '1px solid #1E3A5F',
    overflow: 'hidden',
  },
  controlsBar: {
    display: 'flex',
    justifyContent: 'space-between',
    alignItems: 'center',
    padding: '20px 24px',
    borderBottom: '1px solid #1E3A5F',
    gap: '16px',
    flexWrap: 'wrap',
  },
  searchWrapper: {
    position: 'relative',
    flex: '1 1 320px',
    maxWidth: '480px',
  },
  searchIcon: {
    position: 'absolute',
    left: '12px',
    top: '50%',
    transform: 'translateY(-50%)',
    fontSize: '14px',
  },
  searchInput: {
    width: '100%',
    backgroundColor: '#0B1426',
    border: '1px solid #1E3A5F',
    borderRadius: '8px',
    padding: '10px 36px 10px 38px',
    color: '#F8FAFC',
    fontSize: '13px',
    outline: 'none',
    boxSizing: 'border-box',
  },
  clearSearch: {
    position: 'absolute',
    right: '10px',
    top: '50%',
    transform: 'translateY(-50%)',
    background: 'none',
    border: 'none',
    color: '#94A3B8',
    cursor: 'pointer',
    fontSize: '14px',
  },
  tabGroup: {
    display: 'flex',
    gap: '8px',
  },
  tabActive: {
    backgroundColor: '#2B84EA',
    color: '#FFF',
    border: 'none',
    padding: '8px 14px',
    borderRadius: '6px',
    fontSize: '12px',
    fontWeight: 700,
    cursor: 'pointer',
  },
  tabInactive: {
    backgroundColor: '#112A4F',
    color: '#94A3B8',
    border: '1px solid #1E3A5F',
    padding: '8px 14px',
    borderRadius: '6px',
    fontSize: '12px',
    fontWeight: 600,
    cursor: 'pointer',
  },
  batchBar: {
    backgroundColor: '#0F2F57',
    padding: '12px 24px',
    display: 'flex',
    justifyContent: 'space-between',
    alignItems: 'center',
    borderBottom: '1px solid #2B84EA',
  },
  batchBtn: {
    backgroundColor: '#10B981',
    color: '#FFF',
    border: 'none',
    padding: '8px 18px',
    borderRadius: '6px',
    fontWeight: 700,
    fontSize: '13px',
    cursor: 'pointer',
    boxShadow: '0 2px 4px rgba(0,0,0,0.2)',
  },
  batchBtnDisabled: {
    backgroundColor: '#475569',
    color: '#94A3B8',
    border: 'none',
    padding: '8px 18px',
    borderRadius: '6px',
    fontWeight: 700,
    fontSize: '13px',
    cursor: 'not-allowed',
  },
  tableWrapper: {
    overflowX: 'auto',
  },
  table: {
    width: '100%',
    borderCollapse: 'collapse',
    textAlign: 'left',
  },
  thRow: {
    backgroundColor: '#0E2544',
    borderBottom: '1px solid #1E3A5F',
  },
  thCheckbox: {
    padding: '14px 16px',
    width: '32px',
  },
  th: {
    padding: '14px 16px',
    fontSize: '11px',
    color: '#94A3B8',
    fontWeight: 700,
    textTransform: 'uppercase',
    letterSpacing: '0.5px',
  },
  thAction: {
    padding: '14px 16px',
    fontSize: '11px',
    color: '#94A3B8',
    fontWeight: 700,
    textTransform: 'uppercase',
    textAlign: 'right',
  },
  tr: {
    borderBottom: '1px solid #132D50',
    cursor: 'pointer',
    transition: 'background 0.15s ease',
  },
  tdCheckbox: {
    padding: '14px 16px',
  },
  checkDone: {
    color: '#10B981',
    fontWeight: 800,
  },
  tdId: {
    padding: '14px 16px',
    fontFamily: 'monospace',
    fontWeight: 700,
    color: '#F8FAFC',
    fontSize: '13px',
  },
  viewLink: {
    fontSize: '11px',
    color: '#38BDF8',
    marginLeft: '6px',
  },
  td: {
    padding: '14px 16px',
    fontSize: '13px',
    color: '#CBD5E1',
  },
  tdAmount: {
    padding: '14px 16px',
    fontSize: '14px',
    fontWeight: 800,
    color: '#FFFFFF',
  },
  badgeRecovered: {
    backgroundColor: '#064E3B',
    color: '#6EE7B7',
    padding: '3px 8px',
    borderRadius: '4px',
    fontSize: '11px',
    fontWeight: 700,
  },
  badgeFailed: {
    backgroundColor: '#451A03',
    color: '#FDBA74',
    padding: '3px 8px',
    borderRadius: '4px',
    fontSize: '11px',
    fontWeight: 700,
  },
  badgeAbandoned: {
    backgroundColor: '#374151',
    color: '#E5E7EB',
    padding: '3px 8px',
    borderRadius: '4px',
    fontSize: '11px',
    fontWeight: 700,
  },
  errorCodeBadge: {
    backgroundColor: '#1E3A5F',
    color: '#93C5FD',
    padding: '3px 8px',
    borderRadius: '4px',
    fontSize: '11px',
    fontFamily: 'monospace',
  },
  tdAction: {
    padding: '14px 16px',
    textAlign: 'right',
  },
  btnRecover: {
    backgroundColor: '#2B84EA',
    color: '#FFF',
    border: 'none',
    padding: '7px 16px',
    borderRadius: '6px',
    fontWeight: 700,
    fontSize: '12px',
    cursor: 'pointer',
    boxShadow: '0 1px 3px rgba(0,0,0,0.3)',
  },
  btnRecovering: {
    backgroundColor: '#475569',
    color: '#94A3B8',
    border: 'none',
    padding: '7px 16px',
    borderRadius: '6px',
    fontWeight: 700,
    fontSize: '12px',
    cursor: 'not-allowed',
  },
  btnViewLink: {
    backgroundColor: '#0E2A47',
    color: '#38BDF8',
    border: '1px solid #1E3A5F',
    padding: '7px 14px',
    borderRadius: '6px',
    fontWeight: 600,
    fontSize: '12px',
    cursor: 'pointer',
  },
  emptyState: {
    padding: '48px',
    textAlign: 'center',
    color: '#64748B',
    fontSize: '14px',
  }
};
