import React, { useState, useEffect } from 'react';
import { useLocation, useParams } from 'react-router-dom';
import TextEditor from './textEditor.js';
import { useUser } from '@clerk/clerk-react';
import axios from 'axios';

function ArgumentPage() {
  const location = useLocation();
  const { argumentTopic, submissionTime } = useParams();
  const [argument, setArgument] = useState(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState(null);
  const { user } = useUser();

  useEffect(() => {
    async function fetchArgument() {
      if (location.state?.argument) {
        console.log("Setting argument from location state:", location.state.argument);
        setArgument(location.state.argument);
        setLoading(false);
      } else {
        try {
          const response = await axios.get(`https://devbackend.waveover.info/get_argument`, {
            params: {
              argument_topic: argumentTopic,
              submission_time: submissionTime,
              userEmail: user.primaryEmailAddress.emailAddress
            }
          });
          console.log("Fetched argument from server:", response.data);
          setArgument(response.data);
          setLoading(false);
        } catch (err) {
          console.error('Error fetching argument:', err);
          setError('Failed to load argument. Please try again.');
          setLoading(false);
        }
      }
    }

    if (user) {
      fetchArgument();
    }
  }, [location.state, argumentTopic, submissionTime, user]);

  useEffect(() => {
    console.log("Argument state updated:", argument);
  }, [argument]);

  if (!user) {
    return <div>Please sign in to view this argument.</div>;
  }

  if (loading) {
    return <div>Loading...</div>;
  }

  if (error) {
    return <div>{error}</div>;
  }

  if (!argument) {
    return <div>No argument found.</div>;
  }

  return (
    <div>
      <h1>Argument: {argument.argument_topic}</h1>
      <TextEditor argument={argument} userEmail={user.primaryEmailAddress.emailAddress} />
    </div>
  );
}

export default ArgumentPage;
