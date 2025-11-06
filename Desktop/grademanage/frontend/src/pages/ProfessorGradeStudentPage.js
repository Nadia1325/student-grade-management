import React, { useEffect, useState } from 'react';
import { useParams, useNavigate, useSearchParams } from 'react-router-dom';
import axios from 'axios';
import toast from 'react-hot-toast';

const ProfessorGradeStudentPage = () => {
  const { courseId } = useParams();
  const [searchParams] = useSearchParams();
  const navigate = useNavigate();
  const studentId = searchParams.get('student');

  const [course, setCourse] = useState(null);
  const [student, setStudent] = useState(null);
  const [assignments, setAssignments] = useState([]);
  const [grades, setGrades] = useState([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState('');
  const [submitting, setSubmitting] = useState(false);

  // Form state for new grade
  const [newGrade, setNewGrade] = useState({
    assignmentName: '',
    assignmentType: 'quiz',
    pointsEarned: '',
    totalPoints: '',
    comments: '',
    dueDate: '',
    submittedDate: ''
  });

  useEffect(() => {
    const fetchData = async () => {
      try {
        setLoading(true);
        const [courseRes, studentRes, assignmentsRes, gradesRes] = await Promise.all([
          axios.get(`/api/courses/${courseId}`),
          axios.get(`/api/auth/users/${studentId}`),
          axios.get(`/api/assignments/course/${courseId}`),
          axios.get(`/api/grades/student/${studentId}?courseId=${courseId}`)
        ]);

        setCourse(courseRes.data.course);
        setStudent(studentRes.data.user);
        setAssignments(assignmentsRes.data.assignments || []);
        setGrades(gradesRes.data.grades || []);
        setError('');
      } catch (err) {
        setError('Failed to fetch data');
        console.error('Error fetching data:', err);
      } finally {
        setLoading(false);
      }
    };

    if (courseId && studentId) {
      fetchData();
    }
  }, [courseId, studentId]);

  const handleSubmitGrade = async (e) => {
    e.preventDefault();

    if (!newGrade.assignmentName || !newGrade.pointsEarned || !newGrade.totalPoints) {
      toast.error('Please fill in all required fields');
      return;
    }

    try {
      setSubmitting(true);
      await axios.post('/api/grades', {
        student: studentId,
        course: courseId,
        ...newGrade,
        pointsEarned: parseFloat(newGrade.pointsEarned),
        totalPoints: parseFloat(newGrade.totalPoints),
        dueDate: newGrade.dueDate ? new Date(newGrade.dueDate) : undefined,
        submittedDate: newGrade.submittedDate ? new Date(newGrade.submittedDate) : undefined
      });

      toast.success('Grade posted successfully');
      // Refresh grades
      const gradesRes = await axios.get(`/api/grades/student/${studentId}?courseId=${courseId}`);
      setGrades(gradesRes.data.grades || []);

      // Reset form
      setNewGrade({
        assignmentName: '',
        assignmentType: 'quiz',
        pointsEarned: '',
        totalPoints: '',
        comments: '',
        dueDate: '',
        submittedDate: ''
      });
    } catch (err) {
      toast.error(err.response?.data?.message || 'Failed to post grade');
    } finally {
      setSubmitting(false);
    }
  };

  const handleUpdateGrade = async (gradeId, updates) => {
    try {
      await axios.put(`/api/grades/${gradeId}`, updates);
      toast.success('Grade updated successfully');
      // Refresh grades
      const gradesRes = await axios.get(`/api/grades/student/${studentId}?courseId=${courseId}`);
      setGrades(gradesRes.data.grades || []);
    } catch (err) {
      toast.error('Failed to update grade');
    }
  };

  if (loading) {
    return (
      <div className="p-6">
        <div className="animate-pulse">
          <div className="h-8 bg-gray-300 rounded w-64 mb-6"></div>
          <div className="space-y-4">
            {[...Array(3)].map((_, i) => (
              <div key={i} className="bg-white p-6 rounded-lg shadow-md">
                <div className="h-4 bg-gray-300 rounded w-1/4 mb-2"></div>
                <div className="h-4 bg-gray-300 rounded w-1/2"></div>
              </div>
            ))}
          </div>
        </div>
      </div>
    );
  }

  if (error) {
    return (
      <div className="p-6">
        <div className="bg-red-100 border border-red-400 text-red-700 px-4 py-3 rounded mb-6">
          {error}
        </div>
      </div>
    );
  }

  return (
    <div className="p-6">
      <div className="flex justify-between items-center mb-6">
        <div>
          <h1 className="text-2xl font-bold text-gray-900">
            Grade Student
          </h1>
          <p className="text-gray-600 mt-1">
            {course?.courseCode} - {student?.firstName} {student?.lastName}
          </p>
        </div>
        <button
          onClick={() => navigate(`/professor/courses/${courseId}/students`)}
          className="px-4 py-2 bg-gray-600 text-white rounded hover:bg-gray-700"
        >
          Back to Students
        </button>
      </div>

      <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
        {/* Post New Grade */}
        <div className="bg-white rounded-lg shadow-md p-6">
          <h2 className="text-lg font-semibold mb-4">Post New Grade</h2>
          <form onSubmit={handleSubmitGrade} className="space-y-4">
            <div>
              <label className="block text-sm font-medium text-gray-700 mb-1">
                Assignment Name *
              </label>
              <input
                type="text"
                value={newGrade.assignmentName}
                onChange={(e) => setNewGrade({...newGrade, assignmentName: e.target.value})}
                className="w-full px-3 py-2 border border-gray-300 rounded-md focus:ring-2 focus:ring-blue-500 focus:border-transparent"
                placeholder="e.g., Midterm Exam"
                required
              />
            </div>

            <div className="grid grid-cols-2 gap-4">
              <div>
                <label className="block text-sm font-medium text-gray-700 mb-1">
                  Assignment Type
                </label>
                <select
                  value={newGrade.assignmentType}
                  onChange={(e) => setNewGrade({...newGrade, assignmentType: e.target.value})}
                  className="w-full px-3 py-2 border border-gray-300 rounded-md focus:ring-2 focus:ring-blue-500 focus:border-transparent"
                >
                  <option value="quiz">Quiz</option>
                  <option value="exam">Exam</option>
                  <option value="homework">Homework</option>
                  <option value="project">Project</option>
                  <option value="participation">Participation</option>
                  <option value="final">Final</option>
                  <option value="midterm">Midterm</option>
                </select>
              </div>

              <div>
                <label className="block text-sm font-medium text-gray-700 mb-1">
                  Total Points *
                </label>
                <input
                  type="number"
                  step="0.01"
                  value={newGrade.totalPoints}
                  onChange={(e) => setNewGrade({...newGrade, totalPoints: e.target.value})}
                  className="w-full px-3 py-2 border border-gray-300 rounded-md focus:ring-2 focus:ring-blue-500 focus:border-transparent"
                  placeholder="100"
                  required
                />
              </div>
            </div>

            <div>
              <label className="block text-sm font-medium text-gray-700 mb-1">
                Points Earned *
              </label>
              <input
                type="number"
                step="0.01"
                value={newGrade.pointsEarned}
                onChange={(e) => setNewGrade({...newGrade, pointsEarned: e.target.value})}
                className="w-full px-3 py-2 border border-gray-300 rounded-md focus:ring-2 focus:ring-blue-500 focus:border-transparent"
                placeholder="85"
                required
              />
            </div>

            <div className="grid grid-cols-2 gap-4">
              <div>
                <label className="block text-sm font-medium text-gray-700 mb-1">
                  Due Date
                </label>
                <input
                  type="date"
                  value={newGrade.dueDate}
                  onChange={(e) => setNewGrade({...newGrade, dueDate: e.target.value})}
                  className="w-full px-3 py-2 border border-gray-300 rounded-md focus:ring-2 focus:ring-blue-500 focus:border-transparent"
                />
              </div>

              <div>
                <label className="block text-sm font-medium text-gray-700 mb-1">
                  Submitted Date
                </label>
                <input
                  type="date"
                  value={newGrade.submittedDate}
                  onChange={(e) => setNewGrade({...newGrade, submittedDate: e.target.value})}
                  className="w-full px-3 py-2 border border-gray-300 rounded-md focus:ring-2 focus:ring-blue-500 focus:border-transparent"
                />
              </div>
            </div>

            <div>
              <label className="block text-sm font-medium text-gray-700 mb-1">
                Comments
              </label>
              <textarea
                value={newGrade.comments}
                onChange={(e) => setNewGrade({...newGrade, comments: e.target.value})}
                className="w-full px-3 py-2 border border-gray-300 rounded-md focus:ring-2 focus:ring-blue-500 focus:border-transparent"
                rows="3"
                placeholder="Optional comments..."
              />
            </div>

            <button
              type="submit"
              disabled={submitting}
              className="w-full bg-blue-600 text-white py-2 px-4 rounded-md hover:bg-blue-700 disabled:opacity-50"
            >
              {submitting ? 'Posting Grade...' : 'Post Grade'}
            </button>
          </form>
        </div>

        {/* Existing Grades */}
        <div className="bg-white rounded-lg shadow-md p-6">
          <h2 className="text-lg font-semibold mb-4">Existing Grades</h2>
          {grades.length === 0 ? (
            <p className="text-gray-600">No grades posted yet.</p>
          ) : (
            <div className="space-y-3">
              {grades.map((grade) => (
                <div key={grade._id} className="border rounded-lg p-3">
                  <div className="flex justify-between items-start mb-2">
                    <div>
                      <h4 className="font-medium text-gray-900">{grade.assignmentName}</h4>
                      <p className="text-sm text-gray-600 capitalize">{grade.assignmentType}</p>
                    </div>
                    <span className="text-sm font-medium text-gray-900">
                      {grade.pointsEarned}/{grade.totalPoints} ({grade.percentage}%)
                    </span>
                  </div>
                  <div className="flex justify-between items-center">
                    <span className="text-sm text-gray-600">Grade: {grade.letterGrade}</span>
                    <span className="text-xs text-gray-500">
                      {new Date(grade.gradedDate).toLocaleDateString()}
                    </span>
                  </div>
                  {grade.comments && (
                    <p className="text-sm text-gray-700 mt-2 italic">"{grade.comments}"</p>
                  )}
                </div>
              ))}
            </div>
          )}
        </div>
      </div>
    </div>
  );
};

export default ProfessorGradeStudentPage;
