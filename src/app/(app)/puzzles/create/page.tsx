"use client";

import { useState } from "react";
import { collection, addDoc, serverTimestamp } from "firebase/firestore";
import { clientDb } from "@/lib/firebase/client";
import { PuzzleGroup } from "@/lib/firestore/models";
import { useAuth } from "@/components/providers/auth-provider";

interface PuzzleData {
  title: string;
  publishDate: string;
  description: string;
  groups: PuzzleGroup[];
  status: "draft" | "published";
}

const initialGroups: PuzzleGroup[] = [
  {
    title: "Group 1",
    hint: "Shared location",
    cards: ["Rome", "Paris", "Lisbon", "London"],
  },
  {
    title: "Group 2",
    hint: "Family recipes",
    cards: ["Lasagna", "Empanadas", "Curry", "Gumbo"],
  },
  {
    title: "Group 3",
    hint: "Inside jokes",
    cards: ["Tripod", "Purple couch", "Code red", "Secret song"],
  },
  {
    title: "Group 4",
    hint: "Weekend rituals",
    cards: ["Farmers market", "Sunday call", "Movie night", "Bakes"],
  },
];

export default function CreatePuzzlePage() {
  const { user, loading } = useAuth();
  const [puzzleData, setPuzzleData] = useState<PuzzleData>({
    title: "",
    publishDate: "",
    description: "",
    groups: initialGroups,
    status: "draft",
  });
  const [isLoading, setIsLoading] = useState(false);

  const handleInputChange = (field: keyof Omit<PuzzleData, "groups">, value: string) => {
    setPuzzleData(prev => ({
      ...prev,
      [field]: value
    }));
  };

  const updateGroupTitle = (index: number, newTitle: string) => {
    const newGroups = [...puzzleData.groups];
    newGroups[index].title = newTitle;
    setPuzzleData(prev => ({ ...prev, groups: newGroups }));
  };

  const updateGroupHint = (index: number, newHint: string) => {
    const newGroups = [...puzzleData.groups];
    newGroups[index].hint = newHint;
    setPuzzleData(prev => ({ ...prev, groups: newGroups }));
  };

  const updateCard = (groupIndex: number, cardIndex: number, newValue: string) => {
    const newGroups = [...puzzleData.groups];
    newGroups[groupIndex].cards[cardIndex] = newValue;
    setPuzzleData(prev => ({ ...prev, groups: newGroups }));
  };

  const addCard = (groupIndex: number) => {
    const newGroups = [...puzzleData.groups];
    newGroups[groupIndex].cards.push("");
    setPuzzleData(prev => ({ ...prev, groups: newGroups }));
  };

  const deleteCard = (groupIndex: number, cardIndex: number) => {
    const newGroups = [...puzzleData.groups];
    newGroups[groupIndex].cards.splice(cardIndex, 1);
    setPuzzleData(prev => ({ ...prev, groups: newGroups }));
  };

  const addGroup = () => {
    const newGroups = [
      ...puzzleData.groups,
      {
        title: `Group ${puzzleData.groups.length + 1}`,
        hint: "",
        cards: [],
      },
    ];
    setPuzzleData(prev => ({ ...prev, groups: newGroups }));
  };

  const deleteGroup = (groupIndex: number) => {
    const newGroups = puzzleData.groups.filter((_, index) => index !== groupIndex);
    setPuzzleData(prev => ({ ...prev, groups: newGroups }));
  };

  const saveDraft = async () => {
    if (!user) {
      alert("You must be logged in to save puzzles.");
      return;
    }

    setIsLoading(true);
    try {
      // For now, using a default family ID - you may want to get this from user context
      const familyId = "miller-family"; // This should come from user's family membership

      const docRef = await addDoc(collection(clientDb, "families", familyId, "puzzles"), {
        ...puzzleData,
        status: "draft",
        createdBy: user.uid,
        createdAt: serverTimestamp(),
        updatedAt: serverTimestamp(),
      });
      console.log("Draft saved with ID: ", docRef.id);
      alert("Draft saved successfully!");
    } catch (error) {
      console.error("Error saving draft: ", error);
      alert("Error saving draft. Please try again.");
    } finally {
      setIsLoading(false);
    }
  };

  const publishToFamily = async () => {
    if (!user) {
      alert("You must be logged in to publish puzzles.");
      return;
    }

    if (!puzzleData.title.trim()) {
      alert("Please enter a title for your puzzle.");
      return;
    }

    if (!puzzleData.publishDate) {
      alert("Please select a publish date.");
      return;
    }

    setIsLoading(true);
    try {
      // For now, using a default family ID - you may want to get this from user context
      const familyId = "miller-family"; // This should come from user's family membership

      const docRef = await addDoc(collection(clientDb, "families", familyId, "puzzles"), {
        ...puzzleData,
        status: "published",
        createdBy: user.uid,
        createdAt: serverTimestamp(),
        updatedAt: serverTimestamp(),
        publishedAt: serverTimestamp(),
      });
      console.log("Puzzle published with ID: ", docRef.id);
      alert("Puzzle published successfully!");
    } catch (error) {
      console.error("Error publishing puzzle: ", error);
      alert("Error publishing puzzle. Please try again.");
    } finally {
      setIsLoading(false);
    }
  };

  if (loading) {
    return (
      <div className="flex items-center justify-center min-h-96">
        <div className="text-slate-600">Loading...</div>
      </div>
    );
  }

  if (!user) {
    return (
      <div className="flex items-center justify-center min-h-96">
        <div className="text-slate-600">Please log in to create puzzles.</div>
      </div>
    );
  }

  return (
    <div className="flex flex-col gap-6">
      <header className="space-y-2 rounded-3xl bg-white p-5 shadow-sm ring-1 ring-black/5 sm:p-6">
        <p className="text-xs font-semibold uppercase tracking-[0.3em] text-slate-500">
          Builder
        </p>
        <h1 className="text-2xl font-semibold text-slate-900 sm:text-3xl">
          Draft a 4x4 puzzle
        </h1>
        <p className="text-sm text-slate-600">
          Define four themed groups, drop in four cards each, and preview the
          grid before publishing it to the family dashboard.
        </p>
      </header>

      <section className="rounded-3xl bg-white p-5 shadow-sm ring-1 ring-black/5 sm:p-6">
        <h2 className="text-lg font-semibold text-slate-900">Puzzle basics</h2>
        <div className="mt-4 grid gap-4 sm:grid-cols-2">
          <label className="text-sm font-medium text-slate-700">
            Title
            <input
              value={puzzleData.title}
              onChange={(e) => handleInputChange("title", e.target.value)}
              className="mt-1 w-full rounded-2xl border border-slate-200 px-3 py-3 text-sm outline-none focus:ring-2 focus:ring-slate-400"
              placeholder="e.g. Cousin Sleepover Legends"
            />
          </label>
          <label className="text-sm font-medium text-slate-700">
            Publish date
            <input
              type="date"
              value={puzzleData.publishDate}
              onChange={(e) => handleInputChange("publishDate", e.target.value)}
              className="mt-1 w-full rounded-2xl border border-slate-200 px-3 py-3 text-sm outline-none focus:ring-2 focus:ring-slate-400"
            />
          </label>
        </div>
        <label className="mt-4 block text-sm font-medium text-slate-700">
          Description (optional)
          <textarea
            rows={3}
            value={puzzleData.description}
            onChange={(e) => handleInputChange("description", e.target.value)}
            className="mt-1 w-full rounded-2xl border border-slate-200 px-3 py-3 text-sm outline-none focus:ring-2 focus:ring-slate-400"
            placeholder="Leave clues or instructions for your family."
          />
        </label>
      </section>

      <section className="rounded-3xl bg-white p-5 shadow-sm ring-1 ring-black/5 sm:p-6">
        <header className="mb-4 flex flex-col gap-3 sm:flex-row sm:items-center sm:justify-between">
          <div>
            <h2 className="text-lg font-semibold text-slate-900">
              Groups & cards
            </h2>
            <p className="text-sm text-slate-500">
              Every group must have four cards before you can publish.
            </p>
          </div>
          <button
            onClick={addGroup}
            className="rounded-full border border-slate-200 px-4 py-2 text-sm font-semibold text-slate-700 hover:bg-slate-50"
          >
            Add group
          </button>
        </header>

        <div className="grid gap-4 sm:grid-cols-2">
          {puzzleData.groups.map((group, groupIndex) => (
            <article
              key={groupIndex}
              className="rounded-2xl border border-slate-100 bg-slate-50 p-4"
            >
              <header className="mb-3">
                <div className="flex justify-between items-start gap-2 mb-2">
                  <input
                    type="text"
                    value={group.hint}
                    onChange={(e) => updateGroupHint(groupIndex, e.target.value)}
                    className="text-xs font-semibold uppercase text-slate-500 bg-transparent border-b border-transparent hover:border-slate-300 focus:border-slate-400 outline-none w-full"
                    placeholder="Hint (e.g., Shared location)"
                  />
                  <button
                    onClick={() => deleteGroup(groupIndex)}
                    className="text-slate-400 hover:text-red-600 text-xs font-semibold"
                    title="Delete group"
                  >
                    ✕
                  </button>
                </div>
                <input
                  type="text"
                  value={group.title}
                  onChange={(e) => updateGroupTitle(groupIndex, e.target.value)}
                  className="text-lg font-semibold text-slate-900 bg-transparent border-b border-transparent hover:border-slate-300 focus:border-slate-400 outline-none w-full"
                  placeholder="Group name"
                />
              </header>
              <ul className="grid gap-2">
                {group.cards.map((card, cardIndex) => (
                  <li
                    key={cardIndex}
                    className="rounded-xl bg-white px-3 py-2 text-sm text-slate-700 shadow-sm ring-1 ring-black/5 flex gap-2 items-center"
                  >
                    <input
                      type="text"
                      value={card}
                      onChange={(e) => updateCard(groupIndex, cardIndex, e.target.value)}
                      className="flex-1 outline-none bg-transparent"
                      placeholder="Card text"
                    />
                    <button
                      onClick={() => deleteCard(groupIndex, cardIndex)}
                      className="text-slate-400 hover:text-red-600 text-xs font-semibold"
                      title="Delete card"
                    >
                      ✕
                    </button>
                  </li>
                ))}
              </ul>
              <button
                onClick={() => addCard(groupIndex)}
                className="mt-2 w-full rounded-xl border border-dashed border-slate-300 bg-white px-3 py-2 text-sm text-slate-500 hover:bg-slate-50 hover:border-slate-400"
              >
                + Add card
              </button>
            </article>
          ))}
        </div>
      </section>

      <section className="rounded-3xl bg-white p-5 shadow-sm ring-1 ring-black/5 sm:p-6">
        <h2 className="text-lg font-semibold text-slate-900">Preview grid</h2>
        <div className="mt-4 grid grid-cols-2 gap-3 sm:grid-cols-4">
          {puzzleData.groups.flatMap((group) => group.cards).map((card, index) => (
            <button
              key={index}
              className="rounded-2xl border border-slate-200 bg-slate-100 px-3 py-4 text-center text-sm font-semibold text-slate-700 transition hover:-translate-y-0.5 hover:border-slate-400"
            >
              {card || "(empty)"}
            </button>
          ))}
        </div>
        <div className="mt-6 flex flex-col gap-3 sm:flex-row sm:flex-wrap">
          <button
            onClick={saveDraft}
            disabled={isLoading}
            className="rounded-full bg-slate-900 px-6 py-3 text-sm font-semibold text-white disabled:opacity-50 hover:bg-slate-800"
          >
            {isLoading ? "Saving..." : "Save draft"}
          </button>
          <button
            onClick={publishToFamily}
            disabled={isLoading}
            className="rounded-full border border-slate-200 px-6 py-3 text-sm font-semibold text-slate-700 disabled:opacity-50 hover:bg-slate-50"
          >
            {isLoading ? "Publishing..." : "Publish to family"}
          </button>
          <button className="rounded-full border border-transparent px-6 py-3 text-sm font-semibold text-slate-600 underline-offset-2 hover:underline">
            Share preview link
          </button>
        </div>
      </section>
    </div>
  );
}