"use client";
// Next.js dashboard page, refactored from src/components/dashboard.js
import { useEffect, useState } from "react";
import { useUser, useClerk, SignedIn, SignedOut, UserButton } from "@clerk/nextjs";
import { useRouter } from "next/navigation";
import Header from "../../components/Header";
import axios from "axios";

export default function DashboardPage() {
  const [spouseEmail, setSpouseEmail] = useState("");
  const [argumentTopic, setArgumentTopic] = useState("");
  const [initiated, setInitiated] = useState(false);
  const [showSubmitForm, setShowSubmitForm] = useState(true);
  const [argumentsList, setArgumentsList] = useState({ arguments: [] });
  const [selectedArgument, setSelectedArgument] = useState(null);
  const [activeFilter, setActiveFilter] = useState("active");
  const [showFinishedDialog, setShowFinishedDialog] = useState(false);
  const [showAcceptanceDialog, setShowAcceptanceDialog] = useState(false);
  const [selectedPendingArgument, setSelectedPendingArgument] = useState(null);
  const [notification, setNotification] = useState(null);
  const [activeView, setActiveView] = useState("display");
  const [currentPage, setCurrentPage] = useState(1);
  const [pageSize] = useState(6); // Number of arguments per page
  const [showSelfInviteDialog, setShowSelfInviteDialog] = useState(false);
  const [showInviteConfirmDialog, setShowInviteConfirmDialog] = useState(false);
  const [pendingSubmit, setPendingSubmit] = useState(false);
  const router = useRouter();
  const { user } = useUser();
  const { signOut } = useClerk();

  const getUserEmail = () => {
    return user && user.emailAddresses && user.emailAddresses.length > 0 ? user.emailAddresses[0].emailAddress : '';
  };

  const fetchArguments = async () => {
    try {
      const userEmail = getUserEmail();
      const response = await axios.get(`/api/get_active_arguments?user_email=${userEmail}`);
      console.log("[API] get_active_arguments response:", response.data);
      setArgumentsList(response.data);
    } catch (error) {
      console.error("Error fetching arguments:", error);
      setArgumentsList({ arguments: [] });
    }
  };

  const isArgumentFinished = (argument) => {
    if (argument.argument_finished) return true;
    if (argument.argument_deadline) {
      const deadline = new Date(argument.argument_deadline);
      const now = new Date();
      return now > deadline;
    }
    return false;
  };

  const getArgumentCounts = () => {
    if (!Array.isArray(argumentsList.arguments) || argumentsList.arguments.length === 0) {
      return { active: 0, pending: 0, finished: 0, total: 0 };
    }
    return argumentsList.arguments.reduce((counts, argument) => {
      const isActive = argument.spouse_accepted && !isArgumentFinished(argument);
      const isPending = !argument.spouse_accepted;
      const isFinished = isArgumentFinished(argument);
      if (isActive) counts.active++;
      if (isPending) counts.pending++;
      if (isFinished) counts.finished++;
      counts.total++;
      return counts;
    }, { active: 0, pending: 0, finished: 0, total: 0 });
  };

  const getFilteredArguments = () => {
    if (!Array.isArray(argumentsList.arguments) || argumentsList.arguments.length === 0) {
      return [];
    }
    return argumentsList.arguments.filter((argument) => {
      const isActive = argument.spouse_accepted && !isArgumentFinished(argument);
      const isPending = !argument.spouse_accepted;
      const isFinished = isArgumentFinished(argument);
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

  const filteredArguments = getFilteredArguments();
  const totalPages = Math.ceil(filteredArguments.length / pageSize);
  const paginatedArguments = filteredArguments.slice((currentPage - 1) * pageSize, currentPage * pageSize);

  useEffect(() => {
    if (user) {
      fetchArguments();
    }
  }, [user]);

  useEffect(() => {
    setCurrentPage(1);
  }, [activeFilter, argumentsList]);

  const handleInitiate = async () => {
    if (user && spouseEmail.trim().toLowerCase() === getUserEmail().trim().toLowerCase()) {
      setShowSelfInviteDialog(true);
      return;
    }
    setShowInviteConfirmDialog(true);
    setPendingSubmit(true);
  };

  const confirmSubmitArgument = async () => {
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
        setShowInviteConfirmDialog(false);
        setPendingSubmit(false);
        await fetchArguments();
      }
    } catch (error) {
      setShowInviteConfirmDialog(false);
      setPendingSubmit(false);
    }
  };

  const handleArgumentClick = (argument) => {
    if (argument.argument_finished) {
      setSelectedArgument(argument);
      setShowFinishedDialog(true);
    } else if (argument.spouse_accepted) {
      console.log("Navigating to argumentPage with:", {
        user_email: argument.user_email,
        submission_time: argument.submission_time,
        fullUrl: `/argument/${encodeURIComponent(argument.user_email)}/${encodeURIComponent(argument.submission_time)}`
      });
      router.push(
        `/argument/${encodeURIComponent(argument.user_email)}/${encodeURIComponent(argument.submission_time)}`,
        { state: { argument } }
      );
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
    if (!accepted) {
      setShowAcceptanceDialog(false);
      setSelectedPendingArgument(null);
      return;
    }
    try {
      const response = await axios.post('/api/update_spouse_acceptance', {
        user_email: selectedPendingArgument.user_email,
        submission_time: selectedPendingArgument.submission_time,
        accepted: true,
        spouse_firstname: user.firstName,
        spouse_lastname: user.lastName
      });
      if (response.status === 200) {
        const updatedArguments = argumentsList.arguments.map(arg => {
          if (
            arg.user_email === selectedPendingArgument.user_email &&
            arg.submission_time === selectedPendingArgument.submission_time
          ) {
            return { ...arg, spouse_accepted: true };
          }
          return arg;
        });
        setArgumentsList({ arguments: updatedArguments });
        setSelectedPendingArgument(null);
        setShowAcceptanceDialog(false);
        setActiveFilter('active');
        setNotification({
          message: 'Discussion now active. Write away!',
          topic: selectedPendingArgument.argument_topic
        });
        setTimeout(() => {
          setNotification(null);
        }, 5000);
        router.push(`/argument/${encodeURIComponent(selectedPendingArgument.user_email)}/${encodeURIComponent(selectedPendingArgument.submission_time)}?readonly=1`);
      }
    } catch (error) {
      setShowAcceptanceDialog(false);
      setSelectedPendingArgument(null);
    }
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
    return <div className="text-center py-10 text-lg">Loading...</div>;
  }

  return (
    <div className="min-h-screen bg-gray-50">
      {/* User profile button in top right */}
      <SignedIn>
        <div className="fixed top-4 right-4 z-50">
          <UserButton afterSignOutUrl="/" />
        </div>
      </SignedIn>
      <Header />
      <div className="max-w-4xl mx-auto p-4">
        {/* Always show submit form */}
        <section className="bg-white rounded shadow p-4 mt-4 mb-4" style={{ maxWidth: 700, margin: '0 auto' }}>
          {showSubmitForm ? (
            <form className="py-3 px-2">
              <div className="mb-3">
                <label htmlFor="spouseEmail" className="form-label ps-2">Partner's Email</label>
                <input
                  id="spouseEmail"
                  type="email"
                  placeholder="Enter their email address"
                  value={spouseEmail}
                  onChange={(e) => setSpouseEmail(e.target.value)}
                  className="form-control w-75 mx-auto"
                  style={{ minWidth: 300 }}
                />
              </div>
              <div className="mb-3">
                <label htmlFor="argumentTopic" className="form-label ps-2">Discussion Topic</label>
                <input
                  id="argumentTopic"
                  type="text"
                  placeholder="What would you like to discuss?"
                  value={argumentTopic}
                  onChange={(e) => setArgumentTopic(e.target.value)}
                  className="form-control w-75 mx-auto"
                  style={{ minWidth: 300 }}
                />
              </div>
              <button
                onClick={e => { e.preventDefault(); handleInitiate(); }}
                disabled={!spouseEmail || !argumentTopic}
                className="btn btn-primary w-100 mt-2"
                type="button"
              >
                Start Discussion
              </button>
            </form>
          ) : (
            <div className="text-center space-y-4 py-3">
              <p className="text-success">Discussion submitted! Please ensure you and your partner check your spam folders for the invitation email.</p>
              <button onClick={handleStartNewArgument} className="btn btn-outline-primary w-100">
                Start Another Discussion
              </button>
            </div>
          )}
        </section>
        {/* Spam warning message in red */}
        <p className="text-danger mt-4 text-center" style={{ fontWeight: 600 }}>
          Always check your spam/junk folder for WaveOver app emails and mark as not spam. WaveOver will only send you the emails for the web app. No spam, no marketing.
        </p>
        {/* Filter buttons for active, pending, finished */}
        <div className="d-flex justify-content-center mb-4 mt-5" style={{ gap: '0.75rem' }}>
          <button
            className={`btn btn-primary${activeFilter === 'active' ? ' active' : ''}`}
            onClick={() => setActiveFilter('active')}
          >
            Active ({getArgumentCounts().active})
          </button>
          <button
            className={`btn btn-primary${activeFilter === 'pending' ? ' active' : ''}`}
            onClick={() => setActiveFilter('pending')}
          >
            Pending ({getArgumentCounts().pending})
          </button>
          <button
            className={`btn btn-primary${activeFilter === 'finished' ? ' active' : ''}`}
            onClick={() => setActiveFilter('finished')}
          >
            Finished ({getArgumentCounts().finished})
          </button>
        </div>
        {/* Paginated argument cards */}
        <section className="mt-3">
          {paginatedArguments.length > 0 ? (
            <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
              {paginatedArguments.map((argument, index) => (
                <div
                  key={index}
                  className={`rounded shadow p-4 bg-white cursor-pointer border-2 transition-all ${!argument.spouse_accepted ? 'border-yellow-400' : isArgumentFinished(argument) ? 'border-gray-400' : 'border-blue-400 hover:shadow-lg'} mb-4`}
                  style={{ cursor: 'pointer' }}
                  onClick={() => {
                    if (!argument.spouse_accepted) {
                      handlePendingArgumentClick(argument);
                    } else if (isArgumentFinished(argument)) {
                      setSelectedArgument(argument);
                      setShowFinishedDialog(true);
                    } else {
                      handleArgumentClick(argument);
                    }
                  }}
                >
                  <h3 className="font-semibold text-lg mb-1">{argument.argument_topic}</h3>
                  <p className="text-gray-600 text-sm mb-2">
                    With: {argument.spouse_accepted || isArgumentFinished(argument) ?
                      (getUserEmail() === argument.user_email ?
                        `${argument.spouse_firstname} ${argument.spouse_lastname}` :
                        `${argument.user_firstname} ${argument.user_lastname}`) :
                      (getUserEmail() === argument.user_email ?
                        argument.spouse_email :
                        argument.user_email)}
                  </p>
                  <div className="d-flex align-items-center gap-2">
                    <span
                      className={`badge ${isArgumentFinished(argument) ? 'bg-secondary text-white' : argument.spouse_accepted ? 'bg-success text-white' : 'bg-warning text-dark'}`}
                      style={{ fontSize: '1em', fontWeight: 600, padding: '0.5em 1em', borderRadius: '0.5em', marginBottom: 4 }}
                    >
                      {isArgumentFinished(argument) ? 'Finished' : argument.spouse_accepted ? 'Active' : 'Pending'}
                    </span>
                    {argument.argument_deadline && !isArgumentFinished(argument) && (
                      <span className={`text-xs ms-3 ${argument.spouse_accepted ? 'text-danger' : 'text-muted'}`}>Deadline: {formatDateWithOrdinal(argument.argument_deadline)}</span>
                    )}
                  </div>
                </div>
              ))}
            </div>
          ) : (
            <div className="text-center text-gray-500 py-8">
              <p>No {activeFilter} discussions</p>
            </div>
          )}
          {/* Pagination controls */}
          {totalPages > 1 && (
            <nav className="d-flex justify-content-center mt-4">
              <ul className="pagination">
                <li className={`page-item${currentPage === 1 ? ' disabled' : ''}`}>
                  <button className="page-link" onClick={() => setCurrentPage(currentPage - 1)} disabled={currentPage === 1}>&laquo;</button>
                </li>
                {[...Array(totalPages)].map((_, idx) => (
                  <li key={idx} className={`page-item${currentPage === idx + 1 ? ' active' : ''}`}>
                    <button className="page-link" onClick={() => setCurrentPage(idx + 1)}>{idx + 1}</button>
                  </li>
                ))}
                <li className={`page-item${currentPage === totalPages ? ' disabled' : ''}`}>
                  <button className="page-link" onClick={() => setCurrentPage(currentPage + 1)} disabled={currentPage === totalPages}>&raquo;</button>
                </li>
              </ul>
            </nav>
          )}
        </section>
        <div className="flex justify-center mt-8">
          <a href="/help" className="text-blue-600 hover:underline font-medium">
            Detailed help
          </a>
        </div>
        {showFinishedDialog && selectedArgument && (
          <div className="fixed inset-0 bg-black bg-opacity-40 flex items-center justify-center z-50">
            <div className="bg-white rounded-lg shadow-lg p-6 w-full max-w-md">
              <h3 className="font-bold text-lg mb-2">{selectedArgument.argument_topic}</h3>
              <p className="mb-4">Choose which response to view:</p>
              <div className="flex gap-4 mb-4">
                <button onClick={() => setShowFinishedDialog('user')} className="flex-1 btn btn-outline-primary">What you said</button>
                <button onClick={() => setShowFinishedDialog('partner')} className="flex-1 btn btn-outline-secondary">What your partner said</button>
              </div>
              <button className="btn btn-outline-secondary w-full" onClick={() => setShowFinishedDialog(false)}>Close</button>
            </div>
          </div>
        )}
        {(showFinishedDialog === 'user' || showFinishedDialog === 'partner') && selectedArgument && (
          <div className="fixed inset-0 bg-black bg-opacity-40 flex items-center justify-center z-50">
            <div className="bg-white rounded-lg shadow-lg p-6 w-full max-w-md">
              <h3 className="font-bold text-lg mb-2">{selectedArgument.argument_topic}</h3>
              <div className="mb-4" style={{ minHeight: 120, maxHeight: 300, overflowY: 'auto', border: '1px solid #eee', borderRadius: 8, padding: 12 }}>
                {(() => {
                  const userEmail = getUserEmail();
                  if (showFinishedDialog === 'user') {
                    return userEmail === selectedArgument.user_email ? selectedArgument.user_response : selectedArgument.spouse_response;
                  } else {
                    return userEmail === selectedArgument.user_email ? selectedArgument.spouse_response : selectedArgument.user_response;
                  }
                })()}
              </div>
              <button className="btn btn-outline-secondary w-full" onClick={() => setShowFinishedDialog(true)}>Back</button>
            </div>
          </div>
        )}
        {showAcceptanceDialog && selectedPendingArgument && (
          <div className="modal fade show d-block" tabIndex="-1" style={{ background: 'rgba(0,0,0,0.4)' }}>
            <div className="modal-dialog modal-dialog-centered">
              <div className="modal-content">
                <div className="modal-header">
                  <h5 className="modal-title">Accept Discussion Invitation</h5>
                </div>
                <div className="modal-body">
                  <p>Would you like to discuss <b>{selectedPendingArgument.argument_topic}</b> with <b>{selectedPendingArgument.user_firstname} {selectedPendingArgument.user_lastname}</b> on <b>{selectedPendingArgument.user_email}</b>?</p>
                </div>
                <div className="modal-footer">
                  <button className="btn btn-success" onClick={() => handleAcceptanceResponse(true)}>Accept</button>
                  <button className="btn btn-danger" onClick={() => handleAcceptanceResponse(false)}>Reject</button>
                </div>
              </div>
            </div>
          </div>
        )}
        {/* Self-invite dialog */}
        {showSelfInviteDialog && (
          <div className="modal fade show d-block" tabIndex="-1" style={{ background: 'rgba(0,0,0,0.4)' }}>
            <div className="modal-dialog modal-dialog-centered">
              <div className="modal-content">
                <div className="modal-header">
                  <h5 className="modal-title">Invalid Partner Email</h5>
                </div>
                <div className="modal-body">
                  <p>You cannot invite yourself as a partner.</p>
                </div>
                <div className="modal-footer">
                  <button className="btn btn-danger" onClick={() => setShowSelfInviteDialog(false)}>Close</button>
                </div>
              </div>
            </div>
          </div>
        )}
        {/* Invite confirmation dialog */}
        {showInviteConfirmDialog && (
          <div className="modal fade show d-block" tabIndex="-1" style={{ background: 'rgba(0,0,0,0.4)' }}>
            <div className="modal-dialog modal-dialog-centered">
              <div className="modal-content">
                <div className="modal-header">
                  <h5 className="modal-title">Confirm Invitation</h5>
                </div>
                <div className="modal-body">
                  <p>Invite <b>{spouseEmail}</b> to discuss <b>{argumentTopic}</b>?</p>
                </div>
                <div className="modal-footer">
                  <button className="btn btn-success" onClick={confirmSubmitArgument}>Confirm</button>
                  <button className="btn btn-danger" onClick={() => { setShowInviteConfirmDialog(false); setPendingSubmit(false); }}>Back</button>
                </div>
              </div>
            </div>
          </div>
        )}
      </div>
    </div>
  );
} 