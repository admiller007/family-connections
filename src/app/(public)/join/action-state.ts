export type ActionState<TData = undefined> = {
  status: "idle" | "success" | "error";
  message?: string;
  data?: TData;
};

export const initialActionState: ActionState = { status: "idle" };

export const successState = <TData>(payload: TData, message?: string): ActionState<TData> => ({
  status: "success",
  message,
  data: payload,
});

export const errorState = (message: string): ActionState => ({
  status: "error",
  message,
});
