import { SystemResources } from './types';
import { formatNumber } from './utils';

interface SystemResourcesProps {
  systemResources: SystemResources;
}

export default function SystemResourcesPanel({ systemResources }: SystemResourcesProps) {
  return (
    <div className="mb-6">
      <h3 className="text-sm font-semibold text-gray-400 uppercase tracking-wider mb-4">
        System Resources
      </h3>
      <div className="space-y-3">
        <div>
          <div className="flex justify-between items-center mb-1">
            <span className="text-sm text-gray-400">GPU Memory</span>
            <span className="text-sm">{systemResources.gpuMemory.toFixed(1)} / 16.0 GB</span>
          </div>
          <div className="w-full bg-gray-700 rounded-full h-1">
            <div 
              className="bg-yellow-500 h-1 rounded-full transition-all duration-1000" 
              style={{ width: `${(systemResources.gpuMemory / 16.0) * 100}%` }}
            ></div>
          </div>
        </div>
        <div>
          <div className="flex justify-between items-center mb-1">
            <span className="text-sm text-gray-400">CPU Usage</span>
            <span className="text-sm">{Math.round(systemResources.cpuUsage)}%</span>
          </div>
          <div className="w-full bg-gray-700 rounded-full h-1">
            <div 
              className="bg-blue-500 h-1 rounded-full transition-all duration-1000" 
              style={{ width: `${systemResources.cpuUsage}%` }}
            ></div>
          </div>
        </div>
        <div>
          <div className="flex justify-between items-center mb-1">
            <span className="text-sm text-gray-400">Disk I/O</span>
            <span className="text-sm">{Math.round(systemResources.diskIO)}%</span>
          </div>
          <div className="w-full bg-gray-700 rounded-full h-1">
            <div 
              className="bg-green-500 h-1 rounded-full transition-all duration-1000" 
              style={{ width: `${systemResources.diskIO}%` }}
            ></div>
          </div>
        </div>
        <div>
          <div className="flex justify-between items-center mb-1">
            <span className="text-sm text-gray-400">Network I/O</span>
            <span className="text-sm">{Math.round(systemResources.networkIO)}%</span>
          </div>
          <div className="w-full bg-gray-700 rounded-full h-1">
            <div 
              className="bg-purple-500 h-1 rounded-full transition-all duration-1000" 
              style={{ width: `${systemResources.networkIO}%` }}
            ></div>
          </div>
        </div>
      </div>
    </div>
  );
}
