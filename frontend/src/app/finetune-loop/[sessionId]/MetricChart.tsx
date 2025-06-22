import { ChartDataset } from './types';
import { formatNumber } from './utils';
import {
  LineChart,
  Line,
  XAxis,
  YAxis,
  CartesianGrid,
  Tooltip,
  ResponsiveContainer,
  Legend,
  ReferenceLine
} from 'recharts';

interface MetricChartProps {
  datasets: ChartDataset[];
  title: string;
}

export default function MetricChart({ datasets, title }: MetricChartProps) {
  const allData = datasets.flatMap(ds => ds.data);
  
  if (allData.length === 0) {
    return (
      <div className="h-full bg-gray-800/50 rounded-xl p-4 border border-gray-700/50 backdrop-blur-sm hover:border-gray-600/50 transition-all duration-300 flex items-center justify-center">
        <div className="text-center">
        <div className="w-12 h-12 mx-auto mb-3 bg-gray-700/50 rounded-full flex items-center justify-center">
          <svg className="w-6 h-6 text-gray-400 animate-pulse" fill="none" stroke="currentColor" viewBox="0 0 24 24">
              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M9 19v-6a2 2 0 00-2-2H5a2 2 0 00-2 2v6a2 2 0 002 2h2a2 2 0 002-2zm0 0V9a2 2 0 012-2h2a2 2 0 012 2v10m-6 0a2 2 0 002 2h2a2 2 0 002-2m0 0V5a2 2 0 012-2h2a2 2 0 012 2v14a2 2 0 01-2 2h-2a2 2 0 01-2-2z" />
            </svg>
          </div>
          <h3 className="text-lg font-semibold text-gray-300 mb-2">{title}</h3>
          <p className="text-sm text-gray-500">Waiting for training data...</p>
          <div className="mt-3 flex justify-center">
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

  // Find the max length of all datasets
  const maxLen = Math.max(...datasets.map(ds => ds.data.length));
  // Build a unified data array for recharts, each entry is { index, [label1]: value1, [label2]: value2, ... }
  const chartData = Array.from({ length: maxLen }, (_, i) => {
    const entry: any = { index: i };
    datasets.forEach(ds => {
      entry[ds.label] = ds.data[i]?.value ?? null;
    });
    return entry;
  });

  const maxValue = Math.max(...allData.map(d => d.value));
  const minValue = Math.min(...allData.map(d => d.value));
  const range = maxValue - minValue || 1;

  return (
    <div className="h-full bg-gray-800/50 rounded-xl p-4 border border-gray-700/50 backdrop-blur-sm hover:border-gray-600/50 transition-all duration-300 flex flex-col">
      <div className="flex items-center justify-between mb-4">
        <h3 className="text-base font-semibold text-gray-100">{title}</h3>
        <div className="flex items-center space-x-3">
          {datasets.map(ds => ds.data.length > 0 && (
            <div key={ds.label} className="flex items-center space-x-2">
              <span className="w-3 h-3 rounded-full shadow-sm" style={{ backgroundColor: ds.color }}></span>
              <span className="text-sm text-gray-300 font-medium">{ds.label}</span>
              <span className="text-sm text-gray-400 bg-gray-700/50 px-2 py-1 rounded">
                {formatNumber(ds.data[ds.data.length - 1]?.value || 0)}
              </span>
            </div>
          ))}
        </div>
      </div>
      
      <div className="flex-1 bg-gray-900/50 rounded-lg p-4 border border-gray-700/30 relative min-h-0 overflow-hidden">
        <ResponsiveContainer width="100%" height="100%" minHeight={200}>
          <LineChart data={chartData} margin={{ top: 10, right: 20, left: 0, bottom: 30 }}>
            <CartesianGrid stroke="#374151" strokeDasharray="3 3" opacity={0.3} />
            <XAxis
              dataKey="index"
              tick={{ fill: '#9CA3AF', fontSize: 12 }}
              axisLine={{ stroke: '#374151' }}
              tickLine={false}
              ticks={[0, Math.floor(maxLen * 0.25), Math.floor(maxLen * 0.5), Math.floor(maxLen * 0.75), maxLen - 1]}
              domain={[0, maxLen - 1]}
              allowDecimals={false}
              interval={0}
            />
            <YAxis
              domain={[minValue, maxValue]}
              tick={{ fill: '#9CA3AF', fontSize: 12 }}
              axisLine={{ stroke: '#374151' }}
              tickLine={false}
              width={60}
              tickFormatter={v => formatNumber(v, 3)}
              ticks={[
                maxValue,
                (maxValue * 3 + minValue) / 4,
                (maxValue + minValue) / 2,
                (maxValue + minValue * 3) / 4,
                minValue
              ]}
            />
            <Tooltip
              contentStyle={{ background: '#1F2937', border: '1px solid #374151', borderRadius: 8, color: '#F3F4F6' }}
              labelStyle={{ color: '#9CA3AF' }}
              formatter={(value: any, name: string) => [formatNumber(value, 3), name]}
            />
            {/* Main lines */}
            {datasets.map(ds => ds.data.length > 1 && (
              <Line
                key={ds.label}
                type="monotone"
                dataKey={ds.label}
                stroke={ds.color}
                strokeWidth={3}
                dot={false}
                activeDot={false}
                isAnimationActive={false}
              />
            ))}
          </LineChart>
        </ResponsiveContainer>
      </div>
    </div>
  );
}

// Placeholder chart component for future metrics
export function PlaceholderChart({ title, color }: { title: string; color: string }) {
  return (
    <div className="h-full bg-gray-800/50 rounded-xl p-3 border border-gray-700/50 backdrop-blur-sm hover:border-gray-600/50 transition-all duration-300 flex flex-col">
      <div className="flex items-center justify-between mb-3">
        <h3 className="text-sm font-semibold text-gray-100">{title}</h3>
        <span className="text-xs text-gray-400 bg-gray-700/50 px-2 py-1 rounded-full">Coming Soon</span>
      </div>
      
      <div className="flex-1 bg-gray-900/50 rounded-lg p-3 border border-gray-700/30 flex items-center justify-center overflow-hidden">
        <div className="text-center">
          <div className="w-12 h-12 mx-auto mb-2 rounded-full flex items-center justify-center border-2 border-dashed border-gray-600">
            <svg className="w-6 h-6 text-gray-500" fill="none" stroke="currentColor" viewBox="0 0 24 24">
              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M9 19v-6a2 2 0 00-2-2H5a2 2 0 00-2 2v6a2 2 0 002 2h2a2 2 0 002-2zm0 0V9a2 2 0 012-2h2a2 2 0 012 2v10m-6 0a2 2 0 002 2h2a2 2 0 002-2m0 0V5a2 2 0 012-2h2a2 2 0 012 2v14a2 2 0 01-2 2h-2a2 2 0 01-2-2z" />
            </svg>
          </div>
          <h4 className="text-sm font-medium text-gray-300 mb-1">{title}</h4>
          <p className="text-xs text-gray-500 max-w-xs">
            This metric will be available in a future update.
          </p>
          <div className="mt-2">
            <div className="w-20 h-1 bg-gray-700 rounded-full mx-auto">
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
