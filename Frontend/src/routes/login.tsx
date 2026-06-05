import { createFileRoute, Link, useNavigate } from "@tanstack/react-router";
import { useState } from "react";
import { motion } from "framer-motion";
import { Sparkles, Loader2, Mail, Lock } from "lucide-react";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { toast } from "sonner";
import { GoogleOneTap, useClerk, useSignIn } from "@clerk/tanstack-react-start";
import { blockAuth } from "@/integrations/blockAuth";

export const Route = createFileRoute("/login")({
  head: () => ({
    meta: [
      { title: "Sign in — Vectra" },
      { name: "description", content: "Sign in to your Vectra account to generate, vectorize, and edit." },
    ],
  }),
  component: LoginPage,
  beforeLoad: async () => await blockAuth(),
  loader: async ({ context }) => {
    return { isAuthenticated: context.isAuthenticated }
  },
});

function LoginPage() {
  const navigate = useNavigate();
  const [email, setEmail] = useState("");
  const [password, setPassword] = useState("");
  const [loading, setLoading] = useState(false);

  const { signIn } = useSignIn();
  const { client } = useClerk();

  const onEmailSignIn = async (e: React.FormEvent) => {
    e.preventDefault();
    try {
      setLoading(true);
      const result = await signIn.create({
        identifier: email,
        password,
      });
      if (result?.error) {
        throw result.error;
      }
      navigate({ to: "/dashboard" });
    } catch (error) {
      console.error("Sign in failed", error);
      toast.error(`Sign in failed: ${(error as Error).message}`);
    } finally {
      setLoading(false);
    }
  };
  const onGoogleSignIn = async () => {
    if (!client) return;

    try {
      // SignInFutureResource uses this modern redirect syntax
      await client.signIn.authenticateWithRedirect({
        strategy: "oauth_google",
        redirectUrl: "/login",
        redirectUrlComplete: "/dashboard", // Target route after successful authentication
      });
    } catch (err) {
      console.error("Clerk OAuth Error:", err);
    }
  };

  return <AuthShell mode="signin" loading={loading} email={email} password={password}
    setEmail={setEmail} setPassword={setPassword} onSubmit={onEmailSignIn} onGoogleSignIn={onGoogleSignIn} />;
}

export function AuthShell({
  mode, loading, email, password, setEmail, setPassword, onSubmit, onGoogleSignIn
}: {
  mode: "signin" | "signup";
  loading: boolean;
  email: string;
  password: string;
  setEmail: (v: string) => void;
  setPassword: (v: string) => void;
  onGoogleSignIn: () => void;
  onSubmit: (e: React.FormEvent) => void;
}) {
  const isSignin = mode === "signin";
  return (
    <main className="relative flex min-h-screen items-center justify-center overflow-hidden bg-background px-4 py-12">
      <div className="absolute inset-0 -z-10 opacity-60">
        <div className="absolute -top-40 left-1/4 h-96 w-96 rounded-full bg-gradient-primary blur-3xl opacity-30" />
        <div className="absolute -bottom-40 right-1/4 h-96 w-96 rounded-full bg-accent blur-3xl opacity-20" />
      </div>

      <motion.div
        initial={{ opacity: 0, y: 12 }}
        animate={{ opacity: 1, y: 0 }}
        transition={{ duration: 0.5, ease: "easeOut" }}
        className="glass-strong relative w-full max-w-md rounded-3xl p-8 shadow-elevated"
      >
        <Link to="/" className="mb-8 flex items-center gap-2 font-display text-base font-semibold">
          <span className="relative flex h-9 w-9 items-center justify-center rounded-lg bg-gradient-primary shadow-glow">
            <Sparkles className="h-4 w-4 text-primary-foreground" />
          </span>
          <span>Vectra</span>
        </Link>

        <h1 className="font-display text-3xl font-semibold tracking-tight">
          {isSignin ? "Welcome back" : "Create your account"}
        </h1>
        <p className="mt-2 text-sm text-muted-foreground">
          {isSignin ? "Sign in to continue to your studio." : "Start generating in under a minute."}
        </p>

        <Button
          onClick={onGoogleSignIn}
          type="button"
          variant="outline"
          disabled={loading}
          className="mt-6 w-full justify-center gap-3 border-border/60 bg-secondary/40 hover:bg-secondary/70"
        >
          <GoogleIcon />
          Continue with Google
        </Button>
        {/* <GoogleOneTap /> */}
        <div className="my-6 flex items-center gap-3 text-xs uppercase tracking-wider text-muted-foreground">
          <div className="h-px flex-1 bg-border/60" /> or <div className="h-px flex-1 bg-border/60" />
        </div>

        <form onSubmit={onSubmit} className="space-y-3">
          
          <div className="relative">
            <Mail className="pointer-events-none absolute left-3 top-1/2 h-4 w-4 -translate-y-1/2 text-muted-foreground" />
            <Input
              type="email"
              required
              value={email}
              onChange={(e) => setEmail(e.target.value)}
              placeholder="you@studio.com"
              autoComplete="email"
              className="h-11 pl-10"
            />
          </div>
          <div className="relative">
            <Lock className="pointer-events-none absolute left-3 top-1/2 h-4 w-4 -translate-y-1/2 text-muted-foreground" />
            <Input
              type="password"
              required
              minLength={6}
              value={password}
              onChange={(e) => setPassword(e.target.value)}
              placeholder={isSignin ? "Your password" : "At least 6 characters"}
              autoComplete={isSignin ? "current-password" : "new-password"}
              className="h-11 pl-10"
            />
          </div>
          <div id="clerk-captcha" />
          <Button
            type="submit"
            disabled={loading}
            className="h-11 w-full bg-gradient-primary text-primary-foreground shadow-glow hover:opacity-90"
          >
            {loading ? <Loader2 className="h-4 w-4 animate-spin" /> : isSignin ? "Sign in" : "Create account"}
          </Button>
        </form>

        <p className="mt-6 text-center text-sm text-muted-foreground">
          {isSignin ? (
            <>Don&apos;t have an account?{" "}
              <Link to="/signup" className="font-medium text-foreground hover:underline">Sign up</Link>
            </>
          ) : (
            <>Already have an account?{" "}
              <Link to="/login" className="font-medium text-foreground hover:underline">Sign in</Link>
            </>
          )}
        </p>
      </motion.div>
    </main>
  );
}

function GoogleIcon() {
  return (
    <svg viewBox="0 0 24 24" className="h-4 w-4" aria-hidden="true">
      <path fill="#EA4335" d="M12 11v3.6h5.1c-.2 1.3-1.6 3.8-5.1 3.8-3.1 0-5.6-2.5-5.6-5.6S8.9 7.2 12 7.2c1.7 0 2.9.7 3.6 1.4l2.5-2.4C16.6 4.8 14.5 4 12 4 7.6 4 4 7.6 4 12s3.6 8 8 8c4.6 0 7.7-3.2 7.7-7.8 0-.5-.1-.9-.1-1.2H12z"/>
    </svg>
  );
}