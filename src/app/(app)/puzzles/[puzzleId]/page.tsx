type PuzzlePageProps = {
  params: Promise<{ puzzleId: string }>;
};

const puzzle = {
  title: "Grandparents Day Surprise",
  difficulty: "Tricky",
  dropsAt: "Today, 8:00 AM",
  strikesLeft: 3,
};

const gridCards = [
  "Astoria",
  "June 12",
  "Maple tree",
  "Cherry pie",
  "Campfire",
  "Sunday call",
  "Spelling bee",
  "Milkshakes",
  "Nana",
  "Papa Joe",
  "Garden swing",
  "Vinyl records",
  "Grand tour",
  "Safe travels",
  "Inside joke",
  "Family motto",
];

const solvedGroups = [
  {
    title: "Places grandparents lived",
    cards: ["Astoria", "Grand tour", "Maple tree", "Garden swing"],
  },
  {
    title: "Weekly traditions",
    cards: ["Sunday call", "Milkshakes", "Family motto", "Inside joke"],
  },
];

export default async function PuzzlePlayerPage({ params }: PuzzlePageProps) {
  const { puzzleId } = await params;

  return (
    <div className="flex flex-col gap-6">
      <header className="rounded-3xl bg-white p-5 shadow-sm ring-1 ring-black/5 sm:p-6">
        <p className="text-xs font-semibold uppercase tracking-[0.3em] text-slate-500">
          Puzzle #{puzzleId}
        </p>
        <h1 className="mt-2 text-2xl font-semibold text-slate-900 sm:text-3xl">
          {puzzle.title}
        </h1>
        <div className="mt-4 flex flex-wrap gap-2 text-sm text-slate-600">
          <span className="rounded-full bg-slate-100 px-3 py-1 font-semibold text-slate-800">
            {puzzle.difficulty}
          </span>
          <span className="rounded-full bg-slate-100 px-3 py-1">
            Drops {puzzle.dropsAt}
          </span>
          <span className="rounded-full bg-slate-100 px-3 py-1">
            {puzzle.strikesLeft} strikes left
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
            {gridCards.map((card) => (
              <button
                key={card}
                className="rounded-2xl border border-slate-200 bg-slate-50 px-3 py-4 text-center text-sm font-semibold text-slate-800 transition hover:-translate-y-0.5 hover:border-slate-400"
              >
                {card}
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
            <h2 className="text-lg font-semibold text-slate-900">Progress log</h2>
            <p className="text-sm text-slate-500">
              Track solved groups and remaining strikes.
            </p>
          </header>
          <ul className="space-y-4">
            {solvedGroups.map((group) => (
              <li
                key={group.title}
                className="rounded-2xl border border-emerald-200 bg-emerald-50 p-3"
              >
                <p className="text-sm font-semibold text-emerald-700">
                  {group.title}
                </p>
                <p className="text-xs text-emerald-600">
                  {group.cards.join(", ")}
                </p>
              </li>
            ))}
          </ul>
          <div className="mt-6 rounded-2xl border border-slate-200 p-3 text-sm text-slate-600">
            <p className="font-semibold text-slate-900">Strikes</p>
            <p>{puzzle.strikesLeft} remaining before the puzzle locks.</p>
          </div>
        </article>
      </section>
    </div>
  );
}
