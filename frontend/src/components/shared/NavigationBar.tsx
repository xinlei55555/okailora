"use client";

export interface NavigationStep {
	step: number;
	label: string;
	enabled: boolean;
	onClick?: () => void;
}

interface NavigationBarProps {
	currentStep: number;
	steps: NavigationStep[];
	themeColor: 'blue' | 'green';
	finalAction?: {
		label: string;
		icon?: string;
		onClick: () => void;
		enabled: boolean;
	};
}

export default function NavigationBar({
	currentStep,
	steps,
	themeColor,
	finalAction
}: NavigationBarProps) {
	const baseButtonClass = "px-6 py-2 rounded-lg transition-colors font-medium";
	const secondaryButtonClass = "border border-gray-600 text-gray-300 hover:bg-gray-700";
	
	const themeClasses = {
		blue: {
			primary: "bg-blue-600 hover:bg-blue-700 text-white",
			special: "bg-gradient-to-r from-blue-600 to-purple-600 hover:from-blue-700 hover:to-purple-700 text-white px-8 py-3 rounded-lg transition-all font-semibold"
		},
		green: {
			primary: "bg-green-600 hover:bg-green-700 text-white", 
			special: "bg-gradient-to-r from-green-600 to-blue-600 hover:from-green-700 hover:to-blue-700 text-white px-8 py-3 rounded-lg transition-all font-semibold"
		}
	};

	const theme = themeClasses[themeColor];
	
	const currentStepData = steps.find(s => s.step === currentStep);
	const nextStep = steps.find(s => s.step === currentStep + 1);
	const prevStep = steps.find(s => s.step === currentStep - 1);
	
	const isLastStep = currentStep === Math.max(...steps.map(s => s.step));

	return (
		<div className="flex justify-between">
			{/* Back Button */}
			<div>
				{prevStep && (
					<button
						onClick={prevStep.onClick}
						className={`${baseButtonClass} ${secondaryButtonClass}`}
					>
						← Back to {prevStep.label}
					</button>
				)}
			</div>
			
			{/* Forward Actions */}
			<div className="flex gap-4">
				{/* Next Step Button */}
				{nextStep && nextStep.enabled && !isLastStep && (
					<button
						onClick={nextStep.onClick}
						className={`${baseButtonClass} ${theme.primary}`}
					>
						{nextStep.label} →
					</button>
				)}
				
				{/* Final Action Button */}
				{isLastStep && finalAction && finalAction.enabled && (
					<button
						onClick={finalAction.onClick}
						className={theme.special}
					>
						{finalAction.icon} {finalAction.label}
					</button>
				)}
			</div>
		</div>
	);
}
