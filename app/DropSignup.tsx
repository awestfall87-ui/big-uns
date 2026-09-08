"use client";

import { FormEvent, useState } from "react";

export default function DropSignup() {
  const [email, setEmail] = useState("");
  const [submitted, setSubmitted] = useState(false);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState("");

  async function handleSubmit(event: FormEvent<HTMLFormElement>) {
    event.preventDefault();

    setLoading(true);
    setError("");

    const formData = new FormData();
    formData.append("email", email);
    formData.append("_subject", "New Big Uns Join the Drop Signup");

    try {
      const response = await fetch("https://formspree.io/f/moeqlkzv", {
        method: "POST",
        body: formData,
        headers: {
          Accept: "application/json",
        },
      });

      if (response.ok) {
        setSubmitted(true);
        setEmail("");
      } else {
        setError("Something went wrong. Please try again.");
      }
    } catch {
      setError("Something went wrong. Please try again.");
    } finally {
      setLoading(false);
    }
  }

  if (submitted) {
  return (
    <div className="dropSignup dropSignupSuccess">
      <div className="dropSuccessIcon">✓</div>

      <p className="sectionEyebrow">YOU&apos;RE IN.</p>

      <h3>WELCOME TO THE DROP.</h3>

      <p className="dropSuccessCopy">
        You&apos;ll be among the first to know about First Edition packs,
        catch submissions, tournaments, and what&apos;s coming next from Big Uns.
      </p>
    </div>
  );
}

  return (
    <form className="dropSignup" onSubmit={handleSubmit}>
      <label htmlFor="dropEmail">EMAIL ADDRESS</label>

      <div className="dropSignupRow">
        <input
          id="dropEmail"
          name="email"
          type="email"
          placeholder="Enter your email"
          value={email}
          onChange={(event) => setEmail(event.target.value)}
          required
        />

        <button className="primaryButton" type="submit" disabled={loading}>
          {loading ? "JOINING..." : "JOIN THE DROP"}
        </button>
      </div>

      {error && <p className="dropFinePrint">{error}</p>}

      <p className="dropFinePrint">
        No spam. Just Big Uns updates when there&apos;s something worth sharing.
      </p>
    </form>
  );
}