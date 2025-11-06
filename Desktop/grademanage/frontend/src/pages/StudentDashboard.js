import React, { useEffect, useState } from 'react';
import { Link } from 'react-router-dom';
import axios from 'axios';

const StudentDashboard = () => {
  const [courses, setCourses] = useState([]);
  const [recentGrades, setRecentGrades] = useState([]);
  const [recentAssignments, setRecentAssignments] = useState([]);
  const [recentCourses, setRecentCourses] = useState([]);

  useEffect(() => {
    const load = async () => {
      try {
        const [c, g, a] = await Promise.all([
          axios.get('/api/courses/my'),
          axios.get('/api/grades'),
          axios.get('/api/assignments/recent')
        ]);
        setCourses(c.data.courses || []);
        setRecentGrades((g.data.grades || []).slice(0, 5));
        setRecentAssignments(a.data.assignments || []);
        setRecentCourses(a.data.courses || []);
      } catch (e) {}
    };
    load();
  }, []);

  return (
    <div className="p-6">
      <h1 className="text-2xl font-bold mb-6">Student Dashboard</h1>
      <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
        <div className="bg-white p-6 rounded-lg shadow-md">
          <h2 className="text-xl font-semibold mb-4">My Courses</h2>
          <p className="text-gray-600">View and manage your enrolled courses</p>
          <div className="mt-4"><Link to="/student/assignments" className="text-blue-600 hover:underline">Go to Assignments →</Link></div>
        </div>
        <div className="bg-white p-6 rounded-lg shadow-md">
          <h2 className="text-xl font-semibold mb-4">Grades</h2>
          <p className="text-gray-600">Check your academic performance</p>
          <div className="mt-4"><Link to="/student/grades" className="text-blue-600 hover:underline">View Grades →</Link></div>
        </div>
        <div className="bg-white p-6 rounded-lg shadow-md">
          <h2 className="text-xl font-semibold mb-4">Profile</h2>
          <p className="text-gray-600">Update your personal information</p>
        </div>
        <div className="bg-white p-6 rounded-lg shadow-md md:col-span-2">
          <h2 className="text-xl font-semibold mb-4">Enrolled Courses</h2>
          {courses.length === 0 ? (
            <div className="text-gray-600">No enrolled courses</div>
          ) : (
            <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
              {courses.map((c)=>(
                <div key={c._id} className="border rounded-md p-3">
                  <div className="font-medium">{c.courseCode} • {c.name}</div>
                  <div className="text-sm text-gray-600">{c.semester} {c.academicYear} • {c.credits} credits</div>
                </div>
              ))}
            </div>
          )}
        </div>
        {/* Recent Assignments */}
        <div className="bg-white p-6 rounded-lg shadow-md md:col-span-2">
          <div className="flex items-center justify-between mb-4">
            <h2 className="text-xl font-semibold">Recent Assignments</h2>
            <Link to="/student/assignments" className="text-blue-600 hover:underline">View all →</Link>
          </div>
          {recentAssignments.length === 0 ? (
            <div className="text-gray-600">No recent assignments</div>
          ) : (
            <div className="space-y-3">
              {recentAssignments.slice(0, 3).map((assignment) => (
                <div key={assignment._id} className="border rounded-lg p-3 hover:bg-gray-50">
                  <div className="flex justify-between items-start">
                    <div>
                      <h4 className="font-medium text-gray-900">{assignment.title}</h4>
                      <p className="text-sm text-gray-600">{assignment.course?.courseCode} • {assignment.course?.name}</p>
                      <p className="text-xs text-gray-500">Due: {new Date(assignment.dueDate).toLocaleDateString()}</p>
                    </div>
                    <span className={`px-2 py-1 rounded-full text-xs font-medium ${
                      new Date(assignment.dueDate) < new Date() ? 'bg-red-100 text-red-800' : 'bg-green-100 text-green-800'
                    }`}>
                      {new Date(assignment.dueDate) < new Date() ? 'Overdue' : 'Active'}
                    </span>
                  </div>
                </div>
              ))}
            </div>
          )}
        </div>

        {/* Recent Course Updates */}
        <div className="bg-white p-6 rounded-lg shadow-md">
          <h2 className="text-xl font-semibold mb-4">Course Updates</h2>
          {recentCourses.length === 0 ? (
            <div className="text-gray-600">No recent updates</div>
          ) : (
            <div className="space-y-3">
              {recentCourses.slice(0, 3).map((course) => (
                <div key={course._id} className="border rounded-lg p-3">
                  <h4 className="font-medium text-gray-900">{course.courseCode}</h4>
                  <p className="text-sm text-gray-600">{course.name}</p>
                  <p className="text-xs text-blue-600">New course available</p>
                </div>
              ))}
            </div>
          )}
        </div>

        <div className="bg-white p-6 rounded-lg shadow-md md:col-span-3">
          <div className="flex items-center justify-between mb-4">
            <h2 className="text-xl font-semibold">Recent Grades</h2>
            <Link to="/student/grades" className="text-blue-600 hover:underline">View all →</Link>
          </div>
          {recentGrades.length === 0 ? (
            <div className="text-gray-600">No grades yet</div>
          ) : (
            <div className="overflow-x-auto">
              <table className="min-w-full divide-y divide-gray-200">
                <thead className="bg-gray-50">
                  <tr>
                    <th className="px-4 py-2 text-left text-xs font-medium text-gray-500 uppercase">Assignment</th>
                    <th className="px-4 py-2 text-left text-xs font-medium text-gray-500 uppercase">Course</th>
                    <th className="px-4 py-2 text-left text-xs font-medium text-gray-500 uppercase">Type</th>
                    <th className="px-4 py-2 text-left text-xs font-medium text-gray-500 uppercase">Score</th>
                    <th className="px-4 py-2 text-left text-xs font-medium text-gray-500 uppercase">Grade</th>
                  </tr>
                </thead>
                <tbody className="bg-white divide-y divide-gray-200">
                  {recentGrades.map((g)=>(
                    <tr key={g._id}>
                      <td className="px-4 py-2 text-sm text-gray-900">{g.assignmentName}</td>
                      <td className="px-4 py-2 text-sm text-gray-700">{g.course?.courseCode}</td>
                      <td className="px-4 py-2 text-sm capitalize">{g.assignmentType}</td>
                      <td className="px-4 py-2 text-sm">{g.pointsEarned}/{g.totalPoints} ({g.percentage}%)</td>
                      <td className="px-4 py-2 text-sm">{g.letterGrade}</td>
                    </tr>
                  ))}
                </tbody>
              </table>
            </div>
          )}
        </div>
      </div>
    </div>
  );
};

export default StudentDashboard;
