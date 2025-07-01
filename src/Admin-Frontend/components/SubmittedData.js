import React, { useEffect, useState } from "react";
import axios from "axios";

const API_BASE = "http://localhost:5000/api";
const API = {
  SUBMITTED_DATA_ALL: `${API_BASE}/submitted-data`,
  SUBMITTED_DATA_LOCK: (id) => `${API_BASE}/submitted-data/${id}/lock`,
};

function SubmittedData() {
  const [submittedData, setSubmittedData] = useState([]);
  const [loading, setLoading] = useState(false);
  const [globalMessage, setGlobalMessage] = useState(null);

  // Fetch all submitted data
  const fetchSubmittedData = async () => {
    setLoading(true);
    try {
      const res = await axios.get(API.SUBMITTED_DATA_ALL, {
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
    fetchSubmittedData();
  }, []);

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

  // Category master summary
  const summary = submittedData.reduce((acc, row) => {
    acc[row.type] = (acc[row.type] || 0) + 1;
    return acc;
  }, {});

  return (
    <div className="p-0 md:p-2">
      <div className="flex items-center justify-between mb-8">
        <h2 className="text-3xl font-extrabold text-gray-800 tracking-tight flex items-center gap-3">
          <span className="inline-block w-10 h-10 rounded-xl bg-gradient-to-br from-blue-600 to-indigo-600 flex items-center justify-center text-white text-2xl shadow">S</span>
          Submitted Data
        </h2>
      </div>
      {/* Category summary */}
      <div className="grid grid-cols-1 md:grid-cols-2 gap-6 mb-8">
        {['Student Enrollment', 'Student Examination'].map((cat) => (
          <div key={cat} className="bg-gradient-to-br from-blue-100 to-indigo-100 rounded-2xl shadow-lg p-8 flex flex-col items-center border border-blue-100">
            <div className="text-lg font-bold text-blue-800">{cat}</div>
            <div className="text-4xl font-extrabold text-blue-700 mt-2 drop-shadow">{summary[cat] || 0}</div>
          </div>
        ))}
      </div>
      <div className="overflow-x-auto animate-fade-in">
        <table className="min-w-full bg-white border-0 rounded-2xl shadow-xl overflow-hidden">
          <thead className="bg-gradient-to-r from-blue-600 to-indigo-600 text-white">
            <tr>
              <th className="p-4 text-left font-bold tracking-wide">Department</th>
              <th className="p-4 text-left font-bold tracking-wide">Name</th>
              <th className="p-4 text-left font-bold tracking-wide">Year</th>
              <th className="p-4 text-left font-bold tracking-wide">Type</th>
              <th className="p-4 text-left font-bold tracking-wide">HOD</th>
              <th className="p-4 text-left font-bold tracking-wide">Submitted At</th>
              <th className="p-4 text-left font-bold tracking-wide">Locked</th>
              <th className="p-4 text-left font-bold tracking-wide">Action</th>
            </tr>
          </thead>
          <tbody className="divide-y divide-blue-50">
            {submittedData.map((row) => (
              <tr key={row.id} className="hover:bg-blue-50 transition-all">
                <td className="p-4 font-semibold text-blue-900">{row.department}</td>
                <td className="p-4">{row.name}</td>
                <td className="p-4">{row.year}</td>
                <td className="p-4"><span className={`px-3 py-1 rounded-2xl text-xs font-bold ${row.type === 'Student Examination' ? 'bg-gradient-to-r from-purple-500 to-indigo-500 text-white' : 'bg-blue-100 text-blue-700'}`}>{row.type}</span></td>
                <td className="p-4">{row.hod}</td>
                <td className="p-4">{new Date(row.submitted_at).toLocaleString()}</td>
                <td className="p-4">
                  <span className={`px-3 py-1 rounded-2xl text-xs font-bold ${row.locked ? 'bg-red-100 text-red-700' : 'bg-green-100 text-green-700'}`}>{row.locked ? 'Locked' : 'Unlocked'}</span>
                </td>
                <td className="p-4">
                  <button
                    onClick={() => handleLockToggle(row.id, !row.locked)}
                    className={`px-4 py-2 rounded-2xl font-bold shadow transition-all ${row.locked ? 'bg-green-600 hover:bg-green-700 text-white' : 'bg-gray-600 hover:bg-gray-700 text-white'}`}
                  >
                    {row.locked ? 'Unlock' : 'Lock'}
                  </button>
                </td>
              </tr>
            ))}
            {submittedData.length === 0 && (
              <tr>
                <td colSpan={8} className="px-4 py-8 text-center text-gray-400">
                  No submitted data found.
                </td>
              </tr>
            )}
          </tbody>
        </table>
      </div>
      {/* Toast Message */}
      {globalMessage && (
        <div className={`fixed bottom-4 right-4 px-6 py-3 rounded-2xl shadow-xl font-bold text-lg ${globalMessage.type === 'success' ? 'bg-green-500 text-white' : 'bg-red-500 text-white'}`}>
          {globalMessage.text}
          <button onClick={() => setGlobalMessage(null)} className="ml-3 text-white/80 hover:text-white">×</button>
        </div>
      )}
    </div>
  );
}

export default SubmittedData;