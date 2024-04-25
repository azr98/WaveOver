import React, { useState } from 'react';
import axios from 'axios';
import { Routes, Route, Router } from 'react-router-dom';

function App() {
  return (
    <Router>
      <div className="App">
        <Routes>
          <Route path="/login" component={LoginPage} />
          <Route path="/register" component={RegistrationPage} />
          {/*<Route path="/argument" component={ArgumentPage} />
          <Route path="/response" component={ResponsePage} />*/}
        </Routes>
      </div>
    </Router>
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
