import React, { useState } from 'react';
import axios from 'axios';
import { useUser } from '@clerk/clerk-react';

const BugReportForm = () => {
  const { user } = useUser();
  const [isOpen, setIsOpen] = useState(false);
  const [title, setTitle] = useState('');
  const [message, setMessage] = useState('');
  const [isSubmitting, setIsSubmitting] = useState(false);
  const [submitStatus, setSubmitStatus] = useState(null);
  const [isBug, setIsBug] = useState(true);
  const [bugSeverity, setBugSeverity] = useState('major');

  const handleSubmit = async (e) => {
    e.preventDefault();
    setIsSubmitting(true);
    setSubmitStatus(null);

    try {
      const response = await axios.post('/api/report', {
        user_id: user.id,
        title: title,
        message: message,
        is_bug: isBug,
        bug_severity: isBug ? bugSeverity : null,
        timestamp: new Date().toISOString()
      });

      setSubmitStatus('success');
      setTitle('');
      setMessage('');
      setTimeout(() => setIsOpen(false), 2000);
    } catch (error) {
      setSubmitStatus('error');
      console.error('Error submitting report:', error);
    } finally {
      setIsSubmitting(false);
    }
  };

  if (!user) return null;

  return (
    <div style={{
      position: 'fixed',
      bottom: '20px',
      right: '20px',
      zIndex: 1000
    }}>
      <button
        onClick={() => setIsOpen(!isOpen)}
        style={{
          padding: '10px 20px',
          backgroundColor: '#007bff',
          color: 'white',
          border: 'none',
          borderRadius: '5px',
          cursor: 'pointer'
        }}
      >
        Report
      </button>

      {isOpen && (
        <div style={{
          position: 'fixed',
          bottom: '70px',
          right: '20px',
          backgroundColor: 'white',
          padding: '20px',
          borderRadius: '5px',
          boxShadow: '0 2px 10px rgba(0,0,0,0.1)',
          width: '400px'
        }}>
          <div style={{ display: 'flex', alignItems: 'center', marginBottom: '15px' }}>
            <span style={{ marginRight: '8px' }}>I want to report</span>
            <select
              value={isBug ? 'a bug' : 'product feedback'}
              onChange={(e) => {
                setIsBug(e.target.value === 'a bug');
                if (e.target.value !== 'a bug') {
                  setBugSeverity('major'); // Reset severity when switching to feedback
                }
              }}
              style={{
                padding: '5px',
                borderRadius: '4px',
                border: '1px solid #ddd'
              }}
            >
              <option value="product feedback">product feedback</option>
              <option value="a bug">a bug</option>
            </select>
          </div>
          {isBug && (
            <div style={{ 
              marginBottom: '15px',
              display: 'flex',
              alignItems: 'center',
              flexWrap: 'nowrap'
            }}>
              <span style={{ marginRight: '8px', whiteSpace: 'nowrap' }}>Bug Severity:</span>
              <div style={{ display: 'flex', gap: '15px' }}>
                <label style={{ whiteSpace: 'nowrap' }}>
                  <input
                    type="radio"
                    value="major"
                    checked={bugSeverity === 'major'}
                    onChange={(e) => setBugSeverity(e.target.value)}
                    style={{ marginRight: '5px' }}
                  />
                  Major Bug
                </label>
                <label style={{ whiteSpace: 'nowrap' }}>
                  <input
                    type="radio"
                    value="minor"
                    checked={bugSeverity === 'minor'}
                    onChange={(e) => setBugSeverity(e.target.value)}
                    style={{ marginRight: '5px' }}
                  />
                  Minor Bug
                </label>
              </div>
            </div>
          )}
          <form onSubmit={handleSubmit}>
            <input
              type="text"
              value={title}
              onChange={(e) => setTitle(e.target.value)}
              placeholder="Title"
              style={{
                width: '100%',
                padding: '8px',
                marginBottom: '10px',
                border: '1px solid #ddd',
                borderRadius: '4px'
              }}
              required
            />
            <textarea
              value={message}
              onChange={(e) => setMessage(e.target.value)}
              placeholder="Describe the bug..."
              style={{
                width: '100%',
                minHeight: '100px',
                marginBottom: '10px',
                padding: '8px',
                border: '1px solid #ddd',
                borderRadius: '4px'
              }}
              required
            />
            <div style={{ display: 'flex', justifyContent: 'space-between' }}>
              <button
                type="submit"
                disabled={isSubmitting}
                style={{
                  padding: '8px 16px',
                  backgroundColor: '#28a745',
                  color: 'white',
                  border: 'none',
                  borderRadius: '5px',
                  cursor: 'pointer'
                }}
              >
                {isSubmitting ? 'Submitting...' : 'Submit'}
              </button>
              <button
                type="button"
                onClick={() => setIsOpen(false)}
                style={{
                  padding: '8px 16px',
                  backgroundColor: '#dc3545',
                  color: 'white',
                  border: 'none',
                  borderRadius: '5px',
                  cursor: 'pointer'
                }}
              >
                Cancel
              </button>
            </div>
          </form>
          {submitStatus === 'success' && (
            <p style={{ color: 'green', marginTop: '10px' }}>Report submitted successfully!</p>
          )}
          {submitStatus === 'error' && (
            <p style={{ color: 'red', marginTop: '10px' }}>Error submitting report. Please try again.</p>
          )}
        </div>
      )}
    </div>
  );
};

export default BugReportForm;
