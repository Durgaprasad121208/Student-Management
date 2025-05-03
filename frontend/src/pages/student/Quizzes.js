import React, { useEffect, useState } from 'react';
import { apiRequest } from '../../api';
import { useAuth } from '../../context/AuthContext';

export default function Quizzes() {
  const { user } = useAuth();
  const [quizzes, setQuizzes] = useState([]);
  const [attempts, setAttempts] = useState([]);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState('');
  const [takingQuiz, setTakingQuiz] = useState(null); // quiz object
  const [answers, setAnswers] = useState({});
  const [result, setResult] = useState(null);
  const [msg, setMsg] = useState('');

  // Add state for profile info (use semester as in model: '1' or '2')
  const [profile, setProfile] = useState({ section: '', year: '', semester: '' });

  // Filter state for quiz list
  const [filter, setFilter] = useState({ subject: '', search: '' });
  // Timer state
  const [timer, setTimer] = useState(null);
  const [timeLeft, setTimeLeft] = useState(null);

  // --- Add subjects state and fetch subjects for the student's section/year/semester ---
  const [subjects, setSubjects] = useState([]);

  useEffect(() => {
    // Fetch subjects for the student's year/semester (section is not in backend schema)
    if (profile.year && profile.semester) {
      const normSem = s => (s === 'sem1' || s === '1') ? '1' : (s === 'sem2' || s === '2') ? '2' : s;
      apiRequest(`/subject?year=${encodeURIComponent(profile.year)}&semester=${encodeURIComponent(normSem(profile.semester))}`)
        .then(res => setSubjects(Array.isArray(res) ? res : []))
        .catch(() => setSubjects([]));
    }
  }, [profile.year, profile.semester]);

  useEffect(() => {
    if (!user || !user._id) return;
    setLoading(true);
    setError('');
    // Use studentId if present, else fallback to _id
    const studentId = user.studentId || user._id;
    apiRequest(`/quiz/all-with-status/${studentId}`)
      .then(data => {
        console.log('Fetched quizzes:', data);
        setQuizzes(Array.isArray(data) ? data : []);
        setAttempts(Array.isArray(data)
          ? data.filter(q => q.status === 'Attempted' && q.attempt)
          : []);
      })
      .catch(e => setError(e.message))
      .finally(() => setLoading(false));
  }, [user]);

  useEffect(() => {
    apiRequest('/student/my')
      .then(res => {
        // Accept both 'sem1'/'sem2' and '1'/'2'
        let sem = res.semester;
        if (sem === 'sem1' || sem === '1') sem = '1';
        else if (sem === 'sem2' || sem === '2') sem = '2';
        setProfile({
          section: res.section || '',
          year: res.year || '',
          semester: sem || ''
        });
      })
      .catch(() => setProfile({ section: '', year: '', semester: '' }));
  }, []);

  const startQuiz = quiz => {
    setTakingQuiz(quiz);
    setAnswers({});
    setResult(null);
    setMsg('');
  };
  const handleAnswer = (qid, optIdx) => setAnswers(a => ({ ...a, [qid]: optIdx }));
  const handleSubmit = async e => {
    e.preventDefault();
    setMsg('');
    try {
      const res = await apiRequest(`/quiz/${takingQuiz._id}/submit`, {
        method: 'POST',
        body: JSON.stringify({ answers: Object.entries(answers).map(([questionId, selectedOption]) => ({ questionId, selectedOption })) })
      });
      setResult(res);
      setMsg('Quiz submitted!');
      // Optionally, you can refresh data here by triggering useEffect or updating state.
    } catch (err) {
      setMsg('Failed to submit quiz.');
    }
  };

  // --- Remove subject/search filter for initial All Quizzes section ---
  const allQuizzes = quizzes; // Show all quizzes as received from backend

  // --- Keep filteredQuizzes for subject/search filtering if needed elsewhere ---
  const filteredQuizzes = quizzes.filter(qz => {
    let match = true;
    if (filter.subject) match = match && qz.subject === filter.subject;
    if (filter.search) match = match && qz.title.toLowerCase().includes(filter.search.toLowerCase());
    return match;
  });

  // Add timer logic when taking a quiz
  useEffect(() => {
    if (takingQuiz && takingQuiz.duration) {
      setTimeLeft(takingQuiz.duration * 60); // duration in minutes
      setTimer(setInterval(() => {
        setTimeLeft(prev => {
          if (prev <= 1) {
            clearInterval(timer);
            handleSubmit();
            return 0;
          }
          return prev - 1;
        });
      }, 1000));
      return () => clearInterval(timer);
    } else {
      setTimeLeft(null);
      if (timer) clearInterval(timer);
    }
  }, [takingQuiz]);

  // Prevent multiple attempts
  const hasAttempted = quizId => attempts.some(at => at.quizId === quizId);

  // Quiz feedback: show correct/incorrect after submission
  const getFeedback = (qid, idx) => {
    if (!result || !result.answers) return '';
    const answer = result.answers.find(a => a.questionId === qid);
    if (!answer) return '';
    if (answer.selectedOption === idx && answer.isCorrect) return '✔️';
    if (answer.selectedOption === idx && !answer.isCorrect) return '❌';
    if (answer.correctOption === idx) return '✅';
    return '';
  };

  const displaySemester = sem => {
    if (sem === 'sem1' || sem === '1') return 'Semester 1';
    if (sem === 'sem2' || sem === '2') return 'Semester 2';
    return sem;
  };

  if (takingQuiz) {
    return (
      <div className="p-8 max-w-3xl mx-auto">
        <h2 className="text-2xl font-bold mb-4">Quiz: {takingQuiz.title}</h2>
        {takingQuiz.duration && (
          <div className="mb-4 text-lg font-semibold text-red-600">Time Left: {timeLeft !== null ? `${Math.floor(timeLeft/60)}:${(timeLeft%60).toString().padStart(2,'0')}` : '--:--'}</div>
        )}
        <form onSubmit={handleSubmit} className="space-y-6">
          {takingQuiz.questions.map((q, idx) => (
            <div key={q._id} className="border rounded p-4 mb-2 bg-gray-50">
              <div className="font-semibold mb-2">Q{idx + 1}. {q.text}</div>
              <div className="grid grid-cols-1 md:grid-cols-2 gap-2">
                {q.options.map((opt, oIdx) => (
                  <label key={oIdx} className="flex items-center gap-2">
                    <input
                      type="radio"
                      name={`q_${q._id}`}
                      value={oIdx}
                      checked={answers[q._id] === oIdx}
                      onChange={() => handleAnswer(q._id, oIdx)}
                      required
                    />
                    {opt} <span>{getFeedback(q._id, oIdx)}</span>
                  </label>
                ))}
              </div>
            </div>
          ))}
          <button className="bg-primary text-white px-6 py-2 rounded" type="submit">Submit Quiz</button>
          <button type="button" className="ml-4 px-4 py-2 bg-gray-400 text-white rounded" onClick={() => setTakingQuiz(null)}>Cancel</button>
        </form>
        {msg && <div className="mt-4 text-green-600">{msg}</div>}
        {result && (
          <div className="mt-6 p-4 bg-green-100 rounded">
            <div className="font-bold">Your Score: {result.score} / {result.totalMarks}</div>
            <div>Correct: {result.correctCount} | Incorrect: {result.incorrectCount}</div>
          </div>
        )}
      </div>
    );
  }

  return (
    <div className="p-8 max-w-5xl mx-auto">
      <h2 className="text-2xl font-bold mb-4">My Quizzes</h2>
      {loading && <div>Loading...</div>}
      {error && <div className="text-red-600">{error}</div>}
      <div className="flex gap-4 mb-4">
        <input
          type="text"
          className="border rounded p-2 w-48"
          placeholder="Search by title"
          value={filter.search}
          onChange={e => setFilter(f => ({ ...f, search: e.target.value }))}
        />
        <select
          className="border rounded p-2 w-40"
          value={filter.subject}
          onChange={e => setFilter(f => ({ ...f, subject: e.target.value }))}
        >
          <option value="">All Subjects</option>
          {subjects.map(s => (
            <option key={s._id || s.name} value={s.name}>{s.name}</option>
          ))}
        </select>
      </div>
      {/* Show section/year/semester info for clarity */}
      <div className="mb-4 text-gray-500 text-sm">
        Showing quizzes for your section: <b>{profile.section}</b>, year: <b>{profile.year}</b>, semester: <b>{displaySemester(profile.semester)}</b>
      </div>
      <h3 className="text-lg font-bold mt-6 mb-2">All Quizzes</h3>
      <table className="w-full border mt-2 text-sm rounded-xl shadow-lg bg-white overflow-x-auto">
        <thead className="sticky top-0 bg-gray-50 z-10">
          <tr className="bg-gray-100">
            <th className="p-2 text-center">Title</th>
            <th className="p-2 text-center">Subject</th>
            <th className="p-2 text-center">Deadline</th>
            <th className="p-2 text-center">Status</th>
            <th className="p-2 text-center">Actions</th>
          </tr>
        </thead>
        <tbody>
          {allQuizzes.length > 0 ? (
            allQuizzes.map(qz => (
              <tr key={qz._id} className="border-t hover:bg-blue-50 transition-all">
                <td className="p-2 text-center">{qz.title}</td>
                <td className="p-2 text-center">{qz.subject}</td>
                <td className="p-2 text-center">{qz.deadline ? new Date(qz.deadline).toLocaleString() : '-'}</td>
                <td className="p-2 text-center">
                  {qz.status === 'Attempted' && <span className="text-green-700 font-semibold">Attempted</span>}
                  {qz.status === 'Missed' && <span className="text-red-700 font-semibold">Missed</span>}
                  {qz.status === 'Available' && <span className="text-blue-700 font-semibold">Available</span>}
                </td>
                <td className="p-2 text-center">
                  <button
                    className="bg-primary text-white px-4 py-1 rounded hover:bg-blue-700 disabled:bg-gray-400"
                    onClick={() => startQuiz(qz)}
                    disabled={qz.status !== 'Available'}
                    title={qz.status === 'Available' ? 'Take Quiz' : qz.status}
                  >
                    {qz.status === 'Available' ? 'Take Quiz' : 'View'}
                  </button>
                </td>
              </tr>
            ))
          ) : (
            <tr>
              <td colSpan="5" className="p-4 text-center text-gray-600">
                {loading ? 'Loading...' : 'No quizzes found.'}
              </td>
            </tr>
          )}
        </tbody>
      </table>
      <h3 className="text-lg font-bold mt-8 mb-2">My Attempts</h3>
      {attempts.length > 0 ? (
        <table className="w-full border mt-2 text-sm rounded-xl shadow-lg bg-white overflow-x-auto">
          <thead className="sticky top-0 bg-gray-50 z-10">
            <tr className="bg-gray-100">
              <th className="p-2 text-center">Quiz</th>
              <th className="p-2 text-center">Score</th>
              <th className="p-2 text-center">Submitted At</th>
            </tr>
          </thead>
          <tbody>
            {attempts.map(at => (
              <tr key={at._id} className="border-t hover:bg-blue-50 transition-all">
                <td className="p-2 text-center">{at.quizTitle}</td>
                <td className="p-2 text-center">{at.score} / {at.totalMarks}</td>
                <td className="p-2 text-center">{at.submittedAt ? new Date(at.submittedAt).toLocaleString() : '-'}</td>
              </tr>
            ))}
          </tbody>
        </table>
      ) : (
        !loading && <div className="text-gray-600">No quiz attempts found.</div>
      )}
    </div>
  );
}
