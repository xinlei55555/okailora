"use client";

import { UploadedFile } from '@/utils/types';

interface UploadedFilesListProps {
	files: UploadedFile[];
	themeColor: 'blue' | 'green';
	onRemoveFile: (fileId: string) => void;
	formatFileSize: (bytes: number) => string;
}

export default function UploadedFilesList({
	files,
	themeColor,
	onRemoveFile,
	formatFileSize
}: UploadedFilesListProps) {
	const themeClasses = {
		blue: {
			progress: 'bg-blue-500'
		},
		green: {
			progress: 'bg-green-500'
		}
	};

	const theme = themeClasses[themeColor];

	return (
		<div className="bg-gray-800/50 rounded-lg p-6 border border-gray-700">
			<h3 className="text-lg font-semibold mb-4">Uploaded Files</h3>
			<div className="space-y-3">
				{files.map((file) => (
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
											className={`${theme.progress} h-2 rounded-full transition-all duration-300`}
											style={{ width: `${file.progress}%` }}
										></div>
									</div>
								</div>
							)}
						</div>
						<button
							onClick={() => onRemoveFile(file.id)}
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
	);
}
