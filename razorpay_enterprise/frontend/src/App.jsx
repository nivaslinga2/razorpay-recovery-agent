import React, { useState, useEffect } from 'react';
import 'bootstrap/dist/css/bootstrap.min.css';
import 'bootstrap-icons/font/bootstrap-icons.css';
import './payresq.css';

import { DashboardLayout } from './components/DashboardLayout';
import { MetricsRow } from './components/MetricsRow';
import { DashboardView } from './components/DashboardView';
import { TransactionTable } from './components/TransactionTable';
import { AuditTimeline } from './components/AuditTimeline';
import { RecoveryModal } from './components/RecoveryModal';
import { ShadowModePanel } from './components/ShadowModePanel';
import { MandateSequencerCard } from './components/MandateSequencerCard';
import { B2BInvoiceChaserCard } from './components/B2BInvoiceChaserCard';
import { VoiceRecoveryCard } from './components/VoiceRecoveryCard';
import { PromiseTrackerCard } from './components/PromiseTrackerCard';
import { AssistantPanel } from './components/AssistantPanel';
import {
  fetchAtRisk,
  fetchMetrics,
  fetchShadowMetrics,
  fetchSystemConfig,
  fetchMandateStatus,
  fetchInvoicesChaser,
  fetchPromises,
  createPromise,
  remindPromise,
  fulfillPromise,
  chaseInvoice,
  retryMandate,
  pauseSystem,
  resumeSystem,
  triggerRecovery,
  triggerBatchRecovery,
  recoverSubscription
} from './services/api';

