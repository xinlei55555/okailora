"use client";

import { ReactNode } from 'react';
import { useRouter } from 'next/navigation';
import StepSidebar, { SidebarStep } from './StepSidebar';

interface PageLayoutProps {
	title: string;
	sessionId: string;
	currentStep: number;
	steps: SidebarStep[];
	themeColor: 'blue' | 'green';
	sidebarTitle: string;
	isChatOpen: boolean;
	children: ReactNode;
	navigationBar: ReactNode;
}

export default function PageLayout({
	title,
	sessionId,
	currentStep,
	steps,
	themeColor,
	sidebarTitle,
	isChatOpen,
	children,
	navigationBar
}: PageLayoutProps) {
	const router = useRouter();

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
							<div className={`text-xl font-bold ${themeColor === 'blue' ? 'text-blue-400' : 'text-green-400'}`}>
								Okailora
							</div>
							<span className="text-gray-400">•</span>
							<h1 className="text-lg font-semibold">{title}</h1>
						</div>
						<div className="text-sm text-gray-400">
							Session: {sessionId?.slice(0, 8)}...
						</div>
					</div>
				</div>
			</header>

			<div className="flex flex-1 overflow-hidden">
				{/* Sidebar */}
				<StepSidebar
					currentStep={currentStep}
					steps={steps}
					sessionId={sessionId}
					themeColor={themeColor}
					title={sidebarTitle}
				/>

				{/* Main Content */}
				<main className={`flex-1 transition-all duration-300 ${isChatOpen ? 'mr-96' : ''} flex flex-col overflow-hidden`}>
					<div className="flex-1 overflow-y-auto">
						<div className="p-8 pb-6">
							<div className="max-w-4xl mx-auto">
								{children}
							</div>
						</div>
					</div>
					
					{/* Sticky Navigation Footer */}
					<div className="border-t border-gray-800 bg-gray-900/95 backdrop-blur-sm p-4 flex-shrink-0">
						<div className="max-w-4xl mx-auto">
							{navigationBar}
						</div>
					</div>
				</main>
			</div>
		</div>
	);
}
