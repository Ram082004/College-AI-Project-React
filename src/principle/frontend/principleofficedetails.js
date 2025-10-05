import React, { useEffect, useState } from "react";
import axios from "axios";
import AcademicYearBadge from "../../Admin-Frontend/components/AcademicYearBadge";

const API_BASE = "https://admin-back-j3j4.onrender.com/api";
const API = {
  TEACHING: `${API_BASE}/office/teaching-staff`,
  NON_TEACHING: `${API_BASE}/office/non-teaching-staff`,
  // aggregated summary endpoint (same as Admin UI)
  NON_TEACHING_SUMMARY: `${API_BASE}/office-user/office-details/nonteaching`,
  // department-level endpoint used by Admin UI - reused here
  OFFICE_DEPT_GET: `${API_BASE}/office/officedept/get`
};

export default function PrincipleOfficeDetails() {
  const [activeTab, setActiveTab] = useState("teaching");
  const [teachingData, setTeachingData] = useState([]);
  const [nonTeachingData, setNonTeachingData] = useState([]);
  const [detailRecords, setDetailRecords] = useState([]); // detailed non-teaching rows
  const [loading, setLoading] = useState(false);

  // Preview + breakdown states
  const [previewRow, setPreviewRow] = useState(null);
  const [showBreakdown, setShowBreakdown] = useState(false);
  const [breakdownGroup, setBreakdownGroup] = useState(null);
  const [activeMinorityTab, setActiveMinorityTab] = useState("PwBD");

  // Academic year displayed / chosen
  const [adminAcademicYear, setAdminAcademicYear] = useState(""); // displayed badge / filter

  // Default groups to show even if there's no data for a year
  const DEFAULT_GROUPS = ["Group B", "Group C", "Group D"];

  useEffect(() => {
    setLoading(true);
    // fetch teaching & aggregated non-teaching summary (use summary endpoint)
    axios.get(API.TEACHING, { headers: { Authorization: `Bearer ${localStorage.getItem("authToken")}` } })
      .then(res => setTeachingData(res.data.data || []))
      .catch(() => setTeachingData([]))
      .finally(() => setLoading(false));

    // aggregated summary (male_count / female_count / transgender_count)
    axios.get(API.NON_TEACHING_SUMMARY, { headers: { Authorization: `Bearer ${localStorage.getItem("authToken")}` } })
      .then(res => setNonTeachingData(res.data.data || []))
      .catch(() => setNonTeachingData([]));

    // detailed rows for breakdown popup (per-category/gender entries)
    axios.get(API.NON_TEACHING, { headers: { Authorization: `Bearer ${localStorage.getItem("authToken")}` } })
      .then(res => setDetailRecords(res.data.data || []))
      .catch(() => setDetailRecords([]));
  }, []);

  // fetch admin latest year (preferred source for new academic year)
  useEffect(() => {
    async function fetchAdminYear() {
      try {
        const res = await axios.get("https://admin-back-j3j4.onrender.com/api/admin/all", {
          headers: { Authorization: `Bearer ${localStorage.getItem("authToken")}` }
        });
        if (res.data?.admins?.length) {
          setAdminAcademicYear(res.data.admins[0].academic_year || "");
          return;
        }
      } catch {
        /* ignore */
      }
      // fallback: if nonTeachingData contains rows, use its first row year
      if (nonTeachingData && nonTeachingData.length > 0) {
        setAdminAcademicYear(nonTeachingData[0].academic_year || "");
      }
    }
    fetchAdminYear();
  }, [nonTeachingData]);

  // Helper to format date as DD-MM-YYYY
  const formatDate = (dateStr) => {
    if (!dateStr) return "-";
    const d = new Date(dateStr);
    if (isNaN(d)) return dateStr;
    return `${String(d.getDate()).padStart(2, "0")}-${String(d.getMonth() + 1).padStart(2, "0")}-${d.getFullYear()}`;
  };

  // Filter nonTeachingData and detailRecords by displayed academic year
  const filteredNonTeachingData = nonTeachingData.filter(r => String(r.academic_year) === String(adminAcademicYear));
  const filteredDetailRecords = detailRecords.filter(r => String(r.academic_year) === String(adminAcademicYear));

  // Filter teachingData by displayed admin academic year (same approach as Admin UI)
  const filteredTeachingData = teachingData.filter(r => String(r.academic_year) === String(adminAcademicYear));
  
  // Build group summaries — ensure we show DEFAULT_GROUPS when data missing for a new year
  const groupsToRender = (() => {
    const groupsFromData = Array.from(new Set(filteredNonTeachingData.map(r => r.staff_group || r.staff_group_name))).filter(Boolean);
    return groupsFromData.length ? groupsFromData : DEFAULT_GROUPS;
  })();
  
  function getGroupSummaryFor(group) {
    // Find the first row for this group and academic year
    const summaryRow = filteredNonTeachingData.find(r => (r.staff_group || r.staff_group_name) === group);
    if (summaryRow) {
      return {
        male: Number(summaryRow.male_count ?? 0),
        female: Number(summaryRow.female_count ?? 0),
        transgender: Number(summaryRow.transgender_count ?? 0),
        academicYear: summaryRow.academic_year || adminAcademicYear || "-",
        sanctionedStrength: summaryRow.sanctioned_strength ?? "-",
        staffType: summaryRow.staff_type || summaryRow.staff_type_name || "-",
      };
    }
    // No data -> zero summary for the selected adminAcademicYear
    return { male: 0, female: 0, transgender: 0, academicYear: adminAcademicYear || "-", sanctionedStrength: '-', staffType: '-' };
  }

  // Master categories fallback
  const MASTER_CATEGORIES = [
    "General Including EWS",
    "Scheduled Caste (SC)",
    "Scheduled Tribe (ST)",
    "Other Backward Classes (OBC)"
  ];

  // Build minority breakdown using detailed rows
  function getMinorityBreakdown(group, subcategory) {
    const groupRows = filteredDetailRecords.filter(
      r => (r.staff_group || r.staff_group_name || '') === group && ((r.subcategory || r.subcategory_name || r.subcategory_label || '') === subcategory)
    );
    const cats = Array.from(new Set(filteredDetailRecords.map(r => r.category || r.category_name))).filter(Boolean);
    const useCats = cats.length ? cats : MASTER_CATEGORIES;
    return useCats.map(cat => {
      const male = groupRows
        .filter(r => (r.category || r.category_name || '') === cat && ((r.gender || r.gender_name || '') === "Male"))
        .reduce((sum, r) => sum + (Number(r.filled_count || r.male_count || r.male) || 0), 0);
      const female = groupRows
        .filter(r => (r.category || r.category_name || '') === cat && ((r.gender || r.gender_name || '') === "Female"))
        .reduce((sum, r) => sum + (Number(r.filled_count || r.female_count || r.female) || 0), 0);
      const transgender = groupRows
        .filter(r => (r.category || r.category_name || '') === cat && ((r.gender || r.gender_name || '') === "Transgender"))
        .reduce((sum, r) => sum + (Number(r.filled_count || r.transgender_count || r.transgender) || 0), 0);
      return { category: cat, male, female, transgender };
    });
  }

  // --- Department entry states (reused behavior from Admin UI) ---
  const DEPT_OPTIONS = [
    'B.C.A', 'B.A ENGLISH', 'M.A ENGLISH', 'BBA', 'B.COM',
    'B.SC MATHS', 'M.SC MATHS', 'B.SC Physics', 'M.Com', 'B.Sc Chemistry'
  ];
  const [selectedDept, setSelectedDept] = useState('');
  const [selectedDeptAcademicYear, setSelectedDeptAcademicYear] = useState('');
  const [deptDetailRecords, setDeptDetailRecords] = useState([]);
  const [deptTotals, setDeptTotals] = useState({
    'PwBD': { male: 0, female: 0, transgender: 0 },
    'Muslim Minority': { male: 0, female: 0, transgender: 0 },
    'Other Minority': { male: 0, female: 0, transgender: 0 }
  });
  const [detailRow, setDetailRow] = useState(null);
  const [showDetailModal, setShowDetailModal] = useState(false);

  useEffect(() => {
    setSelectedDeptAcademicYear(prev => prev || adminAcademicYear || '');
  }, [adminAcademicYear]);

  // compute totals from dept rows — tolerant to field shapes
  function computeDeptTotalsFromRows(rows = []) {
    const totals = {
      'PwBD': { male: 0, female: 0, transgender: 0 },
      'Muslim Minority': { male: 0, female: 0, transgender: 0 },
      'Other Minority': { male: 0, female: 0, transgender: 0 }
    };
    rows.forEach(r => {
      const sub = (r.subcategory_name || r.subcategory || r.sub || '').toString().trim();
      if (!sub || !totals[sub]) return;
      if (typeof r.male_count !== 'undefined' || typeof r.female_count !== 'undefined' || typeof r.transgender_count !== 'undefined') {
        totals[sub].male += Number(r.male_count || 0);
        totals[sub].female += Number(r.female_count || 0);
        totals[sub].transgender += Number(r.transgender_count || 0);
        return;
      }
      const gender = (r.gender_name || (r.gender_id && {1:'Male',2:'Female',3:'Transgender'}[r.gender_id]) || '').toString();
      const cnt = Number(r.count ?? r.value ?? 0) || 0;
      if (/male/i.test(gender)) totals[sub].male += cnt;
      else if (/female/i.test(gender)) totals[sub].female += cnt;
      else totals[sub].transgender += cnt;
    });
    return totals;
  }

  // fetch dept rows when selection changes
  useEffect(() => {
    if (!selectedDept) {
      setDeptDetailRecords([]);
      setDeptTotals({
        'PwBD': { male: 0, female: 0, transgender: 0 },
        'Muslim Minority': { male: 0, female: 0, transgender: 0 },
        'Other Minority': { male: 0, female: 0, transgender: 0 }
      });
      return;
    }
    (async () => {
      try {
        const year = selectedDeptAcademicYear || adminAcademicYear || '';
        const res = await axios.get(API.OFFICE_DEPT_GET, { params: { academic_year: year, department: selectedDept }, headers: { Authorization: `Bearer ${localStorage.getItem("authToken")}` }});
        const rows = res.data?.rows || [];
        setDeptDetailRecords(rows);
        setDeptTotals(computeDeptTotalsFromRows(rows));
      } catch (err) {
        setDeptDetailRecords([]);
        setDeptTotals({
          'PwBD': { male: 0, female: 0, transgender: 0 },
          'Muslim Minority': { male: 0, female: 0, transgender: 0 },
          'Other Minority': { male: 0, female: 0, transgender: 0 }
        });
      }
    })();
  }, [selectedDept, selectedDeptAcademicYear, adminAcademicYear]);
  // --- end department entry additions ---

  // --- NEW: build per-category breakdown for a selected department subcategory (used by modal) ---
  function buildDeptSubcategoryBreakdown(subcategoryName) {
    if (!subcategoryName) return [];
    const selYear = (selectedDeptAcademicYear || adminAcademicYear || "").toString();
    const normalize = (s) => String(s || "").trim();
    // Filter rows that match selected department, year and subcategory
    const rows = (deptDetailRecords || []).filter(r => {
      const rowYear = String(r.academic_year || r.academicYear || r.academic || "");
      if (selYear && rowYear && rowYear !== selYear) return false;
      const rowDept = normalize(r.department || r.dept || r.department_name);
      if (selectedDept && rowDept !== normalize(selectedDept)) return false;
      const rowSub = normalize(r.subcategory_name || r.subcategory || r.sub || r.subcategory_label);
      return rowSub === normalize(subcategoryName);
    });

    // derive categories present, fallback to MASTER_CATEGORIES
    const catsFromRows = Array.from(new Set(rows.map(r => normalize(r.category || r.category_name || r.category_name)))).filter(Boolean);
    const cats = catsFromRows.length ? catsFromRows : MASTER_CATEGORIES;

    const map = {};
    cats.forEach(c => map[c] = { male: 0, female: 0, transgender: 0 });

    rows.forEach(r => {
      const cat = normalize(r.category || r.category_name) || "Other";
      if (!map[cat]) map[cat] = { male: 0, female: 0, transgender: 0 };

      // Prefer aggregated fields if present
      if (typeof r.male_count !== "undefined" || typeof r.female_count !== "undefined" || typeof r.transgender_count !== "undefined") {
        map[cat].male += Number(r.male_count || 0);
        map[cat].female += Number(r.female_count || 0);
        map[cat].transgender += Number(r.transgender_count || 0);
        return;
      }

      // Fallback: per-row gender + count
      const gender = String(r.gender_name || r.gender || (r.gender_id ? ({1:'Male',2:'Female',3:'Transgender'}[r.gender_id]) : "")).trim();
      const cnt = Number(r.count ?? r.filled_count ?? r.filled ?? r.value ?? 0) || 0;
      if (/male/i.test(gender)) map[cat].male += cnt;
      else if (/female/i.test(gender)) map[cat].female += cnt;
      else map[cat].transgender += cnt;
    });

    return Object.keys(map).map(category => ({ category, ...map[category] }));
  }
  // --- end buildDeptSubcategoryBreakdown ---

  return (
    <div className="max-w-6xl mx-auto px-6 py-10">
      <div className="flex justify-end mb-6">
        <AcademicYearBadge year={adminAcademicYear} />
      </div>

      <h1 className="text-3xl font-extrabold mb-8 text-gradient bg-gradient-to-r from-teal-600 via-blue-500 to-purple-600 bg-clip-text text-transparent">Office Staff Details</h1>

      <div className="flex gap-4 mb-8">
        <button className={`px-6 py-3 rounded-2xl shadow-lg font-semibold text-lg transition-all duration-200 border-2 ${activeTab === "teaching" ? "bg-blue-600 text-white border-blue-600 scale-105" : "bg-white text-blue-600 border-blue-200 hover:bg-blue-50"}`} onClick={() => setActiveTab("teaching")}>Teaching Staff</button>
        <button className={`px-6 py-3 rounded-2xl shadow-lg font-semibold text-lg transition-all duration-200 border-2 ${activeTab === "nonteaching" ? "bg-teal-600 text-white border-teal-600 scale-105" : "bg-white text-teal-600 border-teal-200 hover:bg-teal-50"}`} onClick={() => setActiveTab("nonteaching")}>Non-Teaching Staff</button>
        <button
          className={`px-6 py-3 rounded-2xl shadow-lg font-semibold text-lg transition-all duration-200 border-2 ${activeTab === "department" ? "bg-indigo-600 text-white border-indigo-600 scale-105" : "bg-white text-indigo-600 border-indigo-200 hover:bg-indigo-50"}`}
          onClick={() => setActiveTab("department")}
        >
          Department Entry
        </button>
      </div>

      {loading ? (
        <div className="text-center py-12 text-gray-500">Loading...</div>
      ) : (
        <div>
          {/* Teaching table + preview */}
          {activeTab === "teaching" && (
            <div className="rounded-3xl shadow-xl border border-blue-100 overflow-x-auto bg-white">
              <table className="min-w-full text-base text-gray-800">
                <thead className="bg-gradient-to-r from-blue-100 to-indigo-100">
                  <tr>
                    <th className="px-4 py-3 font-bold tracking-wider text-blue-700">Name</th>
                    <th className="px-4 py-3 font-bold tracking-wider text-blue-700">Department</th>
                    <th className="px-4 py-3 font-bold tracking-wider text-blue-700">Designation</th>
                    <th className="px-4 py-3 font-bold tracking-wider text-blue-700">Gender</th>
                    <th className="px-4 py-3 font-bold tracking-wider text-blue-700">Date of Joining</th>
                    <th className="px-4 py-3 font-bold tracking-wider text-blue-700">Preview</th>
                  </tr>
                </thead>
                <tbody>
                  {filteredTeachingData.length > 0 ? filteredTeachingData.map((row, idx) => (
                    <tr key={row.id || idx} className="hover:bg-gradient-to-r hover:from-blue-50 hover:to-indigo-50 transition border-b border-blue-50 last:border-0">
                      <td className="px-4 py-3">{row.name}</td>
                      <td className="px-4 py-3">{row.department}</td>
                      <td className="px-4 py-3">{row.designation}</td>
                      <td className="px-4 py-3">{row.gender}</td>
                      <td className="px-4 py-3">{formatDate(row.date_of_joining)}</td>
                      <td className="px-4 py-3">
                        <button className="px-4 py-2 bg-blue-600 text-white rounded-lg font-semibold" onClick={() => setPreviewRow(row)}>Preview</button>
                      </td>
                    </tr>
                  )) : (
                    <tr>
                      <td colSpan={6} className="px-4 py-12 text-center text-gray-400 bg-gradient-to-r from-blue-50 to-indigo-50">No teaching staff records found</td>
                    </tr>
                  )}
                </tbody>
              </table>

              {/* Preview Modal */}
              {previewRow && (
                <div className="fixed inset-0 bg-black bg-opacity-40 flex items-center justify-center z-50">
                  <div className="bg-white rounded-xl shadow-xl p-8 max-w-3xl w-full mx-4 relative overflow-y-auto" style={{ maxHeight: "80vh" }}>
                    <button className="absolute top-4 right-4 text-gray-500 hover:text-gray-800 text-2xl" onClick={() => setPreviewRow(null)}>&times;</button>
                    <h3 className="text-xl font-bold mb-6 text-blue-700 text-center">Teaching Staff Details Preview</h3>

                    <div className="flex justify-center mb-6">
                      <div className="w-24 h-24 rounded-full bg-blue-100 flex items-center justify-center shadow">
                        <svg className="w-12 h-12 text-blue-400" fill="none" stroke="currentColor" strokeWidth="2" viewBox="0 0 24 24">
                          <circle cx="12" cy="8" r="4" />
                          <path d="M6 20c0-2.2 3.6-3.5 6-3.5s6 1.3 6 3.5" />
                        </svg>
                      </div>
                    </div>

                    <div className="grid grid-cols-1 md:grid-cols-2 gap-x-10 gap-y-4">
                      <div><strong>Name:</strong> {previewRow.name}</div>
                      <div><strong>Department:</strong> {previewRow.department}</div>
                      <div><strong>Designation:</strong> {previewRow.designation}</div>
                      <div><strong>Gender:</strong> {previewRow.gender}</div>
                      <div><strong>Date of Birth:</strong> {formatDate(previewRow.date_of_birth)}</div>
                      <div><strong>Email:</strong> {previewRow.email}</div>
                      <div><strong>Mobile No:</strong> {previewRow.mobile_no}</div>
                      <div><strong>PAN Number:</strong> {previewRow.pan_number}</div>
                      <div><strong>Nature of Appointment:</strong> {previewRow.nature_of_appointment}</div>
                      <div><strong>Social Category:</strong> {previewRow.social_category}</div>
                      <div><strong>Religious Community:</strong> {previewRow.religious_community}</div>
                      <div><strong>PWBD:</strong> {previewRow.pwbd_status ? "Yes" : "No"}</div>
                      <div><strong>Date of Joining:</strong> {formatDate(previewRow.date_of_joining)}</div>
                      <div><strong>Date of Joining Profession:</strong> {formatDate(previewRow.date_of_joining_profession)}</div>
                      <div><strong>Job Status:</strong> {previewRow.job_status}</div>
                      <div><strong>Date of Leaving:</strong> {formatDate(previewRow.date_of_leaving)}</div>
                      <div><strong>Date of Status Change:</strong> {formatDate(previewRow.date_of_status_change)}</div>
                      <div><strong>Highest Qualification:</strong> {previewRow.highest_qualification}</div>
                      <div><strong>Programme Highest Qualification:</strong> {previewRow.programme_highest_qualification}</div>
                      <div><strong>Broad Discipline Group Name:</strong> {previewRow.broad_discipline_group_name}</div>
                      <div><strong>Broad Discipline Group Category:</strong> {previewRow.broad_discipline_group_category}</div>
                      <div><strong>Additional Qualification:</strong> {Array.isArray(previewRow.additional_qualification) ? previewRow.additional_qualification.join(", ") : previewRow.additional_qualification}</div>
                      <div><strong>Year/Month Other Than Teaching:</strong> Year {previewRow.year_spent_other_than_teaching} Month {previewRow.month_spent_other_than_teaching}</div>
                      <div><strong>Academic Year:</strong> {previewRow.academic_year}</div>
                      <div><strong>Country Name:</strong> {previewRow.country_name}</div>
                    </div>
                  </div>
                </div>
              )}
            </div>
          )}

          {/* Non-teaching group cards + breakdown popup */}
          {activeTab === "nonteaching" && (
            <div className="w-full flex flex-col items-center py-8">
              {groupsToRender.map(group => {
                const summary = getGroupSummaryFor(group);
                return (
                  <div
                    key={group}
                    className="rounded-2xl shadow-xl p-10 mb-10 border border-green-200 bg-white w-full max-w-4xl flex flex-col md:flex-row md:items-center md:justify-between gap-8 cursor-pointer"
                    onClick={() => { setBreakdownGroup(group); setActiveMinorityTab("PwBD"); setShowBreakdown(true); }}
                  >
                    <div>
                      <h3 className="text-2xl font-bold text-green-700 mb-4">{group}</h3>
                      <div className="flex gap-8 mb-4">
                        <div className="flex flex-col items-center">
                          <span className="text-2xl font-bold text-blue-700">{summary.male}</span>
                          <span className="text-xs text-gray-500">Male</span>
                        </div>
                        <div className="flex flex-col items-center">
                          <span className="text-2xl font-bold text-pink-700">{summary.female}</span>
                          <span className="text-xs text-gray-500">Female</span>
                        </div>
                        <div className="flex flex-col items-center">
                          <span className="text-2xl font-bold text-purple-700">{summary.transgender}</span>
                          <span className="text-xs text-gray-500">Transgender</span>
                        </div>
                      </div>
                    </div>

                    <div className="flex flex-col gap-4 text-lg">
                      <div>Academic Year: <span className="font-semibold">{summary.academicYear}</span></div>
                      <div>Sanctioned Strength: <span className="font-semibold">{summary.sanctionedStrength}</span></div>
                      <div>Staff Type: <span className="font-semibold">{summary.staffType}</span></div>
                    </div>
                  </div>
                );
              })}

              {groupsToRender.length === 0 && (
                <div className="py-12 text-center text-gray-400">No non-teaching staff records found</div>
              )}

              {/* Breakdown Popup */}
              {showBreakdown && breakdownGroup && (
                <div className="fixed inset-0 flex items-center justify-center z-50 bg-black/40 backdrop-blur-sm" onClick={() => setShowBreakdown(false)}>
                  <div className="bg-white rounded-3xl shadow-2xl p-0 max-w-xl w-full mx-4 border border-blue-100 relative" onClick={e => e.stopPropagation()}>
                    <div className="flex items-center justify-between px-8 py-6 bg-gradient-to-r from-blue-600 to-indigo-600 rounded-t-3xl">
                      <div className="flex items-center gap-3">
                        <span className="text-xl font-bold text-white">
                          {breakdownGroup} - {activeMinorityTab} Breakdown
                        </span>
                      </div>
                      <button className="text-white text-2xl hover:text-blue-200 transition" onClick={() => setShowBreakdown(false)} title="Close">&times;</button>
                    </div>

                    {/* Tabs */}
                    <div className="flex justify-center mt-4 mb-2 gap-2">
                      {["PwBD", "Muslim Minority", "Other Minority"].map(tab => (
                        <button
                          key={tab}
                          onClick={() => setActiveMinorityTab(tab)}
                          className={`px-4 py-2 rounded-lg font-semibold ${activeMinorityTab === tab ? "bg-blue-600 text-white" : "bg-gray-100 text-blue-700"}`}
                        >
                          {tab}
                        </button>
                      ))}
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
                            const rows = getMinorityBreakdown(breakdownGroup, activeMinorityTab);
                            const hasData = rows.some(r => Number(r.male) > 0 || Number(r.female) > 0 || Number(r.transgender) > 0);
                            if (!hasData) {
                              return (
                                <tr>
                                  <td colSpan={4} className="py-8 text-center text-gray-400">
                                    <span>No data available for this subcategory and group.</span>
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
                      <button className="w-full py-2 bg-gradient-to-r from-blue-100 to-indigo-100 text-blue-700 rounded-lg font-semibold hover:bg-blue-200 transition" onClick={() => setShowBreakdown(false)}>Close</button>
                    </div>
                  </div>
                </div>
              )}
            </div>
          )}

          {/* Department entry form and summary */}
          {activeTab === "department" && (
            <div className="bg-white rounded-3xl shadow-xl p-6 border border-gray-100">
              <div className="grid md:grid-cols-3 gap-4 mb-6 items-end">
                <div>
                  <label className="block text-sm font-semibold mb-1">Academic Year</label>
                  <input type="text" readOnly value={selectedDeptAcademicYear || adminAcademicYear} className="w-full p-3 rounded-lg border bg-gray-100" />
                </div>
                <div>
                  <label className="block text-sm font-semibold mb-1">Department</label>
                  <select value={selectedDept} onChange={e => setSelectedDept(e.target.value)} className="w-full p-3 rounded-lg border">
                    <option value="">Select Department</option>
                    {DEPT_OPTIONS.map(d => <option key={d} value={d}>{d}</option>)}
                  </select>
                </div>
                <div>
                  <label className="block text-sm font-semibold mb-1">Year Slot</label>
                  <div className="inline-block px-4 py-3 bg-white rounded-lg border">I Year</div>
                </div>
              </div>

              {selectedDept ? (
                <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
                  {Object.keys(deptTotals).map(sub => {
                    const t = deptTotals[sub];
                    return (
                      <div key={sub} className="bg-white rounded-2xl shadow-lg border p-6 cursor-pointer" onClick={() => { setDetailRow({ __type: 'departmentTotals', subcategory: sub, totals: t, department: selectedDept, academic_year: selectedDeptAcademicYear || adminAcademicYear }); setShowDetailModal(true); }}>
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
                    )
                  })}
                </div>
              ) : (
                <div className="py-12 text-center text-gray-500">Select a department to view its enrollment summary (PwBD / Muslim Minority / Other Minority)</div>
              )}
            </div>
          )}
          {/* end department tab */}

          {/* --- NEW: Detail modal re-used from office Dept Enrollment (subcategory breakdown) --- */}
          {showDetailModal && detailRow && (
            <div className="fixed inset-0 flex items-center justify-center z-50 bg-black/40 backdrop-blur-sm" onClick={() => setShowDetailModal(false)}>
              <div className="bg-white rounded-3xl shadow-2xl p-0 max-w-3xl w-full mx-4 overflow-hidden border border-blue-100" onClick={e => e.stopPropagation()}>
                <div className="flex items-center justify-between px-8 py-6 bg-gradient-to-r from-blue-600 to-indigo-600 text-white">
                  <div className="flex items-center gap-3">
                    <h3 className="text-lg font-bold">
                      {detailRow.__type === 'departmentTotals' ? `Breakdown - ${detailRow.subcategory}` : `Details`}
                      <span className="text-sm font-normal ml-3">{detailRow.department ? ` ${detailRow.department}` : ''} {detailRow.academic_year ? ` (${detailRow.academic_year})` : ''}</span>
                    </h3>
                  </div>
                  <button className="text-white text-2xl hover:text-blue-200" onClick={() => setShowDetailModal(false)} title="Close">&times;</button>
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
                        const rows = buildDeptSubcategoryBreakdown(detailRow.subcategory);
                        if (!rows.length) {
                          return (
                            <tr>
                              <td colSpan={4} className="py-8 text-center text-gray-400">No records found for this subcategory.</td>
                            </tr>
                          );
                        }
                        return rows.map(r => (
                          <tr key={r.category} className="hover:bg-blue-50 transition">
                            <td className="px-4 py-2 font-semibold">{r.category}</td>
                            <td className="px-4 py-2 text-blue-700 font-bold">{r.male}</td>
                            <td className="px-4 py-2 text-pink-700 font-bold">{r.female}</td>
                            <td className="px-4 py-2 text-purple-700 font-bold">{r.transgender}</td>
                          </tr>
                        ));
                      })()}
                    </tbody>
                  </table>
                </div>

                <div className="px-8 pb-6">
                  <button className="w-full py-2 bg-gradient-to-r from-blue-100 to-indigo-100 text-blue-700 rounded-lg font-semibold hover:bg-blue-200 transition" onClick={() => setShowDetailModal(false)}>Close</button>
                </div>
              </div>
            </div>
          )}
          {/* --- end detail modal --- */}
        </div>
      )}
    </div>
  );
}