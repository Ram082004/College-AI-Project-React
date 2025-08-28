import React, { useState, useRef, useEffect } from 'react';
import axios from 'axios';
import { motion, AnimatePresence } from 'framer-motion';
import { FaGraduationCap, FaKey, FaLock } from 'react-icons/fa';
import { RiEyeLine, RiEyeOffLine } from 'react-icons/ri';

const API_BASE_URL = 'http://localhost:5000/api';

const Toast = ({ message, type, onClose }) => (
  <motion.div
    initial={{ opacity: 0, y: -20 }}
    animate={{ opacity: 1, y: 0 }}
    exit={{ opacity: 0, y: -10 }}
    className={`fixed top-4 right-4 z-50 p-4 rounded-lg shadow-lg flex items-center space-x-3
      ${type === 'success' ? 'bg-green-600/90' : 'bg-red-600/90'} backdrop-blur-sm text-white max-w-xs`}
  >
    <div className="flex-1 text-sm">{message}</div>
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
          <motion.div key={label} initial={{ opacity: 0, x: -20 }} animate={{ opacity: 1, x: 0 }}
            className={`flex items-center space-x-2 ${test(password) ? 'text-green-400' : 'text-gray-400'}`}>
            <div className={`w-5 h-5 rounded-full flex items-center justify-center ${test(password) ? 'bg-green-400/20' : 'bg-gray-500/20'}`}>
              {test(password) ? '✓' : '·'}
            </div>
            <span className="text-sm font-medium">{label}</span>
          </motion.div>
        ))}
      </div>
    </div>
  );
};

