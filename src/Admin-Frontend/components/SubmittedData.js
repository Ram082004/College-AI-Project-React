// ...existing code...
import React, { useEffect, useState } from "react";
import axios from "axios";
import AcademicYearBadge from "./AcademicYearBadge";

const API_BASE = "https://admin-back-j3j4.onrender.com/api";
const API = {
  SUBMITTED_DATA_ALL: `${API_BASE}/submitted-data`,
  SUBMITTED_DATA_LOCK: (id) => `${API_BASE}/submitted-data/${id}/lock`,
  SUBMITTED_DATA_DELETE: (id) => `${API_BASE}/submitted-data/${id}`,
  DEPT_USERS: `${API_BASE}/department-user`,
  ENROLLMENT_SUMMARY: `${API_BASE}/department-user/student-enrollment/summary`,
  EXAMINATION_SUMMARY: `${API_BASE}/department-user/student-examination/summary`,
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
  const [academicYears, setAcademicYears] = useState([]);
  const [adminAcademicYear, setAdminAcademicYear] = useState("");
  const [activeYearTab, setActiveYearTab] = useState('current');

  // Filter UI removed — use adminAcademicYear / selectedPreviousYear as source of truth

  // selected year for "previous" tab
  const [selectedPreviousYear, setSelectedPreviousYear] = useState("");

  // Keep track of previous admin year so a just-switched current year is available under "Previous"
  const [prevAdminYear, setPrevAdminYear] = useState("");
  const prevAdminRef = React.useRef(adminAcademicYear);
  useEffect(() => {
    // when adminAcademicYear changes, remember the previous value (if any and different)
    if (prevAdminRef.current && prevAdminRef.current !== adminAcademicYear) {
      setPrevAdminYear(prevAdminRef.current);
    }
    prevAdminRef.current = adminAcademicYear;
  }, [adminAcademicYear]);
  
  // Compute previous academic years (exclude current/admin year)
  const previousAcademicYears = (() => {
    const list = (academicYears || []).filter(y => {
      const current = (adminAcademicYear || (academicYears && academicYears[0]) || "").toString().trim();
      return y && String(y).trim() !== current;
    });
    // ensure the remembered previous admin year is included (avoid duplicates)
    if (prevAdminYear && !list.some(y => String(y).trim() === String(prevAdminYear).trim()) && String(prevAdminYear).trim() !== String(adminAcademicYear).trim()) {
      return [prevAdminYear, ...list];
    }
    return list;
  })();
  
  // Pagination state (same defaults as other pages)
  const recordsPerPage = 10;
  const [currentPage, setCurrentPage] = useState(1);

  // Fetch all data on mount (default)
  useEffect(() => {
  fetchSubmittedData();
    fetchDepartmentUsers();
    // eslint-disable-next-line
  }, []);

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

  // When the active year tab changes or adminAcademicYear/academicYears changes, adjust filters and re-fetch:
  useEffect(() => {
    if (activeYearTab === 'current') {
      const ay = adminAcademicYear || (academicYears[0] || '');
      setSelectedPreviousYear('');
    } else {
      // previous: clear explicit academic_year filter in global filters
      // default selected previous year -> first available non-latest year (if any)
      const prevYears = academicYears.filter(y => y !== (adminAcademicYear || academicYears[0]));
      setSelectedPreviousYear(prevYears[0] || '');
    }
    // eslint-disable-next-line
  }, [activeYearTab, adminAcademicYear, academicYears]);

  // If adminAcademicYear changes (e.g. update from Admin page), ensure current tab shows new year immediately
  useEffect(() => {
    if (activeYearTab === 'current') {
      const ay = adminAcademicYear || (academicYears[0] || '');
      setAdminAcademicYear(ay);
    }
    // eslint-disable-next-line
  }, [adminAcademicYear]);

  // Fetch department users (only departments that have users)
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

  // Fetch all submitted data with filters
  const fetchSubmittedData = async () => {
    setLoading(true);
    try {
      // Only use academic year from adminAcademicYear or selectedPreviousYear
      const params = {
  academic_year: activeYearTab === 'current' ? (adminAcademicYear || (academicYears[0] || '')) : (selectedPreviousYear || ''),
      };
      const res = await axios.get(API.SUBMITTED_DATA_ALL, { params });
      setSubmittedData(res.data.data || []);
    } catch (error) {
      setGlobalMessage("Failed to fetch submitted data");
    } finally {
      setLoading(false);
    }
  };

  // Lock/Unlock handler
  const handleLockToggle = async (id, locked) => {
    try {
      const res = await axios.patch(API.SUBMITTED_DATA_LOCK(id), { locked }, {
        headers: { Authorization: `Bearer ${localStorage.getItem("authToken")}` },
      });
      if (res.data.success) {
        setGlobalMessage({ type: "success", text: `Submission ${locked ? "locked" : "unlocked"} successfully` });
        fetchSubmittedData();
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
      } else {
        setGlobalMessage({ type: "error", text: res.data.message || "Failed to delete submission" });
      }
    } catch (err) {
      setGlobalMessage({ type: "error", text: "Failed to delete submission" });
    }
  };

  // Build departments to show from departmentUsers (only departments that have users)
  const uniqueDepartments = (() => {
  // No filter UI: show all departments that have users; fallback to hardcoded list
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

  // Build rows for every department. For activeYearTab === 'current' we pick current academic year.
  // For 'previous' we use selectedPreviousYear; if none provided we still show a default
  // row per department (status=Incompleted) and set academic_year to '' so rows indicate not submitted for that previous selection.
  const rowsForDepartments = uniqueDepartments.map((deptUser) => {
    const deptName = deptUser.department;
    const deptIdFromUser = deptUser.dept_id ?? null;
    const deptDegreeLevelFromUser = deptUser.degree_level || null;

    // Academic year to use for this row
    const academicYearSelected = (activeYearTab === 'current')
      ? (adminAcademicYear || (academicYears[0] || ''))
      : (selectedPreviousYear || '');

    // Find all submissions for this department and academic year
    const deptMatches = submittedData.filter(r =>
      (r.department || '').trim() === (deptName || '').trim() &&
      String(r.academic_year || '') === String(academicYearSelected)
    );

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

    // No submission found for this department and year -> show default row
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
  });

  // Auto-hide global message after 3 seconds
  useEffect(() => {
    if (globalMessage) {
      const timer = setTimeout(() => setGlobalMessage(null), 3000);
      return () => clearTimeout(timer);
    }
  }, [globalMessage]);

  // Use the generated rowsForDepartments as the table data so every department is shown
  // Reset page when switching tabs
  useEffect(() => { setCurrentPage(1); }, [activeYearTab]);

  const activeRows = rowsForDepartments;
  const paginatedFor = (rows) => {
    const total = Math.ceil(rows.length / recordsPerPage);
    const start = (currentPage - 1) * recordsPerPage;
    return { rows: rows.slice(start, start + recordsPerPage), total };
  };
  const { rows: visibleRows } = paginatedFor(activeRows);

  // Pagination UI (simple)
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

  // UI helpers
  const showAction = activeYearTab !== 'previous';
  const totalColumns = showAction ? 9 : 8; // adjusted after removing "Year" column

  const [genderTotals, setGenderTotals] = useState({ male: 0, female: 0, transgender: 0 });
  const [genderTotalsLoading, setGenderTotalsLoading] = useState(false);

  useEffect(() => {
    async function fetchGenderTotals() {
      setGenderTotalsLoading(true);
      // determine the academic year we are showing
      const academicYearForRequest = activeYearTab === 'current'
        ? (adminAcademicYear || (academicYears[0] || ''))
        : (selectedPreviousYear || '');

      const params = { academic_year: academicYearForRequest };

      try {
        // fetch both summaries in parallel
        const [enRes, exRes] = await Promise.all([
          axios.get(API.ENROLLMENT_SUMMARY, { params, headers: { Authorization: `Bearer ${localStorage.getItem("authToken")}` } }),
          axios.get(API.EXAMINATION_SUMMARY, { params, headers: { Authorization: `Bearer ${localStorage.getItem("authToken")}` } }),
        ]);

        const safeSummary = (r) => Array.isArray(r.data?.summary) ? r.data.summary : [];

        // optionally filter rows again by academic_year if backend returns mixed-year rows
        const filterByYear = (rows) => {
          if (!academicYearForRequest) return rows; // empty => show all previous/year-agnostic
          return rows.filter(row => String(row.academic_year || '').trim() === String(academicYearForRequest).trim());
        };

        const sumRows = (rows = []) => rows.reduce((acc, item) => {
          acc.male += Number(item.male_count || 0);
          acc.female += Number(item.female_count || 0);
          acc.transgender += Number(item.transgender_count || 0);
          return acc;
        }, { male: 0, female: 0, transgender: 0 });

        // compute totals only from rows that match the selected academic year
        const enrollmentRows = filterByYear(safeSummary(enRes));
        const examinationRows = filterByYear(safeSummary(exRes));

        const eTotals = sumRows(enrollmentRows);
        const xTotals = sumRows(examinationRows);

        // Primary source: Enrollment summary (authoritative)
        // Fallback: if enrollment totals are all zero but examination has values, use exam totals.
        const useEnrollment = (eTotals.male + eTotals.female + eTotals.transgender) > 0;

        const finalTotals = useEnrollment ? eTotals : xTotals;

        setGenderTotals({
          male: finalTotals.male,
          female: finalTotals.female,
          transgender: finalTotals.transgender,
        });
      } catch (err) {
        setGenderTotals({ male: 0, female: 0, transgender: 0 });
      } finally {
        setGenderTotalsLoading(false);
      }
    }

    fetchGenderTotals();
    // eslint-disable-next-line
  }, [activeYearTab, selectedPreviousYear, adminAcademicYear, academicYears]);

  return (
    <div className="p-0 md:p-6 bg-gradient-to-br from-blue-50 to-indigo-50 min-h-screen">
      <div className="flex justify-end mb-4">
        <AcademicYearBadge year={adminAcademicYear} />
      </div>

      {/* Gender Totals Section */}
      <div className="text-center mb-8">
             <h1 className="text-3xl font-extrabold mb-8 text-gradient bg-gradient-to-r from-teal-600 via-blue-500 to-purple-600 bg-clip-text text-transparent">Department Submission</h1>
      </div>
      <div className="flex gap-6 mb-8 justify-center">
        <div className="rounded-2xl shadow-xl p-10 border border-blue-200 bg-blue-100 w-full max-w-xs flex flex-col items-center">
          <h3 className="text-2xl font-bold text-blue-700 mb-4">Male</h3>
          <div className="text-4xl font-extrabold text-blue-700 drop-shadow">
            {genderTotalsLoading ? <span className="animate-spin w-6 h-6 border-4 border-blue-300 border-t-blue-700 rounded-full inline-block" /> : genderTotals.male}
          </div>
        </div>
        <div className="rounded-2xl shadow-xl p-10 border border-pink-200 bg-pink-100 w-full max-w-xs flex flex-col items-center">
          <h3 className="text-2xl font-bold text-pink-700 mb-4">Female</h3>
          <div className="text-4xl font-extrabold text-pink-700 drop-shadow">
            {genderTotalsLoading ? <span className="animate-spin w-6 h-6 border-4 border-pink-300 border-t-pink-700 rounded-full inline-block" /> : genderTotals.female}
          </div>
        </div>
        <div className="rounded-2xl shadow-xl p-10 border border-purple-200 bg-purple-100 w-full max-w-xs flex flex-col items-center">
          <h3 className="text-2xl font-bold text-purple-700 mb-4">Transgender</h3>
          <div className="text-4xl font-extrabold text-purple-700 drop-shadow">
            {genderTotalsLoading ? <span className="animate-spin w-6 h-6 border-4 border-purple-300 border-t-purple-700 rounded-full inline-block" /> : genderTotals.transgender}
          </div>
        </div>
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
      
      {/* If previous tab, show a selector for the previous year */}
      {activeYearTab === 'previous' && (
        <div className="max-w-4xl mx-auto mb-6">
          <label className="block text-sm font-semibold mb-2">Select Academic Year</label>
          <select value={selectedPreviousYear} onChange={e => setSelectedPreviousYear(e.target.value)} className="w-full p-3 rounded-xl border border-blue-200">
            <option value="">-- Select Previous Year (or leave blank to show all previous) --</option>
            {previousAcademicYears.map(y => <option key={y} value={y}>{y}</option>)}
          </select>
        </div>
      )}

      {/* Data Table */}
      {activeYearTab === 'previous' && previousAcademicYears.length === 0 ? (
        <div className="text-center text-gray-400 py-12 text-lg font-semibold">
          No previous academic year data to display.
        </div>
      ) : (
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
                {showAction && <th className="p-4 text-left font-bold tracking-wide">Action</th>}
              </tr>
            </thead>
            <tbody className="divide-y divide-blue-50">
              {visibleRows.map((row) => (
                <tr key={row.id} className="hover:bg-gradient-to-r hover:from-blue-50 hover:to-indigo-50 transition">
                  <td className="p-4 align-top font-semibold text-blue-900">{row.department}</td>
                  <td className="p-4 align-top">{row.name || '-'}</td>
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

                  {/* Status column */}
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
              {visibleRows.length === 0 && (
                <tr>
                  <td colSpan={totalColumns} className="px-4 py-12 text-center text-gray-400 bg-gradient-to-r from-blue-50 to-indigo-50">
                    <div className="flex flex-col items-center justify-center">
                      <svg className="w-12 h-12 text-gray-300 mb-2" fill="none" stroke="currentColor" strokeWidth="2" viewBox="0 0 24 24"><path strokeLinecap="round" strokeLinejoin="round" d="M9 17v-6a2 2 0 012-2h2a2 2 0 012 2v6m-6 4h6a2 2 0 002-2V7a2 2 0 00-2-2H7a2 2 0 00-2 2v12a2 2 0 002 2z" /></svg>
                      <p className="text-gray-600 font-medium">
                        No submitted data rows to display
                      </p>
                    </div>
                  </td>
                </tr>
              )}
            </tbody>
          </table>
          {renderPagination()}
        </div>
      )}

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