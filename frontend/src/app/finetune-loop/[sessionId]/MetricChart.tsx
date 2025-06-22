import { ChartDataset } from './types';
import { formatNumber } from './utils';

interface MetricChartProps {
  datasets: ChartDataset[];
  title: string;
}

export default function MetricChart({ datasets, title }: MetricChartProps) {
  const allData = datasets.flatMap(ds => ds.data);
  
  if (allData.length === 0) {
    return (
      <div className="bg-gray-800/50 rounded-xl p-6 border border-gray-700/50 backdrop-blur-sm hover:border-gray-600/50 transition-all duration-300 min-h-[400px] flex items-center justify-center">
        <div className="text-center">
          <div className="w-16 h-16 mx-auto mb-4 bg-gray-700/50 rounded-full flex items-center justify-center">
            <svg className="w-8 h-8 text-gray-400 animate-pulse" fill="none" stroke="currentColor" viewBox="0 0 24 24">
              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M9 19v-6a2 2 0 00-2-2H5a2 2 0 00-2 2v6a2 2 0 002 2h2a2 2 0 002-2zm0 0V9a2 2 0 012-2h2a2 2 0 012 2v10m-6 0a2 2 0 002 2h2a2 2 0 002-2m0 0V5a2 2 0 012-2h2a2 2 0 012 2v14a2 2 0 01-2 2h-2a2 2 0 01-2-2z" />
            </svg>
          </div>
          <h3 className="text-xl font-semibold text-gray-300 mb-2">{title}</h3>
          <p className="text-sm text-gray-500">Waiting for training data...</p>
          <div className="mt-4 flex justify-center">
            <div className="flex space-x-1">
              <div className="w-2 h-2 bg-blue-400 rounded-full animate-pulse"></div>
              <div className="w-2 h-2 bg-blue-400 rounded-full animate-pulse" style={{ animationDelay: '0.1s' }}></div>
              <div className="w-2 h-2 bg-blue-400 rounded-full animate-pulse" style={{ animationDelay: '0.2s' }}></div>
            </div>
          </div>
        </div>
      </div>
    );
  }

  const maxValue = Math.max(...allData.map(d => d.value));
  const minValue = Math.min(...allData.map(d => d.value));
  const range = maxValue - minValue || 1;

  return (
    <div className="bg-gray-800/50 rounded-xl p-6 border border-gray-700/50 backdrop-blur-sm hover:border-gray-600/50 transition-all duration-300 min-h-[400px]">
      <div className="flex items-center justify-between mb-6">
        <h3 className="text-xl font-semibold text-gray-100">{title}</h3>
        <div className="flex items-center space-x-6">
          {datasets.map(ds => ds.data.length > 0 && (
            <div key={ds.label} className="flex items-center space-x-2">
              <span className="w-3 h-3 rounded-full shadow-sm" style={{ backgroundColor: ds.color }}></span>
              <span className="text-sm text-gray-300 font-medium">{ds.label}</span>
              <span className="text-sm text-gray-400 bg-gray-700/50 px-2 py-1 rounded-md">
                {formatNumber(ds.data[ds.data.length - 1]?.value || 0)}
              </span>
            </div>
          ))}
        </div>
      </div>
      
      <div className="relative h-80 bg-gray-900/50 rounded-lg p-6 border border-gray-700/30">
        <svg className="w-full h-full" viewBox="0 0 500 300">
          {/* Grid lines */}
          {[0, 1, 2, 3, 4, 5].map(i => (
            <g key={`grid-${i}`}>
              <line
                x1="0"
                y1={i * 60}
                x2="500"
                y2={i * 60}
                stroke="#374151"
                strokeWidth="1"
                opacity="0.3"
              />
              <line
                x1={i * 100}
                y1="0"
                x2={i * 100}
                y2="300"
                stroke="#374151"
                strokeWidth="1"
                opacity="0.3"
              />
            </g>
          ))}
          
          {/* Data lines with smooth curves */}
          {datasets.map(ds => ds.data.length > 1 && (
            <g key={ds.label}>
              <defs>
                <linearGradient id={`gradient-${ds.label}`} x1="0%" y1="0%" x2="0%" y2="100%">
                  <stop offset="0%" style={{ stopColor: ds.color, stopOpacity: 0.3 }} />
                  <stop offset="100%" style={{ stopColor: ds.color, stopOpacity: 0.05 }} />
                </linearGradient>
              </defs>
              
              {/* Area fill */}
              <path
                d={`M ${ds.data.map((point, index) => {
                  const x = (index / (ds.data.length - 1)) * 500;
                  const y = 300 - ((point.value - minValue) / range) * 300;
                  return `${x},${y}`;
                }).join(' L ')} L 500,300 L 0,300 Z`}
                fill={`url(#gradient-${ds.label})`}
              />
              
              {/* Main line */}
              <polyline
                points={ds.data.map((point, index) => {
                  const x = (index / (ds.data.length - 1)) * 500;
                  const y = 300 - ((point.value - minValue) / range) * 300;
                  return `${x},${y}`;
                }).join(' ')}
                fill="none"
                stroke={ds.color}
                strokeWidth="3"
                strokeLinecap="round"
                strokeLinejoin="round"
                style={{ filter: `drop-shadow(0 0 6px ${ds.color}40)` }}
              />
              
              {/* Data points */}
              {ds.data.slice(-5).map((point, index, arr) => {
                const x = ((ds.data.length - arr.length + index) / (ds.data.length - 1)) * 500;
                const y = 300 - ((point.value - minValue) / range) * 300;
                return (
                  <circle
                    key={`point-${ds.label}-${index}`}
                    cx={x}
                    cy={y}
                    r="4"
                    fill={ds.color}
                    stroke="#1F2937"
                    strokeWidth="2"
                    style={{ filter: `drop-shadow(0 0 4px ${ds.color})` }}
                  />
                );
              })}
            </g>
          ))}
        </svg>
        
        {/* Y-axis labels */}
        <div className="absolute left-0 top-0 h-full flex flex-col justify-between text-xs text-gray-400 -ml-16 py-6">
          <span className="bg-gray-800/80 px-2 py-1 rounded">{formatNumber(maxValue, 3)}</span>
          <span className="bg-gray-800/80 px-2 py-1 rounded">{formatNumber((maxValue * 3 + minValue) / 4, 3)}</span>
          <span className="bg-gray-800/80 px-2 py-1 rounded">{formatNumber((maxValue + minValue) / 2, 3)}</span>
          <span className="bg-gray-800/80 px-2 py-1 rounded">{formatNumber((maxValue + minValue * 3) / 4, 3)}</span>
          <span className="bg-gray-800/80 px-2 py-1 rounded">{formatNumber(minValue, 3)}</span>
        </div>
        
        {/* X-axis labels */}
        <div className="absolute bottom-0 left-0 w-full flex justify-between text-xs text-gray-400 -mb-8 px-6">
          <span>0</span>
          <span>{Math.floor(allData.length * 0.25)}</span>
          <span>{Math.floor(allData.length * 0.5)}</span>
          <span>{Math.floor(allData.length * 0.75)}</span>
          <span>{allData.length}</span>
        </div>
      </div>
    </div>
  );
}

