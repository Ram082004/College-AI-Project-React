import React, { useEffect, useState } from "react";
import axios from "axios";

const API_BASE = "http://localhost:5000/api";
const API = {
  SUBMITTED_DATA_ALL: `${API_BASE}/submitted-data`,
  SUBMITTED_DATA_LOCK: (id) => `${API_BASE}/submitted-data/${id}/lock`,
};

export default function SubmittedData() {
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
    <div className="max-w-7xl mx-auto px-6 py-8">
      <h1 className="text-2xl font-bold mb-6">Submitted Data</h1>

      {/* Category summary */}
      <div className="grid grid-cols-1 md:grid-cols-2 gap-6 mb-8">
        {["Student Enrollment", "Student Examination"].map((cat) => (
          <div key={cat} className="bg-white rounded-xl shadow p-6 flex flex-col items-center">
            <div className="text-lg font-semibold">{cat}</div>
            <div className="text-3xl font-bold text-blue-700 mt-2">{summary[cat] || 0}</div>
          </div>
        ))}
      </div>

      {/* Data Table */}
      <div className="bg-white rounded-xl shadow p-4 overflow-x-auto">
        <table className="min-w-full divide-y divide-gray-200 text-sm">
          <thead>
            <tr>
              <th className="px-4 py-2">Department</th>
              <th className="px-4 py-2">Name</th>
              <th className="px-4 py-2">Year</th>
              <th className="px-4 py-2">Type</th>
              <th className="px-4 py-2">HOD</th>
              <th className="px-4 py-2">Submitted At</th>
              <th className="px-4 py-2">Locked</th>
              <th className="px-4 py-2">Action</th>
            </tr>
          </thead>
          <tbody>
            {submittedData.map((row) => (
              <tr key={row.id}>
                <td className="px-4 py-2">{row.department}</td>
                <td className="px-4 py-2">{row.name}</td>
                <td className="px-4 py-2">{row.year}</td>
                <td className="px-4 py-2">{row.type}</td>
                <td className="px-4 py-2">{row.hod}</td>
                <td className="px-4 py-2">{new Date(row.submitted_at).toLocaleString()}</td>
                <td className="px-4 py-2">
                  <span className={`px-2 py-1 rounded text-xs font-semibold ${row.locked ? "bg-red-100 text-red-700" : "bg-green-100 text-green-700"}`}>
                    {row.locked ? "Locked" : "Unlocked"}
                  </span>
                </td>
                <td className="px-4 py-2">
                  <button
                    onClick={() => handleLockToggle(row.id, !row.locked)}
                    className={`px-3 py-1 rounded ${row.locked ? "bg-green-500 hover:bg-green-600" : "bg-gray-500 hover:bg-gray-600"} text-white`}
                  >
                    {row.locked ? "Unlock" : "Lock"}
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
        <div className={`fixed bottom-4 right-4 px-6 py-3 rounded-xl shadow-lg ${globalMessage.type === "success" ? "bg-green-500 text-white" : "bg-red-500 text-white"}`}>
          {globalMessage.text}
          <button onClick={() => setGlobalMessage(null)} className="ml-3 text-white/80 hover:text-white">×</button>
        </div>
      )}
    </div>
  );
}