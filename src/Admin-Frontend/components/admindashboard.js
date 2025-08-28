import React, { useEffect, useState, useRef } from "react";
import confetti from "canvas-confetti";
import { motion, AnimatePresence } from "framer-motion";
import { RiUserStarLine } from "react-icons/ri";
import axios from "axios";

export default function AdminDashboard({ academicYear: propAcademicYear, nodalOfficerName }) {
  const [academicYear, setAcademicYear] = useState(propAcademicYear || "");
  const [loginMessage, setLoginMessage] = useState(null);
  const [currentDate, setCurrentDate] = useState("");
  const [showPopup, setShowPopup] = useState(true);

  useEffect(() => {
    async function fetchAcademicYear() {
      try {
        const res = await axios.get("http://localhost:5000/api/admin/all", {
          headers: { Authorization: `Bearer ${localStorage.getItem("authToken")}` }
        });
        if (res.data?.admins?.length) {
          setAcademicYear(res.data.admins[0].academic_year || "");
        }
      } catch (_) {}
    }
    fetchAcademicYear();
    setCurrentDate(new Date().toLocaleDateString("en-IN", { year: "numeric", month: "long", day: "numeric" }));

    // Fire confetti animation on mount
    confetti({
      particleCount: 220,
      spread: 300,
      origin: { y: 0.3 },
      zIndex: 9999,
    });
  }, []);

  useEffect(() => {
    const msg = localStorage.getItem("loginMessage");
    if (msg) {
      setLoginMessage(msg);
      localStorage.removeItem("loginMessage");
      setTimeout(() => setLoginMessage(null), 3500);
    }
  }, []);

  useEffect(() => {
    const timer = setTimeout(() => setShowPopup(false), 2500);
    return () => clearTimeout(timer);
  }, []);

  return (
    <div>
      <AnimatePresence>
        {showPopup && (
          <motion.div
            initial={{ opacity: 0, scale: 0.8, y: -40 }}
            animate={{ opacity: 1, scale: 1, y: 0 }}
            exit={{ opacity: 0, scale: 0.8, y: -40 }}
            transition={{ duration: 0.6, type: "spring" }}
            className="fixed top-20 left-1/2 transform -translate-x-1/2 z-50 bg-gradient-to-r from-blue-600 to-indigo-600 text-white px-8 py-4 rounded-2xl shadow-2xl text-xl font-bold"
          >
            Welcome, {nodalOfficerName || "Nodal Officer"}!
          </motion.div>
        )}
      </AnimatePresence>
      {loginMessage && (
        <div className="fixed top-6 right-6 z-50">
          <div className="px-5 py-3 rounded-xl bg-green-600 text-white font-semibold shadow-lg">
            {loginMessage}
          </div>
        </div>
      )}
      <div className="w-full mx-auto px-0 py-0">
        <motion.section
          initial={{ opacity: 0, y: 32 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ duration: 0.7 }}
          className="bg-white/90 rounded-3xl shadow-2xl p-12 flex flex-col md:flex-row gap-12 items-center justify-between"
        >
          <div className="flex-1 flex flex-col items-center md:items-start gap-8">
            <div className="w-32 h-32 rounded-2xl bg-gradient-to-br from-indigo-700 to-blue-600 flex items-center justify-center shadow-2xl mb-4">
              <RiUserStarLine className="text-6xl text-white" />
            </div>
            <div>
              <h1 className="text-5xl font-extrabold text-gray-900 mb-4 tracking-tight leading-tight">
                Welcome to <span className="bg-gradient-to-r from-blue-600 to-indigo-600 bg-clip-text text-transparent">GASCKK AISHE PORTAL</span>
              </h1>
              <p className="text-lg text-gray-600 max-w-2xl mb-6">
                Hello <span className="font-bold text-blue-700">{nodalOfficerName || "Nodal Officer"}</span>, this is your professional dashboard for managing users, submissions, and generating reports for your institution.
              </p>
            </div>
          </div>
          <div className="w-full md:w-96 flex flex-col items-center">
            <div className="rounded-2xl bg-indigo-50 p-6 border border-indigo-100 shadow-inner w-full mb-8">
              <div className="text-xs text-indigo-500 uppercase font-bold tracking-wide mb-2">Current Academic Year</div>
              <div className="text-2xl font-bold text-indigo-700">{academicYear || <span className="text-gray-400">N/A</span>}</div>
              <div className="text-sm text-gray-500 mt-2">{currentDate}</div>
            </div>
          </div>
        </motion.section>
      </div>
    </div>
  );
}