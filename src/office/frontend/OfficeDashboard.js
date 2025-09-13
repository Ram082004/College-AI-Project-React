import React, { useState, useEffect } from 'react';
import BasicInformation from './basic_information';
import StaffEnrollment from './non_teaching_staff';
import TeachingStaff from './teaching_staff';
import { motion, AnimatePresence } from 'framer-motion';
import {
  RiDashboardLine,
  RiTeamLine,
  RiLogoutBoxLine,
  RiFileListLine,
  RiUserSettingsLine,
  RiBuilding4Line
} from 'react-icons/ri';
import axios from 'axios';
import OfficeWelcomeDashboard from './officewelcomedashboard';
import DeptEnrollment from './officedeptenrollment'; // add this import


export default function OfficeDashboard() {
  const [userData, setUserData] = useState(null);
  const [activeTab, setActiveTab] = useState('officewelcomedashboard');
  const [sidebarOpen, setSidebarOpen] = useState(true);
  const [searchQuery, setSearchQuery] = useState('');
  const [loading, setLoading] = useState(false);
  const [globalMessage, setGlobalMessage] = useState(null);
  const [loginMessage, setLoginMessage] = useState(null);
  const [officeAcademicYear, setOfficeAcademicYear] = useState('');

  useEffect(() => {
    const storedUser = localStorage.getItem('officeUser');
    if (!storedUser) {
      window.location.href = '/';
      return;
    }
    setUserData(JSON.parse(storedUser));
  }, []);


  const handleLogout = () => {
    localStorage.removeItem('authToken');
    localStorage.removeItem('officeUser');
    window.location.href = '/';
  };

  const processRequest = async (id) => {
    try {
      setGlobalMessage({ type: 'success', text: 'Request processed successfully' });
    } catch (error) {
      setGlobalMessage({ type: 'error', text: 'Failed to process request' });
    }
  };

  useEffect(() => {
    const msg = localStorage.getItem("officeLoginMessage");
    if (msg) {
      setLoginMessage(msg);
      localStorage.removeItem("officeLoginMessage");
      setTimeout(() => setLoginMessage(null), 3500);
    }
  }, []);

  return (
    <div className="min-h-screen bg-gray-50 flex">
      {/* Login Success Popup */}
      <AnimatePresence>
        {loginMessage && (
          <motion.div
            initial={{ opacity: 0, scale: 0.8, y: -40 }}
            animate={{ opacity: 1, scale: 1, y: 0 }}
            exit={{ opacity: 0, scale: 0.8, y: -40 }}
            transition={{ duration: 0.6, type: "spring" }}
            className="fixed top-20 left-1/2 transform -translate-x-1/2 z-50 bg-gradient-to-r from-blue-600 to-indigo-600 text-white px-8 py-4 rounded-2xl shadow-2xl text-xl font-bold"
          >
            Welcome, <span className="text-blue-300">{userData?.name || "Office User"}</span>!
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
              className="w-12 h-12 rounded-xl bg-gradient-to-r from-cyan-600 to-teal-600 flex items-center justify-center mb-4"
            >
              <RiBuilding4Line className="text-2xl text-white" />
            </motion.div>
            <h1 className="text-xl font-bold text-gray-800">Office Dashboard</h1>
            <p className="text-sm text-gray-500">
              {userData?.name} - {userData?.office_id}
            </p>
          </div>
          <nav className="space-y-2">
            <motion.button
              whileHover={{ x: 4 }}
              onClick={() => setActiveTab('officewelcomedashboard')}
              className={`w-full flex items-center space-x-3 px-4 py-3 rounded-xl transition-all ${
                activeTab === 'officewelcomedashboard' ? 'bg-cyan-50 text-cyan-600' : 'text-gray-600 hover:bg-gray-50'
              }`}
            >
              <RiDashboardLine className="text-xl" />
              <span>Dashboard</span>
            </motion.button>
            <motion.button
              whileHover={{ x: 4 }}
              onClick={() => setActiveTab('basicinfo')}
              className={`w-full flex items-center space-x-3 px-4 py-3 rounded-xl transition-all ${
                activeTab === 'basicinfo' ? 'bg-cyan-50 text-cyan-600' : 'text-gray-600 hover:bg-gray-50'
              }`}
            >
              <RiFileListLine className="text-xl" />
              <span>Basic Information</span>
            </motion.button>

            {/* NEW: Department Entry */}
            <motion.button
              whileHover={{ x: 4 }}
              onClick={() => setActiveTab('departmententry')}
              className={`w-full flex items-center space-x-3 px-4 py-3 rounded-xl transition-all ${
                activeTab === 'departmententry' ? 'bg-cyan-50 text-cyan-600' : 'text-gray-600 hover:bg-gray-50'
              }`}
            >
              <RiUserSettingsLine className="text-xl" />
              <span>Department Entry</span>
            </motion.button>
            <motion.button
              whileHover={{ x: 4 }}
              onClick={() => setActiveTab('nonteachingstaff')}
              className={`w-full flex items-center space-x-3 px-4 py-3 rounded-xl transition-all ${
                activeTab === 'nonteachingstaff' ? 'bg-cyan-50 text-cyan-600' : 'text-gray-600 hover:bg-gray-50'
              }`}
            >
              <RiTeamLine className="text-xl" />
              <span>Non-Teaching Staff</span>
            </motion.button>
            <motion.button
              whileHover={{ x: 4 }}
              onClick={() => setActiveTab('teachingstaff')}
              className={`w-full flex items-center space-x-3 px-4 py-3 rounded-xl transition-all ${
                activeTab === 'teachingstaff' ? 'bg-cyan-50 text-cyan-600' : 'text-gray-600 hover:bg-gray-50'
              }`}
            >
              <RiUserSettingsLine className="text-xl" />
              <span>Teaching Staff</span>
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
        <div className="bg-white/80 shadow-sm sticky top-0 z-30 backdrop-blur border-b border-gray-100">
          <div className="max-w-screen-xl mx-auto px-8 py-5 flex items-center justify-between">
            <button
              onClick={() => setSidebarOpen(!sidebarOpen)}
              className="p-2 rounded-lg hover:bg-gray-100"
            >
              <RiDashboardLine className="text-2xl text-gray-600" />
            </button>
            {/* Centered Portal Title */}
            <div className="flex-1 flex justify-center">
              <div className="text-4xl md:text-3xl font-bold tracking-tight text-center bg-cyan-600  from-blue-600 to-indigo-600 bg-clip-text text-transparent drop-shadow-lg uppercase">
                GASCKK AISHE PORTAL
              </div>
            </div>
            {/* Academic Year Badge on the right */}
            <div className="flex items-center gap-4 ml-4">
              <div className="text-right">
                <p className="text-sm font-medium text-gray-900">{userData?.name}</p>
                <p className="text-xs text-gray-500">Office Administrator</p>
              </div>
              <div className="h-8 w-8 rounded-full bg-cyan-600 flex items-center justify-center text-white font-medium">
                {userData?.name?.[0]?.toUpperCase()}
              </div>
            </div>
          </div>
        </div>

        {/* Main Content Area */}
        <div className="max-w-7xl mx-auto px-6 py-8">
          <motion.div
            initial={{ opacity: 0, y: 20 }}
            animate={{ opacity: 1, y: 0 }}
          >
            <div className="p-6">
              {activeTab === 'officewelcomedashboard' && (
                <OfficeWelcomeDashboard userData={userData} />
              )}
              {activeTab === 'basicinfo' && (
                <BasicInformation userData={userData} />
              )}
              {activeTab === 'nonteachingstaff' && (
                <StaffEnrollment userData={userData} />
              )}
              {activeTab === 'departmententry' && (
                <DeptEnrollment />
              )}
              {activeTab === 'teachingstaff' && (
                <TeachingStaff userData={userData} />
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