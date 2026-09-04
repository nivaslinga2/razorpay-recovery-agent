import React from 'react';
import {
  Chart as ChartJS,
  CategoryScale,
  LinearScale,
  PointElement,
  LineElement,
  BarElement,
  Title,
  Tooltip,
  Legend,
  Filler
} from 'chart.js';
import { Line } from 'react-chartjs-2';

ChartJS.register(
  CategoryScale,
  LinearScale,
  PointElement,
  LineElement,
  BarElement,
  Title,
  Tooltip,
  Legend,
  Filler
);

export const MetricsChart = ({ timeline = [] }) => {
  const labels = timeline.map(point => point.time);
  const recoveredData = timeline.map(point => point.recovered);
  const atRiskData = timeline.map(point => point.at_risk);

  const data = {
    labels,
    datasets: [
      {
        label: 'Recovered Revenue (₹)',
        data: recoveredData,
        borderColor: '#00D09C',
        backgroundColor: 'rgba(0, 208, 156, 0.18)',
        tension: 0.35,
        fill: true,
        pointBackgroundColor: '#00D09C',
        pointBorderColor: '#FFFFFF',
        pointRadius: 5,
        pointHoverRadius: 7,
      },
      {
        label: 'At-Risk Revenue (₹)',
        data: atRiskData,
        borderColor: '#0C6BF5',
        backgroundColor: 'rgba(12, 107, 245, 0.15)',
        tension: 0.35,
        fill: true,
        borderDash: [5, 5],
        pointBackgroundColor: '#0C6BF5',
        pointBorderColor: '#FFFFFF',
        pointRadius: 4,
        pointHoverRadius: 6,
      }
    ],
  };

  const options = {
    responsive: true,
    maintainAspectRatio: false,
    plugins: {
      legend: {
        position: 'top',
        labels: {
          color: '#000000',
          font: {
            size: 13,
            family: 'Inter, system-ui, sans-serif',
            weight: 700
          },
          usePointStyle: true,
          padding: 16
        }
      },
      tooltip: {
        backgroundColor: '#FFFFFF',
        titleColor: '#000000',
        bodyColor: '#334155',
        borderColor: '#E2E8F0',
        borderWidth: 1,
        padding: 12,
        boxPadding: 4,
        callbacks: {
          label: function (context) {
            return ` ${context.dataset.label}: ₹${Number(context.raw).toLocaleString()}`;
          }
        }
      }
    },
    scales: {
      x: {
        grid: {
          color: 'rgba(0, 0, 0, 0.05)',
        },
        ticks: {
          color: '#64748B',
          font: { family: 'Inter, system-ui, sans-serif' }
        }
      },
      y: {
        grid: {
          color: 'rgba(0, 0, 0, 0.05)',
        },
        ticks: {
          color: '#64748B',
          font: { family: 'Inter, system-ui, sans-serif' },
          callback: function (value) {
            return '₹' + Number(value).toLocaleString();
          }
        }
      }
    }
  };

  return (
    <div style={{ height: '320px', width: '100%' }}>
      <Line data={data} options={options} />
    </div>
  );
};
