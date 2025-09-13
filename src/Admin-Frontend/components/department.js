import React, { useState, useEffect } from 'react';
import AcademicYearBadge from "./AcademicYearBadge";
import axios from 'axios';

const API_BASE = 'http://localhost:5000/api';
const API = {
  DEPT_USER_ADD: `${API_BASE}/department-user`,
  DEPT_USER_ALL: `${API_BASE}/department-user`,
  DEPT_USER_UPDATE: (id) => `${API_BASE}/department-user/${id}`,
  DEPT_USER_DELETE: (id) => `${API_BASE}/department-user/${id}`,
  DEPT_USER_LOCK: (id) => `${API_BASE}/department-user/${id}/lock`,
  DEPT_USER_DISTINCT_YEARS: `${API_BASE}/department-user/distinct/years`,
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
  'M.COM',
  'B.SC Physics',
];

const yearSlotOptionsUG = ['I Year', 'II Year', 'III Year'];
const yearSlotOptionsPG = ['I Year', 'II Year'];
const degreeLevelOptions = ['UG', 'PG'];
const academicYearOptions = ['2024-2025']; // This should be updated dynamically if needed
const durationOptions = ['3', '2']; // For duration dropdown

export default function Department({ adminAcademicYear }) {
  const [departmentUsers, setDepartmentUsers] = useState([]);
  const [deptUserEditId, setDeptUserEditId] = useState(null);
  const [deptUserEditForm, setDeptUserEditForm] = useState({
    name: '', username: '', email: '', mobile: '', department: '', dept_id: '', academic_year: '', degree_level: '', duration: '', password: '', hod: '',
  });
  const [newUser, setNewUser] = useState({
    name: '', username: '', email: '', mobile: '', department: '', dept_id: '', academic_year: '', degree_level: '', duration: '', password: '', hod: '',
  });
  const [deptUserLoading, setDeptUserLoading] = useState(false);
  const [showDeptUserForm, setShowDeptUserForm] = useState(false);
  const [globalMessage, setGlobalMessage] = useState(null);
  const [academicYears, setAcademicYears] = useState([]);
  const [adminAcademicYearState, setAdminAcademicYear] = useState(adminAcademicYear || '');
  const [latestAcademicYear, setLatestAcademicYear] = useState(adminAcademicYear || '');


  // Fetch all department users
  const fetchDepartmentUsers = async () => {
    setDeptUserLoading(true);
    try {
      const res = await axios.get(API.DEPT_USER_ALL, {
        headers: { Authorization: `Bearer ${localStorage.getItem('authToken')}` },
      });
      setDepartmentUsers(res.data.users || []);
    } catch (err) {
      setGlobalMessage({ type: 'error', text: 'Failed to fetch department users' });
    } finally {
      setDeptUserLoading(false);
    }
  };

  useEffect(() => {
    fetchDepartmentUsers();
  }, []);

  useEffect(() => {
    async function fetchAdminAcademicYear() {
      try {
        const res = await axios.get(`${API_BASE}/admin/all`, {
          headers: { Authorization: `Bearer ${localStorage.getItem("authToken")}` },
        });
        if (res.data?.admins?.length) {
          setAdminAcademicYear(res.data.admins[0].academic_year || "");
        }
      } catch {
        setAdminAcademicYear("");
      }
    }
    fetchAdminAcademicYear();
  }, []);

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
          name: '', username: '', email: '', mobile: '', department: '', dept_id: '', academic_year: '', degree_level: '', duration: '', password: '', hod: '',
        });
        setShowDeptUserForm(false);
        fetchDepartmentUsers();
      } else {
        setGlobalMessage({ type: 'error', text: res.data.message || 'Failed to add user' });
      }
    } catch (err) {
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
      password: '',
      hod: user.hod || '',
    });
  };

  // Cancel department user edit
  const handleDeptUserCancelEdit = () => {
    setDeptUserEditId(null);
    setDeptUserEditForm({
      name: '', username: '', email: '', mobile: '', department: '', dept_id: '', academic_year: '', degree_level: '', duration: '', password: '', hod: '',
    });
  };

  // Update department user
  const handleDeptUserUpdate = async (id) => {
    try {
      const payload = { ...deptUserEditForm };
      if (!payload.password) delete payload.password;
      const res = await axios.put(API.DEPT_USER_UPDATE(id), payload, {
        headers: { Authorization: `Bearer ${localStorage.getItem('authToken')}` },
      });
      if (res.data.success) {
        setGlobalMessage({ type: 'success', text: 'Department user updated successfully' });
        fetchDepartmentUsers();
        handleDeptUserCancelEdit();
      } else {
        setGlobalMessage({ type: 'error', text: res.data.message || 'Update failed' });
      }
    } catch (err) {
      setGlobalMessage({ type: 'error', text: 'Failed to update department user' });
    }
  };

  // Delete department user
  const handleDeptUserDelete = async (id) => {
    if (!window.confirm('Are you sure you want to delete this user?')) return;
    try {
      const res = await axios.delete(API.DEPT_USER_DELETE(id), {
        headers: { Authorization: `Bearer ${localStorage.getItem('authToken')}` },
      });
      if (res.data.success) {
        setGlobalMessage({ type: 'success', text: 'Department user deleted successfully' });
        fetchDepartmentUsers();
      } else {
        setGlobalMessage({ type: 'error', text: res.data.message || 'Delete failed' });
      }
    } catch (err) {
      setGlobalMessage({ type: 'error', text: 'Failed to delete department user' });
    }
  };

  // Lock/unlock department user
  const handleDeptUserLockToggle = async (id, locked) => {
    try {
      const res = await axios.patch(API.DEPT_USER_LOCK(id), { locked }, {
        headers: { Authorization: `Bearer ${localStorage.getItem('authToken')}` },
      });
      if (res.data.success) {
        setGlobalMessage({ type: 'success', text: `Department user ${locked ? 'locked' : 'unlocked'} successfully` });
        fetchDepartmentUsers();
      } else {
        setGlobalMessage({ type: 'error', text: res.data.message || 'Failed to update lock status' });
      }
    } catch (err) {
      setGlobalMessage({ type: 'error', text: 'Failed to update lock status' });
    }
  };

  useEffect(() => {
    if (globalMessage) {
      const timer = setTimeout(() => setGlobalMessage(null), 3000);
      return () => clearTimeout(timer);
    }
  }, [globalMessage]);

  return (
    <div className="relative p-0 md:p-2">
      {/* Academic Year Badge - prefer prop, fallback to local/latest */}
      <div className="flex justify-end">
        <AcademicYearBadge year={adminAcademicYear || ""} />
      </div>

      {/* Department Users header + Add button */}
      <div className="flex items-center justify-between mb-8">
        <h2 className="text-3xl font-extrabold text-gray-800 tracking-tight flex items-center gap-3">
          <span className="inline-block w-10 h-10 rounded-xl bg-gradient-to-br from-blue-600 to-indigo-600 flex items-center justify-center text-white text-2xl shadow">D</span>
          Department Users
        </h2>
        <button
          className="flex items-center gap-2 px-5 py-2 rounded-2xl bg-gradient-to-r from-blue-600 to-indigo-600 text-white font-bold shadow hover:scale-105 transition-transform text-lg"
          onClick={() => setShowDeptUserForm(true)}
        >
          <svg className="w-5 h-5" fill="none" stroke="currentColor" strokeWidth="2" viewBox="0 0 24 24"><path strokeLinecap="round" strokeLinejoin="round" d="M12 4v16m8-8H4" /></svg>
          Add Department User
        </button>
      </div>

      {globalMessage && (
        <div className={`mb-6 px-6 py-3 rounded-2xl shadow font-semibold text-base ${globalMessage.type === 'success' ? 'bg-green-100 text-green-800' : 'bg-red-100 text-red-800'}`}>{globalMessage.text}</div>
      )}

      {/* New user form unchanged */}
      {showDeptUserForm && (
        <form onSubmit={handleNewUserSubmit} className="mb-10 bg-gradient-to-br from-blue-50 to-indigo-50 p-8 rounded-2xl shadow-xl border border-blue-100 animate-fade-in">
          <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
            <input name="name" value={newUser.name} onChange={handleNewUserChange} placeholder="Name" className="p-3 border-2 border-blue-200 rounded-xl focus:ring-2 focus:ring-blue-400" required />
            <input name="username" value={newUser.username} onChange={handleNewUserChange} placeholder="Username" className="p-3 border-2 border-blue-200 rounded-xl focus:ring-2 focus:ring-blue-400" required />
            <input name="email" value={newUser.email} onChange={handleNewUserChange} placeholder="Email" className="p-3 border-2 border-blue-200 rounded-xl focus:ring-2 focus:ring-blue-400" required />
            <input name="mobile" value={newUser.mobile} onChange={handleNewUserChange} placeholder="Mobile" className="p-3 border-2 border-blue-200 rounded-xl focus:ring-2 focus:ring-blue-400" required />
            <select name="department" value={newUser.department} onChange={handleNewUserChange} className="p-3 border-2 border-blue-200 rounded-xl focus:ring-2 focus:ring-blue-400" required>
              <option value="">Select Department</option>
              {departmentOptions.map(opt => <option key={opt} value={opt}>{opt}</option>)}
            </select>
            <input name="dept_id" value={newUser.dept_id} onChange={handleNewUserChange} placeholder="Dept ID" className="p-3 border-2 border-blue-200 rounded-xl focus:ring-2 focus:ring-blue-400" required />
            <select
              name="academic_year"
              value={newUser.academic_year}
              onChange={handleNewUserChange}
              className="p-3 border-2 border-blue-200 rounded-xl focus:ring-2 focus:ring-blue-400"
              required
            >
              <option value="">Select Academic Year</option>
              {academicYearOptions.map(year => (
                <option key={year} value={year}>{year}</option>
              ))}
            </select>
            <select
              name="degree_level"
              value={newUser.degree_level}
              onChange={handleNewUserChange}
              className="p-3 border-2 border-blue-200 rounded-xl focus:ring-2 focus:ring-blue-400"
              required
            >
              <option value="">Select Degree Level</option>
              <option value="UG">UG</option>
              <option value="PG">PG</option>
            </select>
            <select
              name="duration"
              value={newUser.duration}
              onChange={handleNewUserChange}
              className="p-3 border-2 border-blue-200 rounded-xl focus:ring-2 focus:ring-blue-400"
              required
            >
              <option value="">Select Duration</option>
              {durationOptions.map(d => (
                <option key={d} value={d}>{d}</option>
              ))}
            </select>
            <input name="password" value={newUser.password} onChange={handleNewUserChange} placeholder="Password" className="p-3 border-2 border-blue-200 rounded-xl focus:ring-2 focus:ring-blue-400" required />
            <input name="hod" value={newUser.hod} onChange={handleNewUserChange} placeholder="HOD Name" className="p-3 border-2 border-blue-200 rounded-xl focus:ring-2 focus:ring-blue-400" required />
          </div>
          <div className="mt-6 flex gap-3 justify-end">
            <button type="submit" className="px-6 py-2 bg-gradient-to-r from-green-500 to-green-700 text-white rounded-2xl font-bold shadow hover:scale-105 transition-transform">Save</button>
            <button type="button" className="px-6 py-2 bg-gray-300 text-gray-700 rounded-2xl font-bold shadow hover:bg-gray-400" onClick={() => setShowDeptUserForm(false)}>Cancel</button>
          </div>
        </form>
      )}

      {/* Always show department users list (no filter UI) */}
      <div className="overflow-x-auto animate-fade-in">
        <table className="min-w-full bg-white border-0 rounded-2xl shadow-xl overflow-hidden">
          <thead className="bg-gradient-to-r from-blue-600 to-indigo-600 text-white">
            <tr>
              <th className="p-4 text-left font-bold tracking-wide">Name</th>
              <th className="p-4 text-left font-bold tracking-wide">Username</th>
              <th className="p-4 text-left font-bold tracking-wide">Email</th>
              <th className="p-4 text-left font-bold tracking-wide">Mobile</th>
              <th className="p-4 text-left font-bold tracking-wide">Department</th>
              <th className="p-4 text-left font-bold tracking-wide">Dept ID</th>
              <th className="p-4 text-left font-bold tracking-wide">Academic Year</th>
              <th className="p-4 text-left font-bold tracking-wide">Degree Level</th>
              <th className="p-4 text-left font-bold tracking-wide">Duration</th>
              <th className="p-4 text-left font-bold tracking-wide">HOD</th>
              <th className="p-4 text-left font-bold tracking-wide">Password</th>
              <th className="p-4 text-left font-bold tracking-wide">Locked</th>
              <th className="p-4 text-left font-bold tracking-wide">Actions</th>
            </tr>
          </thead>
          <tbody className="divide-y divide-blue-50">
            {departmentUsers.map(user => (
              <tr key={user.id} className="hover:bg-blue-50 transition-all">
                <td className="p-4 font-semibold text-blue-900">{user.name}</td>
                <td className="p-4">{user.username}</td>
                <td className="p-4">{user.email}</td>
                <td className="p-4">{user.mobile}</td>
                <td className="p-4">{user.department}</td>
                <td className="p-4">{user.dept_id}</td>
                <td className="p-4">{user.academic_year}</td>
                <td className="p-4"><span className={`px-3 py-1 rounded-2xl text-xs font-bold ${user.degree_level === 'PG' ? 'bg-gradient-to-r from-purple-500 to-indigo-500 text-white' : 'bg-blue-100 text-blue-700'}`}>{user.degree_level}</span></td>
                <td className="p-4">{user.duration}</td>
                <td className="p-4">{user.hod}</td>
                <td className="p-4">{'••••••••'}</td>
                <td className="p-4">{user.locked ? 'Yes' : 'No'}</td>
                <td className="p-4 flex gap-2">
                  <button className="px-4 py-2 bg-gradient-to-r from-yellow-400 to-yellow-600 text-white rounded-2xl font-bold shadow hover:scale-105 transition-transform" onClick={() => handleDeptUserEdit(user)}>Edit</button>
                  <button className="px-4 py-2 bg-gradient-to-r from-red-500 to-red-700 text-white rounded-2xl font-bold shadow hover:scale-105 transition-transform" onClick={() => handleDeptUserDelete(user.id)}>Delete</button>
                  <button className={`px-4 py-2 rounded-2xl font-bold shadow transition-all ${user.locked ? 'bg-gray-600 hover:bg-gray-700 text-white' : 'bg-blue-600 hover:bg-blue-700 text-white'}`} onClick={() => handleDeptUserLockToggle(user.id, !user.locked)}>{user.locked ? 'Unlock' : 'Lock'}</button>
                </td>
              </tr>
            ))}
          </tbody>
        </table>
      </div>

      {/* Dept edit modal and other existing code unchanged */}
      {deptUserEditId !== null && (
        <div className="fixed inset-0 bg-black bg-opacity-40 flex items-center justify-center z-50">
          <form
            onSubmit={e => { e.preventDefault(); handleDeptUserUpdate(deptUserEditId); }}
            className="bg-white rounded-2xl shadow-xl p-6 md:p-8 max-w-2xl w-full mx-4 border border-blue-100"
          >
            <div className="mb-6 text-center">
              <div className="w-20 h-20 rounded-xl bg-gradient-to-br from-blue-600 to-indigo-600 flex items-center justify-center mx-auto shadow-md">
                <span className="text-3xl font-extrabold text-white">D</span>
              </div>
              <h3 className="text-2xl font-extrabold mt-4 text-blue-700">Edit Department User</h3>
            </div>
            <div className="grid grid-cols-1 gap-4 md:grid-cols-2">
              <div>
                <label className="block font-bold text-blue-700 mb-2">Name</label>
                <input name="name" value={deptUserEditForm.name} onChange={e => setDeptUserEditForm({ ...deptUserEditForm, name: e.target.value })} className="p-3 border-2 border-blue-200 rounded-xl w-full" required />
              </div>
              <div>
                <label className="block font-bold text-blue-700 mb-2">Username</label>
                <input name="username" value={deptUserEditForm.username} onChange={e => setDeptUserEditForm({ ...deptUserEditForm, username: e.target.value })} className="p-3 border-2 border-blue-200 rounded-xl w-full" required />
              </div>
              <div>
                <label className="block font-bold text-blue-700 mb-2">Email</label>
                <input name="email" value={deptUserEditForm.email} onChange={e => setDeptUserEditForm({ ...deptUserEditForm, email: e.target.value })} className="p-3 border-2 border-blue-200 rounded-xl w-full" required />
              </div>
              <div>
                <label className="block font-bold text-blue-700 mb-2">Mobile</label>
                <input name="mobile" value={deptUserEditForm.mobile} onChange={e => setDeptUserEditForm({ ...deptUserEditForm, mobile: e.target.value })} className="p-3 border-2 border-blue-200 rounded-xl w-full" required />
              </div>
              <div>
                <label className="block font-bold text-blue-700 mb-2">Department</label>
                <select name="department" value={deptUserEditForm.department} onChange={e => setDeptUserEditForm({ ...deptUserEditForm, department: e.target.value })} className="p-3 border-2 border-blue-200 rounded-xl w-full" required>
                  <option value="">Select Department</option>
                  {departmentOptions.map(opt => <option key={opt} value={opt}>{opt}</option>)}
                </select>
              </div>
              <div>
                <label className="block font-bold text-blue-700 mb-2">Dept ID</label>
                <input name="dept_id" value={deptUserEditForm.dept_id} onChange={e => setDeptUserEditForm({ ...deptUserEditForm, dept_id: e.target.value })} className="p-3 border-2 border-blue-200 rounded-xl w-full" required />
              </div>
              <div>
                <label className="block font-bold text-blue-700 mb-2">Academic Year</label>
                <select
                  name="academic_year"
                  value={deptUserEditForm.academic_year}
                  onChange={e => setDeptUserEditForm({ ...deptUserEditForm, academic_year: e.target.value })}
                  className="p-3 border-2 border-blue-200 rounded-xl w-full"
                  required
                >
                  <option value="">Select Academic Year</option>
                  {academicYearOptions.map(year => (
                    <option key={year} value={year}>{year}</option>
                  ))}
                </select>
              </div>
              <div>
                <label className="block font-bold text-blue-700 mb-2">Degree Level</label>
                <select name="degree_level" value={deptUserEditForm.degree_level} onChange={e => setDeptUserEditForm({ ...deptUserEditForm, degree_level: e.target.value })} className="p-3 border-2 border-blue-200 rounded-xl w-full" required>
                  <option value="">Select Degree Level</option>
                  <option value="UG">UG</option>
                  <option value="PG">PG</option>
                </select>
              </div>
              <div>
                <label className="block font-bold text-blue-700 mb-2">Duration</label>
                <select
                  name="duration"
                  value={deptUserEditForm.duration}
                  onChange={e => setDeptUserEditForm({ ...deptUserEditForm, duration: e.target.value })}
                  className="p-3 border-2 border-blue-200 rounded-xl w-full"
                  required
                >
                  <option value="">Select Duration</option>
                  {durationOptions.map(d => (
                    <option key={d} value={d}>{d}</option>
                  ))}
                </select>
              </div>
              <div>
                <label className="block font-bold text-blue-700 mb-2">HOD</label>
                <input name="hod" value={deptUserEditForm.hod} onChange={e => setDeptUserEditForm({ ...deptUserEditForm, hod: e.target.value })} className="p-3 border-2 border-blue-200 rounded-xl w-full" required />
              </div>
              <div>
                <label className="block font-bold text-blue-700 mb-2">Password</label>
                <input name="password" value={deptUserEditForm.password} onChange={e => setDeptUserEditForm({ ...deptUserEditForm, password: e.target.value })} className="p-3 border-2 border-blue-200 rounded-xl w-full" />
              </div>
            </div>
            <div className="mt-6 flex gap-3 justify-end">
              <button type="submit" className="px-6 py-2 bg-gradient-to-r from-green-500 to-green-700 text-white rounded-2xl font-bold shadow hover:scale-105 transition-transform">Save</button>
              <button type="button" className="px-6 py-2 bg-gray-300 text-gray-700 rounded-2xl font-bold shadow hover:bg-gray-400" onClick={handleDeptUserCancelEdit}>Cancel</button>
            </div>
          </form>
        </div>
      )}

    </div>
  );
}
