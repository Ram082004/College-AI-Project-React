import React, { useEffect, useState } from "react";
import axios from "axios";
import AcademicYearBadge from "../../Admin-Frontend/components/AcademicYearBadge";

const API_BASE = "https://admin-back-j3j4.onrender.com/api/office";
const API = {
  BASIC_INFO_GET: `${API_BASE}/basic-information`,
  BASIC_INFO_SAVE: `${API_BASE}/basic-information`,
};

function BasicInformation({ editMode, setEditMode }) {
  const [fields, setFields] = useState({});
  const [loading, setLoading] = useState(false);
  const [globalMessage, setGlobalMessage] = useState(null);
  const [officeAcademicYear, setOfficeAcademicYear] = useState('');
  

  useEffect(() => {
    fetchBasicInfo();
  }, []);

  const fetchBasicInfo = async () => {
    setLoading(true);
    try {
      const res = await axios.get(API.BASIC_INFO_GET, {
        headers: { Authorization: `Bearer ${localStorage.getItem("authToken")}` },
      });
      if (res.data.success && res.data.data) {
        setFields(res.data.data);
      }
    } catch (err) {
      setGlobalMessage({ type: "error", text: "Failed to fetch basic information" });
    } finally {
      setLoading(false);
    }
  };

  const handleChange = (e) => {
    if (!editMode) return; // Prevent editing if not in edit mode
    const { name, value } = e.target;
    const booleanFields = [
      "affiliated_other_university",
      "evening_college",
      "exclusive_group",
      "autonomous_institute",
      "minority_managed",
      "computer_based_tests",
      "nep_guidelines",
      "only_diploma_courses",
      "ncc_status",
      "nss_status"
    ];
    const numberFields = [
      "ncc_male", "ncc_female", "ncc_total",
      "ncc_other_male", "ncc_other_female", "ncc_other_total",
      "nss_male", "nss_female", "nss_total"
    ];
    setFields(f => ({
      ...f,
      [name]: booleanFields.includes(name)
        ? value === "Yes" ? 1 : 0
        : numberFields.includes(name)
          ? value === "" ? "" : Number(value)
          : value
    }));
  };

  const handleSave = async (e) => {
    e.preventDefault();
    setLoading(true);
    setGlobalMessage(null);
    try {
      const res = await axios.post(API.BASIC_INFO_SAVE, fields, {
        headers: { Authorization: `Bearer ${localStorage.getItem("authToken")}` },
      });
      if (res.data.success) {
        setGlobalMessage({ type: "success", text: "Basic information saved successfully" });
        setEditMode(false);
        fetchBasicInfo();
      } else {
        setGlobalMessage({ type: "error", text: res.data.message || "Failed to save information" });
      }
    } catch (err) {
      setGlobalMessage({ type: "error", text: "An error occurred while saving information" });
    } finally {
      setLoading(false);
    }
  };
  
  // Fetch latest academic year from office_users table
  useEffect(() => {
    async function fetchAcademicYear() {
      try {
        const res = await axios.get("https://admin-back-j3j4.onrender.com/api/office/teaching-staff/academic-year");
        if (res.data.success) setOfficeAcademicYear(res.data.academic_year || "");
      } catch {
        setOfficeAcademicYear("");
      }
    }
    fetchAcademicYear();
  }, []);

  return (
    <div className="max-w-5xl mx-auto p-8 bg-white rounded-3xl shadow-2xl border border-gray-100">
      <div className="flex justify-between items-center mb-10">
        <h2 className="text-3xl font-extrabold text-cyan-700 tracking-tight text-center">Basic Information</h2>
        {!editMode && (
          <button
            className="dashboard-button-primary px-6 py-2 rounded-xl"
            onClick={() => setEditMode(true)}
            type="button"
          >
            Edit
          </button>
        )}
      </div>
      <form onSubmit={handleSave} className="space-y-10">
        {/* Main Info Grid */}
        <div className="grid grid-cols-1 md:grid-cols-2 gap-x-12 gap-y-6">
          <div>
            <label className="font-semibold">1. AISHE Code</label>
            <input
              name="aishe_code"
              value={fields.aishe_code || ""}
              onChange={handleChange}
              className="dashboard-input mt-1 w-full"
              required
              readOnly={!editMode}
            />
          </div>
          <div>
            <label className="font-semibold">2. Name of the Institution</label>
            <input
              name="institution_name"
              value={fields.institution_name || ""}
              onChange={handleChange}
              className="dashboard-input mt-1 w-full"
              required
              readOnly={!editMode}
            />
          </div>
          <div>
            <label className="font-semibold">3. Year of Establishment</label>
            <input
              name="year_of_establishment"
              value={fields.year_of_establishment || ""}
              onChange={handleChange}
              className="dashboard-input mt-1 w-full"
              required
              readOnly={!editMode}
            />
          </div>
          <div>
            <label className="font-semibold">4. Status Prior to Establishment, if applicable</label>
            <input
              name="status_prior_establishment"
              value={fields.status_prior_establishment || ""}
              onChange={handleChange}
              className="dashboard-input mt-1 w-full"
              readOnly={!editMode}
            />
          </div>
          <div>
            <label className="font-semibold">5(i). Name of University to Which affiliated</label>
            <input
              name="university_name"
              value={fields.university_name || ""}
              onChange={handleChange}
              className="dashboard-input mt-1 w-full"
              required
              readOnly={!editMode}
            />
          </div>
          <div>
            <label className="font-semibold">5(ii). Year of Affiliation with University</label>
            <input
              name="year_of_affiliation"
              value={fields.year_of_affiliation || ""}
              onChange={handleChange}
              className="dashboard-input mt-1 w-full"
              required
              readOnly={!editMode}
            />
          </div>
          <div>
            <label className="font-semibold">5(iii). Name of the statutory Body through which Recognized</label>
            <input
              name="statutory_body"
              value={fields.statutory_body || ""}
              onChange={handleChange}
              className="dashboard-input mt-1 w-full"
              required
              readOnly={!editMode}
            />
          </div>
          <div>
            <label className="font-semibold">5(iv). Affiliated with any other University/Statutory</label>
            <select
              name="affiliated_other_university"
              value={fields.affiliated_other_university === 1 ? "Yes" : "No"}
              onChange={handleChange}
              className="dashboard-input mt-1 w-full"
              disabled={!editMode}
            >
              <option value="No">No</option>
              <option value="Yes">Yes</option>
            </select>
          </div>
          <div>
            <label className="font-semibold">6(i). Type of Institution</label>
            <input
              name="type_of_institution"
              value={fields.type_of_institution || ""}
              onChange={handleChange}
              className="dashboard-input mt-1 w-full"
              required
              readOnly={!editMode}
            />
          </div>
          <div>
            <label className="font-semibold">6(ii). Ownership status of Institution</label>
            <input
              name="ownership_status"
              value={fields.ownership_status || ""}
              onChange={handleChange}
              className="dashboard-input mt-1 w-full"
              required
              readOnly={!editMode}
            />
          </div>
          <div>
            <label className="font-semibold">6(iii). Management of Institution</label>
            <input
              name="management_of_institution"
              value={fields.management_of_institution || ""}
              onChange={handleChange}
              className="dashboard-input mt-1 w-full"
              required
              readOnly={!editMode}
            />
          </div>
          <div>
            <label className="font-semibold">6(iv). Name of the Trust / Society/ Company/ Others</label>
            <input
              name="trust_name"
              value={fields.trust_name || ""}
              onChange={handleChange}
              className="dashboard-input mt-1 w-full"
              readOnly={!editMode}
            />
          </div>
          <div>
            <label className="font-semibold">6(v). Address of the Trust / Society/ Company/ Others</label>
            <input
              name="trust_address"
              value={fields.trust_address || ""}
              onChange={handleChange}
              className="dashboard-input mt-1 w-full"
              readOnly={!editMode}
            />
          </div>
          <div>
            <label className="font-semibold">7. Is it evening college</label>
            <select
              name="evening_college"
              value={fields.evening_college === 1 ? "Yes" : "No"}
              onChange={handleChange}
              className="dashboard-input mt-1 w-full"
              disabled={!editMode}
            >
              <option value="No">No</option>
              <option value="Yes">Yes</option>
            </select>
          </div>
          <div>
            <label className="font-semibold">8. Exclusively for specific group?</label>
            <select
              name="exclusive_group"
              value={fields.exclusive_group === 1 ? "Yes" : "No"}
              onChange={handleChange}
              className="dashboard-input mt-1 w-full"
              disabled={!editMode}
            >
              <option value="No">No</option>
              <option value="Yes">Yes</option>
            </select>
          </div>
          <div>
            <label className="font-semibold">9. Autonomous Institute</label>
            <select
              name="autonomous_institute"
              value={fields.autonomous_institute === 1 ? "Yes" : "No"}
              onChange={handleChange}
              className="dashboard-input mt-1 w-full"
              disabled={!editMode}
            >
              <option value="No">No</option>
              <option value="Yes">Yes</option>
            </select>
          </div>
          <div>
            <label className="font-semibold">10. Minority Managed Institution</label>
            <select
              name="minority_managed"
              value={fields.minority_managed === 1 ? "Yes" : "No"}
              onChange={handleChange}
              className="dashboard-input mt-1 w-full"
              disabled={!editMode}
            >
              <option value="No">No</option>
              <option value="Yes">Yes</option>
            </select>
          </div>
          {fields.minority_managed === 1 && (
            <div className="md:col-span-2">
              <label className="font-semibold">If 'Yes', Type of minority community managing the institution</label>
              <input
                name="minority_type"
                value={fields.minority_type || ""}
                onChange={handleChange}
                className="dashboard-input mt-1 w-full"
                readOnly={!editMode}
              />
            </div>
          )}
        </div>

        {/* NCC Section */}
        <div>
          <label className="font-semibold block mb-2 mt-8">
            11. Whether the Institution has the National Cadet Corps (NCC)
          </label>
          <select
            name="ncc_status"
            value={fields.ncc_status === 1 ? "Yes" : "No"}
            onChange={handleChange}
            className="dashboard-input w-60"
            disabled={!editMode}
          >
            <option value="No">No</option>
            <option value="Yes">Yes</option>
          </select>
          {fields.ncc_status === 1 && (
            <div className="overflow-x-auto mt-4">
              <table className="min-w-[600px] w-full text-center border rounded-xl shadow bg-gray-50">
                <thead>
                  <tr className="bg-gray-100">
                    <th className="py-2"></th>
                    <th className="py-2">Male</th>
                    <th className="py-2">Female</th>
                    <th className="py-2">Total</th>
                  </tr>
                </thead>
                <tbody>
                  <tr>
                    <td className="font-medium text-left pl-4">Number of students in NCC from your institution</td>
                    <td><input type="number" name="ncc_male" value={fields.ncc_male || ""} onChange={handleChange} className="dashboard-input" min="0" disabled={!editMode} /></td>
                    <td><input type="number" name="ncc_female" value={fields.ncc_female || ""} onChange={handleChange} className="dashboard-input" min="0" disabled={!editMode} /></td>
                    <td><input type="number" name="ncc_total" value={fields.ncc_total || ""} onChange={handleChange} className="dashboard-input" min="0" disabled={!editMode} /></td>
                  </tr>
                  <tr>
                    <td className="font-medium text-left pl-4">Number of students in NCC from other institutions</td>
                    <td><input type="number" name="ncc_other_male" value={fields.ncc_other_male || ""} onChange={handleChange} className="dashboard-input" min="0" disabled={!editMode} /></td>
                    <td><input type="number" name="ncc_other_female" value={fields.ncc_other_female || ""} onChange={handleChange} className="dashboard-input" min="0" disabled={!editMode} /></td>
                    <td><input type="number" name="ncc_other_total" value={fields.ncc_other_total || ""} onChange={handleChange} className="dashboard-input" min="0" disabled={!editMode} /></td>
                  </tr>
                </tbody>
              </table>
            </div>
          )}
        </div>

        {/* NSS Section */}
        <div>
          <label className="font-semibold block mb-2 mt-8">
            12. Whether the Institution has the National Social Service (NSS)
          </label>
          <select
            name="nss_status"
            value={fields.nss_status === 1 ? "Yes" : "No"}
            onChange={handleChange}
            className="dashboard-input w-60"
            disabled={!editMode}
          >
            <option value="No">No</option>
            <option value="Yes">Yes</option>
          </select>
          {fields.nss_status === 1 && (
            <div className="overflow-x-auto mt-4">
              <table className="min-w-[400px] w-full text-center border rounded-xl shadow bg-gray-50">
                <thead>
                  <tr className="bg-gray-100">
                    <th className="py-2"></th>
                    <th className="py-2">Male</th>
                    <th className="py-2">Female</th>
                    <th className="py-2">Total</th>
                  </tr>
                </thead>
                <tbody>
                  <tr>
                    <td className="font-medium text-left pl-4">Number of Students Enrolled In NSS</td>
                    <td><input type="number" name="nss_male" value={fields.nss_male || ""} onChange={handleChange} className="dashboard-input" min="0" disabled={!editMode} /></td>
                    <td><input type="number" name="nss_female" value={fields.nss_female || ""} onChange={handleChange} className="dashboard-input" min="0" disabled={!editMode} /></td>
                    <td><input type="number" name="nss_total" value={fields.nss_total || ""} onChange={handleChange} className="dashboard-input" min="0" disabled={!editMode} /></td>
                  </tr>
                </tbody>
              </table>
            </div>
          )}
        </div>

        {/* Other fields */}
        <div className="grid grid-cols-1 md:grid-cols-2 gap-x-12 gap-y-6 mt-8">
          <div>
            <label className="font-semibold">13. Whether the institution has conducted any computer-based tests</label>
            <select
              name="computer_based_tests"
              value={fields.computer_based_tests === 1 ? "Yes" : "No"}
              onChange={handleChange}
              className="dashboard-input mt-1 w-full"
              disabled={!editMode}
            >
              <option value="No">No</option>
              <option value="Yes">Yes</option>
            </select>
          </div>
          <div>
            <label className="font-semibold">14. Whether your institution has implemented NEP guidelines.</label>
            <select
              name="nep_guidelines"
              value={fields.nep_guidelines === 1 ? "Yes" : "No"}
              onChange={handleChange}
              className="dashboard-input mt-1 w-full"
              disabled={!editMode}
            >
              <option value="No">No</option>
              <option value="Yes">Yes</option>
            </select>
          </div>
          <div>
            <label className="font-semibold">15. Please select the disciplines in which programme is offered by the college</label>
            <input
              name="discipline"
              value={fields.discipline || ""}
              onChange={handleChange}
              className="dashboard-input mt-1 w-full"
              readOnly={!editMode}
            />
          </div>
          <div>
            <label className="font-semibold">16. Whether the college is running only diploma level course(s)</label>
            <select
              name="only_diploma_courses"
              value={fields.only_diploma_courses === 1 ? "Yes" : "No"}
              onChange={handleChange}
              className="dashboard-input mt-1 w-full"
              disabled={!editMode}
            >
              <option value="No">No</option>
              <option value="Yes">Yes</option>
            </select>
          </div>
        </div>

        {editMode && (
          <div className="flex gap-4 justify-end mt-10">
            <button type="submit" disabled={loading} className="dashboard-button-primary text-lg px-8 py-3 rounded-xl shadow">
              {loading ? "Saving..." : "Save"}
            </button>
            <button
              type="button"
              className="ml-4 px-4 py-2 rounded-lg bg-gray-200 text-gray-700 font-semibold hover:bg-gray-300"
              onClick={() => setEditMode(false)}
            >
              Cancel
            </button>
          </div>
        )}
      </form>
      {globalMessage && (
        <div className={`mt-8 px-6 py-3 rounded-2xl shadow font-semibold text-base transition-all duration-300 ${
          globalMessage.type === 'success'
            ? 'bg-green-100 text-green-800'
            : 'bg-red-100 text-red-800'
        }`}>
          {globalMessage.text}
        </div>
      )}
    </div>
  );
}

