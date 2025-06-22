import { LineChart, Line, XAxis, YAxis, CartesianGrid, ResponsiveContainer, ReferenceLine, Area, AreaChart } from 'recharts';

export default function ROCCurve() {
  // Mock ROC curve data for demonstration
  const rocData = [
    { fpr: 0, tpr: 0 },
    { fpr: 0.05, tpr: 0.15 },
    { fpr: 0.1, tpr: 0.35 },
    { fpr: 0.15, tpr: 0.55 },
    { fpr: 0.2, tpr: 0.72 },
    { fpr: 0.25, tpr: 0.84 },
    { fpr: 0.3, tpr: 0.91 },
    { fpr: 0.4, tpr: 0.96 },
    { fpr: 0.5, tpr: 0.98 },
    { fpr: 0.7, tpr: 0.99 },
    { fpr: 1, tpr: 1 }
  ];

  const auc = 0.947; // Area Under Curve

  return (
    <div className="h-full bg-gray-800/50 rounded-xl p-4 border border-gray-700/50 backdrop-blur-sm hover:border-gray-600/50 transition-all duration-300 flex flex-col">
      <div className="flex items-center justify-between mb-4">
        <h3 className="text-lg font-semibold text-gray-100">ROC Curve</h3>
        <span className="text-sm text-gray-400 bg-gray-700/50 px-3 py-1 rounded-full">AUC: {auc}</span>
      </div>
      
      <div className="flex-1 bg-gray-900/50 rounded-lg p-4 border border-gray-700/30">
        <ResponsiveContainer width="100%" height="100%">
          <AreaChart data={rocData} margin={{ top: 5, right: 5, left: 5, bottom: 5 }}>
            <CartesianGrid strokeDasharray="3 3" stroke="#374151" />
            <XAxis 
              dataKey="fpr" 
              domain={[0, 1]}
              type="number"
              tick={{ fill: '#9CA3AF', fontSize: 12 }}
              axisLine={{ stroke: '#6B7280' }}
              label={{ value: 'False Positive Rate', position: 'insideBottom', offset: -5, style: { textAnchor: 'middle', fill: '#9CA3AF', fontSize: '12px' } }}
            />
            <YAxis 
              domain={[0, 1]}
              tick={{ fill: '#9CA3AF', fontSize: 12 }}
              axisLine={{ stroke: '#6B7280' }}
              label={{ value: 'True Positive Rate', angle: -90, position: 'insideLeft', style: { textAnchor: 'middle', fill: '#9CA3AF', fontSize: '12px' } }}
            />
            <ReferenceLine stroke="#6B7280" strokeDasharray="5 5" segment={[{ x: 0, y: 0 }, { x: 1, y: 1 }]} />
            <Area
              type="monotone"
              dataKey="tpr"
              stroke="#3B82F6"
              strokeWidth={3}
              fill="rgba(59, 130, 246, 0.2)"
              dot={{ fill: '#3B82F6', strokeWidth: 2, r: 4 }}
            />
          </AreaChart>
        </ResponsiveContainer>
      </div>
      
      <div className="mt-4 pt-3 border-t border-gray-700/50">
        <div className="flex items-center justify-between text-sm text-gray-400">
          <div className="flex items-center space-x-4">
            <div className="flex items-center space-x-2">
              <div className="w-4 h-2 bg-blue-500 rounded"></div>
              <span>ROC Curve</span>
            </div>
            <div className="flex items-center space-x-2">
              <div className="w-4 h-0.5 bg-gray-400 rounded opacity-70" style={{ backgroundImage: 'repeating-linear-gradient(to right, transparent, transparent 2px, rgb(107, 114, 128) 2px, rgb(107, 114, 128) 4px)' }}></div>
              <span>Random</span>
            </div>
          </div>
          <span>Perfect: AUC = 1.0</span>
        </div>
      </div>
    </div>
  );
}
