interface QuickActionsPanelProps {
  setShowConfig: (show: boolean) => void;
  setShowLogs: (show: boolean) => void;
  openChatWithMessage: (message: string) => void;
  showConfig: boolean;
  showLogs: boolean;
}

export default function QuickActionsPanel({
  setShowConfig,
  setShowLogs,
  openChatWithMessage,
  showConfig,
  showLogs
}: QuickActionsPanelProps) {
  return (
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
  );
}
