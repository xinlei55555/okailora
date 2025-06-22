"use client";

import { useEffect, useState } from 'react';
import { useParams, useRouter } from 'next/navigation';
import { InferenceService } from '@/api/services/InferenceService';

interface BackendResult {
  image?: string; // image name
  classification?: string;
  base64?: string; // base64 image data
}

export default function InferenceResultsPage() {
  const params = useParams();
  const router = useRouter();
  const sessionId = params.sessionId as string; // This is the workflow session ID from the URL
  
  // Get the actual deployment ID from sessionStorage where it was stored by the inference page
  // This fixes the issue where sessionId was incorrectly being used as deploymentId
  const [deploymentId, setDeploymentId] = useState<string | null>(null);
  const [results, setResults] = useState<BackendResult[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const [selectedTab, setSelectedTab] = useState<'gallery' | 'analytics' | 'export'>('gallery');

  useEffect(() => {
    // Retrieve deployment ID from sessionStorage
    const storedDeploymentId = sessionStorage.getItem(`inference_deployment_${sessionId}`);
    
    if (!storedDeploymentId) {
      console.error('[InferenceResults] No deployment ID found for session:', sessionId);
      setError('No deployment ID found. Please start inference again.');
      setLoading(false);
      return;
    }
    
    setDeploymentId(storedDeploymentId);
    
    console.log(`[InferenceResults] Starting to fetch results for deployment: ${storedDeploymentId}`);
    setLoading(true);
    setError(null);
    
    InferenceService.inferenceStatus(storedDeploymentId)
      .then((res) => {
        console.log('[InferenceResults] Raw API response:', res);
        console.log('[InferenceResults] Response type:', typeof res);
        console.log('[InferenceResults] Response structure:', Object.keys(res || {}));
        
        if (res && Array.isArray(res.result)) {
          console.log(`[InferenceResults] Found ${res.result.length} results in response`);
          console.log('[InferenceResults] First few results:', res.result.slice(0, 3));
          
          // Log details about each result
          res.result.forEach((result, index) => {
            console.log(`[InferenceResults] Result ${index}:`, {
              hasImage: !!result.image,
              imageName: result.image,
              hasClassification: !!result.classification,
              classification: result.classification,
              hasBase64: !!result.base64,
              base64Length: result.base64 ? result.base64.length : 0
            });
          });
          
          setResults(res.result);
        } else {
          console.warn('[InferenceResults] Response does not contain valid result array:', {
            hasRes: !!res,
            hasResult: !!(res && res.result),
            resultType: res && res.result ? typeof res.result : 'undefined',
            isArray: res && res.result ? Array.isArray(res.result) : false
          });
          setResults([]);
        }
        setLoading(false);
        console.log('[InferenceResults] Successfully completed fetching results');
      })
      .catch((e) => {
        console.error('[InferenceResults] Error fetching results:', e);
        console.error('[InferenceResults] Error details:', {
          message: e.message,
          stack: e.stack,
          name: e.name
        });
        setError('Failed to fetch results.');
        setLoading(false);
      });
  }, [sessionId]); // Changed from deploymentId to sessionId

  // Gallery Tab: Scrollable grid of image results
  const renderGalleryTab = () => (
    <div className="space-y-6">
      {loading && (
        <div className="flex justify-center items-center h-40">
          <span className="text-gray-400 text-lg">Loading...</span>
        </div>
      )}
      {error && (
        <div className="flex justify-center items-center h-40">
          <span className="text-red-400 text-lg">{error}</span>
        </div>
      )}
      {!loading && !error && (
        <div className="grid grid-cols-1 sm:grid-cols-2 md:grid-cols-3 lg:grid-cols-4 gap-8">
          {results.map((item, idx) => (
            <div key={idx} className="bg-gray-900 rounded-xl shadow-lg flex flex-col items-center p-4 border border-gray-800 hover:shadow-2xl transition-shadow">
              {item.base64 ? (
                <img
                  src={`data:image/jpeg;base64,${item.base64}`}
                  alt={item.image ? item.image : `result-${idx}`}
                  className="w-48 h-48 object-cover rounded-lg mb-4 border border-gray-700"
                />
              ) : (
                <div className="w-48 h-48 flex items-center justify-center bg-gray-800 rounded-lg mb-4 text-gray-500">
                  No Image
                </div>
              )}
              <div className="text-lg font-semibold text-center truncate w-full">
                {item.classification || <span className="text-gray-500">No label</span>}
              </div>
              <div className="text-sm text-gray-400 mt-1 truncate w-full text-center">
                {item.image || <span className="text-gray-600">No image name</span>}
              </div>
            </div>
          ))}
          {results.length === 0 && (
            <div className="col-span-full text-center text-gray-400">No results to display.</div>
          )}
        </div>
      )}
    </div>
  );

  // Analytics Tab: Placeholder for future analytics
  const renderAnalyticsTab = () => (
    <div className="flex flex-col items-center justify-center h-64 text-gray-400">
      <span className="text-2xl mb-2">📈</span>
      <span>Analytics and charts coming soon.</span>
    </div>
  );

  // Export Tab: Placeholder for future export options
  const renderExportTab = () => (
    <div className="flex flex-col items-center justify-center h-64 text-gray-400">
      <span className="text-2xl mb-2">📤</span>
      <span>Export options coming soon.</span>
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
                onClick={() => router.push(`/inference/new-session`)}
                className="flex items-center space-x-2 text-gray-400 hover:text-white transition-colors"
              >
                <svg className="w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M15 19l-7-7 7-7" />
                </svg>
                <span>Back to Inference</span>
              </button>
              <div className="text-xl font-bold text-blue-400">Okailora</div>
              <span className="text-gray-400">•</span>
              <h1 className="text-lg font-semibold">Inference Results</h1>
            </div>
            <div className="text-sm text-gray-400">
              Deployment: {deploymentId?.slice(0, 8)}...
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
                Results Navigation
              </h2>
              <div className="space-y-3">
                {[
                  { tab: 'gallery', title: 'Gallery', icon: '🖼️' },
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
        <main className={`flex-1 transition-all duration-300 overflow-y-auto`}>
          <div className="p-8">
            <div className="max-w-6xl mx-auto">
              {selectedTab === 'gallery' && renderGalleryTab()}
              {selectedTab === 'analytics' && renderAnalyticsTab()}
              {selectedTab === 'export' && renderExportTab()}
            </div>
          </div>
        </main>
      </div>
    </div>
  );
}
