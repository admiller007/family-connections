import { collection, doc } from "firebase/firestore";
import { clientDb } from "../firebase/client";
import {
  familiesCollection,
  familyMembersCollection,
  invitesCollection,
  inviteTokensCollection,
  puzzlesCollection,
} from "./models";

export const familiesRef = collection(clientDb, familiesCollection);

export const familyDoc = (familyId: string) => doc(clientDb, familiesCollection, familyId);

export const familyInvitesRef = (familyId: string) =>
  collection(clientDb, familiesCollection, familyId, invitesCollection);

export const inviteDoc = (familyId: string, inviteId: string) =>
  doc(clientDb, familiesCollection, familyId, invitesCollection, inviteId);

export const familyPuzzlesRef = (familyId: string) =>
  collection(clientDb, familiesCollection, familyId, puzzlesCollection);

export const puzzleDoc = (familyId: string, puzzleId: string) =>
  doc(clientDb, familiesCollection, familyId, puzzlesCollection, puzzleId);

export const inviteTokensRef = collection(clientDb, inviteTokensCollection);

export const inviteTokenDoc = (token: string) =>
  doc(clientDb, inviteTokensCollection, token);

export const familyMembersRef = (familyId: string) =>
  collection(clientDb, familiesCollection, familyId, familyMembersCollection);

export const familyMemberDoc = (familyId: string, userId: string) =>
  doc(clientDb, familiesCollection, familyId, familyMembersCollection, userId);
