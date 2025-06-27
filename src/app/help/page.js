"use client";
// Next.js help page, refactored from src/components/helpPage.js
import "../custom.css";
import Header from "../../components/Header";

export default function HelpPage() {
  return (
    <div className="help-container">
      <Header />
      <div className="help-content">
        <h1>Video walkthrough</h1>
        <div style={{position: 'relative', paddingBottom: '56.25%', height: 0, marginBottom: '32px'}}>
          <iframe
            src="https://www.youtube.com/embed/iN50dlJjIXc"
            title="YouTube video walkthrough"
            style={{position: 'absolute', top: 0, left: 0, width: '100%', height: '100%'}}
            frameBorder="0"
            allow="accelerometer; autoplay; clipboard-write; encrypted-media; gyroscope; picture-in-picture"
            allowFullScreen
          ></iframe>
        </div>
        <h1>Written version</h1>
        <h2>1. Start a Discussion</h2>
        <p>
          Enter your partner's email and the discussion topic.
        </p>
        <img src="/help/1.png" alt="Enter partner email and topic" style={{maxWidth: '100%', margin: '24px 0'}} />
        <p>
          Your partner will receive an invitation email. They need to accept the disucssion in the 'Pending' tab in their dashboard.
          Ensure both of you check spam folders for emails from 'noreply@waveover.info'. As a new web app that email domain's digital reputation is low.
        </p>

        <p>
          Until your partner accepts the discussion it will look like this:
        </p>
        <img src="/help/2.png" alt="Pending discussion in dashboard" style={{maxWidth: '100%', margin: '24px 0'}} />

        <h2>2. Wait for your partner</h2>
        <p>
          Once your partner accepts the discussion you are notified by email and the discussion becomes active.
        </p>
        <img src="/help/spouse_acceptance.png" alt="spouse acceptance email" style={{maxWidth: '100%', margin: '24px 0'}} />

        <h2>3. Write</h2>
        <p>
          Now both of you start writing. To open the editor click on the discussion in 'Active'. 
        </p>
        <p>The editor auto saves; has some formatting features and the timer displayed.
        Both of you have 3 days to write your response. You can edit and save as much as you like until the deadline.</p>
        <img src="/help/3.png" alt="Active discussion editor" style={{maxWidth: '100%', margin: '24px 0'}} />

        <p>
          You both receive reminder emails 2 days, 1 day, 12 hours and 4 hours before the 3 daydeadline.</p>
          <p>All you need to focus on is your writing and WaveOver takes care of the rest! Here are some <a href="/writing">writing tips</a> for this stage</p>
        <h2>4. Time is up!</h2>
        <p>
          Each of your response is emailed to the other automatically. You can also view what both of you wrote for discussion in the 'Finished' tab.
        </p>
      </div>
    </div>
  );
} 