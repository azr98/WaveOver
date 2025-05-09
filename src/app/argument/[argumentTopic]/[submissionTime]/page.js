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
    console.log("Argument page mounted with params:", {
      rawParams: params,
      argumentTopic,
      submissionTime,
      decodedTopic: decodeURIComponent(argumentTopic),
      decodedTime: decodeURIComponent(submissionTime)
    });
  }, [params, argumentTopic, submissionTime]);

  useEffect(() => {
    console.log("router.state:", router?.state);
    async function fetchArgument() {
      // 1. Try to get argument from router state
      if (router?.state?.argument) {
        setArgument(router.state.argument);
        setLoading(false);
      } else {
        // 2. Fallback: fetch from API using params
        if (!user) return;
        try {
          const decodedTopic = decodeURIComponent(argumentTopic);
          const decodedTime = decodeURIComponent(submissionTime);
          const response = await axios.get(`/api/get_argument`, {
            params: {
              argument_topic: decodedTopic,
              submission_time: decodedTime,
              userEmail: user.primaryEmailAddress?.emailAddress,
            },
          });
          setArgument(response.data);
          setLoading(false);
        } catch (err) {
          setError("Failed to load argument. Please try again.");
          console.error("API error:", err, err?.response?.data);
          setLoading(false);
        }
      }
    }
    if (user) fetchArgument();
  }, [router, user, argumentTopic, submissionTime]);

  useEffect(() => {
    // If argument is finished, redirect to /response
    if (argument && argument.argument_finished) {
      router.push("/response");
    }
  }, [argument, router]);

  if (!user) {
    return <div>Please sign in to view this argument.</div>;
  }
  if (loading) {
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