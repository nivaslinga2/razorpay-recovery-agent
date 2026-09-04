import React, { useState, useEffect, useRef } from 'react';
import { generateAuthToken, fetchCurrentSession } from '../services/api';

export const AuthManager = () => {
  const [token, setToken] = useState(localStorage.getItem('auth_token'));
  const [merchantId, setMerchantId] = useState(localStorage.getItem('merchant_id') || 'merch_flagship_001');
  const [loading, setLoading] = useState(false);
  const [showDropdown, setShowDropdown] = useState(false);
  const [copied, setCopied] = useState(false);
  const dropdownRef = useRef(null);

  useEffect(() => {
    const stored = localStorage.getItem('auth_token');
    if (stored) {
      setToken(stored);
      fetchCurrentSession()
        .then(data => {
          if (data?.merchant_id) setMerchantId(data.merchant_id);
        })
        .catch(() => {
          // Token may be invalid
        });
    }
  }, []);

  // Close dropdown on click outside
  useEffect(() => {
    const handleClickOutside = (event) => {
      if (dropdownRef.current && !dropdownRef.current.contains(event.target)) {
        setShowDropdown(false);
      }
    };
    if (showDropdown) {
      document.addEventListener('mousedown', handleClickOutside);
    }
    return () => {
      document.removeEventListener('mousedown', handleClickOutside);
    };
  }, [showDropdown]);

  const handleGenerateToken = async (targetMerchant = 'merch_flagship_001') => {
    setLoading(true);
    try {
      const data = await generateAuthToken(targetMerchant);
      setToken(data.token);
      setMerchantId(data.merchant_id);
      setShowDropdown(false);
    } catch (err) {
      alert('Failed to generate token: ' + (err.response?.data?.detail || err.message));
    } finally {
      setLoading(false);
    }
  };

  const handleClearToken = () => {
    localStorage.removeItem('auth_token');
    localStorage.removeItem('merchant_id');
    setToken(null);
    setShowDropdown(false);
  };

  const handleCopy = () => {
    if (token) {
      navigator.clipboard.writeText(token);
      setCopied(true);
      setTimeout(() => setCopied(false), 2000);
    }
  };

  return (
    <div className="position-relative" ref={dropdownRef}>
      {/* Webpage Merchant Profile Trigger Button */}
      <div
        className="d-flex align-items-center gap-2 px-2 py-1 rounded-pill border shadow-sm"
        style={{
          cursor: 'pointer',
          backgroundColor: '#FFFFFF',
          borderColor: '#E2E8F0',
          transition: 'background-color 0.15s ease'
        }}
        onClick={() => setShowDropdown(!showDropdown)}
        title="Merchant Account Profile & Authentication Settings"
      >
        <div
          className="rounded-circle d-flex align-items-center justify-content-center text-white fw-bold shadow-sm"
          style={{
            width: '32px',
            height: '32px',
            background: 'linear-gradient(135deg, #0C6BF5 0%, #0082F6 100%)',
            fontSize: '11px',
            flexShrink: 0
          }}
        >
          PR
        </div>
        <div className="d-none d-sm-block text-start" style={{ lineHeight: '1.2' }}>
          <div className="fw-bold text-dark" style={{ fontSize: '12px', color: '#000000' }}>
            PayResQ Enterprise
          </div>
          <div className="text-muted" style={{ fontSize: '10px' }}>
            {merchantId}
          </div>
        </div>
        <i
          className={`bi bi-chevron-${showDropdown ? 'up' : 'down'} text-muted small ms-1`}
          style={{ fontSize: '11px' }}
        ></i>
      </div>

      {/* Profile Clicking Down Popover */}
      {showDropdown && (
        <div
          className="card shadow-lg position-absolute end-0 mt-2"
          style={{
            width: '330px',
            zIndex: 1060,
            borderRadius: '14px',
            backgroundColor: '#FFFFFF',
            borderColor: '#E2E8F0',
            boxShadow: '0 20px 40px -10px rgba(0, 0, 0, 0.18), 0 0 1px rgba(0, 0, 0, 0.1)',
            overflow: 'hidden'
          }}
        >
          {/* Profile Header */}
          <div className="p-3 border-bottom" style={{ backgroundColor: '#F8FAFC', borderColor: '#E2E8F0' }}>
            <div className="d-flex align-items-center gap-3">
              <div
                className="rounded-circle d-flex align-items-center justify-content-center text-white fw-bold shadow-sm"
                style={{
                  width: '44px',
                  height: '44px',
                  background: 'linear-gradient(135deg, #0C6BF5 0%, #0082F6 100%)',
                  fontSize: '14px',
                  flexShrink: 0
                }}
              >
                PR
              </div>
              <div className="flex-grow-1 min-width-0">
                <h4 className="fw-bold text-dark mb-0 fs-6" style={{ color: '#000000' }}>
                  PayResQ Enterprise
                </h4>
                <div className="text-muted small text-truncate" style={{ fontSize: '11px' }}>
                  admin@payresq.enterprise
                </div>
                <div className="d-flex align-items-center gap-1 mt-1">
                  <span
                    className="rounded-circle"
                    style={{
                      width: '7px',
                      height: '7px',
                      backgroundColor: token ? '#059669' : '#DC2626'
                    }}
                  ></span>
                  <span
                    className="fw-semibold"
                    style={{ fontSize: '10px', color: token ? '#059669' : '#DC2626' }}
                  >
                    {token ? 'Authenticated (HS256)' : 'Unauthenticated'}
                  </span>
                </div>
              </div>
              <button
                type="button"
                className="btn-close small"
                style={{ fontSize: '9px' }}
                onClick={() => setShowDropdown(false)}
              ></button>
            </div>
          </div>

          {/* Account & Multi-Tenant Details */}
          <div className="p-3">
            <div className="d-flex justify-content-between align-items-center mb-2">
              <span className="small text-muted" style={{ fontSize: '11px' }}>
                Active Merchant Scope:
              </span>
              <span
                className="badge px-2 py-1"
                style={{ backgroundColor: '#0C6BF5', color: '#FFFFFF', fontSize: '10px' }}
              >
                {merchantId}
              </span>
            </div>

            {token ? (
              <div className="mb-3">
                <div className="d-flex justify-content-between align-items-center mb-1">
                  <span className="small text-muted" style={{ fontSize: '11px' }}>
                    Bearer JWT Token:
                  </span>
                  <button
                    type="button"
                    className="btn btn-xs btn-link p-0 text-decoration-none fw-semibold"
                    style={{ fontSize: '11px', color: '#0C6BF5' }}
                    onClick={handleCopy}
                  >
                    {copied ? '✅ Copied!' : '📋 Copy Token'}
                  </button>
                </div>
                <div
                  className="p-2 rounded font-monospace small"
                  style={{
                    backgroundColor: '#F8FAFC',
                    border: '1px solid #E2E8F0',
                    fontSize: '10px',
                    wordBreak: 'break-all',
                    maxHeight: '65px',
                    overflowY: 'auto'
                  }}
                >
                  {token}
                </div>
              </div>
            ) : (
              <div className="alert alert-warning p-2 small mb-3" style={{ fontSize: '11px' }}>
                No active JWT session. Click below to start an authenticated session.
              </div>
            )}

            {/* Profile Action Buttons */}
            <div className="d-flex flex-column gap-1">
              {!token ? (
                <button
                  type="button"
                  className="btn btn-sm btn-primary fw-bold d-flex align-items-center justify-content-center gap-1 py-1"
                  style={{ fontSize: '12px' }}
                  onClick={() => handleGenerateToken('merch_flagship_001')}
                  disabled={loading}
                >
                  <i className="bi bi-shield-lock-fill"></i>
                  <span>🛡️ Authenticate Session (JWT)</span>
                </button>
              ) : (
                <>
                  <button
                    type="button"
                    className="btn btn-xs btn-outline-primary d-flex align-items-center justify-content-center gap-1 py-1"
                    style={{ fontSize: '11px' }}
                    onClick={() => handleGenerateToken('merch_flagship_001')}
                    disabled={loading}
                  >
                    <i className="bi bi-arrow-repeat"></i>
                    <span>Renew Session (merch_flagship_001)</span>
                  </button>
                  <button
                    type="button"
                    className="btn btn-xs btn-outline-secondary d-flex align-items-center justify-content-center gap-1 py-1"
                    style={{ fontSize: '11px' }}
                    onClick={() => handleGenerateToken('demo_merchant')}
                    disabled={loading}
                  >
                    <i className="bi bi-person-badge"></i>
                    <span>Switch Tenant to demo_merchant</span>
                  </button>
                  <button
                    type="button"
                    className="btn btn-xs btn-outline-danger d-flex align-items-center justify-content-center gap-1 py-1 mt-1"
                    style={{ fontSize: '11px' }}
                    onClick={handleClearToken}
                  >
                    <i className="bi bi-box-arrow-right"></i>
                    <span>Sign Out / Clear Token (Test 401)</span>
                  </button>
                </>
              )}
            </div>
          </div>
        </div>
      )}
    </div>
  );
};
