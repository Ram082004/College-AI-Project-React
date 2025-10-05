// ...existing code...
import React, { useEffect, useState } from 'react';
import axios from 'axios';
import AcademicYearBadge from '../../Admin-Frontend/components/AcademicYearBadge';
import { motion } from 'framer-motion';
import { RiBarChartBoxLine } from 'react-icons/ri';

const API_BASE = 'https://admin-back-j3j4.onrender.com/api';
const API = {
  ACADEMIC_YEARS: `${API_BASE}/office/academic-years`,
  OFFICE_DEPT_CREATE: `${API_BASE}/office/officedept/create`,
  OFFICE_DEPT_GET: `${API_BASE}/office/officedept/get`,
  OFFICE_DEPT_UPDATE: `${API_BASE}/office/officedept/update`,
  OFFICE_USER_YEAR: `${API_BASE}/office/teaching-staff/academic-year`,
  OFFICE_USER_YEAR_FALLBACK: `${API_BASE}/office/officedept/office-user-year`,
  ADMIN_ACADEMIC: `${API_BASE}/admin/all`
};

const categories = {
  1: 'General Including EWS',
  2: 'Scheduled Caste (SC)',
  3: 'Scheduled Tribe (ST)',
  4: 'Other Backward Classes (OBC)'
};
const subcategories = {
  5: 'PwBD',
  6: 'Muslim Minority',
  7: 'Other Minority'
};
const genders = { 1: 'Male', 2: 'Female', 3: 'Transgender' };

const DEPT_OPTIONS = [
  'B.C.A', 'B.A ENGLISH', 'M.A ENGLISH', 'BBA', 'B.COM',
  'B.SC MATHS', 'M.SC MATHS', 'B.SC Physics', 'M.Com', 'B.Sc Chemistry'
];

// add department degree classification
const PG_DEPTS = ['M.A ENGLISH', 'M.Com', 'M.SC MATHS'];
const UG_DEPTS = DEPT_OPTIONS.filter(d => !PG_DEPTS.includes(d));

function makeEmptyData() {
  const data = {};
  Object.values(subcategories).forEach(sub => {
    data[sub] = {};
    Object.values(categories).forEach(cat => {
      data[sub][cat] = { Male: 0, Female: 0, Transgender: 0 };
    });
  });
  return data;
}

