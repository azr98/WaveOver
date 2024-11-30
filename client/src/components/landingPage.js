import React from 'react'
import { useNavigate } from 'react-router-dom';


function LandingPage() {
  const navigate = useNavigate();

  const handleSignupClick = () => {
    navigate('/dashboard'); // Replace '/signup' with your actual signup path
  };


  return (
    <div>landingPage
       <button onClick={handleSignupClick}>Sign Up</button>
       <p>Github actions test </p>
    </div>
    
  )
}




export default LandingPage