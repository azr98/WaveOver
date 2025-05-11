"use client";
import { ClerkProvider, SignedIn } from "@clerk/nextjs";
import BugReportForm from "./BugReportForm";

export default function ClerkProviderWithKey({ children }) {
  return (
    <ClerkProvider publishableKey={process.env.NEXT_PUBLIC_CLERK_PUBLISHABLE_KEY}>
      <SignedIn>
        <BugReportForm />
      </SignedIn>
      {children}
    </ClerkProvider>
  );
} 