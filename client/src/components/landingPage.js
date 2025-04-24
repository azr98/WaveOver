import React, { useEffect } from 'react';
import { SignedIn, SignedOut, SignInButton, useUser } from '@clerk/clerk-react';
import { useNavigate, Link } from 'react-router-dom';
import './css/landingPage.css';

function LandingPage() {
  const navigate = useNavigate();
  const { isSignedIn } = useUser();

  useEffect(() => {
    if (isSignedIn) {
      navigate('/dashboard');
    }
  }, [isSignedIn, navigate]);

  return (
    <div className="landing-container">
      <SignedOut>
        {/* Hero Section */}
        <section className="hero-section">
          <div className="hero-content">
            <h1 className="hero-title">
              Talk It Out — Without Talking Over Each Other
            </h1>
            <p className="hero-subtitle">
              Resolve conflicts, debates and ideate with a spouse, friend, colleague more effectively with writing
            </p>
            <div className="cta-buttons">
              <SignInButton mode="modal">
                <button className="primary-button">
                  Always free
                </button>
              </SignInButton>
              <a 
                href="https://buymeacoffee.com/azharsharif" 
                target="_blank" 
                rel="noopener noreferrer"
                className="coffee-button"
              >
                <img 
                  src="https://cdn.buymeacoffee.com/buttons/v2/default-yellow.png" 
                  alt="Buy Me A Coffee" 
                  className="coffee-image"
                />
              </a>
            </div>
            <Link to="/help" className="help-link">
              Full walkthrough
            </Link>
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
              <p>Friendly email reminders hit both inboxes at:
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
              <p>Write without pressure or interruption. Come back later and edit with an autosaving editor</p>
            </div>
            <div className="benefit-card">
              <h3>Avoid interruptions</h3>
              <p>No talking over each other</p>
            </div>
            <div className="benefit-card">
              <h3>Actually think</h3>
              <p>Writing makes you think and rethink what you really want believe , really want to say and how you really want to word it</p>
            </div>
          </div>
        </section>
      </SignedOut>
    </div>
  );
}

export default LandingPage;