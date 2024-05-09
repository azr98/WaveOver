import React, { useState } from 'react';
import Dashboard from './components/dashboard.js';
import Signup from './components/auth/signUp.js';
import axios from 'axios';
import { Routes, Route, BrowserRouter } from 'react-router-dom';


function App() {
  return (
    <BrowserRouter> 
      <div className="App">
        <Routes>
          {/*<Route path="/login" element={<LoginPage />} /> */} 
          <Route path="/signup" element={<Signup />} />
          <Route path="/dashboard" element={<Dashboard />} />
          {/*<Route path="/argument" component={ArgumentPage} />*/}  
          {/*<Route path="/response" component={ResponsePage} />*/}  
        </Routes>
      </div>
    </BrowserRouter>
  );
}

export default App;