export const App = () => {
  const [activeNav, setActiveNav] = useState('dashboard');
  const [metrics, setMetrics] = useState(null);
  const [shadowData, setShadowData] = useState(null);
  const [mandateData, setMandateData] = useState(null);
  const [chaserData, setChaserData] = useState(null);
  const [promiseData, setPromiseData] = useState(null);
  const [isPaused, setIsPaused] = useState(false);
  const [transactions, setTransactions] = useState([]);
  const [searchQuery, setSearchQuery] = useState('');
  const [statusFilter, setStatusFilter] = useState('pending');
  const [selectedIds, setSelectedIds] = useState(new Set());
  const [batchLoading, setBatchLoading] = useState(false);
  const [modalTxn, setModalTxn] = useState(null);
  const [notification, setNotification] = useState(null);

  const loadData = async () => {
    try {
      const [m, txs, s, cfg, mdt, invs, ptps] = await Promise.all([
        fetchMetrics(),
        fetchAtRisk(searchQuery, statusFilter),
        fetchShadowMetrics().catch(() => null),
        fetchSystemConfig().catch(() => null),
        fetchMandateStatus().catch(() => null),
        fetchInvoicesChaser().catch(() => null),
        fetchPromises().catch(() => null)
      ]);
      setMetrics(m);
      setTransactions(txs);
      if (s) setShadowData(s);
      if (cfg) setIsPaused(cfg.is_paused);
      if (mdt) setMandateData(mdt);
      if (invs) setChaserData(invs);
      if (ptps) setPromiseData(ptps);
    } catch (e) {
      console.error('Error fetching data:', e);
    }
  };

  useEffect(() => {
    loadData();
    const interval = setInterval(() => {
      fetchMetrics().then(setMetrics).catch(() => {});
    }, 4000);
    return () => clearInterval(interval);
  }, [statusFilter]);

  // Debounced search
  useEffect(() => {
    const timer = setTimeout(() => {
      fetchAtRisk(searchQuery, statusFilter).then(setTransactions).catch(() => {});
    }, 250);
    return () => clearTimeout(timer);
  }, [searchQuery, statusFilter]);

  const notify = (message, type = 'success') => {
    setNotification({ message, type });
    setTimeout(() => setNotification(null), 4000);
  };

  const handleToggleSelect = (id) => {
    setSelectedIds(prev => {
      const next = new Set(prev);
      if (next.has(id)) next.delete(id);
      else next.add(id);
      return next;
    });
  };

  const handleSelectAll = () => {
    const unrecovered = transactions.filter(t => !t.is_recovered).map(t => t.id);
    if (selectedIds.size === unrecovered.length) {
      setSelectedIds(new Set());
    } else {
      setSelectedIds(new Set(unrecovered));
    }
  };

  const handleConfirmRecovery = async (txnId) => {
    setTransactions(prev => prev.map(t => t.id === txnId ? { ...t, is_recovered: true } : t));
    try {
      let res;
      if (modalTxn?.status === 'halted' || modalTxn?.error_code === 'SUBSCRIPTION_RETRIES_EXHAUSTED') {
        const subRes = await recoverSubscription(txnId, modalTxn.customer_id || 'cust_default', modalTxn.customer_email);
        res = { link: subRes.registration_link, ...subRes };
        notify(`Subscription mandate re-auth link generated for ${txnId}!`, 'success');
      } else {
        res = await triggerRecovery(txnId);
        notify(`Recovered ${txnId}! Payment link generated.`, 'success');
      }
      loadData();
      return res;
    } catch (e) {
      setTransactions(prev => prev.map(t => t.id === txnId ? { ...t, is_recovered: false } : t));
      notify(`Recovery failed for ${txnId}: ${e.message}`, 'danger');
      throw e;
    }
  };

  const handleBatchRecover = async () => {
    const ids = Array.from(selectedIds);
    if (ids.length === 0) return;

    setBatchLoading(true);
    setTransactions(prev => prev.map(t => ids.includes(t.id) ? { ...t, is_recovered: true } : t));
    setSelectedIds(new Set());

    try {
      const res = await triggerBatchRecovery(ids);
      notify(`Successfully recovered ${res.successful} out of ${res.total} transactions in batch!`, 'success');
      loadData();
    } catch (e) {
      notify(`Batch recovery failed: ${e.message}`, 'danger');
      loadData();
    } finally {
      setBatchLoading(false);
    }
  };

  const handleTogglePause = async () => {
    try {
      if (isPaused) {
        await resumeSystem();
        setIsPaused(false);
        notify('System Resumed: Recovery workers and payment dispatches active.', 'success');
      } else {
        await pauseSystem();
        setIsPaused(true);
        notify('Emergency Stop Engaged: All recovery operations halted immediately.', 'danger');
      }
      loadData();
    } catch (e) {
      notify(`Kill switch toggle failed: ${e.message}`, 'danger');
    }
  };

  const handleRetryMandate = async (mandateId, force = false) => {
    try {
      const res = await retryMandate(mandateId, force);
      if (res.status === 'EXECUTED') {
        notify(`Payment executed for ${mandateId}! Payment ID: ${res.payment_id}`, 'success');
      } else {
        notify(`Mandate deferred: ${res.reason}. Next window: ${res.next_window_ist}`, 'warning');
      }
      loadData();
    } catch (e) {
      notify(`Mandate execution error: ${e.message}`, 'danger');
    }
  };

  const handleChaseInvoice = async (invoiceId, medium) => {
    try {
      const res = await chaseInvoice(invoiceId, medium);
      notify(`Escalation reminder dispatched via ${res.medium.toUpperCase()} for ${invoiceId}!`, 'success');
      loadData();
    } catch (e) {
      notify(`Invoice chaser dispatch error: ${e.message}`, 'danger');
    }
  };

  const handleCreatePromise = async (payload) => {
    try {
      const res = await createPromise(payload);
      notify(`Promise logged for ${res.customer_name}! Due: ${res.promised_date}`, 'success');
      loadData();
    } catch (e) {
      notify(`Promise creation error: ${e.message}`, 'danger');
    }
  };

  const handleRemindPromise = async (promiseId) => {
    try {
      const res = await remindPromise(promiseId);
      if (res.status === 'ESCALATED') {
        notify(`⚠️ Promise broken by customer. Escalated to merchant!`, 'warning');
      } else {
        notify(`Polite reminder dispatched for ${promiseId}!`, 'success');
      }
      loadData();
    } catch (e) {
      notify(`Reminder error: ${e.message}`, 'danger');
    }
  };

  const handleFulfillPromise = async (promiseId) => {
    try {
      const res = await fulfillPromise(promiseId);
      notify(`Promise ${promiseId} marked as FULFILLED!`, 'success');
      loadData();
    } catch (e) {
      notify(`Fulfillment error: ${e.message}`, 'danger');
    }
  };

  return (
    <DashboardLayout 
      activeNav={activeNav} 
      onNavChange={setActiveNav}
      isPaused={isPaused}
      onTogglePause={handleTogglePause}
    >
      {/* Toast Alert */}
      {notification && (
        <div className={`alert alert-${notification.type} alert-dismissible fade show d-flex justify-content-between align-items-center mb-4`} role="alert">
          <span>{notification.message}</span>
          <button type="button" className="btn-close" onClick={() => setNotification(null)}></button>
        </div>
      )}

      <MetricsRow
        metrics={metrics}
        onFilterClick={filter => {
          setStatusFilter(filter);
          setActiveNav('dashboard');
        }}
      />

      {activeNav === 'dashboard' && (
        <DashboardView
          metrics={metrics}
          transactions={transactions}
          onRecoverClick={txn => setModalTxn(txn)}
          onBatchRecover={handleBatchRecover}
          selectedIds={selectedIds}
          onToggleSelect={handleToggleSelect}
          onSelectAll={handleSelectAll}
          searchQuery={searchQuery}
          onSearchChange={setSearchQuery}
          statusFilter={statusFilter}
          onStatusFilterChange={setStatusFilter}
          batchLoading={batchLoading}
        />
      )}

      {activeNav === 'recovered' && (
        <TransactionTable
          transactions={transactions.filter(t => t.is_recovered)}
          onRecoverClick={txn => setModalTxn(txn)}
          onBatchRecover={handleBatchRecover}
          selectedIds={selectedIds}
          onToggleSelect={handleToggleSelect}
          onSelectAll={handleSelectAll}
          searchQuery={searchQuery}
          onSearchChange={setSearchQuery}
          statusFilter="recovered"
          onStatusFilterChange={setStatusFilter}
          batchLoading={batchLoading}
        />
      )}

      {activeNav === 'shadow' && (
        <ShadowModePanel data={shadowData} />
      )}

      {activeNav === 'mandates' && (
        <MandateSequencerCard mandateData={mandateData} onRetry={handleRetryMandate} />
      )}

      {activeNav === 'b2b' && (
        <B2BInvoiceChaserCard chaserData={chaserData} onChase={handleChaseInvoice} />
      )}

      {activeNav === 'voice' && (
        <VoiceRecoveryCard />
      )}

      {activeNav === 'promises' && (
        <PromiseTrackerCard
          promiseData={promiseData}
          onCreate={handleCreatePromise}
          onRemind={handleRemindPromise}
          onFulfill={handleFulfillPromise}
        />
      )}

      {activeNav === 'audit' && (
        <AuditTimeline />
      )}

      <RecoveryModal
        show={Boolean(modalTxn)}
        txn={modalTxn}
        onHide={() => setModalTxn(null)}
        onConfirm={handleConfirmRecovery}
      />

      <AssistantPanel onRecoveryCompleted={loadData} />
    </DashboardLayout>
  );
};

export default App;
