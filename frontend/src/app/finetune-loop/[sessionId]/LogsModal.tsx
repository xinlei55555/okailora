interface LogsModalProps {
  showLogs: boolean;
  setShowLogs: (show: boolean) => void;
  logMessages: string[];
}

export default function LogsModal({ showLogs, setShowLogs, logMessages }: LogsModalProps) {
  if (!showLogs) return null;

  return (
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
  );
}
