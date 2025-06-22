"use client";

import { ReactNode } from 'react';

interface FilterDropdownProps {
	label: string;
	isActive: boolean;
	showDropdown: boolean;
	onToggle: () => void;
	selectedCount: number;
	themeColor: 'blue' | 'green';
	width?: string;
	children: ReactNode;
}

export default function FilterDropdown({
	label,
	isActive,
	showDropdown,
	onToggle,
	selectedCount,
	themeColor,
	width = 'w-48',
	children
}: FilterDropdownProps) {
	const themeClasses = {
		blue: {
			active: 'border-blue-500 bg-blue-500/10 text-blue-300',
			inactive: 'border-gray-600 bg-gray-700 text-gray-300 hover:bg-gray-600',
			badge: 'bg-blue-600 text-white'
		},
		green: {
			active: 'border-green-500 bg-green-500/10 text-green-300',
			inactive: 'border-gray-600 bg-gray-700 text-gray-300 hover:bg-gray-600',
			badge: 'bg-green-600 text-white'
		}
	};

	const theme = themeClasses[themeColor];

	return (
		<div className="relative">
			<button
				onClick={onToggle}
				className={`px-4 py-2 rounded-lg border text-sm font-medium transition-colors flex items-center gap-2 ${
					isActive ? theme.active : theme.inactive
				}`}
			>
				{label}
				{selectedCount > 0 && (
					<span className={`${theme.badge} text-xs px-1 rounded`}>
						{selectedCount}
					</span>
				)}
				<svg 
					className={`w-4 h-4 transition-transform ${showDropdown ? 'rotate-180' : ''}`} 
					fill="none" 
					stroke="currentColor" 
					viewBox="0 0 24 24"
				>
					<path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M19 9l-7 7-7-7" />
				</svg>
			</button>
			
			{/* Dropdown */}
			{showDropdown && (
				<div className={`absolute top-full mt-2 right-0 ${width} bg-gray-800 border border-gray-600 rounded-lg shadow-xl z-10`}>
					{children}
				</div>
			)}
		</div>
	);
}
