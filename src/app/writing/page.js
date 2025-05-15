"use client";

export default function WritingTipsPage() {
  return (
    <div className="min-h-screen bg-gray-50 flex flex-col items-center justify-start py-12 px-4">
      <div className="bg-white rounded shadow p-6 max-w-2xl w-full">
        <h1 className="text-2xl font-bold mb-4 text-center">Writing Tips for WaveOver</h1>
        <ul className="list-disc pl-6 space-y-3 text-lg">
          <li>Be clear and concise. Focus on your main points and avoid unnecessary details.</li>
          <li>Use respectful and constructive language, even when discussing disagreements.</li>
          <li>Organize your response with paragraphs or bullet points for readability.</li>
          <li>Take your time to reflect before submitting your response.</li>
          <li>Use <b>Ctrl+B</b> / <b>Cmd+B</b> for <b>bold</b> and <b>Ctrl+I</b> / <b>Cmd+I</b> for <i>italics</i> in the editor.</li>
          <li>Remember, your partner will only see your response after the deadline.</li>
        </ul>
        <div className="text-center mt-8">
          <a href="/dashboard" className="text-blue-600 hover:underline font-medium">Back to Dashboard</a>
        </div>
      </div>
    </div>
  );
} 