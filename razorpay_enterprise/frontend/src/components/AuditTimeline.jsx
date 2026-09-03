import React from 'react';

export const TimelineItem = ({ icon, theme = 'primary', time, header, children, footer }) => {
  const bgBadge = {
    success: 'bg-success',
    danger: 'bg-danger',
    warning: 'bg-warning',
    info: 'bg-info',
    primary: 'bg-primary'
  }[theme] || 'bg-primary';

  return (
    <div>
      <i className={`bi ${icon} ${bgBadge}`}></i>
      <div className="timeline-item shadow-sm">
        <span className="time"><i className="bi bi-clock me-1"></i>{time}</span>
        <h3 className="timeline-header">{header}</h3>
        <div className="timeline-body">{children}</div>
        {footer && <div className="timeline-footer">{footer}</div>}
      </div>
    </div>
  );
};

export const AuditTimeline = ({ items = [] }) => {
  // Default mock timeline items if none provided, ensuring immediate rich demonstration
  const defaultItems = [
    {
      time: "Just Now",
      icon: "bi-check-circle-fill",
      theme: "success",
      header: "Payment Link Generated & Recovered",
      body: "Recovered ₹34,172 from customer_6@example.com via Razorpay Payment Link API (Short URL: https://rzp.io/rzp/j3FBR1ay). State updated with FOR UPDATE lock.",
      footer: "Approver: Merchant UI • Latency: 320ms"
    },
    {
      time: "5 mins ago",
      icon: "bi-shield-check",
      theme: "info",
      header: "HMAC Webhook Verified",
      body: "Received event payment.failed for pay_webhook_test_9999. HMAC SHA-256 signature authenticated against RAZORPAY_KEY_SECRET.",
      footer: "Ingress: /webhooks/razorpay • Celery Task: Queued"
    },
    {
      time: "12 mins ago",
      icon: "bi-hourglass-split",
      theme: "warning",
      header: "AI Heuristic Root-Cause Diagnosis",
      body: "Classified error CARD_DECLINED for txn_ent_0006. Heuristic router formulated Hinglish SMS message: 'Aapka card bank ne decline kiya...'",
      footer: "Model: Groq Llama-3 (Fallback Heuristic Engine) • Cost: ₹0.0015"
    },
    {
      time: "25 mins ago",
      icon: "bi-x-circle-fill",
      theme: "danger",
      header: "Payment Gateway Decline Logged",
      body: "Bank declined transaction txn_ent_0042 (₹14,901) due to BANK_INSUFFICIENT_FUNDS. Added to active At-Risk recovery pool.",
      footer: "Bank RRN: RRN62604366 • Status: Pending"
    }
  ];

  const displayList = items.length > 0 ? items : defaultItems;

  return (
    <div className="card card-outline card-info shadow-sm mb-4" style={{ backgroundColor: '#0c2340', borderColor: '#1e3a5f' }}>
      <div className="card-header d-flex justify-content-between align-items-center py-3" style={{ borderBottom: '1px solid #1e3a5f' }}>
        <div className="d-flex align-items-center gap-2">
          <i className="bi bi-clock-history text-info fs-5"></i>
          <h3 className="card-title fs-5 fw-bold mb-0 text-white">Immutable Audit Trail</h3>
        </div>
        <span className="badge bg-info text-dark fw-bold">Human-in-the-Loop Log</span>
      </div>

      <div className="card-body p-4">
        <div className="timeline">
          <div className="time-label mb-3">
            <span className="timeline-time-label bg-primary text-white">
              <i className="bi bi-calendar-event me-1"></i>Today's Ledger Audit Events
            </span>
          </div>

          {displayList.map((item, idx) => (
            <TimelineItem
              key={idx}
              time={item.time}
              icon={item.icon}
              theme={item.theme}
              header={item.header}
              footer={item.footer}
            >
              {item.body}
            </TimelineItem>
          ))}

          <div>
            <i className="bi bi-clock bg-secondary text-white"></i>
          </div>
        </div>
      </div>
    </div>
  );
};
