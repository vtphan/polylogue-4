import { redirect } from "next/navigation";

// Sessions are now created through classes — redirect to dashboard
export default async function NewSessionPage() {
  redirect("/teacher");
}
