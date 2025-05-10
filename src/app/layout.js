import { ClerkProvider, SignedIn } from '@clerk/nextjs';
import BugReportForm from "../components/BugReportForm";

// Import global CSS if you have it (e.g., Tailwind or your own)
// import '../styles/globals.css';

export const metadata = {
  title: 'WaveOver',
  description: 'Talk It Out — Without Talking Over Each Other',
};

export default function RootLayout({ children }) {
  return (
    <html lang="en">
      <body>
        {/* Wrap the app in ClerkProvider. Replace the publishableKey below with your own Clerk key. */}
        <ClerkProvider publishableKey="pk_test_ZXZpZGVudC1vc3RyaWNoLTYyLmNsZXJrLmFjY291bnRzLmRldiQ">
          <SignedIn>
            <BugReportForm />
          </SignedIn>
          {children}
        </ClerkProvider>
      </body>
    </html>
  );
} 