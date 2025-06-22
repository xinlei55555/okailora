export interface MetricPoint {
  epoch: number;
  step: number;
  value: number;
  timestamp: number;
}

export interface TrainingStatus {
  isRunning: boolean;
  currentEpoch: number;
  totalEpochs: number;
  currentStep: number;
  totalSteps: number;
  startTime: number;
  elapsedTime: number;
  estimatedTimeRemaining: number;
  learningRate: number;
}

export interface SystemResources {
  gpuMemory: number;
  cpuUsage: number;
  diskIO: number;
  networkIO: number;
}

export type ViewMode = 'realtime' | 'epoch' | 'step';

export interface ChartDataset {
  data: MetricPoint[];
  color: string;
  label: string;
}
