import React from 'react';
import { BrowserRouter, Routes, Route, Navigate } from 'react-router-dom';
import './App.css';
import { AuthProvider } from './context/AuthContext';
import ProtectedRoute from './components/ProtectedRoute';
import Navbar from './components/Navbar';
import AdminPage from './pages/AdminPage';
import ConsultantPage from './pages/ConsultantPage';
import LoginPage from './pages/LoginPage';
import RecentChats from './pages/RecentChats';

function App() {
  return (
    <BrowserRouter>
      <AuthProvider>
        <div className="min-h-screen bg-notion-bg">
          {/* Note: With the new Sidebar layout, you might want to hide Navbar 
              on /consultant and /recents routes later if it looks double-stacked */}
          <Navbar />
          
          <Routes>
            {/* Show login first */}
            <Route path='/' element={<Navigate to="/login" replace />} />

            <Route path='/login' element={<LoginPage />} />

            <Route
              path='/admin'
              element={
                <ProtectedRoute>
                  <AdminPage />
                </ProtectedRoute>
              }
            />

            <Route
              path='/consultant'
              element={
                <ProtectedRoute>
                  <ConsultantPage />
                </ProtectedRoute>
              }
            />

            {/* --- NEW ROUTE FOR HISTORY --- */}
            <Route
              path='/recents/:category'
              element={
                <ProtectedRoute>
                  <RecentChats />
                </ProtectedRoute>
              }
            />

            {/* Fallback to login */}
            <Route path="*" element={<Navigate to="/login" replace />} />
          </Routes>
        </div>
      </AuthProvider>
    </BrowserRouter>
  );
}

export default App;