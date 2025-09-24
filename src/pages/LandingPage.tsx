import React, { useState, useEffect } from 'react';
import { useNavigate, useLocation } from 'react-router-dom';
import { Sparkles, BookOpen } from 'lucide-react';
import { supabase } from '../api/supabase';

const LandingPage = () => {
  const navigate = useNavigate();
  const location = useLocation();
  const [showLoginModal, setShowLoginModal] = useState(false);
  const [showSignupModal, setShowSignupModal] = useState(false);
  const [email, setEmail] = useState('');
  const [password, setPassword] = useState('');
  const [error, setError] = useState('');
  const [loading, setLoading] = useState(false);

  useEffect(() => {
    if (location.state?.showLogin) {
      setShowLoginModal(true);
    }
  }, [location.state]);

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

  const handleGoogleSignIn = async () => {
    try {
      const { data, error } = await supabase.auth.signInWithOAuth({
        provider: 'google',
        options: {
          redirectTo: `${window.location.origin}/designs`
        }
      });

      if (error) throw error;
    } catch (err) {
      setError(err instanceof Error ? err.message : 'Failed to sign in with Google');
    }
  };

  return (
    <div className="text-white">
      <nav className="flex justify-between items-center mb-16">
        <h1 className="text-3xl font-bold text-transparent bg-clip-text bg-gradient-to-r from-purple-400 to-pink-400">
          AdNate
        </h1>
        <div className="space-x-4">
          <button
            onClick={() => navigate('/blog')}
            className="px-4 py-2 rounded-lg backdrop-blur-lg transition-all duration-300 bg-white/10 hover:bg-white/20"
          >
            <BookOpen className="inline mr-2 w-4 h-4" />
            Blog
          </button>
          <button
            onClick={() => setShowLoginModal(true)}
            className="px-4 py-2 rounded-lg backdrop-blur-lg transition-all duration-300 bg-white/10 hover:bg-white/20"
          >
            Login
          </button>
          <button
            onClick={() => setShowSignupModal(true)}
            className="px-4 py-2 bg-gradient-to-r from-purple-400 to-pink-400 rounded-lg transition-all duration-300 hover:opacity-90"
          >
            Sign Up
          </button>
        </div>
      </nav>

      <div className="mx-auto space-y-8 max-w-4xl text-center">
        <h2 className="text-6xl font-bold leading-tight">
          Create Stunning Visuals
          <span className="block text-transparent bg-clip-text bg-gradient-to-r from-purple-400 to-pink-400">
          From Brief to Design in Minutes
          </span>
        </h2>
        <p className="text-xl text-left text-gray-300">
        AdNate combines an intuitive editor to transform your creative vision into professional-quality graphics. 
        No design experience required.
        </p>
        <button
          onClick={() => setShowSignupModal(true)}
          className="px-8 py-4 text-lg font-medium bg-gradient-to-r from-purple-400 to-pink-400 rounded-lg transition-all duration-300 hover:opacity-90"
        >
          Start Creating Free
          <Sparkles className="inline ml-2 w-5 h-5" />
        </button>
      </div>
      
      <div className="mx-auto space-y-8 max-w-4xl text-center">
        Did you find yourself spending hours cobbling together “good enough” posts in online tools with generic templates?
        Did you frustrated when AI spits out gorgeous images - only to realize they don’t fit Instagram, Facebook, or LinkedIn sizes?
        Did you simply don’t have the time and energy to master design tools or learn the art of AI prompting?
      </div>

      {/* Login Modal */}
      {showLoginModal && (
        <div className="flex fixed inset-0 z-50 justify-center items-center p-4 backdrop-blur-sm bg-black/60">
          <div className="p-8 w-full max-w-md bg-gray-900 rounded-2xl border border-white/10">
            <div className="flex justify-between items-center mb-6">
              <h2 className="text-2xl font-bold text-white">Welcome back</h2>
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
              <div className="space-y-4">
                <button
                  onClick={handleGoogleSignIn}
                  type="button"
                  className="flex justify-center items-center px-4 py-2 space-x-2 w-full text-gray-700 bg-white rounded-lg border transition-colors hover:bg-gray-50"
                >
                  <img src="/google-icon.svg" alt="Google" className="w-5 h-5" />
                  <span>Continue with Google</span>
                </button>
                
                <div className="flex items-center">
                  <div className="flex-1 border-t border-gray-300"></div>
                  <span className="px-4 text-sm text-gray-500">or</span>
                  <div className="flex-1 border-t border-gray-300"></div>
                </div>
                
                <div>
                  <label className="block text-sm font-medium text-gray-700">Email</label>
                  <input
                    type="email"
                    value={email}
                    onChange={(e) => setEmail(e.target.value)}
                    placeholder="Email"
                    className="px-4 py-2 w-full text-gray-900 bg-white rounded-lg border focus:outline-none focus:ring-2 focus:ring-purple-400"
                    required
                  />
                </div>
                <div>
                  <label className="block text-sm font-medium text-gray-700">Password</label>
                  <input
                    type="password"
                    value={password}
                    onChange={(e) => setPassword(e.target.value)}
                    required
                    className="px-4 py-3 mt-1 w-full rounded-lg border border-gray-300 focus:ring-2 focus:ring-indigo-500"
                  />
                </div>
              </div>
              <button
                type="submit"
                disabled={loading}
                className="px-4 py-3 w-full font-semibold text-white bg-indigo-600 rounded-lg transition-colors hover:bg-indigo-700 disabled:opacity-50"
              >
                {loading ? 'Logging in...' : 'Login'}
              </button>
            </form>
          </div>
        </div>
      )}

      {/* Signup Modal */}
      {showSignupModal && (
        <div className="flex fixed inset-0 z-50 justify-center items-center p-4 backdrop-blur-sm bg-black/60">
          <div className="p-8 w-full max-w-md bg-gray-900 rounded-2xl border border-white/10">
            <div className="flex justify-between items-center mb-6">
              <h2 className="text-2xl font-bold text-white">Create your account</h2>
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
              <div className="space-y-4">
                <button
                  onClick={handleGoogleSignIn}
                  type="button"
                  className="flex justify-center items-center px-4 py-2 space-x-2 w-full text-gray-700 bg-white rounded-lg border transition-colors hover:bg-gray-50"
                >
                  <img src="/google-icon.svg" alt="Google" className="w-5 h-5" />
                  <span>Continue with Google</span>
                </button>
                
                <div className="flex items-center">
                  <div className="flex-1 border-t border-gray-300"></div>
                  <span className="px-4 text-sm text-gray-500">or</span>
                  <div className="flex-1 border-t border-gray-300"></div>
                </div>
                
                <div>
                  <label className="block text-sm font-medium text-gray-700">Email</label>
                  <input
                    type="email"
                    value={email}
                    onChange={(e) => setEmail(e.target.value)}
                    placeholder="Email"
                    className="px-4 py-2 w-full text-gray-900 bg-white rounded-lg border focus:outline-none focus:ring-2 focus:ring-purple-400"
                    required
                  />
                </div>
                <div>
                  <label className="block text-sm font-medium text-gray-700">Password</label>
                  <input
                    type="password"
                    value={password}
                    onChange={(e) => setPassword(e.target.value)}
                    required
                    className="px-4 py-3 mt-1 w-full rounded-lg border border-gray-300 focus:ring-2 focus:ring-indigo-500"
                  />
                </div>
              </div>
              <button
                type="submit"
                disabled={loading}
                className="px-4 py-3 w-full font-semibold text-white bg-indigo-600 rounded-lg transition-colors hover:bg-indigo-700 disabled:opacity-50"
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