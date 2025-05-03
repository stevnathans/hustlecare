'use client';

import { useState } from 'react';
import { generateRequirements } from '@/services/openaiService';

export const InputForm = ({ onResult }: { onResult: (data: any) => void }) => {
  const [idea, setIdea] = useState('');
  const [loading, setLoading] = useState(false);

  const handleGenerate = async () => {
    setLoading(true);
    try {
      const result = await generateRequirements(idea);
      onResult(result);
    } catch (error) {
      console.error(error);
    } finally {
      setLoading(false);
    }
  };

  return (
    <div className="flex flex-col gap-4 p-4">
      <input
        type="text"
        className="p-3 border rounded-xl w-full"
        placeholder="Enter your business idea..."
        value={idea}
        onChange={(e) => setIdea(e.target.value)}
      />
      <button
        onClick={handleGenerate}
        disabled={loading}
        className="bg-blue-600 text-white p-3 rounded-xl hover:bg-blue-700"
      >
        {loading ? 'Generating...' : 'Generate Requirements'}
      </button>
    </div>
  );
};
