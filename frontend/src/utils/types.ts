export interface Model {
  id: string;
  name: string;
  description: string;
  downloads: string;
  tags: string[];
  license: string;
  isOurs: boolean;
}

export interface UploadedFile {
  id: string;
  name: string;
  size: number;
  type: string;
  lastModified: number;
  status: 'ready' | 'uploading' | 'completed' | 'error';
  progress: number;
  file?: File;
}
