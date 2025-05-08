"use client";
// Next.js dashboard page, refactored from src/components/dashboard.js
import { useEffect, useState } from "react";
import { useUser, useClerk } from "@clerk/nextjs";
import { useRouter } from "next/navigation";
import Header from "../../components/Header";
import "../../components/css/dashboard.css";

export default function DashboardPage() {
  const [spouseEmail, setSpouseEmail] = useState("");
  const [argumentTopic, setArgumentTopic] = useState("");
  const [initiated, setInitiated] = useState(false);
  const [showSubmitForm, setShowSubmitForm] = useState(true);
  const [argumentsList, setArgumentsList] = useState(["No active arguments"]);
  const [selectedArgument, setSelectedArgument] = useState(null);
  const [activeFilter, setActiveFilter] = useState("active");
  const [showFinishedDialog, setShowFinishedDialog] = useState(false);
  const [showAcceptanceDialog, setShowAcceptanceDialog] = useState(false);
  const [selectedPendingArgument, setSelectedPendingArgument] = useState(null);
  const [notification, setNotification] = useState(null);
  const [activeView, setActiveView] = useState("display");
  const router = useRouter();
  const { user } = useUser();
  const { signOut } = useClerk();

  const getUserEmail = () => {
    return user && user.emailAddresses && user.emailAddresses.length > 0 ? user.emailAddresses[0].emailAddress : '';
  };

  const fetchArguments = async (userEmail) => {
    try {
      const response = await axios.get("/api/get_active_arguments", {
        params: { user_email: userEmail },
      });
      const items = response.data;
      if (!items || items.length === 0) {
        setArgumentsList(["No active arguments"]);
        return;
      }
      const parsedArguments = items.map((arg) => {
        const spouseAccepted = arg.spouse_accepted?.BOOL ?? false;
        const argumentFinished = arg.argument_finished?.BOOL ?? false;
        let argumentObject = {
          argument_topic: arg.argument_topic?.S || '',
          user_email: arg.user_email?.S || '',
          spouse_email: arg.spouse_email?.S || '',
          last_email_sent: arg.last_email_sent?.S || '',
          argument_deadline: arg.argument_deadline?.S || '',
          submission_time: arg.submission_time?.S || '',
          spouse_accepted: spouseAccepted,
          argument_finished: argumentFinished,
          user_firstname: arg.user_firstname?.S || '',
          user_lastname: arg.user_lastname?.S || '',
          spouse_firstname: arg.spouse_firstname?.S || '',
          spouse_lastname: arg.spouse_lastname?.S || '',
        };
        if (userEmail === arg.user_email?.S) {
          argumentObject.user_response = arg.user_response?.S || '';
        } else {
          argumentObject.spouse_response = arg.spouse_response?.S || '';
        }
        return argumentObject;
      });
      setArgumentsList(parsedArguments);
    } catch (error) {
      setArgumentsList(["No active arguments"]);
    }
  };

  const getArgumentCounts = () => {
    if (!Array.isArray(argumentsList) || argumentsList[0] === "No active arguments") {
      return { active: 0, pending: 0, finished: 0, total: 0 };
    }
    return argumentsList.reduce((counts, argument) => {
      const isActive = argument.spouse_accepted && !argument.argument_finished;
      const isPending = !argument.spouse_accepted;
      const isFinished = argument.argument_finished;
      if (isActive) counts.active++;
      if (isPending) counts.pending++;
      if (isFinished) counts.finished++;
      counts.total++;
      return counts;
    }, { active: 0, pending: 0, finished: 0, total: 0 });
  };

  const getFilteredArguments = () => {
    if (!Array.isArray(argumentsList) || argumentsList[0] === "No active arguments") {
      return [];
    }
    return argumentsList.filter((argument) => {
      const isActive = argument.spouse_accepted && !argument.argument_finished;
      const isPending = !argument.spouse_accepted;
      const isFinished = argument.argument_finished;
      switch (activeFilter) {
        case "active":
          return isActive;
        case "pending":
          return isPending;
        case "finished":
          return isFinished;
        default:
          return true;
      }
    });
  };

  useEffect(() => {
    if (user) {
      fetchArguments(getUserEmail()).then(() => {
        const counts = getArgumentCounts();
        if (counts.active > 0) {
          setActiveView("display");
          setActiveFilter("active");
        } else if (counts.pending > 0) {
          setActiveView("display");
          setActiveFilter("pending");
        } else {
          setActiveView("submit");
        }
      });
    }
  }, [user]);

  const handleInitiate = async () => {
    try {
      if (user) {
        const argumentSubmitData = {
          user_email: getUserEmail(),
          user_firstname: user.firstName,
          user_lastname: user.lastName,
          spouse_email: spouseEmail,
          spouse_firstname: '',
          spouse_lastname: '',
          argument_topic: argumentTopic,
        };
        const response = await axios.post("/api/submit_argument", argumentSubmitData);
        setInitiated(true);
        setShowSubmitForm(false);
        setSpouseEmail("");
        setArgumentTopic("");
        await fetchArguments(getUserEmail());
      }
    } catch (error) {}
  };

  const handleArgumentClick = (argument) => {
    if (argument.argument_finished) {
      setSelectedArgument(argument);
      setShowFinishedDialog(true);
    } else if (argument.spouse_accepted) {
      router.push(`/argument/${encodeURIComponent(argument.argument_topic)}/${encodeURIComponent(argument.submission_time)}`);
    }
  };

  const handleReadResponse = (isUserResponse) => {
    const response = isUserResponse ? selectedArgument.user_response : selectedArgument.spouse_response;
    setShowFinishedDialog(false);
    router.push('/view-response'); // You may want to pass state via query params or context
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
        accepted: accepted,
        spouse_firstname: user.firstName,
        spouse_lastname: user.lastName
      });
      if (response.status === 200) {
        const updatedArguments = argumentsList.map(arg => {
          if (arg.submission_time === selectedPendingArgument.submission_time) {
            return { ...arg, spouse_accepted: accepted };
          }
          return arg;
        });
        setArgumentsList(updatedArguments);
        setSelectedPendingArgument(null);
        setShowAcceptanceDialog(false);
        if (accepted) {
          setActiveFilter('active');
          setNotification({
            message: 'Discussion now active. Write away!',
            topic: selectedPendingArgument.argument_topic
          });
          setTimeout(() => {
            setNotification(null);
          }, 5000);
        }
      }
    } catch (error) {}
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

  const formatDateWithOrdinal = (dateString) => {
    const date = new Date(dateString);
    const days = ['Sun', 'Mon', 'Tue', 'Wed', 'Thu', 'Fri', 'Sat'];
    const months = ['January', 'February', 'March', 'April', 'May', 'June', 
                   'July', 'August', 'September', 'October', 'November', 'December'];
    const dayOfWeek = days[date.getDay()];
    const day = date.getDate();
    const month = months[date.getMonth()];
    const year = date.getFullYear();
    const getOrdinalSuffix = (n) => {
      const s = ['th', 'st', 'nd', 'rd'];
      const v = n % 100;
      return n + (s[(v - 20) % 10] || s[v] || s[0]);
    };
    const hours = date.getHours();
    const minutes = date.getMinutes();
    const ampm = hours >= 12 ? 'PM' : 'AM';
    const formattedHours = hours % 12 || 12;
    const formattedMinutes = minutes.toString().padStart(2, '0');
    return `${dayOfWeek} ${getOrdinalSuffix(day)} ${month} ${year} - ${formattedHours}:${formattedMinutes} ${ampm}`;
  };

  if (!user) {
    return <div className="loading">Loading...</div>;
  }

  return (
    <div className="dashboard-container">
      <Header />
      <div className="dashboard-content">
        <div className="main-view-toggle">
          <button 
            className={`main-toggle-button ${activeView === 'submit' ? 'active' : ''}`}
            onClick={() => setActiveView('submit')}
          >
            Submit New Discussion
          </button>
          <button 
            className={`main-toggle-button ${activeView === 'display' ? 'active' : ''}`}
            onClick={() => setActiveView('display')}
          >
            Display Current Discussions ({getArgumentCounts().total})
          </button>
        </div>
        <p style={{ color: 'red', marginTop: '20px', fontSize: '0.9em', textAlign: 'center' }}>
          Always check your spam/junk folder for WaveOver app emails and mark as not spam. WaveOver will only send you the emails for the web app. No spam, no marketing.
        </p>
        {notification && (
          <div className="notification-banner">
            <p>{notification.message}</p>
            <p className="notification-topic">{notification.topic}</p>
          </div>
        )}
        {activeView === 'submit' ? (
          <section className="new-argument-section">
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
        ) : (
          <section className="active-arguments-section">
            <div className="filter-buttons">
              <button 
                className={`filter-button ${activeFilter === 'active' ? 'active' : ''}`}
                onClick={() => setActiveFilter('active')}
              >
                Active ({getArgumentCounts().active})
              </button>
              <button 
                className={`filter-button ${activeFilter === 'pending' ? 'active' : ''}`}
                onClick={() => setActiveFilter('pending')}
              >
                Pending ({getArgumentCounts().pending})
              </button>
              <button 
                className={`filter-button ${activeFilter === 'finished' ? 'active' : ''}`}
                onClick={() => setActiveFilter('finished')}
              >
                Finished ({getArgumentCounts().finished})
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
                    <p className="partner-email">
                      With: {argument.spouse_accepted || argument.argument_finished ? 
                        (getUserEmail() === argument.user_email ? 
                          `${argument.spouse_firstname} ${argument.spouse_lastname}` : 
                          `${argument.user_firstname} ${argument.user_lastname}`) :
                        (getUserEmail() === argument.user_email ? 
                          argument.spouse_email : 
                          argument.user_email)}
                    </p>
                    <div className="argument-status">
                      <span className={`status-badge ${argument.argument_finished ? 'finished' : argument.spouse_accepted ? 'active' : 'pending'}`}>
                        {argument.argument_finished ? 'Finished' : argument.spouse_accepted ? 'Active' : 'Pending'}
                      </span>
                      {getStatusMessage(argument) && (
                        <span className="status-text">{getStatusMessage(argument)}</span>
                      )}
                      {argument.argument_deadline && !argument.argument_finished && (
                        <span className="deadline">
                          Deadline: {formatDateWithOrdinal(argument.argument_deadline)}
                        </span>
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
        )}
        <div className="help-link-container">
          <a href="/help" className="help-link">
            Detailed help
          </a>
        </div>
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