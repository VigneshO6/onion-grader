import { createFileRoute, Link } from "@tanstack/react-router";
import { MailCheck } from "lucide-react";
import { useState } from "react";
import { toast } from "sonner";

import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { supabase } from "@/integrations/supabase/client";

export const Route = createFileRoute("/verify-email")({
  validateSearch: (search: Record<string, unknown>) => ({
    email: typeof search["email"] === "string" ? (search["email"] as string) : "",
  }),
  head: () => ({
    meta: [
      { title: "Verify your email — OnionGrade AI" },
      {
        name: "description",
        content:
          "Confirm your email address to activate your OnionGrade AI farmer account and start grading onion lots.",
      },
      { property: "og:title", content: "Verify your email — OnionGrade AI" },
      {
        property: "og:description",
        content: "We sent a confirmation link to activate your OnionGrade AI account.",
      },
    ],
  }),
  component: VerifyEmail,
});

function VerifyEmail() {
  const { email: initial } = Route.useSearch();
  const [email, setEmail] = useState(initial);
  const [busy, setBusy] = useState(false);

  async function resend() {
    setBusy(true);
    const { error } = await supabase.auth.resend({
      type: "signup",
      email,
      options: { emailRedirectTo: window.location.origin },
    });
    setBusy(false);
    if (error) toast.error(error.message);
    else toast.success("Verification email sent again");
  }

  return (
    <main className="mx-auto flex min-h-screen w-full max-w-md flex-col justify-center px-6">
      <div className="surface rounded-3xl p-6 text-center">
        <div className="mx-auto grid size-14 place-items-center rounded-2xl bg-accent">
          <MailCheck className="size-7 text-accent-foreground" />
        </div>
        <h1 className="mt-4 font-display text-2xl font-bold text-foreground">Check your inbox</h1>
        <p className="mt-2 text-sm text-muted-foreground">
          We sent a verification link{email ? " to " : " to your email address"}
          {email ? <span className="font-semibold text-foreground">{email}</span> : null}. Tap the
          link to activate your account, then come back and sign in.
        </p>

        <Input
          type="email"
          value={email}
          onChange={(e) => setEmail(e.target.value)}
          placeholder="Your email"
          className="mt-5 h-12 rounded-2xl"
        />
        <Button
          onClick={resend}
          disabled={busy || !email}
          className="btn-lime mt-3 h-12 w-full rounded-2xl font-semibold"
        >
          Resend verification email
        </Button>
        <Link
          to="/auth"
          className="mt-4 block text-xs font-semibold text-primary underline"
        >
          Back to login
        </Link>
      </div>
    </main>
  );
}
