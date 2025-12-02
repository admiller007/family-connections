"use client";

import { useState, useEffect } from "react";
import { collection, query, where, orderBy, getDocs } from "firebase/firestore";
import { clientDb } from "@/lib/firebase/client";
import { useAuth } from "@/components/providers/auth-provider";

interface Puzzle {
  id: string;
  title: string;
  status: "draft" | "published";
  createdAt: any;
  updatedAt: any;
  createdBy: string;
}

export default function DashboardPage() {
  const { user, loading: authLoading } = useAuth();
  const [drafts, setDrafts] = useState<Puzzle[]>([]);
  const [published, setPublished] = useState<Puzzle[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);

  const formatTimeAgo = (timestamp: any) => {
    if (!timestamp) return "Unknown";

    let date: Date;
    if (timestamp.toDate) {
      date = timestamp.toDate();
    } else if (timestamp instanceof Date) {
      date = timestamp;
    } else {
      date = new Date(timestamp);
    }

    const now = new Date();
    const diffMs = now.getTime() - date.getTime();
    const diffMins = Math.floor(diffMs / (1000 * 60));
    const diffHours = Math.floor(diffMs / (1000 * 60 * 60));
    const diffDays = Math.floor(diffMs / (1000 * 60 * 60 * 24));

    if (diffMins < 60) return `${diffMins} min ago`;
    if (diffHours < 24) return `${diffHours}h ago`;
    return `${diffDays}d ago`;
  };

  useEffect(() => {
    if (authLoading || !user) return;

    const fetchPuzzles = async () => {
      try {
        setLoading(true);
        setError(null);

        const familyId = "miller-family"; // This should come from user's family membership

        // Fetch draft puzzles
        const draftsQuery = query(
          collection(clientDb, "families", familyId, "puzzles"),
          where("status", "==", "draft"),
          orderBy("updatedAt", "desc")
        );

        const draftsSnapshot = await getDocs(draftsQuery);
        const draftsData = draftsSnapshot.docs.map(doc => ({
          id: doc.id,
          ...doc.data()
        })) as Puzzle[];

        // Fetch published puzzles
        const publishedQuery = query(
          collection(clientDb, "families", familyId, "puzzles"),
          where("status", "==", "published"),
          orderBy("updatedAt", "desc")
        );

        const publishedSnapshot = await getDocs(publishedQuery);
        const publishedData = publishedSnapshot.docs.map(doc => ({
          id: doc.id,
          ...doc.data()
        })) as Puzzle[];

        setDrafts(draftsData);
        setPublished(publishedData);
      } catch (err) {
        console.error("Error fetching puzzles:", err);
        setError("Failed to load puzzles");
      } finally {
        setLoading(false);
      }
    };

    fetchPuzzles();
  }, [user, authLoading]);

  if (authLoading) {
    return (
      <div className="flex items-center justify-center min-h-96">
        <div className="text-slate-600">Loading...</div>
      </div>
    );
  }

  if (!user) {
    return (
      <div className="flex items-center justify-center min-h-96">
        <div className="text-slate-600">Please log in to view dashboard.</div>
      </div>
    );
  }

  if (error) {
    return (
      <div className="flex items-center justify-center min-h-96">
        <div className="text-red-600">{error}</div>
      </div>
    );
  }
  return (
    <div className="flex flex-col gap-6">
      <section className="space-y-2 rounded-3xl bg-white p-5 shadow-sm ring-1 ring-black/5 sm:p-6">
        <p className="text-xs font-semibold uppercase tracking-[0.3em] text-slate-500">
          Today
        </p>
        <h1 className="text-2xl font-semibold text-slate-900 sm:text-3xl">
          Welcome back — keep the streak alive.
        </h1>
        <p className="text-sm text-slate-600 sm:text-base">
          Draft puzzles, publish when ready, and watch the family solve on their
          phones.
        </p>
        <div className="flex flex-col gap-3 sm:flex-row">
          <button className="rounded-2xl bg-slate-900 px-4 py-3 text-sm font-semibold text-white">
            Drop today&apos;s puzzle
          </button>
          <button className="rounded-2xl border border-slate-200 px-4 py-3 text-sm font-semibold text-slate-800">
            Share invite link
          </button>
        </div>
      </section>

      <section className="grid gap-4 sm:grid-cols-2 sm:gap-6">
        <article className="rounded-3xl bg-white p-5 shadow-sm ring-1 ring-black/5 sm:p-6">
          <header className="mb-4 flex items-center justify-between">
            <div>
              <h2 className="text-lg font-semibold">Drafts</h2>
              <p className="text-sm text-slate-500">Continue where you left off.</p>
            </div>
            <span className="rounded-full bg-slate-100 px-3 py-1 text-xs font-semibold text-slate-700">
              {loading ? "..." : `${drafts.length} drafts`}
            </span>
          </header>
          {loading ? (
            <div className="flex items-center justify-center py-8">
              <div className="text-sm text-slate-500">Loading drafts...</div>
            </div>
          ) : drafts.length === 0 ? (
            <div className="flex flex-col items-center justify-center py-8 text-center">
              <p className="text-sm text-slate-500 mb-2">No drafts yet</p>
              <a
                href="/puzzles/create"
                className="text-sm font-semibold text-slate-700 underline-offset-2 hover:underline"
              >
                Create your first puzzle
              </a>
            </div>
          ) : (
            <ul className="space-y-3">
              {drafts.map((draft) => (
                <li
                  key={draft.id}
                  className="rounded-2xl border border-slate-100 bg-slate-50 px-4 py-3 hover:bg-slate-100 cursor-pointer transition-colors"
                >
                  <p className="font-medium text-slate-900">{draft.title || "Untitled Puzzle"}</p>
                  <p className="text-xs text-slate-500">
                    Last updated {formatTimeAgo(draft.updatedAt)}
                  </p>
                </li>
              ))}
            </ul>
          )}
        </article>

        <article className="rounded-3xl bg-white p-5 shadow-sm ring-1 ring-black/5 sm:p-6">
          <header className="mb-4 flex items-center justify-between">
            <div>
              <h2 className="text-lg font-semibold">Published</h2>
              <p className="text-sm text-slate-500">Recently published puzzles.</p>
            </div>
            <span className="rounded-full bg-slate-100 px-3 py-1 text-xs font-semibold text-slate-700">
              {loading ? "..." : `${published.length} live`}
            </span>
          </header>
          {loading ? (
            <div className="flex items-center justify-center py-8">
              <div className="text-sm text-slate-500">Loading published puzzles...</div>
            </div>
          ) : published.length === 0 ? (
            <div className="flex flex-col items-center justify-center py-8 text-center">
              <p className="text-sm text-slate-500">No published puzzles yet</p>
            </div>
          ) : (
            <ul className="space-y-3">
              {published.map((item) => (
                <li
                  key={item.id}
                  className="flex flex-col gap-2 rounded-2xl border border-slate-100 px-4 py-3 sm:flex-row sm:items-center sm:justify-between hover:bg-slate-50 cursor-pointer transition-colors"
                >
                  <div>
                    <p className="font-medium text-slate-900">{item.title || "Untitled Puzzle"}</p>
                    <p className="text-xs text-slate-500">
                      Published {formatTimeAgo(item.updatedAt)}
                    </p>
                  </div>
                  <button className="text-sm font-semibold text-slate-700 underline-offset-2 hover:underline">
                    View puzzle
                  </button>
                </li>
              ))}
            </ul>
          )}
        </article>
      </section>

    </div>
  );
}
