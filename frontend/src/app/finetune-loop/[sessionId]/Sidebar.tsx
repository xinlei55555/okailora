import TrainingProgressPanel from './TrainingProgressPanel';
import SystemResourcesPanel from './SystemResourcesPanel';
import QuickActionsPanel from './QuickActionsPanel';
import { TrainingStatus, MetricPoint, SystemResources } from './types';

interface SidebarProps {
  trainingStatus: TrainingStatus;
  trainLossData: MetricPoint[];
  valAccData: MetricPoint[];
  systemResources: SystemResources;
  setShowConfig: (show: boolean) => void;
  setShowLogs: (show: boolean) => void;
  openChatWithMessage: (message: string) => void;
  showConfig: boolean;
  showLogs: boolean;
  getCurrentLoss: () => number;
  getBestAccuracy: () => number;
  getDataThroughput: () => number;
  getCurrentEpoch: () => number;
}

export default function Sidebar({
  trainingStatus,
  trainLossData,
  valAccData,
  systemResources,
  setShowConfig,
  setShowLogs,
  openChatWithMessage,
  showConfig,
  showLogs,
  getCurrentLoss,
  getBestAccuracy,
  getDataThroughput,
  getCurrentEpoch
}: SidebarProps) {
  return (
    <aside className="w-80 bg-gray-900 border-r border-gray-800 flex-shrink-0 overflow-y-auto">
      <div className="p-6">
        <TrainingProgressPanel
          trainingStatus={trainingStatus}
          trainLossData={trainLossData}
          valAccData={valAccData}
          getCurrentLoss={getCurrentLoss}
          getBestAccuracy={getBestAccuracy}
          getDataThroughput={getDataThroughput}
          getCurrentEpoch={getCurrentEpoch}
        />

        <SystemResourcesPanel systemResources={systemResources} />

        <QuickActionsPanel
          setShowConfig={setShowConfig}
          setShowLogs={setShowLogs}
          openChatWithMessage={openChatWithMessage}
          showConfig={showConfig}
          showLogs={showLogs}
        />
      </div>
    </aside>
  );
}
