"use client";

import { useState, useRef, useEffect } from 'react';
import { useParams, useRouter } from 'next/navigation';
import { useChatContext } from '@/components/ChatWidget';
import { InferenceService } from '@/api/services/InferenceService';

// Using the same model lists from the finetune page
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
  status: 'ready' | 'uploading' | 'completed' | 'error';
  progress: number;
  file?: File;
}

export default function InferencePage() {
  const params = useParams();
  const router = useRouter();
  const { openChatWithMessage } = useChatContext();
  const sessionId = params.sessionId as string;
  
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

  const allTags = Array.from(new Set(allModels.flatMap(model => model.tags))).sort();
  const allLicenses = Array.from(new Set(allModels.map(model => model.license))).sort();

  const filteredModels = allModels.filter((model: Model) => {
    const matchesSearch = model.name.toLowerCase().includes(searchQuery.toLowerCase()) ||
      model.description.toLowerCase().includes(searchQuery.toLowerCase()) ||
      model.tags.some((tag: string) => tag.toLowerCase().includes(searchQuery.toLowerCase()));
    
    const matchesTags = selectedTags.length === 0 || 
      selectedTags.some(tag => model.tags.includes(tag));
    
    const matchesLicense = selectedLicense === 'all' || model.license === selectedLicense;
    
    return matchesSearch && matchesTags && matchesLicense;
  });

  const handleFileUpload = (files: FileList) => {
    Array.from(files).forEach((file) => {
      const fileId = Math.random().toString(36).substr(2, 9);
      const uploadedFile: UploadedFile = {
        id: fileId,
        name: file.name,
        size: file.size,
        type: file.type,
        lastModified: file.lastModified,
        status: 'ready',
        progress: 0,
        file: file
      };
      setUploadedFiles(prev => [...prev, uploadedFile]);
    });
  };

  const uploadFilesToBackend = async () => {
    const filesToUpload = uploadedFiles.filter(f => f.status === 'ready');
    if (filesToUpload.length === 0) return;

    for (const fileData of filesToUpload) {
      if (!fileData.file) continue;

      setUploadedFiles(prev => 
        prev.map(f => f.id === fileData.id ? { ...f, status: 'uploading', progress: 0 } : f)
      );

      try {
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

        await InferenceService.inferenceUploadData(sessionId, { file: fileData.file });

        clearInterval(progressInterval);
        setUploadedFiles(prev => 
          prev.map(f => f.id === fileData.id ? { ...f, status: 'completed', progress: 100 } : f)
        );
      } catch (error) {
        console.error(`Upload failed for ${fileData.name}:`, error);
        setUploadedFiles(prev => 
          prev.map(f => f.id === fileData.id ? { ...f, status: 'error', progress: 0 } : f)
        );
      }
    }
  };

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
    if (e.dataTransfer.files && e.dataTransfer.files.length > 0) {
      handleFileUpload(e.dataTransfer.files);
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

  const handleStartInference = async () => {
    if (!selectedModel) {
      console.error('No model selected');
      return;
    }
    if (uploadedFiles.some(f => f.status === 'ready')) {
      await uploadFilesToBackend();
    }
    
    // For now, just navigate to the results page
    router.push(`/inference-results/${sessionId}`);
  };

  const renderNavigationBar = () => {
    const baseButtonClass = "px-6 py-2 rounded-lg transition-colors font-medium";
    const primaryButtonClass = "bg-blue-600 hover:bg-blue-700 text-white";
    const secondaryButtonClass = "border border-gray-600 text-gray-300 hover:bg-gray-700";
    const specialButtonClass = "bg-gradient-to-r from-green-600 to-teal-600 hover:from-green-700 hover:to-teal-700 text-white px-8 py-3 rounded-lg transition-all font-semibold";

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
                onClick={handleStartInference}
                className={specialButtonClass}
              >
                🎯 Run Inference
              </button>
            )}
          </div>
        );
      
      default:
        return null;
    }
  };

  const renderModelSelection = () => (
    <div className="space-y-6">
      <h2 className="text-2xl font-bold">Select Model for Inference</h2>
      <p className="text-gray-400">Choose a trained model to run inference with your data.</p>
      
      {showRecommendationsBanner && (
        <div className="bg-blue-900/20 border border-blue-800 rounded-lg p-4">
          <div className="flex items-start space-x-3">
            <div className="text-blue-400 text-xl">🤖</div>
            <div className="flex-1">
              <h4 className="font-semibold text-blue-300 mb-1">Need help choosing a model?</h4>
              <p className="text-sm text-blue-200 mb-3">
                Our AI assistant can help you choose the best model for your inference task.
              </p>
              <button 
                onClick={() => openChatWithMessage("I need help choosing a model for inference.")}
                className="text-sm bg-blue-600 hover:bg-blue-700 text-white px-4 py-2 rounded-lg transition-colors"
              >
                💬 Get Model Recommendations
              </button>
            </div>
            <button
              onClick={() => setShowRecommendationsBanner(false)}
              className="text-blue-400 hover:text-blue-300"
            >
              <svg className="w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M6 18L18 6M6 6l12 12" /></svg>
            </button>
          </div>
        </div>
      )}

      <div className="bg-gray-800/50 rounded-lg p-4 border border-gray-700">
        <div className="flex flex-col lg:flex-row gap-4">
          <div className="flex-1">
            <input
              type="text"
              value={searchQuery}
              onChange={(e) => setSearchQuery(e.target.value)}
              placeholder="Search models..."
              className="w-full bg-gray-700 border border-gray-600 rounded-lg px-4 py-2 focus:outline-none focus:ring-2 focus:ring-blue-500"
            />
          </div>
          <div className="flex gap-2">
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
              </button>
            </div>
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
              </button>
            </div>
          </div>
        </div>
      </div>

      <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
        {filteredModels.map((model) => (
          <div
            key={model.id}
            onClick={() => setSelectedModel(model.id)}
            className={`p-4 rounded-lg border-2 cursor-pointer transition-all ${
              selectedModel === model.id ? 'border-blue-500 bg-blue-500/10' : 'border-gray-700 hover:border-blue-600'
            }`}
          >
            <h3 className="font-bold text-white">{model.name}</h3>
            <p className="text-sm text-gray-400 mt-1">{model.description}</p>
          </div>
        ))}
      </div>
    </div>
  );

  const renderDataUpload = () => (
    <div className="space-y-6">
      <h2 className="text-2xl font-bold">Upload Your Dataset for Inference</h2>
      <p className="text-gray-400">Upload the data you want to run the model on.</p>
      
      <div 
        onDragEnter={handleDragEnter}
        onDragLeave={handleDragLeave}
        onDragOver={handleDragOver}
        onDrop={handleDrop}
        onClick={() => fileInputRef.current?.click()}
        className={`border-2 border-dashed rounded-lg p-12 text-center cursor-pointer transition-colors ${
          dragActive ? 'border-blue-500 bg-blue-500/10' : 'border-gray-600 hover:border-gray-500'
        }`}
      >
        <input
          ref={fileInputRef}
          type="file"
          multiple
          onChange={(e) => e.target.files && handleFileUpload(e.target.files)}
          className="hidden"
        />
        <p className="text-gray-400">Drag & drop files here, or click to select files.</p>
      </div>

      {uploadedFiles.length > 0 && (
        <div className="space-y-4">
          <h3 className="text-lg font-semibold">Uploaded Files</h3>
          {uploadedFiles.map(file => (
            <div key={file.id} className="flex items-center justify-between bg-gray-800 p-3 rounded-lg">
              <div>
                <p className="font-medium text-white">{file.name}</p>
                <p className="text-sm text-gray-400">{formatFileSize(file.size)} - {file.status}</p>
              </div>
              <button onClick={() => removeFile(file.id)} className="text-red-500 hover:text-red-400">Remove</button>
            </div>
          ))}
        </div>
      )}
    </div>
  );

  return (
    <div className="min-h-screen bg-gray-950 text-white p-8">
      <div className="max-w-7xl mx-auto">
        <div className="space-y-8">
          {currentStep === 1 && renderModelSelection()}
          {currentStep === 2 && renderDataUpload()}
        </div>
        <div className="mt-8 pt-8 border-t border-gray-800">
          {renderNavigationBar()}
        </div>
      </div>
    </div>
  );
}
