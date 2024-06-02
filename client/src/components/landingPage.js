import React from 'react'
import { useNavigate } from 'react-router-dom';
import authContainer from './auth/authContainer';


function LandingPage() {
  const navigate = useNavigate();

  const handleSignupClick = () => {
    navigate('/dashboard'); // Replace '/signup' with your actual signup path
  };


  return (
    <div>landingPage
       <button onClick={handleSignupClick}>Sign Up</button>
    </div>
    
  )
}




export default LandingPage