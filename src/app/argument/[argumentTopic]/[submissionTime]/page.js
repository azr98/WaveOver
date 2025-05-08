"use client";
import { useEffect, useState } from "react";
import { useUser } from "@clerk/nextjs";
import { useParams, useRouter } from "next/navigation";
import axios from "axios";

export default function ArgumentPage() {
  const params = useParams();
  const router = useRouter();
  const { user } = useUser();
  const { argumentTopic, submissionTime } = params;
  const [argument, setArgument] = useState(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState(null);

  useEffect(() => {
    async function fetchArgument() {
      if (!user) return;
      try {
        const response = await axios.get("/api/get_argument", {
          params: {
            argument_topic: argumentTopic,
            submission_time: submissionTime,
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
    if (user) fetchArgument();
  }, [user, argumentTopic, submissionTime]);

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
    <div>
      <h1>Argument: {argument.argument_topic}</h1>
      {/* Placeholder for TextEditor, to be implemented next */}
      <div style={{border: '1px dashed #aaa', padding: '2rem', marginTop: '2rem'}}>
        [TextEditor will go here]
      </div>
    </div>
  );
} 