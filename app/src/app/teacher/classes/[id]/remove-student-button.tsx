"use client";

import { removeStudentFromClass } from "@/actions/class";
import { useRouter } from "next/navigation";

export default function RemoveStudentButton({
  classId,
  userId,
}: {
  classId: string;
  userId: string;
}) {
  const router = useRouter();

  async function handleRemove() {
    await removeStudentFromClass(classId, userId);
    router.refresh();
  }

  return (
    <button
      onClick={handleRemove}
      className="text-xs text-gray-300 hover:text-red-500 leading-none"
      title="Remove from class"
    >
      &times;
    </button>
  );
}
