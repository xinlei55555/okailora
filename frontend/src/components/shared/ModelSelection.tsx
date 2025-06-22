"use client";

import { useState, useEffect } from 'react';
import { Model } from '@/utils/types';
import { allModels, refreshAllModels } from '@/utils/models';
import FilterDropdown from './FilterDropdown';
import NotificationBanner from './NotificationBanner';

interface ModelSelectionProps {
	selectedModel: string;
	onModelSelect: (modelId: string) => void;
	themeColor?: 'blue' | 'green';
	title: string;
	subtitle: string;
	chatMessage: string;
	onChatOpen: (message: string) => void;
}

export default function ModelSelection({
	selectedModel,
	onModelSelect,
	themeColor = 'blue',
	title,
	subtitle,
	chatMessage,
	onChatOpen
}: ModelSelectionProps) {
	const [searchQuery, setSearchQuery] = useState('');
	const [selectedTags, setSelectedTags] = useState<string[]>([]);
	const [selectedLicense, setSelectedLicense] = useState<string>('all');
	const [showTagFilters, setShowTagFilters] = useState(false);
	const [showLicenseFilters, setShowLicenseFilters] = useState(false);
	const [showRecommendationsBanner, setShowRecommendationsBanner] = useState(true);
	const [modelsRefreshed, setModelsRefreshed] = useState(false);

	// Refresh models from API on component mount
	useEffect(() => {
		const refreshModels = async () => {
			try {
				await refreshAllModels();
				setModelsRefreshed(true);
			} catch (error) {
				console.error('Failed to refresh models:', error);
				setModelsRefreshed(true); // Still set to true to continue with fallback models
			}
		};
		
		refreshModels();
	}, []);

	// Get all unique tags and licenses
	const allTags = Array.from(new Set(allModels.flatMap(model => model.tags))).sort();
	const allLicenses = Array.from(new Set(allModels.map(model => model.license))).sort();

	// Filtered models based on search and filters
	const filteredModels = allModels.filter((model: Model) => {
		const matchesSearch = model.name.toLowerCase().includes(searchQuery.toLowerCase()) ||
			model.description.toLowerCase().includes(searchQuery.toLowerCase()) ||
			model.tags.some((tag: string) => tag.toLowerCase().includes(searchQuery.toLowerCase()));
		
		const matchesTags = selectedTags.length === 0 || 
			selectedTags.some(tag => model.tags.includes(tag));
		
		const matchesLicense = selectedLicense === 'all' || model.license === selectedLicense;
		
		return matchesSearch && matchesTags && matchesLicense;
	});

	const clearAllFilters = () => {
		setSearchQuery('');
		setSelectedTags([]);
		setSelectedLicense('all');
		setShowTagFilters(false);
		setShowLicenseFilters(false);
	};

	const themeClasses = {
		blue: {
			focusRing: 'focus:ring-blue-500',
			activeFilter: 'border-blue-500 bg-blue-500/10 text-blue-300',
			badgeActive: 'bg-blue-600 text-white',
			badgeInactive: 'bg-blue-600 text-white',
			clearButton: 'text-blue-400 hover:text-blue-300',
			selectedBorder: 'border-blue-500 bg-blue-500/10',
			selectedIcon: 'text-blue-400',
			selectedBadge: 'bg-blue-600',
			tagActive: 'bg-blue-600 text-white',
			tagOurs: 'bg-blue-600/20 text-blue-300'
		},
		green: {
			focusRing: 'focus:ring-green-500',
			activeFilter: 'border-green-500 bg-green-500/10 text-green-300',
			badgeActive: 'bg-green-600 text-white',
			badgeInactive: 'bg-green-600 text-white',
			clearButton: 'text-green-400 hover:text-green-300',
			selectedBorder: 'border-green-500 bg-green-500/10',
			selectedIcon: 'text-green-400',
			selectedBadge: 'bg-green-600',
			tagActive: 'bg-green-600 text-white',
			tagOurs: 'bg-green-600/20 text-green-300'
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
			</div>

			{/* AI Assistant Suggestion */}
			{showRecommendationsBanner && (
				<NotificationBanner
					type={themeColor}
					icon="🤖"
					title="Need help choosing a model?"
					message="Our AI assistant can help you select the best model for your task based on your data type and requirements."
					buttonText="💬 Get Model Recommendations"
					onButtonClick={() => onChatOpen(chatMessage)}
					onClose={() => setShowRecommendationsBanner(false)}
				/>
			)}

			{/* Search and Filters Bar */}
			<div className="bg-gray-800/50 rounded-lg p-4 border border-gray-700">
				<div className="flex flex-col lg:flex-row gap-4">
					{/* Search */}
					<div className="flex-1">
						<input
							type="text"
							value={searchQuery}
							onChange={(e) => setSearchQuery(e.target.value)}
							placeholder="Search models by name, description, or tags..."
							className={`w-full bg-gray-700 border border-gray-600 rounded-lg px-4 py-2 focus:outline-none focus:ring-2 ${theme.focusRing}`}
						/>
					</div>
					
					{/* Filter Buttons */}
					<div className="flex gap-2">
						{/* License Filter */}
						<FilterDropdown
							label="License"
							isActive={selectedLicense !== 'all' || showLicenseFilters}
							showDropdown={showLicenseFilters}
							onToggle={() => setShowLicenseFilters(!showLicenseFilters)}
							selectedCount={selectedLicense !== 'all' ? 1 : 0}
							themeColor={themeColor}
						>
							<div className="p-2">
								<button
									onClick={() => {
										setSelectedLicense('all');
										setShowLicenseFilters(false);
									}}
									className={`w-full text-left px-3 py-2 rounded text-sm transition-colors ${
										selectedLicense === 'all' ? theme.tagActive : 'text-gray-300 hover:bg-gray-700'
									}`}
								>
									All Licenses
								</button>
								{allLicenses.map(license => (
									<button
										key={license}
										onClick={() => {
											setSelectedLicense(license);
											setShowLicenseFilters(false);
										}}
										className={`w-full text-left px-3 py-2 rounded text-sm transition-colors ${
											selectedLicense === license ? theme.tagActive : 'text-gray-300 hover:bg-gray-700'
										}`}
									>
										{license}
									</button>
								))}
							</div>
						</FilterDropdown>

						{/* Tag Filter */}
						<FilterDropdown
							label="Tags"
							isActive={selectedTags.length > 0 || showTagFilters}
							showDropdown={showTagFilters}
							onToggle={() => setShowTagFilters(!showTagFilters)}
							selectedCount={selectedTags.length}
							themeColor={themeColor}
							width="w-64"
						>
							<div className="p-3">
								<div className="flex items-center justify-between mb-3">
									<span className="text-sm font-medium text-gray-300">Filter by tags</span>
									{selectedTags.length > 0 && (
										<button
											onClick={() => setSelectedTags([])}
											className={`text-xs ${theme.clearButton}`}
										>
											Clear all
										</button>
									)}
								</div>
								<div className="grid grid-cols-2 gap-2 max-h-48 overflow-y-auto">
									{allTags.map(tag => (
										<button
											key={tag}
											onClick={() => {
												setSelectedTags(prev => 
													prev.includes(tag) 
														? prev.filter(t => t !== tag)
														: [...prev, tag]
												);
											}}
											className={`px-2 py-1 rounded text-xs transition-colors text-left ${
												selectedTags.includes(tag)
													? theme.tagActive
													: "bg-gray-700 text-gray-300 hover:bg-gray-600"
											}`}
										>
											{tag}
										</button>
									))}
								</div>
							</div>
						</FilterDropdown>
					</div>
				</div>

				{/* Active Filters Display */}
				{(selectedLicense !== 'all' || selectedTags.length > 0) && (
					<div className="mt-3 pt-3 border-t border-gray-600">
						<div className="flex flex-wrap gap-2 items-center">
							<span className="text-xs text-gray-400">Active filters:</span>
							{selectedLicense !== 'all' && (
								<span className={`inline-flex items-center gap-1 text-xs ${theme.badgeActive} px-2 py-1 rounded-full`}>
									License: {selectedLicense}
									<button
										onClick={() => setSelectedLicense('all')}
										className="hover:bg-opacity-80 rounded-full p-0.5"
									>
										<svg className="w-3 h-3" fill="none" stroke="currentColor" viewBox="0 0 24 24">
											<path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M6 18L18 6M6 6l12 12" />
										</svg>
									</button>
								</span>
							)}
							{selectedTags.map(tag => (
								<span
									key={tag}
									className={`inline-flex items-center gap-1 text-xs ${theme.badgeActive} px-2 py-1 rounded-full`}
								>
									{tag}
									<button
										onClick={() => setSelectedTags(prev => prev.filter(t => t !== tag))}
										className="hover:bg-opacity-80 rounded-full p-0.5"
									>
										<svg className="w-3 h-3" fill="none" stroke="currentColor" viewBox="0 0 24 24">
											<path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M6 18L18 6M6 6l12 12" />
										</svg>
									</button>
								</span>
							))}
						</div>
					</div>
				)}
			</div>

			{/* Models Grid */}
			<div className="bg-gray-800/50 rounded-lg border border-gray-700">
				<div className="p-4 border-b border-gray-700">
					<h3 className="text-lg font-semibold">
						Available Models ({filteredModels.length})
					</h3>
				</div>
				
				<div className="p-6">
					{filteredModels.length > 0 ? (
						<div className="grid grid-cols-1 lg:grid-cols-2 xl:grid-cols-3 gap-4 max-h-96 overflow-y-auto pr-2">
							{filteredModels.map((model: Model) => (
								<div
									key={model.id}
									onClick={() => onModelSelect(model.id)}
									className={`p-4 rounded-lg border cursor-pointer transition-all hover:scale-[1.02] ${
										selectedModel === model.id
											? `${theme.selectedBorder} shadow-lg`
											: "border-gray-600 hover:border-gray-500 bg-gray-700/30"
									}`}
								>
									<div className="flex items-start justify-between mb-3">
										<div className="flex items-center space-x-2">
											<h4 className="font-semibold text-white text-sm">{model.name}</h4>
											{model.isOurs && (
												<span className={`text-xs ${theme.selectedBadge} text-white px-2 py-0.5 rounded-full font-medium`}>
													Okailora
												</span>
											)}
										</div>
										{selectedModel === model.id && (
											<div className={theme.selectedIcon}>
												<svg className="w-5 h-5" fill="currentColor" viewBox="0 0 20 20">
													<path fillRule="evenodd" d="M10 18a8 8 0 100-16 8 8 0 000 16zm3.707-9.293a1 1 0 00-1.414-1.414L9 10.586 7.707 9.293a1 1 0 00-1.414 1.414l2 2a1 1 0 001.414 0l4-4z" clipRule="evenodd" />
												</svg>
											</div>
										)}
									</div>
									<p className="text-xs text-gray-400 mb-3 leading-relaxed h-8 overflow-hidden">{model.description}</p>
									<div className="flex flex-wrap gap-1 mb-2">
										{model.tags.slice(0, 3).map((tag: string) => (
											<span
												key={tag}
												className={`text-xs px-2 py-0.5 rounded ${
													model.isOurs 
														? theme.tagOurs
														: "bg-gray-600 text-gray-300"
												}`}
											>
												{tag}
											</span>
										))}
										{model.tags.length > 3 && (
											<span className="text-xs text-gray-500">
												+{model.tags.length - 3}
											</span>
										)}
									</div>
									<div className="flex justify-between items-center text-xs text-gray-500">
										<span>{model.downloads} downloads</span>
										<span>{model.license}</span>
									</div>
								</div>
							))}
						</div>
					) : (
						<div className="text-center py-12 text-gray-400">
							<div className="text-4xl mb-4">🔍</div>
							<p className="mb-4">No models found matching your criteria</p>
							<button 
								onClick={clearAllFilters}
								className={`${theme.clearButton} text-sm`}
							>
								Clear all filters
							</button>
						</div>
					)}
				</div>
			</div>
		</div>
	);
}
