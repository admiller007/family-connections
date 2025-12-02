"use client";

import { useState } from "react";
import { useRouter } from "next/navigation";
import { signInWithEmailAndPassword } from "firebase/auth";
import { clientAuth } from "@/lib/firebase/client";

export default function LoginWithCodePage() {
  const router = useRouter();
  const [email, setEmail] = useState("");
  const [code, setCode] = useState("");
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState("");

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setLoading(true);
    setError("");

    try {
      // Call API to verify code and create user if needed
      const response = await fetch("/api/auth/verify-code", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ email, code }),
      });

      const data = await response.json();

      if (!response.ok) {
        throw new Error(data.error || "Failed to verify code");
      }

      // Sign in with the temporary password
      await signInWithEmailAndPassword(clientAuth, email, data.tempPassword);

      // Wait a moment for auth state to update, then redirect to dashboard
      // The ProtectedContent component will automatically redirect to onboarding if needed
      setTimeout(() => {
        router.push("/dashboard");
      }, 500);
    } catch (err) {
      setError(err instanceof Error ? err.message : "An error occurred");
      setLoading(false);
    }
  };

  return (
    <div className="mx-auto flex min-h-screen max-w-md flex-col gap-8 px-4 py-10 sm:px-6">
      <header className="space-y-3 text-center">
        <p className="text-xs font-semibold uppercase tracking-[0.3em] text-sky-600">
          Welcome
        </p>
        <h1 className="text-3xl font-semibold text-slate-900 sm:text-4xl">
          Log in with your code
        </h1>
        <p className="text-sm text-slate-600 sm:text-base">
          Enter the email and code provided by your administrator.
        </p>
      </header>

      <section className="space-y-4 rounded-3xl bg-white p-5 shadow-sm ring-1 ring-black/5 sm:p-6">
        <form onSubmit={handleSubmit} className="space-y-4">
          <div>
            <label
              htmlFor="email"
              className="mb-2 block text-sm font-semibold text-slate-800"
            >
              Email address
            </label>
            <input
              type="email"
              id="email"
              value={email}
              onChange={(e) => setEmail(e.target.value)}
              required
              className="w-full rounded-2xl border border-slate-200 px-4 py-3 text-sm outline-none focus:ring-2 focus:ring-slate-400"
              placeholder="you@example.com"
            />
          </div>

          <div>
            <label
              htmlFor="code"
              className="mb-2 block text-sm font-semibold text-slate-800"
            >
              Login code
            </label>
            <input
              type="text"
              id="code"
              value={code}
              onChange={(e) => setCode(e.target.value.toUpperCase())}
              required
              maxLength={8}
              className="w-full rounded-2xl border border-slate-200 px-4 py-3 font-mono text-sm uppercase tracking-wider outline-none focus:ring-2 focus:ring-slate-400"
              placeholder="ABC12345"
            />
          </div>

          {error && (
            <div className="rounded-2xl bg-red-50 px-4 py-3 text-sm text-red-700">
              {error}
            </div>
          )}

          <button
            type="submit"
            disabled={loading}
            className="w-full rounded-2xl bg-slate-900 py-3 text-sm font-semibold text-white hover:bg-slate-800 disabled:opacity-50"
          >
            {loading ? "Verifying..." : "Continue"}
          </button>
        </form>

        <div className="border-t border-slate-200 pt-4 text-center">
          <p className="text-sm text-slate-600">
            Don&apos;t have a code?{" "}
            <a
              href="/join"
              className="font-semibold text-slate-900 underline-offset-2 hover:underline"
            >
              Join with invite link
            </a>
          </p>
        </div>
      </section>
    </div>
  );
}