export default function PrincipleForgotPassword({ onBackToLogin }) {
  const [step, setStep] = useState(1);
  const [email, setEmail] = useState('');
  const [otp, setOtp] = useState('');
  const [newPassword, setNewPassword] = useState('');
  const [confirmPassword, setConfirmPassword] = useState('');
  const [isLoading, setIsLoading] = useState(false);
  const [resendTimer, setResendTimer] = useState(0);
  const [maskedEmail, setMaskedEmail] = useState('');
  const [toast, setToast] = useState({ show: false, message: '', type: 'success' });
  const [showNewPassword, setShowNewPassword] = useState(false);
  const [showConfirmPassword, setShowConfirmPassword] = useState(false);
  const otpRefs = useRef([]);

  useEffect(() => {
    if (resendTimer > 0) {
      const t = setInterval(() => setResendTimer(prev => prev - 1), 1000);
      return () => clearInterval(t);
    }
  }, [resendTimer]);

  const showToast = (message, type = 'success') => {
    setToast({ show: true, message, type });
    setTimeout(() => setToast({ show: false, message: '', type: 'success' }), 4000);
  };

  const sendOtp = async () => {
    if (!email) { showToast('Please enter your email', 'error'); return; }
    setIsLoading(true);
    try {
      const res = await axios.post(`${API_BASE_URL}/principle/forgot-password`, { email: email.trim().toLowerCase() });
      if (res.data.success) {
        setMaskedEmail(res.data.maskedEmail || '');
        setStep(2);
        setResendTimer(60);
        showToast('Reset code sent to ' + (res.data.maskedEmail || 'your email'), 'success');
      } else {
        showToast(res.data.message || 'Failed to send reset code', 'error');
      }
    } catch (err) {
      showToast(err.response?.data?.message || 'Failed to send reset code. Please try again.', 'error');
    } finally { setIsLoading(false); }
  };

  const handleOtpInput = (index, value) => {
    const digit = value.replace(/\D/g, '').slice(-1);
    const arr = (otp || '').split('').slice(0, 6);
    while (arr.length < 6) arr.push('');
    arr[index] = digit || '';
    setOtp(arr.join(''));
    if (digit && index < 5) otpRefs.current[index + 1]?.focus();
  };
  const handleOtpKeyDown = (index, e) => {
    if (e.key === 'Backspace' && !(otp[index]) && index > 0) otpRefs.current[index - 1]?.focus();
    if (e.key === 'ArrowLeft' && index > 0) otpRefs.current[index - 1]?.focus();
    if (e.key === 'ArrowRight' && index < 5) otpRefs.current[index + 1]?.focus();
  };
  const handleOtpPaste = (e) => {
    const pasted = e.clipboardData.getData('text').replace(/\D/g, '').slice(0, 6);
    if (!pasted) return;
    const arr = pasted.split('');
    while (arr.length < 6) arr.push('');
    setOtp(arr.join(''));
    setTimeout(() => otpRefs.current[Math.min(pasted.length, 5)]?.focus(), 0);
    e.preventDefault();
  };

  const verifyOtp = async () => {
    if (!/^\d{6}$/.test(otp)) {
      showToast('Enter valid 6-digit OTP', 'error');
      return;
    }
    setIsLoading(true);
    try {
      const res = await axios.post(`${API_BASE_URL}/principle/verify-otp`, { email: email.trim().toLowerCase(), otp });
      if (res.data.success) {
        setStep(3);
        showToast('OTP verified. You can reset password now.', 'success');
      } else {
        showToast(res.data.message || 'Invalid or expired OTP', 'error');
      }
    } catch (err) {
      showToast(err.response?.data?.message || 'Invalid or expired OTP', 'error');
    } finally {
      setIsLoading(false);
    }
  };

  const resetPassword = async () => {
    if (!newPassword || newPassword !== confirmPassword) {
      showToast('Passwords must match', 'error');
      return;
    }
    setIsLoading(true);
    try {
      const res = await axios.post(`${API_BASE_URL}/principle/reset-password`, { email: email.trim().toLowerCase(), otp, newPassword });
      if (res.data.success) {
        showToast('Password reset successful! Check your email for confirmation.', 'success');
        setTimeout(onBackToLogin, 1800);
      } else {
        showToast(res.data.message || 'Failed to reset password', 'error');
      }
    } catch (err) {
      showToast(err.response?.data?.message || 'Failed to reset password', 'error');
    } finally {
      setIsLoading(false);
    }
  };

  return (
    <div>
      <div className="max-w-md w-full mx-auto px-4">
        <motion.div initial={{ opacity: 0, scale: 0.95 }} animate={{ opacity: 1, scale: 1 }} className="bg-white/10 backdrop-blur-lg rounded-3xl p-8 shadow-2xl border border-white/20">
          <div className="text-center mb-8">
            <motion.div initial={{ scale: 0 }} animate={{ scale: 1 }} className="w-20 h-20 bg-gradient-to-br from-teal-600 to-emerald-600 rounded-2xl mx-auto flex items-center justify-center mb-4">
              {step === 1 && <FaGraduationCap className="text-3xl text-white" />}
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

          <AnimatePresence>
            {toast.show && <Toast message={toast.message} type={toast.type} onClose={() => setToast({ show: false })} />}
          </AnimatePresence>

          <motion.div key={step} initial={{ opacity: 0, y: 20 }} animate={{ opacity: 1, y: 0 }} className="space-y-6">
            {step === 1 && (
              <div>
                <input type="email" value={email} onChange={e => setEmail(e.target.value)} placeholder="Enter your email" className="w-full px-4 py-3 bg-white/5 border border-white/10 rounded-xl focus:outline-none focus:ring-2 focus:ring-teal-400 text-white placeholder-gray-400" />
                <motion.button whileHover={{ scale: 1.01 }} whileTap={{ scale: 0.99 }} onClick={sendOtp} disabled={isLoading} className="w-full py-4 bg-gradient-to-r from-teal-600 to-emerald-600 text-white rounded-xl font-medium shadow-lg transition-all duration-200 hover:shadow-xl disabled:opacity-50 mt-6">
                  {isLoading ? 'Sending...' : 'Send Reset Code'}
                </motion.button>
              </div>
            )}

            {step === 2 && (
              <div className="space-y-6">
                <div className="flex justify-center space-x-3">
                  {Array.from({ length: 6 }).map((_, index) => (
                    <motion.input key={index} ref={el => otpRefs.current[index] = el} initial={{ scale: 0 }} animate={{ scale: 1 }} type="text" maxLength={1} inputMode="numeric" className="w-12 h-12 text-center text-2xl font-bold rounded-xl bg-white/5 border border-white/10 text-white focus:border-teal-400 focus:outline-none" value={otp[index] || ''} onChange={(e) => handleOtpInput(index, e.target.value)} onKeyDown={(e) => handleOtpKeyDown(index, e)} onPaste={handleOtpPaste} />
                  ))}
                </div>
                <motion.button whileHover={{ scale: 1.01 }} whileTap={{ scale: 0.99 }} onClick={verifyOtp} disabled={isLoading || otp.length !== 6} className="w-full py-4 bg-gradient-to-r from-teal-600 to-emerald-600 text-white rounded-xl font-medium shadow-lg transition-all duration-200 hover:shadow-xl disabled:opacity-50">
                  {isLoading ? 'Verifying...' : 'Verify Code'}
                </motion.button>
                <div className="text-center">{resendTimer > 0 ? <p className="text-gray-400">Resend code in {resendTimer}s</p> : <button onClick={sendOtp} className="text-blue-300 hover:text-blue-200 transition-colors text-sm">Resend Code</button>}</div>
              </div>
            )}

            {step === 3 && (
              <div className="space-y-6">
                <div>
                  <label className="text-sm font-medium text-gray-300 mb-1 block">New Password</label>
                  <div className="relative">
                    <input type={showNewPassword ? "text" : "password"} value={newPassword} onChange={e => setNewPassword(e.target.value)} placeholder="New password" className="w-full px-4 py-3 bg-white/5 border border-white/10 rounded-xl focus:outline-none focus:ring-2 focus:ring-teal-400 text-white placeholder-gray-400" />
                    <button type="button" onClick={() => setShowNewPassword(v => !v)} className="absolute right-2 top-2">{showNewPassword ? <RiEyeOffLine style={{ color: 'white' }} /> : <RiEyeLine style={{ color: 'white' }} />}</button>
                  </div>
                  <PasswordStrengthIndicator password={newPassword} />
                </div>
                <div>
                  <label className="text-sm font-medium text-gray-300 mb-1 block">Confirm Password</label>
                  <div className="relative">
                    <input type={showConfirmPassword ? "text" : "password"} value={confirmPassword} onChange={e => setConfirmPassword(e.target.value)} placeholder="Confirm password" className={`w-full px-4 py-3 bg-white/5 border ${confirmPassword ? confirmPassword === newPassword ? 'border-green-500' : 'border-red-500' : 'border-white/10'} rounded-xl focus:outline-none focus:ring-2 focus:ring-teal-400 text-white placeholder-gray-400`} />
                    <button type="button" onClick={() => setShowConfirmPassword(v => !v)} className="absolute right-2 top-2">{showConfirmPassword ? <RiEyeOffLine style={{ color: 'white' }} /> : <RiEyeLine style={{ color: 'white' }} />}</button>
                  </div>
                </div>
                <motion.button whileHover={{ scale: 1.01 }} whileTap={{ scale: 0.99 }} onClick={resetPassword} disabled={isLoading || !newPassword || !confirmPassword} className="w-full py-4 bg-gradient-to-r from-teal-600 to-emerald-600 text-white rounded-xl font-medium shadow-lg transition-all duration-200 hover:shadow-xl disabled:opacity-50">
                  {isLoading ? 'Resetting...' : 'Reset Password'}
                </motion.button>
              </div>
            )}
          </motion.div>

          <div className="pt-4 text-center">
            <motion.button whileHover={{ scale: 1.02 }} whileTap={{ scale: 0.98 }} onClick={onBackToLogin} className="text-sm text-blue-300 hover:text-blue-200 transition-colors">← Back to Login</motion.button>
          </div>
        </motion.div>
      </div>
    </div>
  );
}