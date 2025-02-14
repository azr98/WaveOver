import React from 'react';
import ReactDOM from 'react-dom/client';
import './index.css';
import App from './App';
import { ClerkProvider } from '@clerk/clerk-react';
import { AWS } from 'aws-sdk';

// Configure AWS
AWS.config.update({ region: 'eu-west-1' });
const ssm = new AWS.SSM();

// Function to get the Clerk key from Parameter Store
async function getClerkKey() {
  try {
    const response = await ssm.getParameter({
      Name: 'clerk-gmail-api-key',
      WithDecryption: true
    }).promise();
    return response.Parameter.Value;
  } catch (error) {
    console.error('Error fetching Clerk key:', error);
    throw new Error('Failed to load Clerk key');
  }
}

// Initialize the app with Clerk
async function initApp() {
  try {
    const PUBLISHABLE_KEY = await getClerkKey();
    
    if (!PUBLISHABLE_KEY) {
      throw new Error("Missing Publishable Key");
    }

    const root = ReactDOM.createRoot(document.getElementById('root'));
    root.render(
      <React.StrictMode>
        <ClerkProvider publishableKey={PUBLISHABLE_KEY} afterSignOutUrl="/">
          <App />
        </ClerkProvider>
      </React.StrictMode>
    );
  } catch (error) {
    console.error('Failed to initialize app:', error);
    // Show error state to user
    const root = ReactDOM.createRoot(document.getElementById('root'));
    root.render(
      <div>
        <h1>Error Loading Application</h1>
        <p>Please try again later.</p>
      </div>
    );
  }
}

initApp();
