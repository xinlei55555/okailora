"use client";

interface NotificationBannerProps {
	type: 'blue' | 'green' | 'yellow';
	icon: string;
	title: string;
	message: string;
	buttonText?: string;
	onButtonClick?: () => void;
	onClose: () => void;
}

export default function NotificationBanner({
	type,
	icon,
	title,
	message,
	buttonText,
	onButtonClick,
	onClose
}: NotificationBannerProps) {
	const themeClasses = {
		blue: {
			background: 'bg-blue-900/20 border-blue-800',
			iconColor: 'text-blue-400',
			titleColor: 'text-blue-300',
			textColor: 'text-blue-200',
			buttonColor: 'bg-blue-600 hover:bg-blue-700',
			closeColor: 'text-blue-400 hover:text-blue-300'
		},
		green: {
			background: 'bg-green-900/20 border-green-800',
			iconColor: 'text-green-400',
			titleColor: 'text-green-300',
			textColor: 'text-green-200',
			buttonColor: 'bg-green-600 hover:bg-green-700',
			closeColor: 'text-green-400 hover:text-green-300'
		},
		yellow: {
			background: 'bg-yellow-900/20 border-yellow-800',
			iconColor: 'text-yellow-400',
			titleColor: 'text-yellow-300',
			textColor: 'text-yellow-200',
			buttonColor: 'bg-yellow-600 hover:bg-yellow-700',
			closeColor: 'text-yellow-400 hover:text-yellow-300'
		}
	};

	const theme = themeClasses[type];

	return (
		<div className={`${theme.background} border rounded-lg p-4`}>
			<div className="flex items-start space-x-3">
				<div className={`${theme.iconColor} text-xl`}>{icon}</div>
				<div className="flex-1">
					<h4 className={`font-semibold ${theme.titleColor} mb-1`}>{title}</h4>
					<p className={`text-sm ${theme.textColor} mb-3`}>
						{message}
					</p>
					{buttonText && onButtonClick && (
						<button 
							onClick={onButtonClick}
							className={`text-sm ${theme.buttonColor} text-white px-4 py-2 rounded-lg transition-colors`}
						>
							{buttonText}
						</button>
					)}
				</div>
				<button
					onClick={onClose}
					className={`${theme.closeColor} transition-colors`}
				>
					<svg className="w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
						<path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M6 18L18 6M6 6l12 12" />
					</svg>
				</button>
			</div>
		</div>
	);
}
