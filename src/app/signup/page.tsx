"use client";

import { useState } from "react";
import { useRouter } from "next/navigation";
import Link from "next/link";
import { signIn } from "next-auth/react";
import { ui } from "@/lib/uiStyles";

export default function SignupPage() {
  const router = useRouter();
  const [email, setEmail] = useState("");
  const [password, setPassword] = useState("");
  const [confirmPassword, setConfirmPassword] = useState("");
  const [name, setName] = useState("");
  const [error, setError] = useState("");
  const [loading, setLoading] = useState(false);

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

    setLoading(true);

    try {
      // Create user
      const res = await fetch("/api/register", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ email, password, name }),
      });

      const data = await res.json();

      if (!res.ok) {
        setError(data.error || "Failed to create account");
        setLoading(false);
        return;
      }

      // Auto-login after signup
      const signInResult = await signIn("credentials", {
        email,
        password,
        redirect: false,
      });

      if (signInResult?.error) {
        setError("Account created but login failed. Please try logging in.");
        setLoading(false);
        return;
      }

      router.push("/");
      router.refresh();
    } catch (err) {
      setError("An error occurred. Please try again.");
      setLoading(false);
    }
  }

  return (
    <div className="flex min-h-screen items-center justify-center p-4 bg-gradient-to-br from-cream-100 via-sage-light/20 to-cream-50 relative overflow-hidden">
      {/* Decorative background elements */}
      <div className="absolute inset-0 opacity-30">
        <div className="absolute top-10 left-10 w-32 h-32 bg-sage-light rounded-full blur-3xl"></div>
        <div className="absolute top-40 right-20 w-40 h-40 bg-sage/30 rounded-full blur-3xl"></div>
        <div className="absolute bottom-20 left-1/3 w-36 h-36 bg-mustard-light/30 rounded-full blur-3xl"></div>
      </div>

      <div className="relative w-full max-w-md space-y-6 rounded-2xl border border-cream-200 bg-white/80 backdrop-blur-sm p-8 shadow-xl">
        <div className="text-center space-y-4">
          {/* Brand logo */}
          <div className="flex justify-center">
            <div className="w-20 h-20">
              <svg viewBox="0 0 120 120" fill="none" xmlns="http://www.w3.org/2000/svg" className="w-full h-full drop-shadow-lg">
                {/* Soil/ground curve */}
                <ellipse cx="60" cy="95" rx="45" ry="12" fill="#6B5B4F"/>
                {/* Seed in soil */}
                <ellipse cx="60" cy="88" rx="12" ry="8" fill="#A85A3A"/>
                {/* Main stem */}
                <path d="M60 85 Q60 65 60 50" stroke="#5C7A56" strokeWidth="6" strokeLinecap="round"/>
                {/* Left leaf */}
                <path d="M60 55 Q45 45 38 30 Q50 35 60 50" fill="#7D9A78"/>
                {/* Right leaf */}
                <path d="M60 50 Q75 40 82 25 Q70 32 60 45" fill="#A8C4A2"/>
                {/* Small emerging leaf at top */}
                <path d="M60 50 Q55 42 52 35 Q58 38 60 48" fill="#7D9A78"/>
              </svg>
            </div>
          </div>

          <div>
            <h1 className="text-3xl font-display font-bold bg-gradient-to-r from-sage-dark to-sage bg-clip-text text-transparent">
              Create Account
            </h1>
            <p className="mt-2 text-sm text-earth-warm">
              Start planning your garden today
            </p>
          </div>
        </div>

        <form onSubmit={handleSubmit} className="space-y-4">
          <div>
            <label
              htmlFor="name"
              className="block text-sm font-medium text-earth-deep mb-1.5"
            >
              Name (optional)
            </label>
            <input
              id="name"
              type="text"
              value={name}
              onChange={(e) => setName(e.target.value)}
              className="w-full rounded-lg border-2 border-cream-200 bg-white px-4 py-2.5 text-sm text-earth-deep placeholder-earth-warm/50 transition-colors focus:border-sage focus:outline-none focus:ring-2 focus:ring-sage/20"
              autoComplete="name"
            />
          </div>

          <div>
            <label
              htmlFor="email"
              className="block text-sm font-medium text-earth-deep mb-1.5"
            >
              Email
            </label>
            <input
              id="email"
              type="email"
              value={email}
              onChange={(e) => setEmail(e.target.value)}
              className="w-full rounded-lg border-2 border-cream-200 bg-white px-4 py-2.5 text-sm text-earth-deep placeholder-earth-warm/50 transition-colors focus:border-sage focus:outline-none focus:ring-2 focus:ring-sage/20"
              required
              autoComplete="email"
            />
          </div>

          <div>
            <label
              htmlFor="password"
              className="block text-sm font-medium text-earth-deep mb-1.5"
            >
              Password
            </label>
            <input
              id="password"
              type="password"
              value={password}
              onChange={(e) => setPassword(e.target.value)}
              className="w-full rounded-lg border-2 border-cream-200 bg-white px-4 py-2.5 text-sm text-earth-deep placeholder-earth-warm/50 transition-colors focus:border-sage focus:outline-none focus:ring-2 focus:ring-sage/20"
              required
              autoComplete="new-password"
              minLength={8}
            />
          </div>

          <div>
            <label
              htmlFor="confirm-password"
              className="block text-sm font-medium text-earth-deep mb-1.5"
            >
              Confirm Password
            </label>
            <input
              id="confirm-password"
              type="password"
              value={confirmPassword}
              onChange={(e) => setConfirmPassword(e.target.value)}
              className="w-full rounded-lg border-2 border-cream-200 bg-white px-4 py-2.5 text-sm text-earth-deep placeholder-earth-warm/50 transition-colors focus:border-sage focus:outline-none focus:ring-2 focus:ring-sage/20"
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
            className="w-full rounded-lg bg-gradient-to-r from-sage to-sage-dark px-4 py-2.5 text-sm font-medium text-white shadow-md hover:shadow-lg hover:scale-[1.02] transition-all duration-200 disabled:opacity-50 disabled:cursor-not-allowed disabled:hover:scale-100"
          >
            {loading ? (
              <span className="flex items-center justify-center gap-2">
                <svg className="animate-spin h-4 w-4" viewBox="0 0 24 24">
                  <circle className="opacity-25" cx="12" cy="12" r="10" stroke="currentColor" strokeWidth="4" fill="none" />
                  <path className="opacity-75" fill="currentColor" d="M4 12a8 8 0 018-8V0C5.373 0 0 5.373 0 12h4zm2 5.291A7.962 7.962 0 014 12H0c0 3.042 1.135 5.824 3 7.938l3-2.647z" />
                </svg>
                Creating account...
              </span>
            ) : (
              "Create Account"
            )}
          </button>
        </form>

        <div className="relative">
          <div className="absolute inset-0 flex items-center">
            <div className="w-full border-t border-cream-200"></div>
          </div>
          <div className="relative flex justify-center text-xs">
            <span className="bg-white px-3 text-earth-warm font-medium">Already have an account?</span>
          </div>
        </div>

        <div className="text-center">
          <Link href="/login" className="text-sm text-sage-dark hover:text-sage hover:underline font-medium">
            Sign in here
          </Link>
        </div>
      </div>
    </div>
  );
}
