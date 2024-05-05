import React, { useState } from 'react';
import Dashboard from './components/dashboard.js';
import Signup from './components/signUp.js';
import axios from 'axios';
import { Routes, Route, BrowserRouter } from 'react-router-dom';
import { Amplify } from 'aws-amplify';
import config from './amplifyconfiguration.json';
Amplify.configure(config);

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
