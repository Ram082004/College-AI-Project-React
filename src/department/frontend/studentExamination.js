import React, { useState, useEffect } from 'react';
import { motion } from 'framer-motion';
import { RiInformationLine, RiBarChartBoxLine, RiCheckboxCircleLine } from 'react-icons/ri';
import axios from 'axios';

const API_BASE = 'http://localhost:5000/api';
const API = {
  EXAMINATION: `${API_BASE}/examination-summary`,
  student_examination: (deptId) => `${API_BASE}/student-examination/department/${deptId}`,
  academic_years: (deptId) => `${API_BASE}/department-user/academic-year/${deptId}`,
  hod_name: (deptId) => `${API_BASE}/department-user/hod/${deptId}`, // <-- Add this line
};

const categoryMaster = {
  1: 'General Including EWS',
  2: 'Scheduled Caste (SC)',
  3: 'Scheduled Tribe (ST)',
  4: 'Other Backward Classes (OBC)'
};

const subcategoryMaster = {
  5: 'PwBD',
  6: 'Muslim Minority',
  7: 'Other Minority'
};

const genderMaster = {
  1: 'Male',
  2: 'Female',
  3: 'Transgender'
};

const resultTypes = [
  'Student Appeared',
  'Student Passed',
  'Student Above 60%'
];

const categories = Object.values(categoryMaster);
const subcategories = Object.values(subcategoryMaster);
const genders = Object.values(genderMaster);

const categoryInfo = {
  'General Including EWS': 'Students from General category including Economically Weaker Sections',
  'Scheduled Caste (SC)': 'Students belonging to Scheduled Castes as per government classification',
  'Scheduled Tribe (ST)': 'Students belonging to Scheduled Tribes as per government classification',
  'Other Backward Classes (OBC)': 'Other Backward Classes includes BC/EBC/MBC categories'
};

const subcategoryInfo = {
  'PwBD': 'Person with Benchmark Disability - Includes students with disabilities as defined under the Rights of Persons with Disabilities Act, 2016',
  'Muslim Minority': 'Students belonging to Muslim minority community',
  'Other Minority': 'Students belonging to other minority communities including Sikh, Christian, Buddhist, Parsi and Jain'
};

