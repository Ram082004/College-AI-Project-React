import React from 'react';
import { motion } from 'framer-motion';
import { FaShieldAlt, FaBuilding, FaCity, FaGraduationCap } from 'react-icons/fa';

// Update loginTypes array to include principle
const loginTypes = [
  { 
    type: 'admin', 
    label: 'Administrator', 
    icon: <FaShieldAlt className="text-4xl" />, 
    color: 'from-indigo-600 to-blue-700',
    description: 'System Management & Control'
  },
  { 
    type: 'department', 
    label: 'Department', 
    icon: <FaBuilding className="text-4xl" />, 
    color: 'from-blue-600 to-cyan-600',
    description: 'Departmental Access Portal'
  },
  { 
    type: 'office', 
    label: 'Office', 
    icon: <FaCity className="text-4xl" />, 
    color: 'from-cyan-600 to-teal-600',
    description: 'Administrative Operations'
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
  "Education is the most powerful weapon which you can use to change the world. – Nelson Mandela",
  "The roots of education are bitter, but the fruit is sweet. – Aristotle",
  "An investment in knowledge pays the best interest. – Benjamin Franklin",
  "Education is not preparation for life; education is life itself. – John Dewey"
];

export default function LoginSelection({ onSelect }) {
  const randomQuote = quotes[Math.floor(Math.random() * quotes.length)];

  return (
    <div className="min-h-screen w-full flex flex-col bg-[#020617] bg-gradient-to-br from-navy-900/50 to-blue-900/30">
      {/* Animated Background */}
      <div className="fixed inset-0 -z-10">
        <div className="absolute inset-0 bg-gradient-size bg-gradient-animate bg-gradient-to-br from-blue-500/5 via-indigo-500/5 to-purple-500/5"></div>
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
            <span className="absolute -inset-8 bg-gradient-to-r from-blue-500/20 to-indigo-500/20 blur-xl rounded-full"></span>
            <h1 className="relative text-6xl font-black text-white tracking-tight">
              GASCKK AISHE <span className="bg-gradient-to-r from-blue-400 to-indigo-400 text-transparent bg-clip-text">PORTAL</span>
            </h1>
          </motion.div>
          <motion.p 
            initial={{ opacity: 0 }}
            animate={{ opacity: 1 }}
            transition={{ delay: 0.3 }}
            className="text-xl text-blue-100/80 font-medium tracking-wide mt-4"
          >
            All India Survey on Higher Education
          </motion.p>
        </div>
      </header>

      {/* Login Cards */}
      <main className="flex-1 flex flex-col items-center justify-center w-full px-6">
        <motion.div
          initial={{ opacity: 0, scale: 0.95 }}
          animate={{ opacity: 1, scale: 1 }}
          transition={{ duration: 0.5 }}
          className="w-full max-w-6xl grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-6"
        >
          {loginTypes.map(({ type, label, icon, color, description }) => (
            <motion.button
              key={type}
              whileHover={{ scale: 1.03, y: -4 }}
              whileTap={{ scale: 0.98 }}
              className={`relative group flex flex-col items-center justify-center p-8 rounded-2xl 
                         bg-gradient-to-br ${color} text-white font-bold shadow-lg transition-all 
                         duration-300 hover:shadow-2xl focus:outline-none overflow-hidden`}
              onClick={() => onSelect(type)}
              style={{ minHeight: 200 }}
            >
              <div className="absolute inset-0 bg-black/20 opacity-0 group-hover:opacity-100 transition-opacity duration-300"></div>
              <div className="absolute -inset-1 bg-gradient-to-r from-white/20 to-transparent opacity-0 group-hover:opacity-100 blur-lg transition-opacity duration-300"></div>
              <div className="relative space-y-4">
                <div className="bg-white/10 p-4 rounded-xl backdrop-blur-sm">
                  {icon}
                </div>
                <div>
                  <div className="text-xl font-bold tracking-wide mb-2">{label}</div>
                  <div className="text-sm font-medium text-white/80">{description}</div>
                </div>
              </div>
            </motion.button>
          ))}
        </motion.div>

        {/* Educational Quote */}
        <motion.div
          initial={{ opacity: 0, y: 20 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ delay: 0.6 }}
          className="mt-12 text-center max-w-2xl mx-auto"
        >
          <blockquote className="relative">
            <div className="absolute -inset-1 bg-gradient-to-r from-blue-500/10 to-indigo-500/10 blur rounded-lg"></div>
            <p className="relative italic text-blue-100 text-lg font-medium px-6 py-4">
              "{randomQuote}"
            </p>
          </blockquote>
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
            &copy; {new Date().getFullYear()} AISHE Portal. All rights reserved.
          </motion.span>
          <motion.span 
            initial={{ opacity: 0 }}
            animate={{ opacity: 1 }}
            transition={{ delay: 0.9 }}
            className="text-blue-200/80 text-sm mt-2 md:mt-0"
          >
            Designed with <span className="text-red-400">♥</span> for Education
          </motion.span>
        </div>
      </footer>
    </div>
  );
}