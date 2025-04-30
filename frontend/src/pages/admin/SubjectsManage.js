import React, { useEffect, useState } from 'react';
import { apiRequest } from '../../api';

const yearOptions = ['E-1', 'E-2', 'E-3', 'E-4'];
const semOptions = ['1', '2'];


export default function SubjectsManage() {
  const [subjects, setSubjects] = useState([]);
  const [form, setForm] = useState({ name: '', code: '', year: '', semester: '' });
  const [editing, setEditing] = useState(null);
  const [error, setError] = useState('');
  const [loading, setLoading] = useState(true);

  const fetchSubjects = () => {
    setLoading(true);
    apiRequest('/subject')
      .then(setSubjects)
      .catch(e => setError(e.message))
      .finally(() => setLoading(false));
  };

  useEffect(() => { fetchSubjects(); }, []);

  const handleChange = e => setForm(f => ({ ...f, [e.target.name]: e.target.value }));

  const handleSubmit = async e => {
    e.preventDefault();
    try {
      if (editing) {
        await apiRequest(`/subject/${editing}`, {
          method: 'PUT',
          body: JSON.stringify(form)
        });
      } else {
        await apiRequest('/subject', {
          method: 'POST',
          body: JSON.stringify(form)
        });
      }
      setForm({ name: '', code: '', year: '', semester: '', section: '' });
      setEditing(null);
      fetchSubjects();
    } catch (err) { setError(err.message); }
  };

  const handleEdit = s => {
    setEditing(s._id);
    setForm({
      name: s.name || '',
      code: s.code || '',
      year: s.year || '',
      semester: s.semester || ''
    });
  };

  const handleDelete = async id => {
    if (!window.confirm('Delete this subject?')) return;
    try {
      await apiRequest(`/subject/${id}`, { method: 'DELETE' });
      fetchSubjects();
    } catch (err) { setError(err.message); }
  };

  return (
    <div className="p-8 max-w-3xl mx-auto">
      <h2 className="text-2xl font-bold mb-4">Manage Subjects</h2>
      <form className="mb-6 flex flex-wrap gap-4" onSubmit={handleSubmit}>
        <input name="name" value={form.name} onChange={handleChange} placeholder="Subject Name" className="p-2 border rounded" required />
        <input name="code" value={form.code} onChange={handleChange} placeholder="Subject Code" className="p-2 border rounded" required />
        <select name="year" value={form.year} onChange={handleChange} className="p-2 border rounded" required>
          <option value="">Year</option>
          {yearOptions.map(opt => <option key={opt} value={opt}>{opt}</option>)}
        </select>
        <select name="semester" value={form.semester} onChange={handleChange} className="p-2 border rounded" required>
          <option value="">Sem</option>
          {semOptions.map(opt => <option key={opt} value={opt}>{opt}</option>)}
        </select>
        
        <button className="bg-primary text-white px-4 py-2 rounded" type="submit">{editing ? 'Update' : 'Add'} Subject</button>
        {editing && <button type="button" className="ml-2 px-4 py-2 bg-gray-400 text-white rounded" onClick={() => { setEditing(null); setForm({ name: '', code: '', year: '', semester: '' }); }}>Cancel</button>}
      </form>
      {loading && <div>Loading...</div>}
      {error && <div className="text-red-600">{error}</div>}
      <table className="w-full border mt-4">
        <thead>
          <tr className="bg-gray-100">
            <th className="p-2">Name</th>
            <th className="p-2">Code</th>
            <th className="p-2">Year</th>
            <th className="p-2">Sem</th>
            
            <th className="p-2 text-center">Actions</th>
          </tr>
        </thead>
        <tbody>
          {subjects.map(s => (
            <tr key={s._id} className="border-t">
              <td className="p-2">{s.name}</td>
              <td className="p-2">{s.code}</td>
              <td className="p-2">{s.year}</td>
              <td className="p-2">{s.semester}</td>
              
              <td className="p-2 text-center">
                <button title="Edit" className="text-blue-600 hover:text-blue-800 mx-1 text-lg align-middle" onClick={() => handleEdit(s)}>
                  ✏️
                </button>
                <button title="Delete" className="text-red-600 hover:text-red-800 mx-1 text-lg align-middle" onClick={() => handleDelete(s._id)}>
                  🗑️
                </button>
              </td>
            </tr>
          ))}
        </tbody>
      </table>
    </div>
  );
}
