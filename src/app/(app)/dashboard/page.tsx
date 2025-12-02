const drafts = [
  {
    id: "draft-1",
    title: "Family Vacation Memories",
    updatedAt: "5 min ago",
  },
  {
    id: "draft-2",
    title: "Generations Trivia",
    updatedAt: "2 days ago",
  },
];

const published = [
  { id: "pub-1", title: "Grandma&apos;s Recipes", solved: 6 },
  { id: "pub-2", title: "Inside Jokes 2024", solved: 4 },
];

const activity = [
  { id: "act-1", text: "Aunt Lisa solved Inside Jokes 2024", time: "2h ago" },
  { id: "act-2", text: "Dad published Family Vacation Memories", time: "1d ago" },
  { id: "act-3", text: "3 new members joined via WhatsApp links", time: "2d ago" },
];

export default function DashboardPage() {
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
              {drafts.length} drafts
            </span>
          </header>
          <ul className="space-y-3">
            {drafts.map((draft) => (
              <li
                key={draft.id}
                className="rounded-2xl border border-slate-100 bg-slate-50 px-4 py-3"
              >
                <p className="font-medium text-slate-900">{draft.title}</p>
                <p className="text-xs text-slate-500">
                  Last updated {draft.updatedAt}
                </p>
              </li>
            ))}
          </ul>
        </article>

        <article className="rounded-3xl bg-white p-5 shadow-sm ring-1 ring-black/5 sm:p-6">
          <header className="mb-4 flex items-center justify-between">
            <div>
              <h2 className="text-lg font-semibold">Published</h2>
              <p className="text-sm text-slate-500">Last 72 hours of activity.</p>
            </div>
            <span className="rounded-full bg-slate-100 px-3 py-1 text-xs font-semibold text-slate-700">
              {published.length} live
            </span>
          </header>
          <ul className="space-y-3">
            {published.map((item) => (
              <li
                key={item.id}
                className="flex flex-col gap-2 rounded-2xl border border-slate-100 px-4 py-3 sm:flex-row sm:items-center sm:justify-between"
              >
                <div>
                  <p className="font-medium text-slate-900">{item.title}</p>
                  <p className="text-xs text-slate-500">
                    {item.solved} family solves
                  </p>
                </div>
                <button className="text-sm font-semibold text-slate-700 underline-offset-2 hover:underline">
                  View stats
                </button>
              </li>
            ))}
          </ul>
        </article>
      </section>

      <section className="rounded-3xl bg-white p-5 shadow-sm ring-1 ring-black/5 sm:p-6">
        <header className="mb-4 flex items-center justify-between">
          <h2 className="text-lg font-semibold text-slate-900">Activity</h2>
          <button className="text-sm font-semibold text-slate-600 underline-offset-2 hover:underline">
            View all
          </button>
        </header>
        <ol className="space-y-3">
          {activity.map((item) => (
            <li
              key={item.id}
              className="flex items-center justify-between rounded-2xl border border-slate-100 px-4 py-3"
            >
              <p className="text-sm font-medium text-slate-800">{item.text}</p>
              <span className="text-xs text-slate-500">{item.time}</span>
            </li>
          ))}
        </ol>
      </section>
    </div>
  );
}
