import React from 'react';
import { BrowserRouter as Router, Routes, Route, Link } from 'react-router-dom';
import Navigation from './components/Navigation';
import Footer from './components/Footer';
import CreatePage from './pages/CreatePage';
import DashboardPage from './pages/DashboardPage';
import DeveloperPage from './pages/DeveloperPage';
import CommunityPage from './pages/CommunityPage';
import AboutPage from './pages/AboutPage';
import PromptPage from './pages/PromptPage';

const HomePage = () => (
  <div className="flex flex-col items-center justify-center min-h-[60vh] text-center">
    <div className="text-4xl font-bold mb-6">🚀 EchoForge AI</div>
    <div className="space-x-4">
      <Link
        to="/create"
        className="inline-block bg-blue-600 text-white px-6 py-3 rounded font-semibold shadow hover:bg-blue-700 transition mb-2"
      >
        Create with Your Own Avatar
      </Link>
      <Link
        to="/prompt"
        className="inline-block bg-green-600 text-white px-6 py-3 rounded font-semibold shadow hover:bg-green-700 transition mb-2"
      >
        Generate from Prompt
      </Link>
      <Link
        to="/dashboard"
        className="inline-block bg-gray-600 text-white px-6 py-3 rounded font-semibold shadow hover:bg-gray-700 transition mb-2"
      >
        View Dashboard
      </Link>
    </div>
  </div>
);

function App() {
  return (
    <Router>
      <div className="min-h-screen bg-white">
        <Navigation />
        <main>
          <Routes>
            <Route path="/" element={<HomePage />} />
            <Route path="/create" element={<CreatePage />} />
            <Route path="/prompt" element={<PromptPage />} />
            <Route path="/dashboard" element={<DashboardPage />} />
            <Route path="/developers" element={<DeveloperPage />} />
            <Route path="/community" element={<CommunityPage />} />
            <Route path="/about" element={<AboutPage />} />
          </Routes>
        </main>
        <Footer />
      </div>
    </Router>
  );
}

export default App;