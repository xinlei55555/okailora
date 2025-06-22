"use client";

import { useState, useRef, useEffect } from 'react';
import { useParams, useRouter } from 'next/navigation';
import { useChatContext } from '@/components/ChatWidget';
import { InferenceService } from '@/api/services/InferenceService';
import { Model, UploadedFile } from '@/utils/types';
import { allModels } from '@/utils/models';

export default function InferencePage() {
	const params = useParams();
	const router = useRouter();
	const { isChatOpen, openChatWithMessage } = useChatContext();
	const sessionId = params.sessionId as string;
	
	// State management
	const [selectedModel, setSelectedModel] = useState<string>('');
	const [searchQuery, setSearchQuery] = useState('');
	const [selectedTags, setSelectedTags] = useState<string[]>([]);
	const [selectedLicense, setSelectedLicense] = useState<string>('all');
	const [showTagFilters, setShowTagFilters] = useState(false);
	const [showLicenseFilters, setShowLicenseFilters] = useState(false);
	const [showRecommendationsBanner, setShowRecommendationsBanner] = useState(true);
	const [uploadedFiles, setUploadedFiles] = useState<UploadedFile[]>([]);
	const [dragActive, setDragActive] = useState(false);
	const [currentStep, setCurrentStep] = useState(1);
	
	const fileInputRef = useRef<HTMLInputElement>(null);
	const dropRef = useRef<HTMLDivElement>(null);

	// Get all unique tags and licenses
	const allTags = Array.from(new Set(allModels.flatMap(model => model.tags))).sort();
	const allLicenses = Array.from(new Set(allModels.map(model => model.license))).sort();

	// Filtered models based on search and filters
	const filteredModels = allModels.filter((model: Model) => {
		const matchesSearch = model.name.toLowerCase().includes(searchQuery.toLowerCase()) ||
			model.description.toLowerCase().includes(searchQuery.toLowerCase()) ||
			model.tags.some((tag: string) => tag.toLowerCase().includes(searchQuery.toLowerCase()));
		
		const matchesTags = selectedTags.length === 0 || 
			selectedTags.some(tag => model.tags.includes(tag));
		
		const matchesLicense = selectedLicense === 'all' || model.license === selectedLicense;
		
		return matchesSearch && matchesTags && matchesLicense;
	});

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
				await InferenceService.inferenceUploadData(sessionId, formData);

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

	// Function to start inference
	const handleStartInference = async () => {
		if (!selectedModel) {
			console.error('No model selected');
			return;
		}

		try {
			console.log('Starting inference process...');
			
			const modelType = getModelType(selectedModel);
			console.log(`Model type determined: ${modelType} for model: ${selectedModel} - sending inference start request`);
			
			const response = await InferenceService.inferenceStart(sessionId, {
				model_type: modelType
			});
			
			console.log('Inference started successfully:', response);
			
			// Navigate to the inference loop page
			router.push(`/inference-loop/${sessionId}`);
			
		} catch (error) {
			console.error('Failed to start inference:', error);
			// You might want to show an error message to the user here
			alert('Failed to start inference. Please try again.');
		}
	};

	// Navigation component
	const renderNavigationBar = () => {
		const baseButtonClass = "px-6 py-2 rounded-lg transition-colors font-medium";
		const primaryButtonClass = "bg-blue-600 hover:bg-blue-700 text-white";
		const secondaryButtonClass = "border border-gray-600 text-gray-300 hover:bg-gray-700";
		const specialButtonClass = "bg-gradient-to-r from-green-600 to-blue-600 hover:from-green-700 hover:to-blue-700 text-white px-8 py-3 rounded-lg transition-all font-semibold";

		switch (currentStep) {
			case 1:
				return (
					<div className="flex justify-end">
						{selectedModel && (
							<button
								onClick={() => setCurrentStep(2)}
								className={`${baseButtonClass} ${primaryButtonClass}`}
							>
								Continue to Data Upload →
							</button>
						)}
					</div>
				);
			
			case 2:
				return (
					<div className="flex justify-between">
						<button
							onClick={() => setCurrentStep(1)}
							className={`${baseButtonClass} ${secondaryButtonClass}`}
						>
							← Back to Model Selection
						</button>
						{uploadedFiles.some(f => f.status === 'ready' || f.status === 'completed') && (
							<button
								onClick={async () => {
									if (uploadedFiles.some(f => f.status === 'ready')) {
										await uploadFilesToBackend();
									}
									setCurrentStep(3);
								}}
								className={`${baseButtonClass} ${primaryButtonClass}`}
							>
								Review & Start Inference →
							</button>
						)}
					</div>
				);
			
			case 3:
				return (
					<div className="flex justify-between">
						<button
							onClick={() => setCurrentStep(2)}
							className={`${baseButtonClass} ${secondaryButtonClass}`}
						>
							← Back to Data Upload
						</button>
						<button
							onClick={handleStartInference}
							className={specialButtonClass}
						>
							🔮 Start Inference
						</button>
					</div>
				);
			
			default:
				return (
					<div className="flex justify-center">
						<button
							onClick={() => setCurrentStep(3)}
							className={`${baseButtonClass} ${secondaryButtonClass}`}
						>
							← Back to Review
						</button>
					</div>
				);
		}
	};

	// Step 1: Model Selection Component
	const renderModelSelection = () => (
		<div className="space-y-6">
			<div className="flex items-center justify-between">
				<div>
					<h2 className="text-2xl font-bold mb-2">Select Model for Inference</h2>
					<p className="text-gray-400">Choose a trained model to run inference on your data</p>
				</div>
			</div>

			{/* AI Assistant Suggestion - Closable */}
			{showRecommendationsBanner && (
				<div className="bg-green-900/20 border border-green-800 rounded-lg p-4">
					<div className="flex items-start space-x-3">
						<div className="text-green-400 text-xl">🤖</div>
						<div className="flex-1">
							<h4 className="font-semibold text-green-300 mb-1">Need help choosing a model?</h4>
							<p className="text-sm text-green-200 mb-3">
								Our AI assistant can help you select the best model for your inference task based on your data type and requirements.
							</p>
							<button 
								onClick={() => openChatWithMessage("I need help choosing the right model for my inference task. Can you help me select the best model based on my data and requirements?")}
								className="text-sm bg-green-600 hover:bg-green-700 text-white px-4 py-2 rounded-lg transition-colors"
							>
								💬 Get Model Recommendations
							</button>
						</div>
						<button
							onClick={() => setShowRecommendationsBanner(false)}
							className="text-green-400 hover:text-green-300 transition-colors"
						>
							<svg className="w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
								<path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M6 18L18 6M6 6l12 12" />
							</svg>
						</button>
					</div>
				</div>
			)}

			{/* Search and Filters Bar */}
			<div className="bg-gray-800/50 rounded-lg p-4 border border-gray-700">
				<div className="flex flex-col lg:flex-row gap-4">
					{/* Search */}
					<div className="flex-1">
						<input
							type="text"
							value={searchQuery}
							onChange={(e) => setSearchQuery(e.target.value)}
							placeholder="Search models by name, description, or tags..."
							className="w-full bg-gray-700 border border-gray-600 rounded-lg px-4 py-2 focus:outline-none focus:ring-2 focus:ring-green-500"
						/>
					</div>
					
					{/* Filter Buttons */}
					<div className="flex gap-2">
						{/* License Filter */}
						<div className="relative">
							<button
								onClick={() => setShowLicenseFilters(!showLicenseFilters)}
								className={`px-4 py-2 rounded-lg border text-sm font-medium transition-colors flex items-center gap-2 ${
									selectedLicense !== 'all' || showLicenseFilters
										? 'border-green-500 bg-green-500/10 text-green-300'
										: 'border-gray-600 bg-gray-700 text-gray-300 hover:bg-gray-600'
								}`}
							>
								License
								{selectedLicense !== 'all' && (
									<span className="bg-green-600 text-white text-xs px-1 rounded">1</span>
								)}
								<svg 
									className={`w-4 h-4 transition-transform ${showLicenseFilters ? 'rotate-180' : ''}`} 
									fill="none" 
									stroke="currentColor" 
									viewBox="0 0 24 24"
								>
									<path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M19 9l-7 7-7-7" />
								</svg>
							</button>
							
							{/* License Dropdown */}
							{showLicenseFilters && (
								<div className="absolute top-full mt-2 right-0 w-48 bg-gray-800 border border-gray-600 rounded-lg shadow-xl z-10">
									<div className="p-2">
										<button
											onClick={() => {
												setSelectedLicense('all');
												setShowLicenseFilters(false);
											}}
											className={`w-full text-left px-3 py-2 rounded text-sm transition-colors ${
												selectedLicense === 'all' ? 'bg-green-600 text-white' : 'text-gray-300 hover:bg-gray-700'
											}`}
										>
											All Licenses
										</button>
										{allLicenses.map(license => (
											<button
												key={license}
												onClick={() => {
													setSelectedLicense(license);
													setShowLicenseFilters(false);
												}}
												className={`w-full text-left px-3 py-2 rounded text-sm transition-colors ${
													selectedLicense === license ? 'bg-green-600 text-white' : 'text-gray-300 hover:bg-gray-700'
												}`}
											>
												{license}
											</button>
										))}
									</div>
								</div>
							)}
						</div>

						{/* Tag Filter */}
						<div className="relative">
							<button
								onClick={() => setShowTagFilters(!showTagFilters)}
								className={`px-4 py-2 rounded-lg border text-sm font-medium transition-colors flex items-center gap-2 ${
									selectedTags.length > 0 || showTagFilters
										? 'border-green-500 bg-green-500/10 text-green-300'
										: 'border-gray-600 bg-gray-700 text-gray-300 hover:bg-gray-600'
								}`}
							>
								Tags
								{selectedTags.length > 0 && (
									<span className="bg-green-600 text-white text-xs px-1 rounded">{selectedTags.length}</span>
								)}
								<svg 
									className={`w-4 h-4 transition-transform ${showTagFilters ? 'rotate-180' : ''}`} 
									fill="none" 
									stroke="currentColor" 
									viewBox="0 0 24 24"
								>
									<path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M19 9l-7 7-7-7" />
								</svg>
							</button>
							
							{/* Tag Dropdown */}
							{showTagFilters && (
								<div className="absolute top-full mt-2 right-0 w-64 bg-gray-800 border border-gray-600 rounded-lg shadow-xl z-10">
									<div className="p-3">
										<div className="flex items-center justify-between mb-3">
											<span className="text-sm font-medium text-gray-300">Filter by tags</span>
											{selectedTags.length > 0 && (
												<button
													onClick={() => setSelectedTags([])}
													className="text-xs text-green-400 hover:text-green-300"
												>
													Clear all
												</button>
											)}
										</div>
										<div className="grid grid-cols-2 gap-2 max-h-48 overflow-y-auto">
											{allTags.map(tag => (
												<button
													key={tag}
													onClick={() => {
														setSelectedTags(prev => 
															prev.includes(tag) 
																? prev.filter(t => t !== tag)
																: [...prev, tag]
														);
													}}
													className={`px-2 py-1 rounded text-xs transition-colors text-left ${
														selectedTags.includes(tag)
															? "bg-green-600 text-white"
															: "bg-gray-700 text-gray-300 hover:bg-gray-600"
													}`}
												>
													{tag}
												</button>
											))}
										</div>
									</div>
								</div>
							)}
						</div>
					</div>
				</div>

				{/* Active Filters Display */}
				{(selectedLicense !== 'all' || selectedTags.length > 0) && (
					<div className="mt-3 pt-3 border-t border-gray-600">
						<div className="flex flex-wrap gap-2 items-center">
							<span className="text-xs text-gray-400">Active filters:</span>
							{selectedLicense !== 'all' && (
								<span className="inline-flex items-center gap-1 text-xs bg-green-600 text-white px-2 py-1 rounded-full">
									License: {selectedLicense}
									<button
										onClick={() => setSelectedLicense('all')}
										className="hover:bg-green-700 rounded-full p-0.5"
									>
										<svg className="w-3 h-3" fill="none" stroke="currentColor" viewBox="0 0 24 24">
											<path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M6 18L18 6M6 6l12 12" />
										</svg>
									</button>
								</span>
							)}
							{selectedTags.map(tag => (
								<span
									key={tag}
									className="inline-flex items-center gap-1 text-xs bg-green-600 text-white px-2 py-1 rounded-full"
								>
									{tag}
									<button
										onClick={() => setSelectedTags(prev => prev.filter(t => t !== tag))}
										className="hover:bg-green-700 rounded-full p-0.5"
									>
										<svg className="w-3 h-3" fill="none" stroke="currentColor" viewBox="0 0 24 24">
											<path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M6 18L18 6M6 6l12 12" />
										</svg>
									</button>
								</span>
							))}
						</div>
					</div>
				)}
			</div>

			{/* Models Grid */}
			<div className="bg-gray-800/50 rounded-lg border border-gray-700">
				<div className="p-4 border-b border-gray-700">
					<h3 className="text-lg font-semibold">
						Available Models ({filteredModels.length})
					</h3>
				</div>
				
				<div className="p-6">
					{filteredModels.length > 0 ? (
						<div className="grid grid-cols-1 lg:grid-cols-2 xl:grid-cols-3 gap-4 max-h-96 overflow-y-auto pr-2">
							{filteredModels.map((model: Model) => (
								<div
									key={model.id}
									onClick={() => setSelectedModel(model.id)}
									className={`p-4 rounded-lg border cursor-pointer transition-all hover:scale-[1.02] ${
										selectedModel === model.id
											? "border-green-500 bg-green-500/10 shadow-lg"
											: "border-gray-600 hover:border-gray-500 bg-gray-700/30"
									}`}
								>
									<div className="flex items-start justify-between mb-3">
										<div className="flex items-center space-x-2">
											<h4 className="font-semibold text-white text-sm">{model.name}</h4>
											{model.isOurs && (
												<span className="text-xs bg-green-600 text-white px-2 py-0.5 rounded-full font-medium">
													Okailora
												</span>
											)}
										</div>
										{selectedModel === model.id && (
											<div className="text-green-400">
												<svg className="w-5 h-5" fill="currentColor" viewBox="0 0 20 20">
													<path fillRule="evenodd" d="M10 18a8 8 0 100-16 8 8 0 000 16zm3.707-9.293a1 1 0 00-1.414-1.414L9 10.586 7.707 9.293a1 1 0 00-1.414 1.414l2 2a1 1 0 001.414 0l4-4z" clipRule="evenodd" />
												</svg>
											</div>
										)}
									</div>
									<p className="text-xs text-gray-400 mb-3 leading-relaxed h-8 overflow-hidden">{model.description}</p>
									<div className="flex flex-wrap gap-1 mb-2">
										{model.tags.slice(0, 3).map((tag: string) => (
											<span
												key={tag}
												className={`text-xs px-2 py-0.5 rounded ${
													model.isOurs 
														? "bg-green-600/20 text-green-300"
														: "bg-gray-600 text-gray-300"
												}`}
											>
												{tag}
											</span>
										))}
										{model.tags.length > 3 && (
											<span className="text-xs text-gray-500">
												+{model.tags.length - 3}
											</span>
										)}
									</div>
									<div className="flex justify-between items-center text-xs text-gray-500">
										<span>{model.downloads} downloads</span>
										<span>{model.license}</span>
									</div>
								</div>
							))}
						</div>
					) : (
						<div className="text-center py-12 text-gray-400">
							<div className="text-4xl mb-4">🔍</div>
							<p className="mb-4">No models found matching your criteria</p>
							<button 
								onClick={() => {
									setSearchQuery('');
									setSelectedTags([]);
									setSelectedLicense('all');
									setShowTagFilters(false);
									setShowLicenseFilters(false);
								}}
								className="text-green-400 hover:text-green-300 text-sm"
							>
								Clear all filters
							</button>
						</div>
					)}
				</div>
			</div>
		</div>
	);

	// Step 2: Data Upload Component
	const renderDataUpload = () => (
		<div className="space-y-6">
			<div className="flex items-center justify-between">
				<div>
					<h2 className="text-2xl font-bold mb-2">Upload Inference Data</h2>
					<p className="text-gray-400">Upload your data files for inference processing</p>
				</div>
				<div className="text-sm text-gray-400 text-right">
					<p>Selected Model:</p>
					<p className="text-green-400 font-medium">
						{selectedModel ? allModels.find(m => m.id === selectedModel)?.name : 'None'}
					</p>
				</div>
			</div>

			{/* File Upload Area */}
			<div
				ref={dropRef}
				onDragEnter={handleDragEnter}
				onDragLeave={handleDragLeave}
				onDragOver={handleDragOver}
				onDrop={handleDrop}
				className={`border-2 border-dashed rounded-lg p-8 text-center transition-colors ${
					dragActive
						? "border-green-500 bg-green-500/10"
						: "border-gray-600 hover:border-gray-500"
				}`}
			>
				<div className="space-y-4">
					<div className="text-4xl">📁</div>
					<div>
						<h3 className="text-lg font-semibold mb-2">Upload Your Data</h3>
						<p className="text-gray-400 mb-4">
							Drag and drop files here, or click to browse
						</p>
						<button
							onClick={() => fileInputRef.current?.click()}
							className="bg-green-600 hover:bg-green-700 text-white px-6 py-2 rounded-lg transition-colors"
						>
							Browse Files
						</button>
						<input
							ref={fileInputRef}
							type="file"
							multiple
							className="hidden"
							onChange={(e) => e.target.files && handleFileUpload(e.target.files)}
							accept=".zip"
						/>
					</div>
					<div className="text-sm text-gray-500">
						Supported formats: ZIP files only (Max 100MB per file)
					</div>
				</div>
			</div>

			{/* Uploaded Files */}
			{uploadedFiles.length > 0 && (
				<div className="bg-gray-800/50 rounded-lg p-6 border border-gray-700">
					<h3 className="text-lg font-semibold mb-4">Uploaded Files</h3>
					<div className="space-y-3">
						{uploadedFiles.map((file) => (
							<div
								key={file.id}
								className="flex items-center justify-between p-3 bg-gray-700/50 rounded-lg"
							>
								<div className="flex-1">
									<div className="flex items-center space-x-3">
										<div className="text-2xl">📄</div>
										<div>
											<div className="font-medium">{file.name}</div>
											<div className="text-sm text-gray-400">
												{formatFileSize(file.size)} • {file.status === 'ready' ? 'ready to upload' : file.status}
											</div>
										</div>
									</div>
									{file.status === 'uploading' && (
										<div className="mt-2">
											<div className="w-full bg-gray-600 rounded-full h-2">
												<div
													className="bg-green-500 h-2 rounded-full transition-all duration-300" // TODO make this faster
													style={{ width: `${file.progress}%` }}
												></div>
											</div>
										</div>
									)}
								</div>
								<button
									onClick={() => removeFile(file.id)}
									className="text-red-400 hover:text-red-300 p-2"
								>
									<svg className="w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
										<path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M19 7l-.867 12.142A2 2 0 0116.138 21H7.862a2 2 0 01-1.995-1.858L5 7m5 4v6m4-6v6m1-10V4a1 1 0 00-1-1h-4a1 1 0 00-1 1v3M4 7h16" />
									</svg>
								</button>
							</div>
						))}
					</div>
				</div>
			)}

			{/* Data Upload Notice */}
			{uploadedFiles.some(f => f.status === 'ready') && (
				<div className="bg-green-900/20 border border-green-800 rounded-lg p-4">
					<div className="flex items-start space-x-3">
						<div className="text-green-400 text-xl">ℹ️</div>
						<div>
							<h4 className="font-semibold text-green-300 mb-1">Files Ready for Upload</h4>
							<p className="text-sm text-green-200">
								Your files are staged and ready. They will be uploaded to the server when you proceed to review.
							</p>
						</div>
					</div>
				</div>
			)}

			{/* Data Privacy Notice */}
			<div className="bg-blue-900/20 border border-blue-800 rounded-lg p-4">
				<div className="flex items-start space-x-3">
					<div className="text-blue-400 text-xl">🔒</div>
					<div>
						<h4 className="font-semibold text-blue-300 mb-1">Privacy & Security</h4>
						<p className="text-sm text-blue-200">
							Your data is encrypted in transit and at rest. All processing follows HIPAA compliance standards.
							Data is automatically de-identified and anonymized before inference.
						</p>
					</div>
				</div>
			</div>
		</div>
	);

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

	// Default placeholder for step > 3
	const renderPlaceholder = () => (
		<div className="text-center py-12">
			<div className="text-4xl mb-4">🚧</div>
			<h2 className="text-xl font-semibold mb-2">Step {currentStep} Coming Soon</h2>
			<p className="text-gray-400 mb-6">This step is under development</p>
		</div>
	);

	// Render current step
	const renderCurrentStep = () => {
		switch (currentStep) {
			case 1:
				return renderModelSelection();
			case 2:
				return renderDataUpload();
			case 3:
				return renderReviewAndStart();
			default:
				return renderPlaceholder();
		}
	};

	return (
		<div className="h-screen bg-gray-950 text-white flex flex-col">
			{/* Header */}
			<header className="border-b border-gray-800 bg-gray-900/50 backdrop-blur-sm flex-shrink-0">
				<div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
					<div className="flex justify-between items-center h-16">
						<div className="flex items-center space-x-4">
							<button
								onClick={() => router.back()}
								className="flex items-center space-x-2 text-gray-400 hover:text-white transition-colors"
							>
								<svg className="w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
									<path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M15 19l-7-7 7-7" />
								</svg>
								<span>Back</span>
							</button>
							<div className="text-xl font-bold text-blue-400">Okailora</div>
							<span className="text-gray-400">•</span>
							<h1 className="text-lg font-semibold">Run Inference</h1>
						</div>
						<div className="text-sm text-gray-400">
							Session: {sessionId?.slice(0, 8)}...
						</div>
					</div>
				</div>
			</header>

			<div className="flex flex-1 overflow-hidden">
				{/* Sidebar */}
				<aside className="w-64 bg-gray-900 border-r border-gray-800 flex-shrink-0 overflow-y-auto">
					<div className="p-6">
						<div className="mb-6">
							<h2 className="text-sm font-semibold text-gray-400 uppercase tracking-wider mb-4">
								Inference Steps
							</h2>
							<div className="space-y-3">
								{[
									{ step: 1, title: "Select Model", icon: "🤖" },
									{ step: 2, title: "Upload Data", icon: "📁" },
									{ step: 3, title: "Review & Start", icon: "🔮" },
								].map((item) => (
									<div
										key={item.step}
										className={`flex items-center space-x-3 p-3 rounded-lg transition-colors ${
											currentStep === item.step
												? "bg-green-600 text-white"
												: currentStep > item.step
												? "bg-green-600/20 text-green-300"
												: "text-gray-400"
										}`}
									>
										<span className="text-lg">{item.icon}</span>
										<div>
											<div className="font-medium">{item.title}</div>
											<div className="text-xs opacity-75">Step {item.step}</div>
										</div>
									</div>
								))}
							</div>
						</div>

						<div className="border-t border-gray-800 pt-6">
							<h3 className="text-sm font-semibold text-gray-400 mb-3">Quick Actions</h3>
							<div className="space-y-2">
								<button className="w-full text-left text-sm text-gray-300 hover:text-white transition-colors">
									📚 View Documentation
								</button>
								<button className="w-full text-left text-sm text-gray-300 hover:text-white transition-colors">
									💾 Save Progress
								</button>
								<button className="w-full text-left text-sm text-gray-300 hover:text-white transition-colors">
									📊 View Examples
								</button>
							</div>
						</div>
					</div>
				</aside>

				{/* Main Content */}
				<main className={`flex-1 transition-all duration-300 ${isChatOpen ? 'mr-96' : ''} flex flex-col overflow-hidden`}>
					<div className="flex-1 overflow-y-auto">
						<div className="p-8 pb-6">
							<div className="max-w-4xl mx-auto">
								{renderCurrentStep()}
							</div>
						</div>
					</div>
					
					{/* Sticky Navigation Footer */}
					<div className="border-t border-gray-800 bg-gray-900/95 backdrop-blur-sm p-4 flex-shrink-0">
						<div className="max-w-4xl mx-auto">
							{renderNavigationBar()}
						</div>
					</div>
				</main>
			</div>
		</div>
	);
}
