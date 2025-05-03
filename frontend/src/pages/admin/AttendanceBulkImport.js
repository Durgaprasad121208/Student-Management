// This file has been disabled as bulk import attendance feature is removed.
import React, { useState } from 'react';
import { apiRequest } from '../../api';

export default function AttendanceBulkImport() { return null; }

// const [msg, setMsg] = useState('');
// const [error, setError] = useState('');
// const [loading, setLoading] = useState(false);
// const [pendingCreate, setPendingCreate] = useState(null); // Holds dryRunCreate array
// const [pendingFile, setPendingFile] = useState(null); // Holds the file for re-upload

// const handleImport = async (e, confirmUpdate = false, fileOverride = null) => {
//   const file = fileOverride || e.target?.files?.[0] || pendingFile;
//   if (!file) return;
//   setMsg('');
//   setError('');
//   setLoading(true);
//   const formData = new FormData();
//   formData.append('file', file);
//   if (confirmUpdate) formData.append('confirmUpdate', 'true');
//   try {
//     const res = await fetch(`${window.location.origin.replace(/:[0-9]+$/, ':5000')}/api/import/attendance`, {
//       method: 'POST',
//       headers: { 'Authorization': `Bearer ${localStorage.getItem('token')}` },
//       body: formData
//     });
//     const data = await res.json();
//     // Handle dry run for new records
//     if (!confirmUpdate && data.dryRunCreate && data.dryRunCreate.length > 0) {
//       setPendingCreate(data.dryRunCreate);
//       setPendingFile(file);
//       setLoading(false);
//       return;
//     }
//     if (!data.status || data.status === 'success') {
//       setMsg('Bulk attendance import successful!');
//       setError('');
//       setPendingCreate(null);
//       setPendingFile(null);
//       window.dispatchEvent(new CustomEvent('app-toast', { detail: { message: 'Bulk attendance import successful!', type: 'success' } }));
//       if (onSuccess) onSuccess();
//     } else {
//       setError(data.message || 'Import failed.');
//       window.dispatchEvent(new CustomEvent('app-toast', { detail: { message: data.message || 'Bulk attendance import failed.', type: 'error' } }));
//     }
//   } catch (err) {
//     setError('Bulk import failed. Please check your file and try again.');
//     window.dispatchEvent(new CustomEvent('app-toast', { detail: { message: 'Bulk import failed. Please check your file and try again.', type: 'error' } }));
//   } finally {
//     setLoading(false);
//   }
// };

// const handleProceedCreate = () => {
//   // Proceed with confirmUpdate
//   handleImport({}, true, pendingFile);
// };

// const handleCancelCreate = () => {
//   setPendingCreate(null);
//   setPendingFile(null);
//   setMsg('Bulk import cancelled. No new records were created.');
//   window.dispatchEvent(new CustomEvent('app-toast', { detail: { message: 'Bulk import cancelled. No new records were created.', type: 'info' } }));
// };

// const [showSchema, setShowSchema] = useState(false);

