import { createFileRoute, useNavigate, Link } from "@tanstack/react-router";
import { useEffect, useState } from "react";
import { Eye, EyeOff, Loader2, Lock, Mail } from "lucide-react";
import { toast } from "sonner";

import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Checkbox } from "@/components/ui/checkbox";
import { supabase } from "@/integrations/supabase/client";
import { lovable } from "@/integrations/lovable/index";
import heroImage from "@/assets/onion-hero.jpg";

export const Route = createFileRoute("/auth")({
  head: () => ({
    meta: [
      { title: "Sign in — OnionGrade AI onion quality grading" },
      {
        name: "description",
        content:
          "Sign in or create a free OnionGrade AI account to scan onion lots and store Grade A, URS and reject quality reports.",
      },
      { property: "og:title", content: "Sign in — OnionGrade AI" },
      {
        property: "og:description",
        content: "Farmer login for instant AI onion quality grading and digital reports.",
      },
    ],
  }),
  component: AuthScreen,
});

function AuthScreen() {
  const navigate = useNavigate();
  const [mode, setMode] = useState<"login" | "signup">("login");
  const [email, setEmail] = useState("");
  const [password, setPassword] = useState("");
  const [fullName, setFullName] = useState("");
  const [show, setShow] = useState(false);
  const [remember, setRemember] = useState(true);
  const [busy, setBusy] = useState(false);

  useEffect(() => {
    supabase.auth.getSession().then(({ data }) => {
      if (data.session) navigate({ to: "/", replace: true });
    });
  }, [navigate]);

  async function submit(e: React.FormEvent) {
    e.preventDefault();
    setBusy(true);
    try {
      if (mode === "signup") {
        const { error } = await supabase.auth.signUp({
          email,
          password,
          options: {
            emailRedirectTo: window.location.origin,
            data: { full_name: fullName },
          },
        });
        if (error) throw error;
        navigate({ to: "/verify-email", search: { email }, replace: true });
        return;
      }
      const { error } = await supabase.auth.signInWithPassword({ email, password });
      if (error) throw error;
      navigate({ to: "/", replace: true });
    } catch (error) {
      toast.error((error as Error).message || "Could not sign in");
    } finally {
      setBusy(false);
    }
  }

  async function google() {
    const result = await lovable.auth.signInWithOAuth("google", {
      redirect_uri: window.location.origin,
    });
    if (result.error) {
      toast.error("Google sign-in failed");
      return;
    }
    if (result.redirected) return;
    navigate({ to: "/", replace: true });
  }

  async function forgot() {
    if (!email) {
      toast.error("Enter your email first");
      return;
    }
    const { error } = await supabase.auth.resetPasswordForEmail(email, {
      redirectTo: `${window.location.origin}/reset-password`,
    });
    if (error) toast.error(error.message);
    else toast.success("Password reset link sent");
  }

  return (
    <main className="relative mx-auto min-h-screen w-full max-w-md overflow-hidden bg-background">
      <img
        src={heroImage}
        alt="Freshly harvested onions spread out for grading"
        className="absolute inset-x-0 top-0 h-[52vh] w-full object-cover"
      />
      <div className="bg-gradient-ink absolute inset-0" />

      <div className="relative flex min-h-screen flex-col justify-end px-6 pt-40 pb-10">
        <h1 className="font-display text-4xl font-bold text-foreground">
          {mode === "login" ? "Welcome!" : "Create account"}
        </h1>
        <p className="mt-1 text-sm text-muted-foreground">
          AI onion grading for every lot you harvest.
        </p>

        <form onSubmit={submit} className="mt-6 space-y-3">
          {mode === "signup" ? (
            <div className="surface flex items-center gap-3 rounded-2xl px-4">
              <Mail className="size-4 shrink-0 text-muted-foreground" />
              <Input
                value={fullName}
                onChange={(e) => setFullName(e.target.value)}
                placeholder="Full name"
                autoComplete="name"
                required
                className="h-12 border-0 bg-transparent px-0 shadow-none focus-visible:ring-0"
              />
            </div>
          ) : null}

          <div className="surface flex items-center gap-3 rounded-2xl px-4">
            <Mail className="size-4 shrink-0 text-muted-foreground" />
            <Input
              type="email"
              value={email}
              onChange={(e) => setEmail(e.target.value)}
              placeholder="Email"
              autoComplete="email"
              required
              className="h-12 border-0 bg-transparent px-0 shadow-none focus-visible:ring-0"
            />
          </div>

          <div className="surface flex items-center gap-3 rounded-2xl px-4">
            <Lock className="size-4 shrink-0 text-muted-foreground" />
            <Input
              type={show ? "text" : "password"}
              value={password}
              onChange={(e) => setPassword(e.target.value)}
              placeholder="Password"
              autoComplete={mode === "login" ? "current-password" : "new-password"}
              required
              minLength={6}
              className="h-12 border-0 bg-transparent px-0 shadow-none focus-visible:ring-0"
            />
            <button
              type="button"
              onClick={() => setShow((s) => !s)}
              aria-label={show ? "Hide password" : "Show password"}
              className="shrink-0 text-muted-foreground"
            >
              {show ? <EyeOff className="size-4" /> : <Eye className="size-4" />}
            </button>
          </div>

          <div className="flex items-center justify-between gap-3 px-1 text-xs">
            <label className="flex items-center gap-2 text-muted-foreground">
              <Checkbox checked={remember} onCheckedChange={(v) => setRemember(Boolean(v))} />
              Remember me
            </label>
            <button type="button" onClick={forgot} className="font-semibold text-primary">
              Forgot Password?
            </button>
          </div>

          <Button type="submit" disabled={busy} className="btn-lime h-13 w-full rounded-2xl text-sm font-bold tracking-widest uppercase">
            {busy ? <Loader2 className="size-4 animate-spin" /> : null}
            {mode === "login" ? "Login" : "Sign up"}
          </Button>
        </form>

        <Button
          variant="secondary"
          onClick={google}
          className="mt-3 h-12 w-full rounded-2xl text-sm font-semibold"
        >
          Continue with Google
        </Button>

        <p className="mt-6 text-center text-xs text-muted-foreground">
          {mode === "login" ? "Don't have an account?" : "Already registered?"}{" "}
          <button
            type="button"
            className="font-semibold text-primary underline"
            onClick={() => setMode(mode === "login" ? "signup" : "login")}
          >
            {mode === "login" ? "Sign up" : "Login"}
          </button>
        </p>
        <p className="mt-2 text-center text-xs text-muted-foreground">
          <Link to="/verify-email" search={{ email: "" }} className="underline">
            Didn't get the verification email?
          </Link>
        </p>
      </div>
    </main>
  );
}
