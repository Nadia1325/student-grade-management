import React, { useEffect, useState } from 'react';
import axios from 'axios';
import toast from 'react-hot-toast';

const emptyMcq = () => ({ prompt: '', choices: ['', '', '', ''], correctIndex: 0, points: 1 });

const ProfessorAssignmentsPage = () => {
  const [courses, setCourses] = useState([]);
  const [courseId, setCourseId] = useState('');
  const [assignments, setAssignments] = useState([]);
  const [loading, setLoading] = useState(false);
  const [creating, setCreating] = useState(false);
  const [form, setForm] = useState({ title: '', description: '', type: 'mcq', dueDate: '', totalPoints: 100, mcq: { questions: [emptyMcq()] } });

  useEffect(() => {
    const load = async () => {
      try {
        const res = await axios.get('/api/courses/my');
        const profCourses = (res.data.courses || []);
        setCourses(profCourses);
        if (profCourses[0]?._id) setCourseId(profCourses[0]._id);
      } catch (e) {
        toast.error('Failed to load your courses');
      }
    };
    load();
  }, []);

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

  useEffect(() => { fetchAssignments(); }, [courseId]);

  const create = async (e) => {
    e.preventDefault();
    if (!courseId) return;
    setCreating(true);
    try {
      const payload = {
        course: courseId,
        title: form.title.trim(),
        description: form.description || undefined,
        type: form.type,
        dueDate: form.dueDate,
        totalPoints: Number(form.totalPoints) || undefined,
        mcq: form.type === 'mcq' ? { questions: form.mcq.questions } : undefined
      };
      await axios.post('/api/assignments', payload);
      toast.success('Assignment created');
      setForm({ title: '', description: '', type: form.type, dueDate: '', totalPoints: 100, mcq: { questions: [emptyMcq()] } });
      fetchAssignments();
    } catch (e) {
      const api = e.response?.data;
      const firstValidation = Array.isArray(api?.errors) && api.errors[0]?.msg;
      toast.error(firstValidation || api?.message || 'Create failed');
    } finally {
      setCreating(false);
    }
  };

  const updateQuestion = (idx, change) => {
    setForm((s) => {
      const next = s.mcq.questions.slice();
      next[idx] = { ...next[idx], ...change };
      return { ...s, mcq: { ...s.mcq, questions: next } };
    });
  };

  const updateChoice = (qIdx, cIdx, value) => {
    setForm((s) => {
      const next = s.mcq.questions.slice();
      const ch = next[qIdx].choices.slice();
      ch[cIdx] = value;
      next[qIdx] = { ...next[qIdx], choices: ch };
      return { ...s, mcq: { ...s.mcq, questions: next } };
    });
  };

  const addQuestion = () => setForm((s)=>({ ...s, mcq: { ...s.mcq, questions: [...s.mcq.questions, emptyMcq()] } }));
  const removeQuestion = (idx) => setForm((s)=>({ ...s, mcq: { ...s.mcq, questions: s.mcq.questions.filter((_,i)=>i!==idx) } }));

  return (
    <div className="p-6">
      <div className="flex items-center justify-between mb-6">
        <h1 className="text-2xl font-bold">Assignments</h1>
        <select value={courseId} onChange={(e)=>setCourseId(e.target.value)} className="px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-transparent">
          {courses.map((c)=> <option key={c._id} value={c._id}>{c.courseCode} • {c.name}</option>)}
        </select>
      </div>

      <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
        <div className="bg-white rounded-lg shadow-md p-6">
          <h2 className="text-lg font-semibold text-gray-900 mb-4">Create Assignment</h2>
          <form onSubmit={create} className="space-y-4">
            <div>
              <label className="block text-sm font-medium text-gray-700 mb-1">Title</label>
              <input value={form.title} onChange={(e)=>setForm(s=>({...s, title:e.target.value}))} required className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-transparent" />
            </div>
            <div>
              <label className="block text-sm font-medium text-gray-700 mb-1">Description</label>
              <textarea value={form.description} onChange={(e)=>setForm(s=>({...s, description:e.target.value}))} rows={3} className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-transparent" />
            </div>
            <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
              <div>
                <label className="block text-sm font-medium text-gray-700 mb-1">Type</label>
                <select value={form.type} onChange={(e)=>setForm(s=>({...s, type:e.target.value}))} className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-transparent">
                  <option value="mcq">MCQ</option>
                  <option value="file">File Upload</option>
                </select>
              </div>
              <div>
                <label className="block text-sm font-medium text-gray-700 mb-1">Due Date</label>
                <input type="datetime-local" value={form.dueDate} onChange={(e)=>setForm(s=>({...s, dueDate:e.target.value}))} required className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-transparent" />
              </div>
              <div>
                <label className="block text-sm font-medium text-gray-700 mb-1">Total Points</label>
                <input type="number" min="0" value={form.totalPoints} onChange={(e)=>setForm(s=>({...s, totalPoints:e.target.value}))} className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-transparent" />
              </div>
            </div>

            {form.type === 'mcq' && (
              <div className="space-y-4">
                {form.mcq.questions.map((q, idx) => (
                  <div key={idx} className="border p-3 rounded-md">
                    <div className="flex items-center justify-between mb-2">
                      <div className="font-medium">Question {idx+1}</div>
                      <button type="button" onClick={()=>removeQuestion(idx)} className="text-sm text-red-600 hover:underline">Remove</button>
                    </div>
                    <input placeholder="Prompt" value={q.prompt} onChange={(e)=>updateQuestion(idx,{prompt:e.target.value})} className="w-full mb-2 px-3 py-2 border border-gray-300 rounded-md" />
                    <div className="grid grid-cols-1 md:grid-cols-2 gap-2">
                      {q.choices.map((c, cidx) => (
                        <input key={cidx} placeholder={`Choice ${cidx+1}`} value={c} onChange={(e)=>updateChoice(idx, cidx, e.target.value)} className="px-3 py-2 border border-gray-300 rounded-md" />
                      ))}
                    </div>
                    <div className="flex items-center gap-3 mt-2">
                      <label className="text-sm">Correct</label>
                      <select value={q.correctIndex} onChange={(e)=>updateQuestion(idx,{correctIndex: Number(e.target.value)})} className="px-2 py-1 border border-gray-300 rounded-md">
                        {[0,1,2,3].map(i=> <option key={i} value={i}>{i+1}</option>)}
                      </select>
                      <label className="text-sm">Points</label>
                      <input type="number" min="0" value={q.points} onChange={(e)=>updateQuestion(idx,{points:Number(e.target.value)})} className="w-24 px-2 py-1 border border-gray-300 rounded-md" />
                    </div>
                  </div>
                ))}
                <button type="button" onClick={addQuestion} className="px-3 py-1 rounded-md border border-gray-300 hover:bg-gray-50">Add Question</button>
              </div>
            )}

            <div className="flex justify-end">
              <button type="submit" disabled={creating} className="px-4 py-2 rounded-md bg-blue-600 text-white hover:bg-blue-700 disabled:opacity-50">{creating ? 'Creating…' : 'Create'}</button>
            </div>
          </form>
        </div>

        <div className="bg-white rounded-lg shadow-md p-6">
          <h2 className="text-lg font-semibold text-gray-900 mb-4">Assignments in Course</h2>
          {loading ? (
            <div>Loading…</div>
          ) : assignments.length === 0 ? (
            <div className="text-gray-600">No assignments</div>
          ) : (
            <div className="space-y-4">
              {assignments.map((a) => (
                <div key={a._id} className="border rounded-md p-3">
                  <div className="flex items-center justify-between">
                    <div>
                      <div className="font-medium">{a.title}</div>
                      <div className="text-sm text-gray-600">Due: {new Date(a.dueDate).toLocaleString()} • Type: {a.type}</div>
                    </div>
                  </div>
                  {a.description && <div className="text-sm text-gray-700 mt-2">{a.description}</div>}
                </div>
              ))}
            </div>
          )}
        </div>
      </div>
    </div>
  );
};

export default ProfessorAssignmentsPage;


