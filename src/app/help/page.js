"use client";
// Next.js help page, refactored from src/components/helpPage.js
import "../custom.css";
import Header from "../../components/Header";

export default function HelpPage() {
  return (
    <div className="help-container">
      <Header />
      <div className="help-content">
        <h2>1. Enter your partner's email and the discussion topic</h2>
        <p>
          Both of you will receive an invitation email. Only your partner needs to accept the disucssion from here.<br/>
          Ensure both of you check spam folders.<br/> Mark the sender email as not spam, as a new web app our email domain's digital reputation is low.
        </p>
        <img src="/help/1.png" alt="Enter partner email and topic" style={{maxWidth: '100%', margin: '24px 0'}} />

        <p>
          Your partner signs up/logs in and accepts the discussion by clicking it in pending. It will look like this until then:
        </p>
        <img src="/help/2.png" alt="Pending discussion in dashboard" style={{maxWidth: '100%', margin: '24px 0'}} />

        <h2>2. Once they accept you are notified by email and the discussion becomes active.</h2>

        <h2>3. Both of you have the same 3 days to write down what you want to say.</h2>
        <p>
          <b>To open the editor click on the discussion in 'Active'</b>. The editor auto saves; has some formatting features and the timer displayed.
        </p>
        <img src="/help/3.png" alt="Active discussion editor" style={{maxWidth: '100%', margin: '24px 0'}} />

        <p>
          You will both receive reminder emails about this discussion 2 days, 1 day, 12 hours and 4 hours before the deadline. All you need to focus on is your writing and WaveOver takes care of the rest!
        </p>
        <h2>4. Time is up!</h2>
        <p>
          Each of your response is emailed to the other automatically. You can also view what both of you wrote for discussion in the 'Finished' tab.
        </p>
      </div>
    </div>
  );
} 