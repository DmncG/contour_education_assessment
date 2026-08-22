import { cache } from "react";
import { createClient } from "@/lib/supabase/server";

export type UserRole = "student" | "admin";

export type Profile = {
  id: string;
  email: string | null;
  role: UserRole;
};

/**
 * Returns the signed-in user's profile (id, email, role), or null if
 * there's no session or no matching profile row. Wrapped in React's
 * `cache()` so a layout and the page it wraps share one DB round-trip
 * per request instead of each fetching separately.
 */
export const getProfile = cache(async (): Promise<Profile | null> => {
  const supabase = await createClient();

  const { data: claims } = await supabase.auth.getClaims();
  const user = claims?.claims;
  if (!user) return null;

  const { data: profile } = await supabase
    .from("profiles")
    .select("id, role")
    .eq("id", user.sub)
    .single();

  if (!profile) return null;

  return {
    id: profile.id,
    email: user.email ?? null,
    role: profile.role,
  };
});
