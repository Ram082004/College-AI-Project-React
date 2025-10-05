import React, { useEffect, useState, useRef } from "react";
import axios from "axios";
import AcademicYearBadge from "../../Admin-Frontend/components/AcademicYearBadge";

const API_BASE = "https://admin-back-j3j4.onrender.com/api";
const API = {
  OFFICE_SUBMISSION: `${API_BASE}/principle/office-submission`,
  DISTINCT_YEARS: `${API_BASE}/submitted-data/distinct/years`,
  ADMIN_ALL: `${API_BASE}/admin/all`,
  // NEW: Add endpoint to check department enrollment data
  OFFICE_DEPT_GET: `${API_BASE}/office/officedept/get`
};

// Include Department Enrollment like in Admin officesubmission.js
const OFFICE_TYPES = ["Teaching Staff", "Non-Teaching Staff", "Department Enrollment"];

const OfficeSubmission = () => {
  const [officeSubmissions, setOfficeSubmissions] = useState([]);
  const [academicYears, setAcademicYears] = useState([]);
  const [adminAcademicYear, setAdminAcademicYear] = useState("");
  const [loading, setLoading] = useState(false);
  const [activeYearTab, setActiveYearTab] = useState("current"); // "current" | "previous"
  const [selectedPreviousYear, setSelectedPreviousYear] = useState("");

  // NEW: Add state to track department enrollment data existence
  const [deptEnrollmentExists, setDeptEnrollmentExists] = useState(false);

  // Remember previous admin year so recent change appears under "Previous"
  const [prevAdminYear, setPrevAdminYear] = useState("");
  const prevAdminRef = useRef(adminAcademicYear);
  useEffect(() => {
    if (prevAdminRef.current && prevAdminRef.current !== adminAcademicYear) {
      setPrevAdminYear(prevAdminRef.current);
    }
    prevAdminRef.current = adminAcademicYear;
  }, [adminAcademicYear]);

  // fetch submissions
  const fetchSubmissions = async () => {
    setLoading(true);
    try {
      const res = await axios.get(API.OFFICE_SUBMISSION, {
        headers: { Authorization: `Bearer ${localStorage.getItem("authToken")}` },
      });
      setOfficeSubmissions(res.data.data || []);
    } catch {
      setOfficeSubmissions([]);
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    fetchSubmissions();
    // eslint-disable-next-line
  }, []);

  // re-fetch when tab/year changes so UI updates immediately
  useEffect(() => {
    fetchSubmissions();
    // eslint-disable-next-line
  }, [activeYearTab, selectedPreviousYear, adminAcademicYear, academicYears]);

  // fetch academic years list
  useEffect(() => {
    async function fetchAcademicYears() {
      try {
        const res = await axios.get(API.DISTINCT_YEARS, { headers: { Authorization: `Bearer ${localStorage.getItem("authToken")}` }});
        setAcademicYears(res.data.years || []);
      } catch {
        setAcademicYears([]);
      }
    }
    fetchAcademicYears();
  }, []);

  // fetch admin's current academic year
  useEffect(() => {
    async function fetchAdminYear() {
      try {
        const res = await axios.get(API.ADMIN_ALL, { headers: { Authorization: `Bearer ${localStorage.getItem("authToken")}` }});
        if (res.data?.admins?.length) setAdminAcademicYear(res.data.admins[0].academic_year || "");
      } catch {
        setAdminAcademicYear("");
      }
    }
    fetchAdminYear();
  }, []);

  // when switching to previous tab pick a sensible default previous year
  useEffect(() => {
    if (activeYearTab === "previous") {
      const prevYears = (academicYears || []).filter(y => y !== (adminAcademicYear || academicYears[0]));
      setSelectedPreviousYear(prevYears[0] || "");
    } else {
      setSelectedPreviousYear("");
    }
  }, [activeYearTab, adminAcademicYear, academicYears]);

  // helper previous years list (include prevAdminYear similar to SubmittedData)
  const currentAcademic = (adminAcademicYear || (academicYears && academicYears[0]) || "").toString().trim();
  const previousAcademicYears = (() => {
    const list = (academicYears || []).filter(y => String(y).trim() && String(y).trim() !== currentAcademic);
    if (prevAdminYear && !list.some(y => String(y).trim() === String(prevAdminYear).trim()) && String(prevAdminYear).trim() !== currentAcademic) {
      return [prevAdminYear, ...list];
    }
    return list;
  })();

  const academicYearSelected = activeYearTab === "current" ? (adminAcademicYear || (academicYears[0] || "")) : (selectedPreviousYear || "");

  // NEW: Check if department enrollment data exists for the selected academic year
  useEffect(() => {
    let mounted = true;
    async function checkDeptRows() {
      if (!academicYearSelected) {
        if (mounted) setDeptEnrollmentExists(false);
        return;
      }
      try {
        const res = await axios.get(API.OFFICE_DEPT_GET, {
          params: { academic_year: academicYearSelected },
          headers: { Authorization: `Bearer ${localStorage.getItem('authToken')}` }
        });
        if (!mounted) return;
        const rows = Array.isArray(res.data?.rows) ? res.data.rows : [];
        setDeptEnrollmentExists(rows.length > 0);
      } catch (err) {
        if (mounted) setDeptEnrollmentExists(false);
      }
    }
    checkDeptRows();
    return () => { mounted = false; };
  }, [academicYearSelected]);

  const rowsForTypes = OFFICE_TYPES.map(type => {
    const matches = (officeSubmissions || []).filter(s => {
      if (((s.type || "").trim()) !== type) return false;
      const rowYear = String(s.academic_year || "").trim();
      if (activeYearTab === "current") {
        return rowYear === String(academicYearSelected).trim();
      }
      if (selectedPreviousYear) {
        return rowYear === String(academicYearSelected).trim();
      }
      // previous tab + no explicit year => include any row that is not currentAcademic
      return rowYear && rowYear !== currentAcademic;
    });

    // Special handling for Department Enrollment like in Admin officesubmission.js
    if (type === "Department Enrollment") {
      if (matches.length === 0) {
        // Check if department enrollment data exists
        return {
          id: `default-${type}-${academicYearSelected || "any"}`,
          academic_year: academicYearSelected || "",
          type,
          status: deptEnrollmentExists ? "Completed" : "Incompleted",
          submitted_at: null
        };
      }
    }

    if (matches.length === 0) {
      return {
        id: `default-${type}-${academicYearSelected || "any"}`,
        academic_year: academicYearSelected || "",
        type,
        status: "Incompleted",
        submitted_at: null
      };
    }

    matches.sort((a, b) => new Date(b.submitted_at || 0) - new Date(a.submitted_at || 0));
    const latest = matches[0];
    return {
      id: latest.id,
      academic_year: latest.academic_year || "",
      type: latest.type || type,
      status: latest.status || "Completed",
      submitted_at: latest.submitted_at || null
    };
  });

  return (
    <div className="w-full max-w-6xl mx-auto p-0 md:p-8 bg-gradient-to-br from-green-50 to-emerald-50 min-h-screen">
      <div className="flex justify-end mb-6">
        <AcademicYearBadge year={adminAcademicYear} />
      </div>

      <h2 className="text-3xl font-extrabold text-gray-800 mb-8">Office Submission</h2>

      <div className="flex gap-4 mb-6 justify-center">
        <button
          className={`px-6 py-3 rounded-2xl font-semibold ${activeYearTab === 'current' ? 'bg-blue-600 text-white' : 'bg-white text-blue-600 border border-blue-200'}`}
          onClick={() => setActiveYearTab('current')}
        >
          Current Academic Year
        </button>
        <button
          className={`px-6 py-3 rounded-2xl font-semibold ${activeYearTab === 'previous' ? 'bg-teal-600 text-white' : 'bg-white text-teal-600 border border-teal-200'}`}
          onClick={() => setActiveYearTab('previous')}
        >
          Previous Academic Years
        </button>
      </div>

      {activeYearTab === 'previous' && (
        <div className="max-w-4xl mx-auto mb-6">
          <label className="block text-sm font-semibold mb-2">Select Academic Year</label>
          <select value={selectedPreviousYear} onChange={e => setSelectedPreviousYear(e.target.value)} className="w-full p-3 rounded-xl border border-blue-200">
            <option value="">-- Select Previous Year (or leave blank to show all previous) --</option>
            {previousAcademicYears.map(y => <option key={y} value={y}>{y}</option>)}
          </select>
        </div>
      )}

      {activeYearTab === 'previous' && previousAcademicYears.length === 0 ? (
        <div className="text-center text-gray-400 py-12 text-lg font-semibold">
          No previous academic year data to display.
        </div>
      ) : loading ? (
        <div className="text-center py-12 text-gray-500">Loading...</div>
      ) : (
        <div className="overflow-x-auto animate-fade-in">
          <table className="min-w-full bg-white border-0 rounded-2xl shadow-xl overflow-hidden">
            <thead className="bg-gradient-to-r from-green-600 to-emerald-600 text-white">
              <tr>
                <th className="p-4 text-left font-bold tracking-wide" style={{ minWidth: "130px" }}>Academic Year</th>
                <th className="p-4 text-left font-bold tracking-wide" style={{ minWidth: "180px" }}>Type</th>
                <th className="p-4 text-left font-bold tracking-wide" style={{ minWidth: "120px" }}>Status</th>
                <th className="p-4 text-left font-bold tracking-wide" style={{ minWidth: "140px" }}>Submitted At</th>
              </tr>
            </thead>
            <tbody className="divide-y divide-green-50" style={{ minHeight: "300px" }}>
              {rowsForTypes.map((row) => (
                <tr key={row.id} className="hover:bg-gradient-to-r hover:from-green-50 hover:to-emerald-50 transition" style={{ minHeight: "60px" }}>
                  <td className="p-4 align-top font-semibold text-green-900">{row.academic_year || "-"}</td>
                  <td className="p-4 align-top">
                    <span className={`inline-block px-3 py-1 rounded-2xl text-sm font-bold ${
                      row.type === 'Department Enrollment' 
                        ? 'bg-gradient-to-r from-indigo-500 to-purple-500 text-white'
                        : row.type === 'Teaching Staff'
                        ? 'bg-blue-100 text-blue-700'
                        : 'bg-green-100 text-green-700'
                    }`}>
                      {row.type}
                    </span>
                  </td>
                  <td className="p-4 align-top">
                    <span className={`inline-flex items-center gap-2 px-3 py-1 rounded-full text-sm font-semibold ${row.status === 'Completed' ? 'bg-green-100 text-green-700' : 'bg-yellow-100 text-yellow-700'}`}>
                      <span className={`w-2 h-2 rounded-full ${row.status === 'Completed' ? 'bg-green-600' : 'bg-yellow-600'}`} />
                      {row.status === 'Completed' ? 'Completed' : 'Incompleted'}
                    </span>
                  </td>
                  <td className="p-4 align-top">{row.submitted_at ? new Date(row.submitted_at).toLocaleString() : '-'}</td>
                </tr>
              ))}
              {rowsForTypes.length === 0 && (
                <tr style={{ minHeight: "200px" }}>
                  <td colSpan={4} className="px-4 py-12 text-center text-gray-400 bg-gradient-to-r from-green-50 to-emerald-50">
                    <div className="flex flex-col items-center justify-center">
                      <svg className="w-12 h-12 text-gray-300 mb-2" fill="none" stroke="currentColor" strokeWidth="2" viewBox="0 0 24 24">
                        <path strokeLinecap="round" strokeLinejoin="round" d="M9 17v-6a2 2 0 012-2h2a2 2 0 012 2v6m-6 4h6a2 2 0 002-2V7a2 2 0 00-2-2H7a2 2 0 00-2 2v12a2 2 0 002 2z" />
                      </svg>
                      <p className="text-gray-600 font-medium">No office submission data found</p>
                    </div>
                  </td>
                </tr>
              )}
            </tbody>
          </table>
        </div>
      )}
    </div>
  );
};

export default OfficeSubmission;