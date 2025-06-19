import React, { useState, useEffect } from 'react';
import axios from 'axios';
import { useLocation, useNavigate } from 'react-router-dom';
import { motion } from 'framer-motion';
import { FaShieldAlt } from 'react-icons/fa';
import { RiEyeLine, RiEyeOffLine } from 'react-icons/ri'; // Add this import

export default function Login({ onForgotClick, onLoginSuccess, onBack }) {
  const [username, setUsername] = useState('');
  const [password, setPassword] = useState('');
  const [error, setError] = useState('');
  const [isLoading, setIsLoading] = useState(false);
  const [showPassword, setShowPassword] = useState(false); // Add state for password visibility
  const location = useLocation();
  const navigate = useNavigate();

  useEffect(() => {
    const message = location.state?.message;
    if (message) {
      setError(message);
    }
  }, [location]);

  const loginHandler = async (e) => {
    e.preventDefault();
    
    try {
      setError('');
      setIsLoading(true);

      if (!username || !password) {
        setError('Please enter both username and password');
        setIsLoading(false);
        return;
      }

      const response = await axios.post('http://localhost:5000/api/login', {
        username,
        password
      }, {
        headers: {
          'Content-Type': 'application/json'
        },
        withCredentials: true
      });

      if (response.data.success) {
        // Clear any existing data first
        localStorage.clear();
        
        // Set new data
        localStorage.setItem('authToken', response.data.token);
        localStorage.setItem('user', JSON.stringify(response.data.user));
        localStorage.setItem('userType', 'admin');
        
        // Call success handler immediately
        setIsLoading(false);
        onLoginSuccess();
      } else {
        setError(response.data.message || 'Login failed');
        setIsLoading(false);
      }
    } catch (err) {
      if (err.code === 'ERR_NETWORK') {
        setError('Server is not responding. Please check if server is running.');
      } else if (err.response?.status === 401) {
        setError('Invalid username or password. Please try again.');
      } else if (err.response?.status === 400) {
        setError(err.response.data.message || 'Invalid input');
      } else {
        setError('An unexpected error occurred. Please try again.');
      }
      setIsLoading(false);
    }
  };

  return (
    <div className="min-h-screen flex items-center justify-center">
      <div className="max-w-md w-full mx-auto px-4">
        <motion.div
          initial={{ opacity: 0, scale: 0.95 }}
          animate={{ opacity: 1, scale: 1 }}
          className="bg-white/10 backdrop-blur-lg rounded-3xl p-8 shadow-2xl border border-white/20"
        >
          <div className="text-center mb-8">
            <motion.div
              initial={{ scale: 0 }}
              animate={{ scale: 1 }}
              className="w-20 h-20 bg-gradient-to-br from-indigo-600 to-blue-700 rounded-2xl mx-auto flex items-center justify-center mb-4"
            >
              <FaShieldAlt className="text-3xl text-white" />
            </motion.div>
            <h2 className="text-3xl font-bold text-white mb-2">Administrator Login</h2>
            <p className="text-blue-200/80">Access system management console</p>
          </div>

          {error && (
            <motion.div
              initial={{ opacity: 0, y: -10 }}
              animate={{ opacity: 1, y: 0 }}
              className="mb-6 p-4 bg-red-500/10 border border-red-500/20 rounded-xl text-red-500 text-sm text-center"
            >
              {error}
            </motion.div>
          )}

          <form onSubmit={loginHandler} className="space-y-6">
            <div>
              <label className="text-sm font-medium text-gray-300 mb-1 block">
                Admin Username
              </label>
              <input
                type="text"
                value={username}
                onChange={(e) => setUsername(e.target.value)}
                className="w-full px-4 py-3 bg-white/5 border border-white/10 rounded-xl 
                  focus:outline-none focus:ring-2 focus:ring-blue-400 text-white placeholder-gray-400"
                placeholder="Enter your username"
                disabled={isLoading}
                required
              />
            </div>

            <div>
              <label className="text-sm font-medium text-gray-300 mb-1 block">
                Password
              </label>
              <div className="relative">
                <input
                  type={showPassword ? "text" : "password"}
                  value={password}
                  onChange={(e) => setPassword(e.target.value)}
                  className="w-full px-4 py-3 bg-white/5 border border-white/10 rounded-xl 
                    focus:outline-none focus:ring-2 focus:ring-blue-400 text-white placeholder-gray-400
                    pr-12" // Add padding for the toggle button
                  placeholder="Enter your password"
                  disabled={isLoading}
                  required
                />
                <button
                  type="button"
                  onClick={() => setShowPassword(!showPassword)}
                  className="absolute right-3 top-1/2 -translate-y-1/2 p-1
                    text-gray-400 hover:text-gray-300 transition-colors
                    focus:outline-none focus:text-blue-400"
                >
                  {showPassword ? (
                    <RiEyeOffLine className="text-xl" />
                  ) : (
                    <RiEyeLine className="text-xl" />
                  )}
                </button>
              </div>
            </div>

            <motion.button
              type="submit"
              whileHover={{ scale: 1.01 }}
              whileTap={{ scale: 0.99 }}
              className="w-full py-4 bg-gradient-to-r from-indigo-600 to-blue-700
                text-white rounded-xl font-medium shadow-lg transition-all duration-200
                hover:shadow-xl disabled:opacity-50"
              disabled={isLoading}
            >
              {isLoading ? (
                <div className="flex items-center justify-center space-x-2">
                  <div className="w-5 h-5 border-t-2 border-b-2 border-white rounded-full animate-spin" />
                  <span>Logging in...</span>
                </div>
              ) : (
                'Login as Administrator'
              )}
            </motion.button>

            <div className="flex justify-between items-center pt-2">
              <motion.button
                whileHover={{ scale: 1.02 }}
                whileTap={{ scale: 0.98 }}
                onClick={onBack}
                className="text-sm text-blue-300 hover:text-blue-200 transition-colors"
                type="button"
              >
                ← Back to Selection
              </motion.button>

              <motion.button
                whileHover={{ scale: 1.02 }}
                whileTap={{ scale: 0.98 }}
                onClick={onForgotClick}
                className="text-sm text-blue-300 hover:text-blue-200 transition-colors"
                type="button"
                disabled={isLoading}
              >
                Forgot Password?
              </motion.button>
            </div>
          </form>
        </motion.div>
      </div>
    </div>
  );
}