export default function StudentExamination({ userData, yearSlots }) {
  const [academicYears, setAcademicYears] = useState([]);
  const [currentYearSlot, setCurrentYearSlot] = useState(0);
  const [resultType, setResultType] = useState(resultTypes[0]);
  const [examinationData, setExaminationData] = useState(() => {
    const data = {};
    subcategories.forEach(sub => {
      data[sub] = {};
      categories.forEach(cat => {
        data[sub][cat] = { Male: 0, Female: 0, Transgender: 0 };
      });
    });
    return data;
  });
  const [examinationDetails, setExaminationDetails] = useState([]);
  const [submitting, setSubmitting] = useState(false);
  const [showCategoryInfo, setShowCategoryInfo] = useState(false);
  const [showSubcategoryInfo, setShowSubcategoryInfo] = useState(false);
  const [globalMessage, setGlobalMessage] = useState(null);
  const [showConfirm, setShowConfirm] = useState(false);
  const [showDeclaration, setShowDeclaration] = useState(false);
  const [finalSubmitting, setFinalSubmitting] = useState(false);
  const [finalSubmitSuccess, setFinalSubmitSuccess] = useState(false);
  const [yearStatuses, setYearStatuses] = useState({});
  const [statusAcademicYear, setStatusAcademicYear] = useState('');
  const [declarationYearSlot, setDeclarationYearSlot] = useState(null);
  const [hodName, setHodName] = useState(''); // <-- Add this line

  useEffect(() => {
    if (!userData?.dept_id) return;
    fetchAcademicYears();
    fetchExaminationDetails();
    fetchYearStatuses();
    fetchHodName(); // <-- Add this line
    // eslint-disable-next-line
  }, [userData]);

  const fetchAcademicYears = async () => {
    try {
      const res = await axios.get(
        API.academic_years(userData.dept_id),
        { headers: { Authorization: `Bearer ${localStorage.getItem('authToken')}` } }
      );
      if (res.data.success) setAcademicYears(res.data.years);
      else setAcademicYears([]);
    } catch {
      setAcademicYears([]);
    }
  };

  const fetchExaminationDetails = async () => {
    try {
      const res = await axios.get(API.student_examination(userData.dept_id), {
        headers: { Authorization: `Bearer ${localStorage.getItem('authToken')}` }
      });
      if (res.data.success) setExaminationDetails(res.data.details);
      else setExaminationDetails([]);
    } catch {
      setExaminationDetails([]);
    }
  };

  // Fetch year statuses for all slots
  const fetchYearStatuses = async () => {
    try {
      const yearsParam = encodeURIComponent(yearSlots.join(','));
      const res = await axios.get(
        `http://localhost:5000/api/student-enrollment/year-statuses/${userData.dept_id}?years=${yearsParam}`,
        { headers: { Authorization: `Bearer ${localStorage.getItem('authToken')}` } }
      );
      if (res.data.success) {
        setYearStatuses(res.data.statuses || {});
        setStatusAcademicYear(res.data.academicYear || '');
      } else {
        setYearStatuses({});
        setStatusAcademicYear('');
      }
    } catch {
      setYearStatuses({});
      setStatusAcademicYear('');
    }
  };

  // Fetch HOD name
  const fetchHodName = async () => {
    try {
      const res = await axios.get(
        API.hod_name(userData.dept_id),
        { headers: { Authorization: `Bearer ${localStorage.getItem('authToken')}` } }
      );
      if (res.data.success && res.data.hod_name) setHodName(res.data.hod_name);
      else setHodName('');
    } catch {
      setHodName('');
    }
  };

  // Helper to check if all years are finished
  const isAllYearsFinished = () => {
    const normalizeYear = (year) => year.trim().replace(/\s+/g, ' ').toLowerCase();
    return yearSlots.every((slot) => yearStatuses[normalizeYear(slot)] === 'finished');
  };


  const getAllFinishedYears = () => {
    const normalizeYear = (year) => year.trim().replace(/\s+/g, ' ').toLowerCase();
    return yearSlots.filter((slot) => yearStatuses[normalizeYear(slot)] === 'finished');
  };

  const handleExaminationSubmit = async (e) => {
    if (e && e.preventDefault) e.preventDefault();
    setSubmitting(true);
    try {
      const selectedAcademicYear = academicYears[0];
      if (!selectedAcademicYear) {
        setGlobalMessage({ type: 'error', text: 'Academic year not found' });
        setSubmitting(false);
        return;
      }

      const examinationRecords = [];
      Object.entries(subcategoryMaster).forEach(([subcatId, subcatName]) => {
        Object.entries(categoryMaster).forEach(([catId, catName]) => {
          Object.entries(genderMaster).forEach(([genderId, genderName]) => {
            const count = examinationData[subcatName][catName][genderName];
            if (count > 0) {
              examinationRecords.push({
                academic_year: selectedAcademicYear,
                dept_id: userData?.dept_id,
                category_id: parseInt(catId),
                subcategory_id: parseInt(subcatId),
                gender_id: parseInt(genderId),
                count: parseInt(count),
                year: yearSlots[currentYearSlot],
                result_type: resultType
              });
            }
          });
        });
      });

      const response = await axios.post(
        API.EXAMINATION,
        { records: examinationRecords },
        {
          headers: {
            'Authorization': `Bearer ${localStorage.getItem('authToken')}`,
            'Content-Type': 'application/json'
          }
        }
      );

      if (response.data.success) {
        setGlobalMessage({ type: 'success', text: 'Examination data added successfully' });
        setExaminationData(() => {
          const data = {};
          subcategories.forEach(sub => {
            data[sub] = {};
            categories.forEach(cat => {
              data[sub][cat] = { Male: 0, Female: 0, Transgender: 0 };
            });
          });
          return data;
        });
        fetchExaminationDetails();
        if (currentYearSlot < yearSlots.length - 1) {
          setCurrentYearSlot(currentYearSlot + 1);
        }
      }
    } catch (error) {
      setGlobalMessage({ type: 'error', text: error.response?.data?.message || 'Failed to add examination data' });
    } finally {
      setSubmitting(false);
      setTimeout(() => setGlobalMessage(null), 3000);
    }
  };

  // Updated examination status update function
  const updateExaminationStatus = async (status) => {
    try {
      const response = await axios.post(
        'http://localhost:5000/api/student-examination/update-status',
        {
          dept_id: userData?.dept_id,
          year: yearSlots[currentYearSlot],
          status
        },
        { headers: { Authorization: `Bearer ${localStorage.getItem('authToken')}` } }
      );
      
      if (response.data.success) {
        setGlobalMessage({ type: 'success', text: `Status updated to ${status}` });
        // Refresh examination details after status update
        fetchExaminationDetails();
      } else {
        setGlobalMessage({ type: 'error', text: response.data.message || 'Failed to update status' });
      }
    } catch (err) {
      setGlobalMessage({ type: 'error', text: err.response?.data?.message || 'Failed to update status' });
    }
  };

  // Updated examination declaration submit function
  const handleFinalDeclarationSubmit = async () => {
    setFinalSubmitting(true);
    try {
      await axios.post(
        'http://localhost:5000/api/student-examination/submit-declaration',
        {
          dept_id: userData?.dept_id,
          name: userData?.name || userData?.username,
          department: userData?.department,
          year: Array.isArray(declarationYearSlot) ? declarationYearSlot.join(', ') : declarationYearSlot,
          type: 'Student Examination'
        },
        { headers: { Authorization: `Bearer ${localStorage.getItem('authToken')}` } }
      );
      setFinalSubmitSuccess(true);
      setTimeout(() => {
        setShowDeclaration(false);
        setFinalSubmitSuccess(false);
        setDeclarationYearSlot(null);
      }, 2000);
    } catch (err) {
      setGlobalMessage({ type: 'error', text: 'Failed to submit declaration' });
    } finally {
      setFinalSubmitting(false);
    }
  };

  return (
    <>
      <div className="space-y-8">
        {/* Header */}
        <div className="flex items-center justify-between">
          <div>
            <h3 className="text-2xl font-bold text-gray-900">Add Examination Data</h3>
            <p className="text-sm text-gray-500 mt-1">Enter examination count by category and gender</p>
          </div>
          <span className="px-4 py-2 bg-gradient-to-r from-blue-600 to-indigo-600 text-white rounded-xl text-sm font-medium shadow-md">
            {userData?.department}
          </span>
        </div>

        {/* Global Message */}
        {globalMessage && (
          <motion.div
            initial={{ opacity: 0, y: 10 }}
            animate={{ opacity: 1, y: 0 }}
            exit={{ opacity: 0, y: 10 }}
            className={`mb-4 px-4 py-2 rounded-lg text-white ${
              globalMessage.type === 'success' ? 'bg-green-500' : 'bg-red-500'
            }`}
          >
            {globalMessage.text}
          </motion.div>
        )}

        {/* Form */}
        <form onSubmit={handleExaminationSubmit} className="space-y-8">
          {/* Academic Year, Year Slot, and Result Type Side by Side */}
          <div className="flex flex-wrap gap-6 items-end">
            {/* Academic Year Display */}
            <div className="flex-1 min-w-[180px] max-w-xs">
              <label className="block text-sm font-semibold text-gray-700 mb-2">
                Academic Year *
              </label>
              <div className="w-full px-5 py-3 rounded-xl border border-gray-200 bg-gray-100 shadow-sm text-gray-700">
                {academicYears[0] || 'N/A'}
              </div>
            </div>
            {/* Year Slot Selector */}
            <div className="flex-1 min-w-[180px] max-w-xs">
              <label className="block text-sm font-semibold text-gray-700 mb-2">
                Year Slot
              </label>
              <select
                value={yearSlots[currentYearSlot]}
                onChange={e => setCurrentYearSlot(yearSlots.indexOf(e.target.value))}
                className="w-full px-4 py-2 border rounded-lg bg-white"
              >
                {yearSlots.map((slot) => (
                  <option key={slot} value={slot}>{slot}</option>
                ))}
              </select>
            </div>
            {/* Result Type Selector */}
            <div className="flex-1 min-w-[180px] max-w-xs">
              <label className="block text-sm font-semibold text-gray-700 mb-2">
                Result Type *
              </label>
              <select
                value={resultType}
                onChange={e => setResultType(e.target.value)}
                className="w-full px-4 py-2 border rounded-lg bg-white"
              >
                {resultTypes.map((type) => (
                  <option key={type} value={type}>{type}</option>
                ))}
              </select>
            </div>
            {/* Info Buttons (only once, at the top right) */}
            <div className="flex-1 flex gap-2 justify-end items-end">
              <button
                type="button"
                onClick={() => setShowCategoryInfo(true)}
                className="p-2 bg-blue-50 hover:bg-blue-100 rounded-lg transition-colors flex items-center gap-1"
                title="Category Info"
              >
                <RiInformationLine className="text-xl text-blue-700" />
                <span className="text-xs text-blue-700">Category Info</span>
              </button>
              <button
                type="button"
                onClick={() => setShowSubcategoryInfo(true)}
                className="p-2 bg-blue-50 hover:bg-blue-100 rounded-lg transition-colors flex items-center gap-1"
                title="Subcategory Info"
              >
                <RiInformationLine className="text-xl text-blue-700" />
                <span className="text-xs text-blue-700">Subcategory Info</span>
              </button>
            </div>
          </div>

          {/* Year Completion Status - move here */}
          <div className="mb-8">
            <div className="bg-gradient-to-r from-blue-50 to-indigo-50 rounded-2xl shadow p-6">
              <div className="flex items-center justify-between mb-4">
                <span className="text-lg font-bold text-gray-800 flex items-center gap-2">
                  <RiCheckboxCircleLine className="text-blue-600" />
                  Year Completion Status
                </span>
                <span className="text-sm text-blue-500 font-medium">
                  Academic Year: <span className="font-semibold">{statusAcademicYear || 'N/A'}</span>
                </span>
              </div>
              <div className="grid grid-cols-1 sm:grid-cols-2 md:grid-cols-3 gap-4">
                {yearSlots.map((slot, idx) => {
                  const normalizeYear = (year) => year.trim().replace(/\s+/g, ' ').toLowerCase();
                  const status = yearStatuses[normalizeYear(slot)];
                  const isFinished = status === 'finished';
                  return (
                    <div
                      key={slot}
                      className={`flex items-center gap-3 px-5 py-4 rounded-xl border transition-all duration-200 shadow-sm
                        ${isFinished
                          ? 'bg-green-50 border-green-200'
                          : 'bg-yellow-50 border-yellow-200'
                        }`}
                    >
                      <div className={`flex items-center justify-center w-10 h-10 rounded-full
                        ${isFinished ? 'bg-green-100' : 'bg-yellow-100'}`}>
                        {isFinished ? (
                          <RiCheckboxCircleLine className="text-2xl text-green-600" />
                        ) : (
                          <RiBarChartBoxLine className="text-2xl text-yellow-500" />
                        )}
                      </div>
                      <div className="flex-1">
                        <div className="text-base font-semibold text-gray-800">{slot}</div>
                        <div className={`mt-1 inline-block px-3 py-1 rounded-full text-xs font-bold
                          ${isFinished
                            ? 'bg-green-200 text-green-800'
                            : 'bg-yellow-200 text-yellow-800'
                          }`}
                        >
                          {isFinished ? 'Completed' : 'Incomplete'}
                        </div>
                      </div>
                    </div>
                  );
                })}
              </div>
              {/* Show Final Declaration Button if all years are finished */}
              {isAllYearsFinished() && (
                <div className="flex justify-end mt-6">
                  <button
                    className="px-6 py-3 rounded-xl bg-gradient-to-r from-blue-600 to-indigo-600 text-white font-semibold shadow hover:from-blue-700 hover:to-indigo-700 transition"
                    onClick={() => {
                      setDeclarationYearSlot(getAllFinishedYears());
                      setShowDeclaration(true);
                    }}
                  >
                    Final Submission
                  </button>
                </div>
              )}
            </div>
          </div>

          {/* Categories Grid */}
          <div className="grid grid-cols-1 gap-6">
            {subcategories.map((subcategory) => (
              <div key={subcategory}
                className="bg-white rounded-xl shadow-sm overflow-hidden border border-gray-100 hover:shadow-md transition-all duration-300">
                <div className="bg-gradient-to-r from-[#07294d] to-[#104c8c] text-white px-6 py-4 flex items-center">
                  <h4 className="font-semibold text-lg">{subcategory}</h4>
                </div>
                <div className="p-6 space-y-6">
                  {categories.map((category) => (
                    <div key={category}
                      className="group bg-gray-50 hover:bg-blue-50/50 rounded-xl p-5 transition-all duration-200">
                      <div className="flex items-center justify-between mb-4">
                        <h5 className="font-semibold text-gray-800 group-hover:text-blue-700 transition-colors">
                          {category}
                        </h5>
                      </div>
                      <div className="grid grid-cols-3 gap-4">
                        {genders.map((gender) => (
                          <div key={gender} className="space-y-2">
                            <label className="block text-sm font-medium text-gray-600">
                              {gender}
                            </label>
                            <input
                              type="number"
                              min="0"
                              value={examinationData[subcategory][category][gender]}
                              onChange={(e) => {
                                let value = parseInt(e.target.value, 10);
                                if (isNaN(value) || value < 0) value = 0;
                                setExaminationData(prev => ({
                                  ...prev,
                                  [subcategory]: {
                                    ...prev[subcategory],
                                    [category]: {
                                      ...prev[subcategory][category],
                                      [gender]: value
                                    }
                                  }
                                }));
                              }}
                              className="w-full px-4 py-2.5 rounded-lg border border-gray-200 
                                focus:ring-2 focus:ring-blue-500 focus:border-transparent
                                bg-white shadow-sm transition-all duration-200
                                hover:shadow group-hover:border-blue-200"
                            />
                          </div>
                        ))}
                      </div>
                    </div>
                  ))}
                </div>
              </div>
            ))}
          </div>

          {/* Submit Button */}
          <button
            type="button"
            disabled={submitting}
            onClick={() => setShowConfirm(true)}
            className={`w-full max-w-md mx-auto py-4 px-6 rounded-xl font-semibold text-white text-lg
              shadow-lg shadow-blue-500/20 
              ${submitting 
                ? 'bg-gray-400 cursor-not-allowed' 
                : 'bg-gradient-to-r from-blue-600 to-indigo-600 hover:from-blue-700 hover:to-indigo-700'
              }
              transform transition-all duration-200 hover:-translate-y-0.5`}
          >
            {submitting ? (
              <div className="flex items-center justify-center space-x-2">
                <div className="animate-spin rounded-full h-5 w-5 border-2 border-white border-t-transparent"/>
                <span>Submitting...</span>
              </div>
            ) : (
              'Submit Examination Data'
            )}
          </button>
        </form>
      </div>

      {/* Examination Details Table */}
      <div className="mt-8">
        <div className="flex items-center justify-between mb-6">
          <h3 className="text-lg font-semibold text-gray-900">Examination Records</h3>
          <div className="flex items-center gap-2">
            <span className="text-sm text-gray-500">Total Records: {examinationDetails.length}</span>
          </div>
        </div>
        <div className="table-container rounded-2xl shadow-lg border border-gray-100 overflow-x-auto">
          <table className="data-table min-w-full text-sm text-gray-700">
            <thead className="table-header bg-gradient-to-r from-blue-50 to-indigo-50">
              <tr>
                <th className="px-6 py-4 font-bold tracking-wider text-blue-700">Academic Year</th>
                <th className="px-6 py-4 font-bold tracking-wider text-blue-700">Year</th>
                <th className="px-6 py-4 font-bold tracking-wider text-blue-700">Result Type</th>
                <th className="px-6 py-4 font-bold tracking-wider text-blue-700">Category</th>
                <th className="px-6 py-4 font-bold tracking-wider text-blue-700">Subcategory</th>
                <th className="px-6 py-4 font-bold tracking-wider text-blue-700">Male</th>
                <th className="px-6 py-4 font-bold tracking-wider text-blue-700">Female</th>
                <th className="px-6 py-4 font-bold tracking-wider text-blue-700">Transgender</th>
              </tr>
            </thead>
            <tbody>
              {examinationDetails.length > 0 ? (
                examinationDetails.map((detail, index) => (
                  <tr key={index} className="hover:bg-gradient-to-r hover:from-blue-50 hover:to-indigo-50 transition">
                    <td className="px-6 py-4 font-medium">{detail.academic_year}</td>
                    <td className="px-6 py-4">{detail.year}</td>
                    <td className="px-6 py-4">{detail.result_type}</td>
                    <td className="px-6 py-4">{detail.category}</td>
                    <td className="px-6 py-4">{detail.subcategory}</td>
                    <td className="px-6 py-4">
                      <span className="inline-block px-3 py-1 rounded-full bg-blue-100 text-blue-700 font-semibold">
                        {detail.male_count}
                      </span>
                    </td>
                    <td className="px-6 py-4">
                      <span className="inline-block px-3 py-1 rounded-full bg-pink-100 text-pink-700 font-semibold">
                        {detail.female_count}
                      </span>
                    </td>
                    <td className="px-6 py-4">
                      <span className="inline-block px-3 py-1 rounded-full bg-purple-100 text-purple-700 font-semibold">
                        {detail.transgender_count}
                      </span>
                    </td>
                  </tr>
                ))
              ) : (
                <tr>
                  <td colSpan="8" className="px-6 py-12 text-center text-gray-400 bg-gradient-to-r from-blue-50 to-indigo-50">
                    <div className="flex flex-col items-center justify-center">
                      <RiBarChartBoxLine className="w-12 h-12 text-gray-300 mb-2" />
                      <p className="text-gray-600 font-medium">No examination records found</p>
                      <p className="text-gray-400 text-xs mt-1">Add new records using the form above</p>
                    </div>
                  </td>
                </tr>
              )}
            </tbody>
          </table>
        </div>
      </div>

      {/* Confirmation Dialog */}
      {showConfirm && (
        <div className="fixed inset-0 bg-black bg-opacity-40 flex items-center justify-center z-50">
          <div className="bg-white rounded-xl shadow-xl p-8 max-w-sm w-full mx-4">
            <h3 className="text-lg font-semibold text-gray-900 mb-4">
              Are you sure you want to submit {yearSlots[currentYearSlot]} student Examination Details?
            </h3>
            <div className="flex justify-end gap-4">
              <button
                className="px-4 py-2 rounded-lg bg-gray-200 text-gray-700 hover:bg-gray-300"
                onClick={() => setShowConfirm(false)}
              >
                Cancel
              </button>
              <button
                className="px-4 py-2 rounded-lg bg-green-600 text-white hover:bg-green-700"
                onClick={async () => {
                  setShowConfirm(false);
                  await handleExaminationSubmit();
                  await updateExaminationStatus('finished');
                }}
              >
                Finish
              </button>
            </div>
          </div>
        </div>
      )}

      {/* Declaration Modal */}
      {showDeclaration && (
        <div className="fixed inset-0 bg-black/60 backdrop-blur-sm flex items-center justify-center z-50">
          <motion.div
            initial={{ opacity: 0, scale: 0.95 }}
            animate={{ opacity: 1, scale: 1 }}
            className="bg-white rounded-2xl shadow-2xl p-8 max-w-3xl w-full mx-4"
          >
            {/* Header */}
            <div className="text-center mb-8">
              <div className="w-16 h-16 bg-blue-600 rounded-2xl mx-auto flex items-center justify-center mb-4 transform -rotate-12">
                <RiCheckboxCircleLine className="text-3xl text-white" />
              </div>
              <h3 className="text-2xl font-bold bg-gradient-to-r from-blue-600 to-indigo-600 bg-clip-text text-transparent">
                Declaration Form
              </h3>
              <p className="text-gray-500 mt-2">Please review and confirm your submission</p>
            </div>

            {/* Landscape Info Card */}
            <div className="bg-gradient-to-br from-blue-50 to-indigo-50 rounded-xl p-6 mb-6">
              <div className="grid grid-cols-2 gap-6">
                <div>
                  <p className="text-sm font-medium text-gray-500">Academic Year</p>
                  <p className="text-lg font-semibold text-gray-900">{academicYears[0]}</p>
                </div>
                <div>
                  <p className="text-sm font-medium text-gray-500">Department Name</p>
                  <p className="text-lg font-semibold text-gray-900">{userData?.department}</p>
                </div>
                <div>
                  <p className="text-sm font-medium text-gray-500">Submitted By</p>
                  <p className="text-lg font-semibold text-gray-900">
                    {userData?.name || userData?.username || (
                      <span className="text-red-500 text-base">Not Available</span>
                    )}
                  </p>
                </div>
                <div>
                  <p className="text-sm font-medium text-gray-500">Completed Years</p>
                  <p className="text-lg font-semibold text-gray-900">
                    {(declarationYearSlot || []).join(', ')}
                  </p>
                </div>
                {/* Add HOD Name */}
                <div>
                  <p className="text-sm font-medium text-gray-500">HOD Name</p>
                  <p className="text-lg font-semibold text-gray-900">
                    {hodName ? hodName : <span className="text-red-500 text-base">Not Available</span>}
                  </p>
                </div>
              </div>
            </div>

            {/* Declaration Text */}
            <div className="bg-gradient-to-br from-blue-500/5 to-indigo-500/5 rounded-xl p-6 border border-blue-100 mb-8">
              <div className="flex items-start space-x-4">
                <div className="flex-shrink-0 mt-1">
                  <div className="w-8 h-8 bg-blue-100 rounded-lg flex items-center justify-center">
                    <RiInformationLine className="text-xl text-blue-600" />
                  </div>
                </div>
                <div className="flex-1">
                  <h4 className="font-semibold text-gray-900 mb-2">Declaration Statement</h4>
                  <p className="text-gray-600 leading-relaxed">
                    I hereby declare that the Student Examination data for{' '}
                    <span className="font-semibold text-blue-600">
                      {(declarationYearSlot || []).join(', ')}
                    </span>{' '}
                    is true and correct to the best of my knowledge and belief. I understand that any 
                    discrepancy found later may lead to necessary action as per institutional policy.
                  </p>
                </div>
              </div>
            </div>

            {/* Action Buttons */}
            {finalSubmitSuccess ? (
              <motion.div
                initial={{ opacity: 0, y: 20 }}
                animate={{ opacity: 1, y: 0 }}
                className="flex flex-col items-center gap-3 py-4"
              >
                <div className="w-12 h-12 bg-green-100 rounded-full flex items-center justify-center">
                  <RiCheckboxCircleLine className="text-2xl text-green-600" />
                </div>
                <p className="font-semibold text-green-600">Declaration Submitted Successfully!</p>
              </motion.div>
            ) : (
              <div className="flex items-center justify-end gap-4">
                <button
                  className="px-6 py-2.5 rounded-xl bg-gray-100 text-gray-700 font-medium hover:bg-gray-200 transition-colors"
                  onClick={() => setShowDeclaration(false)}
                  disabled={finalSubmitting}
                >
                  Cancel
                </button>
                <button
                  className="px-6 py-2.5 rounded-xl bg-gradient-to-r from-blue-600 to-indigo-600 
                           text-white font-medium hover:from-blue-700 hover:to-indigo-700 
                           transition-colors shadow-lg shadow-blue-500/25"
                  onClick={handleFinalDeclarationSubmit}
                  disabled={finalSubmitting}
                >
                  {finalSubmitting ? (
                    <div className="flex items-center gap-2">
                      <div className="w-4 h-4 border-2 border-white/30 border-t-white rounded-full animate-spin" />
                      <span>Submitting...</span>
                    </div>
                  ) : (
                    'Confirm & Submit'
                  )}
                </button>
              </div>
            )}
          </motion.div>
        </div>
      )}

      {/* Info Modals */}
      <motion.div>
        {/* Category Info Modal */}
        {showCategoryInfo && (
          <div className="fixed inset-0 bg-black bg-opacity-50 backdrop-blur-sm flex items-center justify-center z-50"
            onClick={() => setShowCategoryInfo(false)}>
            <div className="bg-white rounded-xl shadow-xl p-6 max-w-lg w-full mx-4"
              onClick={e => e.stopPropagation()}>
              <h3 className="text-lg font-semibold text-gray-900 mb-4">Category Information</h3>
              <div className="space-y-4">
                {Object.entries(categoryInfo).map(([category, description]) => (
                  <div key={category} className="p-4 bg-gray-50 rounded-lg">
                    <h4 className="font-medium text-gray-900">{category}</h4>
                    <p className="text-sm text-gray-600 mt-1">{description}</p>
                  </div>
                ))}
              </div>
              <button
                className="mt-6 w-full py-2 bg-gray-100 text-gray-600 rounded-lg hover:bg-gray-200 transition-colors"
                onClick={() => setShowCategoryInfo(false)}
              >
                Close
              </button>
            </div>
          </div>
        )}

        {/* Subcategory Info Modal */}
        {showSubcategoryInfo && (
          <div className="fixed inset-0 bg-black bg-opacity-50 backdrop-blur-sm flex items-center justify-center z-50"
            onClick={() => setShowSubcategoryInfo(false)}>
            <div className="bg-white rounded-xl shadow-xl p-6 max-w-lg w-full mx-4"
              onClick={e => e.stopPropagation()}>
              <h3 className="text-lg font-semibold text-gray-900 mb-4">Subcategory Information</h3>
              <div className="space-y-4">
                {Object.entries(subcategoryInfo).map(([subcategory, description]) => (
                  <div key={subcategory} className="p-4 bg-gray-50 rounded-lg">
                    <h4 className="font-medium text-gray-900">{subcategory}</h4>
                    <p className="text-sm text-gray-600 mt-1">{description}</p>
                  </div>
                ))}
              </div>
              <button
                className="mt-6 w-full py-2 bg-gray-100 text-gray-600 rounded-lg hover:bg-gray-200 transition-colors"
                onClick={() => setShowSubcategoryInfo(false)}
              >
                Close
              </button>
            </div>
          </div>
        )}
      </motion.div>
    </>
  );
}