<<<<<<< HEAD
import Image from "next/image";

export default function Home() {
  return (
    <div className="grid grid-rows-[20px_1fr_20px] items-center justify-items-center min-h-screen p-8 pb-20 gap-16 sm:p-20 font-[family-name:var(--font-geist-sans)]">
      <main className="flex flex-col gap-[32px] row-start-2 items-center sm:items-start">
        <Image
          className="dark:invert"
          src="/next.svg"
          alt="Next.js logo"
          width={180}
          height={38}
          priority
        />
        <ol className="list-inside list-decimal text-sm/6 text-center sm:text-left font-[family-name:var(--font-geist-mono)]">
          <li className="mb-2 tracking-[-.01em]">
            Get started by editing{" "}
            <code className="bg-black/[.05] dark:bg-white/[.06] px-1 py-0.5 rounded font-[family-name:var(--font-geist-mono)] font-semibold">
              src/app/page.js
            </code>
            .
          </li>
          <li className="tracking-[-.01em]">
            Save and see your changes instantly.
          </li>
        </ol>

        <div className="flex gap-4 items-center flex-col sm:flex-row">
          <a
            className="rounded-full border border-solid border-transparent transition-colors flex items-center justify-center bg-foreground text-background gap-2 hover:bg-[#383838] dark:hover:bg-[#ccc] font-medium text-sm sm:text-base h-10 sm:h-12 px-4 sm:px-5 sm:w-auto"
            href="https://vercel.com/new?utm_source=create-next-app&utm_medium=appdir-template-tw&utm_campaign=create-next-app"
            target="_blank"
            rel="noopener noreferrer"
          >
            <Image
              className="dark:invert"
              src="/vercel.svg"
              alt="Vercel logomark"
              width={20}
              height={20}
            />
            Deploy now
          </a>
          <a
            className="rounded-full border border-solid border-black/[.08] dark:border-white/[.145] transition-colors flex items-center justify-center hover:bg-[#f2f2f2] dark:hover:bg-[#1a1a1a] hover:border-transparent font-medium text-sm sm:text-base h-10 sm:h-12 px-4 sm:px-5 w-full sm:w-auto md:w-[158px]"
            href="https://nextjs.org/docs?utm_source=create-next-app&utm_medium=appdir-template-tw&utm_campaign=create-next-app"
            target="_blank"
            rel="noopener noreferrer"
          >
            Read our docs
          </a>
        </div>
      </main>
      <footer className="row-start-3 flex gap-[24px] flex-wrap items-center justify-center">
        <a
          className="flex items-center gap-2 hover:underline hover:underline-offset-4"
          href="https://nextjs.org/learn?utm_source=create-next-app&utm_medium=appdir-template-tw&utm_campaign=create-next-app"
          target="_blank"
          rel="noopener noreferrer"
        >
          <Image
            aria-hidden
            src="/file.svg"
            alt="File icon"
            width={16}
            height={16}
          />
          Learn
        </a>
        <a
          className="flex items-center gap-2 hover:underline hover:underline-offset-4"
          href="https://vercel.com/templates?framework=next.js&utm_source=create-next-app&utm_medium=appdir-template-tw&utm_campaign=create-next-app"
          target="_blank"
          rel="noopener noreferrer"
        >
          <Image
            aria-hidden
            src="/window.svg"
            alt="Window icon"
            width={16}
            height={16}
          />
          Examples
        </a>
        <a
          className="flex items-center gap-2 hover:underline hover:underline-offset-4"
          href="https://nextjs.org?utm_source=create-next-app&utm_medium=appdir-template-tw&utm_campaign=create-next-app"
          target="_blank"
          rel="noopener noreferrer"
        >
          <Image
            aria-hidden
            src="/globe.svg"
            alt="Globe icon"
            width={16}
            height={16}
          />
          Go to nextjs.org →
        </a>
      </footer>
    </div>
  );
}
=======
"use client";
// Next.js root landing page, refactored from src/components/landingPage.js
// Uses Clerk placeholders and Next.js navigation
import { useEffect } from "react";
import { SignedIn, SignedOut, SignInButton, useUser } from "@clerk/nextjs";
import { useRouter } from "next/navigation";
import Link from "next/link";
import "../components/react-archive/css/landingPage.css";

export default function LandingPage() {
  const router = useRouter();
  const { isSignedIn } = useUser();

  useEffect(() => {
    if (isSignedIn) {
      router.push("/dashboard");
    }
  }, [isSignedIn, router]);

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
                <button className="primary-button">Always free</button>
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
            {/* Use Next.js Link for navigation */}
            <Link href="/help" className="help-link">
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
              <h3>Invite Your Partner</h3>
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
>>>>>>> vercel-deployment