// office section
function OfficeDetails({ editMode, setEditMode }) {
  const [data, setData] = useState(null);
  const [loading, setLoading] = useState(true);
  const [message, setMessage] = useState(null);

  useEffect(() => {
    fetchOfficeDetails();
  }, []);

  const fetchOfficeDetails = async () => {
    setLoading(true);
    try {
      const res = await axios.get("https://admin-back-j3j4.onrender.com/api/office/office-details", {
        headers: { Authorization: `Bearer ${localStorage.getItem("authToken")}` },
      });
      if (res.data.success && res.data.data) {
        setData(res.data.data);
      }
    } catch (err) {
      setData(null);
    } finally {
      setLoading(false);
    }
  };

  const handleChange = (e) => {
    if (!editMode) return;
    const { name, value } = e.target;
    setData(d => ({ ...d, [name]: value }));
  };

  const handleSave = async (e) => {
    e.preventDefault();
    setLoading(true);
    setMessage(null);
    try {
      const res = await axios.post("https://admin-back-j3j4.onrender.com/api/office/office-details", data, {
        headers: { Authorization: `Bearer ${localStorage.getItem("authToken")}` },
      });
      if (res.data.success) {
        setEditMode(false);
        setMessage({ type: "success", text: "Office details saved successfully" });
        fetchOfficeDetails();
      } else {
        setMessage({ type: "error", text: res.data.message || "Failed to save office details" });
      }
    } catch (err) {
      setMessage({ type: "error", text: "An error occurred while saving office details" });
    } finally {
      setLoading(false);
    }
  };

  if (loading) {
    return <div className="py-12 text-center text-gray-500">Loading...</div>;
  }
  if (!data) {
    return <div className="py-12 text-center text-red-500">Failed to load office details.</div>;
  }

  return (
    <div className="max-w-4xl mx-auto bg-white rounded-2xl shadow p-8">
      <div className="flex justify-between items-center mb-8">
        <h2 className="text-2xl font-bold text-cyan-700">B: Officers Details</h2>
        {!editMode && (
          <button
            className="dashboard-button-primary px-6 py-2 rounded-xl"
            onClick={() => setEditMode(true)}
            type="button"
          >
            Edit
          </button>
        )}
      </div>
      <form onSubmit={handleSave}>
        {/* Institute Head Details */}
        <div className="mb-8">
          <div className="font-bold text-lg mb-2">17. Institute Head Details</div>
          <div className="grid grid-cols-1 md:grid-cols-2 gap-x-8 gap-y-2">
            <div className="font-medium">Name of Vice chancellor/Director/Head/Principal</div>
            <input
              className="border rounded px-3 py-2 bg-gray-50"
              name="head_name"
              value={data.head_name || ""}
              onChange={handleChange}
              readOnly={!editMode}
            />
            <div className="font-medium">Designation</div>
            <input
              className="border rounded px-3 py-2 bg-gray-50"
              name="head_designation"
              value={data.head_designation || ""}
              onChange={handleChange}
              readOnly={!editMode}
            />
            <div className="font-medium">Mobile No</div>
            <input
              className="border rounded px-3 py-2 bg-gray-50"
              name="head_mobile"
              value={data.head_mobile || ""}
              onChange={handleChange}
              readOnly={!editMode}
            />
            <div className="font-medium">Email</div>
            <input
              className="border rounded px-3 py-2 bg-gray-50"
              name="head_email"
              value={data.head_email || ""}
              onChange={handleChange}
              readOnly={!editMode}
            />
            <div className="font-medium">Telephone No (with STD Code)</div>
            <input
              className="border rounded px-3 py-2 bg-gray-50"
              name="head_phone"
              value={data.head_phone || ""}
              onChange={handleChange}
              readOnly={!editMode}
            />
          </div>
        </div>
        {/* Nodal Officer Details */}
        
        {editMode && (
          <div className="flex gap-4 justify-end mt-10">
            <button type="submit" disabled={loading} className="dashboard-button-primary text-lg px-8 py-3 rounded-xl shadow">
              {loading ? "Saving..." : "Save"}
            </button>
            <button
              type="button"
              className="ml-4 px-4 py-2 rounded-lg bg-gray-200 text-gray-700 font-semibold hover:bg-gray-300"
              onClick={() => setEditMode(false)}
            >
              Cancel
            </button>
          </div>
        )}
      </form>
      {message && (
        <div className={`mt-8 px-6 py-3 rounded-2xl shadow font-semibold text-base transition-all duration-300 ${
          message.type === 'success'
            ? 'bg-green-100 text-green-800'
            : 'bg-red-100 text-red-800'
        }`}>
          {message.text}
        </div>
      )}
    </div>
  );
}
  

