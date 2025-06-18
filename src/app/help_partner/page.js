"use client";
// Next.js help page for spouse/partner, styled like help/page.js
import "../custom.css";
import Header from "../../components/Header";

export default function HelpSpousePage() {
  return (
    <div className="help-container">
      <Header />
      <div className="help-content">
        <h2>1. Accept the Discussion</h2>
        <p>
          Click on the discussion in the 'Pending' section and accept it.
        </p>
        <img src="/help/2.png" alt="Pending discussion in dashboard" style={{maxWidth: '100%', margin: '24px 0'}} />

        <h2>2. Write down what you want to say</h2>
        <p>
          The discussion will now be in the 'Active' section. Click on it to open the editor. Both of you have 3 days to write your response. You can edit and save as much as you like until the deadline.
        </p>
        <p>
          You will both receive reminder emails about this discussion 2 days, 1 day, 12 hours and 4 hours before the deadline. All you need to focus on is your writing and WaveOver takes care of the rest!
        </p>
        <img src="/help/3.png" alt="Active discussion editor" style={{maxWidth: '100%', margin: '24px 0'}} />

        <h2>4. Time is up!</h2>
        <p>
          Each of your response is emailed to the other automatically. You can also view what both of you wrote for discussion in the 'Finished' tab.
        </p>
      </div>
    </div>
  );
} 