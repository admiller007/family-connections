"use client";

import { CopyButton } from "@/components/copy-button";
import { useActionState } from "react";
import { createInviteLinkAction } from "./actions";
import { initialInviteState } from "./action-state";

type InviteFormProps = {
  defaultFamilyId: string;
  defaultFamilyName: string;
};

export default function InviteForm({ defaultFamilyId, defaultFamilyName }: InviteFormProps) {
  const [state, formAction] = useActionState(createInviteLinkAction, initialInviteState);

  return (
    <section className="rounded-3xl bg-white p-5 shadow-sm ring-1 ring-black/5 sm:p-6">
      <h2 className="text-lg font-semibold text-slate-900">Create a new invite</h2>
      <form action={formAction} className="mt-4 space-y-3">
        <label className="text-sm font-semibold text-slate-800">
          Family ID (slug)
          <input
            name="familyId"
            defaultValue={defaultFamilyId}
            className="mt-2 w-full rounded-2xl border border-slate-200 px-3 py-3 text-sm outline-none focus:ring-2 focus:ring-slate-400"
            placeholder="miller-family"
          />
        </label>
        <label className="text-sm font-semibold text-slate-800">
          Family name
          <input
            name="familyName"
            defaultValue={defaultFamilyName}
            className="mt-2 w-full rounded-2xl border border-slate-200 px-3 py-3 text-sm outline-none focus:ring-2 focus:ring-slate-400"
            placeholder="Miller Crew"
          />
        </label>
        <label className="text-sm font-semibold text-slate-800">
          Link label
          <input
            name="label"
            className="mt-2 w-full rounded-2xl border border-slate-200 px-3 py-3 text-sm outline-none focus:ring-2 focus:ring-slate-400"
            placeholder="Grandparents day"
          />
        </label>
        <label className="text-sm font-semibold text-slate-800">
          Expires in
          <select
            name="expiration"
            className="mt-2 w-full rounded-2xl border border-slate-200 bg-white px-3 py-3 text-sm outline-none focus:ring-2 focus:ring-slate-400"
            defaultValue="3"
          >
            <option value="3">3 days</option>
            <option value="7">7 days</option>
            <option value="30">30 days</option>
            <option value="never">Never expires</option>
          </select>
        </label>
        <button className="w-full rounded-2xl bg-slate-900 py-3 text-sm font-semibold text-white sm:w-auto sm:px-6">
          Generate link
        </button>
      </form>
      {state.status === "success" && state.data && (
        <div className="mt-4 space-y-3 rounded-2xl border border-slate-200 p-4">
          <p className="text-xs font-semibold uppercase tracking-[0.2em] text-slate-500">
            Invite link
          </p>
          <p className="break-all text-sm text-slate-800">{state.data.url}</p>
          <div className="flex flex-col gap-2 sm:flex-row">
            <a
              href={state.data.whatsappShare}
              target="_blank"
              rel="noreferrer"
              className="rounded-2xl bg-emerald-600 px-4 py-2 text-center text-xs font-semibold text-white"
            >
              Share on WhatsApp
            </a>
            <CopyButton text={state.data.url} />
          </div>
        </div>
      )}
      {state.status === "error" && state.message && (
        <p className="mt-4 rounded-2xl bg-rose-50 px-4 py-3 text-sm text-rose-600">
          {state.message}
        </p>
      )}
    </section>
  );
}
