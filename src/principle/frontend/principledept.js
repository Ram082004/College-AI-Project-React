import React, { useEffect, useState } from 'react';
import axios from 'axios';
import AcademicYearBadge from '../../Admin-Frontend/components/AcademicYearBadge';

const DEPT_LIST_API = 'https://admin-back-j3j4.onrender.com/api/principle/departments-list';
const DEPT_DETAILS_API = deptId => `https://admin-back-j3j4.onrender.com/api/principle/department-details/${deptId}`;

const yearSlots = {
  UG: ['I Year', 'II Year', 'III Year'],
  PG: ['I Year', 'II Year']
};

function DepartmentDetailsModel({ deptId }) {
  const [enrollmentDetails, setEnrollmentDetails] = useState([]);
  const [examinationDetails, setExaminationDetails] = useState([]);
  const [loading, setLoading] = useState(true);
  const [activeTab, setActiveTab] = useState('enrollment');
  const [degreeLevel, setDegreeLevel] = useState('UG');
  const [academicYear, setAcademicYear] = useState('');
  const [currentYearSlot, setCurrentYearSlot] = useState(0);
  const [examResultType, setExamResultType] = useState('Student Appeared');
  const [allowedDegreeLevels, setAllowedDegreeLevels] = useState(['UG', 'PG']);

  const subcategories = ['PwBD', 'Muslim Minority', 'Other Minority'];
  const categories = [
    'General Including EWS',
    'Scheduled Caste (SC)',
    'Scheduled Tribe (ST)',
    'Other Backward Classes (OBC)'
  ];
  const genders = ['Male', 'Female', 'Transgender'];

  // breakdown modal state
  const [editingSubcategory, setEditingSubcategory] = useState(null);

  useEffect(() => {
    setLoading(true);
    axios.get(DEPT_DETAILS_API(deptId), { headers: { Authorization: `Bearer ${localStorage.getItem('authToken')}` } })
      .then(res => {
        if (res.data.success) {
          setEnrollmentDetails(res.data.enrollmentDetails || []);
          setExaminationDetails(res.data.examinationDetails || []);
          setAcademicYear(res.data.academic_year || '');
          setAllowedDegreeLevels(res.data.degree_levels || ['UG','PG']);
          setDegreeLevel((res.data.degree_levels && res.data.degree_levels[0]) || 'UG');
        } else {
          setEnrollmentDetails([]);
          setExaminationDetails([]);
        }
      })
      .catch(() => {
        setEnrollmentDetails([]);
        setExaminationDetails([]);
      })
      .finally(() => setLoading(false));
  }, [deptId]);

  const getYearSlotsForLevel = () => (degreeLevel === 'UG' ? yearSlots.UG : yearSlots.PG);
  const getExamYearSlot = () => (degreeLevel === 'UG' ? 'III Year' : 'II Year');
  const norm = v => (v === null || v === undefined) ? '' : String(v).trim().toLowerCase();

  const filteredDetails = (activeTab === 'enrollment' ? enrollmentDetails : examinationDetails)
    .filter(row => {
      if (!row) return false;
      if (row.degree_level && norm(row.degree_level) !== norm(degreeLevel)) return false;
      if (row.academic_year && academicYear && norm(row.academic_year) !== norm(academicYear)) return false;
      if (activeTab === 'enrollment') {
        const slots = getYearSlotsForLevel();
        const selectedSlot = slots[currentYearSlot] || slots[0];
        if (row.year && norm(row.year) !== norm(selectedSlot)) return false;
      } else {
        const examSlot = getExamYearSlot();
        if (row.year && norm(row.year) !== norm(examSlot)) return false;
        if (examResultType && row.result_type && norm(row.result_type) !== norm(examResultType)) return false;
      }
      return true;
    });

  function getSummaryData() {
    const summary = {};
    subcategories.forEach(sub => summary[sub] = { male: 0, female: 0, transgender: 0 });

    filteredDetails.forEach(row => {
      const subName = row.subcategory || row.sub_category || row.subcategory_name || row.sub_name || row.sub || 'Unknown';
      if (!summary[subName]) summary[subName] = { male: 0, female: 0, transgender: 0 };

      const maleVal = Number(row.male ?? row.male_count ?? row.male_students ?? 0) || 0;
      const femaleVal = Number(row.female ?? row.female_count ?? row.female_students ?? 0) || 0;
      const transVal = Number(row.transgender ?? row.transgender_count ?? row.transgender_students ?? 0) || 0;

      if (maleVal || femaleVal || transVal) {
        summary[subName].male += maleVal;
        summary[subName].female += femaleVal;
        summary[subName].transgender += transVal;
      } else {
        const count = Number(row.count ?? row.total ?? 0) || 0;
        const g = norm(row.gender ?? row.sex ?? '');
        if (count > 0 && g) {
          if (g.includes('male')) summary[subName].male += count;
          else if (g.includes('female')) summary[subName].female += count;
          else summary[subName].transgender += count;
        }
      }
    });

    return summary;
  }

  function getSubcategoryBreakdown(subcategory) {
    const breakdownRows = (activeTab === 'enrollment' ? enrollmentDetails : examinationDetails).filter(row => {
      const s = row.subcategory || row.sub_category || row.subcategory_name || row.sub_name || row.sub || '';
      return norm(s) === norm(subcategory) &&
        (!row.degree_level || norm(row.degree_level) === norm(degreeLevel)) &&
        (!row.academic_year || !academicYear || norm(row.academic_year) === norm(academicYear)) &&
        (activeTab === 'enrollment' ? (!row.year || norm(row.year) === norm(getYearSlotsForLevel()[currentYearSlot])) : (!row.year || norm(row.year) === norm(getExamYearSlot()) && (!row.result_type || norm(row.result_type) === norm(examResultType))));
    });

    return categories.map(category => {
      let male = 0, female = 0, transgender = 0;
      breakdownRows.forEach(row => {
        const catName = row.category || row.category_name || '';
        if (norm(catName) !== norm(category)) return;
        male += Number(row.male ?? row.male_count ?? 0) || 0;
        female += Number(row.female ?? row.female_count ?? 0) || 0;
        transgender += Number(row.transgender ?? row.transgender_count ?? 0) || 0;
      });
      return { category, male, female, transgender };
    });
  }

  if (loading) return (
    <div className="flex items-center justify-center h-40">
      <div className="animate-spin rounded-full h-12 w-12 border-t-4 border-b-4 border-teal-500"></div>
    </div>
  );

  const summaryData = getSummaryData();

  return (
    <div className="max-w-4xl mx-auto px-6 py-10">
      <h1 className="text-2xl font-extrabold mb-6 text-gradient bg-gradient-to-r from-teal-600 via-blue-500 to-purple-600 bg-clip-text text-transparent">Department Details</h1>

      <div className="mb-8 flex justify-center">
        <AcademicYearBadge year={academicYear} />
      </div>

      <div className="flex gap-6 mb-8 justify-center">
        <button
          className={`px-6 py-3 rounded-2xl shadow-lg font-semibold text-lg transition-all duration-200 border-2 ${activeTab === 'enrollment' ? 'bg-blue-600 text-white border-blue-600 scale-105' : 'bg-white text-blue-600 border-blue-200 hover:bg-blue-50'}`}
          onClick={() => setActiveTab('enrollment')}
        >Student Enrollment</button>
        <button
          className={`px-6 py-3 rounded-2xl shadow-lg font-semibold text-lg transition-all duration-200 border-2 ${activeTab === 'examination' ? 'bg-teal-600 text-white border-teal-600 scale-105' : 'bg-white text-teal-600 border-teal-200 hover:bg-teal-50'}`}
          onClick={() => setActiveTab('examination')}
        >Student Examination</button>
      </div>

      {/* Year slot / result-type controls */}
      <div className="flex gap-6 mb-6 justify-center">
        {activeTab === 'enrollment' && (
          <div className="flex items-center gap-3">
            <div className="flex space-x-2">
              {getYearSlotsForLevel().map((slot, idx) => (
                <button
                  key={slot}
                  className={`px-6 py-2 rounded-lg font-semibold transition-colors border-2 ${currentYearSlot === idx ? 'bg-blue-600 text-white border-blue-600 shadow' : 'bg-white text-blue-700 border-blue-200 hover:bg-blue-50'}`}
                  onClick={() => setCurrentYearSlot(idx)}
                >
                  {slot}
                </button>
              ))}
            </div>
          </div>
        )}
        {activeTab === 'examination' && (
          <div className="flex items-center gap-3">
            <div className="flex space-x-2">
              {['Student Appeared', 'Student Passed Out', 'Student Above 60%'].map(type => (
                <button
                  key={type}
                  className={`px-6 py-2 rounded-lg font-semibold transition-colors border-2 ${examResultType === type ? 'bg-teal-600 text-white border-teal-600 shadow' : 'bg-white text-teal-700 border-teal-200 hover:bg-teal-50'}`}
                  onClick={() => setExamResultType(type)}
                >
                  {type}
                </button>
              ))}
            </div>
          </div>
        )}
      </div>

      {/* Summary Cards */}
      <div className="grid grid-cols-1 md:grid-cols-3 gap-8">
        {subcategories.map(subcategory => (
          <div key={subcategory} className="bg-white rounded-2xl shadow-lg border border-gray-100 p-6 cursor-pointer hover:shadow-xl transition" onClick={() => setEditingSubcategory(subcategory)}>
            <h4 className="font-bold text-lg text-blue-800 mb-4">{subcategory}</h4>
            <div className="flex justify-around text-center">
              <div>
                <p className="text-2xl font-bold text-blue-600">{(summaryData[subcategory] && summaryData[subcategory].male) || 0}</p>
                <p className="text-sm text-gray-500">Male</p>
              </div>
              <div>
                <p className="text-2xl font-bold text-pink-600">{(summaryData[subcategory] && summaryData[subcategory].female) || 0}</p>
                <p className="text-sm text-gray-500">Female</p>
              </div>
              <div>
                <p className="text-2xl font-bold text-purple-600">{(summaryData[subcategory] && summaryData[subcategory].transgender) || 0}</p>
                <p className="text-sm text-gray-500">Transgender</p>
              </div>
            </div>
          </div>
        ))}
      </div>

      {/* Modal for subcategory breakdown */}
      {editingSubcategory && (
        <div className="fixed inset-0 flex items-center justify-center z-50 bg-black/40 backdrop-blur-sm" onClick={() => setEditingSubcategory(null)}>
          <div className="bg-white/80 backdrop-blur-xl rounded-3xl shadow-2xl p-0 max-w-xl w-full mx-4 border border-blue-100 relative" onClick={e => e.stopPropagation()}>
            <div className="flex items-center justify-between px-8 py-6 bg-gradient-to-r from-blue-600 to-indigo-600 rounded-t-3xl">
              <div className="flex items-center gap-3">
                <span className="text-3xl text-white">📊</span>
                <h3 className="text-xl font-bold text-white">
                  {editingSubcategory} - {degreeLevel} Breakdown
                  <div className="text-sm font-normal text-white/80">{activeTab === 'enrollment' ? getYearSlotsForLevel()[currentYearSlot] : examResultType}</div>
                </h3>
              </div>
              <button className="text-white text-2xl hover:text-blue-200 transition" onClick={() => setEditingSubcategory(null)} title="Close">&times;</button>
            </div>

            <div className="px-8 py-6">
              <table className="min-w-full text-base rounded-xl overflow-hidden shadow bg-white/90">
                <thead>
                  <tr className="bg-gradient-to-r from-blue-100 to-indigo-100">
                    <th className="px-4 py-2 text-left font-bold">Category</th>
                    <th className="px-4 py-2 font-bold text-blue-700">Male</th>
                    <th className="px-4 py-2 font-bold text-pink-700">Female</th>
                    <th className="px-4 py-2 font-bold text-purple-700">Transgender</th>
                  </tr>
                </thead>
                <tbody>
                  {(() => {
                    const rows = getSubcategoryBreakdown(editingSubcategory);
                    const hasData = rows.some(r => Number(r.male) > 0 || Number(r.female) > 0 || Number(r.transgender) > 0);
                    if (!hasData) {
                      return (
                        <tr>
                          <td colSpan={4} className="py-8 text-center text-gray-400">
                            <span className="mx-auto text-4xl mb-2 text-blue-200">📊</span>
                            <span>No data available for this subcategory and selection.</span>
                          </td>
                        </tr>
                      );
                    }
                    return rows.map(row => (
                      <tr key={row.category} className="hover:bg-blue-50 transition">
                        <td className="px-4 py-2 font-semibold">{row.category}</td>
                        <td className="px-4 py-2 text-blue-700 font-bold">{row.male}</td>
                        <td className="px-4 py-2 text-pink-700 font-bold">{row.female}</td>
                        <td className="px-4 py-2 text-purple-700 font-bold">{row.transgender}</td>
                      </tr>
                    ));
                  })()}
                </tbody>
              </table>
            </div>

            <div className="px-8 pb-6">
              <button className="w-full py-2 bg-gradient-to-r from-blue-100 to-indigo-100 text-blue-700 rounded-lg font-semibold hover:bg-blue-200 transition" onClick={() => setEditingSubcategory(null)}>Close</button>
            </div>
          </div>
        </div>
      )}
    </div>
  );
}

