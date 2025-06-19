import { useEffect, useState } from 'react';
import axios from 'axios';
import { useNavigate } from 'react-router-dom';
import { motion, AnimatePresence } from 'framer-motion';
import {
  RiDashboardLine,
  RiUserSettingsLine,
  RiTeamLine,
  RiLogoutBoxLine,
  RiSearchLine,
  RiAddLine,
  RiCloseLine,
  RiBuilding2Line
} from 'react-icons/ri';

// API endpoints
const API_BASE = 'http://localhost:5000/api';
const API = {
  ADMIN_ALL: `${API_BASE}/admin/all`,
  ADMIN_UPDATE: (id) => `${API_BASE}/admin/${id}`,
  ADMIN_ADD: `${API_BASE}/admin`,
  ADMIN_DELETE: (id) => `${API_BASE}/admin/${id}`,
  DEPT_USER_ADD: `${API_BASE}/department-user`,
  DEPT_USER_ALL: `${API_BASE}/department-user`,
  DEPT_USER_UPDATE: (id) => `${API_BASE}/department-user/${id}`,
  DEPT_USER_DELETE: (id) => `${API_BASE}/department-user/${id}`,
  DEPT_USER_LOCK: (id) => `${API_BASE}/department-user/${id}/lock`,
  OFFICE_USER_ALL: `${API_BASE}/office-user/office-users`,
  OFFICE_USER_ADD: `${API_BASE}/office-user`,
  OFFICE_USER_UPDATE: (id) => `${API_BASE}/office-user/${id}`,
  OFFICE_USER_DELETE: (id) => `${API_BASE}/office-user/${id}`,
  OFFICE_USER_LOCK: (id) => `${API_BASE}/office-user/${id}/lock`,
};

