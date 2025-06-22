"use client";

import { useRef } from 'react';
import { UploadedFile } from '@/utils/types';
import UploadedFilesList from './UploadedFilesList';
import NotificationBanner from './NotificationBanner';

interface FileUploadProps {
	title: string;
	subtitle: string;
	selectedModelName?: string;
	uploadedFiles: UploadedFile[];
	dragActive: boolean;
	themeColor: 'blue' | 'green';
	onFileUpload: (files: FileList) => void;
	onDragEnter: (e: React.DragEvent) => void;
	onDragLeave: (e: React.DragEvent) => void;
	onDragOver: (e: React.DragEvent) => void;
	onDrop: (e: React.DragEvent) => void;
	onRemoveFile: (fileId: string) => void;
	formatFileSize: (bytes: number) => string;
	additionalNotices?: React.ReactNode;
}

export default function FileUpload({
	title,
	subtitle,
	selectedModelName,
	uploadedFiles,
	dragActive,
	themeColor,
	onFileUpload,
	onDragEnter,
	onDragLeave,
	onDragOver,
	onDrop,
	onRemoveFile,
	formatFileSize,
	additionalNotices
}: FileUploadProps) {
	const fileInputRef = useRef<HTMLInputElement>(null);
	const dropRef = useRef<HTMLDivElement>(null);

	const themeClasses = {
		blue: {
			button: 'bg-blue-600 hover:bg-blue-700',
			drag: 'border-blue-500 bg-blue-500/10'
		},
		green: {
			button: 'bg-green-600 hover:bg-green-700',
			drag: 'border-green-500 bg-green-500/10'
		}
	};

	const theme = themeClasses[themeColor];

	return (
		<div className="space-y-6">
			<div className="flex items-center justify-between">
				<div>
					<h2 className="text-2xl font-bold mb-2">{title}</h2>
					<p className="text-gray-400">{subtitle}</p>
				</div>
				{selectedModelName && (
					<div className="text-sm text-gray-400 text-right">
						<p>Selected Model:</p>
						<p className={`${themeColor === 'blue' ? 'text-blue-400' : 'text-green-400'} font-medium`}>
							{selectedModelName}
						</p>
					</div>
				)}
			</div>

			{/* File Upload Area */}
			<div
				ref={dropRef}
				onDragEnter={onDragEnter}
				onDragLeave={onDragLeave}
				onDragOver={onDragOver}
				onDrop={onDrop}
				className={`border-2 border-dashed rounded-lg p-8 text-center transition-colors ${
					dragActive
						? theme.drag
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
							className={`${theme.button} text-white px-6 py-2 rounded-lg transition-colors`}
						>
							Browse Files
						</button>
						<input
							ref={fileInputRef}
							type="file"
							multiple
							className="hidden"
							onChange={(e) => e.target.files && onFileUpload(e.target.files)}
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
				<UploadedFilesList
					files={uploadedFiles}
					themeColor={themeColor}
					onRemoveFile={onRemoveFile}
					formatFileSize={formatFileSize}
				/>
			)}

			{/* Data Upload Notice */}
			{uploadedFiles.some(f => f.status === 'ready') && (
				<NotificationBanner
					type={themeColor}
					icon="ℹ️"
					title="Files Ready for Upload"
					message="Your files are staged and ready. They will be uploaded to the server when you proceed to the next step."
					onClose={() => {}}
				/>
			)}

			{/* Additional Notices */}
			{additionalNotices}
		</div>
	);
}
