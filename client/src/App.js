import React, { useState } from 'react';
import Dashboard from './components/dashboard.js';
import ResponsePage from './components/responsePage.js';
import cognito_config from './amplifyconfiguration.json'
import LandingPage from './components/landingPage.js';
import AuthContainer from './components/auth/authContainer.js';
import { Routes, Route, BrowserRouter } from 'react-router-dom';
import { Amplify } from 'aws-amplify';
import '@aws-amplify/ui-react/styles.css';
import { withAuthenticator, useAuthenticator, Authenticator} from '@aws-amplify/ui-react';

Amplify.configure(cognito_config);




function App() {

  return (
    <BrowserRouter>
    <div className="App">
      <Routes>
        <Route path="/" element={<LandingPage />} />
        <Route path="*" element={<LandingPage />} /> {/* Defaults to landing page is route does not exist */}
         {/* Every product MVP route needs withAuthenticator inside the route */}
        <Route path="/dashboard" element={<Dashboard />} />  
        <Route path="/response" element={<ResponsePage />} /> 
      </Routes>

    </div>
  </BrowserRouter>
  );
}

export default App

// https://waveover86050201dev-dev.auth.eu-west-1.amazoncognito.com/
//https://waveover86050201dev-dev.auth.eu-west-1.amazoncognito.com/login?response_type=code&client_id=42rg1bncat7k6ep14qr3it4uvj&redirect_uri=http://localhost:3000/dashboard/

//Problem URL
//https://https//waveover86050201dev-dev.auth.eu-west-1.amazoncognito.com/oauth2/authorize?redirect_uri=http%3A%2F%2Flocalhost%3A3000%2Fdashboard&response_type=code&client_id=42rg1bncat7k6ep14qr3it4uvj&identity_provider=Google&scope=phone%20email%20openid%20profile%20aws.cognito.signin.user.admin&state=4uuu9Q8n2DmNtorRMMPAyqTXjJ87K6Aa&code_challenge=4SfyqhWOD9hMoGdQXL-cADUg1mbzLZzNoDCLvYpovv8&code_challenge_method=S256