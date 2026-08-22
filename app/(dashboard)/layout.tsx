import { EnvVarWarning } from "@/components/env-var-warning";
import { AuthButton } from "@/components/auth-button";
import { ThemeSwitcher } from "@/components/theme-switcher";
import { hasEnvVars } from "@/lib/utils";
import { requireProfile } from "@/lib/auth/require-role";
import Link from "next/link";
import Image from "next/image";
import { Suspense } from "react";

// Every route in this group is authenticated + role-gated, so there's no
// safe static shell to prerender. Opt out of Cache Components' static-shell
// requirement instead of fighting it with Suspense boundaries that would
// just show a blank shell anyway.
export const instant = false;

export default async function DashboardLayout({
  children,
}: {
  children: React.ReactNode;
}) {
  const profile = await requireProfile();

  return (
    <main className="min-h-screen flex flex-col items-center">
      <div className="flex-1 w-full flex flex-col gap-20 items-center">
        <nav className="w-full flex justify-center border-b border-b-foreground/10 h-16">
          <div className="w-full max-w-5xl flex justify-between items-center p-3 px-5 text-sm">
            <div className="flex gap-5 items-center font-semibold">
              <Link href={"/"}>
                <Image width={150} height={50} alt="Contour Education" src="/contour_logo.svg" />
              </Link>
              {profile.role === "admin" && (
                <Link href={"/admin"}>Consultations</Link>
              )}
            </div>
            {!hasEnvVars ? (
              <EnvVarWarning />
            ) : (
              <Suspense>
                <AuthButton />
              </Suspense>
            )}
          </div>
        </nav>
        <div className="flex-1 flex flex-col gap-20 max-w-5xl p-5">
          {children}
        </div>

        <footer className="w-full flex items-center justify-center border-t mx-auto text-center text-xs gap-8 py-16">
          <p>
            Powered by{" "}
            <a
              href="https://supabase.com/?utm_source=create-next-app&utm_medium=template&utm_term=nextjs"
              target="_blank"
              className="font-bold hover:underline"
              rel="noreferrer"
            >
              Supabase
            </a>
          </p>
          <ThemeSwitcher />
        </footer>
      </div>
    </main>
  );
}