import { SignUp } from "@clerk/nextjs";
import Link from "next/link";

import { AuthShell } from "~/components/auth/auth-shell";
import { Button } from "~/components/ui/button";
import { getServiceFlags } from "~/lib/service-flags";

export default function SignUpPage() {
  const services = getServiceFlags();

  return (
    <AuthShell
      title="Start a calmer routine"
      description="Create a member account when you want this retreat to grow into a personal workspace. The core focus dashboard still opens immediately for everyone."
      alternateHref="/sign-in"
      alternateLabel="Already have an account?"
    >
      {services.clerk ? (
        <SignUp path="/sign-up" routing="path" signInUrl="/sign-in" />
      ) : (
        <div className="rounded-[1.8rem] border border-white/10 bg-black/10 p-6 text-white">
          <h2 className="text-3xl">Clerk is not configured yet</h2>
          <p className="mt-3 text-sm leading-7 text-white/68">
            Add `NEXT_PUBLIC_CLERK_PUBLISHABLE_KEY` and `CLERK_SECRET_KEY` to
            enable the hosted sign-up flow.
          </p>
          <Button
            asChild
            className="mt-6 rounded-full bg-white/92 text-slate-900 hover:bg-white"
          >
            <Link href="/">Return to the retreat</Link>
          </Button>
        </div>
      )}
    </AuthShell>
  );
}
