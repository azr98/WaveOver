import React from 'react';
import { SignedIn, SignedOut, SignInButton } from '@clerk/clerk-react';
import { useNavigate } from 'react-router-dom';

function LandingPage() {
  const navigate = useNavigate();

  return (
    <div>
      <h1>Welcome to WaveOver</h1>
      
      <SignedIn>
        {/* Redirect to dashboard if already signed in */}
        {navigate('/dashboard')}
      </SignedIn>
      
      <SignedOut>
        <div>
          <p>Your platform for constructive arguments</p>
          <SignInButton mode="modal">
            <button className="sign-in-button">
              Sign In
            </button>
          </SignInButton>
        </div>
      </SignedOut>
    </div>
  );
}

export default LandingPage;