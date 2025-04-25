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
  const [activeFilter, setActiveFilter] = useState('active');
  const [showFinishedDialog, setShowFinishedDialog] = useState(false);
  const [showAcceptanceDialog, setShowAcceptanceDialog] = useState(false);
  const [selectedPendingArgument, setSelectedPendingArgument] = useState(null);
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
    if (argument.argument_finished) {
      setSelectedArgument(argument);
      setShowFinishedDialog(true);
    } else if (argument.spouse_accepted) {
      navigate(`/argument/${encodeURIComponent(argument.argument_topic)}/${encodeURIComponent(argument.submission_time)}`, 
        { state: { argument, userEmail: getUserEmail() } }
      );
    }
  };

  const handleReadResponse = (isUserResponse) => {
    const response = isUserResponse ? selectedArgument.user_response : selectedArgument.spouse_response;
    setShowFinishedDialog(false);
    navigate('/view-response', { state: { response } });
  };

  const handleStartNewArgument = () => {
    setShowSubmitForm(true);
    setInitiated(false);
  };

  const handlePendingArgumentClick = (argument) => {
    const userEmail = getUserEmail();
    if (userEmail === argument.spouse_email && !argument.spouse_accepted) {
      setSelectedPendingArgument(argument);
      setShowAcceptanceDialog(true);
    }
  };

  const handleAcceptanceResponse = async (accepted) => {
    try {
      const response = await axios.post('/api/update_spouse_acceptance', {
        user_email: selectedPendingArgument.user_email,
        submission_time: selectedPendingArgument.submission_time,
        accepted: accepted
      });

      if (response.status === 200) {
        // Refresh the arguments list
        await fetchArguments(getUserEmail());
        setShowAcceptanceDialog(false);
        if (accepted) {
          alert('You can start writing this discussion in the active section');
        }
      }
    } catch (error) {
      console.error('Error updating acceptance status:', error);
    }
  };

  const getFilteredArguments = () => {
    if (!Array.isArray(argumentsList) || argumentsList[0] === 'No active arguments') {
      return [];
    }

    return argumentsList.filter(argument => {
      switch (activeFilter) {
        case 'active':
          return argument.spouse_accepted && !argument.argument_finished;
        case 'pending':
          return !argument.spouse_accepted;
        case 'finished':
          return argument.argument_finished;
        default:
          return true;
      }
    });
  };

  const getStatusMessage = (argument) => {
    const userEmail = getUserEmail();
    if (!argument.spouse_accepted) {
      if (userEmail === argument.user_email) {
        return 'Waiting for partner to accept';
      } else {
        return 'Waiting for you to accept this argument';
      }
    }
    return '';
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

        <div className="help-link-container">
          <Link to="/help" className="help-link">
            Detailed help
          </Link>
        </div>

        <section className="active-arguments-section">
          <h2>Active Discussions</h2>
          <div className="filter-buttons">
            <button 
              className={`filter-button ${activeFilter === 'active' ? 'active' : ''}`}
              onClick={() => setActiveFilter('active')}
            >
              Active
            </button>
            <button 
              className={`filter-button ${activeFilter === 'pending' ? 'active' : ''}`}
              onClick={() => setActiveFilter('pending')}
            >
              Pending
            </button>
            <button 
              className={`filter-button ${activeFilter === 'finished' ? 'active' : ''}`}
              onClick={() => setActiveFilter('finished')}
            >
              Finished
            </button>
          </div>
          {getFilteredArguments().length > 0 ? (
            <div className="arguments-grid">
              {getFilteredArguments().map((argument, index) => (
                <div 
                  key={index} 
                  className={`argument-card ${!argument.spouse_accepted ? 'pending' : ''}`}
                  onClick={() => {
                    if (!argument.spouse_accepted) {
                      handlePendingArgumentClick(argument);
                    } else if (argument.argument_finished) {
                      setSelectedArgument(argument);
                      setShowFinishedDialog(true);
                    } else {
                      handleArgumentClick(argument);
                    }
                  }}
                >
                  <h3>{argument.argument_topic}</h3>
                  <p className="partner-email">With: {argument.spouse_email}</p>
                  <div className="argument-status">
                    <span className={`status-badge ${argument.argument_finished ? 'finished' : argument.spouse_accepted ? 'active' : 'pending'}`}>
                      {argument.argument_finished ? 'Finished' : argument.spouse_accepted ? 'Active' : 'Pending'}
                    </span>
                    {getStatusMessage(argument) && (
                      <span className="status-text">{getStatusMessage(argument)}</span>
                    )}
                    {argument.argument_deadline && !argument.argument_finished && (
                      <span className="deadline">Deadline: {new Date(argument.argument_deadline).toLocaleDateString()}</span>
                    )}
                  </div>
                </div>
              ))}
            </div>
          ) : (
            <div className="no-arguments">
              <p>No {activeFilter} discussions</p>
            </div>
          )}
        </section>

        {showFinishedDialog && selectedArgument && (
          <div className="dialog-overlay">
            <div className="finished-dialog">
              <h3>{selectedArgument.argument_topic}</h3>
              <p>Choose which response to view:</p>
              <div className="dialog-buttons">
                <button onClick={() => handleReadResponse(true)}>
                  Read what you said
                </button>
                <button onClick={() => handleReadResponse(false)}>
                  Read what your partner said
                </button>
              </div>
              <button className="close-dialog" onClick={() => setShowFinishedDialog(false)}>
                Close
              </button>
            </div>
          </div>
        )}

        {showAcceptanceDialog && selectedPendingArgument && (
          <div className="dialog-overlay">
            <div className="acceptance-dialog">
              <h3>Accept Discussion Invitation</h3>
              <p>Would you like to accept this discussion invitation?</p>
              <p className="argument-topic">{selectedPendingArgument.argument_topic}</p>
              <div className="dialog-buttons">
                <button 
                  onClick={() => handleAcceptanceResponse(true)}
                  className="accept-button"
                >
                  Accept
                </button>
                <button 
                  onClick={() => handleAcceptanceResponse(false)}
                  className="reject-button"
                >
                  Reject
                </button>
              </div>
              <button 
                className="close-dialog" 
                onClick={() => setShowAcceptanceDialog(false)}
              >
                Close
              </button>
            </div>
          </div>
        )}
      </div>
    </div>
  );
}

export default Dashboard;