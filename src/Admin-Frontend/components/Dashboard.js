import { useState, useEffect } from 'react';
import { motion, AnimatePresence } from 'framer-motion';
import {
  RiDashboardLine,
  RiUserSettingsLine,
  RiTeamLine,
  RiLogoutBoxLine,
  RiBuilding2Line,
  RiFileListLine
} from 'react-icons/ri';
import { FaFilePdf } from 'react-icons/fa';
import { useNavigate } from 'react-router-dom';
import Admin from './admin';
import Department from './department';
import Office from './office';
import SubmittedData from './SubmittedData';
import PdfDownload from "../template/pdfdownload";
import OfficeDetails from "./officedetails";
import OfficeSubmission from "./officesubmission";
import AdminDashboard from './admindashboard';
import DepartmentDetails from './departmentdetails'; // (to be created below)
import axios from 'axios';

// Utility wrapper to ensure background color for all pages
// Removed PageWrapper for full-width layout

const sections = [
  { key: 'basic_information', label: 'Basic Information' },
  { key: 'office_details', label: 'Office Details' },
  { key: 'institution_address', label: 'Address/Location Info' }
];

const sidebarOptions = [
  { key: 'admindashboard', label: 'Dashboard', icon: <RiDashboardLine className="text-2xl" /> },
  { key: 'admin', label: 'Admins', icon: <RiUserSettingsLine className="text-2xl" /> },
  { key: 'department', label: 'Department Users', icon: <RiTeamLine className="text-2xl" /> },
  { key: 'office', label: 'Office Users', icon: <RiBuilding2Line className="text-2xl" /> },
  { key: 'departmentdetails', label: 'Dept Details', icon: <RiBuilding2Line className="text-2xl" /> },
  { key: 'details', label: 'Office Details', icon: <RiBuilding2Line className="text-2xl" /> },
  { key: 'submittedData', label: 'Dept Submission', icon: <RiFileListLine className="text-2xl" /> }, // <-- Change label here
  { key: 'submission', label: 'Office Submission', icon: <RiFileListLine className="text-2xl" /> },
  { key: 'report', label: 'Report', icon: <FaFilePdf className="text-2xl" /> },
];

export default function Dashboard() {
  const [activeTab, setActiveTab] = useState('admindashboard'); // Default to dashboard
  const [sidebarOpen, setSidebarOpen] = useState(true);
  const [userData, setUserData] = useState(null);
  const [adminAcademicYear, setAdminAcademicYear] = useState('');
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

  useEffect(() => {
    async function fetchAdminYear() {
      try {
        const res = await axios.get('http://localhost:5000/api/admin/all', {
          headers: { Authorization: `Bearer ${localStorage.getItem('authToken')}` }
        });
        if (res.data.admins && res.data.admins.length > 0) {
          setAdminAcademicYear(res.data.admins[0].academic_year || '');
        }
      } catch {}
    }
    fetchAdminYear();
  }, []);

  // --- UI ---
  return (
    <div className="min-h-screen bg-gradient-to-br from-blue-50 via-white to-indigo-100 flex">
      {/* Sidebar */}
      <motion.div
        initial={{ x: -300 }}
        animate={{ x: sidebarOpen ? 0 : -300 }}
        className="fixed left-0 top-0 h-full w-64 bg-white shadow-2xl z-50 border-r border-gray-100 flex flex-col"
        style={{ maxHeight: '100vh' }}
      >
        <div className="p-4 flex flex-col items-center">
          <motion.div
            initial={{ scale: 0 }}
            animate={{ scale: 1 }}
            className="w-12 h-12 rounded-xl bg-gradient-to-br from-blue-600 to-indigo-600 flex items-center justify-center mb-2 shadow-lg"
          >
            <span className="text-2xl font-extrabold text-white tracking-widest">A</span>
          </motion.div>
          <h1 className="text-base font-extrabold text-gray-800 mb-1">GASCKK AISHE PORTAL</h1>
          <p className="text-xs text-gray-400 mb-3">Admin Panel</p>
        </div>
        <nav className="flex-1 space-y-1 px-2 overflow-y-auto scrollbar-thin scrollbar-thumb-gray-200 scrollbar-track-transparent">
          {sidebarOptions.map(opt => (
            <motion.button
              key={opt.key}
              whileHover={{ scale: 1.02 }}
              onClick={() => setActiveTab(opt.key)}
              className={`w-full flex items-center gap-2 px-3 py-2 rounded-xl font-semibold text-base transition-all ${
                activeTab === opt.key ? 'bg-blue-100 text-blue-700 shadow' : 'text-gray-600 hover:bg-gray-50'
              }`}
              style={{ minHeight: 40 }}
            >
              {opt.icon}
              {opt.label}
            </motion.button>
          ))}
        </nav>
        <div className="p-3 mt-auto">
          <motion.button
            whileHover={{ scale: 1.03 }}
            onClick={handleLogout}
            className="w-full flex items-center justify-center gap-2 px-3 py-2 rounded-xl bg-red-50 text-red-600 hover:bg-red-100 font-semibold text-base shadow transition-all"
          >
            <RiLogoutBoxLine className="text-xl" />
            Logout
          </motion.button>
        </div>
      </motion.div>

      {/* Main Content */}
      <div className={`flex-1 ${sidebarOpen ? 'ml-64' : 'ml-0'} transition-all duration-300`}>  
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
                <div className="text-4xl md:text-3xl font-bold tracking-tight text-center bg-gradient-to-r from-blue-600 to-indigo-600 bg-clip-text text-transparent drop-shadow-lg uppercase">
            GASCKK AISHE PORTAL
                </div>
              </div>
              <div className="flex items-center gap-4 ml-4">
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
        <div
          className="mx-auto px-8 py-10"
          style={{
            width: "80vw",
            maxWidth: "1600px",
            minWidth: "900px", // Optional: prevent too small on large screens
            transition: "width 0.2s"
          }}
        >
          {/* Directly render content without inner container */}
          {activeTab === 'admindashboard' && <AdminDashboard academicYear={adminAcademicYear} nodalOfficerName={userData?.name || ''} />}
          {activeTab === 'admin' && <Admin adminAcademicYear={adminAcademicYear} />}
          {activeTab === 'department' && <Department adminAcademicYear={adminAcademicYear} />}
          {activeTab === 'office' && <Office adminAcademicYear={adminAcademicYear} />}
          {activeTab === 'departmentdetails' && <DepartmentDetails adminAcademicYear={adminAcademicYear} />}
          {activeTab === 'details' && <OfficeDetails adminAcademicYear={adminAcademicYear} />}
          {activeTab === 'submittedData' && <SubmittedData adminAcademicYear={adminAcademicYear} />}
          {activeTab === 'submission' && <OfficeSubmission adminAcademicYear={adminAcademicYear} />}
          {activeTab === 'report' && <PdfDownload adminAcademicYear={adminAcademicYear} />}
        </div>
      </div>
    </div>
  );
}
