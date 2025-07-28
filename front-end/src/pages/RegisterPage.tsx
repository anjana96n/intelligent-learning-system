import React, { useState } from 'react';
import { Brain, GraduationCap, User, Mail, Lock, Eye, EyeOff, BookOpen, Users } from 'lucide-react';
import { Link } from 'react-router-dom';

export default function RegisterPage() {
  const [showPassword, setShowPassword] = useState(false);
  const [showConfirmPassword, setShowConfirmPassword] = useState(false);
  const [formData, setFormData] = useState({
    name: '',
    email: '',
    password: '',
    confirmPassword: '',
    role: 'student'
  });

  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    // Handle registration logic here
  };

  const handleInputChange = (e: React.ChangeEvent<HTMLInputElement | HTMLSelectElement>) => {
    setFormData({
      ...formData,
      [e.target.name]: e.target.value
    });
  };

  return (
    <div className="min-h-screen relative overflow-hidden">
      {/* Animated Background */}
      <div className="absolute inset-0 bg-gradient-to-br from-indigo-900 via-purple-900 to-pink-900">
        <div className="absolute inset-0 bg-black/20"></div>
        
        {/* Floating Elements */}
        <div className="absolute top-20 left-10 w-20 h-20 bg-white/10 rounded-full blur-xl animate-pulse"></div>
        <div className="absolute top-40 right-20 w-32 h-32 bg-purple-400/20 rounded-full blur-xl animate-pulse delay-1000"></div>
        <div className="absolute bottom-20 left-1/4 w-24 h-24 bg-pink-400/20 rounded-full blur-xl animate-pulse delay-2000"></div>
        <div className="absolute bottom-40 right-1/3 w-16 h-16 bg-indigo-400/20 rounded-full blur-xl animate-pulse delay-3000"></div>
        
        {/* Grid Pattern */}
        <div className="absolute inset-0 opacity-10">
          <div className="absolute inset-0" style={{
            backgroundImage: `url("data:image/svg+xml,%3Csvg width='60' height='60' viewBox='0 0 60 60' xmlns='http://www.w3.org/2000/svg'%3E%3Cg fill='none' fill-rule='evenodd'%3E%3Cg fill='%23ffffff' fill-opacity='0.1'%3E%3Ccircle cx='30' cy='30' r='1'/%3E%3C/g%3E%3C/g%3E%3C/svg%3E")`,
          }}></div>
        </div>
      </div>

      {/* Content */}
      <div className="relative z-10 min-h-screen flex items-center justify-center p-4">
        <div className="w-full max-w-lg">
          {/* Header */}
          <div className="text-center mb-8">
            <div className="flex justify-center items-center space-x-3 mb-4">
              <div className="relative">
                <Brain className="h-12 w-12 text-white" />
                <GraduationCap className="h-8 w-8 text-purple-300 absolute -top-2 -right-2" />
              </div>
            </div>
            <h1 className="text-4xl font-bold text-white mb-2">JoyStudy</h1>
            <p className="text-purple-100 text-lg">Join the Future of Learning</p>
          </div>

          {/* Register Form */}
          <div className="backdrop-blur-xl bg-white/10 rounded-2xl border border-white/20 shadow-2xl p-8">
            <h2 className="text-2xl font-semibold text-white text-center mb-6">
              Create Your Account
            </h2>
            
            <form onSubmit={handleSubmit} className="space-y-6">
              {/* Full Name Field */}
              <div className="space-y-2">
                <label htmlFor="name" className="block text-sm font-medium text-purple-100">
                  Full Name
                </label>
                <div className="relative">
                  <input
                    id="name"
                    name="name"
                    type="text"
                    value={formData.name}
                    onChange={handleInputChange}
                    className="w-full px-4 py-3 pl-12 bg-white/10 border border-white/20 rounded-lg text-white placeholder-purple-200 focus:outline-none focus:ring-2 focus:ring-purple-400 focus:border-transparent transition-all duration-200"
                    placeholder="Enter your full name"
                    required
                  />
                  <User className="absolute left-4 top-1/2 transform -translate-y-1/2 h-5 w-5 text-purple-200" />
                </div>
              </div>

              {/* Email Field */}
              <div className="space-y-2">
                <label htmlFor="email" className="block text-sm font-medium text-purple-100">
                  Email Address
                </label>
                <div className="relative">
                  <input
                    id="email"
                    name="email"
                    type="email"
                    value={formData.email}
                    onChange={handleInputChange}
                    className="w-full px-4 py-3 pl-12 bg-white/10 border border-white/20 rounded-lg text-white placeholder-purple-200 focus:outline-none focus:ring-2 focus:ring-purple-400 focus:border-transparent transition-all duration-200"
                    placeholder="Enter your email"
                    required
                  />
                  <Mail className="absolute left-4 top-1/2 transform -translate-y-1/2 h-5 w-5 text-purple-200" />
                </div>
              </div>

              {/* Password Field */}
              <div className="space-y-2">
                <label htmlFor="password" className="block text-sm font-medium text-purple-100">
                  Password
                </label>
                <div className="relative">
                  <input
                    id="password"
                    name="password"
                    type={showPassword ? "text" : "password"}
                    value={formData.password}
                    onChange={handleInputChange}
                    className="w-full px-4 py-3 pl-12 pr-12 bg-white/10 border border-white/20 rounded-lg text-white placeholder-purple-200 focus:outline-none focus:ring-2 focus:ring-purple-400 focus:border-transparent transition-all duration-200"
                    placeholder="Create a password"
                    required
                  />
                  <Lock className="absolute left-4 top-1/2 transform -translate-y-1/2 h-5 w-5 text-purple-200" />
                  <button
                    type="button"
                    onClick={() => setShowPassword(!showPassword)}
                    className="absolute right-4 top-1/2 transform -translate-y-1/2 text-purple-200 hover:text-white transition-colors"
                  >
                    {showPassword ? <EyeOff className="h-5 w-5" /> : <Eye className="h-5 w-5" />}
                  </button>
                </div>
              </div>

              {/* Confirm Password Field */}
              <div className="space-y-2">
                <label htmlFor="confirmPassword" className="block text-sm font-medium text-purple-100">
                  Confirm Password
                </label>
                <div className="relative">
                  <input
                    id="confirmPassword"
                    name="confirmPassword"
                    type={showConfirmPassword ? "text" : "password"}
                    value={formData.confirmPassword}
                    onChange={handleInputChange}
                    className="w-full px-4 py-3 pl-12 pr-12 bg-white/10 border border-white/20 rounded-lg text-white placeholder-purple-200 focus:outline-none focus:ring-2 focus:ring-purple-400 focus:border-transparent transition-all duration-200"
                    placeholder="Confirm your password"
                    required
                  />
                  <Lock className="absolute left-4 top-1/2 transform -translate-y-1/2 h-5 w-5 text-purple-200" />
                  <button
                    type="button"
                    onClick={() => setShowConfirmPassword(!showConfirmPassword)}
                    className="absolute right-4 top-1/2 transform -translate-y-1/2 text-purple-200 hover:text-white transition-colors"
                  >
                    {showConfirmPassword ? <EyeOff className="h-5 w-5" /> : <Eye className="h-5 w-5" />}
                  </button>
                </div>
              </div>

              {/* Role Selection */}
              <div className="space-y-2">
                <label htmlFor="role" className="block text-sm font-medium text-purple-100">
                  I am a
                </label>
                <div className="grid grid-cols-2 gap-3">
                  <label className="relative">
                    <input
                      type="radio"
                      name="role"
                      value="student"
                      checked={formData.role === 'student'}
                      onChange={handleInputChange}
                      className="sr-only"
                    />
                    <div className={`flex items-center justify-center p-4 rounded-lg border-2 cursor-pointer transition-all duration-200 ${
                      formData.role === 'student' 
                        ? 'border-purple-400 bg-purple-400/20' 
                        : 'border-white/20 bg-white/10 hover:bg-white/20'
                    }`}>
                      <BookOpen className="h-5 w-5 mr-2 text-purple-200" />
                      <span className="text-purple-100 font-medium">Student</span>
                    </div>
                  </label>
                  <label className="relative">
                    <input
                      type="radio"
                      name="role"
                      value="teacher"
                      checked={formData.role === 'teacher'}
                      onChange={handleInputChange}
                      className="sr-only"
                    />
                    <div className={`flex items-center justify-center p-4 rounded-lg border-2 cursor-pointer transition-all duration-200 ${
                      formData.role === 'teacher' 
                        ? 'border-purple-400 bg-purple-400/20' 
                        : 'border-white/20 bg-white/10 hover:bg-white/20'
                    }`}>
                      <Users className="h-5 w-5 mr-2 text-purple-200" />
                      <span className="text-purple-100 font-medium">Teacher</span>
                    </div>
                  </label>
                </div>
              </div>

              {/* Terms and Conditions */}
              <div className="flex items-start">
                <input
                  type="checkbox"
                  id="terms"
                  className="mt-1 rounded border-white/20 bg-white/10 text-purple-400 focus:ring-purple-400"
                  required
                />
                <label htmlFor="terms" className="ml-2 text-sm text-purple-100">
                  I agree to the{' '}
                  <Link to="/terms" className="text-purple-300 hover:text-white underline">
                    Terms of Service
                  </Link>{' '}
                  and{' '}
                  <Link to="/privacy" className="text-purple-300 hover:text-white underline">
                    Privacy Policy
                  </Link>
                </label>
              </div>

              {/* Submit Button */}
              <button
                type="submit"
                className="w-full bg-gradient-to-r from-purple-500 to-pink-600 hover:from-purple-600 hover:to-pink-700 text-white font-semibold py-3 px-4 rounded-lg transition-all duration-200 transform hover:scale-105 focus:outline-none focus:ring-2 focus:ring-purple-400 focus:ring-offset-2 focus:ring-offset-transparent"
              >
                Create Account
              </button>

              {/* Sign In Link */}
              <div className="text-center">
                <p className="text-purple-100">
                  Already have an account?{' '}
                  <Link to="/login" className="text-purple-300 hover:text-white font-semibold transition-colors">
                    Sign in
                  </Link>
                </p>
              </div>
            </form>
          </div>
        </div>
      </div>
    </div>
  );
} 