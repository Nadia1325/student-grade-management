import React, { useEffect, useState } from 'react';
import axios from 'axios';
import toast from 'react-hot-toast';

const StudentAssignmentsPage = () => {
  const [courses, setCourses] = useState([]);
  const [courseId, setCourseId] = useState('');
  const [assignments, setAssignments] = useState([]);
  const [loading, setLoading] = useState(false);
  const [submitting, setSubmitting] = useState(false);
  const [answersByAssignment, setAnswersByAssignment] = useState({});
  const [filesByAssignment, setFilesByAssignment] = useState({});

  useEffect(() => {
    const load = async () => {
      try {
        const res = await axios.get('/api/courses/my');
        setCourses(res.data.courses || []);
        if (res.data.courses?.[0]?._id) setCourseId(res.data.courses[0]._id);
      } catch (e) {
        toast.error('Failed to load your courses');
      }
    };
    load();
  }, []);

  useEffect(() => {
    const fetchAssignments = async () => {
      if (!courseId) return;
      setLoading(true);
      try {
        const res = await axios.get(`/api/assignments/course/${courseId}`);
        setAssignments(res.data.assignments || []);
      } catch (e) {
        toast.error('Failed to load assignments');
      } finally {
        setLoading(false);
      }
    };
    fetchAssignments();
  }, [courseId]);

  const setAnswer = (assignmentId, qIndex, answerIndex) => {
    setAnswersByAssignment((s) => {
      const prev = s[assignmentId] || [];
      const other = prev.filter((a) => a.q !== qIndex);
      return { ...s, [assignmentId]: [...other, { q: qIndex, answerIndex }] };
    });
  };

  const setFiles = (assignmentId, fileList) => {
    setFilesByAssignment((s) => ({ ...s, [assignmentId]: fileList }));
  };

  const submit = async (assignment) => {
    try {
      setSubmitting(true);
      if (assignment.type === 'mcq') {
        await axios.post('/api/submissions', {
          assignment: assignment._id,
          answers: answersByAssignment[assignment._id] || []
        });
      } else {
        const form = new FormData();
        form.append('assignment', assignment._id);
        const files = filesByAssignment[assignment._id] || [];
        Array.from(files).forEach((f) => form.append('files', f));
        await axios.post('/api/submissions', form, { headers: { 'Content-Type': 'multipart/form-data' } });
      }
      toast.success('Submitted');
    } catch (e) {
      const api = e.response?.data;
      toast.error(api?.message || 'Submit failed');
    } finally {
      setSubmitting(false);
    }
  };

  return (
    <div className="p-6">
      <div className="flex items-center justify-between mb-6">
        <h1 className="text-2xl font-bold">Assignments</h1>
        <select value={courseId} onChange={(e)=>setCourseId(e.target.value)} className="px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-transparent">
          {courses.map((c)=> <option key={c._id} value={c._id}>{c.courseCode} • {c.name}</option>)}
        </select>
      </div>

      <div className="bg-white rounded-lg shadow-md overflow-hidden">
        <div className="px-6 py-4 border-b border-gray-200">
          <h2 className="text-lg font-semibold text-gray-900">{loading ? 'Loading…' : 'Available Assignments'}</h2>
        </div>
        {loading ? (
          <div className="p-6">Loading…</div>
        ) : assignments.length === 0 ? (
          <div className="p-6 text-gray-600">No assignments</div>
        ) : (
          <div className="divide-y divide-gray-200">
            {assignments.map((a) => (
              <div key={a._id} className="p-6">
                <div className="flex items-center justify-between">
                  <div>
                    <h3 className="text-lg font-semibold text-gray-900">{a.title}</h3>
                    <p className="text-sm text-gray-600">Due: {new Date(a.dueDate).toLocaleString()}</p>
                    {a.description && <p className="text-sm text-gray-700 mt-1">{a.description}</p>}
                  </div>
                  <span className="text-xs px-2 py-1 rounded-full bg-gray-100 text-gray-700 uppercase">{a.type}</span>
                </div>

                {a.type === 'mcq' && Array.isArray(a.mcq?.questions) && (
                  <div className="mt-4 space-y-4">
                    {a.mcq.questions.map((q, idx) => (
                      <div key={idx}>
                        <div className="font-medium text-gray-800 mb-2">Q{idx+1}. {q.prompt} {q.points ? `(${q.points} pts)` : ''}</div>
                        <div className="space-y-2">
                          {q.choices.map((choice, cidx) => (
                            <label key={cidx} className="flex items-center gap-2 text-sm text-gray-700">
                              <input type="radio" name={`a-${a._id}-${idx}`} onChange={()=>setAnswer(a._id, idx, cidx)} />
                              <span>{choice}</span>
                            </label>
                          ))}
                        </div>
                      </div>
                    ))}
                  </div>
                )}

                {a.type === 'file' && (
                  <div className="mt-4">
                    <input type="file" multiple onChange={(e)=>setFiles(a._id, e.target.files)} />
                  </div>
                )}

                <div className="mt-4">
                  <button disabled={submitting} onClick={()=>submit(a)} className="px-4 py-2 rounded-md bg-blue-600 text-white hover:bg-blue-700 disabled:opacity-50">{submitting ? 'Submitting…' : 'Submit'}</button>
                </div>
              </div>
            ))}
          </div>
        )}
      </div>
    </div>
  );
};

export default StudentAssignmentsPage;


