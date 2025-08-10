import React, { useState, useEffect } from 'react';
import { useNavigate } from 'react-router-dom';
import { Sparkles, BookOpen } from 'lucide-react';
import { supabase } from '../lib/supabase';
import { ROUTE_PATHS } from "../routes";

const LandingPage = () => {
  const navigate = useNavigate();
  const [showLoginModal, setShowLoginModal] = useState(false);
  const [showSignupModal, setShowSignupModal] = useState(false);
  const [email, setEmail] = useState('');
  const [password, setPassword] = useState('');
  const [error, setError] = useState('');
  const [loading, setLoading] = useState(false);

  // Placeholder for authentication status, assuming it's managed elsewhere or will be added.
  // In a real app, you'd likely get this from an AuthProvider or context.
  const user = null; // Replace with actual user state if available

  useEffect(() => {
    if (user) {
      navigate(ROUTE_PATHS.DESIGNS);
    }
  }, [user, navigate]);

  const handleSignUp = async (e: React.FormEvent) => {
    e.preventDefault();
    setLoading(true);
    setError('');

    // Basic validation
    if (!email || !password) {
      setError('Email and password are required');
      setLoading(false);
      return;
    }

    if (password.length < 6) {
      setError('Password must be at least 6 characters');
      setLoading(false);
      return;
    }

    try {
      const { data, error } = await supabase.auth.signUp({
        email,
        password,
        options: {
          emailRedirectTo: `${window.location.origin}/designs`
        }
      });

      if (error) throw error;

      if (data.user) {
        localStorage.setItem('isAuthenticated', 'true');
        navigate(ROUTE_PATHS.DESIGNS);
      }
    } catch (err) {
      setError(err instanceof Error ? err.message : 'Failed to sign up');
    } finally {
      setLoading(false);
    }
  };

  const handleLogin = async (e: React.FormEvent) => {
    e.preventDefault();
    setLoading(true);
    setError('');

    try {
      const { data, error } = await supabase.auth.signInWithPassword({
        email,
        password
      });

      if (error) throw error;

      if (data.user) {
        localStorage.setItem('isAuthenticated', 'true');
        navigate(ROUTE_PATHS.DESIGNS);
      }
    } catch (err) {
      setError(err instanceof Error ? err.message : 'Failed to log in');
    } finally {
      setLoading(false);
    }
  };

  const handleGetStarted = () => {
    if (user) {
      navigate(ROUTE_PATHS.DESIGNS);
    } else {
      navigate(ROUTE_PATHS.AUTH);
    }
  };

  return (
    <div className="text-white">
      <nav className="flex items-center justify-between mb-16">
        <h1 className="text-3xl font-bold text-transparent bg-clip-text bg-gradient-to-r from-purple-400 to-pink-400">
          Design Studio
        </h1>
        <div className="space-x-4">
          <button
            onClick={() => navigate('/blog')}
            className="px-4 py-2 transition-all duration-300 rounded-lg bg-white/10 hover:bg-white/20 backdrop-blur-lg"
          >
            <BookOpen className="inline w-4 h-4 mr-2" />
            Blog
          </button>
          <button
            onClick={() => setShowLoginModal(true)}
            className="px-4 py-2 transition-all duration-300 rounded-lg bg-white/10 hover:bg-white/20 backdrop-blur-lg"
          >
            Login
          </button>
          <button
            onClick={() => setShowSignupModal(true)}
            className="px-4 py-2 transition-all duration-300 rounded-lg bg-gradient-to-r from-purple-400 to-pink-400 hover:opacity-90"
          >
            Sign Up
          </button>
        </div>
      </nav>

      <div className="max-w-4xl mx-auto space-y-8 text-center">
        <h2 className="text-6xl font-bold leading-tight">
          Create Stunning Designs
          <span className="block text-transparent bg-clip-text bg-gradient-to-r from-purple-400 to-pink-400">
            Without Limits
          </span>
        </h2>
        <p className="text-xl text-gray-300">
          Design beautiful graphics, presentations, and social media content in minutes. 
          No design experience needed.
        </p>
        <button
          onClick={handleGetStarted}
          className="px-8 py-4 text-lg font-medium transition-all duration-300 rounded-lg bg-gradient-to-r from-purple-400 to-pink-400 hover:opacity-90"
        >
          Start Creating Free
          <Sparkles className="inline w-5 h-5 ml-2" />
        </button>
      </div>

      {/* Login Modal */}
      {showLoginModal && (
        <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-black/60 backdrop-blur-sm">
          <div className="w-full max-w-md p-8 bg-gray-900 border rounded-2xl border-white/10">
            <div className="flex items-center justify-between mb-6">
              <h2 className="text-2xl font-bold text-gray-900">Welcome back</h2>
              <button
                onClick={() => setShowLoginModal(false)}
                className="text-gray-500 hover:text-gray-700"
              >
                ✕
              </button>
            </div>
            {error && (
              <div className="p-3 mb-4 text-sm text-red-600 rounded-lg bg-red-50">
                {error}
              </div>
            )}
            <form onSubmit={handleLogin} className="space-y-4">
              <div>
                <label className="block text-sm font-medium text-gray-700">Email</label>
                <input
                  type="email"
                  value={email}
                  onChange={(e) => setEmail(e.target.value)}
                  required
                  className="w-full px-4 py-3 mt-1 border border-gray-300 rounded-lg focus:ring-2 focus:ring-indigo-500"
                />
              </div>
              <div>
                <label className="block text-sm font-medium text-gray-700">Password</label>
                <input
                  type="password"
                  value={password}
                  onChange={(e) => setPassword(e.target.value)}
                  required
                  className="w-full px-4 py-3 mt-1 border border-gray-300 rounded-lg focus:ring-2 focus:ring-indigo-500"
                />
              </div>
              <button
                type="submit"
                disabled={loading}
                className="w-full px-4 py-3 font-semibold text-white transition-colors bg-indigo-600 rounded-lg hover:bg-indigo-700 disabled:opacity-50"
              >
                {loading ? 'Logging in...' : 'Login'}
              </button>
            </form>
          </div>
        </div>
      )}

      {/* Signup Modal */}
      {showSignupModal && (
        <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-black/60 backdrop-blur-sm">
          <div className="w-full max-w-md p-8 bg-gray-900 border rounded-2xl border-white/10">
            <div className="flex items-center justify-between mb-6">
              <h2 className="text-2xl font-bold text-gray-900">Create your account</h2>
              <button
                onClick={() => setShowSignupModal(false)}
                className="text-gray-500 hover:text-gray-700"
              >
                ✕
              </button>
            </div>
            {error && (
              <div className="p-3 mb-4 text-sm text-red-600 rounded-lg bg-red-50">
                {error}
              </div>
            )}
            <form onSubmit={handleSignUp} className="space-y-4">
              <div>
                <label className="block text-sm font-medium text-gray-700">Email</label>
                <input
                  type="email"
                  value={email}
                  onChange={(e) => setEmail(e.target.value)}
                  required
                  className="w-full px-4 py-3 mt-1 border border-gray-300 rounded-lg focus:ring-2 focus:ring-indigo-500"
                />
              </div>
              <div>
                <label className="block text-sm font-medium text-gray-700">Password</label>
                <input
                  type="password"
                  value={password}
                  onChange={(e) => setPassword(e.target.value)}
                  required
                  className="w-full px-4 py-3 mt-1 border border-gray-300 rounded-lg focus:ring-2 focus:ring-indigo-500"
                />
              </div>
              <button
                type="submit"
                disabled={loading}
                className="w-full px-4 py-3 font-semibold text-white transition-colors bg-indigo-600 rounded-lg hover:bg-indigo-700 disabled:opacity-50"
              >
                {loading ? 'Creating account...' : 'Create Account'}
              </button>
            </form>
          </div>
        </div>
      )}
    </div>
  );
};

export default LandingPage;