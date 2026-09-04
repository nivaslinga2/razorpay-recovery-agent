import React, { useState } from 'react';
import { AppSidebar } from './AppSidebar';
import { AppHeader } from './AppHeader';

export const DashboardLayout = ({
  children,
  activeNav = 'dashboard',
  onNavChange,
  isPaused = false,
  onTogglePause
}) => {
  const [collapsed, setCollapsed] = useState(false);

  return (
    <div className="d-flex vh-100 overflow-hidden" style={{ backgroundColor: '#F8FAFC' }}>
      <AppSidebar
        collapsed={collapsed}
        activeNav={activeNav}
        onNavChange={onNavChange}
        isPaused={isPaused}
        onTogglePause={onTogglePause}
      />

      <div className="d-flex flex-column flex-grow-1 h-100 overflow-hidden" style={{ minWidth: 0 }}>
        <AppHeader
          collapsed={collapsed}
          onToggleCollapse={() => setCollapsed(!collapsed)}
        />

        {isPaused && (
          <div className="bg-danger text-white py-2 px-4 d-flex justify-content-between align-items-center fw-bold small shadow-sm border-bottom border-warning flex-shrink-0">
            <div className="d-flex align-items-center gap-2">
              <i className="bi bi-exclamation-octagon-fill fs-5"></i>
              <span>CIRCUIT BREAKER ENGAGED: Global Kill Switch active. All recovery workers and payment link dispatches are halted.</span>
            </div>
            <button className="btn btn-sm btn-light fw-bold py-0 px-3 text-danger" onClick={onTogglePause}>
              Resume System
            </button>
          </div>
        )}

        <main className="flex-grow-1 p-4 overflow-auto" style={{ backgroundColor: '#FFFFFF' }}>
          {children}
        </main>
      </div>
    </div>
  );
};

export default DashboardLayout;
