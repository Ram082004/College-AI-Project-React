
import React, { useEffect, useState } from 'react';
import axios from 'axios';

const API = (deptId) => `http://localhost:5000/api/principle/department-details/${deptId}`;

export default function PrincipleDeptDetails({ deptId }) {
  const [enrollmentDetails, setEnrollmentDetails] = useState([]);
  const [examinationDetails, setExaminationDetails] = useState([]);
  const [loading, setLoading] = useState(true);
  const [degreeLevel, setDegreeLevel] = useState(null); // null means not selected yet
  const [activeTab, setActiveTab] = useState('enrollment'); // 'enrollment' or 'examination'

  useEffect(() => {
    axios.get(API(deptId))
      .then(res => {
        if (res.data.success) {
          setEnrollmentDetails(res.data.enrollmentDetails);
          setExaminationDetails(res.data.examinationDetails);
        }
        setLoading(false);
      })
      .catch(() => setLoading(false));
  }, [deptId]);


  if (loading) return (
    <div className="flex items-center justify-center h-40">
      <div className="animate-spin rounded-full h-12 w-12 border-t-4 border-b-4 border-teal-500"></div>
    </div>
  );

  // Helper to get counts for a degree level
  const getCounts = (details, level) => {
    return {
      male: details.filter(row => row.degree_level === level).reduce((sum, row) => sum + (parseInt(row.male_count) || 0), 0),
      female: details.filter(row => row.degree_level === level).reduce((sum, row) => sum + (parseInt(row.female_count) || 0), 0),
      transgender: details.filter(row => row.degree_level === level).reduce((sum, row) => sum + (parseInt(row.transgender_count) || 0), 0)
    };
  };

  // Top-level containers for UG/PG selection
  const levels = ['UG', 'PG'];
  const details = activeTab === 'enrollment' ? enrollmentDetails : examinationDetails;

  // Show year status for all possible years (even if no data)
  const yearSlots = {
    UG: ['I Year', 'II Year', 'III Year'],
    PG: ['I Year', 'II Year']
  };
  const filteredDetails = degreeLevel ? details.filter(row => row.degree_level === degreeLevel) : [];
  const possibleYears = degreeLevel ? yearSlots[degreeLevel] : [];
  const yearStatus = possibleYears.map(year => ({
    year,
    status: filteredDetails.some(row => row.year === year) ? 'Completed' : 'Incompleted'
  }));

  return (
    <div className="max-w-4xl mx-auto px-6 py-10">
      <h1 className="text-3xl font-extrabold mb-8 text-gradient bg-gradient-to-r from-teal-600 via-blue-500 to-purple-600 bg-clip-text text-transparent">Department Details</h1>
      <div className="flex gap-6 mb-8 justify-center">
        <button
          className={`px-6 py-3 rounded-2xl shadow-lg font-semibold text-lg transition-all duration-200 border-2 ${activeTab === 'enrollment' ? 'bg-blue-600 text-white border-blue-600 scale-105' : 'bg-white text-blue-600 border-blue-200 hover:bg-blue-50'}`}
          onClick={() => { setActiveTab('enrollment'); setDegreeLevel(null); }}
        >Student Enrollment</button>
        <button
          className={`px-6 py-3 rounded-2xl shadow-lg font-semibold text-lg transition-all duration-200 border-2 ${activeTab === 'examination' ? 'bg-teal-600 text-white border-teal-600 scale-105' : 'bg-white text-teal-600 border-teal-200 hover:bg-teal-50'}`}
          onClick={() => { setActiveTab('examination'); setDegreeLevel(null); }}
        >Student Examination</button>
      </div>

      {/* UG/PG Top Containers */}
      <div className="flex gap-8 justify-center mb-10">
        {levels.map(level => {
          const counts = getCounts(details, level);
          return (
            <div
              key={level}
              className={`cursor-pointer bg-gradient-to-br from-gray-50 via-${level === 'UG' ? 'blue' : 'teal'}-100 to-purple-100 rounded-3xl shadow-xl px-8 py-6 flex flex-col items-center border-2 transition-all duration-200 ${degreeLevel === level ? 'border-teal-600 scale-105' : 'border-gray-200 hover:scale-105'}`}
              onClick={() => setDegreeLevel(level)}
            >
              <h2 className={`text-2xl font-bold mb-2 ${level === 'UG' ? 'text-blue-700' : 'text-teal-700'}`}>{level}</h2>
              <div className="flex gap-6 mt-2">
                <div className="flex flex-col items-center">
                  <span className="text-lg font-bold text-blue-600">{counts.male}</span>
                  <span className="text-xs text-gray-500">Male</span>
                </div>
                <div className="flex flex-col items-center">
                  <span className="text-lg font-bold text-pink-600">{counts.female}</span>
                  <span className="text-xs text-gray-500">Female</span>
                </div>
                <div className="flex flex-col items-center">
                  <span className="text-lg font-bold text-purple-600">{counts.transgender}</span>
                  <span className="text-xs text-gray-500">Transgender</span>
                </div>
              </div>
            </div>
          );
        })}
      </div>

      {/* Details for selected degree level */}
      {degreeLevel && (
        <div className="bg-white rounded-3xl shadow-2xl p-8 mb-8 border-t-4 border-teal-500">
          <h2 className="text-xl font-bold mb-4 text-teal-700">{degreeLevel} Details</h2>
          <div className="flex gap-8 mb-6 justify-center">
            <div className="flex flex-col items-center">
              <span className="text-2xl font-extrabold text-blue-700">{getCounts(details, degreeLevel).male}</span>
              <span className="text-sm text-gray-500">Male</span>
            </div>
            <div className="flex flex-col items-center">
              <span className="text-2xl font-extrabold text-pink-700">{getCounts(details, degreeLevel).female}</span>
              <span className="text-sm text-gray-500">Female</span>
            </div>
            <div className="flex flex-col items-center">
              <span className="text-2xl font-extrabold text-purple-700">{getCounts(details, degreeLevel).transgender}</span>
              <span className="text-sm text-gray-500">Transgender</span>
            </div>
          </div>
          <div className="mb-4">
            <h3 className="font-semibold mb-2 text-gray-700">Year Completion Status</h3>
            <table className="w-full border mb-4 rounded-xl overflow-hidden">
              <thead className="bg-gray-100">
                <tr>
                  <th className="py-2 px-4 text-left">Year</th>
                  <th className="py-2 px-4 text-left">Status</th>
                </tr>
              </thead>
              <tbody>
                {yearStatus.length > 0 ? yearStatus.map((row, i) => (
                  <tr key={i} className="border-b">
                    <td className="py-2 px-4">{row.year}</td>
                    <td className={row.status === 'Completed' ? 'text-green-600 font-bold' : 'text-red-600 font-bold'}>{row.status}</td>
                  </tr>
                )) : (
                  <tr>
                    <td colSpan="2" className="text-center text-gray-400 py-6">No year data found</td>
                  </tr>
                )}
              </tbody>
            </table>
          </div>
        </div>
      )}
    </div>
  );
}