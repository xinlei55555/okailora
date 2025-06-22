"use client";

import { useState, useRef, useEffect } from 'react';
import { useParams, useRouter } from 'next/navigation';
import { useChatContext } from '@/components/ChatWidget';
import { TrainService } from '@/api';

interface MetricPoint {
  epoch: number;
  step: number;
  value: number;
  timestamp: number;
}

interface TrainingStatus {
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

export default function FinetuneLoopPage() {
  const params = useParams();
  const router = useRouter();
  const { isChatOpen, openChatWithMessage } = useChatContext();
  const sessionId = params.sessionId as string;
  
  // Training status
  const [trainingStatus, setTrainingStatus] = useState<TrainingStatus>({
    isRunning: true,
    currentEpoch: 1,
    totalEpochs: 3,
    currentStep: 0,
    totalSteps: 120, // Assuming total steps, adjust if available from backend
    startTime: Date.now(),
    elapsedTime: 0,
    estimatedTimeRemaining: 0,
    learningRate: 0.00001
  });

  // Metrics data
  const [trainLossData, setTrainLossData] = useState<MetricPoint[]>([]);
  const [valLossData, setValLossData] = useState<MetricPoint[]>([]);
  const [trainAccData, setTrainAccData] = useState<MetricPoint[]>([]);
  const [valAccData, setValAccData] = useState<MetricPoint[]>([]);
  const [viewMode, setViewMode] = useState<'realtime' | 'epoch' | 'step'>('realtime');
  const [autoScroll, setAutoScroll] = useState(true);

  // UI state
  const [showConfig, setShowConfig] = useState(false);
  const [showLogs, setShowLogs] = useState(false);
  const [logMessages, setLogMessages] = useState<string[]>([]);

  // Training completed state
  const [isCompleted, setIsCompleted] = useState(false);

  // System resources state
  const [systemResources, setSystemResources] = useState({
    gpuMemory: 14.2,
    cpuUsage: 67,
    diskIO: 24,
    networkIO: 12
  });

  // Fetch real-time data from the backend
  useEffect(() => {
    if (!sessionId || !trainingStatus.isRunning) return;

    const intervalId = setInterval(async () => {
      try {
        const status = await TrainService.trainStatus(sessionId);

        const trainLoss = status.train_loss || [];
        const valLoss = status.val_loss || [];
        const trainAcc = status.train_acc || [];
        const valAcc = status.val_acc || [];

        setTrainLossData(trainLoss.map((value, index) => ({
            step: index + 1, value, epoch: 0, timestamp: Date.now()
        })));
        setValLossData(valLoss.map((value, index) => ({
            step: index + 1, value, epoch: 0, timestamp: Date.now()
        })));
        setTrainAccData(trainAcc.map((value, index) => ({
            step: index + 1, value, epoch: 0, timestamp: Date.now()
        })));
        setValAccData(valAcc.map((value, index) => ({
            step: index + 1, value, epoch: 0, timestamp: Date.now()
        })));

        const currentStep = trainLoss.length;
        const elapsedTime = Date.now() - trainingStatus.startTime;
        let estimatedTimeRemaining = 0;

        if (currentStep > 0 && trainingStatus.totalSteps > 0) {
            const totalTimeEstimate = (elapsedTime / currentStep) * trainingStatus.totalSteps;
            estimatedTimeRemaining = Math.max(0, totalTimeEstimate - elapsedTime);
        }

        setTrainingStatus(prev => ({
            ...prev,
            currentStep: currentStep,
            currentEpoch: prev.totalSteps > 0 && prev.totalEpochs > 0 ? Math.min(prev.totalEpochs, Math.floor(currentStep / (prev.totalSteps / prev.totalEpochs)) + 1) : 1,
            elapsedTime: elapsedTime,
            estimatedTimeRemaining: estimatedTimeRemaining
        }));

        if (status.finished) {
          setTrainingStatus(prev => ({ ...prev, isRunning: false, estimatedTimeRemaining: 0 }));
          setIsCompleted(true);
          setLogMessages(prev => [...prev, "Training completed successfully! 🎉"]);
          clearInterval(intervalId);
        }
      } catch (error) {
        console.error("Failed to fetch training status:", error);
        setTrainingStatus(prev => ({ ...prev, isRunning: false }));
        clearInterval(intervalId);
      }
    }, 1000);

    return () => clearInterval(intervalId);
  }, [sessionId, trainingStatus.isRunning, trainingStatus.startTime, trainingStatus.totalSteps, trainingStatus.totalEpochs]);

  // System resource fluctuation effect
  useEffect(() => {
    if (!trainingStatus.isRunning) return;

    const resourceInterval = setInterval(() => {
      setSystemResources(prev => ({
        gpuMemory: Math.max(12.0, Math.min(15.8, prev.gpuMemory + (Math.random() - 0.5) * 0.4)),
        cpuUsage: Math.max(45, Math.min(85, prev.cpuUsage + (Math.random() - 0.5) * 8)),
        diskIO: Math.max(5, Math.min(65, prev.diskIO + (Math.random() - 0.5) * 15)),
        networkIO: Math.max(2, Math.min(35, prev.networkIO + (Math.random() - 0.5) * 8))
      }));
    }, 2000);

    return () => clearInterval(resourceInterval);
  }, [trainingStatus.isRunning]);

  const formatTime = (ms: number) => {
    const seconds = Math.floor(ms / 1000);
    const minutes = Math.floor(seconds / 60);
    const hours = Math.floor(minutes / 60);
    
    if (hours > 0) {
      return `${hours}h ${minutes % 60}m ${seconds % 60}s`;
    } else if (minutes > 0) {
      return `${minutes}m ${seconds % 60}s`;
    } else {
      return `${seconds}s`;
    }
  };

  const formatNumber = (num: number, decimals: number = 4) => {
    return num.toFixed(decimals);
  };

  const getProgressPercentage = () => {
    return (trainingStatus.currentStep / trainingStatus.totalSteps) * 100;
  };

  const getCurrentEpoch = () => {
    // Infer epoch from training data length and steps per epoch
    const currentStep = trainLossData.length;
    const stepsPerEpoch = Math.floor(trainingStatus.totalSteps / trainingStatus.totalEpochs);
    return Math.min(trainingStatus.totalEpochs, Math.floor(currentStep / stepsPerEpoch) + 1);
  };

  const getCurrentLoss = () => {
    return trainLossData.length > 0 ? trainLossData[trainLossData.length - 1].value : 0;
  };

  const getBestAccuracy = () => {
    return valAccData.length > 0 ? Math.max(...valAccData.map(d => d.value)) : 0;
  };

  const getDataThroughput = () => {
    // Calculate samples processed per second based on elapsed time and current step
    const elapsedSeconds = trainingStatus.elapsedTime / 1000;
    const samplesPerStep = 8; // batch size
    const totalSamples = trainLossData.length * samplesPerStep;
    return elapsedSeconds > 0 ? totalSamples / elapsedSeconds : 0;
  };

  // Chart component for multiple datasets
  const renderChart = (datasets: { data: MetricPoint[], color: string, label: string }[], title: string) => {
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
  };

  // Placeholder chart component for future metrics
  const renderPlaceholderChart = (title: string, color: string) => {
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
  };

  return (
    <div className="h-screen bg-gray-950 text-white flex flex-col">
      {/* Header */}
      <header className="border-b border-gray-800 bg-gray-900/50 backdrop-blur-sm flex-shrink-0">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
          <div className="flex justify-between items-center h-16">
            <div className="flex items-center space-x-4">
              <button
                onClick={() => router.push(`/finetune/${sessionId}`)}
                className="flex items-center space-x-2 text-gray-400 hover:text-white transition-colors"
              >
                <svg className="w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M15 19l-7-7 7-7" />
                </svg>
                <span>Back to Setup</span>
              </button>
              <div className="text-xl font-bold text-blue-400">Okailora</div>
              <span className="text-gray-400">•</span>
              <h1 className="text-lg font-semibold">Training Monitor</h1>
              {trainingStatus.isRunning && (
                <div className="flex items-center space-x-2">
                  <div className="w-2 h-2 bg-green-400 rounded-full animate-pulse"></div>
                  <span className="text-sm text-green-400">Training Active</span>
                </div>
              )}
              {isCompleted && (
                <div className="flex items-center space-x-2">
                  <div className="w-2 h-2 bg-blue-400 rounded-full"></div>
                  <span className="text-sm text-blue-400">Training Complete</span>
                </div>
              )}
            </div>
            <div className="flex items-center space-x-4">
              <div className="text-sm text-gray-400">
                Session: {sessionId?.slice(0, 8)}...
              </div>
              {isCompleted && (
                <button
                  onClick={() => router.push(`/finetune-results/${sessionId}`)}
                  className="bg-blue-600 hover:bg-blue-700 text-white px-4 py-2 rounded-lg transition-colors text-sm font-medium"
                >
                  View Results →
                </button>
              )}
            </div>
          </div>
        </div>
      </header>

      <div className="flex flex-1 overflow-hidden">
        {/* Sidebar */}
        <aside className="w-80 bg-gray-900 border-r border-gray-800 flex-shrink-0 overflow-y-auto">
          <div className="p-6">
            {/* Training Progress */}
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

            {/* System Resources */}
            <div className="mb-6">
              <h3 className="text-sm font-semibold text-gray-400 uppercase tracking-wider mb-4">
                System Resources
              </h3>
              <div className="space-y-3">
                <div>
                  <div className="flex justify-between items-center mb-1">
                    <span className="text-sm text-gray-400">GPU Memory</span>
                    <span className="text-sm">{systemResources.gpuMemory.toFixed(1)} / 16.0 GB</span>
                  </div>
                  <div className="w-full bg-gray-700 rounded-full h-1">
                    <div 
                      className="bg-yellow-500 h-1 rounded-full transition-all duration-1000" 
                      style={{ width: `${(systemResources.gpuMemory / 16.0) * 100}%` }}
                    ></div>
                  </div>
                </div>
                <div>
                  <div className="flex justify-between items-center mb-1">
                    <span className="text-sm text-gray-400">CPU Usage</span>
                    <span className="text-sm">{Math.round(systemResources.cpuUsage)}%</span>
                  </div>
                  <div className="w-full bg-gray-700 rounded-full h-1">
                    <div 
                      className="bg-blue-500 h-1 rounded-full transition-all duration-1000" 
                      style={{ width: `${systemResources.cpuUsage}%` }}
                    ></div>
                  </div>
                </div>
                <div>
                  <div className="flex justify-between items-center mb-1">
                    <span className="text-sm text-gray-400">Disk I/O</span>
                    <span className="text-sm">{Math.round(systemResources.diskIO)}%</span>
                  </div>
                  <div className="w-full bg-gray-700 rounded-full h-1">
                    <div 
                      className="bg-green-500 h-1 rounded-full transition-all duration-1000" 
                      style={{ width: `${systemResources.diskIO}%` }}
                    ></div>
                  </div>
                </div>
                <div>
                  <div className="flex justify-between items-center mb-1">
                    <span className="text-sm text-gray-400">Network I/O</span>
                    <span className="text-sm">{Math.round(systemResources.networkIO)}%</span>
                  </div>
                  <div className="w-full bg-gray-700 rounded-full h-1">
                    <div 
                      className="bg-purple-500 h-1 rounded-full transition-all duration-1000" 
                      style={{ width: `${systemResources.networkIO}%` }}
                    ></div>
                  </div>
                </div>
              </div>
            </div>

            {/* Quick Actions */}
            <div className="mb-6">
              <h3 className="text-sm font-semibold text-gray-400 uppercase tracking-wider mb-4">
                Quick Actions
              </h3>
              <div className="space-y-2">
                <button
                  onClick={() => setShowConfig(!showConfig)}
                  className="w-full text-left text-sm text-gray-300 hover:text-white transition-colors flex items-center space-x-2"
                >
                  <span>⚙️</span>
                  <span>View Configuration</span>
                </button>
                <button
                  onClick={() => setShowLogs(!showLogs)}
                  className="w-full text-left text-sm text-gray-300 hover:text-white transition-colors flex items-center space-x-2"
                >
                  <span>📋</span>
                  <span>Training Logs</span>
                </button>
                <button
                  onClick={() => openChatWithMessage("I'm monitoring my training progress. Can you help me interpret the metrics and suggest any optimizations?")}
                  className="w-full text-left text-sm text-gray-300 hover:text-white transition-colors flex items-center space-x-2"
                >
                  <span>💬</span>
                  <span>Get AI Insights</span>
                </button>
                <button className="w-full text-left text-sm text-gray-300 hover:text-white transition-colors flex items-center space-x-2">
                  <span>📊</span>
                  <span>Export Metrics</span>
                </button>
                <button className="w-full text-left text-sm text-gray-300 hover:text-white transition-colors flex items-center space-x-2">
                  <span>📱</span>
                  <span>Setup Notifications</span>
                </button>
              </div>
            </div>
          </div>
        </aside>

        {/* Main Content */}
        <main className={`flex-1 transition-all duration-300 ${isChatOpen ? 'mr-96' : ''} flex flex-col overflow-hidden bg-gradient-to-br from-gray-950 via-gray-900 to-gray-950`}>
          <div className="flex-1 overflow-y-auto">
            <div className="p-8 space-y-8">
              {/* Controls */}
              <div className="flex items-center justify-between bg-gray-800/30 rounded-xl p-6 border border-gray-700/50 backdrop-blur-sm">
                <div className="flex items-center space-x-6">
                  <div className="flex bg-gray-800/70 rounded-lg p-1 border border-gray-700/50">
                    <button
                      onClick={() => setViewMode('realtime')}
                      className={`px-4 py-2 rounded-md text-sm font-medium transition-all duration-200 ${
                        viewMode === 'realtime' ? 'bg-green-600 text-white shadow-lg shadow-green-600/25' : 'text-gray-400 hover:text-white hover:bg-gray-700/50'
                      }`}
                    >
                      <span className="flex items-center space-x-2">
                        <div className="w-2 h-2 bg-current rounded-full animate-pulse"></div>
                        <span>Real-time</span>
                      </span>
                    </button>
                    <button
                      onClick={() => setViewMode('epoch')}
                      className={`px-4 py-2 rounded-md text-sm font-medium transition-all duration-200 ${
                        viewMode === 'epoch' ? 'bg-green-600 text-white shadow-lg shadow-green-600/25' : 'text-gray-400 hover:text-white hover:bg-gray-700/50'
                      }`}
                    >
                      By Epoch
                    </button>
                    <button
                      onClick={() => setViewMode('step')}
                      className={`px-4 py-2 rounded-md text-sm font-medium transition-all duration-200 ${
                        viewMode === 'step' ? 'bg-green-600 text-white shadow-lg shadow-green-600/25' : 'text-gray-400 hover:text-white hover:bg-gray-700/50'
                      }`}
                    >
                      By Step
                    </button>
                  </div>
                  
                  <div className="flex items-center space-x-2 text-sm text-gray-400">
                    <svg className="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                      <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M13 10V3L4 14h7v7l9-11h-7z" />
                    </svg>
                    <span>Live Updates: {trainingStatus.isRunning ? 'Active' : 'Paused'}</span>
                  </div>
                </div>

                <div className="flex items-center space-x-4">
                  <label className="flex items-center space-x-3 text-sm cursor-pointer">
                    <input
                      type="checkbox"
                      checked={autoScroll}
                      onChange={(e) => setAutoScroll(e.target.checked)}
                      className="w-4 h-4 rounded border-gray-600 bg-gray-700/50 text-blue-600 focus:ring-blue-500 focus:ring-2"
                    />
                    <span className="text-gray-300">Auto-scroll</span>
                  </label>
                  <div className="h-4 w-px bg-gray-600"></div>
                  <button className="flex items-center space-x-2 text-sm text-gray-400 hover:text-white transition-colors px-3 py-2 rounded-lg hover:bg-gray-700/50">
                    <svg className="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                      <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M3 9a2 2 0 012-2h.93a2 2 0 001.664-.89l.812-1.22A2 2 0 0110.07 4h3.86a2 2 0 011.664.89l.812 1.22A2 2 0 0018.07 7H19a2 2 0 012 2v9a2 2 0 01-2 2H5a2 2 0 01-2-2V9z" />
                      <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M15 13a3 3 0 11-6 0 3 3 0 016 0z" />
                    </svg>
                    <span>Screenshot</span>
                  </button>
                  <button className="flex items-center space-x-2 text-sm text-gray-400 hover:text-white transition-colors px-3 py-2 rounded-lg hover:bg-gray-700/50">
                    <svg className="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                      <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M8 7H5a2 2 0 00-2 2v9a2 2 0 002 2h14a2 2 0 002-2V9a2 2 0 00-2-2h-3m-1 4l-3 3m0 0l-3-3m3 3V4" />
                    </svg>
                    <span>Export</span>
                  </button>
                </div>
              </div>

              {/* Charts Grid */}
              <div className="grid gap-8 grid-cols-1 lg:grid-cols-2 2xl:grid-cols-2">
                {/* Row 1: Loss and Accuracy */}
                {renderChart(
                    [
                        { data: trainLossData, color: '#3B82F6', label: 'Train Loss' },
                        { data: valLossData, color: '#EF4444', label: 'Validation Loss' }
                    ],
                    'Training Loss'
                )}
                {renderChart(
                    [
                        { data: trainAccData, color: '#10B981', label: 'Train Accuracy' },
                        { data: valAccData, color: '#F59E0B', label: 'Validation Accuracy' }
                    ],
                    'Model Accuracy'
                )}
                
                {/* Row 2: Learning Rate and GPU Utilization */}
                {renderPlaceholderChart('Learning Rate Schedule', '#8B5CF6')}
                {renderPlaceholderChart('GPU Utilization', '#F97316')}
              </div>

              {/* Logs Modal */}
              {showLogs && (
                <div className="fixed inset-0 bg-black/60 backdrop-blur-sm flex items-center justify-center z-50">
                  <div className="bg-gray-900/95 rounded-2xl border border-gray-700/50 w-full max-w-4xl max-h-[80vh] flex flex-col shadow-2xl">
                    <div className="p-6 border-b border-gray-700/50 flex items-center justify-between">
                      <div className="flex items-center space-x-3">
                        <div className="w-8 h-8 rounded-lg bg-blue-500/20 flex items-center justify-center">
                          <svg className="w-4 h-4 text-blue-400" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                            <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M9 12h6m-6 4h6m2 5H7a2 2 0 01-2-2V5a2 2 0 012-2h5.586a1 1 0 01.707.293l5.414 5.414a1 1 0 01.293.707V19a2 2 0 01-2 2z" />
                          </svg>
                        </div>
                        <h3 className="text-xl font-semibold text-gray-100">Training Logs</h3>
                      </div>
                      <button
                        onClick={() => setShowLogs(false)}
                        className="text-gray-400 hover:text-white transition-colors p-2 hover:bg-gray-700/50 rounded-lg"
                      >
                        <svg className="w-6 h-6" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                          <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M6 18L18 6M6 6l12 12" />
                        </svg>
                      </button>
                    </div>
                    <div className="flex-1 overflow-y-auto p-6 bg-gray-950/50 font-mono text-sm">
                      {logMessages.map((message, index) => (
                        <div key={index} className="text-gray-300 mb-2 flex items-start space-x-3">
                          <span className="text-gray-500 text-xs mt-0.5 min-w-0">[{new Date().toLocaleTimeString()}]</span>
                          <span className="flex-1">{message}</span>
                        </div>
                      ))}
                      {logMessages.length === 0 && (
                        <div className="text-center text-gray-500 py-8">
                          <div className="text-4xl mb-4">📝</div>
                          <p>No log messages yet. Training logs will appear here as they become available.</p>
                        </div>
                      )}
                    </div>
                  </div>
                </div>
              )}

              {/* Config Modal */}
              {showConfig && (
                <div className="fixed inset-0 bg-black/60 backdrop-blur-sm flex items-center justify-center z-50">
                  <div className="bg-gray-900/95 rounded-2xl border border-gray-700/50 w-full max-w-3xl shadow-2xl">
                    <div className="p-6 border-b border-gray-700/50 flex items-center justify-between">
                      <div className="flex items-center space-x-3">
                        <div className="w-8 h-8 rounded-lg bg-purple-500/20 flex items-center justify-center">
                          <svg className="w-4 h-4 text-purple-400" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                            <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M10.325 4.317c.426-1.756 2.924-1.756 3.35 0a1.724 1.724 0 002.573 1.066c1.543-.94 3.31.826 2.37 2.37a1.724 1.724 0 001.065 2.572c1.756.426 1.756 2.924 0 3.35a1.724 1.724 0 00-1.066 2.573c.94 1.543-.826 3.31-2.37 2.37a1.724 1.724 0 00-2.572 1.065c-.426 1.756-2.924 1.756-3.35 0a1.724 1.724 0 00-2.573-1.066c-1.543.94-3.31-.826-2.37-2.37a1.724 1.724 0 00-1.065-2.572c-1.756-.426-1.756-2.924 0-3.35a1.724 1.724 0 001.066-2.573c-.94-1.543.826-3.31 2.37-2.37.996.608 2.296.07 2.572-1.065z" />
                            <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M15 12a3 3 0 11-6 0 3 3 0 016 0z" />
                          </svg>
                        </div>
                        <h3 className="text-xl font-semibold text-gray-100">Training Configuration</h3>
                      </div>
                      <button
                        onClick={() => setShowConfig(false)}
                        className="text-gray-400 hover:text-white transition-colors p-2 hover:bg-gray-700/50 rounded-lg"
                      >
                        <svg className="w-6 h-6" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                          <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M6 18L18 6M6 6l12 12" />
                        </svg>
                      </button>
                    </div>
                    <div className="p-8">
                      <div className="grid grid-cols-2 gap-6 text-sm">
                        <div className="space-y-1">
                          <div className="text-gray-400 text-xs uppercase tracking-wide">Model</div>
                          <div className="text-white font-medium text-lg">HealthcareGPT-7B</div>
                        </div>
                        <div className="space-y-1">
                          <div className="text-gray-400 text-xs uppercase tracking-wide">Learning Rate</div>
                          <div className="text-blue-400 font-medium text-lg">1e-5</div>
                        </div>
                        <div className="space-y-1">
                          <div className="text-gray-400 text-xs uppercase tracking-wide">Batch Size</div>
                          <div className="text-green-400 font-medium text-lg">8</div>
                        </div>
                        <div className="space-y-1">
                          <div className="text-gray-400 text-xs uppercase tracking-wide">Epochs</div>
                          <div className="text-purple-400 font-medium text-lg">3</div>
                        </div>
                        <div className="space-y-1">
                          <div className="text-gray-400 text-xs uppercase tracking-wide">Weight Decay</div>
                          <div className="text-orange-400 font-medium text-lg">0.01</div>
                        </div>
                        <div className="space-y-1">
                          <div className="text-gray-400 text-xs uppercase tracking-wide">Warmup Steps</div>
                          <div className="text-yellow-400 font-medium text-lg">500</div>
                        </div>
                        <div className="space-y-1">
                          <div className="text-gray-400 text-xs uppercase tracking-wide">Data Files</div>
                          <div className="text-cyan-400 font-medium text-lg">3</div>
                        </div>
                        <div className="space-y-1">
                          <div className="text-gray-400 text-xs uppercase tracking-wide">Total Samples</div>
                          <div className="text-pink-400 font-medium text-lg">12,450</div>
                        </div>
                      </div>
                    </div>
                  </div>
                </div>
              )}
            </div>
          </div>
        </main>
      </div>
    </div>
  );
}
