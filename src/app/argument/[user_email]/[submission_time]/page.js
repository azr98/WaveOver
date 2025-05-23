"use client";
import { useEffect, useState } from "react";
import { useUser } from "@clerk/nextjs";
import { useParams, useRouter } from "next/navigation";
import axios from "axios";
import TextEditor from "../../../../components/TextEditor";
import Header from "../../../../components/Header";

export default function ArgumentPage() {
  const params = useParams();
  const router = useRouter();
  const { user } = useUser();
  const { user_email, submission_time } = params;
  const [argument, setArgument] = useState(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState(null);

  console.log('Params from useParams:', { user_email, submission_time });

  const decodedUserEmail = decodeURIComponent(user_email);
  const decodedSubmissionTime = decodeURIComponent(submission_time);

  useEffect(() => {
    // Only run on client after user is loaded
    if (!user) return;
    async function fetchArgument() {
      // 1. Try to get argument from router state
      if (router?.state?.argument) {
        setArgument(router.state.argument);
        console.log("argument passed in from dashboard to argument page:", router.state.argument);
        setLoading(false);
      } else {
        // 2. Fallback: fetch from API using params
        try {
          // Pass raw values to Axios params, let Axios handle encoding
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
    }
    fetchArgument();
  }, [router, user, decodedUserEmail, decodedSubmissionTime]);

  useEffect(() => {
    // If argument is finished, redirect to /response
    if (argument && argument.argument_finished) {
      router.push("/response");
    }
  }, [argument, router]);

  // Hydration-safe: always render loading until user and argument are loaded
  if (!user || loading) {
    return <div>Loading...</div>;
  }
  if (error) {
    return <div>{error}</div>;
  }
  if (!argument) {
    return <div>No argument found.</div>;
  }

  return (
    <>
      <Header />
      <div className="container mx-auto p-4">
        <h1 className="text-2xl font-bold mb-4">Discussion: '{argument.argument_topic}'</h1>
        <TextEditor 
          argument={argument} 
          userEmail={user.primaryEmailAddress?.emailAddress} 
        />
      </div>
    </>
  );
} 