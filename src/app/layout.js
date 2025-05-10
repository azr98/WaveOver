import { useEffect, useState } from "react";
import { ClerkProvider, SignedIn } from '@clerk/nextjs';
import BugReportForm from "../components/BugReportForm";

// Import global CSS if you have it (e.g., Tailwind or your own)
// import '../styles/globals.css';

export const metadata = {
  title: 'WaveOver',
  description: 'Talk It Out — Without Talking Over Each Other',
};

export default function RootLayout({ children }) {
  const [publishableKey, setPublishableKey] = useState("");

  useEffect(() => {
    if (typeof window !== "undefined") {
      setPublishableKey(window.CLERK_PUBLISHABLE_KEY || "");
    }
  }, []);

  if (!publishableKey) return null; // or a loading spinner

  return (
    <html lang="en">
      <body>
        <ClerkProvider publishableKey={publishableKey}>
          <SignedIn>
            <BugReportForm />
          </SignedIn>
          {children}
        </ClerkProvider>
      </body>
    </html>
  );
} 