import { getAdminDb } from "@/lib/firebase/admin";
import { getInviteTokenPath } from "@/lib/firestore/models";
import Link from "next/link";
import { notFound } from "next/navigation";

type InvitePageProps = {
  params: { token: string };
};

export default async function InviteLandingPage({ params }: InvitePageProps) {
  const db = getAdminDb();
  const inviteRef = db.doc(getInviteTokenPath(params.token));
  const snapshot = await inviteRef.get();

  if (!snapshot.exists) {
    notFound();
  }

  const invite = snapshot.data() as {
    familyName: string;
    label: string;
    status: string;
    expiresAt?: FirebaseFirestore.Timestamp | null;
  };
  const expiresAtDate = invite.expiresAt ? invite.expiresAt.toDate() : null;
  const referenceTime = snapshot.readTime?.toDate() ?? new Date();
  const isExpired =
    invite.status !== "active" ||
    (expiresAtDate !== null && expiresAtDate.getTime() < referenceTime.getTime());

  return (
    <div className="mx-auto flex min-h-screen max-w-2xl flex-col gap-6 px-4 py-12 sm:px-6">
      <header className="space-y-2 text-center">
        <p className="text-xs font-semibold uppercase tracking-[0.3em] text-slate-500">
          You&apos;re invited
        </p>
        <h1 className="text-3xl font-semibold text-slate-900 sm:text-4xl">
          Jump into {invite.familyName}&apos;s puzzle space
        </h1>
        <p className="text-sm text-slate-600 sm:text-base">
          This link came from {invite.label}. Confirm it&apos;s the right family, then continue
          to request your one-time login link.
        </p>
      </header>

      <section className="space-y-4 rounded-3xl bg-white p-5 shadow-sm ring-1 ring-black/5 sm:p-6">
        <dl className="space-y-2 text-sm text-slate-700">
          <div className="flex justify-between rounded-2xl bg-slate-50 px-4 py-3">
            <dt className="font-semibold text-slate-900">Family</dt>
            <dd>{invite.familyName}</dd>
          </div>
          <div className="flex justify-between rounded-2xl bg-slate-50 px-4 py-3">
            <dt className="font-semibold text-slate-900">Shared by</dt>
            <dd>{invite.label}</dd>
          </div>
          <div className="flex justify-between rounded-2xl bg-slate-50 px-4 py-3">
            <dt className="font-semibold text-slate-900">Status</dt>
            <dd className={isExpired ? "text-rose-600" : "text-emerald-600"}>
              {isExpired ? "Expired or inactive" : "Active"}
            </dd>
          </div>
        </dl>

        <div className="space-y-3">
          {!isExpired ? (
            <>
              <Link
                href={`/join?invite=${params.token}`}
                className="block rounded-2xl bg-slate-900 py-3 text-center text-sm font-semibold text-white"
              >
                Continue to onboarding
              </Link>
              <p className="text-xs text-slate-500">
                You&apos;ll paste this link into the onboarding form on the next screen.
              </p>
            </>
          ) : (
            <p className="rounded-2xl bg-rose-50 px-4 py-3 text-sm text-rose-600">
              This invite can no longer be used. Ask your family to generate a new link in the
              dashboard.
            </p>
          )}
        </div>
      </section>
    </div>
  );
}
