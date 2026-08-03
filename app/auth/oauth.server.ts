import { decodeIdToken, generateCodeVerifier, generateState, Google } from "arctic";

import { serializeCookie, readCookie, type GoogleIdentityClaims } from "./session.server";

const OAUTH_STATE_COOKIE = "oauth_state";
const OAUTH_PKCE_COOKIE = "oauth_pkce";
const OAUTH_MAX_AGE_SECONDS = 60 * 10;

export interface GoogleOAuthConfig {
  clientId: string;
  clientSecret: string;
  redirectUri: string;
}

export function googleOAuthConfig(env = process.env): GoogleOAuthConfig {
  const clientId = env.GOOGLE_CLIENT_ID;
  const clientSecret = env.GOOGLE_CLIENT_SECRET;
  const redirectUri = env.GOOGLE_REDIRECT_URI;
  if (!clientId || !clientSecret || !redirectUri) {
    throw new Response("Google sign-in is not configured.", { status: 500 });
  }
  return { clientId, clientSecret, redirectUri };
}

export function createGoogleOAuthStart(env = process.env) {
  const state = generateState();
  const codeVerifier = generateCodeVerifier();
  const google = new Google(...Object.values(googleOAuthConfig(env)) as [string, string, string]);
  const url = google.createAuthorizationURL(state, codeVerifier, ["openid", "email", "profile"]);
  const cookies = [
    oauthCookie(OAUTH_STATE_COOKIE, state, env),
    oauthCookie(OAUTH_PKCE_COOKIE, codeVerifier, env),
  ];
  return { url, cookies };
}

export async function validateGoogleCallback(request: Request, env = process.env): Promise<GoogleIdentityClaims> {
  const url = new URL(request.url);
  const state = url.searchParams.get("state");
  const code = url.searchParams.get("code");
  const storedState = readCookie(request.headers.get("Cookie"), OAUTH_STATE_COOKIE);
  const codeVerifier = readCookie(request.headers.get("Cookie"), OAUTH_PKCE_COOKIE);

  if (!state || !code || !storedState || !codeVerifier || state !== storedState) {
    throw new Response("Google sign-in could not be verified.", { status: 400 });
  }

  const google = new Google(...Object.values(googleOAuthConfig(env)) as [string, string, string]);
  const tokens = await google.validateAuthorizationCode(code, codeVerifier);
  const claims = decodeIdToken(tokens.idToken()) as Record<string, unknown>;
  const email = typeof claims.email === "string" ? claims.email : "";
  const name = typeof claims.name === "string" ? claims.name : "";
  const subject = typeof claims.sub === "string" ? claims.sub : "";

  if (!email || !subject) {
    throw new Response("Google did not return the account identity DueNow needs.", { status: 400 });
  }

  return { email, name, subject };
}

export function expiredOAuthCookies(env = process.env) {
  return [expiredOAuthCookie(OAUTH_STATE_COOKIE, env), expiredOAuthCookie(OAUTH_PKCE_COOKIE, env)];
}

function oauthCookie(name: string, value: string, env: Record<string, string | undefined>) {
  return serializeCookie(name, value, {
    httpOnly: true,
    maxAge: OAUTH_MAX_AGE_SECONDS,
    path: "/",
    sameSite: "Lax",
    secure: env.NODE_ENV === "production",
  });
}

function expiredOAuthCookie(name: string, env: Record<string, string | undefined>) {
  return serializeCookie(name, "", {
    httpOnly: true,
    maxAge: 0,
    path: "/",
    sameSite: "Lax",
    secure: env.NODE_ENV === "production",
  });
}
