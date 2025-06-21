"use client";

import { useState, useRef, useEffect } from 'react';
import { useParams, useRouter } from 'next/navigation';
import { useChatContext } from '@/components/ChatWidget';

// Mock data for Hugging Face models
const popularModels = [
  {
    id: "microsoft/DialoGPT-medium",
    name: "DialoGPT Medium",
    description: "A conversational AI model for healthcare dialogue",
    downloads: "2.1M",
    tags: ["healthcare", "dialogue", "medical"],
    license: "MIT"
  },
  {
    id: "emilyalsentzer/Bio_ClinicalBERT",
    name: "Bio ClinicalBERT",
    description: "BERT model pre-trained on clinical text",
    downloads: "892K",
    tags: ["medical", "clinical", "bert"],
    license: "Apache 2.0"
  },
  {
    id: "medicalai/ClinicalT5-base",
    name: "ClinicalT5 Base",
    description: "T5 model fine-tuned for medical text generation",
    downloads: "456K",
    tags: ["medical", "generation", "t5"],
    license: "MIT"
  }
];

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
  const { isChatOpen } = useChatContext();
  const sessionId = params.sessionId as string;
  
  // State management
  const [selectedModel, setSelectedModel] = useState<string>('');
  const [searchQuery, setSearchQuery] = useState('');
  const [uploadedFiles, setUploadedFiles] = useState<UploadedFile[]>([]);
  const [dragActive, setDragActive] = useState(false);
  const [currentStep, setCurrentStep] = useState(1);
  const [showModelSearch, setShowModelSearch] = useState(false);
  
  const fileInputRef = useRef<HTMLInputElement>(null);
  const dropRef = useRef<HTMLDivElement>(null);

  // Filtered models based on search
  const filteredModels = popularModels.filter(model =>
    model.name.toLowerCase().includes(searchQuery.toLowerCase()) ||
    model.description.toLowerCase().includes(searchQuery.toLowerCase()) ||
    model.tags.some(tag => tag.toLowerCase().includes(searchQuery.toLowerCase()))
  );

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

  return (
    <div className="min-h-screen bg-gray-950 text-white">
      {/* Header */}
      <header className="border-b border-gray-800 bg-gray-900/50 backdrop-blur-sm">
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

      <div className="flex">
        {/* Sidebar */}
        <aside className="w-64 bg-gray-900 border-r border-gray-800 min-h-screen">
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
        <main className={`flex-1 transition-all duration-300 ${isChatOpen ? 'mr-0' : ''}`}>
          <div className="p-8">
            <div className="max-w-4xl mx-auto">
              {/* Step 1: Model Selection */}
              {currentStep === 1 && (
                <div className="space-y-6">
                  <div className="flex items-center justify-between">
                    <div>
                      <h2 className="text-2xl font-bold mb-2">Select Base Model</h2>
                      <p className="text-gray-400">Choose a pre-trained model to fine-tune with your data</p>
                    </div>
                    <button
                      onClick={() => setShowModelSearch(!showModelSearch)}
                      className="bg-blue-600 hover:bg-blue-700 text-white px-4 py-2 rounded-lg transition-colors"
                    >
                      Browse Hugging Face
                    </button>
                  </div>

                  {/* Model Search */}
                  {showModelSearch && (
                    <div className="bg-gray-800/50 rounded-lg p-6 border border-gray-700">
                      <div className="mb-4">
                        <label className="block text-sm font-medium mb-2">Search Models</label>
                        <input
                          type="text"
                          value={searchQuery}
                          onChange={(e) => setSearchQuery(e.target.value)}
                          placeholder="Search for medical, clinical, or healthcare models..."
                          className="w-full bg-gray-700 border border-gray-600 rounded-lg px-4 py-2 focus:outline-none focus:ring-2 focus:ring-blue-500"
                        />
                      </div>

                      <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                        {filteredModels.map((model) => (
                          <div
                            key={model.id}
                            onClick={() => setSelectedModel(model.id)}
                            className={`p-4 rounded-lg border cursor-pointer transition-all ${
                              selectedModel === model.id
                                ? "border-blue-500 bg-blue-500/10"
                                : "border-gray-600 hover:border-gray-500 bg-gray-700/30"
                            }`}
                          >
                            <div className="flex items-start justify-between mb-2">
                              <h3 className="font-semibold text-white">{model.name}</h3>
                              <span className="text-xs text-gray-400">{model.downloads}</span>
                            </div>
                            <p className="text-sm text-gray-400 mb-3">{model.description}</p>
                            <div className="flex flex-wrap gap-1 mb-2">
                              {model.tags.map((tag) => (
                                <span
                                  key={tag}
                                  className="text-xs bg-gray-600 text-gray-300 px-2 py-1 rounded"
                                >
                                  {tag}
                                </span>
                              ))}
                            </div>
                            <div className="text-xs text-gray-500">License: {model.license}</div>
                          </div>
                        ))}
                      </div>
                    </div>
                  )}

                  {selectedModel && (
                    <div className="flex justify-end">
                      <button
                        onClick={() => setCurrentStep(2)}
                        className="bg-blue-600 hover:bg-blue-700 text-white px-6 py-2 rounded-lg transition-colors"
                      >
                        Continue to Data Upload
                      </button>
                    </div>
                  )}
                </div>
              )}

              {/* Step 2: Data Upload */}
              {currentStep === 2 && (
                <div className="space-y-6">
                  <div>
                    <h2 className="text-2xl font-bold mb-2">Upload Training Data</h2>
                    <p className="text-gray-400">Upload your healthcare data files for fine-tuning</p>
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

                  {uploadedFiles.some(f => f.status === 'completed') && (
                    <div className="flex justify-between">
                      <button
                        onClick={() => setCurrentStep(1)}
                        className="border border-gray-600 text-gray-300 hover:bg-gray-700 px-6 py-2 rounded-lg transition-colors"
                      >
                        Back to Model Selection
                      </button>
                      <button
                        onClick={() => setCurrentStep(3)}
                        className="bg-blue-600 hover:bg-blue-700 text-white px-6 py-2 rounded-lg transition-colors"
                      >
                        Configure Parameters
                      </button>
                    </div>
                  )}
                </div>
              )}

              {/* Placeholder for other steps */}
              {currentStep > 2 && (
                <div className="text-center py-12">
                  <div className="text-4xl mb-4">🚧</div>
                  <h2 className="text-xl font-semibold mb-2">Step {currentStep} Coming Soon</h2>
                  <p className="text-gray-400 mb-6">This step is under development</p>
                  <button
                    onClick={() => setCurrentStep(2)}
                    className="border border-gray-600 text-gray-300 hover:bg-gray-700 px-6 py-2 rounded-lg transition-colors"
                  >
                    Back to Data Upload
                  </button>
                </div>
              )}
            </div>
          </div>
        </main>
      </div>
    </div>
  );
}
