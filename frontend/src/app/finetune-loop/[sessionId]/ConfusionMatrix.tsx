import { Cell, ResponsiveContainer, BarChart, Bar, XAxis, YAxis, CartesianGrid } from 'recharts';

interface ConfusionMatrixData {
  name: string;
  value: number;
  x: number;
  y: number;
  isCorrect: boolean;
}

export default function ConfusionMatrix() {
  // Mock confusion matrix data for demonstration
  const confusionData = [
    [85, 2, 1, 0],
    [3, 82, 3, 0],
    [1, 4, 79, 2],
    [0, 1, 2, 91]
  ];
  
  const labels = ['Class A', 'Class B', 'Class C', 'Class D'];
  const maxValue = Math.max(...confusionData.flat());

  // Convert matrix to heatmap data for visualization
  const heatmapData: ConfusionMatrixData[] = [];
  confusionData.forEach((row, rowIdx) => {
    row.forEach((value, colIdx) => {
      heatmapData.push({
        name: `${labels[rowIdx]} → ${labels[colIdx]}`,
        value,
        x: colIdx,
        y: rowIdx,
        isCorrect: rowIdx === colIdx
      });
    });
  });

  const getColor = (value: number, isCorrect: boolean) => {
    const intensity = value / maxValue;
    if (isCorrect) {
      return `rgba(34, 197, 94, ${0.3 + intensity * 0.7})`;
    } else {
      return `rgba(239, 68, 68, ${0.2 + intensity * 0.5})`;
    }
  };

  return (
    <div className="h-full bg-gray-800/50 rounded-xl p-4 border border-gray-700/50 backdrop-blur-sm hover:border-gray-600/50 transition-all duration-300 flex flex-col">
      <div className="flex items-center justify-between mb-4">
        <h3 className="text-base font-semibold text-gray-100">Confusion Matrix</h3>
        <span className="text-sm text-gray-400 bg-gray-700/50 px-3 py-1 rounded-full">Accuracy: 92.7%</span>
      </div>
      
      <div className="flex-1 bg-gray-900/50 rounded-lg p-4 border border-gray-700/30 flex flex-col">
        <div className="flex-1 flex items-center justify-center">
          <div className="w-full max-w-sm">
            {/* Labels */}
            <div className="flex justify-center mb-3">
              <span className="text-sm text-gray-400 font-medium">Predicted</span>
            </div>
            
            <div className="flex">
              {/* Y-axis label */}
              <div className="flex flex-col justify-center mr-3">
                <span className="text-sm text-gray-400 font-medium transform -rotate-90 whitespace-nowrap">Actual</span>
              </div>
              
              {/* Matrix */}
              <div className="flex-1">
                {/* Column headers */}
                <div className="grid grid-cols-4 gap-1 mb-2">
                  {labels.map((label, idx) => (
                    <div key={idx} className="text-sm text-gray-400 text-center font-medium">
                      {label.split(' ')[1]}
                    </div>
                  ))}
                </div>
                
                {/* Matrix cells */}
                <div className="space-y-1">
                  {confusionData.map((row, rowIdx) => (
                    <div key={rowIdx} className="flex items-center gap-1">
                      <span className="text-sm text-gray-400 font-medium w-8">
                        {labels[rowIdx].split(' ')[1]}
                      </span>
                      <div className="grid grid-cols-4 gap-1 flex-1">
                        {row.map((value, colIdx) => {
                          const isCorrect = rowIdx === colIdx;
                          return (
                            <div
                              key={colIdx}
                              className="aspect-square flex items-center justify-center rounded-lg text-sm font-semibold border border-gray-600/30 transition-all duration-200 hover:scale-105"
                              style={{
                                backgroundColor: getColor(value, isCorrect),
                                color: value > maxValue * 0.6 ? 'white' : 'rgb(209, 213, 219)'
                              }}
                            >
                              {value}
                            </div>
                          );
                        })}
                      </div>
                    </div>
                  ))}
                </div>
              </div>
            </div>
          </div>
        </div>
        
        {/* Legend */}
        <div className="mt-4 pt-3 border-t border-gray-700/50">
          <div className="flex items-center justify-between text-sm text-gray-400">
            <div className="flex items-center space-x-6">
              <div className="flex items-center space-x-2">
                <div className="w-4 h-4 bg-green-500/50 rounded-lg border border-green-500/70"></div>
                <span>Correct</span>
              </div>
              <div className="flex items-center space-x-2">
                <div className="w-4 h-4 bg-red-500/40 rounded-lg border border-red-500/70"></div>
                <span>Incorrect</span>
              </div>
            </div>
            <span>Total: 348 samples</span>
          </div>
        </div>
      </div>
    </div>
  );
}
