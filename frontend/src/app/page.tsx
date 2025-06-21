"use client";

import Image from "next/image";
import { useChatContext } from "@/components/ChatWidget";
import { useState } from "react";

// Mock data - replace with real data later
const recentRuns = [
  {
    id: "1",
    name: "Text Classification Model",
    status: "completed",
    type: "training",
    progress: 100,
    startTime: "2 hours ago",
    duration: "45 min",
  },
  {
    id: "2",
    name: "Sentiment Analysis Fine-tune",
    status: "running",
    type: "training",
    progress: 65,
    startTime: "30 min ago",
    duration: "~20 min remaining",
  },
  {
    id: "3",
    name: "Customer Support Bot",
    status: "completed",
    type: "inference",
    progress: 100,
    startTime: "1 day ago",
    duration: "2 sec",
  },
];

const userModels = [
  {
    id: "1",
    name: "Customer Support Classifier",
    description: "Fine-tuned BERT model for customer inquiry classification",
    accuracy: "94.2%",
    trainedDate: "Dec 15, 2024",
    type: "Text Classification",
  },
  {
    id: "2",
    name: "Review Sentiment Analyzer",
    description: "RoBERTa model for product review sentiment analysis",
    accuracy: "91.8%",
    trainedDate: "Dec 10, 2024",
    type: "Sentiment Analysis",
  },
  {
    id: "3",
    name: "Document Summarizer",
    description: "T5 model fine-tuned for technical document summarization",
    accuracy: "88.5%",
    trainedDate: "Dec 5, 2024",
    type: "Summarization",
  },
];

