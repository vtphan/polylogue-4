"use client";

import { useState } from "react";
import { useRouter } from "next/navigation";
import { joinSession } from "@/actions/student-join";

export default function JoinForm() {
  const router = useRouter();
  const [sessionCode, setSessionCode] = useState("");
  const [fullName, setFullName] = useState("");
  const [error, setError] = useState<string | null>(null);
  const [joining, setJoining] = useState(false);

  async function handleSubmit(e: React.FormEvent) {
    e.preventDefault();
    if (!sessionCode.trim() || !fullName.trim()) return;

    setJoining(true);
    setError(null);

    try {
      const result = await joinSession(sessionCode, fullName);
      if (result.success && result.sessionId) {
        // Set student-session cookie for route protection
        document.cookie = `student-session=${result.studentId}; path=/; max-age=86400`;
        router.push(`/student/session/${result.sessionId}`);
      } else {
        setError(result.error ?? "Something went wrong.");
        setJoining(false);
      }
    } catch {
      setError("Couldn't connect. Check your connection and try again.");
      setJoining(false);
    }
  }

  return (
    <form onSubmit={handleSubmit} className="space-y-4">
      <div>
        <input
          type="text"
          value={sessionCode}
          onChange={(e) => setSessionCode(e.target.value.toUpperCase())}
          placeholder="Session code"
          maxLength={6}
          className="w-full px-4 py-3.5 border-2 border-gray-200 rounded-xl text-center text-[20px]
            font-mono tracking-widest uppercase
            focus:outline-none focus:border-indigo-400 focus:ring-1 focus:ring-indigo-200
            placeholder:text-gray-300 placeholder:tracking-normal placeholder:font-sans placeholder:text-[16px]"
        />
      </div>

      <div>
        <input
          type="text"
          value={fullName}
          onChange={(e) => setFullName(e.target.value)}
          placeholder="Your full name"
          className="w-full px-4 py-3 border-2 border-gray-200 rounded-xl text-[16px]
            focus:outline-none focus:border-indigo-400 focus:ring-1 focus:ring-indigo-200
            placeholder:text-gray-400"
        />
      </div>

      {error && (
        <div className="px-3 py-2 bg-red-50 border border-red-200 rounded-xl text-[14px] text-red-700">
          {error}
        </div>
      )}

      <button
        type="submit"
        disabled={!sessionCode.trim() || !fullName.trim() || joining}
        className="w-full py-3.5 bg-indigo-500 text-white font-semibold rounded-xl
          hover:bg-indigo-600 disabled:opacity-40 disabled:cursor-not-allowed
          active:scale-[0.97] transition-all text-[17px]"
      >
        {joining ? "Joining..." : "Join"}
      </button>
    </form>
  );
}
