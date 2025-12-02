const groups = [
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
              className="mt-1 w-full rounded-2xl border border-slate-200 px-3 py-3 text-sm outline-none focus:ring-2 focus:ring-slate-400"
              placeholder="e.g. Cousin Sleepover Legends"
            />
          </label>
          <label className="text-sm font-medium text-slate-700">
            Publish date
            <input
              type="date"
              className="mt-1 w-full rounded-2xl border border-slate-200 px-3 py-3 text-sm outline-none focus:ring-2 focus:ring-slate-400"
            />
          </label>
        </div>
        <label className="mt-4 block text-sm font-medium text-slate-700">
          Description (optional)
          <textarea
            rows={3}
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
          <button className="rounded-full border border-slate-200 px-4 py-2 text-sm font-semibold text-slate-700">
            Auto-balance
          </button>
        </header>

        <div className="grid gap-4 sm:grid-cols-2">
          {groups.map((group) => (
            <article
              key={group.title}
              className="rounded-2xl border border-slate-100 bg-slate-50 p-4"
            >
              <header className="mb-3">
                <p className="text-xs font-semibold uppercase text-slate-500">
                  {group.hint}
                </p>
                <h3 className="text-lg font-semibold text-slate-900">
                  {group.title}
                </h3>
              </header>
              <ul className="grid gap-2">
                {group.cards.map((card) => (
                  <li
                    key={card}
                    className="rounded-xl bg-white px-3 py-2 text-sm text-slate-700 shadow-sm ring-1 ring-black/5"
                  >
                    {card}
                  </li>
                ))}
              </ul>
            </article>
          ))}
        </div>
      </section>

      <section className="rounded-3xl bg-white p-5 shadow-sm ring-1 ring-black/5 sm:p-6">
        <h2 className="text-lg font-semibold text-slate-900">Preview grid</h2>
        <div className="mt-4 grid grid-cols-2 gap-3 sm:grid-cols-4">
          {groups.flatMap((group) => group.cards).map((card) => (
            <button
              key={card}
              className="rounded-2xl border border-slate-200 bg-slate-100 px-3 py-4 text-center text-sm font-semibold text-slate-700 transition hover:-translate-y-0.5 hover:border-slate-400"
            >
              {card}
            </button>
          ))}
        </div>
        <div className="mt-6 flex flex-col gap-3 sm:flex-row sm:flex-wrap">
          <button className="rounded-full bg-slate-900 px-6 py-3 text-sm font-semibold text-white">
            Save draft
          </button>
          <button className="rounded-full border border-slate-200 px-6 py-3 text-sm font-semibold text-slate-700">
            Publish to family
          </button>
          <button className="rounded-full border border-transparent px-6 py-3 text-sm font-semibold text-slate-600 underline-offset-2 hover:underline">
            Share preview link
          </button>
        </div>
      </section>
    </div>
  );
}
