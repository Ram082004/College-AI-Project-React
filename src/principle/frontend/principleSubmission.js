import React, { useEffect, useState } from "react";
import axios from "axios";
import AcademicYearBadge from "../../Admin-Frontend/components/AcademicYearBadge";

const API_BASE = "http://localhost:5000/api";
const API = {
  SUBMITTED_DATA_ALL: `${API_BASE}/submitted-data`,
  ENROLLMENT_SUMMARY: `${API_BASE}/department-user/student-enrollment/summary`,
  EXAMINATION_SUMMARY: `${API_BASE}/department-user/student-examination/summary`,
  DISTINCT_YEARS: `${API_BASE}/submitted-data/distinct/years`
};

function PrincipleSubmission() {
  const [submittedData, setSubmittedData] = useState([]);
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
  const recordsPerPage = 10;

  // Fetch submissions (existing logic reused)
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
        const res = await axios.get("http://localhost:5000/api/admin/all", {
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
        const res = await axios.get("http://localhost:5000/api/admin/all", {
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

  // When the active year tab changes or adminAcademicYear/academicYears changes, adjust filters and re-fetch:
  useEffect(() => {
    if (activeYearTab === 'current') {
      const ay = adminAcademicYear || (academicYears[0] || '');
      setFilters(f => ({ ...f, academic_year: ay }));
      setSelectedPreviousYear('');
    } else {
      // previous: clear explicit academic_year filter in global filters
      setFilters(f => ({ ...f, academic_year: '' }));
      // default selected previous year -> first available non-latest year (if any)
      const prevYears = academicYears.filter(y => y !== (adminAcademicYear || academicYears[0]));
      setSelectedPreviousYear(prevYears[0] || '');
    }
    // eslint-disable-next-line
  }, [activeYearTab, adminAcademicYear, academicYears]);

  // If adminAcademicYear changes, ensure current tab filter is updated immediately
  useEffect(() => {
    if (activeYearTab === 'current') {
      const ay = adminAcademicYear || (academicYears[0] || '');
      setFilters(f => ({ ...f, academic_year: ay }));
    }
    // eslint-disable-next-line
  }, [adminAcademicYear]);

  // initial data fetch (keep existing behavior)
  useEffect(() => {
    fetchSubmittedData({ department: "", type: "", degree_level: "", academic_year: "" });
    // eslint-disable-next-line
  }, []);

  // Re-fetch when filters update
  useEffect(() => {
    fetchSubmittedData();
    // eslint-disable-next-line
  }, [filters]);

  // Helper: compute the academic year to use for totals based on active tab
  const getDisplayAcademicYearForTotals = (overrideYear) => {
    if (overrideYear) return overrideYear;
    if (activeYearTab === 'previous') {
      if (selectedPreviousYear) return selectedPreviousYear;
      return adminAcademicYear || (academicYears[0] || "");
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

  // Recalculate totals when academic-year selection changes (ensures totals follow tabs / selection)
  useEffect(() => {
    fetchGenderTotals({});
    // eslint-disable-next-line
  }, [activeYearTab, selectedPreviousYear, adminAcademicYear, academicYears, filters.department, filters.degree_level]);

  // Tab + pagination helpers (reusing earlier pagination logic)
  const currentYear = latestAcademicYear || (academicYears.length > 0 ? academicYears[0] : "");
  const currentYearData = submittedData.filter(r => String(r.academic_year || "") === String(currentYear));
  const previousYearsData = submittedData.filter(r => String(r.academic_year || "") !== String(currentYear));

  const paginatedFor = (rows) => {
    const total = Math.ceil(rows.length / recordsPerPage);
    const start = (currentPage - 1) * recordsPerPage;
    return { rows: rows.slice(start, start + recordsPerPage), total };
  };

  useEffect(() => { setCurrentPage(1); }, [activeYearTab]);

  const activeRows = activeYearTab === "current" ? currentYearData : previousYearsData;
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
        <button className={`px-6 py-3 rounded-2xl font-bold ${activeYearTab === 'current' ? 'bg-blue-600 text-white' : 'bg-white text-blue-600'}`} onClick={() => setActiveYearTab('current')}>Current Academic Year</button>
        <button className={`px-6 py-3 rounded-2xl font-bold ${activeYearTab === 'previous' ? 'bg-teal-600 text-white' : 'bg-white text-teal-600'}`} onClick={() => setActiveYearTab('previous')}>Previous Academic Years</button>
      </div>

      {activeYearTab === 'previous' && (
        <div className="max-w-4xl mx-auto mb-6">
          <label className="block text-sm font-semibold mb-2">Select Academic Year</label>
          <select value={selectedPreviousYear} onChange={e => setSelectedPreviousYear(e.target.value)} className="w-full p-3 rounded-xl border border-blue-200">
            <option value="">-- Select Previous Year (or leave blank to show all previous) --</option>
            {academicYears.filter(y => y !== (adminAcademicYear || academicYears[0])).map(y => <option key={y} value={y}>{y}</option>)}
          </select>
        </div>
      )}

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
              <th className="p-4 text-left font-bold tracking-wide">Academic Year</th>
              <th className="p-4 text-left font-bold tracking-wide">Department</th>
              <th className="p-4 text-left font-bold tracking-wide">Name</th>
              <th className="p-4 text-left font-bold tracking-wide">Degree Level</th>
              <th className="p-4 text-center font-bold tracking-wide" style={{ minWidth: 180 }}>Type</th>
              <th className="p-4 text-left font-bold tracking-wide">HOD</th>
              <th className="p-4 text-left font-bold tracking-wide">Submitted At</th>
            </tr>
          </thead>
          <tbody className="divide-y divide-blue-50">
            {visibleRows.map(row => (
              <tr key={row.id} className="hover:bg-gradient-to-r hover:from-blue-50 hover:to-indigo-50 transition">
                <td className="p-4 font-semibold text-blue-900">{row.academic_year}</td>
                <td className="p-4 font-semibold text-blue-900">{row.department}</td>
                <td className="p-4">{row.name}</td>
                <td className="p-4">{row.degree_level || "-"}</td>
                <td className="p-4 text-center" style={{ minWidth: 180 }}>
                  <span className={`px-3 py-1 rounded-2xl text-xs font-bold ${row.type === "Student Examination" ? "bg-gradient-to-r from-purple-500 to-indigo-500 text-white" : "bg-blue-100 text-blue-700"}`}>{row.type}</span>
                </td>
                <td className="p-4">{row.hod}</td>
                <td className="p-4">{row.submitted_at ? new Date(row.submitted_at).toLocaleString() : "-"}</td>
              </tr>
            ))}
            {visibleRows.length === 0 && (
              <tr>
                {/* Adjusted colspan: previously 8 (with Year); now 7 */}
                <td colSpan={7} className="px-4 py-12 text-center text-gray-400 bg-gradient-to-r from-blue-50 to-indigo-50">
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
