import { useState, useEffect } from 'react';
import { motion, AnimatePresence } from 'framer-motion';
import { 
  RiDashboardLine,
  RiLogoutBoxLine,
  RiUpload2Line,
  RiBuilding2Line,
  RiGovernmentLine,
  RiUserSettingsLine
} from 'react-icons/ri';

import PrincipleSubmission from './principleSubmission';
import PrincipleOfficeDetails from './principleofficedetails';
import PrincipleOfficeSubmission from './principleofficesubmission';
import PrincipleDeptDetails from './principledept';
import PrincipleWelcomeDashboard from './principlewelcomedashboard';

function PrincipleDashboard() {
  const [userData, setUserData] = useState(null);
  const [activeTab, setActiveTab] = useState('departmentStatus');
  const [sidebarOpen, setSidebarOpen] = useState(true);
  const [globalMessage, setGlobalMessage] = useState(null);
  const [loginMessage, setLoginMessage] = useState(null);

  // Office/Dept sidebar
  const [activeSidebar, setActiveSidebar] = useState('principal'); // Default to welcome dashboard


  useEffect(() => {
    const storedUser = localStorage.getItem('principleUser');
    if (!storedUser) {
      window.location.href = '/';
      return;
    }
    setUserData(JSON.parse(storedUser));
  }, []);

  useEffect(() => {
    const msg = localStorage.getItem("principleLoginMessage");
    if (msg) {
      setLoginMessage(msg);
      localStorage.removeItem("principleLoginMessage");
      setTimeout(() => setLoginMessage(null), 3500);
    }
  }, []);


  const handleLogout = () => {
    localStorage.removeItem('authToken');
    localStorage.removeItem('principleUser');
    localStorage.removeItem('userType');
    window.location.href = '/';
  };

  return (
    <div className="min-h-screen bg-gray-50 flex">
      {/* Login Success Message */}
      
      <AnimatePresence>
        {loginMessage && (
          <motion.div
            initial={{ opacity: 0, scale: 0.8, y: -40 }}
            animate={{ opacity: 1, scale: 1, y: 0 }}
            exit={{ opacity: 0, scale: 0.8, y: -40 }}
            transition={{ duration: 0.6, type: "spring" }}
            className="fixed top-20 left-1/2 transform -translate-x-1/2 z-50 bg-gradient-to-r from-green-600 to-emerald-600 text-white px-8 py-4 rounded-2xl shadow-2xl text-xl font-bold"
          >
            Login successful!
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
              onClick={() => setActiveSidebar('principal')}
              className={`w-full flex items-center space-x-3 px-4 py-3 rounded-xl transition-all ${
                activeSidebar === 'principal' ? 'bg-teal-50 text-teal-600' : 'text-gray-600 hover:bg-gray-50'
              }`}
            >
              <RiDashboardLine className="text-xl" />
              <span>Dashboard</span>
            </motion.button>
            <motion.button
              whileHover={{ x: 4 }}
              onClick={() => setActiveSidebar('department')}
              className={`w-full flex items-center space-x-3 px-4 py-3 rounded-xl transition-all ${
                activeSidebar === 'department' ? 'bg-teal-50 text-teal-600' : 'text-gray-600 hover:bg-gray-50'
              }`}
            >
              <RiBuilding2Line className="text-xl" />
              <span>Department Details</span>
            </motion.button>
            <motion.button
              whileHover={{ x: 4 }}
              onClick={() => setActiveSidebar('officeDetails')}
              className={`w-full flex items-center space-x-3 px-4 py-3 rounded-xl transition-all ${
                activeSidebar === 'officeDetails' ? 'bg-blue-50 text-blue-600' : 'text-gray-600 hover:bg-blue-50'
              }`}
            >
              <RiUserSettingsLine className="text-xl" />
              <span>Office Details</span>
            </motion.button>
            <motion.button
              whileHover={{ x: 4 }}
              onClick={() => setActiveSidebar('officeSubmission')}
              className={`w-full flex items-center space-x-3 px-4 py-3 rounded-xl transition-all ${
                activeSidebar === 'officeSubmission' ? 'bg-green-50 text-green-700' : 'text-gray-600 hover:bg-green-50'
              }`}
            >
              <RiUpload2Line className="text-xl" />
              <span>Office Submission</span>
            </motion.button>
            <motion.button
              whileHover={{ x: 4 }}
              onClick={() => setActiveSidebar('departmentSubmission')}
              className={`w-full flex items-center space-x-3 px-4 py-3 rounded-xl transition-all ${
                activeSidebar === 'departmentSubmission' ? 'bg-indigo-50 text-indigo-700' : 'text-gray-600 hover:bg-indigo-50'
              }`}
            >
              <RiUpload2Line className="text-xl" />
              <span>Dept Submission</span>
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
                <div className="text-4xl md:text-3xl font-bold tracking-tight text-center bg-gradient-to-r from-teal-600 to-emerald-600 bg-clip-text text-transparent drop-shadow-lg uppercase">
                  GASCKK AISHE PORTAL
                </div>
              </div>
              {/* Right Side User Info */}
              <div className="flex items-center space-x-4">
                <div className="text-right">
                  <div className="text-base font-bold text-gray-900">{userData?.name}</div>
                  <p className="text-xs text-gray-500">Principal</p>
                </div>
                <div className="h-8 w-8 rounded-full bg-teal-600 flex items-center justify-center text-white font-medium">
                  {userData?.name?.[0]?.toUpperCase()}
                </div>
              </div>
            </div>
          </div>
        </div>
          {activeSidebar === 'principal' && (
            <div className="mt-8">
              <PrincipleWelcomeDashboard />
            </div>
          )}
          {activeSidebar === 'department' && (
            <div className="mt-8">
              <PrincipleDeptDetails />
            </div>
          )}
          {activeSidebar === 'officeDetails' && (
            <div className="mt-8">
              <PrincipleOfficeDetails />
            </div>
          )}
          {activeSidebar === 'officeSubmission' && (
            <div className="mt-8">
              <PrincipleOfficeSubmission />
            </div>
          )}
          {activeSidebar === 'departmentSubmission' && (
            <div className="mt-8">
              <PrincipleSubmission />
            </div>
          )}
        
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

export default PrincipleDashboard;