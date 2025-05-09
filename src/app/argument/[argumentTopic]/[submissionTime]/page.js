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
    // Try to get argument from router state
    if (router?.state?.argument) {
      setArgument(router.state.argument);
      setLoading(false);
    } else {
      // fallback to API call if not present
      async function fetchArgument() {
        if (!user) return;
        try {
          const decodedTopic = decodeURIComponent(argumentTopic);
          const decodedTime = decodeURIComponent(submissionTime);
          
          console.log("Fetching argument with params:", {
            rawTopic: argumentTopic,
            rawTime: submissionTime,
            decodedTopic,
            decodedTime,
            userEmail: user.primaryEmailAddress?.emailAddress,
          });

          const response = await axios.get(`/api/get_argument`, {
            params: {
              argument_topic: decodedTopic,
              submission_time: decodedTime,
              userEmail: user.primaryEmailAddress?.emailAddress,
            },
          });
          console.log("Fetched argument:", response.data);
          setArgument(response.data);
          setLoading(false);
        } catch (err) {
          console.error("Error fetching argument:", err);
          console.error("Error details:", {
            message: err.message,
            response: err.response?.data,
            status: err.response?.status,
            config: err.config
          });
          setError("Failed to load argument. Please try again.");
          setLoading(false);
        }
      }
      if (user) fetchArgument();
    }
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