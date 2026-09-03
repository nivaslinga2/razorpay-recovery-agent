import React, { useState, useEffect } from 'react';

export const DashboardLayout = ({ children, activeNav = 'dashboard', onNavChange, isPaused = false, onTogglePause }) => {
  const [collapsed, setCollapsed] = useState(false);
  const [darkMode, setDarkMode] = useState(true);

  useEffect(() => {
    document.documentElement.setAttribute('data-bs-theme', darkMode ? 'dark' : 'light');
    document.body.style.backgroundColor = darkMode ? '#0b1426' : '#f8f9fa';
  }, [darkMode]);

  const navItems = [
    { id: 'dashboard', label: 'Dashboard', icon: 'bi-speedometer2' },
    { id: 'at-risk', label: 'At-Risk Transactions', icon: 'bi-exclamation-triangle-fill', badge: 'Active' },
    { id: 'recovered', label: 'Recovered Cases', icon: 'bi-check-circle-fill' },
    { id: 'shadow', label: 'Shadow Mode (A/B)', icon: 'bi-shield-shaded', badge: '+22%' },
    { id: 'mandates', label: 'Mandate Sequencer', icon: 'bi-calendar2-week-fill', badge: 'Autopay' },
    { id: 'b2b', label: 'B2B Receivables', icon: 'bi-receipt-cutoff', badge: 'Chaser' },
    { id: 'voice', label: 'Voice Recovery', icon: 'bi-telephone-outbound-fill', badge: 'AI Voice' },
    { id: 'promises', label: 'Promise-to-Pay', icon: 'bi-calendar-check-fill', badge: 'PTP Tracker' },
    { id: 'audit', label: 'Audit Trail', icon: 'bi-clock-history' },
  ];

  return (
    <div className="d-flex min-vh-100" style={{ backgroundColor: darkMode ? '#0b1426' : '#f8f9fa' }}>
      {/* PayResQ Sidebar */}
      <aside className={`app-sidebar d-flex flex-column ${collapsed ? 'collapsed' : ''}`}>
        {/* Brand Logo Header */}
        <div className="d-flex align-items-center gap-2 p-3 border-bottom border-secondary border-opacity-25" style={{ minHeight: '65px' }}>
          <span className="fs-3 text-primary">💰</span>
          {!collapsed && (
            <div>
              <span className="fw-black text-white fs-5 tracking-wide d-block font-monospace">PayResQ</span>
              <span className="text-info small fw-bold text-uppercase d-block" style={{ fontSize: '10px', letterSpacing: '1px' }}>
                Razorpay Recovery
              </span>
            </div>
          )}
        </div>

        {/* Sidebar Menu */}
        <div className="flex-grow-1 py-3">
          <div className="text-secondary small fw-bold px-3 mb-2 text-uppercase" style={{ fontSize: '11px', display: collapsed ? 'none' : 'block' }}>
            Operations Suite
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
                <div className="d-flex justify-content-between align-items-center flex-grow-1">
                  <span>{item.label}</span>
                  {item.badge && <span className="badge bg-danger ms-2">{item.badge}</span>}
                </div>
              )}
            </div>
          ))}
        </div>

        {/* Merchant info footer */}
        {!collapsed && (
          <div className="p-3 border-top border-secondary border-opacity-25 bg-dark bg-opacity-25">
            <div className="d-flex align-items-center gap-2">
              <div className="rounded-circle bg-primary text-white d-flex align-items-center justify-content-center fw-bold" style={{ width: '32px', height: '32px' }}>
                RZ
              </div>
              <div className="small">
                <div className="fw-bold text-white">Razorpay Enterprise</div>
                <div className="text-muted" style={{ fontSize: '11px' }}>merch_flagship_001</div>
              </div>
            </div>
          </div>
        )}
      </aside>

      {/* Main Wrapper */}
      <div className="d-flex flex-column flex-grow-1" style={{ minWidth: 0 }}>
        {/* Top Navbar */}
        <header className="navbar navbar-expand px-4 py-2 border-bottom shadow-sm" style={{ backgroundColor: darkMode ? '#0c1a30' : '#ffffff', borderColor: '#1e3a5f' }}>
          <div className="d-flex align-items-center gap-3">
            <button
              className="btn btn-sm btn-outline-secondary border-0 text-white"
              onClick={() => setCollapsed(!collapsed)}
              title="Toggle Sidebar"
            >
              <i className="bi bi-list fs-4"></i>
            </button>
            <span className="navbar-brand mb-0 h1 fw-bold text-white d-none d-md-block fs-5">
              💰 PayResQ Live Operations Console
            </span>
          </div>

          <div className="d-flex align-items-center gap-3 ms-auto">
            {/* Challenge 3: Global Kill Switch / Emergency Stop Button */}
            {onTogglePause && (
              <button
                className={`btn btn-sm fw-bold d-flex align-items-center gap-2 ${isPaused ? 'btn-danger shadow' : 'btn-outline-danger'}`}
                onClick={onTogglePause}
                title={isPaused ? 'Circuit Breaker Engaged: Click to Resume System' : 'Emergency Stop: Halt all recoveries immediately'}
              >
                {isPaused ? (
                  <>
                    <span className="spinner-grow spinner-grow-sm" role="status"></span>
                    <i className="bi bi-play-circle-fill"></i>
                    <span>Resume System</span>
                  </>
                ) : (
                  <>
                    <i className="bi bi-stop-circle-fill"></i>
                    <span>Emergency Stop</span>
                  </>
                )}
              </button>
            )}

            {/* Live System Health Badge */}
            <div className="d-flex align-items-center gap-2 px-3 py-1 rounded-pill border border-secondary border-opacity-50 small text-white bg-dark bg-opacity-50">
              <span className={`live-pulse-node ${isPaused ? 'bg-danger' : ''}`} style={isPaused ? { backgroundColor: '#EF4444', animation: 'none' } : {}}></span>
              <span className="fw-bold small">{isPaused ? 'API: PAUSED' : 'API + Celery: Online'}</span>
            </div>

            {/* Dark/Light Mode Toggle */}
            <button
              className="btn btn-sm btn-outline-secondary rounded-circle d-flex align-items-center justify-content-center text-white"
              style={{ width: '34px', height: '34px' }}
              onClick={() => setDarkMode(!darkMode)}
              title={`Switch to ${darkMode ? 'Light' : 'Dark'} Mode`}
            >
              <i className={`bi bi-${darkMode ? 'sun-fill text-warning' : 'moon-stars-fill'}`}></i>
            </button>
          </div>
        </header>

        {/* Global Circuit Breaker Amber/Red Alert Banner */}
        {isPaused && (
          <div className="bg-danger text-white py-2 px-4 d-flex justify-content-between align-items-center fw-bold small shadow-sm border-bottom border-warning">
            <div className="d-flex align-items-center gap-2">
              <i className="bi bi-exclamation-octagon-fill fs-5"></i>
              <span>🛑 CIRCUIT BREAKER ENGAGED: Global Kill Switch active. All recovery workers and payment link dispatches are halted.</span>
            </div>
            <button className="btn btn-sm btn-light fw-bold py-0 px-3 text-danger" onClick={onTogglePause}>
              Resume System
            </button>
          </div>
        )}

        {/* Content Body */}
        <div className="flex-grow-1 p-4" style={{ overflowY: 'auto' }}>
          {children}
        </div>
      </div>
    </div>
  );
};
