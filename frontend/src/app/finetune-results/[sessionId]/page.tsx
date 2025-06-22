"use client";

import { useState, useEffect } from 'react';
import { useParams, useRouter } from 'next/navigation';
import { useChatContext } from '@/components/ChatWidget';

interface ModelMetrics {
  finalAccuracy: number;
  finalLoss: number;
  bestAccuracy: number;
  bestLoss: number;
  trainingTime: string;
  totalEpochs: number;
  totalSteps: number;
  convergenceEpoch: number;
}

interface EvaluationResult {
  metric: string;
  value: number;
  baseline: number;
  improvement: number;
  unit: string;
}

export default function FinetuneResultsPage() {
  const params = useParams();
  const router = useRouter();
  const { isChatOpen, openChatWithMessage } = useChatContext();
  const sessionId = params.sessionId as string;
  
  const [modelMetrics] = useState<ModelMetrics>({
    finalAccuracy: 0.8734,
    finalLoss: 0.3421,
    bestAccuracy: 0.8891,
    bestLoss: 0.3156,
    trainingTime: "2h 18m 45s",
    totalEpochs: 3,
    totalSteps: 1200,
    convergenceEpoch: 2
  });

  const [evaluationResults] = useState<EvaluationResult[]>([
    { metric: "Accuracy", value: 87.34, baseline: 72.15, improvement: 15.19, unit: "%" },
    { metric: "F1 Score", value: 0.8456, baseline: 0.7123, improvement: 18.72, unit: "" },
    { metric: "Precision", value: 0.8612, baseline: 0.7089, improvement: 21.47, unit: "" },
    { metric: "Recall", value: 0.8301, baseline: 0.7157, improvement: 15.99, unit: "" },
    { metric: "BLEU Score", value: 0.6789, baseline: 0.5234, improvement: 29.71, unit: "" },
    { metric: "Perplexity", value: 12.45, baseline: 18.92, improvement: -34.20, unit: "" }
  ]);

  const [selectedTab, setSelectedTab] = useState<'overview' | 'evaluation' | 'model' | 'deployment'>('overview');
  const [deploymentStatus, setDeploymentStatus] = useState<'none' | 'deploying' | 'deployed' | 'failed'>('none');
  const [modelDownloaded, setModelDownloaded] = useState(false);

  const formatNumber = (num: number, decimals: number = 2) => {
    return num.toFixed(decimals);
  };

  const getImprovementColor = (improvement: number) => {
    if (improvement > 20) return 'text-green-400';
    if (improvement > 10) return 'text-green-300';
    if (improvement > 0) return 'text-green-200';
    if (improvement > -10) return 'text-yellow-400';
    return 'text-red-400';
  };

  const handleDeploy = () => {
    setDeploymentStatus('deploying');
    setTimeout(() => {
      setDeploymentStatus('deployed');
    }, 3000);
  };

  const handleDownload = () => {
    setModelDownloaded(true);
    // Simulate download
    setTimeout(() => {
      setModelDownloaded(false);
    }, 2000);
  };

  const renderOverviewTab = () => (
    <div className="space-y-6">
      {/* Success Banner */}
      <div className="bg-gradient-to-r from-green-900/20 to-blue-900/20 border border-green-800 rounded-lg p-6">
        <div className="flex items-center space-x-4">
          <div className="text-4xl">🎉</div>
          <div>
            <h3 className="text-xl font-semibold text-green-300 mb-2">Training Completed Successfully!</h3>
            <p className="text-green-200">
              Your HealthcareGPT-7B model has been fine-tuned and is ready for deployment. 
              Training completed in {modelMetrics.trainingTime} with significant performance improvements.
            </p>
          </div>
        </div>
      </div>

      {/* Key Metrics Grid */}
      <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-6">
        <div className="bg-gray-800/50 rounded-lg p-6 border border-gray-700">
          <div className="flex items-center space-x-3 mb-2">
            <div className="text-2xl">🎯</div>
            <div className="text-sm font-medium text-gray-400">Final Accuracy</div>
          </div>
          <div className="text-2xl font-bold text-green-400">{(modelMetrics.finalAccuracy * 100).toFixed(2)}%</div>
          <div className="text-sm text-gray-400">Best: {(modelMetrics.bestAccuracy * 100).toFixed(2)}%</div>
        </div>

        <div className="bg-gray-800/50 rounded-lg p-6 border border-gray-700">
          <div className="flex items-center space-x-3 mb-2">
            <div className="text-2xl">📉</div>
            <div className="text-sm font-medium text-gray-400">Final Loss</div>
          </div>
          <div className="text-2xl font-bold text-blue-400">{modelMetrics.finalLoss.toFixed(4)}</div>
          <div className="text-sm text-gray-400">Best: {modelMetrics.bestLoss.toFixed(4)}</div>
        </div>

        <div className="bg-gray-800/50 rounded-lg p-6 border border-gray-700">
          <div className="flex items-center space-x-3 mb-2">
            <div className="text-2xl">⏱️</div>
            <div className="text-sm font-medium text-gray-400">Training Time</div>
          </div>
          <div className="text-2xl font-bold text-purple-400">{modelMetrics.trainingTime}</div>
          <div className="text-sm text-gray-400">{modelMetrics.totalSteps} steps</div>
        </div>

        <div className="bg-gray-800/50 rounded-lg p-6 border border-gray-700">
          <div className="flex items-center space-x-3 mb-2">
            <div className="text-2xl">🔄</div>
            <div className="text-sm font-medium text-gray-400">Convergence</div>
          </div>
          <div className="text-2xl font-bold text-orange-400">Epoch {modelMetrics.convergenceEpoch}</div>
          <div className="text-sm text-gray-400">Early convergence</div>
        </div>
      </div>

      {/* Performance Summary */}
      <div className="bg-gray-800/50 rounded-lg p-6 border border-gray-700">
        <h3 className="text-lg font-semibold mb-4">Performance Summary</h3>
        <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
          <div>
            <h4 className="font-medium mb-3 text-blue-400">Model Improvements</h4>
            <div className="space-y-2">
              {evaluationResults.slice(0, 3).map((result, index) => (
                <div key={index} className="flex justify-between items-center">
                  <span className="text-sm text-gray-400">{result.metric}:</span>
                  <div className="flex items-center space-x-2">
                    <span className="font-medium">{result.value.toFixed(2)}{result.unit}</span>
                    <span className={`text-xs ${getImprovementColor(result.improvement)}`}>
                      {result.improvement > 0 ? '+' : ''}{result.improvement.toFixed(1)}%
                    </span>
                  </div>
                </div>
              ))}
            </div>
          </div>
          <div>
            <h4 className="font-medium mb-3 text-green-400">Training Efficiency</h4>
            <div className="space-y-2 text-sm">
              <div className="flex justify-between">
                <span className="text-gray-400">GPU Hours Used:</span>
                <span>4.8 hours</span>
              </div>
              <div className="flex justify-between">
                <span className="text-gray-400">Cost:</span>
                <span className="text-green-400">$14.25</span>
              </div>
              <div className="flex justify-between">
                <span className="text-gray-400">Efficiency Score:</span>
                <span className="text-blue-400">92%</span>
              </div>
            </div>
          </div>
        </div>
      </div>

      {/* Quick Actions */}
      <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
        <button
          onClick={handleDeploy}
          disabled={deploymentStatus === 'deploying'}
          className="bg-gradient-to-r from-blue-600 to-purple-600 hover:from-blue-700 hover:to-purple-700 disabled:opacity-50 text-white p-4 rounded-lg transition-all font-semibold"
        >
          {deploymentStatus === 'deploying' ? '🚀 Deploying...' : 
           deploymentStatus === 'deployed' ? '✅ Deployed' : '🚀 Deploy Model'}
        </button>
        
        <button
          onClick={handleDownload}
          disabled={modelDownloaded}
          className="bg-gray-700 hover:bg-gray-600 disabled:opacity-50 text-white p-4 rounded-lg transition-colors font-semibold"
        >
          {modelDownloaded ? '⬇️ Downloading...' : '💾 Download Model'}
        </button>
        
        <button
          onClick={() => openChatWithMessage("My model training is complete! Can you help me understand the results and suggest next steps for deployment and optimization?")}
          className="bg-green-700 hover:bg-green-600 text-white p-4 rounded-lg transition-colors font-semibold"
        >
          💬 Get AI Analysis
        </button>
      </div>
    </div>
  );

  const renderEvaluationTab = () => (
    <div className="space-y-6">
      <div className="bg-gray-800/50 rounded-lg p-6 border border-gray-700">
        <h3 className="text-lg font-semibold mb-4">Detailed Evaluation Metrics</h3>
        <div className="overflow-x-auto">
          <table className="w-full text-sm">
            <thead>
              <tr className="border-b border-gray-700">
                <th className="text-left py-3 text-gray-400">Metric</th>
                <th className="text-right py-3 text-gray-400">Current Value</th>
                <th className="text-right py-3 text-gray-400">Baseline</th>
                <th className="text-right py-3 text-gray-400">Improvement</th>
                <th className="text-right py-3 text-gray-400">Status</th>
              </tr>
            </thead>
            <tbody>
              {evaluationResults.map((result, index) => (
                <tr key={index} className="border-b border-gray-800">
                  <td className="py-3 font-medium">{result.metric}</td>
                  <td className="text-right py-3">{result.value.toFixed(4)}{result.unit}</td>
                  <td className="text-right py-3 text-gray-400">{result.baseline.toFixed(4)}{result.unit}</td>
                  <td className={`text-right py-3 ${getImprovementColor(result.improvement)}`}>
                    {result.improvement > 0 ? '+' : ''}{result.improvement.toFixed(2)}%
                  </td>
                  <td className="text-right py-3">
                    {result.improvement > 15 ? '🟢' : result.improvement > 5 ? '🟡' : '🔴'}
                  </td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>
      </div>

      {/* Performance Analysis */}
      <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
        <div className="bg-gray-800/50 rounded-lg p-6 border border-gray-700">
          <h4 className="font-semibold mb-4">Strengths</h4>
          <div className="space-y-2">
            <div className="flex items-center space-x-2">
              <span className="text-green-400">✓</span>
              <span className="text-sm">Excellent F1 score improvement (+18.72%)</span>
            </div>
            <div className="flex items-center space-x-2">
              <span className="text-green-400">✓</span>
              <span className="text-sm">Strong precision gains (+21.47%)</span>
            </div>
            <div className="flex items-center space-x-2">
              <span className="text-green-400">✓</span>
              <span className="text-sm">Significant perplexity reduction (-34.20%)</span>
            </div>
            <div className="flex items-center space-x-2">
              <span className="text-green-400">✓</span>
              <span className="text-sm">Fast convergence at epoch 2</span>
            </div>
          </div>
        </div>

        <div className="bg-gray-800/50 rounded-lg p-6 border border-gray-700">
          <h4 className="font-semibold mb-4">Recommendations</h4>
          <div className="space-y-2">
            <div className="flex items-center space-x-2">
              <span className="text-blue-400">💡</span>
              <span className="text-sm">Consider longer training for recall improvement</span>
            </div>
            <div className="flex items-center space-x-2">
              <span className="text-blue-400">💡</span>
              <span className="text-sm">Deploy to production for real-world testing</span>
            </div>
            <div className="flex items-center space-x-2">
              <span className="text-blue-400">💡</span>
              <span className="text-sm">Monitor performance on new data</span>
            </div>
            <div className="flex items-center space-x-2">
              <span className="text-blue-400">💡</span>
              <span className="text-sm">Consider ensemble with other models</span>
            </div>
          </div>
        </div>
      </div>
    </div>
  );

  const renderModelTab = () => (
    <div className="space-y-6">
      <div className="bg-gray-800/50 rounded-lg p-6 border border-gray-700">
        <h3 className="text-lg font-semibold mb-4">Model Information</h3>
        <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
          <div>
            <h4 className="font-medium mb-3 text-blue-400">Base Model</h4>
            <div className="space-y-2 text-sm">
              <div className="flex justify-between">
                <span className="text-gray-400">Model Name:</span>
                <span>HealthcareGPT-7B</span>
              </div>
              <div className="flex justify-between">
                <span className="text-gray-400">Parameters:</span>
                <span>7.2B</span>
              </div>
              <div className="flex justify-between">
                <span className="text-gray-400">Architecture:</span>
                <span>Transformer</span>
              </div>
              <div className="flex justify-between">
                <span className="text-gray-400">Context Length:</span>
                <span>4096 tokens</span>
              </div>
            </div>
          </div>
          <div>
            <h4 className="font-medium mb-3 text-green-400">Fine-tuned Model</h4>
            <div className="space-y-2 text-sm">
              <div className="flex justify-between">
                <span className="text-gray-400">Model Size:</span>
                <span>2.8 GB</span>
              </div>
              <div className="flex justify-between">
                <span className="text-gray-400">Training Data:</span>
                <span>12,450 samples</span>
              </div>
              <div className="flex justify-between">
                <span className="text-gray-400">Domain:</span>
                <span>Healthcare</span>
              </div>
              <div className="flex justify-between">
                <span className="text-gray-400">Checkpoints:</span>
                <span>3 saved</span>
              </div>
            </div>
          </div>
        </div>
      </div>

      <div className="bg-gray-800/50 rounded-lg p-6 border border-gray-700">
        <h3 className="text-lg font-semibold mb-4">Model Artifacts</h3>
        <div className="space-y-3">
          <div className="flex items-center justify-between p-3 bg-gray-700/50 rounded-lg">
            <div className="flex items-center space-x-3">
              <span className="text-2xl">🤖</span>
              <div>
                <div className="font-medium">Final Model Weights</div>
                <div className="text-sm text-gray-400">2.8 GB • PyTorch format</div>
              </div>
            </div>
            <button className="bg-blue-600 hover:bg-blue-700 text-white px-4 py-2 rounded-lg transition-colors text-sm">
              Download
            </button>
          </div>
          <div className="flex items-center justify-between p-3 bg-gray-700/50 rounded-lg">
            <div className="flex items-center space-x-3">
              <span className="text-2xl">📊</span>
              <div>
                <div className="font-medium">Training Metrics</div>
                <div className="text-sm text-gray-400">145 KB • JSON format</div>
              </div>
            </div>
            <button className="bg-blue-600 hover:bg-blue-700 text-white px-4 py-2 rounded-lg transition-colors text-sm">
              Download
            </button>
          </div>
          <div className="flex items-center justify-between p-3 bg-gray-700/50 rounded-lg">
            <div className="flex items-center space-x-3">
              <span className="text-2xl">⚙️</span>
              <div>
                <div className="font-medium">Configuration Files</div>
                <div className="text-sm text-gray-400">23 KB • YAML/JSON formats</div>
              </div>
            </div>
            <button className="bg-blue-600 hover:bg-blue-700 text-white px-4 py-2 rounded-lg transition-colors text-sm">
              Download
            </button>
          </div>
          <div className="flex items-center justify-between p-3 bg-gray-700/50 rounded-lg">
            <div className="flex items-center space-x-3">
              <span className="text-2xl">📝</span>
              <div>
                <div className="font-medium">Training Logs</div>
                <div className="text-sm text-gray-400">892 KB • Text format</div>
              </div>
            </div>
            <button className="bg-blue-600 hover:bg-blue-700 text-white px-4 py-2 rounded-lg transition-colors text-sm">
              Download
            </button>
          </div>
        </div>
      </div>
    </div>
  );

  const renderDeploymentTab = () => (
    <div className="space-y-6">
      {deploymentStatus === 'deployed' && (
        <div className="bg-green-900/20 border border-green-800 rounded-lg p-6">
          <div className="flex items-center space-x-3">
            <span className="text-2xl">🚀</span>
            <div>
              <h3 className="font-semibold text-green-300">Model Successfully Deployed!</h3>
              <p className="text-sm text-green-200 mt-1">
                Your fine-tuned model is now live and ready to serve predictions.
              </p>
            </div>
          </div>
        </div>
      )}

      <div className="bg-gray-800/50 rounded-lg p-6 border border-gray-700">
        <h3 className="text-lg font-semibold mb-4">Deployment Options</h3>
        <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
          <div className="border border-gray-600 rounded-lg p-4 hover:border-blue-500 cursor-pointer transition-colors">
            <div className="flex items-center space-x-3 mb-3">
              <span className="text-2xl">☁️</span>
              <h4 className="font-medium">Cloud API</h4>
            </div>
            <p className="text-sm text-gray-400 mb-3">
              Deploy as a scalable REST API endpoint with automatic scaling.
            </p>
            <div className="text-sm text-green-400">✓ Auto-scaling • ✓ Load balancing</div>
          </div>
          <div className="border border-gray-600 rounded-lg p-4 hover:border-blue-500 cursor-pointer transition-colors">
            <div className="flex items-center space-x-3 mb-3">
              <span className="text-2xl">📱</span>
              <h4 className="font-medium">Edge Deployment</h4>
            </div>
            <p className="text-sm text-gray-400 mb-3">
              Deploy to edge devices for low-latency inference.
            </p>
            <div className="text-sm text-blue-400">✓ Low latency • ✓ Offline capable</div>
          </div>
          <div className="border border-gray-600 rounded-lg p-4 hover:border-blue-500 cursor-pointer transition-colors">
            <div className="flex items-center space-x-3 mb-3">
              <span className="text-2xl">🐳</span>
              <h4 className="font-medium">Container</h4>
            </div>
            <p className="text-sm text-gray-400 mb-3">
              Package as Docker container for flexible deployment.
            </p>
            <div className="text-sm text-purple-400">✓ Portable • ✓ Kubernetes ready</div>
          </div>
          <div className="border border-gray-600 rounded-lg p-4 hover:border-blue-500 cursor-pointer transition-colors">
            <div className="flex items-center space-x-3 mb-3">
              <span className="text-2xl">🔗</span>
              <h4 className="font-medium">Integration</h4>
            </div>
            <p className="text-sm text-gray-400 mb-3">
              Integrate directly into existing applications.
            </p>
            <div className="text-sm text-orange-400">✓ SDK available • ✓ Custom endpoints</div>
          </div>
        </div>
      </div>

      {deploymentStatus === 'deployed' && (
        <div className="bg-gray-800/50 rounded-lg p-6 border border-gray-700">
          <h3 className="text-lg font-semibold mb-4">Deployment Details</h3>
          <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
            <div>
              <h4 className="font-medium mb-3 text-blue-400">Endpoint Information</h4>
              <div className="space-y-2 text-sm">
                <div className="flex justify-between">
                  <span className="text-gray-400">Endpoint URL:</span>
                  <span className="font-mono text-xs">api.okailora.com/v1/models/hgpt-7b-{sessionId.slice(0, 8)}</span>
                </div>
                <div className="flex justify-between">
                  <span className="text-gray-400">Status:</span>
                  <span className="text-green-400">Active</span>
                </div>
                <div className="flex justify-between">
                  <span className="text-gray-400">Instances:</span>
                  <span>3 running</span>
                </div>
                <div className="flex justify-between">
                  <span className="text-gray-400">Region:</span>
                  <span>us-east-1</span>
                </div>
              </div>
            </div>
            <div>
              <h4 className="font-medium mb-3 text-green-400">Performance Metrics</h4>
              <div className="space-y-2 text-sm">
                <div className="flex justify-between">
                  <span className="text-gray-400">Avg Response Time:</span>
                  <span>127ms</span>
                </div>
                <div className="flex justify-between">
                  <span className="text-gray-400">Throughput:</span>
                  <span>450 req/min</span>
                </div>
                <div className="flex justify-between">
                  <span className="text-gray-400">Uptime:</span>
                  <span>99.9%</span>
                </div>
                <div className="flex justify-between">
                  <span className="text-gray-400">Cost/hour:</span>
                  <span>$2.40</span>
                </div>
              </div>
            </div>
          </div>
        </div>
      )}
    </div>
  );

  return (
    <div className="h-screen bg-gray-950 text-white flex flex-col">
      {/* Header */}
      <header className="border-b border-gray-800 bg-gray-900/50 backdrop-blur-sm flex-shrink-0">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
          <div className="flex justify-between items-center h-16">
            <div className="flex items-center space-x-4">
              <button
                onClick={() => router.push(`/finetune-loop/${sessionId}`)}
                className="flex items-center space-x-2 text-gray-400 hover:text-white transition-colors"
              >
                <svg className="w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M15 19l-7-7 7-7" />
                </svg>
                <span>Back to Training</span>
              </button>
              <div className="text-xl font-bold text-blue-400">Okailora</div>
              <span className="text-gray-400">•</span>
              <h1 className="text-lg font-semibold">Training Results</h1>
              <div className="flex items-center space-x-2">
                <div className="w-2 h-2 bg-green-400 rounded-full"></div>
                <span className="text-sm text-green-400">Training Complete</span>
              </div>
            </div>
            <div className="text-sm text-gray-400">
              Session: {sessionId?.slice(0, 8)}...
            </div>
          </div>
        </div>
      </header>

      <div className="flex flex-1 overflow-hidden">
        {/* Sidebar */}
        <aside className="w-64 bg-gray-900 border-r border-gray-800 flex-shrink-0 overflow-y-auto">
          <div className="p-6">
            <div className="mb-6">
              <h2 className="text-sm font-semibold text-gray-400 uppercase tracking-wider mb-4">
                Results Overview
              </h2>
              <div className="space-y-3">
                {[
                  { tab: 'overview', title: 'Overview', icon: '📊' },
                  { tab: 'evaluation', title: 'Evaluation', icon: '📈' },
                  { tab: 'model', title: 'Model Files', icon: '🤖' },
                  { tab: 'deployment', title: 'Deployment', icon: '🚀' },
                ].map((item) => (
                  <button
                    key={item.tab}
                    onClick={() => setSelectedTab(item.tab as any)}
                    className={`w-full flex items-center space-x-3 p-3 rounded-lg transition-colors text-left ${
                      selectedTab === item.tab
                        ? "bg-blue-600 text-white"
                        : "text-gray-400 hover:text-white hover:bg-gray-800"
                    }`}
                  >
                    <span className="text-lg">{item.icon}</span>
                    <span className="font-medium">{item.title}</span>
                  </button>
                ))}
              </div>
            </div>

            <div className="border-t border-gray-800 pt-6">
              <h3 className="text-sm font-semibold text-gray-400 mb-3">Quick Actions</h3>
              <div className="space-y-2">
                <button className="w-full text-left text-sm text-gray-300 hover:text-white transition-colors">
                  📚 View Documentation
                </button>
                <button className="w-full text-left text-sm text-gray-300 hover:text-white transition-colors">
                  🔄 Start New Training
                </button>
                <button className="w-full text-left text-sm text-gray-300 hover:text-white transition-colors">
                  📊 Compare Models
                </button>
                <button className="w-full text-left text-sm text-gray-300 hover:text-white transition-colors">
                  💾 Export Report
                </button>
              </div>
            </div>
          </div>
        </aside>

        {/* Main Content */}
        <main className={`flex-1 transition-all duration-300 ${isChatOpen ? 'mr-96' : ''} overflow-y-auto`}>
          <div className="p-8">
            <div className="max-w-6xl mx-auto">
              {selectedTab === 'overview' && renderOverviewTab()}
              {selectedTab === 'evaluation' && renderEvaluationTab()}
              {selectedTab === 'model' && renderModelTab()}
              {selectedTab === 'deployment' && renderDeploymentTab()}
            </div>
          </div>
        </main>
      </div>
    </div>
  );
}
