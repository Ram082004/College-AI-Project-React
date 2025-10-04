import React, { useState, useEffect } from 'react';
import { motion, AnimatePresence } from 'framer-motion';
import {
  RiLogoutBoxLine,
  RiSearchLine,
  RiBuilding2Line,
  RiUserAddLine,
  RiBarChartBoxLine,
  RiDashboardLine
} from 'react-icons/ri';
import axios from 'axios';
import StudentEnrollment from './studentEnrollment';
import StudentExamination from './studentExamination';
import DeptWelcomeDashboard from './deptwelcomedashboard';


const yearSlots = ['I Year', 'II Year', 'III Year'];

export default function DepartmentDashboard() {
  const [userData, setUserData] = useState(null);
  const [activeTab, setActiveTab] = useState('deptwelcomedashboard');
  const [sidebarOpen, setSidebarOpen] = useState(true);
  const [searchQuery, setSearchQuery] = useState('');
  const [globalMessage] = useState(null);
  const [loginMessage, setLoginMessage] = useState(null);
  
  // Add HOD name state
  const [hodName, setHodName] = useState('');

  // For passing to child components
  const [academicYears, setAcademicYears] = useState([]);
  const [currentYearSlot, setCurrentYearSlot] = useState(0);

  useEffect(() => {
    const storedUser = localStorage.getItem('departmentUser');
    if (!storedUser) {
      window.location.href = '/';
      return;
    }
    setUserData(JSON.parse(storedUser));
  }, []);

  // Add HOD fetch function
  const fetchHodName = async () => {
    if (!userData?.dept_id) return;
    try {
      const res = await axios.get(
        `http://localhost:5000/api/department-user/hod/${userData.dept_id}`,
        { headers: { Authorization: `Bearer ${localStorage.getItem('authToken')}` } }
      );
      if (res.data.success && res.data.hod_name) {
        setHodName(res.data.hod_name);
      } else {
        setHodName('Not Available');
      }
    } catch {
      setHodName('Not Available');
    }
  };

  // Fetch academic years for the department
  useEffect(() => {
    async function fetchYears() {
      if (!userData?.dept_id) return;
      try {
        const res = await axios.get(
          `http://localhost:5000/api/department-user/academic-year/${userData.dept_id}`,
          { headers: { Authorization: `Bearer ${localStorage.getItem('authToken')}` } }
        );
        if (res.data.success) setAcademicYears(res.data.years);
        else setAcademicYears([]);
      } catch {
        setAcademicYears([]);
      }
    }
    fetchYears();
    fetchHodName(); // Add this line
  }, [userData]);

  useEffect(() => {
    const msg = localStorage.getItem("departmentLoginMessage");
    if (msg) {
      setLoginMessage(msg);
      localStorage.removeItem("departmentLoginMessage");
      setTimeout(() => setLoginMessage(null), 3500);
    }
  }, []);

  const handleLogout = () => {
    localStorage.removeItem('authToken');
    localStorage.removeItem('departmentUser');
    window.location.href = '/';
  };

  return (
    <div className="min-h-screen bg-gray-50 flex">
      {/* Login Success Message - styled and placed like admin dashboard */}
      {loginMessage && (
        <div className="fixed top-6 right-6 z-50">
          <div className="px-5 py-3 rounded-xl bg-green-600 text-white font-semibold shadow-lg">
            {loginMessage}
          </div>
        </div>
      )}
      <motion.div
        initial={{ x: -300 }}
        animate={{ x: sidebarOpen ? 0 : -300 }}
        className="fixed left-0 top-0 h-full w-72 bg-white shadow-lg z-40"
      >
        <div className="p-6">
          <div className="mb-8">
            <motion.div
              initial={{ scale: 0 }}
              animate={{ scale: 1 }}
              className="w-12 h-12 rounded-xl bg-gradient-to-r from-blue-600 to-indigo-600 flex items-center justify-center mb-4"
            >
              <RiBuilding2Line className="text-2xl text-white" />
            </motion.div>
            <h1 className="text-xl font-bold text-gray-800">Department Dashboard</h1>
            <p className="text-sm text-gray-500">
              {userData?.department} - {userData?.dept_id}
            </p>
            {/* Add HOD name here */}
            <div className="mt-2 p-2 bg-blue-50 rounded-lg">
              <p className="text-xs font-medium text-blue-600">HOD:-</p>
              <p className="text-sm font-semibold text-blue-800">{hodName}</p>
            </div>
          </div>
          <nav className="space-y-2">
            <motion.button
              whileHover={{ x: 4 }}
              onClick={() => setActiveTab('deptwelcomedashboard')}
              className={`w-full flex items-center space-x-3 px-4 py-3 rounded-xl transition-all ${
                activeTab === 'deptwelcomedashboard' ? 'bg-blue-50 text-blue-600' : 'text-gray-600 hover:bg-gray-50'
              }`}
            >
              <RiDashboardLine className="text-xl" />
              <span>Dashboard</span>
            </motion.button>
            <motion.button
              whileHover={{ x: 4 }}
              onClick={() => setActiveTab('enrollment')}
              className={`w-full flex items-center space-x-3 px-4 py-3 rounded-xl transition-all ${
                activeTab === 'enrollment' ? 'bg-blue-50 text-blue-600' : 'text-gray-600 hover:bg-gray-50'
              }`}
            >
              <RiUserAddLine className="text-xl" />
              <span>Student Enrollment</span>
            </motion.button>
            <motion.button
              whileHover={{ x: 4 }}
              onClick={() => setActiveTab('examination')}
              className={`w-full flex items-center space-x-3 px-4 py-3 rounded-xl transition-all ${
                activeTab === 'examination' ? 'bg-blue-50 text-blue-600' : 'text-gray-600 hover:bg-gray-50'
              }`}
            >
              <RiBarChartBoxLine className="text-xl" />
              <span>Student Examination</span>
            </motion.button>
          </nav>
        </div>
        <div className="absolute bottom-6 left-0 right-0 px-6">
          <motion.button
            whileHover={{ scale: 1.02 }}
            onClick={handleLogout}
            className="w-full flex items-center justify-center space-x-2 px-4 py-3 rounded-xl bg-red-50 text-red-600 hover:bg-red-100 transition-all"
          >
            <RiLogoutBoxLine className="text-xl" />
            <span>Logout</span>
          </motion.button>
        </div>
      </motion.div>

      {/* Main Content */}
      <div className={`flex-1 ${sidebarOpen ? 'ml-72' : 'ml-0'} transition-all duration-300`}>
        {/* Top Navigation */}
        <div className="bg-white shadow-sm">
          <div className="max-w-7xl mx-auto px-6 py-4">
            <div className="flex items-center justify-between">
              <button
                onClick={() => setSidebarOpen(!sidebarOpen)}
                className="p-2 rounded-lg hover:bg-gray-100"
              >
                <RiDashboardLine className="text-xl text-gray-600" />
              </button>
              {/* Centered Portal Title */}
              <div className="flex-1 flex justify-center">
                <div className="text-3xl font-extrabold text-blue-700 tracking-tight text-center uppercase">
                  GASCKK AISHE PORTAL
                </div>
              </div>
              <div className="flex items-center space-x-4">
                <div className="text-right">
                  <p className="text-sm font-medium text-gray-900">{userData?.name}</p>
                  <p className="text-xs text-gray-500">{userData?.department}</p>
                </div>
                <div className="h-8 w-8 rounded-full bg-blue-600 flex items-center justify-center text-white font-medium">
                  {userData?.name?.[0]?.toUpperCase()}
                </div>
              </div>
            </div>
          </div>
        </div>

        {/* Main Content Area */}
        <div className="max-w-7xl mx-auto px-6 py-8">
          <div className="p-6">
            {activeTab === 'deptwelcomedashboard' && (
              <DeptWelcomeDashboard />
            )}

            {activeTab === 'enrollment' && (
              <StudentEnrollment
                userData={userData}
                yearSlots={yearSlots}
              />
            )}

            {activeTab === 'examination' && (
              <StudentExamination
                userData={userData}
                academicYears={academicYears}
                yearSlots={yearSlots}
                currentYearSlot={currentYearSlot}
                setCurrentYearSlot={setCurrentYearSlot}
              />
            )}
          </div>
        </div>
      </div>

      {/* Global Message Toast */}
      <AnimatePresence>
        {globalMessage && (
          <motion.div
            initial={{ opacity: 0, y: 50 }}
            animate={{ opacity: 1, y: 0 }}
            exit={{ opacity: 0, y: 50 }}
            className={`fixed bottom-4 right-4 px-6 py-3 rounded-xl shadow-lg ${
              globalMessage.type === 'success'
                ? 'bg-green-500 text-white'
                : 'bg-red-500 text-white'
            }`}
          >
            {globalMessage.text}
          </motion.div>
        )}
      </AnimatePresence>
    </div>
  );
}