// PROTOTYPE — throwaway. The icon spec sheet: the one screen where all three marks are
// seen together, at the sizes ADR-0029's worker actually precaches.
//
// This is not a screen of the app. It exists because an app icon is judged at 16px in a
// tab and 60px on a home screen, and every icon looks fine at 512.
import { useIdentity } from "../identity";
import A from "./IdentityA";
import B from "./IdentityB";
import C from "./IdentityC";

const PACKS = [A, B, C];

function Row({ label, children }: { label: string; children: React.ReactNode }) {
  return (
    <div className="flex items-center gap-6 border-b border-line py-4">
      <div className="w-40 shrink-0 text-[12px] leading-snug text-muted">{label}</div>
      <div className="flex flex-wrap items-end gap-8">{children}</div>
    </div>
  );
}

function Cell({ pack, children }: { pack: (typeof PACKS)[number]; children: React.ReactNode }) {
  const current = useIdentity();
  return (
    <div className="flex flex-col items-center gap-1.5">
      <div className="flex items-end gap-3">{children}</div>
      <div className={`text-[11px] ${current.key === pack.key ? "font-semibold text-primary" : "text-faint"}`}>{pack.key}</div>
    </div>
  );
}

export default function IconSheet() {
  const current = useIdentity();

  return (
    <div className="h-full overflow-y-auto bg-surface">
      <div className="mx-auto max-w-[900px] px-6 py-8">
        <p className="text-[19px] font-semibold tracking-tight">App icon sheet</p>
        <p className="mt-1 max-w-[560px] text-[13px] leading-relaxed text-muted">
          Every size ADR-0029's worker precaches, plus the two crops the platforms impose. All three are
          shown on every row on purpose — the question is never "is this nice", it is "which of these
          three is still itself at 16px".
        </p>

        <div className="mt-4 rounded-lg border border-line bg-bg p-4">
          <p className="text-[13px] font-semibold">
            {current.key} — {current.name}
          </p>
          <p className="mt-1 text-[12.5px] leading-relaxed text-muted">{current.claim}</p>
        </div>

        <div className="mt-6">
          <Row label="512 — the install splash. Shown at 160; nothing is ever wrong here.">
            {PACKS.map((p) => (
              <Cell key={p.key} pack={p}>
                <p.Icon size={160} />
              </Cell>
            ))}
          </Row>

          <Row label="192 — the Android launcher icon, at size.">
            {PACKS.map((p) => (
              <Cell key={p.key} pack={p}>
                <p.Icon size={192} />
              </Cell>
            ))}
          </Row>

          <Row label="Maskable — Android crops to the circle. Everything must clear the dashed square.">
            {PACKS.map((p) => (
              <Cell key={p.key} pack={p}>
                <p.Icon size={120} maskable />
              </Cell>
            ))}
          </Row>

          <Row label="iOS home screen — the OS rounds it for you, so the artwork must go edge to edge.">
            {PACKS.map((p) => (
              <Cell key={p.key} pack={p}>
                <div className="flex flex-col items-center gap-1">
                  <div className="overflow-hidden rounded-[22%]">
                    <p.Icon size={60} />
                  </div>
                  <span className="text-[10px] text-fg">DueNow</span>
                </div>
              </Cell>
            ))}
          </Row>

          <Row label="64 / 32 / 16 — the favicon ladder, at true size. This row decides it.">
            {PACKS.map((p) => (
              <Cell key={p.key} pack={p}>
                <p.Icon size={64} />
                <p.Icon size={32} />
                <p.Icon size={16} />
              </Cell>
            ))}
          </Row>

          <Row label="In a tab strip, which is where a favicon is actually seen.">
            {PACKS.map((p) => (
              <Cell key={p.key} pack={p}>
                <div className="flex w-[190px] items-center gap-2 rounded-t-md border border-line border-b-transparent bg-bg px-2.5 py-1.5">
                  <p.Icon size={16} />
                  <span className="truncate text-[11px] text-muted">DueNow — Due</span>
                  <span className="ml-auto text-[11px] text-faint">✕</span>
                </div>
              </Cell>
            ))}
          </Row>

          <Row label="Monochrome — the one-colour fallback (pinned tab, some launchers).">
            {PACKS.map((p) => (
              <Cell key={p.key} pack={p}>
                <p.Icon size={44} mono />
                <p.Icon size={16} mono />
              </Cell>
            ))}
          </Row>

          <Row label="On a dark home screen, beside neighbours it has to hold its own against.">
            {PACKS.map((p) => (
              <Cell key={p.key} pack={p}>
                <div className="flex items-center gap-2 rounded-lg bg-[hsl(240_6%_12%)] p-3">
                  <div className="h-[46px] w-[46px] rounded-[22%] bg-[hsl(140_45%_45%)]" />
                  <div className="overflow-hidden rounded-[22%]">
                    <p.Icon size={46} />
                  </div>
                  <div className="h-[46px] w-[46px] rounded-[22%] bg-[hsl(0_0%_96%)]" />
                </div>
              </Cell>
            ))}
          </Row>

          <Row label="The wordmark, and whether anything travels beside it.">
            {PACKS.map((p) => (
              <Cell key={p.key} pack={p}>
                <div className="flex flex-col items-start gap-3 rounded-lg border border-line bg-bg px-4 py-3">
                  <p.SignInLockup />
                  <div className="w-52 rounded border border-line bg-surface">{p.SidebarLockup()}</div>
                </div>
              </Cell>
            ))}
          </Row>

          <Row label="The card mark, on the two surfaces whose empty states mean opposite things.">
            {PACKS.map((p) => (
              <Cell key={p.key} pack={p}>
                <div className="flex gap-3">
                  {(["tree-first-run", "tree-settled", "due-clear", "unselected"] as const).map((s) => (
                    <div key={s} className="w-[92px] rounded-lg border border-line bg-bg px-2 py-3 text-center">
                      <p.CardMark surface={s} />
                      <span className="text-[10px] text-faint">{s}</span>
                    </div>
                  ))}
                </div>
              </Cell>
            ))}
          </Row>
        </div>

        <p className="py-8 text-[12px] text-faint">
          Nothing here is exported artwork — the icons are SVG drawn in React, and the letters are live
          system type rather than outlines. A real icon set would outline them and ship PNGs.
        </p>
      </div>
    </div>
  );
}
