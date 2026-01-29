"use client";

import { useState } from "react";
import Link from "next/link";
import { ui } from "@/lib/uiStyles";

export default function ForgotPasswordPage() {
  const [email, setEmail] = useState("");
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState("");
  const [success, setSuccess] = useState(false);
  const [resetLink, setResetLink] = useState<string | null>(null);

  async function handleSubmit(e: React.FormEvent) {
    e.preventDefault();
    setError("");
    setSuccess(false);
    setResetLink(null);
    setLoading(true);

    try {
      const res = await fetch("/api/auth/forgot-password", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ email }),
      });

      const data = await res.json();

      if (!res.ok) {
        setError(data.error || "Failed to send reset link");
        setLoading(false);
        return;
      }

      setSuccess(true);
      // In development, we get the reset link directly
      if (data.resetLink) {
        setResetLink(data.resetLink);
      }

      setLoading(false);
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
                <svg className="h-10 w-10 text-sage-dark" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M3 8l7.89 5.26a2 2 0 002.22 0L21 8M5 19h14a2 2 0 002-2V7a2 2 0 00-2-2H5a2 2 0 00-2 2v10a2 2 0 002 2z" />
                </svg>
              </div>
            </div>
            <h1 className="text-2xl font-display font-bold text-earth-deep">
              Check Your Email
            </h1>
            <p className="mt-2 text-sm text-earth-warm">
              If an account exists for <strong>{email}</strong>, we&apos;ve sent a password reset link.
            </p>
          </div>

          {/* Development mode: Show direct reset link */}
          {resetLink && (
            <div className="rounded-lg border border-mustard/30 bg-mustard/10 p-4 space-y-3">
              <p className="text-xs text-earth-deep font-medium">
                Development Mode: Click below to reset your password
              </p>
              <Link
                href={resetLink}
                className={`block w-full text-center ${ui.btn} ${ui.btnPrimary}`}
              >
                Reset Password Now
              </Link>
            </div>
          )}

          <div className="text-center space-y-3 pt-2">
            <p className="text-xs text-earth-warm">
              Didn&apos;t receive the email? Check your spam folder or try again.
            </p>
            <button
              onClick={() => {
                setSuccess(false);
                setResetLink(null);
              }}
              className="text-sm text-sage-dark hover:text-sage hover:underline font-medium"
            >
              Try a different email
            </button>
            <Link
              href="/login"
              className="block text-sm text-earth-warm hover:text-earth-deep hover:underline"
            >
              Back to login
            </Link>
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
            Forgot Password?
          </h1>
          <p className="mt-2 text-sm text-earth-warm">
            No worries! Enter your email and we&apos;ll send you a reset link.
          </p>
        </div>

        <form onSubmit={handleSubmit} className="space-y-4">
          <div>
            <label
              htmlFor="email"
              className="block text-sm font-medium text-earth-deep mb-1.5"
            >
              Email Address
            </label>
            <input
              id="email"
              type="email"
              value={email}
              onChange={(e) => setEmail(e.target.value)}
              className="w-full rounded-lg border-2 border-cream-200 px-4 py-2.5 text-sm focus:border-sage focus:outline-none focus:ring-2 focus:ring-sage/20 transition-all"
              placeholder="your@email.com"
              required
              autoComplete="email"
              autoFocus
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
            {loading ? "Sending..." : "Send Reset Link"}
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