export default function Home() {
  const { isChatOpen } = useChatContext();
  const [showNotifications, setShowNotifications] = useState(false);
  const [showProfileMenu, setShowProfileMenu] = useState(false);
  
  return (
    <div className="min-h-screen bg-gray-950 text-white">
      {/* Top Navigation Bar */}
      <nav className="border-b border-gray-800 bg-gray-900/50 backdrop-blur-sm">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
          <div className="flex justify-between items-center h-16">
            {/* Logo */}
            <div className="flex items-center">
              <div className="text-xl font-bold text-blue-400">OkaiLora</div>
            </div>
            
            {/* Search Bar */}
            <div className="flex-1 max-w-lg mx-8">
              <div className="relative">
                <input
                  type="text"
                  placeholder="Search models, datasets, runs..."
                  className="w-full bg-gray-800 border border-gray-700 rounded-lg px-4 py-2 pl-10 focus:outline-none focus:ring-2 focus:ring-blue-500 focus:border-transparent"
                />
                <div className="absolute inset-y-0 left-0 pl-3 flex items-center">
                  <svg className="h-5 w-5 text-gray-400" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M21 21l-6-6m2-5a7 7 0 11-14 0 7 7 0 0114 0z" />
                  </svg>
                </div>
              </div>
            </div>

            {/* User Menu */}
            <div className="flex items-center space-x-4">
              {/* Notifications */}
              <div className="relative">
                <button 
                  className="relative p-2 text-gray-400 hover:text-white transition-colors hover:bg-gray-800 rounded-lg"
                  onClick={() => setShowNotifications(!showNotifications)}
                  title="Notifications"
                >
                  <svg className="h-6 w-6" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M15 17h5l-5 5v-5zM10.5 17H3a1 1 0 01-1-1V4a1 1 0 011-1h7.5M17 7v10" />
                  </svg>
                  <span className="absolute top-0 right-0 block h-2 w-2 rounded-full bg-red-400"></span>
                </button>
                
                {/* Notifications Dropdown */}
                {showNotifications && (
                  <div className="absolute right-0 top-full mt-2 w-80 bg-gray-800 border border-gray-700 rounded-lg shadow-xl z-50">
                    <div className="p-4 border-b border-gray-700">
                      <div className="flex items-center justify-between">
                        <h3 className="text-white font-semibold">Notifications</h3>
                        <button className="text-sm text-blue-400 hover:text-blue-300">Mark all as read</button>
                      </div>
                    </div>
                    <div className="max-h-80 overflow-y-auto">
                      {[
                        { id: 1, title: "Training Complete", message: "Your sentiment analysis model has finished training", time: "2 min ago", type: "success" },
                        { id: 2, title: "Dataset Uploaded", message: "Customer reviews dataset has been processed", time: "1 hour ago", type: "info" },
                        { id: 3, title: "Training Started", message: "Text classification model training has begun", time: "3 hours ago", type: "info" },
                        { id: 4, title: "Inference Job Failed", message: "Model inference encountered an error", time: "1 day ago", type: "error" },
                      ].map((notification) => (
                        <div key={notification.id} className="p-4 border-b border-gray-700 hover:bg-gray-750 cursor-pointer">
                          <div className="flex items-start space-x-3">
                            <div className={`w-2 h-2 rounded-full mt-2 ${
                              notification.type === 'success' ? 'bg-green-400' :
                              notification.type === 'error' ? 'bg-red-400' : 'bg-blue-400'
                            }`}></div>
                            <div className="flex-1">
                              <p className="text-white font-medium">{notification.title}</p>
                              <p className="text-gray-400 text-sm mt-1">{notification.message}</p>
                              <p className="text-gray-500 text-xs mt-2">{notification.time}</p>
                            </div>
                          </div>
                        </div>
                      ))}
                    </div>
                    <div className="p-3 border-t border-gray-700">
                      <button className="w-full text-center text-blue-400 hover:text-blue-300 text-sm">
                        View all notifications
                      </button>
                    </div>
                  </div>
                )}
              </div>

              {/* Profile Menu */}
              <div className="relative">
                <button 
                  className="h-8 w-8 rounded-full bg-gradient-to-r from-blue-500 to-purple-600 hover:from-blue-600 hover:to-purple-700 transition-all duration-200 hover:scale-105"
                  onClick={() => setShowProfileMenu(!showProfileMenu)}
                  title="Profile Menu"
                >
                </button>

                {/* Profile Dropdown */}
                {showProfileMenu && (
                  <div className="absolute right-0 top-full mt-2 w-64 bg-gray-800 border border-gray-700 rounded-lg shadow-xl z-50">
                    <div className="p-4 border-b border-gray-700">
                      <div className="flex items-center space-x-3">
                        <div className="h-10 w-10 rounded-full bg-gradient-to-r from-blue-500 to-purple-600"></div>
                        <div>
                          <p className="text-white font-medium">John Doe</p>
                          <p className="text-gray-400 text-sm">john.doe@example.com</p>
                        </div>
                      </div>
                    </div>
                    <div className="py-2">
                      {[
                        { icon: "👤", label: "Profile Settings", href: "#" },
                        { icon: "🏢", label: "Account", href: "#" },
                        { icon: "⚙️", label: "Preferences", href: "#" },
                        { icon: "🔑", label: "API Keys", href: "#" },
                        { icon: "📊", label: "Usage & Billing", href: "#" },
                        { icon: "❓", label: "Help & Support", href: "#" },
                      ].map((item, index) => (
                        <a
                          key={index}
                          href={item.href}
                          className="flex items-center space-x-3 px-4 py-2 text-gray-300 hover:bg-gray-700 hover:text-white transition-colors"
                        >
                          <span className="text-lg">{item.icon}</span>
                          <span>{item.label}</span>
                        </a>
                      ))}
                    </div>
                    <div className="border-t border-gray-700 py-2">
                      <button className="flex items-center space-x-3 px-4 py-2 text-red-400 hover:bg-gray-700 hover:text-red-300 transition-colors w-full text-left">
                        <span className="text-lg">🚪</span>
                        <span>Sign Out</span>
                      </button>
                    </div>
                  </div>
                )}
              </div>
            </div>
          </div>
        </div>
      </nav>

      <div className="flex">
        {/* Sidebar */}
        <aside className="w-64 bg-gray-900 border-r border-gray-800 min-h-screen">
          <div className="p-6">
            <nav className="space-y-2">
              {[
                { name: "Dashboard", icon: "🏠", active: true },
                { name: "Models", icon: "🤖", active: false },
                { name: "Datasets", icon: "📊", active: false },
                { name: "Training Jobs", icon: "⚡", active: false },
                { name: "Inference", icon: "🎯", active: false },
                { name: "Documentation", icon: "📚", active: false },
                { name: "Settings", icon: "⚙️", active: false },
              ].map((item) => (
                <a
                  key={item.name}
                  href="#"
                  className={`flex items-center space-x-3 px-3 py-2 rounded-lg transition-colors ${
                    item.active
                      ? "bg-blue-600 text-white"
                      : "text-gray-300 hover:bg-gray-800 hover:text-white"
                  }`}
                >
                  <span className="text-lg">{item.icon}</span>
                  <span>{item.name}</span>
                </a>
              ))}
            </nav>
          </div>
        </aside>

        {/* Main Content - Adjusts width based on chat state */}
        <main className={`flex-1 p-8 transition-all duration-300 ${isChatOpen ? 'mr-0' : ''}`}>
          {/* ...existing code... */}
          {/* Hero Section with Quick Actions */}
          <div className="mb-12">
            <h1 className="text-4xl font-bold mb-4 bg-gradient-to-r from-blue-400 to-purple-500 bg-clip-text text-transparent">
              Welcome to OkaiLora
            </h1>
            <p className="text-xl text-gray-300 mb-8">
              Train, fine-tune, and deploy AI models without specialized knowledge
            </p>
            
            <div className="grid grid-cols-1 md:grid-cols-4 gap-4">
              {[
                { title: "Start Training", desc: "Create a new model", icon: "🚀", color: "blue" },
                { title: "Upload Dataset", desc: "Add your data", icon: "📤", color: "green" },
                { title: "Run Inference", desc: "Test your models", icon: "🎯", color: "purple" },
                { title: "Browse Models", desc: "Explore your library", icon: "🔍", color: "orange" },
              ].map((action) => (
                <button
                  key={action.title}
                  className={`p-6 rounded-xl border border-gray-700 bg-gray-800/50 hover:bg-gray-800 transition-all group`}
                >
                  <div className="text-3xl mb-3">{action.icon}</div>
                  <h3 className="font-semibold text-white mb-2">{action.title}</h3>
                  <p className="text-gray-400 text-sm">{action.desc}</p>
                </button>
              ))}
            </div>
          </div>

          {/* Recent Activity */}
          <div className="mb-12">
            <h2 className="text-2xl font-bold mb-6">Recent Activity</h2>
            <div className="space-y-4">
              {recentRuns.map((run) => (
                <div key={run.id} className="bg-gray-800/50 rounded-lg p-6 border border-gray-700">
                  <div className="flex items-center justify-between mb-4">
                    <div>
                      <h3 className="font-semibold text-white">{run.name}</h3>
                      <p className="text-gray-400 text-sm capitalize">{run.type} • Started {run.startTime}</p>
                    </div>
                    <div className="flex items-center space-x-4">
                      <span className={`px-3 py-1 rounded-full text-xs font-medium ${
                        run.status === 'completed' ? 'bg-green-900 text-green-300' :
                        run.status === 'running' ? 'bg-blue-900 text-blue-300' :
                        'bg-red-900 text-red-300'
                      }`}>
                        {run.status}
                      </span>
                      <span className="text-gray-400 text-sm">{run.duration}</span>
                    </div>
                  </div>
                  {run.status === 'running' && (
                    <div className="w-full bg-gray-700 rounded-full h-2">
                      <div 
                        className="bg-blue-500 h-2 rounded-full transition-all duration-300"
                        style={{ width: `${run.progress}%` }}
                      ></div>
                    </div>
                  )}
                </div>
              ))}
            </div>
          </div>

          {/* Model Library */}
          <div className="mb-12">
            <div className="flex items-center justify-between mb-6">
              <h2 className="text-2xl font-bold">Your Models</h2>
              <button className="bg-blue-600 hover:bg-blue-700 text-white px-4 py-2 rounded-lg transition-colors">
                View All Models
              </button>
            </div>
            <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
              {userModels.map((model) => (
                <div key={model.id} className="bg-gray-800/50 rounded-lg p-6 border border-gray-700 hover:border-gray-600 transition-colors">
                  <div className="flex items-start justify-between mb-4">
                    <div>
                      <h3 className="font-semibold text-white mb-2">{model.name}</h3>
                      <p className="text-gray-400 text-sm mb-3">{model.description}</p>
                      <span className="inline-block bg-gray-700 text-gray-300 px-2 py-1 rounded text-xs">
                        {model.type}
                      </span>
                    </div>
                  </div>
                  <div className="space-y-2 mb-4">
                    <div className="flex justify-between text-sm">
                      <span className="text-gray-400">Accuracy:</span>
                      <span className="text-green-400 font-medium">{model.accuracy}</span>
                    </div>
                    <div className="flex justify-between text-sm">
                      <span className="text-gray-400">Trained:</span>
                      <span className="text-gray-300">{model.trainedDate}</span>
                    </div>
                  </div>
                  <div className="flex space-x-2">
                    <button className="flex-1 bg-blue-600 hover:bg-blue-700 text-white py-2 px-3 rounded text-sm transition-colors">
                      Run Inference
                    </button>
                    <button className="px-3 py-2 border border-gray-600 text-gray-300 hover:bg-gray-700 rounded text-sm transition-colors">
                      ⋯
                    </button>
                  </div>
                </div>
              ))}
            </div>
          </div>

          {/* Getting Started Guide */}
          <div className="bg-gradient-to-r from-blue-900/20 to-purple-900/20 rounded-xl p-8 border border-blue-800/30">
            <h2 className="text-2xl font-bold mb-4">Getting Started</h2>
            <p className="text-gray-300 mb-6">New to AI model training? Follow these simple steps to get started.</p>
            <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
              {[
                { step: "1", title: "Upload Your Data", desc: "Start by uploading your dataset in CSV, JSON, or text format" },
                { step: "2", title: "Choose a Model", desc: "Select from pre-trained models or start with a base model" },
                { step: "3", title: "Start Training", desc: "Configure your training parameters and let the magic happen" },
              ].map((guide) => (
                <div key={guide.step} className="text-center">
                  <div className="w-12 h-12 bg-blue-600 rounded-full flex items-center justify-center text-white font-bold text-lg mx-auto mb-4">
                    {guide.step}
                  </div>
                  <h3 className="font-semibold text-white mb-2">{guide.title}</h3>
                  <p className="text-gray-400 text-sm">{guide.desc}</p>
                </div>
              ))}
            </div>
            <div className="mt-8 text-center">
              <button className="bg-blue-600 hover:bg-blue-700 text-white px-6 py-3 rounded-lg font-medium transition-colors">
                Start Your First Model
              </button>
            </div>
          </div>
        </main>
      </div>
    </div>
  );
}
