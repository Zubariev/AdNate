import React, { useState, useEffect, useRef } from 'react';
import { useNavigate, useLocation } from 'react-router-dom';
import { Sparkles, BookOpen, FileText, Bot, Brush, Zap, Scaling, Palette } from 'lucide-react';
import { useAuth } from '../components/auth/AuthProvider';
import mojs from '@mojs/core';
import ScrollReveal from 'scrollreveal';

const LandingPage = () => {
  const navigate = useNavigate();
  const location = useLocation();
  const { user, signOut, signIn, signUp, signInWithGoogle } = useAuth();
  const [showLoginModal, setShowLoginModal] = useState(false);
  const [showSignupModal, setShowSignupModal] = useState(false);
  const [email, setEmail] = useState('');
  const [password, setPassword] = useState('');
  const [error, setError] = useState('');
  const [loading, setLoading] = useState(false);
  const ctaButtonRef = useRef<HTMLButtonElement>(null);
  const challengesRef = useRef<HTMLDivElement>(null);

  useEffect(() => {
    if (location.state?.showLogin) {
      setShowLoginModal(true);
    }
  }, [location.state]);

  useEffect(() => {
    if (ctaButtonRef.current) {
      const burst = new mojs.Burst({
        parent: ctaButtonRef.current,
        radius: { 50: 150 },
        count: 10,
        children: {
          shape: 'circle',
          fill: { '#9333ea': '#ec4899' },
          duration: 600,
          easing: 'ease.out',
        },
      });

      const button = ctaButtonRef.current;
      button.addEventListener('mouseenter', () => {
        burst.play();
      });
    }
  }, []);

  useEffect(() => {
    if (challengesRef.current) {
      ScrollReveal().reveal(challengesRef.current, {
        delay: 200,
        distance: '50px',
        origin: 'bottom',
        opacity: 0,
        duration: 1000,
        easing: 'ease-in-out',
      });
    }
  }, []);

  const handleStartCreating = () => {
    if (user) {
      navigate('/brief');
    } else {
      setShowSignupModal(true);
    }
  };

  const handleSignUp = async (e: React.FormEvent) => {
    e.preventDefault();
    setLoading(true);
    setError('');

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

    const { error } = await signUp(email, password);
    if (error) {
      setError(error.message);
    } else {
      setShowSignupModal(false);
      navigate('/designs');
    }
    setLoading(false);
  };

  const handleLogin = async (e: React.FormEvent) => {
    e.preventDefault();
    setLoading(true);
    setError('');

    const { error } = await signIn(email, password);
    if (error) {
      setError(error.message);
    } else {
      setShowLoginModal(false);
      navigate('/designs');
    }
    setLoading(false);
  };

  const handleGoogleSignIn = async () => {
    const { error } = await signInWithGoogle();
    if (error) {
      setError(error.message);
    }
  };

  return (
    <div className="relative text-white">
      <div className="absolute top-0 left-0 w-full h-full bg-gradient-to-br from-gray-900 via-gray-900 to-purple-900 animate-gradient-xy -z-10" />
      <div className="relative z-10 p-8">
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
            {user ? (
              <button
                onClick={() => signOut()}
                className="px-4 py-2 rounded-lg backdrop-blur-lg transition-all duration-300 bg-white/10 hover:bg-white/20"
              >
                Log Out
              </button>
            ) : (
              <>
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
              </>
            )}
          </div>
        </nav>

        <div className="mx-auto space-y-8 max-w-4xl text-center">
          <h2 className="text-6xl font-bold leading-tight animate__animated animate__fadeIn">
            Create Stunning Visuals
            <span className="block text-transparent bg-clip-text bg-gradient-to-r from-purple-400 to-pink-400">
            From Brief to Design in Minutes
            </span>
          </h2>
          <button
            ref={ctaButtonRef}
            onClick={handleStartCreating}
            className="px-8 py-4 text-lg font-medium bg-gradient-to-r from-purple-400 to-pink-400 rounded-lg transition-all duration-300 hover:opacity-90"
          >
            Start Creating Free
            <Sparkles className="inline ml-2 w-5 h-5" />
          </button>
        </div>
        
        <div ref={challengesRef} className="p-6 mx-auto mt-16 max-w-4xl rounded-xl border backdrop-blur-sm bg-white/5 border-white/10">
          <h2 className="mb-6 text-4xl font-semibold text-transparent bg-clip-text bg-gradient-to-r from-purple-400 to-pink-400">Common Challenges</h2>
          <div className="space-y-4 text-2xl text-left text-gray-300">
            <p>• Did you find yourself spending hours cobbling together "good enough" posts in online tools with generic templates?</p>
            <p>• Did you get frustrated when AI spits out gorgeous images - only to realize they don't fit Instagram, Facebook, or LinkedIn sizes?</p>
            <p>• Did you simply don't have the time and energy to master design tools or learn the art of AI prompting?</p>
            <p className="mb-6 text-transparent bg-clip-text bg-gradient-to-r from-purple-400 to-pink-400 text-1xl">AdNate combines an intuitive editor to transform your creative vision into professional-quality graphics. 
          No design experience required.</p>
          </div>
        </div>

        {/* How It Works Section */}
        <div className="py-24 mx-auto max-w-4xl text-center">
          <h2 className="mb-12 text-4xl font-semibold text-transparent bg-clip-text bg-gradient-to-r from-purple-400 to-pink-400">How It Works</h2>
          <div className="grid gap-12 md:grid-cols-3">
            <div className="flex flex-col items-center">
              <div className="flex justify-center items-center mb-4 w-16 h-16 rounded-full bg-white/10">
                <FileText className="w-8 h-8 text-purple-400" />
              </div>
              <h3 className="mb-2 text-2xl font-bold">1. Write Your Brief</h3>
              <p className="text-gray-300">Describe your vision, goals, and any text you want to include. The more detail, the better.</p>
            </div>
            <div className="flex flex-col items-center">
              <div className="flex justify-center items-center mb-4 w-16 h-16 rounded-full bg-white/10">
                <Bot className="w-8 h-8 text-purple-400" />
              </div>
              <h3 className="mb-2 text-2xl font-bold">2. AdNate Creates Visuals</h3>
              <p className="text-gray-300">We interpret your brief and generate a variety of unique, on-brand designs in minutes.</p>
            </div>
            <div className="flex flex-col items-center">
              <div className="flex justify-center items-center mb-4 w-16 h-16 rounded-full bg-white/10">
                <Brush className="w-8 h-8 text-purple-400" />
              </div>
              <h3 className="mb-2 text-2xl font-bold">3. Customize & Export</h3>
              <p className="text-gray-300">Fine-tune your favorite design with our intuitive editor, then export it for any platform.</p>
            </div>
          </div>
        </div>

        {/* Feature Showcase Section */}
        <div className="py-24 mx-auto max-w-6xl text-center">
          <h2 className="mb-12 text-4xl font-semibold text-transparent bg-clip-text bg-gradient-to-r from-purple-400 to-pink-400">Everything you need to create stunning visuals</h2>
          <div className="grid gap-12 md:grid-cols-3">
            <div className="p-8 rounded-lg bg-white/5">
              <div className="flex justify-center items-center mx-auto mb-4 w-16 h-16 rounded-full bg-white/10">
                <Zap className="w-8 h-8 text-pink-400" />
              </div>
              <h3 className="mb-2 text-2xl font-bold">AI-Powered Generation</h3>
              <p className="text-gray-300">No more blank pages. Describe your idea, and our AI will generate a variety of design options for you to choose from.</p>
            </div>
            <div className="p-8 rounded-lg bg-white/5">
              <div className="flex justify-center items-center mx-auto mb-4 w-16 h-16 rounded-full bg-white/10">
                <Palette className="w-8 h-8 text-pink-400" />
              </div>
              <h3 className="mb-2 text-2xl font-bold">Intuitive Editor</h3>
              <p className="text-gray-300">Our simple drag-and-drop editor makes it easy to customize every aspect of your design, no experience required.</p>
            </div>
            <div className="p-8 rounded-lg bg-white/5">
              <div className="flex justify-center items-center mx-auto mb-4 w-16 h-16 rounded-full bg-white/10">
                <Scaling className="w-8 h-8 text-pink-400" />
              </div>
              <h3 className="mb-2 text-2xl font-bold">Automatic Resizing</h3>
              <p className="text-gray-300">Instantly resize your designs to fit any social media platform, from Instagram Stories to LinkedIn banners.</p>
            </div>
          </div>
        </div>
        <div className="flex justify-center w-full">
          <button
              ref={ctaButtonRef}
              onClick={handleStartCreating}
              className="px-8 py-4 font-medium bg-gradient-to-r from-purple-400 to-pink-400 rounded-lg transition-all duration-300 text- hover:opacity-90">
              Start Creating Free
          </button>
        </div>
        
        {/* Gallery Section */}
        <div className="py-24 text-center">
          <h2 className="mb-12 text-4xl font-semibold text-transparent bg-clip-text bg-gradient-to-r from-purple-400 to-pink-400">From Idea to Asset, Instantly</h2>
          <div className="grid grid-cols-2 gap-4 md:grid-cols-4">
            <img src="https://picsum.photos/seed/1/600/600" alt="Generated Design 1" className="object-cover w-full h-full rounded-lg transition-transform duration-300 hover:scale-105" />
            <img src="https://picsum.photos/seed/2/600/600" alt="Generated Design 2" className="object-cover w-full h-full rounded-lg transition-transform duration-300 hover:scale-105" />
            <img src="https://picsum.photos/seed/3/600/600" alt="Generated Design 3" className="object-cover w-full h-full rounded-lg transition-transform duration-300 hover:scale-105" />
            <img src="https://picsum.photos/seed/4/600/600" alt="Generated Design 4" className="object-cover w-full h-full rounded-lg transition-transform duration-300 hover:scale-105" />
          </div>
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

        {/* Footer */}
        <footer className="py-12 mt-24 border-t border-white/10">
          <div className="flex justify-between items-center mx-auto max-w-6xl">
            <h1 className="text-2xl font-bold text-transparent bg-clip-text bg-gradient-to-r from-purple-400 to-pink-400">
              AdNate
            </h1>
            <div className="flex space-x-6 text-gray-400">
              <a href="/blog" className="hover:text-white">Blog</a>
              <a href="#" className="hover:text-white">Contact</a>
              <a href="#" className="hover:text-white">Terms of Service</a>
              <a href="#" className="hover:text-white">Privacy Policy</a>
            </div>
            <p className="text-gray-500">&copy; 2025 AdNate. All rights reserved.</p>
          </div>
        </footer>
      </div>
    </div>
  );
};

export default LandingPage;