// Install @supabase/supabase-js: npm install @supabase/supabase-js
// Ensure .env has VITE_SUPABASE_URL and VITE_SUPABASE_KEY
import React, { useEffect, useState } from 'react';
import { createClient, SupabaseClient } from '@supabase/supabase-js';

const supabaseUrl = import.meta.env.VITE_SUPABASE_URL;
const supabaseKey = import.meta.env.VITE_SUPABASE_KEY;
const supabase: SupabaseClient = createClient(supabaseUrl, supabaseKey);

interface Job {
  id: string;
  created_at: string;
  script: string;
  image_url: string;
  video_url: string;
  prompt?: string;
  model: string;
}

const DashboardPage: React.FC = () => {
  const [jobs, setJobs] = useState<Job[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const [showYouTubeModal, setShowYouTubeModal] = useState<string | null>(null);
  const [youtubeSignedIn, setYouTubeSignedIn] = useState(false);
  const [youtubeTitle, setYouTubeTitle] = useState('');
  const [youtubeDescription, setYouTubeDescription] = useState('');
  const [youtubeStatus, setYouTubeStatus] = useState<string | null>(null);
  const [youtubeLoading, setYouTubeLoading] = useState(false);

  useEffect(() => {
    const fetchJobs = async () => {
      setLoading(true);
      setError(null);
      try {
        const { data, error } = await supabase
          .from<Job>('jobs')
          .select('*')
          .order('created_at', { ascending: false });
        if (error) throw error;
        setJobs(data || []);
      } catch (err: any) {
        setError(err.message || 'Failed to fetch jobs.');
      } finally {
        setLoading(false);
      }
    };
    fetchJobs();
  }, []);

  const handleYouTubeClick = (job: Job) => {
    setYouTubeStatus(null);
    setShowYouTubeModal(job.id);
    setYouTubeTitle(job.prompt || job.script.slice(0, 60));
    setYouTubeDescription(job.script);
  };

  const handleYouTubeLogin = () => {
    setYouTubeSignedIn(true);
  };

  const handleYouTubeUpload = () => {
    setYouTubeLoading(true);
    setTimeout(() => {
      setYouTubeLoading(false);
      setYouTubeStatus('success');
    }, 1500);
  };

  return (
    <div className="max-w-5xl mx-auto p-6 mt-8">
      <h1 className="text-3xl font-bold mb-6">Job Dashboard</h1>
      {loading && (
        <div className="flex items-center justify-center py-12">
          <svg className="animate-spin h-6 w-6 mr-2 text-blue-600" xmlns="http://www.w3.org/2000/svg" fill="none" viewBox="0 0 24 24">
            <circle className="opacity-25" cx="12" cy="12" r="10" stroke="currentColor" strokeWidth="4"></circle>
            <path className="opacity-75" fill="currentColor" d="M4 12a8 8 0 018-8v8z"></path>
          </svg>
          Loading jobs...
        </div>
      )}
      {error && <div className="text-red-600 font-medium mb-4">{error}</div>}
      {!loading && !error && (
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
          {jobs.map(job => (
            <div key={job.id} className="bg-white rounded shadow p-4 flex flex-col">
              <div className="flex items-center justify-between mb-2">
                <span className="text-xs text-gray-500">{new Date(job.created_at).toLocaleString()}</span>
                <span className={`px-2 py-1 rounded text-xs font-semibold ${job.model === 'prompt' ? 'bg-green-100 text-green-700' : 'bg-blue-100 text-blue-700'}`}>{job.model}</span>
              </div>
              <div className="mb-2">
                <span className="text-xs text-gray-400">Job ID:</span>
                <span className="ml-1 font-mono text-xs text-gray-700">{job.id}</span>
              </div>
              {job.prompt && (
                <div className="mb-2">
                  <span className="text-xs text-gray-400">Prompt:</span>
                  <span className="ml-1 text-gray-700">{job.prompt}</span>
                </div>
              )}
              <div className="mb-2">
                <span className="text-xs text-gray-400">Script:</span>
                <div className="bg-gray-100 rounded p-2 text-sm whitespace-pre-line mt-1">{job.script}</div>
              </div>
              <div className="flex items-center gap-2 mb-2">
                {job.image_url && (
                  <img src={job.image_url} alt="Avatar" className="w-16 h-16 object-cover rounded shadow" />
                )}
                {job.video_url && job.video_url.match(/\.mp4($|\?)/i) ? (
                  <video src={job.video_url} controls className="w-32 h-16 rounded shadow" />
                ) : job.video_url ? (
                  <a href={job.video_url} target="_blank" rel="noopener noreferrer" className="text-blue-600 underline text-xs">Video Link</a>
                ) : null}
              </div>
              <div className="mt-4 border-t pt-3">
                <div className="font-semibold mb-2 text-gray-700">Share this Video</div>
                <div className="flex items-center gap-3 flex-wrap">
                  <button
                    className="bg-red-600 hover:bg-red-700 text-white px-4 py-2 rounded font-semibold shadow flex items-center gap-2 transition disabled:opacity-60"
                    onClick={() => handleYouTubeClick(job)}
                  >
                    <svg className="w-5 h-5" fill="currentColor" viewBox="0 0 24 24"><path d="M21.8 8.001a2.752 2.752 0 0 0-1.937-1.947C18.077 6 12 6 12 6s-6.077 0-7.863.054A2.752 2.752 0 0 0 2.2 8.001 28.6 28.6 0 0 0 2 12a28.6 28.6 0 0 0 .2 3.999 2.752 2.752 0 0 0 1.937 1.947C5.923 18 12 18 12 18s6.077 0 7.863-.054A2.752 2.752 0 0 0 21.8 15.999 28.6 28.6 0 0 0 22 12a28.6 28.6 0 0 0-.2-3.999zM10 15V9l6 3-6 3z"/></svg>
                    Post to YouTube
                  </button>
                  <div className="relative group">
                    <button
                      className="bg-gray-300 text-gray-500 px-4 py-2 rounded font-semibold flex items-center gap-2 cursor-not-allowed"
                      disabled
                    >
                      <svg className="w-5 h-5" fill="currentColor" viewBox="0 0 24 24"><path d="M22.46 6c-.77.35-1.6.59-2.47.7a4.3 4.3 0 0 0 1.88-2.37 8.59 8.59 0 0 1-2.72 1.04A4.28 4.28 0 0 0 16.11 4c-2.37 0-4.29 1.92-4.29 4.29 0 .34.04.67.11.99C7.69 9.13 4.07 7.38 1.64 4.7c-.37.64-.58 1.39-.58 2.19 0 1.51.77 2.84 1.95 3.62a4.28 4.28 0 0 1-1.94-.54v.05c0 2.11 1.5 3.87 3.5 4.27-.36.1-.74.16-1.13.16-.28 0-.54-.03-.8-.08.54 1.68 2.11 2.9 3.97 2.93A8.6 8.6 0 0 1 2 19.54c-.65 0-1.29-.04-1.92-.11A12.13 12.13 0 0 0 8.29 21c7.55 0 11.68-6.26 11.68-11.68 0-.18-.01-.36-.02-.54A8.18 8.18 0 0 0 22.46 6z"/></svg>
                      X (Twitter)
                    </button>
                    <span className="absolute left-1/2 -translate-x-1/2 mt-2 w-max bg-gray-700 text-white text-xs rounded px-2 py-1 opacity-0 group-hover:opacity-100 transition pointer-events-none">Coming Soon</span>
                  </div>
                  <div className="relative group">
                    <button
                      className="bg-gray-300 text-gray-500 px-4 py-2 rounded font-semibold flex items-center gap-2 cursor-not-allowed"
                      disabled
                    >
                      <svg className="w-5 h-5" fill="currentColor" viewBox="0 0 24 24"><path d="M19 0h-14c-2.76 0-5 2.24-5 5v14c0 2.76 2.24 5 5 5h14c2.76 0 5-2.24 5-5v-14c0-2.76-2.24-5-5-5zm-7 19h-3v-7h3v7zm-1.5-8.25c-.97 0-1.75-.78-1.75-1.75s.78-1.75 1.75-1.75 1.75.78 1.75 1.75-.78 1.75-1.75 1.75zm13.5 8.25c0 1.1-.9 2-2 2h-14c-1.1 0-2-.9-2-2v-14c0-1.1.9-2 2-2h14c1.1 0 2 .9 2 2v14zm-4-2h-3v-4c0-1.1-.9-2-2-2s-2 .9-2 2v4h-3v-7h3v1.5c.41-.59 1.09-1 1.84-1 1.3 0 2.36 1.06 2.36 2.36v4.14z"/></svg>
                      LinkedIn
                    </button>
                    <span className="absolute left-1/2 -translate-x-1/2 mt-2 w-max bg-gray-700 text-white text-xs rounded px-2 py-1 opacity-0 group-hover:opacity-100 transition pointer-events-none">Coming Soon</span>
                  </div>
                  <div className="relative group">
                    <button
                      className="bg-gray-300 text-gray-500 px-4 py-2 rounded font-semibold flex items-center gap-2 cursor-not-allowed"
                      disabled
                    >
                      <svg className="w-5 h-5" fill="currentColor" viewBox="0 0 24 24"><path d="M9.75 2.5c0-.69.56-1.25 1.25-1.25h2c.69 0 1.25.56 1.25 1.25v.25h2.5A2.25 2.25 0 0 1 19 5v14a2.25 2.25 0 0 1-2.25 2.25h-9A2.25 2.25 0 0 1 5 19V5A2.25 2.25 0 0 1 7.25 2.75h2.5v-.25zm1.25.75a.75.75 0 0 0-.75.75v.25h3v-.25a.75.75 0 0 0-.75-.75h-1.5zM7 5v14c0 .41.34.75.75.75h9a.75.75 0 0 0 .75-.75V5a.75.75 0 0 0-.75-.75h-9A.75.75 0 0 0 7 5zm5 2.25a.75.75 0 0 1 .75.75v6.19l2.22 2.22a.75.75 0 1 1-1.06 1.06l-2.47-2.47a.75.75 0 0 1-.22-.53V8a.75.75 0 0 1 .75-.75z"/></svg>
                      TikTok
                    </button>
                    <span className="absolute left-1/2 -translate-x-1/2 mt-2 w-max bg-gray-700 text-white text-xs rounded px-2 py-1 opacity-0 group-hover:opacity-100 transition pointer-events-none">Coming Soon</span>
                  </div>
                </div>
              </div>
              {/* YouTube Modal */}
              {showYouTubeModal === job.id && (
                <div className="fixed inset-0 bg-black/40 flex items-center justify-center z-50">
                  <div className="bg-white rounded-lg shadow-lg p-6 w-full max-w-md relative">
                    <button className="absolute top-2 right-2 text-gray-400 hover:text-gray-600" onClick={() => setShowYouTubeModal(null)}>&times;</button>
                    <h2 className="text-xl font-bold mb-4">Post to YouTube</h2>
                    {!youtubeSignedIn ? (
                      <div className="flex flex-col items-center">
                        <div className="mb-4 text-gray-700">Sign in with Google to continue</div>
                        <button
                          className="bg-blue-600 hover:bg-blue-700 text-white px-4 py-2 rounded font-semibold flex items-center gap-2"
                          onClick={handleYouTubeLogin}
                        >
                          <svg className="w-5 h-5" fill="currentColor" viewBox="0 0 48 48"><path d="M44.5 20H24v8.5h11.7C34.7 32.6 30.1 36 24 36c-6.6 0-12-5.4-12-12s5.4-12 12-12c2.7 0 5.2.9 7.2 2.4l6.4-6.4C34.2 5.1 29.4 3 24 3 12.4 3 3 12.4 3 24s9.4 21 21 21c10.5 0 19.2-7.7 20.7-17.7.1-.5.3-1 .3-1.5V24c0-1.3-.2-2.6-.5-4z"/><path d="M6.3 14.7l6.6 4.8C14.2 17.1 18.7 14 24 14c2.7 0 5.2.9 7.2 2.4l6.4-6.4C34.2 5.1 29.4 3 24 3 12.4 3 3 12.4 3 24s9.4 21 21 21c10.5 0 19.2-7.7 20.7-17.7.1-.5.3-1 .3-1.5V24c0-1.3-.2-2.6-.5-4z" fill="#4285F4"/><path d="M44.5 20H24v8.5h11.7C34.7 32.6 30.1 36 24 36c-6.6 0-12-5.4-12-12s5.4-12 12-12c2.7 0 5.2.9 7.2 2.4l6.4-6.4C34.2 5.1 29.4 3 24 3 12.4 3 3 12.4 3 24s9.4 21 21 21c10.5 0 19.2-7.7 20.7-17.7.1-.5.3-1 .3-1.5V24c0-1.3-.2-2.6-.5-4z" fill="#34A853"/><path d="M44.5 20H24v8.5h11.7C34.7 32.6 30.1 36 24 36c-6.6 0-12-5.4-12-12s5.4-12 12-12c2.7 0 5.2.9 7.2 2.4l6.4-6.4C34.2 5.1 29.4 3 24 3 12.4 3 3 12.4 3 24s9.4 21 21 21c10.5 0 19.2-7.7 20.7-17.7.1-.5.3-1 .3-1.5V24c0-1.3-.2-2.6-.5-4z" fill="#FBBC05"/><path d="M44.5 20H24v8.5h11.7C34.7 32.6 30.1 36 24 36c-6.6 0-12-5.4-12-12s5.4-12 12-12c2.7 0 5.2.9 7.2 2.4l6.4-6.4C34.2 5.1 29.4 3 24 3 12.4 3 3 12.4 3 24s9.4 21 21 21c10.5 0 19.2-7.7 20.7-17.7.1-.5.3-1 .3-1.5V24c0-1.3-.2-2.6-.5-4z" fill="#EA4335"/></svg>
                          Sign in with Google
                        </button>
                      </div>
                    ) : (
                      <form onSubmit={e => { e.preventDefault(); handleYouTubeUpload(); }}>
                        <div className="mb-4">
                          <label className="block font-medium mb-1">Title</label>
                          <input
                            type="text"
                            className="w-full border border-gray-300 rounded px-3 py-2"
                            value={youtubeTitle}
                            onChange={e => setYouTubeTitle(e.target.value)}
                            required
                          />
                        </div>
                        <div className="mb-4">
                          <label className="block font-medium mb-1">Description</label>
                          <textarea
                            className="w-full border border-gray-300 rounded px-3 py-2"
                            value={youtubeDescription}
                            onChange={e => setYouTubeDescription(e.target.value)}
                            rows={4}
                            required
                          />
                        </div>
                        <button
                          type="submit"
                          className="w-full bg-red-600 text-white font-semibold py-2 rounded hover:bg-red-700 transition mb-2"
                          disabled={youtubeLoading}
                        >
                          {youtubeLoading ? 'Uploading...' : 'Upload'}
                        </button>
                        {youtubeStatus === 'success' && <div className="text-green-600 font-medium mt-2">Video uploaded to YouTube! (placeholder)</div>}
                        {youtubeStatus === 'error' && <div className="text-red-600 font-medium mt-2">Failed to upload video.</div>}
                      </form>
                    )}
                  </div>
                </div>
              )}
            </div>
          ))}
        </div>
      )}
    </div>
  );
};

export default DashboardPage;