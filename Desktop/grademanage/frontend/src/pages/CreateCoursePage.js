import React, { useState } from 'react';
import axios from 'axios';
import toast from 'react-hot-toast';
import { useNavigate } from 'react-router-dom';

const CreateCoursePage = () => {
  const navigate = useNavigate();
  const [loading, setLoading] = useState(false);
  const [form, setForm] = useState({
    courseCode: '',
    name: '',
    description: '',
    semester: 'Fall',
    academicYear: `${new Date().getFullYear()}-${new Date().getFullYear() + 1}`,
    credits: 3,
    maxStudents: 30,
    schedule: { days: [], startTime: '', endTime: '', room: '', building: '' }
  });

  const update = (e) => {
    const { name, value } = e.target;
    setForm((s) => ({ ...s, [name]: value }));
  };

  const submit = async (e) => {
    e.preventDefault();
    setLoading(true);
    try {
      const payload = {
        courseCode: form.courseCode.trim().toUpperCase(),
        name: form.name.trim(),
        description: form.description || undefined,
        semester: form.semester,
        academicYear: form.academicYear,
        credits: Number(form.credits),
        maxStudents: Number(form.maxStudents),
        schedule: {
          days: form.schedule.days,
          startTime: form.schedule.startTime || undefined,
          endTime: form.schedule.endTime || undefined,
          room: form.schedule.room || undefined,
          building: form.schedule.building || undefined
        }
      };
      await axios.post('/api/courses', payload);
      toast.success('Course created');
      navigate('/professor/courses');
    } catch (e) {
      const api = e.response?.data;
      const firstValidation = Array.isArray(api?.errors) && api.errors[0]?.msg;
      toast.error(firstValidation || api?.message || 'Failed to create course');
    } finally {
      setLoading(false);
    }
  };

  const toggleDay = (day) => {
    setForm((s) => {
      const days = new Set(s.schedule.days);
      if (days.has(day)) days.delete(day); else days.add(day);
      return { ...s, schedule: { ...s.schedule, days: Array.from(days) } };
    });
  };

  const dayBtn = (day) => (
    <button
      type="button"
      onClick={() => toggleDay(day)}
      className={`px-3 py-1 rounded-md border ${form.schedule.days.includes(day) ? 'bg-blue-600 text-white border-blue-600' : 'bg-white text-gray-700 border-gray-300 hover:bg-gray-50'}`}
    >{day.slice(0,3)}</button>
  );

  return (
    <div className="p-6">
      <div className="max-w-3xl mx-auto bg-white rounded-lg shadow-md p-6">
        <h1 className="text-2xl font-bold mb-6">Create Course</h1>
        <form onSubmit={submit} className="space-y-5">
          <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
            <div>
              <label className="block text-sm font-medium text-gray-700 mb-1">Course Code</label>
              <input name="courseCode" value={form.courseCode} onChange={update} required className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-transparent" placeholder="e.g., CS101" />
            </div>
            <div>
              <label className="block text-sm font-medium text-gray-700 mb-1">Course Name</label>
              <input name="name" value={form.name} onChange={update} required className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-transparent" placeholder="Intro to CS" />
            </div>
          </div>

          <div>
            <label className="block text-sm font-medium text-gray-700 mb-1">Description</label>
            <textarea name="description" value={form.description} onChange={update} rows={3} className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-transparent" placeholder="Optional" />
          </div>

          <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
            <div>
              <label className="block text-sm font-medium text-gray-700 mb-1">Semester</label>
              <select name="semester" value={form.semester} onChange={update} className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-transparent">
                <option>Fall</option>
                <option>Spring</option>
                <option>Summer</option>
              </select>
            </div>
            <div>
              <label className="block text-sm font-medium text-gray-700 mb-1">Academic Year</label>
              <input name="academicYear" value={form.academicYear} onChange={update} pattern="^\d{4}-\d{4}$" required className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-transparent" />
            </div>
            <div>
              <label className="block text-sm font-medium text-gray-700 mb-1">Credits</label>
              <input name="credits" type="number" min="1" max="6" value={form.credits} onChange={update} required className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-transparent" />
            </div>
          </div>

          <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
            <div>
              <label className="block text-sm font-medium text-gray-700 mb-1">Max Students</label>
              <input name="maxStudents" type="number" min="1" max="200" value={form.maxStudents} onChange={update} className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-transparent" />
            </div>
            <div>
              <label className="block text-sm font-medium text-gray-700 mb-1">Start Time</label>
              <input value={form.schedule.startTime} onChange={(e)=>setForm(s=>({...s, schedule:{...s.schedule, startTime:e.target.value}}))} placeholder="HH:MM" className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-transparent" />
            </div>
            <div>
              <label className="block text-sm font-medium text-gray-700 mb-1">End Time</label>
              <input value={form.schedule.endTime} onChange={(e)=>setForm(s=>({...s, schedule:{...s.schedule, endTime:e.target.value}}))} placeholder="HH:MM" className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-transparent" />
            </div>
          </div>

          <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
            <div>
              <label className="block text-sm font-medium text-gray-700 mb-1">Building</label>
              <input value={form.schedule.building} onChange={(e)=>setForm(s=>({...s, schedule:{...s.schedule, building:e.target.value}}))} className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-transparent" />
            </div>
            <div>
              <label className="block text-sm font-medium text-gray-700 mb-1">Room</label>
              <input value={form.schedule.room} onChange={(e)=>setForm(s=>({...s, schedule:{...s.schedule, room:e.target.value}}))} className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-transparent" />
            </div>
          </div>

          <div className="space-y-2">
            <label className="block text-sm font-medium text-gray-700">Days</label>
            <div className="flex flex-wrap gap-2">
              {['Monday','Tuesday','Wednesday','Thursday','Friday'].map((day) => (
                <React.Fragment key={day}>
                  {dayBtn(day)}
                </React.Fragment>
              ))}
            </div>
          </div>

          <div className="flex justify-end gap-3 pt-2">
            <button type="button" onClick={()=>navigate(-1)} className="px-4 py-2 rounded-lg border border-gray-300 text-gray-700 hover:bg-gray-50">Cancel</button>
            <button type="submit" disabled={loading} className="px-4 py-2 rounded-lg bg-blue-600 text-white hover:bg-blue-700 disabled:opacity-50">{loading ? 'Creating...' : 'Create Course'}</button>
          </div>
        </form>
      </div>
    </div>
  );
};

export default CreateCoursePage;


