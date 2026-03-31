"use client";

import { useState } from "react";
import { useRouter } from "next/navigation";
import { createTeacher } from "@/actions/researcher";
import Link from "next/link";

export default function CreateTeacherForm() {
  const router = useRouter();
  const [name, setName] = useState("");
  const [password, setPassword] = useState("");
  const [confirm, setConfirm] = useState("");
  const [error, setError] = useState("");
  const [created, setCreated] = useState<{
    displayName: string;
    username: string;
  } | null>(null);
  const [loading, setLoading] = useState(false);

  async function handleSubmit(e: React.FormEvent) {
    e.preventDefault();
    setError("");

    if (password.length < 6) {
      setError("Password must be at least 6 characters.");
      return;
    }
    if (password !== confirm) {
      setError("Passwords don't match.");
      return;
    }

    setLoading(true);
    try {
      const result = await createTeacher(name, password);
      setCreated(result);
    } catch (err) {
      setError(err instanceof Error ? err.message : "Failed to create teacher.");
    } finally {
      setLoading(false);
    }
  }

  if (created) {
    return (
      <div className="space-y-4">
        <Link
          href="/researcher/teachers"
          className="text-sm text-indigo-600 hover:text-indigo-700"
        >
          &larr; Back to Teachers
        </Link>
        <div className="bg-green-50 border border-green-200 rounded-lg p-4">
          <p className="text-sm font-medium text-green-800 mb-2">
            Teacher created successfully
          </p>
          <div className="text-sm text-green-700 space-y-1">
            <p>
              <span className="font-medium">Name:</span> {created.displayName}
            </p>
            <p>
              <span className="font-medium">Username:</span> {created.username}
            </p>
            <p>
              <span className="font-medium">Password:</span> {password}
            </p>
          </div>
          <p className="text-xs text-green-600 mt-3">
            Share these credentials with the teacher.
          </p>
        </div>
        <div className="flex gap-3">
          <button
            onClick={() => {
              setCreated(null);
              setName("");
              setPassword("");
              setConfirm("");
            }}
            className="text-sm text-indigo-600 hover:text-indigo-700 font-medium"
          >
            Add another
          </button>
          <button
            onClick={() => router.push("/researcher/teachers")}
            className="text-sm text-gray-500 hover:text-gray-700"
          >
            Done
          </button>
        </div>
      </div>
    );
  }

  return (
    <form onSubmit={handleSubmit} className="space-y-4">
      <Link
        href="/researcher/teachers"
        className="text-sm text-indigo-600 hover:text-indigo-700"
      >
        &larr; Back to Teachers
      </Link>

      <div>
        <label className="block text-sm font-medium text-gray-700 mb-1">
          Display Name
        </label>
        <input
          type="text"
          value={name}
          onChange={(e) => setName(e.target.value)}
          required
          autoFocus
          placeholder="e.g., Ms. Thompson"
          className="w-full px-3 py-2 border border-gray-300 rounded-lg text-sm
            focus:outline-none focus:border-indigo-400"
        />
      </div>

      <div>
        <label className="block text-sm font-medium text-gray-700 mb-1">
          Password
        </label>
        <input
          type="password"
          value={password}
          onChange={(e) => setPassword(e.target.value)}
          required
          minLength={6}
          className="w-full px-3 py-2 border border-gray-300 rounded-lg text-sm
            focus:outline-none focus:border-indigo-400"
        />
      </div>

      <div>
        <label className="block text-sm font-medium text-gray-700 mb-1">
          Confirm Password
        </label>
        <input
          type="password"
          value={confirm}
          onChange={(e) => setConfirm(e.target.value)}
          required
          className="w-full px-3 py-2 border border-gray-300 rounded-lg text-sm
            focus:outline-none focus:border-indigo-400"
        />
      </div>

      {error && (
        <p className="text-sm text-red-600">{error}</p>
      )}

      <button
        type="submit"
        disabled={loading}
        className="w-full py-2.5 bg-indigo-500 text-white font-medium rounded-lg
          hover:bg-indigo-600 disabled:opacity-40 disabled:cursor-not-allowed
          transition-colors text-sm"
      >
        {loading ? "Creating..." : "Create Teacher"}
      </button>
    </form>
  );
}
