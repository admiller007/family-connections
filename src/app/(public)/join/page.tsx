'use client';

import { useActionState, useEffect, useMemo, useState } from "react";
import { useSearchParams } from "next/navigation";
import {
  acceptInviteAction,
  requestMagicLinkAction,
} from "./actions";
import { initialActionState, type ActionState } from "./action-state";

const sampleStepItems = [
  "Paste the WhatsApp invite link to confirm you're in the right family.",
  "Drop an email to generate a shareable one-time magic link.",
  "Tap the link on your phone to finish signing in and set your password.",
];

const isSuccessState = <T>(state: ActionState<T>): state is ActionState<T> & { status: "success"; data: T } =>
  state.status === "success" && state.data !== undefined;

export default function JoinPage() {
  const searchParams = useSearchParams();
  const redirectTarget = searchParams.get("redirect") ?? "/dashboard";
  const [inviteInput, setInviteInput] = useState(() => searchParams.get("invite") ?? "");

  const [inviteState, acceptInviteDispatch] = useActionState(
    acceptInviteAction,
    initialActionState,
  );

  const [magicState, requestMagicLinkDispatch] = useActionState(
    requestMagicLinkAction,
    initialActionState,
  );

  useEffect(() => {
    if (isSuccessState(magicState)) {
      window.localStorage.setItem("family-connections-email", magicState.data.email);
    }
  }, [magicState]);

  const sanitizedToken = isSuccessState(inviteState) ? inviteState.data.token : null;

  const inviteSummary = useMemo(() => {
    if (isSuccessState(inviteState)) {
      return `Connected to ${inviteState.data.familyName}.`;
    }
    if (inviteState.status === "error" && inviteState.message) {
      return inviteState.message;
    }
    return null;
  }, [inviteState]);

  const magicLinkSummary = useMemo(() => {
    if (isSuccessState(magicState)) {
      return magicState.message ?? "Magic link generated.";
    }
    if (magicState.status === "error" && magicState.message) {
      return magicState.message;
    }
    return null;
  }, [magicState]);

  const inviteTokenForLink = sanitizedToken || inviteInput;

  const handleCopyLink = async (link: string) => {
    try {
      await navigator.clipboard.writeText(link);
      alert("Link copied. Paste it into WhatsApp or open it on your phone.");
    } catch {
      alert("Unable to copy automatically. Long-press the link text to copy.");
    }
  };

  return (
    <div className="mx-auto flex min-h-screen max-w-3xl flex-col gap-8 px-4 py-10 sm:px-6">
      <header className="space-y-3 text-center">
        <p className="text-xs font-semibold uppercase tracking-[0.3em] text-sky-600">
          Join your family
        </p>
        <h1 className="text-3xl font-semibold text-slate-900 sm:text-4xl">
          Paste the WhatsApp link, then finish sign-in in minutes.
        </h1>
        <p className="text-sm text-slate-600 sm:text-base">
          We&apos;ll validate the invite, generate a magic link, and walk you through
          setting a password once you click it.
        </p>
      </header>

      <ol className="space-y-3 rounded-3xl bg-white p-5 text-sm text-slate-700 shadow-sm ring-1 ring-black/5 sm:p-6">
        {sampleStepItems.map((item, idx) => (
          <li key={item} className="flex gap-3">
            <span className="mt-1 flex h-6 w-6 items-center justify-center rounded-full bg-slate-900 text-xs font-semibold text-white">
              {idx + 1}
            </span>
            <p>{item}</p>
          </li>
        ))}
      </ol>

      <section className="space-y-4 rounded-3xl bg-white p-5 shadow-sm ring-1 ring-black/5 sm:p-6">
        <header className="space-y-1">
          <h2 className="text-lg font-semibold text-slate-900">
            1. Paste your WhatsApp invite link
          </h2>
          <p className="text-sm text-slate-600">
            The link looks like <code>family.app/invite/XXXX</code>. We&apos;ll verify it
            and drop you straight in.
          </p>
        </header>
        <form action={acceptInviteDispatch} className="space-y-3">
          <label className="text-sm font-semibold text-slate-800">
            Invite link or code
            <input
              name="inviteCode"
              className="mt-2 w-full rounded-2xl border border-slate-200 px-3 py-3 text-sm outline-none focus:ring-2 focus:ring-slate-400"
              placeholder="https://family.app/invite/abcd1234"
              value={inviteInput}
              onChange={(event) => setInviteInput(event.target.value)}
            />
          </label>
          <button className="w-full rounded-2xl bg-slate-900 py-3 text-sm font-semibold text-white">
            Unlock family space
          </button>
        </form>
        {inviteSummary && (
          <p
            className={`rounded-2xl px-4 py-3 text-sm ${
              inviteState.status === "success"
                ? "bg-emerald-50 text-emerald-700"
                : "bg-rose-50 text-rose-600"
            }`}
          >
            {inviteSummary}
          </p>
        )}
      </section>

      <section className="space-y-4 rounded-3xl bg-white p-5 shadow-sm ring-1 ring-black/5 sm:p-6">
        <header className="space-y-1">
          <h2 className="text-lg font-semibold text-slate-900">
            2. Get an email magic link
          </h2>
          <p className="text-sm text-slate-600">
            We&apos;ll send a passwordless link. Share the text right into WhatsApp if
            you&apos;re helping someone else join.
          </p>
        </header>
        <form action={requestMagicLinkDispatch} className="space-y-3">
          <input type="hidden" name="inviteToken" value={inviteTokenForLink} readOnly />
          <input type="hidden" name="redirectTarget" value={redirectTarget} readOnly />
          <label className="text-sm font-semibold text-slate-800">
            Email address
            <input
              name="email"
              type="email"
              required
              className="mt-2 w-full rounded-2xl border border-slate-200 px-3 py-3 text-sm outline-none focus:ring-2 focus:ring-slate-400"
              placeholder="you@example.com"
            />
          </label>
          <button className="w-full rounded-2xl border border-slate-200 py-3 text-sm font-semibold text-slate-800">
            Send one-time link
          </button>
        </form>
        {magicLinkSummary && (
          <p
            className={`rounded-2xl px-4 py-3 text-sm ${
              magicState.status === "success"
                ? "bg-emerald-50 text-emerald-700"
                : "bg-rose-50 text-rose-600"
            }`}
          >
            {magicLinkSummary}
          </p>
        )}
        {isSuccessState(magicState) && (
          <div className="space-y-3 rounded-2xl border border-slate-200 p-4">
            <p className="text-xs font-semibold uppercase tracking-[0.25em] text-slate-500">
              Magic link preview
            </p>
            <p className="break-all text-sm text-slate-700">{magicState.data.link}</p>
            <button
              type="button"
              onClick={() => handleCopyLink(magicState.data.link)}
              className="w-full rounded-2xl bg-slate-900 py-2 text-xs font-semibold uppercase tracking-[0.2em] text-white"
            >
              Copy link
            </button>
          </div>
        )}
      </section>
    </div>
  );
}
