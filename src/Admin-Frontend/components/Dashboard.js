import { useState, useEffect } from 'react';
import { motion, AnimatePresence } from 'framer-motion';
import {
  RiDashboardLine,
  RiUserSettingsLine,
  RiTeamLine,
  RiLogoutBoxLine,
  RiSearchLine,
  RiAddLine,
  RiCloseLine,
  RiBuilding2Line,
  RiFileListLine
} from 'react-icons/ri';
import { useNavigate } from 'react-router-dom';
import Admin from './admin';
import Department from './department';
import Office from './office';
import SubmittedData from './SubmittedData';

// Utility wrapper to ensure background color for all pages
function PageWrapper({ children }) {
  return (
    <div className="bg-white rounded-3xl shadow-lg p-8 min-h-[60vh] border border-gray-100">
      {children}
    </div>
  );
}

export default function Dashboard() {
  const [activeTab, setActiveTab] = useState('admin');
  const [sidebarOpen, setSidebarOpen] = useState(true);
  const [searchQuery, setSearchQuery] = useState('');
  const [userData, setUserData] = useState(null);
  const navigate = useNavigate();

  // Handle logout
  const handleLogout = () => {
    localStorage.removeItem('authToken');
    localStorage.removeItem('departmentUser');
    window.location.href = '/';
  };

  // On mount, set userData from localStorage
  useEffect(() => {
    const storedUser = localStorage.getItem('user');
    if (storedUser) {
      setUserData(JSON.parse(storedUser));
    }
  }, []);

  // --- UI ---
  return (
    <div className="min-h-screen bg-gradient-to-br from-blue-50 via-white to-indigo-100 flex">
      {/* Sidebar */}
      <motion.div
        initial={{ x: -300 }}
        animate={{ x: sidebarOpen ? 0 : -300 }}
        className="fixed left-0 top-0 h-full w-72 bg-white shadow-2xl z-50 border-r border-gray-100 flex flex-col"
      >
        <div className="p-8 flex flex-col items-center">
          <motion.div
            initial={{ scale: 0 }}
            animate={{ scale: 1 }}
            className="w-16 h-16 rounded-2xl bg-gradient-to-br from-blue-600 to-indigo-600 flex items-center justify-center mb-4 shadow-lg"
          >
            <span className="text-3xl font-extrabold text-white tracking-widest">A</span>
          </motion.div>
          <h1 className="text-2xl font-extrabold text-gray-800 mb-2">AISHE Portal</h1>
          <p className="text-xs text-gray-400 mb-6">Admin Panel</p>
        </div>
        <nav className="flex-1 space-y-2 px-4">
          <motion.button
            whileHover={{ scale: 1.03 }}
            onClick={() => setActiveTab('admin')}
            className={`w-full flex items-center gap-3 px-5 py-3 rounded-2xl font-semibold text-lg transition-all ${activeTab === 'admin' ? 'bg-blue-100 text-blue-700 shadow' : 'text-gray-600 hover:bg-gray-50'}`}
          >
            <RiUserSettingsLine className="text-2xl" />
            Admins
          </motion.button>
          <motion.button
            whileHover={{ scale: 1.03 }}
            onClick={() => setActiveTab('department')}
            className={`w-full flex items-center gap-3 px-5 py-3 rounded-2xl font-semibold text-lg transition-all ${activeTab === 'department' ? 'bg-blue-100 text-blue-700 shadow' : 'text-gray-600 hover:bg-gray-50'}`}
          >
            <RiTeamLine className="text-2xl" />
            Department Users
          </motion.button>
          <motion.button
            whileHover={{ scale: 1.03 }}
            onClick={() => setActiveTab('office')}
            className={`w-full flex items-center gap-3 px-5 py-3 rounded-2xl font-semibold text-lg transition-all ${activeTab === 'office' ? 'bg-blue-100 text-blue-700 shadow' : 'text-gray-600 hover:bg-gray-50'}`}
          >
            <RiBuilding2Line className="text-2xl" />
            Office Users
          </motion.button>
          <motion.button
            whileHover={{ scale: 1.03 }}
            onClick={() => setActiveTab('submittedData')}
            className={`w-full flex items-center gap-3 px-5 py-3 rounded-2xl font-semibold text-lg transition-all ${activeTab === 'submittedData' ? 'bg-blue-100 text-blue-700 shadow' : 'text-gray-600 hover:bg-gray-50'}`}
          >
            <RiFileListLine className="text-2xl" />
            Submitted Data
          </motion.button>
        </nav>
        <div className="p-6 mt-auto">
          <motion.button
            whileHover={{ scale: 1.04 }}
            onClick={handleLogout}
            className="w-full flex items-center justify-center gap-2 px-4 py-3 rounded-2xl bg-red-50 text-red-600 hover:bg-red-100 font-semibold text-lg shadow transition-all"
          >
            <RiLogoutBoxLine className="text-xl" />
            Logout
          </motion.button>
        </div>
      </motion.div>

      {/* Main Content */}
      <div className={`flex-1 ${sidebarOpen ? 'ml-72' : 'ml-0'} transition-all duration-300`}>  
        {/* Header */}
        <div className="bg-white/80 shadow-sm sticky top-0 z-30 backdrop-blur border-b border-gray-100">
          <div className="max-w-7xl mx-auto px-8 py-5 flex items-center justify-between">
            <button
              onClick={() => setSidebarOpen(!sidebarOpen)}
              className="p-2 rounded-lg hover:bg-gray-100"
            >
              <RiDashboardLine className="text-2xl text-gray-600" />
            </button>
            <div className="flex-1 max-w-xl mx-8">
              <div className="relative">
                <RiSearchLine className="absolute left-3 top-1/2 -translate-y-1/2 text-gray-400" />
                <input
                  type="text"
                  placeholder="Search..."
                  value={searchQuery}
                  onChange={(e) => setSearchQuery(e.target.value)}
                  className="w-full pl-10 pr-4 py-2 border border-gray-200 rounded-xl focus:outline-none focus:ring-2 focus:ring-blue-500 bg-white shadow-sm"
                />
              </div>
            </div>
            <div className="flex items-center gap-4">
              <div className="text-right">
                <p className="text-base font-bold text-gray-900">{userData?.username}</p>
                <p className="text-xs text-gray-500">Administrator</p>
              </div>
              <div className="h-10 w-10 rounded-full bg-gradient-to-br from-blue-600 to-indigo-600 flex items-center justify-center text-white font-bold text-lg shadow">
                {userData?.username?.[0]?.toUpperCase()}
              </div>
            </div>
          </div>
        </div>

        {/* Page Content */}
        <div className="max-w-7xl mx-auto px-8 py-10">
          <div className="flex gap-4 mb-8">
            <button
              className={`px-6 py-2 rounded-2xl font-bold text-base shadow transition-all ${activeTab === 'admin' ? 'bg-blue-600 text-white' : 'bg-gray-200 text-gray-800 hover:bg-blue-100'}`}
              onClick={() => setActiveTab('admin')}
            >
              Admins
            </button>
            <button
              className={`px-6 py-2 rounded-2xl font-bold text-base shadow transition-all ${activeTab === 'department' ? 'bg-blue-600 text-white' : 'bg-gray-200 text-gray-800 hover:bg-blue-100'}`}
              onClick={() => setActiveTab('department')}
            >
              Department Users
            </button>
            <button
              className={`px-6 py-2 rounded-2xl font-bold text-base shadow transition-all ${activeTab === 'office' ? 'bg-blue-600 text-white' : 'bg-gray-200 text-gray-800 hover:bg-blue-100'}`}
              onClick={() => setActiveTab('office')}
            >
              Office Users
            </button>
            <button
              className={`px-6 py-2 rounded-2xl font-bold text-base shadow transition-all ${activeTab === 'submittedData' ? 'bg-blue-600 text-white' : 'bg-gray-200 text-gray-800 hover:bg-blue-100'}`}
              onClick={() => setActiveTab('submittedData')}
            >
              Submitted Data
            </button>
          </div>
          <PageWrapper>
            {activeTab === 'admin' && <Admin />}
            {activeTab === 'department' && <Department />}
            {activeTab === 'office' && <Office />}
            {activeTab === 'submittedData' && <SubmittedData />}
          </PageWrapper>
        </div>
      </div>
    </div>
  );
}
