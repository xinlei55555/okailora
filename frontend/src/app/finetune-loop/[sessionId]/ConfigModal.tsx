interface ConfigModalProps {
  showConfig: boolean;
  setShowConfig: (show: boolean) => void;
}

export default function ConfigModal({ showConfig, setShowConfig }: ConfigModalProps) {
  if (!showConfig) return null;

  return (
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
  );
}
