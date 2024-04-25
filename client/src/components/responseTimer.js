import React, { useEffect, useState } from 'react';
import axios from 'axios';

function ResponseTimer({ argumentId }) {
  const [timeLeft, setTimeLeft] = useState(259200); // 3 days in seconds

  useEffect(() => {
    const interval = setInterval(() => {
      setTimeLeft(prevTime => prevTime - 1);
    }, 1000);

    return () => clearInterval(interval);
  }, []);

  useEffect(() => {
    if (timeLeft <= 0) {
      clearInterval(interval);
      // Lock the response box, maybe submit the response automatically
      // Call backend to notify the other user
    }
  }, [timeLeft]);

  const formatTimeLeft = () => {
    let seconds = timeLeft % 60;
    let minutes = Math.floor(timeLeft / 60) % 60;
    let hours = Math.floor(timeLeft / 3600) % 24;
    let days = Math.floor(timeLeft / 86400);
    return `${days}d ${hours}h ${minutes}m ${seconds}s`;
  };

  return (
    <div>
      <h1>Time Remaining: {formatTimeLeft()}</h1>
      <textarea placeholder="Write your response here..."></textarea>
      <button>Submit Response</button>
    </div>
  );
}

export default ResponseTimer;
