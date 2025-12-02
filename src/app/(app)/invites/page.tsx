import { getAdminDb } from "@/lib/firebase/admin";
import { inviteTokensCollection } from "@/lib/firestore/models";
import InviteForm from "./invite-form";
import { CopyButton } from "@/components/copy-button";

type InviteRecord = {
  token: string;
  familyName: string;
  label: string;
  status: string;
  createdAt?: Date;
  expiresAt?: Date | null;
};

async function fetchRecentInvites(): Promise<InviteRecord[]> {
  const db = getAdminDb();
  const snapshot = await db
    .collection(inviteTokensCollection)
    .orderBy("createdAt", "desc")
    .limit(10)
    .get();

  return snapshot.docs.map((doc) => {
    const data = doc.data() as {
      token: string;
      label: string;
      familyName: string;
      status: string;
      createdAt?: FirebaseFirestore.Timestamp;
      expiresAt?: FirebaseFirestore.Timestamp | null;
    };
    return {
      token: data.token,
      label: data.label,
      familyName: data.familyName ?? "Family",
      status: data.status,
      createdAt: data.createdAt?.toDate(),
      expiresAt: data.expiresAt ? data.expiresAt.toDate() : null,
    };
  });
}

const baseAppUrl = process.env.NEXT_PUBLIC_APP_URL ?? "http://localhost:3000";

export const dynamic = 'force-dynamic';

export default async function InvitesPage() {
  const invites = await fetchRecentInvites();

  return (
    <div className="flex flex-col gap-6">
      <header className="space-y-2">
        <p className="text-xs font-semibold uppercase tracking-[0.3em] text-slate-500">
          WhatsApp links
        </p>
        <h1 className="text-2xl font-semibold text-slate-900 sm:text-3xl">
          Generate and track family invites
        </h1>
        <p className="text-sm text-slate-600 sm:text-base">
          Spin up a unique link per chat thread so you know who joined from where. Every link
          is short and mobile-ready.
        </p>
      </header>

      <InviteForm defaultFamilyId="demo-family" defaultFamilyName="Miller Crew" />

      <section className="space-y-3 rounded-3xl bg-white p-5 shadow-sm ring-1 ring-black/5 sm:p-6">
        <header className="flex flex-col gap-1 sm:flex-row sm:items-center sm:justify-between">
          <div>
            <h2 className="text-lg font-semibold text-slate-900">Recent invites</h2>
            <p className="text-sm text-slate-600">
              Tap to copy and drop directly into WhatsApp. Tokens auto-expire if unused.
            </p>
          </div>
        </header>
        {invites.length === 0 && (
          <p className="rounded-2xl border border-dashed border-slate-200 px-4 py-6 text-center text-sm text-slate-500">
            No invites yet. Generate your first link above.
          </p>
        )}
        <ul className="space-y-3">
          {invites.map((invite) => {
            const inviteUrl = `${baseAppUrl}/invite/${invite.token}`;
            const whatsappLink = `https://wa.me/?text=${encodeURIComponent(
              `Join today's Family Connections puzzle: ${inviteUrl}`,
            )}`;
            const expiresText = invite.expiresAt
              ? `Expires ${invite.expiresAt.toLocaleDateString()}`
              : "No expiration";
            return (
              <li
                key={invite.token}
                className="flex flex-col gap-3 rounded-2xl border border-slate-100 p-4 sm:flex-row sm:items-center sm:justify-between"
              >
                <div>
                  <p className="text-sm font-semibold text-slate-900">{invite.label}</p>
                  <p className="text-xs text-slate-500">
                    {invite.familyName} • {expiresText}
                  </p>
                  <p className="text-xs font-mono text-slate-400">Token: {invite.token}</p>
                </div>
                <div className="flex flex-col gap-2 sm:flex-row">
                  <a
                    href={whatsappLink}
                    target="_blank"
                    rel="noreferrer"
                    className="rounded-2xl bg-emerald-600 px-4 py-2 text-center text-xs font-semibold text-white"
                  >
                    Share via WhatsApp
                  </a>
                  <CopyButton text={inviteUrl} />
                </div>
              </li>
            );
          })}
        </ul>
      </section>
    </div>
  );
}
