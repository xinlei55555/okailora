import { Model } from './types';
import { InferenceService } from '../api/services/InferenceService';
import { Deployment } from '../api/models/Deployment';

// Helper function to generate tags based on deployment type and name
function generateTags(deployment: Deployment): string[] {
  const tags: string[] = ['custom'];
  
  // Add tags based on deployment type
  if (deployment.type) {
    tags.push(deployment.type);
  }
  
  // Add tags based on common patterns in the name
  const name = deployment.name?.toLowerCase() || '';
  if (name.includes('healthcare') || name.includes('medical') || name.includes('clinical')) {
    tags.push('healthcare');
  }
  if (name.includes('bert')) {
    tags.push('bert');
  }
  if (name.includes('t5')) {
    tags.push('t5');
  }
  if (name.includes('gpt')) {
    tags.push('gpt');
  }
  if (name.includes('llm')) {
    tags.push('llm');
  }
  if (name.includes('diagnosis')) {
    tags.push('diagnosis');
  }
  if (name.includes('qa') || name.includes('question')) {
    tags.push('qa');
  }
  
  return tags;
}

// Helper function to format download count
function formatDownloads(downloads?: number): string {
  if (!downloads) return '0';
  if (downloads >= 1000000) {
    return `${(downloads / 1000000).toFixed(1)}M`;
  }
  if (downloads >= 1000) {
    return `${(downloads / 1000).toFixed(1)}K`;
  }
  return downloads.toString();
}

// Transform Deployment to Model
function transformDeploymentToModel(deployment: Deployment): Model {
  return {
    id: deployment.deployment_id || `okailora/${deployment.name || 'unknown'}`,
    name: deployment.name || 'Unknown Model',
    description: deployment.description || 'No description available',
    downloads: formatDownloads(deployment.downloads),
    tags: generateTags(deployment),
    license: deployment.license || 'Apache 2.0',
    isOurs: true
  };
}

// Fallback models in case API fails
const fallbackOurModels: Model[] = [
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

// Async function to get our models from the API
export async function getOurModels(): Promise<Model[]> {
  try {
    const deployments = await InferenceService.inferenceList();
    
    // Check if the response is an array (success case)
    if (Array.isArray(deployments)) {
      return deployments.map(transformDeploymentToModel);
    }
    
    // If not an array, fall back to hardcoded models
    console.warn('API returned unexpected format, using fallback models');
    return fallbackOurModels;
  } catch (error) {
    console.error('Failed to fetch models from API, using fallback models:', error);
    return fallbackOurModels;
  }
}

// Hugging Face models (these remain static)
export const huggingFaceModels: Model[] = [
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

// Sync export of all models (includes fallback models initially)
export const allModels: Model[] = [...fallbackOurModels, ...huggingFaceModels];

// Async function to get all models (our models from API + Hugging Face models)
export async function getAllModels(): Promise<Model[]> {
  const ourModels = await getOurModels();
  return [...ourModels, ...huggingFaceModels];
}

// Function to update allModels array with fresh data from API
export async function refreshAllModels(): Promise<void> {
  try {
    const freshModels = await getAllModels();
    // Update the allModels array in place
    allModels.length = 0;
    allModels.push(...freshModels);
  } catch (error) {
    console.error('Failed to refresh models:', error);
  }
}
