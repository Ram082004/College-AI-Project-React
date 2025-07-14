import React, { useState, useEffect } from 'react';
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

export default function Department() {
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
  const [filter, setFilter] = useState({
    department: '',
    type: '', // 'Student Enrollment' or 'Student Examination'
    category: '',
    subcategory: '',
    yearSlot: '',
    degree_level: '', // <-- Add this
  });
  const [enrollmentSummary, setEnrollmentSummary] = useState([]);
  const [examinationSummary, setExaminationSummary] = useState([]);
  const [showFilter, setShowFilter] = useState(false);

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

  // Calculate totals for the selected year slot only
  const filteredYear = filter.yearSlot;
  const yearFilteredSummary = filteredYear
    ? enrollmentSummary.filter(row => row.year === filteredYear)
    : enrollmentSummary;

  const yearTotalCounts = yearFilteredSummary.reduce(
    (totals, row) => {
      totals.male += Number(row.male_count) || 0;
      totals.female += Number(row.female_count) || 0;
      totals.transgender += Number(row.transgender_count) || 0;
      return totals;
    },
    { male: 0, female: 0, transgender: 0 }
  );

  // Dynamically choose year slots based on degree_level
  const getYearSlotOptions = () => {
    if (filter.degree_level === 'UG') return yearSlotOptionsUG;
    if (filter.degree_level === 'PG') return yearSlotOptionsPG;
    return yearSlotOptionsUG; // Default to UG if not selected
  };

  // Reset yearSlot if degree_level changes and current yearSlot is not valid
  useEffect(() => {
    const validYears = getYearSlotOptions();
    if (filter.yearSlot && !validYears.includes(filter.yearSlot)) {
      setFilter(f => ({ ...f, yearSlot: '' }));
    }
    // eslint-disable-next-line
  }, [filter.degree_level]);

  return (
    <div className="p-0 md:p-2">
      {/* Department Data Collapsible Container */}
      <div className="mb-8">
        <button
          className="w-full flex justify-between items-center px-6 py-4 bg-gradient-to-r from-blue-600 to-indigo-600 text-white rounded-2xl font-bold shadow-lg text-xl focus:outline-none"
          onClick={() => setShowFilter((prev) => !prev)}
        >
          <span>Department Data</span>
          <span className="text-2xl">{showFilter ? '▲' : '▼'}</span>
        </button>
        {showFilter && (
          <div className="bg-white rounded-b-2xl shadow-lg px-6 py-6 border-t border-blue-100">
            <div className="flex flex-wrap gap-4 mb-6">
              <select
                className="p-2 border rounded"
                value={filter.department}
                onChange={e => setFilter(f => ({ ...f, department: e.target.value }))}
              >
                <option value="">All Departments</option>
                {departmentOptions.map(opt => (
                  <option key={opt} value={opt}>{opt}</option>
                ))}
              </select>
              <select
                className="p-2 border rounded"
                value={filter.type}
                onChange={e => setFilter(f => ({ ...f, type: e.target.value }))}
              >
                <option value="">All Types</option>
                <option value="Student Enrollment">Student Enrollment</option>
                <option value="Student Examination">Student Examination</option>
              </select>
              <select
                className="p-2 border rounded"
                value={filter.category}
                onChange={e => setFilter(f => ({ ...f, category: e.target.value }))}
              >
                <option value="">All Categories</option>
                <option value="General Including EWS">General Including EWS</option>
                <option value="Scheduled Caste (SC)">Scheduled Caste (SC)</option>
                <option value="Scheduled Tribe (ST)">Scheduled Tribe (ST)</option>
                <option value="Other Backward Classes (OBC)">Other Backward Classes (OBC)</option>
              </select>
              <select
                className="p-2 border rounded"
                value={filter.subcategory}
                onChange={e => setFilter(f => ({ ...f, subcategory: e.target.value }))}
              >
                <option value="">All Subcategories</option>
                <option value="PwBD">PwBD</option>
                <option value="Muslim Minority">Muslim Minority</option>
                <option value="Other Minority">Other Minority</option>
              </select>
              <select
                className="p-2 border rounded"
                value={filter.yearSlot}
                onChange={e => setFilter(f => ({ ...f, yearSlot: e.target.value }))}
              >
                <option value="">All Year Slots</option>
                {getYearSlotOptions().map(opt => (
                  <option key={opt} value={opt}>{opt}</option>
                ))}
              </select>
              <select
                className="p-2 border rounded"
                value={filter.degree_level}
                onChange={e => setFilter(f => ({ ...f, degree_level: e.target.value }))}
              >
                <option value="">All Degree Levels</option>
                <option value="UG">UG</option>
                <option value="PG">PG</option>
              </select>
              <button
                className="px-4 py-2 bg-blue-600 text-white rounded"
                onClick={async () => {
                  try {
                    if (filter.type === 'Student Enrollment' && filter.department) {
                      const res = await axios.get(`${API_BASE}/department-user/student-enrollment/summary`, {
                        params: {
                          department: filter.department,
                          category: filter.category,
                          subcategory: filter.subcategory,
                          year: filter.yearSlot,
                          degree_level: filter.degree_level, // <-- Pass degree_level
                        },
                        headers: { Authorization: `Bearer ${localStorage.getItem('authToken')}` }
                      });
                      setEnrollmentSummary(res.data.summary || []);
                      setExaminationSummary([]);
                    } else if (filter.type === 'Student Examination' && filter.department) {
                      const res = await axios.get(`${API_BASE}/department-user/student-examination/summary`, {
                        params: {
                          department: filter.department,
                          category: filter.category,
                          subcategory: filter.subcategory,
                          year: filter.yearSlot,
                          degree_level: filter.degree_level, // <-- Pass degree_level
                        },
                        headers: { Authorization: `Bearer ${localStorage.getItem('authToken')}` }
                      });
                      setExaminationSummary(res.data.summary || []);
                      setEnrollmentSummary([]);
                    } else {
                      setEnrollmentSummary([]);
                      setExaminationSummary([]);
                    }
                  } catch (err) {
                    setEnrollmentSummary([]);
                    setExaminationSummary([]);
                    setGlobalMessage({ type: 'error', text: 'Failed to fetch summary data' });
                  }
                }}
              >
                Filter
              </button>
            </div>
            {/* Enrollment Summary Table */}
            {filter.type === 'Student Enrollment' && filter.department && (
              <div className="mb-8">
                <h3 className="text-xl font-bold mb-2">
                  Student Enrollment Summary for {filter.department}
                  {filteredYear && ` - ${filteredYear}`}
                  {filter.degree_level && ` (${filter.degree_level})`}
                </h3>
                {yearFilteredSummary.length > 0 ? (
                  <table className="min-w-full bg-white border rounded-xl shadow overflow-hidden">
                    <thead className="bg-gradient-to-r from-blue-50 to-indigo-50">
                      <tr>
                        <th className="px-4 py-2">Year Slot</th>
                        <th className="px-4 py-2">Degree Level</th>
                        <th className="px-4 py-2">Category</th>
                        <th className="px-4 py-2">Subcategory</th>
                        <th className="px-4 py-2">Male</th>
                        <th className="px-4 py-2">Female</th>
                        <th className="px-4 py-2">Transgender</th>
                      </tr>
                    </thead>
                    <tbody>
                      {yearFilteredSummary.map((row, idx) => (
                        <tr key={idx}>
                          <td className="px-4 py-2">{row.year}</td>
                          <td className="px-4 py-2">{row.degree_level || '-'}</td>
                          <td className="px-4 py-2">{row.category}</td>
                          <td className="px-4 py-2">{row.subcategory}</td>
                          <td className="px-4 py-2">{row.male_count}</td>
                          <td className="px-4 py-2">{row.female_count}</td>
                          <td className="px-4 py-2">{row.transgender_count}</td>
                        </tr>
                      ))}
                      <tr className="font-bold bg-blue-50">
                        <td className="px-4 py-2" colSpan={4}>Total ({filteredYear || 'All Years'}{filter.degree_level && `, ${filter.degree_level}`})</td>
                        <td className="px-4 py-2">{yearTotalCounts.male}</td>
                        <td className="px-4 py-2">{yearTotalCounts.female}</td>
                        <td className="px-4 py-2">{yearTotalCounts.transgender}</td>
                      </tr>
                    </tbody>
                  </table>
                ) : (
                  <div className="text-center text-gray-500 py-8">
                    <svg className="mx-auto mb-2 w-10 h-10 text-gray-300" fill="none" stroke="currentColor" strokeWidth="2" viewBox="0 0 24 24"><path strokeLinecap="round" strokeLinejoin="round" d="M9 17v-6a2 2 0 012-2h2a2 2 0 012 2v6m-6 4h6a2 2 0 002-2V7a2 2 0 00-2-2H7a2 2 0 00-2 2v12a2 2 0 002 2z" /></svg>
                    No enrollment summary found for the selected filter.
                  </div>
                )}
              </div>
            )}
            {/* Examination Summary Table */}
            {filter.type === 'Student Examination' && filter.department && (
              <div className="mb-8">
                <h3 className="text-xl font-bold mb-2">
                  Student Examination Summary for {filter.department}
                  {filter.degree_level && ` (${filter.degree_level})`}
                </h3>
                {examinationSummary.length > 0 ? (
                  <table className="min-w-full bg-white border rounded-xl shadow overflow-hidden">
                    <thead className="bg-gradient-to-r from-blue-50 to-indigo-50">
                      <tr>
                        <th className="px-4 py-2">Degree Level</th>
                        <th className="px-4 py-2">Year</th>
                        <th className="px-4 py-2">Category</th>
                        <th className="px-4 py-2">Subcategory</th>
                        <th className="px-4 py-2">Male</th>
                        <th className="px-4 py-2">Female</th>
                        <th className="px-4 py-2">Transgender</th>
                      </tr>
                    </thead>
                    <tbody>
                      {examinationSummary.map((row, idx) => (
                        <tr key={idx}>
                          <td className="px-4 py-2">{row.degree_level || '-'}</td>
                          <td className="px-4 py-2">{row.year || '-'}</td>
                          <td className="px-4 py-2">{row.category}</td>
                          <td className="px-4 py-2">{row.subcategory}</td>
                          <td className="px-4 py-2">{row.male_count}</td>
                          <td className="px-4 py-2">{row.female_count}</td>
                          <td className="px-4 py-2">{row.transgender_count}</td>
                        </tr>
                      ))}
                      <tr className="font-bold bg-blue-50">
                        <td className="px-4 py-2" colSpan={4}>Total{filter.degree_level && ` (${filter.degree_level})`}</td>
                        <td className="px-4 py-2">
                          {examinationSummary.reduce((t, r) => t + Number(r.male_count || 0), 0)}
                        </td>
                        <td className="px-4 py-2">
                          {examinationSummary.reduce((t, r) => t + Number(r.female_count || 0), 0)}
                        </td>
                        <td className="px-4 py-2">
                          {examinationSummary.reduce((t, r) => t + Number(r.transgender_count || 0), 0)}
                        </td>
                      </tr>
                    </tbody>
                  </table>
                ) : (
                  <div className="text-center text-gray-500 py-8">
                    <svg className="mx-auto mb-2 w-10 h-10 text-gray-300" fill="none" stroke="currentColor" strokeWidth="2" viewBox="0 0 24 24"><path strokeLinecap="round" strokeLinejoin="round" d="M9 17v-6a2 2 0 012-2h2a2 2 0 012 2v6m-6 4h6a2 2 0 002-2V7a2 2 0 00-2-2H7a2 2 0 00-2 2v12a2 2 0 002 2z" /></svg>
                    No examination summary found for the selected filter.
                  </div>
                )}
              </div>
            )}
          </div>
        )}
      </div>

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
            <input name="academic_year" value={newUser.academic_year} onChange={handleNewUserChange} placeholder="Academic Year" className="p-3 border-2 border-blue-200 rounded-xl focus:ring-2 focus:ring-blue-400" required />
            <select name="degree_level" value={newUser.degree_level} onChange={handleNewUserChange} className="p-3 border-2 border-blue-200 rounded-xl focus:ring-2 focus:ring-blue-400" required>
              <option value="">Select Degree Level</option>
              <option value="UG">UG</option>
              <option value="PG">PG</option>
            </select>
            <input name="duration" value={newUser.duration} onChange={handleNewUserChange} placeholder="Duration" className="p-3 border-2 border-blue-200 rounded-xl focus:ring-2 focus:ring-blue-400" />
            <input name="password" value={newUser.password} onChange={handleNewUserChange} placeholder="Password" className="p-3 border-2 border-blue-200 rounded-xl focus:ring-2 focus:ring-blue-400" required />
            <input name="hod" value={newUser.hod} onChange={handleNewUserChange} placeholder="HOD Name" className="p-3 border-2 border-blue-200 rounded-xl focus:ring-2 focus:ring-blue-400" required />
          </div>
          <div className="mt-6 flex gap-3 justify-end">
            <button type="submit" className="px-6 py-2 bg-gradient-to-r from-green-500 to-green-700 text-white rounded-2xl font-bold shadow hover:scale-105 transition-transform">Save</button>
            <button type="button" className="px-6 py-2 bg-gray-300 text-gray-700 rounded-2xl font-bold shadow hover:bg-gray-400" onClick={() => setShowDeptUserForm(false)}>Cancel</button>
          </div>
        </form>
      )}
      {!(filter.type === 'Student Enrollment' && filter.department && enrollmentSummary.length > 0) && (
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
                <th className="p-4 text-left font-bold tracking-wide">Password</th> {/* Add this */}
                <th className="p-4 text-left font-bold tracking-wide">Locked</th>
                <th className="p-4 text-left font-bold tracking-wide">Actions</th>
              </tr>
            </thead>
            <tbody className="divide-y divide-blue-50">
              {departmentUsers
                .filter(user => !filter.department || user.department === filter.department)
                .map(user => (
                  deptUserEditId === user.id ? (
                    <tr key={user.id} className="bg-yellow-50 animate-pulse">
                      <td className="p-3"><input name="name" value={deptUserEditForm.name} onChange={e => setDeptUserEditForm({ ...deptUserEditForm, name: e.target.value })} className="p-2 border-2 border-yellow-300 rounded-xl" /></td>
                      <td className="p-3"><input name="username" value={deptUserEditForm.username} onChange={e => setDeptUserEditForm({ ...deptUserEditForm, username: e.target.value })} className="p-2 border-2 border-yellow-300 rounded-xl" /></td>
                      <td className="p-3"><input name="email" value={deptUserEditForm.email} onChange={e => setDeptUserEditForm({ ...deptUserEditForm, email: e.target.value })} className="p-2 border-2 border-yellow-300 rounded-xl" /></td>
                      <td className="p-3"><input name="mobile" value={deptUserEditForm.mobile} onChange={e => setDeptUserEditForm({ ...deptUserEditForm, mobile: e.target.value })} className="p-2 border-2 border-yellow-300 rounded-xl" /></td>
                      <td className="p-3"><select name="department" value={deptUserEditForm.department} onChange={e => setDeptUserEditForm({ ...deptUserEditForm, department: e.target.value })} className="p-2 border-2 border-yellow-300 rounded-xl">
                        <option value="">Select Department</option>
                        {departmentOptions.map(opt => <option key={opt} value={opt}>{opt}</option>)}
                      </select></td>
                      <td className="p-3"><input name="dept_id" value={deptUserEditForm.dept_id} onChange={e => setDeptUserEditForm({ ...deptUserEditForm, dept_id: e.target.value })} className="p-2 border-2 border-yellow-300 rounded-xl" /></td>
                      <td className="p-3"><input name="academic_year" value={deptUserEditForm.academic_year} onChange={e => setDeptUserEditForm({ ...deptUserEditForm, academic_year: e.target.value })} className="p-2 border-2 border-yellow-300 rounded-xl" /></td>
                      <td className="p-3"><select name="degree_level" value={deptUserEditForm.degree_level} onChange={e => setDeptUserEditForm({ ...deptUserEditForm, degree_level: e.target.value })} className="p-2 border-2 border-yellow-300 rounded-xl">
                        <option value="">Select Degree Level</option>
                        <option value="UG">UG</option>
                        <option value="PG">PG</option>
                      </select></td>
                      <td className="p-3"><input name="duration" value={deptUserEditForm.duration} onChange={e => setDeptUserEditForm({ ...deptUserEditForm, duration: e.target.value })} className="p-2 border-2 border-yellow-300 rounded-xl" /></td>
                      <td className="p-3"><input name="hod" value={deptUserEditForm.hod} onChange={e => setDeptUserEditForm({ ...deptUserEditForm, hod: e.target.value })} className="p-2 border-2 border-yellow-300 rounded-xl" /></td>
                      <td className="p-3"><input name="password" value={deptUserEditForm.password} onChange={e => setDeptUserEditForm({ ...deptUserEditForm, password: e.target.value })} className="p-2 border-2 border-yellow-300 rounded-xl" /></td>
                      <td className="p-3 flex gap-2">
                        <button className="px-4 py-2 bg-gradient-to-r from-green-500 to-green-700 text-white rounded-2xl font-bold shadow hover:scale-105 transition-transform" onClick={() => handleDeptUserUpdate(user.id)}>Save</button>
                        <button className="px-4 py-2 bg-gray-300 text-gray-700 rounded-2xl font-bold shadow hover:bg-gray-400" onClick={handleDeptUserCancelEdit}>Cancel</button>
                      </td>
                    </tr>
                  ) : (
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
                      <td className="p-4">{user.password}</td> {/* Show password */}
                      <td className="p-4">{user.locked ? 'Yes' : 'No'}</td>
                      <td className="p-4 flex gap-2">
                        <button className="px-4 py-2 bg-gradient-to-r from-yellow-400 to-yellow-600 text-white rounded-2xl font-bold shadow hover:scale-105 transition-transform" onClick={() => handleDeptUserEdit(user)}>Edit</button>
                        <button className="px-4 py-2 bg-gradient-to-r from-red-500 to-red-700 text-white rounded-2xl font-bold shadow hover:scale-105 transition-transform" onClick={() => handleDeptUserDelete(user.id)}>Delete</button>
                        <button className={`px-4 py-2 rounded-2xl font-bold shadow transition-all ${user.locked ? 'bg-gray-600 hover:bg-gray-700 text-white' : 'bg-blue-600 hover:bg-blue-700 text-white'}`} onClick={() => handleDeptUserLockToggle(user.id, !user.locked)}>{user.locked ? 'Unlock' : 'Lock'}</button>
                      </td>
                    </tr>
                  )
                ))}
            </tbody>
          </table>
        </div>
      )}
    </div>
  );
}
