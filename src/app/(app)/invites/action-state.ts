export type InviteCreationState = {
  status: "idle" | "success" | "error";
  message?: string;
  data?: {
    token: string;
    url: string;
    whatsappShare: string;
  };
};

export const initialInviteState: InviteCreationState = { status: "idle" };
