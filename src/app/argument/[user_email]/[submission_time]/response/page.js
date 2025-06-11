"use client";
import { useEffect, useState } from "react";
import { useUser } from "@clerk/nextjs";
import { useParams, useRouter, useSearchParams } from "next/navigation";
import axios from "axios";
import Header from '../../../../../components/Header';

export default function ArgumentResponsePage() {
  const params = useParams();
  const router = useRouter();
  const searchParams = useSearchParams();
  const { user } = useUser();
  const { user_email, submission_time } = params;
  const [argument, setArgument] = useState(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState(null);

  const decodedUserEmail = decodeURIComponent(user_email);
  const decodedSubmissionTime = decodeURIComponent(submission_time);
  const view = searchParams.get('view'); // 'user' or 'partner'

  useEffect(() => {
    if (!user) return;
    async function fetchArgument() {
      try {
        const response = await axios.get(`/api/get_argument`, {
          params: {
            user_email: decodedUserEmail,
            submission_time: decodedSubmissionTime,
            userEmail: user.primaryEmailAddress?.emailAddress,
          },
        });
        setArgument(response.data);
        setLoading(false);
      } catch (err) {
        setError("Failed to load argument. Please try again.");
        setLoading(false);
      }
    }
    fetchArgument();
  }, [user, decodedUserEmail, decodedSubmissionTime]);

  useEffect(() => {
    if (argument && !argument.argument_finished) {
      // If not finished, redirect to main argument page
      router.push(`/argument/${encodeURIComponent(decodedUserEmail)}/${encodeURIComponent(decodedSubmissionTime)}`);
    }
  }, [argument, router, decodedUserEmail, decodedSubmissionTime]);

  if (!user || loading) {
    return <div>Loading...</div>;
  }
  if (error) {
    return <div>{error}</div>;
  }
  if (!argument) {
    return <div>No argument found.</div>;
  }

  let responseHtml = '';
  if (view === 'user') {
    responseHtml = user.primaryEmailAddress?.emailAddress === argument.user_email ? argument.user_response : argument.spouse_response;
  } else {
    responseHtml = user.primaryEmailAddress?.emailAddress === argument.user_email ? argument.spouse_response : argument.user_response;
  }

  return (
    <>
      <Header />
      <div style={{ maxWidth: 700, margin: '40px auto', padding: 24 }}>
        <h1 style={{ fontWeight: 700, fontSize: '2.2rem', marginBottom: 8, textAlign: 'left' }}>
          Discussion: {argument.argument_topic}
        </h1>
        <h2 style={{ fontWeight: 500, fontSize: '1.3rem', marginBottom: 16, textAlign: 'left' }}>
          with: {user.primaryEmailAddress?.emailAddress === argument.user_email ? argument.spouse_email : argument.user_email}
        </h2>
        <div style={{ border: '2px solid #e3f2fd', borderRadius: 6, background: '#f5f8fa', padding: 24, minHeight: 200 }}>
          {/* Show who said it if argument is finished */}
          {argument.argument_finished && (
            <div style={{ fontWeight: 600, marginBottom: 12, color: '#1976d2' }}>
              {(() => {
                // Determine whose response is being shown
                const isUser = user.primaryEmailAddress?.emailAddress === argument.user_email;
                if (view === 'user') {
                  // Showing the user's own response
                  return isUser
                    ? `${argument.user_firstname} ${argument.user_lastname} said:`
                    : `${argument.spouse_firstname} ${argument.spouse_lastname} said:`;
                } else {
                  // Showing the partner's response
                  return isUser
                    ? `${argument.spouse_firstname} ${argument.spouse_lastname} said:`
                    : `${argument.user_firstname} ${argument.user_lastname} said:`;
                }
              })()}
            </div>
          )}
          <div dangerouslySetInnerHTML={{ __html: responseHtml }} />
        </div>
      </div>
    </>
  );
} 