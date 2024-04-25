import React, { useState } from 'react';
import Dashboard from './components/dashboard.js';  // Assuming it's a local component
import axios from 'axios';
import { Routes, Route, BrowserRouter } from 'react-router-dom';

function App() {
  return (
    <BrowserRouter>  {/* Wrap your app with BrowserRouter */}
      <div className="App">
        <Routes>
          <Route path="/login" element={<LoginPage />} /> {/* Use element prop for JSX */}
          <Route path="/register" element={<RegistrationPage />} />
          <Route path="/dashboard" element={<Dashboard />} />
          {/*<Route path="/argument" component={ArgumentPage} />*/}  {/* Uncomment if needed */}
          {/*<Route path="/response" component={ResponsePage} />*/}  {/* Uncomment if needed */}
        </Routes>
      </div>
    </BrowserRouter>
  );
}

function LoginPage() {
  // Login form logic
  return <div>Login Page</div>;
}

function RegistrationPage() {
  // Registration form logic
  return <div>Registration Page</div>;
}

// Define other components similarly

export default App;
