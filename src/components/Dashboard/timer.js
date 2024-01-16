import React, { useState, useEffect } from 'react';

function Timer({ startTime }) {
  const [timeLeft, setTimeLeft] = useState(calculateTimeLeft(startTime));

  useEffect(() => {
    const timer = setInterval(() => {
      const newTimeLeft = calculateTimeLeft(startTime);
      setTimeLeft(newTimeLeft);

      if (newTimeLeft.total <= 0) {
        clearInterval(timer);
      }
    }, 1000);

    return () => clearInterval(timer);
  }, [startTime]);

  function calculateTimeLeft(startTime) {
    const endTime = new Date(startTime).getTime() + 3 * 24 * 60 * 60 * 1000; // 3 days in milliseconds
    const now = new Date().getTime();
    const difference = endTime - now;

    let timeLeft = {};

    if (difference > 0) {
      timeLeft = {
        days: Math.floor(difference / (1000 * 60 * 60 * 24)),
        hours: Math.floor((difference / (1000 * 60 * 60)) % 24),
        minutes: Math.floor((difference / 1000 / 60) % 60),
        seconds: Math.floor((difference / 1000) % 60),
        total: difference,
      };
    }
    
    return timeLeft;

}

return (
        <div>
            {timeLeft.total > 0 ? (
                <h2>
                    Time Remaining: {timeLeft.days} Days {timeLeft.hours} Hours {timeLeft.minutes} Minutes {timeLeft.seconds} Seconds
                </h2>
                ) : 
            (
                <h2>Time's up!</h2>
            )}
        </div>
    );
}

export default Timer;

