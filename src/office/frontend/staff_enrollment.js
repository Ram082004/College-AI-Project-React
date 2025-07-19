import React, { useState } from "react";

const initialRows = [
  {
    sno: 1,
    staff_type: "Non Teaching Staff Excluding Lib. & Phy Education",
    group: "Group B",
    category: "Total",
    sanctioned_strength: 0,
    positions: {
      general: { male: 0, female: 0, transgender: 0 },
      ews: { male: 0, female: 0, transgender: 0 },
      sc: { male: 0, female: 0, transgender: 0 },
      st: { male: 0, female: 0, transgender: 0 },
      obc: { male: 0, female: 0, transgender: 0 },
      total: { male: 0, female: 0, transgender: 0 },
    },
  },
  // Add more rows as needed
];

function StaffEnrollment() {
  const [rows, setRows] = useState(initialRows);
  const [editMode, setEditMode] = useState(false);

  const handleInputChange = (rowIdx, category, gender, value) => {
    const updatedRows = [...rows];
    updatedRows[rowIdx].positions[category][gender] = Number(value);
    setRows(updatedRows);
  };

  const handleSanctionedChange = (rowIdx, value) => {
    const updatedRows = [...rows];
    updatedRows[rowIdx].sanctioned_strength = Number(value);
    setRows(updatedRows);
  };

  const handleSave = () => {
    // TODO: Save logic (API call)
    setEditMode(false);
    alert("Staff enrollment data saved!");
  };

  return (
    <div className="max-w-6xl mx-auto bg-white rounded-2xl shadow p-8">
      <div className="flex justify-between items-center mb-8">
        <h2 className="text-2xl font-bold text-cyan-700">Staff Enrollment</h2>
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
      <form
        onSubmit={e => {
          e.preventDefault();
          handleSave();
        }}
      >
        <div className="overflow-x-auto">
          <table className="min-w-full border text-center">
            <thead>
              <tr>
                <th rowSpan={2}>SNO</th>
                <th rowSpan={2}>Staff Type</th>
                <th rowSpan={2}>Group</th>
                <th rowSpan={2}>Sanctioned Strength</th>
                <th rowSpan={2}>Category</th>
                <th colSpan={18}>Number of Position</th>
              </tr>
              <tr>
                {["General", "EWS", "SC", "ST", "OBC", "TOTAL"].map(cat =>
                  ["Male", "Female", "Trans Gender"].map(gender => (
                    <th key={cat + gender}>{cat} <br /> {gender}</th>
                  ))
                )}
              </tr>
            </thead>
            <tbody>
              {rows.map((row, idx) => (
                <tr key={idx}>
                  <td>{row.sno}</td>
                  <td>{row.staff_type}</td>
                  <td>{row.group}</td>
                  <td>
                    <input
                      type="number"
                      value={row.sanctioned_strength}
                      onChange={e => handleSanctionedChange(idx, e.target.value)}
                      readOnly={!editMode}
                      className="w-16 border rounded px-1"
                    />
                  </td>
                  <td>{row.category}</td>
                  {["general", "ews", "sc", "st", "obc", "total"].map(cat =>
                    ["male", "female", "transgender"].map(gender => (
                      <td key={cat + gender}>
                        <input
                          type="number"
                          value={row.positions[cat][gender]}
                          onChange={e =>
                            handleInputChange(idx, cat, gender, e.target.value)
                          }
                          readOnly={!editMode}
                          className="w-12 border rounded px-1"
                          min={0}
                        />
                      </td>
                    ))
                  )}
                </tr>
              ))}
            </tbody>
          </table>
        </div>
        {editMode && (
          <div className="flex gap-4 justify-end mt-10">
            <button
              type="submit"
              className="dashboard-button-primary text-lg px-8 py-3 rounded-xl shadow"
            >
              Save
            </button>
          </div>
        )}
      </form>
    </div>
  );
}

export default StaffEnrollment;