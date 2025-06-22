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

  // Chart component for multiple datasets
  const renderChart = (datasets: { data: MetricPoint[], color: string, label: string }[], title: string) => {
    const allData = datasets.flatMap(ds => ds.data);
    if (allData.length === 0) {
        return (
            <div className="bg-gray-800/50 rounded-lg p-6 border border-gray-700 h-full flex items-center justify-center min-h-[24rem]">
                <div className="text-center">
                    <h3 className="text-lg font-semibold text-gray-400">{title}</h3>
                    <p className="text-sm text-gray-500">Waiting for training data...</p>
                </div>
            </div>
        );
    }

    const maxValue = Math.max(...allData.map(d => d.value));
    const minValue = Math.min(...allData.map(d => d.value));
    const range = maxValue - minValue || 1;

    return (
      <div className="bg-gray-800/50 rounded-lg p-6 border border-gray-700">
        <div className="flex items-center justify-between mb-4">
          <h3 className="text-lg font-semibold">{title}</h3>
          <div className="flex items-center space-x-4">
            {datasets.map(ds => ds.data.length > 0 && (
              <span key={ds.label} className="text-sm text-gray-400 flex items-center">
                <span className="w-3 h-3 rounded-full mr-2" style={{ backgroundColor: ds.color }}></span>
                {ds.label}: {formatNumber(ds.data[ds.data.length - 1]?.value || 0)}
              </span>
            ))}
          </div>
        </div>
        
        <div className="relative h-64 bg-gray-900 rounded-lg p-4">
          <svg className="w-full h-full" viewBox="0 0 400 200">
            {/* Grid lines */}
            {[0, 1, 2, 3, 4].map(i => (
              <line
                key={`grid-${i}`}
                x1="0"
                y1={i * 50}
                x2="400"
                y2={i * 50}
                stroke="#374151"
                strokeWidth="1"
                opacity="0.3"
              />
            ))}
            
            {/* Data lines */}
            {datasets.map(ds => ds.data.length > 1 && (
              <polyline
                key={ds.label}
                points={ds.data.map((point, index) => {
                  const x = (index / (ds.data.length - 1)) * 400;
                  const y = 200 - ((point.value - minValue) / range) * 200;
                  return `${x},${y}`;
                }).join(' ')}
                fill="none"
                stroke={ds.color}
                strokeWidth="2"
              />
            ))}
          </svg>
          
          {/* Y-axis labels */}
          <div className="absolute left-0 top-0 h-full flex flex-col justify-between text-xs text-gray-400 -ml-12">
            <span>{formatNumber(maxValue, 2)}</span>
            <span>{formatNumber((maxValue + minValue) / 2, 2)}</span>
            <span>{formatNumber(minValue, 2)}</span>
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
                    <span className="text-sm text-gray-400">Overall Progress</span>
                    <span className="text-sm font-medium">{getProgressPercentage().toFixed(1)}%</span>
                  </div>
                  <div className="w-full bg-gray-700 rounded-full h-2">
                    <div
                      className="bg-blue-500 h-2 rounded-full transition-all duration-500"
                      style={{ width: `${getProgressPercentage()}%` }}
                    ></div>
                  </div>
                </div>
                
                <div className="grid grid-cols-2 gap-4 text-sm">
                  <div>
                    <div className="text-gray-400">Epoch</div>
                    <div className="font-medium">{trainingStatus.currentEpoch}/{trainingStatus.totalEpochs}</div>
                  </div>
                  <div>
                    <div className="text-gray-400">Step</div>
                    <div className="font-medium">{trainingStatus.currentStep}/{trainingStatus.totalSteps}</div>
                  </div>
                  <div>
                    <div className="text-gray-400">Elapsed</div>
                    <div className="font-medium">{formatTime(trainingStatus.elapsedTime)}</div>
                  </div>
                  <div>
                    <div className="text-gray-400">Remaining</div>
                    <div className="font-medium">{formatTime(trainingStatus.estimatedTimeRemaining)}</div>
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
                    <span className="text-sm">14.2 / 16.0 GB</span>
                  </div>
                  <div className="w-full bg-gray-700 rounded-full h-1">
                    <div className="bg-yellow-500 h-1 rounded-full" style={{ width: '89%' }}></div>
                  </div>
                </div>
                <div>
                  <div className="flex justify-between items-center mb-1">
                    <span className="text-sm text-gray-400">CPU Usage</span>
                    <span className="text-sm">67%</span>
                  </div>
                  <div className="w-full bg-gray-700 rounded-full h-1">
                    <div className="bg-blue-500 h-1 rounded-full" style={{ width: '67%' }}></div>
                  </div>
                </div>
                <div>
                  <div className="flex justify-between items-center mb-1">
                    <span className="text-sm text-gray-400">Disk I/O</span>
                    <span className="text-sm">24%</span>
                  </div>
                  <div className="w-full bg-gray-700 rounded-full h-1">
                    <div className="bg-green-500 h-1 rounded-full" style={{ width: '24%' }}></div>
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
        <main className={`flex-1 transition-all duration-300 ${isChatOpen ? 'mr-96' : ''} flex flex-col overflow-hidden`}>
          <div className="flex-1 overflow-y-auto">
            <div className="p-8">
              {/* Controls */}
              <div className="mb-6 flex items-center justify-between">
                <div className="flex items-center space-x-4">
                  <div className="flex bg-gray-800 rounded-lg p-1">
                    <button
                      onClick={() => setViewMode('realtime')}
                      className={`px-3 py-1 rounded text-sm transition-colors ${
                        viewMode === 'realtime' ? 'bg-green-600 text-white' : 'text-gray-400 hover:text-white'
                      }`}
                    >
                      Real-time
                    </button>
                    <button
                      onClick={() => setViewMode('epoch')}
                      className={`px-3 py-1 rounded text-sm transition-colors ${
                        viewMode === 'epoch' ? 'bg-green-600 text-white' : 'text-gray-400 hover:text-white'
                      }`}
                    >
                      By Epoch
                    </button>
                    <button
                      onClick={() => setViewMode('step')}
                      className={`px-3 py-1 rounded text-sm transition-colors ${
                        viewMode === 'step' ? 'bg-green-600 text-white' : 'text-gray-400 hover:text-white'
                      }`}
                    >
                      By Step
                    </button>
                  </div>
                </div>

                <div className="flex items-center space-x-4">
                  <label className="flex items-center space-x-2 text-sm">
                    <input
                      type="checkbox"
                      checked={autoScroll}
                      onChange={(e) => setAutoScroll(e.target.checked)}
                      className="rounded border-gray-600 bg-gray-700"
                    />
                    <span>Auto-scroll</span>
                  </label>
                  <button className="text-sm text-gray-400 hover:text-white transition-colors">
                    📷 Screenshot
                  </button>
                  <button className="text-sm text-gray-400 hover:text-white transition-colors">
                    💾 Save View
                  </button>
                </div>
              </div>

              {/* Charts */}
              <div className="grid gap-6 grid-cols-1 xl:grid-cols-2">
                {renderChart(
                    [
                        { data: trainAccData, color: '#10B981', label: 'Train Accuracy' },
                        { data: valAccData, color: '#F59E0B', label: 'Validation Accuracy' }
                    ],
                    'Accuracy'
                )}
                {renderChart(
                    [
                        { data: trainLossData, color: '#3B82F6', label: 'Train Loss' },
                        { data: valLossData, color: '#EF4444', label: 'Validation Loss' }
                    ],
                    'Loss'
                )}
              </div>

              {/* Logs Modal */}
              {showLogs && (
                <div className="fixed inset-0 bg-black/50 flex items-center justify-center z-50">
                  <div className="bg-gray-900 rounded-lg border border-gray-700 w-full max-w-4xl max-h-[80vh] flex flex-col">
                    <div className="p-4 border-b border-gray-700 flex items-center justify-between">
                      <h3 className="text-lg font-semibold">Training Logs</h3>
                      <button
                        onClick={() => setShowLogs(false)}
                        className="text-gray-400 hover:text-white"
                      >
                        <svg className="w-6 h-6" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                          <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M6 18L18 6M6 6l12 12" />
                        </svg>
                      </button>
                    </div>
                    <div className="flex-1 overflow-y-auto p-4 bg-gray-950 font-mono text-sm">
                      {logMessages.map((message, index) => (
                        <div key={index} className="text-gray-300 mb-1">
                          [{new Date().toLocaleTimeString()}] {message}
                        </div>
                      ))}
                    </div>
                  </div>
                </div>
              )}

              {/* Config Modal */}
              {showConfig && (
                <div className="fixed inset-0 bg-black/50 flex items-center justify-center z-50">
                  <div className="bg-gray-900 rounded-lg border border-gray-700 w-full max-w-2xl">
                    <div className="p-4 border-b border-gray-700 flex items-center justify-between">
                      <h3 className="text-lg font-semibold">Training Configuration</h3>
                      <button
                        onClick={() => setShowConfig(false)}
                        className="text-gray-400 hover:text-white"
                      >
                        <svg className="w-6 h-6" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                          <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M6 18L18 6M6 6l12 12" />
                        </svg>
                      </button>
                    </div>
                    <div className="p-6">
                      <div className="grid grid-cols-2 gap-4 text-sm">
                        <div><span className="text-gray-400">Model:</span> HealthcareGPT-7B</div>
                        <div><span className="text-gray-400">Learning Rate:</span> 1e-5</div>
                        <div><span className="text-gray-400">Batch Size:</span> 8</div>
                        <div><span className="text-gray-400">Epochs:</span> 3</div>
                        <div><span className="text-gray-400">Weight Decay:</span> 0.01</div>
                        <div><span className="text-gray-400">Warmup Steps:</span> 500</div>
                        <div><span className="text-gray-400">Data Files:</span> 3</div>
                        <div><span className="text-gray-400">Total Samples:</span> 12,450</div>
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
