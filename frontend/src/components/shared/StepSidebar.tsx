"use client";

export interface SidebarStep {
	step: number;
	title: string;
	icon: string;
}

interface StepSidebarProps {
	currentStep: number;
	steps: SidebarStep[];
	sessionId: string;
	themeColor: 'blue' | 'green';
	title: string;
}

export default function StepSidebar({
	currentStep,
	steps,
	sessionId,
	themeColor,
	title
}: StepSidebarProps) {
	const themeClasses = {
		blue: {
			current: "bg-blue-600 text-white",
			completed: "bg-blue-600/20 text-blue-300"
		},
		green: {
			current: "bg-green-600 text-white", 
			completed: "bg-green-600/20 text-green-300"
		}
	};

	const theme = themeClasses[themeColor];

	return (
		<aside className="w-64 bg-gray-900 border-r border-gray-800 flex-shrink-0 overflow-y-auto">
			<div className="p-6">
				<div className="mb-6">
					<h2 className="text-sm font-semibold text-gray-400 uppercase tracking-wider mb-4">
						{title}
					</h2>
					<div className="space-y-3">
						{steps.map((item) => (
							<div
								key={item.step}
								className={`flex items-center space-x-3 p-3 rounded-lg transition-colors ${
									currentStep === item.step
										? theme.current
										: currentStep > item.step
										? theme.completed
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
					<h3 className="text-sm font-semibold text-gray-400 mb-3">Session Info</h3>
					<div className="text-sm text-gray-400">
						ID: {sessionId?.slice(0, 8)}...
					</div>
				</div>

				<div className="border-t border-gray-800 pt-6 mt-6">
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
	);
}
