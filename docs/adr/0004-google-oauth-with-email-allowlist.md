# Google OAuth with an email allowlist, and no registration

Sign-in is Google OAuth only, via `arctic`, gated by an email allowlist held in configuration. There is no registration page, no invitations, no passwords, and no account management UI. A user record is created lazily on first successful sign-in, so that assignees have something to point at.

The alternative — any self-service sign-up flow — exists to let strangers in, which is precisely what a single-household instance must not do (see ADR-0001). With a fixed pair of known people, an allowlist is both the access model and the entire user administration story, and delegating credentials to Google means no password handling of any kind.

## Consequences

Adding a person means editing configuration and redeploying, not clicking a button — acceptable at two users, and the thing to revisit if that ever stops being true. Everyone who can sign in is a peer with full access; there are no roles. Google is a hard dependency of signing in at all.
