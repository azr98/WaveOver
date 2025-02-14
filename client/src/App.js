import React from 'react';
import Dashboard from './components/dashboard.js';
import LandingPage from './components/landingPage.js';
import ArgumentPage from './components/argumentPage.js';
import { SignedIn, SignedOut, UserButton } from '@clerk/clerk-react';
import { BrowserRouter, Routes, Route, Navigate, useLocation } from "react-router-dom";

// Protected route wrapper component
function ProtectedRoute({ children }) {
  const location = useLocation();
  
  return (
    <div>
      <SignedIn>
        {/* Header with profile button for all protected routes */}
        <div style={{
          position: 'fixed',
          top: '1rem',
          right: '1rem',
          zIndex: 1000
        }}>
          <UserButton afterSignOutUrl="/" />
        </div>
        {children}
      </SignedIn>
      <SignedOut>
        <Navigate to="/" state={{ from: location }} replace />
      </SignedOut>
    </div>
  );
}

function App() {
  return (
    <BrowserRouter>
      <Routes>
        {/* Public route */}
        <Route path="/" element={<LandingPage />} />
        
        {/* Protected routes */}
        <Route
          path="/dashboard"
          element={
            <ProtectedRoute>
              <Dashboard />
            </ProtectedRoute>
          }
        />
        <Route
          path="/response"
          element={
            <ProtectedRoute>
              <ArgumentPage />
            </ProtectedRoute>
          }
        />
        <Route
          path="/argument/:argumentTopic/:submissionTime"
          element={
            <ProtectedRoute>
              <ArgumentPage />
            </ProtectedRoute>
          }
        />
        
        {/* Redirect all other routes to landing */}
        <Route path="*" element={<Navigate to="/" replace />} />
      </Routes>
    </BrowserRouter>
  );
}

export default App;