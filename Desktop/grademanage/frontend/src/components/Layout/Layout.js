import React from 'react';
import { Link, useNavigate } from 'react-router-dom';
import { useAuth } from '../../contexts/AuthContext';

const Layout = ({ children }) => {
  const { user, logout } = useAuth();
  const navigate = useNavigate();

  const handleLogout = () => {
    logout();
    navigate('/');
  };

  return (
    <div className="min-h-screen bg-gray-50">
      <nav className="bg-white shadow-sm border-b">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
          <div className="flex justify-between h-16">
            <div className="flex items-center">
              <Link to={`/${user?.role}/dashboard`} className="text-xl font-bold text-gray-900">
                Grade Management
              </Link>
            </div>
            <div className="flex items-center space-x-4">
              <span className="text-gray-700">
                Welcome, {user?.firstName} {user?.lastName}
              </span>
              <button
                onClick={handleLogout}
                className="bg-red-600 hover:bg-red-700 text-white px-4 py-2 rounded-md text-sm font-medium"
              >
                Logout
              </button>
            </div>
          </div>
        </div>
      </nav>

      <div className="flex">
        <aside className="w-64 bg-white shadow-sm min-h-screen">
          <nav className="mt-8">
            <div className="px-4 space-y-2">
              <Link
                to={`/${user?.role}/dashboard`}
                className="block px-4 py-2 text-gray-700 hover:bg-gray-100 rounded-md"
              >
                Dashboard
              </Link>
              <Link
                to={`/${user?.role}/courses`}
                className="block px-4 py-2 text-gray-700 hover:bg-gray-100 rounded-md"
              >
                Courses
              </Link>
              <Link
                to={`/${user?.role}/grades`}
                className="block px-4 py-2 text-gray-700 hover:bg-gray-100 rounded-md"
              >
                Grades
              </Link>
              <Link
                to={`/${user?.role}/profile`}
                className="block px-4 py-2 text-gray-700 hover:bg-gray-100 rounded-md"
              >
                Profile
              </Link>
            </div>
          </nav>
        </aside>

        <main className="flex-1 p-8">
          {children}
        </main>
      </div>
    </div>
  );
};

export default Layout;
