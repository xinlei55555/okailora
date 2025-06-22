"use client";

import { useState, useEffect } from 'react';
import { useParams } from 'next/navigation';
import { useChatContext } from '@/components/ChatWidget';
import { TrainService } from '@/api';
import { MetricPoint, TrainingStatus, SystemResources, ChartDataset } from './types';
import { formatTime, formatNumber } from './utils';
import TrainingHeader from './TrainingHeader';
import Sidebar from './Sidebar';
import MetricChart from './MetricChart';
import ConfusionMatrix from './ConfusionMatrix';
import ROCCurve from './ROCCurve';
import LogsModal from './LogsModal';
import ConfigModal from './ConfigModal';

export default function FinetuneLoopPage() {
  const params = useParams();
  const { isChatOpen, openChatWithMessage } = useChatContext();
  const sessionId = params.sessionId as string;
  
  // Training status
  const [trainingStatus, setTrainingStatus] = useState<TrainingStatus>({
    isRunning: true,
    currentEpoch: 1,
    totalEpochs: 3,
    currentStep: 0,
    totalSteps: 120, // Assuming total steps, adjust if available from backend
    startTime: Date.now(),
    elapsedTime: 0,
    estimatedTimeRemaining: 0,
    learningRate: 0.00001
  });

  // Metrics data
  const [trainLossData, setTrainLossData] = useState<MetricPoint[]>([]);
  const [valLossData, setValLossData] = useState<MetricPoint[]>([]);
  const [trainAccData, setTrainAccData] = useState<MetricPoint[]>([]);
  const [valAccData, setValAccData] = useState<MetricPoint[]>([]);

  // UI state
  const [showConfig, setShowConfig] = useState(false);
  const [showLogs, setShowLogs] = useState(false);
  const [logMessages, setLogMessages] = useState<string[]>([]);

  // Training completed state
  const [isCompleted, setIsCompleted] = useState(false);

  // System resources state
  const [systemResources, setSystemResources] = useState({
    gpuMemory: 14.2,
    cpuUsage: 67,
    diskIO: 24,
    networkIO: 12
  });

  // Fetch real-time data from the backend
  useEffect(() => {
    if (!sessionId || !trainingStatus.isRunning) return;

    const intervalId = setInterval(async () => {
      try {
        const status = await TrainService.trainStatus(sessionId);

        const trainLoss = status.train_loss || [];
        const valLoss = status.val_loss || [];
        const trainAcc = status.train_acc || [];
        const valAcc = status.val_acc || [];

        setTrainLossData(trainLoss.map((value, index) => ({
            step: index + 1, value, epoch: 0, timestamp: Date.now()
        })));
        setValLossData(valLoss.map((value, index) => ({
            step: index + 1, value, epoch: 0, timestamp: Date.now()
        })));
        setTrainAccData(trainAcc.map((value, index) => ({
            step: index + 1, value, epoch: 0, timestamp: Date.now()
        })));
        setValAccData(valAcc.map((value, index) => ({
            step: index + 1, value, epoch: 0, timestamp: Date.now()
        })));

        const currentStep = trainLoss.length;
        const elapsedTime = Date.now() - trainingStatus.startTime;
        let estimatedTimeRemaining = 0;

        if (currentStep > 0 && trainingStatus.totalSteps > 0) {
            const totalTimeEstimate = (elapsedTime / currentStep) * trainingStatus.totalSteps;
            estimatedTimeRemaining = Math.max(0, totalTimeEstimate - elapsedTime);
        }

        setTrainingStatus(prev => ({
            ...prev,
            currentStep: currentStep,
            currentEpoch: prev.totalSteps > 0 && prev.totalEpochs > 0 ? Math.min(prev.totalEpochs, Math.floor(currentStep / (prev.totalSteps / prev.totalEpochs)) + 1) : 1,
            elapsedTime: elapsedTime,
            estimatedTimeRemaining: estimatedTimeRemaining
        }));

        if (status.finished) {
          setTrainingStatus(prev => ({ ...prev, isRunning: false, estimatedTimeRemaining: 0 }));
          setIsCompleted(true);
          setLogMessages(prev => [...prev, "Training completed successfully! 🎉"]);
          clearInterval(intervalId);
        }
      } catch (error) {
        console.error("Failed to fetch training status:", error);
        setTrainingStatus(prev => ({ ...prev, isRunning: false }));
        clearInterval(intervalId);
      }
    }, 1000);

    return () => clearInterval(intervalId);
  }, [sessionId, trainingStatus.isRunning, trainingStatus.startTime, trainingStatus.totalSteps, trainingStatus.totalEpochs]);

  // System resource fluctuation effect
  useEffect(() => {
    if (!trainingStatus.isRunning) return;

    const resourceInterval = setInterval(() => {
      setSystemResources(prev => ({
        gpuMemory: Math.max(12.0, Math.min(15.8, prev.gpuMemory + (Math.random() - 0.5) * 0.4)),
        cpuUsage: Math.max(45, Math.min(85, prev.cpuUsage + (Math.random() - 0.5) * 8)),
        diskIO: Math.max(5, Math.min(65, prev.diskIO + (Math.random() - 0.5) * 15)),
        networkIO: Math.max(2, Math.min(35, prev.networkIO + (Math.random() - 0.5) * 8))
      }));
    }, 2000);

    return () => clearInterval(resourceInterval);
  }, [trainingStatus.isRunning]);

  const getProgressPercentage = () => {
    return (trainingStatus.currentStep / trainingStatus.totalSteps) * 100;
  };

  const getCurrentEpoch = () => {
    // Infer epoch from training data length and steps per epoch
    const currentStep = trainLossData.length;
    const stepsPerEpoch = Math.floor(trainingStatus.totalSteps / trainingStatus.totalEpochs);
    return Math.min(trainingStatus.totalEpochs, Math.floor(currentStep / stepsPerEpoch) + 1);
  };

  const getCurrentLoss = () => {
    return trainLossData.length > 0 ? trainLossData[trainLossData.length - 1].value : 0;
  };

  const getBestAccuracy = () => {
    return valAccData.length > 0 ? Math.max(...valAccData.map(d => d.value)) : 0;
  };

  const getDataThroughput = () => {
    // Calculate samples processed per second based on elapsed time and current step
    const elapsedSeconds = trainingStatus.elapsedTime / 1000;
    const samplesPerStep = 8; // batch size
    const totalSamples = trainLossData.length * samplesPerStep;
    return elapsedSeconds > 0 ? totalSamples / elapsedSeconds : 0;
  };

  return (
    <div className="h-screen bg-gray-950 text-white flex flex-col">
      <TrainingHeader 
        sessionId={sessionId}
        trainingStatus={trainingStatus}
        isCompleted={isCompleted}
      />

      <div className="flex flex-1 overflow-hidden">
        <Sidebar
          trainingStatus={trainingStatus}
          trainLossData={trainLossData}
          valAccData={valAccData}
          systemResources={systemResources}
          setShowConfig={setShowConfig}
          setShowLogs={setShowLogs}
          openChatWithMessage={openChatWithMessage}
          showConfig={showConfig}
          showLogs={showLogs}
          getCurrentLoss={getCurrentLoss}
          getBestAccuracy={getBestAccuracy}
          getDataThroughput={getDataThroughput}
          getCurrentEpoch={getCurrentEpoch}
        />

        {/* Main Content */}
        <main className={`flex-1 transition-all duration-300 ${isChatOpen ? 'mr-96' : ''} flex flex-col bg-gradient-to-br from-gray-950 via-gray-900 to-gray-950`}>
          {/* Charts Grid - Takes remaining vertical space with proper height calculation */}
          <div className="flex-1 p-4 overflow-auto">
            <div className="grid gap-4 grid-cols-1 md:grid-cols-2 xl:grid-cols-2 min-h-full">
                {/* Row 1: Loss and Accuracy */}
                <MetricChart
                  datasets={[
                    { data: trainLossData, color: '#3B82F6', label: 'Train Loss' },
                    { data: valLossData, color: '#EF4444', label: 'Validation Loss' }
                  ]}
                  title="Training Loss"
                />
                <MetricChart
                  datasets={[
                    { data: trainAccData, color: '#10B981', label: 'Train Accuracy' },
                    { data: valAccData, color: '#F59E0B', label: 'Validation Accuracy' }
                  ]}
                  title="Model Accuracy"
                />
                
                {/* Row 2: ROC Curve and Confusion Matrix */}
                <ROCCurve />
                <ConfusionMatrix />
            </div>
          </div>
        </main>
      </div>

      <LogsModal
        showLogs={showLogs}
        setShowLogs={setShowLogs}
        logMessages={logMessages}
      />

      <ConfigModal
        showConfig={showConfig}
        setShowConfig={setShowConfig}
      />
    </div>
  );
}
