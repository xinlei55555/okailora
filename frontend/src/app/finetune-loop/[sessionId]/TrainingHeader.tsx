import { useRouter } from 'next/navigation';

interface TrainingHeaderProps {
  sessionId: string;
  trainingStatus: { isRunning: boolean };
  isCompleted: boolean;
}

export default function TrainingHeader({ sessionId, trainingStatus, isCompleted }: TrainingHeaderProps) {
  const router = useRouter();

  return (
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
  );
}
