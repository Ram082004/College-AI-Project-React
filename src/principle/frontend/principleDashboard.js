import React, { useState, useEffect } from 'react';
import { motion, AnimatePresence } from 'framer-motion';
import { 
  RiDashboardLine,
  RiLogoutBoxLine,
  RiSearchLine,
  RiFileListLine,
  RiUpload2Line,
  RiUserSettingsLine,
  RiBuilding2Line,
  RiBarChartBoxLine,
  RiTeamLine,
  RiGovernmentLine
} from 'react-icons/ri';
import axios from 'axios';
import PrincipleDeptDetails from './principledept'; // new component for details

const API_BASE = 'http://localhost:5000/api/principle';
const API = {
  DEPARTMENTS: `${API_BASE}/departments`,
  DEPARTMENTS_LIST: 'http://localhost:5000/api/principle/departments-list',
  DEPARTMENT_DETAILS: (deptId) => `http://localhost:5000/api/principle/department-details/${deptId}`,
};

export default function PrincipleDashboard() {
  const [userData, setUserData] = useState(null);
  const [activeTab, setActiveTab] = useState('overview');
  const [sidebarOpen, setSidebarOpen] = useState(true);
  const [searchQuery, setSearchQuery] = useState('');
  const [loading, setLoading] = useState(false);
  const [globalMessage, setGlobalMessage] = useState(null);

  // Institution specific states
  const [recentReports, setRecentReports] = useState([]);
  // Static master list for all departments (edit as needed)
  const departmentMasterList = [
    { dept_id: 1, department: 'B.C.A' },
    { dept_id: 2, department: 'B.A ENGLISH' },
    { dept_id: 3, department: 'M.A ENGLISH' },
    { dept_id: 4, department: 'BBA' },
    { dept_id: 5, department: 'B.COM' },
    { dept_id: 6, department: 'B.SC MATHS' },
    { dept_id: 7, department: 'M.SC MATHS' },
    { dept_id: 8, department: 'B.SC CHEMISTRY' }
  ];
  const [departments, setDepartments] = useState([]);
  const [selectedDept, setSelectedDept] = useState(null);

  useEffect(() => {
    const storedUser = localStorage.getItem('principleUser');
    if (!storedUser) {
      window.location.href = '/';
      return;
    }
    setUserData(JSON.parse(storedUser));
  }, []);

  useEffect(() => {
    if (activeTab === 'departmentStatus') {
      axios.get(API.DEPARTMENTS_LIST)
        .then(res => {
          if (res.data.success && Array.isArray(res.data.departments)) {
            // Merge backend list with master list, prefer master for display
            const backendDepts = res.data.departments;
            // Map by department name (case-insensitive)
            const backendMap = new Map(backendDepts.map(d => [(d.department || '').toUpperCase(), d]));
            const merged = departmentMasterList.map(master => {
              const found = backendMap.get(master.department.toUpperCase());
              return found ? { ...master, ...found } : master;
            });
            setDepartments(merged);
          } else {
            setDepartments(departmentMasterList);
          }
        })
        .catch(() => setDepartments(departmentMasterList));
    }
  }, [activeTab]);



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
              onClick={() => setActiveTab('departmentStatus')}
              className={`w-full flex items-center space-x-3 px-4 py-3 rounded-xl transition-all ${
                activeTab === 'departmentStatus' ? 'bg-teal-50 text-teal-600' : 'text-gray-600 hover:bg-gray-50'
              }`}
            >
              <RiBuilding2Line className="text-xl" />
              <span>Department Details</span>
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


          {/* Department Status Tab Content */}
          {activeTab === 'departmentStatus' && (
            <div className="mt-8">
              <h2 className="text-2xl font-extrabold text-center text-gradient bg-gradient-to-r from-teal-600 via-blue-500 to-purple-600 bg-clip-text text-transparent mb-8">Departments</h2>
              <div className="grid grid-cols-1 sm:grid-cols-2 md:grid-cols-3 lg:grid-cols-4 xl:grid-cols-5 gap-6">
                {departments.length === 0 ? (
                  <div className="col-span-full text-center text-gray-400 py-8">No departments found.</div>
                ) : (
                  departments.map((dept, idx) => (
                    <motion.div
                      key={dept.dept_id + '-' + idx}
                      whileHover={{ scale: 1.04 }}
                      whileTap={{ scale: 0.98 }}
                      className={`relative bg-gradient-to-br from-white via-blue-50 to-teal-50 p-4 rounded-2xl shadow-lg cursor-pointer transition-all border-2 ${
                        selectedDept === dept.dept_id ? 'border-teal-500 ring-2 ring-teal-300' : 'border-gray-100 hover:border-teal-400'
                      } group`}
                      onClick={() => setSelectedDept(dept.dept_id)}
                    >
                      <div className="flex flex-col items-center justify-center h-full min-h-[70px]">
                        <span className="block text-xs uppercase tracking-widest text-teal-500 font-bold mb-1">Department</span>
                        <h3 className="text-base font-extrabold text-gray-800 mb-1 text-center group-hover:text-teal-700 transition-all">{dept.department || dept.dept_name || 'Department'}</h3>
                        <div className="flex flex-col items-center mt-1">
                          <span className="text-xs text-gray-400">{dept.head_of_department || ''}</span>
                          <span className="text-xs text-gray-400">{dept.contact_number || ''}</span>
                        </div>
                      </div>
                      {selectedDept === dept.dept_id && (
                        <span className="absolute top-2 right-2 bg-teal-500 text-white text-xs px-2 py-1 rounded-full shadow">Selected</span>
                      )}
                    </motion.div>
                  ))
                )}
              </div>

              {/* Department Details Component */}
              {selectedDept && (
                <div className="mt-8">
                  <PrincipleDeptDetails deptId={selectedDept} />
                </div>
              )}
            </div>
          )}
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