import React, { useState, useEffect, useCallback } from 'react';
import axios from 'axios';
import { useAuth } from '../contexts/AuthContext';

const CoursesPage = () => {
  const { user } = useAuth();
  const [courses, setCourses] = useState([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState('');
  const [searchTerm, setSearchTerm] = useState('');
  const [filterSemester, setFilterSemester] = useState('');
  const [enrolling, setEnrolling] = useState(null);

  const fetchCourses = useCallback(async () => {
    try {
      setLoading(true);
      const params = new URLSearchParams();
      if (searchTerm) params.append('search', searchTerm);
      if (filterSemester) params.append('semester', filterSemester);

      const response = await axios.get(`/api/courses?${params}`);
      setCourses(response.data.courses);
      setError('');
    } catch (err) {
      setError('Failed to fetch courses');
      console.error('Error fetching courses:', err);
    } finally {
      setLoading(false);
    }
  }, [searchTerm, filterSemester]);

  useEffect(() => {
    fetchCourses();
  }, [fetchCourses]);

  const handleEnroll = async (courseId) => {
    try {
      setEnrolling(courseId);
      await axios.post(`/api/courses/${courseId}/enroll`);
      // Refresh courses to update enrollment status
      await fetchCourses();
    } catch (err) {
      setError(err.response?.data?.message || 'Failed to enroll in course');
    } finally {
      setEnrolling(null);
    }
  };

  const handleDrop = async (courseId) => {
    try {
      setEnrolling(courseId);
      await axios.post(`/api/courses/${courseId}/drop`);
      // Refresh courses to update enrollment status
      await fetchCourses();
    } catch (err) {
      setError(err.response?.data?.message || 'Failed to drop course');
    } finally {
      setEnrolling(null);
    }
  };

  const isEnrolled = (course) => {
    return course.enrolledStudents?.some(enrollment =>
      enrollment.student._id === user?.id && enrollment.status === 'enrolled'
    );
  };

  const canEnroll = (course) => {
    return user?.role === 'student' && course.availableSpots > 0 && !isEnrolled(course);
  };

  const canDrop = (course) => {
    return user?.role === 'student' && isEnrolled(course);
  };

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
      <div className="flex justify-between items-center mb-6">
        <h1 className="text-3xl font-bold text-gray-900">Courses</h1>
        {user?.role === 'professor' && (
          <button className="bg-blue-600 hover:bg-blue-700 text-white px-4 py-2 rounded-lg font-medium">
            Create Course
          </button>
        )}
      </div>

      {/* Filters */}
      <div className="bg-white p-4 rounded-lg shadow-md mb-6">
        <div className="flex flex-wrap gap-4">
          <div className="flex-1 min-w-64">
            <input
              type="text"
              placeholder="Search courses..."
              value={searchTerm}
              onChange={(e) => setSearchTerm(e.target.value)}
              className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-transparent"
            />
          </div>
          <select
            value={filterSemester}
            onChange={(e) => setFilterSemester(e.target.value)}
            className="px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-transparent"
          >
            <option value="">All Semesters</option>
            <option value="Fall">Fall</option>
            <option value="Spring">Spring</option>
            <option value="Summer">Summer</option>
          </select>
        </div>
      </div>

      {error && (
        <div className="bg-red-100 border border-red-400 text-red-700 px-4 py-3 rounded mb-6">
          {error}
        </div>
      )}

      {/* Courses Grid */}
      <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
        {courses.map((course) => (
          <div key={course._id} className="bg-white rounded-lg shadow-md hover:shadow-lg transition-shadow duration-200">
            <div className="p-6">
              <div className="flex justify-between items-start mb-4">
                <div>
                  <h3 className="text-xl font-semibold text-gray-900 mb-1">
                    {course.courseCode}
                  </h3>
                  <p className="text-gray-600 text-sm">
                    {course.name}
                  </p>
                </div>
                <span className={`px-2 py-1 rounded-full text-xs font-medium ${
                  course.availableSpots > 0
                    ? 'bg-green-100 text-green-800'
                    : 'bg-red-100 text-red-800'
                }`}>
                  {course.availableSpots} spots left
                </span>
              </div>

              <div className="space-y-2 mb-4">
                <p className="text-sm text-gray-600">
                  <span className="font-medium">Professor:</span> {course.professor?.firstName} {course.professor?.lastName}
                </p>
                <p className="text-sm text-gray-600">
                  <span className="font-medium">Semester:</span> {course.semester} {course.academicYear}
                </p>
                <p className="text-sm text-gray-600">
                  <span className="font-medium">Credits:</span> {course.credits}
                </p>
                <p className="text-sm text-gray-600">
                  <span className="font-medium">Enrolled:</span> {course.enrolledCount}/{course.maxStudents}
                </p>
              </div>

              {course.description && (
                <p className="text-sm text-gray-700 mb-4 line-clamp-3">
                  {course.description}
                </p>
              )}

              {/* Action Buttons */}
              <div className="flex gap-2">
                {canEnroll(course) && (
                  <button
                    onClick={() => handleEnroll(course._id)}
                    disabled={enrolling === course._id}
                    className="flex-1 bg-green-600 hover:bg-green-700 disabled:bg-green-400 text-white px-4 py-2 rounded-lg font-medium text-sm transition-colors duration-200"
                  >
                    {enrolling === course._id ? 'Enrolling...' : 'Enroll'}
                  </button>
                )}

                {canDrop(course) && (
                  <button
                    onClick={() => handleDrop(course._id)}
                    disabled={enrolling === course._id}
                    className="flex-1 bg-red-600 hover:bg-red-700 disabled:bg-red-400 text-white px-4 py-2 rounded-lg font-medium text-sm transition-colors duration-200"
                  >
                    {enrolling === course._id ? 'Dropping...' : 'Drop'}
                  </button>
                )}

                {isEnrolled(course) && (
                  <span className="flex-1 bg-blue-100 text-blue-800 px-4 py-2 rounded-lg font-medium text-sm text-center">
                    Enrolled
                  </span>
                )}

                <button className="px-3 py-2 border border-gray-300 hover:bg-gray-50 rounded-lg font-medium text-sm transition-colors duration-200">
                  View Details
                </button>
              </div>
            </div>
          </div>
        ))}
      </div>

      {courses.length === 0 && !loading && (
        <div className="text-center py-12">
          <div className="text-gray-400 text-6xl mb-4">📚</div>
          <h3 className="text-xl font-medium text-gray-900 mb-2">No courses found</h3>
          <p className="text-gray-600">
            {searchTerm || filterSemester
              ? 'Try adjusting your search or filters'
              : 'No courses are currently available'
            }
          </p>
        </div>
      )}
    </div>
  );
};

export default CoursesPage;
