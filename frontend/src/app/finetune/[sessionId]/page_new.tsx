"use client";

import { useState, useRef } from 'react';
import { useParams, useRouter } from 'next/navigation';
import { useChatContext } from '@/components/ChatWidget';
import { TrainService } from '@/api/services/TrainService';
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

export default function FinetunePage() {
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
		{ step: 1, title: "Select Base Model", icon: "🤖" },
		{ step: 2, title: "Upload Training Data", icon: "📁" },
		{ step: 3, title: "Configure Parameters", icon: "⚙️" },
		{ step: 4, title: "Review & Start", icon: "🚀" },
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

	// Upload files to backend when transitioning to parameters step
	const uploadFilesToBackend = async () => {
		const filesToUpload = uploadedFiles.filter(f => f.status === 'ready');
		
		if (filesToUpload.length === 0) return;

		console.log(`Starting upload of ${filesToUpload.length} files to backend...`);

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

				// Call the actual API
				await TrainService.trainUploadData(sessionId, formData);

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

	// Function to start training
	const handleStartTraining = async () => {
		if (!selectedModel) {
			console.error('No model selected');
			return;
		}

		try {
			console.log('Starting training process...');
			
			const modelType = getModelType(selectedModel);
			console.log(`Model type determined: ${modelType} for model: ${selectedModel} - sending train start request`);
			
			const response = await TrainService.trainStart(sessionId, {
				model_type: modelType
			});
			
			console.log('Training started successfully:', response);
			
			// Navigate to the training loop page
			router.push(`/finetune-loop/${sessionId}`);
			
		} catch (error) {
			console.error('Failed to start training:', error);
			// You might want to show an error message to the user here
			alert('Failed to start training. Please try again.');
		}
	};

	// Step 3: Configure Parameters Component
	const renderConfigureParameters = () => (
		<div className="space-y-6">
			<div>
				<h2 className="text-2xl font-bold mb-2">Configure Parameters</h2>
				<p className="text-gray-400">Set up hyperparameters and training configuration</p>
			</div>

			<div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
				{/* Hyperparameters */}
				<div className="lg:col-span-2 space-y-6">
					{/* Basic Training Parameters */}
					<div className="bg-gray-800/50 rounded-lg p-6 border border-gray-700">
						<h3 className="text-lg font-semibold mb-4">Training Parameters</h3>
						<div className="grid grid-cols-1 md:grid-cols-2 gap-4">
							<div>
								<label className="block text-sm font-medium mb-2">Learning Rate</label>
								<select className="w-full bg-gray-700 border border-gray-600 rounded-lg px-4 py-2 focus:outline-none focus:ring-2 focus:ring-blue-500">
									<option>1e-5 (recommended)</option>
									<option>5e-6</option>
									<option>2e-5</option>
									<option>3e-5</option>
								</select>
							</div>
							<div>
								<label className="block text-sm font-medium mb-2">Batch Size</label>
								<select className="w-full bg-gray-700 border border-gray-600 rounded-lg px-4 py-2 focus:outline-none focus:ring-2 focus:ring-blue-500">
									<option>8 (recommended)</option>
									<option>4</option>
									<option>16</option>
									<option>32</option>
								</select>
							</div>
							<div>
								<label className="block text-sm font-medium mb-2">Number of Epochs</label>
								<select className="w-full bg-gray-700 border border-gray-600 rounded-lg px-4 py-2 focus:outline-none focus:ring-2 focus:ring-blue-500">
									<option>3 (recommended)</option>
									<option>2</option>
									<option>4</option>
									<option>5</option>
								</select>
							</div>
							<div>
								<label className="block text-sm font-medium mb-2">Weight Decay</label>
								<select className="w-full bg-gray-700 border border-gray-600 rounded-lg px-4 py-2 focus:outline-none focus:ring-2 focus:ring-blue-500">
									<option>0.01 (recommended)</option>
									<option>0.001</option>
									<option>0.1</option>
									<option>0</option>
								</select>
							</div>
						</div>
					</div>

					{/* Advanced Parameters */}
					<div className="bg-gray-800/50 rounded-lg p-6 border border-gray-700">
						<h3 className="text-lg font-semibold mb-4">Advanced Options</h3>
						<div className="space-y-4">
							<div className="flex items-center justify-between">
								<div>
									<label className="block text-sm font-medium mb-1">Enable Mixed Precision</label>
									<p className="text-xs text-gray-400">Faster training with lower memory usage</p>
								</div>
								<input type="checkbox" className="w-5 h-5 text-blue-600" defaultChecked />
							</div>
							<div className="flex items-center justify-between">
								<div>
									<label className="block text-sm font-medium mb-1">Gradient Checkpointing</label>
									<p className="text-xs text-gray-400">Trade compute for memory efficiency</p>
								</div>
								<input type="checkbox" className="w-5 h-5 text-blue-600" />
							</div>
						</div>
					</div>
				</div>

				{/* Configuration Summary */}
				<div className="space-y-6">
					<div className="bg-blue-900/20 border border-blue-800 rounded-lg p-4">
						<h4 className="font-semibold text-blue-300 mb-3">Training Overview</h4>
						<div className="space-y-2 text-sm">
							<div className="flex justify-between">
								<span className="text-gray-400">Model:</span>
								<span>{selectedModel ? allModels.find(m => m.id === selectedModel)?.name?.slice(0, 20) + '...' : 'Not selected'}</span>
							</div>
							<div className="flex justify-between">
								<span className="text-gray-400">Training Files:</span>
								<span>{uploadedFiles.filter(f => f.status === 'completed').length} files</span>
							</div>
							<div className="flex justify-between">
								<span className="text-gray-400">Est. Duration:</span>
								<span>2-4 hours</span>
							</div>
							<div className="flex justify-between">
								<span className="text-gray-400">Est. Cost:</span>
								<span>$15-25</span>
							</div>
						</div>
					</div>

					<div className="bg-green-900/20 border border-green-800 rounded-lg p-4">
						<h4 className="font-semibold text-green-300 mb-3">💡 Tips</h4>
						<ul className="text-sm text-green-200 space-y-1">
							<li>• Start with default parameters</li>
							<li>• Monitor training loss curves</li>
							<li>• Use validation data if available</li>
						</ul>
					</div>
				</div>
			</div>
		</div>
	);

	// Step 4: Review & Start Component
	const renderReviewAndStart = () => (
		<div className="space-y-6">
			<div>
				<h2 className="text-2xl font-bold mb-2">Review & Start Training</h2>
				<p className="text-gray-400">Final review before starting the fine-tuning process</p>
			</div>

			{/* Training Summary */}
			<div className="bg-gray-800/50 rounded-lg p-6 border border-gray-700">
				<h3 className="text-lg font-semibold mb-4">Training Summary</h3>
				<div className="grid grid-cols-1 md:grid-cols-3 gap-6">
					<div>
						<h4 className="font-medium mb-3 text-blue-400">Model & Data</h4>
						<div className="space-y-2 text-sm">
							<div className="flex justify-between">
								<span className="text-gray-400">Base Model:</span>
								<span>{selectedModel ? allModels.find(m => m.id === selectedModel)?.name : 'Not selected'}</span>
							</div>
							<div className="flex justify-between">
								<span className="text-gray-400">Training Files:</span>
								<span>{uploadedFiles.filter(f => f.status === 'completed').length} files</span>
							</div>
							<div className="flex justify-between">
								<span className="text-gray-400">Total Data Size:</span>
								<span>{formatFileSize(uploadedFiles.reduce((acc, file) => acc + file.size, 0))}</span>
							</div>
						</div>
					</div>
					<div>
						<h4 className="font-medium mb-3 text-green-400">Training Config</h4>
						<div className="space-y-2 text-sm">
							<div className="flex justify-between">
								<span className="text-gray-400">Learning Rate:</span>
								<span>1e-5</span>
							</div>
							<div className="flex justify-between">
								<span className="text-gray-400">Batch Size:</span>
								<span>8</span>
							</div>
							<div className="flex justify-between">
								<span className="text-gray-400">Epochs:</span>
								<span>3</span>
							</div>
						</div>
					</div>
					<div>
						<h4 className="font-medium mb-3 text-purple-400">Resources</h4>
						<div className="space-y-2 text-sm">
							<div className="flex justify-between">
								<span className="text-gray-400">GPU Type:</span>
								<span>A100</span>
							</div>
							<div className="flex justify-between">
								<span className="text-gray-400">Memory:</span>
								<span>40GB</span>
							</div>
							<div className="flex justify-between">
								<span className="text-gray-400">Est. Duration:</span>
								<span>2-4 hours</span>
							</div>
						</div>
					</div>
				</div>
			</div>

			{/* Cost Estimate */}
			<div className="bg-gradient-to-r from-blue-900/20 to-purple-900/20 border border-blue-800 rounded-lg p-6">
				<h3 className="text-lg font-semibold mb-4 text-blue-300">Cost Estimate</h3>
				<div className="grid grid-cols-1 md:grid-cols-4 gap-4">
					<div className="text-center">
						<div className="text-2xl font-bold text-blue-400">$18.50</div>
						<div className="text-sm text-gray-400">Estimated Total</div>
					</div>
					<div className="text-center">
						<div className="text-2xl font-bold text-green-400">$6.20/hr</div>
						<div className="text-sm text-gray-400">GPU Cost</div>
					</div>
					<div className="text-center">
						<div className="text-2xl font-bold text-purple-400">$2.00</div>
						<div className="text-sm text-gray-400">Storage</div>
					</div>
					<div className="text-center">
						<div className="text-2xl font-bold text-yellow-400">3h</div>
						<div className="text-sm text-gray-400">Expected Time</div>
					</div>
				</div>
			</div>

			{/* Terms & Conditions */}
			<div className="bg-yellow-900/20 border border-yellow-800 rounded-lg p-4">
				<div className="flex items-start space-x-3">
					<div className="text-yellow-400 text-xl">⚠️</div>
					<div>
						<h4 className="font-semibold text-yellow-300 mb-2">Important Notes</h4>
						<ul className="text-sm text-yellow-200 space-y-1">
							<li>• Training cannot be paused once started</li>
							<li>• You will be charged based on actual GPU usage</li>
							<li>• Models are automatically saved at checkpoints</li>
							<li>• You'll receive notifications for training progress</li>
						</ul>
					</div>
				</div>
			</div>
		</div>
	);

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
			label: "Configure Parameters",
			enabled: uploadedFiles.some(f => f.status === 'ready' || f.status === 'completed'),
			onClick: async () => {
				if (uploadedFiles.some(f => f.status === 'ready')) {
					await uploadFilesToBackend();
				}
				setCurrentStep(3);
			}
		},
		{
			step: 4,
			label: "Review & Start Training",
			enabled: uploadedFiles.some(f => f.status === 'completed'),
			onClick: () => setCurrentStep(4)
		}
	];

	// Render current step
	const renderCurrentStep = () => {
		switch (currentStep) {
			case 1:
				return (
					<ModelSelection
						selectedModel={selectedModel}
						onModelSelect={setSelectedModel}
						themeColor="blue"
						title="Select Base Model"
						subtitle="Choose a pre-trained model to fine-tune with your data"
						chatMessage="I need help choosing the right model for my fine-tuning project. Can you help me select the best model based on my use case and data?"
						onChatOpen={openChatWithMessage}
					/>
				);
			case 2:
				return (
					<FileUpload
						title="Upload Training Data"
						subtitle="Upload your healthcare data files for fine-tuning"
						selectedModelName={selectedModel ? allModels.find(m => m.id === selectedModel)?.name : undefined}
						uploadedFiles={uploadedFiles}
						dragActive={dragActive}
						themeColor="blue"
						onFileUpload={handleFileUpload}
						onDragEnter={handleDragEnter}
						onDragLeave={handleDragLeave}
						onDragOver={handleDragOver}
						onDrop={handleDrop}
						onRemoveFile={removeFile}
						formatFileSize={formatFileSize}
						additionalNotices={
							<NotificationBanner
								type="green"
								icon="🔒"
								title="Privacy & Security"
								message="Your data is encrypted in transit and at rest. All processing follows HIPAA compliance standards. Data is automatically de-identified and anonymized before training."
								onClose={() => {}}
							/>
						}
					/>
				);
			case 3:
				return renderConfigureParameters();
			case 4:
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
		return (
			<NavigationBar
				currentStep={currentStep}
				steps={navigationSteps}
				themeColor="blue"
				finalAction={currentStep === 4 ? {
					label: "Start Fine-tuning",
					icon: "🚀",
					onClick: handleStartTraining,
					enabled: !!selectedModel && uploadedFiles.some(f => f.status === 'completed')
				} : undefined}
			/>
		);
	};

	return (
		<PageLayout
			title="Fine-tune Model"
			sessionId={sessionId}
			currentStep={currentStep}
			steps={steps}
			themeColor="blue"
			sidebarTitle="Fine-tune Steps"
			isChatOpen={isChatOpen}
			navigationBar={renderNavigationBar()}
		>
			{renderCurrentStep()}
		</PageLayout>
	);
}
