import React from 'react';
import { BrowserRouter as Router, Routes, Route, Navigate } from 'react-router-dom';
import { QueryClient, QueryClientProvider } from 'react-query';
import { Toaster } from 'react-hot-toast';
import { AuthProvider, useAuth } from './contexts/AuthContext';

// Pages
import HomePage from './pages/HomePage';
import LoginPage from './pages/LoginPage';
import RegisterPage from './pages/RegisterPage';
import ForgotPasswordPage from './pages/ForgotPasswordPage';
import ResetPasswordPage from './pages/ResetPasswordPage';
import StudentDashboard from './pages/StudentDashboard';
import ProfessorDashboard from './pages/ProfessorDashboard';
import ProfessorCourseStudentsPage from './pages/ProfessorCourseStudentsPage';
import ProfessorGradeStudentPage from './pages/ProfessorGradeStudentPage';
import CoursesPage from './pages/CoursesPage';
import GradesPage from './pages/GradesPage';
import ProfilePage from './pages/ProfilePage';
import RegradeRequestsPage from './pages/RegradeRequestsPage';
import CreateCoursePage from './pages/CreateCoursePage';
import StudentAssignmentsPage from './pages/StudentAssignmentsPage';
import ProfessorAssignmentsPage from './pages/ProfessorAssignmentsPage';
import ProfessorCreateGradePage from './pages/ProfessorCreateGradePage';

// Components
import Layout from './components/Layout/Layout';
import LoadingSpinner from './components/Common/LoadingSpinner';
import ProtectedRoute from './components/Auth/ProtectedRoute';

// Styles
import './index.css';

// Create a client for React Query
const queryClient = new QueryClient({
  defaultOptions: {
    queries: {
      refetchOnWindowFocus: false,
      retry: 1,
      staleTime: 5 * 60 * 1000, // 5 minutes
    },
  },
});

// App component with routing
function App() {
  return (
    <QueryClientProvider client={queryClient}>
      <AuthProvider>
        <Router future={{ v7_startTransition: true, v7_relativeSplatPath: true }}>
          <div className="App min-h-screen bg-gray-50">
            <Toaster
              position="top-right"
              toastOptions={{
                duration: 4000,
                style: {
                  background: '#363636',
                  color: '#fff',
                },
                success: {
                  duration: 3000,
                  theme: {
                    primary: 'green',
                    secondary: 'black',
                  },
                },
              }}
            />
            
            <Routes>
              {/* Public Routes */}
              <Route path="/" element={<HomePage />} />
              <Route path="/login" element={<LoginPage />} />
              <Route path="/register" element={<RegisterPage />} />
              <Route path="/forgot-password" element={<ForgotPasswordPage />} />
              <Route path="/reset-password" element={<ResetPasswordPage />} />

              {/* Protected Routes */}
              <Route path="/dashboard" element={
                <ProtectedRoute>
                  <DashboardRedirect />
                </ProtectedRoute>
              } />
              
              <Route path="/student/*" element={
                <ProtectedRoute requiredRole="student">
                  <Layout>
                    <Routes>
                      <Route path="dashboard" element={<StudentDashboard />} />
                      <Route path="courses" element={<CoursesPage />} />
                      <Route path="assignments" element={<StudentAssignmentsPage />} />
                      <Route path="grades" element={<GradesPage />} />
                      <Route path="regrades" element={<RegradeRequestsPage />} />
                      <Route path="profile" element={<ProfilePage />} />
                      <Route path="*" element={<Navigate to="/student/dashboard" />} />
                    </Routes>
                  </Layout>
                </ProtectedRoute>
              } />

              <Route path="/professor/*" element={
                <ProtectedRoute requiredRole="professor">
                  <Layout>
                    <Routes>
                      <Route path="dashboard" element={<ProfessorDashboard />} />
                      <Route path="courses" element={<CoursesPage />} />
                      <Route path="courses/new" element={<CreateCoursePage />} />
                      <Route path="courses/:courseId/students" element={<ProfessorCourseStudentsPage />} />
                      <Route path="courses/:courseId/students/:studentId/grade" element={<ProfessorGradeStudentPage />} />
                      <Route path="assignments" element={<ProfessorAssignmentsPage />} />
                      <Route path="grades" element={<GradesPage />} />
                      <Route path="grades/new" element={<ProfessorCreateGradePage />} />
                      <Route path="regrades" element={<RegradeRequestsPage />} />
                      <Route path="profile" element={<ProfilePage />} />
                      <Route path="*" element={<Navigate to="/professor/dashboard" />} />
                    </Routes>
                  </Layout>
                </ProtectedRoute>
              } />
              
              {/* Catch all route */}
              <Route path="*" element={<Navigate to="/" />} />
            </Routes>
          </div>
        </Router>
      </AuthProvider>
    </QueryClientProvider>
  );
}

// Component to redirect to appropriate dashboard based on user role
const DashboardRedirect = () => {
  const { user, loading } = useAuth();
  
  if (loading) {
    return <LoadingSpinner />;
  }
  
  if (!user) {
    return <Navigate to="/login" />;
  }
  
  // Redirect to appropriate dashboard based on role
  return <Navigate to={`/${user.role}/dashboard`} />;
};

export default App;