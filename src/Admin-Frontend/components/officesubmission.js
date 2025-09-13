import React, { useEffect, useState, useRef } from "react";
import axios from "axios";
import AcademicYearBadge from "./AcademicYearBadge";

const API_BASE = "http://localhost:5000/api";
const API = {
  OFFICE_SUBMISSION: `${API_BASE}/office-user/office-submission`,
  OFFICE_SUBMISSION_LOCK: (id) => `${API_BASE}/office-user/office-submission/${id}/lock`,
  OFFICE_SUBMISSION_DELETE: (id) => `${API_BASE}/office-user/office-submission/${id}`,
  DISTINCT_YEARS: `${API_BASE}/submitted-data/distinct/years`, // reuse endpoint from SubmittedData
  ADMIN_ALL: `${API_BASE}/admin/all`,
  // NEW: endpoint to inspect raw department enrollment rows
  OFFICE_DEPT_GET: `${API_BASE}/office/officedept/get`
};

const OFFICE_TYPES = ["Teaching Staff", "Non-Teaching Staff", "Department Enrollment"];

export default function OfficeSubmission() {
  const [submissions, setSubmissions] = useState([]);
  const [loading, setLoading] = useState(false);
  const [globalMessage, setGlobalMessage] = useState(null);
  const [latestAcademicYear, setLatestAcademicYear] = useState("");
  const [adminAcademicYear, setAdminAcademicYear] = useState("");
  const [academicYears, setAcademicYears] = useState([]);
  const [activeYearTab, setActiveYearTab] = useState("current"); // "current" | "previous"
  const [selectedPreviousYear, setSelectedPreviousYear] = useState("");

  // NEW: track whether department enrollment rows exist for the selected academic year
  const [deptEnrollmentExists, setDeptEnrollmentExists] = useState(false);

  // Remember previous admin year (so just-changed admin year appears in previous list)
  const [prevAdminYear, setPrevAdminYear] = useState("");
  const prevAdminRef = useRef(adminAcademicYear);
  useEffect(() => {
    if (prevAdminRef.current && prevAdminRef.current !== adminAcademicYear) {
      setPrevAdminYear(prevAdminRef.current);
    }
    prevAdminRef.current = adminAcademicYear;
  }, [adminAcademicYear]);

  // fetch submissions (all years)
  const fetchSubmissions = async () => {
    setLoading(true);
    try {
      const res = await axios.get(API.OFFICE_SUBMISSION, { headers: { Authorization: `Bearer ${localStorage.getItem('authToken')}` } });
      setSubmissions(res.data.data || []);
      if (res.data.data && res.data.data.length > 0) {
        setLatestAcademicYear(res.data.data[0].academic_year || "");
      }
    } catch {
      setSubmissions([]);
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => { fetchSubmissions(); }, []);

  // re-fetch officeSubmissions when tab/year selection or available years change
  useEffect(() => {
    // reload submissions so UI reflects academic year change immediately
    fetchSubmissions();
    // eslint-disable-next-line
  }, [activeYearTab, selectedPreviousYear, adminAcademicYear, academicYears]);

  // fetch distinct academic years (for previous selector)
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

  // fetch admin/year from admin table (current academic year)
  useEffect(() => {
    async function fetchAdminYear() {
      try {
        const res = await axios.get(API.ADMIN_ALL, { headers: { Authorization: `Bearer ${localStorage.getItem("authToken")}` }});
        if (res.data?.admins?.length) {
          setAdminAcademicYear(res.data.admins[0].academic_year || "");
        }
      } catch {
        setAdminAcademicYear("");
      }
    }
    fetchAdminYear();
  }, []);

  // keep selectedPreviousYear default when switching to previous tab (use first previous if available)
  useEffect(() => {
    if (activeYearTab === 'previous') {
      const prevYears = (academicYears || []).filter(y => String(y).trim() && y !== (adminAcademicYear || academicYears[0]));
      setSelectedPreviousYear(prevYears[0] || '');
    } else {
      setSelectedPreviousYear('');
    }
  }, [activeYearTab, adminAcademicYear, academicYears]);

  // helper list of previous academic years excluding admin/current (include prevAdminYear like SubmittedData)
  const previousAcademicYears = (() => {
    const current = (adminAcademicYear || (academicYears && academicYears[0]) || "").toString().trim();
    const list = (academicYears || []).filter(y => String(y).trim() && String(y).trim() !== current);
    if (prevAdminYear && !list.some(y => String(y).trim() === String(prevAdminYear).trim()) && String(prevAdminYear).trim() !== current) {
      return [prevAdminYear, ...list];
    }
    return list;
  })();

  // Build display rows: ensure one row per OFFICE_TYPES for selected academic year
  const currentAcademic = (adminAcademicYear || (academicYears && academicYears[0]) || "").toString().trim();
  const academicYearSelected = activeYearTab === "current" ? (adminAcademicYear || (academicYears[0] || "")) : (selectedPreviousYear || "");

  // NEW effect: check if there are department enrollment rows for academicYearSelected
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
    // find submissions for this type + academic year
    const matches = (submissions || []).filter(s => {
      if (((s.type || "").trim()) !== type) return false;
      const rowYear = String(s.academic_year || "").trim();
      if (activeYearTab === 'current') {
        return rowYear === String(academicYearSelected).trim();
      }
      // previous tab:
      // - if user selected a specific previous year -> strict match
      // - if empty -> include any row that is not the current academic year (i.e. any previous year)
      if (selectedPreviousYear) {
        return rowYear === String(academicYearSelected).trim();
      }
      return rowYear && rowYear !== currentAcademic;
    });

    // If no office_submission record exists for this type+year => show Incompleted
    if (matches.length === 0) {
      return {
        id: `default-${type}-${academicYearSelected || 'any'}`,
        academic_year: academicYearSelected || "",
        type,
        status: 'Incompleted',
        is_locked: false,
        submitted_at: null
      };
    }

    // if multiple, pick the latest (by submitted_at)
    matches.sort((a, b) => new Date(b.submitted_at || 0) - new Date(a.submitted_at || 0));
    const latest = matches[0];
    return {
      id: latest.id,
      academic_year: latest.academic_year || "",
      type: latest.type || type,
      status: latest.status || 'Completed',
      is_locked: !!latest.is_locked,
      submitted_at: latest.submitted_at || null
    };
  });

  // Toggle lock/unlock (re-uses API)
  const handleToggleLock = async (id, locked) => {
    setLoading(true);
    try {
      const res = await axios.patch(API.OFFICE_SUBMISSION_LOCK(id), { locked }, { headers: { Authorization: `Bearer ${localStorage.getItem('authToken')}` }});
      if (res.data.success) {
        setGlobalMessage({ type: "success", text: `Submission ${locked ? "locked" : "unlocked"} successfully` });
        await fetchSubmissions();
      } else {
        setGlobalMessage({ type: "error", text: res.data.message || "Failed to update lock status" });
        setLoading(false);
      }
    } catch {
      setGlobalMessage({ type: "error", text: "Failed to update lock status" });
      setLoading(false);
    }
  };

  // Delete handler
  const handleDelete = async (id) => {
    if (!window.confirm("Are you sure you want to delete this submission?")) return;
    setLoading(true);
    try {
      const res = await axios.delete(API.OFFICE_SUBMISSION_DELETE(id), { headers: { Authorization: `Bearer ${localStorage.getItem('authToken')}` }});
      if (res.data.success) {
        setGlobalMessage({ type: "success", text: "Submission deleted successfully" });
        await fetchSubmissions();
      } else {
        setGlobalMessage({ type: "error", text: res.data.message || "Failed to delete submission" });
        setLoading(false);
      }
    } catch {
      setGlobalMessage({ type: "error", text: "Failed to delete submission" });
      setLoading(false);
    }
  };

  // Auto-hide global message
  useEffect(() => {
    if (!globalMessage) return;
    const t = setTimeout(() => setGlobalMessage(null), 3000);
    return () => clearTimeout(t);
  }, [globalMessage]);

  // UI helpers: hide Locked+Actions for previous years (same pattern as SubmittedData)
  const showLocked = activeYearTab === 'current';
  const showAction = activeYearTab === 'current';
  const totalColumns = showAction ? 9 : 8; // adjusted after removing "Year" column

  return (
    <div className="max-w-6xl mx-auto px-6 py-10">
      {/* Academic Year Badge */}
      <div className="flex justify-end mb-4">
        <AcademicYearBadge year={adminAcademicYear} />
      </div>

      <h2 className="text-3xl font-extrabold mb-8 text-gradient bg-gradient-to-r from-green-600 via-blue-500 to-purple-600 bg-clip-text text-transparent">Office Submission Details</h2>

      {/* Year Tabs (centered) */}
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

      {/* Previous year selector (centered) */}
      {activeYearTab === 'previous' && (
        <div className="max-w-4xl mx-auto mb-6">
          <label className="block text-sm font-semibold mb-2">Select Academic Year</label>
          <select value={selectedPreviousYear} onChange={e => setSelectedPreviousYear(e.target.value)} className="w-full p-3 rounded-xl border border-blue-200">
            <option value="">-- Select Previous Year (or leave blank to show all previous) --</option>
            {previousAcademicYears.map(y => <option key={y} value={y}>{y}</option>)}
          </select>
        </div>
      )}

      {/* If previous tab and there are no known previous years show the same placeholder as SubmittedData */}
      {activeYearTab === 'previous' && previousAcademicYears.length === 0 ? (
        <div className="text-center text-gray-400 py-12 text-lg font-semibold">
          No previous academic year data to display.
        </div>
      ) : loading ? (
        <div className="text-center py-12 text-gray-500">Loading...</div>
      ) : (
        <table className="min-w-full bg-white rounded-2xl shadow-xl overflow-hidden">
          <thead className="bg-gradient-to-r from-green-100 to-blue-100">
            <tr>
              <th className="px-4 py-3 font-bold tracking-wider text-green-700">Academic Year</th>
              <th className="px-4 py-3 font-bold tracking-wider text-green-700">Type</th>
              <th className="px-4 py-3 font-bold tracking-wider text-green-700">Status</th>
              <th className="px-4 py-3 font-bold tracking-wider text-green-700">Submitted At</th>
              {showLocked && <th className="px-4 py-3 font-bold tracking-wider text-green-700">Locked</th>}
              {showAction && <th className="px-4 py-3 font-bold tracking-wider text-green-700">Actions</th>}
            </tr>
          </thead>
          <tbody>
            {rowsForTypes.length > 0 ? rowsForTypes.map((row, idx) => (
              <tr key={row.id || idx} className="hover:bg-gradient-to-r hover:from-green-50 hover:to-blue-50 transition border-b border-green-50 last:border-0">
                <td className="px-4 py-3">{row.academic_year || (academicYearSelected ? academicYearSelected : "-")}</td>
                <td className="px-4 py-3">{row.type}</td>
                <td className="px-4 py-3">
                  <span className={`inline-flex items-center gap-2 px-3 py-1 rounded-full text-sm font-semibold ${row.status === 'Completed' ? 'bg-green-100 text-green-700' : 'bg-yellow-100 text-yellow-700'}`}>
                    <span className={`w-2 h-2 rounded-full ${row.status === 'Completed' ? 'bg-green-600' : 'bg-yellow-600'}`} />
                    {row.status === 'Completed' ? 'Completed' : 'Incompleted'}
                  </span>
                </td>
                <td className="px-4 py-3">{row.submitted_at ? new Date(row.submitted_at).toLocaleString() : '-'}</td>
                 {showLocked && (
                  <td className="px-4 py-3">
                    <button
                      className={`px-4 py-2 rounded-lg font-semibold ${row.is_locked ? "bg-green-600 text-white" : "bg-gray-300 text-gray-700"}`}
                      onClick={() => String(row.id).startsWith('default-') ? null : handleToggleLock(row.id, !row.is_locked)}
                      disabled={loading || String(row.id).startsWith('default-')}
                      title={row.is_locked ? "Unlock this submission" : "Lock this submission"}
                    >
                      {row.is_locked ? "Unlock" : "Lock"}
                    </button>
                  </td>
                )}
                {showAction && (
                  <td className="px-4 py-3">
                    {String(row.id).startsWith('default-') ? (
                      <button disabled className="px-4 py-2 bg-gray-300 text-white rounded-lg font-semibold">No Action</button>
                    ) : (
                      <button
                        className="px-4 py-2 bg-red-600 text-white rounded-lg font-semibold"
                        onClick={() => handleDelete(row.id)}
                        disabled={loading}
                      >
                        Delete
                      </button>
                    )}
                  </td>
                )}
              </tr>
            )) : (
              <tr>
                <td colSpan={(showLocked ? 6 : 5) + (showAction ? 1 : 0)} className="px-4 py-12 text-center text-gray-400 bg-gradient-to-r from-green-50 to-blue-50">No office submissions found for selected year</td>
              </tr>
            )}
           </tbody>
         </table>
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