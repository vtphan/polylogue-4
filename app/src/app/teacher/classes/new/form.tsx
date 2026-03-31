"use client";

import { useState } from "react";
import { useRouter } from "next/navigation";
import { createClass } from "@/actions/class";
import Link from "next/link";

export default function CreateClassForm() {
  const router = useRouter();
  const [name, setName] = useState("");
  const [studentText, setStudentText] = useState("");
  const [error, setError] = useState("");
  const [creating, setCreating] = useState(false);

  async function handleSubmit(e: React.FormEvent) {
    e.preventDefault();
    setError("");

    const studentNames = studentText
      .split("\n")
      .map((s) => s.trim())
      .filter(Boolean);

    setCreating(true);
    try {
      const cls = await createClass(name, studentNames);
      router.push(`/teacher/classes/${cls.id}`);
    } catch (err) {
      setError(err instanceof Error ? err.message : "Failed to create class.");
      setCreating(false);
    }
  }

  return (
    <form onSubmit={handleSubmit} className="space-y-4">
      <Link
        href="/teacher"
        className="text-sm text-indigo-600 hover:text-indigo-700"
      >
        &larr; Back to Dashboard
      </Link>

      <div>
        <label className="block text-sm font-medium text-gray-700 mb-1">
          Class Name
        </label>
        <input
          type="text"
          value={name}
          onChange={(e) => setName(e.target.value)}
          required
          autoFocus
          placeholder="e.g., 6th STEM Period 2"
          className="w-full px-3 py-2 border border-gray-300 rounded-lg text-sm
            focus:outline-none focus:border-indigo-400"
        />
      </div>

      <div>
        <label className="block text-sm font-medium text-gray-700 mb-1">
          Students <span className="text-gray-400 font-normal">(one per line)</span>
        </label>
        <textarea
          value={studentText}
          onChange={(e) => setStudentText(e.target.value)}
          rows={8}
          placeholder={"Maya Johnson\nDeAndre Williams\nSophia Chen"}
          className="w-full px-3 py-2 border border-gray-300 rounded-lg text-sm
            focus:outline-none focus:border-indigo-400
            placeholder:text-gray-300"
        />
        <p className="text-[11px] text-gray-400 mt-1">
          You can also add students later from the class detail page.
        </p>
      </div>

      {error && (
        <p className="text-sm text-red-600">{error}</p>
      )}

      <button
        type="submit"
        disabled={creating || !name.trim()}
        className="w-full py-2.5 bg-indigo-500 text-white font-medium rounded-lg
          hover:bg-indigo-600 disabled:opacity-40 disabled:cursor-not-allowed
          transition-colors text-sm"
      >
        {creating ? "Creating..." : "Create Class"}
      </button>
    </form>
  );
}
