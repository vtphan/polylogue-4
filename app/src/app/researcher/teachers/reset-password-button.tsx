"use client";

import { useState } from "react";
import { resetTeacherPassword } from "@/actions/researcher";

export default function ResetPasswordButton({
  teacherId,
  teacherName,
}: {
  teacherId: string;
  teacherName: string;
}) {
  const [open, setOpen] = useState(false);
  const [password, setPassword] = useState("");
  const [confirm, setConfirm] = useState("");
  const [error, setError] = useState("");
  const [success, setSuccess] = useState(false);
  const [loading, setLoading] = useState(false);

  async function handleReset() {
    if (password.length < 6) {
      setError("Password must be at least 6 characters.");
      return;
    }
    if (password !== confirm) {
      setError("Passwords don't match.");
      return;
    }

    setLoading(true);
    setError("");
    try {
      await resetTeacherPassword(teacherId, password);
      setSuccess(true);
    } catch (err) {
      setError(err instanceof Error ? err.message : "Failed to reset password.");
    } finally {
      setLoading(false);
    }
  }

  if (!open) {
    return (
      <button
        onClick={() => setOpen(true)}
        className="text-xs text-gray-400 hover:text-indigo-600"
      >
        Reset password
      </button>
    );
  }

  if (success) {
    return (
      <div className="text-xs text-green-600">
        Password reset for {teacherName}.{" "}
        <button onClick={() => { setOpen(false); setSuccess(false); setPassword(""); setConfirm(""); }}
          className="underline">
          Done
        </button>
      </div>
    );
  }

  return (
    <div className="flex items-center gap-2">
      <input
        type="password"
        value={password}
        onChange={(e) => setPassword(e.target.value)}
        placeholder="New password"
        className="w-28 px-2 py-1 border border-gray-300 rounded text-xs focus:outline-none focus:border-indigo-400"
      />
      <input
        type="password"
        value={confirm}
        onChange={(e) => setConfirm(e.target.value)}
        placeholder="Confirm"
        className="w-28 px-2 py-1 border border-gray-300 rounded text-xs focus:outline-none focus:border-indigo-400"
      />
      <button
        onClick={handleReset}
        disabled={loading}
        className="text-xs text-indigo-600 hover:text-indigo-700 font-medium disabled:opacity-50"
      >
        {loading ? "..." : "Save"}
      </button>
      <button
        onClick={() => { setOpen(false); setError(""); }}
        className="text-xs text-gray-400 hover:text-gray-600"
      >
        Cancel
      </button>
      {error && <span className="text-xs text-red-600">{error}</span>}
    </div>
  );
}
