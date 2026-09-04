import React, { useState, useRef, useEffect } from 'react';
import { queryAssistant, triggerRecovery } from '../services/api';

export const AssistantPanel = ({ onRecoveryCompleted, forceOpen = false }) => {
  const [isOpen, setIsOpen] = useState(false);
  const [query, setQuery] = useState('');
  const [loading, setLoading] = useState(false);

  useEffect(() => {
    if (forceOpen) {
      setIsOpen(true);
    }
  }, [forceOpen]);
  const [messages, setMessages] = useState([
    {
      id: 'welcome',
      sender: 'bot',
      text: "👋 Hi! I'm your PayResQ Recovery Assistant. I can diagnose payment failures, recover abandoned carts, retry UPI mandates, and dispatch invoice reminders.",
      suggestions: [
        "Recover order #txn_ent_0003",
        "Check status of txn_ent_0001",
        "Retry failed mandate",
        "Escalate overdue invoice"
      ]
    }
  ]);
  const [actionLoadingId, setActionLoadingId] = useState(null);
  const messagesEndRef = useRef(null);

  const scrollToBottom = () => {
    messagesEndRef.current?.scrollIntoView({ behavior: 'smooth' });
  };

  useEffect(() => {
    if (isOpen) {
      scrollToBottom();
    }
  }, [messages, isOpen]);

  const handleSend = async (userQuery) => {
    const textToSend = userQuery || query;
    if (!textToSend.trim()) return;

    const userMsg = {
      id: Date.now() + '_user',
      sender: 'user',
      text: textToSend
    };

    setMessages(prev => [...prev, userMsg]);
    setQuery('');
    setLoading(true);

    try {
      const data = await queryAssistant(textToSend);
      const botMsg = {
        id: Date.now() + '_bot',
        sender: 'bot',
        data: data,
        text: data.error || data.response || data.suggested_message || "Here is what I found:"
      };
      setMessages(prev => [...prev, botMsg]);
    } catch (err) {
      setMessages(prev => [
        ...prev,
        {
          id: Date.now() + '_bot_error',
          sender: 'bot',
          error: "Failed to connect to assistant service. Please check the backend."
        }
      ]);
    } finally {
      setLoading(false);
    }
  };

  const handleExecuteRecovery = async (txnId, messageId) => {
    if (!txnId) return;
    setActionLoadingId(txnId);
    try {
      const res = await triggerRecovery(txnId);
      setMessages(prev =>
        prev.map(m =>
          m.id === messageId
            ? {
                ...m,
                recovered: true,
                recoveryLink: res.link || `https://rzp.io/i/${txnId.slice(0, 8)}`,
                actionMessage: `Recovery initiated! Payment link generated.`
              }
            : m
        )
      );
      if (onRecoveryCompleted) onRecoveryCompleted();
    } catch (err) {
      setMessages(prev =>
        prev.map(m =>
          m.id === messageId
            ? {
                ...m,
                actionError: `Recovery failed: ${err.message}`
              }
            : m
        )
      );
    } finally {
      setActionLoadingId(null);
    }
  };

  const resetChat = () => {
    setMessages([
      {
        id: 'welcome',
        sender: 'bot',
        text: "👋 Hi! I'm your PayResQ Operations Assistant. How can I help you recover revenue today?",
        suggestions: [
          "Recover order #txn_ent_0003",
          "Check status of txn_ent_0001",
          "Retry failed mandate",
          "Escalate overdue invoice"
        ]
      }
    ]);
  };

  return (
    <div style={{ position: 'fixed', bottom: '24px', right: '24px', zIndex: 1060 }}>
      {/* Floating Chatbot Popup Window */}
      {isOpen && (
        <div
          className="card shadow-lg d-flex flex-column"
          style={{
            position: 'absolute',
            bottom: '72px',
            right: '0',
            width: '410px',
            maxWidth: 'calc(100vw - 36px)',
            height: '590px',
            maxHeight: 'calc(100vh - 110px)',
            backgroundColor: '#FFFFFF',
            borderColor: '#E2E8F0',
            borderRadius: '16px',
            overflow: 'hidden',
            boxShadow: '0 20px 45px -8px rgba(0, 0, 0, 0.2), 0 0 1px rgba(0, 0, 0, 0.1)'
          }}
        >
          {/* Bot Header */}
          <div
            className="p-3 d-flex justify-content-between align-items-center"
            style={{
              backgroundColor: '#FFFFFF',
              borderBottom: '1px solid #E2E8F0'
            }}
          >
            <div className="d-flex align-items-center gap-2">
              <div
                className="position-relative d-flex align-items-center justify-content-center text-white rounded-circle shadow-sm"
                style={{
                  width: '38px',
                  height: '38px',
                  background: 'linear-gradient(135deg, #0C6BF5 0%, #0082F6 100%)'
                }}
              >
                <i className="bi bi-headset fs-5"></i>
                <span
                  className="position-absolute bottom-0 end-0 rounded-circle border border-white"
                  style={{
                    width: '10px',
                    height: '10px',
                    backgroundColor: '#059669'
                  }}
                ></span>
              </div>
              <div>
                <h4 className="fs-6 fw-bold mb-0" style={{ color: '#000000' }}>
                  PayResQ Assistant
                </h4>
                <span className="small text-muted" style={{ fontSize: '11px' }}>
                  Online • Operations Assistant
                </span>
              </div>
            </div>

            <div className="d-flex align-items-center gap-1">
              <button
                type="button"
                className="btn btn-sm btn-outline-secondary border-0 text-muted p-1"
                onClick={resetChat}
                title="Reset Conversation"
              >
                <i className="bi bi-arrow-counterclockwise fs-6"></i>
              </button>
              <button
                type="button"
                className="btn btn-sm btn-outline-secondary border-0 text-dark p-1"
                onClick={() => setIsOpen(false)}
                title="Close Assistant"
              >
                <i className="bi bi-x-lg fs-6"></i>
              </button>
            </div>
          </div>

          {/* Chat Messages Stream */}
          <div
            className="flex-grow-1 p-3 overflow-auto d-flex flex-column gap-3"
            style={{ backgroundColor: '#F8FAFC' }}
          >
            {messages.map(msg => (
              <div
                key={msg.id}
                className={`d-flex flex-column ${
                  msg.sender === 'user' ? 'align-items-end' : 'align-items-start'
                }`}
              >
                {/* Message Bubble */}
                <div
                  className="p-3 rounded shadow-sm"
                  style={{
                    maxWidth: '88%',
                    backgroundColor: msg.sender === 'user' ? '#0C6BF5' : '#FFFFFF',
                    color: msg.sender === 'user' ? '#FFFFFF' : '#0F172A',
                    border: msg.sender === 'user' ? 'none' : '1px solid #E2E8F0',
                    borderRadius:
                      msg.sender === 'user'
                        ? '14px 14px 2px 14px'
                        : '14px 14px 14px 2px',
                    fontSize: '13px',
                    lineHeight: '1.45'
                  }}
                >
                  {msg.error ? (
                    <div className="text-danger small">
                      <i className="bi bi-exclamation-triangle-fill me-1"></i>
                      {msg.error}
                    </div>
                  ) : msg.data ? (
                    <div>
                      {/* Intent Header */}
                      <div className="d-flex justify-content-between align-items-center mb-2">
                        <span
                          className="badge px-2 py-1 text-uppercase"
                          style={{
                            backgroundColor: '#EFF6FF',
                            color: '#0C6BF5',
                            border: '1px solid #BFDBFE',
                            fontSize: '10px'
                          }}
                        >
                          {msg.data.intent}
                        </span>
                        {msg.data.is_recovered !== undefined && (
                          <span
                            className={`badge ${
                              msg.data.is_recovered || msg.recovered
                                ? 'bg-success'
                                : 'bg-warning text-dark'
                            }`}
                            style={{ fontSize: '10px' }}
                          >
                            {msg.data.is_recovered || msg.recovered
                              ? 'RECOVERED'
                              : msg.data.status?.toUpperCase() || 'PENDING'}
                          </span>
                        )}
                      </div>

                      {/* Transaction Summary Card */}
                      {msg.data.transaction_id && (
                        <div
                          className="p-2 rounded mb-2 border"
                          style={{
                            backgroundColor: '#F8FAFC',
                            borderColor: '#E2E8F0'
                          }}
                        >
                          <div className="d-flex justify-content-between align-items-center">
                            <span className="font-monospace fw-bold text-dark small">
                              {msg.data.transaction_id}
                            </span>
                            {msg.data.amount !== undefined && (
                              <span className="fw-bold font-monospace text-dark">
                                ₹{msg.data.amount?.toLocaleString()}
                              </span>
                            )}
                          </div>
                          {msg.data.customer && (
                            <div
                              className="text-muted small text-truncate"
                              style={{ fontSize: '11px' }}
                            >
                              {msg.data.customer}
                            </div>
                          )}
                        </div>
                      )}

                      {/* Diagnosis */}
                      {msg.data.diagnosis && (
                        <div className="mb-2">
                          <strong
                            className="d-block small"
                            style={{ color: '#0C6BF5', fontSize: '11px' }}
                          >
                            Diagnosis:
                          </strong>
                          <div className="text-dark small">
                            {msg.data.diagnosis}
                          </div>
                        </div>
                      )}

                      {/* Hinglish Draft */}
                      {msg.data.hinglish_message && (
                        <div
                          className="p-2 rounded mb-2 fst-italic small border"
                          style={{
                            backgroundColor: '#F1F5F9',
                            borderColor: '#E2E8F0',
                            fontSize: '11px',
                            color: '#334155'
                          }}
                        >
                          "{msg.data.hinglish_message}"
                        </div>
                      )}

                      {/* Bot Message Note */}
                      <p className="text-muted small mb-2" style={{ fontSize: '11px' }}>
                        {msg.data.suggested_message || msg.text}
                      </p>

                      {/* Action Button: Approve Recovery */}
                      {!msg.data.is_recovered &&
                        !msg.recovered &&
                        msg.data.transaction_id && (
                          <div className="mt-2">
                            <button
                              type="button"
                              className="btn btn-sm btn-success fw-bold w-100 d-flex align-items-center justify-content-center gap-1 shadow-sm"
                              style={{ fontSize: '12px', padding: '6px 12px' }}
                              disabled={actionLoadingId === msg.data.transaction_id}
                              onClick={() =>
                                handleExecuteRecovery(msg.data.transaction_id, msg.id)
                              }
                            >
                              {actionLoadingId === msg.data.transaction_id ? (
                                <>
                                  <span className="spinner-border spinner-border-sm"></span>
                                  <span>Recovering...</span>
                                </>
                              ) : (
                                <>
                                  <i className="bi bi-check-circle-fill"></i>
                                  <span>
                                    Approve Recovery ({msg.data.transaction_id})
                                  </span>
                                </>
                              )}
                            </button>
                          </div>
                        )}

                      {/* Recovery Result Confirmation */}
                      {msg.recovered && (
                        <div
                          className="p-2 rounded bg-success bg-opacity-10 text-success small border border-success mt-2"
                          style={{ fontSize: '11px' }}
                        >
                          <div className="fw-bold">
                            ✓ {msg.actionMessage || 'Payment link generated!'}
                          </div>
                          {msg.recoveryLink && (
                            <a
                              href={msg.recoveryLink}
                              target="_blank"
                              rel="noreferrer"
                              className="btn btn-sm btn-primary mt-1 w-100 py-0"
                              style={{ fontSize: '11px' }}
                            >
                              Open Payment Link ↗
                            </a>
                          )}
                        </div>
                      )}

                      {msg.actionError && (
                        <div className="p-2 rounded bg-danger bg-opacity-10 text-danger small border border-danger mt-2">
                          {msg.actionError}
                        </div>
                      )}
                    </div>
                  ) : (
                    <div>{msg.text}</div>
                  )}
                </div>

                {/* Quick Chips if available */}
                {msg.suggestions && (
                  <div className="d-flex flex-column gap-1 mt-2" style={{ maxWidth: '88%' }}>
                    <span className="small text-muted" style={{ fontSize: '11px' }}>
                      Suggested Actions:
                    </span>
                    <div className="d-flex flex-wrap gap-1">
                      {msg.suggestions.map((s, idx) => (
                        <button
                          key={idx}
                          type="button"
                          className="btn btn-sm text-start"
                          style={{
                            backgroundColor: '#FFFFFF',
                            border: '1px solid #E2E8F0',
                            color: '#0F172A',
                            fontSize: '11px',
                            padding: '3px 8px',
                            borderRadius: '12px'
                          }}
                          onClick={() => handleSend(s)}
                        >
                          {s}
                        </button>
                      ))}
                    </div>
                  </div>
                )}
              </div>
            ))}

            {/* Thinking Indicator */}
            {loading && (
              <div className="d-flex align-items-center gap-2 text-muted small p-2 bg-white rounded border" style={{ width: 'fit-content', borderColor: '#E2E8F0' }}>
                <span className="spinner-grow spinner-grow-sm text-primary" role="status"></span>
                <span>Analyzing request...</span>
              </div>
            )}
            <div ref={messagesEndRef} />
          </div>

          {/* Chat Input Bar */}
          <div
            className="p-2 border-top"
            style={{ backgroundColor: '#FFFFFF', borderColor: '#E2E8F0' }}
          >
            <form
              onSubmit={e => {
                e.preventDefault();
                handleSend();
              }}
              className="d-flex gap-2"
            >
              <input
                type="text"
                className="form-control form-control-sm text-dark"
                placeholder="Type request... e.g. 'Recover order #txn_ent_0003'"
                style={{
                  backgroundColor: '#F8FAFC',
                  borderColor: '#CBD5E1',
                  fontSize: '13px'
                }}
                value={query}
                onChange={e => setQuery(e.target.value)}
                autoFocus={isOpen}
              />
              <button
                type="submit"
                className="btn btn-sm btn-primary d-flex align-items-center justify-content-center px-3 shadow-sm"
                disabled={loading || !query.trim()}
              >
                <i className="bi bi-send-fill"></i>
              </button>
            </form>
          </div>
        </div>
      )}

      {/* Floating Action Button (FAB Launcher at bottom-right) */}
      <button
        type="button"
        className="btn d-flex align-items-center justify-content-center shadow-lg position-relative"
        style={{
          width: '56px',
          height: '56px',
          borderRadius: '50%',
          background: 'linear-gradient(135deg, #0C6BF5 0%, #0082F6 100%)',
          color: '#FFFFFF',
          border: '2px solid #FFFFFF',
          boxShadow: '0 8px 24px rgba(12, 107, 245, 0.45), 0 2px 6px rgba(0, 0, 0, 0.15)',
          transition: 'transform 0.2s ease, box-shadow 0.2s ease'
        }}
        onClick={() => setIsOpen(!isOpen)}
        title={isOpen ? 'Close Assistant' : 'Open PayResQ Assistant'}
      >
        <i className={`bi ${isOpen ? 'bi-x-lg fs-5' : 'bi-chat-dots-fill fs-4'}`}></i>
        {!isOpen && (
          <span
            className="position-absolute top-0 start-100 translate-middle p-1 bg-success border border-light rounded-circle"
            style={{ width: '12px', height: '12px' }}
          ></span>
        )}
      </button>
    </div>
  );
};
