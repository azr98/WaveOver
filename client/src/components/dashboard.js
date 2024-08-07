import React, { useEffect, useState } from 'react';
import axios from 'axios';
import { Link } from "react-router-dom";
import cognito_config from '../amplifyconfiguration.json'
import { Amplify } from 'aws-amplify';
import { getCurrentUser , fetchUserAttributes } from '@aws-amplify/auth';
import '@aws-amplify/ui-react/styles.css';
import { withAuthenticator} from '@aws-amplify/ui-react';
Amplify.configure(cognito_config);

function Dashboard() {
  const [spouseEmail, setSpouseEmail] = useState('');
  const [argumentTopic, setArgumentTopic] = useState('');
  const [initiated, setInitiated] = useState(false);
  const [userEmail, setUserEmail] = useState('');
  const [argumentsList, setArgumentsList] = useState([]);

  // Function to fetch user email
  const fetchUserEmail = async () => {
    try {
      const userAttributes = await fetchUserAttributes();
      if (userAttributes.email) {
        console.log("Pulled email", userAttributes.email);
        setUserEmail(userAttributes.email);  // Update state with user email
        return userAttributes.email;
      } else {
        console.log("Error: User email not found in attributes");
        throw new Error("User email not found");
      }
    } catch (err) {
      console.error("Error fetching user data:", err);
      throw err;
    }
  };

  // Function to fetch arguments based on user email
  const fetchArguments = async (cognitoUserEmail) => {
    try {
      const response = await axios.get('http://localhost:5000/get_active_arguments', {
        params: { user_email: cognitoUserEmail }
      });
      setArgumentsList(response.data);  // Update state with arguments list
      console.log("Arguments fetched with:", response.data);
    } catch (error) {
      console.error('Error fetching arguments:', error);
    }
  };

  // Combined logic for fetching user email and arguments
  useEffect(() => {
    const getUserEmailAndFetchArguments = async () => {
      try {
        const email = await fetchUserEmail();
        if (email.includes('@')) {  // Check if email is valid
          await fetchArguments(email);  // Fetch arguments with valid email
        } else {
          console.log("Invalid email format");
        }
      } catch (err) {
        console.error("Error in fetching process:", err);
      }
    };

    getUserEmailAndFetchArguments();
  }, []);  // Empty dependency array to run once on mount

  // Fetch arguments whenever userEmail changes and is valid
  useEffect(() => {
    if (userEmail.includes('@')) {
      fetchArguments(userEmail);
    }
  }, [userEmail]);  // Dependency array to run when userEmail changes


  const handleInitiate = async () => {

    try {
      if (userEmail){

      const argumentSubmitData = {
        user_id: userEmail,  // This is dynamically set based on logged-in user
        spouse_email: spouseEmail,
        argument_topic: argumentTopic,
      };

      const response = await axios.post('http://localhost:5000/submit_argument', argumentSubmitData);
      // const response = await axios.post('https://w9m5djztk6.execute-api.eu-west-1.amazonaws.com/Dev', argumentSubmitData, {
      //   headers: {
      //     'Content-Type': 'application/json'
      //   }
      // });

      console.log('API call successful:', response.data);
      setInitiated(true);
      }

      else {
        document.write("Wait for WavOver to fetch your user email");
      }
      // You can add more success handling here if needed
    } catch (error) {
      if (error.response) {
        // The request was made and the server responded with a status code
        // that falls out of the range of 2xx
        console.log(error.response.data);
        console.log(error.response.status);
        console.log(error.response.headers);
      } else if (error.request) {
        // The request was made but no response was received
        console.log(error.request);
      } else {
        // Something happened in setting up the request that triggered an Error
        console.log('Error', error.message);
      }
      console.log(error.config);
    
    }
    
  };


  return (
    <div>
      <h1>Start a discussion</h1>
      {!initiated ? (
        <>
          <input type="email" value={spouseEmail} onChange={(e) => setSpouseEmail(e.target.value)} placeholder="Spouse's Email" />
          <input type="text" value={argumentTopic} onChange={(e) => setArgumentTopic(e.target.value)} placeholder="Argument Topic" />
          <button onClick={handleInitiate}>Initiate Argument</button>
        </>
      ) : (
        <p>Argument initiated. Waiting for spouse to join.</p>
      )}
          <div>
      <h1>Current arguments</h1>
      {argumentsList.length === 0 ? (
        <p>No active arguments</p>
      ) : (
        <ul>
          {argumentsList.map((arg) => (
            <li key={arg.argument_topic}>
              <Link to={`/argument/${arg.argument_topic}`}>
                {arg.user_email === userEmail ? arg.spouse_email : arg.user_email} - {arg.argument_topic} - {new Date(arg.deadline).toLocaleString()}
              </Link>
            </li>
          ))}
        </ul>
      )}
    </div>

    </div>
  );
}

export default withAuthenticator(Dashboard);

// {
//   socialProviders: [
//     'google'
//   ]
// }
