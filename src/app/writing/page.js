"use client";

import Header from "../../components/Header";

export default function WritingTipsPage() {
  return (
    <div className="help-container">
      <Header />
      <div className="help-content">
        <h1 className="text-2xl font-bold mb-4 text-center">✍️ How to Write for Deeper Conversations and Less Conflict</h1>
        <p className="text-lg mb-4 text-center">Difficult conversations don't have to become arguments.</p>
        <p className="mb-6 text-center">This app gives you a powerful way to communicate with clarity, calm, and connection—through asynchronous writing.<br />Here's how to make the most of it.</p>
        <hr className="my-6" />
        <h2 className="text-xl font-semibold mb-2"> Why This App Works: The Power of the Pause</h2>
        <ul className="list-disc pl-6 mb-6 space-y-2">
          <li>A 3-day timer to reflect, edit, and cool emotions</li>
          <li>No back-and-forth replies = no "chain reactions" no 'fastest thinker' competition</li>
          <li>Simultaneous message delivery = No power plays</li>
          <li>Structured time = Deeper, more thoughtful messages</li>
          <li>Long time to write with reminders = Leave and forget so you can comeback and reread and reflect with a clear mind and fresh eyes</li>
        </ul>
        <hr className="my-6" />
        <h2 className="text-xl font-semibold mb-2">✍️ Writing Tips: Say What You Mean, Without the Drama</h2>
        <h3 className="font-semibold mt-4 mb-1">1. Keep it clear and concise</h3>
        <ul className="list-disc pl-6 mb-3 space-y-1">
          <li>Cut the fluff. Make your point, then stop.</li>
          <li>Use short sentences mixed with longer ones.</li>
          <li>Avoid slang or jargon—write how you speak on your best day.</li>
          <li>Use formatting (like this!) to break up big blocks.</li>
        </ul>
        <h3 className="font-semibold mt-4 mb-1">2. Be specific</h3>
        <p className="mb-2">Don't say "I felt bad." Say "I felt dismissed when..."<br />Precision builds clarity, which builds trust.</p>
        <h3 className="font-semibold mt-4 mb-1">3. Use active voice</h3>
        <ul className="list-disc pl-6 mb-3 space-y-1">
          <li><span className="text-green-700">✔️ "I felt ___ when you that happened."</span></li>
          <li><span className="text-red-700">❌ "I was ___ when that happened."</span></li>
        </ul>
        <h3 className="font-semibold mt-4 mb-1">4. Read it out loud before you send</h3>
        <p className="mb-6">It helps catch tone issues and emotional spikes.</p>
        <hr className="my-6" />
        <h2 className="text-xl font-semibold mb-2">Before You Write: Think First</h2>
        <h3 className="font-semibold mt-4 mb-1">1. Know your goal</h3>
        <p className="mb-2">Are you aiming to share feelings, ask a question, or solve a problem, raise a problem, or just vent? Start with that intention.</p>
        <h3 className="font-semibold mt-4 mb-1">2. Consider your partner's lens</h3>
        <p className="mb-2">Think: What do they already know? How do they prefer to communicate? What do they need to know?</p>
        <h3 className="font-semibold mt-4 mb-1">3. Write it out when you're emotional but leave and revisit it later</h3>
        <h3 className="font-semibold mt-4 mb-1">4. Read it out loud before you send</h3>
        <p className="mb-6">It helps catch tone issues and emotional spikes. Try writing close to how you speak</p>
        <hr className="my-6" />
        <h2 className="text-xl font-semibold mb-2">💬 How to Handle Tough Topics</h2>
        <h3 className="font-semibold mt-4 mb-1">1. Use "I" statements</h3>
        <p className="mb-2">Replace "You never listen" with "I feel unheard when I don't get a reply."</p>
        <h3 className="font-semibold mt-4 mb-1">2. Validate their view</h3>
        <p className="mb-2">A simple "I see where you're coming from" goes a long way.</p>
        <h3 className="font-semibold mt-4 mb-1">3. Stay on topic</h3>
        <p className="mb-2">Don't drag in past fights or use generalizations like "always" or "never."</p>
        <h3 className="font-semibold mt-4 mb-1">4. Avoid sarcasm, blame, or contempt</h3>
        <p className="mb-2">These kill connection. Be kind, even when firm.</p>
        <h3 className="font-semibold mt-4 mb-1">5. Focus on the solution</h3>
        <p className="mb-6">It's not about winning. It's about understanding and moving forward—together.</p>
        <hr className="my-6" />
        <h2 className="text-xl font-semibold mb-2">❤️ Writing is Healing</h2>
        <p className="mb-4">Writing slows us down. It makes us reflect.<br />It transforms reactive talk into thoughtful connection.<br />Use this app to say what matters—with clarity, compassion, and calm.</p>
        <p className="mb-6 font-semibold text-center">Start your first message. Make space for connection. 📝💬<br />The best conversations are the ones where you're truly heard—and truly understood.</p>
        <div className="text-center mt-8">
          <a href="/dashboard" className="text-blue-600 hover:underline font-medium">Back to Dashboard</a>
        </div>
      </div>
    </div>
  );
} 