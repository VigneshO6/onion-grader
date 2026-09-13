import { createFileRoute, useNavigate, Link } from "@tanstack/react-router";
import { useEffect, useState } from "react";
import { ArrowRight, Eye, EyeOff, Loader2, Lock, Mail, ScanLine, ShieldCheck, Sparkles } from "lucide-react";
import { toast } from "sonner";

import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Checkbox } from "@/components/ui/checkbox";
import { supabase } from "@/integrations/supabase/client";
import { lovable } from "@/integrations/lovable/index";
import heroImage from "@/assets/onion-hero.jpg";

export const Route = createFileRoute("/auth")({
  ssr: false,
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
    <main className="min-h-screen bg-background lg:grid lg:grid-cols-[minmax(0,1.15fr)_minmax(30rem,.85fr)]">
      <section className="relative min-h-64 overflow-hidden sm:min-h-80 lg:min-h-screen">
        <img
          src={heroImage}
          alt="Freshly harvested onions spread out for grading"
          className="absolute inset-0 h-full w-full object-cover"
        />
        <div className="bg-gradient-ink absolute inset-0" />
        <div className="relative flex h-full min-h-64 flex-col justify-between p-6 sm:min-h-80 sm:p-10 lg:min-h-screen lg:p-14 xl:p-20">
          <Link to="/auth" className="flex w-fit items-center gap-3 text-primary-foreground">
            <span className="onion-mark grid size-11 place-items-center font-display text-lg font-extrabold">O</span>
            <span className="font-display text-xl font-extrabold">OnionGrade</span>
          </Link>
          <div className="max-w-xl pb-2 lg:pb-6">
            <span className="inline-flex items-center gap-2 rounded-full bg-card/15 px-3 py-1.5 text-xs font-bold text-primary-foreground backdrop-blur">
              <Sparkles className="size-3.5" /> AI-powered quality detection
            </span>
            <h1 className="mt-4 max-w-lg font-display text-3xl leading-tight font-extrabold text-primary-foreground sm:text-4xl lg:text-5xl">
              Better grading begins with a clearer view.
            </h1>
            <p className="mt-3 hidden max-w-md text-sm text-primary-foreground/85 sm:block">
              Detect damaged, rotten, sprouted and undersized onions, then create a trusted report in seconds.
            </p>
            <div className="mt-6 hidden flex-wrap gap-3 lg:flex">
              <span className="flex items-center gap-2 text-xs font-semibold text-primary-foreground"><ScanLine className="size-4" /> Instant grading</span>
              <span className="flex items-center gap-2 text-xs font-semibold text-primary-foreground"><ShieldCheck className="size-4" /> Secure farmer reports</span>
            </div>
          </div>
        </div>
      </section>

      <section className="flex min-h-[calc(100vh-16rem)] items-center px-5 py-8 sm:min-h-[calc(100vh-20rem)] sm:px-10 lg:min-h-screen lg:px-12 xl:px-20">
        <div className="mx-auto w-full max-w-md">
          <p className="text-xs font-extrabold tracking-widest text-primary uppercase">Farmer workspace</p>
          <h2 className="mt-2 font-display text-3xl font-extrabold text-foreground lg:text-4xl">
            {mode === "login" ? "Welcome back" : "Create your account"}
          </h2>
          <p className="mt-2 text-sm text-muted-foreground">
            {mode === "login" ? "Sign in to scan lots and access your reports." : "Start grading and save every harvest report."}
          </p>

          <form onSubmit={submit} className="mt-7 space-y-3">
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
            <Button
              type="button"
              variant="ghost"
              size="icon"
              onClick={() => setShow((s) => !s)}
              aria-label={show ? "Hide password" : "Show password"}
              className="shrink-0 rounded-full text-muted-foreground"
            >
              {show ? <EyeOff className="size-4" /> : <Eye className="size-4" />}
            </Button>
          </div>

          <div className="flex items-center justify-between gap-3 px-1 text-xs">
            <label className="flex items-center gap-2 text-muted-foreground">
              <Checkbox checked={remember} onCheckedChange={(v) => setRemember(Boolean(v))} />
              Remember me
            </label>
            <Button type="button" variant="link" onClick={forgot} className="h-auto p-0 text-xs font-semibold">
              Forgot Password?
            </Button>
          </div>

          <Button type="submit" disabled={busy} className="btn-violet h-13 w-full rounded-2xl text-sm font-bold tracking-widest uppercase">
            {busy ? <Loader2 className="size-4 animate-spin" /> : null}
            {mode === "login" ? "Login" : "Sign up"}
            {!busy ? <ArrowRight className="size-4" /> : null}
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
          <Button
            type="button"
            variant="link"
            className="font-semibold text-primary underline"
            onClick={() => setMode(mode === "login" ? "signup" : "login")}
          >
            {mode === "login" ? "Sign up" : "Login"}
          </Button>
        </p>
        <p className="mt-2 text-center text-xs text-muted-foreground">
          <Link to="/verify-email" search={{ email: "" }} className="underline">
            Didn't get the verification email?
          </Link>
        </p>
        </div>
      </section>
    </main>
  );
}
