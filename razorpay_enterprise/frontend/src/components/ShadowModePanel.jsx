import React from 'react';

export const ShadowModePanel = ({ data }) => {
  if (!data) return null;

  return (
    <div className="card shadow-sm mb-4" style={{ backgroundColor: '#FFFFFF', borderColor: '#E2E8F0' }}>
      {/* Header */}
      <div className="card-header d-flex justify-content-between align-items-center py-3" 
           style={{ borderBottom: '1px solid #E2E8F0', backgroundColor: '#FFFFFF' }}>
        <div className="d-flex align-items-center gap-2">
          <div className="p-1 px-2 rounded" style={{ backgroundColor: 'rgba(12, 107, 245, 0.08)' }}>
            <i className="bi bi-shield-shaded text-primary fs-5"></i>
          </div>
          <div>
            <h3 className="card-title fs-5 fw-bold mb-0" style={{ color: '#000000' }}>Shadow Mode: Champion vs Challenger</h3>
            <span className="small text-muted">A/B recovery strategy evaluation sandbox</span>
          </div>
        </div>
        <div className="d-flex align-items-center gap-2">
          <span className="badge px-3 py-2 fw-bold" 
                style={{ backgroundColor: '#ECFDF5', color: '#059669', border: '1px solid #A7F3D0' }}>
            <i className="bi bi-shield-check me-1"></i>Zero Production Risk (Sandboxed)
          </span>
          <span className="badge px-2 py-1 fw-bold bg-primary text-white">Active</span>
        </div>
      </div>

      <div className="card-body p-4">
        {/* Margin Comparison Row */}
        <div className="row g-3 mb-4">
          {/* Champion Card */}
          <div className="col-md-4">
            <div className="p-3 rounded border" 
                 style={{ backgroundColor: '#F8FAFC', borderColor: '#E2E8F0' }}>
              <div className="d-flex justify-content-between align-items-center mb-1">
                <span className="small fw-bold text-uppercase" style={{ color: '#64748B' }}>Champion (Production)</span>
                <span className="badge bg-secondary">Live</span>
              </div>
              <h3 className="fw-bold mb-1 font-monospace" style={{ color: '#000000' }}>₹{data.champion_recovered?.toLocaleString()}</h3>
              <p className="small text-muted mb-0">{data.champion_model}</p>
            </div>
          </div>

          {/* Challenger Card */}
          <div className="col-md-4">
            <div className="p-3 rounded border" 
                 style={{ backgroundColor: '#F8FAFC', borderColor: '#BFDBFE' }}>
              <div className="d-flex justify-content-between align-items-center mb-1">
                <span className="small fw-bold text-uppercase text-primary">Challenger (Shadow Mode)</span>
                <span className="badge bg-primary text-white fw-bold">Candidate</span>
              </div>
              <h3 className="fw-bold mb-1 font-monospace text-primary">₹{data.challenger_hypothetical?.toLocaleString()}</h3>
              <p className="small text-muted mb-0">{data.challenger_model}</p>
            </div>
          </div>

          {/* Shadow Margin Uplift */}
          <div className="col-md-4">
            <div className="p-3 rounded border" 
                 style={{ backgroundColor: '#ECFDF5', borderColor: '#A7F3D0' }}>
              <div className="d-flex justify-content-between align-items-center mb-1">
                <span className="small fw-bold text-uppercase text-success">Shadow Margin Uplift</span>
                <span className="badge bg-success text-white fw-bold">+{data.shadow_improvement_pct}%</span>
              </div>
              <h3 className="fw-bold mb-1 font-monospace text-success">+₹{data.shadow_improvement?.toLocaleString()}</h3>
              <p className="small text-muted mb-0">Projected incremental recovered revenue</p>
            </div>
          </div>
        </div>

        {/* Live Evaluated Shadow Cases */}
        <div className="p-3 rounded border" style={{ backgroundColor: '#F8FAFC', borderColor: '#E2E8F0' }}>
          <div className="d-flex justify-content-between align-items-center mb-3">
            <h5 className="fs-6 fw-bold mb-0" style={{ color: '#000000' }}>
              <i className="bi bi-cpu-fill text-primary me-2"></i>
              Concurrent Execution Audit Log (Latest Stream Samples)
            </h5>
            <span className="small text-muted">Evaluated concurrently • Zero live money dispatched by Challenger</span>
          </div>

          <div className="table-responsive">
            <table className="table table-sm table-hover align-middle mb-0" style={{ color: '#0F172A', backgroundColor: '#FFFFFF' }}>
              <thead className="small text-uppercase" style={{ color: '#64748B', borderBottom: '1px solid #E2E8F0', backgroundColor: '#F8FAFC' }}>
                <tr>
                  <th>Transaction</th>
                  <th>Error Type</th>
                  <th>Amount</th>
                  <th>Champion Action</th>
                  <th>Challenger Shadow Action</th>
                  <th className="text-end">Hypothetical Gain</th>
                </tr>
              </thead>
              <tbody>
                {data.sample_cases?.map((c, i) => (
                  <tr key={i}>
                    <td className="font-monospace fw-bold" style={{ color: '#000000' }}>{c.txn_id}</td>
                    <td><span className="badge bg-danger">{c.error}</span></td>
                    <td className="font-monospace fw-semibold" style={{ color: '#000000' }}>₹{c.amount?.toLocaleString()}</td>
                    <td className="text-muted">{c.champion_action}</td>
                    <td className="fw-bold text-primary">
                      <i className="bi bi-lightning-charge me-1"></i>{c.challenger_action}
                    </td>
                    <td className="text-end fw-bold font-monospace text-success">
                      +₹{c.hypothetical_gain?.toLocaleString()}
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        </div>
      </div>
    </div>
  );
};
