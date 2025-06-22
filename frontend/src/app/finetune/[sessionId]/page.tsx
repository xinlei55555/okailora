"use client";

import { useState, useRef, useEffect } from 'react';
import { useParams, useRouter } from 'next/navigation';
import { useChatContext } from '@/components/ChatWidget';

// Our custom models
const ourModels = [
  {
    id: "okailora/HealthcareGPT-7B",
    name: "HealthcareGPT 7B",
    description: "Our flagship model for healthcare conversations and analysis",
    downloads: "1.2M",
    tags: ["healthcare", "custom", "flagship"],
    license: "Apache 2.0",
    isOurs: true
  },
  {
    id: "okailora/ClinicalBERT-Enhanced",
    name: "ClinicalBERT Enhanced",
    description: "Enhanced BERT model optimized for clinical documentation",
    downloads: "850K",
    tags: ["clinical", "bert", "custom"],
    license: "MIT",
    isOurs: true
  },
  {
    id: "okailora/MedicalQA-T5",
    name: "MedicalQA T5",
    description: "Specialized T5 model for medical question answering",
    downloads: "620K",
    tags: ["medical", "qa", "custom"],
    license: "Apache 2.0",
    isOurs: true
  },
  {
    id: "okailora/DiagnosisAssist-LLM",
    name: "DiagnosisAssist LLM",
    description: "Large language model trained for diagnostic assistance",
    downloads: "430K",
    tags: ["diagnosis", "llm", "custom"],
    license: "MIT",
    isOurs: true
  }
];

// Hugging Face models
const huggingFaceModels = [
  {
    id: "microsoft/DialoGPT-medium",
    name: "DialoGPT Medium",
    description: "A conversational AI model for healthcare dialogue",
    downloads: "2.1M",
    tags: ["healthcare", "dialogue", "medical"],
    license: "MIT",
    isOurs: false
  },
  {
    id: "emilyalsentzer/Bio_ClinicalBERT",
    name: "Bio ClinicalBERT",
    description: "BERT model pre-trained on clinical text",
    downloads: "892K",
    tags: ["medical", "clinical", "bert"],
    license: "Apache 2.0",
    isOurs: false
  },
  {
    id: "medicalai/ClinicalT5-base",
    name: "ClinicalT5 Base",
    description: "T5 model fine-tuned for medical text generation",
    downloads: "456K",
    tags: ["medical", "generation", "t5"],
    license: "MIT",
    isOurs: false
  },
  {
    id: "google/flan-t5-base",
    name: "FLAN-T5 Base",
    description: "Instruction-tuned T5 model for various tasks",
    downloads: "3.2M",
    tags: ["instruction", "general", "t5"],
    license: "Apache 2.0",
    isOurs: false
  },
  {
    id: "microsoft/BiomedNLP-PubMedBERT-base-uncased-abstract",
    name: "PubMedBERT",
    description: "BERT trained on PubMed abstracts for biomedical NLP",
    downloads: "1.8M",
    tags: ["biomedical", "pubmed", "bert"],
    license: "MIT",
    isOurs: false
  },
  {
    id: "allenai/scibert_scivocab_uncased",
    name: "SciBERT",
    description: "BERT model for scientific text understanding",
    downloads: "976K",
    tags: ["scientific", "bert", "research"],
    license: "Apache 2.0",
    isOurs: false
  }
];

// Combined models list
const allModels = [...ourModels, ...huggingFaceModels];

interface Model {
  id: string;
  name: string;
  description: string;
  downloads: string;
  tags: string[];
  license: string;
  isOurs: boolean;
}

interface UploadedFile {
  id: string;
  name: string;
  size: number;
  type: string;
  lastModified: number;
  status: 'uploading' | 'completed' | 'error';
  progress: number;
}

