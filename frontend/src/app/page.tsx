"use client";

import Image from "next/image";
import { useChatContext } from "@/components/ChatWidget";
import { useState, useEffect, useRef } from "react";
import { useRouter } from "next/navigation";
import { handleFineTuneClick, handleTrainClick, handleInferenceClick, handleShareClick } from "@/utils/navigation";

// Mock data - replace with real data later
const recentProjects = [
  {
    id: "1",
    name: "Radiology Report Classifier",
    status: "completed",
    type: "training",
    progress: 100,
    startTime: "2 hours ago",
    duration: "45 min",
    privacy: "PHI Compliant",
    dataSource: "De-identified X-rays",
    accuracy: "94.2%",
    trainedDate: "Dec 15, 2024",
    modelType: "Medical Imaging",
    compliance: "FDA Pre-submission",
  },
  {
    id: "2",
    name: "Drug Interaction Predictor",
    status: "running",
    type: "training",
    progress: 65,
    startTime: "30 min ago",
    duration: "~20 min remaining",
    privacy: "HIPAA Secure",
    dataSource: "Anonymized EHR Data",
    accuracy: "91.8%",
    trainedDate: "Dec 10, 2024",
    modelType: "Clinical Decision Support",
    compliance: "HIPAA Validated",
  },
  {
    id: "3",
    name: "Symptom Checker Assistant",
    status: "completed",
    type: "inference",
    progress: 100,
    startTime: "1 day ago",
    duration: "2 sec",
    privacy: "Local Processing",
    dataSource: "Clinical Notes",
    accuracy: "88.5%",
    trainedDate: "Dec 5, 2024",
    modelType: "NLP - Clinical",
    compliance: "IRB Approved",
  },
  {
    id: "4",
    name: "Chest X-Ray Pneumonia Detector",
    status: "completed",
    type: "model",
    progress: 100,
    startTime: "3 days ago",
    duration: "2 hours",
    privacy: "PHI Compliant",
    dataSource: "Medical Images",
    accuracy: "96.1%",
    trainedDate: "Dec 12, 2024",
    modelType: "Medical Imaging",
    compliance: "FDA Ready",
  },
  {
    id: "5",
    name: "Clinical Note Summarizer",
    status: "fine-tuning",
    type: "fine-tune",
    progress: 40,
    startTime: "1 hour ago",
    duration: "~45 min remaining",
    privacy: "De-identified",
    dataSource: "Patient Records",
    accuracy: "89.3%",
    trainedDate: "Dec 8, 2024",
    modelType: "NLP - Clinical",
    compliance: "HIPAA Validated",
  },
];

