"use client";

import { useState, useEffect, Suspense } from "react";
import { useRouter, useSearchParams } from "next/navigation";
import Link from "next/link";

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
      <div className="flex min-h-screen items-center justify-center p-4 bg-gradient-to-br from-cream-100 via-sage-light/20 to-cream-50">
        <div className="w-full max-w-md space-y-6 rounded-2xl border border-cream-200 bg-white p-8 shadow-xl">
          <div className="text-center">
            <div className="mb-4 flex justify-center">
              <div className="rounded-full bg-sage/10 p-4">
                <svg
                  className="h-10 w-10 text-sage-dark"
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
            <h1 className="text-2xl font-display font-bold text-earth-deep">
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
    <div className="flex min-h-screen items-center justify-center p-4 bg-gradient-to-br from-cream-100 via-sage-light/20 to-cream-50">
      <div className="w-full max-w-md space-y-6 rounded-2xl border border-cream-200 bg-white p-8 shadow-xl">
        <div className="text-center">
          <div className="mb-4 flex justify-center">
            <div className="w-16 h-16">
              <svg viewBox="0 0 120 120" fill="none" xmlns="http://www.w3.org/2000/svg" className="w-full h-full drop-shadow-md">
                <ellipse cx="60" cy="95" rx="45" ry="12" fill="#6B5B4F"/>
                <ellipse cx="60" cy="88" rx="12" ry="8" fill="#A85A3A"/>
                <path d="M60 85 Q60 65 60 50" stroke="#5C7A56" strokeWidth="6" strokeLinecap="round"/>
                <path d="M60 55 Q45 45 38 30 Q50 35 60 50" fill="#7D9A78"/>
                <path d="M60 50 Q75 40 82 25 Q70 32 60 45" fill="#A8C4A2"/>
                <path d="M60 50 Q55 42 52 35 Q58 38 60 48" fill="#7D9A78"/>
              </svg>
            </div>
          </div>
          <h1 className="text-2xl font-display font-bold text-earth-deep">
            Reset Password
          </h1>
          <p className="mt-2 text-sm text-earth-warm">
            Enter your new password
          </p>
        </div>

        <form onSubmit={handleSubmit} className="space-y-4">
          {/* Only show token field if not provided via URL */}
          {!tokenFromUrl && (
            <div>
              <label
                htmlFor="token"
                className="block text-sm font-medium text-earth-deep mb-1.5"
              >
                Reset Token
              </label>
              <input
                id="token"
                type="text"
                value={token}
                onChange={(e) => setToken(e.target.value)}
                className="w-full rounded-lg border-2 border-cream-200 px-4 py-2.5 text-sm font-mono focus:border-sage focus:outline-none focus:ring-2 focus:ring-sage/20 transition-all"
                required
                placeholder="Enter your reset token"
              />
            </div>
          )}

          <div>
            <label
              htmlFor="password"
              className="block text-sm font-medium text-earth-deep mb-1.5"
            >
              New Password
            </label>
            <input
              id="password"
              type="password"
              value={password}
              onChange={(e) => setPassword(e.target.value)}
              className="w-full rounded-lg border-2 border-cream-200 px-4 py-2.5 text-sm focus:border-sage focus:outline-none focus:ring-2 focus:ring-sage/20 transition-all"
              required
              autoComplete="new-password"
              minLength={8}
              autoFocus={!!tokenFromUrl}
            />
          </div>

          <div>
            <label
              htmlFor="confirm-password"
              className="block text-sm font-medium text-earth-deep mb-1.5"
            >
              Confirm New Password
            </label>
            <input
              id="confirm-password"
              type="password"
              value={confirmPassword}
              onChange={(e) => setConfirmPassword(e.target.value)}
              className="w-full rounded-lg border-2 border-cream-200 px-4 py-2.5 text-sm focus:border-sage focus:outline-none focus:ring-2 focus:ring-sage/20 transition-all"
              required
              autoComplete="new-password"
              minLength={8}
            />
          </div>

          {error && (
            <div className="rounded-lg bg-terracotta/10 border border-terracotta/30 px-4 py-3 text-sm text-terracotta-dark">
              {error}
            </div>
          )}

          <button
            type="submit"
            disabled={loading}
            className="w-full rounded-lg bg-gradient-to-r from-sage to-sage-dark px-4 py-3 text-sm font-semibold text-white hover:from-sage-dark hover:to-sage disabled:opacity-50 disabled:cursor-not-allowed shadow-md hover:shadow-lg transition-all"
          >
            {loading ? "Resetting password..." : "Reset Password"}
          </button>
        </form>

        <div className="text-center space-y-2">
          <Link
            href="/login"
            className="block text-sm text-sage-dark hover:text-sage hover:underline font-medium"
          >
            Back to login
          </Link>
          <Link
            href="/forgot-password"
            className="block text-sm text-earth-warm hover:text-earth-deep hover:underline"
          >
            Request a new reset link
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
