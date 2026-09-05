import axios from 'axios';

const RAW_URL = import.meta.env.VITE_API_URL || 'http://localhost:8000';
export const API_ORIGIN = RAW_URL.replace(/\/api\/?$/, '').replace(/\/$/, '');
export const API_BASE_URL = `${API_ORIGIN}/api`;

export const apiClient = axios.create({
  baseURL: API_BASE_URL,
});

apiClient.interceptors.request.use((config) => {
  const token = localStorage.getItem('auth_token') || 'demo-key';
  if (token) {
    config.headers.Authorization = `Bearer ${token}`;
  }
  return config;
});

export const generateAuthToken = async (merchantId = 'demo_merchant') => {
  const res = await axios.post(`${API_BASE_URL}/auth/token`, {
    merchant_id: merchantId,
    expiry_minutes: 120
  });
  if (res.data?.token) {
    localStorage.setItem('auth_token', res.data.token);
    localStorage.setItem('merchant_id', res.data.merchant_id);
  }
  return res.data;
};

export const fetchCurrentSession = async () => {
  const res = await apiClient.get('/auth/me');
  return res.data;
};

export const fetchAtRisk = async (search, status = 'pending') => {
  const params = { status };
  if (search) params.search = search;
  const res = await apiClient.get('/transactions/at-risk', { params });
  return res.data;
};

export const fetchTransactionDetails = async (txnId) => {
  const res = await apiClient.get(`/transactions/${txnId}`);
  return res.data;
};

export const triggerRecovery = async (txnId) => {
  const res = await apiClient.post('/recover', { transaction_id: txnId });
  return res.data;
};

export const triggerBatchRecovery = async (txnIds) => {
  const res = await apiClient.post('/recover/batch', { transaction_ids: txnIds });
  return res.data;
};

export const getRecoveryStatus = async (taskId) => {
  const res = await apiClient.get(`/task-status/${taskId}`);
  return res.data;
};

export const fetchMetrics = async () => {
  const res = await apiClient.get('/metrics');
  return res.data;
};

export const fetchShadowMetrics = async () => {
  const res = await apiClient.get('/shadow/metrics');
  return res.data;
};

export const fetchSystemConfig = async () => {
  const res = await apiClient.get('/system/config');
  return res.data;
};

export const pauseSystem = async () => {
  const res = await apiClient.post('/system/pause');
  return res.data;
};

export const resumeSystem = async () => {
  const res = await apiClient.post('/system/resume');
  return res.data;
};

export const recoverSubscription = async (subscriptionId, customerId, email) => {
  const res = await apiClient.post('/subscriptions/recover', {
    subscription_id: subscriptionId,
    customer_id: customerId,
    email: email
  });
  return res.data;
};

export const fetchMandateStatus = async () => {
  const res = await apiClient.get('/mandates/status');
  return res.data;
};

export const retryMandate = async (mandateId, force = false) => {
  const res = await apiClient.post('/mandates/retry', {
    mandate_id: mandateId,
    force: force
  });
  return res.data;
};

export const fetchInvoicesChaser = async () => {
  const res = await apiClient.get('/invoices/chaser');
  return res.data;
};

export const chaseInvoice = async (invoiceId, medium = null, forceStage = null) => {
  const res = await apiClient.post('/invoices/chase', {
    invoice_id: invoiceId,
    medium: medium,
    force_stage: forceStage
  });
  return res.data;
};

export const previewVoice = async (hinglishText) => {
  const res = await apiClient.post('/voice/preview', {
    hinglish_text: hinglishText
  });
  return res.data;
};

export const dispatchVoiceCall = async (customerPhone, hinglishText, txnId = null) => {
  const res = await apiClient.post('/voice/call', {
    customer_phone: customerPhone,
    hinglish_text: hinglishText,
    txn_id: txnId
  });
  return res.data;
};

export const fetchPromises = async () => {
  const res = await apiClient.get('/promises');
  return res.data;
};

export const createPromise = async (promisePayload) => {
  const res = await apiClient.post('/promise', promisePayload);
  return res.data;
};

export const remindPromise = async (promiseId) => {
  const res = await apiClient.post('/promise/remind', {
    promise_id: promiseId
  });
  return res.data;
};

export const fulfillPromise = async (promiseId) => {
  const res = await apiClient.post('/promise/fulfill', {
    promise_id: promiseId
  });
  return res.data;
};

export const queryAssistant = async (query) => {
  const res = await apiClient.post('/assistant', { query });
  return res.data;
};

export default apiClient;
