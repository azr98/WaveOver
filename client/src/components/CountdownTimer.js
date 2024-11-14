import React, { useState, useEffect } from 'react';
import axios from 'axios';

function CountdownTimer({ deadline, userEmail, spouseEmail, children }) {
  const [timeLeft, setTimeLeft] = useState('');
  const [isTimeUp, setIsTimeUp] = useState(false);
  const [usersExist, setUsersExist] = useState(false);
  const [isLoading, setIsLoading] = useState(true);

  useEffect(() => {
    const checkUsersExist = async () => {
      try {
        const response = await axios.post('http://localhost:5000/check-users', { userEmail, spouseEmail });
        setUsersExist(response.data.usersExist);
      } catch (error) {
        console.error('Error checking users:', error);
      } finally {
        setIsLoading(false);
      }
    };

    checkUsersExist();
  }, [userEmail, spouseEmail]);

  useEffect(() => {
    if (!deadline) {
      setTimeLeft('');
      setIsTimeUp(false);
      return;
    }

    const calculateTimeLeft = () => {
      const now = new Date();
      const targetDate = new Date(deadline);
      
      let difference = targetDate - now;

      if (difference > 0) {
        const hours = Math.floor(difference / (1000 * 60 * 60));
        const minutes = Math.floor((difference % (1000 * 60 * 60)) / (1000 * 60));
        setIsTimeUp(false);
        return `${hours.toString().padStart(2, '0')}:${minutes.toString().padStart(2, '0')}`;
      }
      setIsTimeUp(true);
      return '00:00';
    };

    const timer = setInterval(() => {
      setTimeLeft(calculateTimeLeft());
    }, 60000); // Update every minute

    setTimeLeft(calculateTimeLeft()); // Initial calculation

    return () => clearInterval(timer);
  }, [deadline]);

  if (isLoading) {
    return <div>Loading...</div>;
  }

  return (
    <div style={{
      fontSize: '1.2em',
      fontWeight: 'bold',
      margin: '10px 0',
      padding: '10px',
      backgroundColor: '#f0f0f0',
      borderRadius: '5px'
    }}>
      {!deadline ? (
        "Waiting for deadline to be set (which should happen within an hour)"
      ) : isTimeUp ? (
        "Time's up! Responses have been exchanged."
      ) : (
        <>
          {`Responses between ${userEmail} and ${spouseEmail} will be exchanged in ${timeLeft}`}
          {usersExist && children}
        </>
      )}
    </div>
  );
}

export default CountdownTimer;