export default function PrincipleDeptDetails() {
  const [departments, setDepartments] = useState([]);
  const [selectedDept, setSelectedDept] = useState(null);

  useEffect(() => {
    axios.get(DEPT_LIST_API, {
      headers: { Authorization: `Bearer ${localStorage.getItem('authToken')}` }
    })
      .then(res => setDepartments(res.data.departments || []))
      .catch(() => setDepartments([]));
  }, []);

  const deptCards = Array.from(new Set(departments.map(d => JSON.stringify({ id: d.dept_id, name: d.department })))).map(s => JSON.parse(s)).filter(d => d.name);

  return (
    <div className="max-w-5xl mx-auto px-6 py-10">
      <h1 className="text-3xl font-extrabold mb-8 text-gradient bg-gradient-to-r from-teal-600 via-blue-500 to-purple-600 bg-clip-text text-transparent">Department Details</h1>
      <div className="grid grid-cols-1 sm:grid-cols-2 md:grid-cols-3 gap-8 mb-10">
        {deptCards.length === 0 ? (
          <div className="col-span-full text-center text-gray-400 py-8">No departments found.</div>
        ) : (
          deptCards.map(dept => (
            <button key={dept.id} className={`relative bg-gradient-to-br from-white via-blue-50 to-teal-50 p-6 rounded-3xl shadow-xl border-2 flex flex-col items-center cursor-pointer transition-all duration-200`} onClick={() => setSelectedDept(dept)}>
              <span className="block text-xs uppercase tracking-widest text-teal-500 font-bold mb-1">Department</span>
              <h2 className="text-lg font-extrabold text-gray-800 mb-1 text-center">{dept.name}</h2>
            </button>
          ))
        )}
      </div>

      {selectedDept && <DepartmentDetailsModel deptId={selectedDept.id} />}
    </div>
  );
}