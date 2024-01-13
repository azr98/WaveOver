import React from 'react';
import { BrowserRouter as Router, Route, Switch } from 'react-router-dom';
import SignUp from './components/Auth/SignUp';
import Login from './components/Auth/Login';
import Verification from './components/Auth/Verification';
import Dashboard from './components/Dashboard/Dashboard';
// Other imports as necessary


function App() {
  return (
    <Router>
      <Switch>
        <Route path="/signup" component={SignUp} />
        <Route path="/login" component={Login} />
        <Route path="/verify" component={Verification} />
        <Route path="/dashboard" component={Dashboard} />
        {/* Other routes as needed */}
      </Switch>
    </Router>
  );
}

export default App;

