import React, { useState } from 'react';
import axios from 'axios';

function Signup() {
  const [email, setEmail] = useState('');
  const [password, setPassword] = useState('');
  const [firstName, setFirstName] = useState('');
  const [spouseEmail, setSpouseEmail] = useState('');

  const handleSignup = async () => {
    try {
      const response = await axios.post('http://localhost:5000/register', {
        email, password, firstName, spouseEmail
      });
      alert(response.data.message);
    } catch (error) {
      alert(error.response.data.error);
    }
  };

  return (
    <div>
      <input type="email" value={email} onChange={(e) => setEmail(e.target.value)} placeholder="Email" />
      <input type="password" value={password} onChange={(e) => setPassword(e.target.value)} placeholder="Password" />
      <input type="text" value={firstName} onChange={(e) => setFirstName(e.target.value)} placeholder="First Name" />
      <input type="email" value={spouseEmail} onChange={(e) => setSpouseEmail(e.target.value)} placeholder="Spouse's Email" />
      <button onClick={handleSignup}>Sign Up</button>
    </div> )
}