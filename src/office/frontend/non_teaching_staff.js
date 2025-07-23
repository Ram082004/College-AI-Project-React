import React, { useState, useEffect } from "react";
import axios from "axios";

const API_BASE = "http://localhost:5000/api/office";
const API = {
  DROPDOWNS: `${API_BASE}/non-teaching-staff/dropdowns`,
  STAFF: `${API_BASE}/non-teaching-staff`
};

const DEFAULT_STAFF_TYPE = "Non Teaching Staff Excluding Lib & Phy Education";
const GROUP_OPTIONS = ["Group B", "Group C", "Group D"];

function NonTeachingStaff() {
  // Pagination state
  const [currentPage, setCurrentPage] = useState(1);
  const recordsPerPage = 10;

  const [dropdowns, setDropdowns] = useState({
    categories: [],
    subcategories: [],
    genders: []
  });
  const [academicYear, setAcademicYear] = useState("");
  const [staffGroup, setStaffGroup] = useState("");
  const [formData, setFormData] = useState({});
  const [loading, setLoading] = useState(false);
  const [globalMessage, setGlobalMessage] = useState(null);
  const [submittedRecords, setSubmittedRecords] = useState([]);
  const [isEditMode, setIsEditMode] = useState(false);
  const [editLoading, setEditLoading] = useState(false);
  const [sanctionedStrength, setSanctionedStrength] = useState("");

  // Fetch dropdowns
  useEffect(() => {
    async function fetchDropdowns() {
      const res = await axios.get(API.DROPDOWNS);
      if (res.data.success) {
        setDropdowns({
          categories: res.data.categories,
          subcategories: res.data.subcategories,
          genders: res.data.genders
        });
      }
    }
    fetchDropdowns();
  }, []);

  // Fetch academic year from office users
  useEffect(() => {
    async function fetchOfficeUsers() {
      try {
        const res = await axios.get("http://localhost:5000/api/office-user/office-users", {
          headers: { Authorization: `Bearer ${localStorage.getItem("authToken")}` }
        });
        if (res.data.success && res.data.users.length > 0) {
          setAcademicYear(res.data.users[0].academic_year || "");
        }
      } catch {
        setAcademicYear("");
      }
    }
    fetchOfficeUsers();
  }, []);

  // Fetch submitted records
  const fetchSubmittedRecords = async () => {
    try {
      const res = await axios.get(API.STAFF);
      if (res.data.success) setSubmittedRecords(res.data.data || []);
    } catch {
      setSubmittedRecords([]);
    }
  };

  useEffect(() => {
    fetchSubmittedRecords();
  }, []);

  // Reset to page 1 if records change
  useEffect(() => {
    setCurrentPage(1);
  }, [submittedRecords.length]);

  useEffect(() => {
    if (globalMessage?.type === 'success') fetchSubmittedRecords();
  }, [globalMessage]);

  // Reset form when academic year changes
  useEffect(() => {
    if (
      dropdowns.subcategories.length > 0 &&
      dropdowns.categories.length > 0 &&
      dropdowns.genders.length > 0
    ) {
      const initialData = {};
      dropdowns.subcategories.forEach(sub => {
        initialData[sub.id] = {};
        dropdowns.categories.forEach(cat => {
          initialData[sub.id][cat.id] = {};
          dropdowns.genders.forEach(gender => {
            initialData[sub.id][cat.id][gender.id] = 0;
          });
        });
      });
      setFormData(initialData);
      setIsEditMode(false);
      setStaffGroup("");
    }
  }, [academicYear, dropdowns]);

  // Handle input change
  const handleInputChange = (subId, catId, genderId, value) => {
    setFormData(prev => ({
      ...prev,
      [subId]: {
        ...prev[subId],
        [catId]: {
          ...prev[subId][catId],
          [genderId]: value < 0 ? 0 : Number(value)
        }
      }
    }));
  };

  // Save handler
  const handleEnrollment = async (e) => {
    e.preventDefault();
    setLoading(true);
    setGlobalMessage(null);
    if (!sanctionedStrength || isNaN(sanctionedStrength) || Number(sanctionedStrength) < 0) {
      setLoading(false);
      setGlobalMessage({ type: 'error', text: 'Please enter a valid sanctioned strength.' });
      return;
    }
    const records = [];
    let firstRecord = true;
    Object.entries(formData).forEach(([subId, cats]) => {
      Object.entries(cats).forEach(([catId, genders]) => {
        Object.entries(genders).forEach(([genderId, value]) => {
          if (value > 0) {
            records.push({
              academic_year: academicYear,
              staff_type: DEFAULT_STAFF_TYPE,
              staff_group: staffGroup,
              category_id: parseInt(catId),
              subcategory_id: parseInt(subId),
              gender_id: parseInt(genderId),
              filled_count: value,
              sanctioned_strength: firstRecord ? Number(sanctionedStrength) : 0
            });
            firstRecord = false;
          }
        });
      });
    });
    if (records.length === 0) {
      setLoading(false);
      setGlobalMessage({ type: 'error', text: 'Please enter at least one filled count.' });
      return;
    }
    try {
      const res = await axios.post(API.STAFF, { records });
      setLoading(false);
      setGlobalMessage({ type: 'success', text: res.data.message || 'Non-Teaching Staff Enrollment submitted successfully!' });
      // Reset form fields to zero after submit
      const resetData = {};
      dropdowns.subcategories.forEach(sub => {
        resetData[sub.id] = {};
        dropdowns.categories.forEach(cat => {
          resetData[sub.id][cat.id] = {};
          dropdowns.genders.forEach(gender => {
            resetData[sub.id][cat.id][gender.id] = 0;
          });
        });
      });
      setFormData(resetData);
      setIsEditMode(false);
      setStaffGroup("");
      setSanctionedStrength("");
    } catch {
      setLoading(false);
      setGlobalMessage({ type: 'error', text: 'Failed to submit enrollment.' });
    }
  };

  // Fetch and fill form for selected group (Edit Enrollment)
  const handleEditEnrollment = async () => {
    if (!staffGroup) {
      setGlobalMessage({ type: 'error', text: 'Please select a group to edit.' });
      return;
    }
    setEditLoading(true);
    try {
      const res = await axios.get(API.STAFF);
      if (res.data.success) {
        // Filter records for current academic year and selected group
        const filtered = res.data.data.filter(
          r => r.academic_year === academicYear && r.staff_group === staffGroup
        );
        // Build formData object (fill all fields for the group)
        const newData = {};
        dropdowns.subcategories.forEach(sub => {
          newData[sub.id] = {};
          dropdowns.categories.forEach(cat => {
            newData[sub.id][cat.id] = {};
            dropdowns.genders.forEach(gender => {
              const rec = filtered.find(
                r =>
                  r.subcategory_id === sub.id &&
                  r.category_id === cat.id &&
                  r.gender_id === gender.id
              );
              newData[sub.id][cat.id][gender.id] = rec ? rec.filled_count : 0;
            });
          });
        });
        // Always prefill sanctioned strength for this group/year
        let ss = "";
        const ssRec = filtered.find(r => r.sanctioned_strength !== undefined && r.sanctioned_strength !== null && Number(r.sanctioned_strength) > 0);
        if (ssRec) ss = ssRec.sanctioned_strength;
        setSanctionedStrength(ss);
        setFormData(newData);
        setIsEditMode(true);
        setGlobalMessage({ type: 'success', text: 'Enrollment data loaded. You can now save changes.' });
      } else {
        setGlobalMessage({ type: 'error', text: 'No enrollment data found for selected group.' });
      }
    } catch {
      setGlobalMessage({ type: 'error', text: 'Failed to fetch enrollment data for edit.' });
    } finally {
      setEditLoading(false);
    }
  };

  // Save changes (Update Enrollment)
  const handleUpdateEnrollment = async (e) => {
    e.preventDefault();
    setLoading(true);
    setGlobalMessage(null);
    if (!sanctionedStrength || isNaN(sanctionedStrength) || Number(sanctionedStrength) < 0) {
      setLoading(false);
      setGlobalMessage({ type: 'error', text: 'Please enter a valid sanctioned strength.' });
      return;
    }
    const updateRecords = [];
    let firstRecord = true;
    Object.entries(formData).forEach(([subId, cats]) => {
      Object.entries(cats).forEach(([catId, genders]) => {
        Object.entries(genders).forEach(([genderId, value]) => {
          updateRecords.push({
            staff_type: DEFAULT_STAFF_TYPE,
            staff_group: staffGroup,
            category_id: parseInt(catId),
            subcategory_id: parseInt(subId),
            gender_id: parseInt(genderId),
            filled_count: value,
            academic_year: academicYear,
            sanctioned_strength: firstRecord ? Number(sanctionedStrength) : 0
          });
          firstRecord = false;
        });
      });
    });
    try {
      await axios.put(`${API.STAFF}/update-group`, { records: updateRecords, staff_group: staffGroup, academic_year: academicYear });
      setLoading(false);
      setGlobalMessage({ type: 'success', text: 'Enrollment data updated successfully!' });
      setIsEditMode(false);
      setStaffGroup("");
      setSanctionedStrength("");
      // Reset form
      const resetData = {};
      dropdowns.subcategories.forEach(sub => {
        resetData[sub.id] = {};
        dropdowns.categories.forEach(cat => {
          resetData[sub.id][cat.id] = {};
          dropdowns.genders.forEach(gender => {
            resetData[sub.id][cat.id][gender.id] = 0;
          });
        });
      });
      setFormData(resetData);
      fetchSubmittedRecords();
    } catch {
      setLoading(false);
      setGlobalMessage({ type: 'error', text: 'Failed to update enrollment data.' });
    }
  };

  // Hide global message after 3 seconds
  useEffect(() => {
    if (globalMessage?.type === 'success') {
      const timer = setTimeout(() => setGlobalMessage(null), 3000); // 3 seconds
      return () => clearTimeout(timer);
    }
  }, [globalMessage]);

  // Filter records for the selected academic year
  const filteredRecords = submittedRecords.filter(
    (row) => row.academic_year === academicYear
  );

  // Filter sanctioned strength summary for the selected academic year
  const filteredSanctionedStrengthRows = getSanctionedStrengthRows(submittedRecords).filter(
    (row) => row.academic_year === academicYear
  );

  const totalPages = Math.ceil(filteredRecords.length / recordsPerPage);
  const paginatedRecords = filteredRecords.slice(
    (currentPage - 1) * recordsPerPage,
    currentPage * recordsPerPage
  );

  // Modern pagination UI builder
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
    <div className="max-w-7xl mx-auto bg-gradient-to-br from-blue-50 to-indigo-100 rounded-3xl shadow-2xl p-8 md:p-12">
      <h2 className="text-3xl font-extrabold text-cyan-700 mb-8 text-center tracking-tight">Non-Teaching Staff Enrollment</h2>
      {globalMessage && (
        <div className={`mb-6 px-6 py-3 rounded-xl font-semibold text-base shadow ${
          globalMessage.type === 'success' ? 'bg-green-100 text-green-800' : 'bg-red-100 text-red-800'
        }`}>
          {globalMessage.text}
        </div>
      )}
      <form onSubmit={isEditMode ? handleUpdateEnrollment : handleEnrollment} className="space-y-10">
        <div className="grid grid-cols-1 md:grid-cols-3 gap-8">
          <div>
            <label className="block text-sm font-semibold text-gray-700 mb-2">Academic Year</label>
            <input
              type="text"
              value={academicYear}
              className="w-full border rounded-lg px-4 py-2 bg-gray-100 text-base"
              readOnly
              required
              onChange={e => setAcademicYear(e.target.value)}
            />
          </div>
          <div>
            <label className="block text-sm font-semibold text-gray-700 mb-2">Staff Type</label>
            <input
              type="text"
              value={DEFAULT_STAFF_TYPE}
              className="w-full border rounded-lg px-4 py-2 bg-gray-100 text-base"
              readOnly
            />
          </div>
          <div>
            <label className="block text-sm font-semibold text-gray-700 mb-2">Group</label>
            <select
              value={staffGroup}
              onChange={e => {
                setStaffGroup(e.target.value);
                // Reset form when group changes
                const resetData = {};
                dropdowns.subcategories.forEach(sub => {
                  resetData[sub.id] = {};
                  dropdowns.categories.forEach(cat => {
                    resetData[sub.id][cat.id] = {};
                    dropdowns.genders.forEach(gender => {
                      resetData[sub.id][cat.id][gender.id] = 0;
                    });
                  });
                });
                setFormData(resetData);
                setSanctionedStrength("");
              }}
              className="w-full border rounded-lg px-4 py-2 text-base"
              required
            >
              <option value="">Select Group</option>
              {GROUP_OPTIONS.map(group => (
                <option key={group} value={group}>{group}</option>
              ))}
            </select>
          </div>
        </div>
        {/* Sanctioned Strength input, only show after group is selected */}
        {staffGroup && (
          <div className="mt-6 max-w-md mx-auto">
            <label className="block text-sm font-semibold text-gray-700 mb-2">Sanctioned Strength</label>
            <input
              type="number"
              min="0"
              value={sanctionedStrength}
              onChange={e => setSanctionedStrength(e.target.value.replace(/[^0-9]/g, ""))}
              className="w-full border rounded-lg px-4 py-2 text-base focus:ring-2 focus:ring-blue-500 focus:border-blue-500 bg-white shadow-sm"
              placeholder="Enter sanctioned strength for selected group"
              required
            />
          </div>
        )}

        {/* Subcategory Panels */}
        <div className="grid grid-cols-1 gap-10">
          {dropdowns.subcategories.map(sub => (
            <div key={sub.id} className="rounded-2xl shadow-md border border-blue-100 bg-white">
              <div className="bg-gradient-to-r from-blue-900 to-indigo-900 text-white px-6 py-3 rounded-t-2xl font-semibold text-lg tracking-wide">
                {sub.name}
              </div>
              <div className="p-6 space-y-6">
                {dropdowns.categories.map(cat => (
                  <div key={cat.id} className="group bg-gray-50 hover:bg-blue-50/50 rounded-xl p-5 transition-all duration-200">
                    <div className="flex items-center justify-between mb-4">
                      <h5 className="font-semibold text-gray-800 group-hover:text-blue-700 transition-colors">
                        {cat.name}
                      </h5>
                    </div>
                    <div className="grid grid-cols-3 gap-6">
                      {dropdowns.genders.map(gender => (
                        <div key={gender.id} className="space-y-2">
                          <label className="block text-sm font-medium text-gray-600">{gender.name}</label>
                          <input
                            type="number"
                            min="0"
                            value={formData?.[sub.id]?.[cat.id]?.[gender.id] ?? 0}
                            onChange={e =>
                              handleInputChange(sub.id, cat.id, gender.id, e.target.value)
                            }
                            className="w-full px-4 py-2.5 rounded-lg border border-gray-200 focus:ring-2 focus:ring-blue-500 focus:border-transparent bg-white shadow-sm transition-all duration-200 hover:shadow group-hover:border-blue-200"
                            required
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

        {/* Button Group */}
        <div className="flex flex-col md:flex-row gap-6 justify-center items-center mt-10">
          <button
            type="submit"
            disabled={loading}
            className={`w-full md:w-auto max-w-md py-4 px-8 rounded-xl font-semibold text-white text-lg shadow-lg shadow-blue-500/20
              ${isEditMode
                ? "bg-gradient-to-r from-green-600 to-emerald-600 hover:from-green-700 hover:to-emerald-700"
                : "bg-gradient-to-r from-blue-600 to-indigo-600 hover:from-blue-700 hover:to-indigo-700"
              } transition-all`}
          >
            {loading
              ? <span>{isEditMode ? "Saving..." : "Submitting..."}</span>
              : isEditMode ? "Save Changes" : "Non-Teaching Staff Enrollment"}
          </button>
          <button
            type="button"
            disabled={editLoading || !staffGroup}
            onClick={handleEditEnrollment}
            className={`w-full md:w-auto max-w-md py-4 px-8 rounded-xl font-semibold text-white text-lg shadow-lg shadow-orange-500/20
              bg-gradient-to-r from-yellow-600 to-orange-600 hover:from-yellow-700 hover:to-orange-700 transition-all`}
          >
            {editLoading ? "Loading..." : "Edit Enrollment"}
          </button>
        </div>
      </form>

      {/* Modern Enrollment Records Table */}
      <div className="mt-16">
        <div className="flex items-center justify-between mb-6">
          <h3 className="text-2xl font-bold text-blue-900 tracking-tight">Enrollment Records</h3>
          <span className="text-base text-gray-500">Total Records: {filteredRecords.length}</span>
        </div>
        <div className="rounded-3xl shadow-xl border border-blue-100 overflow-x-auto bg-white">
          <table className="min-w-full text-base text-gray-800">
            <thead className="bg-gradient-to-r from-blue-100 to-indigo-100">
              <tr>
                <th className="px-4 py-3 font-bold tracking-wider text-blue-700">Academic Year</th>
                <th className="px-4 py-3 font-bold tracking-wider text-blue-700">Category</th>
                <th className="px-4 py-3 font-bold tracking-wider text-blue-700">Subcategory</th>
                <th className="px-4 py-3 font-bold tracking-wider text-blue-700">Male</th>
                <th className="px-4 py-3 font-bold tracking-wider text-blue-700">Female</th>
                <th className="px-4 py-3 font-bold tracking-wider text-blue-700">Transgender</th>
                <th className="px-4 py-3 font-bold tracking-wider text-blue-700">Group</th>
                <th className="px-4 py-3 font-bold tracking-wider text-blue-700">Staff Type</th>
              </tr>
            </thead>
            <tbody>
              {paginatedRecords.length > 0 ? (
                paginatedRecords.map((row) => (
                  <tr key={row.id} className="hover:bg-gradient-to-r hover:from-blue-50 hover:to-indigo-50 transition border-b border-blue-50 last:border-0">
                    <td className="px-4 py-3 font-medium whitespace-nowrap">{row.academic_year}</td>
                    <td className="px-4 py-3 whitespace-nowrap">{row.category}</td>
                    <td className="px-4 py-3 whitespace-nowrap">{row.subcategory}</td>
                    <td className="px-4 py-3">
                      <span className="inline-block min-w-[2.5rem] text-center px-2 py-1 rounded-full bg-blue-100 text-blue-700 font-semibold text-base shadow-sm">
                        {row.gender === 'Male' ? row.filled_count : 0}
                      </span>
                    </td>
                    <td className="px-4 py-3">
                      <span className="inline-block min-w-[2.5rem] text-center px-2 py-1 rounded-full bg-pink-100 text-pink-700 font-semibold text-base shadow-sm">
                        {row.gender === 'Female' ? row.filled_count : 0}
                      </span>
                    </td>
                    <td className="px-4 py-3">
                      <span className="inline-block min-w-[2.5rem] text-center px-2 py-1 rounded-full bg-purple-100 text-purple-700 font-semibold text-base shadow-sm">
                        {row.gender === 'Transgender' ? row.filled_count : 0}
                      </span>
                    </td>
                    <td className="px-4 py-3 whitespace-nowrap">{row.staff_group}</td>
                    <td className="px-4 py-3 whitespace-nowrap">{row.staff_type}</td>
                  </tr>
                ))
              ) : (
                <tr>
                  <td colSpan="8" className="px-6 py-12 text-center text-gray-400 bg-gradient-to-r from-blue-50 to-indigo-50">
                    <div className="flex flex-col items-center justify-center">
                      <span className="w-12 h-12 rounded-full bg-blue-100 flex items-center justify-center mb-2 text-2xl text-blue-400">?</span>
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

      {/* Sanctioned Strength Summary Table */}
      <div className="mt-10">
        <h3 className="text-lg font-bold text-gray-900 mb-4">Sanctioned Strength Summary</h3>
        <div className="table-container rounded-2xl shadow-lg border border-gray-100 overflow-x-auto">
          <table className="min-w-full text-sm text-gray-700">
            <thead className="bg-gradient-to-r from-blue-50 to-indigo-50">
              <tr>
                <th className="px-6 py-4 font-bold tracking-wider text-blue-700">Academic Year</th>
                <th className="px-6 py-4 font-bold tracking-wider text-blue-700">Staff Type</th>
                <th className="px-6 py-4 font-bold tracking-wider text-blue-700">Group</th>
                <th className="px-6 py-4 font-bold tracking-wider text-blue-700">Sanctioned Strength</th>
              </tr>
            </thead>
            <tbody>
              {filteredSanctionedStrengthRows.length > 0 ? (
                filteredSanctionedStrengthRows.map((row, idx) => (
                  <tr key={idx} className="hover:bg-gradient-to-r hover:from-blue-50 hover:to-indigo-50 transition">
                    <td className="px-6 py-4 font-medium">{row.academic_year}</td>
                    <td className="px-6 py-4">{row.staff_type}</td>
                    <td className="px-6 py-4">{row.staff_group}</td>
                    <td className="px-6 py-4 font-bold text-green-700">{row.sanctioned_strength}</td>
                  </tr>
                ))
              ) : (
                <tr>
                  <td colSpan="4" className="px-6 py-12 text-center text-gray-400 bg-gradient-to-r from-blue-50 to-indigo-50">
                    <div className="flex flex-col items-center justify-center">
                      <span className="w-12 h-12 rounded-full bg-blue-100 flex items-center justify-center mb-2 text-2xl text-blue-400">?</span>
                      <p className="text-gray-600 font-medium">No sanctioned strength records found</p>
                    </div>
                  </td>
                </tr>
              )}
            </tbody>
          </table>
        </div>
      </div>
    </div>
  );
}


// Utility to extract sanctioned strength per group/type/year
function getSanctionedStrengthRows(records) {
  const map = {};
  records.forEach(row => {
    const key = `${row.staff_type}|${row.staff_group}|${row.academic_year}`;
    if (!map[key] && row.sanctioned_strength > 0) {
      map[key] = {
        staff_type: row.staff_type,
        staff_group: row.staff_group,
        academic_year: row.academic_year,
        sanctioned_strength: row.sanctioned_strength
      };
    }
  });
  return Object.values(map);
}

export default NonTeachingStaff;