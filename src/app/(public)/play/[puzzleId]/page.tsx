"use client";

import { useState, useEffect, useMemo, useCallback } from "react";
import { doc, getDoc, addDoc, collection, serverTimestamp, getDocs } from "firebase/firestore";
import { clientDb } from "@/lib/firebase/client";
import { PuzzleGroup } from "@/lib/firestore/models";

type PublicPuzzlePageProps = {
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

interface GameState {
  selectedCards: string[];
  solvedGroups: { title: string; hint: string; cards: string[] }[];
  attempts: number;
  strikes: number;
  gameStatus: "playing" | "won" | "lost";
  startTime: Date;
  endTime?: Date;
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

export default function PublicPuzzlePage({ params }: PublicPuzzlePageProps) {
  const [puzzle, setPuzzle] = useState<Puzzle | null>(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const [puzzleId, setPuzzleId] = useState<string>("");
  const [showUsernameModal, setShowUsernameModal] = useState(false);
  const [username, setUsername] = useState("");
  const [gameState, setGameState] = useState<GameState>({
    selectedCards: [],
    solvedGroups: [],
    attempts: 0,
    strikes: 0,
    gameStatus: "playing",
    startTime: new Date(),
  });
  const [leaderboard, setLeaderboard] = useState<PuzzleStat[]>([]);
  const [leaderboardLoading, setLeaderboardLoading] = useState(false);
  const [leaderboardError, setLeaderboardError] = useState<string | null>(null);

  useEffect(() => {
    params.then(({ puzzleId: id }) => {
      setPuzzleId(id);
    });
  }, [params]);

  useEffect(() => {
    if (!puzzleId) return;

    const fetchPuzzle = async () => {
      try {
        setLoading(true);
        setError(null);

        const familyId = "miller-family"; // This should come from URL or puzzle data
        const puzzleDoc = doc(clientDb, "families", familyId, "puzzles", puzzleId);
        const puzzleSnap = await getDoc(puzzleDoc);

        if (puzzleSnap.exists()) {
          const puzzleData = {
            id: puzzleSnap.id,
            ...puzzleSnap.data()
          } as Puzzle;

          // Only allow published puzzles to be played publicly
          if (puzzleData.status === "published") {
            setPuzzle(puzzleData);
          } else {
            setError("This puzzle is not published yet");
          }
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
  }, [puzzleId]);

  const loadLeaderboard = useCallback(async () => {
    if (!puzzleId) return;

    try {
      setLeaderboardError(null);
      setLeaderboardLoading(true);

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

      setLeaderboard(statsData.slice(0, 20));
    } catch (err) {
      console.error("Error loading leaderboard:", err);
      setLeaderboardError("Failed to load leaderboard");
      setLeaderboard([]);
    } finally {
      setLeaderboardLoading(false);
    }
  }, [puzzleId]);

  useEffect(() => {
    if (!puzzle) return;
    setGameState({
      selectedCards: [],
      solvedGroups: [],
      attempts: 0,
      strikes: 0,
      gameStatus: "playing",
      startTime: new Date(),
    });
    setUsername("");
    setShowUsernameModal(false);
  }, [puzzle?.id]);

  useEffect(() => {
    if (!puzzleId) return;
    loadLeaderboard();
  }, [puzzleId, loadLeaderboard]);

  const shuffledCards = useMemo(() => {
    if (!puzzle) return [];
    const cards = puzzle.groups
      .flatMap(group => group.cards)
      .filter(card => card.trim());

    return cards
      .map(card => ({ card, sortKey: Math.random() }))
      .sort((a, b) => a.sortKey - b.sortKey)
      .map(item => item.card);
  }, [puzzle?.id]);

  const formatDuration = (durationMs: number) => {
    if (!durationMs || durationMs < 0) return "—";
    const totalSeconds = Math.max(0, Math.round(durationMs / 1000));
    const minutes = Math.floor(totalSeconds / 60);
    const seconds = totalSeconds % 60;
    return `${minutes}:${seconds.toString().padStart(2, "0")}`;
  };

  const toggleCardSelection = (card: string) => {
    if (gameState.gameStatus !== "playing") return;

    setGameState(prev => {
      const isSelected = prev.selectedCards.includes(card);
      const newSelected = isSelected
        ? prev.selectedCards.filter(c => c !== card)
        : prev.selectedCards.length < 4
          ? [...prev.selectedCards, card]
          : prev.selectedCards;

      return { ...prev, selectedCards: newSelected };
    });
  };

  const submitGuess = () => {
    if (gameState.selectedCards.length !== 4) return;

    const selectedSet = new Set(gameState.selectedCards);
    const matchingGroup = puzzle?.groups.find(group =>
      group.cards.filter(card => card.trim()).every(card => selectedSet.has(card)) &&
      group.cards.filter(card => card.trim()).length === 4
    );

    setGameState(prev => {
      const newAttempts = prev.attempts + 1;

      if (matchingGroup) {
        const newSolvedGroups = [...prev.solvedGroups, {
          title: matchingGroup.title,
          hint: matchingGroup.hint,
          cards: matchingGroup.cards.filter(card => card.trim())
        }];

        const gameWon = newSolvedGroups.length === puzzle?.groups.length;

        return {
          ...prev,
          selectedCards: [],
          solvedGroups: newSolvedGroups,
          attempts: newAttempts,
          gameStatus: gameWon ? "won" : "playing",
          endTime: gameWon ? new Date() : undefined
        };
      } else {
        const newStrikes = prev.strikes + 1;
        const gameLost = newStrikes >= 4;

        return {
          ...prev,
          selectedCards: [],
          attempts: newAttempts,
          strikes: newStrikes,
          gameStatus: gameLost ? "lost" : "playing",
          endTime: gameLost ? new Date() : undefined
        };
      }
    });
  };

  const saveStats = async (playerName: string) => {
    if (!puzzle) return;

    try {
      const duration = gameState.endTime ?
        gameState.endTime.getTime() - gameState.startTime.getTime() : 0;

      await addDoc(collection(clientDb, "families", "miller-family", "puzzles", puzzleId, "stats"), {
        playerName,
        attempts: gameState.attempts,
        strikes: gameState.strikes,
        solved: gameState.gameStatus === "won",
        duration,
        completedAt: serverTimestamp(),
        solvedGroups: gameState.solvedGroups.length
      });

      setShowUsernameModal(false);
      setUsername("");
      alert(`Stats saved for ${playerName}!`);
      void loadLeaderboard();
    } catch (error) {
      console.error("Error saving stats:", error);
      alert("Failed to save stats");
    }
  };

  const handleCloseModal = () => {
    setShowUsernameModal(false);
    setUsername("");
  };

  const handleUsernameSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    if (username.trim()) {
      saveStats(username.trim());
    }
  };

  if (loading) {
    return (
      <div className="flex items-center justify-center min-h-96">
        <div className="text-slate-600">Loading puzzle...</div>
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

  const unsolvedCards = shuffledCards.filter(card =>
    !gameState.solvedGroups.some(group => group.cards.includes(card))
  );

  return (
    <div className="max-w-4xl mx-auto p-4">
      <div className="flex flex-col gap-6">
        <header className="rounded-3xl bg-white p-5 shadow-sm ring-1 ring-black/5 sm:p-6">
          <h1 className="text-2xl font-semibold text-slate-900 sm:text-3xl">
            {puzzle.title || "Family Connections Puzzle"}
          </h1>
          {puzzle.description && (
            <p className="mt-2 text-slate-600">{puzzle.description}</p>
          )}
          <div className="mt-4 flex flex-wrap gap-2 text-sm text-slate-600">
            <span className="rounded-full bg-slate-100 px-3 py-1">
              Attempts: {gameState.attempts}
            </span>
            <span className="rounded-full bg-red-100 px-3 py-1 text-red-700">
              Strikes: {gameState.strikes}/4
            </span>
            <span className="rounded-full bg-green-100 px-3 py-1 text-green-700">
              Solved: {gameState.solvedGroups.length}/{puzzle.groups.length}
            </span>
          </div>
        </header>

        {/* Game Won/Lost Messages */}
        {gameState.gameStatus === "won" && (
          <div className="rounded-3xl bg-green-50 border border-green-200 p-5 text-center">
            <h2 className="text-xl font-semibold text-green-800 mb-2">🎉 Congratulations!</h2>
            <p className="text-green-700 mb-4">
              You solved the puzzle in {gameState.attempts} attempts with {gameState.strikes} strikes!
            </p>
            <button
              onClick={() => setShowUsernameModal(true)}
              className="rounded-full bg-green-600 px-6 py-3 text-white font-semibold hover:bg-green-700"
            >
              Save to Leaderboard
            </button>
          </div>
        )}

        {gameState.gameStatus === "lost" && (
          <div className="rounded-3xl bg-red-50 border border-red-200 p-5 text-center">
            <h2 className="text-xl font-semibold text-red-800 mb-2">💥 Game Over!</h2>
            <p className="text-red-700 mb-4">
              You used all 4 strikes. Better luck next time!
            </p>
            <button
              onClick={() => setShowUsernameModal(true)}
              className="rounded-full bg-red-600 px-6 py-3 text-white font-semibold hover:bg-red-700"
            >
              Save Stats
            </button>
          </div>
        )}

        <div className="grid gap-4 lg:grid-cols-3">
          {/* Game Grid */}
          <article className="rounded-3xl bg-white p-5 shadow-sm ring-1 ring-black/5 lg:col-span-2 sm:p-6">
            <header className="mb-4 flex flex-col gap-2 sm:flex-row sm:items-center sm:justify-between">
              <div>
                <h2 className="text-lg font-semibold text-slate-900">Make a guess</h2>
                <p className="text-sm text-slate-500">Select four cards to submit</p>
              </div>
              <span className="rounded-full bg-slate-100 px-3 py-1 text-xs font-semibold text-slate-700">
                Click to select/deselect
              </span>
            </header>

            {/* Solved Groups */}
            {gameState.solvedGroups.map((group, index) => (
              <div key={index} className="mb-4 rounded-2xl border border-green-200 bg-green-50 p-4">
                <p className="text-sm font-semibold text-green-700 mb-1">{group.title}</p>
                <p className="text-xs text-green-600 mb-2 uppercase tracking-wide">{group.hint}</p>
                <div className="grid grid-cols-4 gap-2">
                  {group.cards.map((card, cardIndex) => (
                    <div
                      key={cardIndex}
                      className="rounded-xl bg-green-100 border border-green-300 px-3 py-2 text-center text-sm font-semibold text-green-800"
                    >
                      {card}
                    </div>
                  ))}
                </div>
              </div>
            ))}

            {/* Game Grid */}
            <div className="grid grid-cols-2 gap-3 sm:grid-cols-4 mb-6">
              {unsolvedCards.map((card, index) => (
                <button
                  key={`${card}-${index}`}
                  onClick={() => toggleCardSelection(card)}
                  disabled={gameState.gameStatus !== "playing"}
                  className={`rounded-2xl border px-3 py-4 text-center text-sm font-semibold transition ${
                    gameState.selectedCards.includes(card)
                      ? "border-blue-400 bg-blue-100 text-blue-800"
                      : "border-slate-200 bg-slate-50 text-slate-800 hover:-translate-y-0.5 hover:border-slate-400"
                  } ${gameState.gameStatus !== "playing" ? "opacity-50 cursor-not-allowed" : ""}`}
                >
                  {card}
                </button>
              ))}
            </div>

            {/* Submit Area */}
            <div className="rounded-2xl bg-slate-900/90 px-4 py-3 text-sm text-white">
              <div className="flex flex-col gap-3 sm:flex-row sm:items-center sm:justify-between">
                <span>
                  {gameState.selectedCards.length === 0
                    ? "Select 4 cards to make a guess"
                    : `Selected: ${gameState.selectedCards.join(", ")}`
                  }
                </span>
                <button
                  onClick={submitGuess}
                  disabled={gameState.selectedCards.length !== 4 || gameState.gameStatus !== "playing"}
                  className="rounded-full bg-white px-4 py-2 text-xs font-semibold text-slate-900 disabled:opacity-50 disabled:cursor-not-allowed hover:bg-gray-100"
                >
                  Submit Guess
                </button>
              </div>
            </div>
          </article>

          {/* Progress Sidebar */}
          <article className="rounded-3xl bg-white p-5 shadow-sm ring-1 ring-black/5 sm:p-6">
            <header className="mb-4">
              <h2 className="text-lg font-semibold text-slate-900">Progress</h2>
              <p className="text-sm text-slate-500">
                Find groups of 4 connected cards.
              </p>
            </header>

            <div className="space-y-4">
              <div className="rounded-2xl border border-slate-200 p-3 text-sm">
                <p className="font-semibold text-slate-900">Game Stats</p>
                <p>Attempts: {gameState.attempts}</p>
                <p>Strikes: {gameState.strikes}/4</p>
                <p>Groups found: {gameState.solvedGroups.length}/{puzzle.groups.length}</p>
              </div>

              {gameState.strikes > 0 && (
                <div className="rounded-2xl border border-red-200 bg-red-50 p-3 text-sm text-red-700">
                  <p className="font-semibold">Strike{gameState.strikes > 1 ? 's' : ''} used: {gameState.strikes}</p>
                  <p>{4 - gameState.strikes} remaining before game over</p>
                </div>
              )}
            </div>
          </article>
        </div>

        <article className="rounded-3xl bg-white p-5 shadow-sm ring-1 ring-black/5 sm:p-6">
          <header className="mb-4 flex flex-col gap-3 sm:flex-row sm:items-center sm:justify-between">
            <div>
              <h2 className="text-lg font-semibold text-slate-900">Leaderboard</h2>
              <p className="text-sm text-slate-500">
                See how other players performed on this puzzle.
              </p>
            </div>
            <button
              onClick={() => loadLeaderboard()}
              className="rounded-full border border-slate-200 px-4 py-2 text-sm font-semibold text-slate-700 hover:bg-slate-50 disabled:opacity-50"
              disabled={leaderboardLoading}
            >
              {leaderboardLoading ? "Refreshing..." : "Refresh"}
            </button>
          </header>

          {leaderboardError && (
            <p className="mb-3 rounded-2xl bg-rose-50 px-4 py-3 text-sm text-rose-600">
              {leaderboardError}
            </p>
          )}

          {leaderboardLoading && leaderboard.length === 0 ? (
            <p className="text-sm text-slate-500">Loading leaderboard...</p>
          ) : leaderboard.length === 0 ? (
            <p className="text-sm text-slate-500">
              Be the first to save your stats and claim the top spot!
            </p>
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
                  {leaderboard.map((stat, index) => (
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
        </article>

        {/* Username Modal */}
        {showUsernameModal && (
          <div className="fixed inset-0 bg-black/50 flex items-center justify-center p-4 z-50">
            <form
              onSubmit={handleUsernameSubmit}
              className="bg-white rounded-3xl p-6 w-full max-w-md"
            >
              <h3 className="text-lg font-semibold text-slate-900 mb-4">
                Save Your Score
              </h3>
              <p className="text-sm text-slate-600 mb-4">
                Enter your name to save your stats to the leaderboard:
              </p>
              <input
                type="text"
                value={username}
                onChange={(e) => setUsername(e.target.value)}
                placeholder="Your name"
                className="w-full rounded-2xl border border-slate-200 px-3 py-3 text-sm outline-none focus:ring-2 focus:ring-blue-400 mb-4"
                autoFocus
              />
              <div className="flex gap-3">
                <button
                  type="button"
                  onClick={handleCloseModal}
                  className="flex-1 rounded-full border border-slate-200 px-4 py-2 text-sm font-semibold text-slate-700 hover:bg-slate-50"
                >
                  Cancel
                </button>
                <button
                  type="submit"
                  disabled={!username.trim()}
                  className="flex-1 rounded-full bg-blue-600 px-4 py-2 text-sm font-semibold text-white hover:bg-blue-700 disabled:opacity-50"
                >
                  Save Score
                </button>
              </div>
            </form>
          </div>
        )}
      </div>
    </div>
  );
}
