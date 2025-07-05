import React, { useState, useEffect } from 'react';
import axios from 'axios';

const API_BASE = 'http://localhost:5000/api';
const API = {
  OFFICE_USER_ALL: `${API_BASE}/office-user/office-users`,
  OFFICE_USER_ADD: `${API_BASE}/office-user`,
  OFFICE_USER_UPDATE: (id) => `${API_BASE}/office-user/${id}`,
  OFFICE_USER_DELETE: (id) => `${API_BASE}/office-user/${id}`,
  OFFICE_USER_LOCK: (id) => `${API_BASE}/office-user/${id}/lock`,
};

export default function Office() {
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
  const [officeUserLoading, setOfficeUserLoading] = useState(false);
  const [showOfficeUserForm, setShowOfficeUserForm] = useState(false);
  const [globalMessage, setGlobalMessage] = useState(null);

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
    fetchOfficeUsers();
  }, []);

  // New office user form change
  const handleNewOfficeUserChange = (e) => {
    setNewOfficeUser({ ...newOfficeUser, [e.target.name]: e.target.value });
  };

  // New office user form submit
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
          name: '', username: '', email: '', mobile: '', office_id: '', password: '',
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

  // Edit office user
  const handleOfficeUserEdit = (user) => {
    setOfficeUserEditId(user.id);
    setOfficeUserEditForm({
      name: user.name || '',
      username: user.username || '',
      email: user.email || '',
      mobile: user.mobile || '',
      office_id: user.office_id || '',
      password: '',
    });
  };

  // Cancel office user edit
  const handleOfficeUserCancelEdit = () => {
    setOfficeUserEditId(null);
    setOfficeUserEditForm({
      name: '', username: '', email: '', mobile: '', office_id: '', password: '',
    });
  };

  // Update office user
  const handleUpdateOfficeUser = async (id) => {
    try {
      const payload = { ...officeUserEditForm };
      if (!payload.password) delete payload.password;
      const res = await axios.put(API.OFFICE_USER_UPDATE(id), payload, {
        headers: { Authorization: `Bearer ${localStorage.getItem('authToken')}` },
      });
      if (res.data.success) {
        setGlobalMessage({ type: 'success', text: 'Office user updated successfully' });
        fetchOfficeUsers();
        handleOfficeUserCancelEdit();
      } else {
        setGlobalMessage({ type: 'error', text: res.data.message || 'Update failed' });
      }
    } catch (err) {
      setGlobalMessage({ type: 'error', text: 'Failed to update office user' });
    }
  };

  // Delete office user
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

  // Lock/unlock office user
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

  useEffect(() => {
    if (globalMessage) {
      const timer = setTimeout(() => setGlobalMessage(null), 3000);
      return () => clearTimeout(timer);
    }
  }, [globalMessage]);

  return (
    <div className="p-0 md:p-2">
      <div className="flex items-center justify-between mb-8">
        <h2 className="text-3xl font-extrabold text-gray-800 tracking-tight flex items-center gap-3">
          <span className="inline-block w-10 h-10 rounded-xl bg-gradient-to-br from-blue-600 to-indigo-600 flex items-center justify-center text-white text-2xl shadow">O</span>
          Office Users
        </h2>
        <button
          className="flex items-center gap-2 px-5 py-2 rounded-2xl bg-gradient-to-r from-blue-600 to-indigo-600 text-white font-bold shadow hover:scale-105 transition-transform text-lg"
          onClick={() => setShowOfficeUserForm(true)}
        >
          <svg className="w-5 h-5" fill="none" stroke="currentColor" strokeWidth="2" viewBox="0 0 24 24"><path strokeLinecap="round" strokeLinejoin="round" d="M12 4v16m8-8H4" /></svg>
          Add Office User
        </button>
      </div>
      {globalMessage && (
        <div className={`mb-6 px-6 py-3 rounded-2xl shadow font-semibold text-base ${globalMessage.type === 'success' ? 'bg-green-100 text-green-800' : 'bg-red-100 text-red-800'}`}>{globalMessage.text}</div>
      )}
      {showOfficeUserForm && (
        <form onSubmit={handleNewOfficeUserSubmit} className="mb-10 bg-gradient-to-br from-blue-50 to-indigo-50 p-8 rounded-2xl shadow-xl border border-blue-100 animate-fade-in">
          <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
            <input name="name" value={newOfficeUser.name} onChange={handleNewOfficeUserChange} placeholder="Name" className="p-3 border-2 border-blue-200 rounded-xl focus:ring-2 focus:ring-blue-400" required />
            <input name="username" value={newOfficeUser.username} onChange={handleNewOfficeUserChange} placeholder="Username" className="p-3 border-2 border-blue-200 rounded-xl focus:ring-2 focus:ring-blue-400" required />
            <input name="email" value={newOfficeUser.email} onChange={handleNewOfficeUserChange} placeholder="Email" className="p-3 border-2 border-blue-200 rounded-xl focus:ring-2 focus:ring-blue-400" required />
            <input name="mobile" value={newOfficeUser.mobile} onChange={handleNewOfficeUserChange} placeholder="Mobile" className="p-3 border-2 border-blue-200 rounded-xl focus:ring-2 focus:ring-blue-400" required />
            <input name="office_id" value={newOfficeUser.office_id} onChange={handleNewOfficeUserChange} placeholder="Office ID" className="p-3 border-2 border-blue-200 rounded-xl focus:ring-2 focus:ring-blue-400" required />
            <input name="password" value={newOfficeUser.password} onChange={handleNewOfficeUserChange} placeholder="Password" className="p-3 border-2 border-blue-200 rounded-xl focus:ring-2 focus:ring-blue-400" required />
          </div>
          <div className="mt-6 flex gap-3 justify-end">
            <button type="submit" className="px-6 py-2 bg-gradient-to-r from-green-500 to-green-700 text-white rounded-2xl font-bold shadow hover:scale-105 transition-transform">Save</button>
            <button type="button" className="px-6 py-2 bg-gray-300 text-gray-700 rounded-2xl font-bold shadow hover:bg-gray-400" onClick={() => setShowOfficeUserForm(false)}>Cancel</button>
          </div>
        </form>
      )}
      <div className="overflow-x-auto animate-fade-in">
        <table className="min-w-full bg-white border-0 rounded-2xl shadow-xl overflow-hidden">
          <thead className="bg-gradient-to-r from-blue-600 to-indigo-600 text-white">
            <tr>
              <th className="p-4 text-left font-bold tracking-wide">Name</th>
              <th className="p-4 text-left font-bold tracking-wide">Username</th>
              <th className="p-4 text-left font-bold tracking-wide">Email</th>
              <th className="p-4 text-left font-bold tracking-wide">Mobile</th>
              <th className="p-4 text-left font-bold tracking-wide">Office ID</th>
              <th className="p-4 text-left font-bold tracking-wide">Password</th> {/* Add this */}
              <th className="p-4 text-left font-bold tracking-wide">Locked</th>
              <th className="p-4 text-left font-bold tracking-wide">Actions</th>
            </tr>
          </thead>
          <tbody className="divide-y divide-blue-50">
            {officeUsers.map(user => (
              officeUserEditId === user.id ? (
                <tr key={user.id} className="bg-yellow-50 animate-pulse">
                  <td className="p-3"><input name="name" value={officeUserEditForm.name} onChange={e => setOfficeUserEditForm({ ...officeUserEditForm, name: e.target.value })} className="p-2 border-2 border-yellow-300 rounded-xl" /></td>
                  <td className="p-3"><input name="username" value={officeUserEditForm.username} onChange={e => setOfficeUserEditForm({ ...officeUserEditForm, username: e.target.value })} className="p-2 border-2 border-yellow-300 rounded-xl" /></td>
                  <td className="p-3"><input name="email" value={officeUserEditForm.email} onChange={e => setOfficeUserEditForm({ ...officeUserEditForm, email: e.target.value })} className="p-2 border-2 border-yellow-300 rounded-xl" /></td>
                  <td className="p-3"><input name="mobile" value={officeUserEditForm.mobile} onChange={e => setOfficeUserEditForm({ ...officeUserEditForm, mobile: e.target.value })} className="p-2 border-2 border-yellow-300 rounded-xl" /></td>
                  <td className="p-3"><input name="office_id" value={officeUserEditForm.office_id} onChange={e => setOfficeUserEditForm({ ...officeUserEditForm, office_id: e.target.value })} className="p-2 border-2 border-yellow-300 rounded-xl" /></td>
                  <td className="p-3"><input name="password" value={officeUserEditForm.password} onChange={e => setOfficeUserEditForm({ ...officeUserEditForm, password: e.target.value })} className="p-2 border-2 border-yellow-300 rounded-xl" /></td>
                  <td className="p-3">{user.locked ? 'Yes' : 'No'}</td>
                  <td className="p-3 flex gap-2">
                    <button className="px-4 py-2 bg-gradient-to-r from-green-500 to-green-700 text-white rounded-2xl font-bold shadow hover:scale-105 transition-transform" onClick={() => handleUpdateOfficeUser(user.id)}>Save</button>
                    <button className="px-4 py-2 bg-gray-300 text-gray-700 rounded-2xl font-bold shadow hover:bg-gray-400" onClick={handleOfficeUserCancelEdit}>Cancel</button>
                  </td>
                </tr>
              ) : (
                <tr key={user.id} className="hover:bg-blue-50 transition-all">
                  <td className="p-4 font-semibold text-blue-900">{user.name}</td>
                  <td className="p-4">{user.username}</td>
                  <td className="p-4">{user.email}</td>
                  <td className="p-4">{user.mobile}</td>
                  <td className="p-4">{user.office_id}</td>
                  <td className="p-4">{user.password}</td> {/* Show password */}
                  <td className="p-4">{user.locked ? 'Yes' : 'No'}</td>
                  <td className="p-4 flex gap-2">
                    <button className="px-4 py-2 bg-gradient-to-r from-yellow-400 to-yellow-600 text-white rounded-2xl font-bold shadow hover:scale-105 transition-transform" onClick={() => handleOfficeUserEdit(user)}>Edit</button>
                    <button className="px-4 py-2 bg-gradient-to-r from-red-500 to-red-700 text-white rounded-2xl font-bold shadow hover:scale-105 transition-transform" onClick={() => handleDeleteOfficeUser(user.id)}>Delete</button>
                    <button className={`px-4 py-2 rounded-2xl font-bold shadow transition-all ${user.locked ? 'bg-gray-600 hover:bg-gray-700 text-white' : 'bg-blue-600 hover:bg-blue-700 text-white'}`} onClick={() => handleOfficeUserLockToggle(user.id, !user.locked)}>{user.locked ? 'Unlock' : 'Lock'}</button>
                  </td>
                </tr>
              )
            ))}
          </tbody>
        </table>
      </div>
    </div>
  );
}
