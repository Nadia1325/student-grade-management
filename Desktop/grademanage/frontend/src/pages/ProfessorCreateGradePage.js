import React, { useEffect, useState } from 'react';
import axios from 'axios';
import toast from 'react-hot-toast';

const TYPES = ['quiz','exam','homework','project','participation','final','midterm'];

const ProfessorCreateGradePage = () => {
  const [courses, setCourses] = useState([]);
  const [courseId, setCourseId] = useState('');
  const [students, setStudents] = useState([]);
  const [form, setForm] = useState({ student: '', assignmentName: '', assignmentType: 'quiz', pointsEarned: '', totalPoints: '' , comments: ''});
  const [loading, setLoading] = useState(false);

  useEffect(() => {
    const load = async () => {
      try {
        const res = await axios.get('/api/courses/my');
        const profCourses = res.data.courses || [];
        setCourses(profCourses);
        if (profCourses[0]?._id) setCourseId(profCourses[0]._id);
      } catch (e) {
        toast.error('Failed to load courses');
      }
    };
    load();
  }, []);

  useEffect(() => {
    const loadStudents = async () => {
      if (!courseId) return;
      try {
        const res = await axios.get(`/api/courses/${courseId}`);
        const list = (res.data.course?.enrolledStudents || []).filter(e=>e.status==='enrolled').map(e=>e.student);
        setStudents(list);
        if (list[0]?._id) setForm(s=>({ ...s, student: list[0]._id }));
      } catch (e) {
        setStudents([]);
      }
    };
    loadStudents();
  }, [courseId]);

  const submit = async (e) => {
    e.preventDefault();
    if (!courseId || !form.student) { toast.error('Select course and student'); return; }
    setLoading(true);
    try {
      const payload = {
        student: form.student,
        course: courseId,
        assignmentName: form.assignmentName.trim(),
        assignmentType: form.assignmentType,
        pointsEarned: Number(form.pointsEarned),
        totalPoints: Number(form.totalPoints),
        comments: form.comments || undefined
      };
      await axios.post('/api/grades', payload);
      toast.success('Grade recorded');
      setForm({ student: form.student, assignmentName: '', assignmentType: form.assignmentType, pointsEarned: '', totalPoints: '', comments: '' });
    } catch (e) {
      const api = e.response?.data;
      const firstValidation = Array.isArray(api?.errors) && api.errors[0]?.msg;
      toast.error(firstValidation || api?.message || 'Failed to create grade');
    } finally {
      setLoading(false);
    }
  };

  return (
    <div className="p-6">
      <div className="max-w-3xl mx-auto bg-white rounded-lg shadow-md p-6">
        <h1 className="text-2xl font-bold mb-6">Create Grade</h1>
        <form onSubmit={submit} className="space-y-4">
          <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
            <div>
              <label className="block text-sm font-medium text-gray-700 mb-1">Course</label>
              <select value={courseId} onChange={(e)=>setCourseId(e.target.value)} className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-transparent">
                {courses.map((c)=> <option key={c._id} value={c._id}>{c.courseCode} • {c.name}</option>)}
              </select>
            </div>
            <div>
              <label className="block text-sm font-medium text-gray-700 mb-1">Student</label>
              <select value={form.student} onChange={(e)=>setForm(s=>({...s, student:e.target.value}))} className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-transparent">
                {students.map((s)=> <option key={s._id} value={s._id}>{s.firstName} {s.lastName} ({s.studentId})</option>)}
              </select>
            </div>
          </div>

          <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
            <div>
              <label className="block text-sm font-medium text-gray-700 mb-1">Assignment Name</label>
              <input value={form.assignmentName} onChange={(e)=>setForm(s=>({...s, assignmentName:e.target.value}))} required className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-transparent" />
            </div>
            <div>
              <label className="block text-sm font-medium text-gray-700 mb-1">Type</label>
              <select value={form.assignmentType} onChange={(e)=>setForm(s=>({...s, assignmentType:e.target.value}))} className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-transparent">
                {TYPES.map(t=> <option key={t} value={t}>{t.charAt(0).toUpperCase()+t.slice(1)}</option>)}
              </select>
            </div>
          </div>

          <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
            <div>
              <label className="block text-sm font-medium text-gray-700 mb-1">Points Earned</label>
              <input type="number" min="0" value={form.pointsEarned} onChange={(e)=>setForm(s=>({...s, pointsEarned:e.target.value}))} required className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-transparent" />
            </div>
            <div>
              <label className="block text-sm font-medium text-gray-700 mb-1">Total Points</label>
              <input type="number" min="1" value={form.totalPoints} onChange={(e)=>setForm(s=>({...s, totalPoints:e.target.value}))} required className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-transparent" />
            </div>
            <div>
              <label className="block text-sm font-medium text-gray-700 mb-1">Comments</label>
              <input value={form.comments} onChange={(e)=>setForm(s=>({...s, comments:e.target.value}))} className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-transparent" />
            </div>
          </div>

          <div className="flex justify-end">
            <button type="submit" disabled={loading} className="px-4 py-2 rounded-md bg-blue-600 text-white hover:bg-blue-700 disabled:opacity-50">{loading ? 'Saving…' : 'Save Grade'}</button>
          </div>
        </form>
      </div>
    </div>
  );
};

export default ProfessorCreateGradePage;


