"use client";

import { useRouter, useSearchParams } from "next/navigation";
import { useEffect, useState } from "react";
import {
  isSignInWithEmailLink,
  signInWithEmailLink,
  updatePassword,
  updateProfile,
  type User,
} from "firebase/auth";
import { clientAuth } from "@/lib/firebase/client";
import { doc, serverTimestamp, setDoc } from "firebase/firestore";
import { clientDb } from "@/lib/firebase/client";
import { finalizeJoinAction } from "../actions";

export default function ConfirmJoinPage() {
  const router = useRouter();
  const searchParams = useSearchParams();
  const inviteToken = searchParams.get("invite");
  const redirectTarget =
    searchParams.get("redirect") && searchParams.get("redirect")!.startsWith("/")
      ? searchParams.get("redirect")!
      : "/dashboard";

  const [email, setEmail] = useState("");
  const [authError, setAuthError] = useState<string | null>(null);
  const [isLinkValid, setIsLinkValid] = useState(false);
  const [currentUser, setCurrentUser] = useState<User | null>(null);
  const [profileMessage, setProfileMessage] = useState<string | null>(null);
  const [isCompleting, setIsCompleting] = useState(false);
  const [isSavingProfile, setIsSavingProfile] = useState(false);

  useEffect(() => {
    const storedEmail = window.localStorage.getItem("family-connections-email");
    if (storedEmail) {
      setEmail(storedEmail);
    }
    const url = window.location.href;
    setIsLinkValid(isSignInWithEmailLink(clientAuth, url));
  }, []);

  const handleCompleteSignIn = async () => {
    if (!email) {
      setAuthError("Enter the same email that received the link.");
      return;
    }

    setIsCompleting(true);
    setAuthError(null);
    try {
      const result = await signInWithEmailLink(clientAuth, email, window.location.href);
      window.localStorage.removeItem("family-connections-email");
      setCurrentUser(result.user);
      setProfileMessage("Signed in! Choose a username and password to finish.");
    } catch (error) {
      console.error("[confirm join] signInWithEmailLink", error);
      setAuthError("Unable to complete sign-in. The link may be expired or already used.");
    } finally {
      setIsCompleting(false);
    }
  };

  const handleSaveProfile = async (formData: FormData) => {
    if (!currentUser) return;
    const username = formData.get("username")?.toString().trim();
    const password = formData.get("password")?.toString();
    const displayName = formData.get("displayName")?.toString().trim();

    if (!username || !password) {
      setProfileMessage("Username and password are required.");
      return;
    }

    setIsSavingProfile(true);
    setProfileMessage(null);
    try {
      await updatePassword(currentUser, password);
      await updateProfile(currentUser, { displayName: displayName || username });
      await setDoc(
        doc(clientDb, "profiles", currentUser.uid),
        {
          username,
          displayName: displayName || username,
          updatedAt: serverTimestamp(),
          inviteToken: inviteToken ?? null,
        },
        { merge: true },
      );

      const finalizeResult = await finalizeJoinAction({
        inviteToken,
        userId: currentUser.uid,
        email: currentUser.email ?? email,
        username,
        displayName: displayName || username,
      });

      if (finalizeResult.status === "error") {
        setProfileMessage(finalizeResult.message ?? "Could not finalize onboarding.");
        return;
      }

      setProfileMessage("Profile saved! Redirecting to your dashboard...");
      setTimeout(() => router.push(redirectTarget), 1500);
    } catch (error) {
      console.error("[confirm join] save profile", error);
      setProfileMessage("Could not save your profile. Try again.");
    } finally {
      setIsSavingProfile(false);
    }
  };

  return (
    <div className="mx-auto flex min-h-screen max-w-md flex-col gap-6 px-4 py-10 sm:px-6">
      <header className="space-y-2 text-center">
        <p className="text-xs font-semibold uppercase tracking-[0.3em] text-slate-500">
          Finish joining
        </p>
        <h1 className="text-3xl font-semibold text-slate-900">
          Confirm your email to unlock the family space
        </h1>
        <p className="text-sm text-slate-600">
          Tap the button below after opening the link from your email (or WhatsApp).
        </p>
      </header>

      <section className="space-y-4 rounded-3xl bg-white p-5 shadow-sm ring-1 ring-black/5 sm:p-6">
        <h2 className="text-lg font-semibold text-slate-900">1. Confirm the link</h2>
        <p className="text-sm text-slate-600">
          We&apos;ll confirm this one-time link and sign you in automatically.
        </p>
        {!isLinkValid && (
          <p className="rounded-2xl bg-rose-50 px-4 py-3 text-sm text-rose-600">
            This page must be opened from the magic link. Request a new link if needed.
          </p>
        )}
        <label className="text-sm font-semibold text-slate-800">
          Email address
          <input
            className="mt-2 w-full rounded-2xl border border-slate-200 px-3 py-3 text-sm outline-none focus:ring-2 focus:ring-slate-400"
            type="email"
            value={email}
            onChange={(event) => setEmail(event.target.value)}
            placeholder="you@example.com"
          />
        </label>
        <button
          type="button"
          onClick={handleCompleteSignIn}
          disabled={!isLinkValid || isCompleting}
          className="w-full rounded-2xl bg-slate-900 py-3 text-sm font-semibold text-white disabled:opacity-60"
        >
          {isCompleting ? "Completing sign in..." : "Complete sign in"}
        </button>
        {authError && (
          <p className="rounded-2xl bg-rose-50 px-4 py-3 text-sm text-rose-600">{authError}</p>
        )}
      </section>

      {currentUser && (
        <section className="space-y-4 rounded-3xl bg-white p-5 shadow-sm ring-1 ring-black/5 sm:p-6">
          <h2 className="text-lg font-semibold text-slate-900">
            2. Create username & password
          </h2>
          <p className="text-sm text-slate-600">
            This helps family members mention you and lets you log in the traditional way.
          </p>
          <form action={handleSaveProfile} className="space-y-3">
            <label className="text-sm font-semibold text-slate-800">
              Display name
              <input
                name="displayName"
                className="mt-2 w-full rounded-2xl border border-slate-200 px-3 py-3 text-sm outline-none focus:ring-2 focus:ring-slate-400"
                placeholder="e.g. Aunt Lisa"
              />
            </label>
            <label className="text-sm font-semibold text-slate-800">
              Username
              <input
                name="username"
                className="mt-2 w-full rounded-2xl border border-slate-200 px-3 py-3 text-sm outline-none focus:ring-2 focus:ring-slate-400"
                placeholder="e.g. aunt-lisa"
              />
            </label>
            <label className="text-sm font-semibold text-slate-800">
              Password
              <input
                name="password"
                type="password"
                className="mt-2 w-full rounded-2xl border border-slate-200 px-3 py-3 text-sm outline-none focus:ring-2 focus:ring-slate-400"
                placeholder="Create a strong password"
              />
            </label>
            <button
              className="w-full rounded-2xl bg-slate-900 py-3 text-sm font-semibold text-white disabled:opacity-60"
              disabled={isSavingProfile}
            >
              {isSavingProfile ? "Saving..." : "Save profile"}
            </button>
          </form>
          {profileMessage && (
            <p className="rounded-2xl bg-slate-50 px-4 py-3 text-sm text-slate-700">
              {profileMessage}
            </p>
          )}
        </section>
      )}
    </div>
  );
}
