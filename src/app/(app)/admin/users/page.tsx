"use client";

import { useAuth } from "@/components/providers/auth-provider";
import { useIsAdmin } from "@/hooks/use-is-admin";
import { useState } from "react";
import Link from "next/link";

type UserCode = {
  id: string;
  email: string;
  code: string;
  createdAt: Date;
  usedAt?: Date;
  status: "pending" | "used";
};

export default function AdminUsersPage() {
  const { user } = useAuth();
  const { isAdmin, loading: adminLoading } = useIsAdmin();
  const [email, setEmail] = useState("");
  const [displayName, setDisplayName] = useState("");
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState("");
  const [success, setSuccess] = useState("");
  const [generatedCode, setGeneratedCode] = useState("");
  const [recentUsers, setRecentUsers] = useState<UserCode[]>([]);

  const handleCreateUser = async (e: React.FormEvent) => {
    e.preventDefault();
    setLoading(true);
    setError("");
    setSuccess("");
    setGeneratedCode("");

    try {
      if (!user) {
        throw new Error("You must be logged in to create users");
      }

      const token = await user.getIdToken();

      const response = await fetch("/api/admin/create-user", {
        method: "POST",
        headers: {
          "Content-Type": "application/json",
          Authorization: `Bearer ${token}`,
        },
        body: JSON.stringify({ email, displayName }),
      });

      const data = await response.json();

      if (!response.ok) {
        throw new Error(data.error || "Failed to create user");
      }

      setGeneratedCode(data.code);
      setSuccess(`User created successfully! Code: ${data.code}`);
      setEmail("");
      setDisplayName("");

      // Add to recent users list
      setRecentUsers((prev) => [
        {
          id: data.id,
          email: data.email,
          code: data.code,
          createdAt: new Date(),
          status: "pending",
        },
        ...prev,
      ]);
    } catch (err) {
      setError(err instanceof Error ? err.message : "An error occurred");
    } finally {
      setLoading(false);
    }
  };

  const copyToClipboard = (text: string) => {
    navigator.clipboard.writeText(text);
  };

  if (adminLoading) {
    return (
      <div className="flex min-h-[50vh] items-center justify-center">
        <p className="text-sm text-slate-500">Checking permissions...</p>
      </div>
    );
  }

  if (!isAdmin) {
    return (
      <div className="flex flex-col gap-6">
        <section className="space-y-4 rounded-3xl bg-red-50 p-5 shadow-sm ring-1 ring-red-100 sm:p-6">
          <div className="flex items-start gap-3">
            <div className="flex-shrink-0 text-2xl">🚫</div>
            <div className="flex-1">
              <h2 className="text-lg font-semibold text-red-900">
                Access Denied
              </h2>
              <p className="mt-1 text-sm text-red-700">
                You don&apos;t have permission to access the admin panel.
                Only administrators can create and manage users.
              </p>
              <div className="mt-4">
                <Link
                  href="/dashboard"
                  className="inline-block rounded-2xl bg-red-900 px-4 py-2 text-sm font-semibold text-white hover:bg-red-800"
                >
                  Return to Dashboard
                </Link>
              </div>
            </div>
          </div>
        </section>
      </div>
    );
  }

  return (
    <div className="flex flex-col gap-6">
      <section className="space-y-2 rounded-3xl bg-white p-5 shadow-sm ring-1 ring-black/5 sm:p-6">
        <p className="text-xs font-semibold uppercase tracking-[0.3em] text-slate-500">
          Admin Panel
        </p>
        <h1 className="text-2xl font-semibold text-slate-900 sm:text-3xl">
          User Management
        </h1>
        <p className="text-sm text-slate-600 sm:text-base">
          Create new users and generate login codes for them.
        </p>
      </section>

      <section className="rounded-3xl bg-white p-5 shadow-sm ring-1 ring-black/5 sm:p-6">
        <h2 className="mb-4 text-lg font-semibold text-slate-900">
          Create New User
        </h2>

        <form onSubmit={handleCreateUser} className="space-y-4">
          <div>
            <label
              htmlFor="email"
              className="mb-1 block text-sm font-medium text-slate-700"
            >
              Email Address
            </label>
            <input
              type="email"
              id="email"
              value={email}
              onChange={(e) => setEmail(e.target.value)}
              required
              className="w-full rounded-2xl border border-slate-200 px-4 py-3 text-sm focus:border-slate-400 focus:outline-none focus:ring-2 focus:ring-slate-900/5"
              placeholder="user@example.com"
            />
          </div>

          <div>
            <label
              htmlFor="displayName"
              className="mb-1 block text-sm font-medium text-slate-700"
            >
              Display Name (Optional)
            </label>
            <input
              type="text"
              id="displayName"
              value={displayName}
              onChange={(e) => setDisplayName(e.target.value)}
              className="w-full rounded-2xl border border-slate-200 px-4 py-3 text-sm focus:border-slate-400 focus:outline-none focus:ring-2 focus:ring-slate-900/5"
              placeholder="John Doe"
            />
          </div>

          {error && (
            <div className="rounded-2xl bg-red-50 px-4 py-3 text-sm text-red-700">
              {error}
            </div>
          )}

          {success && (
            <div className="rounded-2xl bg-green-50 px-4 py-3">
              <p className="text-sm font-medium text-green-700">{success}</p>
              {generatedCode && (
                <div className="mt-2 flex items-center gap-2">
                  <code className="rounded bg-green-100 px-3 py-2 font-mono text-lg font-bold text-green-900">
                    {generatedCode}
                  </code>
                  <button
                    type="button"
                    onClick={() => copyToClipboard(generatedCode)}
                    className="rounded-xl bg-green-700 px-3 py-2 text-xs font-semibold text-white hover:bg-green-800"
                  >
                    Copy Code
                  </button>
                </div>
              )}
            </div>
          )}

          <button
            type="submit"
            disabled={loading}
            className="rounded-2xl bg-slate-900 px-6 py-3 text-sm font-semibold text-white hover:bg-slate-800 disabled:opacity-50"
          >
            {loading ? "Creating..." : "Create User"}
          </button>
        </form>
      </section>

      {recentUsers.length > 0 && (
        <section className="rounded-3xl bg-white p-5 shadow-sm ring-1 ring-black/5 sm:p-6">
          <h2 className="mb-4 text-lg font-semibold text-slate-900">
            Recently Created Users
          </h2>
          <div className="space-y-3">
            {recentUsers.map((user) => (
              <div
                key={user.id}
                className="flex flex-col gap-2 rounded-2xl border border-slate-100 bg-slate-50 px-4 py-3 sm:flex-row sm:items-center sm:justify-between"
              >
                <div className="flex-1">
                  <p className="font-medium text-slate-900">{user.email}</p>
                  <div className="mt-1 flex items-center gap-2">
                    <code className="rounded bg-slate-200 px-2 py-1 font-mono text-xs font-bold text-slate-700">
                      {user.code}
                    </code>
                    <span
                      className={`rounded-full px-2 py-0.5 text-xs font-semibold ${
                        user.status === "pending"
                          ? "bg-yellow-100 text-yellow-700"
                          : "bg-green-100 text-green-700"
                      }`}
                    >
                      {user.status}
                    </span>
                  </div>
                </div>
                <button
                  onClick={() => copyToClipboard(user.code)}
                  className="text-sm font-semibold text-slate-700 underline-offset-2 hover:underline"
                >
                  Copy Code
                </button>
              </div>
            ))}
          </div>
        </section>
      )}
    </div>
  );
}
