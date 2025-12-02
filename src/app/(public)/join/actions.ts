"use server";

import { getAdminAuth, getAdminDb } from "@/lib/firebase/admin";
import {
  getFamilyDocPath,
  getFamilyMemberPath,
  getInviteTokenPath,
} from "@/lib/firestore/models";
import { FieldValue } from "firebase-admin/firestore";
import { ActionState, errorState, successState } from "./action-state";

const baseAppUrl = process.env.NEXT_PUBLIC_APP_URL ?? "http://localhost:3000";

const sanitizeInviteInput = (value: string | undefined | null) => {
  if (!value) return "";
  const trimmed = value.trim();
  const parts = trimmed.split("/");
  return parts[parts.length - 1] ?? "";
};

export async function requestMagicLinkAction(
  _prevState: ActionState<{ link: string; email: string }> | ActionState<undefined>,
  formData: FormData,
) {
  const email = formData.get("email")?.toString().trim().toLowerCase();
  const inviteToken = sanitizeInviteInput(formData.get("inviteToken")?.toString());
  const redirectTarget = formData.get("redirectTarget")?.toString() ?? "";
  const sanitizedRedirect =
    redirectTarget.startsWith("/") && !redirectTarget.startsWith("//")
      ? redirectTarget
      : "/dashboard";

  if (!email) {
    return errorState("Please enter an email address.");
  }

  try {
    const auth = getAdminAuth();
    const url = new URL(`${baseAppUrl}/join/confirm`);
    if (inviteToken) {
      url.searchParams.set("invite", inviteToken);
    }
    if (sanitizedRedirect) {
      url.searchParams.set("redirect", sanitizedRedirect);
    }
    const actionCodeSettings = {
      url: url.toString(),
      handleCodeInApp: true,
    };
    const link = await auth.generateSignInWithEmailLink(email, actionCodeSettings);
    return successState({ link, email }, "Magic link generated. Share it via WhatsApp or email.");
  } catch (error) {
    console.error("[requestMagicLinkAction]", error);
    return errorState("Unable to generate a link right now. Try again in a moment.");
  }
}

export async function acceptInviteAction(
  _prevState: ActionState<{ token: string; familyId: string; familyName: string }> | ActionState<undefined>,
  formData: FormData,
) {
  const rawToken = sanitizeInviteInput(formData.get("inviteCode")?.toString());
  if (!rawToken) {
    return errorState("Paste a valid invite link or code.");
  }

  try {
    const db = getAdminDb();
    const inviteRef = db.doc(getInviteTokenPath(rawToken));
    const snapshot = await inviteRef.get();

    if (!snapshot.exists) {
      return errorState("Invite not found. Ask your family to generate a new link.");
    }

    const data = snapshot.data() as {
      familyId: string;
      familyName: string;
      status: string;
      expiresAt?: FirebaseFirestore.Timestamp;
    };

    if (data.status !== "active") {
      return errorState("This invite is no longer active.");
    }

    if (data.expiresAt && data.expiresAt.toMillis() < Date.now()) {
      await inviteRef.update({ status: "expired" });
      return errorState("This invite has expired. Request a fresh link.");
    }

    await inviteRef.update({
      lastCheckedAt: FieldValue.serverTimestamp(),
    });

    return successState(
      { token: rawToken, familyId: data.familyId, familyName: data.familyName ?? "Family" },
      "Invite validated. Move to the next step to request a login link.",
    );
  } catch (error) {
    console.error("[acceptInviteAction]", error);
    return errorState("Unable to validate this invite. Try again shortly.");
  }
}

type FinalizeJoinPayload = {
  inviteToken?: string | null;
  userId: string;
  email: string;
  username?: string | null;
  displayName?: string | null;
};

export async function finalizeJoinAction(payload: FinalizeJoinPayload) {
  const { inviteToken, userId, email, username, displayName } = payload;
  if (!inviteToken) {
    return errorState("Missing invite token.");
  }
  if (!userId) {
    return errorState("Missing user information.");
  }

  try {
    const db = getAdminDb();
    const inviteRef = db.doc(getInviteTokenPath(inviteToken));
    const inviteSnap = await inviteRef.get();
    if (!inviteSnap.exists) {
      return errorState("Invite not found.");
    }

    const invite = inviteSnap.data() as {
      familyId?: string;
      familyName?: string;
      status: string;
    };
    if (invite.status !== "active") {
      return errorState("Invite is not active.");
    }

    const familyId = invite.familyId ?? "default-family";
    const familyName = invite.familyName ?? "Family Connections";
    const familyRef = db.doc(getFamilyDocPath(familyId));
    const memberRef = db.doc(getFamilyMemberPath(familyId, userId));

    await Promise.all([
      familyRef.set(
        {
          name: familyName,
          updatedAt: FieldValue.serverTimestamp(),
        },
        { merge: true },
      ),
      memberRef.set(
        {
          userId,
          email,
          displayName: displayName ?? username ?? email,
          username: username ?? null,
          joinedAt: FieldValue.serverTimestamp(),
          inviteToken,
        },
        { merge: true },
      ),
      inviteRef.update({
        status: "used",
        usedBy: userId,
        usedAt: FieldValue.serverTimestamp(),
      }),
    ]);

    return successState(
      { familyId, familyName },
      "Welcome to your family space!",
    );
  } catch (error) {
    console.error("[finalizeJoinAction]", error);
    return errorState("Unable to finalize onboarding right now.");
  }
}
