import React, { useState } from 'react';
import Dashboard from './components/dashboard.js';
import Signup from './components/signUp.js';
import axios from 'axios';
import { Routes, Route, BrowserRouter } from 'react-router-dom';

function App() {
  return (
    <BrowserRouter>  {/* Wrap your app with BrowserRouter */}
      <div className="App">
        <Routes>
          <Route path="/login" element={<LoginPage />} /> {/* Use element prop for JSX */}
          <Route path="/signup" element={<Signup />} />
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

export default App;
