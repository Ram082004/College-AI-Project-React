import React, { useEffect, useState } from "react";
import axios from "axios";
import AcademicYearBadge from "../../Admin-Frontend/components/AcademicYearBadge";

const API_BASE = "https://admin-back-j3j4.onrender.com/api";
const API = {
  SUBMITTED_DATA_ALL: `${API_BASE}/submitted-data`,
  ENROLLMENT_SUMMARY: `${API_BASE}/department-user/student-enrollment/summary`,
  EXAMINATION_SUMMARY: `${API_BASE}/department-user/student-examination/summary`,
  DISTINCT_YEARS: `${API_BASE}/submitted-data/distinct/years`,
  DEPT_USERS: `${API_BASE}/department-user`
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

function PrincipleSubmission() {
  const [submittedData, setSubmittedData] = useState([]);
  const [departmentUsers, setDepartmentUsers] = useState([]);
  const [loading, setLoading] = useState(false);
  const [globalMessage, setGlobalMessage] = useState(null);
  const [filters, setFilters] = useState({ department: "", type: "", degree_level: "", academic_year: "" });
  const [currentPage, setCurrentPage] = useState(1);
  const [latestAcademicYear, setLatestAcademicYear] = useState("");
  const [academicYears, setAcademicYears] = useState([]);
  // NEW: track admin's academic year / active tab / previous selection
  const [adminAcademicYear, setAdminAcademicYear] = useState("");
  const [activeYearTab, setActiveYearTab] = useState("current");
  const [selectedPreviousYear, setSelectedPreviousYear] = useState("");
  const [genderTotals, setGenderTotals] = useState({ male: 0, female: 0, transgender: 0 });

  // Add the missing recordsPerPage constant
  const recordsPerPage = 10;

  // Add state to track previous admin year (like SubmittedData.js)
  const [prevAdminYear, setPrevAdminYear] = useState("");
  const prevAdminRef = React.useRef(adminAcademicYear);
  
  // Track when admin academic year changes to include it in previous years
  useEffect(() => {
    if (prevAdminRef.current && prevAdminRef.current !== adminAcademicYear) {
      setPrevAdminYear(prevAdminRef.current);
    }
    prevAdminRef.current = adminAcademicYear;
  }, [adminAcademicYear]);

  // Compute previous academic years (exclude current/admin year) - same logic as SubmittedData.js
  const previousAcademicYears = (() => {
    const current = (adminAcademicYear || (academicYears && academicYears[0]) || "").toString().trim();
    const list = (academicYears || []).filter(y => {
      return y && String(y).trim() !== current;
    });
    // Ensure the remembered previous admin year is included (avoid duplicates)
    if (prevAdminYear && !list.some(y => String(y).trim() === String(prevAdminYear).trim()) && String(prevAdminYear).trim() !== current) {
      return [prevAdminYear, ...list];
    }
    return list;
  })();

  // Fetch department users (only departments that have users) - called on mount
  const fetchDepartmentUsers = async () => {
    try {
      const res = await axios.get(API.DEPT_USERS, {
        headers: { Authorization: `Bearer ${localStorage.getItem("authToken")}` }
      });
      setDepartmentUsers(Array.isArray(res.data?.users) ? res.data.users : (res.data || []));
    } catch (err) {
      setDepartmentUsers(fallbackDepartments.map((d) => ({ dept_id: null, department: d, name: "-", degree_level: null, hod: "-" })));
    }
  };

  // Fetch all data on mount (default)
  useEffect(() => {
    fetchSubmittedData();
    fetchDepartmentUsers();
    // eslint-disable-next-line
  }, []);

  // Modified fetchSubmittedData to handle year filtering properly
  const fetchSubmittedData = async (customFilters = filters) => {
    setLoading(true);
    try {
      const params = {};
      
      // Handle academic year filtering based on active tab
      if (activeYearTab === 'current') {
        params.academic_year = adminAcademicYear || (academicYears[0] || '');
      } else if (activeYearTab === 'previous') {
        // For previous tab, use selectedPreviousYear if set, otherwise fetch all and filter client-side
        if (selectedPreviousYear) {
          params.academic_year = selectedPreviousYear;
        }
        // If no specific previous year selected, we'll filter client-side after fetching
      }
      
      if (customFilters.department) params.department = customFilters.department;
      if (customFilters.type) params.type = customFilters.type;
      if (customFilters.degree_level) params.degree_level = customFilters.degree_level;
      
      const res = await axios.get(API.SUBMITTED_DATA_ALL, {
        params,
        headers: { Authorization: `Bearer ${localStorage.getItem("authToken")}` },
      });
      
      let fetchedData = res.data.data || [];
      
      // Client-side filtering for previous years when no specific year selected
      if (activeYearTab === 'previous' && !selectedPreviousYear) {
        const currentYear = (adminAcademicYear || (academicYears[0] || '')).toString().trim();
        fetchedData = fetchedData.filter(item => {
          const itemYear = String(item.academic_year || '').trim();
          return itemYear && itemYear !== currentYear;
        });
      }
      
      setSubmittedData(fetchedData);
      setCurrentPage(1);
    } catch (err) {
      setGlobalMessage({ type: "error", text: "Failed to fetch submitted data" });
    } finally {
      setLoading(false);
    }
  };

  // Fetch distinct academic years
  useEffect(() => {
    async function fetchAcademicYears() {
      try {
        const res = await axios.get(API.DISTINCT_YEARS, { headers: { Authorization: `Bearer ${localStorage.getItem("authToken")}` } });
        setAcademicYears(res.data.years || []);
      } catch {
        setAcademicYears([]);
      }
    }
    fetchAcademicYears();
  }, []);

  // admin latest academic year
  useEffect(() => {
    async function fetchAdminYear() {
      try {
        const res = await axios.get("https://admin-back-j3j4.onrender.com/api/admin/all", {
          headers: { Authorization: `Bearer ${localStorage.getItem("authToken")}` }
        });
        if (res.data?.admins?.length) setLatestAcademicYear(res.data.admins[0].academic_year || "");
      } catch {
        setLatestAcademicYear("");
      }
    }
    fetchAdminYear();
  }, []);

  // Keep adminAcademicYear (for principle header/tab) in sync with admin fetch and localStorage
  useEffect(() => {
    async function fetchAdminYearOnce() {
      try {
        const res = await axios.get("https://admin-back-j3j4.onrender.com/api/admin/all", {
          headers: { Authorization: `Bearer ${localStorage.getItem("authToken")}` }
        });
        if (res.data?.admins?.length) setAdminAcademicYear(res.data.admins[0].academic_year || "");
      } catch {
        setAdminAcademicYear("");
      }
    }
    fetchAdminYearOnce();
  }, []);

  // Keep adminAcademicYear in sync with localStorage (Admin page may update it)
  useEffect(() => {
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

  // When the active year tab changes, adjust filters properly
  useEffect(() => {
    if (activeYearTab === 'current') {
      const ay = adminAcademicYear || (academicYears[0] || '');
      setSelectedPreviousYear('');
    } else {
      // previous: default selected previous year -> first available non-latest year
      const prevYears = previousAcademicYears;
      setSelectedPreviousYear(prevYears[0] || '');
    }
    // eslint-disable-next-line
  }, [activeYearTab, adminAcademicYear, academicYears]);

  // Re-fetch when activeYearTab or selectedPreviousYear changes
  useEffect(() => {
    fetchSubmittedData();
    // eslint-disable-next-line
  }, [activeYearTab, selectedPreviousYear, adminAcademicYear]);

  // Fetch gender totals when adminAcademicYear or filters change
  useEffect(() => {
    fetchGenderTotals({});
    // eslint-disable-next-line
  }, [adminAcademicYear, filters.department, filters.degree_level]);

  // Helper: compute the academic year to use for totals based on active tab
  const getDisplayAcademicYearForTotals = (overrideYear) => {
    if (overrideYear) return overrideYear;
    if (activeYearTab === 'previous') {
      return selectedPreviousYear || '';
    }
    return adminAcademicYear || (academicYears[0] || "");
  };

  // fetch combined gender totals similar to SubmittedData.js
  const fetchGenderTotals = async (opts = {}) => {
    const academic_year = getDisplayAcademicYearForTotals(opts.academic_year);
    if (!academic_year) {
      setGenderTotals({ male: 0, female: 0, transgender: 0 });
      return;
    }
    const degree_level = opts.degree_level || filters.degree_level || "";
    const department = opts.department || filters.department || "";
    try {
      const params = { degree_level, department, academic_year };
      const [enRes, exRes] = await Promise.all([
        axios.get(API.ENROLLMENT_SUMMARY, { params, headers: { Authorization: `Bearer ${localStorage.getItem("authToken")}` } }),
        axios.get(API.EXAMINATION_SUMMARY, { params, headers: { Authorization: `Bearer ${localStorage.getItem("authToken")}` } })
      ]);
      const safeRows = (r) => {
        if (!r || typeof r !== 'object') return [];
        return Array.isArray(r.data?.summary) ? r.data.summary : (Array.isArray(r.data?.data) ? r.data.data : []);
      };
      const filterByYear = (rows) => rows.filter(row => String(row.academic_year) === String(academic_year));
      const eRows = filterByYear(safeRows(enRes));
      const xRows = filterByYear(safeRows(exRes));
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
    } catch {
      setGenderTotals({ male: 0, female: 0, transgender: 0 });
    }
  };

  // Build departments to show from departmentUsers (only departments that have users)
  const uniqueDepartments = (() => {
    const deptSet = new Map();
    (departmentUsers || []).forEach(u => {
      if (!u || !u.department) return;
      const key = String(u.department).trim();
      if (!deptSet.has(key)) deptSet.set(key, u);
    });
    if (deptSet.size === 0) {
      fallbackDepartments.forEach((d) => { if (!deptSet.has(d)) deptSet.set(d, { dept_id: null, department: d, name: "-", degree_level: null, hod: "-" }); });
    }
    return Array.from(deptSet.values());
  })();

  const defaultYearForDegree = (deg) => {
    if (deg === 'PG') return 'I Year, II Year';
    return 'I Year, II Year, III Year';
  };

  // Build rows for every department similar to SubmittedData.js logic
  const rowsForDepartments = uniqueDepartments.map((deptUser) => {
    const deptName = deptUser.department;
    const deptIdFromUser = deptUser.dept_id ?? null;
    const deptDegreeLevelFromUser = deptUser.degree_level || null;

    // Academic year to use for this row based on active tab
    let academicYearSelected;
    if (activeYearTab === 'current') {
      academicYearSelected = adminAcademicYear || (academicYears[0] || '');
    } else {
      // For previous tab
      academicYearSelected = selectedPreviousYear || '';
    }

    // Find submissions for this department and the selected academic year
    const deptMatches = submittedData.filter(r => {
      const deptMatch = (r.department || '').trim() === (deptName || '').trim();
      
      if (activeYearTab === 'current') {
        return deptMatch && String(r.academic_year || '') === String(academicYearSelected);
      } else {
        // For previous tab
        if (selectedPreviousYear) {
          return deptMatch && String(r.academic_year || '') === String(selectedPreviousYear);
        } else {
          // Show any previous year data (already filtered in fetchSubmittedData)
          return deptMatch;
        }
      }
    });

    const latestOfType = (arr, type) => {
      const items = arr.filter(x => x.type === type);
      if (items.length === 0) return null;
      items.sort((a, b) => new Date(b.submitted_at || 0) - new Date(a.submitted_at || 0));
      return items[0];
    };

    if (deptMatches.length > 0) {
      // If there is a submission for this department and year, show the latest
      const latest = deptMatches.sort((a, b) => new Date(b.submitted_at || 0) - new Date(a.submitted_at || 0))[0];
      const latestEnrollment = latestOfType(deptMatches, 'Student Enrollment');
      const latestExam = latestOfType(deptMatches, 'Student Examination');
      const enrollmentStatus = latestEnrollment ? (latestEnrollment.status || 'Completed') : 'Incompleted';
      const examinationStatus = latestExam ? (latestExam.status || 'Completed') : 'Incompleted';
      const typesArr = Array.from(new Set(deptMatches.map(r => r.type))).filter(Boolean);
      const combinedType = typesArr.length > 0 ? typesArr.join(' / ') : 'Not Submitted';

      return {
        id: latest.id,
        dept_id: latest.dept_id ?? deptIdFromUser,
        department: deptName,
        name: latest.name || deptUser.name || '-',
        year: latest.year || defaultYearForDegree(latest.degree_level || deptDegreeLevelFromUser || 'UG'),
        academic_year: latest.academic_year || academicYearSelected || '',
        degree_level: latest.degree_level || deptDegreeLevelFromUser || 'UG',
        type: combinedType,
        hod: latest.hod || deptUser.hod || '-',
        submitted_at: latest.submitted_at || null,
        locked: latest.locked ? !!latest.locked : false,
        status: latest.status || 'Completed',
        enrollmentStatus,
        examinationStatus
      };
    }

    // No submission found - only show default row for current tab or when specific previous year selected
    if (activeYearTab === 'current' || (activeYearTab === 'previous' && selectedPreviousYear)) {
      const deg = deptDegreeLevelFromUser || 'UG';
      return {
        id: `default-${deptName}`,
        dept_id: deptIdFromUser,
        department: deptName,
        name: deptUser.name || '-',
        year: defaultYearForDegree(deg),
        academic_year: academicYearSelected,
        degree_level: deg,
        type: 'Not Submitted',
        hod: deptUser.hod || '-',
        submitted_at: null,
        locked: false,
        status: 'Incompleted',
        enrollmentStatus: 'Incompleted',
        examinationStatus: 'Incompleted'
      };
    }

    // For previous tab with no specific year selected, don't show default rows
    return null;
  }).filter(Boolean); // Remove null entries

  // Reset page when switching tabs
  useEffect(() => { setCurrentPage(1); }, [activeYearTab]);

  const activeRows = rowsForDepartments;
  const paginatedFor = (rows) => {
    const total = Math.ceil(rows.length / recordsPerPage);
    const start = (currentPage - 1) * recordsPerPage;
    return { rows: rows.slice(start, start + recordsPerPage), total };
  };

  const { rows: visibleRows } = paginatedFor(activeRows);

  const totalPages = Math.max(1, Math.ceil(activeRows.length / recordsPerPage));
  function renderPagination() {
    if (totalPages <= 1) return null;
    return (
      <div className="flex justify-center items-center gap-2 mt-6">
        <button className="px-3 py-1 rounded bg-blue-100 text-blue-700 font-semibold disabled:opacity-50" onClick={() => setCurrentPage(p => Math.max(1, p - 1))} disabled={currentPage === 1}>Prev</button>
        {Array.from({ length: totalPages }, (_, i) => (
          <button key={i+1} onClick={() => setCurrentPage(i+1)} className={`px-3 py-1 rounded font-semibold ${currentPage === i+1 ? "bg-blue-600 text-white" : "bg-blue-50 text-blue-700"}`}>{i+1}</button>
        ))}
        <button className="px-3 py-1 rounded bg-blue-100 text-blue-700 font-semibold disabled:opacity-50" onClick={() => setCurrentPage(p => Math.min(totalPages, p + 1))} disabled={currentPage === totalPages}>Next</button>
      </div>
    );
  }

  return (
    <div className="p-0 md:p-6 bg-gradient-to-br from-blue-50 to-indigo-50 min-h-screen">
      <div className="flex justify-end mb-6">
        <AcademicYearBadge year={getDisplayAcademicYearForTotals()} />
      </div>

      <div className="flex items-center justify-between mb-8">
        <h2 className="text-3xl font-extrabold text-gray-800 tracking-tight flex items-center gap-3">
          <span className="inline-block w-10 h-10 rounded-xl bg-gradient-to-br from-blue-600 to-indigo-600 flex items-center justify-center text-white text-2xl shadow">S</span>
          Submitted Data
        </h2>
      </div>

      {/* Tabs */}
      <div className="flex gap-4 mb-6 justify-center">
        <button 
          className={`px-6 py-3 rounded-2xl font-bold shadow transition-all duration-200 border-2 ${
            activeYearTab === 'current' 
              ? 'bg-blue-600 text-white border-blue-600 scale-105' 
              : 'bg-white text-blue-600 border-blue-200 hover:bg-blue-50'
          }`} 
          onClick={() => setActiveYearTab('current')}
        >
          Current Academic Year
        </button>
        <button 
          className={`px-6 py-3 rounded-2xl font-bold shadow transition-all duration-200 border-2 ${
            activeYearTab === 'previous' 
              ? 'bg-teal-600 text-white border-teal-600 scale-105' 
              : 'bg-white text-teal-600 border-teal-200 hover:bg-teal-50'
          }`} 
          onClick={() => setActiveYearTab('previous')}
        >
          Previous Academic Years
        </button>
      </div>

      {/* Previous year selector */}
      {activeYearTab === 'previous' && (
        <div className="max-w-4xl mx-auto mb-6">
          <label className="block text-sm font-semibold mb-2">Select Academic Year</label>
          <select 
            value={selectedPreviousYear} 
            onChange={e => setSelectedPreviousYear(e.target.value)} 
            className="w-full p-3 rounded-xl border border-blue-200"
          >
            <option value="">-- Select Previous Year (or leave blank to show all previous) --</option>
            {previousAcademicYears.map(y => <option key={y} value={y}>{y}</option>)}
          </select>
        </div>
      )}

      {/* Show message when no previous years available */}
      {activeYearTab === 'previous' && previousAcademicYears.length === 0 ? (
        <div className="text-center text-gray-400 py-12 text-lg font-semibold">
          No previous academic year data to display.
        </div>
      ) : (
        <>
          {/* Gender totals */}
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

          {/* Table */}
          <div className="overflow-x-auto animate-fade-in">
            <table className="min-w-full bg-white border-0 rounded-2xl shadow-xl overflow-hidden">
              <thead className="bg-gradient-to-r from-blue-600 to-indigo-600 text-white">
                <tr>
                  <th className="p-4 text-left font-bold tracking-wide">Department</th>
                  <th className="p-4 text-left font-bold tracking-wide">Name</th>
                  <th className="p-4 text-left font-bold tracking-wide">Academic Year</th>
                  <th className="p-4 text-left font-bold tracking-wide">Degree Level</th>
                  <th className="p-4 text-center font-bold tracking-wide" style={{ minWidth: 180 }}>Type</th>
                  <th className="p-4 text-left font-bold tracking-wide">HOD</th>
                  <th className="p-4 text-left font-bold tracking-wide">Submitted At</th>
                  <th className="p-4 text-left font-bold tracking-wide">Status</th>
                </tr>
              </thead>
              <tbody className="divide-y divide-blue-50" style={{ minHeight: "400px" }}>
                {visibleRows.map(row => (
                  <tr key={row.id} className="hover:bg-gradient-to-r hover:from-blue-50 hover:to-indigo-50 transition" style={{ minHeight: "60px" }}>
                    <td className="p-4 align-top font-semibold text-blue-900" style={{ minWidth: "150px" }}>{row.department}</td>
                    <td className="p-4 align-top" style={{ minWidth: "120px" }}>{row.name}</td>
                    <td className="p-4 align-top" style={{ minWidth: "130px" }}>{row.academic_year || "-"}</td>
                    <td className="p-4 align-top" style={{ minWidth: "120px" }}>{row.degree_level || "-"}</td>
                    <td className="p-4 align-top text-center" style={{ minWidth: 180 }}>
                      <span className={`inline-block px-3 py-1 rounded-2xl text-xs font-bold ${row.type && row.type.includes("Examination")
                        ? "bg-gradient-to-r from-purple-500 to-indigo-500 text-white"
                        : (row.type && row.type.includes("Enrollment") ? "bg-blue-100 text-blue-700" : "bg-gray-100 text-gray-600")
                        }`}>
                        {row.type || 'Not Submitted'}
                      </span>
                    </td>
                    <td className="p-4 align-top" style={{ minWidth: "120px" }}>{row.hod}</td>
                    <td className="p-4 align-top" style={{ minWidth: "140px" }}>{row.submitted_at ? new Date(row.submitted_at).toLocaleString() : "-"}</td>
                    
                    {/* Status column with proper sizing */}
                    <td className="p-4 align-top" style={{ minWidth: "200px" }}>
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
                  </tr>
                ))}
                {visibleRows.length === 0 && (
                  <tr style={{ minHeight: "300px" }}>
                    <td colSpan={8} className="px-4 py-12 text-center text-gray-400 bg-gradient-to-r from-blue-50 to-indigo-50">
                      <div className="flex flex-col items-center justify-center">
                        <svg className="w-12 h-12 text-gray-300 mb-2" fill="none" stroke="currentColor" strokeWidth="2" viewBox="0 0 24 24"><path strokeLinecap="round" strokeLinejoin="round" d="M9 17v-6a2 2 0 012-2h2a2 2 0 012 2v6m-6 4h6a2 2 0 002-2V7a2 2 0 00-2-2H7a2 2 0 00-2 2v12a2 2 0 002 2z" /></svg>
                        <p className="text-gray-600 font-medium">No submitted data found</p>
                      </div>
                    </td>
                  </tr>
                )}
              </tbody>
            </table>
            {renderPagination()}
          </div>
        </>
      )}

      {globalMessage && (
        <div className={`fixed bottom-4 right-4 px-6 py-3 rounded-2xl shadow-xl font-bold text-lg ${globalMessage.type === "success" ? "bg-green-500 text-white" : "bg-red-500 text-white"}`}>
          {globalMessage.text}
          <button onClick={() => setGlobalMessage(null)} className="ml-3 text-white/80 hover:text-white">×</button>
        </div>
      )}
    </div>
  );
}

export default PrincipleSubmission;
