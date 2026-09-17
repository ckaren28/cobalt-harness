# Cobalt — a spec-driven component harness

A PRD written as a checklist, run against deterministic gates instead of a human reading
for drift. Built for the CurbWaste Past Works Exercise, Wed Sept 23 2026.

The design direction takes Arne Jacobsen's AJ cutlery — the set that appeared in
*2001: A Space Odyssey* — as a reference point: brushed steel, tapered, no ornament, played
against what "futuristic" reads as now.

## Try it
```
npm run demo:run     # resets to a deliberately broken button, then runs the loop on it
npm run dev           # serves the landing page at localhost:4173/site/index.html
```
No dependencies. Everything here, including the dev server, is plain Node.

## What's here
```
tokens/       tokens.css + tokens.json — generated from Figma, source of truth
lib/
  color.js    WCAG contrast math, no dependencies
  loop.js     THE LOOP — reads a PRD's checklist, runs the matching gate per criterion,
              auto-fixes the one violation class that has an unambiguous mechanical
              correction (a hardcoded value that exactly matches a token), and marks
              anything else BLOCKED with a reason rather than guessing
gates/        the six deterministic checks
prds/         one markdown PRD per component, acceptance criteria as a checklist,
              each line tagged "— gate: <name>" so the loop knows what to run
fixtures/     button-good.css / button-bad.css — pristine, never mutated
demo/         working copies the loop actually edits; demo/reset.sh restores them
site/         the landing page — real components rendered from the tokens, plus an
              unedited transcript of the loop's last run
scripts/      the zero-dependency dev server
```

## How the loop decides what to do
For each unchecked PRD line, it runs that line's gate:
- **passes** → checkbox becomes `[x]`
- **fails, and it's a hardcoded value matching a real token** → fixed automatically, checkbox
  becomes `[x]` with a note on what was substituted
- **fails, anything else** → checkbox becomes `[!]`, blocked, with the gate's reason attached.
  A missing focus ring isn't something the loop can invent a correct answer for — that's a
  design decision, so it's handed back rather than guessed at.
- **gate not implemented yet** (`props-match`, `renders-clean` — they need real component code
  to introspect/mount) → checkbox becomes `[~]`, pending, not silently skipped

The PRD file itself is the audit trail. Open `demo/button-prd.md` after a run and every line
shows exactly what happened and why.

## Status (Sept 17)
- Tokens: done, 17 semantic + 11 palette variables, live in Figma and mirrored here.
- Gates: 4 of 6 implemented (`token-only`, `states-present`, `focus-visible`, `contrast`).
  `props-match` and `renders-clean` are honest stubs — see above.
- The loop: implemented and verified end to end against the broken fixture.
- Components: Button built in Figma (9 variants). Input, Badge, Table row — not yet; shown
  as an explicit "not built" placeholder on the landing page rather than faked.

## Next
Build Input, Badge, Table row in Figma → write their PRDs → implement each in React against
`prds/*.md` → wire `props-match` and `renders-clean` against real component files.
