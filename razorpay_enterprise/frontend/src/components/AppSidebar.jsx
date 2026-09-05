import React from 'react';

const PayResQIcon = ({ size = 26 }) => (
  <svg width={size} height={size} viewBox="0 0 24 24" fill="none" xmlns="http://www.w3.org/2000/svg">
    <path d="M14.5 2H6L2.5 13.5H9.5L6.5 22L19.5 9.5H12L14.5 2Z" fill="url(#payresqGrad)" />
    <defs>
      <linearGradient id="payresqGrad" x1="2.5" y1="2" x2="19.5" y2="22" gradientUnits="userSpaceOnUse">
        <stop stopColor="#0C6BF5" />
        <stop offset="1" stopColor="#00A37A" />
      </linearGradient>
    </defs>
  </svg>
);

export const AppSidebar = ({
  collapsed,
  activeNav,
  onNavChange,
  isPaused,
  onTogglePause
}) => {
  const navItems = [
    { id: 'dashboard', label: 'Dashboard', icon: 'bi-speedometer2' },
    { id: 'shadow', label: 'Shadow Mode (A/B)', icon: 'bi-shield-shaded' },
    { id: 'mandates', label: 'Mandate Sequencer', icon: 'bi-calendar2-week-fill' },
    { id: 'b2b', label: 'B2B Receivables', icon: 'bi-receipt-cutoff' },
    { id: 'voice', label: 'Voice Recovery', icon: 'bi-telephone-outbound-fill' },
    { id: 'promises', label: 'Promise-to-Pay', icon: 'bi-calendar-check-fill' },
    { id: 'audit', label: 'Audit Trail', icon: 'bi-clock-history' },
  ];

  return (
    <aside
      className={`app-sidebar d-flex flex-column ${collapsed ? 'collapsed' : ''}`}
      style={{ backgroundColor: '#FFFFFF', borderRight: '1px solid #E2E8F0' }}
    >
      <div
        className="d-flex align-items-center gap-2 p-3 border-bottom flex-shrink-0"
        style={{ minHeight: '68px', borderColor: '#E2E8F0' }}
      >
        <div
          className="d-flex align-items-center justify-content-center p-2 rounded"
          style={{ backgroundColor: 'rgba(12, 107, 245, 0.08)', border: '1px solid rgba(12, 107, 245, 0.2)' }}
        >
          <PayResQIcon size={24} />
        </div>
        {!collapsed && (
          <div>
            <span className="fw-bolder fs-5 tracking-tight text-dark d-block" style={{ letterSpacing: '-0.3px', color: '#000000' }}>
              PayResQ
            </span>
            <span
              className="small fw-semibold text-uppercase d-block"
              style={{ fontSize: '9px', letterSpacing: '0.8px', color: '#64748B' }}
            >
              Revenue Recovery Console
            </span>
          </div>
        )}
      </div>

      <div className="flex-grow-1 py-3 overflow-auto">
        <div
          className="small fw-bold px-3 mb-2 text-uppercase"
          style={{ fontSize: '11px', color: '#64748B', display: collapsed ? 'none' : 'block', letterSpacing: '0.8px' }}
        >
          Recovery Operations
        </div>
        {navItems.map(item => (
          <div
            key={item.id}
            className={`sidebar-nav-item ${activeNav === item.id ? 'active' : ''}`}
            onClick={() => onNavChange && onNavChange(item.id)}
            title={collapsed ? item.label : ''}
          >
            <i className={`bi ${item.icon} fs-5`}></i>
            {!collapsed && (
              <span className="flex-grow-1">{item.label}</span>
            )}
          </div>
        ))}
      </div>

      {onTogglePause && (
        <div className="p-3 border-top flex-shrink-0" style={{ borderColor: '#E2E8F0', backgroundColor: '#FFFFFF' }}>
          <button
            className={`btn w-100 fw-bold d-flex align-items-center justify-content-center gap-2 ${
              isPaused ? 'btn-danger shadow' : 'btn-outline-danger'
            }`}
            style={{
              borderRadius: '8px',
              fontSize: collapsed ? '14px' : '13px',
              transition: 'all 0.2s ease',
              padding: collapsed ? '8px 0' : '8px 12px'
            }}
            onClick={onTogglePause}
            title={isPaused ? 'Circuit Breaker Engaged: Click to Resume System' : 'Emergency Stop: Halt all recoveries immediately'}
          >
            {isPaused ? (
              <>
                <span className="spinner-grow spinner-grow-sm" role="status"></span>
                <i className="bi bi-play-circle-fill fs-5"></i>
                {!collapsed && <span>Resume System</span>}
              </>
            ) : (
              <>
                <i className="bi bi-stop-circle-fill fs-5"></i>
                {!collapsed && <span>Emergency Stop</span>}
              </>
            )}
          </button>
        </div>
      )}
    </aside>
  );
};

export default AppSidebar;
