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
    <div className="flex min-h-screen items-center justify-center p-4 bg-gradient-to-br from-green-50 via-emerald-50 to-teal-50 relative overflow-hidden">
      {/* Decorative elements */}
      <div className="absolute inset-0 opacity-30">
        <div className="absolute top-10 left-10 w-32 h-32 bg-green-200 rounded-full blur-3xl"></div>
        <div className="absolute bottom-10 right-10 w-40 h-40 bg-emerald-200 rounded-full blur-3xl"></div>
        <div className="absolute top-1/2 right-20 w-24 h-24 bg-teal-200 rounded-full blur-2xl"></div>
      </div>

      <div className="w-full max-w-md space-y-6 rounded-2xl border-2 border-green-100 bg-white/95 backdrop-blur-sm p-8 shadow-xl relative z-10">
        <div className="text-center space-y-2">
          {/* Plant icon */}
          <div className="flex justify-center mb-4">
            <div className="bg-gradient-to-br from-green-400 to-emerald-500 text-white p-4 rounded-2xl shadow-lg">
              <svg className="w-10 h-10" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2">
                <path d="M12 22V11"/>
                <path d="M12 11C12 8.79086 10.2091 7 8 7C5.79086 7 4 8.79086 4 11" strokeLinecap="round"/>
                <path d="M12 11C12 8.79086 13.7909 7 16 7C18.2091 7 20 8.79086 20 11" strokeLinecap="round"/>
                <circle cx="12" cy="22" r="1" fill="currentColor"/>
              </svg>
            </div>
          </div>
          <h1 className="text-3xl font-bold bg-gradient-to-r from-green-600 to-emerald-600 bg-clip-text text-transparent">
            Sowplan
          </h1>
          <p className="text-sm text-slate-600">Welcome back! Sign in to tend your garden</p>
        </div>

        <form onSubmit={handleSubmit} className="space-y-4">
          <div>
            <label
              htmlFor="email"
              className="block text-sm font-medium text-green-900 mb-1.5"
            >
              Email
            </label>
            <input
              id="email"
              type="email"
              value={email}
              onChange={(e) => setEmail(e.target.value)}
              className="w-full rounded-lg border-2 border-green-200 px-4 py-2.5 text-sm focus:border-green-500 focus:outline-none focus:ring-2 focus:ring-green-200 transition-all"
              placeholder="your@email.com"
              required
              autoComplete="email"
            />
          </div>

          <div>
            <div className="flex items-center justify-between mb-1.5">
              <label
                htmlFor="password"
                className="block text-sm font-medium text-green-900"
              >
                Password
              </label>
              <Link
                href="/forgot-password"
                className="text-xs text-green-600 hover:text-green-700 hover:underline font-medium"
              >
                Forgot password?
              </Link>
            </div>
            <input
              id="password"
              type="password"
              value={password}
              onChange={(e) => setPassword(e.target.value)}
              className="w-full rounded-lg border-2 border-green-200 px-4 py-2.5 text-sm focus:border-green-500 focus:outline-none focus:ring-2 focus:ring-green-200 transition-all"
              placeholder="Enter your password"
              required
              autoComplete="current-password"
            />
          </div>

          {error && (
            <div className="rounded-lg bg-red-50 border-2 border-red-200 px-4 py-3 text-sm text-red-700 flex items-start gap-2">
              <span className="text-red-500">⚠️</span>
              <span>{error}</span>
            </div>
          )}

          <button
            type="submit"
            disabled={loading}
            className="w-full rounded-lg bg-gradient-to-r from-green-500 to-emerald-600 px-4 py-3 text-sm font-semibold text-white hover:from-green-600 hover:to-emerald-700 disabled:opacity-50 disabled:cursor-not-allowed shadow-md hover:shadow-lg transition-all transform hover:scale-[1.02] active:scale-[0.98]"
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
              "Sign In 🌿"
            )}
          </button>
        </form>

        <div className="text-center text-sm text-slate-600">
          Don't have an account?{" "}
          <Link href="/signup" className="text-green-600 hover:text-green-700 hover:underline font-semibold">
            Sign up
          </Link>
        </div>

        {/* Decorative bottom accent */}
        <div className="absolute bottom-0 left-0 right-0 h-1 bg-gradient-to-r from-green-400 via-emerald-500 to-teal-400 rounded-b-2xl"></div>
      </div>
    </div>
  );
}
