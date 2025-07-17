import React, { useEffect, useState } from "react";
import axios from "axios";

const API_BASE = "http://localhost:5000/api";
const API = {
  SUBMITTED_DATA_ALL: `${API_BASE}/submitted-data`,
};

function PrincipleSubmission() {
  const [submittedData, setSubmittedData] = useState([]);
  const [loading, setLoading] = useState(false);
  const [globalMessage, setGlobalMessage] = useState(null);
  const [filters, setFilters] = useState({ department: "", type: "", degree_level: "" });

  // Fetch all submitted data with filters
  const fetchSubmittedData = async (customFilters = filters) => {
    setLoading(true);
    try {
      const params = {};
      if (customFilters.department) params.department = customFilters.department;
      if (customFilters.type) params.type = customFilters.type;
      if (customFilters.degree_level) params.degree_level = customFilters.degree_level;
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

  useEffect(() => {
    fetchSubmittedData({ department: "", type: "", degree_level: "" });
    // eslint-disable-next-line
  }, []);

  // Category master summary
  const summary = submittedData.reduce((acc, row) => {
    acc[row.type] = (acc[row.type] || 0) + 1;
    return acc;
  }, {});

  return (
    <div className="p-0 md:p-6 bg-gradient-to-br from-blue-50 to-indigo-50 min-h-screen">
      <div className="flex items-center justify-between mb-8">
        <h2 className="text-3xl font-extrabold text-gray-800 tracking-tight flex items-center gap-3">
          <span className="inline-block w-10 h-10 rounded-xl bg-gradient-to-br from-blue-600 to-indigo-600 flex items-center justify-center text-white text-2xl shadow">S</span>
          Submitted Data
        </h2>
      </div>

      {/* Category summary */}
      <div className="grid grid-cols-1 md:grid-cols-2 gap-6 mb-8">
        {["Student Enrollment", "Student Examination"].map((cat) => (
          <div key={cat} className="bg-gradient-to-br from-blue-100 to-indigo-100 rounded-2xl shadow-lg p-8 flex flex-col items-center border border-blue-100">
            <div className="text-lg font-bold text-blue-800">{cat}</div>
            <div className="text-4xl font-extrabold text-blue-700 mt-2 drop-shadow">{summary[cat] || 0}</div>
          </div>
        ))}
      </div>

      {/* Data Table */}
      <div className="overflow-x-auto animate-fade-in">
        <table className="min-w-full bg-white border-0 rounded-2xl shadow-xl overflow-hidden">
          <thead className="bg-gradient-to-r from-blue-600 to-indigo-600 text-white">
            <tr>
              <th className="p-4 text-left font-bold tracking-wide">Department</th>
              <th className="p-4 text-left font-bold tracking-wide">Name</th>
              <th className="p-4 text-left font-bold tracking-wide">Year</th>
              <th className="p-4 text-left font-bold tracking-wide">Degree Level</th>
              <th className="p-4 text-center font-bold tracking-wide" style={{ minWidth: 180 }}>Type</th>
              <th className="p-4 text-left font-bold tracking-wide">HOD</th>
              <th className="p-4 text-left font-bold tracking-wide">Submitted At</th>
              {/* Locked column removed as per request */}
            </tr>
          </thead>
          <tbody className="divide-y divide-blue-50">
            {submittedData.map((row) => (
              <tr key={row.id} className="hover:bg-gradient-to-r hover:from-blue-50 hover:to-indigo-50 transition">
                <td className="p-4 font-semibold text-blue-900">{row.department}</td>
                <td className="p-4">{row.name}</td>
                <td className="p-4">{row.year}</td>
                <td className="p-4">{row.degree_level || "-"}</td>
                <td className="p-4 text-center" style={{ minWidth: 180 }}>
                  <span className={`px-3 py-1 rounded-2xl text-xs font-bold ${row.type === "Student Examination"
                    ? "bg-gradient-to-r from-purple-500 to-indigo-500 text-white"
                    : "bg-blue-100 text-blue-700"
                    }`}>
                    {row.type}
                  </span>
                </td>
                <td className="p-4">{row.hod}</td>
                <td className="p-4">{new Date(row.submitted_at).toLocaleString()}</td>
                {/* Locked column removed as per request */}
              </tr>
            ))}
            {submittedData.length === 0 && (
              <tr>
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

export default PrincipleSubmission;
