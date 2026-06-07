import { createFileRoute, useNavigate } from "@tanstack/react-router";
import { useState } from "react";
import { toast } from "sonner";
import { AuthShell } from "./login";
import { useClerk, useSignUp } from "@clerk/tanstack-react-start";
import { blockAuth } from "@/integrations/blockAuth";

export const Route = createFileRoute("/signup")({
  head: () => ({
    meta: [
      { title: "Create account — Vectra" },
      { name: "description", content: "Create a Vectra account and start generating premium AI imagery and SVGs." },
    ],
  }),
  component: SignupPage,
  beforeLoad: async () => await blockAuth(),
  loader: async ({ context }) => {
    return { isAuthenticated: context.isAuthenticated }
  },
});

function SignupPage() {
  const navigate = useNavigate();
  const [email, setEmail] = useState("");
  const [password, setPassword] = useState("");
  const [loading, setLoading] = useState(false);

  const { signUp } = useSignUp();
  const { client } = useClerk();

  const onSubmit = async (e: React.FormEvent) => {
     e.preventDefault();
      console.log("onSubmit");
      try {
        setLoading(true);
        if (!signUp) {
          console.log("signUp not found");
          return;
        }

        console.log("signUp", signUp);
        await signUp.create({
          emailAddress: email,
          password,
        });

        await signUp.verifications.sendEmailCode();

        toast.success(
          "Verification code sent to your email"
        );

        navigate({
          to: "/verify-email",
          search: { email },
        });
      } catch (err: any) {
        console.error(err);

        toast.error(
          err?.errors?.[0]?.longMessage ??
          "Signup failed"
        );
      } finally {
        setLoading(false);
      }
  };

  const onGoogle = async () => {
    try {
      if (!client) return;

      await client.signUp.authenticateWithRedirect({
        strategy: "oauth_google",
        redirectUrl: "/sso-callback",
        redirectUrlComplete: "/dashboard", // Target route after successful authentication
      });
    } catch (err) {
      console.error("Clerk OAuth Error:", err);
      toast.error("Google sign up failed");
    }
  };

  return <AuthShell mode="signup" loading={loading} email={email} password={password}
    setEmail={setEmail} setPassword={setPassword} onSubmit={onSubmit} onGoogleSignIn={onGoogle} />;
}