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
import { MetricTimelinePoint } from '../services/api';

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

interface MetricsChartProps {
  timeline: MetricTimelinePoint[];
}

export const MetricsChart: React.FC<MetricsChartProps> = ({ timeline }) => {
  const labels = timeline.map(point => point.time);
  const recoveredData = timeline.map(point => point.recovered);
  const atRiskData = timeline.map(point => point.at_risk);

  const data = {
    labels,
    datasets: [
      {
        label: 'Recovered Revenue (₹)',
        data: recoveredData,
        borderColor: '#10B981',
        backgroundColor: 'rgba(16, 185, 129, 0.15)',
        tension: 0.35,
        fill: true,
        pointBackgroundColor: '#10B981',
        pointBorderColor: '#fff',
        pointRadius: 5,
        pointHoverRadius: 7,
      },
      {
        label: 'At-Risk Revenue (₹)',
        data: atRiskData,
        borderColor: '#D4AF37',
        backgroundColor: 'rgba(212, 175, 55, 0.12)',
        tension: 0.35,
        fill: true,
        borderDash: [5, 5],
        pointBackgroundColor: '#D4AF37',
        pointBorderColor: '#0A0D14',
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
        position: 'top' as const,
        labels: {
          color: '#E2E8F0',
          font: {
            size: 13,
            family: 'Inter, sans-serif'
          },
          usePointStyle: true,
          padding: 16
        }
      },
      tooltip: {
        backgroundColor: '#1E293B',
        titleColor: '#F8FAFC',
        bodyColor: '#CBD5E1',
        borderColor: '#334155',
        borderWidth: 1,
        padding: 12,
        callbacks: {
          label: function (context: any) {
            return ` ${context.dataset.label}: ₹${context.raw.toLocaleString()}`;
          }
        }
      }
    },
    scales: {
      x: {
        grid: {
          color: 'rgba(255, 255, 255, 0.05)',
        },
        ticks: {
          color: '#94A3B8',
          font: { family: 'Inter, sans-serif' }
        }
      },
      y: {
        grid: {
          color: 'rgba(255, 255, 255, 0.05)',
        },
        ticks: {
          color: '#94A3B8',
          font: { family: 'Inter, sans-serif' },
          callback: function (value: any) {
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
