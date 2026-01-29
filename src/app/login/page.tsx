"use client";

import { useState } from "react";
import { signIn } from "next-auth/react";
import { useRouter } from "next/navigation";
import Link from "next/link";

export default function LoginPage() {
  const router = useRouter();
  const [email, setEmail] = useState("");
  const [password, setPassword] = useState("");
  const [error, setError] = useState("");
  const [loading, setLoading] = useState(false);

  async function handleSubmit(e: React.FormEvent) {
    e.preventDefault();
    setError("");
    setLoading(true);

    try {
      const result = await signIn("credentials", {
        email,
        password,
        redirect: false,
      });

      if (result?.error) {
        setError("Invalid email or password");
        setLoading(false);
        return;
      }

      router.push("/");
      router.refresh();
    } catch {
      setError("An error occurred. Please try again.");
      setLoading(false);
    }
  }

  return (
    <div className="flex min-h-screen items-center justify-center p-4 bg-gradient-to-br from-cream-100 via-sage-light/20 to-cream-50 relative overflow-hidden">
      {/* Decorative elements */}
      <div className="absolute inset-0 opacity-30">
        <div className="absolute top-10 left-10 w-32 h-32 bg-sage-light rounded-full blur-3xl"></div>
        <div className="absolute bottom-10 right-10 w-40 h-40 bg-sage/30 rounded-full blur-3xl"></div>
        <div className="absolute top-1/2 right-20 w-24 h-24 bg-mustard-light/30 rounded-full blur-2xl"></div>
      </div>

      <div className="w-full max-w-md space-y-6 rounded-2xl border-2 border-cream-200 bg-white/95 backdrop-blur-sm p-8 shadow-xl relative z-10">
        <div className="text-center space-y-2">
          {/* Brand logo */}
          <div className="flex justify-center mb-4">
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
          <h1 className="text-3xl font-display font-bold bg-gradient-to-r from-sage-dark to-sage bg-clip-text text-transparent">
            Sow Plan
          </h1>
          <p className="text-sm text-earth-warm">Welcome back! Sign in to tend your garden</p>
        </div>

        <form onSubmit={handleSubmit} className="space-y-4">
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
              className="w-full rounded-lg border-2 border-cream-200 px-4 py-2.5 text-sm focus:border-sage focus:outline-none focus:ring-2 focus:ring-sage/20 transition-all"
              placeholder="your@email.com"
              required
              autoComplete="email"
            />
          </div>

          <div>
            <div className="flex items-center justify-between mb-1.5">
              <label
                htmlFor="password"
                className="block text-sm font-medium text-earth-deep"
              >
                Password
              </label>
              <Link
                href="/forgot-password"
                className="text-xs text-sage-dark hover:text-sage hover:underline font-medium"
              >
                Forgot password?
              </Link>
            </div>
            <input
              id="password"
              type="password"
              value={password}
              onChange={(e) => setPassword(e.target.value)}
              className="w-full rounded-lg border-2 border-cream-200 px-4 py-2.5 text-sm focus:border-sage focus:outline-none focus:ring-2 focus:ring-sage/20 transition-all"
              placeholder="Enter your password"
              required
              autoComplete="current-password"
            />
          </div>

          {error && (
            <div className="rounded-lg bg-terracotta/10 border-2 border-terracotta/30 px-4 py-3 text-sm text-terracotta-dark flex items-start gap-2">
              <span className="text-terracotta">!</span>
              <span>{error}</span>
            </div>
          )}

          <button
            type="submit"
            disabled={loading}
            className="w-full rounded-lg bg-gradient-to-r from-sage to-sage-dark px-4 py-3 text-sm font-semibold text-white hover:from-sage-dark hover:to-sage disabled:opacity-50 disabled:cursor-not-allowed shadow-md hover:shadow-lg transition-all transform hover:scale-[1.02] active:scale-[0.98]"
          >
            {loading ? (
              <span className="flex items-center justify-center gap-2">
                <svg className="animate-spin h-4 w-4" viewBox="0 0 24 24">
                  <circle className="opacity-25" cx="12" cy="12" r="10" stroke="currentColor" strokeWidth="4" fill="none"/>
                  <path className="opacity-75" fill="currentColor" d="M4 12a8 8 0 018-8V0C5.373 0 0 5.373 0 12h4zm2 5.291A7.962 7.962 0 014 12H0c0 3.042 1.135 5.824 3 7.938l3-2.647z"/>
                </svg>
                Signing in...
              </span>
            ) : (
              "Sign In"
            )}
          </button>
        </form>

        <div className="text-center text-sm text-earth-warm">
          Don't have an account?{" "}
          <Link href="/signup" className="text-sage-dark hover:text-sage hover:underline font-semibold">
            Sign up
          </Link>
        </div>

        {/* Decorative bottom accent */}
        <div className="absolute bottom-0 left-0 right-0 h-1 bg-gradient-to-r from-sage via-sage-dark to-terracotta rounded-b-2xl"></div>
      </div>
    </div>
  );
}
