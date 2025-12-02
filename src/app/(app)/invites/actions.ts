"use server";

import { getAdminDb } from "@/lib/firebase/admin";
import { inviteTokensCollection } from "@/lib/firestore/models";
import { randomBytes } from "crypto";
import { FieldValue, Timestamp } from "firebase-admin/firestore";
import { revalidatePath } from "next/cache";
import { InviteCreationState } from "./action-state";

const baseAppUrl = process.env.NEXT_PUBLIC_APP_URL ?? "http://localhost:3000";

export async function createInviteLinkAction(
  _prevState: InviteCreationState,
  formData: FormData,
) {
  const familyId = formData.get("familyId")?.toString() || "demo-family";
  const familyName = formData.get("familyName")?.toString() || "Family";
  const label = formData.get("label")?.toString() || "Family invite";
  const expiration = formData.get("expiration")?.toString() || "3";
  const createdBy = formData.get("createdBy")?.toString() || "admin";

  try {
    const token = randomBytes(5).toString("hex");
    const expirationDays = Number(expiration);
    const expiresAt =
      expiration === "never" || Number.isNaN(expirationDays)
        ? null
        : Timestamp.fromMillis(Date.now() + expirationDays * 24 * 60 * 60 * 1000);

    const db = getAdminDb();
    const inviteRef = db.collection(inviteTokensCollection).doc(token);
    await inviteRef.set({
      token,
      familyId,
      familyName,
      label,
      status: "active",
      createdBy,
      createdAt: FieldValue.serverTimestamp(),
      expiresAt,
    });

    const inviteUrl = `${baseAppUrl}/invite/${token}`;
    const whatsappShare = `https://wa.me/?text=${encodeURIComponent(
      `Join today's Family Connections puzzle: ${inviteUrl}`,
    )}`;

    revalidatePath("/invites");

    return {
      status: "success",
      message: "Invite link generated.",
      data: { token, url: inviteUrl, whatsappShare },
    } satisfies InviteCreationState;
  } catch (error) {
    console.error("[createInviteLinkAction]", error);
    return {
      status: "error",
      message: "Unable to create an invite link right now.",
    } satisfies InviteCreationState;
  }
}
