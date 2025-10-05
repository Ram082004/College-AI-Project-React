import React, { useState } from 'react';
import axios from 'axios';
import { motion } from 'framer-motion';
import { FaCity } from 'react-icons/fa';
import { RiEyeLine, RiEyeOffLine } from 'react-icons/ri'; // Add this import
import OfficeForgotPassword from './officeforgotpassword'; // Import the component

const OfficeLogin = ({ onLoginSuccess, onBack }) => {
  const [username, setUsername] = useState('');
  const [password, setPassword] = useState('');
  const [error, setError] = useState('');
  const [isLoading, setIsLoading] = useState(false);
  const [showPassword, setShowPassword] = useState(false);
  const [isSendingPassword, setIsSendingPassword] = useState(false);
  const [successMessage, setSuccessMessage] = useState('');
  const [globalMessage, setGlobalMessage] = useState(null); // <-- Add globalMessage state
  const [showForgot, setShowForgot] = useState(false);

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

      const response = await axios.post('https://admin-back-j3j4.onrender.com/api/office/office-login', {
        username,
        password,
      }, {
        headers: { 'Content-Type': 'application/json' },
        withCredentials: true,
      });

      if (response.data.success) {
        localStorage.setItem('authToken', response.data.token);
        localStorage.setItem('officeUser', JSON.stringify(response.data.user));
        localStorage.setItem('userType', 'office');
        localStorage.setItem('officeLoginMessage', 'Login successful');
        onLoginSuccess();
      } else {
        // Check for locked message
        if (
          response.data.message &&
          response.data.message.toLowerCase().includes('locked')
        ) {
          const officeUser = response.data.user || {};
          const year = officeUser.academic_year || '2024–2025';
          setError('');
          setGlobalMessage({ type: 'error', text: `${year} Academic Year details are already finished!` }); // <-- Use toaster
        } else {
          setError(response.data.message || 'Login failed');
        }
      }
    } catch (err) {
      // Show backend error message if available
      const msg = err.response?.data?.message;
      if (msg && msg.toLowerCase().includes('locked')) {
        const officeUser = err.response?.data?.user || {};
        const year = officeUser.academic_year || '2024–2025';
        setError('');
        setGlobalMessage({ type: 'error', text: `${year} Academic Year details are already finished!` }); // <-- Use toaster
      } else if (err.code === 'ERR_NETWORK') {
        setError('Unable to connect to server. Please check your connection.');
      } else {
        setError('An Invalid username or password');
      }
    } finally {
      setIsLoading(false);
    }
  };

  // Add handleForgotPassword function
  const handleForgotPassword = async () => {
    if (!username) {
      setError('Please enter your username first');
      return;
    }
    try {
      setIsSendingPassword(true);
      setError('');
      setSuccessMessage('');
      const response = await axios.post(
        'https://admin-back-j3j4.onrender.com/api/office/office-forgot-password',
        { username },
        { headers: { 'Content-Type': 'application/json' } }
      );
      if (response.data.success) {
        setSuccessMessage('Password has been sent to your registered email');
        setTimeout(() => setSuccessMessage(''), 5000);
      }
    } catch (err) {
      if (err.response?.status === 404) {
        setError('No account found with this username');
      } else if (err.response?.status === 400) {
        setError(err.response.data.message);
      } else {
        setError('Failed to send password. Please try again.');
      }
    } finally {
      setIsSendingPassword(false);
    }
  };

  // Add this effect to auto-hide the toaster
  React.useEffect(() => {
    if (globalMessage) {
      const timer = setTimeout(() => setGlobalMessage(null), 3000);
      return () => clearTimeout(timer);
    }
  }, [globalMessage]);

  return (
    <div className="min-h-screen flex items-center justify-center">
      <div className="max-w-md w-full mx-auto px-4">
        {!showForgot ? (
          <motion.div
            initial={{ opacity: 0, scale: 0.95 }}
            animate={{ opacity: 1, scale: 1 }}
            className="bg-white/10 backdrop-blur-lg rounded-3xl p-8 shadow-2xl border border-white/20"
          >
            <div className="text-center mb-8">
              <motion.div
                initial={{ scale: 0 }}
                animate={{ scale: 1 }}
                className="w-20 h-20 bg-gradient-to-br from-cyan-600 to-teal-600 rounded-2xl mx-auto flex items-center justify-center mb-4"
              >
                <FaCity className="text-3xl text-white" />
              </motion.div>
              <h2 className="text-3xl font-bold text-white mb-2">Office Login</h2>
              <p className="text-blue-200/80">Access your office portal</p>
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

            {successMessage && (
              <motion.div
                initial={{ opacity: 0, y: -10 }}
                animate={{ opacity: 1, y: 0 }}
                className="mb-6 p-4 bg-green-500/10 border border-green-500/20 rounded-xl text-green-500 text-sm text-center"
              >
                {successMessage}
              </motion.div>
            )}

            <form onSubmit={loginHandler} className="space-y-6">
              <div>
                <label className="text-sm font-medium text-gray-300 mb-1 block">
                  Office Username
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
                      focus:outline-none focus:ring-2 focus:ring-cyan-400 text-white placeholder-gray-400
                      pr-12"
                    placeholder="Enter your password"
                    disabled={isLoading}
                    required
                  />
                  <button
                    type="button"
                    onClick={() => setShowPassword(!showPassword)}
                    className="absolute right-3 top-1/2 -translate-y-1/2 p-1
                      text-gray-400 hover:text-gray-300 transition-colors
                      focus:outline-none focus:text-cyan-400"
                  >
                    {showPassword ? (
                      <RiEyeOffLine className="text-xl" />
                    ) : (
                      <RiEyeLine className="text-xl" />
                    )}
                  </button>
                </div>
              </div>

              <div className="flex justify-end mt-2">
                <motion.button
                  type="button"
                  whileHover={{ scale: 1.02 }}
                  whileTap={{ scale: 0.98 }}
                  onClick={() => setShowForgot(true)}
                  disabled={isSendingPassword || isLoading}
                  className="text-sm text-blue-300 hover:text-blue-200 transition-colors"
                >
                  Forgot Password?
                </motion.button>
              </div>

              <motion.button
                type="submit"
                whileHover={{ scale: 1.01 }}
                whileTap={{ scale: 0.99 }}
                className="w-full py-4 bg-gradient-to-r from-cyan-600 to-teal-600
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
                  'Login to Office'
                )}
              </motion.button>

              <div className="flex justify-center pt-2">
                <motion.button
                  whileHover={{ scale: 1.02 }}
                  whileTap={{ scale: 0.98 }}
                  onClick={onBack}
                  className="text-sm text-blue-300 hover:text-blue-200 transition-colors"
                  type="button"
                >
                  ← Back to Selection
                </motion.button>
              </div>
            </form>
          </motion.div>
        ) : (
          <OfficeForgotPassword onBackToLogin={() => setShowForgot(false)} />
        )}
      </div>
    </div>
  );
};

export default OfficeLogin;