import React, { useState, useEffect } from "react";
import axios from "axios";
import AcademicYearBadge from "../../Admin-Frontend/components/AcademicYearBadge";

function TeachingStaff() {
  const [form, setForm] = useState({
    country_name: "India",
    department: "",
    name: "",
    gender: "",
    date_of_birth: "",
    email: "",
    mobile_no: "",
    pan_number: "",
    designation: "",
    nature_of_appointment: "",
    job_status: "Continue",
    social_category: "",
    religious_community: "",
    pwbd_status: false,
    date_of_joining: "",
    date_of_joining_profession: "",
    date_of_leaving: "",
    date_of_status_change: "",
    highest_qualification: "",
    programme_highest_qualification: "",
    broad_discipline_group_name: "",
    broad_discipline_group_category: "",
    additional_qualification: [],
    year_spent_other_than_teaching: 0,
    month_spent_other_than_teaching: 0,
  });
  const [loading, setLoading] = useState(false);
  const [message, setMessage] = useState(null);
  const [staffData, setStaffData] = useState([]);
  const [academicYear, setAcademicYear] = useState("");
  const [editId, setEditId] = useState(null);
  const [currentPage, setCurrentPage] = useState(1);
  const recordsPerPage = 10;
  const [isLocked, setIsLocked] = useState(false);
  const [showDeclaration, setShowDeclaration] = useState(false);
  const [declarationAccepted, setDeclarationAccepted] = useState(false);
  const [showForm, setShowForm] = useState(false);
  const [officeAcademicYear, setOfficeAcademicYear] = useState('');
  const [officeId, setOfficeId] = useState("");
  const [officeName, setOfficeName] = useState("");


  const DESIGNATIONS = [
    "Ad hoc Teacher",
    "Assistant Professor",
    "Associate Professor",
    "Principal"
  ];
  const NATURES = [
    "Ad-hoc",
    "Regular",
    "Deputation/Attachment",
    "Repatriated"
  ];
  const GENDERS = ["Male", "Female", "Other"];
  const SOCIAL_CATEGORIES = ["OBC", "SC", "General", "Other"];
  const QUALIFICATIONS = ["Ph.D.", "M.Phil", "Postgraduate", "Graduate", "Other"];
  const ADDITIONAL_QUALIFICATIONS = ["NET", "SLET", "None"];
  const RELIGIOUS_COMMUNITIES = ["Hindu", "Muslim", "Christian"];

  // New dropdowns as per user request
  const BROAD_DISCIPLINE_GROUP_NAMES = [
    "Computer Application",
    "Commerce",
    "Mathematics",
    "Fine Arts",
    "English",
    "Physics",
    "Management",
    "Business Administration",
    "Business Management",
    "Chemistry",
    "Tamil",
    "Physical Education"
  ];
  const BROAD_DISCIPLINE_GROUP_CATEGORIES = [
    "IT & Computer",
    "Commerce",
    "Science",
    "Fine Arts",
    "Management",
    "Physical Education"
  ];
  const DEPARTMENTS = [
    "Computer Applications",
    "Commerce",
    "Mathematics",
    "English",
    "Physics",
    "Chemistry",
    "Tamil",
    "Business Administration",
    "Physical Education"
  ];
 
   
  // Fetch latest academic year from office_users table
  useEffect(() => {
    async function fetchAcademicYear() {
      try {
        const res = await axios.get("http://localhost:5000/api/office/teaching-staff/academic-year");
        if (res.data.success) setOfficeAcademicYear(res.data.academic_year || "");
      } catch {
        setOfficeAcademicYear("");
      }
    }
    fetchAcademicYear();
  }, []);

  useEffect(() => {
    const fetchData = async () => {
      try {
        const response = await axios.get("http://localhost:5000/api/office/teaching-staff");
        setStaffData(response.data);
      } catch (error) {
        console.error("Error fetching data:", error);
      }
    };

    fetchData();
  }, []);

  // Fetch academic year from backend (example endpoint)
  useEffect(() => {
    async function fetchAcademicYear() {
      try {
        const res = await axios.get("http://localhost:5000/api/office/teaching-staff/academic-year");
        if (res.data.success) setAcademicYear(res.data.academic_year);
      } catch {
        setAcademicYear("");
      }
    }
    fetchAcademicYear();
  }, []);

  useEffect(() => {
    setForm(prev => ({ ...prev, academic_year: academicYear }));
  }, [academicYear]);

  useEffect(() => {
    async function fetchLockStatus() {
      if (!academicYear) return;
      const res = await axios.get(`http://localhost:5000/api/office/teaching-staff/is-locked?academic_year=${academicYear}`);
      setIsLocked(res.data.isLocked);
    }
    fetchLockStatus();
  }, [academicYear, message]);

  const handleChange = (e) => {
    const { name, value, type, checked } = e.target;
    if (type === "checkbox" && name === "additional_qualification") {
      setForm((prev) => ({
        ...prev,
        additional_qualification: checked
          ? [...prev.additional_qualification, value]
          : prev.additional_qualification.filter((q) => q !== value)
      }));
    } else if (type === "checkbox" && name === "pwbd_status") {
      setForm((prev) => ({ ...prev, pwbd_status: checked }));
    } else {
      setForm((prev) => ({ ...prev, [name]: value }));
    }
  };

  const handleEdit = (row) => {
    // Helper to format date for input[type="date"]
    const formatDate = (dateStr) => {
      if (!dateStr) return "";
      const match = dateStr.match(/^\d{4}-\d{2}-\d{2}/);
      return match ? match[0] : "";
    };

    setForm({
      ...row,
      date_of_birth: formatDate(row.date_of_birth),
      date_of_joining: formatDate(row.date_of_joining),
      date_of_joining_profession: formatDate(row.date_of_joining_profession),
      date_of_leaving: formatDate(row.date_of_leaving),
      date_of_status_change: formatDate(row.date_of_status_change),
      additional_qualification: row.additional_qualification?.split(",") || [],
    });
    setEditId(row.id);
  };

  const fetchStaffData = async () => {
    try {
      const response = await axios.get("http://localhost:5000/api/office/teaching-staff");
      setStaffData(response.data);
    } catch (error) {
      console.error("Error fetching data:", error);
    }
  };

  const handleSubmit = async (e) => {
    e.preventDefault();
    setLoading(true);
    setMessage(null);
    try {
      const payload = {
        ...form,
        academic_year: academicYear, // Ensure academic_year is sent
        additional_qualification: Array.isArray(form.additional_qualification)
          ? form.additional_qualification.join(",")
          : form.additional_qualification || "None"
      };
      if (editId) {
        await axios.put(`http://localhost:5000/api/office/teaching-staff/${editId}`, payload);
        setMessage({ type: "success", text: "Teaching staff entry updated successfully!" });
      } else {
        await axios.post("http://localhost:5000/api/office/teaching-staff", payload);
        setMessage({ type: "success", text: "Teaching staff entry submitted successfully!" });
      }
      setEditId(null);
      setForm({
        country_name: "India",
        department: "",
        name: "",
        gender: "",
        date_of_birth: "",
        email: "",
        mobile_no: "",
        pan_number: "",
        designation: "",
        nature_of_appointment: "",
        job_status: "Continue",
        social_category: "",
        religious_community: "",
        pwbd_status: false,
        date_of_joining: "",
        date_of_joining_profession: "",
        date_of_leaving: "",
        date_of_status_change: "",
        highest_qualification: "",
        programme_highest_qualification: "",
        broad_discipline_group_name: "",
        broad_discipline_group_category: "",
        additional_qualification: [],
        year_spent_other_than_teaching: 0,
        month_spent_other_than_teaching: 0,
      });
      // Fetch latest data immediately
      await fetchStaffData();
    } catch {
      setMessage({ type: "error", text: "Failed to submit entry. Please try again." });
    }
    setLoading(false);
  };

  useEffect(() => {
    if (message?.type === "success") {
      const timer = setTimeout(() => setMessage(null), 3000); // 3 seconds
      return () => clearTimeout(timer);
    }
  }, [message]);

  // Filter to only show current academic year records
  const staffRows = staffData.data || [];
  const filteredRows = staffRows.filter(row => row.academic_year === academicYear);
  const totalPages = Math.ceil(filteredRows.length / recordsPerPage);
  const paginatedRows = filteredRows.slice(
    (currentPage - 1) * recordsPerPage,
    currentPage * recordsPerPage
  );

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

  // Fetch office user info (officeId, officeName) on mount
  useEffect(() => {
    async function fetchOfficeUsers() {
      try {
        const res = await axios.get("http://localhost:5000/api/office-user/office-users", {
          headers: { Authorization: `Bearer ${localStorage.getItem("authToken")}` }
        });
        if (res.data.success && res.data.users.length > 0) {
          setOfficeId(res.data.users[0].office_id || "");
          setOfficeName(res.data.users[0].name || "");
        }
      } catch {
        setOfficeId("");
        setOfficeName("");
      }
    }
    fetchOfficeUsers();
  }, []);

  return (
    <div> 
      <AcademicYearBadge year={officeAcademicYear} />
      <h2 className="text-3xl font-extrabold text-cyan-700 mb-8 text-center tracking-tight">Teaching Staff Entry</h2>
      {message && (
        <div className={`mb-6 px-6 py-3 rounded-xl font-semibold text-base shadow ${message.type === "success" ? "bg-green-100 text-green-800" : "bg-red-100 text-red-800"}`}>
          {message.text}
        </div>
      )}
      {showDeclaration && (
        <div className="fixed inset-0 bg-black/40 flex items-center justify-center z-50">
          <div className="bg-white rounded-2xl shadow-2xl p-8 max-w-lg w-full mx-4">
            <div className="text-center mb-6">
              <div className="w-16 h-16 bg-green-100 rounded-2xl mx-auto flex items-center justify-center mb-4">
                <svg className="w-8 h-8 text-green-600" fill="none" stroke="currentColor" strokeWidth="2" viewBox="0 0 24 24"><path strokeLinecap="round" strokeLinejoin="round" d="M9 17v-6a2 2 0 012-2h2a2 2 0 012 2v6m-6 4h6a2 2 0 002-2V7a2 2 0 00-2-2H7a2 2 0 00-2 2v12a2 2 0 002 2z" /></svg>
              </div>
              <h3 className="text-2xl font-bold bg-gradient-to-r from-blue-600 to-indigo-600 bg-clip-text text-transparent">
                Declaration Form
              </h3>
              <p className="text-gray-500 mt-2">Please review and confirm your submission</p>
            </div>
            <div className="bg-gradient-to-br from-blue-50 to-indigo-50 rounded-xl p-6 mb-6 border border-blue-100">
              <div className="flex items-start space-x-4">
                <div className="flex-shrink-0 mt-1">
                  <div className="w-8 h-8 bg-blue-100 rounded-lg flex items-center justify-center">
                    <svg className="w-6 h-6 text-blue-600" fill="none" stroke="currentColor" strokeWidth="2" viewBox="0 0 24 24"><path strokeLinecap="round" strokeLinejoin="round" d="M9 17v-6a2 2 0 012-2h2a2 2 0 012 2v6m-6 4h6a2 2 0 002-2V7a2 2 0 00-2-2H7a2 2 0 00-2 2v12a2 2 0 002 2z" /></svg>
                  </div>
                </div>
                <div className="flex-1">
                  <h4 className="font-semibold text-gray-900 mb-2">Declaration Statement</h4>
                  <p className="text-gray-600 leading-relaxed">
                    I hereby declare that the Teaching Staff data for academic year <span className="font-semibold text-blue-600">{academicYear}</span> is true and correct to the best of my knowledge and belief. I understand that any discrepancy found later may lead to necessary action as per institutional policy.
                  </p>
                </div>
              </div>
            </div>
            <label className="flex items-center mb-6">
              <input
                type="checkbox"
                checked={declarationAccepted}
                onChange={e => setDeclarationAccepted(e.target.checked)}
                className="mr-2"
              />
              I accept the declaration
            </label>
            <div className="flex gap-4 justify-end">
              <button
                className="px-6 py-2 bg-blue-700 text-white rounded-lg font-bold"
                disabled={!declarationAccepted}
                onClick={async () => {
                  await axios.post("http://localhost:5000/api/office/teaching-staff/final-submit", {
                    academic_year: academicYear,
                    type: "Teaching Staff",
                    status: "Completed",
                    office_id: officeId,
                    name: officeName
                  });
                  setShowDeclaration(false);
                  setIsLocked(true);
                  setMessage({ type: "success", text: "Final submission completed." });
                  setTimeout(() => setMessage(null), 3000);
                }}
              >
                Submit
              </button>
              <button
                className="px-6 py-2 bg-gray-200 rounded-lg font-bold"
                onClick={() => setShowDeclaration(false)}
              >
                Cancel
              </button>
            </div>
          </div>
        </div>
      )}
      {/* Add Teaching Staff Button */}
      {!showForm && !editId && (
        <div className="flex justify-end mb-6">
          <button
            className="px-6 py-2 bg-gradient-to-r from-blue-600 to-indigo-600 text-white rounded-xl font-bold shadow hover:scale-105 transition-transform"
            onClick={() => setShowForm(true)}
          >
            Add Teaching Staff
          </button>
        </div>
      )}

      {/* Teaching Staff Form */}
      {(showForm || editId) && (
        <form onSubmit={handleSubmit} className="space-y-8 mb-8 bg-white rounded-2xl shadow p-8">
          <div className="grid grid-cols-1 md:grid-cols-2 gap-8">
            <div className="md:col-span-2">
              <label className="block text-lg font-bold text-blue-700 mb-4">Academic Year</label>
              <input
                type="text"
                name="academic_year"
                value={academicYear}
                readOnly
                className="w-full border rounded-lg px-4 py-3 bg-blue-50 text-xl font-semibold text-blue-900 mb-8"
              />
            </div>
            <div>
              <label className="block text-sm font-semibold text-gray-700 mb-2">Country Name</label>
              <input name="country_name" value={form.country_name} onChange={handleChange} className="w-full border rounded-lg px-4 py-2 bg-gray-100 text-base" readOnly />
            </div>
            <div>
              <label className="block text-sm font-semibold text-gray-700 mb-2">Department/Centre</label>
              <select
                name="department"
                value={form.department}
                onChange={handleChange}
                className="w-full border rounded-lg px-4 py-2 bg-white text-base"
                required
              >
                <option value="">Select Department</option>
                {DEPARTMENTS.map((d) => <option key={d} value={d}>{d}</option>)}
              </select>
            </div>
            <div>
              <label className="block text-sm font-semibold text-gray-700 mb-2">Name of the Employee</label>
              <input name="name" value={form.name} onChange={handleChange} className="w-full border rounded-lg px-4 py-2 bg-white text-base" required />
            </div>
            <div>
              <label className="block text-sm font-semibold text-gray-700 mb-2">Gender</label>
              <select name="gender" value={form.gender} onChange={handleChange} className="w-full border rounded-lg px-4 py-2 bg-white text-base" required>
                <option value="">Select Gender</option>
                {GENDERS.map((g) => <option key={g} value={g}>{g}</option>)}
              </select>
            </div>
            <div>
              <label className="block text-sm font-semibold text-gray-700 mb-2">Date of Birth</label>
              <input type="date" name="date_of_birth" value={form.date_of_birth} onChange={handleChange} className="w-full border rounded-lg px-4 py-2 bg-white text-base" required />
            </div>
            <div>
              <label className="block text-sm font-semibold text-gray-700 mb-2">Email</label>
              <input type="email" name="email" value={form.email} onChange={handleChange} className="w-full border rounded-lg px-4 py-2 bg-white text-base" />
            </div>
            <div>
              <label className="block text-sm font-semibold text-gray-700 mb-2">Mobile No</label>
              <input name="mobile_no" value={form.mobile_no} onChange={handleChange} className="w-full border rounded-lg px-4 py-2 bg-white text-base" />
            </div>
            <div>
              <label className="block text-sm font-semibold text-gray-700 mb-2">PAN Number</label>
              <input name="pan_number" value={form.pan_number} onChange={handleChange} className="w-full border rounded-lg px-4 py-2 bg-white text-base" />
            </div>
            <div>
              <label className="block text-sm font-semibold text-gray-700 mb-2">Designation</label>
              <select name="designation" value={form.designation} onChange={handleChange} className="w-full border rounded-lg px-4 py-2 bg-white text-base" required>
                <option value="">Select Designation</option>
                {DESIGNATIONS.map((d) => <option key={d} value={d}>{d}</option>)}
              </select>
            </div>
            <div>
              <label className="block text-sm font-semibold text-gray-700 mb-2">Nature of Appointment</label>
              <select name="nature_of_appointment" value={form.nature_of_appointment} onChange={handleChange} className="w-full border rounded-lg px-4 py-2 bg-white text-base" required>
                <option value="">Select Nature</option>
                {NATURES.map((n) => <option key={n} value={n}>{n}</option>)}
              </select>
            </div>
            <div>
              <label className="block text-sm font-semibold text-gray-700 mb-2">Job Status</label>
              <select
                name="job_status"
                value={form.job_status}
                onChange={handleChange}
                className="w-full border rounded-lg px-4 py-2 bg-white text-base"
                required
              >
                <option value="">Select Job Status</option>
                <option value="Transfered">Transfered</option>
                <option value="Repatriated">Repatriated</option>
                <option value="Continue">Continue</option>
              </select>
            </div>
            <div>
              <label className="block text-sm font-semibold text-gray-700 mb-2">Social Category</label>
              <select name="social_category" value={form.social_category} onChange={handleChange} className="w-full border rounded-lg px-4 py-2 bg-white text-base">
                <option value="">Select Category</option>
                {SOCIAL_CATEGORIES.map((c) => <option key={c} value={c}>{c}</option>)}
              </select>
            </div>
            <div>
              <label className="block text-sm font-semibold text-gray-700 mb-2">Religious Community</label>
              <select
                name="religious_community"
                value={form.religious_community}
                onChange={handleChange}
                className="w-full border rounded-lg px-4 py-2 bg-white text-base focus:ring-2 focus:ring-blue-500 focus:border-blue-500 shadow-sm transition-all"
                required
              >
                <option value="">Select Religious Community</option>
                {RELIGIOUS_COMMUNITIES.map((r) => (
                  <option key={r} value={r}>{r}</option>
                ))}
              </select>
            </div>
            <div>
              <label className="block text-sm font-semibold text-gray-700 mb-2">PWBD</label>
              <select
                name="pwbd_status"
                value={form.pwbd_status ? "Yes" : "No"}
                onChange={e => setForm(prev => ({ ...prev, pwbd_status: e.target.value === "Yes" }))}
                className="w-full border rounded-lg px-4 py-2 bg-white text-base"
                required
              >
                <option value="No">No</option>
                <option value="Yes">Yes</option>
              </select>
            </div>
            <div>
              <label className="block text-sm font-semibold text-gray-700 mb-2">Date of Joining</label>
              <input type="date" name="date_of_joining" value={form.date_of_joining} onChange={handleChange} className="w-full border rounded-lg px-4 py-2 bg-white text-base" />
            </div>
            <div>
              <label className="block text-sm font-semibold text-gray-700 mb-2">Date of Joining Teaching Profession</label>
              <input type="date" name="date_of_joining_profession" value={form.date_of_joining_profession} onChange={handleChange} className="w-full border rounded-lg px-4 py-2 bg-white text-base" />
            </div>
            <div>
              <label className="block text-sm font-semibold text-gray-700 mb-2">Date of Leaving</label>
              <input type="date" name="date_of_leaving" value={form.date_of_leaving} onChange={handleChange} className="w-full border rounded-lg px-4 py-2 bg-white text-base" />
            </div>
            <div>
              <label className="block text-sm font-semibold text-gray-700 mb-2">Date of Change in Status</label>
              <input type="date" name="date_of_status_change" value={form.date_of_status_change} onChange={handleChange} className="w-full border rounded-lg px-4 py-2 bg-white text-base" />
            </div>
            <div>
              <label className="block text-sm font-semibold text-gray-700 mb-2">Highest Qualification</label>
              <select name="highest_qualification" value={form.highest_qualification} onChange={handleChange} className="w-full border rounded-lg px-4 py-2 bg-white text-base">
                <option value="">Select Qualification</option>
                {QUALIFICATIONS.map((q) => <option key={q} value={q}>{q}</option>)}
              </select>
            </div>
            <div>
              <label className="block text-sm font-semibold text-gray-700 mb-2">Programme Name of Highest Qualification</label>
              <input name="programme_highest_qualification" value={form.programme_highest_qualification} onChange={handleChange} className="w-full border rounded-lg px-4 py-2 bg-white text-base" />
            </div>
            <div>
              <label className="block text-sm font-semibold text-gray-700 mb-2">Broad Discipline Group Name</label>
              <select
                name="broad_discipline_group_name"
                value={form.broad_discipline_group_name}
                onChange={handleChange}
                className="w-full border rounded-lg px-4 py-2 bg-white text-base"
                required
              >
                <option value="">Select Group Name</option>
                {BROAD_DISCIPLINE_GROUP_NAMES.map((n) => <option key={n} value={n}>{n}</option>)}
              </select>
            </div>
            <div>
              <label className="block text-sm font-semibold text-gray-700 mb-2">Broad Discipline Group Category</label>
              <select
                name="broad_discipline_group_category"
                value={form.broad_discipline_group_category}
                onChange={handleChange}
                className="w-full border rounded-lg px-4 py-2 bg-white text-base"
                required
              >
                <option value="">Select Group Category</option>
                {BROAD_DISCIPLINE_GROUP_CATEGORIES.map((c) => <option key={c} value={c}>{c}</option>)}
              </select>
            </div>
            <div>
              <label className="block text-sm font-semibold text-gray-700 mb-2">Additional/Eligibility Qualification</label>
              <input
                type="text"
                name="additional_qualification"
                value={form.additional_qualification}
                onChange={e => setForm(prev => ({ ...prev, additional_qualification: e.target.value }))}
                className="w-full border rounded-lg px-4 py-2 bg-white text-base"
                placeholder="Enter additional/eligibility qualification"
              />
            </div>
            <div className="md:col-span-2">
              <label className="block text-sm font-semibold text-gray-700 mb-2">
                Year Spent Exclusively in other than Teaching job
              </label>
              <div className="grid grid-cols-2 gap-4">
                <div>
                  <label className="block text-xs font-medium text-gray-600 mb-1">Year</label>
                  <input
                    type="number"
                    name="year_spent_other_than_teaching"
                    min="0"
                    value={form.year_spent_other_than_teaching}
                    onChange={handleChange}
                    className="w-full bordser rounded-lg px-4 py-2 bg-white text-base"
                  />
                </div>
                <div>
                  <label className="block text-xs font-medium text-gray-600 mb-1">Month</label>
                  <input
                    type="number"
                    name="month_spent_other_than_teaching"
                    min="0"
                    value={form.month_spent_other_than_teaching}
                    onChange={handleChange}
                    className="w-full border rounded-lg px-4 py-2 bg-white text-base"
                  />
                </div>
              </div>
            </div>
          </div>
          <div className="flex justify-center mt-8">
            <button
              type="submit"
              disabled={loading || isLocked}
              className={`py-4 px-10 rounded-xl font-semibold text-white text-lg shadow-lg
                ${isLocked || loading
                  ? "bg-gray-400 cursor-not-allowed"
                  : editId
                    ? "bg-gradient-to-r from-green-600 to-emerald-600 hover:from-green-700 hover:to-emerald-700"
                    : "bg-gradient-to-r from-blue-600 to-indigo-600 hover:from-blue-700 hover:to-indigo-700"
                } transition-all`}
            >
              {loading
                ? "Submitting..."
                : editId
                  ? "Save Changes"
                  : "Submit"}
            </button>
            {(editId || showForm) && (
              <button
                type="button"
                disabled={isLocked}
                className={`ml-4 py-4 px-10 rounded-xl font-semibold text-gray-700 text-lg shadow-lg
                  ${isLocked
                    ? "bg-gray-400 cursor-not-allowed"
                    : "bg-gray-200 hover:bg-gray-300"
                  } transition-all`}
                onClick={() => {
                  setEditId(null);
                  setShowForm(false);
                  setForm({
                    country_name: "India",
                    department: "",
                    name: "",
                    gender: "",
                    date_of_birth: "",
                    email: "",
                    mobile_no: "",
                    pan_number: "",
                    designation: "",
                    nature_of_appointment: "",
                    job_status: "Continue",
                    social_category: "",
                    religious_community: "",
                    pwbd_status: false,
                    date_of_joining: "",
                    date_of_joining_profession: "",
                    date_of_leaving: "",
                    date_of_status_change: "",
                    highest_qualification: "",
                    programme_highest_qualification: "",
                    broad_discipline_group_name: "",
                    broad_discipline_group_category: "",
                    additional_qualification: [],
                    year_spent_other_than_teaching: 0,
                    month_spent_other_than_teaching: 0,
                  });
                }}
              >
                Cancel
              </button>
            )}
          </div>
        </form>
      )}

      {/* Table - only show when not adding/editing */}
      {!showForm && !editId && (
        <>
          <div className="font-semibold text-blue-700 mb-2 text-right">
            Total Records: {filteredRows.length}
          </div>
          <div className="rounded-3xl shadow-xl border border-blue-100 overflow-x-auto bg-white">
            <table className="min-w-full text-base text-gray-800">
              <thead className="bg-gradient-to-r from-blue-100 to-indigo-100">
                <tr>
                  <th className="px-6 py-4 font-bold tracking-wider text-blue-700 text-left">Academic Year</th>
                  <th className="px-6 py-4 font-bold tracking-wider text-blue-700 text-left">Name</th>
                  <th className="px-6 py-4 font-bold tracking-wider text-blue-700 text-left">Department</th>
                  <th className="px-6 py-4 font-bold tracking-wider text-blue-700 text-left">Date of Joining</th>
                  <th className="px-6 py-4 font-bold tracking-wider text-blue-700 text-left">Designation</th>
                  <th className="px-6 py-4 font-bold tracking-wider text-blue-700 text-center">Edit</th>
                </tr>
              </thead>
              <tbody>
                {paginatedRows.map(row => {
                  // Helper to format date as YYYY-MM-DD
                  const formatDate = (dateStr) => {
                    if (!dateStr) return "";
                    const match = dateStr.match(/^\d{4}-\d{2}-\d{2}/);
                    return match ? match[0] : "";
                  };
                  return (
                    <tr key={row.id} className="hover:bg-blue-50 transition">
                      <td className="px-6 py-4 text-left">{row.academic_year}</td>
                      <td className="px-6 py-4 text-left">{row.name}</td>
                      <td className="px-6 py-4 text-left">{row.department}</td>
                      <td className="px-6 py-4 text-left">{formatDate(row.date_of_joining)}</td>
                      <td className="px-6 py-4 text-left">{row.designation}</td>
                      <td className="px-6 py-4 text-center">
                        <button
                          className={`px-3 py-1 rounded font-semibold transition
                            ${isLocked
                              ? "bg-gray-400 text-gray-200 cursor-not-allowed"
                              : "bg-blue-600 text-white hover:bg-blue-700"
                            }`}
                          onClick={() => handleEdit(row)}
                          disabled={isLocked}
                          title={isLocked ? "Editing is disabled after final submission" : "Edit"}
                        >
                          Edit
                        </button>
                      </td>
                    </tr>
                  );
                })}
              </tbody>
            </table>
            {renderPagination()}
          </div>
          {!showForm && !editId && !isLocked && filteredRows.length > 0 && (
            <div className="flex justify-center mt-8">
              <button
                className="px-8 py-3 bg-gradient-to-r from-green-600 to-emerald-600 text-white rounded-xl font-bold shadow hover:scale-105 transition-transform text-lg"
                onClick={() => setShowDeclaration(true)}
              >
                Final Submission
              </button>
            </div>
          )}
        </>
      )}
    </div>
  );
}

export default TeachingStaff;