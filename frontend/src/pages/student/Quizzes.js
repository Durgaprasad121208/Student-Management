import React, { useEffect, useState } from 'react';
import { apiRequest } from '../../api';

export default function Quizzes() {
  const [quizzes, setQuizzes] = useState([]);
  const [attempts, setAttempts] = useState([]);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState('');
  const [takingQuiz, setTakingQuiz] = useState(null); // quiz object
  const [answers, setAnswers] = useState({});
  const [result, setResult] = useState(null);
  const [msg, setMsg] = useState('');

  useEffect(() => {
    setLoading(true);
    setError('');
    Promise.all([
      apiRequest('/quiz/available'),
      apiRequest('/quiz/attempts')
    ])
      .then(([q, a]) => {
        setQuizzes(q);
        setAttempts(a);
      })
      .catch(e => setError(e.message))
      .finally(() => setLoading(false));
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
        <table className="w-full border mt-2">
          <thead>
            <tr className="bg-gray-100">
              <th className="p-2">Title</th>
              <th className="p-2">Subject</th>
              <th className="p-2">Deadline</th>
              <th className="p-2">Actions</th>
            </tr>
          </thead>
          <tbody>
            {quizzes.map(qz => (
              <tr key={qz._id} className="border-t">
                <td className="p-2">{qz.title}</td>
                <td className="p-2">{qz.subject}</td>
                <td className="p-2">{qz.deadline ? new Date(qz.deadline).toLocaleDateString() : ''}</td>
                <td className="p-2">
                  <button className="text-blue-600" onClick={() => startQuiz(qz)}>Take Quiz</button>
                </td>
              </tr>
            ))}
          </tbody>
        </table>
      ) : (
        !loading && <div>No available quizzes.</div>
      )}
      <h3 className="text-lg font-bold mt-8 mb-2">Past Attempts</h3>
      {attempts.length > 0 ? (
        <table className="w-full border mt-2">
          <thead>
            <tr className="bg-gray-100">
              <th className="p-2">Quiz</th>
              <th className="p-2">Score</th>
              <th className="p-2">Attempted At</th>
            </tr>
          </thead>
          <tbody>
            {attempts.map(at => (
              <tr key={at._id} className="border-t">
                <td className="p-2">{at.quiz?.title}</td>
                <td className="p-2">{at.score} / {at.totalMarks}</td>
                <td className="p-2">{at.attemptedAt ? new Date(at.attemptedAt).toLocaleString() : ''}</td>
              </tr>
            ))}
          </tbody>
        </table>
      ) : (
        !loading && <div>No attempts found.</div>
      )}
    </div>
  );
}
