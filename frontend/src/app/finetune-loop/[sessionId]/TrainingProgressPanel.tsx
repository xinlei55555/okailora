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
            <div className="text-gray-400">Current Loss</div>
            <div className="font-medium text-blue-400">{formatNumber(getCurrentLoss())}</div>
          </div>
          <div>
            <div className="text-gray-400">Elapsed</div>
            <div className="font-medium">{formatTime(trainingStatus.elapsedTime)}</div>
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
