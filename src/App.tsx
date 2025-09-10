import React, { useEffect } from 'react';
import { BrowserRouter as Router, Routes, Route, Navigate } from 'react-router-dom';
import Dashboard from './components/Dashboard';
import Scan from './components/Scan';
import Compliance from './components/Compliance';
import Training from './components/Training';
import Alerts from './components/Alerts';
import AdminPanel from './components/AdminPanel';
import Navigation from './components/Navigation';
import Login from './components/Login';
import { AuthProvider, useAuth } from './contexts/AuthContext';
import { NotificationProvider } from './contexts/NotificationContext';
import './App.css';


const AppContent: React.FC = () => {
  const { user, isLoading } = useAuth();


  if (isLoading) {
    return (
      <div className="min-h-screen bg-gradient-to-br from-slate-900 via-purple-900 to-slate-900 flex items-center justify-center">
        <div className="animate-spin rounded-full h-32 w-32 border-b-2 border-green-400"></div>
      </div>
    );
  }

  if (!user) {
    return <Login />;
  }

  return (
    <div className="min-h-screen bg-gradient-to-br from-slate-900 via-purple-900 to-slate-900">
      <Router>
        <div className="pb-20 md:pb-0">
          <Routes>
            <Route path="/login" element={<Navigate to="/dashboard" replace />} />
            <Route path="/dashboard" element={<Dashboard />} />
            <Route path="/scan" element={<Scan />} />
            <Route path="/compliance" element={<Compliance />} />
            <Route path="/training" element={<Training />} />
            <Route path="/alerts" element={<Alerts />} />
            {user?.role === 'admin' && (
              <Route path="/admin" element={<AdminPanel />} />
            )}
            <Route path="/" element={<Navigate to="/dashboard" replace />} />
          </Routes>
          <Navigation />
        </div>
      </Router>
    </div>
  );
};

const App: React.FC = () => {
  return (
    <AuthProvider>
      <NotificationProvider>
        <AppContent />
      </NotificationProvider>
    </AuthProvider>
  );
};

export default App;