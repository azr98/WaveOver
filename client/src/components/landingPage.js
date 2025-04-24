import React from 'react';
import { Link } from 'react-router-dom';
import { useClerk } from '@clerk/clerk-react';
import './landingPage.css';

function LandingPage() {
  const { signUp } = useClerk();

  return (
    <div className="landing-container">
      {/* Hero Section */}
      <section className="hero-section">
        <div className="hero-content">
          <h1 className="hero-title">
            Talk It Out — Without Talking Over Each Other
          </h1>
          <p className="hero-subtitle">
            Put the pause button on heated emotions.
            Our app gives you and someone close to you 3 calm days to write your thoughts, 
            process emotions, and resolve tension — all without interrupting or being interrupted.
          </p>
          <div className="cta-buttons">
            <button 
              className="primary-button"
              onClick={() => signUp()}
            >
              Start Free Today
            </button>
            <Link to="/how-it-works" className="secondary-button">
              Learn More
            </Link>
          </div>
        </div>
      </section>

      {/* How It Works Section */}
      <section className="how-it-works">
        <h2>💡 How It Works</h2>
        <div className="steps-container">
          <div className="step">
            <div className="step-number">1</div>
            <h3>Invite Your Person</h3>
            <p>Sign up and drop in the email of your partner, friend, family member, or colleague — along with the topic of discussion.</p>
          </div>
          <div className="step">
            <div className="step-number">2</div>
            <h3>They Get Notified</h3>
            <p>Your invitee receives an email letting them know you want to talk something out (calmly). If they already use the app, they just get the invite straight away.</p>
          </div>
          <div className="step">
            <div className="step-number">3</div>
            <h3>3 Days to Write It Out</h3>
            <p>Once both sides are in, the 3-day timer starts. Each person gets their own private editor to write everything they want to say — honestly and uninterrupted.</p>
          </div>
          <div className="step">
            <div className="step-number">4</div>
            <h3>Automated Nudges</h3>
            <p>Smart, friendly reminders hit both inboxes at:
              <ul>
                <li>2 days left ⏳</li>
                <li>1 day left ⏰</li>
                <li>12 hours left 🔔</li>
                <li>4 hours left ⚡</li>
              </ul>
            </p>
          </div>
          <div className="step">
            <div className="step-number">5</div>
            <h3>Get Each Other's Words</h3>
            <p>When time's up, your words are sent simultaneously via email to each other. That's it. No pressure. No judgment. Just clarity.</p>
          </div>
        </div>
      </section>

      {/* Benefits Section */}
      <section className="benefits">
        <h2>✅ Why People Love It</h2>
        <div className="benefits-grid">
          <div className="benefit-card">
            <h3>Let emotions settle</h3>
            <p>Take time to process before responding</p>
          </div>
          <div className="benefit-card">
            <h3>Fully process thoughts</h3>
            <p>Write without pressure or interruption</p>
          </div>
          <div className="benefit-card">
            <h3>Avoid interruptions</h3>
            <p>No more talking over each other</p>
          </div>
          <div className="benefit-card">
            <h3>Clear communication</h3>
            <p>Express yourself without saying it out loud</p>
          </div>
        </div>
      </section>
    </div>
  );
}

export default LandingPage;