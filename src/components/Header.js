"use client";
import "../app/custom.css";
import { useClerk, UserButton, SignedIn } from '@clerk/nextjs';

export default function HeaderNext() {
  return (
    <header className="app-header position-relative d-flex align-items-center" style={{ minHeight: '80px' }}>
      {/* Profile button fixed to top right */}
      <SignedIn>
        <div style={{ position: 'fixed', top: 0, right: 0, zIndex: 1050, padding: '24px' }}>
          <UserButton afterSignOutUrl="/" appearance={{ elements: { userButtonAvatarBox: { transform: 'scale(1.3)' } } }} />
        </div>
      </SignedIn>
      <div className="container-fluid d-flex align-items-center justify-content-between" style={{ width: '100%' }}>
        {/* Left: Buy Me A Coffee */}
        <div className="header-coffee-link-wrapper" style={{ flex: '0 0 auto' }}>
          <a
            href="https://buymeacoffee.com/azharsharif"
            target="_blank"
            rel="noopener noreferrer"
            className="header-coffee-link"
          >
            <img
              src="https://cdn.buymeacoffee.com/buttons/v2/default-yellow.png"
              alt="Buy Me A Coffee"
              className="header-coffee-image"
            />
          </a>
        </div>
        {/* Center: Logo */}
        <div className="header-logo-wrapper" style={{ flex: '1 1 0%', display: 'flex', justifyContent: 'center', alignItems: 'center', padding: '12px 0' }}>
          <img
            src="/logos/main.svg"
            alt="WaveOver Logo"
            style={{ height: '100px', objectFit: 'contain', padding: '8px 0' }}
          />
        </div>
        {/* Right: Empty for spacing (profile button is fixed) */}
        <div style={{ width: '120px' }}></div>
      </div>
    </header>
  );
} 