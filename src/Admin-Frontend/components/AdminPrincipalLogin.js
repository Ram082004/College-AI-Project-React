import React from 'react';
import { motion } from 'framer-motion';
import { FaShieldAlt, FaGraduationCap } from 'react-icons/fa';

// Only Admin and Principal login types
const loginTypes = [
  { 
    type: 'admin', 
    label: 'Nodal Officer', 
    icon: <FaShieldAlt className="text-4xl" />, 
    color: 'from-indigo-600 to-blue-700',
    description: 'System Management & Control'
  },
  { 
    type: 'principle', 
    label: 'Principal', 
    icon: <FaGraduationCap className="text-4xl" />, 
    color: 'from-teal-600 to-emerald-600',
    description: 'Institution Management'
  },
];

const quotes = [
  "Leadership is not about being in charge. It is about taking care of those in your charge.",
  "Excellence is never an accident. It is always the result of high intention, sincere effort, and intelligent execution.",
  "The best way to predict the future is to create it. – Peter Drucker",
  "Quality is not an act, it is a habit. – Aristotle"
];

export default function AdminPrincipalLogin({ onSelect }) {
  const randomQuote = quotes[Math.floor(Math.random() * quotes.length)];

  return (
    <div className="min-h-screen w-full flex flex-col bg-[#020617] bg-gradient-to-br from-navy-900/50 to-blue-900/30">
      {/* Animated Background */}
      <div className="fixed inset-0 -z-10">
        <div className="absolute inset-0 bg-gradient-size bg-gradient-animate bg-gradient-to-br from-indigo-500/5 via-purple-500/5 to-blue-500/5"></div>
        <div className="absolute inset-0 backdrop-blur-[100px]"></div>
      </div>

      {/* Header */}
      <header className="py-12 relative">
        <div className="text-center">
          <motion.div
            initial={{ opacity: 0, y: -30 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ duration: 0.7 }}
            className="relative inline-block"
          >
            <span className="absolute -inset-8 bg-gradient-to-r from-indigo-500/20 to-purple-500/20 blur-xl rounded-full"></span>
            <h1 className="relative text-6xl font-black text-white tracking-tight">
              ADMINISTRATIVE <span className="bg-gradient-to-r from-indigo-400 to-purple-400 text-transparent bg-clip-text">PORTAL</span>
            </h1>
          </motion.div>
          <motion.p 
            initial={{ opacity: 0 }}
            animate={{ opacity: 1 }}
            transition={{ delay: 0.3 }}
            className="text-xl text-blue-100/80 font-medium tracking-wide mt-4"
          >
            GASCKK AISHE - Administrative & Management Access
          </motion.p>
        </div>
      </header>

      {/* Login Cards */}
      <main className="flex-1 flex flex-col items-center justify-center w-full px-6">
        <motion.div
          initial={{ opacity: 0, scale: 0.95 }}
          animate={{ opacity: 1, scale: 1 }}
          transition={{ duration: 0.5 }}
          className="w-full max-w-4xl grid grid-cols-1 sm:grid-cols-2 gap-8"
        >
          {loginTypes.map(({ type, label, icon, color, description }) => (
            <motion.button
              key={type}
              whileHover={{ scale: 1.03, y: -4 }}
              whileTap={{ scale: 0.98 }}
              className={`relative group flex flex-col items-center justify-center p-10 rounded-2xl 
                         bg-gradient-to-br ${color} text-white font-bold shadow-lg transition-all 
                         duration-300 hover:shadow-2xl focus:outline-none overflow-hidden`}
              onClick={() => onSelect(type)}
              style={{ minHeight: 250 }}
            >
              <div className="absolute inset-0 bg-black/20 opacity-0 group-hover:opacity-100 transition-opacity duration-300"></div>
              <div className="absolute -inset-1 bg-gradient-to-r from-white/20 to-transparent opacity-0 group-hover:opacity-100 blur-lg transition-opacity duration-300"></div>
              <div className="relative space-y-6">
                <div className="bg-white/10 p-6 rounded-xl backdrop-blur-sm">
                  {icon}
                </div>
                <div>
                  <div className="text-2xl font-bold tracking-wide mb-3">{label}</div>
                  <div className="text-base font-medium text-white/80">{description}</div>
                </div>
              </div>
            </motion.button>
          ))}
        </motion.div>

        {/* Administrative Quote */}
        <motion.div
          initial={{ opacity: 0, y: 20 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ delay: 0.6 }}
          className="mt-12 text-center max-w-2xl mx-auto"
        >
          <blockquote className="relative">
            <div className="absolute -inset-1 bg-gradient-to-r from-indigo-500/10 to-purple-500/10 blur rounded-lg"></div>
            <p className="relative italic text-blue-100 text-lg font-medium px-6 py-4">
              "{randomQuote}"
            </p>
          </blockquote>
        </motion.div>

        {/* Access Note */}
        <motion.div
          initial={{ opacity: 0, y: 20 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ delay: 0.8 }}
          className="mt-8 text-center"
        >
          <div className="px-6 py-3 bg-amber-500/10 backdrop-blur-sm rounded-xl border border-amber-500/20">
            <p className="text-amber-200/90 text-sm font-medium">
              🔒 Administrative Access Only
            </p>
          </div>
        </motion.div>
      </main>

      {/* Footer */}
      <footer className="py-6 bg-gradient-to-r from-navy-900/90 to-blue-900/90 border-t border-white/10 mt-10">
        <div className="max-w-6xl mx-auto flex flex-col md:flex-row items-center justify-between px-6">
          <motion.span 
            initial={{ opacity: 0 }}
            animate={{ opacity: 1 }}
            transition={{ delay: 0.8 }}
            className="text-white/80 text-sm font-medium"
          >
            &copy; {new Date().getFullYear()} AISHE Administrative Portal. All rights reserved.
          </motion.span>
          <motion.span 
            initial={{ opacity: 0 }}
            animate={{ opacity: 1 }}
            transition={{ delay: 0.9 }}
            className="text-blue-200/80 text-sm mt-2 md:mt-0"
          >
            Designed with Team 7 <span className="text-red-400">♥</span>
          </motion.span>
        </div>
      </footer>
    </div>
  );
}