export default function FinetunePage() {
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

  // Handle file upload
  const handleFileUpload = (files: FileList) => {
    Array.from(files).forEach(file => {
      const fileId = Math.random().toString(36).substr(2, 9);
      const uploadedFile: UploadedFile = {
        id: fileId,
        name: file.name,
        size: file.size,
        type: file.type,
        lastModified: file.lastModified,
        status: 'uploading',
        progress: 0
      };

      setUploadedFiles(prev => [...prev, uploadedFile]);

      // Simulate upload progress
      let progress = 0;
      const interval = setInterval(() => {
        progress += Math.random() * 15;
        if (progress >= 100) {
          progress = 100;
          clearInterval(interval);
          setUploadedFiles(prev => 
            prev.map(f => f.id === fileId ? { ...f, status: 'completed', progress: 100 } : f)
          );
        } else {
          setUploadedFiles(prev => 
            prev.map(f => f.id === fileId ? { ...f, progress } : f)
          );
        }
      }, 200);
    });
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

  // Navigation component
  const renderNavigationBar = () => {
    const baseButtonClass = "px-6 py-2 rounded-lg transition-colors font-medium";
    const primaryButtonClass = "bg-blue-600 hover:bg-blue-700 text-white";
    const secondaryButtonClass = "border border-gray-600 text-gray-300 hover:bg-gray-700";
    const specialButtonClass = "bg-gradient-to-r from-blue-600 to-purple-600 hover:from-blue-700 hover:to-purple-700 text-white px-8 py-3 rounded-lg transition-all font-semibold";

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
            {uploadedFiles.some(f => f.status === 'completed') && (
              <button
                onClick={() => setCurrentStep(3)}
                className={`${baseButtonClass} ${primaryButtonClass}`}
              >
                Configure Parameters →
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
              onClick={() => setCurrentStep(4)}
              className={`${baseButtonClass} ${primaryButtonClass}`}
            >
              Review & Start Training →
            </button>
          </div>
        );
      
      case 4:
        return (
          <div className="flex justify-between">
            <button
              onClick={() => setCurrentStep(3)}
              className={`${baseButtonClass} ${secondaryButtonClass}`}
            >
              ← Back to Configuration
            </button>
            <button
              onClick={() => router.push(`/finetune-loop/${sessionId}`)}
              className={specialButtonClass}
            >
              🚀 Start Fine-tuning
            </button>
          </div>
        );
      
      default:
        return (
          <div className="flex justify-center">
            <button
              onClick={() => setCurrentStep(4)}
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
          <h2 className="text-2xl font-bold mb-2">Select Base Model</h2>
          <p className="text-gray-400">Choose a pre-trained model to fine-tune with your data</p>
        </div>
      </div>

      {/* AI Assistant Suggestion - Closable */}
      {showRecommendationsBanner && (
        <div className="bg-blue-900/20 border border-blue-800 rounded-lg p-4">
          <div className="flex items-start space-x-3">
            <div className="text-blue-400 text-xl">🤖</div>
            <div className="flex-1">
              <h4 className="font-semibold text-blue-300 mb-1">Not sure which model to choose?</h4>
              <p className="text-sm text-blue-200 mb-3">
                Our AI assistant can analyze your specific use case and recommend the best model based on your data type, performance requirements, and goals.
              </p>
              <button 
                onClick={() => openChatWithMessage("I need help choosing the right model for my fine-tuning project. Can you help me select the best model based on my use case and data?")}
                className="text-sm bg-blue-600 hover:bg-blue-700 text-white px-4 py-2 rounded-lg transition-colors"
              >
                💬 Get Model Recommendations
              </button>
            </div>
            <button
              onClick={() => setShowRecommendationsBanner(false)}
              className="text-blue-400 hover:text-blue-300 transition-colors"
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
              className="w-full bg-gray-700 border border-gray-600 rounded-lg px-4 py-2 focus:outline-none focus:ring-2 focus:ring-blue-500"
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
                    ? 'border-blue-500 bg-blue-500/10 text-blue-300'
                    : 'border-gray-600 bg-gray-700 text-gray-300 hover:bg-gray-600'
                }`}
              >
                License
                {selectedLicense !== 'all' && (
                  <span className="bg-blue-600 text-white text-xs px-1 rounded">1</span>
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
                        selectedLicense === 'all' ? 'bg-blue-600 text-white' : 'text-gray-300 hover:bg-gray-700'
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
                          selectedLicense === license ? 'bg-blue-600 text-white' : 'text-gray-300 hover:bg-gray-700'
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
                    ? 'border-blue-500 bg-blue-500/10 text-blue-300'
                    : 'border-gray-600 bg-gray-700 text-gray-300 hover:bg-gray-600'
                }`}
              >
                Tags
                {selectedTags.length > 0 && (
                  <span className="bg-blue-600 text-white text-xs px-1 rounded">{selectedTags.length}</span>
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
                          className="text-xs text-blue-400 hover:text-blue-300"
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
                              ? "bg-blue-600 text-white"
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
                <span className="inline-flex items-center gap-1 text-xs bg-blue-600 text-white px-2 py-1 rounded-full">
                  License: {selectedLicense}
                  <button
                    onClick={() => setSelectedLicense('all')}
                    className="hover:bg-blue-700 rounded-full p-0.5"
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
                  className="inline-flex items-center gap-1 text-xs bg-blue-600 text-white px-2 py-1 rounded-full"
                >
                  {tag}
                  <button
                    onClick={() => setSelectedTags(prev => prev.filter(t => t !== tag))}
                    className="hover:bg-blue-700 rounded-full p-0.5"
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
                      ? "border-blue-500 bg-blue-500/10 shadow-lg"
                      : "border-gray-600 hover:border-gray-500 bg-gray-700/30"
                  }`}
                >
                  <div className="flex items-start justify-between mb-3">
                    <div className="flex items-center space-x-2">
                      <h4 className="font-semibold text-white text-sm">{model.name}</h4>
                      {model.isOurs && (
                        <span className="text-xs bg-blue-600 text-white px-2 py-0.5 rounded-full font-medium">
                          Okailora
                        </span>
                      )}
                    </div>
                    {selectedModel === model.id && (
                      <div className="text-blue-400">
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
                            ? "bg-blue-600/20 text-blue-300"
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
                className="text-blue-400 hover:text-blue-300 text-sm"
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
          <h2 className="text-2xl font-bold mb-2">Upload Training Data</h2>
          <p className="text-gray-400">Upload your healthcare data files for fine-tuning</p>
        </div>
        <div className="text-sm text-gray-400 text-right">
          <p>Selected Model:</p>
          <p className="text-blue-400 font-medium">
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
            ? "border-blue-500 bg-blue-500/10"
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
              className="bg-blue-600 hover:bg-blue-700 text-white px-6 py-2 rounded-lg transition-colors"
            >
              Browse Files
            </button>
            <input
              ref={fileInputRef}
              type="file"
              multiple
              className="hidden"
              onChange={(e) => e.target.files && handleFileUpload(e.target.files)}
              accept=".csv,.json,.txt,.jsonl"
            />
          </div>
          <div className="text-sm text-gray-500">
            Supported formats: CSV, JSON, TXT, JSONL (Max 100MB per file)
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
                        {formatFileSize(file.size)} • {file.status}
                      </div>
                    </div>
                  </div>
                  {file.status === 'uploading' && (
                    <div className="mt-2">
                      <div className="w-full bg-gray-600 rounded-full h-2">
                        <div
                          className="bg-blue-500 h-2 rounded-full transition-all duration-300"
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

      {/* Data Privacy Notice */}
      <div className="bg-green-900/20 border border-green-800 rounded-lg p-4">
        <div className="flex items-start space-x-3">
          <div className="text-green-400 text-xl">🔒</div>
          <div>
            <h4 className="font-semibold text-green-300 mb-1">Privacy & Security</h4>
            <p className="text-sm text-green-200">
              Your data is encrypted in transit and at rest. All processing follows HIPAA compliance standards.
              Data is automatically de-identified and anonymized before training.
            </p>
          </div>
        </div>
      </div>
    </div>
  );

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
                  <option>0.05</option>
                </select>
              </div>
            </div>
          </div>

          {/* Advanced Parameters */}
          <div className="bg-gray-800/50 rounded-lg p-6 border border-gray-700">
            <h3 className="text-lg font-semibold mb-4">Advanced Settings</h3>
            <div className="space-y-4">
              <div className="flex items-center justify-between">
                <div>
                  <label className="text-sm font-medium">Gradient Accumulation Steps</label>
                  <p className="text-xs text-gray-400">Accumulate gradients over multiple steps</p>
                </div>
                <select className="bg-gray-700 border border-gray-600 rounded-lg px-3 py-1 focus:outline-none focus:ring-2 focus:ring-blue-500">
                  <option>4</option>
                  <option>8</option>
                  <option>16</option>
                </select>
              </div>
              <div className="flex items-center justify-between">
                <div>
                  <label className="text-sm font-medium">Warmup Steps</label>
                  <p className="text-xs text-gray-400">Number of learning rate warmup steps</p>
                </div>
                <select className="bg-gray-700 border border-gray-600 rounded-lg px-3 py-1 focus:outline-none focus:ring-2 focus:ring-blue-500">
                  <option>500</option>
                  <option>100</option>
                  <option>1000</option>
                </select>
              </div>
              <div className="flex items-center justify-between">
                <div>
                  <label className="text-sm font-medium">Save Strategy</label>
                  <p className="text-xs text-gray-400">When to save model checkpoints</p>
                </div>
                <select className="bg-gray-700 border border-gray-600 rounded-lg px-3 py-1 focus:outline-none focus:ring-2 focus:ring-blue-500">
                  <option>epoch</option>
                  <option>steps</option>
                  <option>no</option>
                </select>
              </div>
            </div>
          </div>

          {/* Hyperparameter Grid Search */}
          <div className="bg-gray-800/50 rounded-lg p-6 border border-gray-700">
            <div className="flex items-center justify-between mb-4">
              <h3 className="text-lg font-semibold">Hyperparameter Grid Search</h3>
              <button className="text-sm bg-blue-600 hover:bg-blue-700 text-white px-3 py-1 rounded transition-colors">
                Enable Grid Search
              </button>
            </div>
            <div className="text-sm text-gray-400 space-y-2">
              <p>• Automatically test multiple hyperparameter combinations</p>
              <p>• Find optimal settings for your specific dataset</p>
              <p>• Increases training time but improves final model performance</p>
            </div>
          </div>
        </div>

        {/* Training Stats & ETA */}
        <div className="space-y-6">
          {/* Estimated Training Time */}
          <div className="bg-gray-800/50 rounded-lg p-6 border border-gray-700">
            <h3 className="text-lg font-semibold mb-4">Training Estimate</h3>
            <div className="space-y-4">
              <div>
                <div className="flex justify-between items-center mb-2">
                  <span className="text-sm text-gray-400">Estimated Duration</span>
                  <span className="text-sm font-medium">2h 15m</span>
                </div>
                <div className="flex justify-between items-center mb-2">
                  <span className="text-sm text-gray-400">Data Size</span>
                  <span className="text-sm font-medium">{uploadedFiles.reduce((acc, file) => acc + file.size, 0) > 0 ? formatFileSize(uploadedFiles.reduce((acc, file) => acc + file.size, 0)) : 'No data'}</span>
                </div>
                <div className="flex justify-between items-center mb-2">
                  <span className="text-sm text-gray-400">GPU Hours</span>
                  <span className="text-sm font-medium">4.5h</span>
                </div>
                <div className="flex justify-between items-center">
                  <span className="text-sm text-gray-400">Estimated Cost</span>
                  <span className="text-sm font-medium text-green-400">$12.50</span>
                </div>
              </div>
            </div>
          </div>

          {/* Resource Usage */}
          <div className="bg-gray-800/50 rounded-lg p-6 border border-gray-700">
            <h3 className="text-lg font-semibold mb-4">Resource Requirements</h3>
            <div className="space-y-3">
              <div className="flex items-center justify-between">
                <span className="text-sm text-gray-400">GPU Memory</span>
                <span className="text-sm">16 GB</span>
              </div>
              <div className="flex items-center justify-between">
                <span className="text-sm text-gray-400">Storage</span>
                <span className="text-sm">25 GB</span>
              </div>
              <div className="flex items-center justify-between">
                <span className="text-sm text-gray-400">Instance Type</span>
                <span className="text-sm">A100-40GB</span>
              </div>
            </div>
          </div>

          {/* Training Configuration Summary */}
          <div className="bg-gray-800/50 rounded-lg p-6 border border-gray-700">
            <h3 className="text-lg font-semibold mb-4">Configuration Summary</h3>
            <div className="space-y-2 text-sm">
              <div className="flex justify-between">
                <span className="text-gray-400">Model:</span>
                <span className="text-right">
                  {selectedModel ? allModels.find(m => m.id === selectedModel)?.name : 'Not selected'}
                </span>
              </div>
              <div className="flex justify-between">
                <span className="text-gray-400">Files:</span>
                <span>{uploadedFiles.filter(f => f.status === 'completed').length} uploaded</span>
              </div>
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
        <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
          <div>
            <h4 className="font-medium mb-3 text-blue-400">Data & Model</h4>
            <div className="space-y-2 text-sm">
              <div className="flex justify-between">
                <span className="text-gray-400">Selected Model:</span>
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
              <div className="flex justify-between">
                <span className="text-gray-400">Weight Decay:</span>
                <span>0.01</span>
              </div>
            </div>
          </div>
        </div>
      </div>

      {/* Cost & Time Estimate */}
      <div className="bg-gradient-to-r from-blue-900/20 to-purple-900/20 border border-blue-800 rounded-lg p-6">
        <h3 className="text-lg font-semibold mb-4 text-blue-300">Training Estimate</h3>
        <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
          <div className="text-center">
            <div className="text-2xl font-bold text-blue-400">2h 15m</div>
            <div className="text-sm text-gray-400">Estimated Duration</div>
          </div>
          <div className="text-center">
            <div className="text-2xl font-bold text-green-400">$12.50</div>
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
        <h3 className="text-lg font-semibold mb-4">Training Data Files</h3>
        <div className="space-y-2">
          {uploadedFiles.filter(f => f.status === 'completed').map((file) => (
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
              <li>• Training cannot be paused once started</li>
              <li>• You will be charged based on actual GPU usage</li>
              <li>• Model will be saved automatically upon completion</li>
              <li>• You'll receive email notifications for training progress</li>
            </ul>
          </div>
        </div>
      </div>
    </div>
  );

  // Default placeholder for step > 4
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
        return renderConfigureParameters();
      case 4:
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
              <h1 className="text-lg font-semibold">Fine-tune Model</h1>
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
                Fine-tune Steps
              </h2>
              <div className="space-y-3">
                {[
                  { step: 1, title: "Select Base Model", icon: "🤖" },
                  { step: 2, title: "Upload Training Data", icon: "📁" },
                  { step: 3, title: "Configure Parameters", icon: "⚙️" },
                  { step: 4, title: "Review & Start", icon: "🚀" },
                ].map((item) => (
                  <div
                    key={item.step}
                    className={`flex items-center space-x-3 p-3 rounded-lg transition-colors ${
                      currentStep === item.step
                        ? "bg-blue-600 text-white"
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
                  📊 View Templates
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