export default function DeptEnrollment() {
  const [academicYears, setAcademicYears] = useState([]);
  const [adminAcademicYear, setAdminAcademicYear] = useState('');
  const [officeUserYear, setOfficeUserYear] = useState('');
  const [selectedAcademicYear, setSelectedAcademicYear] = useState('');
  const [selectedDept, setSelectedDept] = useState('');
  const [degreeLevel, setDegreeLevel] = useState('UG');
  const [degreeReadOnly, setDegreeReadOnly] = useState(false);
  const [yearSlot] = useState('I Year');
  const [enrollmentData, setEnrollmentData] = useState(makeEmptyData());
  const [existingMap, setExistingMap] = useState({});
  const [loading, setLoading] = useState(false);
  const [submitting, setSubmitting] = useState(false);
  const [globalMessage, setGlobalMessage] = useState(null);

  const [isLocked, setIsLocked] = useState(false);
  const [isEditMode, setIsEditMode] = useState(false);
  const [showConfirm, setShowConfirm] = useState(false);
  // Final submission modal states
  const [showFinalSubmission, setShowFinalSubmission] = useState(false);
  const [finalAccepted, setFinalAccepted] = useState(false);
  const [officedeptApiAvailable, setOfficedeptApiAvailable] = useState(null);
  
  const [showDetailModal, setShowDetailModal] = useState(false);
  const [detailRow, setDetailRow] = useState(null);
  const [detailRecords, setDetailRecords] = useState([]);
  const [summaryRecords, setSummaryRecords] = useState([]);


  const [activeGroupTab, setActiveGroupTab] = useState('All');

  const [currentPage, setCurrentPage] = useState(1);
  const recordsPerPage = 10;

  // Add state to track all departments completion status
  const [allDepartmentsStatus, setAllDepartmentsStatus] = useState({});
  const [loadingDepartmentStatus, setLoadingDepartmentStatus] = useState(false);

  useEffect(() => {
    if (!globalMessage) return;
    const tid = setTimeout(() => setGlobalMessage(null), 5000);
    return () => clearTimeout(tid);
  }, [globalMessage]);

  useEffect(() => {
    async function init() {
      await fetchOfficeUserYear();
      await fetchAcademicYears();
      await fetchAdminAcademicYear();
      await checkOfficedeptApi();
    }
    init();
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, []);

  useEffect(() => {
    // Reset to first page and only fetch when a department is selected.
    setCurrentPage(1);
    if (selectedDept && (selectedAcademicYear || officeUserYear)) {
      // Add slight delay to ensure all state is updated
      const timer = setTimeout(() => {
        fetchSummaryRecords();
      }, 100);
      return () => clearTimeout(timer);
    } else {
      // When no department selected, clear any previously shown details
      setDetailRecords([]);
      setSummaryRecords([]);
    }
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [selectedAcademicYear, selectedDept, degreeLevel, officeUserYear]);

  // Set degreeLevel automatically based on selected department and lock when PG-only
  useEffect(() => {
    if (!selectedDept) {
      setDegreeLevel('UG');
      setDegreeReadOnly(false);
      return;
    }
    // PG departments -> PG readonly
    if (PG_DEPTS.includes(selectedDept)) {
      setDegreeLevel('PG');
      setDegreeReadOnly(true);
      return;
    }
    // UG departments -> UG readonly (as requested)
    if (UG_DEPTS.includes(selectedDept)) {
      setDegreeLevel('UG');
      setDegreeReadOnly(true);
      return;
    }
    // Fallback: allow changing
    setDegreeLevel('UG');
    setDegreeReadOnly(false);
  }, [selectedDept]);

  async function checkOfficedeptApi() {
    try {
      await axios.get(API.OFFICE_DEPT_GET, {
        headers: { Authorization: `Bearer ${localStorage.getItem('authToken')}` },
        timeout: 3000
      });
      setOfficedeptApiAvailable(true);
    } catch (err) {
      if (err.response && err.response.status === 404) {
        setOfficedeptApiAvailable(false);
        setGlobalMessage({ type: 'error', text: 'Server routes for officedept (create/get/update) are not registered (404). Add backend routes.' });
      } else {
        setOfficedeptApiAvailable(null);
      }
    }
  }

  async function fetchOfficeUserYear() {
    try {
      let res = await axios.get(API.OFFICE_USER_YEAR, {
        headers: { Authorization: `Bearer ${localStorage.getItem('authToken')}` }
      });
      let year = res.data?.academic_year || '';
      if (!year) {
        try {
          res = await axios.get(API.OFFICE_USER_YEAR_FALLBACK, {
            headers: { Authorization: `Bearer ${localStorage.getItem('authToken')}` }
          });
          year = res.data?.academic_year || '';
        } catch {
          year = '';
        }
      }
      setOfficeUserYear(year);
      if (year) setSelectedAcademicYear(year);
    } catch {
      setOfficeUserYear('');
    }
  }

  async function fetchAcademicYears() {
    try {
      const res = await axios.get(API.ACADEMIC_YEARS, { headers: { Authorization: `Bearer ${localStorage.getItem('authToken')}` } });
      const yrs = res.data.years || [];
      setAcademicYears(yrs);
      if (!officeUserYear && yrs.length) setSelectedAcademicYear(yrs[0]);
    } catch {
      setAcademicYears([]);
    }
  }

  async function fetchAdminAcademicYear() {
    try {
      const res = await axios.get(API.ADMIN_ACADEMIC, {
        headers: { Authorization: `Bearer ${localStorage.getItem('authToken')}` }
      });
      const year = res.data?.admins?.[0]?.academic_year || '';
      setAdminAcademicYear(year);
    } catch {
      setAdminAcademicYear('');
    }
  }

  function handleInputChange(sub, cat, gender, value) {
    if (isLocked) return;
    if (isNaN(value) || value === '') value = 0;
    const v = Math.max(0, parseInt(value, 10) || 0);
    setEnrollmentData(prev => ({
      ...prev,
      [sub]: {
        ...prev[sub],
        [cat]: {
          ...prev[sub][cat],
          [gender]: v
        }
      }
    }));
  }

  function buildRecords(includeIds = false) {
    const records = [];
    Object.entries(subcategories).forEach(([subId, subName]) => {
      Object.entries(categories).forEach(([catId, catName]) => {
        Object.entries(genders).forEach(([gId, gName]) => {
          const count = enrollmentData[subName]?.[catName]?.[gName] || 0;
          if (count === 0 && !includeIds) return;
          // set status to Completed when a positive count is present,
          // otherwise keep Incompleted (useful for update payloads)
          const rec = {
            academic_year: selectedAcademicYear || officeUserYear,
            department: selectedDept,
            category_id: Number(catId),
            subcategory_id: Number(subId),
            gender_id: Number(gId),
            count,
            year: yearSlot,
            degree_level: degreeLevel,
            status: Number(count) > 0 ? 'Completed' : 'Incompleted'
          };
          const key = `${subName}__${catName}__${gName}`;
          if (includeIds && existingMap[key]) rec.id = existingMap[key];
          records.push(rec);
        });
      });
    });
    return records;
  }

  async function fetchSummaryRecords() {
    if (!selectedAcademicYear && !officeUserYear) return;
    try {
      setLoading(true);
      const res = await axios.get(API.OFFICE_DEPT_GET, {
        params: {
          academic_year: selectedAcademicYear || officeUserYear,
          department: selectedDept || undefined,
          degree_level: degreeLevel,
          year: yearSlot
        },
        headers: { Authorization: `Bearer ${localStorage.getItem('authToken')}` }
      });
      if (res.data.success) {
        const rows = res.data.rows || [];
        setDetailRecords(rows);

        const map = {};
        rows.forEach(r => {
          const key = `${r.academic_year}||${r.department}||${r.category_name || categories[r.category_id]}||${r.subcategory_name || subcategories[r.subcategory_id]}||${r.year}||${r.degree_level}`;
          if (!map[key]) {
            map[key] = {
              academic_year: r.academic_year,
              department: r.department,
              category: r.category_name || categories[r.category_id],
              subcategory: r.subcategory_name || subcategories[r.subcategory_id],
              year: r.year,
              degree_level: r.degree_level,
              male_count: 0,
              female_count: 0,
              transgender_count: 0
            };
          }
          const g = (r.gender_name || (genders[r.gender_id])) || '';
          if (g === 'Male') map[key].male_count += Number(r.count || 0);
          else if (g === 'Female') map[key].female_count += Number(r.count || 0);
          else if (g === 'Transgender') map[key].transgender_count += Number(r.count || 0);
        });
        const summary = Object.values(map);
        setSummaryRecords(summary);
        setCurrentPage(1);
      } else {
        setDetailRecords([]);
        setSummaryRecords([]);
      }
    } catch {
      setDetailRecords([]);
      setSummaryRecords([]);
    } finally {
      setLoading(false);
    }
  }

  const handleCancelEdit = () => {
    setIsEditMode(false);
    setExistingMap({});
    setEnrollmentData(makeEmptyData());
    setGlobalMessage(null);
  };

  const handleSubmit = () => {
    if (!selectedDept || !(selectedAcademicYear || officeUserYear)) {
      setGlobalMessage({ type: 'error', text: 'Select department and academic year' });
      return;
    }
    setShowConfirm(true);
  };

  // Add function to check completion status for all departments
  async function checkAllDepartmentsCompletion() {
    if (!selectedAcademicYear && !officeUserYear) return;
    
    setLoadingDepartmentStatus(true);
    try {
      const statusPromises = DEPT_OPTIONS.map(async (dept) => {
        try {
          const degreeLevel = PG_DEPTS.includes(dept) ? 'PG' : 'UG';
          const res = await axios.get(API.OFFICE_DEPT_GET, {
            params: {
              academic_year: selectedAcademicYear || officeUserYear,
              department: dept,
              degree_level: degreeLevel,
              year: yearSlot
            },
            headers: { Authorization: `Bearer ${localStorage.getItem('authToken')}` }
          });
          
          const hasData = res.data.success && (res.data.rows || []).length > 0;
          const hasNonZeroData = res.data.success && (res.data.rows || []).some(row => (row.count || 0) > 0);
          
          return {
            department: dept,
            degreeLevel: degreeLevel,
            status: hasNonZeroData ? 'Completed' : (hasData ? 'Incompleted' : 'Incompleted')
          };
        } catch (error) {
          return {
            department: dept,
            degreeLevel: PG_DEPTS.includes(dept) ? 'PG' : 'UG',
            status: 'Incompleted'
          };
        }
      });

      const results = await Promise.all(statusPromises);
      const statusMap = {};
      results.forEach(result => {
        statusMap[result.department] = {
          status: result.status,
          degreeLevel: result.degreeLevel
        };
      });
      
      setAllDepartmentsStatus(statusMap);
    } catch (error) {
      console.error('Error checking departments completion:', error);
      // Set all departments as Incompleted on error
      const statusMap = {};
      DEPT_OPTIONS.forEach(dept => {
        statusMap[dept] = {
          status: 'Incompleted',
          degreeLevel: PG_DEPTS.includes(dept) ? 'PG' : 'UG'
        };
      });
      setAllDepartmentsStatus(statusMap);
    } finally {
      setLoadingDepartmentStatus(false);
    }
  }

  // Call this function when academic year changes or after successful submissions
  useEffect(() => {
    if (selectedAcademicYear || officeUserYear) {
      checkAllDepartmentsCompletion();
    }
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [selectedAcademicYear, officeUserYear]);

  const handleConfirmSubmit = async () => {
    if (officedeptApiAvailable === false) {
      setGlobalMessage({ type: 'error', text: 'Create API not available on server. Register /api/office/officedept/create' });
      return;
    }
    setShowConfirm(false);
    setSubmitting(true);
    try {
      const records = buildRecords(false);
      const res = await axios.post(API.OFFICE_DEPT_CREATE, { records }, {
        headers: { Authorization: `Bearer ${localStorage.getItem('authToken')}` }
      });
      if (res.data.success) {
        setGlobalMessage({ type: 'success', text: res.data.message || 'Saved to officedept_data' });
        setEnrollmentData(makeEmptyData());
        setExistingMap({});
        await fetchSummaryRecords();
        await checkAllDepartmentsCompletion(); // Refresh department status
      } else {
        setGlobalMessage({ type: 'error', text: res.data.message || 'Save failed' });
      }
    } catch (err) {
      if (err.response && err.response.status === 404) {
        setGlobalMessage({ type: 'error', text: 'Create endpoint not found (404). Add backend route /api/office/officedept/create' });
        setOfficedeptApiAvailable(false);
      } else {
        setGlobalMessage({ type: 'error', text: 'Save error' });
      }
    } finally {
      setSubmitting(false);
    }
  };

  const handleLoadForEdit = async () => {
    if (!selectedDept || !(selectedAcademicYear || officeUserYear)) {
      setGlobalMessage({ type: 'error', text: 'Select department and academic year' });
      return;
    }
    if (officedeptApiAvailable === false) {
      setGlobalMessage({ type: 'error', text: 'Data API not available on server. Add backend route /api/office/officedept/get' });
      return;
    }
    setLoading(true);
    try {
      const res = await axios.get(API.OFFICE_DEPT_GET, {
        params: {
          academic_year: selectedAcademicYear || officeUserYear,
          department: selectedDept,
          degree_level: degreeLevel,
          year: yearSlot
        },
        headers: { Authorization: `Bearer ${localStorage.getItem('authToken')}` }
      });
      if (res.data.success) {
        const rows = res.data.rows || [];
        const empty = makeEmptyData();
        const map = {};
        rows.forEach(r => {
          const catName = r.category_name || categories[r.category_id];
          const subName = r.subcategory_name || subcategories[r.subcategory_id];
          const genderName = r.gender_name || genders[r.gender_id];
          if (!empty[subName] || !empty[subName][catName]) return;
          empty[subName][catName][genderName] = Number(r.count || 0);
          const key = `${subName}__${catName}__${genderName}`;
          map[key] = r.id;
        });
        setEnrollmentData(empty);
        setExistingMap(map);
        setIsEditMode(true);
        setGlobalMessage({ type: 'success', text: 'Loaded for edit' });
      } else {
        setGlobalMessage({ type: 'error', text: 'No record found' });
      }
    } catch (err) {
      if (err.response && err.response.status === 404) {
        setGlobalMessage({ type: 'error', text: 'Data endpoint not found (404). Add backend route /api/office/officedept/get' });
        setOfficedeptApiAvailable(false);
      } else {
        setGlobalMessage({ type: 'error', text: 'Failed to load data' });
      }
    } finally {
      setLoading(false);
    }
  };

  const handleSaveChanges = async () => {
    if (!isEditMode) {
      setGlobalMessage({ type: 'error', text: 'Load data first (Edit)' });
      return;
    }
    if (officedeptApiAvailable === false) {
      setGlobalMessage({ type: 'error', text: 'Update API not available on server. Add backend route /api/office/officedept/update' });
      return;
    }
    setSubmitting(true);
    try {
      const records = buildRecords(true);
      const res = await axios.put(API.OFFICE_DEPT_UPDATE, { records }, {
        headers: { Authorization: `Bearer ${localStorage.getItem('authToken')}` }
      });
      if (res.data.success) {
        setGlobalMessage({ type: 'success', text: res.data.message || 'Updated officedept_data' });
        setEnrollmentData(makeEmptyData());
        setIsEditMode(false);
        await fetchSummaryRecords();
        await checkAllDepartmentsCompletion(); // Refresh department status
      } else {
        setGlobalMessage({ type: 'error', text: res.data.message || 'Update failed' });
      }
    } catch (err) {
      if (err.response && err.response.status === 404) {
        setGlobalMessage({ type: 'error', text: 'Update endpoint not found (404). Add backend route /api/office/officedept/update' });
        setOfficedeptApiAvailable(false);
      } else {
        setGlobalMessage({ type: 'error', text: 'Update error' });
      }
    } finally {
      setSubmitting(false);
    }
  };

  function renderPagination() {
    const totalPages = Math.max(1, Math.ceil(summaryRecords.length / recordsPerPage));
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
      <div className="flex items-center justify-center mt-6 mb-4">
        <button
          onClick={() => setCurrentPage(p => Math.max(1, p - 1))}
          disabled={currentPage === 1}
          className={`px-3 py-2 rounded-lg border font-semibold mx-1 ${currentPage === 1 ? 'bg-gray-100 text-gray-400 cursor-not-allowed' : 'bg-white text-gray-700 hover:bg-blue-50'}`}
        >
          &lt; Back
        </button>
        {pages}
        <button
          onClick={() => setCurrentPage(p => Math.min(totalPages, p + 1))}
          disabled={currentPage === totalPages}
          className={`px-3 py-2 rounded-lg border font-semibold mx-1 ${currentPage === totalPages ? 'bg-gray-100 text-gray-400 cursor-not-allowed' : 'bg-white text-gray-700 hover:bg-blue-50'}`}
        >
          Next &gt;
        </button>
      </div>
    );
  }

  const paginatedSummary = summaryRecords.slice((currentPage - 1) * recordsPerPage, currentPage * recordsPerPage);

  const totalsForSubcategories = (() => {
    const totals = {};
    Object.values(subcategories).forEach(sub => totals[sub] = { male: 0, female: 0, transgender: 0 });
    const rows = detailRecords || [];
    rows.forEach(r => {
      const subName = r.subcategory_name || subcategories[r.subcategory_id];
      if (!subName || !totals[subName]) return;
      if (activeGroupTab !== 'All' && String(r.staff_group || '').trim() !== activeGroupTab) return;
      const g = (r.gender_name || (genders[r.gender_id])) || '';
      if (g === 'Male') totals[subName].male += Number(r.count || 0);
      else if (g === 'Female') totals[subName].female += Number(r.count || 0);
      else if (g === 'Transgender') totals[subName].transgender += Number(r.count || 0);
    });
    return totals;
  })();

  function openRowDetails(row) {
    setDetailRow({ ...row, __type: 'row' });
    setShowDetailModal(true);
  }

  function openSubcategoryBreakdown(subcategoryName) {
    setDetailRow({ subcategory: subcategoryName, __type: 'subcategory', totals: totalsForSubcategories[subcategoryName] });
    setShowDetailModal(true);
  }

  // Ensure lock status is fetched when academic year / office year / global messages change
  async function fetchDeptLockStatus() {
    const academic = selectedAcademicYear || officeUserYear;
    if (!academic) return;
    try {
      const res = await axios.get(`${API_BASE}/office/officedept/is-locked`, {
        params: { academic_year: academic },
        headers: { Authorization: `Bearer ${localStorage.getItem('authToken')}` }
      });
      setIsLocked(Boolean(res.data.isLocked));
    } catch {
      // keep previous state on error
    }
  }

  useEffect(() => {
    fetchDeptLockStatus();
    // also re-check after globalMessage changes (e.g. after final submit)
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [selectedAcademicYear, officeUserYear, globalMessage]);

  return (
    <div className="max-w-6xl mx-auto px-6 py-8">
      <div className="flex justify-end mb-4">
        <AcademicYearBadge year={adminAcademicYear} />
      </div>

      <h2 className="text-2xl font-bold mb-4">Department Entry</h2>

      <div className="grid grid-cols-1 md:grid-cols-4 gap-4 mb-6">
        {/* Academic Year - First */}
        <div>
          <label className="block text-sm font-semibold mb-1">Academic Year</label>
          {officeUserYear ? (
            <input type="text" readOnly value={selectedAcademicYear || officeUserYear} className="w-full p-3 rounded-lg border bg-gray-100" />
          ) : (
            <select value={selectedAcademicYear} onChange={e => setSelectedAcademicYear(e.target.value)} className="w-full p-3 rounded-lg border bg-white">
              <option value="">Select Academic Year</option>
              {academicYears.map(y => <option key={y} value={y}>{y}</option>)}
            </select>
          )}
        </div>

        {/* Degree Level - Second */}
        <div>
          <label className="block text-sm font-semibold mb-1">Degree Level</label>
          {degreeReadOnly ? (
            <input type="text" readOnly value={degreeLevel} className="w-full p-3 rounded-lg border bg-gray-100" />
          ) : (
            <select value={degreeLevel} onChange={e => setDegreeLevel(e.target.value)} className="w-full p-3 rounded-lg border">
              <option value="UG">UG</option>
              <option value="PG">PG</option>
            </select>
          )}
        </div>

        {/* Department - Third */}
        <div>
          <label className="block text-sm font-semibold mb-1">Department</label>
          <select value={selectedDept} onChange={e => setSelectedDept(e.target.value)} className="w-full p-3 rounded-lg border">
            <option value="">Select Department</option>
            {DEPT_OPTIONS.map(d => <option key={d} value={d}>{d}</option>)}
          </select>
        </div>

        {/* Year Slot - Fourth */}
        <div>
          <label className="block text-sm font-semibold mb-1">Year Slot</label>
          <div className="inline-block px-4 py-3 bg-white rounded-lg border">{yearSlot}</div>
        </div>
      </div>

      <div className="grid md:grid-cols-3 gap-6">
        {Object.values(subcategories).map(sub => (
          <div key={sub} className="bg-white rounded-2xl shadow p-4 border">
            <div className="bg-gradient-to-r from-blue-700 to-indigo-700 text-white px-3 py-2 rounded-md mb-3 font-semibold">{sub}</div>
            <div className="space-y-3">
              {Object.values(categories).map(cat => (
                <div key={cat} className="bg-gray-50 rounded-lg p-2">
                  <div className="flex items-center justify-between mb-2">
                    <div className="text-sm font-medium">{cat}</div>
                  </div>
                  <div className="grid grid-cols-3 gap-2">
                    {Object.values(genders).map(g => (
                      <div key={g} className="flex flex-col">
                        <label className="text-xs text-gray-600 mb-1">{g}</label>
                        <input
                          type="number"
                          min="0"
                          value={enrollmentData[sub][cat][g]}
                          onChange={e => handleInputChange(sub, cat, g, e.target.value)}
                          disabled={isLocked}
                          className="p-2 rounded border"
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

      <div className="flex gap-4 mt-6 justify-center">
        {!isEditMode ? (
          <>
            <button
              onClick={handleSubmit}
              disabled={submitting || loading || isLocked}
              className={`px-6 py-2 rounded-lg text-white ${submitting || isLocked ? 'bg-gray-400 cursor-not-allowed' : 'bg-blue-600'}`}
            >
              Submit
            </button>
            <button
              onClick={handleLoadForEdit}
              disabled={loading || isLocked}
              className={`px-6 py-2 rounded-lg ${loading || isLocked ? 'bg-gray-400 cursor-not-allowed text-white' : 'bg-yellow-600 text-white'}`}
            >
              Edit
            </button>
          </>
        ) : (
          <>
            <button
              onClick={handleSaveChanges}
              disabled={submitting || isLocked}
              className={`px-6 py-2 rounded-lg text-white ${submitting || isLocked ? 'bg-gray-400 cursor-not-allowed' : 'bg-green-600'}`}
            >
              Save Changes
            </button>
            <button
              onClick={handleCancelEdit}
              disabled={submitting}
              className="px-6 py-2 rounded-lg bg-gray-300 text-gray-800"
            >
              Cancel
            </button>
          </>
        )}
      </div>

      {/* Enrollment records and summary: show only when department selected.
          If selected but no records, show a helpful message instead of empty table. */}
      {selectedDept ? (
        summaryRecords.length > 0 ? (
          <div className="mt-10">
            <div className="flex items-center justify-between mb-4">
              <h3 className="text-lg font-semibold text-gray-900">Enrollment Records</h3>
              <div className="text-sm text-gray-500">Total Records: {summaryRecords.length}</div>
            </div>

            <div className="rounded-3xl shadow-xl border border-blue-100 overflow-x-auto bg-white">
              <table className="min-w-full text-sm text-gray-700">
                <thead className="bg-gradient-to-r from-blue-50 to-indigo-50">
                  <tr>
                    <th className="px-6 py-4 font-bold tracking-wider text-blue-700 text-left">Academic Year</th>
                    <th className="px-6 py-4 font-bold tracking-wider text-blue-700 text-left">Department</th>
                    <th className="px-6 py-4 font-bold tracking-wider text-blue-700 text-left">Category</th>
                    <th className="px-6 py-4 font-bold tracking-wider text-blue-700 text-left">Subcategory</th>
                    <th className="px-6 py-4 font-bold tracking-wider text-blue-700 text-center">Male</th>
                    <th className="px-6 py-4 font-bold tracking-wider text-blue-700 text-center">Female</th>
                    <th className="px-6 py-4 font-bold tracking-wider text-blue-700 text-center">Transgender</th>
                  </tr>
                </thead>
                <tbody className="divide-y divide-blue-50">
                  {paginatedSummary.map((row, idx) => (
                    <tr key={idx} className="hover:bg-gradient-to-r hover:from-blue-50 hover:to-indigo-50 transition">
                      <td className="px-6 py-4 font-medium">{row.academic_year}</td>
                      <td className="px-6 py-4">{row.department}</td>
                      <td className="px-6 py-4">{row.category}</td>
                      <td className="px-6 py-4">{row.subcategory}</td>
                      <td className="px-6 py-4 text-center"><span className="inline-block px-3 py-1 rounded-full bg-blue-100 text-blue-700 font-semibold">{row.male_count}</span></td>
                      <td className="px-6 py-4 text-center"><span className="inline-block px-3 py-1 rounded-full bg-pink-100 text-pink-600 font-semibold">{row.female_count}</span></td>
                      <td className="px-6 py-4 text-center"><span className="inline-block px-3 py-1 rounded-full bg-purple-100 text-purple-700 font-semibold">{row.transgender_count}</span></td>
                    </tr>
                  ))}
                </tbody>
              </table>
            </div>

            {renderPagination()}

            {/* Subcategory summary cards */}
            <div className="mb-6 mt-6">
              <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
                {Object.values(subcategories).map(sub => {
                  const t = totalsForSubcategories[sub] || { male: 0, female: 0, transgender: 0 };
                  return (
                    <div key={sub} className="bg-white rounded-2xl shadow-lg border p-6 cursor-pointer hover:shadow-2xl transition" onClick={() => openSubcategoryBreakdown(sub)}>
                      <h4 className="text-blue-700 font-semibold mb-4">{sub}</h4>
                      <div className="flex justify-around">
                        <div className="text-center">
                          <p className="text-2xl font-bold text-blue-600">{t.male}</p>
                          <p className="text-xs text-gray-500">Male</p>
                        </div>
                        <div className="text-center">
                          <p className="text-2xl font-bold text-pink-600">{t.female}</p>
                          <p className="text-xs text-gray-500">Female</p>
                        </div>
                        <div className="text-center">
                          <p className="text-2xl font-bold text-purple-700">{t.transgender}</p>
                          <p className="text-xs text-gray-500">Transgender</p>
                        </div>
                      </div>
                    </div>
                  );
                })}
              </div>
            </div>

           

            {/* Department Completion Status Container - MOVED BELOW Final Submission */}
            <div className="flex justify-center mt-6 mb-6">
              <div className="bg-blue-50/60 rounded-2xl p-6 shadow-sm border border-blue-100 flex flex-col gap-4 w-full max-w-4xl">
                <div className="flex items-center justify-between mb-4">
                  <div className="flex items-center gap-2">
                    <span className="inline-flex items-center justify-center w-7 h-7 rounded-full bg-blue-100">
                      <svg width="20" height="20" fill="none" viewBox="0 0 24 24">
                        <path d="M12 2a10 10 0 100 20 10 10 0 000-20zm0 18a8 8 0 110-16 8 8 0 010 16zm-1-13h2v6h-2V7zm0 8h2v2h-2v-2z" fill="#2563eb"/>
                      </svg>
                    </span>
                    <h4 className="text-lg font-semibold text-blue-900">Department Completion Status</h4>
                  </div>
                  <span className="text-sm text-blue-700 font-medium">
                    Academic Year: {selectedAcademicYear || officeUserYear || 'N/A'}
                  </span>
                </div>
                
                {loadingDepartmentStatus ? (
                  <div className="flex items-center justify-center py-8">
                    <div className="animate-spin rounded-full h-8 w-8 border-2 border-blue-600 border-t-transparent"></div>
                    <span className="ml-2 text-blue-600">Loading department status...</span>
                  </div>
                ) : (
                  <div className="flex flex-col gap-3">
                    {/* Split departments into rows of 5 */}
                    {Array.from({ length: Math.ceil(DEPT_OPTIONS.length / 5) }, (_, rowIndex) => (
                      <div key={rowIndex} className="flex gap-3 justify-center">
                        {DEPT_OPTIONS.slice(rowIndex * 5, (rowIndex + 1) * 5).map(dept => {
                          const deptStatus = allDepartmentsStatus[dept] || { status: 'Incompleted', degreeLevel: 'UG' };
                          const isCompleted = deptStatus.status === 'Completed';
                          
                          return (
                            <div
                              key={dept}
                              className="flex flex-col items-center justify-center px-3 py-4 rounded-lg border shadow-sm transition-all hover:shadow-md cursor-pointer"
                              style={{
                                minWidth: 140,
                                maxWidth: 160,
                                background: isCompleted ? '#f6fff4' : '#fffbe6',
                                borderColor: isCompleted ? '#b7f5c2' : '#ffe9a7',
                                boxShadow: '0 1px 4px 0 rgba(0,0,0,0.03)'
                              }}
                              onClick={() => {
                                setSelectedDept(dept);
                                setDegreeLevel(deptStatus.degreeLevel);
                              }}
                            >
                              <span className="mb-2">
                                <svg width="20" height="20" fill="none" viewBox="0 0 24 24">
                                  <path 
                                    d="M12 14l9-5-9-5-9 5 9 5z M12 14l6.16-3.422a12.083 12.083 0 01.665 6.479A11.952 11.952 0 0012 20.055a11.952 11.952 0 00-6.824-2.998 12.078 12.078 0 01.665-6.479L12 14z" 
                                    stroke={isCompleted ? "#10b981" : "#f59e0b"} 
                                    strokeWidth="2" 
                                    strokeLinecap="round" 
                                    strokeLinejoin="round"
                                  />
                                </svg>
                              </span>
                              <span className="font-medium text-xs text-gray-900 mb-1 text-center leading-tight">
                                {dept}
                              </span>
                              <span className="text-xs text-gray-600 mb-2">
                                ({deptStatus.degreeLevel})
                              </span>
                              <span className={`px-2 py-1 rounded-full text-xs font-bold ${
                                isCompleted 
                                  ? 'bg-green-100 text-green-700' 
                                  : 'bg-yellow-100 text-yellow-700'
                              }`}>
                                {isCompleted ? 'Completed' : 'Incompleted'}
                              </span>
                            </div>
                          );
                        })}
                      </div>
                    ))}
                  </div>
                )}

                {/* Progress Summary at bottom of container */}
                <div className="flex justify-center mt-4 pt-4 border-t border-blue-200">
                  <div className="text-center">
                    <div className="flex items-center gap-4">
                      <div className="flex items-center gap-2">
                        <div className="w-3 h-3 rounded-full bg-green-500"></div>
                        <span className="text-sm font-medium text-gray-700">
                          Completed: {Object.values(allDepartmentsStatus).filter(d => d.status === 'Completed').length}
                        </span>
                      </div>
                      <div className="flex items-center gap-2">
                        <div className="w-3 h-3 rounded-full bg-yellow-500"></div>
                        <span className="text-sm font-medium text-gray-700">
                          Pending: {Object.values(allDepartmentsStatus).filter(d => d.status === 'Incompleted').length}
                        </span>
                      </div>
                      <div className="flex items-center gap-2">
                        <div className="w-3 h-3 rounded-full bg-blue-500"></div>
                        <span className="text-sm font-medium text-gray-700">
                          Total: {DEPT_OPTIONS.length}
                        </span>
                      </div>
                    </div>
                  </div>
                </div>
              </div>
            </div>

             {/* Final Submission Button - Show ONLY when ALL departments are completed */}
            {summaryRecords.length > 0 && 
             Object.keys(allDepartmentsStatus).length > 0 && 
             Object.values(allDepartmentsStatus).every(d => d.status === 'Completed') && (
               <div className="flex justify-center my-8">
                <div className="text-center">
                  <div className="mb-2 text-sm text-green-600 font-medium">
                    ✅ All departments ({Object.values(allDepartmentsStatus).filter(d => d.status === 'Completed').length}/{DEPT_OPTIONS.length}) have completed data submission
                  </div>
                  <button
                    className={`px-8 py-3 rounded-xl font-bold shadow-lg transition-transform ${isLocked ? 'bg-gray-400 text-gray-200 cursor-not-allowed' : 'bg-gradient-to-r from-indigo-600 to-blue-600 text-white hover:scale-105'}`}
                    onClick={() => { if (!isLocked) { setShowFinalSubmission(true); setFinalAccepted(false); } }}
                    disabled={isLocked}
                  >
                    Final Submission (All Departments Completed)
                  </button>
                </div>
               </div>
             )}

          </div>
        ) : (
          <div className="mt-10 text-center text-gray-500">
            No enrollment records found for <strong>{selectedDept}</strong>. Use the form above to add records.
          </div>
        )
      ) : (
        <div className="mt-10 text-center text-gray-500">
          Please select a department to view enrollment records and summaries.
        </div>
      )}

      {showConfirm && (
        <div className="fixed inset-0 bg-black/40 flex items-center justify-center z-50">
          <div className="bg-white rounded-xl p-6 max-w-lg w-full">
            <h3 className="text-lg font-semibold mb-4">Confirm submission</h3>
            <p className="text-sm text-gray-700 mb-6">You are about to submit the department enrollment for <strong>{selectedDept}</strong> ({selectedAcademicYear || officeUserYear}). Proceed?</p>
            <div className="flex justify-end gap-3">
              <button onClick={() => setShowConfirm(false)} className="px-4 py-2 rounded-lg bg-gray-100">Cancel</button>
              <button onClick={handleConfirmSubmit} className="px-4 py-2 rounded-lg bg-blue-600 text-white">Confirm &amp; Save</button>
            </div>
          </div>
        </div>
      )}

      {/* Final Submission modal (confirmation + declaration) */}
      {showFinalSubmission && (
        <div className="fixed inset-0 bg-black/40 flex items-center justify-center z-50">
          <div className="bg-white rounded-2xl p-8 max-w-lg w-full mx-4">
            <div className="text-center mb-6">
              <h3 className="text-2xl font-bold">Final Submission</h3>
              <p className="text-gray-500 mt-2">You are about to perform final submission for academic year <strong>{selectedAcademicYear || officeUserYear}</strong>. This action will mark records as final and lock further edits. Proceed?</p>
            </div>
            <label className="flex items-center mb-6">
              <input type="checkbox" checked={finalAccepted} onChange={e => setFinalAccepted(e.target.checked)} className="mr-2" />
              I accept and confirm final submission
            </label>
            <div className="flex justify-end gap-3">
              <button className="px-4 py-2 rounded-lg bg-gray-100" onClick={() => setShowFinalSubmission(false)}>Cancel</button>
              <button
                className={`px-4 py-2 rounded-lg ${!finalAccepted ? 'bg-gray-300 text-gray-600 cursor-not-allowed' : 'bg-blue-600 text-white'}`}
                disabled={!finalAccepted}
                onClick={async () => {
                  setShowFinalSubmission(false);
                  try {
                    const res = await axios.post(`${API_BASE}/office/officedept/final-submit`, {
                      academic_year: selectedAcademicYear || officeUserYear,
                      type: "Department Enrollment",
                      status: "Completed"
                    }, { headers: { Authorization: `Bearer ${localStorage.getItem('authToken')}` }});
                    if (res.data && res.data.success) {
                      setGlobalMessage({ type: 'success', text: res.data.message || 'Final submission completed and locked.' });
                      // re-check lock status from server (admin controls unlock)
                      await fetchDeptLockStatus();
                    } else {
                      setGlobalMessage({ type: 'error', text: res.data.message || 'Final submission failed.' });
                    }
                  } catch (err) {
                    setGlobalMessage({ type: 'error', text: 'Final submission error' });
                  }
                }}
              >
                Confirm & Submit
              </button>
            </div>
          </div>
        </div>
      )}

      {/* show informative banner when locked */}
      {isLocked && (
        <div className="mb-4 p-3 rounded-lg bg-yellow-100 text-yellow-800 font-semibold">
          This academic year is locked. Editing and final submission are disabled. Only an Nodel can unlock.
        </div>
      )}

      {showDetailModal && detailRow && (
        <div
          className="fixed inset-0 flex items-center justify-center z-50 bg-black/40 backdrop-blur-sm"
          onClick={() => setShowDetailModal(false)}
        >
          <motion.div
            initial={{ opacity: 0, scale: 0.95, y: 40 }}
            animate={{ opacity: 1, scale: 1, y: 0 }}
            exit={{ opacity: 0, scale: 0.95, y: 40 }}
            className="bg-white/95 rounded-3xl shadow-2xl p-0 max-w-3xl w-full mx-4 overflow-hidden border border-blue-100 relative"
            onClick={e => e.stopPropagation()}
            style={{ boxShadow: '0 8px 32px rgba(31,38,135,0.12)' }}
          >
            <div className="flex items-center justify-between px-8 py-6 bg-gradient-to-r from-blue-600 to-indigo-600 text-white">
              <div className="flex items-center gap-3">
                <RiBarChartBoxLine className="text-3xl" />
                <h3 className="text-xl font-bold">
                  {detailRow.__type === 'subcategory' ? `Breakdown - ${detailRow.subcategory}` : `Details - ${detailRow.subcategory || ''}`}{" "}
                  <span className="text-sm font-normal ml-2">{detailRow.academic_year || (selectedAcademicYear || officeUserYear)}</span>
                </h3>
              </div>
              <button className="text-white text-2xl hover:text-blue-200" onClick={() => setShowDetailModal(false)}>×</button>
            </div>

            <div className="px-8 py-6">
              {detailRow.__type === 'row' ? (
                <table className="min-w-full text-sm text-gray-700">
                  <thead>
                    <tr className="bg-gradient-to-r from-blue-100 to-indigo-100">
                      <th className="px-4 py-2 text-left font-bold">Academic Year</th>
                      <th className="px-4 py-2 text-left font-bold">Department</th>
                      <th className="px-4 py-2 text-left font-bold">Category</th>
                      <th className="px-4 py-2 text-center font-bold">Male</th>
                      <th className="px-4 py-2 text-center font-bold">Female</th>
                      <th className="px-4 py-2 text-center font-bold">Transgender</th>
                    </tr>
                  </thead>
                  <tbody>
                    <tr className="border-b">
                      <td className="px-4 py-3">{detailRow.academic_year}</td>
                      <td className="px-4 py-3">{detailRow.department}</td>
                      <td className="px-4 py-3">{detailRow.category}</td>
                      <td className="px-4 py-3 text-center">{detailRow.male_count ?? 0}</td>
                      <td className="px-4 py-3 text-center">{detailRow.female_count ?? 0}</td>
                      <td className="px-4 py-3 text-center">{detailRow.transgender_count ?? 0}</td>
                    </tr>
                    {detailRecords.filter(d => (d.category_name || categories[d.category_id]) === detailRow.category && (d.subcategory_name || subcategories[d.subcategory_id]) === detailRow.subcategory && (activeGroupTab === 'All' || String(d.staff_group || '').trim() === activeGroupTab)).map((d, i) => (
                      <tr key={i} className="bg-gray-50">
                        <td className="px-4 py-2">{d.academic_year}</td>
                        <td className="px-4 py-2">{d.department}</td>
                        <td className="px-4 py-2">{d.category_name || categories[d.category_id]}</td>
                        <td className="px-4 py-2 text-center">{d.gender_name === 'Male' ? d.count : (d.gender_id === 1 ? d.count : 0)}</td>
                        <td className="px-4 py-2 text-center">{d.gender_name === 'Female' ? d.count : (d.gender_id === 2 ? d.count : 0)}</td>
                        <td className="px-4 py-2 text-center">{d.gender_name === 'Transgender' ? d.count : (d.gender_id === 3 ? d.count : 0)}</td>
                      </tr>
                    ))}
                  </tbody>
                </table>
              ) : (
                <table className="min-w-full text-sm text-gray-700">
                  <thead>
                    <tr className="bg-gradient-to-r from-blue-100 to-indigo-100">
                      <th className="px-4 py-2 text-left font-bold">Category</th>
                      <th className="px-4 py-2 text-center font-bold">Male</th>
                      <th className="px-4 py-2 text-center font-bold">Female</th>
                      <th className="px-4 py-2 text-center font-bold">Transgender</th>
                    </tr>
                  </thead>
                  <tbody>
                    {(() => {
                      const rows = (detailRecords || []).filter(d => (d.subcategory_name || subcategories[d.subcategory_id]) === detailRow.subcategory && (activeGroupTab === 'All' || String(d.staff_group || '').trim() === activeGroupTab));
                      const map = {};
                      rows.forEach(r => {
                        const cat = r.category_name || categories[r.category_id];
                        if (!map[cat]) map[cat] = { male: 0, female: 0, transgender: 0 };
                        const g = r.gender_name || genders[r.gender_id];
                        if (g === 'Male') map[cat].male += Number(r.count || 0);
                        else if (g === 'Female') map[cat].female += Number(r.count || 0);
                        else if (g === 'Transgender') map[cat].transgender += Number(r.count || 0);
                      });
                      const rowsToRender = Object.keys(map);
                      if (rowsToRender.length === 0) {
                        return (<tr><td colSpan={4} className="py-8 text-center text-gray-400">No data available for this subcategory and selection.</td></tr>);
                      }
                      return rowsToRender.map(cat => (
                        <tr key={cat} className="hover:bg-gray-50">
                          <td className="px-4 py-2 font-semibold">{cat}</td>
                          <td className="px-4 py-2 text-center text-blue-700">{map[cat].male}</td>
                          <td className="px-4 py-2 text-center text-pink-700">{map[cat].female}</td>
                          <td className="px-4 py-2 text-center text-purple-700">{map[cat].transgender}</td>
                        </tr>
                      ));
                    })()}
                  </tbody>
                </table>
              )}
            </div>

            <div className="px-8 pb-6">
              <button
                className="w-full py-2 bg-gradient-to-r from-blue-100 to-indigo-100 text-blue-700 rounded-lg font-semibold hover:bg-blue-200 transition"
                onClick={() => setShowDetailModal(false)}
              >
                Close
              </button>
            </div>
          </motion.div>
        </div>
      )}

      {globalMessage && (
        <div className={`fixed bottom-4 right-4 px-6 py-3 rounded-xl ${globalMessage.type === 'success' ? 'bg-green-500 text-white' : 'bg-red-500 text-white'}`}>
          {globalMessage.text}
        </div>
      )}

      {officedeptApiAvailable === false && (
        <div className="mb-4 text-sm text-red-600">Officedept backend routes not found (404). Add server routes: /api/office/officedept/create, /get, /update.</div>
      )}
    </div>
  );
}
// ...existing code...