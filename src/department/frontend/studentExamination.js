import React, { useState, useEffect } from 'react';
import { motion } from 'framer-motion';
import { RiInformationLine, RiBarChartBoxLine, RiCheckboxCircleLine } from 'react-icons/ri';
import axios from 'axios';

const API_BASE = 'http://localhost:5000/api';
const API = {
  EXAMINATION: `${API_BASE}/examination-summary`,
  student_examination: (deptId) => `${API_BASE}/student-examination/department/${deptId}`,
  academic_years: (deptId) => `${API_BASE}/department-user/academic-year/${deptId}`,
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
  const [isDeclarationLocked, setIsDeclarationLocked] = useState(false);
  const [hodName, setHodName] = useState('');
  const [isUpdateMode, setIsUpdateMode] = useState(false);
  const [updating, setUpdating] = useState(false);
  const [degreeLevel, setDegreeLevel] = useState('UG'); // UG by default
  const [examYearCompletionStatus, setExamYearCompletionStatus] = useState({});
  const [examStatusAcademicYear, setExamStatusAcademicYear] = useState('');
  const [selectedAcademicYear, setSelectedAcademicYear] = useState('');
  const [currentPage, setCurrentPage] = useState(1);
  const recordsPerPage = 10;

  // Replace all yearSlots usage with getYearSlots()
  const getYearSlots = () => (degreeLevel === 'UG' ? ['I Year', 'II Year', 'III Year'] : ['I Year', 'II Year']);

  useEffect(() => {
    if (!userData?.dept_id) return;
    fetchAcademicYears();
    fetchExaminationDetails();
    fetchYearStatuses();
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
      if (res.data.success) {
        // Filter by selectedAcademicYear
        setExaminationDetails(res.data.details.filter(d => d.academic_year === selectedAcademicYear));
      } else {
        setExaminationDetails([]);
      }
    } catch {
      setExaminationDetails([]);
    }
  };

  // Fetch year statuses for all slots
  const fetchYearStatuses = async () => {
    try {
      const yearsParam = encodeURIComponent(yearSlots.join(','));
      const res = await axios.get(
        `http://localhost:5000/api/student-examination/year-statuses/${userData.dept_id}?years=${yearsParam}`,
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

  // Fetch examination year completion status
  const fetchExamYearCompletionStatus = async () => {
    try {
      const yearsParam = encodeURIComponent(yearSlots.join(','));
      const res = await fetch(
        `http://localhost:5000/api/student-examination/year-completion-status/${userData.dept_id}?years=${yearsParam}&degree_level=${degreeLevel}`
      );
      if (!res.ok) {
        let errorMsg = 'Failed to fetch examination year completion status';
        try {
          const errData = await res.json();
          errorMsg = errData.message || errorMsg;
        } catch {}
        setGlobalMessage({ type: 'error', text: errorMsg });
        setExamYearCompletionStatus({});
        setExamStatusAcademicYear('');
        return;
      }
      const data = await res.json();
      if (data.success) {
        setExamYearCompletionStatus(data.statuses);
        setExamStatusAcademicYear(data.academicYear);
      } else {
        setExamYearCompletionStatus({});
        setExamStatusAcademicYear('');
      }
    } catch (err) {
      setGlobalMessage({ type: 'error', text: 'Network error fetching examination year completion status' });
      setExamYearCompletionStatus({});
      setExamStatusAcademicYear('');
    }
  };

  // Call fetchExamYearCompletionStatus on mount and when degreeLevel changes
  useEffect(() => {
    if (userData?.dept_id) {
      fetchExamYearCompletionStatus();
    }
    // eslint-disable-next-line
  }, [userData, degreeLevel]);

  // Helper to check if all years are completed for the selected degree level
  const isAllExamYearsCompleted = () => {
    return getYearSlots().every((slot) => examYearCompletionStatus[slot] === 'completed');
  };

  // Helper to get all finished years (like student enrollment)
  const getAllExamFinishedYears = () => {
    return yearSlots.filter((slot) => examYearCompletionStatus[slot] === 'finished');
  };

  // Helper to get all incomplete years (like student enrollment)
  const getAllExamIncompleteYears = () => {
    return yearSlots.filter((slot) => examYearCompletionStatus[slot] !== 'finished');
  };

  // Helper to get status for a year (like student enrollment)
  const getExamYearStatus = (slot) => {
    return examYearCompletionStatus[slot] || 'incomplete';
  };

  // Helper to check if all years are finished
  const isAllYearsFinished = () => {
    const normalizeYear = (year) => year.trim().replace(/\s+/g, ' ').toLowerCase();
    return yearSlots.every((slot) => yearStatuses[normalizeYear(slot)] === 'finished');
  }


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
                year: getYearSlots()[currentYearSlot],
                result_type: resultType,
                degree_level: degreeLevel // <-- Add this
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

  const fetchHodName = async () => {
    try {
      const res = await axios.get(
        `http://localhost:5000/api/department-user/hod/${userData.dept_id}`,
        { headers: { Authorization: `Bearer ${localStorage.getItem('authToken')}` } }
      );
      if (res.data.success && res.data.hod_name) setHodName(res.data.hod_name);
      else setHodName('');
    } catch {
      setHodName('');
    }
  };

  useEffect(() => {
    if (userData?.dept_id) {
      checkDeclarationLockStatus();
      fetchHodName();
    }
  }, [userData]);

  const handleFinalDeclarationSubmit = async () => {
    if (!hodName) {
      setGlobalMessage({ type: 'error', text: 'HOD name is missing. Please contact admin.' });
      setFinalSubmitting(false);
      return;
    }
    setFinalSubmitting(true);
    try {
      await axios.post(
        'http://localhost:5000/api/student-examination/submit-declaration',
        {
          dept_id: userData?.dept_id,
          name: userData?.name || userData?.username,
          department: userData?.department,
          year: Array.isArray(declarationYearSlot) ? declarationYearSlot.join(', ') : declarationYearSlot,
          type: 'Student Examination',
          hod: hodName,
          degree_level: degreeLevel,
          academic_year: selectedAcademicYear // <-- Add this
        },
        { headers: { Authorization: `Bearer ${localStorage.getItem('authToken')}` } }
      );
      // Lock the declaration after successful submission
      await axios.post(
        'http://localhost:5000/api/student-examination/lock-declaration',
        {
          dept_id: userData?.dept_id,
          year: Array.isArray(declarationYearSlot) ? declarationYearSlot.join(', ') : declarationYearSlot,
          type: 'Student Examination',
          degree_level: degreeLevel,
          academic_year: selectedAcademicYear // <-- Add this
        },
        { headers: { Authorization: `Bearer ${localStorage.getItem('authToken')}` } }
      );
      setFinalSubmitSuccess(true);
      setTimeout(() => {
        setShowDeclaration(false);
        setFinalSubmitSuccess(false);
        setDeclarationYearSlot(null);
        checkDeclarationLockStatus(); // Refresh lock status
      }, 2000);
    } catch (err) {
      setGlobalMessage({ type: 'error', text: 'Failed to submit declaration' });
    } finally {
      setFinalSubmitting(false);
    }
  };

  const checkDeclarationLockStatus = async () => {
    try {
      const res = await axios.get(
        'http://localhost:5000/api/student-examination/declaration-lock-status',
        {
          params: {
            deptId: userData?.dept_id,
            year: getYearSlots().join(', '),
            type: 'Student Examination',
            degree_level: degreeLevel,
            academic_year: selectedAcademicYear // <-- Add this
          },
          headers: { Authorization: `Bearer ${localStorage.getItem('authToken')}` }
        }
      );
      setIsDeclarationLocked(res.data.locked);
    } catch {
      setIsDeclarationLocked(false);
    }
  };

  useEffect(() => {
    if (userData?.dept_id) {
      checkDeclarationLockStatus();
    }
  }, [userData, degreeLevel]);

  const fetchExaminationDataForYear = async (yearSlot, resultType) => {
    if (!userData?.dept_id) return;
    setUpdating(true);
    try {
      const res = await axios.get(API.student_examination(userData.dept_id), {
        headers: { Authorization: `Bearer ${localStorage.getItem('authToken')}` }
      });
      if (res.data.success && Array.isArray(res.data.details)) {
        // Filter for the selected year slot and result type
        const filtered = res.data.details.filter(
          (row) => row.year === yearSlot && row.result_type === resultType && row.degree_level === degreeLevel
        );
        // Build examinationData object
        const newData = {};
        subcategories.forEach(sub => {
          newData[sub] = {};
          categories.forEach(cat => {
            newData[sub][cat] = { Male: 0, Female: 0, Transgender: 0 };
          });
        });
        filtered.forEach(row => {
          if (
            newData[row.subcategory] &&
            newData[row.subcategory][row.category]
          ) {
            newData[row.subcategory][row.category] = {
              Male: Number(row.male_count) || 0,
              Female: Number(row.female_count) || 0,
              Transgender: Number(row.transgender_count) || 0
            };
          }
        });
        setExaminationData(newData);
      }
    } catch {
      setGlobalMessage({ type: 'error', text: 'Failed to fetch examination data for update.' });
    } finally {
      setUpdating(false);
    }
  };

  const handleUpdateExamination = async () => {
    if (!isUpdateMode) {
      // First click: fetch and fill data
      await fetchExaminationDataForYear(yearSlots[currentYearSlot], resultType);
      setIsUpdateMode(true);
      setGlobalMessage({ type: 'success', text: 'Examination data loaded. You can now update and save.' });
      setTimeout(() => setGlobalMessage(null), 3000);
      return;
    }

    // Second click: update data
    setUpdating(true);
    try {
      const selectedAcademicYear = academicYears[0];
      if (!selectedAcademicYear) {
        setGlobalMessage({ type: 'error', text: 'Academic year not found' });
        setUpdating(false);
        return;
      }
      const updateRecords = [];
      Object.entries(subcategoryMaster).forEach(([subcatId, subcatName]) => {
        Object.entries(categoryMaster).forEach(([catId, catName]) => {
          Object.entries(genderMaster).forEach(([genderId, genderName]) => {
            const count = examinationData[subcatName][catName][genderName];
            updateRecords.push({
              academic_year: selectedAcademicYear,
              dept_id: userData?.dept_id,
              category_id: parseInt(catId),
              subcategory_id: parseInt(subcatId),
              gender_id: parseInt(genderId),
              count: parseInt(count),
              year: yearSlots[currentYearSlot],
              result_type: resultType,
              degree_level: degreeLevel
            });
          });
        });
      });
      const response = await axios.put(
        'http://localhost:5000/api/student-examination/update',
        { records: updateRecords },
        {
          headers: {
            'Authorization': `Bearer ${localStorage.getItem('authToken')}`,
            'Content-Type': 'application/json'
          }
        }
      );
      if (response.data.success) {
        setGlobalMessage({ type: 'success', text: 'Examination data updated successfully' });
        fetchExaminationDetails();
        setIsUpdateMode(false);
        // Reset form fields to zero after update
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
      } else {
        setGlobalMessage({ type: 'error', text: response.data.message || 'Failed to update examination data' });
      }
    } catch (error) {
      setGlobalMessage({ type: 'error', text: error.response?.data?.message || 'Failed to update examination data' });
    } finally {
      setUpdating(false);
      setTimeout(() => setGlobalMessage(null), 3000);
    }
  };

  useEffect(() => {
    if (isUpdateMode) {
      // Reset form to empty and exit update mode when year or result type changes
      const emptyData = {};
      subcategories.forEach(sub => {
        emptyData[sub] = {};
        categories.forEach(cat => {
          emptyData[sub][cat] = { Male: 0, Female: 0, Transgender: 0 };
        });
      });
      setExaminationData(emptyData);
      setIsUpdateMode(false);
    }
  }, [currentYearSlot, resultType]);

  // Set default selected academic year when academicYears is fetched
  useEffect(() => {
    if (academicYears.length > 0) {
      setSelectedAcademicYear(academicYears[0]);
    }
  }, [academicYears]);

  // Fetch examination details and year completion status when selected academic year changes
  useEffect(() => {
    if (selectedAcademicYear) {
      fetchExaminationDetails();
      fetchExamYearCompletionStatus();
      // Reset form if needed
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
      setCurrentYearSlot(0);
    }
  }, [selectedAcademicYear, degreeLevel]);

  // Pagination logic
  const totalPages = Math.ceil(examinationDetails.length / recordsPerPage);
  const paginatedDetails = examinationDetails.slice(
    (currentPage - 1) * recordsPerPage,
    currentPage * recordsPerPage
  );

  // Pagination UI
  function renderPagination() {
    if (totalPages <= 1) return null;
    const pages = [];
    const maxPageButtons = 5;
    let start = Math.max(1, currentPage - 2);
    let end = Math.min(totalPages, start + maxPageButtons - 1);
    if (end - start < maxPageButtons - 1) {
      start = Math.max(1, end - maxPageButtons + 1);
    }
    if (start > 1) {
      pages.push(
        <button key={1} onClick={() => setCurrentPage(1)} className="px-3 py-2 rounded-lg border bg-white text-gray-700 font-semibold mx-1 hover:bg-blue-50">1</button>
      );
      if (start > 2) pages.push(<span key="start-ellipsis" className="mx-1 text-gray-400">...</span>);
    }
    for (let i = start; i <= end; i++) {
      pages.push(
        <button
          key={i}
          onClick={() => setCurrentPage(i)}
          className={`px-3 py-2 rounded-lg border font-semibold mx-1 ${i === currentPage ? 'bg-blue-700 text-white shadow' : 'bg-white text-gray-700 hover:bg-blue-50'}`}
        >
          {i}
        </button>
      );
    }
    if (end < totalPages) {
      if (end < totalPages - 1) pages.push(<span key="end-ellipsis" className="mx-1 text-gray-400">...</span>);
      pages.push(
        <button key={totalPages} onClick={() => setCurrentPage(totalPages)} className="px-3 py-2 rounded-lg border bg-white text-gray-700 font-semibold mx-1 hover:bg-blue-50">{totalPages}</button>
      );
    }
    return (
      <div className="flex items-center justify-center mt-8 mb-2">
        <button
          onClick={() => setCurrentPage((p) => Math.max(1, p - 1))}
          disabled={currentPage === 1}
          className={`px-3 py-2 rounded-lg border font-semibold mx-1 ${currentPage === 1 ? 'bg-gray-100 text-gray-400 cursor-not-allowed' : 'bg-white text-gray-700 hover:bg-blue-50'}`}
        >
          &lt; Back
        </button>
        {pages}
        <button
          onClick={() => setCurrentPage((p) => Math.min(totalPages, p + 1))}
          disabled={currentPage === totalPages}
          className={`px-3 py-2 rounded-lg border font-semibold mx-1 ${currentPage === totalPages ? 'bg-gray-100 text-gray-400 cursor-not-allowed' : 'bg-white text-gray-700 hover:bg-blue-50'}`}
        >
          Next &gt;
        </button>
      </div>
    );
  }

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
              <input
                type="text"
                value={selectedAcademicYear}
                readOnly
                className="w-full px-4 py-2 border rounded-lg bg-gray-100 text-base cursor-not-allowed"
              />
            </div>
            {/* Degree Level Selector */}
            <div className="flex-1 min-w-[180px] max-w-xs">
              <label className="block text-sm font-semibold text-gray-700 mb-2">
                Degree Level
              </label>
              <select
                value={degreeLevel}
                onChange={e => {
                  setDegreeLevel(e.target.value);
                  setCurrentYearSlot(0); // Reset year slot on degree change
                }}
                className="w-full px-4 py-2 border rounded-lg bg-white text-base"
              >
                <option value="UG">UG</option>
                <option value="PG">PG</option>
              </select>
            </div>
            {/* Year Slot Selector */}
            <div className="flex-1 min-w-[180px] max-w-xs">
              <label className="block text-sm font-semibold text-gray-700 mb-2">
                Year Slot
              </label>
              <select
                value={getYearSlots()[currentYearSlot]}
                onChange={e => setCurrentYearSlot(getYearSlots().indexOf(e.target.value))}
                className="w-full px-4 py-2 border rounded-lg bg-white"
              >
                {getYearSlots().map((slot) => (
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
                  Academic Year: <span className="font-semibold">{examStatusAcademicYear || 'N/A'}</span>
                </span>
              </div>
              <div className="grid grid-cols-1 sm:grid-cols-2 md:grid-cols-3 gap-4">
                {getYearSlots().map((slot) => {
                  // Use the same logic as student enrollment: status is 'finished' for completed
                  const isCompleted = examYearCompletionStatus[slot] === 'completed';
                  return (
                    <div
                      key={slot}
                      className={`flex items-center gap-3 px-5 py-4 rounded-xl border transition-all duration-200 shadow-sm
                        ${isCompleted
                          ? 'bg-green-50 border-green-200'
                          : 'bg-yellow-50 border-yellow-200'
                        }`}
                    >
                      <div className={`flex items-center justify-center w-10 h-10 rounded-full
                        ${isCompleted ? 'bg-green-100' : 'bg-yellow-100'}`}>
                        {isCompleted ? (
                          <RiCheckboxCircleLine className="text-2xl text-green-600" />
                        ) : (
                          <RiBarChartBoxLine className="text-2xl text-yellow-500" />
                        )}
                      </div>
                      <div className="flex-1">
                        <div className="text-base font-semibold text-gray-800">{slot}</div>
                        <div className={`mt-1 inline-block px-3 py-1 rounded-full text-xs font-bold
                          ${isCompleted
                            ? 'bg-green-200 text-green-800'
                            : 'bg-yellow-200 text-yellow-800'
                          }`}
                        >
                          {isCompleted ? 'Completed' : 'Incomplete'}
                        </div>
                      </div>
                    </div>
                  );
                })}
              </div>
              {/* Show Final Declaration Button if all years are completed */}
              {isAllExamYearsCompleted() && !isDeclarationLocked && (
                <div className="flex justify-end mt-6">
                  <button
                    className="px-6 py-3 rounded-xl bg-gradient-to-r from-blue-600 to-indigo-600 text-white font-semibold shadow hover:from-blue-700 hover:to-indigo-700 transition"
                    onClick={() => {
                      setDeclarationYearSlot(getYearSlots());
                      setShowDeclaration(true);
                    }}
                  >
                    Final Submission
                  </button>
                </div>
              )}
              {isDeclarationLocked && (
                <div className="flex justify-end mt-6">
                  <span className="px-6 py-3 rounded-xl bg-gray-300 text-gray-600 font-semibold shadow">
                    Final Submission Locked
                  </span>
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

          {/* Button Group for Submit and Update */}
          <div className="flex flex-col md:flex-row gap-4 justify-center items-center mt-8">
            <button
              type="button"
              disabled={submitting || isDeclarationLocked}
              onClick={() => setShowConfirm(true)}
              className={`w-full md:w-auto max-w-md py-4 px-6 rounded-xl font-semibold text-white text-lg
                shadow-lg shadow-blue-500/20 
                ${submitting || isDeclarationLocked
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

            {!isDeclarationLocked && (
              <button
                type="button"
                disabled={updating}
                onClick={handleUpdateExamination}
                className={`w-full md:w-auto max-w-md py-4 px-6 rounded-xl font-semibold text-white text-lg
                  shadow-lg shadow-blue-500/20
                  ${updating
                    ? 'bg-gray-400 cursor-not-allowed'
                    : isUpdateMode
                      ? 'bg-gradient-to-r from-green-600 to-emerald-600 hover:from-green-700 hover:to-emerald-700'
                      : 'bg-gradient-to-r from-yellow-600 to-orange-600 hover:from-yellow-700 hover:to-orange-700'
                  }
                  transform transition-all duration-200 hover:-translate-y-0.5`}
              >
                {updating
                  ? 'Updating...'
                  : isUpdateMode
                    ? 'Save Changes'
                    : 'Edit Examination Data'}
              </button>
            )}
          </div>
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
                <th className="px-6 py-4 font-bold tracking-wider text-blue-700">Degree Level</th>
                <th className="px-6 py-4 font-bold tracking-wider text-blue-700">Result Type</th>
                <th className="px-6 py-4 font-bold tracking-wider text-blue-700">Category</th>
                <th className="px-6 py-4 font-bold tracking-wider text-blue-700">Subcategory</th>
                <th className="px-6 py-4 font-bold tracking-wider text-blue-700">Male</th>
                <th className="px-6 py-4 font-bold tracking-wider text-blue-700">Female</th>
                <th className="px-6 py-4 font-bold tracking-wider text-blue-700">Transgender</th>
              </tr>
            </thead>
            <tbody>
              {paginatedDetails.length > 0 ? (
                paginatedDetails.map((detail, index) => (
                  <tr key={index} className="hover:bg-gradient-to-r hover:from-blue-50 hover:to-indigo-50 transition">
                    <td className="px-6 py-4 font-medium">{detail.academic_year}</td>
                    <td className="px-6 py-4">{detail.year}</td>
                    <td className="px-6 py-4">{detail.degree_level || (detail.DegreeLevel || '')}</td>
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
                  <td colSpan="9" className="px-6 py-12 text-center text-gray-400 bg-gradient-to-r from-blue-50 to-indigo-50">
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
        {renderPagination()}
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
                <div>
                  <p className="text-sm font-medium text-gray-500">Degree Level</p>
                  <p className="text-lg font-semibold text-gray-900">{degreeLevel}</p>
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
                  className="px-6 py-2.5 rounded-xl bg-gray-100 text-gray-600 font-medium hover:bg-gray-200 transition-colors"
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