"use client";
import React, { useState, useEffect } from 'react';

function CountdownTimer({ deadline, userEmail, spouseEmail }) {
  const [timeLeft, setTimeLeft] = useState('');
  const [isExpired, setIsExpired] = useState(false);

  useEffect(() => {
    const calculateTimeLeft = () => {
      const deadlineDate = new Date(deadline);
      const now = new Date(new Date().toISOString());
      const difference = deadlineDate - now;

      if (difference <= 0) {
        setIsExpired(true);
        return 'Time is up!';
      }

      const days = Math.floor(difference / (1000 * 60 * 60 * 24));
      const hours = Math.floor((difference / (1000 * 60 * 60)) % 24);
      const minutes = Math.floor((difference / 1000 / 60) % 60);
      const seconds = Math.floor((difference / 1000) % 60);

      return `${days}d ${hours}h ${minutes}m ${seconds}s`;
    };

    // Update immediately
    setTimeLeft(calculateTimeLeft());

    // Update every second
    const timer = setInterval(() => {
      setTimeLeft(calculateTimeLeft());
    }, 1000);

    return () => clearInterval(timer);
  }, [deadline]);

  return (
    <div className="countdown-timer">
      <p className={isExpired ? 'expired' : ''}>{timeLeft}</p>
    </div>
  );
}

export default CountdownTimer; 