export function controlErrorMessage(message: string) {
  return message === "Try again." ? "Can't reach DueNow — Retry." : message;
}

export function isUnreachableError(error: unknown) {
  const message = error instanceof Error ? error.message : typeof error === "string" ? error : "";
  return error instanceof TypeError || /Failed to fetch|Load failed|NetworkError|fetch failed/i.test(message);
}
