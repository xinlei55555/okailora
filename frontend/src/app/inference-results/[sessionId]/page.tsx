"use client";

import { useState, useEffect } from 'react';
import { useParams, useRouter } from 'next/navigation';
import { useChatContext } from '@/components/ChatWidget';

interface InferenceMetrics {
  totalSamples: number;
  processedSamples: number;
  processingTime: string;
  averageConfidence: number;
  throughput: number;
  modelAccuracy: number;
}

interface InferenceResult {
  id: string;
  input: string;
  prediction: string;
  confidence: number;
  processingTime: number;
  metadata: {
    modelVersion: string;
    timestamp: string;
    inputSize: string;
  };
}

export default function InferenceResultsPage() {
  const params = useParams();
  const router = useRouter();
  const { isChatOpen, openChatWithMessage } = useChatContext();
  const sessionId = params.sessionId as string;
  
  const [inferenceMetrics] = useState<InferenceMetrics>({
    totalSamples: 1250,
    processedSamples: 1250,
    processingTime: "8m 32s",
    averageConfidence: 0.8923,
    throughput: 2.4,
    modelAccuracy: 0.9156
  });

  const [inferenceResults] = useState<InferenceResult[]>([
    {
      id: "sample_001",
      input: "Patient presents with chest pain and shortness of breath...",
      prediction: "Potential cardiac event - recommend immediate ECG and troponin levels",
      confidence: 0.94,
      processingTime: 120,
      metadata: {
        modelVersion: "HealthcareGPT-7B-v2.1",
        timestamp: "2025-06-22T10:30:45Z",
        inputSize: "2.3KB"
      }
    },
    {
      id: "sample_002", 
      input: "Follow-up visit for diabetes management, HbA1c levels...",
      prediction: "Diabetes management - good control, continue current medication",
      confidence: 0.87,
      processingTime: 95,
      metadata: {
        modelVersion: "HealthcareGPT-7B-v2.1",
        timestamp: "2025-06-22T10:31:20Z",
        inputSize: "1.8KB"
      }
    },
    {
      id: "sample_003",
      input: "Routine physical examination, no apparent symptoms...",
      prediction: "Normal findings - schedule next routine visit in 12 months",
      confidence: 0.91,
      processingTime: 105,
      metadata: {
        modelVersion: "HealthcareGPT-7B-v2.1",
        timestamp: "2025-06-22T10:32:15Z",
        inputSize: "1.5KB"
      }
    },
    {
      id: "sample_004",
      input: "Post-operative wound assessment and healing progress...",
      prediction: "Normal healing process - continue current wound care protocol",
      confidence: 0.89,
      processingTime: 110,
      metadata: {
        modelVersion: "HealthcareGPT-7B-v2.1",
        timestamp: "2025-06-22T10:33:05Z",
        inputSize: "2.1KB"
      }
    },
    {
      id: "sample_005",
      input: "Pediatric patient with fever and respiratory symptoms...",
      prediction: "Viral upper respiratory infection - supportive care recommended",
      confidence: 0.83,
      processingTime: 130,
      metadata: {
        modelVersion: "HealthcareGPT-7B-v2.1",
        timestamp: "2025-06-22T10:34:00Z",
        inputSize: "1.9KB"
      }
    }
  ]);

  const [selectedTab, setSelectedTab] = useState<'overview' | 'results' | 'analytics' | 'export'>('overview');
  const [exportStatus, setExportStatus] = useState<'none' | 'exporting' | 'exported' | 'failed'>('none');
  const [selectedResults, setSelectedResults] = useState<string[]>([]);

  const formatNumber = (num: number, decimals: number = 2) => {
    return num.toFixed(decimals);
  };

  const getConfidenceColor = (confidence: number) => {
    if (confidence >= 0.9) return 'text-green-400';
    if (confidence >= 0.8) return 'text-yellow-400';
    if (confidence >= 0.7) return 'text-orange-400';
    return 'text-red-400';
  };

  const handleExport = () => {
    setExportStatus('exporting');
    setTimeout(() => {
      setExportStatus('exported');
      // Create and download a JSON file with the results
      const dataStr = JSON.stringify({
        session: sessionId,
        metrics: inferenceMetrics,
        results: inferenceResults,
        exportedAt: new Date().toISOString()
      }, null, 2);
      const dataBlob = new Blob([dataStr], {type: 'application/json'});
      const url = URL.createObjectURL(dataBlob);
      const link = document.createElement('a');
      link.href = url;
      link.download = `inference-results-${sessionId.slice(0, 8)}.json`;
      link.click();
      URL.revokeObjectURL(url);
    }, 2000);
  };

  const toggleResultSelection = (resultId: string) => {
    setSelectedResults(prev => 
      prev.includes(resultId) 
        ? prev.filter(id => id !== resultId)
        : [...prev, resultId]
    );
  };

  const selectAllResults = () => {
    setSelectedResults(inferenceResults.map(r => r.id));
  };

  const clearSelection = () => {
    setSelectedResults([]);
  };

  const renderOverviewTab = () => (
    <div className="space-y-6">
      {/* Success Banner */}
      <div className="bg-gradient-to-r from-green-900/20 to-blue-900/20 border border-green-800 rounded-lg p-6">
        <div className="flex items-center space-x-4">
          <div className="text-4xl">✅</div>
          <div>
            <h3 className="text-xl font-semibold text-green-300 mb-2">Inference Completed Successfully!</h3>
            <p className="text-green-200">
              Your HealthcareGPT-7B model has processed {inferenceMetrics.totalSamples} samples in {inferenceMetrics.processingTime} 
              with an average confidence of {(inferenceMetrics.averageConfidence * 100).toFixed(1)}%.
            </p>
          </div>
        </div>
      </div>

      {/* Key Metrics Grid */}
      <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-6">
        <div className="bg-gray-800/50 rounded-lg p-6 border border-gray-700">
          <div className="flex items-center space-x-3 mb-2">
            <div className="text-2xl">📊</div>
            <div className="text-sm font-medium text-gray-400">Samples Processed</div>
          </div>
          <div className="text-2xl font-bold text-green-400">{inferenceMetrics.processedSamples.toLocaleString()}</div>
          <div className="text-sm text-gray-400">of {inferenceMetrics.totalSamples.toLocaleString()} total</div>
        </div>

        <div className="bg-gray-800/50 rounded-lg p-6 border border-gray-700">
          <div className="flex items-center space-x-3 mb-2">
            <div className="text-2xl">⏱️</div>
            <div className="text-sm font-medium text-gray-400">Processing Time</div>
          </div>
          <div className="text-2xl font-bold text-blue-400">{inferenceMetrics.processingTime}</div>
          <div className="text-sm text-gray-400">{inferenceMetrics.throughput} samples/sec</div>
        </div>

        <div className="bg-gray-800/50 rounded-lg p-6 border border-gray-700">
          <div className="flex items-center space-x-3 mb-2">
            <div className="text-2xl">🎯</div>
            <div className="text-sm font-medium text-gray-400">Avg Confidence</div>
          </div>
          <div className="text-2xl font-bold text-purple-400">{(inferenceMetrics.averageConfidence * 100).toFixed(1)}%</div>
          <div className="text-sm text-gray-400">High confidence</div>
        </div>

        <div className="bg-gray-800/50 rounded-lg p-6 border border-gray-700">
          <div className="flex items-center space-x-3 mb-2">
            <div className="text-2xl">⚡</div>
            <div className="text-sm font-medium text-gray-400">Throughput</div>
          </div>
          <div className="text-2xl font-bold text-orange-400">{inferenceMetrics.throughput}/s</div>
          <div className="text-sm text-gray-400">samples per second</div>
        </div>
      </div>

      {/* Performance Summary */}
      <div className="bg-gray-800/50 rounded-lg p-6 border border-gray-700">
        <h3 className="text-lg font-semibold mb-4">Processing Summary</h3>
        <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
          <div>
            <h4 className="font-medium mb-3 text-green-400">Performance Metrics</h4>
            <div className="space-y-2">
              <div className="flex justify-between items-center">
                <span className="text-sm text-gray-400">Model Accuracy:</span>
                <span className="font-medium">{(inferenceMetrics.modelAccuracy * 100).toFixed(2)}%</span>
              </div>
              <div className="flex justify-between items-center">
                <span className="text-sm text-gray-400">High Confidence Results:</span>
                <span className="font-medium">{inferenceResults.filter(r => r.confidence >= 0.9).length}/{inferenceResults.length}</span>
              </div>
              <div className="flex justify-between items-center">
                <span className="text-sm text-gray-400">Average Processing Time:</span>
                <span className="font-medium">{Math.round(inferenceResults.reduce((acc, r) => acc + r.processingTime, 0) / inferenceResults.length)}ms</span>
              </div>
              <div className="flex justify-between items-center">
                <span className="text-sm text-gray-400">Success Rate:</span>
                <span className="font-medium text-green-400">100%</span>
              </div>
            </div>
          </div>
          <div>
            <h4 className="font-medium mb-3 text-blue-400">Resource Usage</h4>
            <div className="space-y-2 text-sm">
              <div className="flex justify-between">
                <span className="text-gray-400">GPU Hours Used:</span>
                <span>0.14 hours</span>
              </div>
              <div className="flex justify-between">
                <span className="text-gray-400">Cost:</span>
                <span className="text-green-400">$2.85</span>
              </div>
              <div className="flex justify-between">
                <span className="text-gray-400">Memory Usage:</span>
                <span>12.3 GB peak</span>
              </div>
              <div className="flex justify-between">
                <span className="text-gray-400">Efficiency Score:</span>
                <span className="text-blue-400">94%</span>
              </div>
            </div>
          </div>
        </div>
      </div>

      {/* Quick Actions */}
      <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
        <button
          onClick={handleExport}
          disabled={exportStatus === 'exporting'}
          className="bg-green-700 hover:bg-green-600 disabled:opacity-50 text-white p-4 rounded-lg transition-all font-semibold"
        >
          {exportStatus === 'exporting' ? '📤 Exporting...' : 
           exportStatus === 'exported' ? '✅ Exported' : '📤 Export Results'}
        </button>
        
        <button
          onClick={() => setSelectedTab('results')}
          className="bg-blue-700 hover:bg-blue-600 text-white p-4 rounded-lg transition-colors font-semibold"
        >
          🔍 View Detailed Results
        </button>
        
        <button
          onClick={() => openChatWithMessage("My inference is complete! Can you help me analyze the results and suggest insights from the model predictions?")}
          className="bg-purple-700 hover:bg-purple-600 text-white p-4 rounded-lg transition-colors font-semibold"
        >
          💬 Get AI Analysis
        </button>
      </div>
    </div>
  );

  const renderResultsTab = () => (
    <div className="space-y-6">
      <div className="flex items-center justify-between">
        <div>
          <h3 className="text-lg font-semibold">Inference Results</h3>
          <p className="text-sm text-gray-400">Detailed predictions and confidence scores</p>
        </div>
        <div className="flex items-center space-x-2">
          <button
            onClick={selectAllResults}
            className="text-sm bg-gray-700 hover:bg-gray-600 text-white px-3 py-1 rounded transition-colors"
          >
            Select All
          </button>
          <button
            onClick={clearSelection}
            className="text-sm bg-gray-700 hover:bg-gray-600 text-white px-3 py-1 rounded transition-colors"
          >
            Clear
          </button>
          <span className="text-sm text-gray-400">
            {selectedResults.length} selected
          </span>
        </div>
      </div>

      <div className="bg-gray-800/50 rounded-lg border border-gray-700">
        <div className="p-4 border-b border-gray-700">
          <div className="flex items-center justify-between">
            <h4 className="font-medium">Sample Results ({inferenceResults.length})</h4>
            {selectedResults.length > 0 && (
              <button
                onClick={() => {
                  const selectedData = inferenceResults.filter(r => selectedResults.includes(r.id));
                  const dataStr = JSON.stringify(selectedData, null, 2);
                  const dataBlob = new Blob([dataStr], {type: 'application/json'});
                  const url = URL.createObjectURL(dataBlob);
                  const link = document.createElement('a');
                  link.href = url;
                  link.download = `selected-results-${sessionId.slice(0, 8)}.json`;
                  link.click();
                  URL.revokeObjectURL(url);
                }}
                className="text-sm bg-green-600 hover:bg-green-700 text-white px-3 py-1 rounded transition-colors"
              >
                Export Selected
              </button>
            )}
          </div>
        </div>
        
        <div className="p-6">
          <div className="space-y-4 max-h-96 overflow-y-auto">
            {inferenceResults.map((result) => (
              <div
                key={result.id}
                className={`p-4 rounded-lg border transition-all ${
                  selectedResults.includes(result.id)
                    ? 'border-green-500 bg-green-500/10'
                    : 'border-gray-600 bg-gray-700/30'
                }`}
              >
                <div className="flex items-start justify-between mb-3">
                  <div className="flex items-center space-x-3">
                    <input
                      type="checkbox"
                      checked={selectedResults.includes(result.id)}
                      onChange={() => toggleResultSelection(result.id)}
                      className="rounded"
                    />
                    <div>
                      <h5 className="font-medium text-sm">{result.id}</h5>
                      <p className="text-xs text-gray-400">{result.metadata.timestamp}</p>
                    </div>
                  </div>
                  <div className="text-right">
                    <div className={`text-sm font-medium ${getConfidenceColor(result.confidence)}`}>
                      {(result.confidence * 100).toFixed(1)}% confidence
                    </div>
                    <div className="text-xs text-gray-400">{result.processingTime}ms</div>
                  </div>
                </div>
                
                <div className="space-y-2">
                  <div>
                    <h6 className="text-xs font-medium text-gray-400 mb-1">Input:</h6>
                    <p className="text-sm bg-gray-800/50 p-2 rounded text-gray-300">
                      {result.input.length > 100 ? `${result.input.substring(0, 100)}...` : result.input}
                    </p>
                  </div>
                  <div>
                    <h6 className="text-xs font-medium text-gray-400 mb-1">Prediction:</h6>
                    <p className="text-sm bg-blue-900/20 p-2 rounded text-blue-200">
                      {result.prediction}
                    </p>
                  </div>
                </div>
                
                <div className="mt-3 pt-3 border-t border-gray-600">
                  <div className="flex justify-between text-xs text-gray-400">
                    <span>Model: {result.metadata.modelVersion}</span>
                    <span>Size: {result.metadata.inputSize}</span>
                  </div>
                </div>
              </div>
            ))}
          </div>
        </div>
      </div>
    </div>
  );

  const renderAnalyticsTab = () => (
    <div className="space-y-6">
      <div className="bg-gray-800/50 rounded-lg p-6 border border-gray-700">
        <h3 className="text-lg font-semibold mb-4">Confidence Distribution</h3>
        <div className="space-y-4">
          {[
            { range: '90-100%', count: inferenceResults.filter(r => r.confidence >= 0.9).length, color: 'bg-green-500' },
            { range: '80-89%', count: inferenceResults.filter(r => r.confidence >= 0.8 && r.confidence < 0.9).length, color: 'bg-yellow-500' },
            { range: '70-79%', count: inferenceResults.filter(r => r.confidence >= 0.7 && r.confidence < 0.8).length, color: 'bg-orange-500' },
            { range: 'Below 70%', count: inferenceResults.filter(r => r.confidence < 0.7).length, color: 'bg-red-500' }
          ].map((item, index) => (
            <div key={index} className="flex items-center space-x-4">
              <div className="w-20 text-sm text-gray-400">{item.range}</div>
              <div className="flex-1 bg-gray-700 rounded-full h-4">
                <div 
                  className={`${item.color} h-4 rounded-full transition-all duration-500`}
                  style={{ width: `${(item.count / inferenceResults.length) * 100}%` }}
                ></div>
              </div>
              <div className="w-12 text-sm text-right">{item.count}</div>
            </div>
          ))}
        </div>
      </div>

      <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
        <div className="bg-gray-800/50 rounded-lg p-6 border border-gray-700">
          <h4 className="font-semibold mb-4">Processing Performance</h4>
          <div className="space-y-3">
            <div className="flex justify-between">
              <span className="text-sm text-gray-400">Fastest Processing:</span>
              <span className="text-sm">{Math.min(...inferenceResults.map(r => r.processingTime))}ms</span>
            </div>
            <div className="flex justify-between">
              <span className="text-sm text-gray-400">Slowest Processing:</span>
              <span className="text-sm">{Math.max(...inferenceResults.map(r => r.processingTime))}ms</span>
            </div>
            <div className="flex justify-between">
              <span className="text-sm text-gray-400">Standard Deviation:</span>
              <span className="text-sm">±12.3ms</span>
            </div>
            <div className="flex justify-between">
              <span className="text-sm text-gray-400">Total Processing Time:</span>
              <span className="text-sm">{inferenceResults.reduce((acc, r) => acc + r.processingTime, 0)}ms</span>
            </div>
          </div>
        </div>

        <div className="bg-gray-800/50 rounded-lg p-6 border border-gray-700">
          <h4 className="font-semibold mb-4">Quality Metrics</h4>
          <div className="space-y-3">
            <div className="flex justify-between">
              <span className="text-sm text-gray-400">High Confidence (&gt;90%):</span>
              <span className="text-sm text-green-400">{Math.round((inferenceResults.filter(r => r.confidence >= 0.9).length / inferenceResults.length) * 100)}%</span>
            </div>
            <div className="flex justify-between">
              <span className="text-sm text-gray-400">Medium Confidence (70-89%):</span>
              <span className="text-sm text-yellow-400">{Math.round((inferenceResults.filter(r => r.confidence >= 0.7 && r.confidence < 0.9).length / inferenceResults.length) * 100)}%</span>
            </div>
            <div className="flex justify-between">
              <span className="text-sm text-gray-400">Low Confidence (&lt;70%):</span>
              <span className="text-sm text-red-400">{Math.round((inferenceResults.filter(r => r.confidence < 0.7).length / inferenceResults.length) * 100)}%</span>
            </div>
            <div className="flex justify-between">
              <span className="text-sm text-gray-400">Model Reliability:</span>
              <span className="text-sm text-blue-400">Excellent</span>
            </div>
          </div>
        </div>
      </div>

      <div className="bg-gray-800/50 rounded-lg p-6 border border-gray-700">
        <h4 className="font-semibold mb-4">Insights & Recommendations</h4>
        <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
          <div>
            <h5 className="font-medium mb-3 text-green-400">Strengths</h5>
            <div className="space-y-2">
              <div className="flex items-center space-x-2">
                <span className="text-green-400">✓</span>
                <span className="text-sm">High average confidence ({(inferenceMetrics.averageConfidence * 100).toFixed(1)}%)</span>
              </div>
              <div className="flex items-center space-x-2">
                <span className="text-green-400">✓</span>
                <span className="text-sm">Consistent processing speed</span>
              </div>
              <div className="flex items-center space-x-2">
                <span className="text-green-400">✓</span>
                <span className="text-sm">100% completion rate</span>
              </div>
              <div className="flex items-center space-x-2">
                <span className="text-green-400">✓</span>
                <span className="text-sm">Excellent model reliability</span>
              </div>
            </div>
          </div>

          <div>
            <h5 className="font-medium mb-3 text-blue-400">Recommendations</h5>
            <div className="space-y-2">
              <div className="flex items-center space-x-2">
                <span className="text-blue-400">💡</span>
                <span className="text-sm">Deploy to production for real-time inference</span>
              </div>
              <div className="flex items-center space-x-2">
                <span className="text-blue-400">💡</span>
                <span className="text-sm">Monitor confidence scores in production</span>
              </div>
              <div className="flex items-center space-x-2">
                <span className="text-blue-400">💡</span>
                <span className="text-sm">Consider batch optimization for larger datasets</span>
              </div>
              <div className="flex items-center space-x-2">
                <span className="text-blue-400">💡</span>
                <span className="text-sm">Set up automated quality alerts</span>
              </div>
            </div>
          </div>
        </div>
      </div>
    </div>
  );

  const renderExportTab = () => (
    <div className="space-y-6">
      <div className="bg-gray-800/50 rounded-lg p-6 border border-gray-700">
        <h3 className="text-lg font-semibold mb-4">Export Options</h3>
        <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
          <div className="border border-gray-600 rounded-lg p-4 hover:border-green-500 cursor-pointer transition-colors">
            <div className="flex items-center space-x-3 mb-3">
              <span className="text-2xl">📊</span>
              <h4 className="font-medium">JSON Export</h4>
            </div>
            <p className="text-sm text-gray-400 mb-3">
              Export results in structured JSON format for further analysis.
            </p>
            <div className="text-sm text-green-400">✓ Machine readable • ✓ Complete data</div>
          </div>
          <div className="border border-gray-600 rounded-lg p-4 hover:border-green-500 cursor-pointer transition-colors">
            <div className="flex items-center space-x-3 mb-3">
              <span className="text-2xl">📋</span>
              <h4 className="font-medium">CSV Export</h4>
            </div>
            <p className="text-sm text-gray-400 mb-3">
              Export to CSV format for spreadsheet analysis and reporting.
            </p>
            <div className="text-sm text-blue-400">✓ Excel compatible • ✓ Easy analysis</div>
          </div>
          <div className="border border-gray-600 rounded-lg p-4 hover:border-green-500 cursor-pointer transition-colors">
            <div className="flex items-center space-x-3 mb-3">
              <span className="text-2xl">📄</span>
              <h4 className="font-medium">PDF Report</h4>
            </div>
            <p className="text-sm text-gray-400 mb-3">
              Generate comprehensive PDF report with charts and analysis.
            </p>
            <div className="text-sm text-purple-400">✓ Professional format • ✓ Charts included</div>
          </div>
          <div className="border border-gray-600 rounded-lg p-4 hover:border-green-500 cursor-pointer transition-colors">
            <div className="flex items-center space-x-3 mb-3">
              <span className="text-2xl">🔗</span>
              <h4 className="font-medium">API Access</h4>
            </div>
            <p className="text-sm text-gray-400 mb-3">
              Access results programmatically via REST API endpoints.
            </p>
            <div className="text-sm text-orange-400">✓ Real-time access • ✓ Integration ready</div>
          </div>
        </div>
      </div>

      <div className="bg-gray-800/50 rounded-lg p-6 border border-gray-700">
        <h3 className="text-lg font-semibold mb-4">Export Configuration</h3>
        <div className="space-y-4">
          <div>
            <label className="block text-sm font-medium mb-2">Include Fields</label>
            <div className="grid grid-cols-2 md:grid-cols-4 gap-3">
              {['Predictions', 'Confidence Scores', 'Processing Times', 'Metadata', 'Input Data', 'Model Info'].map((field) => (
                <label key={field} className="flex items-center space-x-2">
                  <input type="checkbox" defaultChecked className="rounded" />
                  <span className="text-sm">{field}</span>
                </label>
              ))}
            </div>
          </div>
          <div>
            <label className="block text-sm font-medium mb-2">Date Range</label>
            <div className="flex items-center space-x-4">
              <input type="date" className="bg-gray-700 border border-gray-600 rounded px-3 py-2 text-sm" />
              <span className="text-gray-400">to</span>
              <input type="date" className="bg-gray-700 border border-gray-600 rounded px-3 py-2 text-sm" />
            </div>
          </div>
          <div>
            <label className="block text-sm font-medium mb-2">Confidence Threshold</label>
            <select className="bg-gray-700 border border-gray-600 rounded px-3 py-2 text-sm">
              <option>All results</option>
              <option>≥ 90%</option>
              <option>≥ 80%</option>
              <option>≥ 70%</option>
            </select>
          </div>
        </div>
      </div>

      <div className="bg-gray-800/50 rounded-lg p-6 border border-gray-700">
        <h3 className="text-lg font-semibold mb-4">Quick Export Actions</h3>
        <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
          <button
            onClick={handleExport}
            className="bg-green-600 hover:bg-green-700 text-white px-4 py-3 rounded-lg transition-colors font-medium"
          >
            📊 Export as JSON
          </button>
          <button className="bg-blue-600 hover:bg-blue-700 text-white px-4 py-3 rounded-lg transition-colors font-medium">
            📋 Export as CSV
          </button>
          <button className="bg-purple-600 hover:bg-purple-700 text-white px-4 py-3 rounded-lg transition-colors font-medium">
            📄 Generate Report
          </button>
        </div>
      </div>
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
                onClick={() => router.push(`/inference-loop/${sessionId}`)}
                className="flex items-center space-x-2 text-gray-400 hover:text-white transition-colors"
              >
                <svg className="w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M15 19l-7-7 7-7" />
                </svg>
                <span>Back to Processing</span>
              </button>
              <div className="text-xl font-bold text-blue-400">Okailora</div>
              <span className="text-gray-400">•</span>
              <h1 className="text-lg font-semibold">Inference Results</h1>
              <div className="flex items-center space-x-2">
                <div className="w-2 h-2 bg-green-400 rounded-full"></div>
                <span className="text-sm text-green-400">Processing Complete</span>
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
                  { tab: 'results', title: 'Detailed Results', icon: '🔍' },
                  { tab: 'analytics', title: 'Analytics', icon: '📈' },
                  { tab: 'export', title: 'Export', icon: '📤' },
                ].map((item) => (
                  <button
                    key={item.tab}
                    onClick={() => setSelectedTab(item.tab as any)}
                    className={`w-full flex items-center space-x-3 p-3 rounded-lg transition-colors text-left ${
                      selectedTab === item.tab
                        ? "bg-green-600 text-white"
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
                  🔄 Run New Inference
                </button>
                <button className="w-full text-left text-sm text-gray-300 hover:text-white transition-colors">
                  📊 Compare Results
                </button>
                <button className="w-full text-left text-sm text-gray-300 hover:text-white transition-colors">
                  🚀 Deploy Model
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
              {selectedTab === 'results' && renderResultsTab()}
              {selectedTab === 'analytics' && renderAnalyticsTab()}
              {selectedTab === 'export' && renderExportTab()}
            </div>
          </div>
        </main>
      </div>
    </div>
  );
}
