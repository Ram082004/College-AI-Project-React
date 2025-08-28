import React, { useEffect, useState } from "react";
import confetti from "canvas-confetti";
import axios from "axios";
import { motion, AnimatePresence } from "framer-motion";
import { RiUserStarLine } from "react-icons/ri";

export default function PrincipleWelcomeDashboard() {
  const [academicYear, setAcademicYear] = useState("");
  const [currentDate, setCurrentDate] = useState("");
  const [showPopup, setShowPopup] = useState(true);
  const [userName, setUserName] = useState("");

  useEffect(() => {
    let principleUser = null;
    try {
      principleUser = JSON.parse(localStorage.getItem("principleUser"));
    } catch {}
    setUserName(principleUser?.name || "Principal");

    async function fetchAcademicYear() {
      try {
        const res = await axios.get("http://localhost:5000/api/admin/all", {
          headers: { Authorization: `Bearer ${localStorage.getItem("authToken")}` }
        });
        if (res.data?.admins?.length) {
          setAcademicYear(res.data.admins[0].academic_year || "");
        }
      } catch {
        setAcademicYear("");
      }
    }
    fetchAcademicYear();
    setCurrentDate(new Date().toLocaleDateString("en-IN", { year: "numeric", month: "long", day: "numeric" }));
    confetti({
      particleCount: 180,
      spread: 220,
      origin: { y: 0.3 },
      zIndex: 9999,
    });
  }, []);

  useEffect(() => {
    const timer = setTimeout(() => setShowPopup(false), 2500);
    return () => clearTimeout(timer);
  }, []);

  return (
    <div className="min-h-[80vh] flex items-center justify-center bg-gradient-to-br from-green-50 via-white to-emerald-100">
      <div className="w-full max-w-5xl mx-auto px-0 py-0">
        <AnimatePresence>
          {showPopup && (
            <motion.div
              initial={{ opacity: 0, scale: 0.8, y: -40 }}
              animate={{ opacity: 1, scale: 1, y: 0 }}
              exit={{ opacity: 0, scale: 0.8, y: -40 }}
              transition={{ duration: 0.6, type: "spring" }}
              className="fixed top-20 left-1/2 transform -translate-x-1/2 z-50 bg-gradient-to-r from-green-600 to-emerald-600 text-white px-8 py-4 rounded-2xl shadow-2xl text-xl font-bold"
            >
              Welcome, {userName}!
            </motion.div>
          )}
        </AnimatePresence>
        <motion.section
          initial={{ opacity: 0, y: 32 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ duration: 0.7 }}
          className="bg-white/90 rounded-3xl shadow-2xl p-12 flex flex-col md:flex-row gap-12 items-center justify-between"
        >
          <div className="flex-1 flex flex-col items-center md:items-start gap-8">
            <div className="w-32 h-32 rounded-2xl bg-gradient-to-br from-emerald-700 to-green-600 flex items-center justify-center shadow-2xl mb-4">
              <RiUserStarLine className="text-6xl text-white" />
            </div>
            <div>
              <h1 className="text-5xl font-extrabold text-gray-900 mb-4 tracking-tight leading-tight">
                Welcome to <span className="bg-gradient-to-r from-green-600 to-emerald-600 bg-clip-text text-transparent">Principal Dashboard</span>
              </h1>
              <p className="text-lg text-gray-600 max-w-2xl mb-6">
                Hello <span className="font-bold text-green-700">{userName}</span>, this is your professional dashboard for managing institution data, staff, submissions, and reports.
              </p>
            </div>
          </div>
          <div className="w-full md:w-96 flex flex-col items-center">
            <div className="rounded-2xl bg-emerald-50 p-6 border border-emerald-100 shadow-inner w-full mb-8">
              <div className="text-xs text-emerald-500 uppercase font-bold tracking-wide mb-2">Current Academic Year</div>
              <div className="text-2xl font-bold text-emerald-700">{academicYear || <span className="text-gray-400">N/A</span>}</div>
              <div className="text-sm text-gray-500 mt-2">{currentDate}</div>
            </div>
          </div>
        </motion.section>
      </div>
    </div>
  );
}