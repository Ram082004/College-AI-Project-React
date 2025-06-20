import React, { useState, useEffect } from 'react';
import axios from 'axios';
import { motion, AnimatePresence } from 'framer-motion';
import { FaShieldAlt, FaLock, FaKey } from 'react-icons/fa';

const API_BASE_URL = 'http://localhost:5000/api';

const Toast = ({ message, type, onClose }) => (
  <motion.div
    initial={{ opacity: 0, y: 50 }}
    animate={{ opacity: 1, y: 0 }}
    exit={{ opacity: 0, y: 20 }}
    className={`fixed bottom-4 right-4 p-4 rounded-lg shadow-lg flex items-center space-x-2
      ${type === 'success' ? 'bg-green-500/90' : 'bg-red-500/90'} backdrop-blur-sm text-white`}
  >
    <div className="flex-1">{message}</div>
    <button onClick={onClose} className="text-white/80 hover:text-white">✕</button>
  </motion.div>
);

const PasswordStrengthIndicator = ({ password }) => {
  const requirements = [
    { label: '8+ Characters', test: pwd => pwd.length >= 8 },
    { label: 'Uppercase', test: pwd => /[A-Z]/.test(pwd) },
    { label: 'Lowercase', test: pwd => /[a-z]/.test(pwd) },
    { label: 'Number', test: pwd => /\d/.test(pwd) },
    { label: 'Special Char', test: pwd => /[!@#$%^&*(),.?":{}|<>]/.test(pwd) }
  ];

  return (
    <div className="mt-4 bg-white/5 rounded-xl p-4 backdrop-blur-sm border border-white/10">
      <div className="grid grid-cols-2 gap-3">
        {requirements.map(({ label, test }) => (
          <motion.div
            key={label}
            initial={{ opacity: 0, x: -20 }}
            animate={{ opacity: 1, x: 0 }}
            className={`flex items-center space-x-2 transition-colors duration-200
              ${test(password) ? 'text-green-400' : 'text-gray-400'}`}
          >
            <div className={`w-5 h-5 rounded-full flex items-center justify-center
              ${test(password) ? 'bg-green-400/20' : 'bg-gray-500/20'}`}
            >
              {test(password) ? '✓' : '·'}
            </div>
            <span className="text-sm font-medium">{label}</span>
          </motion.div>
        ))}
      </div>
    </div>
  );
};

export default function ForgotPassword({ onBackToLogin }) {
  const [step, setStep] = useState(1);
  const [otp, setOtp] = useState('');
  const [newPassword, setNewPassword] = useState('');
  const [confirmPassword, setConfirmPassword] = useState('');
  const [isLoading, setIsLoading] = useState(false);
  const [error, setError] = useState('');
  const [resendTimer, setResendTimer] = useState(0);
  const [maskedEmail, setMaskedEmail] = useState('');
  const [toast, setToast] = useState({ show: false, message: '', type: 'success' });

  // Timer for OTP resend
  useEffect(() => {
    if (resendTimer > 0) {
      const timer = setInterval(() => {
        setResendTimer(prev => prev - 1);
      }, 1000);
      return () => clearInterval(timer);
    }
  }, [resendTimer]);

  // Update the validatePassword function
  const validatePassword = (password) => {
    const minLength = 8;
    const hasUpperCase = /[A-Z]/.test(password);
    const hasLowerCase = /[a-z]/.test(password);
    const hasNumber = /\d/.test(password);
    const hasSpecialChar = /[!@#$%^&*(),.?":{}|<>]/.test(password);

    const errors = [];
    
    if (password.length < minLength) {
      errors.push(`At least ${minLength} characters`);
    }
    if (!hasUpperCase) {
      errors.push('One uppercase letter');
    }
    if (!hasLowerCase) {
      errors.push('One lowercase letter');
    }
    if (!hasNumber) {
      errors.push('One number');
    }
    if (!hasSpecialChar) {
      errors.push('One special character');
    }

    return {
      isValid: errors.length === 0,
      errors: errors
    };
  };

  // Show toast message
  const showToast = (message, type = 'success') => {
    setToast({ show: true, message, type });
    setTimeout(() => setToast({ show: false, message: '', type: 'success' }), 3000);
  };

  const sendOtp = async () => {
    try {
      setIsLoading(true);
      setError('');

      const response = await axios.post(
        `${API_BASE_URL}/forgot-password`,
        {},
        { 
          headers: { 'Content-Type': 'application/json' },
          withCredentials: true,
          timeout: 10000 // 10 second timeout
        }
      );

      if (response.data.success) {
        setMaskedEmail(response.data.maskedEmail);
        setStep(2);
        setError('');
        setResendTimer(60); // Start 60 second timer
      }
    } catch (err) {
      console.error('Send OTP error:', err);
      setError(err.response?.data?.message || 
        'Failed to send reset code. Please try again later.');
    } finally {
      setIsLoading(false);
    }
  };

  const verifyOtp = async () => {
    try {
      if (!/^\d{6}$/.test(otp)) {
        setError('Please enter a valid 6-digit OTP');
        return;
      }

      setIsLoading(true);
      setError('');

      const response = await axios.post(
        `${API_BASE_URL}/verify-otp`,
        { otp },
        { 
          headers: { 'Content-Type': 'application/json' },
          withCredentials: true,
          timeout: 10000
        }
      );

      if (response.data.success) {
        setStep(3);
        setError('');
      }
    } catch (err) {
      setError(err.response?.data?.message || 'Invalid or expired OTP');
    } finally {
      setIsLoading(false);
    }
  };

  // Update resetPassword function
  const resetPassword = async () => {
    try {
      const validationResult = validatePassword(newPassword);
      
      if (!validationResult.isValid) {
        showToast(`Password requirements missing: ${validationResult.errors.join(', ')}`, 'error');
        return;
      }

      if (newPassword !== confirmPassword) {
        showToast('Passwords do not match', 'error');
        return;
      }

      setIsLoading(true);

      const response = await axios.post(
        `${API_BASE_URL}/reset-password`,
        { otp, newPassword },
        { 
          headers: { 'Content-Type': 'application/json' },
          withCredentials: true,
          timeout: 10000
        }
      );

      if (response.data.success) {
        showToast('Password reset successful! Redirecting to login...', 'success');
        setTimeout(onBackToLogin, 2000);
      }
    } catch (err) {
      showToast(err.response?.data?.message || 'Failed to reset password', 'error');
    } finally {
      setIsLoading(false);
    }
  };

  return (
    <div className="max-w-md w-full mx-auto">
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
            {step === 1 && <FaShieldAlt className="text-3xl text-white" />}
            {step === 2 && <FaKey className="text-3xl text-white" />}
            {step === 3 && <FaLock className="text-3xl text-white" />}
          </motion.div>
          <h2 className="text-3xl font-bold text-white mb-2">Reset Password</h2>
          <p className="text-blue-200/80">
            {step === 1 && "We'll send a reset code to your email"}
            {step === 2 && `Enter the code sent to ${maskedEmail}`}
            {step === 3 && "Create your new password"}
          </p>
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

        <AnimatePresence mode="wait">
          <motion.div
            key={step}
            initial={{ opacity: 0, y: 20 }}
            animate={{ opacity: 1, y: 0 }}
            exit={{ opacity: 0, y: -20 }}
            className="space-y-6"
          >
            {/* Step 1: Send OTP */}
            {step === 1 && (
              <motion.button
                whileHover={{ scale: 1.01 }}
                whileTap={{ scale: 0.99 }}
                onClick={sendOtp}
                disabled={isLoading}
                className="w-full py-4 bg-gradient-to-r from-indigo-600 to-blue-700
                  text-white rounded-xl font-medium shadow-lg transition-all duration-200
                  hover:shadow-xl disabled:opacity-50"
              >
                {isLoading ? (
                  <div className="flex items-center justify-center space-x-2">
                    <div className="w-5 h-5 border-t-2 border-b-2 border-white rounded-full animate-spin" />
                    <span>Sending Code...</span>
                  </div>
                ) : (
                  'Send Reset Code'
                )}
              </motion.button>
            )}

            {/* Step 2: Verify OTP */}
            {step === 2 && (
              <div className="space-y-6">
                <div className="flex justify-center space-x-3">
                  {Array.from({ length: 6 }).map((_, index) => (
                    <motion.input
                      key={index}
                      initial={{ scale: 0, opacity: 0 }}
                      animate={{ scale: 1, opacity: 1 }}
                      transition={{ delay: index * 0.1 }}
                      type="text"
                      maxLength={1}
                      className="w-12 h-12 text-center text-2xl font-bold rounded-xl 
                        bg-white/5 border border-white/10 text-white
                        focus:border-blue-500 focus:outline-none transition-colors"
                      value={otp[index] || ''}
                      onChange={(e) => {
                        const newOtp = otp.split('');
                        newOtp[index] = e.target.value;
                        setOtp(newOtp.join(''));
                        if (e.target.value && e.target.nextSibling) {
                          e.target.nextSibling.focus();
                        }
                      }}
                    />
                  ))}
                </div>

                <motion.button
                  whileHover={{ scale: 1.01 }}
                  whileTap={{ scale: 0.99 }}
                  onClick={verifyOtp}
                  disabled={isLoading || otp.length !== 6}
                  className="w-full py-4 bg-gradient-to-r from-indigo-600 to-blue-700
                    text-white rounded-xl font-medium shadow-lg transition-all duration-200
                    hover:shadow-xl disabled:opacity-50"
                >
                  {isLoading ? 'Verifying...' : 'Verify Code'}
                </motion.button>

                <div className="text-center">
                  {resendTimer > 0 ? (
                    <p className="text-gray-400">
                      Resend code in {resendTimer}s
                    </p>
                  ) : (
                    <button
                      onClick={sendOtp}
                      className="text-blue-300 hover:text-blue-200 transition-colors text-sm"
                    >
                      Resend Code
                    </button>
                  )}
                </div>
              </div>
            )}

            {/* Step 3: New Password */}
            {step === 3 && (
              <div className="space-y-6">
                <div className="space-y-4">
                  <div>
                    <label className="text-sm font-medium text-gray-300 mb-1 block">
                      New Password
                    </label>
                    <input
                      type="password"
                      placeholder="Enter new password"
                      className="w-full px-4 py-3 bg-white/5 border border-white/10 rounded-xl 
                        focus:outline-none focus:ring-2 focus:ring-blue-400 text-white placeholder-gray-400"
                      onChange={(e) => setNewPassword(e.target.value)}
                    />
                  </div>
                  <PasswordStrengthIndicator password={newPassword} />
                </div>

                <div>
                  <label className="text-sm font-medium text-gray-300 mb-1 block">
                    Confirm Password
                  </label>
                  <input
                    type="password"
                    placeholder="Confirm new password"
                    className={`w-full px-4 py-3 bg-white/5 border ${
                      confirmPassword 
                        ? confirmPassword === newPassword 
                          ? 'border-green-500' 
                          : 'border-red-500'
                        : 'border-white/10'
                    } rounded-xl focus:outline-none focus:ring-2 focus:ring-blue-400 
                      text-white placeholder-gray-400`}
                    onChange={(e) => setConfirmPassword(e.target.value)}
                  />
                </div>

                <motion.button
                  whileHover={{ scale: 1.01 }}
                  whileTap={{ scale: 0.99 }}
                  onClick={resetPassword}
                  disabled={isLoading || !newPassword || !confirmPassword}
                  className="w-full py-4 bg-gradient-to-r from-indigo-600 to-blue-700
                    text-white rounded-xl font-medium shadow-lg transition-all duration-200
                    hover:shadow-xl disabled:opacity-50"
                >
                  {isLoading ? (
                    <div className="flex items-center justify-center space-x-2">
                      <div className="w-5 h-5 border-t-2 border-b-2 border-white rounded-full animate-spin" />
                      <span>Resetting Password...</span>
                    </div>
                  ) : (
                    'Reset Password'
                  )}
                </motion.button>
              </div>
            )}
          </motion.div>
        </AnimatePresence>

        <div className="pt-4 text-center">
          <motion.button
            whileHover={{ scale: 1.02 }}
            whileTap={{ scale: 0.98 }}
            onClick={onBackToLogin}
            className="text-sm text-blue-300 hover:text-blue-200 transition-colors"
          >
            ← Back to Login
          </motion.button>
        </div>
      </motion.div>

      {/* Toast Notifications */}
      <AnimatePresence>
        {toast.show && (
          <Toast
            message={toast.message}
            type={toast.type}
            onClose={() => setToast({ show: false, message: '', type: 'success' })}
          />
        )}
      </AnimatePresence>
    </div>
  );
}
