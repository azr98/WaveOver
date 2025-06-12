"use client";
import "../app/custom.css";
import { useClerk, UserButton, SignedIn } from '@clerk/nextjs';

export default function HeaderNext() {
  return (
    <header className="app-header position-relative">
      {/* Profile button fixed to top right */}
      <SignedIn>
        <div style={{ position: 'fixed', top: 0, right: 0, zIndex: 1050, padding: '24px' }}>
          <UserButton afterSignOutUrl="/" appearance={{ elements: { userButtonAvatarBox: { transform: 'scale(1.3)' } } }} />
        </div>
      </SignedIn>
      <div className="header-content justify-content-center">
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
    </header>
  );
} 