-- PayResQ Enterprise - Supabase PostgreSQL Schema
-- You can run this in the Supabase SQL Editor (optional, backend auto-creates these tables on startup)

CREATE TABLE IF NOT EXISTS transactions (
    id VARCHAR PRIMARY KEY,
    merchant_id VARCHAR NOT NULL,
    customer_email VARCHAR NOT NULL,
    amount INTEGER NOT NULL,
    status VARCHAR NOT NULL,
    error_code VARCHAR,
    bank_rrn VARCHAR,
    created_at TIMESTAMP WITHOUT TIME ZONE DEFAULT CURRENT_TIMESTAMP,
    is_recovered BOOLEAN DEFAULT FALSE,
    recovered_at TIMESTAMP WITHOUT TIME ZONE,
    recovery_attempts INTEGER DEFAULT 0,
    last_recovery_error TEXT,
    llm_cost_inr DOUBLE PRECISION DEFAULT 0.0
);

CREATE INDEX IF NOT EXISTS ix_transactions_id ON transactions (id);

CREATE TABLE IF NOT EXISTS system_config (
    key VARCHAR PRIMARY KEY,
    value TEXT NOT NULL,
    updated_at TIMESTAMP WITHOUT TIME ZONE DEFAULT CURRENT_TIMESTAMP
);

CREATE INDEX IF NOT EXISTS ix_system_config_key ON system_config (key);

CREATE TABLE IF NOT EXISTS webhook_events (
    id SERIAL PRIMARY KEY,
    event_id VARCHAR(255) UNIQUE NOT NULL,
    event_type VARCHAR(100),
    processed_at TIMESTAMP WITHOUT TIME ZONE DEFAULT CURRENT_TIMESTAMP
);

CREATE INDEX IF NOT EXISTS ix_webhook_events_id ON webhook_events (id);
CREATE INDEX IF NOT EXISTS ix_webhook_events_event_id ON webhook_events (event_id);

CREATE TABLE IF NOT EXISTS promise_records (
    promise_id VARCHAR PRIMARY KEY,
    customer_id VARCHAR NOT NULL,
    customer_name VARCHAR NOT NULL,
    customer_email VARCHAR NOT NULL,
    customer_phone VARCHAR,
    amount INTEGER NOT NULL,
    promised_date TIMESTAMP WITHOUT TIME ZONE NOT NULL,
    status VARCHAR DEFAULT 'PENDING',
    reminders_sent INTEGER DEFAULT 0,
    notes TEXT,
    fulfilled_at TIMESTAMP WITHOUT TIME ZONE,
    created_at TIMESTAMP WITHOUT TIME ZONE DEFAULT CURRENT_TIMESTAMP
);

CREATE INDEX IF NOT EXISTS ix_promise_records_promise_id ON promise_records (promise_id);
CREATE INDEX IF NOT EXISTS ix_promise_records_customer_id ON promise_records (customer_id);

CREATE TABLE IF NOT EXISTS mandate_records (
    mandate_id VARCHAR PRIMARY KEY,
    customer_id VARCHAR NOT NULL,
    token_id VARCHAR NOT NULL,
    amount INTEGER NOT NULL,
    retry_count INTEGER DEFAULT 0,
    max_retries INTEGER DEFAULT 3,
    status VARCHAR DEFAULT 'PENDING',
    last_attempt TIMESTAMP WITHOUT TIME ZONE,
    next_scheduled_retry TIMESTAMP WITHOUT TIME ZONE,
    last_reason VARCHAR,
    created_at TIMESTAMP WITHOUT TIME ZONE DEFAULT CURRENT_TIMESTAMP
);

CREATE INDEX IF NOT EXISTS ix_mandate_records_mandate_id ON mandate_records (mandate_id);

CREATE TABLE IF NOT EXISTS b2b_invoices (
    invoice_id VARCHAR PRIMARY KEY,
    customer_name VARCHAR NOT NULL,
    customer_email VARCHAR NOT NULL,
    customer_phone VARCHAR,
    amount INTEGER NOT NULL,
    status VARCHAR DEFAULT 'issued',
    due_date TIMESTAMP WITHOUT TIME ZONE NOT NULL,
    reminders_sent JSONB DEFAULT '{}'::jsonb,
    last_chased_at TIMESTAMP WITHOUT TIME ZONE,
    last_medium_used VARCHAR,
    short_url VARCHAR,
    created_at TIMESTAMP WITHOUT TIME ZONE DEFAULT CURRENT_TIMESTAMP
);

CREATE INDEX IF NOT EXISTS ix_b2b_invoices_invoice_id ON b2b_invoices (invoice_id);

CREATE TABLE IF NOT EXISTS dead_letter_queue (
    id SERIAL PRIMARY KEY,
    task_name VARCHAR(255) NOT NULL,
    task_id VARCHAR(255),
    args TEXT,
    kwargs TEXT,
    error TEXT,
    traceback TEXT,
    status VARCHAR(50) DEFAULT 'unresolved',
    created_at TIMESTAMP WITHOUT TIME ZONE DEFAULT CURRENT_TIMESTAMP,
    resolved_at TIMESTAMP WITHOUT TIME ZONE
);

CREATE INDEX IF NOT EXISTS ix_dead_letter_queue_id ON dead_letter_queue (id);
CREATE INDEX IF NOT EXISTS ix_dead_letter_queue_task_name ON dead_letter_queue (task_name);
CREATE INDEX IF NOT EXISTS ix_dead_letter_queue_task_id ON dead_letter_queue (task_id);
CREATE INDEX IF NOT EXISTS ix_dead_letter_queue_status ON dead_letter_queue (status);

CREATE TABLE IF NOT EXISTS pending_sync (
    id SERIAL PRIMARY KEY,
    transaction_id VARCHAR(255) NOT NULL,
    razorpay_link TEXT,
    error TEXT,
    status VARCHAR(50) DEFAULT 'pending',
    created_at TIMESTAMP WITHOUT TIME ZONE DEFAULT CURRENT_TIMESTAMP,
    retried_at TIMESTAMP WITHOUT TIME ZONE,
    retry_count INTEGER DEFAULT 0
);

CREATE INDEX IF NOT EXISTS ix_pending_sync_id ON pending_sync (id);
CREATE INDEX IF NOT EXISTS ix_pending_sync_transaction_id ON pending_sync (transaction_id);
CREATE INDEX IF NOT EXISTS ix_pending_sync_status ON pending_sync (status);

CREATE TABLE IF NOT EXISTS shadow_audit (
    id SERIAL PRIMARY KEY,
    transaction_id VARCHAR(255) NOT NULL,
    champion_action VARCHAR(100),
    challenger_action VARCHAR(100),
    champion_diagnosis VARCHAR(255),
    challenger_diagnosis VARCHAR(255),
    amount INTEGER DEFAULT 0,
    hypothetical_recovered DOUBLE PRECISION DEFAULT 0.0,
    confidence DOUBLE PRECISION DEFAULT 0.0,
    would_recover BOOLEAN DEFAULT TRUE,
    created_at TIMESTAMP WITHOUT TIME ZONE DEFAULT CURRENT_TIMESTAMP
);

CREATE INDEX IF NOT EXISTS ix_shadow_audit_id ON shadow_audit (id);
CREATE INDEX IF NOT EXISTS ix_shadow_audit_transaction_id ON shadow_audit (transaction_id);

-- Initial default system configuration
INSERT INTO system_config (key, value, updated_at)
VALUES 
    ('is_paused', 'false', CURRENT_TIMESTAMP),
    ('max_retry_count', '3', CURRENT_TIMESTAMP)
ON CONFLICT (key) DO NOTHING;