// address section
function AddressDetails({ editMode, setEditMode }) {
  const [data, setData] = useState({});
  const [loading, setLoading] = useState(true);
  const [message, setMessage] = useState(null);

  useEffect(() => {
    fetchAddress();
  }, []);

  const fetchAddress = async () => {
    setLoading(true);
    try {
      const res = await axios.get("https://admin-back-j3j4.onrender.com/api/office/institution-address", {
        headers: { Authorization: `Bearer ${localStorage.getItem("authToken")}` },
      });
      if (res.data.success && res.data.data) {
        setData(res.data.data);
      }
    } catch (err) {
      setMessage({ type: "error", text: "Failed to fetch address details" });
    } finally {
      setLoading(false);
    }
  };

  const handleChange = (e) => {
    if (!editMode) return;
    const { name, value } = e.target;
    setData(d => ({ ...d, [name]: value }));
  };

  const handleEdit = () => setEditMode(true);

  const handleSave = async (e) => {
    e.preventDefault();
    setLoading(true);
    setMessage(null);
    try {
      const res = await axios.post("https://admin-back-j3j4.onrender.com/api/office/institution-address", data, {
        headers: { Authorization: `Bearer ${localStorage.getItem("authToken")}` },
      });
      if (res.data.success) {
        setEditMode(false);
        setMessage({ type: "success", text: "Address details saved successfully" });
        fetchAddress();
      } else {
        setMessage({ type: "error", text: res.data.message || "Failed to save address details" });
      }
    } catch (err) {
      setMessage({ type: "error", text: "An error occurred while saving address details" });
    } finally {
      setLoading(false);
    }
  };

  if (loading) {
    return <div className="py-12 text-center text-gray-500">Loading...</div>;
  }

  return (
    <div className="max-w-4xl mx-auto bg-white rounded-2xl shadow p-8">
      <div className="flex justify-between items-center mb-8">
        <h2 className="text-2xl font-bold text-cyan-700">C: Address</h2>
        {!editMode && (
          <button
            className="dashboard-button-primary px-6 py-2 rounded-xl"
            onClick={handleEdit}
            type="button"
          >
            Edit
          </button>
        )}
      </div>
      <form onSubmit={handleSave}>
        <div className="grid grid-cols-1 md:grid-cols-2 gap-x-8 gap-y-2">
          <div className="font-medium">18. Location of the Institution</div>
          <select
            className="border rounded px-3 py-2 bg-gray-50"
            name="location_type"
            value={data.location_type || ""}
            onChange={handleChange}
            disabled={!editMode}
            required
          >
            <option value="">Select</option>
            <option value="Rural">Rural</option>
            <option value="Urban">Urban</option>
          </select>
          <div className="font-medium">Address Line1</div>
          <input
            className="border rounded px-3 py-2 bg-gray-50"
            name="address_line1"
            value={data.address_line1 || ""}
            onChange={handleChange}
            readOnly={!editMode}
          />
          <div className="font-medium">Address Line2</div>
          <input
            className="border rounded px-3 py-2 bg-gray-50"
            name="address_line2"
            value={data.address_line2 || ""}
            onChange={handleChange}
            readOnly={!editMode}
          />
          <div className="font-medium">City</div>
          <input
            className="border rounded px-3 py-2 bg-gray-50"
            name="city"
            value={data.city || ""}
            onChange={handleChange}
            readOnly={!editMode}
          />
          <div className="font-medium">Country</div>
          <input
            className="border rounded px-3 py-2 bg-gray-50"
            name="country"
            value={data.country || ""}
            onChange={handleChange}
            readOnly={!editMode}
          />
          <div className="font-medium">State</div>
          <input
            className="border rounded px-3 py-2 bg-gray-50"
            name="state"
            value={data.state || ""}
            onChange={handleChange}
            readOnly={!editMode}
          />
          <div className="font-medium">District</div>
          <input
            className="border rounded px-3 py-2 bg-gray-50"
            name="district"
            value={data.district || ""}
            onChange={handleChange}
            readOnly={!editMode}
          />
          <div className="font-medium">Subdistrict</div>
          <input
            className="border rounded px-3 py-2 bg-gray-50"
            name="sub_district"
            value={data.sub_district || ""}
            onChange={handleChange}
            readOnly={!editMode}
          />
          <div className="font-medium">Block / Urban Local Body</div>
          <input
            className="border rounded px-3 py-2 bg-gray-50"
            name="block_ulb"
            value={data.block_ulb || ""}
            onChange={handleChange}
            readOnly={!editMode}
          />
          <div className="font-medium">Pin Code</div>
          <input
            className="border rounded px-3 py-2 bg-gray-50"
            name="pincode"
            value={data.pincode || ""}
            onChange={handleChange}
            readOnly={!editMode}
          />
          <div className="font-medium">Longitude (in degree)</div>
          <input
            className="border rounded px-3 py-2 bg-gray-50"
            name="longitude"
            value={data.longitude || ""}
            onChange={handleChange}
            readOnly={!editMode}
          />
          <div className="font-medium">Latitude (in degree)</div>
          <input
            className="border rounded px-3 py-2 bg-gray-50"
            name="latitude"
            value={data.latitude || ""}
            onChange={handleChange}
            readOnly={!editMode}
          />
          <div className="font-medium">Total Area (in acre)</div>
          <input
            className="border rounded px-3 py-2 bg-gray-50"
            name="total_area_acre"
            value={data.total_area_acre || ""}
            onChange={handleChange}
            readOnly={!editMode}
          />
          <div className="font-medium">Total Constructed Area (in sq.m)</div>
          <input
            className="border rounded px-3 py-2 bg-gray-50"
            name="constructed_area_sqm"
            value={data.constructed_area_sqm || ""}
            onChange={handleChange}
            readOnly={!editMode}
          />
          <div className="font-medium">Website</div>
          <input
            className="border rounded px-3 py-2 bg-gray-50"
            name="website_url"
            value={data.website_url || ""}
            onChange={handleChange}
            readOnly={!editMode}
          />
        </div>
        {editMode && (
          <div className="flex gap-4 justify-end mt-10">
            <button type="submit" disabled={loading} className="dashboard-button-primary text-lg px-8 py-3 rounded-xl shadow">
              {loading ? "Saving..." : "Save"}
            </button>
            <button
              type="button"
              className="ml-4 px-4 py-2 rounded-lg bg-gray-200 text-gray-700 font-semibold hover:bg-gray-300"
              onClick={() => setEditMode(false)}
            >
              Cancel
            </button>
          </div>
        )}
      </form>
      {message && (
        <div className={`mt-8 px-6 py-3 rounded-2xl shadow font-semibold text-base transition-all duration-300 ${
          message.type === 'success'
            ? 'bg-green-100 text-green-800'
            : 'bg-red-100 text-red-800'
        }`}>
          {message.text}
        </div>
      )}
    </div>
  );
}

