import React, { useState } from 'react';
import { useNavigate } from 'react-router-dom';
import { Sparkles } from 'lucide-react';
import { supabase } from '../lib/supabase';

const LandingPage = () => {
  const navigate = useNavigate();
  const [showLoginModal, setShowLoginModal] = useState(false);
  const [showSignupModal, setShowSignupModal] = useState(false);
  const [email, setEmail] = useState('');
  const [password, setPassword] = useState('');
  const [error, setError] = useState('');
  const [loading, setLoading] = useState(false);

  const handleSignUp = async (e: React.FormEvent) => {
    e.preventDefault();
    setLoading(true);
    setError('');

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
        navigate('/designs');
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
        navigate('/designs');
      }
    } catch (err) {
      setError(err instanceof Error ? err.message : 'Failed to log in');
    } finally {
      setLoading(false);
    }
  };

  return (
    <div className="min-h-screen gradient-bg">
      <div className="container px-4 py-16 mx-auto text-white">
        <nav className="flex items-center justify-between mb-16">
          <h1 className="text-2xl font-bold">Design Studio</h1>
          <div className="space-x-4">
            <button
              onClick={() => setShowLoginModal(true)}
              className="px-4 py-2 transition-colors rounded-lg bg-white/10 hover:bg-white/20"
            >
              Login
            </button>
            <button
              onClick={() => setShowSignupModal(true)}
              className="px-4 py-2 text-indigo-600 transition-colors bg-white rounded-lg hover:bg-gray-100"
            >
              Sign Up
            </button>
          </div>
        </nav>

        <div className="grid items-center gap-12 lg:grid-cols-2">
          <div>
            <h2 className="mb-6 text-5xl font-bold leading-tight">
              Create stunning designs with our powerful editor
            </h2>
            <p className="mb-8 text-xl text-indigo-100">
              Design beautiful graphics, presentations, and social media content in minutes. 
              No design experience needed.
            </p>
            <button
              onClick={() => setShowSignupModal(true)}
              className="inline-block px-8 py-4 text-lg font-semibold text-indigo-600 transition-transform bg-white rounded-xl hover:scale-105"
            >
              Start Creating Free
            </button>
          </div>
          <div className="grid grid-cols-2 gap-6">
            <div className="p-6 backdrop-blur-lg bg-white/10 rounded-2xl card-hover">
              <h3 className="mb-2 text-xl font-semibold">Templates</h3>
              <p className="text-indigo-100">Start with professionally designed templates</p>
            </div>
            <div className="p-6 backdrop-blur-lg bg-white/10 rounded-2xl card-hover">
              <h3 className="mb-2 text-xl font-semibold">Elements</h3>
              <p className="text-indigo-100">Access millions of photos and elements</p>
            </div>
            <div className="p-6 backdrop-blur-lg bg-white/10 rounded-2xl card-hover">
              <h3 className="mb-2 text-xl font-semibold">Collaboration</h3>
              <p className="text-indigo-100">Work together with your team in real-time</p>
            </div>
            <div className="p-6 backdrop-blur-lg bg-white/10 rounded-2xl card-hover">
              <h3 className="mb-2 text-xl font-semibold">Export</h3>
              <p className="text-indigo-100">Download in multiple formats instantly</p>
            </div>
          </div>
        </div>
      </div>

      {/* Login Modal */}
      {showLoginModal && (
        <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-black/50 backdrop-blur-sm">
          <div className="w-full max-w-md p-8 bg-white rounded-2xl">
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
              <div className="p-3 mb-4 text-sm text-red-600 bg-red-50 rounded-lg">
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
        <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-black/50 backdrop-blur-sm">
          <div className="w-full max-w-md p-8 bg-white rounded-2xl">
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
              <div className="p-3 mb-4 text-sm text-red-600 bg-red-50 rounded-lg">
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