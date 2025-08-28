import React, { useEffect, useState } from "react";
import axios from "axios";
import AcademicYearBadge from "../../Admin-Frontend/components/AcademicYearBadge";

const API_BASE = "http://localhost:5000/api";
const API = {
  OFFICE_SUBMISSION: `${API_BASE}/principle/office-submission`,
};

const OFFICE_TYPES = ["Teaching Staff", "Non-Teaching Staff"];

const OfficeSubmission = () => {
  const [officeSubmissions, setOfficeSubmissions] = useState([]);
  const [loading, setLoading] = useState(false);
  const [activeTab, setActiveTab] = useState("Teaching Staff");
  const [latestAcademicYear, setLatestAcademicYear] = useState("");

  useEffect(() => {
    const fetchOfficeSubmissions = async () => {
      setLoading(true);
      try {
        const res = await axios.get(API.OFFICE_SUBMISSION, {
          headers: { Authorization: `Bearer ${localStorage.getItem("authToken")}` },
        });
        setOfficeSubmissions(res.data.data || []);
        if (res.data.data && res.data.data.length > 0) {
          setLatestAcademicYear(res.data.data[0].academic_year || "");
        }
      } catch (err) {
        setOfficeSubmissions([]);
      } finally {
        setLoading(false);
      }
    };
    fetchOfficeSubmissions();
  }, []);

  // Use this in all principal pages to fetch academic year from admin table
  useEffect(() => {
    async function fetchAcademicYear() {
      try {
        const res = await axios.get("http://localhost:5000/api/admin/all", {
          headers: { Authorization: `Bearer ${localStorage.getItem("authToken")}` }
        });
        if (res.data?.admins?.length) setLatestAcademicYear(res.data.admins[0].academic_year || "");
      } catch {
        setLatestAcademicYear("");
      }
    }
    fetchAcademicYear();
  }, []);

  // Group by type
  const grouped = OFFICE_TYPES.map(type => ({
    type,
    records: officeSubmissions.filter(row => row.type === type)
  }));

  return (
    <div className="w-full max-w-6xl mx-auto p-0 md:p-8 bg-gradient-to-br from-green-50 to-emerald-50 min-h-screen">
      {/* Academic Year Badge */}
      <div className="flex justify-end mb-6">
        <AcademicYearBadge year={latestAcademicYear} />
      </div>
      <h2 className="text-3xl font-extrabold text-gray-800 mb-8">Office Submission</h2>
      {loading ? (
        <div className="text-center py-12 text-gray-500">Loading...</div>
      ) : (
        <>
          <div className="flex gap-4 mb-8">
            {OFFICE_TYPES.map(type => (
              <button
                key={type}
                className={`px-6 py-3 rounded-2xl font-semibold text-lg border-2 shadow transition-all ${
                  activeTab === type
                    ? "bg-green-600 text-white border-green-600 scale-105"
                    : "bg-white text-green-700 border-green-200 hover:bg-green-50"
                }`}
                onClick={() => setActiveTab(type)}
              >
                {type}
              </button>
            ))}
          </div>
          <div className="w-full">
            {grouped.filter(g => g.type === activeTab).map(group => (
              <div key={group.type} className="bg-white rounded-2xl shadow-xl p-8 border border-green-100 mb-8 w-full">
                <h3 className="text-xl font-bold text-green-700 mb-4">{group.type}</h3>
                <div className="overflow-x-auto">
                  <table className="min-w-full bg-white border-0 rounded-xl shadow overflow-hidden">
                    <thead className="bg-gradient-to-r from-green-600 to-emerald-600 text-white">
                      <tr>
                        <th className="p-4 text-left font-bold tracking-wide">Academic Year</th>
                        <th className="p-4 text-left font-bold tracking-wide">Status</th>
                        <th className="p-4 text-left font-bold tracking-wide">Submitted At</th>
                      </tr>
                    </thead>
                    <tbody className="divide-y divide-green-50">
                      {group.records.length > 0 ? group.records.map((row, idx) => (
                        <tr key={row.id || idx} className="hover:bg-gradient-to-r hover:from-green-50 hover:to-emerald-50 transition">
                          <td className="p-4 font-semibold text-green-900">{row.academic_year}</td>
                          <td className="p-4">{row.status}</td>
                          <td className="p-4">{row.submitted_at ? new Date(row.submitted_at).toLocaleString() : "-"}</td>
                        </tr>
                      )) : (
                        <tr>
                          <td colSpan={3} className="px-4 py-12 text-center text-gray-400 bg-gradient-to-r from-green-50 to-emerald-50">
                            <div className="flex flex-col items-center justify-center">
                              <svg className="w-12 h-12 text-gray-300 mb-2" fill="none" stroke="currentColor" strokeWidth="2" viewBox="0 0 24 24"><path strokeLinecap="round" strokeLinejoin="round" d="M9 17v-6a2 2 0 012-2h2a2 2 0 012 2v6m-6 4h6a2 2 0 002-2V7a2 2 0 00-2-2H7a2 2 0 00-2 2v12a2 2 0 002 2z" /></svg>
                              <p className="text-gray-600 font-medium">No submissions found</p>
                            </div>
                          </td>
                        </tr>
                      )}
                    </tbody>
                  </table>
                </div>
              </div>
            ))}
          </div>
        </>
      )}
    </div>
  );
};

export default OfficeSubmission;