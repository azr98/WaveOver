"use client";
import { useClerk } from '@clerk/nextjs';
import "./react-archive/css/Header.css";

export default function HeaderNext() {
  const { signOut } = useClerk();

  return (
    <header className="app-header">
      <div className="header-content">
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