// Placeholder chart component for future metrics
export function PlaceholderChart({ title, color }: { title: string; color: string }) {
  return (
    <div className="bg-gray-800/50 rounded-xl p-6 border border-gray-700/50 backdrop-blur-sm hover:border-gray-600/50 transition-all duration-300 min-h-[400px]">
      <div className="flex items-center justify-between mb-6">
        <h3 className="text-xl font-semibold text-gray-100">{title}</h3>
        <span className="text-sm text-gray-400 bg-gray-700/50 px-3 py-1 rounded-full">Coming Soon</span>
      </div>
      
      <div className="relative h-80 bg-gray-900/50 rounded-lg p-6 border border-gray-700/30 flex items-center justify-center">
        <div className="text-center">
          <div className="w-20 h-20 mx-auto mb-4 rounded-full flex items-center justify-center border-2 border-dashed border-gray-600">
            <svg className="w-10 h-10 text-gray-500" fill="none" stroke="currentColor" viewBox="0 0 24 24">
              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M9 19v-6a2 2 0 00-2-2H5a2 2 0 00-2 2v6a2 2 0 002 2h2a2 2 0 002-2zm0 0V9a2 2 0 012-2h2a2 2 0 012 2v10m-6 0a2 2 0 002 2h2a2 2 0 002-2m0 0V5a2 2 0 012-2h2a2 2 0 012 2v14a2 2 0 01-2 2h-2a2 2 0 01-2-2z" />
            </svg>
          </div>
          <h4 className="text-lg font-medium text-gray-300 mb-2">{title}</h4>
          <p className="text-sm text-gray-500 max-w-xs">
            This metric will be available in a future update to provide additional training insights.
          </p>
          <div className="mt-4">
            <div className="w-32 h-1 bg-gray-700 rounded-full mx-auto">
              <div 
                className="h-1 rounded-full animate-pulse" 
                style={{ backgroundColor: color, width: '40%' }}
              ></div>
            </div>
          </div>
        </div>
      </div>
    </div>
  );
}
