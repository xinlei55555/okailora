import { ViewMode } from './types';

interface ControlsPanelProps {
  viewMode: ViewMode;
  setViewMode: (mode: ViewMode) => void;
  trainingStatus: { isRunning: boolean };
  autoScroll: boolean;
  setAutoScroll: (autoScroll: boolean) => void;
}

export default function ControlsPanel({
  viewMode,
  setViewMode,
  trainingStatus,
  autoScroll,
  setAutoScroll
}: ControlsPanelProps) {
  return (
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
  );
}
