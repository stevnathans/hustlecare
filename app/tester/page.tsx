"use client";

import { useState } from 'react';
import axios from 'axios';

export default function Home() {
  const [businessIdea, setBusinessIdea] = useState('');
  const [location, setLocation] = useState('');
  const [requirements, setRequirements] = useState('');
  const [loading, setLoading] = useState(false);

  const handleGenerate = async () => {
    if (!businessIdea || !location) {
      alert('Please enter both a business idea and location.');
      return;
    }

    setLoading(true);

    try {
      const response = await axios.post('/api/generate', {
        businessIdea,
        location,
      });
      setRequirements(response.data.result);
    } catch (error) {
      console.error('Error generating requirements:', error);
      alert('An error occurred. Check console for details.');
    } finally {
      setLoading(false);
    }
  };

  return (
    <main className="p-6 max-w-3xl mx-auto">
      <h1 className="text-3xl font-bold mb-6">Business Requirements Generator</h1>
      
      <input
        type="text"
        value={businessIdea}
        onChange={(e) => setBusinessIdea(e.target.value)}
        placeholder="Enter business idea (e.g., coffee shop)"
        className="border p-2 rounded w-full mb-4"
      />

      <input
        type="text"
        value={location}
        onChange={(e) => setLocation(e.target.value)}
        placeholder="Enter location (e.g., Nairobi, Kenya)"
        className="border p-2 rounded w-full mb-4"
      />

      <button
        onClick={handleGenerate}
        disabled={loading}
        className="bg-blue-600 text-white px-4 py-2 rounded disabled:bg-gray-400"
      >
        {loading ? 'Generating...' : 'Generate Requirements'}
      </button>

      {requirements && (
        <div className="mt-6 p-4 bg-gray-100 rounded">
          <h2 className="text-2xl font-semibold mb-2">Requirements:</h2>
          <pre className="whitespace-pre-wrap">{requirements}</pre>
        </div>
      )}
    </main>
  );
}
