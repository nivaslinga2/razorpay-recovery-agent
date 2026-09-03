import React from 'react';

export const ShadowModePanel = ({ data }) => {
  if (!data) return null;

  return (
    <div className="card shadow-sm mb-4" style={{ backgroundColor: 'var(--obsidian-surface)', borderColor: 'var(--gold-border)' }}>
      {/* Header */}
      <div className="card-header d-flex justify-content-between align-items-center py-3" style={{ borderBottom: '1px solid var(--gold-border)' }}>
        <div className="d-flex align-items-center gap-2">
          <i className="bi bi-shield-shaded text-warning fs-5"></i>
          <div>
            <h3 className="card-title fs-5 fw-bold mb-0 text-white">Shadow Mode: Champion vs Challenger Analysis</h3>
            <span className="text-secondary small">Safe A/B AI Model Evaluation without Production Risk</span>
          </div>
        </div>
        <div className="d-flex align-items-center gap-2">
          <span className="badge bg-success bg-opacity-25 text-success border border-success px-3 py-2 fw-bold">
            <i className="bi bi-lock-fill me-1"></i>Zero Production Risk (Sandboxed)
          </span>
          <span className="badge bg-warning text-dark fw-bold px-2 py-1">Active</span>
        </div>
      </div>

      <div className="card-body p-4">
        {/* Margin Comparison Row */}
        <div className="row g-3 mb-4">
          {/* Champion Card */}
          <div className="col-md-4">
            <div className="p-3 rounded border" style={{ backgroundColor: 'var(--obsidian-vault)', borderColor: 'var(--gold-border)' }}>
              <div className="d-flex justify-content-between align-items-center mb-1">
                <span className="text-secondary small fw-bold text-uppercase">Champion (Production)</span>
                <span className="badge bg-secondary">Live</span>
              </div>
              <h3 className="text-white fw-bold mb-1">₹{data.champion_recovered?.toLocaleString()}</h3>
              <p className="small text-muted mb-0">{data.champion_model}</p>
            </div>
          </div>

          {/* Challenger Card */}
          <div className="col-md-4">
            <div className="p-3 rounded border" style={{ backgroundColor: 'var(--obsidian-vault)', borderColor: 'var(--gold-border-hover)' }}>
              <div className="d-flex justify-content-between align-items-center mb-1">
                <span className="text-warning small fw-bold text-uppercase">Challenger (Shadow Mode)</span>
                <span className="badge bg-warning text-dark fw-bold">Candidate</span>
              </div>
              <h3 className="text-warning fw-bold mb-1">₹{data.challenger_hypothetical?.toLocaleString()}</h3>
              <p className="small text-muted mb-0">{data.challenger_model}</p>
            </div>
          </div>

          {/* Shadow Margin Uplift */}
          <div className="col-md-4">
            <div className="p-3 rounded border" style={{ backgroundColor: 'rgba(16, 185, 129, 0.08)', borderColor: 'rgba(16, 185, 129, 0.4)' }}>
              <div className="d-flex justify-content-between align-items-center mb-1">
                <span className="text-success small fw-bold text-uppercase">Shadow Margin Uplift</span>
                <span className="badge bg-success text-white">+{data.shadow_improvement_pct}%</span>
              </div>
              <h3 className="text-success fw-bold mb-1">+₹{data.shadow_improvement?.toLocaleString()}</h3>
              <p className="small text-muted mb-0">Projected incremental revenue recovery</p>
            </div>
          </div>
        </div>

        {/* Live Evaluated Shadow Cases */}
        <div className="p-3 rounded border" style={{ backgroundColor: 'var(--obsidian-inner)', borderColor: 'var(--gold-border)' }}>
          <div className="d-flex justify-content-between align-items-center mb-3">
            <h5 className="fs-6 fw-bold mb-0 text-white">
              <i className="bi bi-cpu-fill text-warning me-2"></i>
              Concurrent Execution Audit Log (Latest Samples)
            </h5>
            <span className="text-muted small">Evaluated concurrently • Zero live money dispatched by Challenger</span>
          </div>

          <div className="table-responsive">
            <table className="table table-sm table-hover align-middle mb-0" style={{ color: '#cbd5e1' }}>
              <thead className="small text-uppercase text-secondary" style={{ borderBottom: '1px solid var(--gold-border)' }}>
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
                    <td className="font-monospace text-white fw-bold">{c.txn_id}</td>
                    <td><span className="badge bg-danger">{c.error}</span></td>
                    <td className="text-white font-monospace">₹{c.amount?.toLocaleString()}</td>
                    <td className="text-muted">{c.champion_action}</td>
                    <td className="text-warning fw-bold">
                      <i className="bi bi-lightning-charge me-1"></i>{c.challenger_action}
                    </td>
                    <td className="text-end text-success fw-bold font-monospace">+₹{c.hypothetical_gain?.toLocaleString()}</td>
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
