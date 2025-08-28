import React, { useEffect, useState } from "react";
import axios from "axios";
import AcademicYearBadge from "./AcademicYearBadge";

const API_BASE = "http://localhost:5000/api";
const API = {
  SUBMITTED_DATA_ALL: `${API_BASE}/submitted-data`,
  SUBMITTED_DATA_LOCK: (id) => `${API_BASE}/submitted-data/${id}/lock`,
  SUBMITTED_DATA_DELETE: (id) => `${API_BASE}/submitted-data/${id}`,
  DEPT_USERS: `${API_BASE}/department-user`,
  // Use the existing admin routes that return enrollment/examination summaries
  ENROLLMENT_SUMMARY: `${API_BASE}/department-user/student-enrollment/summary`,
  EXAMINATION_SUMMARY: `${API_BASE}/department-user/student-examination/summary`
};

const fallbackDepartments = [
  "B.C.A",
  "B.COM",
  "BBA",
  "B.A English",
  "M.A English",
  "B.SC Maths",
  "M.SC Maths",
  "B.SC Chemistry",
  "M.COM",
  "B.SC Physics",
];

function SubmittedData() {
  const [submittedData, setSubmittedData] = useState([]);
  const [departmentUsers, setDepartmentUsers] = useState([]);
  const [loading, setLoading] = useState(false);
  const [globalMessage, setGlobalMessage] = useState(null);
  const [filterUI, setFilterUI] = useState({ department: "", type: "", degree_level: "", academic_year: "" });
  const [filters, setFilters] = useState({ department: "", type: "", degree_level: "", academic_year: "" });
  const [academicYears, setAcademicYears] = useState([]);
  const [adminAcademicYear, setAdminAcademicYear] = useState("");
  const [activeYearTab, setActiveYearTab] = useState('current');

  // NEW: totals for male/female/transgender across enrollment + examination (for header cards)
  const [genderTotals, setGenderTotals] = useState({ male: 0, female: 0, transgender: 0 });

  // Fetch all data on mount (default)
  useEffect(() => {
    fetchSubmittedData({ department: "", type: "", degree_level: "", academic_year: "" });
    fetchDepartmentUsers();
    fetchGenderTotals({}); // initial totals (use default year)
    // eslint-disable-next-line
  }, []);

  // Fetch on filters change (when user clicks Filter)
  useEffect(() => {
    fetchSubmittedData();
    fetchGenderTotals(filters);
    // eslint-disable-next-line
  }, [filters]);

  // Fetch distinct academic years for dropdown
  useEffect(() => {
    async function fetchAcademicYears() {
      try {
        const res = await axios.get(`${API_BASE}/submitted-data/distinct/years`, {
          headers: { Authorization: `Bearer ${localStorage.getItem("authToken")}` }
        });
        setAcademicYears(res.data.years || []);
      } catch {
        setAcademicYears([]);
      }
    }
    fetchAcademicYears();
  }, []);

  // Fetch admin's academic year
  useEffect(() => {
    async function fetchAdminYear() {
      try {
        const res = await axios.get(`${API_BASE}/admin/all`, {
          headers: { Authorization: `Bearer ${localStorage.getItem('authToken')}` }
        });
        if (res.data?.admins?.length) {
          setAdminAcademicYear(res.data.admins[0].academic_year || "");
        }
      } catch {
        setAdminAcademicYear("");
      }
    }
    fetchAdminYear();
  }, []);

  // Keep adminAcademicYear in sync with localStorage (admin page should write 'latestAcademicYear' on update)
  useEffect(() => {
    // initialize from localStorage (if admin.js stored the new year)
    try {
      const stored = localStorage.getItem('latestAcademicYear');
      if (stored) setAdminAcademicYear(stored);
    } catch (e) { /* ignore */ }

    const onStorage = (e) => {
      if (e.key === 'latestAcademicYear') {
        setAdminAcademicYear(e.newValue || '');
      }
    };
    window.addEventListener('storage', onStorage);
    return () => window.removeEventListener('storage', onStorage);
  }, []);

  // When the active year tab or adminAcademicYear/academicYears changes, adjust filters and re-fetch:
  useEffect(() => {
    if (activeYearTab === 'current') {
      const ay = adminAcademicYear || (academicYears[0] || '');
      setFilterUI(f => ({ ...f, academic_year: ay }));
      setFilters(f => ({ ...f, academic_year: ay }));
    } else {
      // previous: clear explicit academic_year filter so previousYearsData shows rows with different academic_year
      setFilterUI(f => ({ ...f, academic_year: '' }));
      setFilters(f => ({ ...f, academic_year: '' }));
    }
    // eslint-disable-next-line
  }, [activeYearTab, adminAcademicYear, academicYears]);

  // If adminAcademicYear changes (e.g. update from Admin page), ensure current tab shows new year immediately
  useEffect(() => {
    if (activeYearTab === 'current') {
      const ay = adminAcademicYear || (academicYears[0] || '');
      setFilterUI(f => ({ ...f, academic_year: ay }));
      setFilters(f => ({ ...f, academic_year: ay }));
    }
    // eslint-disable-next-line
  }, [adminAcademicYear]);

  // Fetch department users (only departments that have users)
  const fetchDepartmentUsers = async () => {
    try {
      const res = await axios.get(API.DEPT_USERS, {
        headers: { Authorization: `Bearer ${localStorage.getItem("authToken")}` }
      });
      // Expect an array of department user objects with fields like { dept_id, department, name, academic_year, degree_level, hod, ... }
      setDepartmentUsers(Array.isArray(res.data?.users) ? res.data.users : (res.data || []));
    } catch (err) {
      // fallback: build minimal mapping from fallbackDepartments
      setDepartmentUsers(fallbackDepartments.map((d, i) => ({ dept_id: null, department: d, name: "-", degree_level: null, hod: "-" })));
    }
  };

  // Fetch all submitted data with filters
  const fetchSubmittedData = async (customFilters = filters) => {
    setLoading(true);
    try {
      const params = {};
      if (customFilters.department) params.department = customFilters.department;
      if (customFilters.type) params.type = customFilters.type;
      if (customFilters.degree_level) params.degree_level = customFilters.degree_level;
      if (customFilters.academic_year) params.academic_year = customFilters.academic_year;
      const res = await axios.get(API.SUBMITTED_DATA_ALL, {
        params,
        headers: { Authorization: `Bearer ${localStorage.getItem("authToken")}` },
      });
      setSubmittedData(res.data.data || []);
    } catch (err) {
      setGlobalMessage({ type: "error", text: "Failed to fetch submitted data" });
    } finally {
      setLoading(false);
    }
  };

  // NEW: fetch combined gender totals from enrollment + examination summary endpoints.
  const fetchGenderTotals = async (filterParams = {}) => {
    // Build final params: prefer explicit function param -> filters state -> adminAcademicYear -> first available academic year
    const academic_year = filterParams.academic_year || filters.academic_year || adminAcademicYear || (academicYears[0] || "");
    const degree_level = filterParams.degree_level || filters.degree_level || "";
    const department = filterParams.department || filters.department || ""; // optional, allows per-department totals

    try {
      const [enRes, exRes] = await Promise.all([
        axios.get(API.ENROLLMENT_SUMMARY, {
          params: { academic_year, degree_level, department },
          headers: { Authorization: `Bearer ${localStorage.getItem("authToken")}` }
        }),
        axios.get(API.EXAMINATION_SUMMARY, {
          params: { academic_year, degree_level, department },
          headers: { Authorization: `Bearer ${localStorage.getItem("authToken")}` }
        }),
      ]);

      const safeRows = (r) => {
        if (!r || typeof r !== 'object') return [];
        return Array.isArray(r.data?.summary) ? r.data.summary : (Array.isArray(r.data?.data) ? r.data.data : []);
      };

      const eRows = safeRows(enRes);
      const xRows = safeRows(exRes);

      const sumRows = (rows = []) => rows.reduce((acc, item) => {
        acc.male += Number(item.male_count || item.male || 0);
        acc.female += Number(item.female_count || item.female || 0);
        acc.transgender += Number(item.transgender_count || item.transgender || 0);
        return acc;
      }, { male: 0, female: 0, transgender: 0 });

      const eTotals = sumRows(eRows);
      const xTotals = sumRows(xRows);

      setGenderTotals({
        male: eTotals.male + xTotals.male,
        female: eTotals.female + xTotals.female,
        transgender: eTotals.transgender + xTotals.transgender
      });
    } catch (err) {
      setGenderTotals({ male: 0, female: 0, transgender: 0 });
    }
  };

  // Recalculate totals when academic years or adminAcademicYear change (ensures initial load uses correct year)
  useEffect(() => {
    // call with current filters so department/degree_level/academic_year are honored
    fetchGenderTotals(filters);
    // eslint-disable-next-line
  }, [academicYears, adminAcademicYear]);

  // Lock/Unlock handler
  const handleLockToggle = async (id, locked) => {
    try {
      const res = await axios.patch(API.SUBMITTED_DATA_LOCK(id), { locked }, {
        headers: { Authorization: `Bearer ${localStorage.getItem("authToken")}` },
      });
      if (res.data.success) {
        setGlobalMessage({ type: "success", text: `Submission ${locked ? "locked" : "unlocked"} successfully` });
        fetchSubmittedData();
        fetchGenderTotals(filters);
      } else {
        setGlobalMessage({ type: "error", text: res.data.message || "Failed to update lock status" });
      }
    } catch (err) {
      setGlobalMessage({ type: "error", text: "Failed to update lock status" });
    }
  };

  // Delete handler
  const handleDelete = async (id) => {
    if (!window.confirm("Are you sure you want to delete this submission?")) return;
    try {
      const res = await axios.delete(API.SUBMITTED_DATA_DELETE(id), {
        headers: { Authorization: `Bearer ${localStorage.getItem("authToken")}` },
      });
      if (res.data.success) {
        setGlobalMessage({ type: "success", text: "Submission deleted successfully" });
        fetchSubmittedData();
        fetchGenderTotals(filters);
      } else {
        setGlobalMessage({ type: "error", text: res.data.message || "Failed to delete submission" });
      }
    } catch (err) {
      setGlobalMessage({ type: "error", text: "Failed to delete submission" });
    }
  };

  // Category master summary removed; now showing gender totals

  // Build departments to show from departmentUsers (only departments that have users)
  const uniqueDepartments = (() => {
    // When a department filter is selected we must return the department-user object (not a string).
    if (filterUI.department) {
      // find matching dept user record
      const found = (departmentUsers || []).find(u => String(u.department).trim() === String(filterUI.department).trim());
      if (found) return [found];
      // fallback to minimal object if not in departmentUsers
      return [{ dept_id: null, department: filterUI.department, name: "-", degree_level: null, hod: "-" }];
    }
    const deptSet = new Map();
    // departmentUsers may have multiple entries per department (different academic_years etc.) - keep latest per dept name
    (departmentUsers || []).forEach(u => {
      if (!u || !u.department) return;
      const key = String(u.department).trim();
      // prefer an entry with dept_id and name
      if (!deptSet.has(key)) deptSet.set(key, u);
    });
    if (deptSet.size === 0) {
      // fallback to static list
      fallbackDepartments.forEach((d) => { if (!deptSet.has(d)) deptSet.set(d, { dept_id: null, department: d, name: "-", degree_level: null, hod: "-" }); });
    }
    return Array.from(deptSet.values());
  })();

  // Helper to get default year display string based on degree level
  const defaultYearForDegree = (deg) => {
    if (deg === 'PG') return 'I Year, II Year';
    return 'I Year, II Year, III Year'; // default UG
  };

  // Produce rows: for each department user row show either latest submission or a default incompleted row
  const rowsForDepartments = uniqueDepartments.map((deptUser) => {
    const deptName = deptUser.department;
    const deptIdFromUser = deptUser.dept_id ?? null;
    const deptDegreeLevelFromUser = deptUser.degree_level || null; // use dept user degree level if present
    // restrict submittedData entries to this department name
    const deptMatches = submittedData.filter(r => (r.department || '').trim() === (deptName || '').trim());

    // If academic_year filter is set in UI, prefer that academic year, otherwise use adminAcademicYear or latest from deptMatches
    const academicYearSelected = filterUI.academic_year || adminAcademicYear || (academicYears[0] || '');

    // Filter matches by selected academic year and degree_level if provided
    const filteredMatches = deptMatches.filter(m => {
      if (filterUI.academic_year && m.academic_year !== filterUI.academic_year) return false;
      if (filterUI.degree_level && m.degree_level && m.degree_level !== filterUI.degree_level) return false;
      return true;
    });

    // helper: find latest record for a given type
    const latestOfType = (arr, type) => {
      const items = arr.filter(x => x.type === type);
      if (items.length === 0) return null;
      items.sort((a, b) => new Date(b.submitted_at || 0) - new Date(a.submitted_at || 0));
      return items[0];
    };

    if (filteredMatches.length > 0) {
      // group by academic_year + degree_level to prefer logical grouping
      const groups = {};
      filteredMatches.forEach(r => {
        const ay = r.academic_year || academicYearSelected || '';
        const dl = r.degree_level || (filterUI.degree_level || deptDegreeLevelFromUser || 'UG');
        const key = `${ay}||${dl}`;
        groups[key] = groups[key] || { types: new Set(), latest: null, rows: [] };
        groups[key].types.add(r.type);
        groups[key].rows.push(r);
        if (!groups[key].latest || (new Date(r.submitted_at || 0) > new Date(groups[key].latest.submitted_at || 0))) {
          groups[key].latest = r;
        }
      });

      // Prefer group matching academicYearSelected and degree level filters / department user's degree level
      const preferredKeys = [
        `${academicYearSelected}||${filterUI.degree_level || ''}`,
        `${academicYearSelected}||${deptDegreeLevelFromUser || filterUI.degree_level || 'UG'}`,
        ...Object.keys(groups)
      ];
      let selectedGroup = null;
      for (const k of preferredKeys) {
        if (groups[k]) { selectedGroup = groups[k]; break; }
      }
      if (!selectedGroup) selectedGroup = groups[Object.keys(groups)[0]];

      const rows = selectedGroup.rows;
      const latest = selectedGroup.latest;

      // Determine per-type statuses (prefer explicit DB status if present)
      const latestEnrollment = latestOfType(rows, 'Student Enrollment');
      const latestExam = latestOfType(rows, 'Student Examination');

      const enrollmentStatus = latestEnrollment ? (latestEnrollment.status || 'Completed') : 'Incompleted';
      const examinationStatus = latestExam ? (latestExam.status || 'Completed') : 'Incompleted';

      const typesArr = Array.from(selectedGroup.types).filter(Boolean);
      const combinedType = typesArr.length > 0 ? typesArr.join(' / ') : 'Not Submitted';

      return {
        id: latest.id,
        dept_id: latest.dept_id ?? deptIdFromUser,
        department: deptName,
        name: latest.name || deptUser.name || '-',
        year: latest.year || defaultYearForDegree(latest.degree_level || deptDegreeLevelFromUser || filterUI.degree_level || 'UG'),
        academic_year: latest.academic_year || academicYearSelected,
        degree_level: latest.degree_level || deptDegreeLevelFromUser || filterUI.degree_level || 'UG',
        type: combinedType,
        hod: latest.hod || deptUser.hod || '-',
        submitted_at: latest.submitted_at || null,
        locked: latest.locked ? !!latest.locked : false,
        status: latest.status || 'Completed',
        enrollmentStatus,
        examinationStatus
      };
    }

    // no submission for this department -> default incompleted row with department user name
    const deg = deptDegreeLevelFromUser || filterUI.degree_level || 'UG';
    return {
      id: `default-${deptName}`,
      dept_id: deptIdFromUser,
      department: deptName,
      name: deptUser.name || '-',
      year: defaultYearForDegree(deg),
      academic_year: filterUI.academic_year || adminAcademicYear || (academicYears[0] || ''),
      degree_level: deg,
      type: 'Not Submitted',
      hod: deptUser.hod || '-',
      submitted_at: null,
      locked: false,
      status: 'Incompleted',
      enrollmentStatus: 'Incompleted',
      examinationStatus: 'Incompleted'
    };
  });

  // Auto-hide global message after 3 seconds
  useEffect(() => {
    if (globalMessage) {
      const timer = setTimeout(() => setGlobalMessage(null), 3000);
      return () => clearTimeout(timer);
    }
  }, [globalMessage]);

  // Determine current and previous years
  const currentYear = adminAcademicYear || (academicYears.length > 0 ? academicYears[0] : '');
  const currentYearData = rowsForDepartments.filter(row => (row.academic_year || '') === currentYear);
  const previousYearsData = rowsForDepartments.filter(row => (row.academic_year || '') !== currentYear);

  // UI helpers
  const showAction = activeYearTab !== 'previous';
  const totalColumns = showAction ? 10 : 9; // used for no-data colspan

  return (
    <div className="p-0 md:p-6 bg-gradient-to-br from-blue-50 to-indigo-50 min-h-screen">
      <div className="flex justify-end mb-4">
        <AcademicYearBadge year={adminAcademicYear} />
      </div>

      {/* Filter Bar (no glass effect) */}
      <div className="mb-8">
        <div className="w-full max-w-4xl mx-auto bg-white rounded-2xl shadow-xl border border-blue-100 px-8 py-6 flex flex-col md:flex-row md:items-end gap-6 relative overflow-hidden">
          <div className="flex-1">
            <label className="block text-xs font-bold text-blue-700 mb-2 tracking-widest uppercase">Department</label>
            <select
              value={filterUI.department}
              onChange={e => setFilterUI(f => ({ ...f, department: e.target.value }))}
              className="w-full px-4 py-3 rounded-xl border border-blue-200 bg-white shadow focus:ring-2 focus:ring-blue-400 text-base"
            >
              <option value="">All Departments</option>
              {(uniqueDepartments.length > 0 ? uniqueDepartments.map(u => u.department) : fallbackDepartments).map(opt => (
                <option key={opt} value={opt}>{opt}</option>
              ))}
            </select>
          </div>

          {/* keep remaining filter controls unchanged */}
          <div className="flex-1">
            <label className="block text-xs font-bold text-blue-700 mb-2 tracking-widest uppercase">Type</label>
            <select
              value={filterUI.type}
              onChange={e => setFilterUI(f => ({ ...f, type: e.target.value }))}
              className="w-full px-4 py-3 rounded-xl border border-blue-200 bg-white shadow focus:ring-2 focus:ring-blue-400 text-base"
            >
              <option value="">All Types</option>
              <option value="Student Enrollment">Student Enrollment</option>
              <option value="Student Examination">Student Examination</option>
            </select>
          </div>
          <div className="flex-1">
            <label className="block text-xs font-bold text-blue-700 mb-2 tracking-widest uppercase">Degree Level</label>
            <select
              value={filterUI.degree_level}
              onChange={e => setFilterUI(f => ({ ...f, degree_level: e.target.value }))}
              className="w-full px-4 py-3 rounded-xl border border-blue-200 bg-white shadow focus:ring-2 focus:ring-blue-400 text-base"
            >
              <option value="">All Degree Levels</option>
              <option value="UG">UG</option>
              <option value="PG">PG</option>
            </select>
          </div>
          <div className="flex-1">
            <label className="block text-xs font-bold text-blue-700 mb-2 tracking-widest uppercase">Academic Year</label>
            <select
              value={filterUI.academic_year}
              onChange={e => setFilterUI(f => ({ ...f, academic_year: e.target.value }))}
              className="w-full px-4 py-3 rounded-xl border border-blue-200 bg-white shadow focus:ring-2 focus:ring-blue-400 text-base"
            >
              <option value="">All Academic Years</option>
              {academicYears.map(year => (
                <option key={year} value={year}>{year}</option>
              ))}
            </select>
          </div>
          <div className="flex flex-col gap-2 md:ml-4">
            <button
              className="w-full px-6 py-3 rounded-xl bg-gradient-to-r from-blue-600 to-indigo-600 text-white font-bold shadow hover:from-blue-700 hover:to-indigo-700 transition"
              onClick={() => setFilters({ ...filterUI })}
            >
              <span className="flex items-center gap-2 justify-center">
                <svg className="w-5 h-5" fill="none" stroke="currentColor" strokeWidth="2" viewBox="0 0 24 24"><path strokeLinecap="round" strokeLinejoin="round" d="M3 4a1 1 0 011-1h16a1 1 0 011 1v2a1 1 0 01-.293.707l-7 7V21a1 1 0 01-2 0v-7.293l-7-7A1 1 0 013 6V4z" /></svg>
                Filter
              </span>
            </button>
            <button
              className="w-full px-6 py-3 rounded-xl bg-gray-100 text-gray-700 font-bold shadow hover:bg-gray-200 transition"
              onClick={() => {
                setFilterUI({ department: "", type: "", degree_level: "", academic_year: "" });
                setFilters({ department: "", type: "", degree_level: "", academic_year: "" });
              }}
            >
              Reset
            </button>
          </div>
        </div>
      </div>

      {/* Header */}
      <div className="flex items-center justify-between mb-8">
        <h2 className="text-3xl font-extrabold text-gray-800 tracking-tight flex items-center gap-3">
          <span className="inline-block w-10 h-10 rounded-xl bg-gradient-to-br from-blue-600 to-indigo-600 flex items-center justify-center text-white text-2xl shadow">S</span>
          Submitted Data
        </h2>
      </div>

      {/* Switch Tabs */}
      <div className="flex gap-4 mb-8 justify-center">
        <button
          className={`px-6 py-3 rounded-2xl font-bold shadow transition-all duration-200 border-2 ${activeYearTab === 'current' ? 'bg-blue-600 text-white border-blue-600 scale-105' : 'bg-white text-blue-600 border-blue-200 hover:bg-blue-50'}`}
          onClick={() => setActiveYearTab('current')}
        >
          Current Academic Year
        </button>
        <button
          className={`px-6 py-3 rounded-2xl font-bold shadow transition-all duration-200 border-2 ${activeYearTab === 'previous' ? 'bg-teal-600 text-white border-teal-600 scale-105' : 'bg-white text-teal-600 border-teal-200 hover:bg-teal-50'}`}
          onClick={() => setActiveYearTab('previous')}
        >
          Previous Academic Years
        </button>
      </div>

      {/* Gender totals summary */}
      <div className="grid grid-cols-1 md:grid-cols-3 gap-6 mb-8">
        <div className="bg-gradient-to-br from-blue-100 to-indigo-100 rounded-2xl shadow-lg p-8 flex flex-col items-center border border-blue-100">
          <div className="text-lg font-bold text-blue-800">Male</div>
          <div className="text-4xl font-extrabold text-blue-700 mt-2 drop-shadow">{genderTotals.male || 0}</div>
        </div>
        <div className="bg-gradient-to-br from-pink-100 to-pink-200 rounded-2xl shadow-lg p-8 flex flex-col items-center border border-pink-100">
          <div className="text-lg font-bold text-pink-800">Female</div>
          <div className="text-4xl font-extrabold text-pink-700 mt-2 drop-shadow">{genderTotals.female || 0}</div>
        </div>
        <div className="bg-gradient-to-br from-purple-100 to-indigo-100 rounded-2xl shadow-lg p-8 flex flex-col items-center border border-indigo-100">
          <div className="text-lg font-bold text-indigo-800">Transgender</div>
          <div className="text-4xl font-extrabold text-indigo-700 mt-2 drop-shadow">{genderTotals.transgender || 0}</div>
        </div>
      </div>

      {/* Data Table */}
      <div className="overflow-x-auto animate-fade-in">
        <table className="min-w-full bg-white border-0 rounded-2xl shadow-xl overflow-hidden">
          <thead className="bg-gradient-to-r from-blue-600 to-indigo-600 text-white">
            <tr>
              <th className="p-4 text-left font-bold tracking-wide">Department</th>
              <th className="p-4 text-left font-bold tracking-wide">Name</th>
              <th className="p-4 text-left font-bold tracking-wide">Year</th>
              <th className="p-4 text-left font-bold tracking-wide">Academic Year</th>
              <th className="p-4 text-left font-bold tracking-wide">Degree Level</th>
              <th className="p-4 text-center font-bold tracking-wide" style={{ minWidth: 180 }}>Type</th>
              <th className="p-4 text-left font-bold tracking-wide">HOD</th>
              <th className="p-4 text-left font-bold tracking-wide">Submitted At</th>
              <th className="p-4 text-left font-bold tracking-wide">Status</th>
              {showAction && <th className="p-4 text-left font-bold tracking-wide">Action</th>}
            </tr>
          </thead>
          <tbody className="divide-y divide-blue-50">
            {(activeYearTab === 'current' ? currentYearData : previousYearsData).map((row) => (
              <tr key={row.id} className="hover:bg-gradient-to-r hover:from-blue-50 hover:to-indigo-50 transition">
                <td className="p-4 align-top font-semibold text-blue-900">{row.department}</td>
                <td className="p-4 align-top">{row.name || '-'}</td>
                <td className="p-4 align-top">{row.year}</td>
                <td className="p-4 align-top">{row.academic_year || "-"}</td>
                <td className="p-4 align-top">{row.degree_level || "-"}</td>
                <td className="p-4 align-top text-center" style={{ minWidth: 180 }}>
                  <span className={`inline-block px-3 py-1 rounded-2xl text-xs font-bold ${row.type && row.type.includes("Examination")
                    ? "bg-gradient-to-r from-purple-500 to-indigo-500 text-white"
                    : (row.type && row.type.includes("Enrollment") ? "bg-blue-100 text-blue-700" : "bg-gray-100 text-gray-600")
                    }`}>
                    {row.type || 'Not Submitted'}
                  </span>
                </td>
                <td className="p-4 align-top">{row.hod || '-'}</td>
                <td className="p-4 align-top">{row.submitted_at ? new Date(row.submitted_at).toLocaleString() : '-'}</td>

                {/* New Status column: show two modern badges for Enrollment and Examination */}
                <td className="p-4 align-top">
                  <div className="flex flex-col gap-2">
                    <div className="flex items-center gap-2">
                      <span className={`inline-flex items-center gap-2 px-3 py-1 rounded-full text-xs font-semibold ${row.enrollmentStatus === 'Completed' ? 'bg-green-100 text-green-700' : 'bg-yellow-100 text-yellow-700'}`}>
                        <span className={`w-2 h-2 rounded-full ${row.enrollmentStatus === 'Completed' ? 'bg-green-600' : 'bg-yellow-600'}`} />
                        Enrollment: {row.enrollmentStatus}
                      </span>
                    </div>
                    <div className="flex items-center gap-2">
                      <span className={`inline-flex items-center gap-2 px-3 py-1 rounded-full text-xs font-semibold ${row.examinationStatus === 'Completed' ? 'bg-green-100 text-green-700' : 'bg-yellow-100 text-yellow-700'}`}>
                        <span className={`w-2 h-2 rounded-full ${row.examinationStatus === 'Completed' ? 'bg-green-600' : 'bg-yellow-600'}`} />
                        Examination: {row.examinationStatus}
                      </span>
                    </div>
                  </div>
                </td>

                {showAction && (
                  <td className="p-4 align-top flex gap-2">
                    {String(row.id).startsWith('default-') ? (
                      <div className="flex gap-2">
                        <button disabled className="px-4 py-2 rounded-2xl font-bold shadow bg-gray-300 text-white">Lock</button>
                        <button disabled className="px-4 py-2 rounded-2xl font-bold shadow bg-gray-300 text-white">Delete</button>
                      </div>
                    ) : (
                      <>
                        <button
                          onClick={() => handleLockToggle(row.id, !row.locked)}
                          className={`px-4 py-2 rounded-2xl font-bold shadow transition-all ${row.locked
                            ? "bg-green-600 hover:bg-green-700 text-white"
                            : "bg-gray-600 hover:bg-gray-700 text-white"
                            }`}
                        >
                          {row.locked ? "Unlock" : "Lock"}
                        </button>
                        <button
                          onClick={() => handleDelete(row.id)}
                          className="px-4 py-2 rounded-2xl font-bold shadow bg-red-600 hover:bg-red-700 text-white"
                        >
                          Delete
                        </button>
                      </>
                    )}
                  </td>
                )}
              </tr>
            ))}
            {(activeYearTab === 'current' ? currentYearData : previousYearsData).length === 0 && (
              <tr>
                <td colSpan={totalColumns} className="px-4 py-12 text-center text-gray-400 bg-gradient-to-r from-blue-50 to-indigo-50">
                  <div className="flex flex-col items-center justify-center">
                    <svg className="w-12 h-12 text-gray-300 mb-2" fill="none" stroke="currentColor" strokeWidth="2" viewBox="0 0 24 24"><path strokeLinecap="round" strokeLinejoin="round" d="M9 17v-6a2 2 0 012-2h2a2 2 0 012 2v6m-6 4h6a2 2 0 002-2V7a2 2 0 00-2-2H7a2 2 0 00-2 2v12a2 2 0 002 2z" /></svg>
                    <p className="text-gray-600 font-medium">
                      {activeYearTab === 'current'
                        ? 'No submitted data rows to display'
                        : 'No submitted data rows to display'}
                    </p>
                  </div>
                </td>
              </tr>
            )}
          </tbody>
        </table>
      </div>

      {/* Toast Message */}
      {globalMessage && (
        <div className={`fixed bottom-4 right-4 px-6 py-3 rounded-2xl shadow-xl font-bold text-lg ${globalMessage.type === "success" ? "bg-green-500 text-white" : "bg-red-500 text-white"}`}>
          {globalMessage.text}
          <button onClick={() => setGlobalMessage(null)} className="ml-3 text-white/80 hover:text-white">×</button>
        </div>
      )}
    </div>
  );
}

export default SubmittedData;