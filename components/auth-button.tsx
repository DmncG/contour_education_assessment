import Link from "next/link";
import { Button } from "./ui/button";
import { Badge } from "./ui/badge";
import { getProfile } from "@/lib/auth/get-profile";
import { LogoutButton } from "./logout-button";

export async function AuthButton() {
  const profile = await getProfile();

  return profile ? (
    <div className="flex items-center gap-4">
      Hey, {profile.role === "admin" ? <>{`${profile.email}!`}<Badge>{profile.role}</Badge></> : `${profile.email}!`}
      <LogoutButton />
    </div>
  ) : (
    <div className="flex gap-2">
      <Button asChild size="sm" variant={"outline"}>
        <Link href="/auth/login">Sign in</Link>
      </Button>
      <Button asChild size="sm" variant={"default"}>
        <Link href="/auth/sign-up">Sign up</Link>
      </Button>
    </div>
  );
}
