import Link from "next/link";

const features = [
  {
    title: "Family-first sharing",
    description:
      "Spin up private spaces for each branch of the family and invite people with a WhatsApp link.",
  },
  {
    title: "Custom puzzle builder",
    description:
      "Craft 4x4 groupings with prompts, hints, and color themes that feel personal to your crew.",
  },
  {
    title: "Async-friendly play",
    description:
      "Everyone solves on their own schedule while progress and bragging rights still get logged.",
  },
];

export default function LandingPage() {
  return (
    <div className="mx-auto flex min-h-screen max-w-5xl flex-col gap-12 px-4 py-12 sm:gap-16 sm:px-6">
      <header className="flex flex-col gap-5 text-center sm:gap-8">
        <p className="text-xs font-semibold uppercase tracking-[0.3em] text-sky-600">
          Playful family rituals
        </p>
        <h1 className="text-pretty text-3xl font-semibold text-slate-900 sm:text-5xl">
          Build Connections-style puzzles with &apos;only-our-family&apos; clues.
        </h1>
        <p className="mx-auto max-w-2xl text-base text-slate-600 sm:text-lg">
          Drop the link in WhatsApp, let relatives join on their phones, and
          keep everyone solving at their own pace. No installs, no friction.
        </p>
        <div className="flex flex-col justify-center gap-3 sm:flex-row">
          <Link
            href="/join"
            className="rounded-full bg-slate-900 px-6 py-3 text-sm font-semibold text-white transition hover:bg-slate-800"
          >
            Join with invite link
          </Link>
          <Link
            href="/dashboard"
            className="rounded-full border border-slate-300 px-6 py-3 text-sm font-semibold text-slate-700 transition hover:bg-white hover:text-slate-900"
          >
            View creator tools
          </Link>
        </div>
      </header>

      <section className="grid gap-4 rounded-3xl bg-white/90 p-6 shadow-sm ring-1 ring-black/5 sm:grid-cols-3 sm:gap-6 sm:p-8">
        {features.map((feature) => (
          <article key={feature.title} className="space-y-2 rounded-2xl bg-slate-50 p-4">
            <h3 className="text-base font-semibold text-slate-900 sm:text-lg">
              {feature.title}
            </h3>
            <p className="text-sm text-slate-600">{feature.description}</p>
          </article>
        ))}
      </section>

      <section className="rounded-3xl bg-gradient-to-b from-sky-100 via-indigo-100 to-purple-100 p-6 text-slate-900 sm:p-8">
        <div className="space-y-4">
          <h2 className="text-xl font-semibold sm:text-2xl">
            What&apos;s shipping in the first drop?
          </h2>
          <ul className="list-disc space-y-2 pl-4 text-sm text-slate-700 sm:pl-6 sm:text-base">
            <li>WhatsApp-friendly invite tokens</li>
            <li>Email magic links + username/password setup</li>
            <li>Mobile-first dashboard, builder, and play screens</li>
            <li>Activity log so no solve goes unnoticed</li>
            <li>Admin tools to duplicate or unpublish puzzles</li>
          </ul>
        </div>
      </section>
    </div>
  );
}
