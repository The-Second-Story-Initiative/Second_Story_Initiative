import { Routes, Route, Navigate } from 'react-router-dom';
import { useAuthStore } from './stores/authStore';
import { useEffect } from 'react';
import Layout from './components/Layout';
import HomePage from './pages/HomePage';
import LoginPage from './pages/auth/LoginPage';
import RegisterPage from './pages/auth/RegisterPage';
import DashboardPage from './pages/DashboardPage';
import LearningPage from './pages/learning/LearningPage';
import TrackDetailPage from './pages/learning/TrackDetailPage';
import MentorPage from './pages/mentor/MentorPage';
import ProjectsPage from './pages/projects/ProjectsPage';
import ProjectDetailPage from './pages/projects/ProjectDetailPage';
import MentorshipPage from './pages/mentorship/MentorshipPage';
import AnalyticsPage from './pages/analytics/AnalyticsPage';
import ProfilePage from './pages/profile/ProfilePage';
import NotFoundPage from './pages/NotFoundPage';
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
                <Route path="/learning/tracks/:trackId" element={<TrackDetailPage />} />
                
                {/* AI Mentor routes */}
                <Route path="/mentor" element={<MentorPage />} />
                
                {/* Projects routes */}
                <Route path="/projects" element={<ProjectsPage />} />
                <Route path="/projects/:projectId" element={<ProjectDetailPage />} />
                
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