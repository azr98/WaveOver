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
        <ClerkProvider publishableKey={process.env.NEXT_PUBLIC_CLERK_PUBLISHABLE_KEY}>
          <SignedIn>
            <BugReportForm />
          </SignedIn>
          {children}
        </ClerkProvider>
      </body>
    </html>
  );
} 