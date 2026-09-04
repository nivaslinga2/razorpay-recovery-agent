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
      <i className={`bi ${icon} ${bgBadge} text-white`}></i>
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
  const defaultItems = [
    {
      time: "Just Now",
      icon: "bi-check-circle-fill",
      theme: "success",
      header: "Payment Link Generated & Recovered",
      body: "Recovered ₹34,172 from customer_6@example.com via Payment Link API (Short URL: https://rzp.io/rzp/j3FBR1ay). State updated with FOR UPDATE row lock.",
      footer: "Approver: Merchant UI • Gateway Latency: 320ms"
    },
    {
      time: "5 mins ago",
      icon: "bi-shield-check",
      theme: "info",
      header: "HMAC Webhook Cryptographically Verified",
      body: "Received event payment.failed for pay_webhook_test_9999. HMAC SHA-256 signature authenticated against system secret.",
      footer: "Ingress: /webhooks • Celery Worker: Queued"
    },
    {
      time: "12 mins ago",
      icon: "bi-hourglass-split",
      theme: "warning",
      header: "Automated Root-Cause Diagnosis",
      body: "Classified error CARD_DECLINED for txn_ent_0006. Router formulated recovery message: 'Aapka card bank ne decline kiya...'",
      footer: "Diagnosis Engine • Latency: 42ms"
    },
    {
      time: "25 mins ago",
      icon: "bi-x-circle-fill",
      theme: "danger",
      header: "Bank Gateway Decline Logged",
      body: "Bank declined transaction txn_ent_0042 (₹14,901) due to BANK_INSUFFICIENT_FUNDS. Added to active At-Risk recovery pool.",
      footer: "Bank RRN: RRN62604366 • Status: Pending"
    }
  ];

  const displayList = items.length > 0 ? items : defaultItems;

  return (
    <div className="card shadow-sm mb-4" style={{ backgroundColor: '#FFFFFF', borderColor: '#E2E8F0' }}>
      <div className="card-header d-flex justify-content-between align-items-center py-3" 
           style={{ borderBottom: '1px solid #E2E8F0', backgroundColor: '#FFFFFF' }}>
        <div className="d-flex align-items-center gap-2">
          <div className="p-1 px-2 rounded" style={{ backgroundColor: 'rgba(12, 107, 245, 0.08)' }}>
            <i className="bi bi-clock-history text-primary fs-5"></i>
          </div>
          <h3 className="card-title fs-5 fw-bold mb-0" style={{ color: '#000000' }}>Immutable Audit Trail</h3>
        </div>
        <span className="badge px-3 py-2 fw-bold" style={{ backgroundColor: '#ECFDF5', color: '#059669', border: '1px solid #A7F3D0' }}>
          <i className="bi bi-shield-check me-1"></i>Human-in-the-Loop Log
        </span>
      </div>

      <div className="card-body p-4">
        <div className="timeline">
          <div className="time-label mb-3">
            <span className="timeline-time-label">
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
            <i className="bi bi-clock text-white" style={{ backgroundColor: '#94A3B8' }}></i>
          </div>
        </div>
      </div>
    </div>
  );
};
