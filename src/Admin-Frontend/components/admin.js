import React, { useState, useEffect } from 'react';
import axios from 'axios';
import AcademicYearBadge from "./AcademicYearBadge";


const API_BASE = 'http://localhost:5000/api';
const API = {
  ADMIN_ALL: `${API_BASE}/admin/all`,
  ADMIN_UPDATE: (id) => `${API_BASE}/admin/${id}`,
  ADMIN_ADD: `${API_BASE}/admin`,
  ADMIN_DELETE: (id) => `${API_BASE}/admin/${id}`,
};

export default function Admin({ adminAcademicYear }) {
  // Use state for academic year options so we can add new years dynamically
  const [academicYearOptions, setAcademicYearOptions] = useState(
    adminAcademicYear
      ? [adminAcademicYear, '2025-2026', '2026-2027']
      : ['2024-2025', '2025-2026', '2026-2027']
  );

  // Function to add a new year to the dropdown
  const addAcademicYearOption = (year) => {
    setAcademicYearOptions((prev) => {
      if (!prev.includes(year)) {
        return [year, ...prev];
      }
      return prev;
    });
  };

  const [admins, setAdmins] = useState([]);
  const [editId, setEditId] = useState(null);
  const [editForm, setEditForm] = useState({
    username: '',
    email: '',
    name: '',
    mobile: '',
    role: '',
    password: '',
    academic_year: '', // <-- Add this
  });
  const [newAdmin, setNewAdmin] = useState({
    username: '',
    email: '',
    name: '',
    mobile: '',
    role: 'Admin',
    password: '',
    academic_year: '', // <-- Add this
  });
  const [loading, setLoading] = useState(false);
  const [showAdminForm, setShowAdminForm] = useState(false);
  const [globalMessage, setGlobalMessage] = useState(null);
  const [newAcademicYear, setNewAcademicYear] = useState('');
  const [latestAcademicYear, setLatestAcademicYear] = useState("");

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

  // After fetching admins, set default academic year for new admin
  useEffect(() => {
    fetchAdmins();
  }, []);

  useEffect(() => {
    if (admins.length > 0) {
      setLatestAcademicYear(admins[0].academic_year || "");
      // Use the latest academic year from the admin table
      const latestYear = admins[0].academic_year || '';
      setNewAdmin((prev) => ({ ...prev, academic_year: latestYear }));
    }
  }, [admins]);

  // New admin form change
  const handleNewAdminChange = (e) => {
    setNewAdmin({ ...newAdmin, [e.target.name]: e.target.value });
  };

  // New admin form submit
  const handleNewAdminSubmit = async (e) => {
    e.preventDefault();
    setLoading(true);
    setGlobalMessage(null);
    try {
      const res = await axios.post(API.ADMIN_ADD, newAdmin, {
        headers: {
          Authorization: `Bearer ${localStorage.getItem('authToken')}`,
          'Content-Type': 'application/json',
        },
      });
      if (res.data.success) {
        setGlobalMessage({ type: 'success', text: res.data.message });
        setNewAdmin({
          username: '', email: '', name: '', mobile: '', role: 'Admin', password: '', academic_year: newAdmin.academic_year,
        });
        setShowAdminForm(false);
        fetchAdmins();
      } else {
        setGlobalMessage({ type: 'error', text: res.data.message || 'Failed to add admin' });
      }
    } catch (err) {
      setGlobalMessage({ type: 'error', text: 'An error occurred while adding the admin' });
    } finally {
      setLoading(false);
    }
  };

  // Edit admin
  const handleEdit = (admin) => {
    setEditId(admin.id);
    setEditForm({
      username: admin.username,
      email: admin.email,
      name: admin.name,
      mobile: admin.mobile,
      role: admin.role,
      password: '',
      academic_year: admin.academic_year || '', // <-- Add this
    });
  };

  // Cancel edit
  const handleCancelEdit = () => {
    setEditId(null);
    setEditForm({
      username: '', email: '', name: '', mobile: '', role: '', password: '', academic_year: '',
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
      if (!payload.password) delete payload.password;
      const res = await axios.put(API.ADMIN_UPDATE(id), payload, {
        headers: { Authorization: `Bearer ${localStorage.getItem('authToken')}` },
      });
      if (res.data.success) {
        setGlobalMessage({ type: 'success', text: res.data.message });
        fetchAdmins();
        setEditId(null);
      } else {
        setGlobalMessage({ type: 'error', text: res.data.message || 'Update failed' });
      }
    } catch (err) {
      setGlobalMessage({ type: 'error', text: 'Failed to update admin' });
    }
  };

  // Delete admin
  const handleDeleteAdmin = async (id) => {
    if (!window.confirm('Are you sure you want to delete this admin?')) return;
    try {
      const res = await axios.delete(API.ADMIN_DELETE(id), {
        headers: { Authorization: `Bearer ${localStorage.getItem('authToken')}` },
      });
      if (res.data.success) {
        setGlobalMessage({ type: 'success', text: 'Admin deleted successfully' });
        fetchAdmins();
      } else {
        setGlobalMessage({ type: 'error', text: res.data.message || 'Delete failed' });
      }
    } catch (err) {
      setGlobalMessage({ type: 'error', text: 'Failed to delete admin' });
    }
  };

  // Update academic year
  const handleUpdateAcademicYear = async () => {
    if (!newAcademicYear) {
      setGlobalMessage({ type: 'error', text: 'Please enter new academic year' });
      return;
    }
    setLoading(true);
    try {
      const res = await axios.post(`${API_BASE}/admin/update-academic-year`, { newAcademicYear }, {
        headers: { Authorization: `Bearer ${localStorage.getItem('authToken')}` }
      });
      setGlobalMessage({ type: res.data.success ? 'success' : 'error', text: res.data.message });
      if (res.data.success) {
        addAcademicYearOption(newAcademicYear); // Add new year to dropdown
      }
      fetchAdmins();
    } catch (err) {
      setGlobalMessage({ type: 'error', text: 'Failed to update academic year' });
    } finally {
      setLoading(false);
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
      {/* Academic Year Badge */}
      <div className="flex justify-end">
        <AcademicYearBadge year={latestAcademicYear} />
      </div>
      <div className="flex items-center justify-between mb-8">
        <h2 className="text-3xl font-extrabold text-gray-800 tracking-tight flex items-center gap-3">
          <span className="inline-block w-10 h-10 rounded-xl bg-gradient-to-br from-blue-600 to-indigo-600 flex items-center justify-center text-white text-2xl shadow">A</span>
          Admins
        </h2>
        <button
          className="flex items-center gap-2 px-5 py-2 rounded-2xl bg-gradient-to-r from-blue-600 to-indigo-600 text-white font-bold shadow hover:scale-105 transition-transform text-lg"
          onClick={() => setShowAdminForm(true)}
        >
          <svg className="w-5 h-5" fill="none" stroke="currentColor" strokeWidth="2" viewBox="0 0 24 24"><path strokeLinecap="round" strokeLinejoin="round" d="M12 4v16m8-8H4" /></svg>
          Add Admin
        </button>
      </div>
      {globalMessage && (
        <div className={`mb-6 px-6 py-3 rounded-2xl shadow font-semibold text-base ${globalMessage.type === 'success' ? 'bg-green-100 text-green-800' : 'bg-red-100 text-red-800'}`}>{globalMessage.text}</div>
      )}
      {showAdminForm && (
        <form onSubmit={handleNewAdminSubmit} className="mb-10 bg-gradient-to-br from-blue-50 to-indigo-50 p-8 rounded-2xl shadow-xl border border-blue-100 animate-fade-in">
          <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
            <input name="username" value={newAdmin.username} onChange={handleNewAdminChange} placeholder="Username" className="p-3 border-2 border-blue-200 rounded-xl focus:ring-2 focus:ring-blue-400" required />
            <input name="email" value={newAdmin.email} onChange={handleNewAdminChange} placeholder="Email" className="p-3 border-2 border-blue-200 rounded-xl focus:ring-2 focus:ring-blue-400" required />
            <input name="name" value={newAdmin.name} onChange={handleNewAdminChange} placeholder="Name" className="p-3 border-2 border-blue-200 rounded-xl focus:ring-2 focus:ring-blue-400" required />
            <input name="mobile" value={newAdmin.mobile} onChange={handleNewAdminChange} placeholder="Mobile" className="p-3 border-2 border-blue-200 rounded-xl focus:ring-2 focus:ring-blue-400" required />
            <select name="role" value={newAdmin.role} onChange={handleNewAdminChange} className="p-3 border-2 border-blue-200 rounded-xl focus:ring-2 focus:ring-blue-400" required>
              <option value="Admin">Admin</option>
              <option value="Principle">Principle</option>
            </select>
            <input name="password" value={newAdmin.password} onChange={handleNewAdminChange} placeholder="Password" className="p-3 border-2 border-blue-200 rounded-xl focus:ring-2 focus:ring-blue-400" required />
            <select name="academic_year" value={newAdmin.academic_year} onChange={handleNewAdminChange} className="p-3 border-2 border-blue-200 rounded-xl focus:ring-2 focus:ring-blue-400" required>
              <option value="">Select Academic Year</option>
              {academicYearOptions.map(year => (
                <option key={year} value={year}>{year}</option>
              ))}
            </select>
          </div>
          <div className="mt-6 flex gap-3 justify-end">
            <button type="submit" className="px-6 py-2 bg-gradient-to-r from-green-500 to-green-700 text-white rounded-2xl font-bold shadow hover:scale-105 transition-transform">Save</button>
            <button type="button" className="px-6 py-2 bg-gray-300 text-gray-700 rounded-2xl font-bold shadow hover:bg-gray-400" onClick={() => setShowAdminForm(false)}>Cancel</button>
          </div>
        </form>
      )}
      <form onSubmit={e => { e.preventDefault(); handleUpdateAcademicYear(); }} className="mb-4 flex gap-2 items-center">
        <label className="font-bold text-blue-700 text-lg mr-2">Academic Year:</label>
        <select
          value={newAcademicYear}
          onChange={e => setNewAcademicYear(e.target.value)}
          className="px-5 py-3 rounded-xl border-2 border-blue-300 bg-blue-50 text-blue-800 font-semibold shadow focus:ring-2 focus:ring-blue-400 transition-all text-lg"
          required
          style={{ minWidth: 180, maxWidth: 260 }}
        >
          <option value="">Select Academic Year</option>
          {academicYearOptions.map(year => (
            <option key={year} value={year}>{year}</option>
          ))}
        </select>
        <button type="submit" className="px-6 py-3 rounded-xl bg-gradient-to-r from-blue-600 to-indigo-600 text-white font-bold shadow hover:scale-105 transition-transform text-lg">
          Update Academic Year
        </button>
      </form>
      <div className="overflow-x-auto animate-fade-in">
        <table className="min-w-full bg-white border-0 rounded-2xl shadow-xl overflow-hidden">
          <thead className="bg-gradient-to-r from-blue-600 to-indigo-600 text-white">
            <tr>
              <th className="p-4 text-left font-bold tracking-wide">Username</th>
              <th className="p-4 text-left font-bold tracking-wide">Email</th>
              <th className="p-4 text-left font-bold tracking-wide">Name</th>
              <th className="p-4 text-left font-bold tracking-wide">Mobile</th>
              <th className="p-4 text-left font-bold tracking-wide">Role</th>
              <th className="p-4 text-left font-bold tracking-wide">Password</th> {/* Add this */}
              <th className="p-4 text-left font-bold tracking-wide">Academic Year</th> {/* Add this */}
              <th className="p-4 text-left font-bold tracking-wide">Actions</th>
            </tr>
          </thead>
          <tbody className="divide-y divide-blue-50">
            {admins.map(admin => (
              editId === admin.id ? (
                <tr key={admin.id} className="bg-yellow-50 animate-pulse">
                  <td className="p-3"><input name="username" value={editForm.username} onChange={handleEditChange} className="p-2 border-2 border-yellow-300 rounded-xl" /></td>
                  <td className="p-3"><input name="email" value={editForm.email} onChange={handleEditChange} className="p-2 border-2 border-yellow-300 rounded-xl" /></td>
                  <td className="p-3"><input name="name" value={editForm.name} onChange={handleEditChange} className="p-2 border-2 border-yellow-300 rounded-xl" /></td>
                  <td className="p-3"><input name="mobile" value={editForm.mobile} onChange={handleEditChange} className="p-2 border-2 border-yellow-300 rounded-xl" /></td>
                  <td className="p-3"><select name="role" value={editForm.role} onChange={handleEditChange} className="p-2 border-2 border-yellow-300 rounded-xl">
                    <option value="Admin">Admin</option>
                    <option value="Principle">Principle</option>
                  </select></td>
                  <td className="p-3"><input name="password" value={editForm.password} onChange={handleEditChange} className="p-2 border-2 border-yellow-300 rounded-xl" /></td>
                  <td className="p-3"><input name="academic_year" value={editForm.academic_year} onChange={handleEditChange} className="p-2 border-2 border-yellow-300 rounded-xl" /></td>
                  <td className="p-3 flex gap-2">
                    <button className="px-4 py-2 bg-gradient-to-r from-green-500 to-green-700 text-white rounded-2xl font-bold shadow hover:scale-105 transition-transform" onClick={() => handleUpdateAdmin(admin.id)}>Save</button>
                    <button className="px-4 py-2 bg-gray-300 text-gray-700 rounded-2xl font-bold shadow hover:bg-gray-400" onClick={handleCancelEdit}>Cancel</button>
                  </td>
                </tr>
              ) : (
                <tr key={admin.id} className="hover:bg-blue-50 transition-all">
                  <td className="p-4 font-semibold text-blue-900">{admin.username}</td>
                  <td className="p-4">{admin.email}</td>
                  <td className="p-4">{admin.name}</td>
                  <td className="p-4">{admin.mobile}</td>
                  <td className="p-4"><span className={`px-3 py-1 rounded-2xl text-xs font-bold ${admin.role === 'SuperAdmin' ? 'bg-gradient-to-r from-purple-500 to-indigo-500 text-white' : 'bg-blue-100 text-blue-700'}`}>{admin.role}</span></td>
                  <td className="p-4">{'••••••••'}</td> {/* Hide password */}
                  <td className="p-4">{admin.academic_year}</td> {/* Show academic year */}
                  <td className="p-4 flex gap-2">
                    <button className="px-4 py-2 bg-gradient-to-r from-yellow-400 to-yellow-600 text-white rounded-2xl font-bold shadow hover:scale-105 transition-transform" onClick={() => handleEdit(admin)}>Edit</button>
                    <button className="px-4 py-2 bg-gradient-to-r from-red-500 to-red-700 text-white rounded-2xl font-bold shadow hover:scale-105 transition-transform" onClick={() => handleDeleteAdmin(admin.id)}>Delete</button>
                  </td>
                </tr>
              )
            ))}
          </tbody>
        </table>
      </div>
      {editId !== null && (
        <div className="fixed inset-0 bg-black bg-opacity-40 flex items-center justify-center z-50">
          <form
            onSubmit={e => { e.preventDefault(); handleUpdateAdmin(editId); }}
            className="bg-white rounded-2xl shadow-xl p-6 md:p-8 max-w-lg w-full mx-4 border border-blue-100"
          >
            <div className="mb-6 text-center">
              <div className="w-20 h-20 rounded-xl bg-gradient-to-br from-blue-600 to-indigo-600 flex items-center justify-center mx-auto shadow-md">
                <span className="text-3xl font-extrabold text-white">A</span>
              </div>
              <h3 className="text-2xl font-extrabold mt-4 text-blue-700">Edit Admin</h3>
            </div>
            <div className="grid grid-cols-1 gap-4 md:grid-cols-2">
              <div>
                <label className="block font-bold text-blue-700 mb-2">Username</label>
                <input name="username" value={editForm.username} onChange={handleEditChange} placeholder="Username" className="p-3 border-2 border-blue-200 rounded-xl focus:ring-2 focus:ring-blue-400 w-full" required />
              </div>
              <div>
                <label className="block font-bold text-blue-700 mb-2">Email</label>
                <input name="email" value={editForm.email} onChange={handleEditChange} placeholder="Email" className="p-3 border-2 border-blue-200 rounded-xl focus:ring-2 focus:ring-blue-400 w-full" required />
              </div>
              <div>
                <label className="block font-bold text-blue-700 mb-2">Name</label>
                <input name="name" value={editForm.name} onChange={handleEditChange} placeholder="Name" className="p-3 border-2 border-blue-200 rounded-xl focus:ring-2 focus:ring-blue-400 w-full" required />
              </div>
              <div>
                <label className="block font-bold text-blue-700 mb-2">Mobile</label>
                <input name="mobile" value={editForm.mobile} onChange={handleEditChange} placeholder="Mobile" className="p-3 border-2 border-blue-200 rounded-xl focus:ring-2 focus:ring-blue-400 w-full" required />
              </div>
              <div>
                <label className="block font-bold text-blue-700 mb-2">Role</label>
                <select name="role" value={editForm.role} onChange={handleEditChange} className="p-3 border-2 border-blue-200 rounded-xl focus:ring-2 focus:ring-blue-400 w-full" required>
                  <option value="Admin">Admin</option>
                  <option value="Principle">Principle</option>
                </select>
              </div>
              <div>
                <label className="block font-bold text-blue-700 mb-2">Password</label>
                <input name="password" value={editForm.password} onChange={handleEditChange} placeholder="Password" className="p-3 border-2 border-blue-200 rounded-xl focus:ring-2 focus:ring-blue-400 w-full" />
              </div>
              <div>
                <label className="block font-bold text-blue-700 mb-2">Academic Year</label>
                <select name="academic_year" value={editForm.academic_year} onChange={handleEditChange} className="p-3 border-2 border-blue-200 rounded-xl focus:ring-2 focus:ring-blue-400 w-full" required>
                  <option value="">Select Academic Year</option>
                  {academicYearOptions.map(year => (
                    <option key={year} value={year}>{year}</option>
                  ))}
                </select>
              </div>
            </div>
            <div className="mt-6 flex gap-3 justify-end">
              <button type="submit" className="px-6 py-2 bg-gradient-to-r from-green-500 to-green-700 text-white rounded-2xl font-bold shadow hover:scale-105 transition-transform">Save</button>
              <button type="button" className="px-6 py-2 bg-gray-300 text-gray-700 rounded-2xl font-bold shadow hover:bg-gray-400" onClick={handleCancelEdit}>Cancel</button>
            </div>
          </form>
        </div>
      )}
    </div>
  );
}
