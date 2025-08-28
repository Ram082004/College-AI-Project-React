import React, { useEffect, useState } from "react";
import axios from "axios";
import AcademicYearBadge from "./AcademicYearBadge";

const API_BASE = "http://localhost:5000/api";
const API = {
  OFFICE_SUBMISSION: `${API_BASE}/office-user/office-submission`,
  OFFICE_SUBMISSION_LOCK: (id) => `${API_BASE}/office-user/office-submission/${id}/lock`,
  OFFICE_SUBMISSION_DELETE: (id) => `${API_BASE}/office-user/office-submission/${id}`,
};

export default function OfficeSubmission() {
  const [submissions, setSubmissions] = useState([]);
  const [loading, setLoading] = useState(false);
  const [globalMessage, setGlobalMessage] = useState(null);
  const [latestAcademicYear, setLatestAcademicYear] = useState("");
  const [adminAcademicYear, setAdminAcademicYear] = useState("");

  const fetchSubmissions = () => {
    setLoading(true);
    axios.get(API.OFFICE_SUBMISSION)
      .then(res => {
        setSubmissions(res.data.data || []);
        if (res.data.data.length > 0) {
          setLatestAcademicYear(res.data.data[0].academic_year || "");
        }
      })
      .catch(() => setSubmissions([]))
      .finally(() => setLoading(false));
  };

  useEffect(() => {
    fetchSubmissions();
  }, []);

  // Toggle lock/unlock
  const handleToggleLock = async (id, locked) => {
    setLoading(true);
    try {
      const res = await axios.patch(API.OFFICE_SUBMISSION_LOCK(id), { locked });
      if (res.data.success) {
        setGlobalMessage({ type: "success", text: `Submission ${locked ? "locked" : "unlocked"} successfully` });
        fetchSubmissions();
      } else {
        setGlobalMessage({ type: "error", text: res.data.message || "Failed to update lock status" });
        setLoading(false);
      }
    } catch {
      setGlobalMessage({ type: "error", text: "Failed to update lock status" });
      setLoading(false);
    }
  };

  // Delete submission
  const handleDelete = async (id) => {
    if (!window.confirm("Are you sure you want to delete this submission?")) return;
    setLoading(true);
    try {
      const res = await axios.delete(API.OFFICE_SUBMISSION_DELETE(id));
      if (res.data.success) {
        setGlobalMessage({ type: "success", text: "Submission deleted successfully" });
        fetchSubmissions();
      } else {
        setGlobalMessage({ type: "error", text: res.data.message || "Failed to delete submission" });
        setLoading(false);
      }
    } catch {
      setGlobalMessage({ type: "error", text: "Failed to delete submission" });
      setLoading(false);
    }
  };

  useEffect(() => {
    if (globalMessage) {
      const timer = setTimeout(() => setGlobalMessage(null), 3000);
      return () => clearTimeout(timer);
    }
  }, [globalMessage]);

  useEffect(() => {
    async function fetchAdminYear() {
      try {
        const res = await axios.get('http://localhost:5000/api/admin/all', {
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

  return (
    <div className="max-w-6xl mx-auto px-6 py-10">
      {/* Academic Year Badge */}
      <div className="flex justify-end mb-4">
        <AcademicYearBadge year={adminAcademicYear} />
      </div>
      <h2 className="text-3xl font-extrabold mb-8 text-gradient bg-gradient-to-r from-green-600 via-blue-500 to-purple-600 bg-clip-text text-transparent">Office Submission Details</h2>
      {loading ? (
        <div className="text-center py-12 text-gray-500">Loading...</div>
      ) : (
        <table className="min-w-full bg-white rounded-2xl shadow-xl overflow-hidden">
          <thead className="bg-gradient-to-r from-green-100 to-blue-100">
            <tr>
              <th className="px-4 py-3 font-bold tracking-wider text-green-700">Academic Year</th>
              <th className="px-4 py-3 font-bold tracking-wider text-green-700">Type</th>
              <th className="px-4 py-3 font-bold tracking-wider text-green-700">Status</th>
              <th className="px-4 py-3 font-bold tracking-wider text-green-700">Locked</th>
              <th className="px-4 py-3 font-bold tracking-wider text-green-700">Submitted At</th>
              <th className="px-4 py-3 font-bold tracking-wider text-green-700">Actions</th>
            </tr>
          </thead>
          <tbody>
            {submissions.length > 0 ? submissions.map((row, idx) => (
              <tr key={row.id || idx} className="hover:bg-gradient-to-r hover:from-green-50 hover:to-blue-50 transition border-b border-green-50 last:border-0">
                <td className="px-4 py-3">{row.academic_year}</td>
                <td className="px-4 py-3">{row.type}</td>
                <td className="px-4 py-3">{row.status}</td>
                <td className="px-4 py-3">
                  <button
                    className={`px-4 py-2 rounded-lg font-semibold ${row.is_locked ? "bg-green-600 text-white" : "bg-gray-300 text-gray-700"}`}
                    onClick={() => handleToggleLock(row.id, !row.is_locked)}
                    disabled={loading}
                    title={row.is_locked ? "Unlock this submission" : "Lock this submission"}
                  >
                    {row.is_locked ? "Unlock" : "Lock"}
                  </button>
                </td>
                <td className="px-4 py-3">{row.submitted_at ? new Date(row.submitted_at).toLocaleString() : "-"}</td>
                <td className="px-4 py-3">
                  <button
                    className="px-4 py-2 bg-red-600 text-white rounded-lg font-semibold mr-2"
                    onClick={() => handleDelete(row.id)}
                    disabled={loading}
                  >
                    Delete
                  </button>
                </td>
              </tr>
            )) : (
              <tr>
                <td colSpan={6} className="px-4 py-12 text-center text-gray-400 bg-gradient-to-r from-green-50 to-blue-50">No office submissions found</td>
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