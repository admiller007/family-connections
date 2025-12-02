"use client";

import { useState, useEffect } from "react";
import { doc, getDoc } from "firebase/firestore";
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

export default function PuzzlePlayerPage({ params }: PuzzlePageProps) {
  const { user, loading: authLoading } = useAuth();
  const [puzzle, setPuzzle] = useState<Puzzle | null>(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const [puzzleId, setPuzzleId] = useState<string>("");
  const [shareUrl, setShareUrl] = useState("");
  const [copied, setCopied] = useState(false);

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
    </div>
  );
}
