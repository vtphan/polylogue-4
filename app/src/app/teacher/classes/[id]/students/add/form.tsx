"use client";

import { useState } from "react";
import { useRouter } from "next/navigation";
import { addStudentsToClass } from "@/actions/class";
import Link from "next/link";

export default function AddStudentsForm({ classId }: { classId: string }) {
  const router = useRouter();
  const [studentText, setStudentText] = useState("");
  const [error, setError] = useState("");
  const [adding, setAdding] = useState(false);

  async function handleSubmit(e: React.FormEvent) {
    e.preventDefault();
    setError("");

    const names = studentText
      .split("\n")
      .map((s) => s.trim())
      .filter(Boolean);

    if (names.length === 0) {
      setError("Enter at least one student name.");
      return;
    }

    setAdding(true);
    try {
      const result = await addStudentsToClass(classId, names);
      router.push(`/teacher/classes/${classId}`);
      router.refresh();
    } catch (err) {
      setError(err instanceof Error ? err.message : "Failed to add students.");
      setAdding(false);
    }
  }

  return (
    <form onSubmit={handleSubmit} className="space-y-4">
      <Link
        href={`/teacher/classes/${classId}`}
        className="text-sm text-indigo-600 hover:text-indigo-700"
      >
        &larr; Back to Class
      </Link>

      <div>
        <label className="block text-sm font-medium text-gray-700 mb-1">
          Student Names <span className="text-gray-400 font-normal">(one per line)</span>
        </label>
        <textarea
          value={studentText}
          onChange={(e) => setStudentText(e.target.value)}
          rows={8}
          autoFocus
          placeholder={"Maya Johnson\nDeAndre Williams\nSophia Chen"}
          className="w-full px-3 py-2 border border-gray-300 rounded-lg text-sm
            focus:outline-none focus:border-indigo-400
            placeholder:text-gray-300"
        />
        <p className="text-[11px] text-gray-400 mt-1">
          Existing students will be added to the class. New students will be created.
        </p>
      </div>

      {error && <p className="text-sm text-red-600">{error}</p>}

      <button
        type="submit"
        disabled={adding}
        className="w-full py-2.5 bg-indigo-500 text-white font-medium rounded-lg
          hover:bg-indigo-600 disabled:opacity-40 disabled:cursor-not-allowed
          transition-colors text-sm"
      >
        {adding ? "Adding..." : "Add Students"}
      </button>
    </form>
  );
}
