// src/components/LoginPage.tsx - User-friendly redesign
import React, { useState } from 'react';
import { Eye, EyeOff, Mail, Lock, ArrowRight } from 'lucide-react';

interface LoginPageProps {
  onLogin: (email: string, password: string) => void;
}

const LoginPage: React.FC<LoginPageProps> = ({ onLogin }) => {
  const [email, setEmail] = useState('');
  const [password, setPassword] = useState('');
  const [showPassword, setShowPassword] = useState(false);
  const [isLoading, setIsLoading] = useState(false);

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setIsLoading(true);
    
    // Simulate login delay
    await new Promise(resolve => setTimeout(resolve, 1000));
    
    onLogin(email, password);
    setIsLoading(false);
  };

  const handleDemoLogin = (email: string, password: string) => {
    setEmail(email);
    setPassword(password);
    // Auto-submit after a brief moment
    setTimeout(() => {
      onLogin(email, password);
    }, 500);
  };

  return (
    <div className="min-h-screen bg-gradient-to-br from-blue-400 via-purple-500 to-indigo-600 flex items-center justify-center px-4">
      {/* Floating elements for visual appeal */}
      <div className="absolute inset-0 overflow-hidden pointer-events-none">
        <div className="absolute top-20 left-20 w-32 h-32 bg-white opacity-10 rounded-full animate-float"></div>
        <div className="absolute bottom-20 right-20 w-24 h-24 bg-white opacity-10 rounded-full animate-bounce"></div>
        <div className="absolute top-1/2 left-10 w-16 h-16 bg-white opacity-10 rounded-full animate-pulse"></div>
      </div>

      <div className="w-full max-w-md relative">
        {/* Main Login Card */}
        <div className="bg-white rounded-3xl shadow-2xl p-8 backdrop-blur-sm">
          {/* Logo and Header */}
          <div className="text-center mb-8">
            <div className="inline-flex items-center justify-center w-16 h-16 rounded-2xl overflow-hidden mb-6 shadow-lg bg-gradient-to-r from-blue-500 to-purple-600">
              <img
                src="/brainstorm1.png"
                alt="CalmPulse Logo"
                className="w-10 h-10 object-contain"
              />
            </div>

            <h1 className="text-3xl font-bold text-gray-900 mb-2">Welcome to CalmPulse</h1>
            <p className="text-gray-600">Sign in to continue your emotional wellness journey</p>
          </div>

          {/* Login Form */}
          <form onSubmit={handleSubmit} className="space-y-6">
            {/* Email Field */}
            <div className="space-y-2">
              <label htmlFor="email" className="text-sm font-medium text-gray-700">
                Email
              </label>
              <div className="relative">
                <input
                  id="email"
                  type="email"
                  value={email}
                  onChange={(e) => setEmail(e.target.value)}
                  required
                  className="w-full px-4 py-4 bg-gray-50 border border-gray-200 rounded-xl focus:ring-2 focus:ring-blue-500 focus:border-transparent transition-all placeholder-gray-400"
                  placeholder="Enter your email address"
                />
                <Mail className="absolute right-4 top-4 h-5 w-5 text-gray-400" />
              </div>
            </div>

            {/* Password Field */}
            <div className="space-y-2">
              <label htmlFor="password" className="text-sm font-medium text-gray-700">
                Password
              </label>
              <div className="relative">
                <input
                  id="password"
                  type={showPassword ? 'text' : 'password'}
                  value={password}
                  onChange={(e) => setPassword(e.target.value)}
                  required
                  className="w-full px-4 py-4 bg-gray-50 border border-gray-200 rounded-xl focus:ring-2 focus:ring-blue-500 focus:border-transparent transition-all placeholder-gray-400"
                  placeholder="Enter your password"
                />
                <button
                  type="button"
                  onClick={() => setShowPassword(!showPassword)}
                  className="absolute right-4 top-4 text-gray-400 hover:text-gray-600"
                >
                  {showPassword ? <EyeOff className="h-5 w-5" /> : <Eye className="h-5 w-5" />}
                </button>
              </div>
            </div>

            {/* Forgot Password */}
            <div className="text-right">
              <button
                type="button"
                className="text-sm text-blue-600 hover:text-blue-700 font-medium"
              >
                Forgot your password?
              </button>
            </div>

            {/* Login Button */}
            <button
              type="submit"
              disabled={isLoading || !email || !password}
              className="w-full bg-gradient-to-r from-blue-600 to-purple-600 text-white py-4 px-6 rounded-xl font-semibold shadow-lg hover:shadow-xl transform hover:-translate-y-0.5 transition-all duration-200 disabled:opacity-50 disabled:cursor-not-allowed disabled:transform-none flex items-center justify-center"
            >
              {isLoading ? (
                <div className="animate-spin rounded-full h-5 w-5 border-2 border-white border-t-transparent"></div>
              ) : (
                <>
                  Sign In
                  <ArrowRight className="ml-2 h-5 w-5" />
                </>
              )}
            </button>
          </form>

          {/* Divider */}
          <div className="relative my-8">
            <div className="absolute inset-0 flex items-center">
              <div className="w-full border-t border-gray-200"></div>
            </div>
            <div className="relative flex justify-center text-sm">
              <span className="px-4 bg-white text-gray-500">Or try a demo</span>
            </div>
          </div>

          {/* Demo Login Options */}
          <div className="space-y-3">
            <button
              type="button"
              onClick={() => handleDemoLogin('demo@patient.com', 'demo123')}
              className="w-full bg-blue-50 hover:bg-blue-100 text-blue-700 py-3 px-4 rounded-xl font-medium transition-colors border border-blue-200"
            >
              🧑‍🦱 Demo as Individual User
            </button>
            
            <button
              type="button"
              onClick={() => handleDemoLogin('demo@caregiver.com', 'demo123')}
              className="w-full bg-green-50 hover:bg-green-100 text-green-700 py-3 px-4 rounded-xl font-medium transition-colors border border-green-200"
            >
              👨‍👩‍👧‍👦 Demo as Family Caregiver
            </button>
            
            <button
              type="button"
              onClick={() => handleDemoLogin('demo@professional.com', 'demo123')}
              className="w-full bg-purple-50 hover:bg-purple-100 text-purple-700 py-3 px-4 rounded-xl font-medium transition-colors border border-purple-200"
            >
              👩‍⚕️ Demo as Healthcare Professional
            </button>
          </div>

          {/* Sign Up Link */}
          <div className="mt-8 text-center">
            <p className="text-gray-600">
              New to CalmPulse?{' '}
              <button className="text-blue-600 hover:text-blue-700 font-semibold">
                Create an account
              </button>
            </p>
          </div>
        </div>

        {/* Bottom Info */}
        <div className="mt-8 text-center">
          <p className="text-white text-sm opacity-90">
            🔒 Your privacy and data security are our top priority
          </p>
        </div>
      </div>
    </div>
  );
};

export default LoginPage;


