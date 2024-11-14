import React, { useEffect, useState } from 'react';
import axios from 'axios';
import { Link } from "react-router-dom";
import cognito_config from '../amplifyconfiguration.json'
import { Amplify } from 'aws-amplify';
import { getCurrentUser , fetchUserAttributes } from '@aws-amplify/auth';
import '@aws-amplify/ui-react/styles.css';
import { withAuthenticator} from '@aws-amplify/ui-react';
import { useNavigate } from 'react-router-dom';

Amplify.configure(cognito_config);

function Dashboard() {
  const [spouseEmail, setSpouseEmail] = useState('');
  const [argumentTopic, setArgumentTopic] = useState('');
  const [initiated, setInitiated] = useState(false);
  const [userEmail, setUserEmail] = useState('');
  const [argumentsList, setArgumentsList] = useState(['No active arguments']);
  const [selectedArgument, setSelectedArgument] = useState(null);
  const navigate = useNavigate();

  // Function to fetch logged in user email
  const fetchUserEmail = async () => {
    try {
      const userAttributes = await fetchUserAttributes();
      if (userAttributes.email) {
        console.log("Pulled email", userAttributes.email);
        return userAttributes.email;  // Return the email instead of setting state
      } else {
        console.log("Error: User email not found in attributes");
        throw new Error("User email not found");
      }
    } catch (err) {
      console.error("Error fetching user data:", err);
      throw err;
    }
  };

  // Function to fetch arguments based on logged in user email
  const fetchArguments = async (cognitoUserEmail) => {
    try {
      const response = await axios.get('http://localhost:5000/get_active_arguments', {
        params: { user_email: cognitoUserEmail }
      });
      console.log("fetchArguments response", response.data);
      const items = response.data;
      if (!items || items.length === 0) {
        console.log("No active arguments found for user");
        setArgumentsList(['No active arguments']);
        return;
      }
      
      // Parse the DynamoDB response. Set response based on who is logged in
      const parsedArguments = items.map(arg => {
        let argumentObject = {
          argument_topic: arg.argument_topic.S,
          user_email: arg.user_email.S,
          spouse_email: arg.spouse_email.S,
          last_email_sent: arg.last_email_sent.S,
          argument_deadline: arg.argument_deadline.S,
          submission_time: arg.submission_time.S 
        };

        console.log("userEmail in dashboard", cognitoUserEmail);
        if (cognitoUserEmail === arg.user_email.S) {
          argumentObject.user_response = arg.user_response.S
        } else {
          argumentObject.spouse_response = arg.spouse_response.S
        }
        
        return argumentObject;
      });
      
      setArgumentsList(parsedArguments);
      console.log("setArgumentsList updated with:", parsedArguments);
    } catch (error) {
      console.error('Error fetching arguments:', error);
      setArgumentsList(['No active arguments']);
    }
  };

  const getUserEmailAndFetchArguments = async () => {
    try {
      const email = await fetchUserEmail();
      setUserEmail(email);  // Set the userEmail state here
      console.log("userEmail in dashboard fetchUserEmail", email);
      if (email.includes('@')) {
        await fetchArguments(email);
        return
      } else {
        console.log("Invalid email format");
      }
    } catch (err) {
      console.error("Error in fetching process:", err);
    }
  };

  // Chain fetching user email and arguments list async
  useEffect(() => {
    getUserEmailAndFetchArguments();
    // console.log("getUserEmailAndFetchArguments argumentsList", argumentsList);
  }, []);  // Empty dependency array to run once on mount


  const handleInitiate = async () => {
    try {
      if (userEmail) {
        const argumentSubmitData = {
          user_email: userEmail,  // This is dynamically set based on logged-in user
          spouse_email: spouseEmail,
          argument_topic: argumentTopic
        };

        const response = await axios.post('http://localhost:5000/submit_argument', argumentSubmitData);
        console.log('API call successful:', response.data);
        setInitiated(true);

        // Call getUserEmailAndFetchArguments to reload arguments
        await getUserEmailAndFetchArguments();
      } else {
        document.write("Wait for WavOver to fetch your user email");
      }
    } catch (error) {
      console.error('Error initiating argument:', error);
    }
  };

  const handleArgumentClick = (argument) => {
    console.log("handleArgumentClick argument", argument);
    navigate(`/argument/${encodeURIComponent(argument.argument_topic)}/${encodeURIComponent(argument.submission_time)}`, { state: { argument, userEmail } });
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
      {argumentsList == 'No active arguments' ? (
        <p>No active arguments</p>
      ) : (
        <ul>
          {argumentsList.map((arg) => (
            <li key={arg.argument_topic}>
              <Link 
                to={`/argument/${encodeURIComponent(arg.argument_topic)}/${encodeURIComponent(arg.submission_time)}`}
                onClick={(e) => {
                  e.preventDefault();
                  handleArgumentClick(arg);
                }}
              >
                Contact : {arg.user_email === userEmail ? arg.spouse_email : arg.user_email} | Topic: {arg.argument_topic} | Deadline: {arg.argument_deadline ? new Date(arg.argument_deadline).toLocaleString() : 'Will be set an hour after the contact signs up'} | Status: {arg.last_email_sent}
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
