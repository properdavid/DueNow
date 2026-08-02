# Dark mode resolves in CSS, and components never know which mode they are in

Theme is stored per user as System, Light, or Dark (ADR-0006's Settings decision), and resolves entirely in CSS. An explicit choice renders as a `light` or `dark` class on the document element; System renders no class at all and is resolved by `prefers-color-scheme`. The dark token block is therefore selected two ways:

```css
.dark { … }
@media (prefers-color-scheme: dark) { :root:not(.light) { … } }
```

with a matching Tailwind v4 `@custom-variant dark` covering both conditions so utilities and tokens can never disagree.

The server can render Light and Dark without a flash because it knows the stored value. It cannot do that for System, which is both the default and the common case — the operating system's setting is not on the request. The usual fix is a blocking inline script in `<head>` that reads `matchMedia` before first paint. It works, and it was rejected: it makes theme a second source of truth held in JavaScript, and it puts a synchronous script in the critical path to answer a question CSS answers for free. A cookie holding the resolved scheme has the same duplication and is wrong on the first visit.

The consequence worth stating separately is the convention this enables: **`dark:` utilities are effectively banned.** Every colour comes from a semantic token, and the token block redefines itself per mode, so no component needs to know what mode it is in. A `dark:` in a component means someone reached past the tokens — and `design-lint` treats it as a violation. Genuine exceptions, an illustration or an opacity tweak, carry a comment.

## Consequences

**Mode is not readable from JavaScript.** Nothing in the app can branch on the current theme, because under System there is no class to inspect and the answer lives in a media query. Anything that would need to — a canvas, a third-party embed, an image swap — has to be expressed in CSS or given tokens of its own.

**The dark token values are written twice in selector terms but once in value terms.** The two selectors share one declaration block; a mismatch between them would be a silent bug, so they are declared together and never edited apart.

**Switching theme in Settings is a normal form submission**, not a client-side toggle. It writes the column and re-renders; there is no optimistic flip and no `localStorage`.
