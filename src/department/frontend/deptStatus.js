import React, { useEffect, useState } from 'react';
import axios from 'axios';
import { RiCheckboxCircleLine, RiErrorWarningLine } from 'react-icons/ri';

const yearSlots = ['I Year', 'II Year', 'III Year'];
const categories = [
  'General Including EWS',
  'Scheduled Caste (SC)',
  'Scheduled Tribe (ST)',
  'Other Backward Classes (OBC)'
];
const subcategories = [
  'PwBD',
  'Muslim Minority',
  'Other Minority'
];
const genders = ['Male', 'Female', 'Transgender'];

export default function DeptStatus({ userData, onSubmitAll }) {
  const [enrollmentStatus, setEnrollmentStatus] = useState({});
  const [examinationStatus, setExaminationStatus] = useState({});
  const [submitting, setSubmitting] = useState(false);
  const [globalMessage, setGlobalMessage] = useState(null);

  useEffect(() => {
    if (!userData?.dept_id) return;
    fetchEnrollmentStatus();
    fetchExaminationStatus();
    // eslint-disable-next-line
  }, [userData]);

  // Required records per year
  const requiredCombinations = categories.length * subcategories.length * genders.length;

  const fetchEnrollmentStatus = async () => {
    try {
      const res = await axios.get(
        `http://localhost:5000/api/student-enrollment/department/${userData.dept_id}`,
        { headers: { Authorization: `Bearer ${localStorage.getItem('authToken')}` } }
      );
      // Group records by year
      const yearCounts = {};
      (res.data.details || []).forEach(r => {
        yearCounts[r.year] = (yearCounts[r.year] || 0) + 1;
      });
      const status = {};
      yearSlots.forEach(slot => {
        status[slot] = yearCounts[slot] === requiredCombinations;
      });
      setEnrollmentStatus(status);
    } catch {
      setEnrollmentStatus({});
    }
  };

  const fetchExaminationStatus = async () => {
    try {
      const res = await axios.get(
        `http://localhost:5000/api/student-examination/department/${userData.dept_id}`,
        { headers: { Authorization: `Bearer ${localStorage.getItem('authToken')}` } }
      );
      // Group records by year
      const yearCounts = {};
      (res.data.details || []).forEach(r => {
        yearCounts[r.year] = (yearCounts[r.year] || 0) + 1;
      });
      const status = {};
      yearSlots.forEach(slot => {
        status[slot] = yearCounts[slot] === requiredCombinations;
      });
      setExaminationStatus(status);
    } catch {
      setExaminationStatus({});
    }
  };

  const allEnrollmentDone = yearSlots.every(slot => enrollmentStatus[slot]);
  const allExaminationDone = yearSlots.every(slot => examinationStatus[slot]);
  const allDone = allEnrollmentDone && allExaminationDone;

  const handleSubmitAll = async () => {
    setSubmitting(true);
    setGlobalMessage(null);
    try {
      // Send status to admin (implement this endpoint in your backend)
      const res = await axios.post(
        'http://localhost:5000/api/department-status-submit',
        {
          dept_id: userData.dept_id,
          enrollmentStatus,
          examinationStatus,
        },
        { headers: { Authorization: `Bearer ${localStorage.getItem('authToken')}` } }
      );
      if (res.data.success) {
        setGlobalMessage({ type: 'success', text: 'Submitted to admin successfully!' });
        if (onSubmitAll) onSubmitAll();
      } else {
        setGlobalMessage({ type: 'error', text: res.data.message || 'Submission failed' });
      }
    } catch (err) {
      setGlobalMessage({ type: 'error', text: 'Submission failed' });
    } finally {
      setSubmitting(false);
      setTimeout(() => setGlobalMessage(null), 3000);
    }
  };

  return (
    <div className="max-w-2xl mx-auto p-8 bg-white rounded-xl shadow-lg">
      <h2 className="text-2xl font-bold mb-6 text-gray-900">Department Data Entry Status</h2>
      <div className="mb-8">
        <h3 className="text-lg font-semibold text-blue-700 mb-2">Student Enrollment</h3>
        <ul className="space-y-2">
          {yearSlots.map(slot => (
            <li key={slot} className="flex items-center gap-3">
              {enrollmentStatus[slot] ? (
                <RiCheckboxCircleLine className="text-green-600 text-xl" />
              ) : (
                <RiErrorWarningLine className="text-yellow-500 text-xl" />
              )}
              <span className="font-medium">{slot}:</span>
              <span>
                {enrollmentStatus[slot] ? 'Data Finished' : 'Pending'}
              </span>
            </li>
          ))}
        </ul>
      </div>
      <div className="mb-8">
        <h3 className="text-lg font-semibold text-indigo-700 mb-2">Student Examination</h3>
        <ul className="space-y-2">
          {yearSlots.map(slot => (
            <li key={slot} className="flex items-center gap-3">
              {examinationStatus[slot] ? (
                <RiCheckboxCircleLine className="text-green-600 text-xl" />
              ) : (
                <RiErrorWarningLine className="text-yellow-500 text-xl" />
              )}
              <span className="font-medium">{slot}:</span>
              <span>
                {examinationStatus[slot] ? 'Data Finished' : 'Pending'}
              </span>
            </li>
          ))}
        </ul>
      </div>
      <button
        className={`w-full py-3 rounded-xl font-semibold text-white text-lg transition
          ${allDone && !submitting
            ? 'bg-gradient-to-r from-blue-600 to-indigo-600 hover:from-blue-700 hover:to-indigo-700'
            : 'bg-gray-400 cursor-not-allowed'
          }`}
        disabled={!allDone || submitting}
        onClick={handleSubmitAll}
      >
        {submitting ? 'Submitting...' : 'Submit All to Admin'}
      </button>
      {globalMessage && (
        <div className={`mt-4 px-4 py-2 rounded-lg text-white text-center ${
          globalMessage.type === 'success' ? 'bg-green-500' : 'bg-red-500'
        }`}>
          {globalMessage.text}
        </div>
      )}
    </div>
  );
}