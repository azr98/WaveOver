import React, { useEffect } from 'react';
import { SignedIn, SignedOut, SignInButton, useUser } from '@clerk/clerk-react';
import { useNavigate } from 'react-router-dom';

function LandingPage() {
  const navigate = useNavigate();
  const { isSignedIn } = useUser();

  useEffect(() => {
    if (isSignedIn) {
      navigate('/dashboard');
    }
  }, [isSignedIn, navigate]);

  return (
    <div className="landing-page">
      <SignedOut>
        <div className="landing-content">
          <h1>Welcome to WaveOver</h1>
          <p>Your platform for constructive arguments</p>
          <div className="auth-buttons">
            <SignInButton mode="modal">
              <button className="sign-in-button">
                Sign In
              </button>
            </SignInButton>
          </div>
        </div>
      </SignedOut>
    </div>
  );
}

export default LandingPage;