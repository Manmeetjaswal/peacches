import React, { useState } from 'react';

const PromptPage: React.FC = () => {
  const [prompt, setPrompt] = useState('');
  const [dryRun, setDryRun] = useState(false);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [result, setResult] = useState<{
    script: string;
    image_url: string;
    video_url: string;
    job_id: string;
  } | null>(null);

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setError(null);
    setResult(null);
    if (!prompt.trim()) {
      setError('Please enter a prompt.');
      return;
    }
    setLoading(true);
    try {
      const response = await fetch('/api/prompt-to-video', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ prompt, dry_run: dryRun }),
      });
      if (!response.ok) {
        const err = await response.json().catch(() => ({}));
        throw new Error(err.detail || 'Failed to generate video.');
      }
      const data = await response.json();
      setResult(data);
    } catch (err: any) {
      setError(err.message || 'An error occurred.');
    } finally {
      setLoading(false);
    }
  };

  return (
    <div className="max-w-xl mx-auto p-6 bg-white rounded shadow mt-8">
      <h1 className="text-2xl font-bold mb-4">Prompt to Video</h1>
      <form onSubmit={handleSubmit} className="space-y-4">
        <div>
          <label className="block font-medium mb-1">Prompt</label>
          <textarea
            value={prompt}
            onChange={e => setPrompt(e.target.value)}
            className="block w-full border border-gray-300 rounded px-3 py-2"
            rows={3}
            placeholder="e.g. Confident investor pitching a product"
            required
          />
        </div>
        <div className="flex items-center">
          <input
            type="checkbox"
            checked={dryRun}
            onChange={e => setDryRun(e.target.checked)}
            id="dryRun"
            className="mr-2"
          />
          <label htmlFor="dryRun" className="font-medium">Dry Run (mock only)</label>
        </div>
        <button
          type="submit"
          className="w-full bg-blue-600 text-white font-semibold py-2 rounded hover:bg-blue-700 transition"
          disabled={loading}
        >
          {loading ? (
            <span className="flex items-center justify-center">
              <svg className="animate-spin h-5 w-5 mr-2 text-white" xmlns="http://www.w3.org/2000/svg" fill="none" viewBox="0 0 24 24">
                <circle className="opacity-25" cx="12" cy="12" r="10" stroke="currentColor" strokeWidth="4"></circle>
                <path className="opacity-75" fill="currentColor" d="M4 12a8 8 0 018-8v8z"></path>
              </svg>
              Generating...
            </span>
          ) : 'Generate Video'}
        </button>
        {error && <div className="text-red-600 font-medium mt-2">{error}</div>}
      </form>
      {result && (
        <div className="mt-6 space-y-4">
          <div>
            <div className="font-medium mb-1">Generated Script:</div>
            <div className="bg-gray-100 rounded p-3 whitespace-pre-line">{result.script}</div>
          </div>
          <div>
            <div className="font-medium mb-1">Avatar Image:</div>
            <img src={result.image_url} alt="Avatar" className="w-48 h-48 object-cover rounded shadow" />
          </div>
          <div>
            <div className="font-medium mb-1">Result Video:</div>
            {result.video_url.match(/\.mp4($|\?)/i) ? (
              <video src={result.video_url} controls className="w-full rounded shadow" />
            ) : (
              <a href={result.video_url} target="_blank" rel="noopener noreferrer" className="text-blue-600 underline">{result.video_url}</a>
            )}
            <div className="text-xs text-gray-500 mt-2">Job ID: {result.job_id}</div>
          </div>
        </div>
      )}
    </div>
  );
};

export default PromptPage; 