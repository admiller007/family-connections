"use client";

import { useState, useEffect } from "react";
import { useRouter } from "next/navigation";
import { useAuth } from "@/components/providers/auth-provider";
import { updatePassword, updateProfile } from "firebase/auth";
import { doc, setDoc } from "firebase/firestore";
import { clientDb } from "@/lib/firebase/client";

export default function OnboardingPage() {
  const router = useRouter();
  const { user, loading: authLoading } = useAuth();
  const [username, setUsername] = useState("");
  const [displayName, setDisplayName] = useState("");
  const [password, setPassword] = useState("");
  const [confirmPassword, setConfirmPassword] = useState("");
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState("");

  useEffect(() => {
    // If not authenticated, redirect to login
    if (!authLoading && !user) {
      router.push("/login-with-code");
    }

    // Pre-fill display name if available
    if (user?.displayName) {
      setDisplayName(user.displayName);
    }
  }, [user, authLoading, router]);

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setLoading(true);
    setError("");

    try {
      if (!user) {
        throw new Error("You must be logged in");
      }

      if (password !== confirmPassword) {
        throw new Error("Passwords do not match");
      }

      if (password.length < 8) {
        throw new Error("Password must be at least 8 characters");
      }

      if (username.length < 3) {
        throw new Error("Username must be at least 3 characters");
      }

      // Validate username (alphanumeric, underscore, hyphen only)
      const usernameRegex = /^[a-zA-Z0-9_-]+$/;
      if (!usernameRegex.test(username)) {
        throw new Error(
          "Username can only contain letters, numbers, underscores, and hyphens"
        );
      }

      // Update password
      await updatePassword(user, password);

      // Update profile
      await updateProfile(user, {
        displayName: displayName || username,
      });

      // Create profile in Firestore
      await setDoc(doc(clientDb, "profiles", user.uid), {
        username,
        displayName: displayName || username,
        email: user.email,
        createdAt: new Date(),
        updatedAt: new Date(),
      });

      // Redirect to dashboard
      router.push("/dashboard");
    } catch (err: any) {
      // Handle Firebase auth errors
      if (err.code === "auth/weak-password") {
        setError("Password is too weak. Please choose a stronger password.");
      } else if (err.code === "auth/requires-recent-login") {
        setError("Please log in again to change your password.");
      } else {
        setError(err.message || "An error occurred");
      }
      setLoading(false);
    }
  };

  if (authLoading) {
    return (
      <div className="flex min-h-screen items-center justify-center">
        <p className="text-sm text-slate-500">Loading...</p>
      </div>
    );
  }

  if (!user) {
    return null;
  }

  return (
    <div className="mx-auto flex min-h-screen max-w-md flex-col gap-8 px-4 py-10 sm:px-6">
      <header className="space-y-3 text-center">
        <p className="text-xs font-semibold uppercase tracking-[0.3em] text-sky-600">
          Welcome
        </p>
        <h1 className="text-3xl font-semibold text-slate-900 sm:text-4xl">
          Complete your profile
        </h1>
        <p className="text-sm text-slate-600 sm:text-base">
          Choose a username and set your password to get started.
        </p>
      </header>

      <section className="space-y-4 rounded-3xl bg-white p-5 shadow-sm ring-1 ring-black/5 sm:p-6">
        <form onSubmit={handleSubmit} className="space-y-4">
          <div>
            <label
              htmlFor="username"
              className="mb-2 block text-sm font-semibold text-slate-800"
            >
              Username
            </label>
            <input
              type="text"
              id="username"
              value={username}
              onChange={(e) => setUsername(e.target.value.toLowerCase())}
              required
              minLength={3}
              className="w-full rounded-2xl border border-slate-200 px-4 py-3 text-sm outline-none focus:ring-2 focus:ring-slate-400"
              placeholder="johndoe"
            />
            <p className="mt-1 text-xs text-slate-500">
              Lowercase letters, numbers, underscores, and hyphens only
            </p>
          </div>

          <div>
            <label
              htmlFor="displayName"
              className="mb-2 block text-sm font-semibold text-slate-800"
            >
              Display name (optional)
            </label>
            <input
              type="text"
              id="displayName"
              value={displayName}
              onChange={(e) => setDisplayName(e.target.value)}
              className="w-full rounded-2xl border border-slate-200 px-4 py-3 text-sm outline-none focus:ring-2 focus:ring-slate-400"
              placeholder="John Doe"
            />
          </div>

          <div>
            <label
              htmlFor="password"
              className="mb-2 block text-sm font-semibold text-slate-800"
            >
              New password
            </label>
            <input
              type="password"
              id="password"
              value={password}
              onChange={(e) => setPassword(e.target.value)}
              required
              minLength={8}
              className="w-full rounded-2xl border border-slate-200 px-4 py-3 text-sm outline-none focus:ring-2 focus:ring-slate-400"
              placeholder="••••••••"
            />
            <p className="mt-1 text-xs text-slate-500">
              At least 8 characters
            </p>
          </div>

          <div>
            <label
              htmlFor="confirmPassword"
              className="mb-2 block text-sm font-semibold text-slate-800"
            >
              Confirm password
            </label>
            <input
              type="password"
              id="confirmPassword"
              value={confirmPassword}
              onChange={(e) => setConfirmPassword(e.target.value)}
              required
              minLength={8}
              className="w-full rounded-2xl border border-slate-200 px-4 py-3 text-sm outline-none focus:ring-2 focus:ring-slate-400"
              placeholder="••••••••"
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
            {loading ? "Setting up..." : "Complete setup"}
          </button>
        </form>
      </section>
    </div>
  );
}
