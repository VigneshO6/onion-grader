import { createFileRoute, useNavigate } from "@tanstack/react-router";
import { KeyRound } from "lucide-react";
import { useState } from "react";
import { toast } from "sonner";

import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { supabase } from "@/integrations/supabase/client";

export const Route = createFileRoute("/reset-password")({
  head: () => ({
    meta: [
      { title: "Set a new password — OnionGrade AI" },
      {
        name: "description",
        content: "Choose a new password for your OnionGrade AI farmer account.",
      },
      { property: "og:title", content: "Set a new password — OnionGrade AI" },
      {
        property: "og:description",
        content: "Complete your password reset and get back to grading onion lots.",
      },
    ],
  }),
  component: ResetPassword,
});

function ResetPassword() {
  const navigate = useNavigate();
  const [password, setPassword] = useState("");
  const [busy, setBusy] = useState(false);

  async function submit(e: React.FormEvent) {
    e.preventDefault();
    setBusy(true);
    const { error } = await supabase.auth.updateUser({ password });
    setBusy(false);
    if (error) {
      toast.error(error.message);
      return;
    }
    toast.success("Password updated");
    navigate({ to: "/", replace: true });
  }

  return (
    <main className="mx-auto flex min-h-screen w-full max-w-md flex-col justify-center px-6">
      <form onSubmit={submit} className="surface rounded-3xl p-6">
        <div className="grid size-14 place-items-center rounded-2xl bg-accent">
          <KeyRound className="size-7 text-accent-foreground" />
        </div>
        <h1 className="mt-4 font-display text-2xl font-bold text-foreground">New password</h1>
        <p className="mt-1 text-sm text-muted-foreground">
          Pick a password of at least 6 characters.
        </p>
        <Input
          type="password"
          value={password}
          onChange={(e) => setPassword(e.target.value)}
          placeholder="New password"
          minLength={6}
          required
          autoComplete="new-password"
          className="mt-5 h-12 rounded-2xl"
        />
        <Button type="submit" disabled={busy} className="btn-lime mt-4 h-12 w-full rounded-2xl font-semibold">
          Update password
        </Button>
      </form>
    </main>
  );
}
