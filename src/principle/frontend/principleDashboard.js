import React, { useState, useEffect } from 'react';
import { motion, AnimatePresence } from 'framer-motion';
import { 
  RiDashboardLine,
  RiTeamLine,
  RiLogoutBoxLine,
  RiSearchLine,
  RiFileListLine,
  RiUpload2Line,
  RiUserSettingsLine,
  RiBuilding2Line,
  RiBarChartBoxLine,
  RiGovernmentLine
} from 'react-icons/ri';
import axios from 'axios';

const API_BASE = 'http://localhost:5000/api/principle';
const API = {
  DEPARTMENTS: `${API_BASE}/departments`,
  STATISTICS: `${API_BASE}/statistics`,
  REPORTS: `${API_BASE}/reports`,
  PROFILE: `${API_BASE}/profile`
};

export default function PrincipleDashboard() {
  const [userData, setUserData] = useState(null);
  const [activeTab, setActiveTab] = useState('overview');
  const [sidebarOpen, setSidebarOpen] = useState(true);
  const [searchQuery, setSearchQuery] = useState('');
  const [loading, setLoading] = useState(false);
  const [globalMessage, setGlobalMessage] = useState(null);

  // Institution specific states
  const [departmentCount, setDepartmentCount] = useState(0);
  const [studentCount, setStudentCount] = useState(0);
  const [facultyCount, setFacultyCount] = useState(0);
  const [recentReports, setRecentReports] = useState([]);

  useEffect(() => {
    const storedUser = localStorage.getItem('principleUser');
    if (!storedUser) {
      window.location.href = '/';
      return;
    }
    setUserData(JSON.parse(storedUser));
    fetchDashboardData();
  }, []);

  const fetchDashboardData = async () => {
    setLoading(true);
    try {
      const response = await axios.get(API.STATISTICS, {
        headers: {
          Authorization: `Bearer ${localStorage.getItem('authToken')}`
        }
      });
      if (response.data.success) {
        const { statistics } = response.data;
        setDepartmentCount(statistics.departmentCount);
        setStudentCount(statistics.studentCount);
        setFacultyCount(statistics.facultyCount);
      }
    } catch (error) {
      setGlobalMessage({ type: 'error', text: 'Failed to fetch dashboard data' });
    } finally {
      setLoading(false);
    }
  };

  const handleLogout = () => {
    localStorage.removeItem('authToken');
    localStorage.removeItem('principleUser');
    localStorage.removeItem('userType');
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
              className="w-12 h-12 rounded-xl bg-gradient-to-r from-teal-600 to-emerald-600 flex items-center justify-center mb-4"
            >
              <RiGovernmentLine className="text-2xl text-white" />
            </motion.div>
            <h1 className="text-xl font-bold text-gray-800">Principal Dashboard</h1>
            <p className="text-sm text-gray-500">
              {userData?.name}
            </p>
          </div>

          <nav className="space-y-2">
            <motion.button
              whileHover={{ x: 4 }}
              onClick={() => setActiveTab('overview')}
              className={`w-full flex items-center space-x-3 px-4 py-3 rounded-xl transition-all ${
                activeTab === 'overview' ? 'bg-teal-50 text-teal-600' : 'text-gray-600 hover:bg-gray-50'
              }`}
            >
              <RiDashboardLine className="text-xl" />
              <span>Overview</span>
            </motion.button>

            <motion.button
              whileHover={{ x: 4 }}
              onClick={() => setActiveTab('departments')}
              className={`w-full flex items-center space-x-3 px-4 py-3 rounded-xl transition-all ${
                activeTab === 'departments' ? 'bg-teal-50 text-teal-600' : 'text-gray-600 hover:bg-gray-50'
              }`}
            >
              <RiBuilding2Line className="text-xl" />
              <span>Departments</span>
            </motion.button>

            <motion.button
              whileHover={{ x: 4 }}
              onClick={() => setActiveTab('faculty')}
              className={`w-full flex items-center space-x-3 px-4 py-3 rounded-xl transition-all ${
                activeTab === 'faculty' ? 'bg-teal-50 text-teal-600' : 'text-gray-600 hover:bg-gray-50'
              }`}
            >
              <RiTeamLine className="text-xl" />
              <span>Faculty</span>
            </motion.button>

            <motion.button
              whileHover={{ x: 4 }}
              onClick={() => setActiveTab('reports')}
              className={`w-full flex items-center space-x-3 px-4 py-3 rounded-xl transition-all ${
                activeTab === 'reports' ? 'bg-teal-50 text-teal-600' : 'text-gray-600 hover:bg-gray-50'
              }`}
            >
              <RiFileListLine className="text-xl" />
              <span>Reports</span>
            </motion.button>

            <motion.button
              whileHover={{ x: 4 }}
              onClick={() => setActiveTab('profile')}
              className={`w-full flex items-center space-x-3 px-4 py-3 rounded-xl transition-all ${
                activeTab === 'profile' ? 'bg-teal-50 text-teal-600' : 'text-gray-600 hover:bg-gray-50'
              }`}
            >
              <RiUserSettingsLine className="text-xl" />
              <span>Profile Settings</span>
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

              <div className="flex-1 max-w-xl mx-4">
                <div className="relative">
                  <RiSearchLine className="absolute left-3 top-1/2 -translate-y-1/2 text-gray-400" />
                  <input
                    type="text"
                    placeholder="Search..."
                    value={searchQuery}
                    onChange={(e) => setSearchQuery(e.target.value)}
                    className="w-full pl-10 pr-4 py-2 border border-gray-200 rounded-xl focus:outline-none focus:ring-2 focus:ring-teal-500"
                  />
                </div>
              </div>

              <div className="flex items-center space-x-4">
                <div className="text-right">
                  <p className="text-sm font-medium text-gray-900">{userData?.name}</p>
                  <p className="text-xs text-gray-500">Principal</p>
                </div>
                <div className="h-8 w-8 rounded-full bg-teal-600 flex items-center justify-center text-white font-medium">
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
                ? 'Institution Overview'
                : activeTab === 'departments'
                ? 'Department Management'
                : activeTab === 'faculty'
                ? 'Faculty Management'
                : activeTab === 'reports'
                ? 'Institution Reports'
                : 'Profile Settings'}
            </h1>
            <p className="mt-1 text-gray-500">
              {new Date().toLocaleDateString('en-US', { 
                weekday: 'long', 
                year: 'numeric', 
                month: 'long', 
                day: 'numeric' 
              })}
            </p>
          </div>

          {/* Statistics Cards */}
          <div className="grid grid-cols-1 md:grid-cols-3 gap-6 mb-8">
            <motion.div
              whileHover={{ y: -4 }}
              className="bg-white p-6 rounded-xl shadow-sm"
            >
              <div className="flex items-center justify-between">
                <div>
                  <p className="text-sm font-medium text-gray-600">Total Departments</p>
                  <h3 className="text-2xl font-bold text-gray-900 mt-1">{departmentCount}</h3>
                </div>
                <div className="w-12 h-12 rounded-full bg-teal-50 flex items-center justify-center">
                  <RiBuilding2Line className="text-xl text-teal-600" />
                </div>
              </div>
            </motion.div>

            <motion.div
              whileHover={{ y: -4 }}
              className="bg-white p-6 rounded-xl shadow-sm"
            >
              <div className="flex items-center justify-between">
                <div>
                  <p className="text-sm font-medium text-gray-600">Total Faculty</p>
                  <h3 className="text-2xl font-bold text-gray-900 mt-1">{facultyCount}</h3>
                </div>
                <div className="w-12 h-12 rounded-full bg-emerald-50 flex items-center justify-center">
                  <RiTeamLine className="text-xl text-emerald-600" />
                </div>
              </div>
            </motion.div>

            <motion.div
              whileHover={{ y: -4 }}
              className="bg-white p-6 rounded-xl shadow-sm"
            >
              <div className="flex items-center justify-between">
                <div>
                  <p className="text-sm font-medium text-gray-600">Total Students</p>
                  <h3 className="text-2xl font-bold text-gray-900 mt-1">{studentCount}</h3>
                </div>
                <div className="w-12 h-12 rounded-full bg-blue-50 flex items-center justify-center">
                  <RiTeamLine className="text-xl text-blue-600" />
                </div>
              </div>
            </motion.div>
          </div>

          {/* Main Content Card */}
          <motion.div
            initial={{ opacity: 0, y: 20 }}
            animate={{ opacity: 1, y: 0 }}
            className="bg-white rounded-xl shadow-sm overflow-hidden"
          >
            <div className="p-6">
              {/* Dynamic content based on active tab */}
              {activeTab === 'overview' && (
                <div>
                  <h3 className="text-lg font-semibold mb-4">Recent Activities</h3>
                  {/* Add overview content */}
                </div>
              )}

              {activeTab === 'departments' && (
                <div>
                  {/* Department management content */}
                </div>
              )}

              {activeTab === 'faculty' && (
                <div>
                  {/* Faculty management content */}
                </div>
              )}

              {activeTab === 'reports' && (
                <div>
                  {/* Reports content */}
                </div>
              )}

              {activeTab === 'profile' && (
                <div>
                  {/* Profile settings form */}
                </div>
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