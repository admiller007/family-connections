"use client";

import { useState, useEffect, useCallback } from "react";
import { doc, getDoc, collection, getDocs } from "firebase/firestore";
import { clientDb } from "@/lib/firebase/client";
import { useAuth } from "@/components/providers/auth-provider";
import { PuzzleGroup } from "@/lib/firestore/models";

type PuzzlePageProps = {
  params: Promise<{ puzzleId: string }>;
};

interface Puzzle {
  id: string;
  title: string;
  description?: string;
  status: "draft" | "published";
  groups: PuzzleGroup[];
  createdAt: any;
  updatedAt: any;
  createdBy: string;
}

interface PuzzleStat {
  id: string;
  playerName: string;
  attempts: number;
  strikes: number;
  solved: boolean;
  duration: number;
  completedAt?: Date;
  solvedGroups: number;
}

export default function PuzzlePlayerPage({ params }: PuzzlePageProps) {
  const { user, loading: authLoading } = useAuth();
  const [puzzle, setPuzzle] = useState<Puzzle | null>(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const [puzzleId, setPuzzleId] = useState<string>("");
  const [shareUrl, setShareUrl] = useState("");
  const [copied, setCopied] = useState(false);
  const [stats, setStats] = useState<PuzzleStat[]>([]);
  const [statsLoading, setStatsLoading] = useState(false);
  const [statsError, setStatsError] = useState<string | null>(null);

  useEffect(() => {
    // Unwrap params Promise
    params.then(({ puzzleId: id }) => {
      setPuzzleId(id);
    });
  }, [params]);

  useEffect(() => {
    if (authLoading || !user || !puzzleId) return;

    const fetchPuzzle = async () => {
      try {
        setLoading(true);
        setError(null);

        const familyId = "miller-family"; // This should come from user's family membership
        const puzzleDoc = doc(clientDb, "families", familyId, "puzzles", puzzleId);
        const puzzleSnap = await getDoc(puzzleDoc);

        if (puzzleSnap.exists()) {
          const puzzleData = {
            id: puzzleSnap.id,
            ...puzzleSnap.data()
          } as Puzzle;
          setPuzzle(puzzleData);
        } else {
          setError("Puzzle not found");
        }
      } catch (err) {
        console.error("Error fetching puzzle:", err);
        setError("Failed to load puzzle");
      } finally {
        setLoading(false);
      }
    };

    fetchPuzzle();
  }, [user, authLoading, puzzleId]);

  useEffect(() => {
    if (!puzzleId || typeof window === "undefined") return;
    setShareUrl(`${window.location.origin}/play/${puzzleId}`);
  }, [puzzleId]);

  useEffect(() => {
    if (!copied) return;
    const timeout = setTimeout(() => setCopied(false), 2000);
    return () => clearTimeout(timeout);
  }, [copied]);

  const loadStats = useCallback(async () => {
    if (!puzzleId) return;

    try {
      setStatsError(null);
      setStatsLoading(true);

      const statsRef = collection(clientDb, "families", "miller-family", "puzzles", puzzleId, "stats");
      const statsSnap = await getDocs(statsRef);
      const statsData = statsSnap.docs.map(statDoc => {
        const data = statDoc.data();
        const completedAt = typeof data.completedAt?.toDate === "function"
          ? data.completedAt.toDate()
          : undefined;

        return {
          id: statDoc.id,
          playerName: data.playerName || "Anonymous",
          attempts: typeof data.attempts === "number" ? data.attempts : 0,
          strikes: typeof data.strikes === "number" ? data.strikes : 0,
          solved: Boolean(data.solved),
          duration: typeof data.duration === "number" ? data.duration : 0,
          completedAt,
          solvedGroups: typeof data.solvedGroups === "number" ? data.solvedGroups : 0,
        } as PuzzleStat;
      }).sort((a, b) => {
        if (a.solved !== b.solved) return a.solved ? -1 : 1;
        if (a.solvedGroups !== b.solvedGroups) return b.solvedGroups - a.solvedGroups;
        if (a.strikes !== b.strikes) return a.strikes - b.strikes;
        if (a.attempts !== b.attempts) return a.attempts - b.attempts;
        if (a.duration !== b.duration) return a.duration - b.duration;
        return (a.completedAt?.getTime() ?? 0) - (b.completedAt?.getTime() ?? 0);
      });

      setStats(statsData);
    } catch (err) {
      console.error("Error loading puzzle stats:", err);
      setStatsError("Failed to load leaderboard");
      setStats([]);
    } finally {
      setStatsLoading(false);
    }
  }, [puzzleId]);

  useEffect(() => {
    if (!puzzleId) return;
    loadStats();
  }, [puzzleId, loadStats]);

  const handleCopyLink = async () => {
    const fallbackUrl =
      typeof window !== "undefined" && puzzleId
        ? `${window.location.origin}/play/${puzzleId}`
        : puzzleId
          ? `/play/${puzzleId}`
          : "";
    const linkToCopy = shareUrl || fallbackUrl;
    if (!linkToCopy) return;
    try {
      await navigator.clipboard.writeText(linkToCopy);
      setCopied(true);
    } catch (copyError) {
      console.error("Failed to copy share link", copyError);
      alert("Unable to copy link. Please copy it manually.");
    }
  };

  if (authLoading || loading) {
    return (
      <div className="flex items-center justify-center min-h-96">
        <div className="text-slate-600">Loading puzzle...</div>
      </div>
    );
  }

  if (!user) {
    return (
      <div className="flex items-center justify-center min-h-96">
        <div className="text-slate-600">Please log in to view puzzles.</div>
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

  if (!puzzle) {
    return (
      <div className="flex items-center justify-center min-h-96">
        <div className="text-slate-600">Puzzle not found.</div>
      </div>
    );
  }

  const allCards = puzzle.groups.flatMap(group => group.cards).filter(card => card.trim());
  const sharePath = puzzleId ? `/play/${puzzleId}` : "";
  const resolvedShareUrl = shareUrl || sharePath;
  const formatDuration = (durationMs: number) => {
    if (!durationMs || durationMs < 0) return "—";
    const totalSeconds = Math.max(0, Math.round(durationMs / 1000));
    const minutes = Math.floor(totalSeconds / 60);
    const seconds = totalSeconds % 60;
    return `${minutes}:${seconds.toString().padStart(2, "0")}`;
  };

  return (
    <div className="flex flex-col gap-6">
      <header className="rounded-3xl bg-white p-5 shadow-sm ring-1 ring-black/5 sm:p-6">
        <p className="text-xs font-semibold uppercase tracking-[0.3em] text-slate-500">
          Puzzle #{puzzleId.slice(-8)}
        </p>
        <h1 className="mt-2 text-2xl font-semibold text-slate-900 sm:text-3xl">
          {puzzle.title || "Untitled Puzzle"}
        </h1>
        {puzzle.description && (
          <p className="mt-2 text-slate-600">{puzzle.description}</p>
        )}
        <div className="mt-4 flex flex-wrap gap-2 text-sm text-slate-600">
          <span className="rounded-full bg-slate-100 px-3 py-1 font-semibold text-slate-800">
            {puzzle.status === "published" ? "Published" : "Draft"}
          </span>
          <span className="rounded-full bg-slate-100 px-3 py-1">
            {puzzle.groups.length} groups
          </span>
          <span className="rounded-full bg-slate-100 px-3 py-1">
            {allCards.length} cards total
          </span>
        </div>
      </header>

      <section className="grid gap-4 lg:grid-cols-3">
        <article className="rounded-3xl bg-white p-5 shadow-sm ring-1 ring-black/5 lg:col-span-2 sm:p-6">
          <header className="mb-4 flex flex-col gap-2 sm:flex-row sm:items-center sm:justify-between">
            <div>
              <h2 className="text-lg font-semibold text-slate-900">Make a guess</h2>
              <p className="text-sm text-slate-500">Select four cards to submit</p>
            </div>
            <span className="rounded-full bg-slate-100 px-3 py-1 text-xs font-semibold text-slate-700">
              Long press to deselect
            </span>
          </header>
          <div className="grid grid-cols-2 gap-3 sm:grid-cols-4">
            {allCards.map((card, index) => (
              <button
                key={`${card}-${index}`}
                className="rounded-2xl border border-slate-200 bg-slate-50 px-3 py-4 text-center text-sm font-semibold text-slate-800 transition hover:-translate-y-0.5 hover:border-slate-400"
              >
                {card || "(empty)"}
              </button>
            ))}
          </div>
          <div className="mt-6 flex flex-col gap-3 rounded-2xl bg-slate-900/90 px-4 py-3 text-sm text-white sm:flex-row sm:items-center sm:justify-between">
            <span>Selected cards appear here.</span>
            <button className="rounded-full bg-white px-4 py-2 text-xs font-semibold text-slate-900">
              Submit guess
            </button>
          </div>
        </article>

        <article className="rounded-3xl bg-white p-5 shadow-sm ring-1 ring-black/5 sm:p-6">
          <header className="mb-4">
            <h2 className="text-lg font-semibold text-slate-900">Puzzle Groups</h2>
            <p className="text-sm text-slate-500">
              The groups and cards in this puzzle.
            </p>
          </header>
          <ul className="space-y-4">
            {puzzle.groups.map((group, index) => (
              <li
                key={`${group.title}-${index}`}
                className="rounded-2xl border border-slate-200 bg-slate-50 p-3"
              >
                <p className="text-sm font-semibold text-slate-700 mb-1">
                  {group.title}
                </p>
                {group.hint && (
                  <p className="text-xs text-slate-500 mb-2 uppercase tracking-wide">
                    {group.hint}
                  </p>
                )}
                <p className="text-xs text-slate-600">
                  {group.cards.filter(card => card.trim()).join(", ") || "No cards"}
                </p>
              </li>
            ))}
          </ul>
          <div className="mt-6 rounded-2xl border border-slate-200 p-3 text-sm text-slate-600">
            <p className="font-semibold text-slate-900">Puzzle Info</p>
            <p>Status: {puzzle.status}</p>
            <p>Created by: {puzzle.createdBy}</p>
          </div>
        </article>
      </section>

      {puzzle.status === "published" && (
        <section className="rounded-3xl bg-white p-5 shadow-sm ring-1 ring-black/5 sm:p-6">
          <header className="mb-4">
            <h2 className="text-lg font-semibold text-slate-900">Share with anyone</h2>
            <p className="text-sm text-slate-500">
              Send this public play link so friends and family can solve it without logging in.
              They&apos;ll be prompted to enter a name so their stats land on the leaderboard.
            </p>
          </header>
          <div className="flex flex-col gap-3 sm:flex-row sm:items-center">
            <input
              type="text"
              readOnly
              value={resolvedShareUrl}
              className="flex-1 rounded-2xl border border-slate-200 px-3 py-3 text-sm text-slate-700 focus:outline-none"
            />
            <div className="flex gap-3">
              <button
                onClick={handleCopyLink}
                className="rounded-full border border-slate-200 px-4 py-2 text-sm font-semibold text-slate-700 hover:bg-slate-50"
              >
                {copied ? "Copied!" : "Copy link"}
              </button>
              {sharePath && (
                <a
                  href={sharePath}
                  target="_blank"
                  rel="noreferrer"
                  className="rounded-full bg-slate-900 px-4 py-2 text-sm font-semibold text-white hover:bg-slate-800 text-center"
                >
                  Open link
                </a>
              )}
            </div>
          </div>
          {!shareUrl && sharePath && (
            <p className="mt-2 text-xs text-slate-500">
              The full URL appears once the page loads; sharing the relative link also works.
            </p>
          )}
        </section>
      )}

      <section className="rounded-3xl bg-white p-5 shadow-sm ring-1 ring-black/5 sm:p-6">
        <header className="mb-4 flex flex-col gap-3 sm:flex-row sm:items-center sm:justify-between">
          <div>
            <h2 className="text-lg font-semibold text-slate-900">Leaderboard</h2>
            <p className="text-sm text-slate-500">
              Track everyone who has saved their stats for this puzzle.
            </p>
          </div>
          <button
            onClick={() => loadStats()}
            className="rounded-full border border-slate-200 px-4 py-2 text-sm font-semibold text-slate-700 hover:bg-slate-50 disabled:opacity-50"
            disabled={statsLoading}
          >
            {statsLoading ? "Refreshing..." : "Refresh"}
          </button>
        </header>

        {statsError && (
          <p className="mb-3 rounded-2xl bg-rose-50 px-4 py-3 text-sm text-rose-600">{statsError}</p>
        )}

        {statsLoading && stats.length === 0 ? (
          <p className="text-sm text-slate-500">Loading leaderboard...</p>
        ) : stats.length === 0 ? (
          <p className="text-sm text-slate-500">No one has saved stats yet.</p>
        ) : (
          <div className="overflow-x-auto">
            <table className="min-w-full text-sm">
              <thead>
                <tr className="text-left text-xs uppercase text-slate-500 tracking-wide">
                  <th className="py-2 pr-4">#</th>
                  <th className="py-2 pr-4">Player</th>
                  <th className="py-2 pr-4">Result</th>
                  <th className="py-2 pr-4">Attempts</th>
                  <th className="py-2 pr-4">Strikes</th>
                  <th className="py-2 pr-4">Time</th>
                  <th className="py-2">Saved</th>
                </tr>
              </thead>
              <tbody className="divide-y divide-slate-100">
                {stats.map((stat, index) => (
                  <tr key={stat.id} className={index === 0 ? "bg-slate-50" : ""}>
                    <td className="py-2 pr-4 font-semibold text-slate-500">{index + 1}</td>
                    <td className="py-2 pr-4 font-semibold text-slate-900">{stat.playerName}</td>
                    <td className="py-2 pr-4">
                      {stat.solved
                        ? <span className="text-green-600 font-semibold">Solved</span>
                        : `${stat.solvedGroups}/4 groups`}
                    </td>
                    <td className="py-2 pr-4">{stat.attempts}</td>
                    <td className="py-2 pr-4">{stat.strikes}</td>
                    <td className="py-2 pr-4">{formatDuration(stat.duration)}</td>
                    <td className="py-2 text-slate-500">
                      {stat.completedAt ? stat.completedAt.toLocaleString() : "—"}
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        )}
      </section>
    </div>
  );
}
