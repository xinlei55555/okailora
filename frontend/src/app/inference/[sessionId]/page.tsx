"use client";

import { useState, useRef } from 'react';
import { useParams, useRouter } from 'next/navigation';
import { useChatContext } from '@/components/ChatWidget';
import { InferenceService } from '@/api/services/InferenceService';
import { UploadedFile } from '@/utils/types';
import { allModels } from '@/utils/models';
import {
	ModelSelection,
	FileUpload,
	NavigationBar,
	NotificationBanner,
	PageLayout,
	NavigationStep,
	SidebarStep
} from '@/components/shared';

export default function InferencePage() {
	const params = useParams();
	const router = useRouter();
	const { isChatOpen, openChatWithMessage } = useChatContext();
	const sessionId = params.sessionId as string;
	
	// State management
	const [selectedModel, setSelectedModel] = useState<string>('');
	const [uploadedFiles, setUploadedFiles] = useState<UploadedFile[]>([]);
	const [dragActive, setDragActive] = useState(false);
	const [currentStep, setCurrentStep] = useState(1);
	
	const fileInputRef = useRef<HTMLInputElement>(null);
	const dropRef = useRef<HTMLDivElement>(null);

	// Navigation and steps configuration
	const steps: SidebarStep[] = [
		{ step: 1, title: "Select Model", icon: "🤖" },
		{ step: 2, title: "Upload Data", icon: "📁" },
		{ step: 3, title: "Review & Start", icon: "🔮" },
	];

	// Handle file upload (just store locally, don't upload to backend yet)
	const handleFileUpload = async (files: FileList) => {
		Array.from(files).forEach((file) => {
			// Check if file is a zip file
			if (!file.name.toLowerCase().endsWith('.zip') && file.type !== 'application/zip' && file.type !== 'application/x-zip-compressed') {
				alert(`File "${file.name}" is not a ZIP file. Please upload ZIP files only.`);
				return;
			}

			const fileId = Math.random().toString(36).substr(2, 9);
			const uploadedFile: UploadedFile = {
				id: fileId,
				name: file.name,
				size: file.size,
				type: file.type,
				lastModified: file.lastModified,
				status: 'ready',
				progress: 0,
				file: file // Store the actual file object
			};

			setUploadedFiles(prev => [...prev, uploadedFile]);
		});
	};

	// Upload files to backend when transitioning to review step
	const uploadFilesToBackend = async () => {
		const filesToUpload = uploadedFiles.filter(f => f.status === 'ready');
		
		if (filesToUpload.length === 0) return;

		// Get the deployment ID for the selected model
		const deploymentId = await getDeploymentId(selectedModel);
		
		if (!deploymentId) {
			console.error('Could not find deployment ID for selected model:', selectedModel);
			alert('Failed to upload files: Model deployment not found. Please try selecting a different model.');
			return;
		}

		console.log(`Starting upload of ${filesToUpload.length} files to backend using deployment ID: ${deploymentId}...`);

		for (const fileData of filesToUpload) {
			if (!fileData.file) continue;

			console.log(`Uploading file: ${fileData.name} (${formatFileSize(fileData.size)})`);

			// Update status to uploading
			setUploadedFiles(prev => 
				prev.map(f => f.id === fileData.id ? { ...f, status: 'uploading', progress: 0 } : f)
			);

			try {
				// Simulate progress for better UX
				const progressInterval = setInterval(() => {
					setUploadedFiles(prev => 
						prev.map(f => {
							if (f.id === fileData.id && f.progress < 90) {
								return { ...f, progress: f.progress + 10 };
							}
							return f;
						})
					);
				}, 100);

				// Create a FormData with the file for the API call
				const formData = {
					file: fileData.file
				};

				// Call the actual API with deployment ID
				await InferenceService.inferenceUploadData(deploymentId, formData);

				// Clear progress interval and update status to completed
				clearInterval(progressInterval);
				console.log(`✅ Successfully uploaded: ${fileData.name}`);
				setUploadedFiles(prev => 
					prev.map(f => f.id === fileData.id ? { ...f, status: 'completed', progress: 100 } : f)
				);
			} catch (error) {
				console.error(`❌ Upload failed for ${fileData.name}:`, error);
				// Update status to error on failure
				setUploadedFiles(prev => 
					prev.map(f => f.id === fileData.id ? { ...f, status: 'error', progress: 0 } : f)
				);
			}
		}
		
		console.log('🎉 All file uploads completed!');
	};

	// Drag and drop handlers
	const handleDragEnter = (e: React.DragEvent) => {
		e.preventDefault();
		e.stopPropagation();
		setDragActive(true);
	};

	const handleDragLeave = (e: React.DragEvent) => {
		e.preventDefault();
		e.stopPropagation();
		setDragActive(false);
	};

	const handleDragOver = (e: React.DragEvent) => {
		e.preventDefault();
		e.stopPropagation();
	};

	const handleDrop = (e: React.DragEvent) => {
		e.preventDefault();
		e.stopPropagation();
		setDragActive(false);

		const files = e.dataTransfer.files;
		if (files && files.length > 0) {
			handleFileUpload(files);
		}
	};

	const formatFileSize = (bytes: number) => {
		if (bytes === 0) return '0 Bytes';
		const k = 1024;
		const sizes = ['Bytes', 'KB', 'MB', 'GB'];
		const i = Math.floor(Math.log(bytes) / Math.log(k));
		return parseFloat((bytes / Math.pow(k, i)).toFixed(2)) + ' ' + sizes[i];
	};

	const removeFile = (fileId: string) => {
		setUploadedFiles(prev => prev.filter(f => f.id !== fileId));
	};

	// Function to determine model type based on selected model
	const getModelType = (modelId: string): 'classification' | 'segmentation' | 'generation' | 'bbox' => {
		const model = allModels.find(m => m.id === modelId);
		if (!model) return 'generation'; // default fallback
		
		// Map based on model tags and name
		if (model.tags.includes('bert') || model.tags.includes('classification') || model.name.toLowerCase().includes('clinical')) {
			return 'classification';
		}
		if (model.tags.includes('segmentation') || model.name.toLowerCase().includes('segment')) {
			return 'segmentation';
		}
		if (model.tags.includes('bbox') || model.name.toLowerCase().includes('detection')) {
			return 'bbox';
		}
		// Default to generation for GPT-like models and others
		return 'generation';
	};

	// Function to get deployment ID from selected model
	const getDeploymentId = async (modelId: string): Promise<string | null> => {
		try {
			// Get all deployments from the API
			const deployments = await InferenceService.inferenceList();
			
			if (Array.isArray(deployments)) {
				// Find the deployment that matches our selected model
				const deployment = deployments.find(d => {
					const transformedModelId = d.deployment_id || `okailora/${d.name || 'unknown'}`;
					return transformedModelId === modelId;
				});
				
				if (deployment && deployment.deployment_id) {
					return deployment.deployment_id;
				}
			}
			
			console.error('Could not find deployment for model:', modelId);
			return null;
		} catch (error) {
			console.error('Failed to fetch deployments:', error);
			return null;
		}
	};

	// Function to start inference
	const handleStartInference = async () => {
		if (!selectedModel) {
			console.error('No model selected');
			return;
		}

		try {
			console.log('Starting inference process...');

			// Use the selected model's ID directly as the deployment ID
			const modelDeploymentId = selectedModel;

			console.log(`Using model deployment ID: ${modelDeploymentId} for model: ${selectedModel}`);

			// Call the backend inference start with the selected model's ID as deployment ID
			const response = await InferenceService.inferenceStart(modelDeploymentId);

			console.log('Inference started successfully:', response);

			// Navigate to the inference results page with deployment ID as URL parameter
			const encodedDeploymentId = encodeURIComponent(modelDeploymentId);
			router.push(`/inference-results/${sessionId}?deploymentId=${encodedDeploymentId}`);
		} catch (error) {
			console.error('Failed to start inference:', error);
			// You might want to show an error message to the user here
			alert('Failed to start inference. Please try again.');
		}
	};

	// Navigation configuration
	const navigationSteps: NavigationStep[] = [
		{
			step: 1,
			label: "Model Selection",
			enabled: true,
			onClick: () => setCurrentStep(1)
		},
		{
			step: 2,
			label: "Continue to Data Upload",
			enabled: !!selectedModel,
			onClick: () => setCurrentStep(2)
		},
		{
			step: 3,
			label: "Review & Start Inference",
			enabled: uploadedFiles.some(f => f.status === 'ready' || f.status === 'completed'),
			onClick: async () => {
				if (uploadedFiles.some(f => f.status === 'ready')) {
					await uploadFilesToBackend();
				}
				setCurrentStep(3);
			}
		}
	];

	// Step 3: Review & Start Component
	const renderReviewAndStart = () => (
		<div className="space-y-6">
			<div>
				<h2 className="text-2xl font-bold mb-2">Review & Start Inference</h2>
				<p className="text-gray-400">Final review before starting the inference process</p>
			</div>

			{/* Inference Summary */}
			<div className="bg-gray-800/50 rounded-lg p-6 border border-gray-700">
				<h3 className="text-lg font-semibold mb-4">Inference Summary</h3>
				<div className="grid grid-cols-1 md:grid-cols-2 gap-6">
					<div>
						<h4 className="font-medium mb-3 text-green-400">Data & Model</h4>
						<div className="space-y-2 text-sm">
							<div className="flex justify-between">
								<span className="text-gray-400">Selected Model:</span>
								<span>{selectedModel ? allModels.find(m => m.id === selectedModel)?.name : 'Not selected'}</span>
							</div>
							<div className="flex justify-between">
								<span className="text-gray-400">Inference Files:</span>
								<span>{uploadedFiles.filter(f => f.status === 'ready' || f.status === 'completed').length} files</span>
							</div>
							<div className="flex justify-between">
								<span className="text-gray-400">Total Data Size:</span>
								<span>{formatFileSize(uploadedFiles.reduce((acc, file) => acc + file.size, 0))}</span>
							</div>
						</div>
					</div>
					<div>
						<h4 className="font-medium mb-3 text-blue-400">Processing Details</h4>
						<div className="space-y-2 text-sm">
							<div className="flex justify-between">
								<span className="text-gray-400">Model Type:</span>
								<span>{selectedModel ? getModelType(selectedModel) : 'N/A'}</span>
							</div>
							<div className="flex justify-between">
								<span className="text-gray-400">Processing Mode:</span>
								<span>Batch Inference</span>
							</div>
							<div className="flex justify-between">
								<span className="text-gray-400">Output Format:</span>
								<span>JSON</span>
							</div>
						</div>
					</div>
				</div>
			</div>

			{/* Cost & Time Estimate */}
			<div className="bg-gradient-to-r from-green-900/20 to-blue-900/20 border border-green-800 rounded-lg p-6">
				<h3 className="text-lg font-semibold mb-4 text-green-300">Processing Estimate</h3>
				<div className="grid grid-cols-1 md:grid-cols-3 gap-4">
					<div className="text-center">
						<div className="text-2xl font-bold text-green-400">5-15m</div>
						<div className="text-sm text-gray-400">Estimated Duration</div>
					</div>
					<div className="text-center">
						<div className="text-2xl font-bold text-blue-400">$2.50</div>
						<div className="text-sm text-gray-400">Estimated Cost</div>
					</div>
					<div className="text-center">
						<div className="text-2xl font-bold text-purple-400">A100</div>
						<div className="text-sm text-gray-400">GPU Instance</div>
					</div>
				</div>
			</div>

			{/* File List */}
			<div className="bg-gray-800/50 rounded-lg p-6 border border-gray-700">
				<h3 className="text-lg font-semibold mb-4">Inference Data Files</h3>
				<div className="space-y-2">
					{uploadedFiles.filter(f => f.status === 'ready' || f.status === 'completed').map((file) => (
						<div key={file.id} className="flex items-center justify-between py-2 px-3 bg-gray-700/30 rounded">
							<div className="flex items-center space-x-3">
								<span className="text-lg">📄</span>
								<span className="font-medium">{file.name}</span>
							</div>
							<span className="text-sm text-gray-400">{formatFileSize(file.size)}</span>
						</div>
					))}
				</div>
			</div>

			{/* Terms & Conditions */}
			<div className="bg-yellow-900/20 border border-yellow-800 rounded-lg p-4">
				<div className="flex items-start space-x-3">
					<div className="text-yellow-400 text-xl">⚠️</div>
					<div>
						<h4 className="font-semibold text-yellow-300 mb-2">Important Notes</h4>
						<ul className="text-sm text-yellow-200 space-y-1">
							<li>• Inference processing cannot be paused once started</li>
							<li>• You will be charged based on actual GPU usage</li>
							<li>• Results will be saved automatically upon completion</li>
							<li>• You'll receive notifications for processing progress</li>
						</ul>
					</div>
				</div>
			</div>
		</div>
	);

	// Render current step
	const renderCurrentStep = () => {
		switch (currentStep) {
			case 1:
				return (
					<ModelSelection
						selectedModel={selectedModel}
						onModelSelect={setSelectedModel}
						themeColor="green"
						title="Select Model for Inference"
						subtitle="Choose a trained model to run inference on your data"
						chatMessage="I need help choosing the right model for my inference task. Can you help me select the best model based on my data and requirements?"
						onChatOpen={openChatWithMessage}
					/>
				);
			case 2:
				return (
					<FileUpload
						title="Upload Inference Data"
						subtitle="Upload your data files for inference processing"
						selectedModelName={selectedModel ? allModels.find(m => m.id === selectedModel)?.name : undefined}
						uploadedFiles={uploadedFiles}
						dragActive={dragActive}
						themeColor="green"
						onFileUpload={handleFileUpload}
						onDragEnter={handleDragEnter}
						onDragLeave={handleDragLeave}
						onDragOver={handleDragOver}
						onDrop={handleDrop}
						onRemoveFile={removeFile}
						formatFileSize={formatFileSize}
						additionalNotices={
							<NotificationBanner
								type="blue"
								icon="🔒"
								title="Privacy & Security"
								message="Your data is encrypted in transit and at rest. All processing follows HIPAA compliance standards. Data is automatically de-identified and anonymized before inference."
								onClose={() => {}}
							/>
						}
					/>
				);
			case 3:
				return renderReviewAndStart();
			default:
				return (
					<div className="text-center py-12">
						<div className="text-4xl mb-4">🚧</div>
						<h2 className="text-xl font-semibold mb-2">Step {currentStep} Coming Soon</h2>
						<p className="text-gray-400 mb-6">This step is under development</p>
					</div>
				);
		}
	};

	// Generate navigation bar
	const renderNavigationBar = () => {
		const currentStepData = navigationSteps.find(s => s.step === currentStep);
		const nextStep = navigationSteps.find(s => s.step === currentStep + 1);
		const prevStep = navigationSteps.find(s => s.step === currentStep - 1);

		return (
			<NavigationBar
				currentStep={currentStep}
				steps={navigationSteps}
				themeColor="green"
				finalAction={currentStep === 3 ? {
					label: "Start Inference",
					icon: "🔮",
					onClick: handleStartInference,
					enabled: !!selectedModel && uploadedFiles.some(f => f.status === 'ready' || f.status === 'completed')
				} : undefined}
			/>
		);
	};

	return (
		<PageLayout
			title="Run Inference"
			sessionId={sessionId}
			currentStep={currentStep}
			steps={steps}
			themeColor="green"
			sidebarTitle="Inference Steps"
			isChatOpen={isChatOpen}
			navigationBar={renderNavigationBar()}
		>
			{renderCurrentStep()}
		</PageLayout>
	);
}
