import React, { useState, useEffect } from 'react';
import { useLocation, useParams } from 'react-router-dom';
import TextEditor from './textEditor.js';
import { withAuthenticator, useAuthenticator } from '@aws-amplify/ui-react';
import axios from 'axios';

function ArgumentPage() {
  const location = useLocation();
  const { argumentTopic, submissionTime } = useParams();
  const [userEmail, setUserEmail] = useState('')
  const [argument, setArgument] = useState(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState(null);

  useEffect(() => {
    async function fetchArgument() {
      if (location.state?.argument) {
        console.log("Setting argument from location state:", location.state.argument);
        setArgument(location.state.argument);
        // console.log("Setting userEmail from state:", location.state.userEmail);
        setUserEmail(location.state.userEmail);
        console.log("Full arg in argumentPage from passed prop", argument);
        setLoading(false);
      } else {
        try {
          const response = await axios.get(`https://devbackend.waveover.info/get_argument`, {
            params: {
              argument_topic: argumentTopic,
              submission_time: submissionTime,
              cognitoUserEmail: userEmail
            }
          });
          console.log("Fetched argument from server:", response.data);
          setArgument(response.data);
          console.log("Full arg in argumentPage from get_argument", argument);
          setLoading(false);
        } catch (err) {
          console.error('Error fetching argument:', err);
          setError('Failed to load argument. Please try again.');
          setLoading(false);
        }
      }
    }

    fetchArgument();
  }, [location.state, argumentTopic, submissionTime]);

  useEffect(() => {
    console.log("Argument state updated:", argument);
  }, [argument]);

  if (loading) return <div>Loading...</div>;
  if (error) return <div>{error}</div>;
  if (!argument) return <div>Argument not found</div>;

  return (
    <div>
      <h1>Argument: {argument.argument_topic}</h1>
      <TextEditor 
        argument={argument}
        userEmail={userEmail}
      />
    </div>
  );
}

export default withAuthenticator(ArgumentPage);

//{
  //   socialProviders: [
  //     'google'
  //   ]
  // }
  
