import { createFileRoute, useNavigate } from "@tanstack/react-router";
import { useState } from "react";
import { toast } from "sonner";
import { useSignUp } from "@clerk/tanstack-react-start";
import { blockAuth } from "@/integrations/blockAuth";

export const Route = createFileRoute("/verify-email")({
  component: VerifyEmailPage,
  beforeLoad: async () => await blockAuth(),
  loader: async ({ context }) => {
    return { isAuthenticated: context.isAuthenticated }
  },
});

function VerifyEmailPage() {
  const navigate = useNavigate();

  const [code, setCode] = useState("");
  const [loading, setLoading] = useState(false);

  const { signUp } = useSignUp();

  const handleSubmit = async (
    e: React.FormEvent<HTMLFormElement>
  ) => {
    e.preventDefault();

    if (!signUp) {
      toast.error("Signup session not found");
      return;
    }

    try {
      setLoading(true);

      const result = await signUp.verifications.verifyEmailCode({
        code,
      });

      if (result.error === null) {
        await signUp.finalize();

        toast.success(
          "Email verified successfully"
        );

        navigate({
          to: "/dashboard",
        });

        return;
      }

      toast.error(
        result.error?.message ?? "Verification incomplete"
      );
    } catch (error: any) {
      console.error(
        JSON.stringify(error, null, 2)
      );

      toast.error(
        error?.errors?.[0]?.longMessage ??
        "Invalid verification code"
      );
    } finally {
      setLoading(false);
    }
  };

  return (
    <div className="flex min-h-screen items-center justify-center bg-black px-4">
      <div className="w-full max-w-md rounded-2xl border border-white/10 bg-white/5 p-8 backdrop-blur">
        <h1 className="mb-2 text-3xl font-bold text-white">
          Verify Email
        </h1>

        <p className="mb-6 text-sm text-white/60">
          Enter the verification code sent to your email.
        </p>

        <form
          onSubmit={handleSubmit}
          className="space-y-4"
        >
          <input
            type="text"
            placeholder="Enter verification code"
            value={code}
            onChange={(e) =>
              setCode(e.target.value)
            }
            className="w-full rounded-xl border border-white/10 bg-black/40 px-4 py-3 text-white outline-none focus:border-white/30"
            required
          />

          <button
            type="submit"
            disabled={loading}
            className="w-full rounded-xl bg-white px-4 py-3 font-medium text-black transition hover:opacity-90 disabled:opacity-50"
          >
            {loading
              ? "Verifying..."
              : "Verify Email"}
          </button>
        </form>
      </div>
    </div>
  );
}