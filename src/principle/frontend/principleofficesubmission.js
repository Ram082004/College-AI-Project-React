import React, { useEffect, useState, useRef } from "react";
import axios from "axios";
import AcademicYearBadge from "../../Admin-Frontend/components/AcademicYearBadge";

const API_BASE = "http://localhost:5000/api";
const API = {
  OFFICE_SUBMISSION: `${API_BASE}/principle/office-submission`,
  DISTINCT_YEARS: `${API_BASE}/submitted-data/distinct/years`,
  ADMIN_ALL: `${API_BASE}/admin/all`,
};

const OFFICE_TYPES = ["Teaching Staff", "Non-Teaching Staff"];

const OfficeSubmission = () => {
  const [officeSubmissions, setOfficeSubmissions] = useState([]);
  const [academicYears, setAcademicYears] = useState([]);
  const [adminAcademicYear, setAdminAcademicYear] = useState("");
  const [loading, setLoading] = useState(false);
  const [activeYearTab, setActiveYearTab] = useState("current"); // "current" | "previous"
  const [selectedPreviousYear, setSelectedPreviousYear] = useState("");

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
                <th className="p-4 text-left font-bold tracking-wide">Academic Year</th>
                <th className="p-4 text-left font-bold tracking-wide">Type</th>
                <th className="p-4 text-left font-bold tracking-wide">Status</th>
                <th className="p-4 text-left font-bold tracking-wide">Submitted At</th>
              </tr>
            </thead>
            <tbody className="divide-y divide-green-50">
              {rowsForTypes.map((row) => (
                <tr key={row.id} className="hover:bg-gradient-to-r hover:from-green-50 hover:to-emerald-50 transition">
                  <td className="p-4 font-semibold text-green-900">{row.academic_year || "-"}</td>
                  <td className="p-4">{row.type}</td>
                  <td className="p-4">
                    <span className={`inline-flex items-center gap-2 px-3 py-1 rounded-full text-sm font-semibold ${row.status === 'Completed' ? 'bg-green-100 text-green-700' : 'bg-yellow-100 text-yellow-700'}`}>
                      <span className={`w-2 h-2 rounded-full ${row.status === 'Completed' ? 'bg-green-600' : 'bg-yellow-600'}`} />
                      {row.status === 'Completed' ? 'Completed' : 'Incompleted'}
                    </span>
                  </td>
                  <td className="p-4">{row.submitted_at ? new Date(row.submitted_at).toLocaleString() : '-'}</td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>
      )}
    </div>
  );
};

export default OfficeSubmission;