import { Model } from './types';

// Our custom models
const ourModels: Model[] = [
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
const huggingFaceModels: Model[] = [
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
export const allModels: Model[] = [...ourModels, ...huggingFaceModels];
