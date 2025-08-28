import React from "react";

export default function AcademicYearBadge({ year }) {
  return (
    <div className="inline-flex items-center px-4 py-1 rounded-xl bg-blue-50 border border-blue-200 text-blue-700 font-bold text-base shadow-sm mb-4">
      <svg className="w-5 h-5 mr-2 text-blue-400" fill="none" stroke="currentColor" strokeWidth="2" viewBox="0 0 24 24">
        <rect x="3" y="4" width="18" height="18" rx="4" className="fill-current text-blue-100" />
        <path d="M8 2v4M16 2v4" stroke="currentColor" strokeWidth="2" strokeLinecap="round"/>
      </svg>
      {year || <span className="text-gray-400">N/A</span>}
    </div>
  );
}