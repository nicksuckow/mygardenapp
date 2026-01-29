"use client";

import { useState, useEffect, Suspense } from "react";
import { useRouter, useSearchParams } from "next/navigation";
import Link from "next/link";
import { ui } from "@/lib/uiStyles";

function ResetPasswordForm() {
  const router = useRouter();
  const searchParams = useSearchParams();
  const tokenFromUrl = searchParams.get("token");

  const [token, setToken] = useState(tokenFromUrl || "");
  const [password, setPassword] = useState("");
  const [confirmPassword, setConfirmPassword] = useState("");
  const [error, setError] = useState("");
  const [loading, setLoading] = useState(false);
  const [success, setSuccess] = useState(false);

  useEffect(() => {
    if (tokenFromUrl) {
      setToken(tokenFromUrl);
    }
  }, [tokenFromUrl]);

  async function handleSubmit(e: React.FormEvent) {
    e.preventDefault();
    setError("");

    if (password !== confirmPassword) {
      setError("Passwords don't match");
      return;
    }

    if (password.length < 8) {
      setError("Password must be at least 8 characters");
      return;
    }

    if (!token) {
      setError("Reset token is required");
      return;
    }

    setLoading(true);

    try {
      const res = await fetch("/api/auth/reset-password", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ token, password }),
      });

      const data = await res.json();

      if (!res.ok) {
        setError(data.error || "Failed to reset password");
        setLoading(false);
        return;
      }

      setSuccess(true);
      setTimeout(() => {
        router.push("/login");
      }, 2000);
    } catch (err) {
      setError("An error occurred. Please try again.");
      setLoading(false);
    }
  }

  if (success) {
    return (
      <div className="flex min-h-screen items-center justify-center p-4">
        <div className="w-full max-w-md space-y-6 rounded-lg border border-cream-200 bg-white p-8 shadow-sm">
          <div className="text-center">
            <div className="mb-4 flex justify-center">
              <div className="rounded-full bg-sage/10 p-3">
                <svg
                  className="h-8 w-8 text-sage-dark"
                  fill="none"
                  stroke="currentColor"
                  viewBox="0 0 24 24"
                >
                  <path
                    strokeLinecap="round"
                    strokeLinejoin="round"
                    strokeWidth={2}
                    d="M5 13l4 4L19 7"
                  />
                </svg>
              </div>
            </div>
            <h1 className="text-2xl font-display font-semibold text-earth-deep">
              Password Reset Successful
            </h1>
            <p className="mt-2 text-sm text-earth-warm">
              Your password has been updated. Redirecting to login...
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
            Reset Password
          </h1>
          <p className="mt-2 text-sm text-earth-warm">
            Enter your new password
          </p>
        </div>

        <form onSubmit={handleSubmit} className="space-y-4">
          <div>
            <label
              htmlFor="token"
              className="block text-sm font-medium text-earth-deep mb-1"
            >
              Reset Token
            </label>
            <input
              id="token"
              type="text"
              value={token}
              onChange={(e) => setToken(e.target.value)}
              className="w-full rounded border border-cream-200 px-3 py-2 text-sm font-mono focus:border-sage focus:outline-none focus:ring-2 focus:ring-sage/20"
              required
              placeholder="Enter your reset token"
            />
          </div>

          <div>
            <label
              htmlFor="password"
              className="block text-sm font-medium text-earth-deep mb-1"
            >
              New Password
            </label>
            <input
              id="password"
              type="password"
              value={password}
              onChange={(e) => setPassword(e.target.value)}
              className="w-full rounded border border-cream-200 px-3 py-2 text-sm focus:border-sage focus:outline-none focus:ring-2 focus:ring-sage/20"
              required
              autoComplete="new-password"
              minLength={8}
            />
          </div>

          <div>
            <label
              htmlFor="confirm-password"
              className="block text-sm font-medium text-earth-deep mb-1"
            >
              Confirm New Password
            </label>
            <input
              id="confirm-password"
              type="password"
              value={confirmPassword}
              onChange={(e) => setConfirmPassword(e.target.value)}
              className="w-full rounded border border-cream-200 px-3 py-2 text-sm focus:border-sage focus:outline-none focus:ring-2 focus:ring-sage/20"
              required
              autoComplete="new-password"
              minLength={8}
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
            {loading ? "Resetting password..." : "Reset Password"}
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
            href="/forgot-password"
            className="block text-sm text-earth-warm hover:text-earth-deep hover:underline"
          >
            Request a new token
          </Link>
        </div>
      </div>
    </div>
  );
}

export default function ResetPasswordPage() {
  return (
    <Suspense fallback={<div className="flex min-h-screen items-center justify-center text-earth-warm">Loading...</div>}>
      <ResetPasswordForm />
    </Suspense>
  );
}
