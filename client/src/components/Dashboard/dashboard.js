import React, { useState } from 'react';

function Dashboard() {
  const [userName, setUserName] = useState('');
  const [spouseName, setSpouseName] = useState('');
  const [spouseEmail, setSpouseEmail] = useState('');
  const [issueHeadline, setIssue] = useState('');

  const handleSubmit = async (event) => {
    event.preventDefault();

    const formData = {
        user_email: userName,
        spouse_email: spouseName,
        issue_headline: issueHeadline
    };

    try {
        const response = await fetch('http://localhost:5000/submit_form', {
            method: 'POST',
            headers: {
                'Content-Type': 'application/json',
            },
            body: JSON.stringify(formData),
        });

        const responseData = await response.json();
        console.log(responseData);
        // Handle success (e.g., navigate to another page or show a success message)
    } catch (error) {
        console.error('Error submitting form:', error);
        // Handle errors (e.g., show error message to the user)
    }
};
  return (
    <div>
      <h1>Dashboard</h1>
      <form onSubmit={handleSubmit}>
        <input
          type="text"
          value={userName}
          onChange={(e) => setUserName(e.target.value)}
          placeholder="Your Name"
          required
        />
        <input
          type="text"
          value={spouseName}
          onChange={(e) => setSpouseName(e.target.value)}
          placeholder="Spouse's Name"
          required
        />
        <input
          type="email"
          value={spouseEmail}
          onChange={(e) => setSpouseEmail(e.target.value)}
          placeholder="Spouse's Email"
          required
        />
        <input
          type="text"
          value={issueHeadline}
          onChange={(e) => setIssue(e.target.value)}
          placeholder="Issue Headline"
          required
        />
        <button type="submit">Start WaveOver Process</button>
      </form>
      {/* Timer and Email Form components will be integrated here */}
    </div>
  );
}

export default Dashboard;
