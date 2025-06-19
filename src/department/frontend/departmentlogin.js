import React, { useState } from 'react';
import axios from 'axios';
import { motion } from 'framer-motion';
import { FaBuilding } from 'react-icons/fa';
import { RiEyeLine, RiEyeOffLine } from 'react-icons/ri';

const DepartmentLogin = ({ onLoginSuccess, onBack }) => {
  const [username, setUsername] = useState('');
  const [password, setPassword] = useState('');
  const [error, setError] = useState('');
  const [isLoading, setIsLoading] = useState(false);
  const [showPassword, setShowPassword] = useState(false);
  const [isLocked, setIsLocked] = useState(false);

  const loginHandler = async (e) => {
    e.preventDefault();
    setError('');
    setIsLoading(true);

    try {
      if (!username || !password) {
        setError('Please enter both username and password');
        setIsLoading(false);
        return;
      }

      const response = await axios.post('http://localhost:5000/api/department-login', {
        username,
        password,
      }, {
        headers: { 'Content-Type': 'application/json' },
        withCredentials: true,
      });

      if (response.data.success) {
        localStorage.setItem('authToken', response.data.token);
        localStorage.setItem('departmentUser', JSON.stringify(response.data.user));
        onLoginSuccess();
      } else {
        setError(response.data.message || 'Login failed');
        if (
          response.data.message &&
          response.data.message.toLowerCase().includes('locked')
        ) {
          setIsLocked(true);
        }
      }
    } catch (err) {
      // Handle backend error with lock message
      const msg = err.response?.data?.message;
      if (msg && msg.toLowerCase().includes('locked')) {
        setError(msg);
        setIsLocked(true);
      } else {
        setError('An error occurred. Please try again.');
      }
    } finally {
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
              className="w-20 h-20 bg-gradient-to-br from-blue-600 to-cyan-600 rounded-2xl mx-auto flex items-center justify-center mb-4"
            >
              <FaBuilding className="text-3xl text-white" />
            </motion.div>
            <h2 className="text-3xl font-bold text-white mb-2">Department Login</h2>
            <p className="text-blue-200/80">Access your department portal</p>
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
                Department Username
              </label>
              <input
                type="text"
                value={username}
                onChange={(e) => setUsername(e.target.value)}
                className="w-full px-4 py-3 bg-white/5 border border-white/10 rounded-xl 
                  focus:outline-none focus:ring-2 focus:ring-blue-400 text-white placeholder-gray-400"
                placeholder="Enter your username"
                disabled={isLoading || isLocked}
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
                    pr-12"
                  placeholder="Enter your password"
                  disabled={isLoading || isLocked}
                  required
                />
                <button
                  type="button"
                  onClick={() => setShowPassword(!showPassword)}
                  className="absolute right-3 top-1/2 -translate-y-1/2 p-1
                    text-gray-400 hover:text-gray-300 transition-colors
                    focus:outline-none focus:text-blue-400"
                  tabIndex={-1}
                  disabled={isLocked}
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
              className="w-full py-4 bg-gradient-to-r from-blue-600 to-cyan-600
                text-white rounded-xl font-medium shadow-lg transition-all duration-200
                hover:shadow-xl disabled:opacity-50"
              disabled={isLoading || isLocked}
            >
              {isLoading ? (
                <div className="flex items-center justify-center space-x-2">
                  <div className="w-5 h-5 border-t-2 border-b-2 border-white rounded-full animate-spin" />
                  <span>Logging in...</span>
                </div>
              ) : (
                isLocked ? 'Account Locked' : 'Login to Department'
              )}
            </motion.button>

            <div className="flex justify-center pt-2">
              <motion.button
                whileHover={{ scale: 1.02 }}
                whileTap={{ scale: 0.98 }}
                onClick={onBack}
                className="text-sm text-blue-300 hover:text-blue-200 transition-colors"
                type="button"
                disabled={isLoading}
              >
                ← Back to Selection
              </motion.button>
            </div>
          </form>
        </motion.div>
      </div>
    </div>
  );
};

export default DepartmentLogin;