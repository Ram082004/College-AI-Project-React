import React, { useEffect, useState } from "react";
import axios from "axios";

const API_BASE = "http://localhost:5000/api/office";
const API = {
  BASIC_INFO_GET: `${API_BASE}/basic-information`,
  BASIC_INFO_SAVE: `${API_BASE}/basic-information`,
};

function BasicInformation() {
  const [fields, setFields] = useState({});
  const [loading, setLoading] = useState(false);
  const [globalMessage, setGlobalMessage] = useState(null);

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
    const { name, value, type } = e.target;
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

  const handleSubmit = async (e) => {
    e.preventDefault();
    setLoading(true);
    setGlobalMessage(null);
    try {
      const res = await axios.post(API.BASIC_INFO_SAVE, fields, {
        headers: { Authorization: `Bearer ${localStorage.getItem("authToken")}` },
      });
      if (res.data.success) {
        setGlobalMessage({ type: "success", text: "Basic information saved successfully" });
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

  return (
    <div className="max-w-5xl mx-auto p-8 bg-white rounded-3xl shadow-2xl border border-gray-100">
      <h2 className="text-3xl font-extrabold mb-10 text-cyan-700 tracking-tight text-center">Basic Information</h2>
      <form onSubmit={handleSubmit} className="space-y-10">
        {/* Main Info Grid */}
        <div className="grid grid-cols-1 md:grid-cols-2 gap-x-12 gap-y-6">
          <div>
            <label className="font-semibold">1. AISHE Code</label>
            <input name="aishe_code" value={fields.aishe_code || ""} onChange={handleChange} className="dashboard-input mt-1 w-full" required />
          </div>
          <div>
            <label className="font-semibold">2. Name of the Institution</label>
            <input name="institution_name" value={fields.institution_name || ""} onChange={handleChange} className="dashboard-input mt-1 w-full" required />
          </div>
          <div>
            <label className="font-semibold">3. Year of Establishment</label>
            <input name="year_of_establishment" value={fields.year_of_establishment || ""} onChange={handleChange} className="dashboard-input mt-1 w-full" required />
          </div>
          <div>
            <label className="font-semibold">4. Status Prior to Establishment, if applicable</label>
            <input name="status_prior_establishment" value={fields.status_prior_establishment || ""} onChange={handleChange} className="dashboard-input mt-1 w-full" />
          </div>
          <div>
            <label className="font-semibold">5(i). Name of University to Which affiliated</label>
            <input name="university_name" value={fields.university_name || ""} onChange={handleChange} className="dashboard-input mt-1 w-full" required />
          </div>
          <div>
            <label className="font-semibold">5(ii). Year of Affiliation with University</label>
            <input name="year_of_affiliation" value={fields.year_of_affiliation || ""} onChange={handleChange} className="dashboard-input mt-1 w-full" required />
          </div>
          <div>
            <label className="font-semibold">5(iii). Name of the statutory Body through which Recognized</label>
            <input name="statutory_body" value={fields.statutory_body || ""} onChange={handleChange} className="dashboard-input mt-1 w-full" required />
          </div>
          <div>
            <label className="font-semibold">5(iv). Affiliated with any other University/Statutory</label>
            <select name="affiliated_other_university" value={fields.affiliated_other_university === 1 ? "Yes" : "No"} onChange={handleChange} className="dashboard-input mt-1 w-full">
              <option value="No">No</option>
              <option value="Yes">Yes</option>
            </select>
          </div>
          <div>
            <label className="font-semibold">6(i). Type of Institution</label>
            <input name="type_of_institution" value={fields.type_of_institution || ""} onChange={handleChange} className="dashboard-input mt-1 w-full" required />
          </div>
          <div>
            <label className="font-semibold">6(ii). Ownership status of Institution</label>
            <input name="ownership_status" value={fields.ownership_status || ""} onChange={handleChange} className="dashboard-input mt-1 w-full" required />
          </div>
          <div>
            <label className="font-semibold">6(iii). Management of Institution</label>
            <input name="management_of_institution" value={fields.management_of_institution || ""} onChange={handleChange} className="dashboard-input mt-1 w-full" required />
          </div>
          <div>
            <label className="font-semibold">6(iv). Name of the Trust / Society/ Company/ Others</label>
            <input name="trust_name" value={fields.trust_name || ""} onChange={handleChange} className="dashboard-input mt-1 w-full" />
          </div>
          <div>
            <label className="font-semibold">6(v). Address of the Trust / Society/ Company/ Others</label>
            <input name="trust_address" value={fields.trust_address || ""} onChange={handleChange} className="dashboard-input mt-1 w-full" />
          </div>
          <div>
            <label className="font-semibold">7. Is it evening college</label>
            <select name="evening_college" value={fields.evening_college === 1 ? "Yes" : "No"} onChange={handleChange} className="dashboard-input mt-1 w-full">
              <option value="No">No</option>
              <option value="Yes">Yes</option>
            </select>
          </div>
          <div>
            <label className="font-semibold">8. Exclusively for specific group?</label>
            <select name="exclusive_group" value={fields.exclusive_group === 1 ? "Yes" : "No"} onChange={handleChange} className="dashboard-input mt-1 w-full">
              <option value="No">No</option>
              <option value="Yes">Yes</option>
            </select>
          </div>
          <div>
            <label className="font-semibold">9. Autonomous Institute</label>
            <select name="autonomous_institute" value={fields.autonomous_institute === 1 ? "Yes" : "No"} onChange={handleChange} className="dashboard-input mt-1 w-full">
              <option value="No">No</option>
              <option value="Yes">Yes</option>
            </select>
          </div>
          <div>
            <label className="font-semibold">10. Minority Managed Institution</label>
            <select name="minority_managed" value={fields.minority_managed === 1 ? "Yes" : "No"} onChange={handleChange} className="dashboard-input mt-1 w-full">
              <option value="No">No</option>
              <option value="Yes">Yes</option>
            </select>
          </div>
          {fields.minority_managed === 1 && (
            <div className="md:col-span-2">
              <label className="font-semibold">If 'Yes', Type of minority community managing the institution</label>
              <input name="minority_type" value={fields.minority_type || ""} onChange={handleChange} className="dashboard-input mt-1 w-full" />
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
                    <td><input type="number" name="ncc_male" value={fields.ncc_male || ""} onChange={handleChange} className="dashboard-input" min="0" /></td>
                    <td><input type="number" name="ncc_female" value={fields.ncc_female || ""} onChange={handleChange} className="dashboard-input" min="0" /></td>
                    <td><input type="number" name="ncc_total" value={fields.ncc_total || ""} onChange={handleChange} className="dashboard-input" min="0" /></td>
                  </tr>
                  <tr>
                    <td className="font-medium text-left pl-4">Number of students in NCC from other institutions</td>
                    <td><input type="number" name="ncc_other_male" value={fields.ncc_other_male || ""} onChange={handleChange} className="dashboard-input" min="0" /></td>
                    <td><input type="number" name="ncc_other_female" value={fields.ncc_other_female || ""} onChange={handleChange} className="dashboard-input" min="0" /></td>
                    <td><input type="number" name="ncc_other_total" value={fields.ncc_other_total || ""} onChange={handleChange} className="dashboard-input" min="0" /></td>
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
                    <td><input type="number" name="nss_male" value={fields.nss_male || ""} onChange={handleChange} className="dashboard-input" min="0" /></td>
                    <td><input type="number" name="nss_female" value={fields.nss_female || ""} onChange={handleChange} className="dashboard-input" min="0" /></td>
                    <td><input type="number" name="nss_total" value={fields.nss_total || ""} onChange={handleChange} className="dashboard-input" min="0" /></td>
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
            <select name="computer_based_tests" value={fields.computer_based_tests === 1 ? "Yes" : "No"} onChange={handleChange} className="dashboard-input mt-1 w-full">
              <option value="No">No</option>
              <option value="Yes">Yes</option>
            </select>
          </div>
          <div>
            <label className="font-semibold">14. Whether your institution has implemented NEP guidelines.</label>
            <select name="nep_guidelines" value={fields.nep_guidelines === 1 ? "Yes" : "No"} onChange={handleChange} className="dashboard-input mt-1 w-full">
              <option value="No">No</option>
              <option value="Yes">Yes</option>
            </select>
          </div>
          <div>
            <label className="font-semibold">15. Please select the disciplines in which programme is offered by the college</label>
            <input name="discipline" value={fields.discipline || ""} onChange={handleChange} className="dashboard-input mt-1 w-full" />
          </div>
          <div>
            <label className="font-semibold">16. Whether the college is running only diploma level course(s)</label>
            <select name="only_diploma_courses" value={fields.only_diploma_courses === 1 ? "Yes" : "No"} onChange={handleChange} className="dashboard-input mt-1 w-full">
              <option value="No">No</option>
              <option value="Yes">Yes</option>
            </select>
          </div>
        </div>

        <div className="flex gap-4 justify-end mt-10">
          <button type="submit" disabled={loading} className="dashboard-button-primary text-lg px-8 py-3 rounded-xl shadow">
            {loading ? "Saving..." : "Save"}
          </button>
        </div>
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

function OfficeDetails() {
  return (
    <div className="py-12 text-center">
      <h2 className="text-2xl font-bold mb-4 text-cyan-700">Office Details</h2>
      <div className="text-gray-500">Office details form goes here.</div>
    </div>
  );
}

function AddressDetails() {
  return (
    <div className="py-12 text-center">
      <h2 className="text-2xl font-bold mb-4 text-cyan-700">Address Details</h2>
      <div className="text-gray-500">Address details form goes here.</div>
    </div>
  );
}

export default function OfficeTabs() {
  const [activeTab, setActiveTab] = useState("basic");
  const tabs = [
    { key: "basic", label: "Basic Information" },
    { key: "office", label: "Office Details" },
    { key: "address", label: "Address Details" },
  ];

  return (
    <div className="w-full max-w-5xl mx-auto">
      {/* Modern Floating Tab Switcher */}
      <div className="flex justify-center mt-8 mb-12">
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
          {/* Animated Active Indicator */}
          <span
            className="absolute top-1 left-1 h-[calc(100%-0.5rem)] w-[180px] rounded-full bg-white shadow transition-all duration-300"
            style={{
              transform: `translateX(${tabs.findIndex(t => t.key === activeTab) * 182}px)`,
              zIndex: 1,
              opacity: 0,
              pointerEvents: "none"
            }}
            aria-hidden="true"
          />
        </div>
      </div>

      {/* Tab Content */}
      <div>
        {activeTab === "basic" && <BasicInformation />}
        {activeTab === "office" && <OfficeDetails />}
        {activeTab === "address" && <AddressDetails />}
      </div>
    </div>
  );
}
