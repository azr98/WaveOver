import React, { useState, useEffect } from 'react';
import axios from 'axios';

function ResponsePage({ userId, isUser }) {
  const [response, setResponse] = useState('');
  const [timeLeft, setTimeLeft] = useState(25);  // For testing, use real time for production
  const [submitDisabled, setSubmitDisabled] = useState(false);

  useEffect(() => {
    if (timeLeft > 0) {
      const timer = setTimeout(() => setTimeLeft(timeLeft - 1), 1000);
      return () => clearTimeout(timer);
    } else {
      setSubmitDisabled(true); // Disable submission after time expires
    }
  }, [timeLeft]);

  const handleSubmitResponse = async () => {
    await axios.post('http://localhost:5000/submit_response', {
      user_id: userId,
      response: response,
      is_user: isUser
    });
    setSubmitDisabled(true);  // Prevent further edits after submission
  };

  return (
    <div>
      <h1>Time Remaining: {timeLeft}s</h1>
      <textarea disabled={submitDisabled} value={response} onChange={(e) => setResponse(e.target.value)} placeholder="Write your response..." />
      <button disabled={submitDisabled} onClick={handleSubmitResponse}>Submit Response</button>
    </div>
  );
}

export default ResponsePage;
