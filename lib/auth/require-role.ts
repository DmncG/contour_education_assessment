import { forbidden, redirect } from "next/navigation";
import { getProfile, type Profile, type UserRole } from "./get-profile";

/** Redirects to /auth/login if there's no session; otherwise returns the profile. */
export async function requireProfile(): Promise<Profile> {
  const profile = await getProfile();
  if (!profile) {
    redirect("/auth/login");
  }
  return profile;
}

/** Redirects unauthenticated users to login, and shows the forbidden page if the role doesn't match. */
export async function requireRole(role: UserRole): Promise<Profile> {
  const profile = await requireProfile();
  if (profile.role !== role) {
    forbidden();
  }
  return profile;
}