export default function Home() {
  const { isChatOpen } = useChatContext();
  const router = useRouter();
  const [showNotifications, setShowNotifications] = useState(false);
  const [showProfileMenu, setShowProfileMenu] = useState(false);
  const notificationsRef = useRef<HTMLDivElement>(null);
  const profileRef = useRef<HTMLDivElement>(null);

  // Close dropdowns when clicking outside
  useEffect(() => {
    function handleClickOutside(event: MouseEvent) {
      if (notificationsRef.current && !notificationsRef.current.contains(event.target as Node)) {
        setShowNotifications(false);
      }
      if (profileRef.current && !profileRef.current.contains(event.target as Node)) {
        setShowProfileMenu(false);
      }
    }

    document.addEventListener('mousedown', handleClickOutside);
    return () => {
      document.removeEventListener('mousedown', handleClickOutside);
    };
  }, []);
  
  return (
    <div className="min-h-screen bg-gray-950 text-white">
      {/* Top Navigation Bar */}
      <nav className="border-b border-gray-800 bg-gray-900/50 backdrop-blur-sm">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
          <div className="flex justify-between items-center h-16">
            {/* Logo */}
            <div className="flex items-center">
              <div className="text-xl font-bold text-blue-400">Okailora</div>
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
              <div className="relative" ref={notificationsRef}>
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
                  <div className="fixed right-4 top-16 w-80 bg-gray-800 border border-gray-700 rounded-lg shadow-xl z-[9999]">
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
              <div className="relative" ref={profileRef}>
                <button 
                  className="h-8 w-8 rounded-full bg-gradient-to-r from-blue-500 to-purple-600 hover:from-blue-600 hover:to-purple-700 transition-all duration-200 hover:scale-105"
                  onClick={() => setShowProfileMenu(!showProfileMenu)}
                  title="Profile Menu"
                >
                </button>

                {/* Profile Dropdown */}
                {showProfileMenu && (
                  <div className="fixed right-4 top-16 w-64 bg-gray-800 border border-gray-700 rounded-lg shadow-xl z-[9999]">
                    <div className="p-4 border-b border-gray-700">
                      <div className="flex items-center space-x-3">
                        <div className="h-10 w-10 rounded-full bg-gradient-to-r from-blue-500 to-purple-600"></div>
                        <div>
                          <p className="text-white font-medium">Dr. Sarah Chen</p>
                          <p className="text-gray-400 text-sm">Radiologist</p>
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
        {/* Sidebar - Updated for AI workflow */}
        <aside className="w-64 bg-gray-900 border-r border-gray-800 min-h-screen">
          <div className="p-6">
            <nav className="space-y-2">
              {[
                { name: "Dashboard", icon: "🏠", active: true },
                { name: "Train", icon: "🚀", active: false },
                { name: "Fine-tune", icon: "⚡", active: false },
                { name: "Inference", icon: "🎯", active: false },
                { name: "Share & Export", icon: "📤", active: false },
                { name: "Datasets", icon: "📊", active: false },
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
          {/* Hero Section */}
          <div className="mb-8">
            <h1 className="text-4xl font-bold mb-4 bg-gradient-to-r from-blue-400 to-purple-500 bg-clip-text text-transparent">
              Healthcare AI Made Simple
            </h1>
            <p className="text-xl text-gray-300 mb-8">
              Train, fine-tune, and deploy medical AI models with your sensitive data - securely and without technical expertise
            </p>
            
            {/* Core AI Workflow Actions */}
            <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-4">
              {[
                { title: "Train Model", desc: "Start training from scratch with your data", icon: "🚀", colorClass: "bg-blue-500", handler: () => handleTrainClick(router) },
                { title: "Fine-tune", desc: "Improve existing models with new data", icon: "⚡", colorClass: "bg-purple-500", handler: () => handleFineTuneClick(router) },
                { title: "Run Inference", desc: "Test and deploy your trained models", icon: "🎯", colorClass: "bg-green-500", handler: () => handleInferenceClick(router) },
                { title: "Share & Export", desc: "Collaborate and export your models", icon: "📤", colorClass: "bg-orange-500", handler: () => handleShareClick(router) },
              ].map((action) => (
                <button
                  key={action.title}
                  onClick={action.handler}
                  className={`p-4 lg:p-6 rounded-xl border border-gray-700 bg-gray-800/50 hover:bg-gray-800 transition-all group relative overflow-hidden`}
                >
                  <div className="text-2xl lg:text-3xl mb-2 lg:mb-3">{action.icon}</div>
                  <h3 className="font-semibold text-white mb-1 lg:mb-2 text-sm lg:text-base">{action.title}</h3>
                  <p className="text-gray-400 text-xs lg:text-sm">{action.desc}</p>
                  <div className={`absolute top-0 right-0 w-1 h-full ${action.colorClass} opacity-0 group-hover:opacity-100 transition-opacity`}></div>
                </button>
              ))}
            </div>
          </div>

          {/* Combined Projects & Models Section */}
          <div className="mb-12">
            <div className="flex items-center justify-between mb-6">
              <h2 className="text-2xl font-bold">Your Projects & Models</h2>
              <div className="flex items-center space-x-4">
                <span className="text-sm text-gray-400">All data processed securely</span>
                <button className="bg-blue-600 hover:bg-blue-700 text-white px-4 py-2 rounded-lg transition-colors text-sm">
                  View Audit Trail
                </button>
              </div>
            </div>
            <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
              {recentProjects.map((project) => (
                <div key={project.id} className="bg-gray-800/50 rounded-lg p-6 border border-gray-700 hover:border-gray-600 transition-colors">
                  <div className="flex items-start justify-between mb-4">
                    <div className="flex-1">
                      <h3 className="font-semibold text-white mb-2">{project.name}</h3>
                      <div className="flex items-center space-x-4 mb-3">
                        <span className="text-sm text-gray-400 capitalize">{project.type} • {project.startTime}</span>
                        <span className={`px-3 py-1 rounded-full text-xs font-medium ${
                          project.status === 'completed' ? 'bg-green-900 text-green-300' :
                          project.status === 'running' || project.status === 'fine-tuning' ? 'bg-blue-900 text-blue-300' :
                          'bg-red-900 text-red-300'
                        }`}>
                          {project.status}
                        </span>
                      </div>
                      <div className="flex items-center space-x-4 mb-3">
                        <span className="text-xs bg-green-900/50 text-green-300 px-2 py-1 rounded">
                          {project.privacy}
                        </span>
                        <span className="text-xs bg-blue-900/50 text-blue-300 px-2 py-1 rounded">
                          {project.compliance}
                        </span>
                      </div>
                      <div className="space-y-1 text-sm">
                        <div className="flex justify-between">
                          <span className="text-gray-400">Type:</span>
                          <span className="text-gray-300">{project.modelType}</span>
                        </div>
                        {project.accuracy && (
                          <div className="flex justify-between">
                            <span className="text-gray-400">Accuracy:</span>
                            <span className="text-green-400 font-medium">{project.accuracy}</span>
                          </div>
                        )}
                        <div className="flex justify-between">
                          <span className="text-gray-400">Data:</span>
                          <span className="text-gray-300">{project.dataSource}</span>
                        </div>
                      </div>
                    </div>
                    <button className="text-gray-400 hover:text-white ml-4">
                      <svg className="w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                        <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 5v.01M12 12v.01M12 19v.01M12 6a1 1 0 110-2 1 1 0 010 2zm0 7a1 1 0 110-2 1 1 0 010 2zm0 7a1 1 0 110-2 1 1 0 010 2z" />
                      </svg>
                    </button>
                  </div>
                  
                  {/* Progress bar for active projects */}
                  {(project.status === 'running' || project.status === 'fine-tuning') && (
                    <div className="mb-4">
                      <div className="flex justify-between text-sm mb-1">
                        <span className="text-gray-400">Progress</span>
                        <span className="text-blue-400">{project.progress}%</span>
                      </div>
                      <div className="w-full bg-gray-700 rounded-full h-2">
                        <div 
                          className="bg-blue-500 h-2 rounded-full transition-all duration-300"
                          style={{ width: `${project.progress}%` }}
                        ></div>
                      </div>
                      <div className="text-xs text-gray-500 mt-1">{project.duration}</div>
                    </div>
                  )}

                  {/* Action buttons */}
                  <div className="flex space-x-2">
                    {project.status === 'completed' ? (
                      <>
                        <button className="flex-1 bg-blue-600 hover:bg-blue-700 text-white py-2 px-3 rounded text-sm transition-colors">
                          Run Inference
                        </button>
                        <button className="px-3 py-2 border border-gray-600 text-gray-300 hover:bg-gray-700 rounded text-sm transition-colors">
                          Fine-tune
                        </button>
                        <button className="px-3 py-2 border border-gray-600 text-gray-300 hover:bg-gray-700 rounded text-sm transition-colors">
                          Export
                        </button>
                      </>
                    ) : (
                      <>
                        <button className="flex-1 bg-gray-700 text-gray-400 py-2 px-3 rounded text-sm cursor-not-allowed">
                          Training in Progress...
                        </button>
                        <button className="px-3 py-2 border border-red-600 text-red-400 hover:bg-red-900/20 rounded text-sm transition-colors">
                          Stop
                        </button>
                      </>
                    )}
                  </div>
                </div>
              ))}
            </div>
          </div>

          {/* Healthcare-Specific Getting Started Guide */}
          <div className="bg-gradient-to-r from-blue-900/20 to-purple-900/20 rounded-xl p-8 border border-blue-800/30 mb-8">
            <h2 className="text-2xl font-bold mb-4">Getting Started with Healthcare AI</h2>
            <p className="text-gray-300 mb-6">New to medical AI? Follow these HIPAA-compliant steps designed for healthcare professionals.</p>
            <div className="grid grid-cols-1 md:grid-cols-4 gap-6">
              {[
                { step: "1", title: "Upload Data", desc: "Securely upload your de-identified medical data" },
                { step: "2", title: "Choose Workflow", desc: "Select train, fine-tune, or inference based on your needs" },
                { step: "3", title: "Monitor Progress", desc: "Track training and view real-time metrics" },
                { step: "4", title: "Deploy & Share", desc: "Export models or share with your team securely" },
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
              <button className="bg-blue-600 hover:bg-blue-700 text-white px-6 py-3 rounded-lg font-medium transition-colors mr-4">
                Start Your First Model
              </button>
              <button className="border border-gray-600 text-gray-300 hover:bg-gray-700 px-6 py-3 rounded-lg font-medium transition-colors">
                View Healthcare Documentation
              </button>
            </div>
          </div>
        </main>
      </div>
    </div>
  );
}
