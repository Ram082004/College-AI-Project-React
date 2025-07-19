import React, { useState, useEffect } from 'react';
import BasicInformation from './basic_information';
import StaffEnrollment from './staff_enrollment';
import { motion, AnimatePresence } from 'framer-motion';
import { 
  RiDashboardLine,
  RiTeamLine,
  RiLogoutBoxLine,
  RiSearchLine,
  RiFileListLine,
  RiMailSendLine,
  RiUserSettingsLine,
  RiBuilding4Line,
  RiCalendarCheckLine,
  RiBarChartBoxLine
} from 'react-icons/ri';
import axios from 'axios';

// API endpoints
const API_BASE = 'http://localhost:5000/api/office';
const API = {
  PENDING_REQUESTS: `${API_BASE}/pending-requests`,
  DOCUMENTS: `${API_BASE}/documents`,
  STATISTICS: `${API_BASE}/statistics`,
  PROFILE: `${API_BASE}/profile`
};

export default function OfficeDashboard() {
  const [userData, setUserData] = useState(null);
  const [activeTab, setActiveTab] = useState('overview');
  const [sidebarOpen, setSidebarOpen] = useState(true);
  const [searchQuery, setSearchQuery] = useState('');
  const [loading, setLoading] = useState(false);
  const [globalMessage, setGlobalMessage] = useState(null);

  // Office specific states
  const [pendingRequests, setPendingRequests] = useState(0);
  const [processedToday, setProcessedToday] = useState(0);
  const [recentDocuments, setRecentDocuments] = useState([]);
  const [notifications, setNotifications] = useState([]);

  useEffect(() => {
    const storedUser = localStorage.getItem('officeUser');
    if (!storedUser) {
      window.location.href = '/';
      return;
    }
    setUserData(JSON.parse(storedUser));
    fetchOfficeData();
  }, []);

  const fetchOfficeData = async () => {
    setLoading(true);
    try {
      // This is placeholder data - replace with actual API calls
      setPendingRequests(12);
      setProcessedToday(45);
      setRecentDocuments([
        { id: 1, title: 'Department Report 2023', status: 'pending', date: '2023-12-10' },
        { id: 2, title: 'Faculty Attendance', status: 'approved', date: '2023-12-09' }
      ]);
      setNotifications([
        { id: 1, message: 'New document requires approval', time: '2h ago' },
        { id: 2, message: 'Monthly report due tomorrow', time: '5h ago' }
      ]);
    } catch (error) {
      setGlobalMessage({ type: 'error', text: 'Failed to fetch office data' });
    } finally {
      setLoading(false);
    }
  };

  const handleLogout = () => {
    localStorage.removeItem('authToken');
    localStorage.removeItem('officeUser');
    window.location.href = '/';
  };

  const processRequest = async (id) => {
    try {
      // Add process request logic
      setGlobalMessage({ type: 'success', text: 'Request processed successfully' });
    } catch (error) {
      setGlobalMessage({ type: 'error', text: 'Failed to process request' });
    }
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
              onClick={() => setActiveTab('overview')}
              className={`w-full flex items-center space-x-3 px-4 py-3 rounded-xl transition-all ${
                activeTab === 'overview' ? 'bg-cyan-50 text-cyan-600' : 'text-gray-600 hover:bg-gray-50'
              }`}
            >
              <RiDashboardLine className="text-xl" />
              <span>Overview</span>
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
            <motion.button
              whileHover={{ x: 4 }}
              onClick={() => setActiveTab('staffenrollment')}
              className={`w-full flex items-center space-x-3 px-4 py-3 rounded-xl transition-all ${
                activeTab === 'staffenrollment' ? 'bg-cyan-50 text-cyan-600' : 'text-gray-600 hover:bg-gray-50'
              }`}
            >
              <RiTeamLine className="text-xl" />
              <span>Staff Enrollment</span>
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
                    placeholder="Search documents..."
                    value={searchQuery}
                    onChange={(e) => setSearchQuery(e.target.value)}
                    className="w-full pl-10 pr-4 py-2 border border-gray-200 rounded-xl focus:outline-none focus:ring-2 focus:ring-cyan-500"
                  />
                </div>
              </div>

              <div className="flex items-center space-x-4">
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
        </div>

        {/* Main Content Area */}
        <div className="max-w-7xl mx-auto px-6 py-8">
          <div className="mb-8">
            <h1 className="text-2xl font-bold text-gray-900">
              {activeTab.charAt(0).toUpperCase() + activeTab.slice(1)}
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
          <div className="grid grid-cols-1 md:grid-cols-4 gap-6 mb-8">
            <motion.div
              whileHover={{ y: -4 }}
              className="bg-white p-6 rounded-xl shadow-sm"
            >
              <div className="flex items-center justify-between">
                <div>
                  <p className="text-sm font-medium text-gray-600">Pending Requests</p>
                  <h3 className="text-2xl font-bold text-gray-900 mt-1">{pendingRequests}</h3>
                </div>
                <div className="w-12 h-12 rounded-full bg-cyan-50 flex items-center justify-center">
                  <RiTeamLine className="text-xl text-cyan-600" />
                </div>
              </div>
            </motion.div>

            <motion.div
              whileHover={{ y: -4 }}
              className="bg-white p-6 rounded-xl shadow-sm"
            >
              <div className="flex items-center justify-between">
                <div>
                  <p className="text-sm font-medium text-gray-600">Processed Today</p>
                  <h3 className="text-2xl font-bold text-gray-900 mt-1">{processedToday}</h3>
                </div>
                <div className="w-12 h-12 rounded-full bg-teal-50 flex items-center justify-center">
                  <RiCalendarCheckLine className="text-xl text-teal-600" />
                </div>
              </div>
            </motion.div>
          </div>

          {/* Dynamic Content Based on Active Tab */}
          <motion.div
            initial={{ opacity: 0, y: 20 }}
            animate={{ opacity: 1, y: 0 }}
            className="bg-white rounded-xl shadow-sm overflow-hidden"
          >
            <div className="p-6">
              {activeTab === 'overview' && (
                <div className="space-y-6">
                  <h3 className="text-lg font-semibold mb-4">Recent Activity</h3>
                  <div className="divide-y divide-gray-200">
                    {recentDocuments.map(doc => (
                      <div key={doc.id} className="py-4 flex items-center justify-between">
                        <div>
                          <h4 className="font-medium text-gray-900">{doc.title}</h4>
                          <p className="text-sm text-gray-500">{doc.date}</p>
                        </div>
                        <span className={`px-3 py-1 rounded-full text-sm ${
                          doc.status === 'approved' 
                            ? 'bg-green-100 text-green-800' 
                            : 'bg-yellow-100 text-yellow-800'
                        }`}>
                          {doc.status}
                        </span>
                      </div>
                    ))}
                  </div>
                </div>
              )}
              {activeTab === 'basicinfo' && (
                <BasicInformation />
              )}
              {activeTab === 'staffenrollment' && (
                <StaffEnrollment />
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