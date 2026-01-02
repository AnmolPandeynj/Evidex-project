import { BrowserRouter as Router, Routes, Route, Navigate } from 'react-router-dom';
import { AuthProvider } from './context/AuthContext';
import { Login } from './pages/Login';
import { SignUp } from './pages/SignUp';
import LandingPage from './pages/LandingPage';
import FeaturesPage from './pages/FeaturesPage';
import SecurityPage from './pages/SecurityPage';
import RoadmapPage from './pages/RoadmapPage';
import ResourcesPage from './pages/ResourcesPage';
import LegalPage from './pages/LegalPage';
import Dashboard from './pages/Dashboard';
import MyCases from './pages/MyCases';
import PrivateRoute from './components/PrivateRoute';

function App() {
  return (
    <AuthProvider>
      <Router>
        <Routes>
          <Route path="/" element={<LandingPage />} />
          <Route path="/features" element={<FeaturesPage />} />
          <Route path="/security" element={<SecurityPage />} />
          <Route path="/roadmap" element={<RoadmapPage />} />
          <Route path="/resources" element={<ResourcesPage />} />
          <Route path="/legal" element={<LegalPage />} />
          <Route path="/login" element={<Login />} />
          <Route path="/signup" element={<SignUp />} />
          <Route
            path="/dashboard"
            element={
              <PrivateRoute>
                <Dashboard />
              </PrivateRoute>
            }
          />
          <Route
            path="/cases"
            element={
              <PrivateRoute>
                <MyCases />
              </PrivateRoute>
            }
          />
          <Route path="*" element={<Navigate to="/" replace />} />
        </Routes>
      </Router>
    </AuthProvider>
  );
}

export default App;
