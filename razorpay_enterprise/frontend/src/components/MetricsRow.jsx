import React from 'react';

export const SmallBox = ({ title, text, theme = 'primary', icon, onClick }) => {
  const bgClass = {
    danger: 'bg-danger text-white',
    success: 'bg-success text-white',
    warning: 'bg-warning text-dark',
    info: 'bg-info text-white',
    primary: 'bg-primary text-white'
  }[theme] || 'bg-primary text-white';

  return (
    <div className={`small-box ${bgClass}`} onClick={onClick} style={{ cursor: onClick ? 'pointer' : 'default' }}>
      <div className="inner">
        <h3>{title}</h3>
        <p>{text}</p>
      </div>
      <div className="icon">
        <i className={`bi ${icon}`}></i>
      </div>
      <div className="small-box-footer">
        <span>More info</span>
        <i className="bi bi-arrow-right-circle"></i>
      </div>
    </div>
  );
};

export const MetricsRow = ({ metrics, onFilterClick }) => {
  return (
    <div className="row g-3 mb-4">
      <div className="col-lg-3 col-6">
        <SmallBox
          title={`₹${metrics ? metrics.total_risk.toLocaleString() : '---'}`}
          text="Total Revenue at Risk"
          theme="danger"
          icon="bi-exclamation-triangle"
          onClick={() => onFilterClick && onFilterClick('failed')}
        />
      </div>
      <div className="col-lg-3 col-6">
        <SmallBox
          title={`₹${metrics ? metrics.recovered_today.toLocaleString() : '---'}`}
          text="Recovered"
          theme="success"
          icon="bi-check-circle"
          onClick={() => onFilterClick && onFilterClick('recovered')}
        />
      </div>
      <div className="col-lg-3 col-6">
        <SmallBox
          title={`${metrics ? (metrics.timeline ? metrics.timeline.length * 12 : 62) : '---'}`}
          text="At-Risk Cases"
          theme="warning"
          icon="bi-clock-history"
          onClick={() => onFilterClick && onFilterClick('pending')}
        />
      </div>
      <div className="col-lg-3 col-6">
        <SmallBox
          title={`₹${metrics ? metrics.total_llm_cost.toFixed(4) : '0.004'}`}
          text="Total AI Cost"
          theme="info"
          icon="bi-coin"
        />
      </div>
    </div>
  );
};
