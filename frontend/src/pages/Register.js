import React, { useState } from 'react';
import { apiRequest } from '../api';

export default function Register() {
  const [name, setName] = useState('');
  const [email, setEmail] = useState('');
  const [password, setPassword] = useState('');
  const [section, setSection] = useState('');
  const [year, setYear] = useState('');
  const [rollNo, setRollNo] = useState('');
  const [idNumber, setIdNumber] = useState('');
  const [phone, setPhone] = useState('');
  const [showPassword, setShowPassword] = useState(false);
  const [errors, setErrors] = useState({});

  const validate = () => {
    const errs = {};
    if (!name) errs.name = 'Name is required';
    if (!email) errs.email = 'Email is required';
    else if (!/^[^@\s]+@[^@\s]+\.[^@\s]+$/.test(email)) errs.email = 'Invalid email';
    if (!password) errs.password = 'Password is required';
    else if (password.length < 6) errs.password = 'Password must be at least 6 characters';
    if (!section) errs.section = 'Section is required';
    if (!year) errs.year = 'Year is required';
    if (!rollNo) errs.rollNo = 'Roll No is required';
    if (!idNumber) errs.idNumber = 'ID Number is required';
    if (!phone) errs.phone = 'Phone is required';
    setErrors(errs);
    return Object.keys(errs).length === 0;
  };

  const handleSubmit = async (e) => {
    e.preventDefault();
    if (validate()) {
      try {
        await apiRequest('/auth/register', {
          method: 'POST',
          body: JSON.stringify({ name, email, password, role: "student", section, year, rollNo, idNumber, phone })
        });
        window.dispatchEvent(new CustomEvent('app-toast', { detail: { message: 'Registration successful! Please login.', type: 'success' } }));
        window.location.href = '/login';
      } catch (err) {
        // Error toast is already shown by apiRequest
      }
    }
  };

  return (
    <div className="flex flex-col items-center justify-center min-h-screen">
      <h2 className="text-3xl font-bold mb-6">Register</h2>
      <form className="bg-white p-8 rounded shadow-md w-full max-w-sm" onSubmit={handleSubmit} noValidate>
        <div className="mb-4">
          <input
            className={`block w-full p-2 border rounded ${errors.name ? 'border-red-500' : ''}`}
            type="text"
            placeholder="Name"
            value={name}
            onChange={e => setName(e.target.value)}
            autoComplete="name"
          />
          {errors.name && (
  <div className="flex items-center gap-2 bg-red-50 border border-red-400 text-red-700 px-3 py-1 rounded mt-1 animate-fade-in">
    <svg className="w-4 h-4 text-red-500" fill="none" stroke="currentColor" strokeWidth="2" viewBox="0 0 24 24"><path strokeLinecap="round" strokeLinejoin="round" d="M12 9v2m0 4h.01M21 12c0 4.97-4.03 9-9 9s-9-4.03-9-9 4.03-9 9-9 9 4.03 9 9z" /></svg>
    <span className="text-xs font-medium">{errors.name}</span>
  </div>
)}
        </div>
        <div className="mb-4">
          <input
            className={`block w-full p-2 border rounded ${errors.email ? 'border-red-500' : ''}`}
            type="email"
            placeholder="Email"
            value={email}
            onChange={e => setEmail(e.target.value)}
            autoComplete="username"
          />
          {errors.email && (
  <div className="flex items-center gap-2 bg-red-50 border border-red-400 text-red-700 px-3 py-1 rounded mt-1 animate-fade-in">
    <svg className="w-4 h-4 text-red-500" fill="none" stroke="currentColor" strokeWidth="2" viewBox="0 0 24 24"><path strokeLinecap="round" strokeLinejoin="round" d="M12 9v2m0 4h.01M21 12c0 4.97-4.03 9-9 9s-9-4.03-9-9 4.03-9 9-9 9 4.03 9 9z" /></svg>
    <span className="text-xs font-medium">{errors.email}</span>
  </div>
)}
        </div>
        <div className="mb-4 relative">
          <input
            className={`block w-full p-2 border rounded pr-10 ${errors.password ? 'border-red-500' : ''}`}
            type={showPassword ? 'text' : 'password'}
            placeholder="Password"
            value={password}
            onChange={e => setPassword(e.target.value)}
            autoComplete="new-password"
          />
          <button
            type="button"
            tabIndex={-1}
            className="absolute right-2 top-2 text-gray-500 hover:text-gray-800 focus:outline-none"
            onClick={() => setShowPassword(v => !v)}
            aria-label={showPassword ? 'Hide password' : 'Show password'}
          >
            {showPassword ? (
              <svg xmlns="http://www.w3.org/2000/svg" className="h-5 w-5" fill="none" viewBox="0 0 24 24" stroke="currentColor"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M13.875 18.825A10.05 10.05 0 0112 19c-5 0-9.27-3.11-10.5-7.5a10.05 10.05 0 012.6-4.368m1.38-1.38A9.953 9.953 0 0112 5c5 0 9.27 3.11 10.5 7.5-.489 1.74-1.438 3.312-2.6 4.368M15 12a3 3 0 11-6 0 3 3 0 016 0z" /></svg>
            ) : (
              <svg xmlns="http://www.w3.org/2000/svg" className="h-5 w-5" fill="none" viewBox="0 0 24 24" stroke="currentColor"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M15 12a3 3 0 11-6 0 3 3 0 016 0zm7.5 0C21.27 7.61 17 4.5 12 4.5c-1.22 0-2.4.17-3.5.5m-6 7c1.23 4.39 5.5 7.5 10.5 7.5 1.22 0 2.4-.17 3.5-.5" /></svg>
            )}
          </button>
          {errors.password && (
  <div className="flex items-center gap-2 bg-red-50 border border-red-400 text-red-700 px-3 py-1 rounded mt-1 animate-fade-in">
    <svg className="w-4 h-4 text-red-500" fill="none" stroke="currentColor" strokeWidth="2" viewBox="0 0 24 24"><path strokeLinecap="round" strokeLinejoin="round" d="M12 9v2m0 4h.01M21 12c0 4.97-4.03 9-9 9s-9-4.03-9-9 4.03-9 9-9 9 4.03 9 9z" /></svg>
    <span className="text-xs font-medium">{errors.password}</span>
  </div>
)}
        </div>
        <div className="mb-4">
          <select
            className={`block w-full p-2 border rounded ${errors.section ? 'border-red-500' : ''}`}
            value={section}
            onChange={e => setSection(e.target.value)}
          >
            <option value="">Select Section</option>
            <option value="CSE-01">CSE-01</option>
            <option value="CSE-02">CSE-02</option>
            <option value="CSE-03">CSE-03</option>
            <option value="CSE-04">CSE-04</option>
            <option value="CSE-05">CSE-05</option>
            <option value="CSE-06">CSE-06</option>
          </select>
          {errors.section && (
            <div className="flex items-center gap-2 bg-red-50 border border-red-400 text-red-700 px-3 py-1 rounded mt-1 animate-fade-in">
              <svg className="w-4 h-4 text-red-500" fill="none" stroke="currentColor" strokeWidth="2" viewBox="0 0 24 24"><path strokeLinecap="round" strokeLinejoin="round" d="M12 9v2m0 4h.01M21 12c0 4.97-4.03 9-9 9s-9-4.03-9-9 4.03-9 9-9 9 4.03 9 9z" /></svg>
              <span className="text-xs font-medium">{errors.section}</span>
            </div>
          )}
        </div>
        <div className="mb-4">
          <select
            className={`block w-full p-2 border rounded ${errors.year ? 'border-red-500' : ''}`}
            value={year}
            onChange={e => setYear(e.target.value)}
          >
            <option value="">Select Year</option>
            <option value="E-1">E-1</option>
            <option value="E-2">E-2</option>
            <option value="E-3">E-3</option>
            <option value="E-4">E-4</option>
          </select>
          {errors.year && (
            <div className="flex items-center gap-2 bg-red-50 border border-red-400 text-red-700 px-3 py-1 rounded mt-1 animate-fade-in">
              <svg className="w-4 h-4 text-red-500" fill="none" stroke="currentColor" strokeWidth="2" viewBox="0 0 24 24"><path strokeLinecap="round" strokeLinejoin="round" d="M12 9v2m0 4h.01M21 12c0 4.97-4.03 9-9 9s-9-4.03-9-9 4.03-9 9-9 9 4.03 9 9z" /></svg>
              <span className="text-xs font-medium">{errors.year}</span>
            </div>
          )}
        </div>
        <div className="mb-4">
          <input
            className={`block w-full p-2 border rounded ${errors.rollNo ? 'border-red-500' : ''}`}
            type="text"
            placeholder="Roll Number"
            value={rollNo}
            onChange={e => setRollNo(e.target.value)}
          />
          {errors.rollNo && (
            <div className="flex items-center gap-2 bg-red-50 border border-red-400 text-red-700 px-3 py-1 rounded mt-1 animate-fade-in">
              <svg className="w-4 h-4 text-red-500" fill="none" stroke="currentColor" strokeWidth="2" viewBox="0 0 24 24"><path strokeLinecap="round" strokeLinejoin="round" d="M12 9v2m0 4h.01M21 12c0 4.97-4.03 9-9 9s-9-4.03-9-9 4.03-9 9-9 9 4.03 9 9z" /></svg>
              <span className="text-xs font-medium">{errors.rollNo}</span>
            </div>
          )}
        </div>
        <div className="mb-4">
          <input
            className={`block w-full p-2 border rounded ${errors.idNumber ? 'border-red-500' : ''}`}
            type="text"
            placeholder="ID Number"
            value={idNumber}
            onChange={e => setIdNumber(e.target.value)}
          />
          {errors.idNumber && (
            <div className="flex items-center gap-2 bg-red-50 border border-red-400 text-red-700 px-3 py-1 rounded mt-1 animate-fade-in">
              <svg className="w-4 h-4 text-red-500" fill="none" stroke="currentColor" strokeWidth="2" viewBox="0 0 24 24"><path strokeLinecap="round" strokeLinejoin="round" d="M12 9v2m0 4h.01M21 12c0 4.97-4.03 9-9 9s-9-4.03-9-9 4.03-9 9-9 9 4.03 9 9z" /></svg>
              <span className="text-xs font-medium">{errors.idNumber}</span>
            </div>
          )}
        </div>
        <div className="mb-4">
          <input
            className={`block w-full p-2 border rounded ${errors.phone ? 'border-red-500' : ''}`}
            type="text"
            placeholder="Phone"
            value={phone}
            onChange={e => setPhone(e.target.value)}
          />
          {errors.phone && (
            <div className="flex items-center gap-2 bg-red-50 border border-red-400 text-red-700 px-3 py-1 rounded mt-1 animate-fade-in">
              <svg className="w-4 h-4 text-red-500" fill="none" stroke="currentColor" strokeWidth="2" viewBox="0 0 24 24"><path strokeLinecap="round" strokeLinejoin="round" d="M12 9v2m0 4h.01M21 12c0 4.97-4.03 9-9 9s-9-4.03-9-9 4.03-9 9-9 9 4.03 9 9z" /></svg>
              <span className="text-xs font-medium">{errors.phone}</span>
            </div>
          )}
        </div>
        <button className="w-full bg-accent text-white py-2 rounded hover:bg-primary-dark transition">Register</button>
      </form>
    </div>
  );
}
