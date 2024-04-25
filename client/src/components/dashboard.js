import React, { useState } from 'react';
import axios from 'axios';

function Dashboard() {
  const [spouseEmail, setSpouseEmail] = useState('');
  const [argumentTopic, setArgumentTopic] = useState('');
  const [userResponse, setUserResponse] = useState('');
  const [submitted, setSubmitted] = useState(false);

  const handleSubmit = async () => {
    const data = {
      user_id: 'user1',  // This should be dynamically set based on logged-in user
      spouse_email: spouseEmail,
      argument_topic: argumentTopic,
      user_response: userResponse
    };
    await axios.post('http://localhost:5000/submit_argument', data);
    setSubmitted(true);
  };

  return (
    <div>
      <h1>Argument Dashboard</h1>
      {submitted ? (
        <p>Argument and response submitted! Waiting for the timer...</p>
      ) : (
        <>
          <input type="email" value={spouseEmail} onChange={(e) => setSpouseEmail(e.target.value)} placeholder="Spouse's Email" />
          <input type="text" value={argumentTopic} onChange={(e) => setArgumentTopic(e.target.value)} placeholder="Argument Topic" />
          <textarea value={userResponse} onChange={(e) => setUserResponse(e.target.value)} placeholder="Your Response"></textarea>
          <button onClick={handleSubmit}>Submit</button>
        </>
      )}
    </div>
  );
}

export default Dashboard;
