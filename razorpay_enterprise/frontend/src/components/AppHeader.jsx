import React from 'react';
import { AuthManager } from './AuthManager';

export const AppHeader = ({ collapsed, onToggleCollapse }) => {
  return (
    <header
      className="navbar navbar-expand px-4 py-2 border-bottom shadow-sm flex-shrink-0"
      style={{ backgroundColor: '#FFFFFF', borderColor: '#E2E8F0' }}
    >
      <div className="d-flex align-items-center gap-3">
        <button
          className="btn btn-sm btn-outline-secondary border-0 text-dark"
          onClick={onToggleCollapse}
          title="Toggle Sidebar"
        >
          <i className="bi bi-list fs-4"></i>
        </button>
        <div className="d-flex align-items-center gap-2 d-none d-md-flex">
          <span className="navbar-brand mb-0 h1 fw-bold fs-5" style={{ color: '#000000' }}>
            PayResQ Operations Console
          </span>
        </div>
      </div>

      <div className="d-flex align-items-center gap-3 ms-auto">
        <AuthManager />
      </div>
    </header>
  );
};

export default AppHeader;
