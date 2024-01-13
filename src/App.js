import React from 'react';
import { BrowserRouter as Router, Route, Routes } from 'react-router-dom';
import SignUp from './components/Auth/signup';
import Login from './components/Auth/login';
import Verification from './components/Auth/verification';
import Dashboard from './components/Dashboard/dashboard';
// Other imports as necessary


function App() {
  return (
    <Router>
      <Routes>
        <Route path="/signup" component={SignUp} />
        <Route path="/login" component={Login} />
        <Route path="/verify" component={Verification} />
        <Route path="/dashboard" component={Dashboard} />
        {/* Other routes as needed */}
        </Routes>
    </Router>
  );
}

export default App;


