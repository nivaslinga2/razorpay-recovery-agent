import axios from 'axios';

const API_URL = 'http://localhost:8000/api';

// 1. Fetch transactions with search and status filtering
export const fetchAtRisk = async (search, status = 'pending') => {
  const params = { status };
  if (search) params.search = search;
  const res = await axios.get(`${API_URL}/transactions/at-risk`, { params });
  return res.data;
};

// 2. Fetch deep details with AI diagnosis for a transaction
export const fetchTransactionDetails = async (txnId) => {
  const res = await axios.get(`${API_URL}/transactions/${txnId}`);
  return res.data;
};

// 3. Trigger single recovery (returns task_id and direct link)
export const triggerRecovery = async (txnId) => {
  const res = await axios.post(`${API_URL}/recover`, { transaction_id: txnId });
  return res.data;
};

// 4. Trigger high-speed batch recovery for multiple transactions
export const triggerBatchRecovery = async (txnIds) => {
  const res = await axios.post(`${API_URL}/recover/batch`, { transaction_ids: txnIds });
  return res.data;
};

// 5. Poll for recovery status
export const getRecoveryStatus = async (taskId) => {
  const res = await axios.get(`${API_URL}/task-status/${taskId}`);
  return res.data;
};

// 6. Fetch CTO/CEO Observability Metrics
export const fetchMetrics = async () => {
  const res = await axios.get(`${API_URL}/metrics`);
  return res.data;
};

// 7. Fetch Challenge 2: Shadow Mode (Champion vs Challenger) Metrics
export const fetchShadowMetrics = async () => {
  const res = await axios.get(`${API_URL}/shadow/metrics`);
  return res.data;
};

// 8. Challenge 3: Global Kill Switch & Dynamic Rules
export const fetchSystemConfig = async () => {
  const res = await axios.get(`${API_URL}/system/config`);
  return res.data;
};

export const pauseSystem = async () => {
  const res = await axios.post(`${API_URL}/system/pause`);
  return res.data;
};

export const resumeSystem = async () => {
  const res = await axios.post(`${API_URL}/system/resume`);
  return res.data;
};

// 9. Feature 1: Failed-Subscription Recovery
export const recoverSubscription = async (subscriptionId, customerId, email) => {
  const res = await axios.post(`${API_URL}/subscriptions/recover`, {
    subscription_id: subscriptionId,
    customer_id: customerId,
    email: email
  });
  return res.data;
};

// 10. Feature 2: Mandate Retry Sequencer
export const fetchMandateStatus = async () => {
  const res = await axios.get(`${API_URL}/mandates/status`);
  return res.data;
};

export const retryMandate = async (mandateId, force = false) => {
  const res = await axios.post(`${API_URL}/mandates/retry`, {
    mandate_id: mandateId,
    force: force
  });
  return res.data;
};

// 11. Feature 3: B2B Receivables Chaser
export const fetchInvoicesChaser = async () => {
  const res = await axios.get(`${API_URL}/invoices/chaser`);
  return res.data;
};

export const chaseInvoice = async (invoiceId, medium = null, forceStage = null) => {
  const res = await axios.post(`${API_URL}/invoices/chase`, {
    invoice_id: invoiceId,
    medium: medium,
    force_stage: forceStage
  });
  return res.data;
};

// 12. Feature 4: Hinglish Voice Recovery
export const previewVoice = async (hinglishText) => {
  const res = await axios.post(`${API_URL}/voice/preview`, {
    hinglish_text: hinglishText
  });
  return res.data;
};

export const dispatchVoiceCall = async (customerPhone, hinglishText, txnId = null) => {
  const res = await axios.post(`${API_URL}/voice/call`, {
    customer_phone: customerPhone,
    hinglish_text: hinglishText,
    txn_id: txnId
  });
  return res.data;
};

// 13. Feature 5: Promise-to-Pay Tracker
export const fetchPromises = async () => {
  const res = await axios.get(`${API_URL}/promises`);
  return res.data;
};

export const createPromise = async (promisePayload) => {
  const res = await axios.post(`${API_URL}/promise`, promisePayload);
  return res.data;
};

export const remindPromise = async (promiseId) => {
  const res = await axios.post(`${API_URL}/promise/remind`, {
    promise_id: promiseId
  });
  return res.data;
};

export const fulfillPromise = async (promiseId) => {
  const res = await axios.post(`${API_URL}/promise/fulfill`, {
    promise_id: promiseId
  });
  return res.data;
};






