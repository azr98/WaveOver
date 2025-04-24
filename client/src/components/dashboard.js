import React, { useEffect, useState } from 'react';
import axios from 'axios';
import { Link } from "react-router-dom";
import { useUser, useClerk } from '@clerk/clerk-react';
import { useNavigate } from 'react-router-dom';
import Header from './Header';
import './css/dashboard.css';

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

  // Insert helper function for getting user email right after useUser hook
  const getUserEmail = () => {
    console.log("Email of logged in user", user.emailAddresses);
    return user && user.emailAddresses && user.emailAddresses.length > 0 ? user.emailAddresses[0].emailAddress : '';
  };

  // Function to fetch arguments based on logged in user email
  const fetchArguments = async (userEmail) => {
    try {
      const response = await axios.get('/api/get_active_arguments', {
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
      fetchArguments(getUserEmail());
    }
  }, [user]);

  const handleInitiate = async () => {
    try {
      if (user) {
        const argumentSubmitData = {
          user_email: getUserEmail(),
          spouse_email: spouseEmail,
          argument_topic: argumentTopic
        };

        const response = await axios.post('/api/submit_argument', argumentSubmitData);
        console.log('API call successful:', response.data);
        setInitiated(true);
        setShowSubmitForm(false);
        // Clear the form fields
        setSpouseEmail('');
        setArgumentTopic('');

        // Reload arguments
        await fetchArguments(getUserEmail());
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
      { state: { argument, userEmail: getUserEmail() } }
    );
  };

  const handleStartNewArgument = () => {
    setShowSubmitForm(true);
    setInitiated(false);
  };

  if (!user) {
    return <div className="loading">Loading...</div>;
  }

  return (
    <div className="dashboard-container">
      <Header />
      <div className="dashboard-content">
        <section className="new-argument-section">
          <h2>Start a New Discussion</h2>
          {showSubmitForm ? (
            <div className="argument-form">
              <div className="form-group">
                <label htmlFor="spouseEmail">Partner's Email</label>
                <input
                  id="spouseEmail"
                  type="email"
                  placeholder="Enter their email address"
                  value={spouseEmail}
                  onChange={(e) => setSpouseEmail(e.target.value)}
                />
              </div>
              <div className="form-group">
                <label htmlFor="argumentTopic">Discussion Topic</label>
                <input
                  id="argumentTopic"
                  type="text"
                  placeholder="What would you like to discuss?"
                  value={argumentTopic}
                  onChange={(e) => setArgumentTopic(e.target.value)}
                />
              </div>
              <button 
                onClick={handleInitiate}
                className="submit-button"
                disabled={!spouseEmail || !argumentTopic}
              >
                Start Discussion
              </button>
            </div>
          ) : (
            <div className="success-message">
              <p>Discussion submitted! Please ensure you and your partner check your spam folders for the invitation email.</p>
              <button onClick={handleStartNewArgument} className="new-discussion-button">
                Start Another Discussion
              </button>
            </div>
          )}
        </section>

        <section className="active-arguments-section">
          <h2>Active Discussions</h2>
          {Array.isArray(argumentsList) && argumentsList[0] !== 'No active arguments' ? (
            <div className="arguments-grid">
              {argumentsList.map((argument, index) => (
                <div 
                  key={index} 
                  className="argument-card"
                  onClick={() => handleArgumentClick(argument)}
                >
                  <h3>{argument.argument_topic}</h3>
                  <p className="partner-email">With: {argument.spouse_email}</p>
                  <div className="argument-status">
                    <span className="status-badge">Active</span>
                    <span className="deadline">Deadline: {new Date(argument.argument_deadline).toLocaleDateString()}</span>
                  </div>
                </div>
              ))}
            </div>
          ) : (
            <div className="no-arguments">
              <p>No active discussions</p>
            </div>
          )}
        </section>
      </div>
    </div>
  );
}

export default Dashboard;