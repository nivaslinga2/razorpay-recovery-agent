import axios from 'axios';

const API_URL = 'http://localhost:8000/api';

export interface Transaction {
  id: string;
  merchant_id?: string;
  amount: number;
  status: string;
  is_recovered: boolean;
  recovered_at?: string | null;
  error_code?: string;
  customer_email?: string;
  bank_rrn?: string;
  recovery_attempts?: number;
  created_at?: string;
}

export interface MetricTimelinePoint {
  time: string;
  recovered: number;
  at_risk: number;
}

export interface SystemMetrics {
  total_risk: number;
  recovered_today: number;
  total_recovered: number;
  avg_llm_latency_ms: number;
  total_llm_cost: number;
  roi_multiple: number;
  timeline: MetricTimelinePoint[];
}

export interface TransactionDetail extends Transaction {
  diagnosis?: {
    root_cause: string;
    recovery_action: string;
    hinglish_message: string;
  };
  recovery_link?: string | null;
}

// 1. Fetch transactions with search and status filtering
export const fetchAtRisk = async (search?: string, status: string = 'pending'): Promise<Transaction[]> => {
  const params: any = { status };
  if (search) params.search = search;
  const res = await axios.get(`${API_URL}/transactions/at-risk`, { params });
  return res.data;
};

// 2. Fetch deep details with AI diagnosis for a transaction
export const fetchTransactionDetails = async (txnId: string): Promise<TransactionDetail> => {
  const res = await axios.get(`${API_URL}/transactions/${txnId}`);
  return res.data;
};

// 3. Trigger single recovery (returns task_id and direct link)
export const triggerRecovery = async (txnId: string): Promise<{ task_id: string; link?: string }> => {
  const res = await axios.post(`${API_URL}/recover`, { transaction_id: txnId });
  return res.data;
};

// 4. Trigger high-speed batch recovery for multiple transactions
export const triggerBatchRecovery = async (txnIds: string[]): Promise<{
  total: number;
  successful: number;
  failed: number;
  results: Array<{ id: string; status: string; link?: string; error?: string }>;
}> => {
  const res = await axios.post(`${API_URL}/recover/batch`, { transaction_ids: txnIds });
  return res.data;
};

// 5. Poll for recovery status
export const getRecoveryStatus = async (taskId: string): Promise<any> => {
  const res = await axios.get(`${API_URL}/task-status/${taskId}`);
  return res.data;
};

// 6. Fetch CTO/CEO Observability Metrics
export const fetchMetrics = async (): Promise<SystemMetrics> => {
  const res = await axios.get(`${API_URL}/metrics`);
  return res.data;
};
