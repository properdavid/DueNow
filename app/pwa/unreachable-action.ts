import { isUnreachableError } from "./unreachable";

export async function clientAction({ serverAction }: { serverAction: () => Promise<unknown> }) {
  try {
    return await serverAction();
  } catch (error) {
    if (isUnreachableError(error)) {
      return { ok: false as const, error: { message: "Try again." } };
    }
    throw error;
  }
}
