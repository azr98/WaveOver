import React, { useState } from 'react';
import { confirmSignUp } from '@aws-amplify/auth';
import { useNavigate } from 'react-router-dom';

function Verification() {
  const [email, setEmail] = useState('');
  const [code, setCode] = useState('');
  const [error, setError] = useState('');
  const history = useNavigate();

  const handleSubmit = async (event) => {
    event.preventDefault();
    try {
      await confirmSignUp(email, code);
      // Redirect to login page or dashboard after successful verification
      history.push('/login');
    } catch (error) {
      setError(error.message);
    }
  };

  return (
    <div>
      <h1>Email Verification</h1>
      {error && <p>{error}</p>}
      <form onSubmit={handleSubmit}>
        <input
          type="email"
          value={email}
          onChange={(e) => setEmail(e.target.value)}
          placeholder="Email"
          required
        />
        <input
          type="text"
          value={code}
          onChange={(e) => setCode(e.target.value)}
          placeholder="Verification Code"
          required
        />
        <button type="submit">Verify</button>
      </form>
    </div>
  );
}

export default Verification;