export default function OfficeTabs() {
  const [activeTab, setActiveTab] = useState("basic");
  const [editModes, setEditModes] = useState({
    basic: false,
    office: false,
    address: false,
  });
  const [officeAcademicYear, setOfficeAcademicYear] = useState('');

  // Fetch latest academic year from office_users table
  useEffect(() => {
    async function fetchAcademicYear() {
      try {
        const res = await axios.get("https://admin-back-j3j4.onrender.com/api/office/teaching-staff/academic-year");
        if (res.data.success) setOfficeAcademicYear(res.data.academic_year || "");
      } catch {
        setOfficeAcademicYear("");
      }
    }
    fetchAcademicYear();
  }, []);

  const handleEdit = (tabKey, value) => {
    setEditModes((prev) => ({
      ...prev,
      [tabKey]: value,
    }));
  };

  const tabs = [
    { key: "basic", label: "Basic Information" },
    { key: "office", label: "Office Details" },
    { key: "address", label: "Address Details" },
  ];
  
  return (
    <div className="w-full max-w-5xl mx-auto">
      {/* Academic Year Badge above tab switcher */}
      <div className="flex justify-start mb-4">
        <AcademicYearBadge year={officeAcademicYear} />
      </div>
      {/* Modern Floating Tab Switcher */}
      <div className="flex justify-center mt-4 mb-12">
        <div className="relative flex bg-gradient-to-r from-cyan-500 to-blue-500 rounded-full shadow-lg p-1">
          {tabs.map((tab) => (
            <button
              key={tab.key}
              onClick={() => setActiveTab(tab.key)}
              className={`relative z-10 px-8 py-3 rounded-full text-lg font-semibold transition-all duration-200
                ${
                  activeTab === tab.key
                    ? "bg-white text-cyan-700 shadow"
                    : "text-white hover:bg-white/20"
                }`}
              style={{ minWidth: 180 }}
            >
              {tab.label}
            </button>
          ))}
        </div>
      </div>
      {/* Tab Content */}
      <div>
        {activeTab === "basic" && (
          <BasicInformation
            editMode={editModes.basic}
            setEditMode={(v) => handleEdit("basic", v)}
          />
        )}
        {activeTab === "office" && (
          <OfficeDetails
            editMode={editModes.office}
            setEditMode={(v) => handleEdit("office", v)}
          />
        )}
        {activeTab === "address" && (
          <AddressDetails
            editMode={editModes.address}
            setEditMode={(v) => handleEdit("address", v)}
          />
        )}
      </div>
    </div>
  );
}

export { BasicInformation, OfficeDetails, AddressDetails };
