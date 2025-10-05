import React, { useState, useEffect } from 'react';
import { motion } from 'framer-motion';
import {
  RiInformationLine,
  RiBarChartBoxLine,
  RiCheckboxCircleLine
} from 'react-icons/ri';
import axios from 'axios';
import AcademicYearBadge from '../../Admin-Frontend/components/AcademicYearBadge';

const API_BASE = 'https://admin-back-j3j4.onrender.com/api';
const API = {
  ENROLLMENT: `${API_BASE}/department/enrollment-summary`,
  student_enrollment: (deptId) => `${API_BASE}/student-enrollment/department/${deptId}`,
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

export default function StudentEnrollment({ userData }) {
  const [degreeLevel, setDegreeLevel] = useState('PG');
  const [allowedDegreeLevels, setAllowedDegreeLevels] = useState(['UG']);
  const [academicYears, setAcademicYears] = useState([]);
  const [selectedAcademicYear, setSelectedAcademicYear] = useState(""); // <-- must be before any use
  const [yearCompletionStatus, setYearCompletionStatus] = useState({});
  const [hodName, setHodName] = useState('');
  const [isDeclarationLocked, setIsDeclarationLocked] = useState(false);
  const [loadingYearData, setLoadingYearData] = useState(false); // NEW: loading for year fetch
  const [isUpdateMode, setIsUpdateMode] = useState(false); // NEW: track update mode
  const [currentYearSlot, setCurrentYearSlot] = useState(0);
  const [declarationYearSlot, setDeclarationYearSlot] = useState(null);
  const [enrollmentData, setEnrollmentData] = useState(() => {
    const data = {};
    subcategories.forEach(sub => {
      data[sub] = {};
      categories.forEach(cat => {
        data[sub][cat] = { Male: 0, Female: 0, Transgender: 0 };
      });
    });
    return data;
  });
  const [studentDetails, setStudentDetails] = useState([]);
  const [submitting, setSubmitting] = useState(false);
  const [updating, setUpdating] = useState(false);
  const [showCategoryInfo, setShowCategoryInfo] = useState(false);
  const [showSubcategoryInfo, setShowSubcategoryInfo] = useState(false);
  const [globalMessage, setGlobalMessage] = useState(null);
  const [showConfirm, setShowConfirm] = useState(false);
  const [showDeclaration, setShowDeclaration] = useState(false);
  const [finalSubmitting, setFinalSubmitting] = useState(false);
  const [finalSubmitSuccess, setFinalSubmitSuccess] = useState(false);
  const [currentPage, setCurrentPage] = useState(1);
  const recordsPerPage = 10;
  const [summaryData, setSummaryData] = useState({});
  const [summaryYear, setSummaryYear] = useState('I Year'); // New state for active tab
  const [editingSubcategory, setEditingSubcategory] = useState(null); // subcategory name
  const [editingYear, setEditingYear] = useState(null); // year string
  // Backup to restore enrollment data when Cancel is clicked during edit
  const [backupEnrollmentData, setBackupEnrollmentData] = useState(null);

  useEffect(() => {
    const yearSlots = getYearSlots(); // Get year slots based on degree level
    const initialSummary = {};

    // Initialize the structure for each year slot
    yearSlots.forEach(year => {
      initialSummary[year] = {
        'PwBD': { male: 0, female: 0, transgender: 0 },
        'Muslim Minority': { male: 0, female: 0, transgender: 0 },
        'Other Minority': { male: 0, female: 0, transgender: 0 }
      };
    });

    // Aggregate data from studentDetails
    studentDetails
      .filter(detail => detail.degree_level === degreeLevel)
      .forEach(detail => {
        const year = detail.year; // Use the 'year' property directly
        if (initialSummary[year] && initialSummary[year][detail.subcategory]) {
          initialSummary[year][detail.subcategory].male += parseInt(detail.male_count, 10) || 0;
          initialSummary[year][detail.subcategory].female += parseInt(detail.female_count, 10) || 0;
          initialSummary[year][detail.subcategory].transgender += parseInt(detail.transgender_count, 10) || 0;
        }
      });

    setSummaryData(initialSummary);
  }, [studentDetails, degreeLevel]);

  // Define getYearSlots function
  const getYearSlots = () => {
    return degreeLevel === 'UG' ? ['I Year', 'II Year', 'III Year'] : ['I Year', 'II Year'];
  };

  // Define yearSlots variable
  const yearSlots = getYearSlots();

  // Modern badge-style year completion status UI (like studentExamination.js)

  // --- To use this UI, insert {renderYearCompletionStatus()} in your main JSX where you want the year status to appear ---

  useEffect(() => {
    if (!userData?.dept_id) return;
  fetchAcademicYears();
  fetchStudentDetails();
 
  fetchHodName();
    // eslint-disable-next-line
  }, [userData, degreeLevel]);

  // Set default academic year when academicYears change
  useEffect(() => {
    if (academicYears.length > 0) {
      setSelectedAcademicYear(academicYears[0]);
    }
  }, [academicYears]);

  // Fetch student details for selected academic year
  const fetchStudentDetails = async () => {
    if (!userData?.dept_id || !selectedAcademicYear) return;
    try {
      const res = await axios.get(API.student_enrollment(userData.dept_id), {
        headers: { Authorization: `Bearer ${localStorage.getItem('authToken')}` }
      });
      if (res.data.success) {
        setStudentDetails(res.data.details.filter(d => d.academic_year === selectedAcademicYear));
        // Map year to status
        const yearStatus = {};
        res.data.details.forEach(detail => {
          if (detail.academic_year === selectedAcademicYear) {
            yearStatus[detail.year] = detail.status; // "Completed" or "Incompleted"
          }
        });
        setYearCompletionStatus(yearStatus);
      } else {
        setStudentDetails([]);
        setYearCompletionStatus({});
      }
    } catch {
      setStudentDetails([]);
    }
  };

  // Re-fetch student details when academic year changes
  useEffect(() => {
  fetchStudentDetails();
  // ...fetch other year-dependent data if needed...
  }, [selectedAcademicYear]);

  // Fetch enrollment data for the selected year slot
  const fetchEnrollmentDataForYear = async (yearSlot) => {
    if (!userData?.dept_id || !selectedAcademicYear) return;
    setLoadingYearData(true);
    try {
      const res = await axios.get(API.student_enrollment(userData.dept_id), {
        headers: { Authorization: `Bearer ${localStorage.getItem('authToken')}` }
      });
      if (res.data.success && Array.isArray(res.data.details)) {
        // Filter for the selected year slot, academic year, and degree level
        const filtered = res.data.details.filter(
          (row) =>
            row.year === yearSlot &&
            row.academic_year === selectedAcademicYear &&
            row.degree_level === degreeLevel
        );
        // Build enrollmentData object
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
        setEnrollmentData(newData);
      } else {
        // No data for this year, reset to zero
        const emptyData = {};
        subcategories.forEach(sub => {
          emptyData[sub] = {};
          categories.forEach(cat => {
            emptyData[sub][cat] = { Male: 0, Female: 0, Transgender: 0 };
          });
        });
        setEnrollmentData(emptyData);
      }
    } catch {
      setGlobalMessage({ type: 'error', text: 'Failed to fetch enrollment data for year' });
    } finally {
      setLoadingYearData(false);
    }
  };

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



  const fetchHodName = async () => {
    try {
      const res = await axios.get(API.hod_name(userData.dept_id), {
        headers: { Authorization: `Bearer ${localStorage.getItem('authToken')}` }
      });
      if (res.data.success && res.data.hod_name) setHodName(res.data.hod_name);
      else setHodName('');
    } catch {
      setHodName('');
    }
  };

  // Check lock status for the current academic year and degree level
  const checkDeclarationLockStatus = async () => {
    if (!userData?.dept_id || !selectedAcademicYear) return;
    try {
      const res = await axios.get('https://admin-back-j3j4.onrender.com/api/student-enrollment/declaration-lock-status', {
        params: {
          deptId: userData.dept_id,
          year: yearSlots.join(', '), // <-- add space after comma
          type: 'Student Enrollment',
          degree_level: degreeLevel,
          academic_year: selectedAcademicYear
        }
      });
      setIsDeclarationLocked(res.data.locked);
    } catch {
      setIsDeclarationLocked(false);
    }
  };

  // Call on mount and when dependencies change
  useEffect(() => {
    checkDeclarationLockStatus();
  }, [userData, degreeLevel, selectedAcademicYear]);

  // After successful final submission, call checkDeclarationLockStatus() again
  const handleFinalDeclarationSubmit = async () => {
    if (!hodName) {
      setGlobalMessage({ type: 'error', text: 'HOD name is missing. Please contact admin.' });
      setFinalSubmitting(false);
      return;
    }
    setFinalSubmitting(true);
    try {
      await axios.post(
        'https://admin-back-j3j4.onrender.com/api/student-enrollment/submit-declaration',
        {
          dept_id: userData?.dept_id,
          name: userData?.name || userData?.username,
          department: userData?.department,
          year: Array.isArray(declarationYearSlot) ? declarationYearSlot.join(', ') : declarationYearSlot,
          type: 'Student Enrollment',
          hod: hodName,
          degree_level: degreeLevel,
          academic_year: selectedAcademicYear
        },
        { headers: { Authorization: `Bearer ${localStorage.getItem('authToken')}` } }
      );
      // Lock after submit
      await axios.post(
        'https://admin-back-j3j4.onrender.com/api/student-enrollment/lock-declaration',
        {
          dept_id: userData?.dept_id,
          year: Array.isArray(declarationYearSlot) ? declarationYearSlot.join(', ') : declarationYearSlot,
          type: 'Student Enrollment',
          degree_level: degreeLevel,
          academic_year: selectedAcademicYear
        },
        { headers: { Authorization: `Bearer ${localStorage.getItem('authToken')}` } }
      );
      setIsDeclarationLocked(true);
      setFinalSubmitSuccess(true);
      setGlobalMessage({ type: 'success', text: 'Declaration form submitted successfully' });
      setTimeout(() => {
        setShowDeclaration(false);
        setFinalSubmitSuccess(false);
        setDeclarationYearSlot(null);
        checkDeclarationLockStatus(); // Always refresh lock status from backend
      }, 2000);
    } catch (err) {
      setGlobalMessage({ type: 'error', text: 'Failed to submit declaration' });
    } finally {
      setFinalSubmitting(false);
    }
  };

  // Helper to check if all years are completed (using yearCompletionStatus)

  const openDeclarationModal = () => {
    // Only include completed years
    const completedYears = yearSlots.filter(year => yearCompletionStatus[year] === 'Completed');
    setDeclarationYearSlot(completedYears.join(', ')); // <-- set as string
    fetchHodName();
    setShowDeclaration(true);
  };

  const handleUpdateEnrollment = async () => {
    if (!isUpdateMode) {
      // First click: fetch and fill data
      // snapshot current enrollmentData so Cancel can restore it
      const prev = enrollmentData;
      setBackupEnrollmentData(prev);
      setUpdating(true);
      try {
        await fetchEnrollmentDataForYear(yearSlots[currentYearSlot]);
        setIsUpdateMode(true);
        setGlobalMessage({ type: 'success', text: 'Enrollment data loaded. You can now update and save.' });
      } catch {
        setGlobalMessage({ type: 'error', text: 'Failed to fetch enrollment data for update.' });
        // restore immediately from local snapshot if fetch failed
        setEnrollmentData(prev || {});
        setBackupEnrollmentData(null);
      } finally {
        setUpdating(false);
        setTimeout(() => setGlobalMessage(null), 3000);
      }
      return;
    }
    
    // Second click: update data
    setUpdating(true);
    try {
      const updateRecords = [];
      Object.entries(subcategoryMaster).forEach(([subcatId, subcatName]) => {
        Object.entries(categoryMaster).forEach(([catId, catName]) => {
          Object.entries(genderMaster).forEach(([genderId, genderName]) => {
            const count = enrollmentData[subcatName][catName][genderName];
            updateRecords.push({
              academic_year: selectedAcademicYear,
              dept_id: userData?.dept_id,
              category_id: parseInt(catId),
              subcategory_id: parseInt(subcatId),
              gender_id: parseInt(genderId),
              count: parseInt(count),
              year: yearSlots[currentYearSlot],
              degree_level: degreeLevel // <-- Make sure this is included
            });
          });
        });
      });
      const response = await axios.put(
        'https://admin-back-j3j4.onrender.com/api/student-enrollment/update',
        { records: updateRecords },
        {
          headers: {
            'Authorization': `Bearer ${localStorage.getItem('authToken')}`,
            'Content-Type': 'application/json'
          }
        }
      );
      if (response.data.success) {
        setGlobalMessage({ type: 'success', text: 'Enrollment data updated successfully' });
        fetchStudentDetails();
        setIsUpdateMode(false); // Reset update mode after successful update

        // Reset form fields to zero after update
        setEnrollmentData(() => {
          const data = {};
          subcategories.forEach(sub => {
            data[sub] = {};
            categories.forEach(cat => {
              data[sub][cat] = { Male: 0, Female: 0, Transgender: 0 };
            });
          });
          return data;
        });
        // clear backup after successful update
        setBackupEnrollmentData(null);
      } else {
        setGlobalMessage({ type: 'error', text: response.data.message || 'Failed to update enrollment data' });
      }
    } catch (error) {
      setGlobalMessage({ type: 'error', text: error.response?.data?.message || 'Failed to update enrollment data' });
    } finally {
      setUpdating(false);
      setTimeout(() => setGlobalMessage(null), 3000);
    }
  };

  useEffect(() => {
    setCurrentYearSlot(0);
    // Optionally reset enrollment data if needed
    const emptyData = {};
    subcategories.forEach(sub => {
      emptyData[sub] = {};
      categories.forEach(cat => {
        emptyData[sub][cat] = { Male: 0, Female: 0, Transgender: 0 };
      });
    });
    setEnrollmentData(emptyData);
  }, [degreeLevel]);

  // ...other logic...

  // Reset to page 1 if studentDetails change
  useEffect(() => {
    setCurrentPage(1);
  }, [studentDetails.length]);

  // Pagination logic
  const totalPages = Math.ceil(studentDetails.length / recordsPerPage);
  const paginatedDetails = studentDetails.slice(
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


  const handleEnrollmentSubmit = async (e) => {
    if (e && e.preventDefault) e.preventDefault();
    setSubmitting(true);
    try {
      // Prepare records in the required format
      const records = [];
      Object.entries(subcategoryMaster).forEach(([subcatId, subcatName]) => {
        Object.entries(categoryMaster).forEach(([catId, catName]) => {
          Object.entries(genderMaster).forEach(([genderId, genderName]) => {
            const count = enrollmentData[subcatName][catName][genderName];
            records.push({
              academic_year: selectedAcademicYear,
              dept_id: userData?.dept_id,
              category_id: parseInt(catId),
              subcategory_id: parseInt(subcatId),
              gender_id: parseInt(genderId),
              count: parseInt(count),
              year: yearSlots[currentYearSlot],
              degree_level: degreeLevel
            });
          });
        });
      });

      const res = await fetch(API.ENROLLMENT, {
        method: 'POST',
        headers: { 
          'Content-Type': 'application/json',
          'Authorization': `Bearer ${localStorage.getItem('authToken')}`
        },
        body: JSON.stringify({ records }),
      });
      const data = await res.json();
      if (data.success) {
        setEnrollmentData(() => {
          const data = {};
          subcategories.forEach(sub => {
            data[sub] = {};
            categories.forEach(cat => {
              data[sub][cat] = { Male: 0, Female: 0, Transgender: 0 };
            });
          });
          return data;
        });
        fetchStudentDetails(); // <-- Fetch and show updated table immediately
      } else {
        setGlobalMessage({ type: 'error', text: data.message || 'Submission failed.' });
      }
    } catch (err) {
      setGlobalMessage({ type: 'error', text: 'Error submitting enrollment data.' });
    }
    setSubmitting(false);
  };

  const updateEnrollmentStatus = async (status) => {
    try {
      // Update status for the current year slot
      const res = await fetch(`${API_BASE}/student-enrollment/update-status`, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          dept_id: userData.dept_id,
          year: yearSlots[currentYearSlot],
          status,
          academic_year: selectedAcademicYear,
          degree_level: degreeLevel,
        }),
      });
      const data = await res.json();
      if (data.success) {
        setGlobalMessage(`Status updated to ${status}`);
      
      } else {
        setGlobalMessage(data.message || 'Status update failed.');
      }
    } catch (err) {
      setGlobalMessage('Error updating status.');
    }
  };

  useEffect(() => {
    async function fetchDegreeLevels() {
      if (!userData?.dept_id) return;
      const res = await fetch(`https://admin-back-j3j4.onrender.com/api/degree-levels/${userData.dept_id}`);
      const data = await res.json();
      if (data.success && data.degree_levels.length > 0) {
        setAllowedDegreeLevels(data.degree_levels);
        setDegreeLevel(data.degree_levels[0]); // Always use the first as default
      }
    }
    fetchDegreeLevels();
  }, [userData?.dept_id]);

  // Helper to get breakdown for selected subcategory and year
  function getSubcategoryBreakdown(subcategory, year) {
    // Find all details for this year, degreeLevel, and subcategory
    return categories.map(category => {
      const detail = studentDetails.find(
        d =>
          d.year === year &&
          d.degree_level === degreeLevel &&
          d.subcategory === subcategory &&
          d.category === category
      );
      return {
        category,
        male: detail ? detail.male_count : 0,
        female: detail ? detail.female_count : 0,
        transgender: detail ? detail.transgender_count : 0,
      };
    });
  }

  return (
    <>
      <div className="space-y-10 max-w-7xl mx-auto px-4 py-8">
        {/* Header */}

         {/* Academic Year Badge */}
        <div className="flex justify-start mb-6">
          <AcademicYearBadge year={selectedAcademicYear || academicYears?.[0] || ""} />
        </div> 

        <div className="flex flex-col md:flex-row md:items-center md:justify-between gap-4">
          <div>
            <h3 className="text-3xl font-bold text-gray-900 tracking-tight">Student Enrollment</h3>
            <p className="text-base text-gray-500 mt-1">Enter student count by category, subcategory, and gender for each year.</p>
          </div>
          <span className="px-6 py-3 bg-gradient-to-r from-blue-600 to-indigo-600 text-white rounded-2xl text-base font-semibold shadow-md">
            {userData?.department}
          </span>
        </div>

        {/* Global Message */}
        {globalMessage && (
          <motion.div
            initial={{ opacity: 0, y: 10 }}
            animate={{ opacity: 1, y: 0 }}
            exit={{ opacity: 0, y: 10 }}
            className={`mb-4 px-4 py-3 rounded-xl text-white text-base font-medium shadow-lg ${
              globalMessage.type === 'success' ? 'bg-green-500' : 'bg-red-500'
            }`}
          >
            {globalMessage.text}
          </motion.div>
        )}

        {/* Form */}
        <form onSubmit={handleEnrollmentSubmit} className="space-y-10">
          {/* Academic Year, Year Slot, Info Buttons */}
          <div className="flex flex-wrap gap-6 items-end">
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
            <div className="flex-1 min-w-[180px] max-w-xs">
              <label className="block text-sm font-semibold text-gray-700 mb-2">
                Year Slot
              </label>
              <select
                value={yearSlots[currentYearSlot]}
                onChange={e => setCurrentYearSlot(yearSlots.indexOf(e.target.value))}
                className="w-full px-4 py-2 border rounded-lg bg-white text-base"
                disabled={loadingYearData}
              >
                {yearSlots.map((slot) => (
                  <option key={slot} value={slot}>{slot}</option>
                ))}
              </select>
              {loadingYearData && (
                <div className="flex items-center gap-2 mt-2 text-blue-600 text-sm">
                  <div className="animate-spin rounded-full h-4 w-4 border-2 border-blue-400 border-t-transparent" />
                  Loading year data...
                </div>
              )}
            </div>
            <div className="flex-1 min-w-[180px] max-w-xs">
              <label className="block text-sm font-semibold text-gray-700 mb-2">
                Degree Level
              </label>
              {allowedDegreeLevels.length === 1 ? (
                <input
                  type="text"
                  value={degreeLevel}
                  readOnly
                  className="w-full px-4 py-2 border rounded-lg bg-gray-100 text-base cursor-not-allowed"
                />
              ) : (
                <select
                  value={degreeLevel}
                  onChange={e => setDegreeLevel(e.target.value)}
                  className="w-full px-4 py-2 border rounded-lg bg-white text-base"
                >
                  {allowedDegreeLevels.map(level => (
                    <option key={level} value={level}>{level}</option>
                  ))}
                </select>
              )}
            </div>
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

          {/* Categories Grid */}
          <div className="flex flex-col md:flex-row gap-8 justify-center items-start">
            {['PwBD', 'Muslim Minority', 'Other Minority'].map(subcategory => (
              <div
                key={subcategory}
                className="bg-white rounded-2xl shadow-md overflow-hidden border border-gray-100 hover:shadow-lg transition-all duration-300 mx-auto"
                style={{
                  minWidth: 380,
                  maxWidth: 360,
                  padding: "0.5rem 0.5rem",
                  marginBottom: 0,
                }}
              >
                <div className="bg-gradient-to-r from-[#07294d] to-[#104c8c] text-white px-4 py-2 flex items-center">
                  <h4 className="font-semibold text-base">{subcategory}</h4>
                </div>
                <div className="p-4 space-y-4">
                  {categories.map((category) => (
                    <div
                      key={category}
                      className="group bg-gray-50 hover:bg-blue-50/50 rounded-xl p-3 transition-all duration-200"
                    >
                      <div className="flex items-center justify-between mb-2">
                        <h5 className="font-semibold text-gray-800 group-hover:text-blue-700 transition-colors text-sm">
                          {category}
                        </h5>
                      </div>
                      <div className="grid grid-cols-3 gap-2">
                        {genders.map((gender) => (
                          <div key={gender} className="space-y-1">
                            <label className="block text-xs font-medium text-gray-600">
                              {gender}
                            </label>
                            <input
                              type="number"
                              min="0"
                              value={enrollmentData[subcategory][category][gender]}
                              onChange={(e) => {
                                let value = parseInt(e.target.value, 10);
                                if (isNaN(value) || value < 0) value = 0;
                                setEnrollmentData(prev => ({
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
                              className="w-full px-2 py-1.5 rounded-lg border border-gray-200 
                                focus:ring-2 focus:ring-blue-500 focus:border-transparent
                                bg-white shadow-sm transition-all duration-200
                                hover:shadow group-hover:border-blue-200 text-xs"
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
              disabled={submitting || loadingYearData || isDeclarationLocked}
              onClick={() => setShowConfirm(true)}
              className={`w-full md:w-auto max-w-md py-4 px-6 rounded-xl font-semibold text-white text-lg
                shadow-lg shadow-blue-500/20 
                ${submitting || loadingYearData || isDeclarationLocked
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
                'Submit'
              )}
            </button>

            {!isDeclarationLocked && (
              <>
                <button
                  type="button"
                  disabled={updating || loadingYearData}
                  onClick={handleUpdateEnrollment}
                  className={`w-full md:w-auto max-w-md py-4 px-6 rounded-xl font-semibold text-white text-lg
                    shadow-lg shadow-blue-500/20
                    ${updating || loadingYearData
                      ? 'bg-gray-400 cursor-not-allowed'
                      : isUpdateMode
                        ? 'bg-gradient-to-r from-green-600 to-emerald-600 hover:from-green-700 hover:to-emerald-700'
                        : 'bg-gradient-to-r from-yellow-600 to-orange-600 hover:from-yellow-700 hover:to-orange-700'
                    }
                    transform transition-all duration-200 hover:-translate-y-0.5`}
                >
                  {updating ? (
                    <div className="flex items-center justify-center space-x-2">
                      <div className="animate-spin rounded-full h-5 w-5 border-2 border-white border-t-transparent"/>
                      <span>Updating...</span>
                    </div>
                  ) : isUpdateMode ? 'Save Changes' : 'Edit'}
                </button>
                {isUpdateMode && (
                  <button
                    type="button"
                    onClick={() => {
                      // Exit edit mode and restore previous enrollment data (discard changes)
                      setIsUpdateMode(false);
                      if (backupEnrollmentData) {
                        setEnrollmentData(backupEnrollmentData);
                        setBackupEnrollmentData(null);
                      } else {
                        // fallback: reset to zeros
                        const empty = {};
                        subcategories.forEach(sub => {
                          empty[sub] = {};
                          categories.forEach(cat => {
                            empty[sub][cat] = { Male: 0, Female: 0, Transgender: 0 };
                          });
                        });
                        setEnrollmentData(empty);
                      }
                    }}
                    className="w-full md:w-auto max-w-md py-4 px-6 rounded-xl font-semibold text-gray-700 text-lg bg-gray-100 hover:bg-gray-200 shadow-lg transition-all"
                  >
                    Cancel
                  </button>
                )}
              </>
            )}
          </div>
        </form>

        {/* Student Details Table */}
        <div className="mt-12">
          <div className="flex items-center justify-between mb-6">
            <h3 className="text-lg font-semibold text-gray-900">Enrollment Records</h3>
            <div className="flex items-center gap-2">
              <span className="text-sm text-gray-500">Total Records: {studentDetails.length}</span>
            </div>
          </div>
          <div className="table-container rounded-2xl shadow-lg border border-gray-100 overflow-x-auto">
            <table className="data-table min-w-full text-sm text-gray-700">
              <thead className="table-header bg-gradient-to-r from-blue-50 to-indigo-50">
                <tr>
                  <th className="px-6 py-4 font-bold tracking-wider text-blue-700">Academic Year</th>
                  <th className="px-6 py-4 font-bold tracking-wider text-blue-700">Year</th>
                  <th className="px-6 py-4 font-bold tracking-wider text-blue-700">Degree Level</th>
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
                      <td className="px-6 py-4">{detail.degree_level}</td>
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
                        <p className="text-gray-600 font-medium">No enrollment records found</p>
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

        {/* Tabbed Summary Containers */}
        <div className="mt-12">
          <div className="flex flex-col items-center mb-6">
            <h3 className="text-lg font-semibold text-gray-900">
              Enrollment Summary ({degreeLevel})
            </h3>
            
            {/* Centered Year Tabs */}
            <div className="flex justify-center mt-4">
              <div className="flex space-x-1 bg-gray-200 p-1 rounded-lg">
                {Object.keys(summaryData).map(year => (
                  <button
                    key={year}
                    onClick={() => setSummaryYear(year)}
                    className={`px-4 py-1.5 text-sm font-semibold rounded-md transition-colors ${
                      summaryYear === year
                        ? 'bg-white text-blue-700 shadow-sm'
                        : 'bg-transparent text-gray-600 hover:bg-gray-300'
                    }`}
                  >
                    {year}
                  </button>
                ))}
              </div>
            </div>
          </div>

          {/* Summary Cards */}
          <div className="grid grid-cols-1 md:grid-cols-3 gap-8">
            {summaryData[summaryYear] && Object.entries(summaryData[summaryYear]).map(([subcategory, counts]) => (
              <div
                key={subcategory}
                className="bg-white rounded-2xl shadow-lg border border-gray-100 p-6 cursor-pointer hover:shadow-xl transition"
                onClick={() => { setEditingSubcategory(subcategory); setEditingYear(summaryYear); }}
              >
                <h4 className="font-bold text-lg text-blue-800 mb-4">{subcategory}</h4>
                <div className="flex justify-around text-center">
                  <div>
                    <p className="text-2xl font-bold text-blue-600">{counts.male}</p>
                    <p className="text-sm text-gray-500">Male</p>
                  </div>
                  <div>
                    <p className="text-2xl font-bold text-pink-600">{counts.female}</p>
                    <p className="text-sm text-gray-500">Female</p>
                  </div>
                  <div>
                    <p className="text-2xl font-bold text-purple-600">{counts.transgender}</p>
                    <p className="text-sm text-gray-500">Transgender</p>
                  </div>
                </div>
              </div>
            ))}
          </div>
        </div>

        {/* Move Year Completion Status here - CENTERED */}
            <div className="bg-blue-50/60 rounded-2xl p-6 mt-6 mb-6 shadow-sm border border-blue-100 flex flex-col gap-4 w-full max-w-4xl mx-auto">
              <div className="flex items-center justify-between mb-4">
                <div className="flex items-center gap-2">
                  <span className="inline-flex items-center justify-center w-7 h-7 rounded-full bg-blue-100">
                    <svg width="20" height="20" fill="none" viewBox="0 0 24 24"><path d="M12 2a10 10 0 100 20 10 10 0 000-20zm0 18a8 8 0 110-16 8 8 0 010 16zm-1-13h2v6h-2V7zm0 8h2v2h-2v-2z" fill="#2563eb"/></svg>
                  </span>
                  <h4 className="text-lg font-semibold text-blue-900">Year Completion Status</h4>
                </div>
                <span className="text-sm text-blue-700 font-medium">Academic Year: {selectedAcademicYear || 'N/A'}</span>
              </div>
              <div className="flex gap-8 justify-center w-full">
                {getYearSlots().map(year => (
                  <div
                    key={year}
                    className="flex flex-col items-center justify-center px-8 py-6 rounded-xl border shadow-sm"
                    style={{
                      minWidth: 180,
                      maxWidth: 220,
                      background: yearCompletionStatus[year] === 'Completed' ? '#f6fff4' : '#fffbe6',
                      borderColor: yearCompletionStatus[year] === 'Completed' ? '#b7f5c2' : '#ffe9a7',
                      boxShadow: '0 1px 6px 0 rgba(0,0,0,0.04)'
                    }}
                  >
                    <span className="mb-2">
                      <svg width="24" height="24" fill="none" viewBox="0 0 24 24">
                        <path d="M3 13h2v-2H3v2zm4 0h2v-2H7v2zm4 0h2v-2h-2v2zm4 0h2v-2h-2v2zm4 0h2v-2h-2v2z" fill="#fbbf24"/>
                      </svg>
                    </span>
                    <span className="font-semibold text-base text-gray-900 mb-1">{year}</span>
                    <span className={`px-3 py-1 rounded-full text-xs font-bold ${yearCompletionStatus[year] === 'Completed' ? 'bg-green-100 text-green-700' : 'bg-yellow-100 text-yellow-700'}`}>
                      {yearCompletionStatus[year] === 'Completed' ? 'Completed' : 'Incomplete'}
                    </span>
                  </div>
                ))}
              </div>
              <div className="flex justify-center">
                <button
                  disabled={
                    !getYearSlots().every(year => yearCompletionStatus[year] === 'Completed') ||
                    isDeclarationLocked
                  }
                  onClick={openDeclarationModal}
                  className={`py-3 px-8 rounded-lg font-semibold text-white transition-all duration-200
                    ${
                      getYearSlots().every(year => yearCompletionStatus[year] === 'Completed') && !isDeclarationLocked
                        ? 'bg-gradient-to-r from-blue-600 to-indigo-600 hover:from-blue-700 hover:to-indigo-700'
                        : 'bg-gray-400 cursor-not-allowed'
                    }`}
                  style={{
                    minWidth: 180,
                    maxWidth: 260,
                    textAlign: 'center'
                  }}
                >
                  Final Submission
                </button>
              </div>
            </div>
      </div>

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

      {/* Confirmation Dialog */}
      {showConfirm && (
        <div className="fixed inset-0 bg-black bg-opacity-40 flex items-center justify-center z-50">
          <div className="bg-white rounded-xl shadow-xl p-8 max-w-sm w-full mx-4">
            <h3 className="text-lg font-semibold text-gray-900 mb-4">
              Are you sure you want to submit {yearSlots[currentYearSlot]} student Enrollment Details?
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
                  await handleEnrollmentSubmit();
                  await updateEnrollmentStatus('finished');
                  setGlobalMessage({ type: 'success', text: 'Student enrollment data submitted successfully.' });
                  setTimeout(() => setGlobalMessage(null), 3000);
                }}
              >
                C
              </button>
            </div>
          </div>
        </div>
      )}

      {/* Declaration Modal */}
      {showDeclaration && (
        <div className="fixed inset-0 bg-black/60 backdrop-blur-sm flex items-center justify-center z-50 p-4">
          <motion.div
            initial={{ opacity: 0, scale: 0.95 }}
            animate={{ opacity: 1, scale: 1 }}
            className="bg-white rounded-2xl shadow-2xl p-4 sm:p-6 md:p-8 w-full max-w-lg sm:max-w-xl md:max-w-2xl lg:max-w-3xl mx-4 max-h-[90vh] overflow-y-auto"
          >
            {/* Header */}
            <div className="text-center mb-6 md:mb-8">
              <div className="w-12 h-12 md:w-16 md:h-16 bg-blue-600 rounded-xl md:rounded-2xl mx-auto flex items-center justify-center mb-3 md:mb-4 transform -rotate-12">
                <RiCheckboxCircleLine className="text-2xl md:text-3xl text-white" />
              </div>
              <h3 className="text-xl md:text-2xl font-bold bg-gradient-to-r from-blue-600 to-indigo-600 bg-clip-text text-transparent">
                Declaration Form
              </h3>
              <p className="text-gray-500 mt-2 text-sm md:text-base">Please review and confirm your submission</p>
            </div>

            {/* Landscape Info Card */}
            <div className="bg-gradient-to-br from-blue-50 to-indigo-50 rounded-xl p-4 md:p-6 mb-6">
              <div className="grid grid-cols-1 sm:grid-cols-2 gap-4 md:gap-6">
                <div>
                  <p className="text-xs md:text-sm font-medium text-gray-500">Academic Year</p>
                  <p className="text-sm md:text-lg font-semibold text-gray-900">{academicYears[0]}</p>
                </div>
                <div>
                  <p className="text-xs md:text-sm font-medium text-gray-500">Department Name</p>
                  <p className="text-sm md:text-lg font-semibold text-gray-900 break-words">{userData?.department}</p>
                </div>
                <div>
                  <p className="text-xs md:text-sm font-medium text-gray-500">Submitted By</p>
                  <p className="text-sm md:text-lg font-semibold text-gray-900 break-words">
                    {userData?.name || userData?.username || (
                      <span className="text-red-500 text-sm">Not Available</span>
                    )}
                  </p>
                </div>
                <div>
                  <p className="text-xs md:text-sm font-medium text-gray-500">Completed Years</p>
                  <p className="text-sm md:text-lg font-semibold text-gray-900">
                    {declarationYearSlot || ''}
                  </p>
                </div>
                <div>
                  <p className="text-xs md:text-sm font-medium text-gray-500">HOD Name</p>
                  <p className="text-sm md:text-lg font-semibold text-gray-900 break-words">
                    {hodName ? hodName : <span className="text-red-500 text-sm">Not Available</span>}
                  </p>
                </div>
                <div>
                  <p className="text-xs md:text-sm font-medium text-gray-500">Degree Level</p>
                  <p className="text-sm md:text-lg font-semibold text-gray-900">{degreeLevel}</p>
                </div>
              </div>
            </div>

            {/* Declaration Text */}
            <div className="bg-gradient-to-br from-blue-500/5 to-indigo-500/5 rounded-xl p-4 md:p-6 border border-blue-100 mb-6 md:mb-8">
              <div className="flex items-start space-x-3 md:space-x-4">
                <div className="flex-shrink-0 mt-1">
                  <div className="w-6 h-6 md:w-8 md:h-8 bg-blue-100 rounded-lg flex items-center justify-center">
                    <RiInformationLine className="text-lg md:text-xl text-blue-600" />
                  </div>
                </div>
                <div className="flex-1 min-w-0">
                  <h4 className="font-semibold text-gray-900 mb-2 text-sm md:text-base">Declaration Statement</h4>
                  <p className="text-gray-600 leading-relaxed text-xs md:text-sm break-words">
                    I hereby declare that the Student Enrollment data for{' '}
                    <span className="font-semibold text-blue-600">
                      {declarationYearSlot || ''}
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
                <div className="w-10 h-10 md:w-12 md:h-12 bg-green-100 rounded-full flex items-center justify-center">
                  <RiCheckboxCircleLine className="text-xl md:text-2xl text-green-600" />
                </div>
                <p className="font-semibold text-green-600 text-sm md:text-base">Declaration Submitted Successfully!</p>
              </motion.div>
            ) : (
              <div className="flex flex-col sm:flex-row items-center justify-end gap-3 md:gap-4">
                <button
                  className="w-full sm:w-auto px-4 md:px-6 py-2 md:py-2.5 rounded-xl bg-gray-100 text-gray-700 font-medium hover:bg-gray-200 transition-colors text-sm md:text-base"
                  onClick={() => setShowDeclaration(false)}
                  disabled={finalSubmitting}
                >
                  Cancel
                </button>
                <button
                  className="w-full sm:w-auto px-4 md:px-6 py-2 md:py-2.5 rounded-xl bg-gradient-to-r from-blue-600 to-indigo-600 
                     text-white font-medium hover:from-blue-700 hover:to-indigo-700 
                     transition-colors shadow-lg shadow-blue-500/25 text-sm md:text-base"
                  onClick={handleFinalDeclarationSubmit}
                  disabled={finalSubmitting}
                >
                  {finalSubmitting ? (
                    <div className="flex items-center gap-2 justify-center">
                      <div className="w-3 h-3 md:w-4 md:h-4 border-2 border-white/30 border-t-white rounded-full animate-spin" />
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

      {/* Modal for subcategory breakdown */}
      {editingSubcategory && editingYear && (
        <div
          className="fixed inset-0 flex items-center justify-center z-50 bg-black/40 backdrop-blur-sm"
          onClick={() => setEditingSubcategory(null)}
          style={{ transition: 'all 0.3s' }}
        >
          <motion.div
            initial={{ opacity: 0, scale: 0.95, y: 40 }}
            animate={{ opacity: 1, scale: 1, y: 0 }}
            exit={{ opacity: 0, scale: 0.95, y: 40 }}
            className="bg-white/80 backdrop-blur-xl rounded-3xl shadow-2xl p-0 max-w-xl w-full mx-4 border border-blue-100 relative"
            onClick={e => e.stopPropagation()}
            style={{
              boxShadow: '0 8px 32px 0 rgba(31, 38, 135, 0.18)',
              border: '1px solid rgba(255,255,255,0.18)'
            }}
          >
            {/* Header */}
            <div className="flex items-center justify-between px-8 py-6 bg-gradient-to-r from-blue-600 to-indigo-600 rounded-t-3xl">
              <div className="flex items-center gap-3">
                <RiBarChartBoxLine className="text-3xl text-white" />
                <h3 className="text-xl font-bold text-white">
                  {editingSubcategory} - {editingYear} Breakdown
                </h3>
              </div>
              <button
                className="text-white text-2xl hover:text-blue-200 transition"
                onClick={() => setEditingSubcategory(null)}
                title="Close"
              >
                &times;
              </button>
            </div>
            {/* Table */}
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
                    const rows = getSubcategoryBreakdown(editingSubcategory, editingYear);
                    const hasData = rows.some(r => Number(r.male) > 0 || Number(r.female) > 0 || Number(r.transgender) > 0);
                    if (!hasData) {
                      return (
                        <tr>
                          <td colSpan={4} className="py-8 text-center text-gray-400">
                            <RiBarChartBoxLine className="mx-auto text-4xl mb-2 text-blue-200" />
                            <span>No data available for this subcategory and year.</span>
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
              <button
                className="w-full py-2 bg-gradient-to-r from-blue-100 to-indigo-100 text-blue-700 rounded-lg font-semibold hover:bg-blue-200 transition"
                onClick={() => setEditingSubcategory(null)}
              >
                Close
              </button>
            </div>
          </motion.div>
        </div>
      )}
    </>
  );
}