// return (
//   <div className="mb-4">
//     <div className="mb-2">
//       <button
//         type="button"
//         className={`flex items-center w-full px-4 py-2 bg-gradient-to-r from-blue-500 to-cyan-500 text-white font-semibold rounded-t shadow hover:from-blue-600 focus:outline-none transition-all duration-200 ${showSchema ? '' : 'rounded-b'}`}
//         onClick={() => setShowSchema((v) => !v)}
//         aria-expanded={showSchema}
//       >
//         <svg className={`w-5 h-5 mr-2 transform transition-transform duration-200 ${showSchema ? 'rotate-90' : ''}`} fill="none" stroke="currentColor" strokeWidth="2" viewBox="0 0 24 24">
//           <path strokeLinecap="round" strokeLinejoin="round" d="M9 5l7 7-7 7" />
//         </svg>
//         Excel File Format & Example (Click to {showSchema ? 'Hide' : 'Show'})
//       </button>
//       <div
//         className={`overflow-hidden bg-white border border-blue-200 rounded-b shadow transition-all duration-300 ${showSchema ? 'max-h-[600px] opacity-100 py-4 px-4' : 'max-h-0 opacity-0 py-0 px-4'}`}
//         style={{ transitionProperty: 'max-height, opacity, padding' }}
//       >
//         {showSchema && (
//           <>
//             <div className="text-sm text-gray-700 mb-1">Your Excel file must have the following columns (case-insensitive):</div>
//             <table className="border mb-2 w-full text-center">
//               <thead>
//                 <tr className="bg-gray-100">
//                   <th className="border px-2 py-1">Date</th>
//                   <th className="border px-2 py-1">Section</th>
//                   <th className="border px-2 py-1">Year</th>
//                   <th className="border px-2 py-1">Semester</th>
//                   <th className="border px-2 py-1">Subject</th>
//                   <th className="border px-2 py-1">ID Number</th>
//                   <th className="border px-2 py-1">Status</th>
//                 </tr>
//               </thead>
//               <tbody>
//                 <tr>
//                   <td className="border px-2 py-1">2025-05-01</td>
//                   <td className="border px-2 py-1">CSE-01</td>
//                   <td className="border px-2 py-1">E-1</td>
//                   <td className="border px-2 py-1">sem1</td>
//                   <td className="border px-2 py-1">C&LA</td>
//                   <td className="border px-2 py-1">N190001</td>
//                   <td className="border px-2 py-1">Present / Absent</td>
//                 </tr>
//               </tbody>
//             </table>
//             <div className="text-xs text-gray-500 mb-2 text-left">
//               • <b>Date</b>: Format YYYY-MM-DD<br />
//               • <b>Section</b>: e.g. CSE-01<br />
//               • <b>Year</b>: e.g. E-1<br />
//               • <b>Semester</b>: sem1 or sem2<br />
//               • <b>Subject</b>: Must match a subject name<br />
//               • <b>ID Number</b>: Unique student ID<br />
//               • <b>Status</b>: Present or Absent
//             </div>
//           </>
//         )}
//       </div>
//     </div>
//     <label className="font-semibold block mb-1 mt-2">Bulk Import Attendance from Excel:</label>
//     <input type="file" accept=".xlsx,.xls" onChange={handleImport} disabled={loading} />
//     {msg && <div className="mt-2 text-green-600">{msg}</div>}
//     {error && <div className="mt-2 text-red-600">{error}</div>}
//     {/* Modal for pending create records */}
//     {pendingCreate && (
//       <div className="fixed inset-0 z-50 flex items-center justify-center bg-black bg-opacity-30">
//         <div className="bg-white rounded-lg shadow-lg p-6 max-w-lg w-full">
//           <div className="font-bold text-lg mb-2 text-yellow-700">You are about to create new attendance records.</div>
//           <div className="mb-2 text-gray-700 text-sm">
//             The following records do not already exist in the system (no duplicates will be created).<br/>
//             If you wish to proceed, click <b>Proceed</b>. Otherwise, click <b>Cancel</b>.
//           </div>
//           <div className="max-h-40 overflow-y-auto border rounded mb-3 bg-gray-50">
//             <table className="w-full text-xs">
//               <thead>
//                 <tr className="bg-gray-100">
//                   <th className="border px-2 py-1">Row</th>
//                   <th className="border px-2 py-1">ID Number</th>
//                   {pendingCreate[0]?.subject && <th className="border px-2 py-1">Subject</th>}
//                   {pendingCreate[0]?.date && <th className="border px-2 py-1">Date</th>}
//                 </tr>
//               </thead>
//               <tbody>
//                 {pendingCreate.map((rec, i) => (
//                   <tr key={i}>
//                     <td className="border px-2 py-1">{rec.row}</td>
//                     <td className="border px-2 py-1">{rec.idNumber}</td>
//                     {rec.subject && <td className="border px-2 py-1">{rec.subject}</td>}
//                     {rec.date && <td className="border px-2 py-1">{rec.date.slice(0,10)}</td>}
//                   </tr>
//                 ))}
//               </tbody>
//             </table>
//           </div>
//           <div className="flex gap-4 justify-end mt-4">
//             <button className="px-4 py-2 rounded bg-green-600 text-white font-semibold" onClick={handleProceedCreate}>Proceed</button>
//             <button className="px-4 py-2 rounded bg-gray-400 text-white font-semibold" onClick={handleCancelCreate}>Cancel</button>
//           </div>
//         </div>
//       </div>
//     )}
//   </div>
// );
// } 
