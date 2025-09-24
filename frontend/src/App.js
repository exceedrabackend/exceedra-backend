import React from 'react';
import { BrowserRouter as Router, Routes, Route, Navigate } from 'react-router-dom';
import { Toaster } from 'react-hot-toast';
import { AuthProvider } from './contexts/AuthContext';
import { useAuth } from './contexts/AuthContext';
import Navbar from './components/Layout/Navbar';
import Login from './pages/Login';
import Dashboard from './pages/Dashboard';
import DamageReport from './pages/DamageReport';
import DamageList from './pages/DamageList';
import DamageDetail from './pages/DamageDetail';
import Properties from './pages/Properties';
import Users from './pages/Users';
import Profile from './pages/Profile';
import LoadingSpinner from './components/UI/LoadingSpinner';

function AppRoutes() {
  const { user, loading } = useAuth();

  if (loading) {
    return (
      <div className="min-h-screen flex items-center justify-center">
        <LoadingSpinner size="lg" />
      </div>
    );
  }

  if (!user) {
    return (
      <Routes>
        <Route path="/login" element={<Login />} />
        <Route path="*" element={<Navigate to="/login" replace />} />
      </Routes>
    );
  }

  return (
    <div className="min-h-screen bg-gray-50">
      <Navbar />
      <main className="container mx-auto px-4 py-8">
        <Routes>
          <Route
            path="/"
            element={
              user.role === 'CLEANER'
                ? <Navigate to="/report-damage" replace />
                : <Dashboard />
            }
          />
          {user.role !== 'CLEANER' && (
            <Route path="/dashboard" element={<Dashboard />} />
          )}
          <Route path="/report-damage" element={<DamageReport />} />
          <Route path="/damages" element={<DamageList />} />
          <Route path="/damages/:id" element={<DamageDetail />} />
          <Route path="/properties" element={<Properties />} />
          {(user.role === 'ADMIN') && (
            <Route path="/users" element={<Users />} />
          )}
          <Route path="/profile" element={<Profile />} />
          <Route
            path="*"
            element={
              <Navigate
                to={user.role === 'CLEANER' ? '/report-damage' : '/'}
                replace
              />
            }
          />
        </Routes>
      </main>
    </div>
  );
}

function App() {
  return (
    <AuthProvider>
      <Router>
        <div className="App">
          <AppRoutes />
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
                style: {
                  background: '#10B981',
                },
              },
              error: {
                duration: 5000,
                style: {
                  background: '#EF4444',
                },
              },
            }}
          />
        </div>
      </Router>
    </AuthProvider>
  );
}

export default App;
