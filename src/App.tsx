import { Routes, Route, Navigate } from 'react-router-dom';
import { useAuthStore } from './stores/authStore';
import { useEffect } from 'react';
import Layout from './components/Layout';
import HomePage from './pages/HomePage';
import LoginPage from './pages/auth/Login';
import RegisterPage from './pages/auth/Register';
import DashboardPage from './pages/Dashboard';
import LearningPage from './pages/learning/LearningHub';
import MentorPage from './pages/mentor/AIMentor';
import ProjectsPage from './pages/projects/ProjectsShowcase';
import MentorshipPage from './pages/mentorship/MentorshipHub';
import AnalyticsPage from './pages/analytics/AnalyticsDashboard';
import ProfilePage from './pages/profile/ProfilePage';
import NotFoundPage from './pages/NotFound';
import LoadingSpinner from './components/ui/LoadingSpinner';

function App() {
  const { user, loading, checkAuth } = useAuthStore();

  useEffect(() => {
    checkAuth();
  }, [checkAuth]);

  if (loading) {
    return (
      <div className="min-h-screen flex items-center justify-center bg-secondary-50">
        <LoadingSpinner size="lg" />
      </div>
    );
  }

  return (
    <Routes>
      {/* Public routes */}
      <Route path="/" element={<HomePage />} />
      <Route 
        path="/login" 
        element={user ? <Navigate to="/dashboard" replace /> : <LoginPage />} 
      />
      <Route 
        path="/register" 
        element={user ? <Navigate to="/dashboard" replace /> : <RegisterPage />} 
      />
      
      {/* Protected routes */}
      <Route 
        path="/*" 
        element={
          user ? (
            <Layout>
              <Routes>
                <Route path="/dashboard" element={<DashboardPage />} />
                
                {/* Learning routes */}
                <Route path="/learning" element={<LearningPage />} />
                
                {/* AI Mentor routes */}
                <Route path="/mentor" element={<MentorPage />} />
                
                {/* Projects routes */}
                <Route path="/projects" element={<ProjectsPage />} />
                
                {/* Mentorship routes */}
                <Route path="/mentorship" element={<MentorshipPage />} />
                
                {/* Analytics routes */}
                <Route path="/analytics" element={<AnalyticsPage />} />
                
                {/* Profile routes */}
                <Route path="/profile" element={<ProfilePage />} />
                
                {/* Catch all for authenticated users */}
                <Route path="*" element={<NotFoundPage />} />
              </Routes>
            </Layout>
          ) : (
            <Navigate to="/login" replace />
          )
        }
      />
    </Routes>
  );
}

export default App;