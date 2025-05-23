"use client";
import { useClerk, UserButton, SignedIn } from '@clerk/nextjs';
import "./react-archive/css/Header.css";

export default function HeaderNext() {
  return (
    <header className="app-header position-relative">
      {/* Profile button fixed to top right */}
      <SignedIn>
        <div style={{ position: 'fixed', top: 16, right: 16, zIndex: 1050 }}>
          <UserButton afterSignOutUrl="/" />
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