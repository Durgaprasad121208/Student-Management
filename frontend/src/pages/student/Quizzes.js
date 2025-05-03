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

  useEffect(() => {
    if (!user || !user._id) return;
    setLoading(true);
    setError('');
    Promise.all([
      apiRequest(`/quiz/available/${user._id}`),
      apiRequest(`/quiz/attempts/${user._id}`)
    ])
      .then(([q, a]) => {
        setQuizzes(Array.isArray(q) ? q : []);
        setAttempts(Array.isArray(a) ? a : []);
      })
      .catch(e => setError(e.message))
      .finally(() => setLoading(false));
  }, [user]);

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

  if (takingQuiz) {
    return (
      <div className="p-8 max-w-3xl mx-auto">
        <h2 className="text-2xl font-bold mb-4">Quiz: {takingQuiz.title}</h2>
        <form onSubmit={handleSubmit} className="space-y-6">
          {takingQuiz.questions.map((q, idx) => (
            <div key={q._id} className="border rounded p-4 mb-2 bg-gray-50">
              <div className="font-semibold mb-2">Q{idx + 1}. {q.text}</div>
              <div className="grid grid-cols-1 md:grid-cols-2 gap-2">
                {q.options.map((opt, oIdx) => (
                  <label key={oIdx} className="flex items-center gap-2">
                    <input type="radio" name={`q_${q._id}`} value={oIdx} checked={answers[q._id] === oIdx} onChange={() => handleAnswer(q._id, oIdx)} required />
                    {opt}
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
      <h3 className="text-lg font-bold mt-6 mb-2">Available Quizzes</h3>
      {quizzes.length > 0 ? (
        <table className="w-full border mt-2 text-sm rounded-xl shadow-lg bg-white overflow-x-auto">
          <thead className="sticky top-0 bg-gray-50 z-10">
            <tr className="bg-gray-100">
              <th className="p-2 text-center">Title</th>
              <th className="p-2 text-center">Subject</th>
              <th className="p-2 text-center">Deadline</th>
              <th className="p-2 text-center">Actions</th>
            </tr>
          </thead>
          <tbody>
            {quizzes.map(qz => (
              <tr key={qz._id} className="border-t hover:bg-blue-50 transition-all">
                <td className="p-2 text-center">{qz.title}</td>
                <td className="p-2 text-center">{qz.subject}</td>
                <td className="p-2 text-center">{qz.deadline ? new Date(qz.deadline).toLocaleString() : '-'}</td>
                <td className="p-2 text-center">
                  <button className="bg-primary text-white px-4 py-1 rounded hover:bg-blue-700" onClick={() => startQuiz(qz)}>
                    Take Quiz
                  </button>
                </td>
              </tr>
            ))}
          </tbody>
        </table>
      ) : (
        !loading && <div className="text-gray-600">No available quizzes.</div>
      )}
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
