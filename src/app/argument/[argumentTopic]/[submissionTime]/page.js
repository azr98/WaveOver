"use client";
import { useEffect, useState } from "react";
import { useUser } from "@clerk/nextjs";
import { useParams, useRouter } from "next/navigation";
import axios from "axios";
import TextEditor from "../../../../components/TextEditor";

export default function ArgumentPage() {
  const params = useParams();
  const router = useRouter();
  const { user } = useUser();
  const { argumentTopic, submissionTime } = params;
  const [argument, setArgument] = useState(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState(null);

  useEffect(() => {
    // Only run on client after user is loaded
    if (!user) return;
    async function fetchArgument() {
      // 1. Try to get argument from router state
      if (router?.state?.argument) {
        setArgument(router.state.argument);
        setLoading(false);
      } else {
        // 2. Fallback: fetch from API using params
        try {
          // You must pass user_email and submission_time to the API
          const response = await axios.get(`/api/get_argument`, {
            params: {
              user_email: user.primaryEmailAddress?.emailAddress, // or argument.user_email if you have it
              submission_time: decodeURIComponent(submissionTime),
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
  }, [router, user, argumentTopic, submissionTime]);

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
    <div className="container mx-auto p-4">
      <h1 className="text-2xl font-bold mb-4">Argument: {argument.argument_topic}</h1>
      <TextEditor 
        argument={argument} 
        userEmail={user.primaryEmailAddress?.emailAddress} 
      />
    </div>
  );
} 