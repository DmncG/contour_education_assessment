import { redirect } from "next/navigation";
import { getProfile } from "@/lib/auth/get-profile";

// This route always redirects based on auth/role, so there's no safe static
// shell to prerender — same reasoning as app/(dashboard)/layout.tsx.
export const instant = false;

export default async function Home() {
  const profile = await getProfile();

  if (!profile) {
    redirect("/auth/login");
  }

  redirect(profile.role === "admin" ? "/admin" : "/student-dashboard");
}
