# Long-form fields are fenced, and avatars are initials

The two field constraints v1 left unstated, and the one place an image could have entered the app.

## Two kinds of limit, and only one of them is visible

Summary's 200 characters is an **editorial** cap: it exists so summaries stay scannable in the Work Items Tree, the Due Card and the Results Table. It belongs in front of the person writing — `maxLength` on the input, typing stops dead — and it is fine that they feel it.

Description and Comment get **fences** instead. Both cap at **20,000 characters**, measured on the trimmed string, and neither the textarea nor the UI mentions it. Enforcement is server-side only, in the ADR-0022 resource route, surfacing as an `{ ok: false, error }` naming the actual count and the actual limit — *"Description is too long (24,310 characters, limit 20,000)"* — under the ✓/✕ that ADR-0019 already puts beneath both fields.

The visible treatments were both rejected, for opposite reasons. A **character counter** announces a budget, and a budget changes what people write: someone would trim a list of paint codes to stay under a number that has nothing to do with them. A **`maxLength` attribute** is worse, because it silently truncates a paste — the accident becomes *lost text* rather than *rejected text*, and v1 has no undo and no history (ADR-0007) to recover it from. A fence should be mute until it fires, and then say plainly that it is plumbing.

**No cap at all** was the real alternative, and it is defensible: two trusted people, one self-hosted instance, nobody attacking anyone. It loses on the one realistic accident. DueNow has no attachments and no image support, so the only large text box in the app is where an over-large paste lands, and the cost surfaces on ADR-0013's keyword index and on a Detail View that never ends — neither of which anyone would trace back to a paste. A limit that fires roughly never is cheap; its absence is cheap only until it is not.

**One number, not two.** Splitting Description and Comment — say 20,000 and 5,000 — sounds right and is not: a Comment is where the reply from the plumber gets pasted, and there is no structural reason it should be a quarter of a Description. One number is one thing to look up and one fewer place for two rules to drift.

**Empty is asymmetric.** A Description that trims to empty stores as empty; that is the normal state of most work items. A Comment that trims to empty is rejected, on the same reasoning that makes ADR-0019's ✓ refuse an empty Summary — a blank comment is not a thing.

**A Label's name is editorial**, so it takes Summary's treatment rather than this one: trimmed, non-empty, **30 characters**, `maxLength` on the input. A Label is a vocabulary word or two, not a sentence — that is what Summary is for — and it renders as a chip on the Detail View and as an entry in the Filter Bar's `labels` dropdown, both of which want one line. The name is **trimmed before** the case-insensitive uniqueness check, so `" Groceries "` and `"groceries"` collide as they should.

## The avatar is an initial, and there is no picture

The **Avatar** is a coloured disc carrying one uppercased character. **No photograph is stored, fetched or displayed anywhere in DueNow.** The `picture` claim from Google is discarded at sign-in; `users` carries `email`, `name` and `theme` and no `avatarUrl`.

This resolves a contradiction rather than introducing one. ADR-0019 defines the atom as *"a solid indigo disc with a knocked-out initial"* for the current user against *"the soft fill"* for their partner, and justifies the inversion with *"the initial is doing the identifying either way"* — that atom was **already initials-based**. The v1 spec's Settings user story, which says the member list shows *"name, email and avatar from Google"*, is **superseded**: the member list shows name, email and the same initials Avatar every other surface shows.

Hot-linking Google's picture URL was rejected on three counts, in order of weight:

1. **It costs the decision ADR-0019 actually made.** The inversion is *fill*, which is why it survives at 20px in a tree row and costs nothing to a colourblind reader. A photograph has no fill to invert and no initial to knock out, so the inversion would have to become a ring — a hairline at that size, spending the app's only identity colour on a decoration around the photo instead of on the photo's job.
2. **The crowd is two.** A photograph disambiguates a face out of a crowd. Here there are exactly two people, one of whom is you and already rendered inverted. One letter does the whole job.
3. **The mechanics are worse than they look.** `lh3.googleusercontent.com` URLs rotate, so the initials fallback has to exist regardless — meaning both paths get built. Putting a Google request inside every list render of a self-hosted household app is its own cost. Storing the bytes instead means a fetch on sign-in, a content-type check, a size bound, a serving route and cache headers: a small image pipeline in an app that otherwise handles no images at all, for a 24px disc.

Confining the photograph to the Settings member list only was rejected on the same first point one layer down — it puts two Avatar treatments in one app, and the one appearing two hundred times a day is the lesser of them.

**One character, derived, never stored.** The first grapheme of the trimmed `name`, uppercased, computed wherever it is drawn. Two initials would want roughly 1.6× the width on every row for a second letter that carries no information in a household of two. An `initial` column would be a denormalisation whose only job is to go stale. The fallback chain is `name` → the first character of the email's local part; Google's `name` claim is effectively always present, so this fires roughly never, but an empty disc is unattributable and a row carries no other identity.

**`name` and `email` refresh from the claims on every sign-in**, last-write-wins. Cheap now that a name is all that is kept, and it stops the Settings member list rotting when someone changes their Google name.

**Same-initial collisions are accepted, not solved.** *David* and *Daniel* both render `D`. ADR-0019's inversion still separates them on every surface including Settings, deterministically, at every size, for every reader. Widening every row in the app to break a tie that fill already breaks would be paying everywhere for a case that is already handled.

**Unassigned** keeps ADR-0018's dashed disc and carries no character at all — it is a first-class state, not a person without a name.