export default function Dashboard() {
  const [userData, setUserData] = useState(null);
  const [activeTab, setActiveTab] = useState('admin');
  const [admins, setAdmins] = useState([]);
  const [editId, setEditId] = useState(null);
  const [editForm, setEditForm] = useState({
    username: '',
    email: '',
    name: '',
    mobile: '',
    role: '',
    password: '',
  });

  // Department Users
  const [departmentUsers, setDepartmentUsers] = useState([]);
  const [deptUserEditId, setDeptUserEditId] = useState(null);
  const [deptUserEditForm, setDeptUserEditForm] = useState({
    name: '',
    username: '',
    email: '',
    mobile: '',
    department: '',
    dept_id: '',
    academic_year: '',
    degree_level: '',
    duration: '',
    password: ''
  });
  const [newUser, setNewUser] = useState({
    name: '',
    username: '',
    email: '',
    mobile: '',
    department: '',
    dept_id: '',
    academic_year: '',
    degree_level: '',
    duration: '',
    password: ''
  });
  const [academicYears, setAcademicYears] = useState([]);

  // Office Users
  const [officeUsers, setOfficeUsers] = useState([]);
  const [officeUserEditId, setOfficeUserEditId] = useState(null);
  const [officeUserEditForm, setOfficeUserEditForm] = useState({
    name: '',
    username: '',
    email: '',
    mobile: '',
    office_id: '',
    password: '',
  });
  const [newOfficeUser, setNewOfficeUser] = useState({
    name: '',
    username: '',
    email: '',
    mobile: '',
    office_id: '',
    password: '',
  });

  // UI State
  const [loading, setLoading] = useState(false);
  const [deptUserLoading, setDeptUserLoading] = useState(false);
  const [officeUserLoading, setOfficeUserLoading] = useState(false);
  const [showDeptUserForm, setShowDeptUserForm] = useState(false);
  const [showAdminForm, setShowAdminForm] = useState(false);
  const [showOfficeUserForm, setShowOfficeUserForm] = useState(false);
  const [globalMessage, setGlobalMessage] = useState(null);
  const [searchQuery, setSearchQuery] = useState('');
  const [sidebarOpen, setSidebarOpen] = useState(true);
  const [newAdmin, setNewAdmin] = useState({
    username: '',
    email: '',
    name: '',
    mobile: '',
    role: 'Admin',
    password: '',
  });

  const navigate = useNavigate();

  // Fetch all admins
  const fetchAdmins = async () => {
    setLoading(true);
    try {
      const res = await axios.get(API.ADMIN_ALL, {
        headers: { Authorization: `Bearer ${localStorage.getItem('authToken')}` },
      });
      setAdmins(res.data.admins || []);
    } catch (err) {
      setGlobalMessage({ type: 'error', text: 'Failed to fetch admins' });
    } finally {
      setLoading(false);
    }
  };

  // Fetch all department users
  const fetchDepartmentUsers = async () => {
    setDeptUserLoading(true);
    try {
      const res = await axios.get(API.DEPT_USER_ALL, {
        headers: { Authorization: `Bearer ${localStorage.getItem('authToken')}` },
      });
      setDepartmentUsers(res.data.users || []); // Ensure academic_year is included in the response
    } catch (err) {
      setGlobalMessage({ type: 'error', text: 'Failed to fetch department users' });
    } finally {
      setDeptUserLoading(false);
    }
  };

  // Fetch all office users
  const fetchOfficeUsers = async () => {
    setOfficeUserLoading(true);
    try {
      const res = await axios.get(API.OFFICE_USER_ALL, {
        headers: { Authorization: `Bearer ${localStorage.getItem('authToken')}` },
      });
      setOfficeUsers(res.data.users || []);
    } catch (err) {
      setGlobalMessage({ type: 'error', text: 'Failed to fetch office users' });
    } finally {
      setOfficeUserLoading(false);
    }
  };

  useEffect(() => {
    const storedUser = localStorage.getItem('user');
    const token = localStorage.getItem('authToken');
    if (!storedUser || !token) {
      navigate('/');
      return;
    }
    setUserData(JSON.parse(storedUser));
    fetchAdmins();
    fetchDepartmentUsers();
    fetchOfficeUsers();
  }, []);

  useEffect(() => {
    if (!userData) navigate('/');
  }, [userData, navigate]);

  const handleLogout = () => {
   localStorage.removeItem('authToken');
    localStorage.removeItem('departmentUser');
    window.location.href = '/';
  };

  // Edit button click
  const handleEdit = (admin) => {
    setEditId(admin.id);
    setEditForm({
      username: admin.username,
      email: admin.email,
      name: admin.name,
      mobile: admin.mobile,
      role: admin.role,
      password: '', // Empty for security
    });
  };

  // Cancel edit
  const handleCancelEdit = () => {
    setEditId(null);
    setEditForm({
      username: '',
      email: '',
      name: '',
      mobile: '',
      role: '',
      password: '',
    });
  };

  // Edit form change
  const handleEditChange = (e) => {
    setEditForm({ ...editForm, [e.target.name]: e.target.value });
  };

  // Update admin
  const handleUpdateAdmin = async (id) => {
    try {
      const payload = { ...editForm };
      if (!payload.password) delete payload.password; // Only send password if filled

      const res = await axios.put(API.ADMIN_UPDATE(id), payload, {
        headers: {
          Authorization: `Bearer ${localStorage.getItem('authToken')}`,
        },
      });

      if (res.data.success) {
        setGlobalMessage({ type: 'success', text: res.data.message });
        fetchAdmins();
        setEditId(null);
      } else {
        setGlobalMessage({ type: 'error', text: res.data.message || 'Update failed' });
      }
    } catch (err) {
      console.error('Failed to update admin:', err);
      setGlobalMessage({ type: 'error', text: 'Failed to update admin' });
    }
  };

  // New user form change
  const handleNewUserChange = (e) => {
    setNewUser({ ...newUser, [e.target.name]: e.target.value });
  };

  // New user form submit
  const handleNewUserSubmit = async (e) => {
    e.preventDefault();
    setDeptUserLoading(true);
    setGlobalMessage(null);

    try {
      const res = await axios.post(API.DEPT_USER_ADD, newUser, {
        headers: {
          Authorization: `Bearer ${localStorage.getItem('authToken')}`,
          'Content-Type': 'application/json',
        },
      });

      if (res.data.success) {
        setGlobalMessage({ type: 'success', text: res.data.message });
        setNewUser({
          name: '',
          username: '',
          email: '',
          mobile: '',
          department: '',
          dept_id: '',
          password: '', // Reset password
          academic_year: '' // Reset academic year
        });
        setShowDeptUserForm(false);
        fetchDepartmentUsers();
      } else {
        setGlobalMessage({ type: 'error', text: res.data.message || 'Failed to add user' });
      }
    } catch (err) {
      console.error('Error adding user:', err);
      setGlobalMessage({ type: 'error', text: 'An error occurred while adding the user' });
    } finally {
      setDeptUserLoading(false);
    }
  };

  // Edit department user
  const handleDeptUserEdit = (user) => {
    setDeptUserEditId(user.id);
    setDeptUserEditForm({
      name: user.name || '',
      username: user.username || '',
      email: user.email || '',
      mobile: user.mobile || '',
      department: user.department || '',
      dept_id: user.dept_id || '',
      academic_year: user.academic_year || '',
      degree_level: user.degree_level || '',
      duration: user.duration || '',
      password: ''
    });
  };

  // Cancel department user edit
  const handleDeptUserCancelEdit = () => {
    setDeptUserEditId(null);
    setDeptUserEditForm({
      name: '',
      username: '',
      email: '',
      mobile: '',
      department: '',
      dept_id: '', 
    });
  };

  // Update department user
  const handleDeptUserUpdate = async (id) => {
    try {
      // Only send password if filled
      const payload = { ...deptUserEditForm };
      if (!payload.password) delete payload.password;

      const res = await axios.put(API.DEPT_USER_UPDATE(id), payload, {
        headers: {
          Authorization: `Bearer ${localStorage.getItem('authToken')}`,
        },
      });
      if (res.data.success) {
        setGlobalMessage({ type: 'success', text: 'Department user updated successfully' });
        fetchDepartmentUsers();
        handleDeptUserCancelEdit();
      } else {
        setGlobalMessage({ type: 'error', text: res.data.message || 'Update failed' });
      }
    } catch (err) {
      console.error('Failed to update department user:', err);
      setGlobalMessage({ type: 'error', text: 'Failed to update department user' });
    }
  };

  // Delete department user
  const handleDeptUserDelete = async (id) => {
    if (!window.confirm('Are you sure you want to delete this user?')) return;
    try {
      const res = await axios.delete(API.DEPT_USER_DELETE(id), {
        headers: {
          Authorization: `Bearer ${localStorage.getItem('authToken')}`,
        },
      });
      if (res.data.success) {
        setGlobalMessage({ type: 'success', text: 'Department user deleted successfully' });
        fetchDepartmentUsers();
      } else {
        setGlobalMessage({ type: 'error', text: res.data.message || 'Delete failed' });
      }
    } catch (err) {
      console.error('Failed to delete department user:', err);
      setGlobalMessage({ type: 'error', text: 'Failed to delete department user' });
    }
  };

  // Add lock/unlock functionality
  const handleDeptUserLockToggle = async (id, locked) => {
    try {
      const res = await axios.patch(API.DEPT_USER_LOCK(id), { locked }, {
        headers: {
          Authorization: `Bearer ${localStorage.getItem('authToken')}`,
        },
      });
      if (res.data.success) {
        setGlobalMessage({ type: 'success', text: `Department user ${locked ? 'locked' : 'unlocked'} successfully` });
        fetchDepartmentUsers();
      } else {
        setGlobalMessage({ type: 'error', text: res.data.message || 'Failed to update lock status' });
      }
    } catch (err) {
      console.error('Failed to update lock status:', err);
      setGlobalMessage({ type: 'error', text: 'Failed to update lock status' });
    }
  };

  // Admin handlers (edit, update, delete, add) ... unchanged

  // Office User Handlers
  const handleOfficeUserEdit = (user) => {
    setOfficeUserEditId(user.id);
    setOfficeUserEditForm({
      name: user.name,
      username: user.username,
      email: user.email,
      mobile: user.mobile,
      office_id: user.office_id,
      password: '',
    });
  };

  const handleOfficeUserCancelEdit = () => {
    setOfficeUserEditId(null);
    setOfficeUserEditForm({
      name: '',
      username: '',
      email: '',
      mobile: '',
      office_id: '',
      password: '',
    });
  };

  const handleOfficeUserEditChange = (e) => {
    setOfficeUserEditForm({ ...officeUserEditForm, [e.target.name]: e.target.value });
  };

  const handleUpdateOfficeUser = async (id) => {
    try {
      const payload = { ...officeUserEditForm };
      if (!payload.password) delete payload.password;
      const res = await axios.put(API.OFFICE_USER_UPDATE(id), payload, {
        headers: { Authorization: `Bearer ${localStorage.getItem('authToken')}` },
      });
      if (res.data.success) {
        setGlobalMessage({ type: 'success', text: res.data.message });
        fetchOfficeUsers();
        setOfficeUserEditId(null);
      } else {
        setGlobalMessage({ type: 'error', text: res.data.message || 'Update failed' });
      }
    } catch (err) {
      setGlobalMessage({ type: 'error', text: 'Failed to update office user' });
    }
  };

  const handleNewOfficeUserChange = (e) => {
    setNewOfficeUser({ ...newOfficeUser, [e.target.name]: e.target.value });
  };

  const handleNewOfficeUserSubmit = async (e) => {
    e.preventDefault();
    setOfficeUserLoading(true);
    setGlobalMessage(null);
    try {
      const res = await axios.post(API.OFFICE_USER_ADD, newOfficeUser, {
        headers: {
          Authorization: `Bearer ${localStorage.getItem('authToken')}`,
          'Content-Type': 'application/json',
        },
      });
      if (res.data.success) {
        setGlobalMessage({ type: 'success', text: res.data.message });
        setNewOfficeUser({
          name: '',
          username: '',
          email: '',
          mobile: '',
          office_id: '',
          password: '',
        });
        setShowOfficeUserForm(false);
        fetchOfficeUsers();
      } else {
        setGlobalMessage({ type: 'error', text: res.data.message || 'Failed to add office user' });
      }
    } catch (err) {
      setGlobalMessage({ type: 'error', text: 'An error occurred while adding the office user' });
    } finally {
      setOfficeUserLoading(false);
    }
  };

  const handleDeleteOfficeUser = async (id) => {
    if (!window.confirm('Are you sure you want to delete this office user?')) return;
    try {
      const res = await axios.delete(API.OFFICE_USER_DELETE(id), {
        headers: { Authorization: `Bearer ${localStorage.getItem('authToken')}` },
      });
      if (res.data.success) {
        setGlobalMessage({ type: 'success', text: 'Office user deleted successfully' });
        fetchOfficeUsers();
      } else {
        setGlobalMessage({ type: 'error', text: res.data.message || 'Delete failed' });
      }
    } catch (err) {
      setGlobalMessage({ type: 'error', text: 'Failed to delete office user' });
    }
  };

  const handleOfficeUserLockToggle = async (id, locked) => {
    try {
      const res = await axios.patch(API.OFFICE_USER_LOCK(id), { locked }, {
        headers: { Authorization: `Bearer ${localStorage.getItem('authToken')}` },
      });
      if (res.data.success) {
        setGlobalMessage({ type: 'success', text: `Office user ${locked ? 'locked' : 'unlocked'} successfully` });
        fetchOfficeUsers();
      } else {
        setGlobalMessage({ type: 'error', text: res.data.message || 'Failed to update lock status' });
      }
    } catch (err) {
      setGlobalMessage({ type: 'error', text: 'Failed to update lock status' });
    }
  };

  const departmentOptions = [
    'B.C.A',
    'B.COM',
    'BBA',
    'B.A English',
    'M.A English',
    'B.SC Maths',
    'M.SC Maths',
    'B.SC Chemistry',
  ];

  useEffect(() => {
    if (globalMessage) {
      const timer = setTimeout(() => {
        setGlobalMessage(null); // Clear the message after 3 seconds
      }, 3000); // Set timeout duration to 3 seconds

      return () => clearTimeout(timer); // Cleanup timer on component unmount
    }
  }, [globalMessage]);

  if (!userData) {
    return null; // Prevent rendering if userData is null
  }

  // Handle new admin form input changes
  const handleNewAdminChange = (e) => {
    setNewAdmin({ ...newAdmin, [e.target.name]: e.target.value });
  };

  // Handle new admin form submission
  const handleNewAdminSubmit = async (e) => {
    e.preventDefault();
    setLoading(true);
    setGlobalMessage(null);

    try {
      if (!newAdmin.role || !newAdmin.password) {
        setGlobalMessage({ type: 'error', text: 'Role and password are required' });
        setLoading(false);
        return;
      }

      const res = await axios.post(API.ADMIN_ADD, newAdmin, {
        headers: {
          Authorization: `Bearer ${localStorage.getItem('authToken')}`,
          'Content-Type': 'application/json',
        },
      });

      if (res.data.success) {
        setGlobalMessage({ type: 'success', text: res.data.message });
        setNewAdmin({
          username: '',
          email: '',
          name: '',
          mobile: '',
          role: 'Admin', // <-- Fix: default to 'Admin'
          password: '',
        });
        fetchAdmins();
        setShowAdminForm(false);
      } else {
        setGlobalMessage({ type: 'error', text: res.data.message || 'Failed to add admin' });
      }
    } catch (err) {

      console.error('Error adding admin:', err);
      setGlobalMessage({ type: 'error', text: 'An error occurred while adding the admin' });
    } finally {
      setLoading(false);
    }
  };

  // Delete admin
  const handleDeleteAdmin = async (id) => {
    if (!window.confirm('Are you sure you want to delete this admin?')) return;
    try {
      const res = await axios.delete(API.ADMIN_DELETE(id), {
        headers: {
          Authorization: `Bearer ${localStorage.getItem('authToken')}`,
        },
      });
      if (res.data.success) {
        setGlobalMessage({ type: 'success', text: 'Admin deleted successfully' });
        fetchAdmins(); // Refresh admin list
      } else {
        setGlobalMessage({ type: 'error', text: res.data.message || 'Delete failed' });
      }
    } catch (err) {
      console.error('Failed to delete admin:', err);
      setGlobalMessage({ type: 'error', text: 'Failed to delete admin' });
    }
  };

  // --- UI ---
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
              <span className="text-2xl font-bold text-white">A</span>
            </motion.div>
            <h1 className="text-xl font-bold text-gray-800">AISHE Dashboard</h1>
            <p className="text-sm text-gray-500">Welcome, {userData?.username}</p>
          </div>

          <nav className="space-y-2">
            <motion.button
              whileHover={{ x: 4 }}
              onClick={() => setActiveTab('admin')}
              className={`w-full flex items-center space-x-3 px-4 py-3 rounded-xl transition-all ${
                activeTab === 'admin'
                  ? 'bg-blue-50 text-blue-600'
                  : 'text-gray-600 hover:bg-gray-50'
              }`}
            >
              <RiUserSettingsLine className="text-xl" />
              <span>Admin Management</span>
            </motion.button>

            <motion.button
              whileHover={{ x: 4 }}
              onClick={() => setActiveTab('department')}
              className={`w-full flex items-center space-x-3 px-4 py-3 rounded-xl transition-all ${
                activeTab === 'department'
                  ? 'bg-blue-50 text-blue-600'
                  : 'text-gray-600 hover:bg-gray-50'
              }`}
            >
              <RiTeamLine className="text-xl" />
              <span>Department Users</span>
            </motion.button>

            <motion.button
              whileHover={{ x: 4 }}
              onClick={() => setActiveTab('office')}
              className={`w-full flex items-center space-x-3 px-4 py-3 rounded-xl transition-all ${
                activeTab === 'office'
                  ? 'bg-blue-50 text-blue-600'
                  : 'text-gray-600 hover:bg-gray-50'
              }`}
            >
              <RiBuilding2Line className="text-xl" />
              <span>Office Users</span>
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
        {/* Header */}
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
                  <p className="text-sm font-medium text-gray-900">{userData?.username}</p>
                  <p className="text-xs text-gray-500">Administrator</p>
                </div>
                <div className="h-8 w-8 rounded-full bg-blue-600 flex items-center justify-center text-white font-medium">
                  {userData?.username?.[0]?.toUpperCase()}
                </div>
              </div>
            </div>
          </div>
        </div>

        {/* Page Content */}
        <div className="max-w-7xl mx-auto px-6 py-8">
          <div className="mb-8">
            <h1 className="text-2xl font-bold text-gray-900">
              {activeTab === 'admin'
                ? 'Admin Management'
                : activeTab === 'department'
                ? 'Department Users'
                : 'Office Users'}
            </h1>
            <p className="mt-1 text-gray-500">
              Manage your {activeTab === 'admin'
                ? 'administrators'
                : activeTab === 'department'
                ? 'department users'
                : 'office users'} here
            </p>
          </div>

          {/* Stats Cards */}
          <div className="grid grid-cols-1 md:grid-cols-3 gap-6 mb-8">
            <motion.div
              whileHover={{ y: -4 }}
              className="bg-white p-6 rounded-xl shadow-sm"
            >
              <div className="flex items-center justify-between">
                <div>
                  <p className="text-sm font-medium text-gray-600">Total Users</p>
                  <h3 className="text-2xl font-bold text-gray-900 mt-1">
                    {activeTab === 'admin' ? admins.length : activeTab === 'department' ? departmentUsers.length : officeUsers.length}
                  </h3>
                </div>
                <div className="w-12 h-12 rounded-full bg-blue-50 flex items-center justify-center">
                  <RiTeamLine className="text-xl text-blue-600" />
                </div>
              </div>
            </motion.div>
            
            {/* Add more stat cards as needed */}
          </div>

          {/* Main Content Card */}
          <motion.div
            initial={{ opacity: 0, y: 20 }}
            animate={{ opacity: 1, y: 0 }}
            className="bg-white rounded-xl shadow-sm overflow-hidden"
          >
            <div className="p-6">
              {/* Content header with actions */}
              <div className="flex justify-between items-center mb-6">
                <h2 className="text-lg font-semibold text-gray-900">
                  {activeTab === 'admin'
                    ? 'All Administrators'
                    : activeTab === 'department'
                    ? 'Department Users List'
                    : 'Office Users List'}
                </h2>
                {activeTab === 'admin' && (
                  <motion.button
                    whileHover={{ scale: 1.02 }}
                    onClick={() => setShowAdminForm(true)}
                    className="flex items-center space-x-2 px-4 py-2 bg-blue-600 text-white rounded-lg hover:bg-blue-700 transition-colors"
                  >
                    <RiAddLine />
                    <span>Add Admin</span>
                  </motion.button>
                )}
                {activeTab === 'department' && (
                  <motion.button
                    whileHover={{ scale: 1.02 }}
                    onClick={() => setShowDeptUserForm(true)}
                    className="flex items-center space-x-2 px-4 py-2 bg-blue-600 text-white rounded-lg hover:bg-blue-700 transition-colors"
                  >
                    <RiAddLine />
                    <span>Add User</span>
                  </motion.button>
                )}
                {activeTab === 'office' && (
                  <motion.button
                    whileHover={{ scale: 1.02 }}
                    onClick={() => setShowOfficeUserForm(true)}
                    className="flex items-center space-x-2 px-4 py-2 bg-blue-600 text-white rounded-lg hover:bg-blue-700 transition-colors"
                  >
                    <RiAddLine />
                    <span>Add Office User</span>
                  </motion.button>
                )}
              </div>

              {/* Enhanced Tables */}
              <div className="overflow-x-auto">
                <table className="min-w-full divide-y divide-gray-200">
                  <thead>
                    <tr>
                      {activeTab === 'admin' ? (
                        <>
                          <th className="px-4 py-2 text-left text-xs font-medium text-gray-500 uppercase">Username</th>
                          <th className="px-4 py-2 text-left text-xs font-medium text-gray-500 uppercase">Email</th>
                          <th className="px-4 py-2 text-left text-xs font-medium text-gray-500 uppercase">Name</th>
                          <th className="px-4 py-2 text-left text-xs font-medium text-gray-500 uppercase">Mobile</th>
                          <th className="px-4 py-2 text-left text-xs font-medium text-gray-500 uppercase">Password</th>
                          <th className="px-4 py-2 text-left text-xs font-medium text-gray-500 uppercase">Role</th>
                          <th className="px-4 py-2 text-left text-xs font-medium text-gray-500 uppercase">Actions</th>
                        </>
                      ) : activeTab === 'department' ? (
                        <>
                          <th className="px-4 py-2 text-left text-xs font-medium text-gray-500 uppercase">Name</th>
                          <th className="px-4 py-2 text-left text-xs font-medium text-gray-500 uppercase">Username</th>
                          <th className="px-4 py-2 text-left text-xs font-medium text-gray-500 uppercase">Email</th>
                          <th className="px-4 py-2 text-left text-xs font-medium text-gray-500 uppercase">Mobile</th>
                          <th className="px-4 py-2 text-left text-xs font-medium text-gray-500 uppercase">Department</th>
                          <th className="px-4 py-2 text-left text-xs font-medium text-gray-500 uppercase">Dept ID</th>
                          <th className="px-4 py-2 text-left text-xs font-medium text-gray-500 uppercase">Academic Year</th>
                          <th className="px-4 py-2 text-left text-xs font-medium text-gray-500 uppercase">Degree Level</th>
                          <th className="px-4 py-2 text-left text-xs font-medium text-gray-500 uppercase">Duration</th> {/* Add this */}
                          <th className="px-4 py-2 text-left text-xs font-medium text-gray-500 uppercase">Password</th>
                          <th className="px-4 py-2 text-left text-xs font-medium text-gray-500 uppercase">Actions</th>
                        </>
                      ) : (
                        <>
                          <th className="px-4 py-2 text-left text-xs font-medium text-gray-500 uppercase">Name</th>
                          <th className="px-4 py-2 text-left text-xs font-medium text-gray-500 uppercase">Username</th>
                          <th className="px-4 py-2 text-left text-xs font-medium text-gray-500 uppercase">Email</th>
                          <th className="px-4 py-2 text-left text-xs font-medium text-gray-500 uppercase">Mobile</th>
                          <th className="px-4 py-2 text-left text-xs font-medium text-gray-500 uppercase">Office ID</th>
                          <th className="px-4 py-2 text-left text-xs font-medium text-gray-500 uppercase">Password</th>
                          <th className="px-4 py-2 text-left text-xs font-medium text-gray-500 uppercase">Actions</th>
                        </>
                      )}
                    </tr>
                  </thead>
                  <tbody>
                    {activeTab === 'admin'
                      ? admins
                          .filter(admin => 
                            Object.values(admin).some(val => 
                              String(val).toLowerCase().includes(searchQuery.toLowerCase())
                            )
                          )
                          .map((admin) =>
                            editId === admin.id ? (
                              <tr key={admin.id} className="bg-gray-50">
                                <td className="px-4 py-2">
                                  <input
                                    type="text"
                                    name="username"
                                    value={editForm.username}
                                    onChange={handleEditChange}
                                    className="border px-2 py-1 rounded"
                                  />
                                </td>
                                <td className="px-4 py-2">
                                  <input
                                    type="text"
                                    name="email"
                                    value={editForm.email}
                                    onChange={handleEditChange}
                                    className="border px-2 py-1 rounded"
                                  />
                                </td>
                                <td className="px-4 py-2">
                                  <input
                                    type="text"
                                    name="name"
                                    value={editForm.name}
                                    onChange={handleEditChange}
                                    className="border px-2 py-1 rounded"
                                  />
                                </td>
                                <td className="px-4 py-2">
                                  <input
                                    type="text"
                                    name="mobile"
                                    value={editForm.mobile}
                                    onChange={handleEditChange}
                                    className="border px-2 py-1 rounded"
                                  />
                                </td>
                                <td className="px-4 py-2">
                                  <input
                                    type="text"
                                    name="password"
                                    value={editForm.password}
                                    onChange={handleEditChange}
                                    className="border px-2 py-1 rounded"
                                    placeholder="New Password"
                                  />
                                </td>
                                <td className="px-4 py-2">
                                  <input
                                    type="text"
                                    name="role"
                                    value={editForm.role}
                                    onChange={handleEditChange}
                                    className="border px-2 py-1 rounded"
                                    placeholder="Role"
                                  />
                                </td>
                                <td className="px-4 py-2">
                                  <div className="flex items-center gap-2">
                                    <button
                                      onClick={() => handleUpdateAdmin(admin.id)}
                                      className="px-3 py-1 bg-blue-600 text-white rounded hover:bg-blue-700"
                                    >
                                      Save
                                    </button>
                                    <button
                                      onClick={handleCancelEdit}
                                      className="px-3 py-1 bg-gray-400 text-white rounded hover:bg-gray-500"
                                    >
                                      Cancel
                                    </button>
                                  </div>
                                </td>
                              </tr>
                            ) : (
                              <tr key={admin.id}>
                                <td className="px-4 py-2">{admin.username}</td>
                                <td className="px-4 py-2">{admin.email}</td>
                                <td className="px-4 py-2">{admin.name}</td>
                                <td className="px-4 py-2">{admin.mobile}</td>
                                <td className="px-4 py-2 font-mono text-xs break-all">{admin.password}</td>
                                <td className="px-4 py-2">{admin.role}</td> {/* <-- Add this line */}
                                <td className="px-4 py-2 space-x-2">
                                  <button
                                    onClick={() => handleEdit(admin)}
                                    className="px-3 py-1 bg-yellow-500 text-white rounded hover:bg-yellow-600"
                                  >
                                    Edit
                                  </button>
                                  <button
                                    onClick={() => handleDeleteAdmin(admin.id)}
                                    className="px-3 py-1 bg-red-500 text-white rounded hover:bg-red-600"
                                  >
                                    Delete
                                  </button>
                                </td>
                              </tr>
                            )
                          )
                      : activeTab === 'department'
                          ? departmentUsers
                              .filter(user => 
                                Object.values(user).some(val => 
                                  String(val).toLowerCase().includes(searchQuery.toLowerCase())
                                )
                              )
                              .map((user) =>
                                deptUserEditId === user.id ? (
                                  <tr key={user.id} className="bg-gray-50">
                                    <td className="px-4 py-2">
                                      <input
                                        type="text"
                                        name="name"
                                        value={deptUserEditForm.name}
                                        onChange={e => setDeptUserEditForm({ ...deptUserEditForm, name: e.target.value })}
                                        className="border px-2 py-1 rounded"
                                      />
                                    </td>
                                    <td className="px-4 py-2">
                                      <input
                                        type="text"
                                        name="username"
                                        value={deptUserEditForm.username}
                                        onChange={e => setDeptUserEditForm({ ...deptUserEditForm, username: e.target.value })}
                                        className="border px-2 py-1 rounded"
                                      />
                                    </td>
                                    <td className="px-4 py-2">
                                      <input
                                        type="email"
                                        name="email"
                                        value={deptUserEditForm.email}
                                        onChange={e => setDeptUserEditForm({ ...deptUserEditForm, email: e.target.value })}
                                        className="border px-2 py-1 rounded"
                                      />
                                    </td>
                                    <td className="px-4 py-2">
                                      <input
                                        type="text"
                                        name="mobile"
                                        value={deptUserEditForm.mobile}
                                        onChange={e => setDeptUserEditForm({ ...deptUserEditForm, mobile: e.target.value })}
                                        className="border px-2 py-1 rounded"
                                      />
                                    </td>
                                    <td className="px-4 py-2">
                                      <select
                                        name="department"
                                        value={deptUserEditForm.department}
                                        onChange={e => setDeptUserEditForm({ ...deptUserEditForm, department: e.target.value })}
                                        className="border px-2 py-1 rounded"
                                      >
                                        <option value="">Select Department</option>
                                        {departmentOptions.map((dept) => (
                                          <option key={dept} value={dept}>{dept}</option>
                                        ))}
                                      </select>
                                    </td>
                                    <td className="px-4 py-2">
                                      <input
                                        type="text"
                                        name="dept_id"
                                        value={deptUserEditForm.dept_id}
                                        onChange={e => setDeptUserEditForm({ ...deptUserEditForm, dept_id: e.target.value })}
                                        className="border px-2 py-1 rounded"
                                      />
                                    </td>
                                    <td className="px-4 py-2">
                                      <input
                                        type="text"
                                        name="academic_year"
                                        value={deptUserEditForm.academic_year}
                                        onChange={e => setDeptUserEditForm({ ...deptUserEditForm, academic_year: e.target.value })}
                                        className="border px-2 py-1 rounded"
                                      />
                                    </td>
                                    <td className="px-4 py-2">
                                      <select
                                        name="degree_level"
                                        value={deptUserEditForm.degree_level}
                                        onChange={e => setDeptUserEditForm({ ...deptUserEditForm, degree_level: e.target.value })}
                                        className="border px-2 py-1 rounded"
                                      >
                                        <option value="">Select Degree Level</option>
                                        <option value="UG">UG (3 Years)</option>
                                        <option value="PG">PG (2 Years)</option>
                                      </select>
                                    </td>
                                    <td className="px-4 py-2">
                                      <input
                                        type="text"
                                        name="password"
                                        value={deptUserEditForm.password}
                                        onChange={e => setDeptUserEditForm({ ...deptUserEditForm, password: e.target.value })}
                                        className="border px-2 py-1 rounded"
                                        placeholder="New Password"
                                      />
                                    </td>
                                    <td className="px-4 py-2">
                                      <div className="flex items-center gap-2">
                                        <button
                                          onClick={() => handleDeptUserUpdate(user.id)}
                                          className="px-3 py-1 bg-blue-600 text-white rounded hover:bg-blue-700"
                                        >
                                          Save
                                        </button>
                                        <button
                                          onClick={handleDeptUserCancelEdit}
                                          className="px-3 py-1 bg-gray-400 text-white rounded hover:bg-gray-500"
                                        >
                                          Cancel
                                        </button>
                                      </div>
                                    </td>
                                  </tr>
                                ) : (
                                  <tr key={user.id}>
                                    <td className="px-4 py-2">{user.name}</td>
                                    <td className="px-4 py-2">{user.username}</td>
                                    <td className="px-4 py-2">{user.email}</td>
                                    <td className="px-4 py-2">{user.mobile}</td>
                                    <td className="px-4 py-2">{user.department}</td>
                                    <td className="px-4 py-2">{user.dept_id}</td>
                                    <td className="px-4 py-2">{user.academic_year}</td>
                                    <td className="px-4 py-2">
                                      <span className={`inline-flex items-center px-2.5 py-0.5 rounded-full text-xs font-medium
                                        ${user.degree_level === 'UG' ? 'bg-blue-100 text-blue-800' : 'bg-purple-100 text-purple-800'}`}>
                                        {user.degree_level}
                                      </span>
                                    </td>
                                    <td className="px-4 py-2">{user.duration}</td>
                                    <td className="px-4 py-2 font-mono text-xs break-all">{user.password}</td>
                                    <td className="px-4 py-2">
                                     <div className="flex items-center gap-2">
                                      <button
                                        onClick={() => handleDeptUserEdit(user)}
                                        className="px-3 py-1 bg-yellow-500 text-white rounded hover:bg-yellow-600"
                                      >
                                        Edit
                                      </button>
                                      <button
                                        onClick={() => handleDeptUserDelete(user.id)}
                                        className="px-3 py-1 bg-red-500 text-white rounded hover:bg-red-600"
                                      >
                                        Delete
                                      </button>
                                      <button
                                        onClick={() => handleDeptUserLockToggle(user.id, !user.locked)}
                                        className={`px-3 py-1 ${user.locked ? 'bg-gray-500' : 'bg-green-500'} text-white rounded hover:${user.locked ? 'bg-gray-600' : 'bg-green-600'}`}
                                      >
                                        {user.locked ? 'Unlock' : 'Lock'}
                                      </button>
                                    </div>
                                    </td>
                                  </tr>
                                )
                              )
                          : officeUsers
                              .filter(user => 
                                Object.values(user).some(val => 
                                  String(val).toLowerCase().includes(searchQuery.toLowerCase())
                                )
                              )
                              .map((user) =>
                                officeUserEditId === user.id ? (
                                  <tr key={user.id} className="bg-gray-50">
                                    <td className="px-4 py-2">
                                      <input
                                        type="text"
                                        name="name"
                                        value={officeUserEditForm.name}
                                        onChange={handleOfficeUserEditChange}
                                        className="border px-2 py-1 rounded"
                                      />
                                    </td>
                                    <td className="px-4 py-2">
                                      <input
                                        type="text"
                                        name="username"
                                        value={officeUserEditForm.username}
                                        onChange={handleOfficeUserEditChange}
                                        className="border px-2 py-1 rounded"
                                      />
                                    </td>
                                    <td className="px-4 py-2">
                                      <input
                                        type="email"
                                        name="email"
                                        value={officeUserEditForm.email}
                                        onChange={handleOfficeUserEditChange}
                                        className="border px-2 py-1 rounded"
                                      />
                                    </td>
                                    <td className="px-4 py-2">
                                      <input
                                        type="text"
                                        name="mobile"
                                        value={officeUserEditForm.mobile}
                                        onChange={handleOfficeUserEditChange}
                                        className="border px-2 py-1 rounded"
                                      />
                                    </td>
                                    <td className="px-4 py-2">
                                      <input
                                        type="text"
                                        name="office_id"
                                        value={officeUserEditForm.office_id}
                                        onChange={handleOfficeUserEditChange}
                                        className="border px-2 py-1 rounded"
                                      />
                                    </td>
                                    <td className="px-4 py-2">
                                      <input
                                        type="text"
                                        name="password"
                                        value={officeUserEditForm.password}
                                        onChange={handleOfficeUserEditChange}
                                        className="border px-2 py-1 rounded"
                                        placeholder="New Password"
                                      />
                                    </td>
                                    <td className="px-4 py-2">
                                    <div className="flex items-center gap-2">
                                      <button
                                        onClick={() => handleUpdateOfficeUser(user.id)}
                                        className="px-3 py-1 bg-blue-600 text-white rounded hover:bg-blue-700"
                                      >
                                        Save
                                      </button>
                                      <button
                                        onClick={handleOfficeUserCancelEdit}
                                        className="px-3 py-1 bg-gray-400 text-white rounded hover:bg-gray-500"
                                      >
                                        Cancel
                                      </button>
                                    </div>
                                    </td>
                                  </tr>
                                ) : (
                                  <tr key={user.id}>
                                    <td className="px-4 py-2">{user.name}</td>
                                    <td className="px-4 py-2">{user.username}</td>
                                    <td className="px-4 py-2">{user.email}</td>
                                    <td className="px-4 py-2">{user.mobile}</td>
                                    <td className="px-4 py-2">{user.office_id}</td>
                                    <td className="px-4 py-2 font-mono text-xs break-all">{user.password}</td>
                                    <td className="px-4 py-2">
                                     <div className="flex items-center gap-2">
                                      <button
                                        onClick={() => handleOfficeUserEdit(user)}
                                        className="px-3 py-1 bg-yellow-500 text-white rounded hover:bg-yellow-600"
                                      >
                                        Edit
                                      </button>
                                      <button
                                        onClick={() => handleDeleteOfficeUser(user.id)}
                                        className="px-3 py-1 bg-red-500 text-white rounded hover:bg-red-600"
                                      >
                                        Delete
                                      </button>
                                      <button
                                        onClick={() => handleOfficeUserLockToggle(user.id, !user.locked)}
                                        className={`px-3 py-1 ${user.locked ? 'bg-gray-500' : 'bg-green-500'} text-white rounded hover:${user.locked ? 'bg-gray-600' : 'bg-green-600'}`}
                                      >
                                        {user.locked ? 'Unlock' : 'Lock'}
                                      </button>
                                     </div>

                                     
                                    </td>
                                  </tr>
                                )
                              )}
                  </tbody>
                </table>
              </div>
            </div>
          </motion.div>
        </div>
      </div>

      {/* Enhanced Modal */}
      <AnimatePresence>
        {showDeptUserForm && (
          <motion.div
            initial={{ opacity: 0 }}
            animate={{ opacity: 1 }}
            exit={{ opacity: 0 }}
            className="fixed inset-0 bg-black bg-opacity-50 backdrop-blur-sm flex items-center justify-center z-50"
          >
            <motion.div
              initial={{ scale: 0.9, opacity: 0 }}
              animate={{ scale: 1, opacity: 1 }}
              exit={{ scale: 0.9, opacity: 0 }}
              className="bg-white rounded-2xl shadow-xl max-w-3xl w-full m-4"
            >
              <div className="p-6">
                <div className="flex justify-between items-center mb-4">
                  <h2 className="text-xl font-semibold text-gray-800">
                    Add Department User
                  </h2>
                  <button
                    onClick={() => setShowDeptUserForm(false)}
                    className="text-gray-400 hover:text-gray-700"
                    aria-label="Close"
                  >
                    <RiCloseLine className="h-6 w-6" />
                  </button>
                </div>
                {/* Landscape (two-column) form */}
                <form onSubmit={handleNewUserSubmit} className="grid grid-cols-1 md:grid-cols-2 gap-x-8 gap-y-4">
                  <div>
                    <label className="block text-sm font-semibold text-gray-700 mb-1">Name</label>
                    <input
                      type="text"
                      name="name"
                      value={newUser.name}
                      onChange={handleNewUserChange}
                      className="w-full px-4 py-2 border rounded-lg focus:ring-2 focus:ring-blue-400"
                      required
                    />
                  </div>
                  <div>
                    <label className="block text-sm font-semibold text-gray-700 mb-1">Username</label>
                    <input
                      type="text"
                      name="username"
                      value={newUser.username}
                      onChange={handleNewUserChange}
                      className="w-full px-4 py-2 border rounded-lg focus:ring-2 focus:ring-blue-400"
                      required
                    />
                  </div>
                  <div>
                    <label className="block text-sm font-semibold text-gray-700 mb-1">Email</label>
                    <input
                      type="email"
                      name="email"
                      value={newUser.email}
                      onChange={handleNewUserChange}
                      className="w-full px-4 py-2 border rounded-lg focus:ring-2 focus:ring-blue-400"
                      required
                    />
                  </div>
                  <div>
                    <label className="block text-sm font-semibold text-gray-700 mb-1">Mobile</label>
                    <input
                      type="text"
                      name="mobile"
                      value={newUser.mobile}
                      onChange={handleNewUserChange}
                      className="w-full px-4 py-2 border rounded-lg focus:ring-2 focus:ring-blue-400"
                      required
                    />
                  </div>
                  <div>
                    <label className="block text-sm font-semibold text-gray-700 mb-1">Academic Year</label>
                    <input
                      type="text"
                      name="academic_year"
                      placeholder="2023-24"
                      value={newUser.academic_year}
                      onChange={handleNewUserChange}
                      className="w-full px-4 py-2 border rounded-lg focus:ring-2 focus:ring-blue-400"
                      required
                    />
                  </div>
                  <div>
                    <label className="block text-sm font-semibold text-gray-700 mb-1">Department</label>
                    <select
                      name="department"
                      value={newUser.department}
                      onChange={handleNewUserChange}
                      className="w-full px-4 py-2 border rounded-lg focus:ring-2 focus:ring-blue-400"
                      required
                    >
                      <option value="">Select Department</option>
                      {departmentOptions.map((dept) => (
                        <option key={dept} value={dept}>
                          {dept}
                        </option>
                      ))}
                    </select>
                  </div>
                  <div>
                    <label className="block text-sm font-semibold text-gray-700 mb-1">Department ID</label>
                    <input
                      type="text"
                      name="dept_id"
                      value={newUser.dept_id}
                      onChange={handleNewUserChange}
                      className="w-full px-4 py-2 border rounded-lg focus:ring-2 focus:ring-blue-400"
                      required
                    />
                  </div>
                  <div>
                    <label className="block text-sm font-semibold text-gray-700 mb-1">Password</label>
                    <input
                      type="password"
                      name="password"
                      value={newUser.password}
                      onChange={handleNewUserChange}
                      className="w-full px-4 py-2 border rounded-lg focus:ring-2 focus:ring-blue-400"
                      required
                    />
                  </div>
                  <div>
                    <label className="block text-sm font-semibold text-gray-700 mb-1">Degree Level</label>
                    <select
                      name="degree_level"
                      value={newUser.degree_level}
                      onChange={handleNewUserChange}
                      className="w-full px-4 py-2 border rounded-lg focus:ring-2 focus:ring-blue-400"
                      required
                    >
                      <option value="">Select Degree Level</option>
                      <option value="UG">UG (3 Years)</option>
                      <option value="PG">PG (2 Years)</option>
                    </select>
                  </div>
                  {/* Empty div for grid alignment */}
                  <div className="hidden md:block"></div>
                  <div className="md:col-span-2">
                    <button
                      type="submit"
                      className={`w-full py-2 mt-2 rounded-lg font-semibold text-white transition ${
                        deptUserLoading
                          ? 'bg-blue-300 cursor-not-allowed'
                          : 'bg-gradient-to-r from-blue-600 to-blue-400 hover:from-blue-700 hover:to-blue-500'
                      }`}
                      disabled={deptUserLoading}
                    >
                      {deptUserLoading ? 'Adding...' : 'Add User'}
                    </button>
                  </div>
                </form>
              </div>
            </motion.div>
          </motion.div>
        )}
      </AnimatePresence>

      {/* Add Admin Modal */}
      <AnimatePresence>
        {showAdminForm && (
          <motion.div
            initial={{ opacity: 0 }}
            animate={{ opacity: 1 }}
            exit={{ opacity: 0 }}
            className="fixed inset-0 bg-black bg-opacity-50 backdrop-blur-sm flex items-center justify-center z-50"
          >
            <motion.div
              initial={{ scale: 0.9, opacity: 0 }}
              animate={{ scale: 1, opacity: 1 }}
              exit={{ scale: 0.9, opacity: 0 }}
              className="bg-white rounded-2xl shadow-xl max-w-lg w-full m-4"
            >
              <div className="p-6">
                <div className="flex justify-between items-center mb-4">
                  <h2 className="text-xl font-semibold text-gray-800">Add Admin</h2>
                  <button
                    onClick={() => setShowAdminForm(false)}
                    className="text-gray-400 hover:text-gray-700"
                    aria-label="Close"
                  >
                    <RiCloseLine className="h-6 w-6" />
                  </button>
                </div>

                <form onSubmit={handleNewAdminSubmit} className="space-y-4">
                  <div>
                    <label className="block text-sm font-semibold text-gray-700 mb-1">Username</label>
                    <input
                      type="text"
                      name="username"
                      value={newAdmin.username}
                      onChange={handleNewAdminChange}
                      className="w-full px-4 py-2 border rounded-lg focus:ring-2 focus:ring-blue-400"
                      required
                    />
                  </div>
                  <div>
                    <label className="block text-sm font-semibold text-gray-700 mb-1">Email</label>
                    <input
                      type="email"
                      name="email"
                      value={newAdmin.email}
                      onChange={handleNewAdminChange}
                      className="w-full px-4 py-2 border rounded-lg focus:ring-2 focus:ring-blue-400"
                      required
                    />
                  </div>
                  <div>
                    <label className="block text-sm font-semibold text-gray-700 mb-1">Name</label>
                    <input
                      type="text"
                      name="name"
                      value={newAdmin.name}
                      onChange={handleNewAdminChange}
                      className="w-full px-4 py-2 border rounded-lg focus:ring-2 focus:ring-blue-400"
                      required
                    />
                  </div>
                  <div>
                    <label className="block text-sm font-semibold text-gray-700 mb-1">Mobile</label>
                    <input
                      type="text"
                      name="mobile"
                      value={newAdmin.mobile}
                      onChange={handleNewAdminChange}
                      className="w-full px-4 py-2 border rounded-lg focus:ring-2 focus:ring-blue-400"
                      required
                    />
                  </div>
                  <div>
                    <label className="block text-sm font-semibold text-gray-700 mb-1">Role</label>
                    <input
                      type="text"
                      name="role"
                      value={newAdmin.role}
                      onChange={handleNewAdminChange}
                      className="w-full px-4 py-2 border rounded-lg focus:ring-2 focus:ring-blue-400"
                      required
                      placeholder="Enter role (e.g. Admin, Super Admin, Manager, etc.)"
                    />
                  </div>
                  <div>
                    <label className="block text-sm font-semibold text-gray-700 mb-1">Password</label>
                    <input
                      type="text" // <-- plain text
                      name="password"
                      value={newAdmin.password}
                      onChange={handleNewAdminChange}
                      className="w-full px-4 py-2 border rounded-lg focus:ring-2 focus:ring-blue-400"
                      required
                    />
                  </div>
                  <button
                    type="submit"
                    className={`w-full py-2 mt-2 rounded-lg font-semibold text-white transition ${
                      loading
                        ? 'bg-blue-300 cursor-not-allowed'
                        : 'bg-gradient-to-r from-blue-600 to-blue-400 hover:from-blue-700 hover:to-blue-500'
                    }`}
                    disabled={loading}
                  >
                    {loading ? 'Adding...' : 'Add Admin'}
                  </button>
                </form>
              </div>
            </motion.div>
          </motion.div>
        )}
      </AnimatePresence>

      {/* Office User Modal */}
      <AnimatePresence>
        {showOfficeUserForm && (
          <motion.div
            initial={{ opacity: 0 }}
            animate={{ opacity: 1 }}
            exit={{ opacity: 0 }}
            className="fixed inset-0 bg-black bg-opacity-50 backdrop-blur-sm flex items-center justify-center z-50"
          >
            <motion.div
              initial={{ scale: 0.9, opacity: 0 }}
              animate={{ scale: 1, opacity: 1 }}
              exit={{ scale: 0.9, opacity: 0 }}
              className="bg-white rounded-2xl shadow-xl max-w-lg w-full m-4"
            >
              <div className="p-6">
                <div className="flex justify-between items-center mb-4">
                  <h2 className="text-xl font-semibold text-gray-800">Add Office User</h2>
                  <button
                    onClick={() => setShowOfficeUserForm(false)}
                    className="text-gray-400 hover:text-gray-700"
                    aria-label="Close"
                  >
                    <RiCloseLine className="h-6 w-6" />
                  </button>
                </div>
                <form onSubmit={handleNewOfficeUserSubmit} className="space-y-4">
                  <div>
                    <label className="block text-sm font-semibold text-gray-700 mb-1">Name</label>
                    <input
                      type="text"
                      name="name"
                      value={newOfficeUser.name}
                      onChange={handleNewOfficeUserChange}
                      className="w-full px-4 py-2 border rounded-lg focus:ring-2 focus:ring-blue-400"
                      required
                    />
                  </div>
                  <div>
                    <label className="block text-sm font-semibold text-gray-700 mb-1">Username</label>
                    <input
                      type="text"
                      name="username"
                      value={newOfficeUser.username}
                      onChange={handleNewOfficeUserChange}
                      className="w-full px-4 py-2 border rounded-lg focus:ring-2 focus:ring-blue-400"
                      required
                    />
                  </div>
                  <div>
                    <label className="block text-sm font-semibold text-gray-700 mb-1">Email</label>
                    <input
                      type="email"
                      name="email"
                      value={newOfficeUser.email}
                      onChange={handleNewOfficeUserChange}
                      className="w-full px-4 py-2 border rounded-lg focus:ring-2 focus:ring-blue-400"
                      required
                    />
                  </div>
                  <div>
                    <label className="block text-sm font-semibold text-gray-700 mb-1">Mobile</label>
                    <input
                      type="text"
                      name="mobile"
                      value={newOfficeUser.mobile}
                      onChange={handleNewOfficeUserChange}
                      className="w-full px-4 py-2 border rounded-lg focus:ring-2 focus:ring-blue-400"
                      required
                    />
                  </div>
                  <div>
                    <label className="block text-sm font-semibold text-gray-700 mb-1">Office ID</label>
                    <input
                      type="text"
                      name="office_id"
                      value={newOfficeUser.office_id}
                      onChange={handleNewOfficeUserChange}
                      className="w-full px-4 py-2 border rounded-lg focus:ring-2 focus:ring-blue-400"
                      required
                    />
                  </div>
                  <div>
                    <label className="block text-sm font-semibold text-gray-700 mb-1">Password</label>
                    <input
                      type="text"
                      name="password"
                      value={newOfficeUser.password}
                      onChange={handleNewOfficeUserChange}
                      className="w-full px-4 py-2 border rounded-lg focus:ring-2 focus:ring-blue-400"
                      required
                    />
                  </div>
                  <button
                    type="submit"
                    className={`w-full py-2 mt-2 rounded-lg font-semibold text-white transition ${
                      officeUserLoading
                        ? 'bg-blue-300 cursor-not-allowed'
                        : 'bg-gradient-to-r from-blue-600 to-blue-400 hover:from-blue-700 hover:to-blue-500'
                    }`}
                    disabled={officeUserLoading}
                  >
                    {officeUserLoading ? 'Adding...' : 'Add Office User'}
                  </button>
                </form>
              </div>
            </motion.div>
          </motion.div>
        )}
      </AnimatePresence>

      {/* Enhanced Toast Messages */}
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
            <button
              onClick={() => setGlobalMessage(null)}
              className="ml-3 text-white/80 hover:text-white"
            >
              <RiCloseLine />
            </button>
          </motion.div>
        )}
      </AnimatePresence>
    </div>
  );
}
