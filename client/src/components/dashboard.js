import React, { useEffect, useState } from 'react';
import axios from 'axios';
import { Link } from "react-router-dom";
import { useUser, useClerk } from '@clerk/clerk-react';
import { useNavigate } from 'react-router-dom';

function Dashboard() {
  const [spouseEmail, setSpouseEmail] = useState('');
  const [argumentTopic, setArgumentTopic] = useState('');
  const [initiated, setInitiated] = useState(false);
  const [showSubmitForm, setShowSubmitForm] = useState(true);
  const [argumentsList, setArgumentsList] = useState(['No active arguments']);
  const [selectedArgument, setSelectedArgument] = useState(null);
  const navigate = useNavigate();
  const { user } = useUser();
  const { signOut } = useClerk();

  // Function to fetch arguments based on logged in user email
  const fetchArguments = async (userEmail) => {
    try {
      const response = await axios.get('https://devbackend.waveover.info/get_active_arguments', {
        params: { user_email: userEmail }
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

        console.log("userEmail in dashboard", userEmail);
        if (userEmail === arg.user_email.S) {
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

  useEffect(() => {
    if (user) {
      fetchArguments(user.primaryEmailAddress.emailAddress);
    }
  }, [user]);

  const handleInitiate = async () => {
    try {
      if (user) {
        const argumentSubmitData = {
          user_email: user.primaryEmailAddress.emailAddress,
          spouse_email: spouseEmail,
          argument_topic: argumentTopic
        };

        const response = await axios.post('https://devbackend.waveover.info/submit_argument', argumentSubmitData);
        console.log('API call successful:', response.data);
        setInitiated(true);
        setShowSubmitForm(false);
        // Clear the form fields
        setSpouseEmail('');
        setArgumentTopic('');

        // Reload arguments
        await fetchArguments(user.primaryEmailAddress.emailAddress);
      } else {
        console.error("No user is signed in");
      }
    } catch (error) {
      console.error('Error initiating argument:', error);
    }
  };

  const handleArgumentClick = (argument) => {
    console.log("handleArgumentClick argument", argument);
    navigate(`/argument/${encodeURIComponent(argument.argument_topic)}/${encodeURIComponent(argument.submission_time)}`, 
      { state: { argument, userEmail: user.primaryEmailAddress.emailAddress } }
    );
  };

  const handleStartNewArgument = () => {
    setShowSubmitForm(true);
    setInitiated(false);
  };

  if (!user) {
    return <div>Loading...</div>;
  }

  return (
    <div>
      <h1>Dashboard</h1>
      
      <div>
        <h2>Start a New Argument</h2>
        {showSubmitForm ? (
          <div>
            <input
              type="email"
              placeholder="Spouse's Email"
              value={spouseEmail}
              onChange={(e) => setSpouseEmail(e.target.value)}
            />
            <input
              type="text"
              placeholder="Argument Topic"
              value={argumentTopic}
              onChange={(e) => setArgumentTopic(e.target.value)}
            />
            <button onClick={handleInitiate}>Initiate Argument</button>
          </div>
        ) : (
          <div>
            <p>Argument submitted! Please ensure you and your partner check your spam folders for the invitation email.</p>
            <button onClick={handleStartNewArgument}>Click here to submit another argument</button>
          </div>
        )}
      </div>

      <div>
        <h2>Active Arguments</h2>
        {Array.isArray(argumentsList) && argumentsList[0] !== 'No active arguments' ? (
          <ul>
            {argumentsList.map((argument, index) => (
              <li key={index} onClick={() => handleArgumentClick(argument)}>
                Topic: {argument.argument_topic}
                <br />
                With: {argument.spouse_email}
              </li>
            ))}
          </ul>
        ) : (
          <p>No active arguments</p>
        )}
      </div>
    </div>
  );
}

export default Dashboard;
