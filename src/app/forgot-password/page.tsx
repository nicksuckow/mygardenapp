"use client";

import { useState } from "react";
import Link from "next/link";
import { ui } from "@/lib/uiStyles";

export default function ForgotPasswordPage() {
  const [email, setEmail] = useState("");
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState("");
  const [resetToken, setResetToken] = useState<string | null>(null);
  const [tokenExpires, setTokenExpires] = useState<string | null>(null);

  async function handleSubmit(e: React.FormEvent) {
    e.preventDefault();
    setError("");
    setResetToken(null);
    setLoading(true);

    try {
      const res = await fetch("/api/auth/forgot-password", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ email }),
      });

      const data = await res.json();

      if (!res.ok) {
        setError(data.error || "Failed to generate reset token");
        setLoading(false);
        return;
      }

      // If token is returned, display it (development mode)
      if (data.token) {
        setResetToken(data.token);
        setTokenExpires(data.expires);
      } else {
        setError("Reset request processed. If an account exists, a token would be sent via email.");
      }

      setLoading(false);
    } catch (err) {
      setError("An error occurred. Please try again.");
      setLoading(false);
    }
  }

  if (resetToken) {
    const resetUrl = `/reset-password?token=${resetToken}`;
    const expiresDate = tokenExpires ? new Date(tokenExpires).toLocaleString() : "Unknown";

    return (
      <div className="flex min-h-screen items-center justify-center p-4">
        <div className="w-full max-w-md space-y-6 rounded-lg border border-cream-200 bg-white p-8 shadow-sm">
          <div className="text-center">
            <h1 className="text-2xl font-display font-semibold text-earth-deep">
              Reset Token Generated
            </h1>
            <p className="mt-2 text-sm text-earth-warm">
              Your password reset token has been created
            </p>
          </div>

          <div className="rounded-lg border border-sage/30 bg-sage/10 p-4">
            <p className="mb-2 text-sm font-medium text-sage-dark">
              Reset Token (save this):
            </p>
            <div className="mb-3 rounded bg-white p-3 font-mono text-xs text-earth-deep break-all">
              {resetToken}
            </div>
            <p className="text-xs text-sage-dark">
              Expires: {expiresDate}
            </p>
          </div>

          <div className="space-y-3">
            <Link
              href={resetUrl}
              className={`block w-full text-center ${ui.btn} ${ui.btnPrimary}`}
            >
              Reset Password Now
            </Link>

            <Link
              href="/login"
              className="block text-center text-sm text-earth-warm hover:text-earth-deep hover:underline"
            >
              Back to login
            </Link>
          </div>

          <div className="rounded border border-mustard/30 bg-mustard/10 p-3">
            <p className="text-xs text-earth-deep">
              <strong>Development Mode:</strong> In production, this token would be sent to your email instead of being displayed here.
            </p>
          </div>
        </div>
      </div>
    );
  }

  return (
    <div className="flex min-h-screen items-center justify-center p-4">
      <div className="w-full max-w-md space-y-6 rounded-lg border border-cream-200 bg-white p-8 shadow-sm">
        <div className="text-center">
          <h1 className="text-2xl font-display font-semibold text-earth-deep">
            Forgot Password
          </h1>
          <p className="mt-2 text-sm text-earth-warm">
            Enter your email to receive a password reset token
          </p>
        </div>

        <form onSubmit={handleSubmit} className="space-y-4">
          <div>
            <label
              htmlFor="email"
              className="block text-sm font-medium text-earth-deep mb-1"
            >
              Email
            </label>
            <input
              id="email"
              type="email"
              value={email}
              onChange={(e) => setEmail(e.target.value)}
              className="w-full rounded border border-cream-200 px-3 py-2 text-sm focus:border-sage focus:outline-none focus:ring-2 focus:ring-sage/20"
              required
              autoComplete="email"
              autoFocus
            />
          </div>

          {error && (
            <div className="rounded bg-terracotta/10 border border-terracotta/30 px-3 py-2 text-sm text-terracotta-dark">
              {error}
            </div>
          )}

          <button
            type="submit"
            disabled={loading}
            className={`w-full ${ui.btn} ${ui.btnPrimary}`}
          >
            {loading ? "Processing..." : "Request Reset Token"}
          </button>
        </form>

        <div className="text-center space-y-2">
          <Link
            href="/login"
            className="block text-sm text-earth-warm hover:text-earth-deep hover:underline"
          >
            Back to login
          </Link>
          <Link
            href="/signup"
            className="block text-sm text-earth-warm hover:text-earth-deep hover:underline"
          >
            Create a new account
          </Link>
        </div>
      </div>
    </div>
  );
}
