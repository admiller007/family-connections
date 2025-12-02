export type Family = {
  id: string;
  name: string;
  createdBy: string;
  createdAt: number;
};

export type FamilyMember = {
  id: string;
  familyId: Family["id"];
  userId: string;
  role: "owner" | "admin" | "member";
  displayName: string;
};

export type Invite = {
  id: string;
  familyId: Family["id"];
  label: string;
  createdBy: string;
  expiresAt: number | null;
  token: string;
  status: "active" | "revoked" | "used";
};

export type PuzzleGroup = {
  title: string;
  hint: string;
  cards: string[];
};

export type Puzzle = {
  id: string;
  familyId: Family["id"];
  title: string;
  description?: string;
  dropsAt: number;
  status: "draft" | "published";
  groups: PuzzleGroup[];
};

export const familiesCollection = "families";
export const invitesCollection = "invites";
export const puzzlesCollection = "puzzles";
export const inviteTokensCollection = "inviteTokens";
export const familyMembersCollection = "members";

export const getFamilyDocPath = (familyId: string) =>
  `${familiesCollection}/${familyId}`;
export const getInviteDocPath = (familyId: string, inviteId: string) =>
  `${getFamilyDocPath(familyId)}/${invitesCollection}/${inviteId}`;
export const getPuzzleDocPath = (familyId: string, puzzleId: string) =>
  `${getFamilyDocPath(familyId)}/${puzzlesCollection}/${puzzleId}`;
export const getInviteTokenPath = (token: string) =>
  `${inviteTokensCollection}/${token}`;
export const getFamilyMemberPath = (familyId: string, userId: string) =>
  `${getFamilyDocPath(familyId)}/${familyMembersCollection}/${userId}`;
