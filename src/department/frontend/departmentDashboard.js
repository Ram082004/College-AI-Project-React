import React, { useState, useEffect } from 'react';
import { motion, AnimatePresence } from 'framer-motion';
import {
  RiDashboardLine,
  RiLogoutBoxLine,
  RiSearchLine,
  RiBuilding2Line,
  RiUserAddLine,
  RiBarChartBoxLine
} from 'react-icons/ri';
import axios from 'axios';
import StudentEnrollment from './studentEnrollment';
import StudentExamination from './studentExamination';


const yearSlots = ['I Year', 'II Year', 'III Year'];

export default function DepartmentDashboard() {
  const [userData, setUserData] = useState(null);
  const [activeTab, setActiveTab] = useState('overview');
  const [sidebarOpen, setSidebarOpen] = useState(true);
  const [searchQuery, setSearchQuery] = useState('');
  const [globalMessage] = useState(null);

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
  }, [userData]);

  const handleLogout = () => {
    localStorage.removeItem('authToken');
    localStorage.removeItem('departmentUser');
    window.location.href = '/';
  };

  return (
    <div className="min-h-screen bg-gray-50 flex">
      {/* Sidebar */}
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
          </div>
          <nav className="space-y-2">
            <motion.button
              whileHover={{ x: 4 }}
              onClick={() => setActiveTab('overview')}
              className={`w-full flex items-center space-x-3 px-4 py-3 rounded-xl transition-all ${
                activeTab === 'overview' ? 'bg-blue-50 text-blue-600' : 'text-gray-600 hover:bg-gray-50'
              }`}
            >
              <RiDashboardLine className="text-xl" />
              <span>Overview</span>
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
            {/* If you have Profile Settings, add it after Enrollment Status */}
            {/* <motion.button ...>Profile Settings</motion.button> */}
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
              <div className="flex-1 max-w-xl mx-4">
                <div className="relative">
                  <RiSearchLine className="absolute left-3 top-1/2 -translate-y-1/2 text-gray-400" />
                  <input
                    type="text"
                    placeholder="Search..."
                    value={searchQuery}
                    onChange={(e) => setSearchQuery(e.target.value)}
                    className="w-full pl-10 pr-4 py-2 border border-gray-200 rounded-xl focus:outline-none focus:ring-2 focus:ring-blue-500"
                  />
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
          <div className="mb-8">
            <h1 className="text-2xl font-bold text-gray-900">
              {activeTab === 'overview'
                ? 'Department Overview'
                : activeTab === 'enrollment'
                ? 'Student Enrollment'
                : activeTab === 'examination'
                ? 'Student Examination'
                : 'Profile Settings'}
            </h1>
            <p className="mt-1 text-gray-500">
              {userData?.department} - {userData?.dept_id}
            </p>
          </div>

          {/* Dynamic Content Based on Active Tab */}
          <motion.div
            initial={{ opacity: 0, y: 20 }}
            animate={{ opacity: 1, y: 0 }}
            className="bg-white rounded-xl shadow-sm overflow-hidden"
          >
            <div className="p-6">
              {activeTab === 'overview' && (
                <div>
                  <h3 className="text-lg font-semibold mb-4">Department Overview</h3>
                  {/* Add overview content here */}
                </div>
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
          </motion.div>
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