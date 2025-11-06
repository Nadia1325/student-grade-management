import React, { useState, useEffect, useCallback } from 'react';
import axios from 'axios';
import toast from 'react-hot-toast';
import { useAuth } from '../contexts/AuthContext';

const GradesPage = () => {
  const { user } = useAuth();
  const [grades, setGrades] = useState([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState('');
  const [stats, setStats] = useState({});
  const [filterCourse, setFilterCourse] = useState('');
  const [filterAssignmentType, setFilterAssignmentType] = useState('');
  const [appealOpen, setAppealOpen] = useState(false);
  const [appealReason, setAppealReason] = useState('');
  const [appealGradeId, setAppealGradeId] = useState(null);

  const fetchGrades = useCallback(async () => {
    try {
      setLoading(true);
      const params = new URLSearchParams();
      if (filterCourse) params.append('courseId', filterCourse);
      if (filterAssignmentType) params.append('assignmentType', filterAssignmentType);

      const response = await axios.get(`/api/grades?${params}`);
      setGrades(response.data.grades);
      setStats(response.data.stats);
      setError('');
    } catch (err) {
      setError('Failed to fetch grades');
      console.error('Error fetching grades:', err);
    } finally {
      setLoading(false);
    }
  }, [filterCourse, filterAssignmentType]);

  useEffect(() => {
    fetchGrades();
  }, [fetchGrades]);

  const getGradeColor = (letterGrade) => {
    switch (letterGrade) {
      case 'A+':
      case 'A':
      case 'A-':
        return 'text-green-600 bg-green-100';
      case 'B+':
      case 'B':
      case 'B-':
        return 'text-blue-600 bg-blue-100';
      case 'C+':
      case 'C':
      case 'C-':
        return 'text-yellow-600 bg-yellow-100';
      case 'D+':
      case 'D':
      case 'D-':
        return 'text-orange-600 bg-orange-100';
      case 'F':
        return 'text-red-600 bg-red-100';
      default:
        return 'text-gray-600 bg-gray-100';
    }
  };

  const formatDate = (dateString) => {
    return new Date(dateString).toLocaleDateString('en-US', {
      year: 'numeric',
      month: 'short',
      day: 'numeric'
    });
  };

  if (loading) {
    return (
      <div className="p-6">
        <div className="animate-pulse">
          <div className="h-8 bg-gray-300 rounded w-48 mb-6"></div>
          <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6 mb-6">
            {[...Array(3)].map((_, i) => (
              <div key={i} className="bg-white p-6 rounded-lg shadow-md">
                <div className="h-4 bg-gray-300 rounded w-1/2 mb-2"></div>
                <div className="h-3 bg-gray-300 rounded w-3/4"></div>
              </div>
            ))}
          </div>
          <div className="bg-white p-6 rounded-lg shadow-md">
            <div className="h-4 bg-gray-300 rounded w-32 mb-4"></div>
            <div className="space-y-3">
              {[...Array(5)].map((_, i) => (
                <div key={i} className="h-4 bg-gray-300 rounded"></div>
              ))}
            </div>
          </div>
        </div>
      </div>
    );
  }

  return (
    <div className="p-6">
      <div className="flex justify-between items-center mb-6">
        <h1 className="text-3xl font-bold text-gray-900">Grades</h1>
        {user?.role === 'professor' && (
          <button className="bg-blue-600 hover:bg-blue-700 text-white px-4 py-2 rounded-lg font-medium">
            Add Grade
          </button>
        )}
      </div>

      {/* Stats Cards */}
      <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-6 mb-6">
        <div className="bg-white p-6 rounded-lg shadow-md">
          <div className="flex items-center">
            <div className="p-2 bg-blue-100 rounded-lg">
              <span className="text-2xl">📊</span>
            </div>
            <div className="ml-4">
              <p className="text-sm font-medium text-gray-600">Total Grades</p>
              <p className="text-2xl font-bold text-gray-900">{stats.totalGrades || 0}</p>
            </div>
          </div>
        </div>

        <div className="bg-white p-6 rounded-lg shadow-md">
          <div className="flex items-center">
            <div className="p-2 bg-green-100 rounded-lg">
              <span className="text-2xl">📈</span>
            </div>
            <div className="ml-4">
              <p className="text-sm font-medium text-gray-600">Average Grade</p>
              <p className="text-2xl font-bold text-gray-900">{stats.averageGrade ? `${stats.averageGrade}%` : 'N/A'}</p>
            </div>
          </div>
        </div>

        <div className="bg-white p-6 rounded-lg shadow-md">
          <div className="flex items-center">
            <div className="p-2 bg-purple-100 rounded-lg">
              <span className="text-2xl">🎯</span>
            </div>
            <div className="ml-4">
              <p className="text-sm font-medium text-gray-600">Highest Grade</p>
              <p className="text-2xl font-bold text-gray-900">{stats.highestGrade ? `${stats.highestGrade}%` : 'N/A'}</p>
            </div>
          </div>
        </div>

        <div className="bg-white p-6 rounded-lg shadow-md">
          <div className="flex items-center">
            <div className="p-2 bg-red-100 rounded-lg">
              <span className="text-2xl">📉</span>
            </div>
            <div className="ml-4">
              <p className="text-sm font-medium text-gray-600">Lowest Grade</p>
              <p className="text-2xl font-bold text-gray-900">{stats.lowestGrade ? `${stats.lowestGrade}%` : 'N/A'}</p>
            </div>
          </div>
        </div>
      </div>

      {/* Filters */}
      <div className="bg-white p-4 rounded-lg shadow-md mb-6">
        <div className="flex flex-wrap gap-4">
          <div className="flex-1 min-w-64">
            <input
              type="text"
              placeholder="Filter by course..."
              value={filterCourse}
              onChange={(e) => setFilterCourse(e.target.value)}
              className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-transparent"
            />
          </div>
          <select
            value={filterAssignmentType}
            onChange={(e) => setFilterAssignmentType(e.target.value)}
            className="px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-transparent"
          >
            <option value="">All Assignment Types</option>
            <option value="quiz">Quiz</option>
            <option value="exam">Exam</option>
            <option value="homework">Homework</option>
            <option value="project">Project</option>
            <option value="participation">Participation</option>
            <option value="final">Final</option>
            <option value="midterm">Midterm</option>
          </select>
        </div>
      </div>

      {error && (
        <div className="bg-red-100 border border-red-400 text-red-700 px-4 py-3 rounded mb-6">
          {error}
        </div>
      )}

      {/* Grades Table */}
      <div className="bg-white rounded-lg shadow-md overflow-hidden">
        <div className="px-6 py-4 border-b border-gray-200">
          <h2 className="text-lg font-semibold text-gray-900">Grade Details</h2>
        </div>

        {grades.length === 0 ? (
          <div className="p-6 text-center">
            <div className="text-gray-400 text-6xl mb-4">📝</div>
            <h3 className="text-xl font-medium text-gray-900 mb-2">No grades found</h3>
            <p className="text-gray-600">
              {filterCourse || filterAssignmentType
                ? 'Try adjusting your filters to see more grades'
                : 'No grades are available at this time'
              }
            </p>
          </div>
        ) : (
          <div className="overflow-x-auto">
            <table className="min-w-full divide-y divide-gray-200">
              <thead className="bg-gray-50">
                <tr>
                  <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                    Assignment
                  </th>
                  <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                    Course
                  </th>
                  <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                    Type
                  </th>
                  <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                    Score
                  </th>
                  <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                    Grade
                  </th>
                  <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                    Date
                  </th>
                  {user?.role === 'professor' && (
                    <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                      Student
                    </th>
                  )}
                  {user?.role === 'student' && (
                    <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                      Actions
                    </th>
                  )}
                </tr>
              </thead>
              <tbody className="bg-white divide-y divide-gray-200">
                {grades.map((grade) => (
                  <tr key={grade._id} className="hover:bg-gray-50">
                    <td className="px-6 py-4 whitespace-nowrap">
                      <div className="text-sm font-medium text-gray-900">
                        {grade.assignmentName}
                      </div>
                      {grade.comments && (
                        <div className="text-sm text-gray-500 truncate max-w-xs">
                          {grade.comments}
                        </div>
                      )}
                    </td>
                    <td className="px-6 py-4 whitespace-nowrap">
                      <div className="text-sm text-gray-900">
                        {grade.course?.courseCode}
                      </div>
                      <div className="text-sm text-gray-500">
                        {grade.course?.name}
                      </div>
                    </td>
                    <td className="px-6 py-4 whitespace-nowrap">
                      <span className="inline-flex px-2 py-1 text-xs font-semibold rounded-full bg-gray-100 text-gray-800 capitalize">
                        {grade.assignmentType}
                      </span>
                    </td>
                    <td className="px-6 py-4 whitespace-nowrap text-sm text-gray-900">
                      {grade.pointsEarned}/{grade.totalPoints} ({grade.percentage}%)
                    </td>
                    <td className="px-6 py-4 whitespace-nowrap">
                      <span className={`inline-flex px-2 py-1 text-xs font-semibold rounded-full capitalize ${getGradeColor(grade.letterGrade)}`}>
                        {grade.letterGrade}
                      </span>
                    </td>
                    <td className="px-6 py-4 whitespace-nowrap text-sm text-gray-500">
                      {formatDate(grade.gradedDate)}
                    </td>
                    {user?.role === 'professor' && (
                      <td className="px-6 py-4 whitespace-nowrap">
                        <div className="text-sm text-gray-900">
                          {grade.student?.firstName} {grade.student?.lastName}
                        </div>
                        <div className="text-sm text-gray-500">
                          {grade.student?.studentId}
                        </div>
                      </td>
                    )}
                    {user?.role === 'student' && (
                      <td className="px-6 py-4 whitespace-nowrap">
                        <button
                          onClick={() => {
                            setAppealGradeId(grade._id);
                            setAppealReason('');
                            setAppealOpen(true);
                          }}
                          className="text-sm px-3 py-1 rounded-md bg-blue-600 text-white hover:bg-blue-700"
                        >
                          Appeal
                        </button>
                      </td>
                    )}
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        )}
      </div>

      {/* Appeal Modal */}
      {appealOpen && (
        <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/40 p-4">
          <div className="bg-white w-full max-w-lg rounded-lg shadow-xl">
            <div className="px-6 py-4 border-b border-gray-200 flex items-center justify-between">
              <h3 className="text-lg font-semibold text-gray-900">Submit Regrade Request</h3>
              <button onClick={() => setAppealOpen(false)} className="text-gray-500 hover:text-gray-700">✕</button>
            </div>
            <div className="p-6 space-y-4">
              <div>
                <label className="block text-sm font-medium text-gray-700 mb-1">Reason</label>
                <textarea
                  rows={5}
                  value={appealReason}
                  onChange={(e) => setAppealReason(e.target.value)}
                  className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-transparent"
                  placeholder="Explain why you believe this grade should be reconsidered..."
                />
              </div>
            </div>
            <div className="px-6 py-4 border-t border-gray-200 flex justify-end gap-3">
              <button onClick={() => setAppealOpen(false)} className="px-4 py-2 rounded-lg border border-gray-300 text-gray-700 hover:bg-gray-50">Cancel</button>
              <button
                onClick={async () => {
                  if (!appealReason || appealReason.trim().length < 5) {
                    toast.error('Please provide a clear reason (min 5 characters).');
                    return;
                  }
                  try {
                    await axios.post('/api/regrades', { gradeId: appealGradeId, reason: appealReason });
                    toast.success('Regrade request submitted');
                    setAppealOpen(false);
                  } catch (e) {
                    toast.error(e.response?.data?.message || 'Failed to submit regrade request');
                  }
                }}
                className="px-4 py-2 rounded-lg bg-blue-600 text-white hover:bg-blue-700"
              >
                Submit
              </button>
            </div>
          </div>
        </div>
      )}
    </div>
  );
};

export default GradesPage;
