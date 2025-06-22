"use client";

import { useParams } from 'next/navigation';

export default function InferenceResultsPage() {
  const params = useParams();
  const sessionId = params.sessionId as string;

  return (
    <div className="min-h-screen bg-gray-950 text-white p-8">
      <div className="max-w-7xl mx-auto">
        <div className="flex justify-between items-center mb-8">
          <div>
            <h1 className="text-3xl font-bold">Inference Results</h1>
            <p className="text-gray-400">Session ID: {sessionId}</p>
          </div>
          <div className="flex space-x-4">
            <button className="bg-blue-600 hover:bg-blue-700 text-white px-4 py-2 rounded-lg transition-colors">
              Share Results
            </button>
            <button className="bg-green-600 hover:bg-green-700 text-white px-4 py-2 rounded-lg transition-colors">
              Download Results
            </button>
          </div>
        </div>

        <div className="bg-gray-800/50 rounded-lg p-6 border border-gray-700">
          <h2 className="text-2xl font-bold mb-4">Visualizations</h2>
          <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
            <div className="bg-gray-700/50 p-4 rounded-lg">
              <p className="text-center text-gray-400">Chart / Graph Placeholder 1</p>
            </div>
            <div className="bg-gray-700/50 p-4 rounded-lg">
              <p className="text-center text-gray-400">Chart / Graph Placeholder 2</p>
            </div>
          </div>
        </div>

        <div className="mt-8 bg-gray-800/50 rounded-lg p-6 border border-gray-700">
          <h2 className="text-2xl font-bold mb-4">Raw Data</h2>
          <div className="overflow-x-auto">
            <table className="min-w-full text-left">
              <thead className="border-b border-gray-600">
                <tr>
                  <th className="p-2">ID</th>
                  <th className="p-2">Input</th>
                  <th className="p-2">Prediction</th>
                  <th className="p-2">Confidence</th>
                </tr>
              </thead>
              <tbody>
                <tr className="border-b border-gray-700">
                  <td className="p-2">1</td>
                  <td className="p-2">Sample input data...</td>
                  <td className="p-2">Predicted class A</td>
                  <td className="p-2">0.95</td>
                </tr>
                <tr className="border-b border-gray-700">
                  <td className="p-2">2</td>
                  <td className="p-2">Another sample...</td>
                  <td className="p-2">Predicted class B</td>
                  <td className="p-2">0.89</td>
                </tr>
              </tbody>
            </table>
          </div>
        </div>
      </div>
    </div>
  );
}
