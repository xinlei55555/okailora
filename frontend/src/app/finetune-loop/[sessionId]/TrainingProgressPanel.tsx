import { TrainingStatus, MetricPoint } from './types';
import { formatTime, formatNumber } from './utils';

interface TrainingProgressPanelProps {
  trainingStatus: TrainingStatus;
  trainLossData: MetricPoint[];
  valAccData: MetricPoint[];
  getCurrentLoss: () => number;
  getBestAccuracy: () => number;
  getDataThroughput: () => number;
  getCurrentEpoch: () => number;
}

export default function TrainingProgressPanel({
  trainingStatus,
  trainLossData,
  valAccData,
  getCurrentLoss,
  getBestAccuracy,
  getDataThroughput,
  getCurrentEpoch
}: TrainingProgressPanelProps) {
  return (
    <div className="mb-6">
      <h2 className="text-sm font-semibold text-gray-400 uppercase tracking-wider mb-4">
        Training Progress
      </h2>
      <div className="space-y-4">
        <div>
          <div className="flex justify-between items-center mb-2">
            <span className="text-sm text-gray-400">Current Loss</span>
            <span className="text-sm font-medium text-blue-400">{formatNumber(getCurrentLoss())}</span>
          </div>
          <div className="w-full bg-gray-700 rounded-full h-2">
            <div
              className="bg-gradient-to-r from-blue-500 to-blue-600 h-2 rounded-full transition-all duration-500"
              style={{ width: `${Math.max(5, Math.min(95, (1 - getCurrentLoss()) * 100))}%` }}
            ></div>
          </div>
        </div>
        
        <div className="grid grid-cols-2 gap-4 text-sm">
          <div>
            <div className="text-gray-400">Epoch</div>
            <div className="font-medium">{getCurrentEpoch()}/{trainingStatus.totalEpochs}</div>
          </div>
          <div>
            <div className="text-gray-400">Steps</div>
            <div className="font-medium">{trainLossData.length}</div>
          </div>
          <div>
            <div className="text-gray-400">Elapsed</div>
            <div className="font-medium">{formatTime(trainingStatus.elapsedTime)}</div>
          </div>
          <div>
            <div className="text-gray-400">Best Acc</div>
            <div className="font-medium text-green-400">{formatNumber(getBestAccuracy() * 100, 1)}%</div>
          </div>
          <div className="col-span-2">
            <div className="text-gray-400">Throughput</div>
            <div className="font-medium text-cyan-400">{formatNumber(getDataThroughput(), 1)} samples/sec</div>
          </div>
        </div>
      </div>
    </div>
  );
}
