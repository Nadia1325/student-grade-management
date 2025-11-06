import React, { useEffect, useState } from 'react';
import { Link } from 'react-router-dom';
import axios from 'axios';
import { useAuth } from '../contexts/AuthContext';

const ProfessorDashboard = () => {
  const { user } = useAuth();
  const [courses, setCourses] = useState([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState('');

  useEffect(() => {
    const fetchCourses = async () => {
      try {
        const response = await axios.get('/api/courses/my');
        setCourses(response.data.courses || []);
        setError('');
      } catch (err) {
        setError('Failed to fetch courses');
        console.error('Error fetching courses:', err);
      } finally {
        setLoading(false);
      }
    };
    fetchCourses();
  }, []);

  if (loading) {
    return (
      <div className="p-6">
        <div className="animate-pulse">
          <div className="h-8 bg-gray-300 rounded w-48 mb-6"></div>
          <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
            {[...Array(6)].map((_, i) => (
              <div key={i} className="bg-white p-6 rounded-lg shadow-md">
                <div className="h-4 bg-gray-300 rounded w-3/4 mb-2"></div>
                <div className="h-4 bg-gray-300 rounded w-1/2 mb-4"></div>
                <div className="h-3 bg-gray-300 rounded w-full mb-2"></div>
                <div className="h-3 bg-gray-300 rounded w-2/3"></div>
              </div>
            ))}
          </div>
        </div>
      </div>
    );
  }

  return (
    <div className="p-6">
      <h1 className="text-2xl font-bold mb-6">Professor Dashboard</h1>

      {error && (
        <div className="bg-red-100 border border-red-400 text-red-700 px-4 py-3 rounded mb-6">
          {error}
        </div>
      )}

      <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6 mb-8">
        <div className="bg-white p-6 rounded-lg shadow-md">
          <h2 className="text-xl font-semibold mb-4">My Courses</h2>
          <p className="text-gray-600">Manage courses you teach</p>
          <div className="mt-4">
            <Link to="/professor/courses/new" className="inline-block px-4 py-2 rounded-md bg-blue-600 text-white hover:bg-blue-700">Create Course</Link>
          </div>
        </div>
        <div className="bg-white p-6 rounded-lg shadow-md">
          <h2 className="text-xl font-semibold mb-4">Student Grades</h2>
          <p className="text-gray-600">View and update student grades</p>
          <div className="mt-4">
            <Link to="/professor/grades/new" className="inline-block px-4 py-2 rounded-md bg-blue-600 text-white hover:bg-blue-700">Create Grade</Link>
          </div>
        </div>
        <div className="bg-white p-6 rounded-lg shadow-md">
          <h2 className="text-xl font-semibold mb-4">Assignments</h2>
          <p className="text-gray-600">Create and manage assignments</p>
          <div className="mt-4">
            <Link to="/professor/assignments" className="inline-block px-4 py-2 rounded-md bg-blue-600 text-white hover:bg-blue-700">Manage Assignments</Link>
          </div>
        </div>
        <div className="bg-white p-6 rounded-lg shadow-md">
          <h2 className="text-xl font-semibold mb-4">Regrade Requests</h2>
          <p className="text-gray-600 mb-4">Review and respond to appeals</p>
          <Link to="/professor/regrades" className="inline-block px-4 py-2 rounded-md bg-blue-600 text-white hover:bg-blue-700">Open</Link>
        </div>
        <div className="bg-white p-6 rounded-lg shadow-md">
          <h2 className="text-xl font-semibold mb-4">Profile</h2>
          <p className="text-gray-600">Update your profile information</p>
        </div>
      </div>

      {/* Teaching Courses Overview */}
      <div className="bg-white rounded-lg shadow-md p-6">
        <h2 className="text-xl font-semibold mb-4">My Teaching Courses</h2>
        {courses.length === 0 ? (
          <div className="text-center py-8">
            <div className="text-gray-400 text-4xl mb-4">📚</div>
            <h3 className="text-lg font-medium text-gray-900 mb-2">No courses yet</h3>
            <p className="text-gray-600 mb-4">Start by creating your first course</p>
            <Link to="/professor/courses/new" className="inline-block px-4 py-2 rounded-md bg-blue-600 text-white hover:bg-blue-700">
              Create Course
            </Link>
          </div>
        ) : (
          <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
            {courses.map((course) => (
              <div key={course._id} className="border rounded-lg p-4 hover:shadow-md transition-shadow">
                <div className="flex justify-between items-start mb-3">
                  <div>
                    <h3 className="font-semibold text-lg text-gray-900">{course.courseCode}</h3>
                    <p className="text-gray-600 text-sm">{course.name}</p>
                  </div>
                  <span className={`px-2 py-1 rounded-full text-xs font-medium ${
                    course.isPublished ? 'bg-green-100 text-green-800' : 'bg-yellow-100 text-yellow-800'
                  }`}>
                    {course.isPublished ? 'Published' : 'Draft'}
                  </span>
                </div>

                <div className="space-y-2 mb-4">
                  <p className="text-sm text-gray-600">
                    <span className="font-medium">Semester:</span> {course.semester} {course.academicYear}
                  </p>
                  <p className="text-sm text-gray-600">
                    <span className="font-medium">Enrolled:</span> {course.enrolledCount}/{course.maxStudents}
                  </p>
                  <p className="text-sm text-gray-600">
                    <span className="font-medium">Credits:</span> {course.credits}
                  </p>
                </div>

                <div className="flex gap-2">
                  <Link
                    to={`/professor/courses/${course._id}/students`}
                    className="flex-1 text-center px-3 py-2 bg-blue-600 text-white text-sm rounded hover:bg-blue-700 transition-colors"
                  >
                    View Students ({course.enrolledCount})
                  </Link>
                  <Link
                    to={`/professor/courses/${course._id}/grades`}
                    className="flex-1 text-center px-3 py-2 bg-green-600 text-white text-sm rounded hover:bg-green-700 transition-colors"
                  >
                    Manage Grades
                  </Link>
                </div>
              </div>
            ))}
          </div>
        )}
      </div>
    </div>
  );
};

export default ProfessorDashboard;
