import React from 'react';
import ReactDOM from 'react-dom/client';
import './index.css';
import App from './App';
import { ClerkProvider } from '@clerk/clerk-react';

// The publishable key will be injected as a global variable during build
const PUBLISHABLE_KEY = window.CLERK_PUBLISHABLE_KEY;

if (!PUBLISHABLE_KEY) {
  throw new Error("Missing Publishable Key");
}

const root = ReactDOM.createRoot(document.getElementById('root'));
root.render(
  <React.StrictMode>
    <ClerkProvider 
      publishableKey={PUBLISHABLE_KEY} 
      afterSignInUrl="/dashboard"
      afterSignUpUrl="/dashboard"
      signInUrl="/"
      signUpUrl="/"
    >
      <App />
    </ClerkProvider>
  </React.StrictMode>
);
