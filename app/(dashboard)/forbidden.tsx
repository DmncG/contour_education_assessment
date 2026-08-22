import Link from "next/link";
import { Button } from "@/components/ui/button";

export default function Forbidden() {
  return (
    <div className="flex-1 w-full flex flex-col items-center justify-center gap-4 py-24 text-center">
      <h1 className="text-2xl font-bold">403 — Access denied</h1>
      <p className="text-muted-foreground max-w-md">
        You&apos;re signed in, but your account doesn&apos;t have permission
        to view this page.
      </p>
      <Button asChild>
        <Link href="/">Back to your dashboard</Link>
      </Button>
    </div>
  );
}
